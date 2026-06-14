import type { NormalizedResource, PlanMetadata } from '../types/plan';

const REGION_FILENAME_PATTERN =
  /\b(ap|us|eu|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|southwest|northwest)-\d\b/i;

function readVariableValue(
  variables: Record<string, unknown> | undefined,
  key: string,
): unknown {
  if (!variables || typeof variables !== 'object') return undefined;
  const entry = variables[key];
  if (!entry || typeof entry !== 'object') return undefined;
  return (entry as { value?: unknown }).value;
}

function regionFromResources(resources: NormalizedResource[]): string | undefined {
  for (const resource of resources) {
    const after = resource.after;
    if (!after || typeof after !== 'object') continue;

    const tags = (after as Record<string, unknown>).tags_all ??
      (after as Record<string, unknown>).tags;
    if (tags && typeof tags === 'object') {
      const region = (tags as Record<string, unknown>).Region;
      if (typeof region === 'string' && region.trim()) {
        return region;
      }
    }
  }
  return undefined;
}

function regionFromFilename(fileName: string): string | undefined {
  const match = fileName.match(REGION_FILENAME_PATTERN);
  return match?.[0];
}

export function extractMetadata(
  plan: Record<string, unknown>,
  resources: NormalizedResource[],
  fileName: string,
): PlanMetadata {
  const variables = plan.variables as Record<string, unknown> | undefined;
  const awsRegion = readVariableValue(variables, 'aws_region');

  const region =
    (typeof awsRegion === 'string' && awsRegion) ||
    regionFromResources(resources) ||
    regionFromFilename(fileName) ||
    'unknown';

  return {
    region,
    terraformVersion:
      typeof plan.terraform_version === 'string'
        ? plan.terraform_version
        : 'unknown',
    formatVersion:
      typeof plan.format_version === 'string' ? plan.format_version : 'unknown',
    timestamp:
      typeof plan.timestamp === 'string' ? plan.timestamp : 'unknown',
    applyable: plan.applyable === true,
    errored: plan.errored === true,
    fileName,
    resourceCount: resources.length,
  };
}
