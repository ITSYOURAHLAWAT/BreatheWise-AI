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
import { UserProfileSchema, type UserProfile } from '@/lib/schemas';
import { generateAirQualityPlan, generateDeterministicFallbackPlan } from '@/lib/gemini';
import { fetchEnvironmentalSnapshot, type EnvironmentalSnapshot } from '@/lib/environmental-service';
import { analyze24HourVentilation, type FullVentilationAnalysis } from '@/lib/ventilation-engine';
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
 * Safely parses and validates the incoming JSON request against `UserProfileSchema`.
 *
 * @param request - Next.js App Router request.
 * @returns Result object with validated profile or ready-to-return 400 error response.
 */
async function parseAndValidateProfileRequest(
  request: NextRequest
): Promise<
  | { success: true; profile: UserProfile }
  | { success: false; response: NextResponse<ApiErrorResponse> }
> {
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Malformed JSON payload in request body.' },
        { status: 400, headers: RESPONSE_HEADERS }
      ),
    };
  }

  const validationResult = UserProfileSchema.safeParse(requestBody);
  if (!validationResult.success) {
    const flattenedErrors = validationResult.error.flatten();
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Validation failed: Invalid user profile parameters.',
          details: {
            fieldErrors: flattenedErrors.fieldErrors,
            formErrors: flattenedErrors.formErrors,
          },
        },
        { status: 400, headers: RESPONSE_HEADERS }
      ),
    };
  }

  return { success: true, profile: validationResult.data };
}

/**
 * Fetches authoritative environmental snapshot and computes ventilation dispersion analysis.
 * Gracefully returns undefined telemetry if external services fail or time out.
 *
 * @param city - User input city or micro-location.
 * @returns Environmental snapshot and ventilation analysis.
 */
async function fetchTelemetry(city: string): Promise<{
  snapshot?: EnvironmentalSnapshot;
  ventilation?: FullVentilationAnalysis;
}> {
  try {
    const snapshot = await fetchEnvironmentalSnapshot(city);
    const ventilation = analyze24HourVentilation(snapshot.hourlyForecast);
    return { snapshot, ventilation };
  } catch (err) {
    console.warn('[API /api/generate-plan] Environmental service snapshot unavailable:', err);
    return {};
  }
}

/**
 * Enriches the generated or fallback plan with environmental data, safe ventilation window,
 * CAQM GRAP regulations, and local emergency directories.
 *
 * @param basePlan - Base AI or deterministic fallback plan.
 * @param city - Target city / micro-location.
 * @param snapshot - Authoritative environmental snapshot.
 * @param ventilation - 24-hour ventilation analysis.
 * @returns Fully enriched `AiResponse`.
 */
function enrichPlan(
  basePlan: AiResponse,
  city: string,
  snapshot?: EnvironmentalSnapshot,
  ventilation?: FullVentilationAnalysis
): AiResponse {
  const plan = { ...basePlan };

  if (snapshot) {
    plan.environmentalData = snapshot;
    if (snapshot.cpcbResult.prominentPollutant) {
      plan.prominentPollutant = snapshot.cpcbResult.prominentPollutant;
    }
  }

  if (ventilation) {
    plan.safeVentilationWindow = {
      timeWindow: ventilation.primaryWindow.timeWindow,
      expectedAqi: ventilation.primaryWindow.expectedAqi,
      recommendation: ventilation.primaryWindow.recommendation,
      isSafeToVentilate: ventilation.primaryWindow.isSafeToVentilate,
      status: ventilation.primaryWindow.status,
      confidence: ventilation.primaryWindow.confidence,
      scientificReasoning: ventilation.primaryWindow.scientificReasoning,
      contiguousIntervals: ventilation.contiguousIntervals,
      indoorCo2Advice: ventilation.indoorCo2Guidance,
    };
  }

  plan.grapRegulation = getGrapRegulation(plan.aqiValue);
  plan.emergencyDirectory = getEmergencyDirectory(city);

  return plan;
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
  const parseResult = await parseAndValidateProfileRequest(request);
  if (!parseResult.success) {
    return parseResult.response;
  }

  const profile = parseResult.profile;
  const { snapshot, ventilation } = await fetchTelemetry(profile.city);

  let rawPlan: AiResponse | null = null;
  try {
    rawPlan = await withTimeout<AiResponse>(
      (signal) => generateAirQualityPlan(profile, signal, snapshot, ventilation),
      API_TIMEOUT_MS
    );
  } catch (err) {
    console.warn('[API /api/generate-plan] AI generation timed out or threw; using fallback:', err);
  }

  const selectedPlan = rawPlan ?? generateDeterministicFallbackPlan(profile, snapshot, ventilation);
  const enrichedPlan = enrichPlan(selectedPlan, profile.city, snapshot, ventilation);

  return NextResponse.json(enrichedPlan, {
    status: 200,
    headers: RESPONSE_HEADERS,
  });
}
