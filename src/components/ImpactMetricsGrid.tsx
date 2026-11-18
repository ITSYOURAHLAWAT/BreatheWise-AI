/**
 * @file ImpactMetricsGrid.tsx
 * @description Container that renders a responsive 2×2 (or 4-column on wide screens)
 * grid of `ImpactMetric` tiles. Provides the section heading and ARIA region label.
 *
 * @example
 * <ImpactMetricsGrid metrics={plan.impactMetrics} />
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ImpactMetric } from './ImpactMetric';
import { SectionHeader } from './SectionHeader';
import type { AiResponse } from '@/lib/types';

/** Props for `ImpactMetricsGrid`. */
interface ImpactMetricsGridProps {
  /** Array of impact metric objects from the AI response. */
  metrics: AiResponse['impactMetrics'];
}

/**
 * `ImpactMetricsGrid` — Responsive grid of key impact metrics.
 *
 * @param props - {@link ImpactMetricsGridProps}
 */
export function ImpactMetricsGrid({ metrics }: ImpactMetricsGridProps): React.ReactElement {
  return (
    <section aria-label="Impact metrics">
      <SectionHeader
        title="Your Impact Metrics"
        subtitle="Quantified benefits of following your personalised plan"
        icon={<BarChart3 size={18} />}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric, index) => (
          <ImpactMetric key={`${metric.label}-${index}`} metric={metric} />
        ))}
      </div>
    </section>
  );
}
