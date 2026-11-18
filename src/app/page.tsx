/**
 * @file page.tsx
 * @description Root page component for BreatheWise AI (`/`).
 *
 * Upgraded UI/UX inspired by Llamacoder:
 *  - Refined gradients (teal-50 via slate-50 to white)
 *  - Micro-location highlight chips
 *  - Elegant card elevations with rounded-3xl corners
 *  - State machine orchestrator with instant smooth scrolling
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { ProfileForm } from '@/components/ProfileForm';
import { PlanDashboard } from '@/components/PlanDashboard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Leaf, ShieldCheck, Clock, Wind } from 'lucide-react';
import type { AppState, UserProfile, AiResponse } from '@/lib/types';

/** Initial application state. */
const INITIAL_STATE: AppState = {
  status: 'idle',
  plan: null,
  errorMessage: null,
};

/**
 * `HomePage` — Root Next.js page component (client-side state machine).
 */
export default function HomePage(): React.ReactElement {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const resultsRef = useRef<HTMLDivElement>(null);

  /** Tracks the city/micro-location the user entered. */
  const cityRef = useRef<string>('');

  /**
   * `handleGenerate` — Submits the validated profile to the API route,
   * transitions state accordingly, and scrolls to results on success.
   *
   * @param profile - Validated `UserProfile` from `ProfileForm`.
   */
  const handleGenerate = useCallback(async (profile: UserProfile): Promise<void> => {
    cityRef.current = profile.city;
    setState({ status: 'loading', plan: null, errorMessage: null });

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { error?: string };
        throw new Error(errorBody.error ?? `Request failed with status ${response.status}.`);
      }

      const plan = (await response.json()) as AiResponse;
      setState({ status: 'success', plan, errorMessage: null });

      // Scroll to results after next paint
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setState({ status: 'error', plan: null, errorMessage: message });
    }
  }, []);

  /** Resets app to initial state so the user can generate a new plan. */
  const handleReset = useCallback(() => {
    setState(INITIAL_STATE);
    cityRef.current = '';
  }, []);

  /** Dismisses the error banner while keeping the form visible. */
  const handleDismissError = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'idle', errorMessage: null }));
  }, []);

  const hasPlan = state.status === 'success' && state.plan !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 via-slate-50 to-slate-100 text-slate-900 antialiased">
      {/* Skip to main content — WCAG 2.1 requirement */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Sticky top header */}
      <AppHeader showReset={hasPlan} onReset={handleReset} />

      {/* Page container */}
      <div
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8"
      >
        {/* ── Hero section — only shown on idle/error ── */}
        {!hasPlan && state.status !== 'loading' && (
          <section aria-label="Welcome" className="text-center space-y-4 pb-2 pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800 shadow-2xs">
              <Leaf size={13} className="text-teal-600" aria-hidden="true" />
              <span>Official Indian CPCB 6-Band Standard (0–500)</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight text-balance">
              Protect Your Family From Winter Smog With{' '}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
                Precision AI Defense
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto text-balance leading-relaxed">
              Enter your neighborhood or micro-location. BreatheWise AI calculates
              24-hour thermal inversion curves, pinpoints your safe window to open windows,
              and generates personalized health defenses.
            </p>

            {/* Quick feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200/80 px-3 py-1.5 shadow-2xs">
                <Clock size={13} className="text-teal-600" />
                24-Hour Diurnal Model
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200/80 px-3 py-1.5 shadow-2xs">
                <Wind size={13} className="text-teal-600" />
                Safe Ventilation Windows
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200/80 px-3 py-1.5 shadow-2xs">
                <ShieldCheck size={13} className="text-teal-600" />
                Vulnerability Shielding
              </span>
            </div>
          </section>
        )}

        {/* ── Form Card ── */}
        {!hasPlan && state.status !== 'loading' && (
          <div className="rounded-3xl border border-teal-100/80 bg-white p-6 sm:p-8 lg:p-10 shadow-sm transition-all hover:shadow-md">
            {/* Error banner */}
            {state.status === 'error' && state.errorMessage && (
              <div className="mb-6">
                <ErrorBanner
                  message={state.errorMessage}
                  onDismiss={handleDismissError}
                />
              </div>
            )}

            <ProfileForm
              onSubmit={handleGenerate}
              isLoading={false}
            />
          </div>
        )}

        {/* ── Loading State ── */}
        {state.status === 'loading' && (
          <div className="rounded-3xl border border-teal-100 bg-white shadow-sm py-8 px-6">
            <LoadingSpinner label="Calibrating your micro-location smog model and ventilation window…" />
          </div>
        )}

        {/* ── Results Dashboard ── */}
        {hasPlan && state.plan && (
          <div ref={resultsRef}>
            <PlanDashboard plan={state.plan} city={cityRef.current} />
          </div>
        )}
      </div>
    </div>
  );
}
