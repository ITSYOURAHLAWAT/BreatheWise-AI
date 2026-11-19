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

/** Recognized CPCB AQI categories. */
export type AqiCategory =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'very_poor'
  | 'severe';

/**
 * Converts a numeric AQI value to the official Indian CPCB 6-band category.
 *
 * @param value - Numeric AQI value (0 to 500).
 * @returns Mapped CPCB category string or 'Out of range / Exceptional'.
 */
export function aqiValueToCategory(value: number): AqiCategory | 'Out of range / Exceptional' {
  if (value < 0 || value > 500) {
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
export function calculatePollutantSubIndex(
  pollutant: CpcbPollutant,
  concentration: number
): PollutantSubIndexResult {
  if (
    typeof concentration !== 'number' ||
    Number.isNaN(concentration) ||
    !Number.isFinite(concentration) ||
    concentration < 0
  ) {
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

  // Find matching breakpoint interval
  for (const bp of breakpoints) {
    if (concentration >= bp.bLo && concentration <= bp.bHi) {
      const subIndex = Math.round(
        bp.iLo + ((bp.iHi - bp.iLo) / (bp.bHi - bp.bLo)) * (concentration - bp.bLo)
      );
      const clampedSubIndex = Math.min(500, Math.max(0, subIndex));
      const cat = aqiValueToCategory(clampedSubIndex);
      return {
        pollutant,
        concentration,
        subIndex: clampedSubIndex,
        category: cat,
        status: 'valid',
      };
    }
  }

  // If concentration is above maximum defined breakpoint, CPCB caps sub-index at 500 (Severe)
  // or flags as out of range.
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
  const subIndices: Partial<Record<CpcbPollutant, PollutantSubIndexResult>> = {};

  const pollutantKeys: CpcbPollutant[] = [
    'pm25',
    'pm10',
    'no2',
    'so2',
    'co',
    'o3',
    'nh3',
    'pb',
  ];

  let validCount = 0;
  let hasPm25 = false;
  let hasPm10 = false;

  for (const key of pollutantKeys) {
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

  const hasParticulate = hasPm25 || hasPm10;

  // Enforce official sufficiency conditions
  if (validCount < 3) {
    return {
      aqi: null,
      aqiCategory: null,
      prominentPollutant: null,
      subIndices,
      isSufficientData: false,
      validPollutantsCount: validCount,
      hasParticulateRequirement: hasParticulate,
      insufficiencyReason: `Insufficient data: CPCB requires at least 3 monitored pollutants; only ${validCount} available.`,
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

  // Calculate overall AQI = max(I_1, ..., I_n)
  let maxSubIndex = -1;
  let prominent: CpcbPollutant | null = null;

  for (const [pKey, res] of Object.entries(subIndices)) {
    if (res && res.subIndex > maxSubIndex) {
      maxSubIndex = res.subIndex;
      prominent = pKey as CpcbPollutant;
    }
  }

  const overallAqi = Math.max(0, Math.min(500, maxSubIndex));
  const category = aqiValueToCategory(overallAqi);

  return {
    aqi: overallAqi,
    aqiCategory: category,
    prominentPollutant: prominent,
    subIndices,
    isSufficientData: true,
    validPollutantsCount: validCount,
    hasParticulateRequirement: true,
    calculatedAt,
  };
}
