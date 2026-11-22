/**
 * @file HourlyForecast.tsx
 * @description 24-Hour diurnal AQI forecast timeline component.
 * Features an interactive hour-selection design:
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
import { getAqiConfig, estimatePm25 } from '@/lib/aqi-utils';
import type { HourlyForecastProps, HourlyForecastItem } from '@/lib/types';

/** Ventilation recommendation state for an individual hour. */
interface HourVentilationState {
  readonly status: 'safe' | 'caution' | 'unsafe';
  readonly label: string;
  readonly badgeClass: string;
  readonly dotClass: string;
}

/**
 * Maps CPCB AQI to a ventilation recommendation state aligned with the scientific engine.
 *
 * @param aqi - Numerical CPCB AQI value.
 * @returns Standardised hour state descriptor.
 */
function getHourState(aqi: number): HourVentilationState {
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
 * Props for {@link HourlyTimelineCard}.
 */
interface HourlyTimelineCardProps {
  readonly item: HourlyForecastItem;
  readonly isSelected: boolean;
  readonly onSelect: (item: HourlyForecastItem) => void;
}

/**
 * Renders an individual hourly forecast button card within the timeline strip.
 *
 * @param props - Timeline card properties.
 * @returns React element.
 */
function HourlyTimelineCard({
  item,
  isSelected,
  onSelect,
}: HourlyTimelineCardProps): React.ReactElement {
  const config = getAqiConfig(item.aqiCategory);
  const state = getHourState(item.aqiValue);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-pressed={isSelected}
        className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 min-w-[115px] text-center transition-all duration-200 cursor-pointer text-left
          ${isSelected
            ? 'ring-2 ring-teal-600 shadow-md scale-102 bg-white border-teal-500'
            : 'hover:border-slate-300 hover:shadow-xs bg-white/90 border-slate-200'
          }`}
      >
        <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-600">
          <span className="flex items-center gap-1">
            <Clock size={11} aria-hidden="true" className="opacity-70" />
            {item.time}
          </span>
          <span className={`h-2 w-2 rounded-full ${state.dotClass}`} aria-hidden="true" />
        </div>

        <span className="text-xl my-0.5" aria-hidden="true">
          {config.emoji}
        </span>

        <div className="flex flex-col items-center">
          <span className="font-serif text-2xl font-black tabular-nums tracking-tight text-slate-900 leading-none">
            {item.aqiValue}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
            AQI · {config.label}
          </span>
        </div>

        <span className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${state.badgeClass}`}>
          {state.label}
        </span>
      </button>
    </li>
  );
}

/**
 * Props for {@link HourlyDetailInspectionDrawer}.
 */
interface HourlyDetailInspectionDrawerProps {
  readonly item: HourlyForecastItem;
}

/**
 * Renders the detail inspection drawer for the currently selected hour.
 *
 * @param props - Drawer properties.
 * @returns React element.
 */
function HourlyDetailInspectionDrawer({
  item,
}: HourlyDetailInspectionDrawerProps): React.ReactElement {
  const state = getHourState(item.aqiValue);
  const config = getAqiConfig(item.aqiCategory);
  const estPm25 = estimatePm25(item.aqiValue);

  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/50 via-white to-slate-50 p-5 shadow-xs transition-all animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-serif font-bold text-lg shadow-xs">
            <Clock size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-lg font-bold text-slate-900 leading-none">
                Hour Focus: {item.time}
              </h4>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${state.badgeClass}`}>
                {state.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              CPCB Band: <span className="font-semibold text-slate-800">{config.label} ({item.aqiValue} AQI)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Activity size={13} className="text-teal-600" />
            Est. PM2.5: ~{estPm25} µg/m³
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
            {item.shortNote}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * `HourlyForecast` — 24-Hour hourly AQI forecast timeline with interactive hour inspection.
 *
 * @param props - {@link HourlyForecastProps}
 * @returns React element.
 */
export function HourlyForecast({ forecast }: HourlyForecastProps): React.ReactElement {
  const [selectedHour, setSelectedHour] = useState<HourlyForecastItem | null>(() => {
    return forecast[0] ?? null;
  });

  const activeItem = selectedHour ?? forecast[0];

  return (
    <div className="space-y-4">
      <div
        role="region"
        aria-label="24-hour diurnal air quality forecast timeline"
        className="overflow-x-auto pb-2 scrollbar-thin"
      >
        <ol
          className="flex gap-2.5 min-w-max"
          aria-label="Hourly air quality forecast sequence"
        >
          {forecast.map((item, index) => (
            <HourlyTimelineCard
              key={`${item.time}-${index}`}
              item={item}
              isSelected={activeItem?.time === item.time}
              onSelect={setSelectedHour}
            />
          ))}
        </ol>
      </div>

      {activeItem ? <HourlyDetailInspectionDrawer item={activeItem} /> : null}

      <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
        <Info size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
        <span>Click any hour card in the sequence above to inspect specific diurnal thermal inversion data.</span>
      </div>
    </div>
  );
}
