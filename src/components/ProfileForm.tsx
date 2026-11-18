/**
 * @file ProfileForm.tsx
 * @description The main user input form for the BreatheWise AI dashboard.
 *
 * Collects Indian micro-locations (e.g. Anand Vihar, New Delhi), expanded health
 * vulnerabilities (including Bronchitis, Allergies/Sinusitis, Immunocompromised),
 * activity level, commute mode, household members, and optional context.
 *
 * Validates client-side with Zod before submitting to the API route.
 *
 * @example
 * <ProfileForm onSubmit={handleGenerate} isLoading={status === 'loading'} />
 */

'use client';

import React, { useRef, useId, useCallback } from 'react';
import { MapPin, Heart, Activity, Car, Sparkles } from 'lucide-react';
import { UserProfileSchema } from '@/lib/schemas';
import type { ProfileFormProps, UserProfile } from '@/lib/types';

/** All health vulnerability options with display labels. */
const HEALTH_OPTIONS: Array<{ value: UserProfile['healthVulnerabilities'][number]; label: string }> = [
  { value: 'asthma',              label: '🫁 Asthma' },
  { value: 'bronchitis',          label: '🫁 Bronchitis' },
  { value: 'allergies_sinusitis', label: '🤧 Allergies / Sinusitis' },
  { value: 'copd',                label: '🫁 COPD' },
  { value: 'heart_disease',       label: '❤️ Heart Disease' },
  { value: 'immunocompromised',   label: '🛡️ Immunocompromised' },
  { value: 'diabetes',            label: '🩸 Diabetes' },
  { value: 'pregnant',            label: '🤰 Pregnant' },
  { value: 'elderly',             label: '👴 Elderly (65+)' },
  { value: 'children',            label: '👶 Children' },
  { value: 'none',                label: '✅ None' },
];

/** Activity level options. */
const ACTIVITY_OPTIONS: Array<{ value: UserProfile['activityLevel']; label: string }> = [
  { value: 'sedentary',         label: 'Sedentary (desk job, minimal outdoors)' },
  { value: 'lightly_active',    label: 'Lightly Active (occasional walks)' },
  { value: 'moderately_active', label: 'Moderately Active (regular exercise)' },
  { value: 'very_active',       label: 'Very Active (daily outdoor workouts)' },
];

/** Commute mode options. */
const COMMUTE_OPTIONS: Array<{ value: UserProfile['commuteMode']; label: string }> = [
  { value: 'car',              label: '🚗 Private Car' },
  { value: 'motorcycle',       label: '🏍️ Motorcycle' },
  { value: 'public_transport', label: '🚌 Public Transport' },
  { value: 'bicycle',          label: '🚴 Bicycle' },
  { value: 'walking',          label: '🚶 Walking' },
  { value: 'work_from_home',   label: '🏠 Work from Home' },
];

/**
 * `FormField` — Accessible wrapper for a labelled form control.
 * Associates label and input via `htmlFor` / `id`.
 */
function FormField({
  label,
  htmlFor,
  required,
  children,
  hint,
}: {
  readonly label: string;
  readonly htmlFor: string;
  readonly required?: boolean;
  readonly children: React.ReactNode;
  readonly hint?: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-sky-900"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-500">*</span>
        )}
      </label>
      {hint && <p className="text-xs text-sky-600 font-medium" id={`${htmlFor}-hint`}>{hint}</p>}
      {children}
    </div>
  );
}

/**
 * `ProfileForm` — Main location + lifestyle input form with Indian micro-location focus.
 *
 * @param props - {@link ProfileFormProps}
 */
export function ProfileForm({ onSubmit, isLoading }: ProfileFormProps): React.ReactElement {
  const formRef = useRef<HTMLFormElement>(null);
  const baseId = useId();
  const [fieldErrors, setFieldErrors] = React.useState<Partial<Record<keyof UserProfile, string>>>({});
  const [selectedVulnerabilities, setSelectedVulnerabilities] = React.useState<string[]>([]);

  /**
   * Toggles a health vulnerability checkbox on/off.
   * When "none" is selected, all others are cleared.
   */
  const handleVulnerabilityToggle = useCallback((value: string) => {
    setSelectedVulnerabilities((prev) => {
      if (value === 'none') return ['none'];
      const without = prev.filter((v) => v !== 'none');
      return without.includes(value)
        ? without.filter((v) => v !== value)
        : [...without, value];
    });
  }, []);

  /**
   * Reads form values, validates with Zod, and calls `onSubmit`.
   * Sets field-level errors on validation failure.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFieldErrors({});

      const form = formRef.current;
      if (!form) return;

      const data = new FormData(form);

      const rawProfile = {
        city: (data.get('city') as string | null) ?? '',
        healthVulnerabilities: selectedVulnerabilities,
        activityLevel: (data.get('activityLevel') as string | null) ?? '',
        hasChildren: data.get('hasChildren') === 'true',
        hasElderly: data.get('hasElderly') === 'true',
        commuteMode: (data.get('commuteMode') as string | null) ?? '',
        additionalContext: (data.get('additionalContext') as string | null) || undefined,
      };

      const result = UserProfileSchema.safeParse(rawProfile);

      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        const mapped: Partial<Record<keyof UserProfile, string>> = {};
        (Object.keys(flat) as (keyof UserProfile)[]).forEach((key) => {
          const msgs = flat[key as keyof typeof flat];
          const firstMsg = msgs?.[0];
          if (firstMsg) mapped[key] = firstMsg;
        });
        setFieldErrors(mapped);
        return;
      }

      await onSubmit(result.data);
    },
    [onSubmit, selectedVulnerabilities]
  );

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      aria-label="Air quality profile form"
      noValidate
      className="space-y-6"
    >
      {/* ── Micro-Location ── */}
      <FormField
        label="Your City or Micro-Location"
        htmlFor={`${baseId}-city`}
        required
        hint="Enter your neighborhood or landmark for hyper-local AQI (e.g. Anand Vihar, New Delhi or Bandra, Mumbai)."
      >
        <div className="relative">
          <MapPin
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500"
            aria-hidden="true"
          />
          <input
            id={`${baseId}-city`}
            name="city"
            type="text"
            autoComplete="address-level2"
            placeholder="e.g. Anand Vihar, New Delhi or Whitefield, Bengaluru"
            aria-required="true"
            aria-describedby={fieldErrors.city ? `${baseId}-city-error` : `${baseId}-city-hint`}
            aria-invalid={!!fieldErrors.city}
            className={`w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm text-sky-900 placeholder-sky-400 outline-none transition-colors bg-white
              focus:ring-2 focus:ring-sky-500 focus:border-sky-500
              ${fieldErrors.city ? 'border-red-400 ring-1 ring-red-300' : 'border-sky-200 hover:border-sky-300'}`}
          />
        </div>
        {fieldErrors.city && (
          <p id={`${baseId}-city-error`} role="alert" className="text-xs text-red-600 mt-1">
            {fieldErrors.city}
          </p>
        )}
      </FormField>

      {/* ── Health Vulnerabilities ── */}
      <fieldset>
        <legend className="text-sm font-semibold text-sky-900 mb-1.5 flex items-center gap-1.5">
          <Heart size={14} aria-hidden="true" className="text-red-500" />
          Health Vulnerabilities
          <span aria-hidden="true" className="text-red-500">*</span>
        </legend>
        <p className="text-xs text-sky-600 font-medium mb-3">
          Select all conditions that apply to your household to tailor protective advice.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {HEALTH_OPTIONS.map(({ value, label }) => {
            const isChecked = selectedVulnerabilities.includes(value);
            return (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all
                  ${isChecked
                    ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-sm ring-1 ring-sky-500'
                    : 'border-sky-200 bg-white text-sky-800 hover:border-sky-300 hover:bg-sky-50/50'
                  }`}
              >
                <input
                  type="checkbox"
                  value={value}
                  checked={isChecked}
                  onChange={() => handleVulnerabilityToggle(value)}
                  className="sr-only"
                  aria-checked={isChecked}
                />
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 shrink-0 rounded border transition-colors ${
                    isChecked ? 'border-sky-600 bg-sky-600' : 'border-sky-300 bg-white'
                  }`}
                />
                {label}
              </label>
            );
          })}
        </div>
        {fieldErrors.healthVulnerabilities && (
          <p role="alert" className="text-xs text-red-600 mt-2 font-medium">
            {fieldErrors.healthVulnerabilities}
          </p>
        )}
      </fieldset>

      {/* ── Activity Level ── */}
      <FormField label="Outdoor Activity Level" htmlFor={`${baseId}-activity`} required>
        <div className="relative">
          <Activity
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500"
            aria-hidden="true"
          />
          <select
            id={`${baseId}-activity`}
            name="activityLevel"
            defaultValue="lightly_active"
            aria-required="true"
            className="w-full appearance-none rounded-lg border border-sky-200 bg-white py-2.5 pl-9 pr-8 text-sm text-sky-900 outline-none transition-colors hover:border-sky-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            {ACTIVITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </FormField>

      {/* ── Commute Mode ── */}
      <FormField label="Primary Daily Commute" htmlFor={`${baseId}-commute`} required>
        <div className="relative">
          <Car
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500"
            aria-hidden="true"
          />
          <select
            id={`${baseId}-commute`}
            name="commuteMode"
            defaultValue="public_transport"
            aria-required="true"
            className="w-full appearance-none rounded-lg border border-sky-200 bg-white py-2.5 pl-9 pr-8 text-sm text-sky-900 outline-none transition-colors hover:border-sky-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            {COMMUTE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </FormField>

      {/* ── Household toggles ── */}
      <fieldset>
        <legend className="text-sm font-semibold text-sky-900 mb-3">Household Vulnerable Members</legend>
        <div className="flex flex-wrap gap-4">
          {[
            { name: 'hasChildren', label: '👶 Children under 12' },
            { name: 'hasElderly',  label: '👴 Adults over 65' },
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name={name}
                value="true"
                className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-sky-900 font-semibold">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Additional Context ── */}
      <FormField
        label="Additional Context / Local Concerns"
        htmlFor={`${baseId}-context`}
        hint="Optional: mention nearby construction, industrial zones, highway proximity, or daily schedules."
      >
        <textarea
          id={`${baseId}-context`}
          name="additionalContext"
          rows={3}
          maxLength={500}
          placeholder="e.g. Living next to a busy flyover, morning school bus pickup at 7 AM, building renovation nearby…"
          aria-describedby={`${baseId}-context-hint`}
          className="w-full resize-none rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-sky-900 placeholder-sky-400 outline-none transition-colors hover:border-sky-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </FormField>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="group relative w-full overflow-hidden rounded-xl bg-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200
          hover:bg-sky-700 hover:shadow-lg active:scale-[0.98]
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 focus-visible:outline-offset-2
          disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <Sparkles
            size={16}
            aria-hidden="true"
            className={isLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}
          />
          {isLoading ? 'Calibrating micro-location plan…' : 'Generate Hyper-Local Survival Plan'}
        </span>
        {!isLoading && (
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700"
          />
        )}
      </button>
    </form>
  );
}
