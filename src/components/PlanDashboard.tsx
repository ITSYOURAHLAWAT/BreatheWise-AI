/**
 * @file PlanDashboard.tsx
 * @description The results dashboard rendered after a successful AI plan generation.
 *
 * Implements:
 * - Top Welcome Banner with quick summary stats
 * - Hero AirQualityCard (CPCB 0–500 scale, PM2.5, spectrum progress bar)
 * - Safe Ventilation Window card with actionable protocol
 * - Interactive 24-Hour Diurnal AQI forecast timeline
 * - Impact Metrics Grid with trend indicators
 * - Daily Low-Emission Routines with categorized pills
 * - Practical Indoor Clean-Air Hacks
 * - Emergency Protocol for Severe AQI days
 */

'use client';

import React from 'react';
import {
  CalendarDays,
  Home,
  Clock,
  ShieldAlert,
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
import { GrapAlertCard } from './GrapAlertCard';
import { EmergencyDirectorySection } from './EmergencyDirectorySection';
import { SectionHeader } from './SectionHeader';
import { isEmergencyLevel } from '@/lib/aqi-utils';
import { getGrapRegulation } from '@/lib/grap-regulations';
import { getEmergencyDirectory } from '@/lib/emergency-directory';
import type {
  AiResponse,
  EnvironmentalSnapshot,
  GrapRegulationInfo,
  EmergencyDirectoryResult,
} from '@/lib/types';

/** Props for `PlanDashboard`. */
interface PlanDashboardProps {
  /** The validated AI response containing the full plan. */
  readonly plan: AiResponse;
  /** The micro-location or city name entered by the user. */
  readonly city: string;
}

/**
 * Extracts validated GRAP regulations or falls back to deterministic rule engine.
 */
function extractGrapRegulation(plan: AiResponse): GrapRegulationInfo {
  return plan.grapRegulation ?? getGrapRegulation(plan.aqiValue);
}

/**
 * Extracts validated Emergency Directory or falls back to geographic registry.
 */
function extractEmergencyDirectory(plan: AiResponse, city: string): EmergencyDirectoryResult {
  return plan.emergencyDirectory ?? getEmergencyDirectory(city);
}

/**
 * Extracts verified Environmental Snapshot if available in the response.
 */
function extractEnvironmentalSnapshot(plan: AiResponse): EnvironmentalSnapshot | undefined {
  return plan.environmentalData;
}

/**
 * Formats ISO timestamp into localized Indian time.
 */
function formatKolkataTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(isoString));
}

/**
 * `DashboardTopBanner` — Hero greeting and summary statistics strip.
 */
function DashboardTopBanner({
  city,
  plan,
  formattedTime,
}: {
  readonly city: string;
  readonly plan: AiResponse;
  readonly formattedTime: string;
}): React.ReactElement {
  const isEmergency = isEmergencyLevel(plan.aqiCategory);

  return (
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
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {city} Air Action Plan
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-teal-100 border border-white/10">
            <Clock size={13} aria-hidden="true" />
            <span>Updated: {formattedTime}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/15 text-xs">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-xs">
            <span className="text-teal-200 block text-[11px] font-medium">Daily Routines</span>
            <span className="text-lg font-bold">{plan.lowEmissionRoutines.length} Action Items</span>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-xs">
            <span className="text-teal-200 block text-[11px] font-medium">Indoor Hacks</span>
            <span className="text-lg font-bold">{plan.indoorHacks.length} Solutions</span>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-xs">
            <span className="text-teal-200 block text-[11px] font-medium">Ventilation Window</span>
            <span className="text-lg font-bold truncate block">
              {plan.safeVentilationWindow.timeWindow}
            </span>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-xs">
            <span className="text-teal-200 block text-[11px] font-medium">Health Severity</span>
            <span className={`text-lg font-bold flex items-center gap-1 ${isEmergency ? 'text-red-300' : 'text-teal-100'}`}>
              <CheckCircle2 size={16} />
              {isEmergency ? 'Severe Advisory' : 'Active Protection'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * `PlanDashboard` — Full results layout component.
 *
 * @param props - {@link PlanDashboardProps}
 */
export function PlanDashboard({ plan, city }: PlanDashboardProps): React.ReactElement {
  const isEmergency = isEmergencyLevel(plan.aqiCategory);
  const grapRegulation = extractGrapRegulation(plan);
  const emergencyDirectory = extractEmergencyDirectory(plan, city);
  const environmentalSnapshot = extractEnvironmentalSnapshot(plan);
  const formattedTime = formatKolkataTime(plan.generatedAt);

  return (
    <main
      id="plan-results"
      aria-label="Your personalised air quality plan"
      className="space-y-8 animate-fade-in"
    >
      <DashboardTopBanner city={city} plan={plan} formattedTime={formattedTime} />

      <AirQualityCard
        aqiValue={plan.aqiValue}
        aqiCategory={plan.aqiCategory}
        alertMessage={plan.alertMessage}
        summaryHeadline={plan.summaryHeadline}
        city={city}
        environmentalSnapshot={environmentalSnapshot}
        prominentPollutant={plan.prominentPollutant}
      />

      <GrapAlertCard grap={grapRegulation} currentAqi={plan.aqiValue} />

      <EmergencyDirectorySection directory={emergencyDirectory} city={city} />

      <VentilationWindowCard window={plan.safeVentilationWindow} />

      {plan.hourlyForecast.length > 0 && (
        <HourlyForecast forecast={plan.hourlyForecast} />
      )}

      {plan.impactMetrics.length > 0 && (
        <section aria-label="Projected health and emission impact metrics">
          <SectionHeader
            title="Projected Exposure & Health Impact"
            subtitle="Quantified benefits of adhering to your personalized survival plan today."
          />
          <ImpactMetricsGrid metrics={plan.impactMetrics} />
        </section>
      )}

      {plan.lowEmissionRoutines.length > 0 && (
        <section aria-label="Your customized daily low-emission routines">
          <SectionHeader
            title="Optimized Daily Smog Schedule"
            subtitle="Tailored daily adjustments to bypass the worst particulate spikes in your micro-location."
            icon={<CalendarDays size={20} className="text-teal-600" />}
          />
          <RoutineList routines={plan.lowEmissionRoutines} />
        </section>
      )}

      {plan.indoorHacks.length > 0 && (
        <section aria-label="Indoor air purification and clean-air hacks">
          <SectionHeader
            title="Indoor Clean-Air Fortification Hacks"
            subtitle="Budget-friendly, highly actionable techniques to transform your living spaces into clean-air sanctuaries."
            icon={<Home size={20} className="text-teal-600" />}
          />
          <IndoorHacksList hacks={plan.indoorHacks} />
        </section>
      )}

      {isEmergency && plan.emergencyTips.length > 0 && (
        <section
          aria-label="Critical emergency protocol for severe air quality"
          className="rounded-3xl border-2 border-red-500/70 bg-gradient-to-br from-red-50 via-rose-50 to-white p-6 sm:p-8 shadow-sm"
        >
          <SectionHeader
            title="Critical Emergency Protocol (Severe AQI)"
            subtitle="Immediate precautionary directives when regional ambient pollution reaches critical thresholds."
            icon={<ShieldAlert size={22} className="text-red-600" />}
          />
          <EmergencyTips tips={plan.emergencyTips} />
        </section>
      )}
    </main>
  );
}
