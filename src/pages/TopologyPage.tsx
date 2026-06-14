import { useMemo, useState, useRef } from 'react';
import type { ParsedPlan, NormalizedResource } from '../types/plan';
import type { ParsedState, NormalizedStateResource } from '../types/state';
import { Network, Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { ProviderIcon } from '../components/ProviderIcon';

interface TopologyPageProps {
  plan: ParsedPlan | null;
  state: ParsedState | null;
}

function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'create' || s === 'ok' || s === 'active') return 'var(--color-success)';
  if (s === 'update' || s === 'tainted') return 'var(--color-warning)';
  if (s === 'delete' || s === 'failed') return 'var(--color-danger)';
  if (s === 'replace') return 'var(--color-replace, #a855f7)';
  return 'var(--color-text-muted)';
}

export function TopologyPage({ plan, state }: TopologyPageProps) {
  // Extract and infer nodes from plan or state
  const resources = useMemo(() => {
    let rawList: Array<NormalizedResource | NormalizedStateResource> = [];
    if (plan) {
      rawList = plan.resources;
    } else if (state) {
      rawList = state.resources;
    }

    if (rawList.length === 0) return [];

    // Map base properties
    const mapped = rawList.map(r => {
      const isPlan = 'displayAction' in r;
      return {
        id: r.id,
        address: r.address,
        type: r.type,
        name: r.name,
        provider: r.provider,
        status: isPlan ? (r as NormalizedResource).displayAction : (r as NormalizedStateResource).status,
        dependsOn: r.dependencies ?? [],
        attributes: isPlan ? (r as NormalizedResource).after : (r as NormalizedStateResource).attributes,
        moduleAddress: r.moduleAddress || '(root)',
      };
    });

    // Address list for mapping
    const addressSet = new Set(mapped.map(r => r.address));

    // Dynamic Dependency Inference Engine
    // Scan attributes for references if dependsOn is empty or needs enrichment
    mapped.forEach(node => {
      const explicitDeps = new Set(node.dependsOn);
      
      const scan = (val: unknown) => {
        if (typeof val === 'string') {
          for (const addr of addressSet) {
            if (addr !== node.address && val.includes(addr)) {
              explicitDeps.add(addr);
            }
          }
        } else if (val && typeof val === 'object') {
          try {
            Object.values(val as Record<string, unknown>).forEach(scan);
          } catch {
            // Ignored if not record-like
          }
        }
      };
      
      scan(node.attributes);
      node.dependsOn = Array.from(explicitDeps);
    });

    return mapped;
  }, [plan, state]);

  // Interactive controls state
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Layout center coordinates & boundary parameters
  const canvasWidth = 800;
  const canvasHeight = 600;

  // Clustered Layout Engine
  // Arranges module resources in localized circles to clearly present systems structure
  const layoutNodes = useMemo(() => {
    if (resources.length === 0) return [];

    // Group resources by module
    const moduleGroups: Record<string, typeof resources> = {};
    resources.forEach(node => {
      const mod = node.moduleAddress;
      if (!moduleGroups[mod]) moduleGroups[mod] = [];
      moduleGroups[mod].push(node);
    });

    const modules = Object.keys(moduleGroups);
    const numModules = modules.length;

    // Position centers of modules in circular orbit around canvas center
    const center = { x: canvasWidth / 2, y: canvasHeight / 2 };
    const moduleOrbitRadius = numModules <= 1 ? 0 : 180 + numModules * 15;
    
    const moduleCenters: Record<string, { x: number; y: number }> = {};
    modules.forEach((mod, index) => {
      const angle = (index * 2 * Math.PI) / numModules;
      moduleCenters[mod] = {
        x: center.x + moduleOrbitRadius * Math.cos(angle),
        y: center.y + moduleOrbitRadius * Math.sin(angle),
      };
    });

    // Arrange nodes within each module cluster
    const nodesList: Array<typeof resources[0] & { x: number; y: number }> = [];
    
    modules.forEach(mod => {
      const group = moduleGroups[mod];
      const modCenter = moduleCenters[mod];
      const count = group.length;
      
      // Node arrangement radius inside module cluster
      const clusterRadius = count <= 1 ? 0 : 35 + count * 8;

      group.forEach((node, i) => {
        const angle = count <= 1 ? 0 : (i * 2 * Math.PI) / count;
        const x = modCenter.x + clusterRadius * Math.cos(angle);
        const y = modCenter.y + clusterRadius * Math.sin(angle);
        nodesList.push({
          ...node,
          x,
          y,
        });
      });
    });

    return nodesList;
  }, [resources]);

  // Bounding boxes for each module group to visually structure modules
  const moduleBounds = useMemo(() => {
    const bounds: Array<{ module: string; minX: number; minY: number; maxX: number; maxY: number }> = [];
    const moduleGroups: Record<string, typeof layoutNodes> = {};
    
    layoutNodes.forEach(node => {
      const mod = node.moduleAddress;
      if (!moduleGroups[mod]) moduleGroups[mod] = [];
      moduleGroups[mod].push(node);
    });

    Object.entries(moduleGroups).forEach(([mod, nodes]) => {
      if (nodes.length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      nodes.forEach(n => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
      });

      const pad = 38;
      // If single node, draw a default sized box
      if (nodes.length === 1) {
        bounds.push({
          module: mod,
          minX: minX - 45,
          minY: minY - 45,
          maxX: maxX + 45,
          maxY: maxY + 45,
        });
      } else {
        bounds.push({
          module: mod,
          minX: minX - pad,
          minY: minY - pad,
          maxX: maxX + pad,
          maxY: maxY + pad,
        });
      }
    });

    return bounds;
  }, [layoutNodes]);

  // Find connections between nodes based on dependsOn address matches
  const connections = useMemo(() => {
    const list: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; key: string }> = [];
    const nodeMap = new Map(layoutNodes.map(n => [n.address, n]));
    
    layoutNodes.forEach(node => {
      node.dependsOn.forEach((dep: string) => {
        const target = nodeMap.get(dep) || [...nodeMap.values()].find(n => dep.includes(n.address) || n.address.includes(dep));
        if (target && target.address !== node.address) {
          list.push({
            from: { x: node.x, y: node.y },
            to: { x: target.x, y: target.y },
            key: `${node.address}-${target.address}`,
          });
        }
      });
    });
    
    // De-duplicate lines
    const seen = new Set<string>();
    return list.filter(item => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
  }, [layoutNodes]);

  // Mouse handlers for SVG panning and dragging
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only drag when clicking canvas background or module box
    const tagName = (e.target as SVGElement).tagName;
    if (tagName === 'svg' || tagName === 'rect' || (e.target as SVGElement).classList.contains('panning-layer')) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor: number) => {
    setZoom(z => Math.max(0.4, Math.min(2.5, z * factor)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setSearch('');
  };

  if (resources.length === 0) {
    return (
      <div className="topology-page">
        <header className="page-header">
          <h1>tf-lens Topology Explorer</h1>
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
        <div>
          <h1>tf-lens Topology Explorer</h1>
          <p>Interactive graph showing resource dependencies and relationships ({resources.length} total resources).</p>
        </div>
      </header>

      {/* Control panel for filters & zoom */}
      <div className="topology-filters-bar">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search resource type or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="canvas-zoom-buttons">
          <button type="button" className="button" onClick={() => handleZoom(1.25)} data-tooltip="Zoom In">
            <ZoomIn size={16} />
          </button>
          <button type="button" className="button" onClick={() => handleZoom(0.8)} data-tooltip="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <button type="button" className="button" onClick={handleReset} data-tooltip="Reset view and filters">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="topology-layout">
        <div className="topology-canvas-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className="topology-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', width: '100%', height: '100%' }}
          >
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="dependency-arrow"
                viewBox="0 0 10 10"
                refX="25"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-accent-border)" />
              </marker>
              <marker
                id="dependency-arrow-selected"
                viewBox="0 0 10 10"
                refX="25"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-accent)" />
              </marker>
            </defs>

            {/* Panning/Zooming Layer */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="panning-layer">
              
              {/* Module Bounding Boxes */}
              {moduleBounds.map(box => {
                const width = box.maxX - box.minX;
                const height = box.maxY - box.minY;
                return (
                  <g key={box.module} className="module-group-box">
                    <rect
                      x={box.minX}
                      y={box.minY}
                      width={width}
                      height={height}
                      rx="12"
                      ry="12"
                      fill="var(--color-surface-hover)"
                      stroke="var(--color-border)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.5"
                    />
                    <text
                      x={box.minX + 10}
                      y={box.minY + 20}
                      fill="var(--color-text-muted)"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="var(--font-mono)"
                    >
                      {box.module}
                    </text>
                  </g>
                );
              })}

              {/* Draw connection lines */}
              {connections.map(conn => {
                const isSelectedNodeRelated = selectedNode && (
                  conn.key.startsWith(`${selectedNode}-`) || 
                  conn.key.endsWith(`-${selectedNode}`)
                );
                
                // Search matching states
                const fromNode = layoutNodes.find(n => n.address === conn.key.split('-')[0]);
                const toNode = layoutNodes.find(n => n.address === conn.key.split('-')[1]);
                
                const matchesSearch = search === '' || (
                  (fromNode?.address.toLowerCase().includes(search.toLowerCase()) || fromNode?.type.toLowerCase().includes(search.toLowerCase())) &&
                  (toNode?.address.toLowerCase().includes(search.toLowerCase()) || toNode?.type.toLowerCase().includes(search.toLowerCase()))
                );

                const opacity = selectedNode 
                  ? (isSelectedNodeRelated ? 1 : 0.1) 
                  : (search ? (matchesSearch ? 0.7 : 0.15) : 0.4);

                const stroke = isSelectedNodeRelated ? 'var(--color-accent)' : 'var(--color-border)';
                const strokeWidth = isSelectedNodeRelated ? 2.5 : 1.5;
                const strokeDasharray = isSelectedNodeRelated ? undefined : '3 3';
                const marker = isSelectedNodeRelated ? 'url(#dependency-arrow-selected)' : 'url(#dependency-arrow)';

                return (
                  <line
                    key={conn.key}
                    x1={conn.from.x}
                    y1={conn.from.y}
                    x2={conn.to.x}
                    y2={conn.to.y}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    markerEnd={marker}
                    style={{ opacity, transition: 'all 0.25s ease' }}
                    className="connection-line"
                  />
                );
              })}

              {/* Draw resource nodes */}
              {layoutNodes.map(node => {
                const isSelected = selectedNode === node.address;
                
                // Matches Search Filter
                const isMatched = search === '' || 
                  node.address.toLowerCase().includes(search.toLowerCase()) ||
                  node.type.toLowerCase().includes(search.toLowerCase());

                const isDimmed = search !== '' && !isMatched;
                const opacity = isDimmed 
                  ? 0.15 
                  : (selectedNode ? (isSelected ? 1 : 0.6) : 1);

                return (
                  <g
                    key={node.address}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node.address)}
                    className={`node-group ${isSelected ? 'selected' : ''}`}
                    style={{ cursor: 'pointer', opacity, transition: 'all 0.25s ease' }}
                  >
                    {/* Inner Drop Shadow / Outer border */}
                    <circle
                      r="20"
                      fill="var(--color-surface)"
                      stroke={isSelected ? 'var(--color-accent)' : 'var(--color-border)'}
                      strokeWidth={isSelected ? '3' : '1.5'}
                      style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}
                    />
                    
                    {/* Dynamic Provider Icon via foreignObject */}
                    <foreignObject x="-10" y="-10" width="20" height="20" pointerEvents="none">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <ProviderIcon provider={node.provider} type={node.type} />
                      </div>
                    </foreignObject>

                    {/* Status Dot indicator */}
                    <circle
                      r="5"
                      cx="14"
                      cy="14"
                      fill={getStatusColor(node.status)}
                      stroke="var(--color-surface)"
                      strokeWidth="1.5"
                    />
                    
                    {/* Node Text Label */}
                    <text
                      y="32"
                      textAnchor="middle"
                      fill="var(--color-text-strong)"
                      fontSize="9"
                      fontWeight="600"
                      className="node-label"
                      style={{ background: 'var(--color-surface)' }}
                    >
                      {node.name.length > 18 ? `${node.name.slice(0, 15)}…` : node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          
          {/* Zoom & drag tip info */}
          <div className="canvas-tooltip-info">
            <span>Scroll background to drag canvas. Click node to inspect details.</span>
          </div>
        </div>

        {/* Selected Resource Inspector Panel */}
        <div className="topology-side-panel">
          {selectedResourceDetail ? (
            <div className="inspector-card">
              <div className="inspector-header">
                <ProviderIcon provider={selectedResourceDetail.provider} type={selectedResourceDetail.type} className="large-icon" />
                <div>
                  <h3>Resource Inspector</h3>
                  <span className="mono subtitle-text">{selectedResourceDetail.name}</span>
                </div>
              </div>
              
              <dl className="detail-meta">
                <div>
                  <dt>Address</dt>
                  <dd className="mono selectable-text" title={selectedResourceDetail.address}>
                    {selectedResourceDetail.address}
                  </dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd className="mono">{selectedResourceDetail.type}</dd>
                </div>
                <div>
                  <dt>Provider</dt>
                  <dd className="mono">{selectedResourceDetail.provider}</dd>
                </div>
                <div>
                  <dt>Module</dt>
                  <dd className="mono">{selectedResourceDetail.moduleAddress}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className="type-name-wrapper">
                      <span
                        className="legend-indicator"
                        style={{
                          backgroundColor: getStatusColor(selectedResourceDetail.status),
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                        }}
                      />
                      <span className="mono" style={{ textTransform: 'capitalize' }}>
                        {selectedResourceDetail.status}
                      </span>
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="inspector-dependencies">
                <h4>Depends On ({selectedResourceDetail.dependsOn.length})</h4>
                {selectedResourceDetail.dependsOn.length > 0 ? (
                  <ul>
                    {selectedResourceDetail.dependsOn.map((dep: string) => (
                      <li
                        key={dep}
                        className="mono dependency-item-link"
                        onClick={() => setSelectedNode(dep)}
                        style={{ cursor: 'pointer' }}
                        title="Click to inspect this dependency"
                      >
                        {dep.split('.').pop()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-deps-text">No detected dependencies.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="inspector-placeholder">
              <Network size={28} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
              <p>Select a node in the topology canvas to inspect resource details and dependencies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
