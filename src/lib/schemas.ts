/**
 * @file schemas.ts
 * @description Zod validation schemas for all BreatheWise AI data models.
 *
 * Two primary schemas:
 *  1. `UserProfileSchema` — validates user-submitted location + lifestyle form data.
 *  2. `AiResponseSchema`  — validates the structured JSON returned by the Gemini API.
 *
 * All schemas are strictly aligned with the official Indian CPCB 6-band scale (0–500).
 */

import { z } from 'zod';
import { CPCB_MIN_AQI, CPCB_MAX_AQI } from './cpcb-aqi.ts';
import type { GrapRegulationInfo } from './grap-regulations.ts';
import type { EmergencyDirectoryResult } from './emergency-directory.ts';
import type { EnvironmentalSnapshot } from './environmental-service.ts';
import type { ContiguousVentilationInterval, IndoorCo2Guidance } from './ventilation-engine.ts';

// ─── Enumerations ────────────────────────────────────────────────────────────

/** Recognized health vulnerability categories that affect smog risk. */
export const HealthVulnerabilityEnum = z.enum([
  'asthma',
  'copd',
  'bronchitis',
  'allergies_sinusitis',
  'immunocompromised',
  'heart_disease',
  'diabetes',
  'pregnant',
  'elderly',
  'children',
  'none',
]);

/** Activity level options for outdoor lifestyle assessment. */
export const ActivityLevelEnum = z.enum([
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
]);

/**
 * Official Indian CPCB 6-Band AQI severity categories.
 * Max valid scale threshold is 500 (Severe).
 */
export const AqiCategoryEnum = z.enum([
  'good',
  'satisfactory',
  'moderate',
  'poor',
  'very_poor',
  'severe',
]);

// ─── User Profile Schema ──────────────────────────────────────────────────────

/**
 * `UserProfileSchema` — Validates the form data a user submits on the dashboard.
 *
 * Fields:
 * - `city`                 — Non-empty micro-location/city name, trimmed, max 100 chars.
 * - `healthVulnerabilities`— Array of health conditions; at least one required.
 * - `activityLevel`        — Self-reported outdoor activity frequency.
 * - `hasChildren`          — Whether the household includes children under 12.
 * - `hasElderly`           — Whether the household includes adults over 65.
 * - `commuteMode`          — Primary mode of daily transport.
 * - `additionalContext`    — Optional free-text for extra personalisation.
 */
export const UserProfileSchema = z.object({
  city: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters.')
    .max(100, 'Location name is too long.'),

  healthVulnerabilities: z
    .array(HealthVulnerabilityEnum)
    .min(1, 'Please select at least one option (select "none" if no conditions apply).'),

  activityLevel: ActivityLevelEnum,

  hasChildren: z.boolean(),

  hasElderly: z.boolean(),

  commuteMode: z.enum([
    'car',
    'motorcycle',
    'public_transport',
    'bicycle',
    'walking',
    'work_from_home',
  ]),

  additionalContext: z
    .string()
    .max(500, 'Additional context must be under 500 characters.')
    .optional(),

  language: z.enum(['en', 'hi']).optional(),
});

/** Inferred TypeScript type from `UserProfileSchema`. */
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ─── AI Response Schema ───────────────────────────────────────────────────────

/**
 * `ImpactMetricSchema` — A single quantified benefit metric.
 */
export const ImpactMetricSchema = z.object({
  /** Short human-readable label for the metric. */
  label: z.string().min(1),
  /** Numeric or textual value (e.g. "43", "2.1 hours"). */
  value: z.string().min(1),
  /** Optional unit string shown next to the value. */
  unit: z.string().optional(),
  /** Direction of change relative to baseline. */
  trend: z.enum(['up', 'down', 'neutral']),
  /** Colour-coded severity context for the metric. */
  severity: z.enum(['positive', 'warning', 'danger', 'info']),
});

/** Inferred TypeScript type from `ImpactMetricSchema`. */
export type ImpactMetric = z.infer<typeof ImpactMetricSchema>;

/**
 * `RoutineItemSchema` — A single actionable step in a daily routine.
 */
export const RoutineItemSchema = z.object({
  /** Unique slug used as the React list key. */
  id: z.string().min(1),
  /** Time window for the action (e.g. "Morning", "Evening"). */
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night', 'anytime']),
  /** Short imperative title for the action. */
  title: z.string().min(1).max(120),
  /** Detailed description including the why and how. */
  description: z.string().min(1),
  /** Category tag for icon selection and filtering. */
  category: z.enum(['outdoor', 'indoor', 'diet', 'transport', 'exercise', 'children', 'health']),
  /** Estimated PM2.5 exposure saved per occurrence in ug/m3. */
  estimatedBenefitUg: z.number().nonnegative().optional(),
});

/** Inferred TypeScript type from `RoutineItemSchema`. */
export type RoutineItem = z.infer<typeof RoutineItemSchema>;

/**
 * `IndoorHackSchema` — An indoor air-quality improvement tip.
 */
export const IndoorHackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedCost: z.enum(['free', 'low', 'medium', 'high']),
  /** Approximate PM2.5 reduction percentage inside the home. */
  indoorReductionPercent: z.number().min(0).max(100).optional(),
});

/** Inferred TypeScript type from `IndoorHackSchema`. */
export type IndoorHack = z.infer<typeof IndoorHackSchema>;

/**
 * `HourlyForecastItemSchema` — An individual forecast entry in the 24-hour diurnal cycle.
 * AQI capped at 500 conforming to official Indian CPCB scale.
 */
export const HourlyForecastItemSchema = z.object({
  /** Time identifier, e.g. "6:00 AM", "10:00 AM", "2:30 PM", "6:00 PM", "10:00 PM". */
  time: z.string().min(1),
  /** Classified CPCB AQI severity band. */
  aqiCategory: AqiCategoryEnum,
  /** Numerical AQI value on the CPCB 0-500 scale. */
  aqiValue: z.number().int().min(CPCB_MIN_AQI).max(CPCB_MAX_AQI),
  /** Concise tactical advice or trend note for this hour window. */
  shortNote: z.string().min(1),
});

/** Inferred TypeScript type from `HourlyForecastItemSchema`. */
export type HourlyForecastItem = z.infer<typeof HourlyForecastItemSchema>;

/**
 * `SafeVentilationWindowSchema` — Optimal window of the day for home aeration.
 */
export const SafeVentilationWindowSchema = z.object({
  /** Recommended window label, e.g. "2:00 PM - 4:00 PM". */
  timeWindow: z.string().min(1),
  /** Expected AQI range or dip description during this interval. */
  expectedAqi: z.string().min(1),
  /** Actionable protocol for aerating the space without smog backflow. */
  recommendation: z.string().min(1),
  /** Whether today's overall pollution is too dangerous to open windows at all. */
  isSafeToVentilate: z.boolean(),
  /** Scientific ventilation classification status. */
  status: z.enum(['safe', 'caution', 'unsafe', 'insufficient_data']).optional(),
  /** Confidence level of the meteorological dispersion assessment. */
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  /** Grounded scientific explanation of atmospheric dynamics. */
  scientificReasoning: z.string().optional(),
  /** Contiguous intervals across the 24-hour cycle. */
  contiguousIntervals: z.array(z.custom<ContiguousVentilationInterval>((val) => typeof val === 'object' && val !== null)).optional(),
  /** Indoor CO2 displacement protocol vs particulate intrusion. */
  indoorCo2Advice: z.custom<IndoorCo2Guidance>((val) => typeof val === 'object' && val !== null).optional(),
});

/** Inferred TypeScript type from `SafeVentilationWindowSchema`. */
export type SafeVentilationWindow = z.infer<typeof SafeVentilationWindowSchema>;

/**
 * `AiResponseSchema` — Full structured JSON response from the Gemini API.
 * Strictly adheres to the Indian CPCB AQI 6-band spectrum (0–500).
 */
export const AiResponseSchema = z.object({
  aqiCategory: AqiCategoryEnum,
  aqiValue: z.number().int().min(CPCB_MIN_AQI).max(CPCB_MAX_AQI),
  alertMessage: z.string().min(1),
  summaryHeadline: z.string().min(1),
  lowEmissionRoutines: z.array(RoutineItemSchema).min(1),
  indoorHacks: z.array(IndoorHackSchema).min(1),
  impactMetrics: z.array(ImpactMetricSchema).min(1),
  hourlyForecast: z.array(HourlyForecastItemSchema).min(4),
  safeVentilationWindow: SafeVentilationWindowSchema,
  emergencyTips: z.array(z.string()).min(1),
  generatedAt: z.string().datetime(),
  prominentPollutant: z.string().optional(),
  environmentalData: z.custom<EnvironmentalSnapshot>((val) => typeof val === 'object' && val !== null).optional(),
  grapRegulation: z.custom<GrapRegulationInfo>((val) => typeof val === 'object' && val !== null).optional(),
  emergencyDirectory: z.custom<EmergencyDirectoryResult>((val) => typeof val === 'object' && val !== null).optional(),
});

/** Inferred TypeScript type from `AiResponseSchema`. */
export type AiResponse = z.infer<typeof AiResponseSchema>;
