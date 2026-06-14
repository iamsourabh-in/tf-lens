export type TerraformAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'read'
  | 'no-op'
  | 'unknown';

export type DisplayAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'replace'
  | 'read'
  | 'no-op'
  | 'unknown';

export type ParseStatus = 'ok' | 'partial' | 'failed';

export interface NormalizedResource {
  id: string;
  address: string;
  moduleAddress: string;
  type: string;
  name: string;
  index?: number | string;
  provider: string;
  mode: string;
  actions: TerraformAction[];
  displayAction: DisplayAction;
  before: unknown;
  after: unknown;
  beforeSensitive: boolean;
  afterSensitive: boolean;
  parseStatus: ParseStatus;
  parseWarning?: string;
  dependencies?: string[];
  raw?: unknown;
}

export interface NormalizedOutput {
  name: string;
  actions: TerraformAction[];
  displayAction: DisplayAction;
  before: unknown;
  after: unknown;
  afterUnknown: boolean;
}

export interface PlanMetadata {
  region: string;
  terraformVersion: string;
  formatVersion: string;
  timestamp: string;
  applyable: boolean;
  errored: boolean;
  fileName: string;
  resourceCount: number;
}

export interface ActionCounts {
  create: number;
  update: number;
  delete: number;
  replace: number;
  read: number;
  noOp: number;
  unknown: number;
}

export interface ParsedPlan {
  metadata: PlanMetadata;
  resources: NormalizedResource[];
  outputs: NormalizedOutput[];
  variables: Record<string, unknown>;
  warnings: string[];
  actionCounts: ActionCounts;
  typeCounts: Record<string, number>;
  moduleCounts: Record<string, number>;
}

export interface ResourceFilters {
  search: string;
  actions: DisplayAction[];
  types: string[];
  modules: string[];
  providers: string[];
  mode: 'all' | 'managed' | 'data';
}
