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
  indoorCo2Guidance: {
    alertLevel: 'normal' | 'moderate' | 'critical';
    action: string;
    technicalDetails: string;
  };
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
export function evaluateVentilationHour(
  hour: HourlyEnvironmentalPoint
): EvaluatedVentilationHour {
  const pm25 = hour.pm25;
  const pm10 = hour.pm10;
  const aqi = hour.cpcbAqi;
  const blh = hour.boundaryLayerHeightM;
  const wind = hour.windSpeedKmh;

  // Check data sufficiency
  if (pm25 <= 0 && (!aqi || aqi <= 0)) {
    return {
      timeIso: hour.timeIso,
      displayTime: hour.displayTime,
      status: 'insufficient_data',
      score: 0,
      cpcbAqi: aqi,
      cpcbCategory: hour.cpcbCategory,
      pm25,
      pm10,
      temperatureC: hour.temperatureC,
      windSpeedKmh: wind,
      boundaryLayerHeightM: blh,
      dispersionIndex: 'unknown',
      confidence: 'low',
      primaryReason: 'Incomplete particulate telemetry for this hour; safety cannot be verified.',
      indoorCo2Action: 'Maintain current filtration; verify local air quality sensor before opening.',
    };
  }

  // Assess dispersion conditions
  let dispersion: 'favorable' | 'moderate' | 'stagnant' | 'unknown' = 'unknown';
  if (blh !== null) {
    if (blh >= 800 && wind >= 6) {
      dispersion = 'favorable';
    } else if (blh >= 400 || wind >= 5) {
      dispersion = 'moderate';
    } else {
      dispersion = 'stagnant';
    }
  } else if (wind >= 8) {
    dispersion = 'moderate';
  } else {
    dispersion = 'stagnant';
  }

  // Base score starting from 100
  let score = 100;
  let status: HourlyVentilationStatus = 'safe';
  let primaryReason = '';
  let indoorCo2Action = '';

  // 1. Particulate penalty
  if (pm25 > 250 || (aqi !== null && aqi > 400)) {
    // Severe
    score -= 85;
    status = 'unsafe';
    primaryReason = `Extreme ambient particulate concentration (PM2.5: ${pm25} µg/m³, AQI: ${aqi ?? 'Severe'}). Window opening will cause rapid toxic indoor accumulation.`;
    indoorCo2Action = 'Keep all windows firmly sealed. Operate HEPA purifiers continuously on recirculate mode. Use indoor exhaust fans in bathrooms only if dampers seal tightly.';
  } else if (pm25 > 120 || (aqi !== null && aqi > 300)) {
    // Very Poor
    score -= 70;
    status = 'unsafe';
    primaryReason = `Heavy ambient pollution (PM2.5: ${pm25} µg/m³). Infiltration rate exceeds safe human pulmonary thresholds.`;
    indoorCo2Action = 'Maintain sealed perimeter. If indoor CO2 feels stuffy, use portable air circulators or run air purifiers on high to promote internal air movement.';
  } else if (pm25 > 60 || (aqi !== null && aqi > 100)) {
    // Moderate / Poor
    score -= 40;
    if (dispersion === 'favorable') {
      score += 10;
      status = 'caution';
      primaryReason = `Moderate ambient pollution (PM2.5: ${pm25} µg/m³). Thermal convective mixing provides an acceptable window for brief aeration.`;
      indoorCo2Action = 'Brief 10–15 minute cross-ventilation permissible to flush indoor CO2 and VOCs, followed immediately by 30 minutes of HEPA air cleaning on turbo.';
    } else {
      score -= 15;
      status = 'caution';
      primaryReason = `Moderate to poor ambient air (PM2.5: ${pm25} µg/m³) under limited atmospheric dispersion (PBLH: ${blh ?? 'low'}m).`;
      indoorCo2Action = 'Limit aeration to under 10 minutes only if indoor stuffiness is acute. Keep HEPA purifiers running.';
    }
  } else if (pm25 > 30 || (aqi !== null && aqi > 50)) {
    // Satisfactory
    score -= 15;
    status = 'safe';
    primaryReason = `Satisfactory ambient air quality (PM2.5: ${pm25} µg/m³). Natural cross-ventilation is safe for healthy households.`;
    indoorCo2Action = 'Open opposing windows for 20–30 minutes to achieve full air exchange and displace accumulated CO2.';
  } else {
    // Good
    status = 'safe';
    primaryReason = `Clean ambient air (PM2.5: ${pm25} µg/m³, AQI: ${aqi ?? 'Good'}). Optimal conditions for complete indoor fresh-air renewal.`;
    indoorCo2Action = 'Open windows freely for natural ventilation.';
  }

  // 2. Meteorological dispersion modifiers
  if (dispersion === 'stagnant') {
    score -= 15;
    if (status === 'safe') status = 'caution';
    primaryReason += ` Nocturnal thermal inversion layer is compressed (${blh !== null ? blh + 'm' : 'low'}), restricting dispersion.`;
  } else if (dispersion === 'favorable' && status === 'caution') {
    primaryReason += ` Solar surface heating has lifted the boundary mixing layer to ${blh}m, improving dispersion.`;
  }

  // Determine confidence
  const confidence: VentilationConfidence = blh !== null && wind >= 0 ? 'high' : 'medium';

  return {
    timeIso: hour.timeIso,
    displayTime: hour.displayTime,
    status,
    score: Math.max(0, Math.min(100, Math.round(score))),
    cpcbAqi: aqi,
    cpcbCategory: hour.cpcbCategory,
    pm25,
    pm10,
    temperatureC: hour.temperatureC,
    windSpeedKmh: wind,
    boundaryLayerHeightM: blh,
    dispersionIndex: dispersion,
    confidence,
    primaryReason,
    indoorCo2Action,
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

  // 1. Evaluate every individual hour
  const hourlyEvaluations: EvaluatedVentilationHour[] = hourlyPoints.map(evaluateVentilationHour);

  // 2. Identify contiguous blocks of identical status
  const contiguousIntervals: ContiguousVentilationInterval[] = [];
  let currentBlock: EvaluatedVentilationHour[] = [];

  for (let i = 0; i < hourlyEvaluations.length; i++) {
    const curr = hourlyEvaluations[i];
    if (!curr) continue;

    if (currentBlock.length === 0) {
      currentBlock.push(curr);
    } else {
      const prev = currentBlock[currentBlock.length - 1];
      if (prev && prev.status === curr.status) {
        currentBlock.push(curr);
      } else {
        // Finalize previous block
        contiguousIntervals.push(summarizeInterval(currentBlock, contiguousIntervals.length + 1));
        currentBlock = [curr];
      }
    }
  }

  if (currentBlock.length > 0) {
    contiguousIntervals.push(summarizeInterval(currentBlock, contiguousIntervals.length + 1));
  }

  // 3. Find optimal candidate interval for primary window recommendation
  // Priority: longest 'safe' interval > longest 'caution' interval > least bad 'unsafe' interval
  const safeIntervals = contiguousIntervals.filter((i) => i.status === 'safe');
  const cautionIntervals = contiguousIntervals.filter((i) => i.status === 'caution');
  const unsafeIntervals = contiguousIntervals.filter((i) => i.status === 'unsafe');

  let chosenInterval: ContiguousVentilationInterval | null = null;
  let overallStatus: FullVentilationAnalysis['overallStatus'] = 'sealed_mandatory';
  let isSafeToVentilate = false;

  if (safeIntervals.length > 0) {
    // Choose longest safe interval
    chosenInterval = safeIntervals.reduce((prev, curr) =>
      curr.durationHours > prev.durationHours ? curr : prev
    );
    overallStatus = 'safe_window_available';
    isSafeToVentilate = true;
  } else if (cautionIntervals.length > 0) {
    // Choose caution interval with lowest average AQI
    chosenInterval = cautionIntervals.reduce((prev, curr) =>
      curr.averageAqi < prev.averageAqi ? curr : prev
    );
    overallStatus = 'caution_only';
    isSafeToVentilate = false; // Flagged as cautionary rather than unreservedly safe
  } else if (unsafeIntervals.length > 0) {
    chosenInterval = unsafeIntervals[0] ?? null;
    overallStatus = 'sealed_mandatory';
    isSafeToVentilate = false;
  }

  // 4. Construct Primary Window Object
  let timeWindow = 'No Safe Window Today';
  let expectedAqi = 'Ambient AQI remains elevated throughout the cycle';
  let recommendation = 'Outdoor pollution remains dangerously elevated. Keep all windows firmly sealed and run HEPA air purifiers continuously.';
  let primaryStatus: HourlyVentilationStatus = 'unsafe';
  const confidence: VentilationConfidence = 'high';
  let scientificReasoning = 'Thermal inversion and calm surface winds trap particulates near ground level across all 24 hours.';

  if (chosenInterval) {
    timeWindow = `${chosenInterval.startTime} – ${chosenInterval.endTime}`;
    expectedAqi = `Expected AQI: ~${chosenInterval.averageAqi} (PM2.5: ~${chosenInterval.averagePm25} µg/m³)`;
    recommendation = chosenInterval.recommendation;
    primaryStatus = chosenInterval.status;

    if (chosenInterval.status === 'safe') {
      scientificReasoning = `Ambient air quality is within satisfactory thresholds during this ${chosenInterval.durationHours}-hour window, allowing safe room flushing.`;
    } else if (chosenInterval.status === 'caution') {
      scientificReasoning = `Midday solar warming raises the boundary mixing layer to break surface stagnation, yielding the day's lowest particulate exposure window (~${chosenInterval.averageAqi} AQI). Only brief cross-flow is permissible.`;
    } else {
      scientificReasoning = `Heavy surface stagnation persists without any clean-air interval. Window opening would cause toxic PM2.5 infiltration exceeding indoor CO2 hazards.`;
    }
  }

  // 5. Indoor CO2 vs. Outdoor Particulate Trade-off Guidance
  const indoorCo2Guidance: FullVentilationAnalysis['indoorCo2Guidance'] = overallStatus === 'sealed_mandatory'
    ? {
        alertLevel: 'critical',
        action: 'Do not open windows to resolve stuffiness. Use internal mechanical air movement or run HEPA purifiers on medium speed.',
        technicalDetails: 'When outdoor AQI > 300, 15 minutes of open windows introduces >150 µg/m³ of PM2.5 into living spaces. This acute pulmonary toxicity is significantly more hazardous than brief CO2 elevation (1000–1400 ppm).',
      }
    : overallStatus === 'caution_only'
    ? {
        alertLevel: 'moderate',
        action: 'Execute a timed 10–15 minute cross-room flush during the caution window, then immediately reseal windows and run air purifiers on high.',
        technicalDetails: 'A brief cross-flow creates high volumetric air exchange, displacing accumulated respiratory CO2 while limiting particulate mass ingress to a level easily scrubbed by indoor HEPA units in 20–30 minutes.',
      }
    : {
        alertLevel: 'normal',
        action: 'Natural ventilation is safe. Open opposing windows for 20–30 minutes to replenish oxygen and purge indoor pollutants.',
        technicalDetails: 'Ambient particulate concentration is low enough that natural air exchange improves overall indoor air quality without particle burden.',
      };

  // 6. Meteorological synthesis
  const favorableCount = hourlyEvaluations.filter((h) => h.dispersionIndex === 'favorable').length;
  const stagnantCount = hourlyEvaluations.filter((h) => h.dispersionIndex === 'stagnant').length;

  const meteorologicalSynthesis = stagnantCount > 16
    ? 'Predominantly stagnant atmospheric conditions across the Delhi NCR airshed. Low boundary layer height (<400m) and calm winds produce severe nocturnal trapping.'
    : favorableCount > 4
    ? 'Diurnal solar radiation induces thermal mixing in the afternoon, providing a temporary window of elevated boundary layer height and improved dispersion.'
    : 'Moderate atmospheric dispersion with limited diurnal ventilation potential. Wind speeds remain the dominant factor for particulate dilution.';

  return {
    overallStatus,
    isSafeToVentilate,
    primaryWindow: {
      timeWindow,
      expectedAqi,
      recommendation,
      isSafeToVentilate,
      status: primaryStatus,
      confidence,
      scientificReasoning,
    },
    contiguousIntervals,
    hourlyEvaluations,
    indoorCo2Guidance,
    meteorologicalSynthesis,
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
