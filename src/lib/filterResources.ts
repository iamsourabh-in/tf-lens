import type { NormalizedResource, ResourceFilters } from '../types/plan';

export function filterResources(
  resources: NormalizedResource[],
  filters: ResourceFilters,
): NormalizedResource[] {
  const search = filters.search.trim().toLowerCase();

  return resources.filter((resource) => {
    if (filters.mode !== 'all' && resource.mode !== filters.mode) {
      return false;
    }

    if (
      filters.actions.length > 0 &&
      !filters.actions.includes(resource.displayAction)
    ) {
      return false;
    }

    if (filters.types.length > 0 && !filters.types.includes(resource.type)) {
      return false;
    }

    const moduleKey = resource.moduleAddress || '(root)';
    if (filters.modules.length > 0 && !filters.modules.includes(moduleKey)) {
      return false;
    }

    if (
      filters.providers.length > 0 &&
      !filters.providers.includes(resource.provider)
    ) {
      return false;
    }

    if (!search) return true;

    const haystack = [
      resource.address,
      resource.type,
      resource.moduleAddress,
      resource.provider,
      resource.name,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(search);
  });
}
