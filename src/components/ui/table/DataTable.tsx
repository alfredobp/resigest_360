'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  FileQuestion
} from 'lucide-react';
import Pagination from './Pagination';
import {
  filterTableData,
  sortTableData,
  paginateTableData,
  type SortableColumn,
  type FilterableColumn
} from '@/lib/tableUtils';

export interface ColumnDef<T> extends SortableColumn<T>, FilterableColumn<T> {
  id?: string;
  header: React.ReactNode;
  cell?: (info: { row: T; value: any; index: number }) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor?: (row: T, index: number) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  initialSearch?: string;
  searchFilter?: (row: T, term: string) => boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  toolbarActions?: React.ReactNode;
  emptyState?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  syncUrlParams?: boolean;
  selectable?: boolean;
  bulkActions?: (selectedRows: T[], clearSelection: () => void) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Buscar registros...',
  initialSearch = '',
  searchFilter,
  defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  initialSortBy,
  initialSortOrder = 'asc',
  toolbarActions,
  emptyState,
  emptyMessage = 'No se encontraron registros',
  className = '',
  tableClassName = '',
  syncUrlParams = false,
  selectable = false,
  bulkActions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState(() => {
    if (syncUrlParams && typeof window !== 'undefined') {
      const urlQ = new URLSearchParams(window.location.search).get('q');
      if (urlQ !== null) return urlQ;
    }
    return initialSearch;
  });

  useEffect(() => {
    if (initialSearch !== undefined && initialSearch !== '') {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);
  const [sortKey, setSortKey] = useState<string | null>(initialSortBy || null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(
    initialSortBy ? initialSortOrder : null
  );
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (syncUrlParams && typeof window !== 'undefined') {
      const urlPage = Number(new URLSearchParams(window.location.search).get('page'));
      if (Number.isInteger(urlPage) && urlPage > 0) return urlPage;
    }
    return 1;
  });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const isFirstMountRef = React.useRef(true);

  const getRowKey = useCallback(
    (row: T, index: number): string =>
      keyExtractor
        ? String(keyExtractor(row, index))
        : row.id !== undefined
          ? String(row.id)
          : String(index),
    [keyExtractor]
  );

  // Sincronizar búsqueda y página con la URL para preservar estado al volver atrás
  useEffect(() => {
    if (!syncUrlParams || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    } else {
      params.delete('q');
    }
    if (currentPage > 1) {
      params.set('page', String(currentPage));
    } else {
      params.delete('page');
    }
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [syncUrlParams, searchTerm, currentPage]);

  // Reiniciar a página 1 cuando cambia el término de búsqueda o el tamaño de página
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchTerm, pageSize, data.length]);

  // Manejador de ordenación por columna
  const handleSort = (column: ColumnDef<T>, colId: string) => {
    if (!column.sortable) return;

    if (sortKey === colId) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortOrder(null);
        setSortKey(null);
      } else {
        setSortOrder('asc');
      }
    } else {
      setSortKey(colId);
      setSortOrder('asc');
    }
  };

  // Filtrado por buscador rápido
  const filteredData = useMemo(() => {
    if (!searchable) return data;
    return filterTableData(data, searchTerm, columns, searchFilter);
  }, [data, searchTerm, searchable, searchFilter, columns]);

  // Ordenación interactiva
  const sortedData = useMemo(() => {
    return sortTableData(filteredData, sortKey, sortOrder, columns);
  }, [filteredData, sortKey, sortOrder, columns]);

  // Paginación
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    return paginateTableData(sortedData, safeCurrentPage, pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const selectedRows = useMemo(() => {
    if (!selectable || selectedKeys.size === 0) return [];
    return sortedData.filter((row, idx) => selectedKeys.has(getRowKey(row, idx)));
  }, [selectable, selectedKeys, sortedData, getRowKey]);

  const allPageSelected =
    selectable &&
    paginatedData.length > 0 &&
    paginatedData.every((row, idx) => selectedKeys.has(getRowKey(row, idx)));

  const toggleAllOnPage = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedData.forEach((row, idx) => next.delete(getRowKey(row, idx)));
      } else {
        paginatedData.forEach((row, idx) => next.add(getRowKey(row, idx)));
      }
      return next;
    });
  };

  const toggleRowSelection = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedKeys(new Set());

  return (
    <div
      className={`bg-white dark:bg-[#111827] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}
    >
      {/* Barra de acciones en lote cuando hay filas seleccionadas */}
      {selectable && selectedRows.length > 0 && (
        <div className="px-3.5 py-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 bg-brand-50/90 dark:bg-brand-950/30 border-b border-brand-200 dark:border-brand-900/60 text-xs">
          <div className="flex items-center gap-2 text-brand-900 dark:text-brand-200 font-semibold">
            <span>
              {selectedRows.length} registro{selectedRows.length === 1 ? '' : 's'} seleccionado{selectedRows.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[11px] font-medium text-brand-700 dark:text-brand-400 underline hover:no-underline"
            >
              Limpiar
            </button>
          </div>
          {bulkActions && <div className="flex items-center gap-2">{bulkActions(selectedRows, clearSelection)}</div>}
        </div>
      )}
      {/* Barra de herramientas superior: Buscador + Acciones */}
      {(searchable || toolbarActions) && (
        <div className="px-3.5 py-2.5 sm:px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          {searchable ? (
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 text-xs pl-8 pr-8 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {toolbarActions && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {toolbarActions}
            </div>
          )}
        </div>
      )}

      {/* Contenedor de la tabla responsiva */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className={`w-full text-left text-[12.5px] border-collapse ${tableClassName}`}>
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase text-[10.5px] select-none">
            <tr>
              {selectable && (
                <th scope="col" className="w-9 py-2.5 pl-3 pr-1">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label="Seleccionar todos los registros de esta página"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                  />
                </th>
              )}
              {columns.map((column, colIdx) => {
                const colId = column.id || String(column.accessorKey || colIdx);
                const isSorted = sortKey === colId;
                const isSortable = !!column.sortable;
                const ariaSort = isSortable
                  ? isSorted
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined;

                return (
                  <th
                    key={colId}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`py-2.5 px-2.5 transition-colors ${isSortable
                        ? 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        : ''
                      } ${column.headerClassName || ''}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column, colId)}
                        className="inline-flex items-center gap-1 uppercase tracking-wider font-semibold text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded"
                      >
                        <span>{column.header}</span>
                        <span className="text-slate-400" aria-hidden="true">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-60" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <span>{column.header}</span>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-12 text-center text-gray-500">
                  {emptyState ? (
                    emptyState
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileQuestion className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {emptyMessage}
                      </p>
                      {searchTerm && (
                        <p className="text-xs text-gray-400">
                          Intenta con otro término de búsqueda o limpia el filtro.
                        </p>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const rowKey = getRowKey(row, rowIdx);
                const isSelected = selectable && selectedKeys.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-brand-50/50 dark:bg-brand-950/20'
                        : 'hover:bg-gray-50/60 dark:hover:bg-gray-700/25'
                    }`}
                  >
                    {selectable && (
                      <td className="w-9 py-2 pl-3 pr-1 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(rowKey)}
                          aria-label={`Seleccionar fila ${rowIdx + 1}`}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                        />
                      </td>
                    )}
                    {columns.map((column, colIdx) => {
                      const colId = column.id || String(column.accessorKey || colIdx);
                      const rawVal = column.accessorFn
                        ? column.accessorFn(row)
                        : column.accessorKey
                          ? row[column.accessorKey]
                          : null;

                      return (
                        <td
                          key={colId}
                          className={`py-2 px-2.5 align-middle ${column.className || ''}`}
                        >
                          {column.cell
                            ? column.cell({
                              row,
                              value: rawVal,
                              index: (currentPage - 1) * pageSize + rowIdx,
                            })
                            : rawVal !== null && rawVal !== undefined
                              ? String(rawVal)
                              : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalItems > 0 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}

export default DataTable;
