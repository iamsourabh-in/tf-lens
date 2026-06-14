import type { ParseStatus } from '../types/plan';
import type {
  NormalizedStateResource,
  StateResourceStatus,
} from '../types/state';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizeProvider(provider: unknown): string {
  if (typeof provider !== 'string' || !provider.trim()) return 'unknown';
  const match = provider.match(/^provider\["(.+)"\]$/);
  return match?.[1] ?? provider;
}

function buildAddress(
  type: string,
  name: string,
  index?: number | string,
  moduleAddress?: string,
): string {
  const indexSuffix =
    index === undefined || index === null ? '' : `[${index}]`;
  const resourceAddr = `${type}.${name}${indexSuffix}`;
  return moduleAddress ? `${moduleAddress}.${resourceAddr}` : resourceAddr;
}

function parseModuleAddress(module: unknown): string {
  if (typeof module !== 'string' || !module.trim()) return '';
  return module.startsWith('module.') ? module : `module.${module}`;
}

function normalizeSensitivePath(path: unknown): string[] | null {
  if (!Array.isArray(path)) return null;
  return path.map((segment) => String(segment));
}

function collectSensitivePaths(instances: unknown[]): string[][] {
  const paths: string[][] = [];
  for (const instance of instances) {
    const record = asRecord(instance);
    if (!record) continue;
    const attrs = record.sensitive_attributes;
    if (!Array.isArray(attrs)) continue;
    for (const path of attrs) {
      const normalized = normalizeSensitivePath(path);
      if (normalized) paths.push(normalized);
    }
  }
  return paths;
}

function flattenSensitiveValues(
  value: unknown,
  prefix: string[] = [],
): string[][] {
  const paths: string[][] = [];
  if (value === true) {
    paths.push(prefix);
    return paths;
  }
  if (!value || typeof value !== 'object') return paths;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      paths.push(...flattenSensitiveValues(item, [...prefix, String(index)]));
    });
    return paths;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    paths.push(...flattenSensitiveValues(child, [...prefix, key]));
  }
  return paths;
}

function deriveLegacyStatus(instances: unknown[]): {
  status: StateResourceStatus;
  statusDetail?: string;
  attributes: unknown;
} {
  if (instances.length === 0) {
    return { status: 'missing', attributes: null };
  }

  let taintedCount = 0;
  let deposedCount = 0;
  let primaryAttributes: unknown = null;

  for (const instance of instances) {
    const record = asRecord(instance);
    if (!record) continue;

    if (record.deposed !== undefined) {
      deposedCount += 1;
      continue;
    }

    if (record.status === 'tainted' || record.tainted === true) {
      taintedCount += 1;
    }

    if (primaryAttributes === null && record.attributes !== undefined) {
      primaryAttributes = record.attributes;
    }
  }

  if (primaryAttributes === null && deposedCount > 0) {
    return {
      status: 'deposed',
      statusDetail:
        deposedCount > 1 ? `${deposedCount} deposed instances` : undefined,
      attributes: null,
    };
  }

  if (primaryAttributes === null) {
    return { status: 'missing', attributes: null };
  }

  if (taintedCount > 0) {
    return {
      status: 'tainted',
      statusDetail:
        taintedCount > 1 ? `${taintedCount} tainted instances` : undefined,
      attributes: primaryAttributes,
    };
  }

  if (deposedCount > 0) {
    return {
      status: 'deposed',
      statusDetail:
        deposedCount > 1 ? `${deposedCount} deposed instances` : undefined,
      attributes: primaryAttributes,
    };
  }

  return { status: 'ok', attributes: primaryAttributes };
}

export function normalizeLegacyStateResource(
  raw: unknown,
  index: number,
): { resource: NormalizedStateResource; warning?: string } {
  const entry = asRecord(raw);

  if (!entry) {
    return {
      resource: {
        id: `failed-${index}`,
        address: `(unknown #${index})`,
        moduleAddress: '',
        type: 'unknown',
        name: 'unknown',
        provider: 'unknown',
        mode: 'unknown',
        status: 'failed',
        attributes: null,
        sensitivePaths: [],
        instanceCount: 0,
        parseStatus: 'failed',
        parseWarning: 'Resource entry is not an object',
        raw,
      },
      warning: `Resource #${index} is not an object`,
    };
  }

  const warnings: string[] = [];
  let parseStatus: ParseStatus = 'ok';

  const type =
    typeof entry.type === 'string' && entry.type.trim() ? entry.type : 'unknown';
  if (type === 'unknown') {
    parseStatus = 'partial';
    warnings.push('missing resource type');
  }

  const name =
    typeof entry.name === 'string' && entry.name.trim() ? entry.name : 'unknown';

  const moduleAddress = parseModuleAddress(entry.module);

  const instances = Array.isArray(entry.instances) ? entry.instances : [];
  if (!Array.isArray(entry.instances)) {
    parseStatus = 'partial';
    warnings.push('missing instances array');
  }

  const primaryInstance = instances.find((instance) => {
    const record = asRecord(instance);
    return record && record.deposed === undefined;
  });
  const primaryRecord = asRecord(primaryInstance);
  const indexKey =
    primaryRecord?.index_key !== undefined
      ? (primaryRecord.index_key as number | string)
      : undefined;

  const address = buildAddress(type, name, indexKey, moduleAddress || undefined);

  const provider = normalizeProvider(entry.provider);
  const mode =
    typeof entry.mode === 'string' && entry.mode.trim() ? entry.mode : 'unknown';

  const { status, statusDetail, attributes } = deriveLegacyStatus(instances);
  const sensitivePaths = collectSensitivePaths(instances);

  const rawDeps = entry.dependencies ?? (entry as any).depends_on;
  const dependencies = Array.isArray(rawDeps) ? rawDeps.map(d => String(d)) : [];

  const resource: NormalizedStateResource = {
    id: address || `resource-${index}`,
    address,
    moduleAddress,
    type,
    name,
    index: indexKey,
    provider,
    mode,
    status,
    statusDetail,
    attributes,
    sensitivePaths,
    instanceCount: instances.length,
    parseStatus,
    dependencies,
    raw: entry,
  };

  if (warnings.length > 0) {
    resource.parseWarning = warnings.join('; ');
  }

  return {
    resource,
    warning:
      warnings.length > 0
        ? `Resource "${address}": ${warnings.join('; ')}`
        : undefined,
  };
}

export function normalizeShowJsonStateResource(
  raw: unknown,
  index: number,
): { resource: NormalizedStateResource; warning?: string } {
  const entry = asRecord(raw);

  if (!entry) {
    return {
      resource: {
        id: `failed-${index}`,
        address: `(unknown #${index})`,
        moduleAddress: '',
        type: 'unknown',
        name: 'unknown',
        provider: 'unknown',
        mode: 'unknown',
        status: 'failed',
        attributes: null,
        sensitivePaths: [],
        instanceCount: 0,
        parseStatus: 'failed',
        parseWarning: 'Resource entry is not an object',
        raw,
      },
      warning: `Resource #${index} is not an object`,
    };
  }

  const warnings: string[] = [];
  let parseStatus: ParseStatus = 'ok';

  const address =
    typeof entry.address === 'string' && entry.address.trim()
      ? entry.address
      : 'unknown';

  const type =
    typeof entry.type === 'string' && entry.type.trim() ? entry.type : 'unknown';
  const name =
    typeof entry.name === 'string' && entry.name.trim() ? entry.name : 'unknown';

  const moduleAddress = (() => {
    const suffix = `.${type}.${name}`;
    const index = address.lastIndexOf(suffix);
    if (index <= 0) return '';
    const prefix = address.slice(0, index);
    const indexSuffix = address.slice(index + suffix.length);
    if (indexSuffix && !/^(\[\d+\]|\["[^"]+"\])$/.test(indexSuffix)) {
      return '';
    }
    return prefix;
  })();

  const provider =
    typeof entry.provider_name === 'string' && entry.provider_name.trim()
      ? entry.provider_name
      : 'unknown';

  const mode =
    typeof entry.mode === 'string' && entry.mode.trim() ? entry.mode : 'unknown';

  const attributes = entry.values ?? null;
  const sensitivePaths = flattenSensitiveValues(entry.sensitive_values);

  let status: StateResourceStatus = 'ok';
  if (attributes === null || attributes === undefined) {
    status = 'missing';
    parseStatus = 'partial';
    warnings.push('missing values');
  }

  const rawDeps = entry.dependencies ?? (entry as any).depends_on;
  const dependencies = Array.isArray(rawDeps) ? rawDeps.map(d => String(d)) : [];

  const resource: NormalizedStateResource = {
    id: address || `resource-${index}`,
    address,
    moduleAddress,
    type,
    name,
    provider,
    mode,
    status,
    attributes,
    sensitivePaths,
    instanceCount: 1,
    parseStatus,
    dependencies,
    raw: entry,
  };

  if (warnings.length > 0) {
    resource.parseWarning = warnings.join('; ');
  }

  return {
    resource,
    warning:
      warnings.length > 0
        ? `Resource "${address}": ${warnings.join('; ')}`
        : undefined,
  };
}
