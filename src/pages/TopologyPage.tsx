import { useMemo, useState } from 'react';
import type { ParsedPlan } from '../types/plan';
import type { ParsedState } from '../types/state';
import { Network } from 'lucide-react';

interface TopologyPageProps {
  plan: ParsedPlan | null;
  state: ParsedState | null;
}

export function TopologyPage({ plan, state }: TopologyPageProps) {
  // Extract nodes from plan or state
  const resources = useMemo(() => {
    if (plan) {
      return plan.resources.map(r => ({
        id: r.id,
        address: r.address,
        type: r.type,
        name: r.name,
        provider: r.provider,
        status: r.displayAction,
        dependsOn: (r.raw as any)?.depends_on ?? [],
      }));
    }
    if (state) {
      return state.resources.map(r => ({
        id: r.id,
        address: r.address,
        type: r.type,
        name: r.name,
        provider: r.provider,
        status: r.status,
        dependsOn: (r.raw as any)?.depends_on ?? [],
      }));
    }
    return [];
  }, [plan, state]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Layout nodes (circular layout center around 300, 200)
  const layoutNodes = useMemo(() => {
    if (resources.length === 0) return [];
    
    // Limit to 16 nodes for visual cleanliness
    const activeNodes = resources.slice(0, 16);
    const count = activeNodes.length;
    const center = { x: 300, y: 200 };
    const radius = 140;

    return activeNodes.map((node, i) => {
      const angle = (i * 2 * Math.PI) / count;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      return {
        ...node,
        x,
        y,
      };
    });
  }, [resources]);

  // Find connections between nodes based on dependsOn address matches
  const connections = useMemo(() => {
    const list: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; key: string }> = [];
    const nodeMap = new Map(layoutNodes.map(n => [n.address, n]));
    
    layoutNodes.forEach(node => {
      node.dependsOn.forEach((dep: string) => {
        const target = nodeMap.get(dep) || [...nodeMap.values()].find(n => dep.includes(n.address));
        if (target) {
          list.push({
            from: { x: node.x, y: node.y },
            to: { x: target.x, y: target.y },
            key: `${node.address}-${target.address}`,
          });
        }
      });
    });
    return list;
  }, [layoutNodes]);

  if (resources.length === 0) {
    return (
      <div className="topology-page">
        <header className="page-header">
          <h1>Infrastructure Topology</h1>
          <p>Visual relationship graph of your cloud infrastructure.</p>
        </header>
        <div className="empty-state">
          <Network size={48} className="logo-pulse" style={{ color: 'var(--color-accent)' }} />
          <h3>No Plan or State File Loaded</h3>
          <p>Upload a Terraform plan or state file on the Plan/State tabs to view the auto-generated topology map.</p>
        </div>
      </div>
    );
  }

  const selectedResourceDetail = resources.find(r => r.address === selectedNode);

  return (
    <div className="topology-page">
      <header className="page-header">
        <h1>Infrastructure Topology</h1>
        <p>Interactive graph showing resource dependencies and relationships ({resources.length} total resources).</p>
      </header>

      <div className="topology-layout">
        <div className="topology-canvas-wrapper">
          <svg viewBox="0 0 600 400" className="topology-canvas">
            {/* Draw connection lines */}
            {connections.map(conn => (
              <line
                key={conn.key}
                x1={conn.from.x}
                y1={conn.from.y}
                x2={conn.to.x}
                y2={conn.to.y}
                stroke="var(--color-accent-border)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="connection-line"
              />
            ))}

            {/* Draw resource nodes */}
            {layoutNodes.map(node => {
              const isSelected = selectedNode === node.address;
              return (
                <g
                  key={node.address}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node.address)}
                  className={`node-group ${isSelected ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r="22"
                    fill="var(--color-surface)"
                    stroke={isSelected ? 'var(--color-accent)' : 'var(--color-border)'}
                    strokeWidth={isSelected ? '3' : '1.5'}
                    style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))' }}
                  />
                  <circle
                    r="8"
                    cx="16"
                    cy="-16"
                    fill="var(--color-accent)"
                  />
                  <text
                    x="16"
                    y="-16"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {node.provider.charAt(0).toUpperCase()}
                  </text>
                  
                  <text
                    y="36"
                    textAnchor="middle"
                    fill="var(--color-text-strong)"
                    fontSize="10"
                    fontWeight="600"
                    className="node-label"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {selectedResourceDetail && (
          <div className="topology-side-panel">
            <h3>Resource Inspector</h3>
            <div className="inspector-card">
              <dl className="detail-meta">
                <dt>Address</dt>
                <dd className="mono">{selectedResourceDetail.address}</dd>
                <dt>Type</dt>
                <dd className="mono">{selectedResourceDetail.type}</dd>
                <dt>Provider</dt>
                <dd className="mono">{selectedResourceDetail.provider}</dd>
                <dt>Status/Action</dt>
                <dd>
                  <span className={`status-chip status-${selectedResourceDetail.status}`}>
                    {selectedResourceDetail.status}
                  </span>
                </dd>
              </dl>
              {selectedResourceDetail.dependsOn.length > 0 && (
                <div className="inspector-dependencies">
                  <h4>Depends On:</h4>
                  <ul>
                    {selectedResourceDetail.dependsOn.map((dep: string) => (
                      <li key={dep} className="mono">{dep}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
