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
import { generateAirQualityPlan } from '@/lib/gemini';
import type { AiResponse } from '@/lib/types';

/** Standard HTTP headers for JSON responses preventing caching of sensitive plans. */
const RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
} as const;

/** Default API timeout duration in milliseconds (15 seconds). */
const API_TIMEOUT_MS = 15000;

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
 * with a descriptive Timeout Error.
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
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Operation timed out after ${timeoutMs}ms.`));
  }, timeoutMs);

  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timeoutId);
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

  // 3. Execution Guardrail: Strict try / catch / finally block with Timeout Protection
  let plan: AiResponse | null = null;
  let processingError: Error | null = null;
  let isTimedOut = false;

  try {
    plan = await withTimeout<AiResponse>(
      (signal) => generateAirQualityPlan(validationResult.data, signal),
      API_TIMEOUT_MS
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      processingError = err;
      if (err.message.includes('timed out') || err.name === 'AbortError') {
        isTimedOut = true;
      }
    } else {
      processingError = new Error('An unexpected server error occurred while generating the plan.');
    }
  } finally {
    if (processingError) {
      console.error(
        '[API /api/generate-plan] Execution error:',
        processingError.message
      );
    }
  }

  // 4. Return appropriate outcome based on error type
  if (processingError || !plan) {
    if (isTimedOut) {
      return NextResponse.json(
        {
          error: 'Gateway Timeout: The AI service took too long to respond. Please try again.',
        },
        {
          status: 504,
          headers: RESPONSE_HEADERS,
        }
      );
    }

    const errorMessage =
      processingError?.message ?? 'Failed to generate air quality plan.';

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
        headers: RESPONSE_HEADERS,
      }
    );
  }

  return NextResponse.json(plan, {
    status: 200,
    headers: RESPONSE_HEADERS,
  });
}
