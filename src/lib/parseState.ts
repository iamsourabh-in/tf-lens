import { extractStateMetadata } from './extractStateMetadata';
import {
  normalizeLegacyStateResource,
  normalizeShowJsonStateResource,
} from './normalizeStateResource';
import type {
  NormalizedStateResource,
  ParsedState,
  StateCheckResult,
  StateFormat,
  StateOutput,
  StateResourceStatus,
  StatusCounts,
} from '../types/state';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function emptyStatusCounts(): StatusCounts {
  return { ok: 0, tainted: 0, deposed: 0, missing: 0, failed: 0 };
}

function incrementStatusCount(
  counts: StatusCounts,
  status: StateResourceStatus,
): void {
  counts[status] += 1;
}

function parseCheckResults(
  checkResults: unknown,
  warnings: string[],
): StateCheckResult[] {
  if (!checkResults) return [];
  if (!Array.isArray(checkResults)) {
    warnings.push('check_results is not an array');
    return [];
  }

  return checkResults.map((entry, index) => {
    const record = asRecord(entry);
    if (!record) {
      warnings.push(`check_results #${index} is not an object`);
      return {
        objectKind: 'unknown',
        configAddr: `(entry #${index})`,
        status: 'unknown' as const,
        messages: ['Invalid check result entry'],
      };
    }

    const statusRaw = record.status;
    const status =
      statusRaw === 'pass' || statusRaw === 'fail' || statusRaw === 'error'
        ? statusRaw === 'error'
          ? 'fail'
          : statusRaw
        : 'unknown';

    const messages: string[] = [];
    if (Array.isArray(record.failure_messages)) {
      for (const message of record.failure_messages) {
        if (typeof message === 'string') messages.push(message);
      }
    }
    if (Array.isArray(record.error)) {
      for (const message of record.error) {
        if (typeof message === 'string') messages.push(message);
      }
    }

    return {
      objectKind:
        typeof record.object_kind === 'string' ? record.object_kind : 'unknown',
      configAddr:
        typeof record.config_addr === 'string'
          ? record.config_addr
          : typeof record.address === 'string'
            ? record.address
            : `(entry #${index})`,
      status: status as 'pass' | 'fail' | 'unknown',
      messages,
    };
  });
}

function parseLegacyOutputs(
  outputs: unknown,
  warnings: string[],
): Record<string, StateOutput> {
  if (!outputs || typeof outputs !== 'object' || Array.isArray(outputs)) {
    if (outputs !== undefined && outputs !== null) {
      warnings.push('outputs is not an object');
    }
    return {};
  }

  const result: Record<string, StateOutput> = {};
  for (const [name, entry] of Object.entries(outputs)) {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const record = entry as Record<string, unknown>;
      result[name] = {
        value: record.value,
        type: typeof record.type === 'string' ? record.type : undefined,
        sensitive: record.sensitive === true,
      };
    } else {
      result[name] = { value: entry };
    }
  }
  return result;
}

function parseShowJsonOutputs(
  rootModule: Record<string, unknown> | null,
  state: Record<string, unknown>,
): Record<string, StateOutput> {
  const values = asRecord(state.values);
  const outputs = values?.outputs ?? rootModule?.outputs ?? state.outputs;

  if (!outputs || typeof outputs !== 'object' || Array.isArray(outputs)) {
    return {};
  }

  const result: Record<string, StateOutput> = {};
  for (const [name, entry] of Object.entries(outputs)) {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const record = entry as Record<string, unknown>;
      result[name] = {
        value: record.value ?? entry,
        type: typeof record.type === 'string' ? record.type : undefined,
        sensitive: record.sensitive === true,
      };
    } else {
      result[name] = { value: entry };
    }
  }
  return result;
}

function walkShowJsonModules(
  module: Record<string, unknown>,
  resources: NormalizedStateResource[],
  warnings: string[],
  indexRef: { value: number },
): void {
  const moduleResources = module.resources;
  if (Array.isArray(moduleResources)) {
    moduleResources.forEach((entry) => {
      try {
        const { resource, warning } = normalizeShowJsonStateResource(
          entry,
          indexRef.value,
        );
        resources.push(resource);
        if (warning) warnings.push(warning);
      } catch (error) {
        warnings.push(
          `Resource #${indexRef.value} failed to parse: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
        resources.push({
          id: `failed-${indexRef.value}`,
          address: `(failed #${indexRef.value})`,
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
          parseWarning: 'Unhandled parse failure',
          raw: entry,
        });
      }
      indexRef.value += 1;
    });
  }

  const childModules = module.child_modules;
  if (Array.isArray(childModules)) {
    for (const child of childModules) {
      const childRecord = asRecord(child);
      if (childRecord) {
        walkShowJsonModules(childRecord, resources, warnings, indexRef);
      }
    }
  }
}

function parseLegacyResources(
  resourcesRaw: unknown,
  warnings: string[],
): NormalizedStateResource[] {
  const resources: NormalizedStateResource[] = [];

  if (!Array.isArray(resourcesRaw)) {
    warnings.push('resources is missing or not an array');
    return resources;
  }

  resourcesRaw.forEach((entry, index) => {
    try {
      const { resource, warning } = normalizeLegacyStateResource(entry, index);
      resources.push(resource);
      if (warning) warnings.push(warning);
    } catch (error) {
      warnings.push(
        `Resource #${index} failed to parse: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      resources.push({
        id: `failed-${index}`,
        address: `(failed #${index})`,
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
        parseWarning: 'Unhandled parse failure',
        raw: entry,
      });
    }
  });

  return resources;
}

function buildIssues(
  resources: NormalizedStateResource[],
  checkResults: StateCheckResult[],
): string[] {
  const issues: string[] = [];

  for (const result of checkResults) {
    if (result.status === 'fail') {
      const message =
        result.messages.length > 0
          ? result.messages.join('; ')
          : 'Check failed';
      issues.push(`Check failed for ${result.configAddr}: ${message}`);
    }
  }

  for (const resource of resources) {
    if (resource.status === 'tainted') {
      issues.push(`Resource "${resource.address}" is tainted`);
    } else if (resource.status === 'deposed') {
      issues.push(
        `Resource "${resource.address}" has deposed instance(s)${
          resource.statusDetail ? ` (${resource.statusDetail})` : ''
        }`,
      );
    } else if (resource.status === 'missing') {
      issues.push(`Resource "${resource.address}" has no instance data`);
    } else if (resource.parseStatus === 'failed') {
      issues.push(
        `Resource "${resource.address}" failed to parse${
          resource.parseWarning ? `: ${resource.parseWarning}` : ''
        }`,
      );
    }
  }

  return issues;
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

function getModuleAddress(path: unknown): string {
  if (!Array.isArray(path)) return '';
  if (path.length <= 1) return '';
  return path.slice(1).map(segment => `module.${segment}`).join('.');
}

function parseKeyNameAndIndex(key: string, type: string): { name: string; index?: string | number } {
  const prefix = type + '.';
  if (key.startsWith(prefix)) {
    const remaining = key.slice(prefix.length);
    const parts = remaining.split('.');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      if (/^\d+$/.test(lastPart)) {
        return {
          name: parts.slice(0, -1).join('.'),
          index: parseInt(lastPart, 10),
        };
      }
    }
    return { name: remaining };
  }
  return { name: key };
}

function inferProviderFromType(type: string): string {
  const parts = type.split('_');
  return parts.length > 0 ? parts[0] : 'unknown';
}

function parseLegacyV3Resources(
  modules: unknown,
  warnings: string[],
): NormalizedStateResource[] {
  const resources: NormalizedStateResource[] = [];
  if (!Array.isArray(modules)) {
    warnings.push('modules is not an array');
    return resources;
  }

  let index = 0;
  for (const mod of modules) {
    const modRecord = asRecord(mod);
    if (!modRecord) continue;

    const moduleAddress = getModuleAddress(modRecord.path);
    const modResources = modRecord.resources;
    if (!modResources || typeof modResources !== 'object' || Array.isArray(modResources)) {
      continue;
    }

    for (const [key, resEntry] of Object.entries(modResources)) {
      const resRecord = asRecord(resEntry);
      if (!resRecord) continue;

      const type = typeof resRecord.type === 'string' && resRecord.type.trim() ? resRecord.type : 'unknown';
      const { name, index: indexKey } = parseKeyNameAndIndex(key, type);
      const address = buildAddress(type, name, indexKey, moduleAddress || undefined);
      
      const primary = asRecord(resRecord.primary);
      const attributes = primary?.attributes ?? null;
      
      const provider = inferProviderFromType(type);
      const mode = key.startsWith('data.') || type.startsWith('data.') ? 'data' : 'managed';
      
      let status: StateResourceStatus = 'ok';
      if (!primary) {
        status = 'missing';
      }

      resources.push({
        id: address || `resource-v3-${index}`,
        address,
        moduleAddress,
        type,
        name,
        index: indexKey,
        provider,
        mode,
        status,
        attributes,
        sensitivePaths: [],
        instanceCount: primary ? 1 : 0,
        parseStatus: primary ? 'ok' : 'partial',
        raw: resEntry,
      });

      index++;
    }
  }

  return resources;
}

function detectFormat(state: Record<string, unknown>): StateFormat | null {
  const values = asRecord(state.values);
  if (values?.root_module) return 'show-json';
  if (Array.isArray(state.resources)) return 'legacy';
  if (Array.isArray(state.modules)) return 'legacy-v3';
  return null;
}

export function parseStateJson(text: string, fileName: string): ParsedState {
  const warnings: string[] = [];

  let state: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('State JSON must be an object');
    }
    state = parsed as Record<string, unknown>;
  } catch (error) {
    const message =
      error instanceof Error
        ? `Invalid JSON: ${error.message}`
        : 'Invalid JSON file';
    throw error instanceof Error
      ? new Error(message, { cause: error })
      : new Error(message);
  }

  if (Array.isArray(state.resource_changes)) {
    throw new Error(
      'This looks like a plan file. Use the Plan Viewer page instead.',
    );
  }

  const format = detectFormat(state);
  if (!format) {
    warnings.push(
      'Could not detect state format (expected resources[], modules[], or values.root_module)',
    );
  }

  let resources: NormalizedStateResource[] = [];
  let outputs: Record<string, StateOutput> = {};

  if (format === 'legacy') {
    resources = parseLegacyResources(state.resources, warnings);
    outputs = parseLegacyOutputs(state.outputs, warnings);
  } else if (format === 'show-json') {
    const values = asRecord(state.values);
    const rootModule = asRecord(values?.root_module);
    if (rootModule) {
      walkShowJsonModules(rootModule, resources, warnings, { value: 0 });
    } else {
      warnings.push('values.root_module is missing');
    }
    outputs = parseShowJsonOutputs(rootModule, state);
  } else if (format === 'legacy-v3') {
    resources = parseLegacyV3Resources(state.modules, warnings);
    const rootModule = Array.isArray(state.modules)
      ? state.modules.find(
          (m: any) =>
            m &&
            Array.isArray(m.path) &&
            m.path.length === 1 &&
            m.path[0] === 'root',
        )
      : null;
    outputs = parseLegacyOutputs(rootModule?.outputs, warnings);
  }

  const checkResults = parseCheckResults(state.check_results, warnings);
  const metadata = extractStateMetadata(
    state,
    resources,
    fileName,
    format ?? 'legacy',
  );

  const statusCounts = emptyStatusCounts();
  const typeCounts: Record<string, number> = {};
  const moduleCounts: Record<string, number> = {};

  for (const resource of resources) {
    incrementStatusCount(statusCounts, resource.status);
    typeCounts[resource.type] = (typeCounts[resource.type] ?? 0) + 1;
    const moduleKey = resource.moduleAddress || '(root)';
    moduleCounts[moduleKey] = (moduleCounts[moduleKey] ?? 0) + 1;
  }

  const issues = buildIssues(resources, checkResults);

  return {
    metadata,
    resources,
    outputs,
    checkResults,
    issues,
    warnings,
    statusCounts,
    typeCounts,
    moduleCounts,
  };
}
