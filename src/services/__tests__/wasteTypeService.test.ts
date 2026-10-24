const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockFrom = jest.fn();

const mockSupabase = {
  from: mockFrom,
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('wasteTypeService - Catálogo oficial de tipos de residuo (LER)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('getAll y caché en memoria', () => {
    it('debe obtener los tipos de residuo desde Supabase si devuelve más de 50 registros', async () => {
      const mockDbData = Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        codigo_ler: `15 01 ${String(i).padStart(2, '0')}`,
        descripcion: `Residuo ${i}`,
        activo: true,
      }));

      mockOrder.mockResolvedValue({ data: mockDbData, error: null });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      const result = await service.getAll();

      expect(mockFrom).toHaveBeenCalledWith('waste_types');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('activo', true);
      expect(mockOrder).toHaveBeenCalledWith('codigo_ler', { ascending: true });
      expect(result).toHaveLength(60);

      // Segunda llamada: debe retornar directamente desde memoryCache sin consultar a Supabase otra vez
      const cachedResult = await service.getAll();
      expect(cachedResult).toBe(result);
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('debe usar el catálogo fallback cuando Supabase devuelve error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error connecting to waste_types' },
      });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      const result = await service.getAll();

      expect(result.length).toBeGreaterThan(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching waste types from Supabase'),
        expect.anything()
      );

      consoleWarnSpy.mockRestore();
    });

    it('debe usar el catálogo fallback cuando Supabase devuelve 50 o menos registros', async () => {
      const mockFewData = [
        { id: 1, codigo_ler: '15 01 01', descripcion: 'Envases' },
      ];

      mockOrder.mockResolvedValue({ data: mockFewData, error: null });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      const result = await service.getAll();

      // Debe devolver la lista fallback oficial completa
      expect(result.length).toBeGreaterThan(50);
    });
  });

  describe('getById', () => {
    it('debe encontrar un residuo por su ID', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Use fallback' },
      });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      const item = await service.getById(1);
      expect(item).toBeDefined();
      expect(item?.id).toBe(1);
    });

    it('debe retornar null si no existe ningún residuo con ese ID', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Use fallback' },
      });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      const item = await service.getById(999999);
      expect(item).toBeNull();
    });
  });

  describe('getByCodigoLer', () => {
    it('debe retornar null si se pasa un código vacío o falsy', async () => {
      const { default: service } = await import('../wasteTypeService');

      const itemEmpty = await service.getByCodigoLer('');
      expect(itemEmpty).toBeNull();

      const itemFalsy = await service.getByCodigoLer(null as any);
      expect(itemFalsy).toBeNull();
    });

    it('debe encontrar un residuo por su código LER normalizando espacios', async () => {
      const mockData = Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        codigo_ler: i === 5 ? '15 01 01' : `20 01 ${String(i).padStart(2, '0')}`,
        descripcion: `Residuo ${i}`,
        activo: true,
      }));

      mockOrder.mockResolvedValue({ data: mockData, error: null });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      // Buscar con espacios múltiples accidentales
      const item = await service.getByCodigoLer('   15   01   01   ');
      expect(item).toBeDefined();
      expect(item?.id).toBe(6);
    });

    it('debe retornar null si el código LER no existe', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Use fallback' },
      });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      const item = await service.getByCodigoLer('99 99 99*');
      expect(item).toBeNull();
    });
  });

  describe('search', () => {
    it('debe devolver los primeros N elementos si la query es vacía o solo espacios', async () => {
      const mockData = Array.from({ length: 70 }, (_, i) => ({
        id: i + 1,
        codigo_ler: `15 01 ${String(i).padStart(2, '0')}`,
        descripcion: `Residuo ${i}`,
        activo: true,
      }));

      mockOrder.mockResolvedValue({ data: mockData, error: null });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      const defaultSlice = await service.search('', 10);
      expect(defaultSlice).toHaveLength(10);

      const whitespaceSlice = await service.search('    ', 5);
      expect(whitespaceSlice).toHaveLength(5);
    });

    it('debe buscar por código LER, descripción o títulos de capítulo/subcapítulo', async () => {
      const mockData = [
        {
          id: 1,
          codigo_ler: '15 01 01',
          descripcion: 'Envases de papel y cartón',
          capitulo_titulo: 'ENVASES',
          subcapitulo_titulo: 'Envases incluidos los recogidos selectivamente',
        },
        {
          id: 2,
          codigo_ler: '13 02 05*',
          descripcion: 'Aceites minerales no clorados de motor',
          capitulo_titulo: 'ACEITES RESIDUALES',
          subcapitulo_titulo: 'Aceites de motor',
        },
        {
          id: 3,
          codigo_ler: '20 03 01',
          descripcion: 'Mezclas de residuos municipales',
          capitulo_titulo: 'RESIDUOS MUNICIPALES',
          subcapitulo_titulo: 'Otros residuos',
        },
      ];

      // Añadimos suficientes para superar el umbral de 50
      const extraItems = Array.from({ length: 60 }, (_, i) => ({
        id: i + 10,
        codigo_ler: `90 00 ${String(i).padStart(2, '0')}`,
        descripcion: `Inerte ${i}`,
        capitulo_titulo: 'INERTES',
        subcapitulo_titulo: 'Varios',
      }));

      mockOrder.mockResolvedValue({ data: [...mockData, ...extraItems], error: null });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { default: service } = await import('../wasteTypeService');

      // Búsqueda por texto en descripción
      const searchByDesc = await service.search('papel');
      expect(searchByDesc).toHaveLength(1);
      expect(searchByDesc[0].id).toBe(1);

      // Búsqueda por código LER
      const searchByCode = await service.search('13 02');
      expect(searchByCode).toHaveLength(1);
      expect(searchByCode[0].id).toBe(2);

      // Búsqueda por título de capítulo
      const searchByCap = await service.search('MUNICIPALES');
      expect(searchByCap).toHaveLength(1);
      expect(searchByCap[0].id).toBe(3);

      // Búsqueda por título de subcapítulo
      const searchBySubcap = await service.search('recogidos selectivamente');
      expect(searchBySubcap).toHaveLength(1);
      expect(searchBySubcap[0].id).toBe(1);
    });
  });
});
