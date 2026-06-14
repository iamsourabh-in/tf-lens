import type { StateCheckResult } from '../types/state';
import { EmptyState } from './EmptyState';

interface IssuesPanelProps {
  issues: string[];
  checkResults: StateCheckResult[];
}

export function IssuesPanel({ issues, checkResults }: IssuesPanelProps) {
  const failedChecks = checkResults.filter((result) => result.status === 'fail');

  if (issues.length === 0 && failedChecks.length === 0) {
    return (
      <EmptyState>No issues detected in this state file.</EmptyState>
    );
  }

  return (
    <div className="issues-panel">
      {failedChecks.length > 0 && (
        <section>
          <h3>Check failures</h3>
          <table className="resource-table">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Address</th>
                <th>Status</th>
                <th>Messages</th>
              </tr>
            </thead>
            <tbody>
              {failedChecks.map((result) => (
                <tr key={`${result.configAddr}-${result.objectKind}`}>
                  <td>{result.objectKind}</td>
                  <td className="mono">{result.configAddr}</td>
                  <td>
                    <span className="status-chip status-failed">Fail</span>
                  </td>
                  <td>
                    {result.messages.length > 0
                      ? result.messages.join('; ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {issues.length > 0 && (
        <section>
          <h3>Resource and state issues ({issues.length})</h3>
          <ul className="issues-list">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
