/**
 * @file LoadingSpinner.tsx
 * @description Animated breathing-circle loading indicator with accessible ARIA attributes.
 * Uses a custom CSS animation (`breathe`) defined in `tailwind.config.js`.
 *
 * @example
 * <LoadingSpinner label="Generating your personalised air quality plan…" />
 */

import React from 'react';
import { Wind } from 'lucide-react';
import type { LoadingSpinnerProps } from '@/lib/types';

/**
 * `LoadingSpinner` — Full-section loading state with animated icon and label.
 *
 * @param props - {@link LoadingSpinnerProps}
 */
export function LoadingSpinner({
  label = 'Generating your plan…',
}: LoadingSpinnerProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex flex-col items-center justify-center gap-6 py-20"
    >
      {/* Animated ring */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full border-4 border-sky-200 animate-breathe" />
        <div className="absolute h-16 w-16 rounded-full border-4 border-sky-400 animate-breathe [animation-delay:0.5s]" />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white">
          <Wind size={20} aria-hidden="true" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sky-800 font-semibold text-lg">{label}</p>
        <p className="text-sky-600 text-sm">
          Analysing pollution patterns, health risks &amp; local conditions…
        </p>
      </div>

      {/* Screen-reader-only progress text */}
      <span className="sr-only">Please wait while your plan is being generated.</span>
    </div>
  );
}
