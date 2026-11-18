/**
 * @file SectionHeader.tsx
 * @description Reusable section heading component with optional subtitle and icon.
 * Uses semantic `<h2>` for proper document outline and screen reader navigation.
 *
 * @example
 * <SectionHeader
 *   title="Daily Routines"
 *   subtitle="Personalised low-emission actions for your lifestyle"
 *   icon={<CalendarDays size={22} />}
 * />
 */

import React from 'react';
import type { SectionHeaderProps } from '@/lib/types';

/**
 * `SectionHeader` — Semantic `<h2>` section header with optional icon and subtitle.
 *
 * @param props - {@link SectionHeaderProps}
 */
export function SectionHeader({
  title,
  subtitle,
  icon,
}: SectionHeaderProps): React.ReactElement {
  return (
    <div className="flex items-start gap-3 mb-5">
      {icon && (
        <div
          className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-sky-900 leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm text-sky-600 mt-0.5 text-balance">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
