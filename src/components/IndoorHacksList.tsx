/**
 * @file IndoorHacksList.tsx
 * @description Renders a grid of indoor air-quality improvement hacks.
 * Each hack card shows the tip title, description, difficulty badge,
 * cost indicator, and estimated indoor PM2.5 reduction percentage.
 *
 * @example
 * <IndoorHacksList hacks={plan.indoorHacks} />
 */

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { getDifficultyClasses, formatCost } from '@/lib/aqi-utils';
import type { IndoorHacksListProps } from '@/lib/types';
import type { IndoorHack } from '@/lib/schemas';

/**
 * `IndoorHackCard` — Single hack card, single responsibility.
 *
 * @param hack - A single `IndoorHack` from the AI response.
 */
function IndoorHackCard({ hack }: { readonly hack: IndoorHack }): React.ReactElement {
  const diffClasses = getDifficultyClasses(hack.difficulty);
  const costDisplay = formatCost(hack.estimatedCost);

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-200 animate-slide-up">
      {/* Icon */}
      <div
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600"
      >
        <Lightbulb size={18} />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sky-900 leading-snug">{hack.title}</h3>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed flex-1">{hack.description}</p>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-sky-50">
        {/* Difficulty */}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${diffClasses.bg} ${diffClasses.text} ${diffClasses.border}`}
        >
          {hack.difficulty.charAt(0).toUpperCase() + hack.difficulty.slice(1)}
        </span>

        {/* Cost */}
        <span className="text-xs text-slate-500 font-medium">
          Cost: <span className="text-slate-700 font-semibold">{costDisplay}</span>
        </span>

        {/* Reduction */}
        {hack.indoorReductionPercent !== undefined && (
          <span className="ml-auto text-xs text-emerald-700 font-semibold">
            ↓ {hack.indoorReductionPercent}% indoor PM2.5
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * `IndoorHacksList` — Responsive grid of indoor air-quality hacks.
 *
 * @param props - {@link IndoorHacksListProps}
 */
export function IndoorHacksList({ hacks }: IndoorHacksListProps): React.ReactElement {
  return (
    <ul
      aria-label="Indoor air quality improvement hacks"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {hacks.map((hack) => (
        <IndoorHackCard key={hack.id} hack={hack} />
      ))}
    </ul>
  );
}
