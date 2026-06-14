import { JsonTree } from './JsonTree';

interface VariablesPanelProps {
  variables: Record<string, unknown>;
}

export function VariablesPanel({ variables }: VariablesPanelProps) {
  const entries = Object.entries(variables).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return <p className="empty-state">No variables found in this plan.</p>;
  }

  return (
    <div className="variables-panel">
      {entries.map(([name, value]) => (
        <details key={name} className="variable-detail">
          <summary className="mono">{name}</summary>
          <JsonTree value={value} />
        </details>
      ))}
    </div>
  );
}
