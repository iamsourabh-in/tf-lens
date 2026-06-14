import type { DisplayAction, NormalizedResource, ResourceFilters } from '../types/plan';
import { displayActionLabel } from '../lib/actionLabels';

interface FilterBarProps {
  resources: NormalizedResource[];
  filters: ResourceFilters;
  onChange: (filters: ResourceFilters) => void;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

const DISPLAY_ACTIONS: DisplayAction[] = [
  'create',
  'update',
  'delete',
  'replace',
  'read',
  'no-op',
  'unknown',
];

export function FilterBar({ resources, filters, onChange }: FilterBarProps) {
  const types = uniqueSorted(resources.map((resource) => resource.type));
  const modules = uniqueSorted(
    resources.map((resource) => resource.moduleAddress || '(root)'),
  );
  const providers = uniqueSorted(resources.map((resource) => resource.provider));

  const toggleList = (
    key: 'actions' | 'types' | 'modules' | 'providers',
    value: string,
  ) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div className="filter-bar">
      <div className="filter-row">
        <label className="filter-search">
          Search
          <input
            type="search"
            placeholder="Address, type, module…"
            value={filters.search}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value })
            }
          />
        </label>

        <label className="filter-mode">
          Mode
          <select
            value={filters.mode}
            onChange={(event) =>
              onChange({
                ...filters,
                mode: event.target.value as ResourceFilters['mode'],
              })
            }
          >
            <option value="all">All</option>
            <option value="managed">Managed</option>
            <option value="data">Data</option>
          </select>
        </label>

        <button
          type="button"
          className="button secondary small"
          onClick={() =>
            onChange({
              search: '',
              actions: [],
              types: [],
              modules: [],
              providers: [],
              mode: 'all',
            })
          }
        >
          Clear filters
        </button>
      </div>

      <details className="filter-group" open>
        <summary>Actions</summary>
        <div className="chip-group">
          {DISPLAY_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              className={`chip action-${action}${
                filters.actions.includes(action) ? ' active' : ''
              }`}
              onClick={() => toggleList('actions', action)}
            >
              {displayActionLabel(action)}
            </button>
          ))}
        </div>
      </details>

      <details className="filter-group">
        <summary>Types ({types.length})</summary>
        <div className="chip-group scrollable">
          {types.map((type) => (
            <button
              key={type}
              type="button"
              className={`chip${filters.types.includes(type) ? ' active' : ''}`}
              onClick={() => toggleList('types', type)}
            >
              {type}
            </button>
          ))}
        </div>
      </details>

      <details className="filter-group">
        <summary>Modules ({modules.length})</summary>
        <div className="chip-group scrollable">
          {modules.map((module) => (
            <button
              key={module}
              type="button"
              className={`chip${filters.modules.includes(module) ? ' active' : ''}`}
              onClick={() => toggleList('modules', module)}
            >
              {module}
            </button>
          ))}
        </div>
      </details>

      <details className="filter-group">
        <summary>Providers ({providers.length})</summary>
        <div className="chip-group scrollable">
          {providers.map((provider) => (
            <button
              key={provider}
              type="button"
              className={`chip${
                filters.providers.includes(provider) ? ' active' : ''
              }`}
              onClick={() => toggleList('providers', provider)}
            >
              {provider.replace('registry.terraform.io/hashicorp/', '')}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
