import type { DisplayAction, TerraformAction } from '../types/plan';

const ACTION_ORDER: TerraformAction[] = [
  'delete',
  'create',
  'update',
  'read',
  'no-op',
  'unknown',
];

export function normalizeActions(raw: unknown): TerraformAction[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return ['unknown'];
  }

  const actions = raw
    .map((action) => (typeof action === 'string' ? action : 'unknown'))
    .filter(Boolean) as TerraformAction[];

  return actions.length > 0 ? actions : ['unknown'];
}

export function toDisplayAction(actions: TerraformAction[]): DisplayAction {
  const set = new Set(actions);

  if (set.has('delete') && set.has('create')) {
    return 'replace';
  }
  if (set.has('create')) return 'create';
  if (set.has('update')) return 'update';
  if (set.has('delete')) return 'delete';
  if (set.has('read')) return 'read';
  if (set.has('no-op')) return 'no-op';
  return 'unknown';
}

export function displayActionLabel(action: DisplayAction): string {
  switch (action) {
    case 'create':
      return 'Create';
    case 'update':
      return 'Update';
    case 'delete':
      return 'Delete';
    case 'replace':
      return 'Replace';
    case 'read':
      return 'Read';
    case 'no-op':
      return 'No-op';
    default:
      return 'Unknown';
  }
}

export function actionSortKey(actions: TerraformAction[]): number {
  const display = toDisplayAction(actions);
  const order: DisplayAction[] = [
    'create',
    'update',
    'replace',
    'delete',
    'read',
    'no-op',
    'unknown',
  ];
  return order.indexOf(display);
}

export function sortActions(actions: TerraformAction[]): TerraformAction[] {
  return [...actions].sort(
    (a, b) => ACTION_ORDER.indexOf(a) - ACTION_ORDER.indexOf(b),
  );
}
