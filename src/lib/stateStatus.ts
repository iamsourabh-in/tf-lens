import type { StateResourceStatus } from '../types/state';

const STATUS_LABELS: Record<StateResourceStatus, string> = {
  ok: 'OK',
  tainted: 'Tainted',
  deposed: 'Deposed',
  missing: 'Missing',
  failed: 'Failed',
};

export function statusLabel(status: StateResourceStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusClassName(status: StateResourceStatus): string {
  return `status-chip status-${status}`;
}
