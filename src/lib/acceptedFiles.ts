export const PLAN_ACCEPT = '.json,application/json';
export const STATE_ACCEPT = '.json,.tfstate,application/json';

export function isPlanFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.json');
}

export function isStateFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.json') || lower.endsWith('.tfstate');
}
