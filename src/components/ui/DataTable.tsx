import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from './States';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Value used for sorting. Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number | null;
  align?: 'left' | 'right';
  /** Column widths are shared across the whole table. */
  className?: string;
  /** Hidden below this breakpoint, so that tables fit without sideways page scrolling. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string;
  defaultSort?: { columnId: string; direction: 'asc' | 'desc' };
  loading?: boolean;
  empty?: ReactNode;
  caption: string;
}

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'max-sm:hidden',
  md: 'max-md:hidden',
  lg: 'max-lg:hidden',
  xl: 'max-xl:hidden',
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  selectedKey,
  defaultSort,
  loading,
  empty,
  caption,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(defaultSort);

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.id === sort?.columnId);
    if (!sort || !column?.sortValue) return rows;
    const direction = sort.direction === 'asc' ? 1 : -1;
    const value = column.sortValue;
    return [...rows].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      // Missing values always sink to the bottom.
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction;
      return String(av).localeCompare(String(bv)) * direction;
    });
  }, [rows, columns, sort]);

  const toggleSort = (columnId: string) => {
    setSort((current) =>
      current?.columnId === columnId
        ? { columnId, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { columnId, direction: 'asc' },
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-ui">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => {
              const active = sort?.columnId === column.id;
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'h-9 px-4 text-meta font-normal whitespace-nowrap text-ink-3 first:pl-4',
                    column.align === 'right' && 'text-right',
                    column.hideBelow && HIDE[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.id)}
                      className={cn(
                        'group inline-flex items-center gap-1 rounded hover:text-ink',
                        column.align === 'right' && 'flex-row-reverse',
                        active && 'text-ink',
                      )}
                    >
                      {column.header}
                      {active ? (
                        sort?.direction === 'asc' ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="border-b border-line last:border-b-0">
                  {columns.map((column) => (
                    <td key={column.id} className={cn('h-11 px-4', column.hideBelow && HIDE[column.hideBelow])}>
                      <Skeleton className="h-3.5 w-3/4 max-w-40" />
                    </td>
                  ))}
                </tr>
              ))
            : sorted.map((row) => {
                const key = rowKey(row);
                return (
                  <tr
                    key={key}
                    tabIndex={onRowClick ? 0 : undefined}
                    aria-current={selectedKey === key ? 'true' : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      'border-b border-line transition-colors duration-75 last:border-b-0',
                      onRowClick && 'cursor-pointer hover:bg-surface-2',
                      selectedKey === key && 'bg-surface-2',
                    )}
                  >
                    {columns.map((column, columnIndex) => (
                      <td
                        key={column.id}
                        className={cn(
                          'h-11 px-4 text-ink-2',
                          column.align === 'right' && 'tabular text-right',
                          column.hideBelow && HIDE[column.hideBelow],
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                        {onRowClick && columnIndex === 0 && <span className="sr-only">. Press Enter to open details.</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
        </tbody>
      </table>
      {!loading && rows.length === 0 && empty}
    </div>
  );
}
