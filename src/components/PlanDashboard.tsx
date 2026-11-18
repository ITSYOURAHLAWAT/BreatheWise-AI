/**
 * @file PlanDashboard.tsx
 * @description The results dashboard rendered after a successful AI plan generation.
 * Redesigned with Llamacoder's layout inspiration:
 * - Top Welcome Banner with quick summary stats
 * - Hero AirQualityCard (CPCB 0–500 scale, PM2.5, spectrum progress bar)
 * - Safe Ventilation Window card with actionable protocol
 * - Interactive 24-Hour Diurnal AQI forecast timeline
 * - Impact Metrics Grid with trend indicators
 * - Daily Low-Emission Routines with categorized pills
 * - Practical Indoor Clean-Air Hacks
 * - Emergency Protocol for Severe AQI days
 *
 * @example
 * <PlanDashboard plan={aiResponse} city="Anand Vihar, New Delhi" />
 */

'use client';

import React from 'react';
import {
  CalendarDays,
  Home,
  Clock,
  ShieldAlert,
  Download,
  Sparkles,
  Leaf,
  CheckCircle2,
} from 'lucide-react';
import { AirQualityCard } from './AirQualityCard';
import { VentilationWindowCard } from './VentilationWindowCard';
import { HourlyForecast } from './HourlyForecast';
import { ImpactMetricsGrid } from './ImpactMetricsGrid';
import { RoutineList } from './RoutineList';
import { IndoorHacksList } from './IndoorHacksList';
import { EmergencyTips } from './EmergencyTips';
import { SectionHeader } from './SectionHeader';
import { isEmergencyLevel, getAqiConfig } from '@/lib/aqi-utils';
import type { AiResponse } from '@/lib/types';

/** Props for `PlanDashboard`. */
interface PlanDashboardProps {
  /** The validated AI response containing the full plan. */
  plan: AiResponse;
  /** The micro-location or city name entered by the user. */
  city: string;
}

/**
 * `PlanDashboard` — Full results layout component.
 * Composed from atomic section components for maximum maintainability.
 *
 * @param props - {@link PlanDashboardProps}
 */
export function PlanDashboard({ plan, city }: PlanDashboardProps): React.ReactElement {
  const isEmergency = isEmergencyLevel(plan.aqiCategory);
  const aqiConfig = getAqiConfig(plan.aqiCategory);

  /** Formats the generatedAt timestamp for display. */
  const formattedTime = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(plan.generatedAt));

  return (
    <main
      id="plan-results"
      aria-label="Your personalised air quality plan"
      className="space-y-8 animate-fade-in"
    >
      {/* ── Top Summary Header Banner (Inspired by Llamacoder) ── */}
      <section className="overflow-hidden rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-teal-200 shadow-inner">
                <Leaf size={24} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                  Synthesized Protection Plan
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                  Smog Defense for {city}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-semibold text-teal-100">
                <Sparkles size={12} className="text-teal-300" />
                Live 24-Hour Thermal Model
              </span>
            </div>
          </div>

          {/* Quick Header Stats Strip */}
          <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-white/15">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-200">Current CPCB Band</p>
              <p className="text-lg font-black text-white mt-0.5">
                {aqiConfig.label} ({plan.aqiValue} AQI)
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-200">Safe Ventilation Window</p>
              <p className="text-lg font-black text-white mt-0.5 truncate">
                {plan.safeVentilationWindow.timeWindow}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-200">Ventilation Status</p>
              <p className="text-lg font-black text-white mt-0.5 flex items-center gap-1.5">
                {plan.safeVentilationWindow.isSafeToVentilate ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    <span>Safe To Open Briefly</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} className="text-amber-300" />
                    <span>Keep Windows Sealed</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hero AQI Card (CPCB 0–500 Spectrum + PM2.5) ── */}
      <AirQualityCard
        aqiValue={plan.aqiValue}
        aqiCategory={plan.aqiCategory}
        alertMessage={plan.alertMessage}
        summaryHeadline={plan.summaryHeadline}
        city={city}
      />

      {/* ── Safe Ventilation Window Feature ── */}
      <section aria-label="Safe ventilation window">
        <VentilationWindowCard window={plan.safeVentilationWindow} />
      </section>

      {/* ── 24-Hour Hourly Forecast (Diurnal Inversion Cycle) ── */}
      <section aria-label="24-hour air quality forecast" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <SectionHeader
          title="24-Hour Diurnal AQI Forecast"
          subtitle={`Interactive hourly smog dispersion pattern calibrated for ${city}`}
          icon={<Clock size={20} />}
        />
        <HourlyForecast forecast={plan.hourlyForecast} />
      </section>

      {/* ── Impact Metrics ── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <ImpactMetricsGrid metrics={plan.impactMetrics} />
      </section>

      {/* ── Emergency Tips (conditional high placement on severe days) ── */}
      {isEmergency && (
        <section aria-label="Emergency smog protocol">
          <SectionHeader
            title="⚠️ Emergency Smog Protocol"
            subtitle="Critical actions required for today's severe air quality level"
            icon={<ShieldAlert size={20} />}
          />
          <EmergencyTips tips={plan.emergencyTips} />
        </section>
      )}

      {/* ── Daily Routines ── */}
      <section aria-label="Daily routines" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <SectionHeader
          title="Your Low-Emission Daily Routines"
          subtitle="Personalised actions timed for minimum pollution exposure"
          icon={<CalendarDays size={20} />}
        />
        <RoutineList routines={plan.lowEmissionRoutines} />
      </section>

      {/* ── Indoor Clean-Air Hacks ── */}
      <section aria-label="Indoor air quality improvements" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <SectionHeader
          title="Indoor Air Quality Sanctuary Hacks"
          subtitle="Cost-graded practical improvements to filter and protect indoor breathing spaces"
          icon={<Home size={20} />}
        />
        <IndoorHacksList hacks={plan.indoorHacks} />
      </section>

      {/* ── Emergency Tips (secondary placement on moderate/poor days) ── */}
      {!isEmergency && (
        <section aria-label="Emergency smog tips for severe days" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
          <SectionHeader
            title="Emergency Tips for Severe Days"
            subtitle="Keep these protocols ready if AQI deteriorates"
            icon={<ShieldAlert size={20} />}
          />
          <EmergencyTips tips={plan.emergencyTips} />
        </section>
      )}

      {/* ── Footer metadata ── */}
      <footer className="rounded-2xl border border-teal-100 bg-teal-50/70 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Plan generated:</span>{' '}
          {formattedTime} · Powered by Google Gemini 3.5 Flash · CPCB 6-Band Scale
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
          aria-label="Print or save your air quality plan as PDF"
        >
          <Download size={13} aria-hidden="true" />
          Save as PDF
        </button>
      </footer>
    </main>
  );
}
