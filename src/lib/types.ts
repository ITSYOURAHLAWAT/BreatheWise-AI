/**
 * @file types.ts
 * @description Centralized TypeScript interfaces, utility types, and component prop definitions for BreatheWise AI.
 *
 * Provides a clean, strongly-typed aggregation layer connecting:
 *  - Zod-inferred domain models (`schemas.ts`)
 *  - Environmental telemetry services (`environmental-service.ts`)
 *  - CPCB AQI mathematical calculation engine (`cpcb-aqi.ts`)
 *  - Atmospheric ventilation and dispersion engine (`ventilation-engine.ts`)
 *  - Statutory CAQM GRAP regulations (`grap-regulations.ts`)
 *  - Emergency medical triage directory (`emergency-directory.ts`)
 *  - UI state and presentation component contracts
 */

import type { z } from 'zod';
import type { AqiCategoryEnum } from './schemas.ts';

// ─── Domain Model Re-exports ─────────────────────────────────────────────────

export type {
  AiResponse,
  UserProfile,
  ImpactMetric,
  RoutineItem,
  IndoorHack,
  HourlyForecastItem,
  SafeVentilationWindow,
} from './schemas.ts';

export type {
  MicroLocation,
  DataSourceMetadata,
  MeteorologicalSnapshot,
  HourlyEnvironmentalPoint,
  EnvironmentalSnapshot,
} from './environmental-service.ts';

export type {
  CpcbPollutant,
  CpcbBreakpoint,
  RawPollutantConcentrations,
  PollutantSubIndexResult,
  CpcbCalculationResult,
  CpcbAqiClassification,
} from './cpcb-aqi.ts';

export type {
  HourlyVentilationStatus,
  VentilationConfidence,
  EvaluatedVentilationHour,
  ContiguousVentilationInterval,
  FullVentilationAnalysis,
  IndoorCo2Guidance,
} from './ventilation-engine.ts';

export type {
  GrapStage,
  GrapRegulationInfo,
  GrapCitizenGuideline,
} from './grap-regulations.ts';

export type {
  EmergencyHospital,
  EmergencyHotline,
  RedFlagSymptom,
  EmergencyDirectoryResult,
} from './emergency-directory.ts';

import type {
  AiResponse,
  UserProfile,
  RoutineItem,
  IndoorHack,
  ImpactMetric,
  HourlyForecastItem,
  SafeVentilationWindow,
} from './schemas.ts';
import type { EnvironmentalSnapshot } from './environmental-service.ts';

// ─── AQI Utilities & Visual Display Types ────────────────────────────────────

/** All valid AQI category string literals inferred directly from `AqiCategoryEnum`. */
export type AqiCategory = z.infer<typeof AqiCategoryEnum>;

/**
 * `AqiDisplayConfig` — Visual configuration derived from an AQI category.
 * Used by colour-coding utilities across multiple components.
 */
export interface AqiDisplayConfig {
  /** Tailwind background colour class for cards / badges. */
  bgClass: string;
  /** Tailwind text colour class (must pass WCAG AAA on bgClass). */
  textClass: string;
  /** Tailwind border colour class. */
  borderClass: string;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Emoji or icon name to accompany the label. */
  emoji: string;
}

// ─── Application & Form State ────────────────────────────────────────────────

/**
 * `FormStatus` — Tracks the current state of the AI plan generation request.
 *
 * - `idle`    — Initial state; no request in flight.
 * - `loading` — Request sent; awaiting telemetry and Gemini response.
 * - `success` — Plan successfully generated, validated, and enriched.
 * - `error`   — Request failed; `errorMessage` populated.
 */
export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * `AppState` — Top-level client state managed by the main dashboard page (`page.tsx`).
 */
export interface AppState {
  status: FormStatus;
  plan: AiResponse | null;
  errorMessage: string | null;
}

// ─── Component Props ──────────────────────────────────────────────────────────

/**
 * Props for the `ProfileForm` component.
 */
export interface ProfileFormProps {
  /** Called with validated data when the form is submitted. */
  onSubmit: (profile: UserProfile) => Promise<void>;
  /** Whether a generation request is currently in progress. */
  isLoading: boolean;
}

/**
 * Props for the `AirQualityCard` component.
 */
export interface AirQualityCardProps {
  aqiValue: number;
  aqiCategory: AqiCategory;
  alertMessage: string;
  summaryHeadline: string;
  city: string;
  environmentalSnapshot?: EnvironmentalSnapshot | undefined;
  prominentPollutant?: string | undefined;
}

/**
 * Props for the `RoutineList` component.
 */
export interface RoutineListProps {
  routines: RoutineItem[];
}

/**
 * Props for the `IndoorHacksList` component.
 */
export interface IndoorHacksListProps {
  hacks: IndoorHack[];
}

/**
 * Props for a single `ImpactMetric` display tile.
 */
export interface ImpactMetricProps {
  metric: ImpactMetric;
}

/**
 * Props for the `HourlyForecast` component.
 */
export interface HourlyForecastProps {
  forecast: HourlyForecastItem[];
}

/**
 * Props for the Safe Ventilation Window card.
 */
export interface VentilationWindowCardProps {
  window: SafeVentilationWindow;
}

/**
 * Props for the `EmergencyTips` component.
 */
export interface EmergencyTipsProps {
  tips: string[];
}

/**
 * Props for the inline `AqiBadge` component.
 */
export interface AqiBadgeProps {
  category: AqiCategory;
  value?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for the animated loading indicator.
 */
export interface LoadingSpinnerProps {
  /** Accessible label for screen readers. */
  label?: string;
}

/**
 * Props for the global error display component.
 */
export interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Props for a reusable section heading component.
 */
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}
