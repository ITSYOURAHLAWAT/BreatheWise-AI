/**
 * @file route.ts
 * @description Next.js App Router API Route handler for POST /api/generate-plan.
 *
 * Implements strict backend guardrails:
 * 1. Safe parsing of incoming payload via Zod `UserProfileSchema.safeParse`.
 * 2. Strict 400 Bad Request error response if validation fails or body is malformed,
 *    returning detailed Zod error breakdown.
 * 3. Enclosed in a strict try/catch/finally block with `withTimeout<T>` protection
 *    using `AbortController` (15000ms threshold) to prevent hanging requests.
 * 4. Zero `any` types throughout with full JSDoc documentation.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { UserProfileSchema } from '@/lib/schemas';
import { generateAirQualityPlan, generateDeterministicFallbackPlan } from '@/lib/gemini';
import { fetchEnvironmentalSnapshot } from '@/lib/environmental-service';
import { analyze24HourVentilation } from '@/lib/ventilation-engine';
import { getGrapRegulation } from '@/lib/grap-regulations';
import { getEmergencyDirectory } from '@/lib/emergency-directory';
import type { AiResponse } from '@/lib/types';

/** Maximum duration for Vercel serverless functions in seconds. */
export const maxDuration = 60;

/** Standard HTTP headers for JSON responses preventing caching of sensitive plans. */
const RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
} as const;

/**
 * Strict timeout duration for external AI generation (10 seconds).
 * Ensures serverless execution returns well before Vercel's execution threshold.
 */
const API_TIMEOUT_MS = 10000;

/**
 * Shape of standard error payload returned by `/api/generate-plan`.
 */
interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Executes an asynchronous task with a strict timeout using `AbortController`.
 * If the promise does not resolve within `timeoutMs`, the controller aborts and rejects
 * with a descriptive Timeout Error via `Promise.race`.
 *
 * @template T - The resolved value type of the operation.
 * @param operation - A callback receiving the `AbortSignal` and returning a Promise.
 * @param timeoutMs - Maximum execution window in milliseconds before aborting.
 * @returns The resolved result of type `T`.
 * @throws {Error} If execution exceeds `timeoutMs` or the underlying operation rejects.
 */
async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Operation timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(controller.signal), timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Handles POST requests to generate a personalized AI air quality survival plan.
 *
 * Validates request payload against `UserProfileSchema` and dispatches generation
 * through the server-side integration wrapped in `withTimeout`.
 *
 * @param request - Incoming `NextRequest` with JSON payload matching `UserProfile`.
 * @returns `NextResponse<AiResponse | ApiErrorResponse>` with corresponding HTTP status code.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AiResponse | ApiErrorResponse>> {
  let requestBody: unknown;

  // 1. Guardrail: Safe JSON payload extraction
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: 'Malformed JSON payload in request body.',
      },
      {
        status: 400,
        headers: RESPONSE_HEADERS,
      }
    );
  }

  // 2. Guardrail: Strict Zod validation
  const validationResult = UserProfileSchema.safeParse(requestBody);

  if (!validationResult.success) {
    const flattenedErrors = validationResult.error.flatten();
    return NextResponse.json(
      {
        error: 'Validation failed: Invalid user profile parameters.',
        details: {
          fieldErrors: flattenedErrors.fieldErrors,
          formErrors: flattenedErrors.formErrors,
        },
      },
      {
        status: 400,
        headers: RESPONSE_HEADERS,
      }
    );
  }

  // 3. Execution Guardrail: Resilient Generation with Multi-Tier Fallback & Timeout Protection
  let plan: AiResponse | null = null;
  let environmentalSnapshot: Awaited<ReturnType<typeof fetchEnvironmentalSnapshot>> | undefined;
  let ventilationAnalysis: ReturnType<typeof analyze24HourVentilation> | undefined;

  try {
    try {
      environmentalSnapshot = await fetchEnvironmentalSnapshot(validationResult.data.city);
      ventilationAnalysis = analyze24HourVentilation(environmentalSnapshot.hourlyForecast);
    } catch (envErr) {
      console.warn('[API /api/generate-plan] Environmental service snapshot unavailable, continuing:', envErr);
    }

    try {
      plan = await withTimeout<AiResponse>(
        (signal) =>
          generateAirQualityPlan(
            validationResult.data,
            signal,
            environmentalSnapshot,
            ventilationAnalysis
          ),
        API_TIMEOUT_MS
      );
    } catch (llmErr) {
      console.warn(
        '[API /api/generate-plan] LLM generation exceeded timeout or threw error; deploying deterministic fallback plan:',
        llmErr
      );
      plan = generateDeterministicFallbackPlan(
        validationResult.data,
        environmentalSnapshot,
        ventilationAnalysis
      );
    }

    if (!plan) {
      plan = generateDeterministicFallbackPlan(
        validationResult.data,
        environmentalSnapshot,
        ventilationAnalysis
      );
    }

    if (environmentalSnapshot) {
      plan.environmentalData = environmentalSnapshot as unknown as Record<string, unknown>;
      if (environmentalSnapshot.cpcbResult.prominentPollutant) {
        plan.prominentPollutant = environmentalSnapshot.cpcbResult.prominentPollutant;
      }
    }

    if (ventilationAnalysis) {
      // Synchronize safe ventilation window with authoritative scientific calculation
      plan.safeVentilationWindow = {
        timeWindow: ventilationAnalysis.primaryWindow.timeWindow,
        expectedAqi: ventilationAnalysis.primaryWindow.expectedAqi,
        recommendation: ventilationAnalysis.primaryWindow.recommendation,
        isSafeToVentilate: ventilationAnalysis.primaryWindow.isSafeToVentilate,
        status: ventilationAnalysis.primaryWindow.status,
        confidence: ventilationAnalysis.primaryWindow.confidence,
        scientificReasoning: ventilationAnalysis.primaryWindow.scientificReasoning,
        contiguousIntervals: ventilationAnalysis.contiguousIntervals as unknown as Array<Record<string, unknown>>,
        indoorCo2Advice: ventilationAnalysis.indoorCo2Guidance as unknown as Record<string, unknown>,
      };
    }

    // Synchronize CAQM GRAP regulation with current calculated AQI
    plan.grapRegulation = getGrapRegulation(plan.aqiValue) as unknown as Record<string, unknown>;
    // Synchronize emergency hospital directory matched to user's location
    plan.emergencyDirectory = getEmergencyDirectory(validationResult.data.city) as unknown as Record<string, unknown>;
  } catch (fatalErr) {
    console.error(
      '[API /api/generate-plan] Fatal server error during generation; invoking emergency fallback plan:',
      fatalErr
    );
    plan = generateDeterministicFallbackPlan(
      validationResult.data,
      environmentalSnapshot,
      ventilationAnalysis
    );
    plan.grapRegulation = getGrapRegulation(plan.aqiValue) as unknown as Record<string, unknown>;
    plan.emergencyDirectory = getEmergencyDirectory(validationResult.data.city) as unknown as Record<string, unknown>;
  }

  // 4. Guaranteed 200 OK Response: Deliver complete CPCB-grounded survival plan
  return NextResponse.json(plan, {
    status: 200,
    headers: RESPONSE_HEADERS,
  });
}
