import { displayActionLabel } from '../lib/actionLabels';
import type { NormalizedOutput } from '../types/plan';
import { JsonTree } from './JsonTree';

interface OutputsPanelProps {
  outputs: NormalizedOutput[];
}

function previewValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    return value.length > 80 ? `${value.slice(0, 80)}…` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value).slice(0, 80);
}

export function OutputsPanel({ outputs }: OutputsPanelProps) {
  if (outputs.length === 0) {
    return <p className="empty-state">No output changes in this plan.</p>;
  }

  return (
    <div className="outputs-panel">
      <table className="resource-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Name</th>
            <th>After preview</th>
            <th>Unknown</th>
          </tr>
        </thead>
        <tbody>
          {outputs.map((output) => (
            <tr key={output.name}>
              <td>
                <span className={`action-chip action-${output.displayAction}`}>
                  {displayActionLabel(output.displayAction)}
                </span>
              </td>
              <td className="mono">{output.name}</td>
              <td>{previewValue(output.after)}</td>
              <td>{output.afterUnknown ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="output-details">
        {outputs.map((output) => (
          <details key={output.name} className="output-detail">
            <summary>{output.name}</summary>
            <div className="output-json">
              <h4>Before</h4>
              <JsonTree value={output.before} />
              <h4>After</h4>
              <JsonTree value={output.after} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
