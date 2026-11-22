/**
 * @file AirQualityCard.tsx
 * @description Hero card displayed at the top of the results dashboard.
 *
 * Implements:
 * - High-contrast typography with serif AQI numerals
 * - CPCB official 6-band spectrum progress bar (0 to 500)
 * - Particulate matter breakdown (PM2.5 equivalent)
 * - Dynamic health guidance block with responsive layout
 * - WCAG AAA compliant contrast targets
 */

import React from 'react';
import { MapPin, AlertTriangle, Activity, Database, Clock, Wind } from 'lucide-react';
import { getAqiConfig, isEmergencyLevel, estimatePm25, getCpcbHealthImpact } from '@/lib/aqi-utils';
import { AqiBadge } from './AqiBadge';
import type { AirQualityCardProps, AqiDisplayConfig } from '@/lib/types';

/** Color stops for the CPCB spectrum bar across the 6 bands. */
function getProgressColor(aqi: number): string {
  if (aqi <= 50) return '#10b981';
  if (aqi <= 100) return '#14b8a6';
  if (aqi <= 200) return '#f59e0b';
  if (aqi <= 300) return '#f97316';
  if (aqi <= 400) return '#ef4444';
  return '#991b1b';
}

/**
 * `CpcbProgressBar` — Progress indicator mapped strictly across the 0–500 CPCB spectrum.
 */
function CpcbProgressBar({ aqiValue }: { readonly aqiValue: number }): React.ReactElement {
  const percentage = Math.min(100, Math.max(0, (aqiValue / 500) * 100));

  return (
    <div className="pt-2">
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span>0 (Good)</span>
        <span className="font-bold uppercase tracking-wider text-slate-700">Official CPCB Scale (0 – 500)</span>
        <span>500 (Severe)</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={aqiValue}
        aria-valuemin={0}
        aria-valuemax={500}
        aria-label="Air Quality Index on the CPCB scale"
        className="h-3 w-full overflow-hidden rounded-full bg-white/80 p-0.5 ring-1 ring-inset ring-slate-300/80 shadow-inner"
      >
        <div
          className="h-full rounded-full transition-all duration-700 motion-reduce:transition-none"
          style={{
            width: `${percentage}%`,
            background: getProgressColor(aqiValue),
          }}
        />
      </div>

      <div className="mt-2 grid grid-cols-6 gap-1 text-[9px] text-center font-bold text-slate-600">
        <span className="rounded bg-emerald-200/70 py-0.5 text-emerald-900">0-50</span>
        <span className="rounded bg-teal-200/70 py-0.5 text-teal-900">51-100</span>
        <span className="rounded bg-amber-200/70 py-0.5 text-amber-900">101-200</span>
        <span className="rounded bg-orange-200/70 py-0.5 text-orange-900">201-300</span>
        <span className="rounded bg-red-200/70 py-0.5 text-red-900">301-400</span>
        <span className="rounded bg-red-300/80 py-0.5 text-red-950">401-500</span>
      </div>
    </div>
  );
}

/**
 * `TelemetryStatList` — Compact list of physical particulate and provenance indicators.
 */
function TelemetryStatList({
  pm25,
  pm10,
  sourceLabel,
  prominent,
}: {
  readonly pm25: number;
  readonly pm10: number | null;
  readonly sourceLabel: string;
  readonly prominent: string;
}): React.ReactElement {
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <Activity size={14} className="text-slate-500" aria-hidden="true" />
        <span className="text-slate-600 font-medium">PM2.5:</span>
        <span className="font-bold text-slate-900">{pm25} µg/m³</span>
        {pm10 !== null && <span className="text-[10px] text-slate-500">(PM10: {pm10} µg/m³)</span>}
      </div>
      <div className="flex items-center gap-2">
        <Database size={14} className="text-slate-500" aria-hidden="true" />
        <span className="text-slate-600 font-medium">Source:</span>
        <span className="font-semibold text-slate-800">{sourceLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-slate-500" aria-hidden="true" />
        <span className="text-slate-600 font-medium">Prominent:</span>
        <span className="font-bold text-teal-800 uppercase">{prominent}</span>
      </div>
    </div>
  );
}

/**
 * `HealthGuidanceBlock` — Accessible clinical guidance container.
 */
function HealthGuidanceBlock({
  config,
  guidance,
}: {
  readonly config: AqiDisplayConfig;
  readonly guidance: string;
}): React.ReactElement {
  return (
    <div className="md:col-span-7 rounded-2xl bg-white/60 backdrop-blur-md border border-black/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <Wind size={16} className={config.textClass} aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Health &amp; Exposure Guidance
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{guidance}</p>
    </div>
  );
}

/**
 * `AirQualityCard` — The primary hero card for today's AQI overview.
 *
 * @param props - {@link AirQualityCardProps}
 */
export function AirQualityCard({
  aqiValue,
  aqiCategory,
  alertMessage,
  summaryHeadline,
  city,
  environmentalSnapshot,
  prominentPollutant,
}: AirQualityCardProps): React.ReactElement {
  const config = getAqiConfig(aqiCategory);
  const isEmergency = isEmergencyLevel(aqiCategory);

  const isEnvAvailable = environmentalSnapshot?.status === 'available';
  const pm25 =
    isEnvAvailable && environmentalSnapshot.currentPollutants.pm25 > 0
      ? environmentalSnapshot.currentPollutants.pm25
      : estimatePm25(aqiValue);

  const pm10 =
    isEnvAvailable && environmentalSnapshot.currentPollutants.pm10 > 0
      ? environmentalSnapshot.currentPollutants.pm10
      : null;

  const prominent = prominentPollutant ?? environmentalSnapshot?.cpcbResult.prominentPollutant ?? 'pm25';
  const healthGuidance = getCpcbHealthImpact(aqiCategory);
  const sourceLabel = isEnvAvailable ? 'Open-Meteo (Copernicus CAMS)' : 'CPCB Deterministic Model';

  return (
    <article
      aria-label={`Air quality status for ${city}`}
      className={`relative overflow-hidden rounded-3xl border-2 p-6 sm:p-8 shadow-sm transition-all animate-slide-up ${config.bgClass} ${config.borderClass}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ background: isEmergency ? '#ef4444' : '#0d9488' }}
      />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${config.textClass}`}>
              <MapPin size={14} aria-hidden="true" className="shrink-0" />
              <span>{city}</span>
            </div>
            <AqiBadge category={aqiCategory} value={aqiValue} size="md" />
          </div>

          <h1 className={`font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight ${config.textClass} text-balance`}>
            {summaryHeadline}
          </h1>

          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-white/70 backdrop-blur-md border border-black/5 p-3.5 shadow-xs"
          >
            <AlertTriangle
              size={18}
              className={`mt-0.5 shrink-0 ${isEmergency ? 'text-red-600' : 'text-amber-600'}`}
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-slate-800 leading-snug">{alertMessage}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12 md:items-center pt-2">
          <div className="md:col-span-5 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Official CPCB AQI
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`font-serif text-6xl sm:text-7xl font-black leading-none tabular-nums tracking-tight ${config.textClass}`}>
                  {aqiValue}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  / 500
                </span>
              </div>
              <span className={`inline-block mt-2 font-bold text-sm ${config.textClass}`}>
                Band: {config.label}
              </span>
            </div>

            <div className="hidden sm:block h-20 w-px bg-slate-300/60" aria-hidden="true" />

            <TelemetryStatList pm25={pm25} pm10={pm10} sourceLabel={sourceLabel} prominent={prominent} />
          </div>

          <HealthGuidanceBlock config={config} guidance={healthGuidance} />
        </div>

        <CpcbProgressBar aqiValue={aqiValue} />
      </div>
    </article>
  );
}
