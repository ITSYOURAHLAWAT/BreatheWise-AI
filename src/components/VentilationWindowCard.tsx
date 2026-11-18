/**
 * @file VentilationWindowCard.tsx
 * @description Dedicated alert card showcasing the safest 2-3 hour window of the day
 * to aerate living spaces based on diurnal smog dispersion patterns.
 *
 * Designed with inspiration from Llamacoder:
 * - High-impact visual presence with clean status chips
 * - Clear distinction between "Optimal Aeration Window" vs "No Safe Window / Keep Sealed"
 * - Step-by-step room flush protocol
 * - Interactive countdown / actionable timeline summary
 *
 * @example
 * <VentilationWindowCard window={plan.safeVentilationWindow} />
 */

import React from 'react';
import { Wind, AlertCircle, CheckCircle2, DoorOpen, Clock } from 'lucide-react';
import type { VentilationWindowCardProps } from '@/lib/types';

/**
 * `VentilationWindowCard` — Highlights today's safe indoor fresh-air ventilation window.
 *
 * @param props - {@link VentilationWindowCardProps}
 */
export function VentilationWindowCard({ window }: VentilationWindowCardProps): React.ReactElement {
  const isSafe = window.isSafeToVentilate;

  return (
    <article
      aria-label="Safe ventilation window recommendation"
      className={`relative overflow-hidden rounded-3xl border-2 p-6 sm:p-7 shadow-sm transition-all duration-200 animate-slide-up ${
        isSafe
          ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-white border-emerald-300'
          : 'bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-white border-amber-300'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Main badge & details */}
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
              isSafe
                ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white'
                : 'bg-gradient-to-br from-amber-500 to-orange-700 text-white'
            }`}
          >
            {isSafe ? <DoorOpen size={28} /> : <Wind size={28} />}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isSafe
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {isSafe ? (
                  <>
                    <CheckCircle2 size={13} aria-hidden="true" />
                    Recommended Window Available
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} aria-hidden="true" />
                    Cautionary Aeration Protocol
                  </>
                )}
              </span>

              <span className="text-xs font-semibold text-slate-500">
                {window.expectedAqi}
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              Safe Ventilation Window:{' '}
              <span className={isSafe ? 'text-emerald-700' : 'text-amber-700'}>
                {window.timeWindow}
              </span>
            </h3>

            <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
              {window.recommendation}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Pill Card */}
        <div className="lg:w-72 shrink-0">
          <div
            className={`rounded-2xl p-4 border backdrop-blur-md shadow-xs ${
              isSafe
                ? 'bg-white/80 border-emerald-200 text-emerald-950'
                : 'bg-white/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Action Strategy
              </span>
              <span>{isSafe ? '15–20 Mins' : 'Keep Sealed'}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                <span className="font-medium text-slate-700">Open opposite windows for cross-flow</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                <span className="font-medium text-slate-700">Run HEPA purifier on High 15 mins after</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                <span className="font-medium text-slate-700">Seal windows before 5:30 PM smog spike</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
