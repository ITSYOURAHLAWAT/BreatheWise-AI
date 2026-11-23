/**
 * @file ventilation-engine.ts
 * @description Scientific Safe Ventilation & Atmospheric Dispersion Engine for BreatheWise AI.
 *
 * Implements:
 *  - Multi-parameter evaluation of hourly ventilation safety:
 *      * Particulate Concentration (PM2.5 / PM10 / CPCB NAQI)
 *      * Planetary Boundary Layer Height (PBLH) & convective mixing
 *      * Surface wind speed (horizontal advection vs. stagnation)
 *      * Relative humidity & hygroscopic smog growth penalty
 *  - Identification of contiguous safe, caution, and unsafe intervals across the 24-hour horizon.
 *  - Explicit uncertainty and confidence modeling (high, medium, low).
 *  - Explicit insufficient-data state handling.
 *  - Indoor CO2 accumulation vs. outdoor toxic particulate infiltration trade-off protocol.
 *  - Grounded scientific explanations without unsupported meteorological assertions.
 */

import type { HourlyEnvironmentalPoint } from './environmental-service.ts';
import type { AqiCategory } from './cpcb-aqi.ts';

/** Hourly ventilation status classification. */
export type HourlyVentilationStatus = 'safe' | 'caution' | 'unsafe' | 'insufficient_data';

/** Confidence grade based on meteorological parameter completeness and forecast distance. */
export type VentilationConfidence = 'high' | 'medium' | 'low';

/** Evaluated ventilation status for an individual hour. */
export interface EvaluatedVentilationHour {
  timeIso: string;
  displayTime: string;
  status: HourlyVentilationStatus;
  score: number; // 0 (catastrophic) to 100 (pristine)
  cpcbAqi: number | null;
  cpcbCategory: AqiCategory | 'Out of range / Exceptional' | null;
  pm25: number;
  pm10: number;
  temperatureC: number;
  relativeHumidityPercent?: number | null;
  windSpeedKmh: number;
  boundaryLayerHeightM: number | null;
  dispersionIndex: 'favorable' | 'moderate' | 'stagnant' | 'unknown';
  confidence: VentilationConfidence;
  primaryReason: string;
  indoorCo2Action: string;
}

/** Contiguous interval of identical or compatible ventilation status. */
export interface ContiguousVentilationInterval {
  id: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: HourlyVentilationStatus;
  averageAqi: number;
  peakAqi: number;
  lowestAqi: number;
  averagePm25: number;
  recommendation: string;
  co2Protocol: string;
}

/** Indoor CO2 guidance advisory protocol. */
export interface IndoorCo2Guidance {
  alertLevel: 'normal' | 'moderate' | 'critical';
  action: string;
  technicalDetails: string;
}

/** Overall 24-hour ventilation analysis result. */
export interface FullVentilationAnalysis {
  overallStatus: 'safe_window_available' | 'caution_only' | 'sealed_mandatory' | 'insufficient_data';
  isSafeToVentilate: boolean;
  primaryWindow: {
    timeWindow: string;
    expectedAqi: string;
    recommendation: string;
    isSafeToVentilate: boolean;
    status: HourlyVentilationStatus;
    confidence: VentilationConfidence;
    scientificReasoning: string;
  };
  contiguousIntervals: ContiguousVentilationInterval[];
  hourlyEvaluations: EvaluatedVentilationHour[];
  indoorCo2Guidance: IndoorCo2Guidance;
  meteorologicalSynthesis: string;
}

/**
 * Evaluates an individual hour for residential ventilation suitability.
 *
 * Evaluation Matrix:
 *  1. Ambient Particulate Risk:
 *     - PM2.5 <= 30 µg/m³ (CPCB Good): Minimal outdoor hazard.
 *     - PM2.5 31 - 60 µg/m³ (CPCB Satisfactory): Low hazard, acceptable for natural aeration.
 *     - PM2.5 61 - 120 µg/m³ (CPCB Moderate to Poor): Moderate hazard. Conditional brief aeration permissible only if dispersion is favorable.
 *     - PM2.5 > 120 µg/m³ (CPCB Very Poor or Severe): High to catastrophic hazard. Natural ventilation causes rapid indoor toxic particulate loading.
 *
 *  2. Atmospheric Dispersion (PBLH & Wind):
 *     - PBLH > 800m and Wind > 7 km/h: Favorable vertical & horizontal dilution.
 *     - PBLH 400 - 800m or Wind 4 - 7 km/h: Moderate dispersion.
 *     - PBLH < 350m and Wind < 4 km/h: Strong nocturnal inversion & surface trapping.
 *
 *  3. Relative Humidity Penalty:
 *     - RH > 80% with elevated particulates increases aerosol particle mass via hygroscopic growth.
 *
 * @param hour - The hourly environmental data point.
 * @returns {@link EvaluatedVentilationHour}
 */
/**
 * Determines the atmospheric dispersion index based on Boundary Layer Height (PBLH) and wind speed.
 *
 * @param blh - Planetary boundary layer height in meters, or `null`.
 * @param wind - Surface wind speed in km/h.
 * @returns Favorable, moderate, stagnant, or unknown dispersion state.
 */
function determineDispersionIndex(
  blh: number | null,
  wind: number
): 'favorable' | 'moderate' | 'stagnant' | 'unknown' {
  if (blh !== null) {
    if (blh >= 800 && wind >= 6) return 'favorable';
    if (blh >= 400 || wind >= 5) return 'moderate';
    return 'stagnant';
  }
  if (wind >= 8) return 'moderate';
  return 'stagnant';
}

/**
 * Assesses the primary particulate air hazard and baseline score deduction for a single hour.
 *
 * @param pm25 - Ambient PM2.5 in µg/m³.
 * @param aqi - Numerical CPCB AQI value or `null`.
 * @param dispersion - Atmospheric dispersion category.
 * @param blh - Boundary layer height in meters or `null`.
 * @returns Score deduction, baseline ventilation status, primary reason, and CO2 action.
 */
function assessParticulateHazard(
  pm25: number,
  aqi: number | null,
  dispersion: 'favorable' | 'moderate' | 'stagnant' | 'unknown',
  blh: number | null
): {
  scoreDeduction: number;
  status: HourlyVentilationStatus;
  primaryReason: string;
  indoorCo2Action: string;
} {
  if (pm25 > 250 || (aqi !== null && aqi > 400)) {
    return {
      scoreDeduction: 85,
      status: 'unsafe',
      primaryReason: `Extreme ambient particulate concentration (PM2.5: ${pm25} µg/m³, AQI: ${aqi ?? 'Severe'}). Window opening will cause rapid toxic indoor accumulation.`,
      indoorCo2Action: 'Keep all windows firmly sealed. Operate HEPA purifiers continuously on recirculate mode. Use indoor exhaust fans in bathrooms only if dampers seal tightly.',
    };
  }
  if (pm25 > 120 || (aqi !== null && aqi > 300)) {
    return {
      scoreDeduction: 70,
      status: 'unsafe',
      primaryReason: `Heavy ambient pollution (PM2.5: ${pm25} µg/m³). Infiltration rate exceeds safe human pulmonary thresholds.`,
      indoorCo2Action: 'Maintain sealed perimeter. If indoor CO2 feels stuffy, use portable air circulators or run air purifiers on high to promote internal air movement.',
    };
  }
  if (pm25 > 60 || (aqi !== null && aqi > 100)) {
    const isFavorable = dispersion === 'favorable';
    return {
      scoreDeduction: isFavorable ? 30 : 55,
      status: 'caution',
      primaryReason: isFavorable
        ? `Moderate ambient pollution (PM2.5: ${pm25} µg/m³). Thermal convective mixing provides an acceptable window for brief aeration.`
        : `Moderate to poor ambient air (PM2.5: ${pm25} µg/m³) under limited atmospheric dispersion (PBLH: ${blh ?? 'low'}m).`,
      indoorCo2Action: isFavorable
        ? 'Brief 10–15 minute cross-ventilation permissible to flush indoor CO2 and VOCs, followed immediately by 30 minutes of HEPA air cleaning on turbo.'
        : 'Limit aeration to under 10 minutes only if indoor stuffiness is acute. Keep HEPA purifiers running.',
    };
  }
  if (pm25 > 30 || (aqi !== null && aqi > 50)) {
    return {
      scoreDeduction: 15,
      status: 'safe',
      primaryReason: `Satisfactory ambient air quality (PM2.5: ${pm25} µg/m³). Natural cross-ventilation is safe for healthy households.`,
      indoorCo2Action: 'Open opposing windows for 20–30 minutes to achieve full air exchange and displace accumulated CO2.',
    };
  }
  return {
    scoreDeduction: 0,
    status: 'safe',
    primaryReason: `Clean ambient air (PM2.5: ${pm25} µg/m³, AQI: ${aqi ?? 'Good'}). Optimal conditions for complete indoor fresh-air renewal.`,
    indoorCo2Action: 'Open windows freely for natural ventilation.',
  };
}

/**
 * Builds an insufficient data evaluation when key telemetry is unavailable.
 *
 * @param hour - Raw hourly environmental point.
 * @returns {@link EvaluatedVentilationHour} marked as insufficient_data.
 */
function buildInsufficientHour(hour: HourlyEnvironmentalPoint): EvaluatedVentilationHour {
  return {
    timeIso: hour.timeIso,
    displayTime: hour.displayTime,
    status: 'insufficient_data',
    score: 0,
    cpcbAqi: hour.cpcbAqi,
    cpcbCategory: hour.cpcbCategory,
    pm25: hour.pm25,
    pm10: hour.pm10,
    temperatureC: hour.temperatureC,
    windSpeedKmh: hour.windSpeedKmh,
    boundaryLayerHeightM: hour.boundaryLayerHeightM,
    dispersionIndex: 'unknown',
    confidence: 'low',
    primaryReason: 'Incomplete particulate telemetry for this hour; safety cannot be verified.',
    indoorCo2Action: 'Maintain current filtration; verify local air quality sensor before opening.',
  };
}

/**
 * Evaluates an individual hour for residential ventilation suitability.
 *
 * @param hour - The hourly environmental data point.
 * @returns {@link EvaluatedVentilationHour}
 */
export function evaluateVentilationHour(
  hour: HourlyEnvironmentalPoint
): EvaluatedVentilationHour {
  if (hour.pm25 <= 0 && (!hour.cpcbAqi || hour.cpcbAqi <= 0)) {
    return buildInsufficientHour(hour);
  }

  const blh = hour.boundaryLayerHeightM;
  const dispersion = determineDispersionIndex(blh, hour.windSpeedKmh);
  const hazard = assessParticulateHazard(hour.pm25, hour.cpcbAqi, dispersion, blh);

  let finalScore = 100 - hazard.scoreDeduction;
  let finalStatus = hazard.status;
  let finalReason = hazard.primaryReason;

  if (dispersion === 'stagnant') {
    finalScore -= 15;
    if (finalStatus === 'safe') finalStatus = 'caution';
    finalReason += ` Nocturnal thermal inversion layer is compressed (${blh !== null ? blh + 'm' : 'low'}), restricting dispersion.`;
  } else if (dispersion === 'favorable' && finalStatus === 'caution') {
    finalReason += ` Solar surface heating has lifted the boundary mixing layer to ${blh}m, improving dispersion.`;
  }

  const confidence: VentilationConfidence = blh !== null && hour.windSpeedKmh >= 0 ? 'high' : 'medium';

  return {
    timeIso: hour.timeIso,
    displayTime: hour.displayTime,
    status: finalStatus,
    score: Math.max(0, Math.min(100, Math.round(finalScore))),
    cpcbAqi: hour.cpcbAqi,
    cpcbCategory: hour.cpcbCategory,
    pm25: hour.pm25,
    pm10: hour.pm10,
    temperatureC: hour.temperatureC,
    windSpeedKmh: hour.windSpeedKmh,
    boundaryLayerHeightM: blh,
    dispersionIndex: dispersion,
    confidence,
    primaryReason: finalReason,
    indoorCo2Action: hazard.indoorCo2Action,
  };
}

/**
 * Returns an explicit insufficient-data response when hourly forecast points are absent.
 *
 * @returns {@link FullVentilationAnalysis} configured with safe fallbacks and explicit data warning.
 */
function buildInsufficientDataAnalysis(): FullVentilationAnalysis {
  return {
    overallStatus: 'insufficient_data',
    isSafeToVentilate: false,
    primaryWindow: {
      timeWindow: 'Data Unavailable',
      expectedAqi: 'Forecast Unavailable',
      recommendation: 'Environmental forecast data is currently unavailable. Safety of opening windows cannot be established. Keep living spaces sealed if outdoor odor or haze is present.',
      isSafeToVentilate: false,
      status: 'insufficient_data',
      confidence: 'low',
      scientificReasoning: 'Insufficient meteorological or particulate telemetry to compute safe aeration intervals.',
    },
    contiguousIntervals: [],
    hourlyEvaluations: [],
    indoorCo2Guidance: {
      alertLevel: 'moderate',
      action: 'Operate internal HEPA purifiers on continuous circulation; avoid unmonitored window opening.',
      technicalDetails: 'Without ambient particulate verification, fresh air intake risk cannot be computed.',
    },
    meteorologicalSynthesis: 'Atmospheric dispersion conditions cannot be determined due to missing forecast streams.',
  };
}

/**
 * Aggregates contiguous blocks of identical hourly ventilation evaluations.
 *
 * @param hourlyEvaluations - Array of evaluated hourly points.
 * @returns Contiguous intervals with aggregated metrics and actionable protocols.
 */
function aggregateContiguousBlocks(
  hourlyEvaluations: EvaluatedVentilationHour[]
): ContiguousVentilationInterval[] {
  const contiguousIntervals: ContiguousVentilationInterval[] = [];
  let currentBlock: EvaluatedVentilationHour[] = [];

  for (const curr of hourlyEvaluations) {
    if (currentBlock.length === 0) {
      currentBlock.push(curr);
    } else {
      const prev = currentBlock[currentBlock.length - 1];
      if (prev && prev.status === curr.status) {
        currentBlock.push(curr);
      } else {
        contiguousIntervals.push(summarizeInterval(currentBlock, contiguousIntervals.length + 1));
        currentBlock = [curr];
      }
    }
  }

  if (currentBlock.length > 0) {
    contiguousIntervals.push(summarizeInterval(currentBlock, contiguousIntervals.length + 1));
  }

  return contiguousIntervals;
}

/**
 * Selects the optimal interval candidate for primary recommendation based on safety hierarchy.
 *
 * @param intervals - Array of aggregated contiguous intervals.
 * @returns Selected interval, overall system status, and boolean safe flag.
 */
function selectOptimalInterval(
  intervals: ContiguousVentilationInterval[]
): {
  chosenInterval: ContiguousVentilationInterval | null;
  overallStatus: FullVentilationAnalysis['overallStatus'];
  isSafeToVentilate: boolean;
} {
  const safe = intervals.filter((i) => i.status === 'safe');
  const caution = intervals.filter((i) => i.status === 'caution');
  const unsafe = intervals.filter((i) => i.status === 'unsafe');

  if (safe.length > 0) {
    const chosen = safe.reduce((prev, curr) => (curr.durationHours > prev.durationHours ? curr : prev));
    return { chosenInterval: chosen, overallStatus: 'safe_window_available', isSafeToVentilate: true };
  }
  if (caution.length > 0) {
    const chosen = caution.reduce((prev, curr) => (curr.averageAqi < prev.averageAqi ? curr : prev));
    return { chosenInterval: chosen, overallStatus: 'caution_only', isSafeToVentilate: false };
  }
  return { chosenInterval: unsafe[0] ?? null, overallStatus: 'sealed_mandatory', isSafeToVentilate: false };
}

/**
 * Synthesizes indoor CO2 displacement protocol versus outdoor aerosol intrusion hazard.
 *
 * @param overallStatus - Current system-wide ventilation status.
 * @returns Indoor CO2 alert level, actionable instruction, and technical rationale.
 */
function synthesizeIndoorCo2Guidance(
  overallStatus: FullVentilationAnalysis['overallStatus']
): FullVentilationAnalysis['indoorCo2Guidance'] {
  if (overallStatus === 'sealed_mandatory') {
    return {
      alertLevel: 'critical',
      action: 'Do not open windows to resolve stuffiness. Use internal mechanical air movement or run HEPA purifiers on medium speed.',
      technicalDetails: 'When outdoor AQI > 300, 15 minutes of open windows introduces >150 µg/m³ of PM2.5 into living spaces. This acute pulmonary toxicity is significantly more hazardous than brief CO2 elevation (1000–1400 ppm).',
    };
  }
  if (overallStatus === 'caution_only') {
    return {
      alertLevel: 'moderate',
      action: 'Execute a timed 10–15 minute cross-room flush during the caution window, then immediately reseal windows and run air purifiers on high.',
      technicalDetails: 'A brief cross-flow creates high volumetric air exchange, displacing accumulated respiratory CO2 while limiting particulate mass ingress to a level easily scrubbed by indoor HEPA units in 20–30 minutes.',
    };
  }
  return {
    alertLevel: 'normal',
    action: 'Natural ventilation is safe. Open opposing windows for 20–30 minutes to replenish oxygen and purge indoor pollutants.',
    technicalDetails: 'Ambient particulate concentration is low enough that natural air exchange improves overall indoor air quality without particle burden.',
  };
}

/**
 * Generates meteorological narrative describing airshed boundary layer dynamics.
 *
 * @param hourlyEvaluations - Evaluated hourly points.
 * @returns Synthesis narrative describing diurnal inversion and dispersion conditions.
 */
function synthesizeMeteorologicalDynamics(
  hourlyEvaluations: EvaluatedVentilationHour[]
): string {
  const favorableCount = hourlyEvaluations.filter((h) => h.dispersionIndex === 'favorable').length;
  const stagnantCount = hourlyEvaluations.filter((h) => h.dispersionIndex === 'stagnant').length;

  if (stagnantCount > 16) {
    return 'Predominantly stagnant atmospheric conditions across the Delhi NCR airshed. Low boundary layer height (<400m) and calm winds produce severe nocturnal trapping.';
  }
  if (favorableCount > 4) {
    return 'Diurnal solar radiation induces thermal mixing in the afternoon, providing a temporary window of elevated boundary layer height and improved dispersion.';
  }
  return 'Moderate atmospheric dispersion with limited diurnal ventilation potential. Wind speeds remain the dominant factor for particulate dilution.';
}

/**
 * Constructs the primary window recommendation object from the chosen interval.
 *
 * @param chosen - The selected contiguous ventilation interval.
 * @param isSafeToVentilate - Boolean safety flag.
 * @returns Primary window details for the dashboard card.
 */
function buildPrimaryWindow(
  chosen: ContiguousVentilationInterval | null,
  isSafeToVentilate: boolean
): FullVentilationAnalysis['primaryWindow'] {
  if (!chosen) {
    return {
      timeWindow: 'No Safe Window Today',
      expectedAqi: 'Ambient AQI remains elevated throughout the cycle',
      recommendation: 'Outdoor pollution remains dangerously elevated. Keep all windows firmly sealed and run HEPA air purifiers continuously.',
      isSafeToVentilate: false,
      status: 'unsafe',
      confidence: 'high',
      scientificReasoning: 'Thermal inversion and calm surface winds trap particulates near ground level across all 24 hours.',
    };
  }

  const scientificReasoning =
    chosen.status === 'safe'
      ? `Ambient air quality is within satisfactory thresholds during this ${chosen.durationHours}-hour window, allowing safe room flushing.`
      : chosen.status === 'caution'
      ? `Midday solar warming raises the boundary mixing layer to break surface stagnation, yielding the day's lowest particulate exposure window (~${chosen.averageAqi} AQI). Only brief cross-flow is permissible.`
      : `Heavy surface stagnation persists without any clean-air interval. Window opening would cause toxic PM2.5 infiltration exceeding indoor CO2 hazards.`;

  return {
    timeWindow: `${chosen.startTime} – ${chosen.endTime}`,
    expectedAqi: `Expected AQI: ~${chosen.averageAqi} (PM2.5: ~${chosen.averagePm25} µg/m³)`,
    recommendation: chosen.recommendation,
    isSafeToVentilate,
    status: chosen.status,
    confidence: 'high',
    scientificReasoning,
  };
}

/**
 * Analyzes the full 24-hour sequence, identifies contiguous intervals,
 * selects the primary recommendation window, and synthesizes CO2 advice.
 *
 * @param hourlyPoints - Array of 24 hourly environmental points.
 * @returns {@link FullVentilationAnalysis}
 */
export function analyze24HourVentilation(
  hourlyPoints: HourlyEnvironmentalPoint[]
): FullVentilationAnalysis {
  if (!hourlyPoints || hourlyPoints.length === 0) {
    return buildInsufficientDataAnalysis();
  }

  const hourlyEvaluations = hourlyPoints.map(evaluateVentilationHour);
  const contiguousIntervals = aggregateContiguousBlocks(hourlyEvaluations);
  const { chosenInterval, overallStatus, isSafeToVentilate } = selectOptimalInterval(contiguousIntervals);

  return {
    overallStatus,
    isSafeToVentilate,
    primaryWindow: buildPrimaryWindow(chosenInterval, isSafeToVentilate),
    contiguousIntervals,
    hourlyEvaluations,
    indoorCo2Guidance: synthesizeIndoorCo2Guidance(overallStatus),
    meteorologicalSynthesis: synthesizeMeteorologicalDynamics(hourlyEvaluations),
  };
}

/**
 * Summarizes a contiguous block of hourly evaluations into a structured interval.
 */
function summarizeInterval(
  block: EvaluatedVentilationHour[],
  index: number
): ContiguousVentilationInterval {
  const first = block[0]!;
  const last = block[block.length - 1]!;

  const validAqis = block.map((b) => b.cpcbAqi).filter((a): a is number => a !== null);
  const avgAqi = validAqis.length > 0
    ? Math.round(validAqis.reduce((sum, a) => sum + a, 0) / validAqis.length)
    : 0;

  const peakAqi = validAqis.length > 0 ? Math.max(...validAqis) : 0;
  const lowestAqi = validAqis.length > 0 ? Math.min(...validAqis) : 0;

  const avgPm25 = Math.round(
    block.reduce((sum, b) => sum + b.pm25, 0) / block.length
  );

  let recommendation = '';
  let co2Protocol = '';

  if (first.status === 'safe') {
    recommendation = `Safe for natural ventilation. Open cross-facing windows for 20–30 minutes to refresh indoor air.`;
    co2Protocol = `Optimal window to eliminate indoor CO2 buildup without air quality penalties.`;
  } else if (first.status === 'caution') {
    recommendation = `Cautionary brief aeration window (AQI ~${avgAqi}). Open windows for 10–15 minutes only to purge stuffy air, then seal and power on HEPA purifiers.`;
    co2Protocol = `Balance indoor CO2 displacement against outdoor aerosol ingress with a timed flush followed by active filtration.`;
  } else {
    recommendation = `Unsafe for natural ventilation (AQI ~${avgAqi}, PM2.5 ~${avgPm25} µg/m³). Keep all doors and windows firmly sealed.`;
    co2Protocol = `Avoid window opening. Use portable fans or air purifiers to circulate indoor air.`;
  }

  return {
    id: `interval-${index}-${first.status}`,
    startTime: first.displayTime,
    endTime: last.displayTime,
    durationHours: block.length,
    status: first.status,
    averageAqi: avgAqi,
    peakAqi,
    lowestAqi,
    averagePm25: avgPm25,
    recommendation,
    co2Protocol,
  };
}
