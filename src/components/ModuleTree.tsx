import { useMemo } from 'react';
import { displayActionLabel } from '../lib/actionLabels';
import type { NormalizedResource } from '../types/plan';

interface ModuleTreeProps {
  resources: NormalizedResource[];
}

interface ModuleNode {
  name: string;
  fullPath: string;
  resources: NormalizedResource[];
  children: ModuleNode[];
  actionCounts: Record<string, number>;
}

function buildModuleTree(resources: NormalizedResource[]): ModuleNode[] {
  const root: ModuleNode = {
    name: '(root)',
    fullPath: '',
    resources: [],
    children: [],
    actionCounts: {},
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
          actionCounts: {},
        };
        nodeMap.set(currentPath, node);
        parent.children.push(node);
      }
      parent = node;
    }

    parent.resources.push(resource);
    parent.actionCounts[resource.displayAction] =
      (parent.actionCounts[resource.displayAction] ?? 0) + 1;
  }

  const sortNodes = (nodes: ModuleNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(root.children);

  return root.children;
}

function ModuleNodeView({ node, depth = 0 }: { node: ModuleNode; depth?: number }) {
  const totalResources =
    node.resources.length +
    node.children.reduce(
      (sum, child) =>
        sum +
        child.resources.length +
        child.children.reduce((inner, nested) => inner + nested.resources.length, 0),
      0,
    );

  const actionSummary = Object.entries(node.actionCounts)
    .map(([action, count]) => `${displayActionLabel(action as never)}: ${count}`)
    .join(', ');

  return (
    <details className="module-node" open={depth < 1} style={{ marginLeft: depth * 16 }}>
      <summary>
        <strong>{node.name}</strong>
        <span className="module-meta">
          {node.resources.length} direct
          {node.children.length > 0 ? ` · ${node.children.length} children` : ''}
          {actionSummary ? ` · ${actionSummary}` : ''}
        </span>
      </summary>
      {node.resources.length > 0 && (
        <ul className="module-resource-list">
          {node.resources.map((resource) => (
            <li key={resource.id}>
              <span className={`action-chip action-${resource.displayAction}`}>
                {displayActionLabel(resource.displayAction)}
              </span>
              <span className="mono">{resource.address}</span>
            </li>
          ))}
        </ul>
      )}
      {node.children.map((child) => (
        <ModuleNodeView key={child.fullPath} node={child} depth={depth + 1} />
      ))}
      {totalResources === 0 && (
        <p className="empty-state">No resources in this module.</p>
      )}
    </details>
  );
}

export function ModuleTree({ resources }: ModuleTreeProps) {
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
                <span className={`action-chip action-${resource.displayAction}`}>
                  {displayActionLabel(resource.displayAction)}
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
