/**
 * @file AqiBadge.tsx
 * @description A compact, colour-coded badge that displays an AQI category label
 * and optional numeric value. Fully accessible with ARIA roles.
 *
 * @example
 * <AqiBadge category="poor" value={278} size="lg" />
 */

import React from 'react';
import { getAqiConfig } from '@/lib/aqi-utils';
import type { AqiBadgeProps } from '@/lib/types';

/** Size variant class maps. */
const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 rounded',
  md: 'text-sm px-3 py-1 rounded-md',
  lg: 'text-base px-4 py-1.5 rounded-lg font-semibold',
} as const;

/**
 * `AqiBadge` — Renders a pill badge for a given AQI category.
 *
 * @param props - {@link AqiBadgeProps}
 */
export function AqiBadge({ category, value, size = 'md' }: AqiBadgeProps): React.ReactElement {
  const config = getAqiConfig(category);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      role="status"
      aria-label={`Air quality: ${config.label}${value !== undefined ? `, AQI ${value}` : ''}`}
      className={`inline-flex items-center gap-1.5 border font-medium ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClass}`}
    >
      <span aria-hidden="true">{config.emoji}</span>
      {config.label}
      {value !== undefined && (
        <span className="tabular-nums">({value})</span>
      )}
    </span>
  );
}
