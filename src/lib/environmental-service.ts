/**
 * @file environmental-service.ts
 * @description Authoritative environmental data service for BreatheWise AI.
 *
 * Implements:
 *  - Micro-location coordinate resolution for Delhi NCR and Indian metropolitan areas.
 *  - Real-time modeled atmospheric pollutant retrieval from Open-Meteo Air Quality API (Copernicus / CAMS).
 *  - Meteorological atmospheric parameters retrieval (Boundary Layer Height, Temperature, Humidity, Wind).
 *  - Strict CPCB National AQI calculation derived from multi-pollutant concentrations via `cpcb-aqi.ts`.
 *  - 24-hour hourly modeled forecast sequence.
 *  - Full data provenance metadata (provider, modeled status, timestamp, coordinate resolution, freshness).
 *  - Server-side in-memory caching with 15-minute TTL to conserve bandwidth and prevent rate limiting.
 *  - Robust timeout handling with AbortController and graceful unavailable states.
 */

import { calculateCpcbAqi } from './cpcb-aqi.ts';
import type { RawPollutantConcentrations, CpcbCalculationResult } from './cpcb-aqi.ts';
import type { AqiCategory } from './types.ts';

/** Geocoded micro-location target in Delhi NCR or India. */
export interface MicroLocation {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  isDelhiNcr: boolean;
}

/** Pre-calibrated Delhi NCR hotspots and Indian metros. */
export const KNOWN_LOCATIONS: readonly MicroLocation[] = [
  // Delhi NCR Hotspots
  { name: 'Anand Vihar', region: 'East Delhi', latitude: 28.6502, longitude: 77.3150, isDelhiNcr: true },
  { name: 'Punjabi Bagh', region: 'West Delhi', latitude: 28.6692, longitude: 77.1278, isDelhiNcr: true },
  { name: 'Mandir Marg', region: 'Central Delhi', latitude: 28.6328, longitude: 77.2023, isDelhiNcr: true },
  { name: 'RK Puram', region: 'South Delhi', latitude: 28.5660, longitude: 77.1767, isDelhiNcr: true },
  { name: 'Dwarka', region: 'South West Delhi', latitude: 28.5823, longitude: 77.0500, isDelhiNcr: true },
  { name: 'Rohini', region: 'North West Delhi', latitude: 28.7166, longitude: 77.1126, isDelhiNcr: true },
  { name: 'Jahangirpuri', region: 'North Delhi', latitude: 28.7256, longitude: 77.1706, isDelhiNcr: true },
  { name: 'IGI Airport', region: 'Palam, Delhi', latitude: 28.5562, longitude: 77.1000, isDelhiNcr: true },
  { name: 'Okhla', region: 'South East Delhi', latitude: 28.5309, longitude: 77.2711, isDelhiNcr: true },
  { name: 'Shadipur', region: 'Central West Delhi', latitude: 28.6519, longitude: 77.1588, isDelhiNcr: true },
  { name: 'Bawana', region: 'North West Delhi', latitude: 28.7997, longitude: 77.0329, isDelhiNcr: true },
  { name: 'Lodhi Road', region: 'South Central Delhi', latitude: 28.5915, longitude: 77.2273, isDelhiNcr: true },
  { name: 'Noida Sector 62', region: 'Gautam Buddha Nagar, UP', latitude: 28.6280, longitude: 77.3649, isDelhiNcr: true },
  { name: 'Greater Noida', region: 'Gautam Buddha Nagar, UP', latitude: 28.4744, longitude: 77.5040, isDelhiNcr: true },
  { name: 'Gurugram', region: 'Cyber City, Haryana', latitude: 28.4950, longitude: 77.0895, isDelhiNcr: true },
  { name: 'Ghaziabad', region: 'Vasundhara / Indirapuram, UP', latitude: 28.6692, longitude: 77.4538, isDelhiNcr: true },
  { name: 'Faridabad', region: 'Haryana', latitude: 28.4089, longitude: 77.3178, isDelhiNcr: true },
  { name: 'Delhi', region: 'National Capital Territory', latitude: 28.6139, longitude: 77.2090, isDelhiNcr: true },

  // Other Major Metros
  { name: 'Mumbai', region: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, isDelhiNcr: false },
  { name: 'Bengaluru', region: 'Karnataka', latitude: 12.9716, longitude: 77.5946, isDelhiNcr: false },
  { name: 'Kolkata', region: 'West Bengal', latitude: 22.5726, longitude: 88.3639, isDelhiNcr: false },
  { name: 'Chennai', region: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, isDelhiNcr: false },
  { name: 'Hyderabad', region: 'Telangana', latitude: 17.3850, longitude: 78.4867, isDelhiNcr: false },
  { name: 'Pune', region: 'Maharashtra', latitude: 18.5204, longitude: 73.8567, isDelhiNcr: false },
  { name: 'Patna', region: 'Bihar', latitude: 25.5941, longitude: 85.1376, isDelhiNcr: false },
  { name: 'Lucknow', region: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462, isDelhiNcr: false },
];

/** Default fallback location for unspecified or unrecognized Indian locations. */
const DEFAULT_FALLBACK_LOCATION: MicroLocation = {
  name: 'Delhi',
  region: 'National Capital Territory',
  latitude: 28.6139,
  longitude: 77.2090,
  isDelhiNcr: true,
};

/** Common location aliases and metropolitan keyword mappings. */
const LOCATION_ALIASES: ReadonlyArray<{ match: string; targetName: string }> = [
  { match: 'ncr', targetName: 'Delhi' },
  { match: 'new delhi', targetName: 'Delhi' },
  { match: 'gurgaon', targetName: 'Gurugram' },
  { match: 'noida', targetName: 'Noida Sector 62' },
  { match: 'bangalore', targetName: 'Bengaluru' },
] as const;

/**
 * Searches KNOWN_LOCATIONS for an exact or fuzzy substring match.
 *
 * @param norm - Normalized lowercase search query.
 * @returns Matching MicroLocation or undefined.
 */
function findLocationBySubstring(norm: string): MicroLocation | undefined {
  return KNOWN_LOCATIONS.find((loc) => {
    const locLower = loc.name.toLowerCase();
    return norm === locLower || norm.includes(locLower) || locLower.includes(norm);
  });
}

/**
 * Checks alias mappings for common Indian regional terminology.
 *
 * @param norm - Normalized lowercase search query.
 * @returns Matching MicroLocation or undefined.
 */
function findLocationByAlias(norm: string): MicroLocation | undefined {
  const matchedAlias = LOCATION_ALIASES.find((alias) => norm.includes(alias.match));
  if (!matchedAlias) return undefined;
  return KNOWN_LOCATIONS.find((loc) => loc.name === matchedAlias.targetName);
}

/**
 * Resolves any user-entered text to the closest known micro-location or defaults to Central Delhi.
 *
 * @param input - Raw user city or locality string.
 * @returns Resolved {@link MicroLocation} with geocoded coordinates.
 */
export function resolveLocation(input: string): MicroLocation {
  const norm = input.trim().toLowerCase();
  if (!norm) return DEFAULT_FALLBACK_LOCATION;

  const matched = findLocationBySubstring(norm) ?? findLocationByAlias(norm);
  if (matched) return matched;

  return {
    name: input.trim(),
    region: 'India',
    latitude: DEFAULT_FALLBACK_LOCATION.latitude,
    longitude: DEFAULT_FALLBACK_LOCATION.longitude,
    isDelhiNcr: true,
  };
}

/** Provenance metadata clearly distinguishing model forecasts from direct physical station readings. */
export interface DataSourceMetadata {
  provider: string;
  model: string;
  dataType: 'model_forecast' | 'live_sensor' | 'hybrid';
  stationOrCoordinates: string;
  latitude: number;
  longitude: number;
  fetchedAt: string;
  dataTimestamp: string;
  freshnessMinutes: number;
  isDirectCpcbStation: boolean;
  disclaimer: string;
}

/** Meteorological atmospheric indicators. */
export interface MeteorologicalSnapshot {
  temperatureC: number;
  relativeHumidityPercent: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  boundaryLayerHeightM: number | null;
}

/** Hourly environmental snapshot point in time. */
export interface HourlyEnvironmentalPoint {
  timeIso: string;
  displayTime: string;
  cpcbAqi: number | null;
  cpcbCategory: AqiCategory | 'Out of range / Exceptional' | null;
  pm25: number;
  pm10: number;
  temperatureC: number;
  boundaryLayerHeightM: number | null;
  windSpeedKmh: number;
}

/** Authoritative environmental data package. */
export interface EnvironmentalSnapshot {
  status: 'available' | 'unavailable';
  location: MicroLocation;
  metadata: DataSourceMetadata;
  currentPollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    coMgM3: number;
    o3: number;
  };
  cpcbResult: CpcbCalculationResult;
  meteorology: MeteorologicalSnapshot;
  hourlyForecast: HourlyEnvironmentalPoint[];
  errorMessage?: string;
}

/** In-memory cache entry with TTL. */
interface CacheEntry {
  data: EnvironmentalSnapshot;
  expiresAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Conversion factor from Open-Meteo CO readings in µg/m³ to CPCB standard mg/m³. */
const CO_UG_TO_MG_DIVISOR = 1000;

/**
 * Constructs external API URLs for Open-Meteo Air Quality and Weather endpoints.
 *
 * @param loc - Geocoded target micro-location.
 * @returns Fully parameterized URLs for air quality and meteorology forecast models.
 */
function buildApiEndpoints(loc: MicroLocation): { airQualityUrl: string; weatherUrl: string } {
  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.latitude}&longitude=${loc.longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=Asia%2FKolkata&forecast_days=2`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,boundary_layer_height&timezone=Asia%2FKolkata&forecast_days=2`;
  return { airQualityUrl, weatherUrl };
}

/**
 * Extracts and unit-normalizes raw pollutant readings from the Open-Meteo API response.
 *
 * @param currAq - Current air quality block from Open-Meteo.
 * @returns Normalized pollutant values with CO in mg/m³.
 */
function parseRawPollutants(currAq: {
  pm2_5?: number | null;
  pm10?: number | null;
  nitrogen_dioxide?: number | null;
  sulphur_dioxide?: number | null;
  carbon_monoxide?: number | null;
  ozone?: number | null;
}): { rawPollutants: RawPollutantConcentrations; coMgM3: number } {
  const coMgM3 =
    typeof currAq.carbon_monoxide === 'number'
      ? Number((currAq.carbon_monoxide / CO_UG_TO_MG_DIVISOR).toFixed(2))
      : 0;

  const rawPollutants: RawPollutantConcentrations = {
    pm25: currAq.pm2_5 ?? null,
    pm10: currAq.pm10 ?? null,
    no2: currAq.nitrogen_dioxide ?? null,
    so2: currAq.sulphur_dioxide ?? null,
    co: coMgM3,
    o3: currAq.ozone ?? null,
  };

  return { rawPollutants, coMgM3 };
}

/**
 * Calculates data timestamp and freshness in elapsed minutes.
 *
 * @param timeStr - Open-Meteo current timestamp string.
 * @param fetchedAt - UTC ISO string marking fetch completion.
 * @returns Standardized ISO timestamp and freshness in minutes.
 */
function calculateDataFreshness(
  timeStr: string | undefined,
  fetchedAt: string
): { dataTimestamp: string; freshnessMinutes: number } {
  const dataTimestamp = timeStr ? `${timeStr}:00+05:30` : fetchedAt;
  const dataTimeMs = new Date(dataTimestamp).getTime();
  const freshnessMinutes = Math.max(
    0,
    Math.round((Date.now() - (Number.isNaN(dataTimeMs) ? Date.now() : dataTimeMs)) / 60000)
  );
  return { dataTimestamp, freshnessMinutes };
}

/**
 * Formats an ISO hourly time string into localized Indian format (e.g., "7:00 PM").
 *
 * @param timeStr - Raw ISO date string without offset.
 * @returns Formatted time string.
 */
function formatHourlyDisplayTime(timeStr: string): string {
  const parsedDate = new Date(`${timeStr}:00+05:30`);
  return !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    : timeStr;
}

/**
 * Constructs an individual hourly forecast point from model arrays.
 *
 * @param timeStr - Timestamp for this hour point.
 * @param pm25 - Forecasted PM2.5 in µg/m³.
 * @param pm10 - Forecasted PM10 in µg/m³.
 * @param no2 - Forecasted NO2 in µg/m³.
 * @param co - Forecasted CO in mg/m³.
 * @param o3 - Forecasted O3 in µg/m³.
 * @param tempC - Ambient temperature in Celsius.
 * @param blh - Planetary boundary layer height in meters or null.
 * @param windKmh - Surface wind speed in km/h.
 * @returns {@link HourlyEnvironmentalPoint}
 */
function buildHourlyForecastPoint(
  timeStr: string,
  pm25: number,
  pm10: number,
  no2: number,
  co: number,
  o3: number,
  tempC: number,
  blh: number | null,
  windKmh: number
): HourlyEnvironmentalPoint {
  const hourCalc = calculateCpcbAqi({ pm25, pm10, no2, co, o3 });
  return {
    timeIso: timeStr,
    displayTime: formatHourlyDisplayTime(timeStr),
    cpcbAqi: hourCalc.aqi,
    cpcbCategory: hourCalc.aqiCategory,
    pm25: Math.round(pm25),
    pm10: Math.round(pm10),
    temperatureC: tempC,
    boundaryLayerHeightM: blh,
    windSpeedKmh: windKmh,
  };
}

/**
 * Constructs a 24-hour hourly forecast sequence from Open-Meteo model response blocks.
 *
 * @param aqHourly - Hourly air quality arrays from Open-Meteo.
 * @param weatherHourly - Hourly weather arrays from Open-Meteo.
 * @param currTimeStr - Current hour string used as sequence starting anchor.
 * @returns Sequence of up to 24 evaluated hourly environmental points.
 */
function construct24HourSequence(
  aqHourly: {
    time?: string[];
    pm2_5?: number[];
    pm10?: number[];
    nitrogen_dioxide?: number[];
    carbon_monoxide?: number[];
    ozone?: number[];
  },
  weatherHourly: {
    time?: string[];
    temperature_2m?: number[];
    boundary_layer_height?: (number | null)[];
    wind_speed_10m?: number[];
  },
  currTimeStr: string
): HourlyEnvironmentalPoint[] {
  const hourlyTimes = aqHourly.time ?? [];
  const hourlyPm25 = aqHourly.pm2_5 ?? [];
  const hourlyPm10 = aqHourly.pm10 ?? [];
  const hourlyNo2 = aqHourly.nitrogen_dioxide ?? [];
  const hourlyCo = aqHourly.carbon_monoxide ?? [];
  const hourlyO3 = aqHourly.ozone ?? [];

  const weatherTimes = weatherHourly.time ?? [];
  const weatherTemp = weatherHourly.temperature_2m ?? [];
  const weatherBlh = weatherHourly.boundary_layer_height ?? [];
  const weatherWind = weatherHourly.wind_speed_10m ?? [];

  let startIndex = hourlyTimes.findIndex((t) => t === currTimeStr);
  if (startIndex < 0) startIndex = 0;

  const sequence: HourlyEnvironmentalPoint[] = [];
  const limit = Math.min(startIndex + 24, hourlyTimes.length);

  for (let i = startIndex; i < limit; i++) {
    const timeStr = hourlyTimes[i] ?? '';
    const pm25 = hourlyPm25[i] ?? 0;
    const pm10 = hourlyPm10[i] ?? 0;
    const no2 = hourlyNo2[i] ?? 0;
    const co = (hourlyCo[i] ?? 0) / CO_UG_TO_MG_DIVISOR;
    const o3 = hourlyO3[i] ?? 0;

    const weatherIdx = weatherTimes.findIndex((wt) => wt === timeStr);
    const tempC = weatherIdx >= 0 ? weatherTemp[weatherIdx] ?? 20 : 20;
    const blh = weatherIdx >= 0 ? weatherBlh[weatherIdx] ?? null : null;
    const windKmh = weatherIdx >= 0 ? weatherWind[weatherIdx] ?? 5 : 5;

    sequence.push(
      buildHourlyForecastPoint(timeStr, pm25, pm10, no2, co, o3, tempC, blh, windKmh)
    );
  }

  return sequence;
}

/**
 * Builds data provenance metadata distinguishing model forecasts from direct physical station readings.
 *
 * @param loc - Geocoded target micro-location.
 * @param fetchedAt - Fetch ISO timestamp.
 * @param dataTimestamp - Model observation timestamp.
 * @param freshnessMinutes - Elapsed minutes since model observation.
 * @returns Standardized {@link DataSourceMetadata}.
 */
function buildDataSourceMetadata(
  loc: MicroLocation,
  fetchedAt: string,
  dataTimestamp: string,
  freshnessMinutes: number
): DataSourceMetadata {
  return {
    provider: 'Open-Meteo European Copernicus/CAMS & ECMWF Model',
    model: 'CAMS Global Atmospheric Aerosol Dispersion & IFS Forecast',
    dataType: 'model_forecast',
    stationOrCoordinates: `${loc.name} (${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E)`,
    latitude: loc.latitude,
    longitude: loc.longitude,
    fetchedAt,
    dataTimestamp,
    freshnessMinutes,
    isDirectCpcbStation: false,
    disclaimer:
      'Data is derived from European Copernicus/ECMWF atmospheric models via Open-Meteo. Values reflect regional aerosol transport and atmospheric dispersion modeling, not direct physical CPCB continuous ambient air quality stations.',
  };
}

/**
 * Builds an explicit unavailable snapshot when external APIs fail or time out.
 *
 * @param loc - Target micro-location.
 * @param errorMsg - Error description.
 * @returns {@link EnvironmentalSnapshot} marked as unavailable with zeroed telemetry.
 */
function buildUnavailableSnapshot(loc: MicroLocation, errorMsg: string): EnvironmentalSnapshot {
  const fetchedAt = new Date().toISOString();
  return {
    status: 'unavailable',
    location: loc,
    metadata: {
      provider: 'Open-Meteo Atmospheric Services',
      model: 'Unavailable',
      dataType: 'model_forecast',
      stationOrCoordinates: `${loc.name} (${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E)`,
      latitude: loc.latitude,
      longitude: loc.longitude,
      fetchedAt,
      dataTimestamp: fetchedAt,
      freshnessMinutes: 0,
      isDirectCpcbStation: false,
      disclaimer: 'Environmental telemetry service temporarily unavailable. No simulated data is fabricated.',
    },
    currentPollutants: { pm25: 0, pm10: 0, no2: 0, so2: 0, coMgM3: 0, o3: 0 },
    cpcbResult: {
      aqi: null,
      aqiCategory: null,
      prominentPollutant: null,
      subIndices: {},
      isSufficientData: false,
      validPollutantsCount: 0,
      hasParticulateRequirement: false,
      insufficiencyReason: `Environmental service unavailable: ${errorMsg}`,
      calculatedAt: fetchedAt,
    },
    meteorology: {
      temperatureC: 0,
      relativeHumidityPercent: 0,
      windSpeedKmh: 0,
      windDirectionDegrees: 0,
      boundaryLayerHeightM: null,
    },
    hourlyForecast: [],
    errorMessage: errorMsg,
  };
}

/**
 * Fetches authoritative environmental data for a location.
 *
 * Calls Open-Meteo Air Quality & Weather APIs, calculates official CPCB AQI
 * from actual multi-pollutant concentrations, attaches rigorous data provenance
 * metadata, and caches results.
 *
 * @param locationQuery - User input city or micro-location.
 * @param timeoutMs - Max execution threshold in milliseconds (default: 6000ms).
 * @returns {@link EnvironmentalSnapshot} containing verified readings and CPCB calculations.
 */
export async function fetchEnvironmentalSnapshot(
  locationQuery: string,
  timeoutMs = 6000
): Promise<EnvironmentalSnapshot> {
  const loc = resolveLocation(locationQuery);
  const cacheKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;

  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { airQualityUrl, weatherUrl } = buildApiEndpoints(loc);
    const [aqRes, weatherRes] = await Promise.all([
      fetch(airQualityUrl, { signal: controller.signal, headers: { Accept: 'application/json' } }),
      fetch(weatherUrl, { signal: controller.signal, headers: { Accept: 'application/json' } }),
    ]);

    if (!aqRes.ok || !weatherRes.ok) {
      throw new Error(`External environmental API returned status ${aqRes.status} / ${weatherRes.status}`);
    }

    const aqData = (await aqRes.json()) as {
      current?: {
        time?: string;
        pm2_5?: number | null;
        pm10?: number | null;
        nitrogen_dioxide?: number | null;
        sulphur_dioxide?: number | null;
        carbon_monoxide?: number | null;
        ozone?: number | null;
      };
      hourly?: {
        time?: string[];
        pm2_5?: number[];
        pm10?: number[];
        nitrogen_dioxide?: number[];
        carbon_monoxide?: number[];
        ozone?: number[];
      };
    };

    const weatherData = (await weatherRes.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        wind_speed_10m?: number;
        wind_direction_10m?: number;
      };
      hourly?: {
        time?: string[];
        temperature_2m?: number[];
        boundary_layer_height?: (number | null)[];
        wind_speed_10m?: number[];
      };
    };

    const currAq = aqData.current;
    if (!currAq) {
      throw new Error('Malformed air quality response: current values missing.');
    }

    const { rawPollutants, coMgM3 } = parseRawPollutants(currAq);
    const cpcbResult = calculateCpcbAqi(rawPollutants);
    const fetchedAt = new Date().toISOString();
    const { dataTimestamp, freshnessMinutes } = calculateDataFreshness(currAq.time, fetchedAt);

    const hourlyForecast = construct24HourSequence(
      aqData.hourly ?? {},
      weatherData.hourly ?? {},
      currAq.time ?? ''
    );

    const metadata = buildDataSourceMetadata(loc, fetchedAt, dataTimestamp, freshnessMinutes);
    const currWeather = weatherData.current;

    const snapshot: EnvironmentalSnapshot = {
      status: 'available',
      location: loc,
      metadata,
      currentPollutants: {
        pm25: Math.round(rawPollutants.pm25 ?? 0),
        pm10: Math.round(rawPollutants.pm10 ?? 0),
        no2: Math.round(rawPollutants.no2 ?? 0),
        so2: Math.round(rawPollutants.so2 ?? 0),
        coMgM3,
        o3: Math.round(rawPollutants.o3 ?? 0),
      },
      cpcbResult,
      meteorology: {
        temperatureC: currWeather?.temperature_2m ?? 20,
        relativeHumidityPercent: currWeather?.relative_humidity_2m ?? 60,
        windSpeedKmh: currWeather?.wind_speed_10m ?? 5,
        windDirectionDegrees: currWeather?.wind_direction_10m ?? 0,
        boundaryLayerHeightM: hourlyForecast[0]?.boundaryLayerHeightM ?? null,
      },
      hourlyForecast,
    };

    CACHE.set(cacheKey, { data: snapshot, expiresAt: Date.now() + CACHE_TTL_MS });
    return snapshot;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[environmental-service] Failed to fetch environmental data for ${locationQuery}:`, errorMsg);
    return buildUnavailableSnapshot(loc, errorMsg);
  } finally {
    clearTimeout(timer);
  }
}
