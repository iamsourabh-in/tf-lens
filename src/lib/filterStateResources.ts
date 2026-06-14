import type {
  NormalizedStateResource,
  StateResourceFilters,
} from '../types/state';

export function filterStateResources(
  resources: NormalizedStateResource[],
  filters: StateResourceFilters,
): NormalizedStateResource[] {
  const search = filters.search.trim().toLowerCase();

  return resources.filter((resource) => {
    if (filters.mode !== 'all' && resource.mode !== filters.mode) {
      return false;
    }

    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(resource.status)
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
      resource.status,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(search);
  });
}
