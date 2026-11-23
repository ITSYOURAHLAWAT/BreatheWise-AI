/**
 * @file cpcb-aqi.ts
 * @description Official Central Pollution Control Board (CPCB) India National Air Quality Index (NAQI)
 * mathematical calculation engine.
 *
 * References:
 *  - Central Pollution Control Board (CPCB), Ministry of Environment, Forest & Climate Change (MoEFCC),
 *    Government of India: "National Air Quality Index" Report, October 2014.
 *  - CPCB NAQI Web Portal & Technical Breakpoint Guidelines.
 *
 * Mathematical Formulation:
 *  Linear interpolation for sub-index I_p of pollutant p:
 *    I_p = I_lo + ((I_hi - I_lo) / (B_hi - B_lo)) * (C_p - B_lo)
 *
 *  Overall AQI:
 *    AQI = max(I_1, I_2, ..., I_n)
 *
 * Official CPCB Data Sufficiency Criteria:
 *  1. At least three pollutants must be available.
 *  2. At least one of the available pollutants MUST be either PM10 or PM2.5.
 *  If either criterion is violated, AQI cannot be officially determined.
 */

/** Official minimum AQI value on the Indian CPCB scale. */
export const CPCB_MIN_AQI = 0;

/** Official maximum AQI value on the Indian CPCB 6-band scale (Severe band upper bound). */
export const CPCB_MAX_AQI = 500;

/** Official statutory minimum number of monitored pollutants required by CPCB. */
export const CPCB_MIN_POLLUTANTS_REQUIRED = 3;

/** Recognized CPCB AQI categories. */
export type AqiCategory =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'very_poor'
  | 'severe';

/**
 * Result classification of deterministic CPCB AQI evaluation.
 * Returns standard `AqiCategory` for 0–500 or `'Out of range / Exceptional'` for values > 500 or negative.
 */
export type CpcbAqiClassification = AqiCategory | 'Out of range / Exceptional';

/**
 * Normalizes an AQI category or exceptional classification to a valid standard CPCB category.
 * Values marked 'Out of range / Exceptional' or undefined default safely to 'severe'.
 *
 * @param category - Raw CPCB classification string.
 * @returns Standard CPCB AQI category.
 */
export function normalizeAqiCategory(
  category: CpcbAqiClassification | null | undefined
): AqiCategory {
  if (!category || category === 'Out of range / Exceptional') {
    return 'severe';
  }
  return category;
}

/**
 * Converts a numeric AQI value to the official Indian CPCB 6-band category.
 *
 * @param value - Numeric AQI value (0 to 500).
 * @returns Mapped CPCB category string or 'Out of range / Exceptional'.
 */
export function aqiValueToCategory(value: number): CpcbAqiClassification {
  if (value < CPCB_MIN_AQI || value > CPCB_MAX_AQI) {
    return 'Out of range / Exceptional';
  }
  if (value <= 50) return 'good';
  if (value <= 100) return 'satisfactory';
  if (value <= 200) return 'moderate';
  if (value <= 300) return 'poor';
  if (value <= 400) return 'very_poor';
  return 'severe';
}

/** Recognized CPCB pollutant keys. */
export type CpcbPollutant =
  | 'pm25'
  | 'pm10'
  | 'no2'
  | 'so2'
  | 'co'
  | 'o3'
  | 'nh3'
  | 'pb';

/** Breakpoint interval for sub-index interpolation. */
export interface CpcbBreakpoint {
  bLo: number;
  bHi: number;
  iLo: number;
  iHi: number;
  category: AqiCategory;
}

/**
 * Official CPCB Breakpoint Tables.
 * Units:
 *  - PM2.5, PM10, NO2, SO2, O3, NH3, Pb: µg/m³
 *  - CO: mg/m³
 */
export const CPCB_BREAKPOINTS: Record<CpcbPollutant, readonly CpcbBreakpoint[]> = {
  pm25: [
    { bLo: 0, bHi: 30, iLo: 0, iHi: 50, category: 'good' },
    { bLo: 31, bHi: 60, iLo: 51, iHi: 100, category: 'satisfactory' },
    { bLo: 61, bHi: 90, iLo: 101, iHi: 200, category: 'moderate' },
    { bLo: 91, bHi: 120, iLo: 201, iHi: 300, category: 'poor' },
    { bLo: 121, bHi: 250, iLo: 301, iHi: 400, category: 'very_poor' },
    { bLo: 251, bHi: 350, iLo: 401, iHi: 500, category: 'severe' },
  ],
  pm10: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50, category: 'good' },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100, category: 'satisfactory' },
    { bLo: 101, bHi: 250, iLo: 101, iHi: 200, category: 'moderate' },
    { bLo: 251, bHi: 350, iLo: 201, iHi: 300, category: 'poor' },
    { bLo: 351, bHi: 430, iLo: 301, iHi: 400, category: 'very_poor' },
    { bLo: 431, bHi: 500, iLo: 401, iHi: 500, category: 'severe' },
  ],
  no2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50, category: 'good' },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100, category: 'satisfactory' },
    { bLo: 81, bHi: 180, iLo: 101, iHi: 200, category: 'moderate' },
    { bLo: 181, bHi: 280, iLo: 201, iHi: 300, category: 'poor' },
    { bLo: 281, bHi: 400, iLo: 301, iHi: 400, category: 'very_poor' },
    { bLo: 401, bHi: 500, iLo: 401, iHi: 500, category: 'severe' },
  ],
  so2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50, category: 'good' },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100, category: 'satisfactory' },
    { bLo: 81, bHi: 380, iLo: 101, iHi: 200, category: 'moderate' },
    { bLo: 381, bHi: 800, iLo: 201, iHi: 300, category: 'poor' },
    { bLo: 801, bHi: 1600, iLo: 301, iHi: 400, category: 'very_poor' },
    { bLo: 1601, bHi: 2000, iLo: 401, iHi: 500, category: 'severe' },
  ],
  co: [
    { bLo: 0.0, bHi: 1.0, iLo: 0, iHi: 50, category: 'good' },
    { bLo: 1.1, bHi: 2.0, iLo: 51, iHi: 100, category: 'satisfactory' },
    { bLo: 2.1, bHi: 10.0, iLo: 101, iHi: 200, category: 'moderate' },
    { bLo: 10.1, bHi: 17.0, iLo: 201, iHi: 300, category: 'poor' },
    { bLo: 17.1, bHi: 34.0, iLo: 301, iHi: 400, category: 'very_poor' },
    { bLo: 34.1, bHi: 50.0, iLo: 401, iHi: 500, category: 'severe' },
  ],
  o3: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50, category: 'good' },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100, category: 'satisfactory' },
    { bLo: 101, bHi: 168, iLo: 101, iHi: 200, category: 'moderate' },
    { bLo: 169, bHi: 208, iLo: 201, iHi: 300, category: 'poor' },
    { bLo: 209, bHi: 748, iLo: 301, iHi: 400, category: 'very_poor' },
    { bLo: 749, bHi: 1000, iLo: 401, iHi: 500, category: 'severe' },
  ],
  nh3: [
    { bLo: 0, bHi: 200, iLo: 0, iHi: 50, category: 'good' },
    { bLo: 201, bHi: 400, iLo: 51, iHi: 100, category: 'satisfactory' },
    { bLo: 401, bHi: 800, iLo: 101, iHi: 200, category: 'moderate' },
    { bLo: 801, bHi: 1200, iLo: 201, iHi: 300, category: 'poor' },
    { bLo: 1201, bHi: 1800, iLo: 301, iHi: 400, category: 'very_poor' },
    { bLo: 1801, bHi: 2500, iLo: 401, iHi: 500, category: 'severe' },
  ],
  pb: [
    { bLo: 0.0, bHi: 0.5, iLo: 0, iHi: 50, category: 'good' },
    { bLo: 0.6, bHi: 1.0, iLo: 51, iHi: 100, category: 'satisfactory' },
    { bLo: 1.1, bHi: 2.0, iLo: 101, iHi: 200, category: 'moderate' },
    { bLo: 2.1, bHi: 3.0, iLo: 201, iHi: 300, category: 'poor' },
    { bLo: 3.1, bHi: 3.5, iLo: 301, iHi: 400, category: 'very_poor' },
    { bLo: 3.6, bHi: 5.0, iLo: 401, iHi: 500, category: 'severe' },
  ],
};

/** Input pollutant concentrations. All in µg/m³ except CO in mg/m³. */
export interface RawPollutantConcentrations {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null; // Note: mg/m³
  o3?: number | null;
  nh3?: number | null;
  pb?: number | null;
}

/** Result of calculating a single pollutant sub-index. */
export interface PollutantSubIndexResult {
  pollutant: CpcbPollutant;
  concentration: number;
  subIndex: number;
  category: AqiCategory | 'Out of range / Exceptional';
  status: 'valid' | 'out_of_range' | 'invalid';
}

/** Result of the comprehensive CPCB AQI calculation. */
export interface CpcbCalculationResult {
  aqi: number | null;
  aqiCategory: AqiCategory | 'Out of range / Exceptional' | null;
  prominentPollutant: CpcbPollutant | null;
  subIndices: Partial<Record<CpcbPollutant, PollutantSubIndexResult>>;
  isSufficientData: boolean;
  validPollutantsCount: number;
  hasParticulateRequirement: boolean;
  insufficiencyReason?: string;
  calculatedAt: string;
}

/**
 * Calculates the CPCB sub-index for a specific pollutant concentration using linear interpolation.
 *
 * Formula:
 *   I_p = round(I_lo + ((I_hi - I_lo) / (B_hi - B_lo)) * (C_p - B_lo))
 *
 * @param pollutant - Recognized CPCB pollutant key.
 * @param concentration - Numerical concentration (µg/m³, except CO in mg/m³).
 * @returns {@link PollutantSubIndexResult} with calculated sub-index and validity status.
 */
/**
 * Checks whether an incoming concentration value is valid for CPCB calculations.
 *
 * @param concentration - Numerical concentration reading.
 * @returns `true` if concentration is negative, NaN, non-finite, or non-numeric.
 */
function isInvalidConcentration(concentration: unknown): boolean {
  return (
    typeof concentration !== 'number' ||
    Number.isNaN(concentration) ||
    !Number.isFinite(concentration) ||
    concentration < 0
  );
}

/**
 * Linearly interpolates sub-index from concentration and matching breakpoint.
 *
 * Formula: I = I_lo + ((I_hi - I_lo) / (B_hi - B_lo)) * (C - B_lo)
 *
 * @param bp - Matching CPCB breakpoint range.
 * @param concentration - Pollutant concentration.
 * @returns Clamped sub-index between 0 and 500.
 */
function interpolateSubIndex(bp: CpcbBreakpoint, concentration: number): number {
  const interpolated = bp.iLo + ((bp.iHi - bp.iLo) / (bp.bHi - bp.bLo)) * (concentration - bp.bLo);
  return Math.min(CPCB_MAX_AQI, Math.max(CPCB_MIN_AQI, Math.round(interpolated)));
}

/**
 * Finds the matching breakpoint interval for a given concentration.
 *
 * @param breakpoints - Array of CPCB breakpoints for the pollutant.
 * @param concentration - Pollutant concentration.
 * @returns The matching breakpoint or `undefined` if outside defined intervals.
 */
function findBreakpointForConcentration(
  breakpoints: readonly CpcbBreakpoint[],
  concentration: number
): CpcbBreakpoint | undefined {
  return breakpoints.find((bp) => concentration >= bp.bLo && concentration <= bp.bHi);
}

/**
 * Calculates the individual pollutant sub-index for a single pollutant parameter.
 *
 * Implements linear interpolation formula across official CPCB breakpoint tables.
 *
 * @param pollutant - Recognized CPCB pollutant key.
 * @param concentration - Concentration value in µg/m³ (or mg/m³ for CO).
 * @returns {@link PollutantSubIndexResult} with calculated sub-index, category, and validity status.
 */
export function calculatePollutantSubIndex(
  pollutant: CpcbPollutant,
  concentration: number
): PollutantSubIndexResult {
  if (isInvalidConcentration(concentration)) {
    return {
      pollutant,
      concentration,
      subIndex: 0,
      category: 'Out of range / Exceptional',
      status: 'invalid',
    };
  }

  const breakpoints = CPCB_BREAKPOINTS[pollutant];
  if (!breakpoints || breakpoints.length === 0) {
    return {
      pollutant,
      concentration,
      subIndex: 0,
      category: 'Out of range / Exceptional',
      status: 'invalid',
    };
  }

  const matched = findBreakpointForConcentration(breakpoints, concentration);
  if (matched) {
    const subIndex = interpolateSubIndex(matched, concentration);
    return {
      pollutant,
      concentration,
      subIndex,
      category: aqiValueToCategory(subIndex),
      status: 'valid',
    };
  }

  const lastBp = breakpoints[breakpoints.length - 1];
  if (lastBp && concentration > lastBp.bHi) {
    return {
      pollutant,
      concentration,
      subIndex: 500,
      category: 'severe',
      status: 'out_of_range',
    };
  }

  return {
    pollutant,
    concentration,
    subIndex: 0,
    category: 'good',
    status: 'valid',
  };
}

/** Recognized CPCB pollutant keys list for iteration. */
const ALL_POLLUTANT_KEYS: readonly CpcbPollutant[] = [
  'pm25',
  'pm10',
  'no2',
  'so2',
  'co',
  'o3',
  'nh3',
  'pb',
] as const;

/**
 * Collects valid sub-indices across all monitored pollutants.
 *
 * @param concentrations - Raw reported pollutant values.
 * @returns Structured collection of sub-indices, valid count, and particulate presence.
 */
function collectValidSubIndices(concentrations: RawPollutantConcentrations): {
  subIndices: Partial<Record<CpcbPollutant, PollutantSubIndexResult>>;
  validCount: number;
  hasParticulate: boolean;
} {
  const subIndices: Partial<Record<CpcbPollutant, PollutantSubIndexResult>> = {};
  let validCount = 0;
  let hasPm25 = false;
  let hasPm10 = false;

  for (const key of ALL_POLLUTANT_KEYS) {
    const rawVal = concentrations[key];
    if (rawVal !== undefined && rawVal !== null && typeof rawVal === 'number' && rawVal >= 0) {
      const res = calculatePollutantSubIndex(key, rawVal);
      if (res.status !== 'invalid') {
        subIndices[key] = res;
        validCount += 1;
        if (key === 'pm25') hasPm25 = true;
        if (key === 'pm10') hasPm10 = true;
      }
    }
  }

  return { subIndices, validCount, hasParticulate: hasPm25 || hasPm10 };
}

/**
 * Finds the maximum sub-index and identifies the prominent pollutant.
 *
 * @param subIndices - Map of valid pollutant sub-indices.
 * @returns Max sub-index integer and prominent pollutant key.
 */
function findProminentSubIndex(
  subIndices: Partial<Record<CpcbPollutant, PollutantSubIndexResult>>
): { maxSubIndex: number; prominent: CpcbPollutant | null } {
  let maxSubIndex = -1;
  let prominent: CpcbPollutant | null = null;

  for (const [pKey, res] of Object.entries(subIndices)) {
    if (res && res.subIndex > maxSubIndex) {
      maxSubIndex = res.subIndex;
      prominent = pKey as CpcbPollutant;
    }
  }

  return { maxSubIndex: Math.max(CPCB_MIN_AQI, Math.min(CPCB_MAX_AQI, maxSubIndex)), prominent };
}

/**
 * Calculates the official Indian CPCB National Air Quality Index (NAQI).
 *
 * Enforces official data sufficiency criteria:
 *  1. At least 3 pollutants must be validly reported.
 *  2. At least one must be PM10 or PM2.5.
 *
 * @param concentrations - Object containing reported pollutant concentrations.
 * @returns {@link CpcbCalculationResult} with overall AQI, prominent pollutant, and sub-indices.
 */
export function calculateCpcbAqi(
  concentrations: RawPollutantConcentrations
): CpcbCalculationResult {
  const calculatedAt = new Date().toISOString();
  const { subIndices, validCount, hasParticulate } = collectValidSubIndices(concentrations);

  if (validCount < CPCB_MIN_POLLUTANTS_REQUIRED) {
    return {
      aqi: null,
      aqiCategory: null,
      prominentPollutant: null,
      subIndices,
      isSufficientData: false,
      validPollutantsCount: validCount,
      hasParticulateRequirement: hasParticulate,
      insufficiencyReason: `Insufficient data: CPCB requires at least ${CPCB_MIN_POLLUTANTS_REQUIRED} monitored pollutants; only ${validCount} available.`,
      calculatedAt,
    };
  }

  if (!hasParticulate) {
    return {
      aqi: null,
      aqiCategory: null,
      prominentPollutant: null,
      subIndices,
      isSufficientData: false,
      validPollutantsCount: validCount,
      hasParticulateRequirement: false,
      insufficiencyReason: 'Insufficient data: CPCB requires either PM10 or PM2.5 to be monitored among the available parameters.',
      calculatedAt,
    };
  }

  const { maxSubIndex, prominent } = findProminentSubIndex(subIndices);
  const category = aqiValueToCategory(maxSubIndex);

  return {
    aqi: maxSubIndex,
    aqiCategory: category,
    prominentPollutant: prominent,
    subIndices,
    isSufficientData: true,
    validPollutantsCount: validCount,
    hasParticulateRequirement: true,
    calculatedAt,
  };
}
