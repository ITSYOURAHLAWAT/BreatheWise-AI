/**
 * @file EmergencyTips.tsx
 * @description Displays a list of critical emergency tips for severe smog days.
 * Rendered with high-contrast red styling and a pulsing alert icon to
 * communicate urgency. Only shown when AQI is severe or hazardous.
 *
 * @example
 * <EmergencyTips tips={plan.emergencyTips} />
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { EmergencyTipsProps } from '@/lib/types';

/**
 * `EmergencyTips` — Critical action list for hazardous air days.
 *
 * @param props - {@link EmergencyTipsProps}
 */
export function EmergencyTips({ tips }: EmergencyTipsProps): React.ReactElement {
  return (
    <section
      aria-label="Emergency tips for severe smog days"
      className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700"
        >
          <ShieldAlert size={20} className="animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-red-900">Emergency Protocol</h3>
          <p className="text-xs text-red-700">Critical actions for hazardous air quality days</p>
        </div>
      </div>

      {/* Tips list */}
      <ul className="space-y-2.5" aria-label="Emergency action list">
        {tips.map((tip, index) => (
          <li
            key={index}
            className="flex items-start gap-2.5 text-sm text-red-900"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-900 text-xs font-bold"
            >
              {index + 1}
            </span>
            <span className="leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
