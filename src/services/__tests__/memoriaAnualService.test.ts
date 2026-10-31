const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Setup DOM mocks for export functions
if (typeof URL.createObjectURL === 'undefined') {
  (URL as any).createObjectURL = jest.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  (URL as any).revokeObjectURL = jest.fn();
}

if (typeof document === 'undefined') {
  (global as any).document = {
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
    createElement: jest.fn(() => ({
      setAttribute: jest.fn(),
      click: jest.fn(),
    })),
  };
}

import {
  createMemoria,
  getAllMemorias,
  getMemoriaById,
  updateMemoria,
  updateEstado,
  deleteMemoria,
  generateExcelData,
  getEffectiveWeightTonnes,
  getStats,
  exportMemoriaToExcelXML,
  exportMemoriaToCSV,
} from '../memoriaAnualService';
import type { IdentificationDocument, MemoriaAnual } from '@/types/wasteManagement';

describe('memoriaAnualService - Memorias Anuales de Residuos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUser = { id: 'user-mem-123' };

  describe('getEffectiveWeightTonnes', () => {
    it('debe priorizar peso_destino_kg en toneladas', () => {
      const doc = { peso_destino_kg: 2500, peso_origen_kg: 2400 } as IdentificationDocument;
      expect(getEffectiveWeightTonnes(doc)).toBe(2.5);
    });

    it('debe usar peso_origen_kg si no hay peso en destino', () => {
      const doc = { peso_origen_kg: 1800 } as IdentificationDocument;
      expect(getEffectiveWeightTonnes(doc)).toBe(1.8);
    });

    it('debe convertir cantidad si la unidad es kg', () => {
      const doc = { cantidad: 750, unidad: 'kg' } as IdentificationDocument;
      expect(getEffectiveWeightTonnes(doc)).toBe(0.75);
    });

    it('debe asumir toneladas directamente si no es kg', () => {
      const doc = { cantidad: 3.25, unidad: 'toneladas' } as IdentificationDocument;
      expect(getEffectiveWeightTonnes(doc)).toBe(3.25);
    });
  });

  describe('createMemoria', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        createMemoria({
          company_id: 1,
          tipo_memoria: 'productor',
          año: 2025,
          nombre_empresa: 'Empresa Test',
          nif_empresa: 'B12345678',
          production_center_id: 10,
        })
      ).rejects.toThrow('No hay usuario autenticado');
    });

    it('debe generar número de memoria correlativo, calcular resumen LER e insertar con éxito', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      // Mock generateNumeroMemoria query
      const numMemoriaChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({
          data: [{ numero_memoria: 'MA-2025-PROD-002' }],
          error: null,
        }),
      };

      // Mock DIs lookup
      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) =>
        Promise.resolve({
          data: [
            {
              id: 1,
              estado: 'completado',
              codigo_ler: '15 01 10*',
              descripcion_residuo: 'Envases tóxicos',
              peso_destino_kg: 1000,
            },
            {
              id: 2,
              estado: 'completado',
              codigo_ler: '15 01 10*',
              descripcion_residuo: 'Envases tóxicos',
              peso_destino_kg: 500,
            },
          ],
          error: null,
        }).then(resolve);

      // Mock insert
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 100, numero_memoria: 'MA-2025-PROD-003', total_toneladas: 1.5 },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') {
          return {
            ...numMemoriaChain,
            ...insertChain,
          };
        }
        if (table === 'identification_documents') return diChain;
        return null;
      });

      const res = await createMemoria({
        company_id: 1,
        tipo_memoria: 'productor',
        año: 2025,
        nombre_empresa: 'Empresa Test',
        nif_empresa: 'B12345678',
        production_center_id: 10,
      });

      expect(res).toBeDefined();
      expect(res?.numero_memoria).toBe('MA-2025-PROD-003');
      expect(insertChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          numero_memoria: 'MA-2025-PROD-003',
          total_movimientos: 2,
          total_toneladas: 1.5,
          resumen_ler: [
            expect.objectContaining({
              codigo_ler: '15 01 10*',
              cantidad_total: 1.5,
              numero_movimientos: 2,
            }),
          ],
        }),
      ]);
    });

    it('debe crear memoria de tipo negociante y manejar prefijos específicos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const numMemoriaChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({
          data: [{ numero_memoria: 'MA-2025-NEG-001' }, { numero_memoria: 'MA-2025-NEG-INVALID' }],
          error: null,
        }),
      };

      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) =>
        Promise.resolve({
          data: [
            {
              id: 99,
              estado: 'aceptado',
              estado_traslado: 'aceptado',
              codigo_ler: '17 04 05',
              cantidad: 4,
              unidad: 't',
            },
            {
              id: 100,
              estado: 'borrador', // Este debe ser ignorado por el filtro
              estado_traslado: 'pendiente',
            },
          ],
          error: null,
        }).then(resolve);

      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 200, numero_memoria: 'MA-2025-NEG-002', tipo_memoria: 'negociante' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') return diChain;
        if (table === 'memorias_anuales') {
          return {
            select: jest.fn().mockImplementation(() => numMemoriaChain),
            insert: jest.fn().mockImplementation(() => insertChain),
          };
        }
        return null;
      });

      const res = await createMemoria({
        company_id: 2,
        tipo_memoria: 'negociante',
        año: 2025,
        nombre_empresa: 'Comercial Negociante',
        nif_empresa: 'B99999999',
        production_center_id: 0,
      });

      expect(res?.numero_memoria).toBe('MA-2025-NEG-002');
    });

    it('debe manejar colisión de número de memoria (código 23505) y reintentar con el siguiente número', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const numMemoriaChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);

      let insertAttempts = 0;
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          insertAttempts++;
          if (insertAttempts === 1) {
            return Promise.resolve({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint memorias_anuales_numero_memoria_key',
              },
            });
          }
          return Promise.resolve({
            data: { id: 101, numero_memoria: 'MA-2025-PROD-002' },
            error: null,
          });
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return { ...numMemoriaChain, ...insertChain };
        if (table === 'identification_documents') return diChain;
        return null;
      });

      const res = await createMemoria({
        company_id: 1,
        tipo_memoria: 'productor',
        año: 2025,
        nombre_empresa: 'Empresa Test',
        nif_empresa: 'B12345678',
        production_center_id: 10,
      });

      expect(res?.numero_memoria).toBe('MA-2025-PROD-002');
      expect(insertAttempts).toBe(2);
    });

    it('debe lanzar error si se supera el límite de intentos por colisión', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const numMemoriaChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);

      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: '23505',
            message: 'memorias_anuales_numero_memoria_key collision',
          },
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return { ...numMemoriaChain, ...insertChain };
        if (table === 'identification_documents') return diChain;
        return null;
      });

      await expect(
        createMemoria({
          company_id: 1,
          tipo_memoria: 'productor',
          año: 2025,
          nombre_empresa: 'Empresa Test',
          nif_empresa: 'B12345678',
          production_center_id: 10,
        })
      ).rejects.toThrow('No se pudo generar un número de memoria único');
    });

    it('debe propagar errores no relacionados con unicidad al crear memoria', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const numMemoriaChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);

      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Relation memorias_anuales does not exist'),
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') return diChain;
        if (table === 'memorias_anuales') {
          return {
            select: jest.fn().mockImplementation(() => numMemoriaChain),
            insert: jest.fn().mockImplementation(() => insertChain),
          };
        }
        return null;
      });

      await expect(
        createMemoria({
          company_id: 1,
          tipo_memoria: 'productor',
          año: 2025,
          nombre_empresa: 'Empresa Test',
          nif_empresa: 'B12345678',
          production_center_id: 10,
        })
      ).rejects.toThrow('Relation memorias_anuales does not exist');
    });

    it('debe lanzar error amigable si ya existe memoria para el mismo centro y año', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const numMemoriaChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);

      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: {
            code: '23505',
            message: 'memorias_anuales_unique_center_year',
          },
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return { ...numMemoriaChain, ...insertChain };
        if (table === 'identification_documents') return diChain;
        return null;
      });

      await expect(
        createMemoria({
          company_id: 1,
          tipo_memoria: 'productor',
          año: 2025,
          nombre_empresa: 'Empresa Test',
          nif_empresa: 'B12345678',
          production_center_id: 10,
        })
      ).rejects.toThrow('Ya existe una memoria anual de tipo "productor" para este centro');
    });
  });

  describe('getAllMemorias & getMemoriaById', () => {
    it('getAllMemorias debe fallar si no hay usuario', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(getAllMemorias()).rejects.toThrow('No hay usuario autenticado');
    });

    it('getAllMemorias debe listar las memorias del usuario ordenadas', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockList = [{ id: 1, numero_memoria: 'MA-01' }];
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockList, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await getAllMemorias();
      expect(res).toEqual(mockList);
      expect(chain.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('getAllMemorias debe lanzar error si la consulta falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('Get all failed') }),
      };
      mockSupabase.from.mockReturnValue(chain);

      await expect(getAllMemorias()).rejects.toThrow('Get all failed');
    });

    it('getMemoriaById debe retornar la memoria encontrada o null en error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMem = { id: 5, numero_memoria: 'MA-05' };
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMem, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await getMemoriaById(5);
      expect(res).toEqual(mockMem);

      chain.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') });
      const notFound = await getMemoriaById(999);
      expect(notFound).toBeNull();
    });
  });

  describe('updateMemoria, updateEstado & deleteMemoria', () => {
    it('updateMemoria debe actualizar los campos y fecha de actualización', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1, observaciones: 'Revisada' }, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await updateMemoria(1, { observaciones: 'Revisada' });
      expect(res?.observaciones).toBe('Revisada');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ observaciones: 'Revisada', updated_at: expect.any(String) })
      );
    });

    it('updateEstado debe registrar fecha_presentacion cuando se marca como presentada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 2, estado: 'presentada' }, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await updateEstado(2, 'presentada');
      expect(res?.estado).toBe('presentada');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'presentada',
          fecha_presentacion: expect.any(String),
        })
      );
    });

    it('updateEstado no debe registrar fecha_presentacion si el estado no es presentada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 3, estado: 'completada' }, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await updateEstado(3, 'completada');
      expect(res?.estado).toBe('completada');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'completada' })
      );
      expect(chain.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ fecha_presentacion: expect.any(String) })
      );
    });

    it('createMemoria debe lanzar error si la consulta de DIs falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const numMemoriaChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const diErrorChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diErrorChain.then = (resolve: any) =>
        Promise.resolve({ data: null, error: new Error('Error de base de datos en DIs') }).then(resolve);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') return diErrorChain;
        if (table === 'memorias_anuales') return { select: jest.fn().mockImplementation(() => numMemoriaChain) };
        return null;
      });

      await expect(
        createMemoria({
          company_id: 1,
          tipo_memoria: 'productor',
          año: 2025,
          nombre_empresa: 'Test',
          nif_empresa: 'B11111111',
          production_center_id: 5,
        })
      ).rejects.toThrow('Error de base de datos en DIs');
    });

    it('updateMemoria debe lanzar error si update falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Update error') }),
      };
      mockSupabase.from.mockReturnValue(chain);

      await expect(updateMemoria(1, { observaciones: 'Fail' })).rejects.toThrow('Update error');
    });

    it('deleteMemoria debe eliminar la memoria o lanzar error en fallo', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const eqUserMock = jest.fn().mockResolvedValue({ error: null });
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({ eq: eqUserMock }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await deleteMemoria(10);
      expect(res).toBe(true);
      expect(chain.eq).toHaveBeenCalledWith('id', 10);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', mockUser.id);

      eqUserMock.mockResolvedValueOnce({ error: new Error('Delete error') });
      await expect(deleteMemoria(10)).rejects.toThrow('Delete error');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(getMemoriaById(1)).rejects.toThrow('No hay usuario autenticado');
      await expect(updateMemoria(1, {})).rejects.toThrow('No hay usuario autenticado');
      await expect(deleteMemoria(1)).rejects.toThrow('No hay usuario autenticado');
    });
  });

  describe('generateExcelData', () => {
    it('debe generar datos estructurados para memoria de productor', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria: Partial<MemoriaAnual> = {
        id: 1,
        tipo_memoria: 'productor',
        documentos_identificacion_ids: [10],
      };

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
      };

      const diChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 10,
              codigo_ler: '20 01 01',
              descripcion_residuo: 'Papel',
              peso_destino_kg: 1000,
              gestor_cif: 'B12345678',
              gestor_razon_social: 'EcoGestor S.A.',
              numero_documento: 'DI-01',
              operacion_tratamiento: 'R1301',
            },
            {
              id: 11,
              codigo_ler: undefined,
              descripcion_residuo: undefined,
              peso_destino_kg: 0,
              peso_origen_kg: 0,
              cantidad: 0,
              gestor_cif: undefined,
              gestor_razon_social: undefined,
              gestor_direccion: undefined,
              operacion_tratamiento: undefined,
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        return null;
      });

      const data = await generateExcelData(1);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].codigo_ler).toBe('20 01 01');
      expect(data[0].razon_social_destino).toBe('EcoGestor S.A.');
    });

    it('debe generar datos estructurados para memoria de gestor (entradas y salidas)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria: Partial<MemoriaAnual> = {
        id: 2,
        tipo_memoria: 'gestor',
        documentos_identificacion_ids: [20],
      };

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
      };

      const diChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 20,
              codigo_ler: '15 01 02',
              descripcion_residuo: 'Plástico',
              peso_destino_kg: 2000,
              productor_cif: 'A88888888',
              productor_razon_social: 'Productor Origen S.L.',
              operacion_tratamiento: 'R0301',
            },
            {
              id: 21,
              codigo_ler: undefined,
              descripcion_residuo: undefined,
              peso_destino_kg: 0,
              peso_origen_kg: 0,
              cantidad: 0,
              productor_cif: undefined,
              productor_razon_social: undefined,
              productor_direccion: undefined,
              operacion_tratamiento: undefined,
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        return null;
      });

      const data = await generateExcelData(2);
      expect(data.entradas).toHaveLength(2);
      expect(data.entradas[0].nif_origen).toBe('A88888888');
      expect(data.salidas).toEqual([]);
    });

    it('debe soportar tipo_memoria gestor_raee en generateExcelData', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria: Partial<MemoriaAnual> = {
        id: 25,
        tipo_memoria: 'gestor_raee',
        documentos_identificacion_ids: [20],
      };

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
      };

      const diChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 20,
              codigo_ler: '16 02 14',
              descripcion_residuo: 'RAEE',
              peso_destino_kg: 1500,
              productor_cif: 'A88888888',
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        return null;
      });

      const data = await generateExcelData(25);
      expect(data.entradas).toHaveLength(1);
      expect(data.entradas[0].codigo_ler).toBe('16 02 14');
    });

    it('debe lanzar error si el tipo de memoria no es soportado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria: any = {
        id: 4,
        tipo_memoria: 'tipo_inexistente',
        documentos_identificacion_ids: [40],
      };

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
      };

      const diChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [{ id: 40 }], error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        return null;
      });

      await expect(generateExcelData(4)).rejects.toThrow('Tipo de memoria no soportado');
    });

    it('debe generar datos para negociante/transportista/agente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria: Partial<MemoriaAnual> = {
        id: 3,
        tipo_memoria: 'negociante',
        documentos_identificacion_ids: [30],
      };

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
      };

      const diChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              id: 30,
              codigo_ler: '17 04 05',
              peso_destino_kg: 3000,
              productor_cif: 'A11111111',
              gestor_cif: 'B22222222',
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        return null;
      });

      const data = await generateExcelData(3);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].codigo_ler).toBe('17 04 05');
      expect(data[0].nif_origen).toBe('A11111111');
      expect(data[0].nif_destino).toBe('B22222222');
    });

    it('generateExcelData debe lanzar error si la consulta de documentos falla o retornar null si data es null', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria: Partial<MemoriaAnual> = {
        id: 10,
        tipo_memoria: 'productor',
        documentos_identificacion_ids: [10],
      };

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
      };

      const diErrorChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: null, error: new Error('Error al cargar DIs') }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diErrorChain;
        return null;
      });

      await expect(generateExcelData(10)).rejects.toThrow('Error al cargar DIs');

      diErrorChain.in.mockResolvedValueOnce({ data: null, error: null });
      const resNull = await generateExcelData(10);
      expect(resNull).toBeNull();
    });

    it('debe fallar si la memoria no existe', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      };
      mockSupabase.from.mockReturnValue(memChain);

      await expect(generateExcelData(999)).rejects.toThrow('Memoria no encontrada');
    });
  });

  describe('getStats', () => {
    it('debe calcular estadísticas agregadas por estado y tipo', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockMemorias = [
        { id: 1, estado: 'borrador', tipo_memoria: 'productor', total_toneladas: 10 },
        { id: 2, estado: 'presentada', tipo_memoria: 'gestor', total_toneladas: 25 },
      ];

      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.then = (resolve: any) => Promise.resolve({ data: mockMemorias, error: null }).then(resolve);
      mockSupabase.from.mockReturnValue(chain);

      const stats = await getStats(2025);

      expect(stats.total).toBe(2);
      expect(stats.total_toneladas).toBe(35);
      expect(stats.por_estado.borrador).toBe(1);
      expect(stats.por_estado.presentada).toBe(1);
      expect(stats.por_tipo.productor).toBe(1);
      expect(stats.por_tipo.gestor).toBe(1);
    });

    it('getStats debe manejar error de consulta o retornar ceros si memorias es null', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const chainError: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chainError.then = (resolve: any) => Promise.resolve({ data: null, error: new Error('Stats error') }).then(resolve);
      mockSupabase.from.mockReturnValue(chainError);

      await expect(getStats(2025)).rejects.toThrow('Stats error');

      const chainNull: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chainNull.then = (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve);
      mockSupabase.from.mockReturnValue(chainNull);

      const nullStats = await getStats(2025);
      expect(nullStats.total).toBe(0);
      expect(nullStats.total_toneladas).toBe(0);
    });

    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(getStats()).rejects.toThrow('No hay usuario autenticado');
    });
  });

  describe('Exportaciones Excel XML y CSV', () => {
    const mockMemoria: MemoriaAnual = {
      id: 1,
      numero_memoria: 'MA-2025-PROD-001',
      año: 2025,
      tipo_memoria: 'productor',
      nombre_empresa: 'Empresa Demo',
    } as any;

    const mockExcelDataProductor = [
      {
        denominacion_proceso: 'Fabricación',
        codigo_ler: '20 01 01',
        descripcion_residuo: 'Papel "limpio"',
        cantidad_toneladas: 5.5,
        nif_destino: 'B99887766',
        razon_social_destino: 'Recicla & Co',
        nima_destino: 'NIMA-01',
        codigo_operacion_rd: 'R13',
        codigo_di: 'DI-100',
      },
    ];

    it('exportMemoriaToExcelXML debe generar y descargar XML de productor', () => {
      expect(() => exportMemoriaToExcelXML(mockMemoria, mockExcelDataProductor)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('exportMemoriaToExcelXML debe generar y descargar XML de gestor', () => {
      const mockGestorMemoria = { ...mockMemoria, tipo_memoria: 'gestor' } as any;
      const gestorData = {
        entradas: [
          {
            codigo_ler: '15 01 02',
            descripcion_residuo: 'Plástico',
            cantidad_toneladas: 10,
            nif_origen: 'A11223344',
            razon_social_origen: 'Productor S.A.',
            codigo_operacion_rd: 'R03',
          },
        ],
        salidas: [],
      };

      expect(() => exportMemoriaToExcelXML(mockGestorMemoria, gestorData)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('exportMemoriaToExcelXML debe generar y descargar XML de negociante/agente', () => {
      const mockNegMemoria = { ...mockMemoria, tipo_memoria: 'negociante' } as any;
      const genericData = [
        {
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro',
          cantidad_toneladas: 8,
          nif_origen: 'A11111111',
          razon_social_origen: 'Chatarras',
          codigo_di: 'DI-88',
        },
      ];

      expect(() => exportMemoriaToExcelXML(mockNegMemoria, genericData)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('exportMemoriaToCSV debe generar y descargar CSV de productor y gestor', () => {
      expect(() => exportMemoriaToCSV(mockMemoria, mockExcelDataProductor)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');

      const mockGestorMemoria = { ...mockMemoria, tipo_memoria: 'gestor' } as any;
      const gestorData = {
        entradas: [
          {
            codigo_ler: '15 01 02',
            descripcion_residuo: 'Plástico',
            cantidad_toneladas: 10,
            nif_origen: 'A11223344',
            razon_social_origen: 'Productor S.A.',
            codigo_operacion_rd: 'R03',
          },
        ],
      };
      expect(() => exportMemoriaToCSV(mockGestorMemoria, gestorData)).not.toThrow();

      const mockNegMemoria = { ...mockMemoria, tipo_memoria: 'negociante' } as any;
      const negData = [
        {
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro',
          cantidad_toneladas: 8,
          nif_origen: 'A11111111',
          razon_social_origen: 'Chatarras',
          codigo_di: 'DI-88',
        },
      ];
      expect(() => exportMemoriaToCSV(mockNegMemoria, negData)).not.toThrow();
    });
  });
});
