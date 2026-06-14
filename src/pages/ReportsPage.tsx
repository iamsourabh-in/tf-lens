import { useMemo } from 'react';
import type { ParsedPlan } from '../types/plan';
import type { ParsedState } from '../types/state';
import { ShieldAlert, FileText, CheckCircle, Award } from 'lucide-react';

interface ReportsPageProps {
  plan: ParsedPlan | null;
  state: ParsedState | null;
}

export function ReportsPage({ plan, state }: ReportsPageProps) {
  const resources = useMemo(() => {
    if (plan) return plan.resources;
    if (state) return state.resources;
    return [];
  }, [plan, state]);

  // Provider Analysis
  const providerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    resources.forEach(r => {
      stats[r.provider] = (stats[r.provider] ?? 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [resources]);

  // Simple Security compliance report: Scan resource attributes for sensitive-looking keys
  const securityIssues = useMemo(() => {
    const list: Array<{ resource: string; key: string; issue: string }> = [];

    resources.forEach(r => {
      const attrs = ('attributes' in r) ? r.attributes : (r.after ?? r.before);
      if (!attrs || typeof attrs !== 'object') return;

      const scanKeys = ['password', 'secret', 'token', 'private_key', 'admin_password'];
      const record = attrs as Record<string, unknown>;

      scanKeys.forEach(scanKey => {
        if (record[scanKey] !== undefined && record[scanKey] !== null) {
          const value = String(record[scanKey]);
          const isMasked = value.includes('*') || value.includes('masked') || value.includes('sensitive');
          if (!isMasked && value.length > 0) {
            list.push({
              resource: r.address,
              key: scanKey,
              issue: `Unmasked plain-text sensitive attribute '${scanKey}' found.`,
            });
          }
        }
      });
    });

    return list;
  }, [resources]);

  if (resources.length === 0) {
    return (
      <div className="reports-page">
        <header className="page-header">
          <h1>Security & Compliance Report</h1>
          <p>Analysis of your cloud infrastructure configuration.</p>
        </header>
        <div className="empty-state">
          <FileText size={48} className="logo-pulse" style={{ color: 'var(--color-accent)' }} />
          <h3>No Plan or State File Loaded</h3>
          <p>Upload a Terraform plan or state file on the Plan/State tabs to generate compliance reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <header className="page-header">
        <h1>Security & Compliance Report</h1>
        <p>Compliance evaluation, provider usage, and security audits for your configurations.</p>
      </header>

      <div className="reports-grid">
        {/* Compliance Card */}
        <div className="report-card compliance-summary">
          <div className="report-card-header">
            <Award size={20} className="report-icon-accent" />
            <h3>Compliance Status</h3>
          </div>
          <div className="compliance-score-box">
            <div className="score-ring">
              {securityIssues.length === 0 ? (
                <CheckCircle size={44} className="compliance-success-icon" />
              ) : (
                <span className="score-val">{Math.max(100 - securityIssues.length * 10, 0)}%</span>
              )}
            </div>
            <div className="score-text">
              <span className="score-label">Security Score</span>
              <span className="score-description">
                {securityIssues.length === 0 
                  ? 'All security checklist requirements satisfied. Great job!' 
                  : `${securityIssues.length} compliance warnings flagged. Please inspect below.`}
              </span>
            </div>
          </div>
        </div>

        {/* Provider Analysis Card */}
        <div className="report-card providers-summary">
          <div className="report-card-header">
            <FileText size={20} className="report-icon-accent" />
            <h3>Provider Statistics</h3>
          </div>
          <ul className="provider-stat-list">
            {providerStats.map(([provider, count]) => (
              <li key={provider}>
                <span className="provider-name">{provider}</span>
                <span className="provider-bar-wrap">
                  <span 
                    className="provider-bar-fill" 
                    style={{ width: `${(count / resources.length) * 100}%` }}
                  />
                </span>
                <span className="provider-count">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Security Scan Card */}
        <div className="report-card security-summary">
          <div className="report-card-header">
            <ShieldAlert size={20} className="report-icon-danger" />
            <h3>Sensitive Data Audit</h3>
          </div>
          
          {securityIssues.length === 0 ? (
            <div className="report-clean-state">
              <CheckCircle size={28} className="compliance-success-icon" />
              <p>No plaintext secrets detected in attributes scanner.</p>
            </div>
          ) : (
            <div className="report-issues-table-wrap">
              <table className="report-issues-table">
                <thead>
                  <tr>
                    <th>Resource Address</th>
                    <th>Attribute</th>
                    <th>Audit Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {securityIssues.map((issue, idx) => (
                    <tr key={idx}>
                      <td className="mono font-semibold">{issue.resource}</td>
                      <td className="mono">{issue.key}</td>
                      <td className="compliance-issue-desc">{issue.issue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
