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

/**
 * Props for {@link GrapAlertCard}.
 */
export interface GrapAlertCardProps {
  /** Statutory GRAP regulation details. */
  readonly regulation?: GrapRegulationInfo | undefined;
  /** Alias for regulation details. */
  readonly grap?: GrapRegulationInfo | undefined;
  /** Current numerical AQI. */
  readonly currentAqi?: number | undefined;
}

/** Visual theme styling for GRAP alert stage. */
interface GrapTheme {
  readonly cardBorder: string;
  readonly cardBg: string;
  readonly iconBg: string;
  readonly badgeClass: string;
  readonly isSevere: boolean;
  readonly isStageActive: boolean;
}

/**
 * Resolves colour scheme and styling classes based on GRAP stage.
 *
 * @param stage - The GRAP stage identifier.
 * @returns Visual theme classes.
 */
function getGrapTheme(stage: GrapRegulationInfo['stage']): GrapTheme {
  const isSevere = stage === 'STAGE_3' || stage === 'STAGE_4';
  const isStageActive = stage !== 'NONE';

  if (isSevere) {
    return {
      cardBorder: 'border-red-300',
      cardBg: 'bg-red-950/10',
      iconBg: 'bg-red-600 text-white',
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      isSevere: true,
      isStageActive: true,
    };
  }

  if (isStageActive) {
    return {
      cardBorder: 'border-amber-300',
      cardBg: 'bg-amber-950/10',
      iconBg: 'bg-amber-600 text-white',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      isSevere: false,
      isStageActive: true,
    };
  }

  return {
    cardBorder: 'border-emerald-300',
    cardBg: 'bg-emerald-950/10',
    iconBg: 'bg-emerald-600 text-white',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    isSevere: false,
    isStageActive: false,
  };
}

/**
 * Props for {@link GrapHeader}.
 */
interface GrapHeaderProps {
  readonly regulation: GrapRegulationInfo;
  readonly theme: GrapTheme;
}

/**
 * Renders the top header banner of the GRAP alert card.
 *
 * @param props - Header props.
 * @returns React element.
 */
function GrapHeader({ regulation, theme }: GrapHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
      <div className="flex items-start sm:items-center gap-3.5">
        <div
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${theme.iconBg} shadow-xs`}
        >
          <AlertTriangle size={22} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider border ${theme.badgeClass}`}
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
  );
}

/**
 * Props for {@link GrapRestrictionTile}.
 */
interface GrapRestrictionTileProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly badgeText?: string | null;
  readonly badgeClass?: string;
}

/**
 * Renders a single statutory restriction card tile.
 *
 * @param props - Restriction tile properties.
 * @returns React element.
 */
function GrapRestrictionTile({
  icon,
  title,
  description,
  badgeText,
  badgeClass = 'bg-red-100 text-red-800',
}: GrapRestrictionTileProps): React.ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-2">
          {icon}
          <span>{title}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>
      {badgeText ? (
        <span className={`mt-3 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
          {badgeText}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Props for {@link GrapDirectivesDrawer}.
 */
interface GrapDirectivesDrawerProps {
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly doGuidelines: readonly string[];
  readonly dontGuidelines: readonly string[];
}

/**
 * Renders the expandable citizen directives list (Do's and Don'ts).
 *
 * @param props - Directive drawer props.
 * @returns React element.
 */
function GrapDirectivesDrawer({
  isExpanded,
  onToggle,
  doGuidelines,
  dontGuidelines,
}: GrapDirectivesDrawerProps): React.ReactElement {
  const totalCount = doGuidelines.length + dontGuidelines.length;

  return (
    <div className="border-t border-slate-200 pt-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <span>Official Citizen Directives (Do&apos;s &amp; Don&apos;ts for Delhi-NCR Residents)</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
            {totalCount} Guidelines
          </span>
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100 animate-fade-in">
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-2.5">
              <CheckCircle2 size={16} className="text-emerald-700" />
              <span>Statutory &amp; Health Do&apos;s</span>
            </h4>
            <ul className="space-y-2 text-xs text-emerald-900 leading-relaxed">
              {doGuidelines.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-rose-50/80 border border-rose-200 p-4">
            <h4 className="flex items-center gap-2 text-xs font-bold text-rose-900 mb-2.5">
              <XCircle size={16} className="text-rose-700" />
              <span>Strict Prohibitions (Don&apos;ts)</span>
            </h4>
            <ul className="space-y-2 text-xs text-rose-900 leading-relaxed">
              {dontGuidelines.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * `GrapAlertCard` — Displays statutory CAQM GRAP stage, restrictions, and citizen guidance.
 *
 * @param props - {@link GrapAlertCardProps}
 * @returns React element or null if no regulation provided.
 */
export function GrapAlertCard({
  regulation,
  grap,
}: GrapAlertCardProps): React.ReactElement | null {
  const activeRegulation = regulation ?? grap;
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = getGrapTheme(activeRegulation?.stage ?? 'NONE');

  if (!activeRegulation) {
    return null;
  }

  const doGuidelines = activeRegulation.citizenGuidelines?.do ?? [];
  const dontGuidelines = activeRegulation.citizenGuidelines?.dont ?? [];
  const vehicleRestrictions = activeRegulation.vehicleRestrictions ?? [];
  const constructionRestrictions = activeRegulation.constructionRestrictions ?? [];

  return (
    <article
      aria-label="Statutory CAQM GRAP Regulatory Advisory"
      className={`rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-6 sm:p-7 shadow-xs transition-all`}
    >
      <GrapHeader regulation={activeRegulation} theme={theme} />

      <p className="text-xs text-slate-600 mt-3.5 mb-4 leading-relaxed">
        <strong className="text-slate-800">Trigger Condition:</strong> {activeRegulation.aqiThresholdDescription}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <GrapRestrictionTile
          icon={<Car size={16} className="text-amber-600 shrink-0" />}
          title="Vehicular Ban"
          description={vehicleRestrictions[0] ?? 'Standard traffic rules apply.'}
          badgeText={theme.isSevere ? 'BS-III / BS-IV Ban Active' : null}
        />
        <GrapRestrictionTile
          icon={<HardHat size={16} className="text-amber-600 shrink-0" />}
          title="Construction & Dust"
          description={constructionRestrictions[0] ?? 'Standard dust control norms.'}
          badgeText={theme.isSevere ? 'C&D Activities Halted' : null}
        />
        <GrapRestrictionTile
          icon={<GraduationCap size={16} className="text-teal-600 shrink-0" />}
          title="School Operations"
          description={activeRegulation.schoolAdvisory}
          badgeText={theme.isSevere ? 'Online Mode Recommended' : null}
          badgeClass="bg-amber-100 text-amber-800"
        />
        <GrapRestrictionTile
          icon={<Bus size={16} className="text-teal-600 shrink-0" />}
          title="Public Transit"
          description={activeRegulation.publicTransportAdvisory}
          badgeText="Metro Surge Schedule"
          badgeClass="bg-teal-100 text-teal-800"
        />
      </div>

      <GrapDirectivesDrawer
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
        doGuidelines={doGuidelines}
        dontGuidelines={dontGuidelines}
      />
    </article>
  );
}
