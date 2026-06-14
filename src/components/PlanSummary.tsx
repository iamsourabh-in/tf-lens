import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { displayActionLabel } from '../lib/actionLabels';
import type { ActionCounts, PlanMetadata, NormalizedResource } from '../types/plan';
import { SummaryCharts } from './SummaryCharts';
import { ProviderIcon } from './ProviderIcon';

interface PlanSummaryProps {
  metadata: PlanMetadata;
  actionCounts: ActionCounts;
  typeCounts: Record<string, number>;
  resources: NormalizedResource[];
}

const ACTION_CARDS: Array<{
  key: keyof ActionCounts;
  className: string;
}> = [
  { key: 'create', className: 'action-create' },
  { key: 'update', className: 'action-update' },
  { key: 'delete', className: 'action-delete' },
  { key: 'replace', className: 'action-replace' },
  { key: 'read', className: 'action-read' },
  { key: 'noOp', className: 'action-noop' },
];

export function PlanSummary({
  metadata,
  actionCounts,
  typeCounts,
  resources,
}: PlanSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const top = sortedTypes.slice(0, 10);
  const rest = sortedTypes.slice(10);
  const maxTypeCount = top[0]?.[1] ?? 1;

  return (
    <section className="plan-summary">
      <div className="summary-badges">
        <span className="badge">Region: {metadata.region}</span>
        <span className="badge">Terraform {metadata.terraformVersion}</span>
        <span className="badge">Format {metadata.formatVersion}</span>
        <span className={`badge ${metadata.applyable ? 'ok' : 'warn'}`}>
          {metadata.applyable ? 'Applyable' : 'Not applyable'}
        </span>
        {metadata.errored && <span className="badge error">Errored</span>}
        <span className="badge">{metadata.resourceCount} resources</span>
      </div>

      <div className="action-cards">
        {ACTION_CARDS.map(({ key, className }) => (
          <div key={key} className={`action-card ${className}`}>
            <span className="action-count">{actionCounts[key]}</span>
            <span className="action-label">
              {displayActionLabel(
                key === 'noOp'
                  ? 'no-op'
                  : key === 'replace'
                    ? 'replace'
                    : key,
              )}
            </span>
          </div>
        ))}
      </div>

      {top.length > 0 && (
        <div className="type-breakdown">
          <h3>Resource Type Breakdown</h3>
          <ul>
            {top.map(([type, count]) => (
              <li key={type}>
                <span className="type-name-wrapper">
                  <ProviderIcon provider={type.split('_')[0]} type={type} />
                  <span className="type-name" title={type}>
                    {type}
                  </span>
                </span>
                <div className="type-bar-track">
                  <div
                    className="type-bar-fill"
                    style={{ width: `${(count / maxTypeCount) * 100}%` }}
                  />
                </div>
                <span className="type-count">{count}</span>
              </li>
            ))}
          </ul>

          {rest.length > 0 && (
            <>
              <div className={`collapsible-types-wrapper ${isExpanded ? 'expanded' : ''}`}>
                <ul className="collapsible-types-content">
                  {rest.map(([type, count]) => (
                    <li key={type}>
                      <span className="type-name-wrapper">
                        <ProviderIcon provider={type.split('_')[0]} type={type} />
                        <span className="type-name" title={type}>
                          {type}
                        </span>
                      </span>
                      <div className="type-bar-track">
                        <div
                          className="type-bar-fill"
                          style={{ width: `${(count / maxTypeCount) * 100}%` }}
                        />
                      </div>
                      <span className="type-count">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className="toggle-types-btn"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <span>{isExpanded ? 'Show Less' : `Show All (${sortedTypes.length} types)`}</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </>
          )}
        </div>
      )}

      <SummaryCharts type="plan" counts={actionCounts} resources={resources} />
    </section>
  );
}

