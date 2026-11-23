/**
 * @file aqi-utils.ts
 * @description Pure deterministic utility functions for Indian Central Pollution Control
 * Board (CPCB) AQI categorization, colour-coding, labelling, and display configuration.
 *
 * CPCB Official 6-Band Scale:
 *  - 0–50:    Good
 *  - 51–100:  Satisfactory
 *  - 101–200: Moderate
 *  - 201–300: Poor
 *  - 301–400: Very Poor
 *  - 401–500: Severe
 *  - > 500:   Out of range / Exceptional
 */

import type { AqiCategory, AqiDisplayConfig } from './types.ts';
import {
  aqiValueToCategory,
  normalizeAqiCategory,
  CPCB_MIN_AQI,
  CPCB_MAX_AQI,
} from './cpcb-aqi.ts';
import type { CpcbAqiClassification } from './cpcb-aqi.ts';

export {
  aqiValueToCategory,
  normalizeAqiCategory,
  CPCB_MIN_AQI,
  CPCB_MAX_AQI,
};
export type { CpcbAqiClassification };

/**
 * `AQI_DISPLAY_CONFIG` — Maps each CPCB AQI category to its visual presentation.
 *
 * Colour contrast ratios are verified against WCAG AAA (≥7:1) for text on background.
 * - good/satisfactory: dark text on light green/teal
 * - moderate: dark on amber
 * - poor/very_poor: dark text on high-contrast orange/red tints
 * - severe: dark red text on high-contrast red background
 */
export const AQI_DISPLAY_CONFIG: Record<AqiCategory, AqiDisplayConfig> = {
  good: {
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
    label: 'Good',
    emoji: '🌿',
  },
  satisfactory: {
    bgClass: 'bg-teal-100',
    textClass: 'text-teal-900',
    borderClass: 'border-teal-300',
    label: 'Satisfactory',
    emoji: '😊',
  },
  moderate: {
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-400',
    label: 'Moderate',
    emoji: '😐',
  },
  poor: {
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-900',
    borderClass: 'border-orange-400',
    label: 'Poor',
    emoji: '😷',
  },
  very_poor: {
    bgClass: 'bg-red-100',
    textClass: 'text-red-900',
    borderClass: 'border-red-500',
    label: 'Very Poor',
    emoji: '⚠️',
  },
  severe: {
    bgClass: 'bg-red-200',
    textClass: 'text-red-950',
    borderClass: 'border-red-600',
    label: 'Severe',
    emoji: '🚨',
  },
};

/** Fallback configuration for exceptional or out-of-range AQI values (>500). */
export const EXCEPTIONAL_AQI_CONFIG: AqiDisplayConfig = {
  bgClass: 'bg-red-950',
  textClass: 'text-red-100',
  borderClass: 'border-red-900',
  label: 'Out of range / Exceptional',
  emoji: '🚨',
};

/**
 * Returns the `AqiDisplayConfig` for a given AQI category.
 *
 * @param category - The AQI category string.
 * @returns The corresponding display configuration object.
 */
export function getAqiConfig(category: AqiCategory): AqiDisplayConfig {
  const config = AQI_DISPLAY_CONFIG[category];
  return config ?? EXCEPTIONAL_AQI_CONFIG;
}



/**
 * Returns `true` if the AQI category warrants an emergency alert banner (CPCB Severe band).
 *
 * @param category - The AQI category to check.
 */
export function isEmergencyLevel(category: AqiCategory): boolean {
  return category === 'severe';
}

/**
 * Maps a `RoutineItem.timeOfDay` value to a human-readable label.
 *
 * @param timeOfDay - The time-of-day key.
 * @returns A display string for the UI.
 */
export function formatTimeOfDay(
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime'
): string {
  const labels: Record<typeof timeOfDay, string> = {
    morning: '☀️ Morning',
    afternoon: '🌤️ Afternoon',
    evening: '🌆 Evening',
    night: '🌙 Night',
    anytime: '🕐 Anytime',
  };
  return labels[timeOfDay];
}

/**
 * Maps an `IndoorHack.difficulty` to a Tailwind badge class set.
 *
 * @param difficulty - Easy / medium / hard.
 * @returns Object with `bg`, `text`, and `border` Tailwind classes.
 */
export function getDifficultyClasses(difficulty: 'easy' | 'medium' | 'hard'): {
  bg: string;
  text: string;
  border: string;
} {
  const map = {
    easy: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
    hard: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
  };
  return map[difficulty];
}

/**
 * Maps a cost level to a friendly dollar-sign string.
 *
 * @param cost - The cost enumeration value.
 * @returns A display string like "Free", "$", "$$", "$$$".
 */
export function formatCost(cost: 'free' | 'low' | 'medium' | 'high'): string {
  const map: Record<typeof cost, string> = {
    free: 'Free',
    low: '$',
    medium: '$$',
    high: '$$$',
  };
  return map[cost];
}

/**
 * Estimates ambient PM2.5 concentration in µg/m³ from a CPCB AQI value (0-500)
 * using linear piecewise inverse interpolation against official CPCB breakpoints.
 *
 * @param aqi - Numerical AQI value on the 0-500 CPCB scale.
 * @returns Estimated PM2.5 concentration in µg/m³.
 */
export function estimatePm25(aqi: number): number {
  if (aqi <= 50) return Math.round((Math.max(CPCB_MIN_AQI, aqi) / 50) * 30);
  if (aqi <= 100) return Math.round(30 + ((aqi - 50) / 50) * 30);
  if (aqi <= 200) return Math.round(60 + ((aqi - 100) / 100) * 30);
  if (aqi <= 300) return Math.round(90 + ((aqi - 200) / 100) * 30);
  if (aqi <= 400) return Math.round(120 + ((aqi - 300) / 100) * 130);
  return Math.round(250 + ((Math.min(CPCB_MAX_AQI, aqi) - 400) / 100) * 100);
}

/**
 * Returns descriptive health and exposure guidance according to official CPCB advisories.
 *
 * @param category - Standard CPCB AQI category string.
 * @returns Official health and behavioral advisory guidance text.
 */
export function getCpcbHealthImpact(category: string): string {
  const guidanceMap: Record<string, string> = {
    good: 'Minimal impact. Air quality is safe for all normal outdoor activities and natural ventilation.',
    satisfactory: 'Minor breathing discomfort to sensitive people. Generally acceptable for the general public.',
    moderate: 'Breathing discomfort to people with lungs, asthma, and heart diseases on prolonged exposure.',
    poor: 'Breathing discomfort to most people on prolonged exposure. Limit high-exertion outdoor workouts.',
    very_poor: 'Respiratory illness on prolonged exposure. Pronounced effect on people with lung/heart disease. Seal indoors.',
    severe: 'Severe impacts on healthy people and serious health impacts on those with existing conditions. Keep all windows sealed.',
  };
  return guidanceMap[category] ?? 'Extreme air emergency. Cease all outdoor activities and run HEPA air filtration continuously.';
}

