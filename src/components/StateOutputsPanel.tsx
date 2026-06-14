import type { StateOutput } from '../types/state';
import { JsonTree } from './JsonTree';

interface StateOutputsPanelProps {
  outputs: Record<string, StateOutput>;
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

export function StateOutputsPanel({ outputs }: StateOutputsPanelProps) {
  const entries = Object.entries(outputs);

  if (entries.length === 0) {
    return <p className="empty-state">No outputs in this state file.</p>;
  }

  return (
    <div className="outputs-panel">
      <table className="resource-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Value preview</th>
            <th>Sensitive</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, output]) => (
            <tr key={name}>
              <td className="mono">{name}</td>
              <td>{output.type ?? '—'}</td>
              <td>{previewValue(output.value)}</td>
              <td>{output.sensitive ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="output-details">
        {entries.map(([name, output]) => (
          <details key={name} className="output-detail">
            <summary>{name}</summary>
            <div className="output-json">
              <JsonTree
                value={output.value}
                sensitive={output.sensitive === true}
              />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
