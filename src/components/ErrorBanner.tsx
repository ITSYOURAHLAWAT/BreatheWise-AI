/**
 * @file ErrorBanner.tsx
 * @description Dismissable error alert banner with ARIA live region support.
 * Displays a user-friendly error message and a dismiss button.
 *
 * @example
 * <ErrorBanner message="API key not configured." onDismiss={() => setError(null)} />
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { ErrorBannerProps } from '@/lib/types';

/**
 * `ErrorBanner` — Full-width error notification with dismiss capability.
 *
 * @param props - {@link ErrorBannerProps}
 */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps): React.ReactElement {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 animate-fade-in"
    >
      <AlertTriangle
        size={20}
        className="mt-0.5 shrink-0 text-red-600"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Something went wrong</p>
        <p className="text-sm mt-0.5 break-words">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 rounded-md p-1 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 transition-colors"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
