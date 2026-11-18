/**
 * @file RoutineList.tsx
 * @description Renders an ordered list of personalised low-emission daily routines.
 * Each routine is displayed as a card with time-of-day, category tag, description,
 * and optional PM2.5 benefit estimate.
 *
 * @example
 * <RoutineList routines={plan.lowEmissionRoutines} />
 */

import React from 'react';
import {
  Sun, Cloud, Sunset, Moon, Clock,
  Car, Home, Salad, Dumbbell, Baby, Heart
} from 'lucide-react';
import { formatTimeOfDay } from '@/lib/aqi-utils';
import type { RoutineListProps } from '@/lib/types';
import type { RoutineItem } from '@/lib/schemas';

/** Maps `timeOfDay` values to their icon components. */
const TIME_ICONS: Record<RoutineItem['timeOfDay'], React.ElementType> = {
  morning: Sun,
  afternoon: Cloud,
  evening: Sunset,
  night: Moon,
  anytime: Clock,
};

/** Maps category to icon and colour. */
const CATEGORY_CONFIG: Record<
  RoutineItem['category'],
  { Icon: React.ElementType; bg: string; text: string }
> = {
  outdoor: { Icon: Sun,      bg: 'bg-sky-100',     text: 'text-sky-800' },
  indoor:  { Icon: Home,     bg: 'bg-indigo-100',  text: 'text-indigo-800' },
  diet:    { Icon: Salad,    bg: 'bg-emerald-100', text: 'text-emerald-800' },
  transport:{ Icon: Car,     bg: 'bg-amber-100',   text: 'text-amber-800' },
  exercise:{ Icon: Dumbbell, bg: 'bg-violet-100',  text: 'text-violet-800' },
  children:{ Icon: Baby,     bg: 'bg-pink-100',    text: 'text-pink-800' },
  health:  { Icon: Heart,    bg: 'bg-red-100',     text: 'text-red-800' },
};

/**
 * `RoutineCard` — Renders a single routine item card.
 * Single-responsibility sub-component for clean separation.
 *
 * @param routine - A single `RoutineItem` from the AI response.
 */
function RoutineCard({ routine }: { readonly routine: RoutineItem }): React.ReactElement {
  const TimeIcon = TIME_ICONS[routine.timeOfDay];
  const categoryConfig = CATEGORY_CONFIG[routine.category];
  const CategoryIcon = categoryConfig.Icon;

  return (
    <li className="group flex gap-4 rounded-xl border border-sky-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-200 animate-slide-up">
      {/* Time indicator */}
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"
      >
        <TimeIcon size={20} />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-sky-500 font-medium">
            {formatTimeOfDay(routine.timeOfDay)}
          </span>
          {/* Category badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${categoryConfig.bg} ${categoryConfig.text}`}
          >
            <CategoryIcon size={10} aria-hidden="true" />
            {routine.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sky-900 leading-snug">{routine.title}</h3>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed">{routine.description}</p>

        {/* Benefit estimate */}
        {routine.estimatedBenefitUg !== undefined && (
          <p className="text-xs text-emerald-700 font-medium">
            💚 Saves ~{routine.estimatedBenefitUg} μg/m³ PM2.5 exposure
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * `RoutineList` — Ordered list of all low-emission daily routines.
 *
 * @param props - {@link RoutineListProps}
 */
export function RoutineList({ routines }: RoutineListProps): React.ReactElement {
  return (
    <ul
      aria-label="Personalised low-emission daily routines"
      className="space-y-3"
    >
      {routines.map((routine) => (
        <RoutineCard key={routine.id} routine={routine} />
      ))}
    </ul>
  );
}
