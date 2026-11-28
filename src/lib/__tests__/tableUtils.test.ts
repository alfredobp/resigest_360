import {
  calculatePageNumbers,
  filterTableData,
  sortTableData,
  paginateTableData,
  type SortableColumn,
  type FilterableColumn,
} from '../tableUtils';

describe('tableUtils', () => {
  describe('calculatePageNumbers', () => {
    it('debe devolver un array vacío si totalPages es <= 0', () => {
      expect(calculatePageNumbers(1, 0)).toEqual([]);
      expect(calculatePageNumbers(1, -5)).toEqual([]);
    });

    it('debe devolver todas las páginas sin elipsis si totalPages <= maxVisible + 2', () => {
      expect(calculatePageNumbers(1, 5, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(calculatePageNumbers(3, 7, 5)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('debe insertar elipsis al final si la página actual está al principio', () => {
      const pages = calculatePageNumbers(1, 10, 5);
      expect(pages).toEqual([1, 2, 'ellipsis-end', 10]);
    });

    it('debe insertar elipsis al inicio y al final si la página actual está en el medio', () => {
      const pages = calculatePageNumbers(5, 10, 5);
      expect(pages).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]);
    });

    it('debe insertar elipsis solo al inicio si la página actual está al final', () => {
      const pages = calculatePageNumbers(10, 10, 5);
      expect(pages).toEqual([1, 'ellipsis-start', 9, 10]);
    });
  });

  describe('filterTableData', () => {
    interface TestItem {
      id: number;
      name: string;
      code: string;
      extra?: string | null;
    }

    const items: TestItem[] = [
      { id: 1, name: 'Papel y Cartón', code: '20 01 01', extra: 'Almacén Central' },
      { id: 2, name: 'Baterías de plomo', code: '16 06 01', extra: null },
      { id: 3, name: 'Plásticos mixtos', code: '15 01 02', extra: undefined },
      { id: 4, name: 'Envases metálicos', code: '15 01 04', extra: 'Planta Norte' },
    ];

    const columns: FilterableColumn<TestItem>[] = [
      { accessorKey: 'name' },
      { accessorKey: 'code' },
      { accessorFn: (row) => row.extra },
    ];

    it('debe retornar todos los datos si el término de búsqueda está vacío o son solo espacios', () => {
      expect(filterTableData(items, '', columns)).toEqual(items);
      expect(filterTableData(items, '   ', columns)).toEqual(items);
    });

    it('debe filtrar insensible a mayúsculas/minúsculas por cualquier columna con accessorKey', () => {
      const result = filterTableData(items, 'papel', columns);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);

      const codeResult = filterTableData(items, '15 01', columns);
      expect(codeResult).toHaveLength(2);
      expect(codeResult.map((r) => r.id)).toEqual([3, 4]);
    });

    it('debe filtrar utilizando columnas con accessorFn ignorando nulos y undefined', () => {
      const result = filterTableData(items, 'planta norte', columns);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(4);
    });

    it('debe respetar una función de filtro personalizada si se proporciona', () => {
      const customFilter = (row: TestItem, term: string) => row.id === Number(term);
      const result = filterTableData(items, '2', columns, customFilter);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  describe('sortTableData', () => {
    interface TestItem {
      id: number;
      name: string;
      amount: number;
      date: string;
      optional?: string | null;
    }

    const items: TestItem[] = [
      { id: 3, name: 'Zapato', amount: 150.5, date: '2026-03-01T10:00:00Z', optional: 'B' },
      { id: 1, name: 'Árbol', amount: 50, date: '2026-01-15T08:00:00Z', optional: null },
      { id: 2, name: 'Barco', amount: 200, date: '2026-02-20T12:00:00Z', optional: 'A' },
      { id: 4, name: 'barco', amount: 50, date: '2026-04-10T09:00:00Z', optional: undefined },
    ];

    const columns: SortableColumn<TestItem>[] = [
      { id: 'name', accessorKey: 'name' },
      { id: 'amount', accessorKey: 'amount' },
      { id: 'date', accessorKey: 'date' },
      { id: 'optional', accessorKey: 'optional' },
      {
        id: 'custom',
        sortingFn: (a, b) => a.id - b.id,
      },
    ];

    it('debe devolver los mismos datos si no hay sortKey o sortOrder', () => {
      expect(sortTableData(items, null, 'asc', columns)).toEqual(items);
      expect(sortTableData(items, 'name', null, columns)).toEqual(items);
      expect(sortTableData(items, 'inexistente', 'asc', columns)).toEqual(items);
    });

    it('debe ordenar textos ascendentemente y descendentemente con sensibilidad regional en español', () => {
      const asc = sortTableData(items, 'name', 'asc', columns);
      expect(asc[0].name).toBe('Árbol');
      expect(asc[asc.length - 1].name).toBe('Zapato');

      const desc = sortTableData(items, 'name', 'desc', columns);
      expect(desc[0].name).toBe('Zapato');
      expect(desc[desc.length - 1].name).toBe('Árbol');
    });

    it('debe ordenar valores numéricos correctamente', () => {
      const asc = sortTableData(items, 'amount', 'asc', columns);
      expect(asc[0].amount).toBe(50);
      expect(asc[asc.length - 1].amount).toBe(200);

      const desc = sortTableData(items, 'amount', 'desc', columns);
      expect(desc[0].amount).toBe(200);
      expect(desc[desc.length - 1].amount).toBe(50);
    });

    it('debe ordenar fechas ISO cronológicamente', () => {
      const asc = sortTableData(items, 'date', 'asc', columns);
      expect(asc[0].id).toBe(1); // 2026-01-15
      expect(asc[asc.length - 1].id).toBe(4); // 2026-04-10

      const desc = sortTableData(items, 'date', 'desc', columns);
      expect(desc[0].id).toBe(4);
      expect(desc[desc.length - 1].id).toBe(1);
    });

    it('debe ubicar valores nulos o undefined al final', () => {
      const asc = sortTableData(items, 'optional', 'asc', columns);
      expect(asc[0].optional).toBe('A');
      expect(asc[1].optional).toBe('B');
      expect(asc[2].optional).toBeNull();
      expect(asc[3].optional).toBeUndefined();
    });

    it('debe utilizar sortingFn personalizado cuando esté definido', () => {
      const asc = sortTableData(items, 'custom', 'asc', columns);
      expect(asc.map((i) => i.id)).toEqual([1, 2, 3, 4]);

      const desc = sortTableData(items, 'custom', 'desc', columns);
      expect(desc.map((i) => i.id)).toEqual([4, 3, 2, 1]);
    });
  });

  describe('paginateTableData', () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('debe devolver un array vacío si pageSize es <= 0 o data está vacía', () => {
      expect(paginateTableData(list, 1, 0)).toEqual([]);
      expect(paginateTableData(list, 1, -1)).toEqual([]);
      expect(paginateTableData([], 1, 10)).toEqual([]);
    });

    it('debe paginar los datos de forma exacta', () => {
      expect(paginateTableData(list, 1, 3)).toEqual([1, 2, 3]);
      expect(paginateTableData(list, 2, 3)).toEqual([4, 5, 6]);
      expect(paginateTableData(list, 4, 3)).toEqual([10]);
      expect(paginateTableData(list, 5, 3)).toEqual([]);
    });

    it('debe tolerar páginas menores a 1 normalizándolas a la primera página', () => {
      expect(paginateTableData(list, 0, 3)).toEqual([1, 2, 3]);
      expect(paginateTableData(list, -2, 3)).toEqual([1, 2, 3]);
    });
  });
});
