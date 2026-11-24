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
  recalculateDraftMemoria,
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
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
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

    it('debe convertir a toneladas cuando la unidad es litros o unidades', () => {
      expect(getEffectiveWeightTonnes({ cantidad: 500, unidad: 'litros' } as IdentificationDocument)).toBe(0.5);
      expect(getEffectiveWeightTonnes({ cantidad: 250, unidad: 'unidades' } as IdentificationDocument)).toBe(0.25);
    });

    it('debe descontar cantidad_rechazada_kg en rechazo parcial (A7-04: 600 kg recibidos - 20 kg rechazados = 0.58 t) y retornar 0 en rechazo total', () => {
      const partialDoc = {
        peso_destino_kg: 600,
        peso_origen_kg: 600,
        estado_traslado: 'rechazado_parcial',
        cantidad_rechazada_kg: 20,
      } as IdentificationDocument;
      expect(getEffectiveWeightTonnes(partialDoc)).toBe(0.58);

      const totalRejectedDoc = {
        peso_destino_kg: 600,
        estado_traslado: 'rechazado_total',
      } as IdentificationDocument;
      expect(getEffectiveWeightTonnes(totalRejectedDoc)).toBe(0);
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

      const opsChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [
            {
              id: 50,
              numero_operacion: 'OP-2025-000050',
              fecha_operacion: '2025-06-10',
              estado: 'completada',
              codigo_ler: '15 01 01',
              descripcion_residuo: 'Cartón comercializado',
              peligrosidad: 'no-peligroso',
              cantidad_real_t: 2.5,
              origen_nombre_personalizado: 'Productor Tercero',
              destino_nombre_personalizado: 'Gestor Tercero',
              created_at: '2025-06-10T00:00:00Z',
              updated_at: '2025-06-10T00:00:00Z',
            },
            {
              id: 51,
              estado: 'borrador',
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') return diChain;
        if (table === 'commercial_operations') return opsChain;
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

  describe('recalculateDraftMemoria (A04-07)', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(recalculateDraftMemoria(1)).rejects.toThrow('No hay usuario autenticado');
    });

    it('debe fallar si la memoria no existe', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      };
      mockSupabase.from.mockReturnValue(chain);

      await expect(recalculateDraftMemoria(999)).rejects.toThrow('Memoria no encontrada');
    });

    it('debe fallar si la memoria no está en estado borrador', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria = {
        id: 1,
        numero_memoria: 'MA-2025-PROD-001',
        estado: 'completada',
      };
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      await expect(recalculateDraftMemoria(1)).rejects.toThrow(
        'Solo se pueden recalcular memorias anuales en estado borrador.'
      );
    });

    it('debe recalcular movimientos, toneladas y LER desde DIs vigentes y actualizar la memoria', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockMemoria = {
        id: 10,
        company_id: 1,
        production_center_id: 2,
        año: 2026,
        numero_memoria: 'MA-2026-PROD-001',
        estado: 'borrador',
        total_movimientos: 1,
        total_toneladas: 1.5,
        documentos_identificacion_ids: [100],
      };

      const updatedDIs = [
        {
          id: 100,
          codigo_ler: '15 01 01',
          descripcion_residuo: 'Envases de papel y cartón',
          peso_destino_kg: 1500,
          estado_traslado: 'tratado',
        },
        {
          id: 101,
          codigo_ler: '15 01 02',
          descripcion_residuo: 'Envases de plástico',
          peso_destino_kg: 2500,
          estado_traslado: 'aceptado',
        },
      ];

      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) => Promise.resolve({ data: updatedDIs, error: null }).then(resolve);

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...mockMemoria,
            total_movimientos: 2,
            total_toneladas: 4.0,
            documentos_identificacion_ids: [100, 101],
          },
          error: null,
        }),
      });

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
        update: updateMock,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') return diChain;
        if (table === 'memorias_anuales') return memChain;
        return null;
      });

      const result = await recalculateDraftMemoria(10);

      expect(result.total_movimientos).toBe(2);
      expect(result.total_toneladas).toBe(4.0);
      expect(result.documentos_identificacion_ids).toEqual([100, 101]);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          total_movimientos: 2,
          total_toneladas: 4.0,
          documentos_identificacion_ids: [100, 101],
          resumen_ler: expect.arrayContaining([
            expect.objectContaining({ codigo_ler: '15 01 01', cantidad_total: 1.5 }),
            expect.objectContaining({ codigo_ler: '15 01 02', cantidad_total: 2.5 }),
          ]),
        })
      );
    });

    it('debe propagar error si la actualización falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockMemoria = {
        id: 10,
        company_id: 1,
        production_center_id: 2,
        año: 2026,
        numero_memoria: 'MA-2026-PROD-001',
        estado: 'borrador',
      };

      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('DB update error') }),
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') return diChain;
        if (table === 'memorias_anuales') return memChain;
        return null;
      });

      await expect(recalculateDraftMemoria(10)).rejects.toThrow('DB update error');
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

    it('debe incluir salidas del gestor desde DIs rechazados y registros salida_traslado del Archivo Cronológico', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria: Partial<MemoriaAnual> = {
        id: 26,
        user_id: mockUser.id,
        año: 2025,
        tipo_memoria: 'gestor',
        documentos_identificacion_ids: [20, 21],
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
              estado: 'completado',
              codigo_ler: '15 01 02',
              descripcion_residuo: 'Plástico',
              peso_destino_kg: 2000,
              productor_cif: 'A88888888',
              productor_razon_social: 'Productor Origen S.L.',
              operacion_tratamiento: 'R0301',
              numero_documento: 'DI-IN-20',
            },
            {
              id: 21,
              estado: 'completado',
              estado_traslado: 'rechazado_total',
              resultado_recepcion: 'rechazado_total',
              codigo_ler: '17 04 05',
              descripcion_residuo: 'Chatarra rechazada',
              peso_origen_kg: 1500,
              gestor_cif: 'B77777777',
              gestor_razon_social: 'Gestor Final S.L.',
              gestor_direccion: 'Polígono Gestor 1',
              gestor_provincia: 'Cádiz',
              gestor_municipio: 'Puerto Real',
              gestor_nima: '1100000001',
              operacion_tratamiento: 'R0401',
              numero_documento: 'DI-REJ-21',
            },
            {
              id: 22,
              estado: 'completado',
              estado_traslado: 'rechazado_parcial',
              cantidad_rechazada_kg: 500,
              peso_destino_kg: 1500,
              codigo_ler: '15 01 10*',
              descripcion_residuo: 'Envases parcialmente rechazados',
              productor_cif: 'A11111111',
              productor_razon_social: 'Productor Dev',
              productor_direccion: 'Calle Origen 2',
              productor_provincia: 'Sevilla',
              productor_municipio: 'Sevilla',
              productor_nima: '4100000001',
              operacion_tratamiento: 'R1301',
              numero_documento: 'DI-REJ-22',
            },
            {
              id: 23,
              estado: 'completado',
              resultado_recepcion: 'rechazado_parcial',
              codigo_ler: undefined,
              descripcion_residuo: undefined,
              peso_destino_kg: 0,
              peso_origen_kg: 0,
              cantidad: 0,
              productor_cif: undefined,
              gestor_cif: undefined,
              productor_razon_social: undefined,
              gestor_razon_social: undefined,
              productor_direccion: undefined,
              gestor_direccion: undefined,
              operacion_tratamiento: undefined,
              numero_documento: 'DI-REJ-23',
            },
          ],
          error: null,
        }),
      };

      const regChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [
            {
              numero_asiento: 'AS-2025-000010',
              numero_documento_referencia: 'DI-SAL-99',
              codigo_ler: '15 01 01',
              descripcion_residuo: 'Cartón embalado',
              cantidad_kg: 3250,
              destino_nif: 'B99999999',
              destino_razon_social: 'Valorizadora Sur S.A.',
              destino_nima: '4100000009',
              destino_direccion: 'Polígono Sur 5',
              destino_municipio: 'Sevilla',
              destino_provincia: 'Sevilla',
              operacion_rd: 'R0301',
            },
            {
              numero_asiento: 'AS-2025-000011',
              codigo_ler: undefined,
              descripcion_residuo: undefined,
              cantidad_kg: undefined,
              destino_nif: undefined,
              destino_razon_social: undefined,
              destino_direccion: undefined,
              operacion_rd: undefined,
            },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        if (table === 'chronological_registry') return regChain;
        return null;
      });

      const data = await generateExcelData(26);
      expect(data.entradas).toHaveLength(4);
      expect(data.salidas).toHaveLength(5);
      expect(data.salidas[0]).toEqual(
        expect.objectContaining({
          codigo_ler: '17 04 05',
          cantidad_toneladas: 1.5,
          nif_destino: 'B77777777',
          codigo_operacion_rd: 'R0401',
        })
      );
      expect(data.salidas[1]).toEqual(
        expect.objectContaining({
          codigo_ler: '15 01 10*',
          cantidad_toneladas: 0.5,
          nif_destino: 'A11111111',
          codigo_di: 'DI-REJ-22',
        })
      );
      expect(data.salidas[3]).toEqual(
        expect.objectContaining({
          codigo_ler: '15 01 01',
          cantidad_toneladas: 3.25,
          nif_destino: 'B99999999',
          codigo_di: 'DI-SAL-99',
          codigo_operacion_rd: 'R0301',
        })
      );
      expect(data.salidas[4]).toEqual(
        expect.objectContaining({
          codigo_ler: '',
          cantidad_toneladas: 0,
          codigo_di: 'AS-2025-000011',
        })
      );

      // Fallback defensivo si chronological_registry lanza excepción o memoria.año falta
      memChain.single.mockResolvedValueOnce({
        data: { ...mockMemoria, año: undefined },
        error: null,
      });
      regChain.lte.mockRejectedValueOnce(new Error('Table unavailable'));
      const dataFallback = await generateExcelData(26);
      expect(dataFallback.salidas).toHaveLength(3);
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

    it('debe reconciliar DIs cuando documentos_identificacion_ids está vacío (RES6-I04)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockMemoria: Partial<MemoriaAnual> = {
        id: 11,
        user_id: mockUser.id,
        company_id: 1,
        año: 2026,
        production_center_id: 10,
        tipo_memoria: 'productor',
        documentos_identificacion_ids: [],
      };

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMemoria, error: null }),
      };

      const mockDIs = [
        {
          id: 55,
          codigo_ler: '15 01 01',
          descripcion_residuo: 'Envases de papel y cartón',
          peso_origen_kg: 2500,
          peso_destino_kg: 2500,
          unidad: 'kg',
          gestor_cif: 'B99999999',
          gestor_razon_social: 'Reciclajes Norte SL',
          numero_documento: 'DI-2026-00055',
          company_id: 1,
          production_center_id: 10,
          fecha_documento: '2026-04-15',
          estado: 'completado',
        },
      ];

      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) => resolve({ data: mockDIs, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        return null;
      });

      const result = await generateExcelData(11);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].codigo_ler).toBe('15 01 01');
      expect(result[0].cantidad_toneladas).toBe(2.5);
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
        salidas: [
          {
            codigo_ler: '15 01 01',
            descripcion_residuo: 'Cartón "prensado"',
            cantidad_toneladas: 4.5,
            nif_destino: 'B22334455',
            razon_social_destino: 'Recicladora Final S.A.',
            nima_destino: '4100000002',
            codigo_operacion_rd: 'R0301',
            codigo_di: 'DI-OUT-1',
          },
          {
            codigo_ler: '15 01 02',
            descripcion_residuo: undefined,
            cantidad_toneladas: 1,
            nif_destino: 'B00000000',
            razon_social_destino: undefined,
            nima_destino: undefined,
            codigo_operacion_rd: 'R13',
            codigo_di: undefined,
          },
        ],
      };

      expect(() => exportMemoriaToExcelXML(mockGestorMemoria, gestorData)).not.toThrow();
      expect(() => exportMemoriaToExcelXML(mockGestorMemoria, { entradas: gestorData.entradas })).not.toThrow();
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
        salidas: [
          {
            codigo_ler: '17 04 05',
            descripcion_residuo: 'Acero',
            cantidad_toneladas: 6.2,
            nif_destino: 'B55667788',
            razon_social_destino: 'Fundición Sur',
            nima_destino: '4100000008',
            codigo_operacion_rd: 'R04',
            codigo_di: 'DI-OUT-2',
          },
          {
            codigo_ler: '17 04 07',
            descripcion_residuo: undefined,
            cantidad_toneladas: 1,
            nif_destino: 'B00000001',
            razon_social_destino: undefined,
            nima_destino: undefined,
            codigo_operacion_rd: 'R04',
            codigo_di: undefined,
          },
        ],
      };
      expect(() => exportMemoriaToCSV(mockGestorMemoria, gestorData)).not.toThrow();
      expect(() => exportMemoriaToCSV(mockGestorMemoria, { entradas: gestorData.entradas })).not.toThrow();

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

    it('recalculateDraftMemoria debe agregar DIs de gestor y asientos del Archivo Cronológico sin duplicar movimientos (A04-07)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockGestorMemoria = {
        id: 26,
        user_id: mockUser.id,
        company_id: 10,
        production_center_id: 5,
        año: 2026,
        tipo_memoria: 'gestor',
        nif_empresa: 'B12345678',
        numero_memoria: 'MA-2026-GEST-001',
        estado: 'borrador',
        total_movimientos: 0,
        total_toneladas: 0,
      };

      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) =>
        Promise.resolve({
          data: [
            {
              id: 501,
              numero_documento: 'DI-501',
              codigo_ler: '17 04 05',
              descripcion_residuo: 'Hierro y acero',
              peso_destino_kg: 1000,
              estado: 'completado',
              estado_traslado: 'tratado',
            },
          ],
          error: null,
        }).then(resolve);

      const chronoChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [
            // 1. Duplicado por identification_document_id (debe ignorarse)
            {
              id: 1,
              identification_document_id: 501,
              tipo_operacion: 'entrada_recepcion',
              codigo_ler: '17 04 05',
              cantidad_kg: 1000,
            },
            // 2. Duplicado por numero_documento_referencia (debe ignorarse)
            {
              id: 2,
              numero_documento_referencia: 'DI-501',
              tipo_operacion: 'entrada_recepcion',
              codigo_ler: '17 04 05',
              cantidad_kg: 1000,
            },
            // 3. Otra empresa distinta (debe ignorarse)
            {
              id: 3,
              company_id: 99,
              tipo_operacion: 'entrada_recepcion',
              codigo_ler: '17 04 05',
              cantidad_kg: 500,
            },
            // 4. Operación produccion_interna (debe ignorarse en recepción/salida gestor)
            {
              id: 4,
              tipo_operacion: 'produccion_interna',
              codigo_ler: '17 04 05',
              cantidad_kg: 500,
            },
            // 5. Asiento de recepción válido no duplicado (debe sumarse: 2500 kg = 2.5 t)
            {
              id: 5,
              company_id: 10,
              numero_asiento: 'AS-2026-000005',
              tipo_operacion: 'entrada_recepcion',
              codigo_ler: '17 04 05',
              descripcion_residuo: 'Hierro y acero',
              cantidad_kg: 2500,
              fecha: '2026-11-16',
            },
          ],
          error: null,
        }),
      };

      const updateSingleMock = jest.fn().mockResolvedValue({
        data: {
          ...mockGestorMemoria,
          total_movimientos: 2,
          total_toneladas: 3.5,
          documentos_identificacion_ids: [501],
        },
        error: null,
      });

      const memChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockGestorMemoria, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: updateSingleMock,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        if (table === 'chronological_registry') return chronoChain;
        return null;
      });

      const res = await recalculateDraftMemoria(26);
      expect(diChain.or).toHaveBeenCalledWith(
        'company_id.eq.10,gestor_company_id.eq.10,gestor_cif.ilike.B12345678'
      );
      expect(res.total_movimientos).toBe(2);
      expect(res.total_toneladas).toBe(3.5);
      expect(res.documentos_identificacion_ids).toEqual([501]);
    });

    it('debe incluir en memoria de productor DIs aceptados emitidos desde sede (production_center_id null) sin filtrarlos en SQL', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const diEqCalls: Array<[string, unknown]> = [];
      const diChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((col: string, val: unknown) => {
          diEqCalls.push([col, val]);
          return diChain;
        }),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      diChain.then = (resolve: any) =>
        Promise.resolve({
          data: [
            {
              id: 701,
              company_id: 10,
              production_center_id: null, // Emitido desde sede
              numero_documento: 'DI-2026-0701',
              fecha_documento: '2026-11-20',
              codigo_ler: '17 04 05',
              descripcion_residuo: 'Hierro y acero',
              peso_destino_kg: 2,
              estado: 'pendiente',
              estado_traslado: 'aceptado',
            },
            {
              id: 702,
              company_id: 10,
              production_center_id: 99, // Otro centro distinto: debe excluirse
              numero_documento: 'DI-2026-0702',
              fecha_documento: '2026-11-20',
              codigo_ler: '17 04 05',
              descripcion_residuo: 'Hierro y acero',
              peso_destino_kg: 500,
              estado: 'completado',
              estado_traslado: 'tratado',
            },
          ],
          error: null,
        }).then(resolve);

      const memChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 30,
            user_id: mockUser.id,
            company_id: 10,
            production_center_id: 5,
            tipo_memoria: 'productor',
            año: 2026,
            nif_empresa: 'B12345678',
            estado: 'borrador',
          },
          error: null,
        }),
        update: jest.fn().mockImplementation((payload: any) => ({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 30, ...payload },
            error: null,
          }),
        })),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'memorias_anuales') return memChain;
        if (table === 'identification_documents') return diChain;
        return null;
      });

      const res = await recalculateDraftMemoria(30);
      expect(diEqCalls.some(([col]) => col === 'production_center_id')).toBe(false);
      expect(res.total_movimientos).toBe(1);
      expect(res.documentos_identificacion_ids).toEqual([701]);
      expect(res.total_toneladas).toBe(0.002);
    });
  });
});
