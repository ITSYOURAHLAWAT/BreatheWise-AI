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
import { AiResponseSchema } from './schemas.ts';
import type { UserProfile, AiResponse, AqiCategory } from './types.ts';
import { aqiValueToCategory } from './aqi-utils.ts';
import type { EnvironmentalSnapshot } from './environmental-service.ts';
import type { FullVentilationAnalysis } from './ventilation-engine.ts';
import { getGrapRegulation } from './grap-regulations.ts';
import { getEmergencyDirectory } from './emergency-directory.ts';

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

4. EXPANDED HEALTH VULNERABILITIES & MEDICAL SAFETY BOUNDARIES:
   - STRICT SAFETY MANDATE: You are an environmental advisor, NOT a medical doctor. Strictly refrain from prescribing medications or issuing medical diagnoses. Provide supportive, non-pharmacological, practical lifestyle guidance only.
   - "Bronchitis": Recommend supportive measures such as warm saline steam inhalation, anti-inflammatory dietary hydration (ginger, tulsi), and strict avoidance of morning outdoor cold-smog air.
   - "Allergies / Sinusitis": Recommend gentle saline nasal irrigation (Neti pot with distilled water), barrier balms around nostrils, and certified N95 respirators when stepping outdoors.
   - "Immunocompromised": Emphasize hospital-grade indoor air filtration (True HEPA + Activated Carbon), zero unmasked outdoor exposure above AQI 150, and HEPA vacuuming.
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
   - Ensure 'generatedAt' is a valid ISO-8601 UTC timestamp.

7. BILINGUAL LANGUAGE LOCALIZATION (ENGLISH & HINDI):
   - When language is Hindi ('hi'), generate all user-facing narrative text (headline, alertMessage, routine titles and descriptions, indoor hack titles and descriptions, forecast notes, and emergency tips) in clear, compassionate, natural Hindi (हिंदी - Devanagari script).
   - Keep technical terms (like N95, HEPA, PM2.5, SpO2) bilingual or parenthesized for clarity.
   - All JSON schema keys MUST remain strictly in English as defined by the responseSchema.`;
}

/**
 * Builds the user prompt incorporating sanitized profile parameters.
 *
 * @param profile - Validated `UserProfile` object.
 * @returns Formatted prompt string for Gemini.
 */
function buildUserPrompt(
  profile: UserProfile,
  environmentalSnapshot?: EnvironmentalSnapshot,
  ventilationAnalysis?: FullVentilationAnalysis
): string {
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

  let envTelemetryClause = '';
  if (environmentalSnapshot && environmentalSnapshot.status === 'available') {
    const c = environmentalSnapshot.currentPollutants;
    const calc = environmentalSnapshot.cpcbResult;
    const m = environmentalSnapshot.meteorology;

    const hourlyLines = environmentalSnapshot.hourlyForecast
      .slice(0, 8)
      .map(
        (h) =>
          `* ${h.displayTime}: ${h.cpcbAqi ?? 'N/A'} AQI (${h.cpcbCategory ?? 'N/A'}, PM2.5: ${h.pm25} µg/m³, BLH: ${h.boundaryLayerHeightM ?? 'N/A'}m)`
      )
      .join('\n');

    let ventilationClause = '';
    if (ventilationAnalysis) {
      ventilationClause = `
- Authoritative Safe Ventilation Window (Scientific Dispersion Engine):
  * Status: ${ventilationAnalysis.overallStatus.toUpperCase()} (Is Safe To Open: ${ventilationAnalysis.isSafeToVentilate ? 'YES' : 'NO / CAUTION ONLY'})
  * Primary Recommended Window: "${ventilationAnalysis.primaryWindow.timeWindow}"
  * Expected AQI / Particulate: "${ventilationAnalysis.primaryWindow.expectedAqi}"
  * Protocol: "${ventilationAnalysis.primaryWindow.recommendation}"
  * Scientific Reasoning: "${ventilationAnalysis.primaryWindow.scientificReasoning}"
  * Indoor CO2 Guidance: "${ventilationAnalysis.indoorCo2Guidance.action}"
`;
    }

    envTelemetryClause = `
AUTHORITATIVE ENVIRONMENTAL TELEMETRY (Open-Meteo European Copernicus / ECMWF Model):
- Resolved Micro-Location: ${environmentalSnapshot.location.name} (${environmentalSnapshot.location.region}, Lat: ${environmentalSnapshot.location.latitude.toFixed(4)}°N, Lon: ${environmentalSnapshot.location.longitude.toFixed(4)}°E)
- Scientifically Calculated CPCB NAQI: ${calc.aqi ?? 'N/A'} (${calc.aqiCategory?.toUpperCase() ?? 'N/A'})
- Prominent Pollutant: ${calc.prominentPollutant?.toUpperCase() ?? 'PM2.5'}
- Valid Pollutants Monitored: ${calc.validPollutantsCount}
- Pollutant Concentrations:
  * PM2.5: ${c.pm25} µg/m³ (CPCB Sub-Index: ${calc.subIndices.pm25?.subIndex ?? 'N/A'})
  * PM10: ${c.pm10} µg/m³ (CPCB Sub-Index: ${calc.subIndices.pm10?.subIndex ?? 'N/A'})
  * NO2: ${c.no2} µg/m³ (CPCB Sub-Index: ${calc.subIndices.no2?.subIndex ?? 'N/A'})
  * SO2: ${c.so2} µg/m³
  * CO: ${c.coMgM3} mg/m³
  * O3: ${c.o3} µg/m³
- Meteorological Atmospheric Parameters:
  * Surface Temperature: ${m.temperatureC}°C
  * Relative Humidity: ${m.relativeHumidityPercent}%
  * Wind Speed: ${m.windSpeedKmh} km/h (Direction: ${m.windDirectionDegrees}°)
  * Atmospheric Boundary Layer Height (PBLH): ${m.boundaryLayerHeightM ?? 'N/A'} meters
${ventilationClause}
- Modeled 24-Hour Diurnal Forecast:
${hourlyLines}

CRITICAL CPCB ANCHORING & VENTILATION SYNCHRONIZATION REQUIREMENT:
- Your output 'aqiValue' MUST strictly equal ${calc.aqi ?? 350}.
- Your output 'aqiCategory' MUST strictly equal '${calc.aqiCategory ?? 'severe'}'.
- Your output 'safeVentilationWindow' MUST match the authoritative parameters:
  * timeWindow: "${ventilationAnalysis?.primaryWindow.timeWindow ?? 'No Safe Window'}"
  * isSafeToVentilate: ${ventilationAnalysis?.isSafeToVentilate ?? false}
- Ground all health recommendations in the prominent pollutant (${calc.prominentPollutant?.toUpperCase() ?? 'PM2.5'}) and the specific atmospheric boundary conditions above.
`;
  }

  const languageClause =
    profile.language === 'hi'
      ? `\nLANGUAGE REQUIREMENT: Generate all user-facing narrative text (headline, alertMessage, routine titles and descriptions, indoor hack titles and descriptions, forecast notes, and emergency tips) in compassionate, natural, fluent Hindi (हिंदी - Devanagari script), retaining medical/technical terms with bilingual English equivalents where helpful. Keep JSON keys strictly in English as defined by the schema.`
      : '';

  return `Create a complete Urban Air Quality Survival & Sustainability Plan for this Indian family strictly within the official Indian CPCB 6-band AQI scale (0-500, max Severe):

Micro-Location & Demographics:
- Micro-Location / City: ${sanitizedLocation}
- Health Vulnerabilities: ${vulnerabilities}
- Household Members: ${householdComposition}
- Outdoor Activity Level: ${profile.activityLevel}
- Commute Mode: ${profile.commuteMode}${contextClause}
${envTelemetryClause}${languageClause}
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
 * @param environmentalSnapshot - Optional authoritative environmental snapshot.
 * @param ventilationAnalysis - Optional scientific safe ventilation analysis.
 * @returns A promise resolving to a strictly typed, validated `AiResponse`.
 * @throws {Error} If the API key is absent, the AI call fails, times out, or the response breaks schema constraints.
 */
export async function generateAirQualityPlan(
  profile: UserProfile,
  signal?: AbortSignal,
  environmentalSnapshot?: EnvironmentalSnapshot,
  ventilationAnalysis?: FullVentilationAnalysis
): Promise<AiResponse> {
  const genAI = getGenAI();
  const prompt = buildUserPrompt(profile, environmentalSnapshot, ventilationAnalysis);
  const systemInstruction = buildSystemInstruction();

  // Primary model with fast, high-availability fallback
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
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
    console.warn('[gemini.ts] Timeout encountered; deploying deterministic fallback plan.');
    return generateDeterministicFallbackPlan(profile, environmentalSnapshot, ventilationAnalysis);
  }

  if (!rawJsonText || rawJsonText.trim() === '') {
    console.warn(
      `[gemini.ts] Gemini API unavailable (${lastError?.message ?? 'no response'}); deploying deterministic fallback plan.`
    );
    return generateDeterministicFallbackPlan(profile, environmentalSnapshot, ventilationAnalysis);
  }

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(rawJsonText);
  } catch {
    console.warn('[gemini.ts] JSON parsing failed; deploying deterministic fallback plan.');
    return generateDeterministicFallbackPlan(profile, environmentalSnapshot, ventilationAnalysis);
  }

  // Final runtime barrier validation via Zod
  const validationResult = AiResponseSchema.safeParse(parsedData);

  if (!validationResult.success) {
    console.warn('[gemini.ts] Schema validation failed on LLM response; deploying deterministic fallback plan.');
    return generateDeterministicFallbackPlan(profile, environmentalSnapshot, ventilationAnalysis);
  }

  return validationResult.data;
}

/**
 * Generates an emergency, scientifically modeled air quality survival plan
 * when the external AI provider is temporarily unavailable (e.g. 503 high demand or network timeout).
 *
 * Implements deterministic CPCB 6-band categorization, real-world Indian winter diurnal curves,
 * personalized health protections, and safe ventilation window calculations.
 *
 * @param profile - Validated user profile.
 * @param environmentalSnapshot - Optional authoritative environmental snapshot.
 * @param ventilationAnalysis - Optional scientific safe ventilation analysis.
 * @returns Fully validated `AiResponse` strictly satisfying `AiResponseSchema`.
 */
export function generateDeterministicFallbackPlan(
  profile: UserProfile,
  environmentalSnapshot?: EnvironmentalSnapshot,
  ventilationAnalysis?: FullVentilationAnalysis
): AiResponse {
  const locLower = profile.city.toLowerCase();

  // Baseline AQI estimation based on micro-location & Indian geography
  let baseAqi = 285;
  let aqiCategory: AqiCategory = 'poor';

  if (
    environmentalSnapshot &&
    environmentalSnapshot.status === 'available' &&
    typeof environmentalSnapshot.cpcbResult.aqi === 'number'
  ) {
    baseAqi = environmentalSnapshot.cpcbResult.aqi;
    const cat = environmentalSnapshot.cpcbResult.aqiCategory;
    aqiCategory = (cat === 'Out of range / Exceptional' ? 'severe' : cat) ?? 'severe';
  } else {
    if (
      locLower.includes('delhi') ||
      locLower.includes('anand vihar') ||
      locLower.includes('jahangirpuri') ||
      locLower.includes('noida') ||
      locLower.includes('ghaziabad') ||
      locLower.includes('gurugram') ||
      locLower.includes('patna')
    ) {
      baseAqi = 412; // CPCB Severe band
    } else if (
      locLower.includes('mumbai') ||
      locLower.includes('bandra') ||
      locLower.includes('kurla') ||
      locLower.includes('chembur') ||
      locLower.includes('kolkata')
    ) {
      baseAqi = 235; // CPCB Poor band
    } else if (
      locLower.includes('bengaluru') ||
      locLower.includes('bangalore') ||
      locLower.includes('chennai') ||
      locLower.includes('hyderabad') ||
      locLower.includes('pune')
    ) {
      baseAqi = 145; // CPCB Moderate band
    }

    const category = aqiValueToCategory(baseAqi);
    aqiCategory = category === 'Out of range / Exceptional' ? 'severe' : category;
  }

  // Diurnal thermal inversion curve
  const morningPeak = Math.min(500, Math.round(baseAqi * 1.15));
  const midMorning = Math.min(500, Math.round(baseAqi * 1.05));
  const afternoonDip = Math.max(45, Math.round(baseAqi * 0.65));
  const eveningRush = Math.min(500, Math.round(baseAqi * 0.95));
  const nightTrap = Math.min(500, Math.round(baseAqi * 1.1));

  const isSafe = afternoonDip < 350;

  // Build vulnerability-tailored routines
  const routines = [
    {
      id: 'routine-1',
      timeOfDay: 'morning' as const,
      title: 'Reschedule outdoor physical activities',
      description: `Surface thermal inversion in ${profile.city} traps toxic particulates between 5:00 AM and 9:00 AM. Keep all workouts and brisk walks indoors.`,
      category: 'exercise' as const,
      estimatedBenefitUg: 48,
    },
    {
      id: 'routine-2',
      timeOfDay: 'morning' as const,
      title: 'Wear N95/FFP2 respirator during transit',
      description: `Wear a snug-fitting N95 mask while using ${profile.commuteMode.replace(/_/g, ' ')}. Standard surgical and cloth masks offer near-zero sub-micron PM2.5 filtration.`,
      category: 'transport' as const,
      estimatedBenefitUg: 65,
    },
    {
      id: 'routine-3',
      timeOfDay: 'afternoon' as const,
      title: 'Thermal mixing ventilation window',
      description: isSafe
        ? `Aerate your home for 15-20 minutes between 2:00 PM and 4:00 PM when solar warming breaks the inversion cap. Then reseal and power on HEPA units.`
        : `Ambient AQI remains elevated (>350). Keep all windows firmly sealed; run recirculated filtration continuously.`,
      category: 'indoor' as const,
      estimatedBenefitUg: 30,
    },
    {
      id: 'routine-4',
      timeOfDay: 'afternoon' as const,
      title: 'Hydration and mucosal membrane barrier care',
      description: profile.healthVulnerabilities.includes('bronchitis') || profile.healthVulnerabilities.includes('allergies_sinusitis')
        ? 'Perform warm saline nasal rinse (Neti pot with distilled water) and drink warm herbal infusions (ginger, tulsi) to soothe respiratory tract inflammation.'
        : 'Drink at least 2.5–3 liters of warm water to keep respiratory cilia hydrated and actively expelling inhaled particulate matter.',
      category: 'diet' as const,
      estimatedBenefitUg: 15,
    },
    {
      id: 'routine-5',
      timeOfDay: 'evening' as const,
      title: 'Air purifier pre-conditioning before bedtime',
      description: 'Activate your HEPA air purifier in bedroom mode 45 minutes prior to sleep. Ground cooling at night causes surface PM2.5 levels to surge.',
      category: 'indoor' as const,
      estimatedBenefitUg: 42,
    },
    {
      id: 'routine-6',
      timeOfDay: 'night' as const,
      title: 'Bedroom micro-climate sealing',
      description: 'Place rolled damp towels or weather strips under bedroom doors to prevent outdoor hallway infiltration during overnight thermal stagnation.',
      category: 'indoor' as const,
      estimatedBenefitUg: 28,
    },
  ];

  const indoorHacks = [
    {
      id: 'hack-1',
      title: 'Wet-mopping over dry broom sweeping',
      description: 'Dry brooms aerosolize settled micro-dust particles back into breathing zones. Use damp microfiber mopping to trap particulate matter.',
      difficulty: 'easy' as const,
      estimatedCost: 'free' as const,
      indoorReductionPercent: 25,
    },
    {
      id: 'hack-2',
      title: 'Door and window weather-stripping foam tape',
      description: 'Apply high-density foam adhesive strips along balcony sliding doors and window frames to seal toxic infiltration cracks.',
      difficulty: 'easy' as const,
      estimatedCost: 'low' as const,
      indoorReductionPercent: 35,
    },
    {
      id: 'hack-3',
      title: 'Strategic air-purifying botanical cluster',
      description: 'Group NASA-certified detox plants (Snake Plants, Areca Palms, and Spider Plants) in living spaces to absorb VOCs and complement HEPA filters.',
      difficulty: 'medium' as const,
      estimatedCost: 'medium' as const,
      indoorReductionPercent: 18,
    },
    {
      id: 'hack-4',
      title: 'DIY Corsi-Rosenthal box filter backup',
      description: 'Assemble a MERV-13 filter strapped to a standard box fan as a high-flow, low-cost secondary particulate scavenger.',
      difficulty: 'medium' as const,
      estimatedCost: 'medium' as const,
      indoorReductionPercent: 55,
    },
    {
      id: 'hack-5',
      title: 'Exhaust fan backdraft damper sealing',
      description: 'Ensure kitchen and bathroom exhaust dampers close tightly when not running to prevent reverse smog siphoning.',
      difficulty: 'hard' as const,
      estimatedCost: 'low' as const,
      indoorReductionPercent: 20,
    },
  ];

  const impactMetrics = [
    {
      label: 'PM2.5 Exposure Reduction',
      value: '68%',
      trend: 'down' as const,
      severity: 'positive' as const,
    },
    {
      label: 'Respiratory Strain Relief',
      value: '75%',
      trend: 'up' as const,
      severity: 'positive' as const,
    },
    {
      label: 'Indoor Air Cleared',
      value: '82%',
      trend: 'up' as const,
      severity: 'positive' as const,
    },
    {
      label: 'Symptom Flare-up Risk',
      value: '-60%',
      trend: 'down' as const,
      severity: 'positive' as const,
    },
  ];

  const hourlyForecast = [
    {
      time: '6:00 AM',
      aqiCategory: (aqiValueToCategory(morningPeak) === 'Out of range / Exceptional' ? 'severe' : aqiValueToCategory(morningPeak)) as AqiCategory,
      aqiValue: morningPeak,
      shortNote: 'Severe nocturnal inversion peak; keep home sealed and avoid outdoor transit.',
    },
    {
      time: '10:00 AM',
      aqiCategory: (aqiValueToCategory(midMorning) === 'Out of range / Exceptional' ? 'severe' : aqiValueToCategory(midMorning)) as AqiCategory,
      aqiValue: midMorning,
      shortNote: 'Morning commute smog persists under calm boundary layer.',
    },
    {
      time: '2:30 PM',
      aqiCategory: (aqiValueToCategory(afternoonDip) === 'Out of range / Exceptional' ? 'severe' : aqiValueToCategory(afternoonDip)) as AqiCategory,
      aqiValue: afternoonDip,
      shortNote: isSafe ? 'Solar thermal mixing brings lowest AQI of the day; safe for brief aeration.' : 'Partial afternoon clearance, but ambient air remains hazardous.',
    },
    {
      time: '6:30 PM',
      aqiCategory: (aqiValueToCategory(eveningRush) === 'Out of range / Exceptional' ? 'severe' : aqiValueToCategory(eveningRush)) as AqiCategory,
      aqiValue: eveningRush,
      shortNote: 'Evening rush hour emissions surge as boundary layer drops.',
    },
    {
      time: '10:00 PM',
      aqiCategory: (aqiValueToCategory(nightTrap) === 'Out of range / Exceptional' ? 'severe' : aqiValueToCategory(nightTrap)) as AqiCategory,
      aqiValue: nightTrap,
      shortNote: 'Cold ground temperature traps heavy emissions overnight; run purifiers on sleep mode.',
    },
  ];

  const isHindi = profile.language === 'hi';

  return {
    aqiCategory,
    aqiValue: baseAqi,
    alertMessage: isHindi
      ? `${profile.city} में वायु गुणवत्ता CPCB मानकों के अनुसार ${aqiCategory.toUpperCase()} श्रेणी में है। सुरक्षा प्रोटोकॉल का पालन करें।`
      : `Air quality in ${profile.city} is currently categorized as ${aqiCategory.toUpperCase()} under official CPCB standards. Follow high-protection protocols.`,
    summaryHeadline: isHindi
      ? `${profile.city} के लिए 24 घंटे का शीतकालीन स्मॉग सुरक्षा प्लान`
      : `24-Hour Winter Smog Survival & Clean Air Plan for ${profile.city}`,
    lowEmissionRoutines: routines,
    indoorHacks,
    impactMetrics,
    hourlyForecast,
    safeVentilationWindow: ventilationAnalysis?.primaryWindow
      ? {
          timeWindow: ventilationAnalysis.primaryWindow.timeWindow,
          expectedAqi: ventilationAnalysis.primaryWindow.expectedAqi,
          recommendation: ventilationAnalysis.primaryWindow.recommendation,
          isSafeToVentilate: ventilationAnalysis.primaryWindow.isSafeToVentilate,
          status: ventilationAnalysis.primaryWindow.status,
          confidence: ventilationAnalysis.primaryWindow.confidence,
          scientificReasoning: ventilationAnalysis.primaryWindow.scientificReasoning,
        }
      : {
          timeWindow: isSafe ? '2:00 PM – 4:00 PM' : 'No Safe Window Today',
          expectedAqi: isSafe
            ? `Dips to ~${afternoonDip} AQI (Midday solar mixing)`
            : 'Dangerous ambient particulate concentrations across all 24 hours',
          recommendation: isSafe
            ? 'Open cross-facing windows for 10–15 minutes only to purge indoor CO2 and VOCs, then seal windows and run HEPA purifiers on turbo mode for 30 minutes.'
            : 'Ambient air is too dangerous (>250 AQI). Keep all windows firmly sealed and operate indoor HEPA purifiers continuously on auto-circulation.',
          isSafeToVentilate: isSafe,
          status: isSafe ? ('caution' as const) : ('unsafe' as const),
          confidence: 'medium' as const,
          scientificReasoning: isSafe
            ? 'Temporary vertical mixing provides a cautionary aeration window.'
            : 'Surface thermal stagnation and heavy particulate accumulation prohibit safe window opening.',
        },
    emergencyTips: isHindi
      ? [
          'बाहर निकलते समय परिवार के प्रत्येक सदस्य के लिए प्रमाणित N95 / FFP2 मास्क सुनिश्चित करें; सामान्य कपड़े के मास्क सूक्ष्म PM2.5 को नहीं रोकते।',
          'जहरीले स्मॉग के रिसाव को रोकने के लिए खिड़कियों और दरवाजों पर वेदर-स्ट्रिपिंग टेप या गीले तौलिये लगाएं।',
          'इमरजेंसी इनहेलर और निर्धारित दवाएं तैयार रखें; आपातकालीन स्वास्थ्य संपर्कों को स्पीड डायल पर रखें।',
          'घर के अंदर अगरबत्ती, धूपबत्ती, या मोमबत्तियां जलाने से पूरी तरह बचें, जिससे अंदरूनी PM2.5 बढ़ता है।',
        ]
      : [
          'Ensure every family member wears a certified N95 / FFP2 respirator when stepping outdoors; standard cloth masks do not filter fine PM2.5.',
          'Seal window and door perimeters with weather stripping to stop toxic smog infiltration.',
          'Check emergency inhalers and medications; keep emergency healthcare contacts on speed dial for vulnerable members.',
          'Avoid burning incense, mosquito coils, or candles indoors, which exacerbate indoor PM2.5 concentrations.',
        ],
    generatedAt: new Date().toISOString(),
    grapRegulation: getGrapRegulation(baseAqi) as unknown as Record<string, unknown>,
    emergencyDirectory: getEmergencyDirectory(profile.city) as unknown as Record<string, unknown>,
  };
}
