import { displayActionLabel } from '../lib/actionLabels';
import type { ActionCounts, PlanMetadata } from '../types/plan';
import { SummaryCharts } from './SummaryCharts';

interface PlanSummaryProps {
  metadata: PlanMetadata;
  actionCounts: ActionCounts;
  typeCounts: Record<string, number>;
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

function topTypes(typeCounts: Record<string, number>, limit = 10) {
  return Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function PlanSummary({
  metadata,
  actionCounts,
  typeCounts,
}: PlanSummaryProps) {
  const top = topTypes(typeCounts);
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
          <h3>Top 10 resource types</h3>
          <ul>
            {top.map(([type, count]) => (
              <li key={type}>
                <span className="type-name" title={type}>
                  {type}
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
      )}

      <SummaryCharts type="plan" counts={actionCounts} />
    </section>
  );
}
