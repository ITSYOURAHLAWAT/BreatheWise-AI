/**
 * @file types.ts
 * @description Supplementary TypeScript interfaces and utility types for BreatheWise AI.
 *
 * These types extend or complement the Zod-inferred types in `schemas.ts`
 * to cover UI state, component props, and API communication contracts.
 */

import type {
  AiResponse,
  UserProfile,
  AqiCategoryEnum,
  RoutineItem,
  IndoorHack,
  ImpactMetric,
  HourlyForecastItem,
  SafeVentilationWindow,
} from './schemas.ts';
import type { z } from 'zod';

// ─── Re-exports for convenience ───────────────────────────────────────────────

export type {
  AiResponse,
  UserProfile,
  ImpactMetric,
  RoutineItem,
  IndoorHack,
  HourlyForecastItem,
  SafeVentilationWindow,
} from './schemas';

import type {
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
} from './cpcb-aqi.ts';

export type {
  HourlyVentilationStatus,
  VentilationConfidence,
  EvaluatedVentilationHour,
  ContiguousVentilationInterval,
  FullVentilationAnalysis,
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

// ─── AQI Utilities ───────────────────────────────────────────────────────────

/** All valid AQI category string literals. */
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

// ─── Form State ───────────────────────────────────────────────────────────────

/**
 * `FormStatus` — Tracks the current state of the AI plan generation request.
 *
 * - `idle`    — Initial state; no request in flight.
 * - `loading` — Request sent; awaiting Gemini response.
 * - `success` — Plan successfully generated and validated.
 * - `error`   — Request failed; `errorMessage` populated.
 */
export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * `AppState` — Top-level client state managed by the main dashboard page.
 */
export interface AppState {
  status: FormStatus;
  plan: AiResponse | null;
  errorMessage: string | null;
}

// ─── Component Props ──────────────────────────────────────────────────────────

/**
 * `ProfileFormProps` — Props for the `ProfileForm` component.
 */
export interface ProfileFormProps {
  /** Called with validated data when the form is submitted. */
  onSubmit: (profile: UserProfile) => Promise<void>;
  /** Whether a generation request is currently in progress. */
  isLoading: boolean;
}

/**
 * `AirQualityCardProps` — Props for the `AirQualityCard` component.
 */
export type {
  MicroLocation,
  DataSourceMetadata,
  MeteorologicalSnapshot,
  HourlyEnvironmentalPoint,
  EnvironmentalSnapshot,
};

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
 * `RoutineListProps` — Props for the `RoutineList` component.
 */
export interface RoutineListProps {
  routines: RoutineItem[];
}

/**
 * `IndoorHacksListProps` — Props for the `IndoorHacksList` component.
 */
export interface IndoorHacksListProps {
  hacks: IndoorHack[];
}

/**
 * `ImpactMetricProps` — Props for a single `ImpactMetric` display tile.
 */
export interface ImpactMetricProps {
  metric: ImpactMetric;
}

/**
 * `HourlyForecastProps` — Props for the `HourlyForecast` component.
 */
export interface HourlyForecastProps {
  forecast: HourlyForecastItem[];
}

/**
 * `VentilationWindowCardProps` — Props for the Safe Ventilation Window card.
 */
export interface VentilationWindowCardProps {
  window: SafeVentilationWindow;
}

/**
 * `EmergencyTipsProps` — Props for the `EmergencyTips` component.
 */
export interface EmergencyTipsProps {
  tips: string[];
}

/**
 * `AqiBadgeProps` — Props for the inline `AqiBadge` component.
 */
export interface AqiBadgeProps {
  category: AqiCategory;
  value?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * `LoadingSpinnerProps` — Props for the animated loading indicator.
 */
export interface LoadingSpinnerProps {
  /** Accessible label for screen readers. */
  label?: string;
}

/**
 * `ErrorBannerProps` — Props for the global error display component.
 */
export interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/**
 * `SectionHeaderProps` — Props for a reusable section heading component.
 */
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}
