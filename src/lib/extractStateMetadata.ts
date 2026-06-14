import type { NormalizedStateResource, StateMetadata } from '../types/state';
import type { StateFormat } from '../types/state';

const REGION_FILENAME_PATTERN =
  /\b(ap|us|eu|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|southwest|northwest)-\d\b/i;

function regionFromAttributes(attributes: unknown): string | undefined {
  if (!attributes || typeof attributes !== 'object') return undefined;
  const record = attributes as Record<string, unknown>;

  const tags = record.tags_all ?? record.tags;
  if (tags && typeof tags === 'object') {
    const region = (tags as Record<string, unknown>).Region;
    if (typeof region === 'string' && region.trim()) return region;
  }

  if (typeof record.region === 'string' && record.region.trim()) {
    return record.region;
  }

  return undefined;
}

function regionFromResources(resources: NormalizedStateResource[]): string | undefined {
  for (const resource of resources) {
    const region = regionFromAttributes(resource.attributes);
    if (region) return region;
  }
  return undefined;
}

function regionFromFilename(fileName: string): string | undefined {
  const match = fileName.match(REGION_FILENAME_PATTERN);
  return match?.[0];
}

export function extractStateMetadata(
  state: Record<string, unknown>,
  resources: NormalizedStateResource[],
  fileName: string,
  format: StateFormat,
): StateMetadata {
  const region =
    regionFromResources(resources) ||
    regionFromFilename(fileName) ||
    'unknown';

  return {
    format,
    stateVersion:
      typeof state.version === 'number' ? state.version : undefined,
    formatVersion:
      typeof state.format_version === 'string'
        ? state.format_version
        : undefined,
    terraformVersion:
      typeof state.terraform_version === 'string'
        ? state.terraform_version
        : 'unknown',
    serial: typeof state.serial === 'number' ? state.serial : undefined,
    lineage:
      typeof state.lineage === 'string' ? state.lineage : undefined,
    fileName,
    resourceCount: resources.length,
    region,
  };
}
