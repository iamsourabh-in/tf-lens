import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { displayActionLabel } from '../lib/actionLabels';
import type { NormalizedResource } from '../types/plan';
import { EmptyState } from './EmptyState';
import { ProviderIcon } from './ProviderIcon';

interface ResourceTableProps {
  resources: NormalizedResource[];
  selectedId?: string;
  onSelect: (resource: NormalizedResource) => void;
}

const columnHelper = createColumnHelper<NormalizedResource>();

function shortProvider(provider: string): string {
  return provider.replace('registry.terraform.io/hashicorp/', '');
}

export function ResourceTable({
  resources,
  selectedId,
  onSelect,
}: ResourceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'displayAction', desc: false },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('displayAction', {
        header: 'Action',
        cell: (info) => (
          <span className={`action-chip action-${info.getValue()}`}>
            {displayActionLabel(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => (
          <span className="type-cell-value">
            <ProviderIcon provider={info.row.original.provider} type={info.getValue()} />
            <span className="mono">{info.getValue()}</span>
          </span>
        ),
      }),
      columnHelper.accessor('address', {
        header: 'Address',
        cell: (info) => (
          <span className="mono address-cell" title={info.getValue()}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor(
        (row) => {
          if (row.after && typeof row.after === 'object') {
            const id = (row.after as Record<string, unknown>).id;
            if (typeof id === 'string') return id;
          }
          if (row.before && typeof row.before === 'object') {
            const id = (row.before as Record<string, unknown>).id;
            if (typeof id === 'string') return id;
          }
          return '(known after apply)';
        },
        {
          id: 'resourceId',
          header: 'Resource ID',
          cell: (info) => (
            <span className="mono resource-id-cell" title={info.getValue()}>
              {info.getValue()}
            </span>
          ),
        },
      ),
      columnHelper.accessor('moduleAddress', {
        header: 'Module',
        cell: (info) => info.getValue() || '(root)',
      }),
      columnHelper.accessor('provider', {
        header: 'Provider',
        cell: (info) => shortProvider(info.getValue()),
      }),
      columnHelper.accessor('mode', {
        header: 'Mode',
      }),
      columnHelper.accessor('parseStatus', {
        header: 'Parse',
        cell: (info) =>
          info.getValue() === 'ok' ? (
            'OK'
          ) : (
            <span className="parse-warning">{info.getValue()}</span>
          ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: resources,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (resources.length === 0) {
    return (
      <EmptyState>No resources match the current filters.</EmptyState>
    );
  }

  return (
    <div className="table-wrap">
      <table className="resource-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className="sort-button"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[header.column.getIsSorted() as string] ?? ''}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={row.original.id === selectedId ? 'selected' : ''}
              onClick={() => onSelect(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="table-footer">Showing {resources.length} resources</p>
    </div>
  );
}
