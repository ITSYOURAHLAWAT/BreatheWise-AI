/**
 * @file VentilationWindowCard.tsx
 * @description Dedicated scientific alert card showcasing the safest windows of the day
 * to aerate living spaces based on multi-parameter atmospheric dispersion modeling.
 *
 * Grounded in:
 *  - CPCB 6-Band particulate exposure limits (PM2.5 / PM10)
 *  - Boundary layer height (PBLH) & thermal inversion dynamics
 *  - Surface wind speed & dispersion indices
 *  - Indoor CO2 accumulation vs. outdoor toxic particle infiltration trade-off
 *  - Explicit confidence and contiguous interval timeline
 */

import React from 'react';
import {
  Wind,
  AlertCircle,
  CheckCircle2,
  DoorOpen,
  Clock,
  ShieldAlert,
  HelpCircle,
  Layers,
  Activity,
} from 'lucide-react';
import type { VentilationWindowCardProps } from '@/lib/types';

/** Strongly-typed shape for contiguous intervals in the UI view. */
interface ContiguousIntervalItem {
  id: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: 'safe' | 'caution' | 'unsafe';
  averageAqi: number;
  averagePm25: number;
  recommendation: string;
}

/** Strongly-typed shape for indoor CO2 advice block. */
interface IndoorCo2AdviceItem {
  alertLevel: 'normal' | 'moderate' | 'critical';
  action: string;
  technicalDetails: string;
}

/** Theme classes based on ventilation status. */
function getVentilationTheme(isSafe: boolean, isCaution: boolean) {
  if (isSafe) {
    return {
      card: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-white border-emerald-300',
      icon: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white',
      badge: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      title: 'text-emerald-700',
      protocolBorder: 'border-emerald-200 text-emerald-950',
      dotColor: 'bg-emerald-600',
    };
  }
  if (isCaution) {
    return {
      card: 'bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-white border-amber-300',
      icon: 'bg-gradient-to-br from-amber-500 to-orange-700 text-white',
      badge: 'bg-amber-100 text-amber-900 border border-amber-300',
      title: 'text-amber-700',
      protocolBorder: 'border-amber-200 text-amber-950',
      dotColor: 'bg-amber-600',
    };
  }
  return {
    card: 'bg-gradient-to-br from-red-50/90 via-rose-50/60 to-white border-red-300',
    icon: 'bg-gradient-to-br from-red-600 to-rose-800 text-white',
    badge: 'bg-red-100 text-red-900 border border-red-300',
    title: 'text-red-700',
    protocolBorder: 'border-red-200 text-red-950',
    dotColor: 'bg-red-600',
  };
}

/**
 * `OperationalProtocolCard` — Concise tactical instructions for ventilating or keeping sealed.
 */
function OperationalProtocolCard({
  isSafe,
  isCaution,
  protocolBorder,
  dotColor,
}: {
  readonly isSafe: boolean;
  readonly isCaution: boolean;
  readonly protocolBorder: string;
  readonly dotColor: string;
}): React.ReactElement {
  const durationLabel = isSafe ? '20–30 Mins' : isCaution ? '10–15 Mins' : 'Keep Sealed';
  const steps = isSafe
    ? [
        'Open opposing windows for natural cross-flow',
        'Displaces accumulated indoor CO2 completely',
        'Reseal before evening boundary layer drops',
      ]
    : isCaution
    ? [
        'Open windows strictly for 10–15 minutes only',
        'Run HEPA purifier on Turbo for 30 mins after',
        'Avoid unmonitored or extended window opening',
      ]
    : [
        'Keep windows & balcony doors firmly shut',
        'Run HEPA purifier continuously on Auto/High',
        'Seal door gaps with draft stoppers / towels',
      ];

  return (
    <div className="lg:w-80 shrink-0">
      <div className={`rounded-2xl p-4 border bg-white/85 backdrop-blur-md shadow-xs ${protocolBorder}`}>
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Operational Protocol
          </span>
          <span>{durationLabel}</span>
        </div>
        <div className="space-y-2 text-xs">
          {steps.map((step) => (
            <div key={step} className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
              <span className="font-medium text-slate-700">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * `ContiguousIntervalTimeline` — Sequence of aggregated intervals across the 24-hour cycle.
 */
function ContiguousIntervalTimeline({
  intervals,
}: {
  readonly intervals: readonly ContiguousIntervalItem[];
}): React.ReactElement {
  return (
    <div className="pt-3 border-t border-black/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Layers size={14} className="text-teal-600" />
          24-Hour Contiguous Ventilation Intervals
        </span>
        <span className="text-[11px] text-slate-500 font-medium">Scientific Dispersion Schedule</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {intervals.map((interval) => {
          const isIntSafe = interval.status === 'safe';
          const isIntCaution = interval.status === 'caution';

          return (
            <div
              key={interval.id}
              className={`rounded-2xl border p-3 text-xs space-y-1.5 bg-white/70 backdrop-blur-sm transition-all ${
                isIntSafe
                  ? 'border-emerald-300 ring-1 ring-emerald-200'
                  : isIntCaution
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-red-200 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {interval.startTime} – {interval.endTime}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                    isIntSafe
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : isIntCaution
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {isIntSafe ? 'Safe' : isIntCaution ? 'Caution' : 'Sealed'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                <span>Avg AQI: <strong className="text-slate-800">{interval.averageAqi}</strong></span>
                <span>·</span>
                <span>PM2.5: <strong className="text-slate-800">{interval.averagePm25} µg/m³</strong></span>
              </div>

              <p className="text-[11px] text-slate-600 leading-tight">{interval.recommendation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * `IndoorCo2AdviceBox` — Technical trade-off guidance comparing indoor CO2 vs outdoor PM2.5.
 */
function IndoorCo2AdviceBox({ advice }: { readonly advice: IndoorCo2AdviceItem }): React.ReactElement {
  return (
    <div className="rounded-2xl bg-white/70 border border-black/5 p-4 text-xs space-y-1">
      <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider">
        <Activity size={14} className="text-teal-600" />
        <span>Indoor CO2 vs. Outdoor Aerosol Infiltration Trade-off</span>
      </div>
      <p className="text-slate-700 leading-relaxed">
        <strong className="text-slate-900">Action:</strong> {advice.action}
      </p>
      <p className="text-slate-500 text-[11px] leading-relaxed">
        <strong className="text-slate-700">Scientific Basis:</strong> {advice.technicalDetails}
      </p>
    </div>
  );
}

/**
 * `VentilationWindowCard` — Highlights today's safe indoor fresh-air ventilation window.
 *
 * @param props - {@link VentilationWindowCardProps}
 */
export function VentilationWindowCard({ window }: VentilationWindowCardProps): React.ReactElement {
  const isSafe = window.isSafeToVentilate;
  const status = window.status ?? (isSafe ? 'safe' : 'unsafe');
  const confidence = window.confidence ?? 'high';
  const isCaution = status === 'caution';

  const theme = getVentilationTheme(isSafe, isCaution);

  const rawIntervals = Array.isArray(window.contiguousIntervals)
    ? (window.contiguousIntervals as unknown as ContiguousIntervalItem[])
    : undefined;

  const co2Advice =
    window.indoorCo2Advice && typeof window.indoorCo2Advice === 'object'
      ? (window.indoorCo2Advice as unknown as IndoorCo2AdviceItem)
      : undefined;

  return (
    <article
      aria-label="Scientific safe ventilation window recommendation"
      className={`relative overflow-hidden rounded-3xl border-2 p-6 sm:p-7 shadow-sm transition-all duration-200 animate-slide-up ${theme.card}`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${theme.icon}`}
            >
              {isSafe ? <DoorOpen size={28} /> : isCaution ? <Wind size={28} /> : <ShieldAlert size={28} />}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${theme.badge}`}>
                  {isSafe ? (
                    <>
                      <CheckCircle2 size={13} aria-hidden="true" />
                      Safe Aeration Available
                    </>
                  ) : isCaution ? (
                    <>
                      <AlertCircle size={13} aria-hidden="true" />
                      Cautionary Brief Aeration
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={13} aria-hidden="true" />
                      Windows Must Remain Sealed
                    </>
                  )}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                  <HelpCircle size={11} className="text-slate-500" />
                  Confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
                </span>

                <span className="text-xs font-semibold text-slate-600">{window.expectedAqi}</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                Ventilation Window: <span className={theme.title}>{window.timeWindow}</span>
              </h3>

              <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">{window.recommendation}</p>

              {window.scientificReasoning && (
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white/60 rounded-xl p-2.5 border border-black/5 mt-1">
                  <span className="font-bold text-slate-800">Atmospheric Science:</span> {window.scientificReasoning}
                </p>
              )}
            </div>
          </div>

          <OperationalProtocolCard
            isSafe={isSafe}
            isCaution={isCaution}
            protocolBorder={theme.protocolBorder}
            dotColor={theme.dotColor}
          />
        </div>

        {rawIntervals && rawIntervals.length > 0 && (
          <ContiguousIntervalTimeline intervals={rawIntervals} />
        )}

        {co2Advice && <IndoorCo2AdviceBox advice={co2Advice} />}
      </div>
    </article>
  );
}
