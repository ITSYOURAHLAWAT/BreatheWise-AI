/**
 * @file gemini.ts
 * @description Server-side Gemini AI integration for BreatheWise AI.
 *
 * Implements:
 *  - Official `@google/genai` client integration using `gemini-3.5-flash-lite` with fallback to `gemini-3.5-flash`.
 *  - Strict privacy-first input sanitization (`sanitizeInput`) to strip PII before LLM calls.
 *  - Strict Structured Outputs via `responseSchema` mapped from `AiResponseSchema`.
 *  - Strict alignment with the official Indian CPCB 6-Band Scale (0–500, Severe max).
 *  - Indian winter thermal inversion simulation: smog peaks in late night / early morning,
 *    clearing slightly in afternoon (thermal mixing).
 *  - Explicit calculation of the safest 2-3 hour window for fresh-air ventilation.
 *  - Support for expanded health vulnerabilities: Bronchitis, Allergies/Sinusitis, Immunocompromised.
 *  - Runtime Zod parsing for end-to-end type safety (Zero `any`).
 *
 * This module is server-only to protect credentials and sensitive operations.
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import { AiResponseSchema } from './schemas';
import type { UserProfile, AiResponse } from './types';

// ─── Privacy & Sanitization ──────────────────────────────────────────────────

/**
 * Regex patterns for identifying common PII elements.
 * Strips email addresses, telephone numbers, and specific street-level addresses.
 */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

const PHONE_REGEX =
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;

const STREET_ADDRESS_REGEX =
  /\b\d{1,5}\s+[A-Za-z0-9\s.,#-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Apartment|Apt|Suite|Ste|Floor|Fl|Block|Sector|Pocket)\b[^\n,.]*/gi;

/**
 * Sanitizes user-provided text by stripping sensitive Personally Identifiable Information (PII)
 * such as email addresses, telephone numbers, and street-level residential addresses.
 *
 * Preserves general geographical entities (cities, micro-locations, neighborhoods) while guaranteeing user privacy
 * before prompts are transmitted to the external LLM provider.
 *
 * @param text - Raw input string from the user.
 * @returns Cleaned text with PII replaced by standardized redaction tokens.
 *
 * @example
 * ```ts
 * const cleaned = sanitizeInput("Contact user@example.com or call 9876543210 at 42 Park St.");
 * // => "Contact [REDACTED EMAIL] or call [REDACTED PHONE] at [REDACTED ADDRESS]."
 * ```
 */
export function sanitizeInput(text: string): string {
  if (!text) {
    return '';
  }

  return text
    .replace(EMAIL_REGEX, '[REDACTED EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED PHONE]')
    .replace(STREET_ADDRESS_REGEX, '[REDACTED ADDRESS]')
    .trim();
}

// ─── Structured Output Schema ────────────────────────────────────────────────

/**
 * Standard JSON schema definition passed into `@google/genai` `responseSchema`.
 * Strictly constrained to the official Indian CPCB 6-Band Scale: 0–500 (max severe).
 */
const aiResponseJsonSchema: Schema = {
  type: Type.OBJECT,
  description: 'Personalized air quality survival and sustainability plan for an urban family strictly mapped to the Indian CPCB 6-band AQI scale (0-500).',
  properties: {
    aqiCategory: {
      type: Type.STRING,
      enum: ['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe'],
      description: 'Standardized AQI category classified strictly according to the Indian CPCB 6-band scale (max is severe).',
    },
    aqiValue: {
      type: Type.INTEGER,
      description: 'Current or estimated numerical Air Quality Index value on the CPCB scale (0 to 500).',
    },
    alertMessage: {
      type: Type.STRING,
      description: 'Direct, one-sentence air quality alert or advisory for immediate awareness in this micro-location.',
    },
    summaryHeadline: {
      type: Type.STRING,
      description: 'Empathetic, clear headline summarizing the family’s customized survival and action plan.',
    },
    lowEmissionRoutines: {
      type: Type.ARRAY,
      description: 'Prioritized daily routine adjustments designed to minimize PM2.5/PM10 exposure.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: 'Unique identifier slug for this routine item.',
          },
          timeOfDay: {
            type: Type.STRING,
            enum: ['morning', 'afternoon', 'evening', 'night', 'anytime'],
            description: 'Appropriate time window to execute this routine.',
          },
          title: {
            type: Type.STRING,
            description: 'Clear, imperative headline for the recommended action.',
          },
          description: {
            type: Type.STRING,
            description: 'Scientifically accurate description explaining the why and how.',
          },
          category: {
            type: Type.STRING,
            enum: ['outdoor', 'indoor', 'diet', 'transport', 'exercise', 'children', 'health'],
            description: 'Action domain tag.',
          },
          estimatedBenefitUg: {
            type: Type.NUMBER,
            description: 'Estimated particulate exposure reduction in micrograms per cubic meter (ug/m3).',
          },
        },
        required: ['id', 'timeOfDay', 'title', 'description', 'category'],
      },
    },
    indoorHacks: {
      type: Type.ARRAY,
      description: 'Practical, cost-graded hacks to transform indoor living spaces into clean-air sanctuaries.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: 'Unique identifier slug for this indoor hack.',
          },
          title: {
            type: Type.STRING,
            description: 'Concise title of the indoor hack.',
          },
          description: {
            type: Type.STRING,
            description: 'Step-by-step implementation guide tailored to the user profile.',
          },
          difficulty: {
            type: Type.STRING,
            enum: ['easy', 'medium', 'hard'],
            description: 'Implementation difficulty level.',
          },
          estimatedCost: {
            type: Type.STRING,
            enum: ['free', 'low', 'medium', 'high'],
            description: 'Financial commitment level.',
          },
          indoorReductionPercent: {
            type: Type.NUMBER,
            description: 'Estimated percentage reduction of indoor airborne particulates (0-100).',
          },
        },
        required: ['id', 'title', 'description', 'difficulty', 'estimatedCost'],
      },
    },
    impactMetrics: {
      type: Type.ARRAY,
      description: 'Exactly 4 quantified metrics measuring the projected benefit of following this plan.',
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: 'Short human-readable label for the measured impact.',
          },
          value: {
            type: Type.STRING,
            description: 'Measured or projected quantity value (e.g., "45", "3.2").',
          },
          unit: {
            type: Type.STRING,
            description: 'Unit string (e.g., "%", "hrs/day", "ug/m3").',
          },
          trend: {
            type: Type.STRING,
            enum: ['up', 'down', 'neutral'],
            description: 'Directional indicator compared against baseline exposure.',
          },
          severity: {
            type: Type.STRING,
            enum: ['positive', 'warning', 'danger', 'info'],
            description: 'UI severity classification for color coding.',
          },
        },
        required: ['label', 'value', 'trend', 'severity'],
      },
    },
    hourlyForecast: {
      type: Type.ARRAY,
      description: '24-hour hourly AQI sequence reflecting Indian winter diurnal temperature inversions strictly on CPCB 0-500 scale.',
      items: {
        type: Type.OBJECT,
        properties: {
          time: {
            type: Type.STRING,
            description: 'Time marker, e.g. "6:00 AM", "10:00 AM", "2:30 PM", "6:00 PM", "10:00 PM".',
          },
          aqiCategory: {
            type: Type.STRING,
            enum: ['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe'],
            description: 'Forecasted CPCB severity band for this hour interval.',
          },
          aqiValue: {
            type: Type.INTEGER,
            description: 'Forecasted numerical AQI integer value (0 to 500).',
          },
          shortNote: {
            type: Type.STRING,
            description: 'Tactical guidance note for this time window.',
          },
        },
        required: ['time', 'aqiCategory', 'aqiValue', 'shortNote'],
      },
    },
    safeVentilationWindow: {
      type: Type.OBJECT,
      description: 'Explicit 2-3 hour window for safe residential fresh-air aeration.',
      properties: {
        timeWindow: {
          type: Type.STRING,
          description: 'Recommended timeframe string (e.g. "2:00 PM - 4:00 PM").',
        },
        expectedAqi: {
          type: Type.STRING,
          description: 'Expected AQI range or dip during this period (e.g. "Dips to ~220 AQI").',
        },
        recommendation: {
          type: Type.STRING,
          description: 'Clear protocol for cross-ventilation and post-ventilation air purification.',
        },
        isSafeToVentilate: {
          type: Type.BOOLEAN,
          description: 'Whether ambient air dips low enough to permit window opening safely today.',
        },
      },
      required: ['timeWindow', 'expectedAqi', 'recommendation', 'isSafeToVentilate'],
    },
    emergencyTips: {
      type: Type.ARRAY,
      description: 'High-priority emergency protocol tips for dangerous or severe smog spikes.',
      items: {
        type: Type.STRING,
      },
    },
    generatedAt: {
      type: Type.STRING,
      description: 'ISO-8601 UTC timestamp marking when the response was generated.',
    },
  },
  required: [
    'aqiCategory',
    'aqiValue',
    'alertMessage',
    'summaryHeadline',
    'lowEmissionRoutines',
    'indoorHacks',
    'impactMetrics',
    'hourlyForecast',
    'safeVentilationWindow',
    'emergencyTips',
    'generatedAt',
  ],
};

// ─── Gemini Client Factory ───────────────────────────────────────────────────

/**
 * Returns a configured `GoogleGenAI` instance using the environment API key.
 * Strictly verifies the existence of `GEMINI_API_KEY` before dispatching calls.
 *
 * @returns An initialized `GoogleGenAI` client instance.
 * @throws {Error} If `GEMINI_API_KEY` is undefined or empty.
 */
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in your .env.local file.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Builds the comprehensive system instruction that commands Gemini to function as a
 * compassionate, scientifically rigorous Urban Air Quality & Health Advisor.
 *
 * Mandates strict adherence to the Indian Central Pollution Control Board (CPCB) 6-band scale:
 * 0-50 (Good), 51-100 (Satisfactory), 101-200 (Moderate), 201-300 (Poor), 301-400 (Very Poor),
 * 401-500 (Severe). The CPCB scale strictly terminates at 500 (Severe).
 *
 * @returns System instruction string.
 */
function buildSystemInstruction(): string {
  return `You are "BreatheWise AI", an empathetic, elite Urban Air Quality & Environmental Health Advisor specializing in Indian urban micro-climates.
Your mission is to protect families from winter smog and ambient toxins strictly adhering to the official Indian Central Pollution Control Board (CPCB) standards.

Core Behavioral Mandates:
1. OFFICIAL CPCB 6-BAND SCALE ADHERENCE:
   - Use ONLY the official CPCB 6-band scale:
     * 0-50: Good
     * 51-100: Satisfactory
     * 101-200: Moderate
     * 201-300: Poor
     * 301-400: Very Poor
     * 401-500: Severe
   - The scale strictly caps at 500 (Severe). Do not use 'hazardous' or values exceeding 500.

2. INDIAN METEOROLOGY & DIURNAL THERMAL INVERSIONS:
   - Accurately simulate 24-hour hourly AQI curves across representative hours (e.g., 6:00 AM, 10:00 AM, 2:30 PM, 6:00 PM, 10:00 PM).
   - In Indian winter (November-February), smog peaks severely during night and early morning (10 PM - 8 AM) due to cold surface thermal inversions, calm winds, and trapped emissions.
   - Surface temperatures rise around midday, breaking the inversion cap and dispersing pollutants partially between 1:30 PM and 4:30 PM.
   - By 6:00 PM, ground cooling and evening rush hour cause AQI to surge back up rapidly.

3. "SAFE VENTILATION WINDOW" SPECIFICATION:
   - Identify the safest 2-3 hour window (typically 1:30 PM - 4:00 PM during maximum solar mixing) where families can briefly aerate homes (15-20 mins) without severe toxic intrusion.
   - If current AQI is in the upper severe band (AQI > 450), mark 'isSafeToVentilate' as false and instruct keeping windows sealed with HEPA purifiers running continuously.

4. EXPANDED HEALTH VULNERABILITIES:
   - "Bronchitis": Prescribe steam inhalation with saline, anti-inflammatory dietary tips (ginger, tulsi), and strict avoidance of morning outdoor cold-smog air.
   - "Allergies / Sinusitis": Prescribe nasal saline irrigation (Neti pot with distilled water), barrier balms around nostrils, and N95 masks when stepping outdoors.
   - "Immunocompromised": Mandate hospital-grade air filtration (True HEPA + Carbon), zero unmasked outdoor exposure above AQI 150, and HEPA vacuuming.
   - Heighten protections for Asthma, COPD, Cardiac conditions, Pregnant women, Infants, and Elderly.

5. HYPER-LOCAL INDIAN CONTEXT:
   - Tailor recommendations directly to the user's micro-location (e.g., Anand Vihar / Jahangirpuri in Delhi, Bandra / Kurla in Mumbai, Whitefield in Bengaluru).
   - Reference local pollution drivers (traffic bottlenecks, flyover dust, biomass burning, industrial clusters).

6. STRICT STRUCTURAL COMPLIANCE:
   - Provide realistic hourly forecasts with at least 5-6 key time markers across the 24-hour cycle (all AQI values between 0 and 500).
   - Deliver at least 6 daily routines with time-of-day mapping.
   - Deliver at least 5 indoor hacks with realistic difficulty and cost grades.
   - Deliver exactly 4 quantified impact metrics with measurable values.
   - Deliver at least 4 critical emergency tips for severe air spikes.
   - Ensure 'generatedAt' is a valid ISO-8601 UTC timestamp.`;
}

/**
 * Builds the user prompt incorporating sanitized profile parameters.
 *
 * @param profile - Validated `UserProfile` object.
 * @returns Formatted prompt string for Gemini.
 */
function buildUserPrompt(profile: UserProfile): string {
  const sanitizedLocation = sanitizeInput(profile.city);
  const sanitizedContext = profile.additionalContext
    ? sanitizeInput(profile.additionalContext)
    : '';

  const vulnerabilities = profile.healthVulnerabilities.join(', ');
  const householdComposition = [
    profile.hasChildren ? 'Includes children under 12' : null,
    profile.hasElderly ? 'Includes elderly family members (65+)' : null,
  ]
    .filter(Boolean)
    .join('; ') || 'Adult household';

  const contextClause = sanitizedContext
    ? `\nAdditional family context (sanitized):\n${sanitizedContext}`
    : '';

  return `Create a complete Urban Air Quality Survival & Sustainability Plan for this Indian family strictly within the official Indian CPCB 6-band AQI scale (0-500, max Severe):

Micro-Location & Demographics:
- Micro-Location / City: ${sanitizedLocation}
- Health Vulnerabilities: ${vulnerabilities}
- Household Members: ${householdComposition}
- Outdoor Activity Level: ${profile.activityLevel}
- Commute Mode: ${profile.commuteMode}${contextClause}

Generate a hyper-localized, 24-hour actionable plan following the structured output schema. Include the hourly diurnal AQI curve (0-500) and the Safe Ventilation Window for fresh air.`;
}

// ─── Primary API Method ──────────────────────────────────────────────────────

/**
 * Generates an end-to-end validated air quality survival and sustainability plan.
 *
 * Coordinates:
 * 1. PII input sanitization.
 * 2. Invocation of Gemini with automatic fallback across optimized models for high availability.
 * 3. Strict runtime Zod schema parsing to guarantee complete type safety on the CPCB 6-band scale.
 *
 * @param profile - The validated user profile received from the client.
 * @param signal - Optional AbortSignal for timeout and cancellation propagation.
 * @returns A promise resolving to a strictly typed, validated `AiResponse`.
 * @throws {Error} If the API key is absent, the AI call fails, times out, or the response breaks schema constraints.
 */
export async function generateAirQualityPlan(
  profile: UserProfile,
  signal?: AbortSignal
): Promise<AiResponse> {
  const genAI = getGenAI();
  const prompt = buildUserPrompt(profile);
  const systemInstruction = buildSystemInstruction();

  // Primary model with fast, high-availability fallback
  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
  let rawJsonText = '';
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    if (signal?.aborted) {
      throw new Error('Operation aborted due to timeout.');
    }

    try {
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: aiResponseJsonSchema,
          temperature: 0.6,
          maxOutputTokens: 4096,
        },
      });

      if (response.text && response.text.trim() !== '') {
        rawJsonText = response.text;
        break;
      }
    } catch (err) {
      if (signal?.aborted) {
        throw new Error('Operation aborted due to timeout.');
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[gemini.ts] Attempt with model ${model} failed, trying next candidate:`, lastError.message);
    }
  }

  if (signal?.aborted) {
    throw new Error('Operation aborted due to timeout.');
  }

  if (!rawJsonText || rawJsonText.trim() === '') {
    const errorMsg = lastError?.message ?? 'Gemini API returned an empty response.';
    throw new Error(`Failed to generate air quality plan: ${errorMsg}`);
  }

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(rawJsonText);
  } catch (parseError) {
    const detail = parseError instanceof Error ? parseError.message : 'Unknown JSON syntax error';
    throw new Error(`Failed to parse AI response as valid JSON: ${detail}`);
  }

  // Final runtime barrier validation via Zod
  const validationResult = AiResponseSchema.safeParse(parsedData);

  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues
      .map((issue) => `[${issue.path.join('.') || 'root'}]: ${issue.message}`)
      .join(' | ');
    throw new Error(`AI response failed structural schema validation: ${errorDetails}`);
  }

  return validationResult.data;
}
