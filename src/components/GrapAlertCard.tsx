/**
 * @file GrapAlertCard.tsx
 * @description Renders statutory Commission for Air Quality Management (CAQM)
 * Graded Response Action Plan (GRAP) regulatory stage, restrictions, and citizen directives.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Car,
  HardHat,
  GraduationCap,
  Bus,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import type { GrapRegulationInfo } from '@/lib/types';

interface GrapAlertCardProps {
  readonly regulation: GrapRegulationInfo;
}

export function GrapAlertCard({ regulation }: GrapAlertCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSevere = regulation.stage === 'STAGE_3' || regulation.stage === 'STAGE_4';
  const isStageActive = regulation.stage !== 'NONE';

  return (
    <article
      aria-label="Statutory CAQM GRAP Regulatory Advisory"
      className={`rounded-3xl border ${
        isSevere
          ? 'border-red-300 bg-red-950/10'
          : isStageActive
          ? 'border-amber-300 bg-amber-950/10'
          : 'border-emerald-300 bg-emerald-950/10'
      } p-6 sm:p-7 shadow-xs transition-all`}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            aria-hidden="true"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isSevere
                ? 'bg-red-600 text-white'
                : isStageActive
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-600 text-white'
            } shadow-xs`}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isSevere
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : isStageActive
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {regulation.stageLabel}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {regulation.statutoryStatus}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              CAQM Graded Response Action Plan (Delhi-NCR)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/80 rounded-xl px-3 py-1.5 border border-slate-200 self-start sm:self-auto">
          <FileText size={14} className="text-slate-400" />
          <span>{regulation.officialAuthority}</span>
        </div>
      </div>

      {/* Threshold and Context */}
      <p className="text-xs text-slate-600 mt-3.5 mb-4 leading-relaxed">
        <strong className="text-slate-800">Trigger Condition:</strong> {regulation.aqiThresholdDescription}
      </p>

      {/* Mandatory Statutory Restrictions Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        {/* Vehicles */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-2">
              <Car size={16} className="text-amber-600 shrink-0" />
              <span>Vehicular Ban</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {regulation.vehicleRestrictions[0] ?? 'Standard traffic rules apply.'}
            </p>
          </div>
          {regulation.stage === 'STAGE_3' || regulation.stage === 'STAGE_4' ? (
            <span className="mt-3 inline-block rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase tracking-wide">
              BS-III / BS-IV Ban Active
            </span>
          ) : null}
        </div>

        {/* Construction */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-2">
              <HardHat size={16} className="text-amber-600 shrink-0" />
              <span>Construction & Dust</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {regulation.constructionRestrictions[0] ?? 'Standard dust control norms.'}
            </p>
          </div>
          {isSevere ? (
            <span className="mt-3 inline-block rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase tracking-wide">
              C&D Activities Halted
            </span>
          ) : null}
        </div>

        {/* Schools */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-2">
              <GraduationCap size={16} className="text-teal-600 shrink-0" />
              <span>School Operations</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {regulation.schoolAdvisory}
            </p>
          </div>
          {isSevere ? (
            <span className="mt-3 inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              Online Mode Recommended
            </span>
          ) : null}
        </div>

        {/* Transit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-2">
              <Bus size={16} className="text-teal-600 shrink-0" />
              <span>Public Transit</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {regulation.publicTransportAdvisory}
            </p>
          </div>
          <span className="mt-3 inline-block rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase tracking-wide">
            Metro Surge Schedule
          </span>
        </div>
      </div>

      {/* Expandable Citizen Directives (Do's & Don'ts) */}
      <div className="border-t border-slate-200 pt-3">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
          aria-expanded={isExpanded}
        >
          <span className="flex items-center gap-2">
            <span>Official Citizen Directives (Do&apos;s &amp; Don&apos;ts for Delhi-NCR Residents)</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {regulation.citizenGuidelines.do.length + regulation.citizenGuidelines.dont.length} Guidelines
            </span>
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isExpanded && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100 animate-fade-in">
            {/* Do's */}
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-2.5">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>Statutory &amp; Health Do&apos;s</span>
              </h4>
              <ul className="space-y-2 text-xs text-emerald-900 leading-relaxed">
                {regulation.citizenGuidelines.do.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Don'ts */}
            <div className="rounded-2xl bg-rose-50/80 border border-rose-200 p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-rose-900 mb-2.5">
                <XCircle size={16} className="text-rose-700" />
                <span>Strict Prohibitions (Don&apos;ts)</span>
              </h4>
              <ul className="space-y-2 text-xs text-rose-900 leading-relaxed">
                {regulation.citizenGuidelines.dont.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
