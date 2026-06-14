import { statusLabel } from '../lib/stateStatus';
import type { StateMetadata, StatusCounts } from '../types/state';

interface StateSummaryProps {
  metadata: StateMetadata;
  statusCounts: StatusCounts;
  typeCounts: Record<string, number>;
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

function topTypes(typeCounts: Record<string, number>, limit = 10) {
  return Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function StateSummary({
  metadata,
  statusCounts,
  typeCounts,
}: StateSummaryProps) {
  const top = topTypes(typeCounts);
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
    </section>
  );
}
