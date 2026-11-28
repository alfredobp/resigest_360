import {
  CENTER_FILTER_ALL,
  CENTER_FILTER_NONE,
  buildCenterFilterOptions,
  matchesCenterFilter,
} from '../diCenterFilter';

describe('diCenterFilter', () => {
  describe('matchesCenterFilter', () => {
    it('devuelve true para todos los documentos cuando el filtro es "all" o vacío', () => {
      expect(matchesCenterFilter({ production_center_id: 10 }, CENTER_FILTER_ALL)).toBe(true);
      expect(matchesCenterFilter({ production_center_id: undefined }, CENTER_FILTER_ALL)).toBe(true);
      expect(matchesCenterFilter({ production_center_id: 10 }, '')).toBe(true);
    });

    it('filtra documentos sin centro asignado cuando el filtro es "none"', () => {
      expect(matchesCenterFilter({ production_center_id: undefined }, CENTER_FILTER_NONE)).toBe(true);
      expect(
        matchesCenterFilter({ production_center_id: null as unknown as number }, CENTER_FILTER_NONE)
      ).toBe(true);
      expect(matchesCenterFilter({ production_center_id: 5 }, CENTER_FILTER_NONE)).toBe(false);
    });

    it('filtra por ID numérico de centro y rechaza valores no numéricos', () => {
      expect(matchesCenterFilter({ production_center_id: 42 }, '42')).toBe(true);
      expect(matchesCenterFilter({ production_center_id: 42 }, '7')).toBe(false);
      expect(matchesCenterFilter({ production_center_id: undefined }, '42')).toBe(false);
      expect(matchesCenterFilter({ production_center_id: 42 }, 'invalido')).toBe(false);
    });
  });

  describe('buildCenterFilterOptions', () => {
    it('combina centros propios, centros externos presentes en DIs y documentos sin centro', () => {
      const companyCenters = [
        { id: 2, nombre: 'Planta Sur' },
        { id: 1, nombre: 'Almacén Central' },
      ];
      const documents = [
        { production_center_id: 2, production_center: { id: 2, nombre: 'Planta Sur' } as any },
        { production_center_id: 2, production_center: { id: 2, nombre: 'Planta Sur' } as any },
        { production_center_id: 99, production_center: { id: 99, nombre: 'Centro Cliente Externo' } as any },
        { production_center_id: undefined, production_center: undefined },
        { production_center_id: null as unknown as number, production_center: undefined },
      ];

      const options = buildCenterFilterOptions(documents, companyCenters);

      expect(options).toEqual([
        { value: '1', label: 'Almacén Central', count: 0 },
        { value: '99', label: 'Centro Cliente Externo', count: 1 },
        { value: '2', label: 'Planta Sur', count: 2 },
        { value: CENTER_FILTER_NONE, label: 'Sede principal / Sin centro asignado', count: 2 },
      ]);
    });

    it('usa etiquetas de respaldo cuando el centro no tiene nombre y omite "none" si todos tienen centro', () => {
      const options = buildCenterFilterOptions(
        [
          { production_center_id: 7, production_center: undefined },
          { production_center_id: Number.NaN, production_center: undefined },
        ],
        [{ id: 3, nombre: '' }]
      );

      expect(options).toEqual([
        { value: '3', label: 'Centro #3', count: 0 },
        { value: '7', label: 'Centro #7', count: 1 },
        { value: CENTER_FILTER_NONE, label: 'Sede principal / Sin centro asignado', count: 1 },
      ]);

      const allAssigned = buildCenterFilterOptions(
        [{ production_center_id: 3, production_center: { id: 3, nombre: 'Planta' } as any }],
        [{ id: 3, nombre: 'Planta' }]
      );
      expect(allAssigned).toEqual([{ value: '3', label: 'Planta', count: 1 }]);
    });
  });
});
