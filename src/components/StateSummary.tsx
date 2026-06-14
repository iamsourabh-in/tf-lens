import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { statusLabel } from '../lib/stateStatus';
import type { StateMetadata, StatusCounts, NormalizedStateResource } from '../types/state';
import { SummaryCharts } from './SummaryCharts';
import { ProviderIcon } from './ProviderIcon';

interface StateSummaryProps {
  metadata: StateMetadata;
  statusCounts: StatusCounts;
  typeCounts: Record<string, number>;
  resources: NormalizedStateResource[];
}

const STATUS_CARDS: Array<{
  key: keyof StatusCounts;
  className: string;
}> = [
  { key: 'ok', className: 'status-ok' },
  { key: 'tainted', className: 'status-tainted' },
  { key: 'deposed', className: 'status-deposed' },
  { key: 'missing', className: 'status-missing' },
  { key: 'failed', className: 'status-failed' },
];

export function StateSummary({
  metadata,
  statusCounts,
  typeCounts,
  resources,
}: StateSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const top = sortedTypes.slice(0, 10);
  const rest = sortedTypes.slice(10);
  const maxTypeCount = top[0]?.[1] ?? 1;

  return (
    <section className="plan-summary state-summary">
      <div className="summary-badges">
        <span className="badge">Region: {metadata.region}</span>
        <span className="badge">Terraform {metadata.terraformVersion}</span>
        <span className="badge">
          Format: {metadata.format === 'legacy' ? 'tfstate' : 'show-json'}
        </span>
        {metadata.stateVersion !== undefined && (
          <span className="badge">State v{metadata.stateVersion}</span>
        )}
        {metadata.formatVersion && (
          <span className="badge">Format {metadata.formatVersion}</span>
        )}
        {metadata.serial !== undefined && (
          <span className="badge">Serial {metadata.serial}</span>
        )}
        {metadata.lineage && (
          <span className="badge mono" title={metadata.lineage}>
            Lineage {metadata.lineage.slice(0, 8)}…
          </span>
        )}
        <span className="badge">{metadata.resourceCount} resources</span>
      </div>

      <div className="action-cards status-cards">
        {STATUS_CARDS.map(({ key, className }) => (
          <div key={key} className={`action-card status-card ${className}`}>
            <span className="action-count">{statusCounts[key]}</span>
            <span className="action-label">{statusLabel(key)}</span>
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

      <SummaryCharts type="state" counts={statusCounts} resources={resources} />
    </section>
  );
}

