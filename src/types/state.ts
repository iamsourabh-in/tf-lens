import type { ParseStatus } from './plan';

export type StateResourceStatus =
  | 'ok'
  | 'tainted'
  | 'deposed'
  | 'missing'
  | 'failed';

export type StateFormat = 'legacy' | 'show-json' | 'legacy-v3';

export interface NormalizedStateResource {
  id: string;
  address: string;
  moduleAddress: string;
  type: string;
  name: string;
  index?: number | string;
  provider: string;
  mode: string;
  status: StateResourceStatus;
  statusDetail?: string;
  attributes: unknown;
  sensitivePaths: string[][];
  instanceCount: number;
  parseStatus: ParseStatus;
  parseWarning?: string;
  raw?: unknown;
}

export interface StateCheckResult {
  objectKind: string;
  configAddr: string;
  status: 'pass' | 'fail' | 'unknown';
  messages: string[];
}

export interface StateOutput {
  value: unknown;
  type?: string;
  sensitive?: boolean;
}

export interface StateMetadata {
  format: StateFormat;
  stateVersion?: number;
  formatVersion?: string;
  terraformVersion: string;
  serial?: number;
  lineage?: string;
  fileName: string;
  resourceCount: number;
  region: string;
}

export interface StatusCounts {
  ok: number;
  tainted: number;
  deposed: number;
  missing: number;
  failed: number;
}

export interface ParsedState {
  metadata: StateMetadata;
  resources: NormalizedStateResource[];
  outputs: Record<string, StateOutput>;
  checkResults: StateCheckResult[];
  issues: string[];
  warnings: string[];
  statusCounts: StatusCounts;
  typeCounts: Record<string, number>;
  moduleCounts: Record<string, number>;
}

export interface StateResourceFilters {
  search: string;
  statuses: StateResourceStatus[];
  types: string[];
  modules: string[];
  providers: string[];
  mode: 'all' | 'managed' | 'data';
}
