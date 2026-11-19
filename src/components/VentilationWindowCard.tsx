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

/**
 * `VentilationWindowCard` — Highlights today's safe indoor fresh-air ventilation window.
 *
 * @param props - {@link VentilationWindowCardProps}
 */
export function VentilationWindowCard({ window }: VentilationWindowCardProps): React.ReactElement {
  const isSafe = window.isSafeToVentilate;
  const status = window.status ?? (isSafe ? 'safe' : 'unsafe');
  const confidence = window.confidence ?? 'high';

  // Extract contiguous intervals if provided
  const rawIntervals = window.contiguousIntervals as unknown as Array<{
    id: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    status: 'safe' | 'caution' | 'unsafe';
    averageAqi: number;
    averagePm25: number;
    recommendation: string;
  }> | undefined;

  // Extract indoor CO2 guidance if provided
  const co2Advice = window.indoorCo2Advice as unknown as {
    alertLevel: 'normal' | 'moderate' | 'critical';
    action: string;
    technicalDetails: string;
  } | undefined;

  const isCaution = status === 'caution';

  return (
    <article
      aria-label="Scientific safe ventilation window recommendation"
      className={`relative overflow-hidden rounded-3xl border-2 p-6 sm:p-7 shadow-sm transition-all duration-200 animate-slide-up ${
        isSafe
          ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-white border-emerald-300'
          : isCaution
          ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-white border-amber-300'
          : 'bg-gradient-to-br from-red-50/90 via-rose-50/60 to-white border-red-300'
      }`}
    >
      <div className="flex flex-col gap-6">
        {/* Top bar: Main icon + headline + status pills */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                isSafe
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white'
                  : isCaution
                  ? 'bg-gradient-to-br from-amber-500 to-orange-700 text-white'
                  : 'bg-gradient-to-br from-red-600 to-rose-800 text-white'
              }`}
            >
              {isSafe ? <DoorOpen size={28} /> : isCaution ? <Wind size={28} /> : <ShieldAlert size={28} />}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    isSafe
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : isCaution
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}
                >
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

                <span className="text-xs font-semibold text-slate-600">
                  {window.expectedAqi}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                Ventilation Window:{' '}
                <span
                  className={
                    isSafe
                      ? 'text-emerald-700'
                      : isCaution
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }
                >
                  {window.timeWindow}
                </span>
              </h3>

              <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                {window.recommendation}
              </p>

              {window.scientificReasoning && (
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white/60 rounded-xl p-2.5 border border-black/5 mt-1">
                  <span className="font-bold text-slate-800">Atmospheric Science:</span>{' '}
                  {window.scientificReasoning}
                </p>
              )}
            </div>
          </div>

          {/* Action Strategy Card */}
          <div className="lg:w-80 shrink-0">
            <div
              className={`rounded-2xl p-4 border backdrop-blur-md shadow-xs ${
                isSafe
                  ? 'bg-white/85 border-emerald-200 text-emerald-950'
                  : isCaution
                  ? 'bg-white/85 border-amber-200 text-amber-950'
                  : 'bg-white/85 border-red-200 text-red-950'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Operational Protocol
                </span>
                <span>{isSafe ? '20–30 Mins' : isCaution ? '10–15 Mins' : 'Keep Sealed'}</span>
              </div>

              <div className="space-y-2 text-xs">
                {isSafe ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      <span className="font-medium text-slate-700">Open opposing windows for natural cross-flow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      <span className="font-medium text-slate-700">Displaces accumulated indoor CO2 completely</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      <span className="font-medium text-slate-700">Reseal before evening boundary layer drops</span>
                    </div>
                  </>
                ) : isCaution ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      <span className="font-medium text-slate-700">Open windows strictly for 10–15 minutes only</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      <span className="font-medium text-slate-700">Run HEPA purifier on Turbo for 30 mins after</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      <span className="font-medium text-slate-700">Avoid unmonitored or extended window opening</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                      <span className="font-medium text-slate-700">Keep windows &amp; balcony doors firmly shut</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                      <span className="font-medium text-slate-700">Run HEPA purifier continuously on Auto/High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                      <span className="font-medium text-slate-700">Seal door gaps with draft stoppers / towels</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Contiguous 24-Hour Intervals Timeline (if available) */}
        {rawIntervals && rawIntervals.length > 0 && (
          <div className="pt-3 border-t border-black/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers size={14} className="text-teal-600" />
                24-Hour Contiguous Ventilation Intervals
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Scientific Dispersion Schedule
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rawIntervals.map((interval) => {
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

                    <p className="text-[11px] text-slate-600 leading-tight">
                      {interval.recommendation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom: Indoor CO2 vs. Outdoor Particulate Trade-off */}
        {co2Advice && (
          <div className="rounded-2xl bg-white/70 border border-black/5 p-4 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider">
              <Activity size={14} className="text-teal-600" />
              <span>Indoor CO2 vs. Outdoor Aerosol Infiltration Trade-off</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Action:</strong> {co2Advice.action}
            </p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              <strong className="text-slate-700">Scientific Basis:</strong> {co2Advice.technicalDetails}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
