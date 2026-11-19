/**
 * @file HourlyForecast.tsx
 * @description 24-Hour diurnal AQI forecast timeline component.
 * Upgraded with Llamacoder's interactive hour-selection design:
 * - Interactive horizontal hourly timeline
 * - State badge (Recommended / Caution / Avoid)
 * - Detail inspection drawer displaying AQI, estimated PM2.5, meteorological context,
 *   and specific actionable reasoning for that hour.
 *
 * @example
 * <HourlyForecast forecast={plan.hourlyForecast} />
 */

import React, { useState } from 'react';
import { Clock, Info, Activity, Wind } from 'lucide-react';
import { getAqiConfig } from '@/lib/aqi-utils';
import type { HourlyForecastProps, HourlyForecastItem } from '@/lib/types';

/**
 * Maps CPCB AQI value to estimated PM2.5 concentration using official CPCB piecewise breakpoints.
 */
function estimatePm25FromAqi(aqi: number): number {
  if (aqi <= 50) return Math.round((aqi / 50) * 30);
  if (aqi <= 100) return Math.round(30 + ((aqi - 50) / 50) * 30);
  if (aqi <= 200) return Math.round(60 + ((aqi - 100) / 100) * 30);
  if (aqi <= 300) return Math.round(90 + ((aqi - 200) / 100) * 30);
  if (aqi <= 400) return Math.round(120 + ((aqi - 300) / 100) * 130);
  return Math.round(250 + ((Math.min(500, aqi) - 400) / 100) * 150);
}

/**
 * Maps CPCB AQI to a ventilation recommendation state aligned with the scientific engine.
 */
function getHourState(aqi: number): {
  status: 'safe' | 'caution' | 'unsafe';
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  if (aqi <= 100) {
    return {
      status: 'safe',
      label: 'Recommended',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotClass: 'bg-emerald-500',
    };
  }
  if (aqi <= 250) {
    return {
      status: 'caution',
      label: 'Caution / Brief',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      dotClass: 'bg-amber-500',
    };
  }
  return {
    status: 'unsafe',
    label: 'Avoid Exposure',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    dotClass: 'bg-red-500',
  };
}

/**
 * `HourlyForecast` — 24-Hour hourly AQI forecast timeline with interactive hour inspection.
 *
 * @param props - {@link HourlyForecastProps}
 */
export function HourlyForecast({ forecast }: HourlyForecastProps): React.ReactElement {
  const [selectedHour, setSelectedHour] = useState<HourlyForecastItem | null>(() => {
    return forecast[0] ?? null;
  });

  const activeItem = selectedHour ?? forecast[0];

  return (
    <div className="space-y-4">
      {/* Scrollable hourly sequence cards */}
      <div
        role="region"
        aria-label="24-hour diurnal air quality forecast timeline"
        className="overflow-x-auto pb-2 scrollbar-thin"
      >
        <ol
          className="flex gap-2.5 min-w-max"
          aria-label="Hourly air quality forecast sequence"
        >
          {forecast.map((item, index) => {
            const config = getAqiConfig(item.aqiCategory);
            const state = getHourState(item.aqiValue);
            const isSelected = activeItem?.time === item.time;

            return (
              <li key={`${item.time}-${index}`}>
                <button
                  type="button"
                  onClick={() => setSelectedHour(item)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 min-w-[115px] text-center transition-all duration-200 cursor-pointer text-left
                    ${isSelected
                      ? 'ring-2 ring-teal-600 shadow-md scale-102 bg-white border-teal-500'
                      : 'hover:border-slate-300 hover:shadow-xs bg-white/90 border-slate-200'
                    }`}
                >
                  {/* Time + Status dot */}
                  <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock size={11} aria-hidden="true" className="opacity-70" />
                      {item.time}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${state.dotClass}`} aria-hidden="true" />
                  </div>

                  {/* Emoji indicator */}
                  <span className="text-xl my-0.5" aria-hidden="true">
                    {config.emoji}
                  </span>

                  {/* AQI Numeral */}
                  <div className="flex flex-col items-center">
                    <span className="font-serif text-2xl font-black tabular-nums tracking-tight text-slate-900 leading-none">
                      {item.aqiValue}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                      AQI · {config.label}
                    </span>
                  </div>

                  {/* State badge */}
                  <span className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${state.badgeClass}`}>
                    {state.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Selected Hour Detail Inspection Panel */}
      {activeItem && (
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/50 via-white to-slate-50 p-5 shadow-xs transition-all animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-serif font-bold text-lg shadow-xs">
                <Clock size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-lg font-bold text-slate-900 leading-none">
                    Hour Focus: {activeItem.time}
                  </h4>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${getHourState(activeItem.aqiValue).badgeClass}`}>
                    {getHourState(activeItem.aqiValue).label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  CPCB Band: <span className="font-semibold text-slate-800">{getAqiConfig(activeItem.aqiCategory).label} ({activeItem.aqiValue} AQI)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
                <Activity size={13} className="text-teal-600" />
                Est. PM2.5: ~{estimatePm25FromAqi(activeItem.aqiValue)} µg/m³
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <Wind size={18} className="mt-0.5 text-teal-600 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Atmospheric Dynamics &amp; Tactical Guidance
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                {activeItem.shortNote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
        <Info size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
        <span>Click any hour card in the sequence above to inspect specific diurnal thermal inversion data.</span>
      </div>
    </div>
  );
}
