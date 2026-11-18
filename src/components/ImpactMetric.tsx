/**
 * @file ImpactMetric.tsx
 * @description A single impact metric tile component.
 * Displays a quantified benefit (e.g., "43% PM2.5 reduction") with a
 * colour-coded severity indicator, trend arrow, and accessible label.
 *
 * @example
 * <ImpactMetric metric={{
 *   label: "PM2.5 Exposure Reduced",
 *   value: "43",
 *   unit: "%",
 *   trend: "down",
 *   severity: "positive"
 * }} />
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ImpactMetricProps } from '@/lib/types';

/** Colour classes for each severity level. */
const SEVERITY_CLASSES: Record<
  'positive' | 'warning' | 'danger' | 'info',
  { bg: string; text: string; border: string; valueFg: string }
> = {
  positive: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-200',
    valueFg: 'text-emerald-700',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
    valueFg: 'text-amber-700',
  },
  danger: {
    bg: 'bg-red-50',
    text: 'text-red-900',
    border: 'border-red-200',
    valueFg: 'text-red-700',
  },
  info: {
    bg: 'bg-sky-50',
    text: 'text-sky-900',
    border: 'border-sky-200',
    valueFg: 'text-sky-700',
  },
};

/** Icon map for trend direction. */
const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
} as const;

/**
 * `ImpactMetric` — Renders a single quantified impact tile.
 *
 * @param props - {@link ImpactMetricProps}
 */
export function ImpactMetric({ metric }: ImpactMetricProps): React.ReactElement {
  const classes = SEVERITY_CLASSES[metric.severity];
  const TrendIcon = TREND_ICON[metric.trend];

  const ariaLabel = `${metric.label}: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}. Trend: ${metric.trend}.`;

  return (
    <article
      aria-label={ariaLabel}
      className={`flex flex-col gap-2 rounded-xl border p-4 ${classes.bg} ${classes.border} animate-slide-up`}
    >
      {/* Trend icon */}
      <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${classes.text} opacity-70`}>
        <TrendIcon size={12} aria-hidden="true" />
        <span>{metric.trend === 'neutral' ? 'Stable' : metric.trend === 'up' ? 'Increasing' : 'Decreasing'}</span>
      </div>

      {/* Value */}
      <div className={`text-3xl font-black tabular-nums leading-none ${classes.valueFg}`}>
        {metric.value}
        {metric.unit && (
          <span className="ml-1 text-base font-semibold opacity-70">{metric.unit}</span>
        )}
      </div>

      {/* Label */}
      <p className={`text-sm font-medium leading-snug ${classes.text}`}>
        {metric.label}
      </p>
    </article>
  );
}
