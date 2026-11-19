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

/** Resolves any user-entered text to the closest known micro-location or defaults to Central Delhi. */
export function resolveLocation(input: string): MicroLocation {
  const norm = input.trim().toLowerCase();
  if (!norm) {
    return KNOWN_LOCATIONS.find((l) => l.name === 'Delhi')!;
  }

  // Exact or prefix match
  for (const loc of KNOWN_LOCATIONS) {
    const locLower = loc.name.toLowerCase();
    if (norm === locLower || norm.includes(locLower) || locLower.includes(norm)) {
      return loc;
    }
  }

  // Common aliases
  if (norm.includes('ncr') || norm.includes('new delhi')) {
    return KNOWN_LOCATIONS.find((l) => l.name === 'Delhi')!;
  }
  if (norm.includes('gurgaon')) {
    return KNOWN_LOCATIONS.find((l) => l.name === 'Gurugram')!;
  }
  if (norm.includes('noida')) {
    return KNOWN_LOCATIONS.find((l) => l.name === 'Noida Sector 62')!;
  }
  if (norm.includes('bangalore')) {
    return KNOWN_LOCATIONS.find((l) => l.name === 'Bengaluru')!;
  }

  // Default to Delhi NCT
  return {
    name: input.trim(),
    region: 'India',
    latitude: 28.6139,
    longitude: 77.2090,
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
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.latitude}&longitude=${loc.longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=Asia%2FKolkata&forecast_days=2`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,boundary_layer_height&timezone=Asia%2FKolkata&forecast_days=2`;

    const [aqRes, weatherRes] = await Promise.all([
      fetch(airQualityUrl, { signal: controller.signal, headers: { Accept: 'application/json' } }),
      fetch(weatherUrl, { signal: controller.signal, headers: { Accept: 'application/json' } }),
    ]);

    if (!aqRes.ok || !weatherRes.ok) {
      throw new Error(`External environmental API returned status ${aqRes.status} / ${weatherRes.status}`);
    }

    const aqData = await aqRes.json();
    const weatherData = await weatherRes.json();

    const currAq = aqData.current;
    const currWeather = weatherData.current;

    if (!currAq) {
      throw new Error('Malformed air quality response: current values missing.');
    }

    // Convert Open-Meteo CO (µg/m³) to CPCB standard (mg/m³)
    const coMgM3 = typeof currAq.carbon_monoxide === 'number'
      ? Number((currAq.carbon_monoxide / 1000).toFixed(2))
      : 0;

    const rawPollutants: RawPollutantConcentrations = {
      pm25: currAq.pm2_5 ?? null,
      pm10: currAq.pm10 ?? null,
      no2: currAq.nitrogen_dioxide ?? null,
      so2: currAq.sulphur_dioxide ?? null,
      co: coMgM3,
      o3: currAq.ozone ?? null,
    };

    // Calculate official Indian CPCB National AQI from actual pollutant concentrations
    const cpcbResult = calculateCpcbAqi(rawPollutants);

    const fetchedAt = new Date().toISOString();
    const dataTimestamp = currAq.time ? `${currAq.time}:00+05:30` : fetchedAt;
    const dataTimeMs = new Date(dataTimestamp).getTime();
    const freshnessMinutes = Math.max(0, Math.round((Date.now() - (Number.isNaN(dataTimeMs) ? Date.now() : dataTimeMs)) / 60000));

    // Construct 24-hour sequence starting from current hour
    const hourlyForecast: HourlyEnvironmentalPoint[] = [];
    const hourlyTimes: string[] = aqData.hourly?.time ?? [];
    const hourlyPm25: number[] = aqData.hourly?.pm2_5 ?? [];
    const hourlyPm10: number[] = aqData.hourly?.pm10 ?? [];
    const hourlyNo2: number[] = aqData.hourly?.nitrogen_dioxide ?? [];
    const hourlyCo: number[] = aqData.hourly?.carbon_monoxide ?? [];
    const hourlyO3: number[] = aqData.hourly?.ozone ?? [];

    const weatherHourlyTimes: string[] = weatherData.hourly?.time ?? [];
    const weatherHourlyTemp: number[] = weatherData.hourly?.temperature_2m ?? [];
    const weatherHourlyBlh: (number | null)[] = weatherData.hourly?.boundary_layer_height ?? [];
    const weatherHourlyWind: number[] = weatherData.hourly?.wind_speed_10m ?? [];

    // Find current hour index
    const currTimeStr = currAq.time ?? '';
    let startIndex = hourlyTimes.findIndex((t) => t === currTimeStr);
    if (startIndex < 0) startIndex = 0;

    for (let i = startIndex; i < Math.min(startIndex + 24, hourlyTimes.length); i++) {
      const timeStr = hourlyTimes[i] ?? '';
      const pm25Val = hourlyPm25[i] ?? 0;
      const pm10Val = hourlyPm10[i] ?? 0;
      const no2Val = hourlyNo2[i] ?? 0;
      const coVal = (hourlyCo[i] ?? 0) / 1000;
      const o3Val = hourlyO3[i] ?? 0;

      const hourCalc = calculateCpcbAqi({
        pm25: pm25Val,
        pm10: pm10Val,
        no2: no2Val,
        co: coVal,
        o3: o3Val,
      });

      // Match weather by index or time string
      const weatherIdx = weatherHourlyTimes.findIndex((wt) => wt === timeStr);
      const tempC = weatherIdx >= 0 ? weatherHourlyTemp[weatherIdx] ?? 20 : 20;
      const blh = weatherIdx >= 0 ? weatherHourlyBlh[weatherIdx] ?? null : null;
      const windKmh = weatherIdx >= 0 ? weatherHourlyWind[weatherIdx] ?? 5 : 5;

      // Format display time (e.g. "7:00 PM" or "8:00 AM")
      const parsedDate = new Date(`${timeStr}:00+05:30`);
      const displayTime = !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
        : timeStr;

      hourlyForecast.push({
        timeIso: timeStr,
        displayTime,
        cpcbAqi: hourCalc.aqi,
        cpcbCategory: hourCalc.aqiCategory,
        pm25: Math.round(pm25Val),
        pm10: Math.round(pm10Val),
        temperatureC: tempC,
        boundaryLayerHeightM: blh,
        windSpeedKmh: windKmh,
      });
    }

    const metadata: DataSourceMetadata = {
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
      disclaimer: 'Data is derived from European Copernicus/ECMWF atmospheric models via Open-Meteo. Values reflect regional aerosol transport and atmospheric dispersion modeling, not direct physical CPCB continuous ambient air quality stations.',
    };

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

    // Store in cache
    CACHE.set(cacheKey, {
      data: snapshot,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return snapshot;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[environmental-service] Failed to fetch environmental data for ${locationQuery}:`, errorMsg);

    // Return explicit unavailable state — never invent fake readings
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
      currentPollutants: {
        pm25: 0,
        pm10: 0,
        no2: 0,
        so2: 0,
        coMgM3: 0,
        o3: 0,
      },
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
  } finally {
    clearTimeout(timer);
  }
}
