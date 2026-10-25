const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Setup DOM mocks for export functions in node environment
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
  getChronologicalEntries,
  getChronologicalStats,
  createChronologicalEntry,
  deleteChronologicalEntry,
  syncEntryFromDI,
  syncAllClosedDIs,
  exportChronologicalToCSV,
  exportChronologicalToExcelXML,
} from '../chronologicalRegistryService';
import type { IdentificationDocument } from '@/types/wasteManagement';

describe('chronologicalRegistryService - Archivo Cronológico (Art. 64 Ley 7/2022)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUser = { id: 'user-chrono-123' };

  describe('getChronologicalEntries', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(getChronologicalEntries()).rejects.toThrow('No hay usuario autenticado');
    });

    it('debe consultar con todos los filtros y aplicar búsqueda textual', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockEntries = [
        {
          id: 1,
          numero_asiento: 'AS-2025-000001',
          codigo_ler: '15 01 10*',
          descripcion_residuo: 'Envases contaminados',
          peligrosidad: 'peligroso',
          tipo_operacion: 'salida_traslado',
          cantidad_kg: 500,
          origen_razon_social: 'Productor Demo S.L.',
          destino_razon_social: 'Gestor Final S.A.',
          numero_documento_referencia: 'DI-2025-001',
        },
        {
          id: 2,
          numero_asiento: 'AS-2025-000002',
          codigo_ler: '20 03 01',
          descripcion_residuo: 'Mezcla de residuos municipales',
          peligrosidad: 'no-peligroso',
          tipo_operacion: 'produccion_interna',
          cantidad_kg: 1200,
          origen_razon_social: 'Centro Propio',
          destino_razon_social: '',
          numero_documento_referencia: '',
        },
      ];

      const queryChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
      };
      queryChain.then = (resolve: any) => Promise.resolve({ data: mockEntries, error: null }).then(resolve);

      mockSupabase.from.mockReturnValue(queryChain);

      const result = await getChronologicalEntries({
        año: 2025,
        production_center_id: 10,
        tipo_operacion: 'salida_traslado',
        peligrosidad: 'peligroso',
        codigo_ler: '15 01',
        search: 'Envases',
      });

      expect(queryChain.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(queryChain.gte).toHaveBeenCalledWith('fecha', '2025-01-01');
      expect(queryChain.lte).toHaveBeenCalledWith('fecha', '2025-12-31');
      expect(queryChain.eq).toHaveBeenCalledWith('production_center_id', 10);
      expect(queryChain.eq).toHaveBeenCalledWith('tipo_operacion', 'salida_traslado');
      expect(queryChain.eq).toHaveBeenCalledWith('peligrosidad', 'peligroso');
      expect(queryChain.ilike).toHaveBeenCalledWith('codigo_ler', '%15 01%');
      expect(result).toHaveLength(1);
      expect(result[0].numero_asiento).toBe('AS-2025-000001');
    });

    it('debe filtrar en memoria por destino o referencia', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockEntries = [
        {
          id: 1,
          numero_asiento: 'AS-2025-000001',
          codigo_ler: '15 01 10*',
          descripcion_residuo: 'Envases',
          origen_razon_social: '',
          destino_razon_social: 'EcoRecicla S.L.',
          numero_documento_referencia: 'ALB-9988',
        },
      ];

      const queryChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      queryChain.then = (resolve: any) => Promise.resolve({ data: mockEntries, error: null }).then(resolve);
      mockSupabase.from.mockReturnValue(queryChain);

      const byDestino = await getChronologicalEntries({ search: 'EcoRecicla' });
      expect(byDestino).toHaveLength(1);

      const byRef = await getChronologicalEntries({ search: 'ALB-9988' });
      expect(byRef).toHaveLength(1);

      const noMatch = await getChronologicalEntries({ search: 'Inexistente' });
      expect(noMatch).toHaveLength(0);
    });

    it('debe propagar el error si Supabase falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const queryChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      queryChain.then = (resolve: any) => Promise.resolve({ data: null, error: new Error('DB query error') }).then(resolve);
      mockSupabase.from.mockReturnValue(queryChain);

      await expect(getChronologicalEntries()).rejects.toThrow('DB query error');
    });
  });

  describe('getChronologicalStats', () => {
    it('debe calcular métricas agregadas por peligrosidad, operación y agrupar por LER', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockEntries = [
        {
          id: 1,
          numero_asiento: 'AS-2025-001',
          codigo_ler: '15 01 10*',
          descripcion_residuo: 'Envases contaminados',
          peligrosidad: 'peligroso',
          tipo_operacion: 'salida_traslado',
          cantidad_kg: 500,
        },
        {
          id: 2,
          numero_asiento: 'AS-2025-002',
          codigo_ler: '15 01 10*',
          descripcion_residuo: 'Envases contaminados',
          peligrosidad: 'peligroso',
          tipo_operacion: 'salida_traslado',
          cantidad_kg: 250,
        },
        {
          id: 3,
          numero_asiento: 'AS-2025-003',
          codigo_ler: '20 01 01',
          descripcion_residuo: 'Papel y cartón',
          peligrosidad: 'no-peligroso',
          tipo_operacion: 'produccion_interna',
          cantidad_kg: 1000,
        },
      ];

      const queryChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      queryChain.then = (resolve: any) => Promise.resolve({ data: mockEntries, error: null }).then(resolve);
      mockSupabase.from.mockReturnValue(queryChain);

      const stats = await getChronologicalStats(2025, 10);

      expect(stats.total_asientos).toBe(3);
      expect(stats.total_kg).toBe(1750);
      expect(stats.total_t).toBe(1.75);
      expect(stats.kg_peligrosos).toBe(750);
      expect(stats.kg_no_peligrosos).toBe(1000);
      expect(stats.por_operacion.salida_traslado.count).toBe(2);
      expect(stats.por_operacion.salida_traslado.kg).toBe(750);
      expect(stats.por_operacion.produccion_interna.count).toBe(1);
      expect(stats.por_operacion.produccion_interna.kg).toBe(1000);

      expect(stats.resumen_ler).toHaveLength(2);
      expect(stats.resumen_ler[0].codigo_ler).toBe('20 01 01'); // 1000 kg > 750 kg
      expect(stats.resumen_ler[1].codigo_ler).toBe('15 01 10*');
      expect(stats.resumen_ler[1].movimientos).toBe(2);
    });
  });

  describe('createChronologicalEntry', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        createChronologicalEntry({
          fecha: '2025-05-10',
          tipo_operacion: 'produccion_interna',
          codigo_ler: '20 01 01',
          descripcion_residuo: 'Papel',
          peligrosidad: 'no-peligroso',
          cantidad_kg: 100,
        } as any)
      ).rejects.toThrow('No hay usuario autenticado');
    });

    it('debe generar número de asiento correlativo y detectar peligrosidad por asterisco', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      // Mock count query
      const countChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 42, error: null }),
      };

      // Mock insert query
      const insertChain: any = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 43, numero_asiento: 'AS-2025-000043', peligrosidad: 'peligroso' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'chronological_registry') {
          return {
            ...countChain,
            ...insertChain,
          };
        }
        return null;
      });

      const result = await createChronologicalEntry({
        fecha: '2025-06-15',
        tipo_operacion: 'salida_traslado',
        codigo_ler: '13 02 05*',
        descripcion_residuo: 'Aceites minerales',
        peligrosidad: 'no-peligroso', // Debe ser sobrescrito por 'peligroso' debido al asterisco
        cantidad_kg: 200,
      } as any);

      expect(result.id).toBe(43);
      expect(insertChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          numero_asiento: 'AS-2025-000043',
          peligrosidad: 'peligroso',
          user_id: mockUser.id,
        }),
      ]);
    });

    it('debe manejar fallback de fecha actual si no se proporciona fecha válida', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const currentYear = new Date().getFullYear();

      const countChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const insertChain: any = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 1, numero_asiento: `AS-${currentYear}-000001` },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({ ...countChain, ...insertChain });

      const result = await createChronologicalEntry({
        fecha: 'fecha-invalida',
        tipo_operacion: 'produccion_interna',
        codigo_ler: '20 01 01',
        descripcion_residuo: 'Papel',
        peligrosidad: 'no-peligroso',
        cantidad_kg: 50,
      } as any);

      expect(result.numero_asiento).toBe(`AS-${currentYear}-000001`);
    });

    it('debe lanzar error si insert falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      };
      mockSupabase.from.mockReturnValue(chain);

      await expect(
        createChronologicalEntry({
          codigo_ler: '20 01 01',
          cantidad_kg: 10,
        } as any)
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('deleteChronologicalEntry', () => {
    it('debe eliminar el asiento correctamente', async () => {
      const deleteChain: any = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from.mockReturnValue(deleteChain);

      const res = await deleteChronologicalEntry(123);
      expect(res).toBe(true);
      expect(deleteChain.delete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith('id', 123);
    });

    it('debe lanzar error si la eliminación falla', async () => {
      const deleteChain: any = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete error') }),
      };
      mockSupabase.from.mockReturnValue(deleteChain);

      await expect(deleteChronologicalEntry(999)).rejects.toThrow('Delete error');
    });
  });

  describe('syncEntryFromDI & syncAllClosedDIs', () => {
    it('debe retornar null si no hay usuario autenticado al sincronizar un DI', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const res = await syncEntryFromDI({ id: 1 } as any);
      expect(res).toBeNull();
    });

    it('debe sincronizar creando un nuevo asiento cuando la empresa es gestor', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockDI: Partial<IdentificationDocument> = {
        id: 100,
        numero_documento: 'DI-2025-100',
        company_id: 10,
        peso_destino_kg: 1500,
        fecha_entrega: '2025-07-20',
        codigo_ler: '15 01 10*',
        descripcion_residuo: 'Envases tóxicos',
        gestor_cif: 'B12345678',
        productor_cif: 'A87654321',
        productor_razon_social: 'Productor S.A.',
      };

      // Mock check existing
      const existingChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Mock company lookup
      const companyChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { cif: 'B12345678', tipo_empresa: 'gestor' },
          error: null,
        }),
      };

      // Mock insert
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 500, numero_asiento: 'AS-2025-000100', tipo_operacion: 'entrada_recepcion' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return companyChain;
        if (table === 'chronological_registry') {
          return {
            ...existingChain,
            ...insertChain,
          };
        }
        return null;
      });

      const res = await syncEntryFromDI(mockDI as IdentificationDocument);

      expect(res).toBeDefined();
      expect(res?.tipo_operacion).toBe('entrada_recepcion');
      expect(insertChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          tipo_operacion: 'entrada_recepcion',
          origen_tipo: 'tercero_productor',
          destino_tipo: 'propio',
          cantidad_kg: 1500,
        }),
      ]);
    });

    it('debe actualizar el asiento existente si ya fue sincronizado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockDI: Partial<IdentificationDocument> = {
        id: 101,
        numero_documento: 'DI-2025-101',
        company_id: 20,
        peso_origen_kg: 800,
        fecha_salida: '2025-08-10',
        codigo_ler: '20 01 01',
        descripcion_residuo: 'Papel',
        productor_cif: 'B99999999',
      };

      const existingChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 777 }, error: null }),
      };

      const companyChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { cif: 'B99999999', tipo_empresa: 'productor' },
          error: null,
        }),
      };

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 777, tipo_operacion: 'salida_traslado' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return companyChain;
        if (table === 'chronological_registry') {
          return {
            ...existingChain,
            ...updateChain,
          };
        }
        return null;
      });

      const res = await syncEntryFromDI(mockDI as IdentificationDocument);

      expect(res).toBeDefined();
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_operacion: 'salida_traslado',
          origen_tipo: 'propio',
          destino_tipo: 'tercero_gestor',
        })
      );
      expect(updateChain.eq).toHaveBeenCalledWith('id', 777);
    });

    it('syncAllClosedDIs debe fallar si no hay usuario', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(syncAllClosedDIs()).rejects.toThrow('No hay usuario autenticado');
    });

    it('syncAllClosedDIs debe procesar únicamente DIs en estados válidos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockDIs = [
        { id: 1, estado: 'completado', codigo_ler: '20 01 01', cantidad: 1 },
        { id: 2, estado: 'borrador', estado_traslado: 'pendiente', codigo_ler: '20 01 02' },
        { id: 3, estado: 'en_transito', estado_traslado: 'entregado', codigo_ler: '15 01 01', cantidad: 2 },
      ];

      const diChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockDIs, error: null }),
      };

      const existingChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 10 }, error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') return diChain;
        if (table === 'chronological_registry') return { ...existingChain, ...insertChain };
        return null;
      });

      const { totalSincronizados } = await syncAllClosedDIs();

      expect(totalSincronizados).toBe(2); // DIs 1 y 3 (completado y entregado)
    });

    it('syncAllClosedDIs debe lanzar error si la consulta a identification_documents falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const diChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Query DIs failed') }),
      };
      mockSupabase.from.mockReturnValue(diChain);

      await expect(syncAllClosedDIs()).rejects.toThrow('Query DIs failed');
    });

    it('syncEntryFromDI debe usar peso_origen_kg o cantidad * 1000 y fecha_salida o fecha_documento si faltan otros campos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockDI1: Partial<IdentificationDocument> = {
        id: 201,
        numero_documento: 'DI-201',
        peso_destino_kg: 0,
        peso_origen_kg: 350,
        fecha_entrega: undefined,
        fecha_salida: '2025-03-01',
        codigo_ler: '20 01 01',
      };

      const existingChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Insert sync error'),
        }),
      };

      mockSupabase.from.mockReturnValue({ ...existingChain, ...insertChain });

      // Debe capturar el error internamente y loguear console.error sin romper la ejecución
      const res = await syncEntryFromDI(mockDI1 as any);
      expect(res).toBeNull();
    });

    it('syncEntryFromDI debe manejar error al actualizar si update falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockDI2: Partial<IdentificationDocument> = {
        id: 202,
        numero_documento: 'DI-202',
        cantidad: 0.5,
        fecha_entrega: undefined,
        fecha_salida: undefined,
        fecha_documento: '2025-04-10',
        codigo_ler: '20 01 01',
        company_id: 15,
      };

      const existingChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 888 }, error: null }),
      };

      const companyChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Update sync error'),
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return companyChain;
        if (table === 'chronological_registry') return { ...existingChain, ...updateChain };
        return null;
      });

      const res = await syncEntryFromDI(mockDI2 as any);
      expect(res).toBeNull();
    });
  });

  describe('Exportaciones CSV y Excel XML', () => {
    const mockEntries: any[] = [
      {
        numero_asiento: 'AS-2025-001',
        fecha: '2025-09-01',
        tipo_operacion: 'salida_traslado',
        codigo_ler: '15 01 10*',
        descripcion_residuo: 'Envases "peligrosos"',
        peligrosidad: 'peligroso',
        estado_fisico: 'sólido',
        cantidad_kg: 500,
        envase_tipo: 'GRG',
        envase_unidades: 1,
        origen_nif: 'A12345678',
        origen_razon_social: 'Origen & Co',
        origen_nima: 'NIMA-01',
        transportista_nif: 'B12345678',
        transportista_razon_social: 'TransLog',
        transportista_matricula: '1234-BBB',
        destino_nif: 'C12345678',
        destino_razon_social: 'Destino Final',
        destino_nima: 'NIMA-02',
        destino_autorizacion: 'AUT-01',
        operacion_rd: 'R13',
        numero_documento_referencia: 'DI-01',
        observaciones: 'Sin novedades',
      },
      {
        numero_asiento: 'AS-2025-002',
        fecha: '2025-09-02',
        tipo_operacion: 'produccion_interna',
        codigo_ler: '20 01 01',
        descripcion_residuo: '',
        peligrosidad: 'no-peligroso',
        estado_fisico: undefined,
        cantidad_kg: 0,
        envase_tipo: undefined,
        envase_unidades: undefined,
        origen_nif: undefined,
        origen_razon_social: undefined,
        origen_nima: undefined,
        transportista_nif: undefined,
        transportista_razon_social: undefined,
        transportista_matricula: undefined,
        destino_nif: undefined,
        destino_razon_social: undefined,
        destino_nima: undefined,
        destino_autorizacion: undefined,
        operacion_rd: undefined,
        numero_documento_referencia: undefined,
        observaciones: undefined,
      },
    ];

    it('exportChronologicalToCSV debe generar y descargar archivo CSV', () => {
      expect(() => exportChronologicalToCSV(mockEntries)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('exportChronologicalToExcelXML debe generar y descargar archivo XML de Excel', () => {
      expect(() => exportChronologicalToExcelXML(mockEntries)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });
  });
});
