'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Buscar registros...',
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
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(initialSortBy || null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(
    initialSortBy ? initialSortOrder : null
  );
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reiniciar a página 1 cuando cambia el término de búsqueda o el conjunto de datos base
  useEffect(() => {
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
  const paginatedData = useMemo(() => {
    return paginateTableData(sortedData, currentPage, pageSize);
  }, [sortedData, currentPage, pageSize]);

  return (
    <div
      className={`bg-white dark:bg-[#111827] rounded-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}
    >
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
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-[12.5px] border-collapse ${tableClassName}`}>
          <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase text-[10.5px] select-none">
            <tr>
              {columns.map((column, colIdx) => {
                const colId = column.id || String(column.accessorKey || colIdx);
                const isSorted = sortKey === colId;
                const isSortable = !!column.sortable;

                return (
                  <th
                    key={colId}
                    scope="col"
                    onClick={() => handleSort(column, colId)}
                    className={`py-2.5 px-2.5 transition-colors ${isSortable
                        ? 'cursor-pointer hover:bg-gray-100/70 dark:hover:bg-gray-800'
                        : ''
                      } ${column.headerClassName || ''}`}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>{column.header}</span>
                      {isSortable && (
                        <span className="text-gray-400">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-500">
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
                const rowKey = keyExtractor
                  ? keyExtractor(row, rowIdx)
                  : row.id !== undefined
                    ? String(row.id)
                    : rowIdx;

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-700/25 transition-colors"
                  >
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
          currentPage={currentPage}
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
