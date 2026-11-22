/**
 * @file EmergencyDirectorySection.tsx
 * @description Emergency medical response directory for Delhi-NCR, featuring
 * direct-dial emergency hotlines, verified tertiary pulmonology centers,
 * and clinical red-flag respiratory triage guidelines.
 */

import React, { useState } from 'react';
import {
  PhoneCall,
  Hospital,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MapPin,
  Activity,
  HeartPulse,
} from 'lucide-react';
import type {
  EmergencyDirectoryResult,
  EmergencyHospital,
  EmergencyHotline,
  RedFlagSymptom,
} from '@/lib/types';

/** Props for `EmergencyDirectorySection`. */
interface EmergencyDirectorySectionProps {
  readonly directory: EmergencyDirectoryResult;
  readonly city?: string;
}

/**
 * `EmergencyHotlinesStrip` — One-touch emergency call tiles for national/state helplines.
 */
function EmergencyHotlinesStrip({
  hotlines,
}: {
  readonly hotlines: readonly EmergencyHotline[];
}): React.ReactElement {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
        <PhoneCall size={14} className="text-red-600" />
        <span>One-Touch Emergency Dispatch Hotlines</span>
      </h4>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {hotlines.map((hotline, idx) => (
          <a
            key={idx}
            href={`tel:${hotline.number.split('/')[0]?.trim()}`}
            className="group flex flex-col justify-between rounded-2xl border border-red-200 bg-white p-3.5 hover:border-red-400 hover:shadow-xs transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
            aria-label={`Call ${hotline.label} at ${hotline.number}`}
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {hotline.label}
              </p>
              <p className="text-xl font-black text-red-600 mt-0.5 group-hover:text-red-700 transition-colors">
                {hotline.number}
              </p>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              {hotline.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * `RedFlagSymptomsCard` — Clinical triage markers for emergency department escalation.
 */
function RedFlagSymptomsCard({
  symptoms,
}: {
  readonly symptoms: readonly RedFlagSymptom[];
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-red-300 bg-white p-5 mb-6 shadow-2xs">
      <div className="flex items-start gap-3 mb-3.5">
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700"
        >
          <ShieldAlert size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            When to Seek Immediate Emergency Department Care
          </h4>
          <p className="text-xs text-slate-600">
            Objective clinical warning signs indicating acute respiratory failure or severe bronchospasm
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {symptoms.map((symptom, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">{symptom.symptom}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{symptom.clinicalReason}</p>
            </div>
            <span className="mt-2.5 self-start rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase tracking-wider">
              {symptom.urgencyLevel === 'CRITICAL_IMMEDIATE' ? 'Immediate Emergency' : 'Urgent Care'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * `HospitalCardItem` — Verified pulmonology hospital details tile with one-tap calling.
 */
function HospitalCardItem({ hosp }: { readonly hosp: EmergencyHospital }): React.ReactElement {
  const badgeClass =
    hosp.type === 'Government Apex'
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
      : hosp.type === 'Specialty Respiratory'
      ? 'bg-blue-100 text-blue-800 border border-blue-300'
      : 'bg-purple-100 text-purple-800 border border-purple-300';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4.5 flex flex-col justify-between shadow-2xs">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-1 ${badgeClass}`}>
              {hosp.type} · {hosp.region}
            </span>
            <h5 className="text-sm font-bold text-slate-900 leading-snug">{hosp.name}</h5>
          </div>
        </div>

        <p className="text-xs text-slate-600 flex items-start gap-1.5 mb-2.5">
          <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
          <span>{hosp.address}</span>
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {hosp.facilities.map((fac, fIdx) => (
            <span key={fIdx} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              {fac}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <a
          href={`tel:${hosp.emergencyPhone}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-2xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
          aria-label={`Call 24/7 Emergency at ${hosp.name}`}
        >
          <PhoneCall size={13} />
          <span>Call Emergency: {hosp.emergencyPhone}</span>
        </a>
        {hosp.alternatePhone && (
          <a
            href={`tel:${hosp.alternatePhone}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={`Call alternate desk for ${hosp.name}`}
          >
            Desk
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * `EmergencyDirectorySection` — Emergency healthcare provider directory and hotlines.
 *
 * @param props - {@link EmergencyDirectorySectionProps}
 */
export function EmergencyDirectorySection({
  directory,
  city = 'Delhi NCR',
}: EmergencyDirectorySectionProps): React.ReactElement {
  const [showAllHospitals, setShowAllHospitals] = useState(false);

  const regionalHospitals = directory?.regionalHospitals ?? [];
  const hotlines = directory?.hotlines ?? [];
  const redFlagSymptoms = directory?.redFlagSymptoms ?? [];

  const displayedHospitals = showAllHospitals
    ? regionalHospitals
    : regionalHospitals.slice(0, 4);

  return (
    <section
      aria-label="Emergency pulmonology and medical directory"
      className="rounded-3xl border border-red-200 bg-red-50/40 p-6 sm:p-7 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-red-200">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xs"
          >
            <Hospital size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Emergency Care &amp; Pulmonology Directory
            </h3>
            <p className="text-xs text-slate-600">
              Verified tertiary respiratory emergency infrastructure serving {city}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-red-100 border border-red-300 px-3 py-1 text-xs font-bold text-red-800">
          <HeartPulse size={14} className="text-red-600 animate-pulse" />
          24/7 Emergency Active
        </span>
      </div>

      <EmergencyHotlinesStrip hotlines={hotlines} />
      <RedFlagSymptomsCard symptoms={redFlagSymptoms} />

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Activity size={14} className="text-teal-600" />
            <span>Verified Pulmonology &amp; Critical Respiratory Centers</span>
          </h4>
          <span className="text-xs text-slate-500">Sorted for {city} Proximity</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {displayedHospitals.map((hosp) => (
            <HospitalCardItem key={hosp.id} hosp={hosp} />
          ))}
        </div>

        {regionalHospitals.length > 4 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setShowAllHospitals((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl px-4 py-2 transition-all shadow-2xs hover:bg-slate-50"
              aria-expanded={showAllHospitals}
            >
              {showAllHospitals ? (
                <>
                  <ChevronUp size={14} />
                  <span>Show Fewer Hospitals</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  <span>View All {regionalHospitals.length} Verified Hospitals</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 leading-relaxed">
        <p className="font-semibold text-amber-950 mb-0.5">Medical Safety &amp; Non-Prescriptive Notice:</p>
        <p>{directory.disclaimer}</p>
      </div>
    </section>
  );
}
