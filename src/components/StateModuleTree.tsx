import { useMemo } from 'react';
import { statusClassName, statusLabel } from '../lib/stateStatus';
import type { NormalizedStateResource } from '../types/state';

interface StateModuleTreeProps {
  resources: NormalizedStateResource[];
}

interface ModuleNode {
  name: string;
  fullPath: string;
  resources: NormalizedStateResource[];
  children: ModuleNode[];
  statusCounts: Record<string, number>;
}

function buildModuleTree(resources: NormalizedStateResource[]): ModuleNode[] {
  const root: ModuleNode = {
    name: '(root)',
    fullPath: '',
    resources: [],
    children: [],
    statusCounts: {},
  };

  const nodeMap = new Map<string, ModuleNode>([['', root]]);

  for (const resource of resources) {
    const path = resource.moduleAddress || '';
    const segments = path ? path.split('.') : [];

    let currentPath = '';
    let parent = root;

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}.${segment}` : segment;
      let node = nodeMap.get(currentPath);
      if (!node) {
        node = {
          name: segment,
          fullPath: currentPath,
          resources: [],
          children: [],
          statusCounts: {},
        };
        nodeMap.set(currentPath, node);
        parent.children.push(node);
      }
      parent = node;
    }

    parent.resources.push(resource);
    parent.statusCounts[resource.status] =
      (parent.statusCounts[resource.status] ?? 0) + 1;
  }

  const sortNodes = (nodes: ModuleNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(root.children);

  return root.children;
}

function ModuleNodeView({ node, depth = 0 }: { node: ModuleNode; depth?: number }) {
  const statusSummary = Object.entries(node.statusCounts)
    .map(([status, count]) => `${statusLabel(status as never)}: ${count}`)
    .join(', ');

  return (
    <details className="module-node" open={depth < 1} style={{ marginLeft: depth * 16 }}>
      <summary>
        <strong>{node.name}</strong>
        <span className="module-meta">
          {node.resources.length} direct
          {node.children.length > 0 ? ` · ${node.children.length} children` : ''}
          {statusSummary ? ` · ${statusSummary}` : ''}
        </span>
      </summary>
      {node.resources.length > 0 && (
        <ul className="module-resource-list">
          {node.resources.map((resource) => (
            <li key={resource.id}>
              <span className={statusClassName(resource.status)}>
                {statusLabel(resource.status)}
              </span>
              <span className="mono">{resource.address}</span>
            </li>
          ))}
        </ul>
      )}
      {node.children.map((child) => (
        <ModuleNodeView key={child.fullPath} node={child} depth={depth + 1} />
      ))}
    </details>
  );
}

export function StateModuleTree({ resources }: StateModuleTreeProps) {
  const tree = useMemo(() => buildModuleTree(resources), [resources]);
  const rootResources = resources.filter((resource) => !resource.moduleAddress);

  return (
    <section className="module-tree">
      {rootResources.length > 0 && (
        <details className="module-node" open>
          <summary>
            <strong>(root)</strong>
            <span className="module-meta">{rootResources.length} resources</span>
          </summary>
          <ul className="module-resource-list">
            {rootResources.map((resource) => (
              <li key={resource.id}>
                <span className={statusClassName(resource.status)}>
                  {statusLabel(resource.status)}
                </span>
                <span className="mono">{resource.address}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {tree.map((node) => (
        <ModuleNodeView key={node.fullPath} node={node} />
      ))}
      {tree.length === 0 && rootResources.length === 0 && (
        <p className="empty-state">No module data available.</p>
      )}
    </section>
  );
}
