import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import type { EntityType, OrgDirectory } from '@/api';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Menu';
import { Panel } from '@/components/ui/Panel';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/States';
import { useSearchParamInput } from '@/hooks/useSearchParamInput';
import { ENTITY_META, explorerPath } from '@/lib/entities';
import type { ExplorerConfig } from './config';

const ALL = 'all';

interface EntityTableProps<T> {
  type: EntityType;
  config: ExplorerConfig<T>;
  directory: OrgDirectory;
}

/** One entity type's searchable table. Search and filters live in the URL, so views can be shared. */
export function EntityTable<T>({ type, config, directory }: EntityTableProps<T>) {
  const navigate = useNavigate();
  const { id: selectedId } = useParams();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useSearchParamInput('q');
  const meta = ENTITY_META[type];

  const filters = useMemo(() => config.filters(directory), [config, directory]);
  const allRows = useMemo(() => config.rows(directory), [config, directory]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (q && !config.searchText(row, directory).toLowerCase().includes(q)) return false;
      return filters.every((filter) => {
        const value = params.get(filter.key);
        return !value || filter.matches(row, value);
      });
    });
  }, [allRows, config, directory, filters, params, query]);

  const setParam = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value && value !== ALL) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };

  const isFiltered = Boolean(query) || filters.some((filter) => params.get(filter.key));

  const clear = () => {
    setQuery('');
    setParams({}, { replace: true });
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          label={`Search ${meta.plural.toLowerCase()}`}
          placeholder={`Search ${meta.plural.toLowerCase()}`}
          value={query}
          onChange={setQuery}
          containerClassName="w-full sm:w-64"
        />
        {filters.map((filter) => (
          <Select
            key={filter.key}
            label={`Filter by ${filter.label.toLowerCase()}`}
            value={params.get(filter.key) ?? ALL}
            onChange={(value) => setParam(filter.key, value)}
            options={[{ value: ALL, label: `All ${filter.label === 'Status' ? 'statuses' : `${filter.label.toLowerCase()}s`}` }, ...filter.options]}
          />
        ))}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
        )}
        <p className="tabular ml-auto text-meta text-ink-3" aria-live="polite">
          {rows.length === allRows.length ? `${allRows.length} ${meta.plural.toLowerCase()}` : `${rows.length} of ${allRows.length}`}
        </p>
      </div>

      <Panel className="overflow-hidden">
        <DataTable
          caption={meta.plural}
          rows={rows}
          columns={config.columns}
          rowKey={config.id}
          selectedKey={selectedId}
          defaultSort={config.defaultSort}
          onRowClick={(row) => navigate({ pathname: explorerPath(type, config.id(row)), search: params.toString() })}
          empty={
            <EmptyState
              icon={<SearchX className="size-4" aria-hidden />}
              title={`No ${meta.plural.toLowerCase()} match`}
              description="Try a different search or clear the filters."
              action={
                <Button size="sm" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          }
        />
      </Panel>
    </>
  );
}
