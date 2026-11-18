/**
 * @file AppHeader.tsx
 * @description Top navigation / branding header for BreatheWise AI.
 * Premium, breathable glassmorphic design with animated leaf emblem,
 * live status badge, and optional "New Plan" reset action.
 *
 * @example
 * <AppHeader onReset={handleReset} showReset={hasPlan} />
 */

import React from 'react';
import { Leaf, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

/** Props for `AppHeader`. */
interface AppHeaderProps {
  /** Whether to show the "New Plan" reset button (after a plan is generated). */
  showReset: boolean;
  /** Callback to reset the app to the initial form state. */
  onReset: () => void;
}

/**
 * `AppHeader` — Branded page header with optional plan-reset action.
 *
 * @param props - {@link AppHeaderProps}
 */
export function AppHeader({ showReset, onReset }: AppHeaderProps): React.ReactElement {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-teal-100/70 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-700 text-white shadow-md shadow-teal-500/20"
          >
            <Leaf size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                BreatheWise
                <span className="text-teal-600"> AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                <ShieldCheck size={10} aria-hidden="true" />
                CPCB Validated
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-none mt-0.5">
              GenAI-Powered Urban Air Quality &amp; Ventilation Shield
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2.5">
          {showReset ? (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 hover:shadow transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500"
              aria-label="Start a new air quality plan"
            >
              <RefreshCw size={13} aria-hidden="true" />
              <span>New Plan</span>
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/70 px-3 py-1 text-xs font-medium text-teal-800">
              <Sparkles size={12} className="text-teal-600" aria-hidden="true" />
              Live Smog Defense
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
