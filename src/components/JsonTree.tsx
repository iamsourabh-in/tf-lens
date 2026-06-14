import { useState } from 'react';

interface JsonTreeProps {
  value: unknown;
  sensitive?: boolean;
  sensitivePaths?: string[][];
  path?: string[];
  showSensitive?: boolean;
  depth?: number;
  label?: string;
}

function isExpandable(value: unknown): value is Record<string, unknown> | unknown[] {
  return (
    value !== null &&
    typeof value === 'object' &&
    (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0)
  );
}

function preview(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) return `Array(${value.length})`;
  return `Object(${Object.keys(value as object).length})`;
}

function pathsMatch(currentPath: string[], sensitivePaths: string[][]): boolean {
  return sensitivePaths.some((sensitivePath) => {
    if (sensitivePath.length !== currentPath.length) return false;
    return sensitivePath.every(
      (segment, index) => String(segment) === currentPath[index],
    );
  });
}

function isSensitiveAtPath(
  currentPath: string[],
  sensitive: boolean,
  sensitivePaths?: string[][],
): boolean {
  if (sensitive) return true;
  if (!sensitivePaths || sensitivePaths.length === 0) return false;
  return pathsMatch(currentPath, sensitivePaths);
}

export function JsonTree({
  value,
  sensitive = false,
  sensitivePaths,
  path = [],
  showSensitive = false,
  depth = 0,
  label,
}: JsonTreeProps) {
  const [open, setOpen] = useState(depth < 2);
  const currentPath = label !== undefined ? [...path, label] : path;
  const isSensitive = isSensitiveAtPath(currentPath, sensitive, sensitivePaths);

  if (isSensitive && !showSensitive) {
    return (
      <div className="json-tree leaf sensitive" style={{ paddingLeft: depth * 12 }}>
        {label && <span className="json-key">{label}: </span>}
        <span className="json-masked">***</span>
      </div>
    );
  }

  if (!isExpandable(value)) {
    return (
      <div className="json-tree leaf" style={{ paddingLeft: depth * 12 }}>
        {label && <span className="json-key">{label}: </span>}
        <span className={`json-value json-${typeof value}`}>
          {preview(value)}
        </span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);

  return (
    <div className="json-tree" style={{ paddingLeft: depth * 12 }}>
      <button
        type="button"
        className="json-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        {open ? '▾' : '▸'} {label ?? (Array.isArray(value) ? '[]' : '{}')}{' '}
        <span className="json-preview">{preview(value)}</span>
      </button>
      {open && (
        <div className="json-children">
          {entries.map(([key, child]) => (
            <JsonTree
              key={key}
              label={key}
              value={child}
              sensitive={sensitive}
              sensitivePaths={sensitivePaths}
              path={currentPath}
              showSensitive={showSensitive}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
