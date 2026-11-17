export interface SortableColumn<T> {
  id?: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  sortingFn?: (a: T, b: T) => number;
}

export interface FilterableColumn<T> {
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
}

/**
 * Calcula los números de página a mostrar incluyendo elipsis inteligentes.
 */
export function calculatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | string)[] {
  if (totalPages <= 0) return [];
  if (totalPages <= maxVisible + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push('ellipsis-start');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    pages.push('ellipsis-end');
  }

  pages.push(totalPages);
  return pages;
}

/**
 * Filtra los datos según un término de búsqueda general o un filtro personalizado.
 */
export function filterTableData<T extends Record<string, any>>(
  data: T[],
  searchTerm: string,
  columns: FilterableColumn<T>[],
  customFilter?: (row: T, term: string) => boolean
): T[] {
  if (!searchTerm || !searchTerm.trim()) {
    return data;
  }

  const term = searchTerm.toLowerCase().trim();

  if (customFilter) {
    return data.filter((row) => customFilter(row, term));
  }

  return data.filter((row) => {
    return columns.some((col) => {
      let val: any;
      if (col.accessorFn) {
        val = col.accessorFn(row);
      } else if (col.accessorKey) {
        val = row[col.accessorKey];
      }
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(term);
    });
  });
}

/**
 * Ordena los datos según una columna seleccionada y dirección (asc / desc).
 */
export function sortTableData<T extends Record<string, any>>(
  data: T[],
  sortKey: string | null,
  sortOrder: 'asc' | 'desc' | null,
  columns: SortableColumn<T>[]
): T[] {
  if (!sortKey || !sortOrder) {
    return data;
  }

  const activeColumn = columns.find(
    (col) => (col.id || String(col.accessorKey)) === sortKey
  );
  if (!activeColumn) {
    return data;
  }

  return [...data].sort((a, b) => {
    if (activeColumn.sortingFn) {
      const res = activeColumn.sortingFn(a, b);
      return sortOrder === 'asc' ? res : -res;
    }

    const aVal = activeColumn.accessorFn
      ? activeColumn.accessorFn(a)
      : activeColumn.accessorKey
      ? a[activeColumn.accessorKey]
      : null;
    const bVal = activeColumn.accessorFn
      ? activeColumn.accessorFn(b)
      : activeColumn.accessorKey
      ? b[activeColumn.accessorKey]
      : null;

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Comparación de fechas ISO
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const aDate = Date.parse(aVal);
      const bDate = Date.parse(bVal);
      if (!isNaN(aDate) && !isNaN(bDate) && aVal.length >= 10 && bVal.length >= 10) {
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal, 'es', { numeric: true, sensitivity: 'base' })
        : bVal.localeCompare(aVal, 'es', { numeric: true, sensitivity: 'base' });
    }

    // Comparación numérica
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Comparación estándar como texto
    return sortOrder === 'asc'
      ? String(aVal).localeCompare(String(bVal), 'es', { numeric: true })
      : String(bVal).localeCompare(String(aVal), 'es', { numeric: true });
  });
}

/**
 * Pagina los datos dados para una página y tamaño de página especificados.
 */
export function paginateTableData<T>(
  data: T[],
  currentPage: number,
  pageSize: number
): T[] {
  if (pageSize <= 0 || data.length === 0) return [];
  const safePage = Math.max(1, currentPage);
  const start = (safePage - 1) * pageSize;
  return data.slice(start, start + pageSize);
}
