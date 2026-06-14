import { extractMetadata } from './extractMetadata';
import { normalizeActions, toDisplayAction } from './actionLabels';
import { normalizeResource } from './normalizeResource';
import type {
  ActionCounts,
  NormalizedOutput,
  NormalizedResource,
  ParsedPlan,
} from '../types/plan';

function emptyActionCounts(): ActionCounts {
  return {
    create: 0,
    update: 0,
    delete: 0,
    replace: 0,
    read: 0,
    noOp: 0,
    unknown: 0,
  };
}

function incrementActionCounts(
  counts: ActionCounts,
  displayAction: ReturnType<typeof toDisplayAction>,
): void {
  switch (displayAction) {
    case 'create':
      counts.create += 1;
      break;
    case 'update':
      counts.update += 1;
      break;
    case 'delete':
      counts.delete += 1;
      break;
    case 'replace':
      counts.replace += 1;
      break;
    case 'read':
      counts.read += 1;
      break;
    case 'no-op':
      counts.noOp += 1;
      break;
    default:
      counts.unknown += 1;
  }
}

function parseOutputs(
  outputChanges: unknown,
  warnings: string[],
): NormalizedOutput[] {
  if (!outputChanges) return [];

  const entries: Array<[string, unknown]> = Array.isArray(outputChanges)
    ? outputChanges.map((item, index) => {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const name =
            typeof record.name === 'string' ? record.name : `output-${index}`;
          return [name, record.change ?? record] as [string, unknown];
        }
        warnings.push(`Output entry #${index} is not an object`);
        return [`output-${index}`, item] as [string, unknown];
      })
    : Object.entries(outputChanges as Record<string, unknown>);

  return entries.map(([name, changeValue]) => {
    try {
      const change =
        changeValue && typeof changeValue === 'object'
          ? (changeValue as Record<string, unknown>)
          : {};
      const actions = normalizeActions(change.actions);
      return {
        name,
        actions,
        displayAction: toDisplayAction(actions),
        before: change.before ?? null,
        after: change.after ?? null,
        afterUnknown: change.after_unknown === true,
      };
    } catch {
      warnings.push(`Failed to parse output "${name}"`);
      return {
        name,
        actions: ['unknown'],
        displayAction: 'unknown',
        before: null,
        after: changeValue,
        afterUnknown: false,
      };
    }
  });
}

function parseVariables(
  variables: unknown,
  warnings: string[],
): Record<string, unknown> {
  if (!variables || typeof variables !== 'object' || Array.isArray(variables)) {
    if (variables !== undefined) {
      warnings.push('variables is not an object');
    }
    return {};
  }

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(variables)) {
    if (entry && typeof entry === 'object' && 'value' in entry) {
      result[key] = (entry as { value: unknown }).value;
    } else {
      result[key] = entry;
    }
  }
  return result;
}

export function parsePlanJson(text: string, fileName: string): ParsedPlan {
  const warnings: string[] = [];

  let plan: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Plan JSON must be an object');
    }
    plan = parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Invalid JSON: ${error.message}`
        : 'Invalid JSON file',
    );
  }

  const resourceChanges = plan.resource_changes;
  const resources: NormalizedResource[] = [];

  if (!Array.isArray(resourceChanges)) {
    warnings.push('resource_changes is missing or not an array');
  } else {
    resourceChanges.forEach((entry, index) => {
      try {
        const { resource, warning } = normalizeResource(entry, index);
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
          actions: ['unknown'],
          displayAction: 'unknown',
          before: null,
          after: null,
          beforeSensitive: false,
          afterSensitive: false,
          parseStatus: 'failed',
          parseWarning: 'Unhandled parse failure',
          raw: entry,
        });
      }
    });
  }

  const outputs = parseOutputs(plan.output_changes, warnings);
  const variables = parseVariables(plan.variables, warnings);
  const metadata = extractMetadata(plan, resources, fileName);

  const actionCounts = emptyActionCounts();
  const typeCounts: Record<string, number> = {};
  const moduleCounts: Record<string, number> = {};

  for (const resource of resources) {
    incrementActionCounts(actionCounts, resource.displayAction);
    typeCounts[resource.type] = (typeCounts[resource.type] ?? 0) + 1;
    const moduleKey = resource.moduleAddress || '(root)';
    moduleCounts[moduleKey] = (moduleCounts[moduleKey] ?? 0) + 1;
  }

  if (plan.errored === true) {
    warnings.push('Terraform reported this plan as errored');
  }

  return {
    metadata,
    resources,
    outputs,
    variables,
    warnings,
    actionCounts,
    typeCounts,
    moduleCounts,
  };
}
