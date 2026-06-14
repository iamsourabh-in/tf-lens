import { normalizeActions, toDisplayAction } from './actionLabels';
import type { NormalizedResource, ParseStatus } from '../types/plan';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function buildAddress(
  type: string,
  name: string,
  index?: number | string,
): string {
  const indexSuffix =
    index === undefined || index === null ? '' : `[${index}]`;
  return `${type}.${name}${indexSuffix}`;
}

export function normalizeResource(
  raw: unknown,
  index: number,
): { resource: NormalizedResource; warning?: string } {
  const entry = asRecord(raw);
  const warnings: string[] = [];
  let parseStatus: ParseStatus = 'ok';

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
        actions: ['unknown'],
        displayAction: 'unknown',
        before: null,
        after: null,
        beforeSensitive: false,
        afterSensitive: false,
        parseStatus: 'failed',
        parseWarning: 'Resource entry is not an object',
        raw,
      },
      warning: `Resource #${index} is not an object and was skipped for structured parsing`,
    };
  }

  const change = asRecord(entry.change);
  if (!change) {
    parseStatus = 'partial';
    warnings.push('missing change block');
  }

  const actions = normalizeActions(change?.actions);
  const displayAction = toDisplayAction(actions);

  const type =
    typeof entry.type === 'string' && entry.type.trim()
      ? entry.type
      : 'unknown';
  if (type === 'unknown') {
    parseStatus = 'partial';
    warnings.push('missing resource type');
  }

  const name =
    typeof entry.name === 'string' && entry.name.trim()
      ? entry.name
      : 'unknown';
  const resourceIndex =
    typeof entry.index === 'number' || typeof entry.index === 'string'
      ? entry.index
      : undefined;

  const address =
    typeof entry.address === 'string' && entry.address.trim()
      ? entry.address
      : buildAddress(type, name, resourceIndex);
  if (!entry.address) {
    parseStatus = 'partial';
    warnings.push('missing address');
  }

  const moduleAddress =
    typeof entry.module_address === 'string' ? entry.module_address : '';

  const provider =
    typeof entry.provider_name === 'string' && entry.provider_name.trim()
      ? entry.provider_name
      : 'unknown';

  const mode =
    typeof entry.mode === 'string' && entry.mode.trim()
      ? entry.mode
      : 'unknown';

  const resource: NormalizedResource = {
    id: address || `resource-${index}`,
    address,
    moduleAddress,
    type,
    name,
    index: resourceIndex,
    provider,
    mode,
    actions,
    displayAction,
    before: change?.before ?? null,
    after: change?.after ?? null,
    beforeSensitive: change?.before_sensitive === true,
    afterSensitive: change?.after_sensitive === true,
    parseStatus,
    raw: parseStatus !== 'ok' ? entry : undefined,
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
