const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

jest.mock('../holdedService', () => ({
  holdedService: {
    createContact: jest.fn(),
    createInvoice: jest.fn(),
  },
}));

jest.mock('../auditService', () => ({
  auditService: {
    logAction: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../chronologicalRegistryService', () => ({
  syncEntryFromCommercialOperation: jest.fn().mockResolvedValue(null),
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
  commercialOperationService,
  calculateProfitability,
  formatPriceUnitLabel,
  computeDocumentFingerprint,
  parseCommercialMetaFromNotes,
  serializeCommercialMetaToNotes,
  validateOperatorMandate,
} from '../commercialOperationService';
import { holdedService } from '../holdedService';
import { auditService } from '../auditService';
import { syncEntryFromCommercialOperation } from '../chronologicalRegistryService';
import type { CommercialOperation, CommercialOperationFormData } from '@/types/wasteManagement';

describe('commercialOperationService - Operaciones Comerciales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUser = { id: 'user-comm-123' };

  describe('calculateProfitability', () => {
    it('debe calcular rentabilidad con tipo_precio por tonelada', () => {
      const res = calculateProfitability({
        cantidad_real_t: 10,
        tipo_precio_compra: 'por_tonelada',
        precio_unitario_compra: 50, // Coste compra = 500
        tipo_precio_venta: 'por_tonelada',
        precio_unitario_venta: 120, // Ingreso venta = 1200
        coste_transporte: 200,
        otros_costes: 100,
      });

      expect(res.toneladas).toBe(10);
      expect(res.coste_compra_total).toBe(500);
      expect(res.ingreso_venta_total).toBe(1200);
      expect(res.coste_transporte).toBe(200);
      expect(res.otros_costes).toBe(100);
      // Coste total = 800, Margen bruto = 400
      expect(res.margen_bruto_total).toBe(400);
      expect(res.margen_unitario_tonelada).toBe(40);
      expect(res.porcentaje_margen).toBeCloseTo(33.33, 1);
    });

    it('debe calcular rentabilidad con tipo_precio por kg', () => {
      const res = calculateProfitability({
        cantidad_estimada_t: 2, // 2000 kg
        tipo_precio_compra: 'por_kg',
        precio_unitario_compra: 0.1, // 200
        tipo_precio_venta: 'por_kg',
        precio_unitario_venta: 0.25, // 500
      });

      expect(res.toneladas).toBe(2);
      expect(res.coste_compra_total).toBe(200);
      expect(res.ingreso_venta_total).toBe(500);
      expect(res.margen_bruto_total).toBe(300);
    });

    it('debe calcular rentabilidad con lote fijo y manejar ingresos en cero', () => {
      const res = calculateProfitability({
        tipo_precio_compra: 'lote_fijo',
        precio_unitario_compra: 150,
        tipo_precio_venta: 'lote_fijo',
        precio_unitario_venta: 0,
      });

      expect(res.toneladas).toBe(0);
      expect(res.coste_compra_total).toBe(150);
      expect(res.ingreso_venta_total).toBe(0);
      expect(res.margen_bruto_total).toBe(-150);
      expect(res.porcentaje_margen).toBe(0);
    });

    it('debe escalar proporcionalmente las líneas multimaterial al actualizar cantidad_real_t sin líneas explícitas y calcular márgenes (A7-02)', () => {
      const res = calculateProfitability({
        cantidad_real_t: 4, // antes 1.5 + 0.5 = 2.0 t -> escala x2
        coste_transporte: 40,
        otros_costes: 10,
        lineas_materiales: [
          {
            id: 'L1',
            codigo_ler: '15 01 01',
            descripcion_residuo: 'Cartón',
            peligrosidad: 'no-peligroso',
            cantidad_t: 1.5,
            tipo_precio: 'por_tonelada',
            precio_unitario_compra: 40,
            precio_unitario_venta: 85,
          },
          {
            id: 'L2',
            codigo_ler: '15 01 02',
            descripcion_residuo: 'Plástico',
            peligrosidad: 'no-peligroso',
            cantidad_t: 0.5,
            tipo_precio: 'por_tonelada',
            precio_unitario_compra: 60,
            precio_unitario_venta: 110,
          },
        ],
      });

      // Con escala x2: línea 1 = 3.0 t (compra 120, venta 255), línea 2 = 1.0 t (compra 60, venta 110)
      expect(res.toneladas).toBe(4);
      expect(res.coste_compra_total).toBe(180);
      expect(res.ingreso_venta_total).toBe(365);
      expect(res.margen_bruto_total).toBe(365 - 180 - 40 - 10);
    });
  });

  describe('getAll', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(commercialOperationService.getAll()).rejects.toThrow('No hay usuario autenticado');
    });

    it('debe filtrar por año, estado, codigo_ler y realizar búsqueda en memoria', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockData: Partial<CommercialOperation>[] = [
        {
          id: 1,
          numero_operacion: 'OP-2025-000001',
          codigo_ler: '15 01 02',
          descripcion_residuo: 'Envases de plástico',
          proveedor_razon_social: 'Plastic Recycling S.L.',
          cliente_razon_social: 'Manufacturas Eco',
          origen_nombre_personalizado: '',
          destino_nombre_personalizado: '',
        },
        {
          id: 2,
          numero_operacion: 'OP-2025-000002',
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro y acero',
          proveedor_razon_social: 'Chatarras Sur',
          cliente_razon_social: 'Siderúrgica Norte',
          origen_nombre_personalizado: 'Planta Origen Personalizada',
          destino_nombre_personalizado: 'Planta Destino Personalizada',
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
      queryChain.then = (resolve: any) => Promise.resolve({ data: mockData, error: null }).then(resolve);
      mockSupabase.from.mockReturnValue(queryChain);

      const res = await commercialOperationService.getAll({
        año: 2025,
        estado: 'abierta',
        codigo_ler: '15 01',
        search: 'Plastic',
      });

      expect(queryChain.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(queryChain.gte).toHaveBeenCalledWith('fecha', '2025-01-01');
      expect(queryChain.lte).toHaveBeenCalledWith('fecha', '2025-12-31');
      expect(queryChain.eq).toHaveBeenCalledWith('estado', 'abierta');
      expect(queryChain.ilike).toHaveBeenCalledWith('codigo_ler', '%15 01%');
      expect(res).toHaveLength(1);
      expect(res[0].numero_operacion).toBe('OP-2025-000001');

      // Búsqueda por cliente
      const byCliente = await commercialOperationService.getAll({ search: 'Siderúrgica' });
      expect(byCliente).toHaveLength(1);

      // Búsqueda por origen personalizado
      const byOrigen = await commercialOperationService.getAll({ search: 'Planta Origen' });
      expect(byOrigen).toHaveLength(1);

      // Búsqueda por destino personalizado
      const byDestino = await commercialOperationService.getAll({ search: 'Planta Destino' });
      expect(byDestino).toHaveLength(1);
    });

    it('debe propagar el error si Supabase falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const queryChain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      queryChain.then = (resolve: any) => Promise.resolve({ data: null, error: new Error('DB error') }).then(resolve);
      mockSupabase.from.mockReturnValue(queryChain);

      await expect(commercialOperationService.getAll()).rejects.toThrow('DB error');
    });
  });

  describe('getById', () => {
    it('debe retornar la operación encontrada filtrando por user_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockOp = { id: 10, numero_operacion: 'OP-2025-000010' };
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOp, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await commercialOperationService.getById(10);
      expect(res).toEqual(mockOp);
      expect(chain.eq).toHaveBeenCalledWith('id', 10);
      expect(chain.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('debe retornar null si no hay usuario autenticado o si la consulta falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      expect(await commercialOperationService.getById(10)).toBeNull();

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await commercialOperationService.getById(999);
      expect(res).toBeNull();
    });
  });

  describe('create', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        commercialOperationService.create({
          codigo_ler: '15 01 01',
          descripcion_residuo: 'Papel',
        } as any)
      ).rejects.toThrow('No hay usuario autenticado');
    });

    it('debe crear la operación calculando márgenes y asignando correlativo', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const countChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 3,
          data: [{ id: 5, numero_operacion: 'OP-2025-000005' }],
          error: null,
        }),
      };

      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 6, numero_operacion: 'OP-2025-000006', peligrosidad: 'peligroso' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({ ...countChain, ...insertChain });

      const formData: CommercialOperationFormData = {
        fecha: '2025-04-15',
        codigo_ler: '15 01 10*',
        descripcion_residuo: 'Envases con sustancias peligrosas',
        peligrosidad: 'no-peligroso',
        cantidad_estimada_t: 10,
        tipo_precio_compra: 'por_tonelada',
        precio_unitario_compra: 20,
        tipo_precio_venta: 'por_tonelada',
        precio_unitario_venta: 80,
      } as any;

      const res = await commercialOperationService.create(formData);

      expect(res.id).toBe(6);
      expect(insertChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          numero_operacion: 'OP-2025-000006',
          peligrosidad: 'peligroso', // Sobrescrito por asterisco
          estado: 'abierta',
          coste_compra_total: 200,
          ingreso_venta_total: 800,
          margen_bruto_total: 600,
        }),
      ]);
    });

    it('debe lanzar error si insert falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const countChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Insert failed'),
        }),
      };

      mockSupabase.from.mockReturnValue({ ...countChain, ...insertChain });

      await expect(
        commercialOperationService.create({ codigo_ler: '20 01 01' } as any)
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('update', () => {
    it('debe recalcular rentabilidad y actualizar la operación filtrando por user_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 10, estado: 'completada' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(updateChain);

      const res = await commercialOperationService.update(10, {
        codigo_ler: '15 01 10*',
        cantidad_real_t: 5,
        tipo_precio_compra: 'por_tonelada',
        precio_unitario_compra: 30,
        tipo_precio_venta: 'por_tonelada',
        precio_unitario_venta: 100,
      });

      expect(res.id).toBe(10);
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          peligrosidad: 'peligroso',
          coste_compra_total: 150,
          ingreso_venta_total: 500,
          margen_bruto_total: 350,
        })
      );
      expect(updateChain.eq).toHaveBeenCalledWith('id', 10);
      expect(updateChain.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('debe fusionar precios existentes cuando solo se actualiza cantidad_real_t tras el pesaje en báscula', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const getByIdSpy = jest.spyOn(commercialOperationService, 'getById').mockResolvedValue({
        id: 10,
        cantidad_estimada_t: 10,
        cantidad_real_t: 0,
        tipo_precio_compra: 'por_tonelada',
        precio_unitario_compra: 40,
        tipo_precio_venta: 'por_tonelada',
        precio_unitario_venta: 110,
        coste_transporte: 60,
        otros_costes: 0,
      } as any);

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 10,
            cantidad_real_t: 8,
            coste_compra_total: 320,
            ingreso_venta_total: 880,
            margen_bruto_total: 500,
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(updateChain);

      const res = await commercialOperationService.update(10, { cantidad_real_t: 8 });

      expect(getByIdSpy).toHaveBeenCalledWith(10);
      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cantidad_real_t: 8,
          coste_compra_total: 320,
          ingreso_venta_total: 880,
          margen_bruto_total: 500,
        })
      );
      expect(res.margen_bruto_total).toBe(500);
      getByIdSpy.mockRestore();
    });

    it('debe preservar y escalar líneas multimaterial al actualizar cantidad_real_t sin líneas explícitas y exportar CSV multimaterial (A7-02)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const getByIdSpy = jest.spyOn(commercialOperationService, 'getById').mockResolvedValue({
        id: 25,
        numero_operacion: 'OP-2026-000025',
        cantidad_estimada_t: 2,
        coste_transporte: 40,
        otros_costes: 10,
        lineas_materiales: [
          {
            id: 'L1',
            codigo_ler: '15 01 01',
            descripcion_residuo: 'Cartón',
            peligrosidad: 'no-peligroso',
            cantidad_t: 1.5,
            tipo_precio: 'por_tonelada',
            precio_unitario_compra: 40,
            precio_unitario_venta: 85,
          },
          {
            id: 'L2',
            codigo_ler: '15 01 02',
            descripcion_residuo: 'Plástico',
            peligrosidad: 'no-peligroso',
            cantidad_t: 0.5,
            tipo_precio: 'por_tonelada',
            precio_unitario_compra: 60,
            precio_unitario_venta: 110,
          },
        ],
      } as any);

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 25,
            cantidad_real_t: 4,
            coste_compra_total: 180,
            ingreso_venta_total: 365,
            margen_bruto_total: 135,
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(updateChain);

      const updated = await commercialOperationService.update(25, {
        cantidad_real_t: 4,
      });

      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cantidad_real_t: 4,
          coste_compra_total: 180,
          ingreso_venta_total: 365,
          margen_bruto_total: 135,
        })
      );
      expect(updated.coste_compra_total).toBe(180);

      // Exportar CSV con operación multimaterial (con toneladas > 0 y con toneladas = 0)
      commercialOperationService.exportToCSV([
        {
          id: 25,
          numero_operacion: 'OP-2026-000025',
          fecha: '2026-11-24',
          estado: 'liquidada',
          codigo_ler: '15 01 01',
          descripcion_residuo: 'Multimaterial',
          cantidad_real_t: 4,
          coste_compra_total: 180,
          ingreso_venta_total: 365,
          lineas_materiales: [{ id: 'L1', codigo_ler: '15 01 01', cantidad_t: 4 }] as any,
        } as any,
        {
          id: 26,
          numero_operacion: 'OP-2026-000026',
          fecha: '2026-11-24',
          estado: 'borrador',
          codigo_ler: '15 01 01',
          descripcion_residuo: 'Multimaterial vacío',
          cantidad_real_t: 0,
          cantidad_estimada_t: 0,
          lineas_materiales: [{ id: 'L1', codigo_ler: '15 01 01', cantidad_t: 0 }] as any,
        } as any,
      ]);

      getByIdSpy.mockRestore();
    });

    it('no debe sobrescribir campos económicos con cero cuando solo se actualiza el estado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 10, estado: 'liquidada', margen_bruto_total: 350 },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(updateChain);

      const res = await commercialOperationService.update(10, {
        estado: 'liquidada',
      });

      expect(res.estado).toBe('liquidada');
      const sentPayload = updateChain.update.mock.calls[0][0];
      expect(sentPayload.estado).toBe('liquidada');
      expect(sentPayload.coste_compra_total).toBeUndefined();
      expect(sentPayload.ingreso_venta_total).toBeUndefined();
      expect(sentPayload.margen_bruto_total).toBeUndefined();
    });

    it('debe lanzar error si no hay usuario o si update falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(commercialOperationService.update(10, {})).rejects.toThrow('No hay usuario autenticado');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Update error') }),
      };
      mockSupabase.from.mockReturnValue(updateChain);

      await expect(commercialOperationService.update(10, {})).rejects.toThrow('Update error');
    });
  });

  describe('delete', () => {
    it('debe eliminar la operación correctamente filtrando por user_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const deleteChain: any = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      deleteChain.then = (resolve: any) => Promise.resolve({ error: null }).then(resolve);
      mockSupabase.from.mockReturnValue(deleteChain);

      const res = await commercialOperationService.delete(5);
      expect(res).toBe(true);
      expect(deleteChain.eq).toHaveBeenCalledWith('id', 5);
      expect(deleteChain.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('debe lanzar error si no hay usuario o si delete falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(commercialOperationService.delete(5)).rejects.toThrow('No hay usuario autenticado');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const deleteChain: any = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      deleteChain.then = (resolve: any) => Promise.resolve({ error: new Error('Delete error') }).then(resolve);
      mockSupabase.from.mockReturnValue(deleteChain);

      await expect(commercialOperationService.delete(5)).rejects.toThrow('Delete error');
    });
  });

  describe('getStats', () => {
    it('debe calcular KPIs agregados y distribución por estado', async () => {
      jest.spyOn(commercialOperationService, 'getAll').mockResolvedValue([
        {
          id: 1,
          estado: 'abierta',
          cantidad_real_t: 10,
          ingreso_venta_total: 1000,
          coste_compra_total: 400,
          coste_transporte: 100,
          otros_costes: 50,
          margen_bruto_total: 450,
        } as any,
        {
          id: 2,
          estado: 'completada',
          cantidad_estimada_t: 5,
          ingreso_venta_total: 500,
          coste_compra_total: 200,
          coste_transporte: 50,
          otros_costes: 0,
          margen_bruto_total: 250,
        } as any,
      ]);

      const stats = await commercialOperationService.getStats(2025);

      expect(stats.total_operaciones).toBe(2);
      expect(stats.toneladas_totales).toBe(15);
      expect(stats.facturacion_total).toBe(1500);
      expect(stats.costes_totales).toBe(800);
      expect(stats.margen_bruto_total).toBe(700);
      expect(stats.margen_medio_tonelada).toBeCloseTo(46.67, 1);
      expect(stats.por_estado.abierta).toBe(1);
      expect(stats.por_estado.completada).toBe(1);
      expect(stats.por_estado.borrador).toBe(0);
    });
  });

  describe('Exportaciones CSV y Excel XML', () => {
    const mockOps: CommercialOperation[] = [
      {
        id: 1,
        numero_operacion: 'OP-2025-001',
        fecha: '2025-05-01',
        estado: 'abierta',
        codigo_ler: '15 01 02',
        descripcion_residuo: 'Plásticos "limpios"',
        cantidad_real_t: 12.5,
        origen_productor: { razon_social: 'Productor A' } as any,
        destino_gestor: { razon_social: 'Gestor B' } as any,
        transportista: { razon_social: 'Transportes C' } as any,
        proveedor_comercial: { razon_social: 'Proveedor D' } as any,
        cliente_comercial: { razon_social: 'Cliente E' } as any,
        precio_unitario_compra: 50,
        coste_compra_total: 625,
        precio_unitario_venta: 120,
        ingreso_venta_total: 1500,
        coste_transporte: 150,
        margen_bruto_total: 725,
        margen_unitario_tonelada: 58,
        identification_document_id: 88,
      } as any,
      {
        id: 2,
        numero_operacion: 'OP-2025-002',
        fecha: '2025-05-02',
        estado: 'completada',
        codigo_ler: '20 01 01',
        descripcion_residuo: '',
        cantidad_estimada_t: 0,
        precio_unitario_compra: 0,
        coste_compra_total: 0,
        precio_unitario_venta: 0,
        ingreso_venta_total: 0,
        coste_transporte: 0,
        margen_bruto_total: 0,
        margen_unitario_tonelada: 0,
      } as any,
    ];

    it('exportToCSV debe generar y descargar archivo CSV', () => {
      expect(() => commercialOperationService.exportToCSV(mockOps)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('exportToCSV debe incluir modalidad de precio, precio normalizado y otros costes sin descuadre (A04-04)', () => {
      const op35: CommercialOperation = {
        id: 35,
        numero_operacion: 'OP-2026-0035',
        fecha: '2026-11-16',
        estado: 'abierta',
        codigo_ler: '17 04 05',
        descripcion_residuo: 'Hierro y acero',
        cantidad_real_t: 0.5,
        tipo_precio_compra: 'por_kg',
        precio_unitario_compra: 0.10,
        coste_compra_total: 50.00,
        tipo_precio_venta: 'por_kg',
        precio_unitario_venta: 0.25,
        ingreso_venta_total: 125.00,
        coste_transporte: 15.00,
        otros_costes: 2.00,
        descripcion_otros_costes: 'Pesaje báscula externa',
        margen_bruto_total: 58.00,
        margen_unitario_tonelada: 116.00,
        porcentaje_margen: 46.4,
      } as any;

      let blobData: any = null;
      const originalBlob = global.Blob;
      global.Blob = jest.fn().mockImplementation((chunks: any[], options: any) => {
        blobData = chunks.join('');
        return new originalBlob(chunks, options);
      }) as any;

      commercialOperationService.exportToCSV([op35]);

      expect(blobData).toContain('Modalidad Compra');
      expect(blobData).toContain('Modalidad Venta');
      expect(blobData).toContain('Otros Costes (€)');
      expect(blobData).toContain('€/kg');
      expect(blobData).toContain('100,00'); // normalizado a €/t (0.10 * 1000)
      expect(blobData).toContain('250,00'); // normalizado a €/t (0.25 * 1000)
      expect(blobData).toContain('2,00');   // otros costes
      expect(blobData).toContain('58,00');  // margen bruto

      global.Blob = originalBlob;
    });

    it('exportToExcelXML debe generar y descargar archivo XML', () => {
      expect(() => commercialOperationService.exportToExcelXML(mockOps)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
    });
  });

  describe('syncOperationToHolded', () => {
    it('debe fallar si la operación no existe', async () => {
      jest.spyOn(commercialOperationService, 'getById').mockResolvedValue(null);

      await expect(commercialOperationService.syncOperationToHolded(999)).rejects.toThrow(
        'Operación comercial no encontrada'
      );
    });

    it('debe fallar si no hay API Key de Holded', async () => {
      const mockOp = { id: 1, company_id: 10, numero_operacion: 'OP-01' };
      jest.spyOn(commercialOperationService, 'getById').mockResolvedValue(mockOp as any);

      const origEnv = process.env.HOLDED_API_KEY;
      delete process.env.HOLDED_API_KEY;

      const compChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { holded_api_key: null }, error: null }),
      };
      mockSupabase.from.mockReturnValue(compChain);

      await expect(commercialOperationService.syncOperationToHolded(1)).rejects.toThrow(
        'API Key de Holded no configurada'
      );

      process.env.HOLDED_API_KEY = origEnv;
    });

    it('debe crear contacto en Holded, crear factura y registrar auditoría con éxito', async () => {
      const mockOp: Partial<CommercialOperation> = {
        id: 10,
        company_id: 20,
        numero_operacion: 'OP-2025-000010',
        codigo_ler: '15 01 02',
        descripcion_residuo: 'Envases plásticos',
        cantidad_real_t: 8,
        ingreso_venta_total: 960,
        fecha: '2025-05-10',
        cliente_comercial_id: 30,
        cliente_razon_social: 'Cliente Holded S.L.',
        cliente_cif: 'B99887766',
      };

      jest.spyOn(commercialOperationService, 'getById').mockResolvedValue(mockOp as any);

      const compChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { holded_api_key: 'test-holded-api-key', razon_social: 'Mi Empresa' },
          error: null,
        }),
      };

      const clientChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 30,
            razon_social: 'Cliente Holded S.L.',
            cif: 'B99887766',
            email: 'cliente@holded.com',
          },
          error: null,
        }),
      };

      const updateOpChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return compChain;
        if (table === 'commercial_operations') return updateOpChain;
        return null;
      });

      (holdedService.createContact as jest.Mock).mockResolvedValue({ id: 'contact-holded-123' });
      (holdedService.createInvoice as jest.Mock).mockResolvedValue({
        id: 'inv-holded-999',
        docNumber: 'F25-0001',
      });

      const res = await commercialOperationService.syncOperationToHolded(10);

      expect(res.success).toBe(true);
      expect(res.docNumber).toBe('F25-0001');
      expect(res.invoiceId).toBe('inv-holded-999');
      expect(holdedService.createContact).toHaveBeenCalledWith(
        expect.objectContaining({ vatnumber: 'B99887766' }),
        'test-holded-api-key'
      );
      expect(holdedService.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 'contact-holded-123',
          contactName: 'Cliente Holded S.L.',
        }),
        'test-holded-api-key'
      );
      expect(updateOpChain.update).toHaveBeenCalledWith({
        factura_venta_ref: 'F25-0001',
        estado_cobro_venta: 'pendiente',
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'sincronizar_holded',
          entidad: 'operacion_comercial',
          entidad_id: 10,
        })
      );
    });

    it('debe continuar la facturación si la creación de contacto en Holded emite una advertencia', async () => {
      const mockOp: Partial<CommercialOperation> = {
        id: 11,
        company_id: 20,
        numero_operacion: 'OP-2025-000011',
        codigo_ler: '20 01 01',
        cantidad_estimada_t: 3,
        ingreso_venta_total: 300,
        cliente_comercial_id: 35,
      };

      jest.spyOn(commercialOperationService, 'getById').mockResolvedValue(mockOp as any);

      const compChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { holded_api_key: 'test-key' },
          error: null,
        }),
      };

      const updateOpChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return compChain;
        if (table === 'commercial_operations') return updateOpChain;
        return null;
      });

      (holdedService.createContact as jest.Mock).mockRejectedValue(new Error('Contact exists'));
      (holdedService.createInvoice as jest.Mock).mockResolvedValue({
        id: 'inv-888',
      });

      const res = await commercialOperationService.syncOperationToHolded(11);
      expect(res.success).toBe(true);
      expect(res.invoiceId).toBe('inv-888');
    });

    it('debe soportar IVA 0% (ISP Art. 84.Uno.2º.c LIVA), subtotal unitario sin doble multiplicación y domicilio_social', async () => {
      const mockOp: Partial<CommercialOperation> = {
        id: 12,
        company_id: 20,
        numero_operacion: 'OP-2025-000012',
        codigo_ler: '17 04 05',
        descripcion_residuo: 'Chatarra férrica',
        tipo_precio_venta: 'por_tonelada',
        cantidad_real_t: 10,
        precio_unitario_venta: 120,
        ingreso_venta_total: 1200,
        fecha: '2025-06-01',
        cliente_comercial_id: 30,
        cliente_razon_social: 'Aceros Sur S.A.',
        cliente_cif: 'A11223344',
      };

      jest.spyOn(commercialOperationService, 'getById').mockResolvedValue(mockOp as any);

      let companySelectCall = 0;
      const compChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(() => {
          companySelectCall++;
          if (companySelectCall === 1) {
            return Promise.resolve({
              data: { holded_api_key: 'key-isp', razon_social: 'Mi Empresa' },
              error: null,
            });
          }
          return Promise.resolve({
            data: {
              id: 30,
              razon_social: 'Aceros Sur S.A.',
              cif: 'A11223344',
              email: 'facturacion@acerossur.es',
              domicilio_social: 'Pol. Ind. El Portal 5',
              municipio_social: 'Jerez de la Frontera',
              codigo_postal_social: '11408',
              provincia_social: 'Cádiz',
            },
            error: null,
          });
        }),
      };

      const updateOpChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return compChain;
        if (table === 'commercial_operations') return updateOpChain;
        return null;
      });

      (holdedService.createContact as jest.Mock).mockResolvedValue({ id: 'contact-isp-30' });
      (holdedService.createInvoice as jest.Mock).mockResolvedValue({ id: 'inv-isp-12', docNumber: 'F25-0012' });

      const res = await commercialOperationService.syncOperationToHolded(12, { taxRate: 0 });
      expect(res.success).toBe(true);
      expect(holdedService.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          address: 'Pol. Ind. El Portal 5',
          city: 'Jerez de la Frontera',
          postalCode: '11408',
          province: 'Cádiz',
        }),
        'key-isp'
      );
      expect(holdedService.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          desc: expect.stringContaining('Inversión del Sujeto Pasivo (Art. 84.Uno.2º.c Ley 37/1992 del IVA)'),
          items: [
            expect.objectContaining({
              units: 10,
              subtotal: 120,
              tax: 0,
            }),
          ],
        }),
        'key-isp'
      );

      // Caso lote_fijo con IVA 10%
      companySelectCall = 0;
      jest.spyOn(commercialOperationService, 'getById').mockResolvedValue({
        ...mockOp,
        tipo_precio_venta: 'lote_fijo',
        ingreso_venta_total: 450,
      } as any);

      await commercialOperationService.syncOperationToHolded(12, { taxRate: 10 });
      expect(holdedService.createInvoice).toHaveBeenLastCalledWith(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              units: 1,
              subtotal: 450,
              tax: 10,
            }),
          ],
        }),
        'key-isp'
      );

      // Caso por_kg sin precio_unitario_venta explícito
      companySelectCall = 0;
      jest.spyOn(commercialOperationService, 'getById').mockResolvedValue({
        ...mockOp,
        tipo_precio_venta: 'por_kg',
        cantidad_real_t: 2,
        precio_unitario_venta: 0,
        ingreso_venta_total: 500,
      } as any);

      await commercialOperationService.syncOperationToHolded(12, { taxRate: 21 });
      expect(holdedService.createInvoice).toHaveBeenLastCalledWith(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              units: 2000,
              subtotal: 0.25,
              tax: 21,
            }),
          ],
        }),
        'key-isp'
      );
    });
  });

  describe('verifyAccess', () => {
    it('debe validar el permiso del módulo operaciones_comerciales vía tenantContextService', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'uid-prod', email: 'prod@resigest.test' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'user' } }),
          };
        }
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 1,
                    user_id: 'uid-prod',
                    is_my_company: true,
                    activo: true,
                    perfil_operativo: 'productor',
                    onboarding_completado: true,
                  },
                ],
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [] }),
        };
      });

      await expect(commercialOperationService.verifyAccess()).rejects.toThrow('Acceso denegado');
    });

    it('debe sincronizar con el Archivo Cronológico cuando la operación pasa a completada o liquidada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 91,
            numero_operacion: 'OP-2025-0091',
            codigo_ler: '17 04 05',
            estado: 'completada',
          },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(updateChain);

      await commercialOperationService.update(91, { estado: 'completada' });
      expect(syncEntryFromCommercialOperation).toHaveBeenCalledWith(
        expect.objectContaining({ id: 91, numero_operacion: 'OP-2025-0091', estado: 'completada' })
      );

      // Si el registro cronológico falla, no bloquea el flujo comercial
      (syncEntryFromCommercialOperation as jest.Mock).mockRejectedValueOnce(new Error('Sync fail'));
      await expect(commercialOperationService.update(91, { estado: 'liquidada' })).resolves.toBeDefined();
    });
  });

  describe('Fase 4 (UXDEV-11 / UXDEV-14): Intervención ambiental, unidades y carpeta documental', () => {
    it('debe formatear etiquetas de modalidad de precio legibles', () => {
      expect(formatPriceUnitLabel('por_kg')).toBe('€/kg');
      expect(formatPriceUnitLabel('lote_fijo')).toBe('Lote fijo');
      expect(formatPriceUnitLabel('por_tonelada')).toBe('€/t');
      expect(formatPriceUnitLabel(undefined)).toBe('€/t');
    });

    it('debe generar huella digital determinista de 64 caracteres hexadecimales', () => {
      const h1 = computeDocumentFingerprint('op-39|di_externo|doc.pdf');
      const h2 = computeDocumentFingerprint('op-39|di_externo|doc.pdf');
      const h3 = computeDocumentFingerprint('op-39|di_externo|otro.pdf');
      expect(h1).toMatch(/^[0-9a-f]{64}$/);
      expect(h1).toBe(h2);
      expect(h1).not.toBe(h3);
    });

    it('debe serializar y parsear metadatos de intervención y carpeta documental (incluyendo JSON corrupto)', () => {
      const serialized = serializeCommercialMetaToNotes('Nota del negociante', {
        modalidad_posesion: 'almacenamiento_planta_propia',
        actua_como_operador: true,
        mandato_referencia: 'MAND-2026-01',
        mandato_fecha: '2026-11-20',
        mandato_otorgante: 'Productor SL',
        documentos: [
          {
            id: 'd1',
            tipo: 'mandato_operador',
            nombre: 'Mandato.pdf',
            emisor: 'Productor SL',
            fecha: '2026-11-20',
            procedencia: 'externo',
          },
        ],
      });

      const parsed = parseCommercialMetaFromNotes(serialized);
      expect(parsed.cleanNotes).toBe('Nota del negociante');
      expect(parsed.meta.modalidad_posesion).toBe('almacenamiento_planta_propia');
      expect(parsed.meta.actua_como_operador).toBe(true);
      expect(parsed.meta.mandato_referencia).toBe('MAND-2026-01');
      expect(parsed.meta.documentos).toHaveLength(1);

      // JSON corrupto devuelve fallback seguro
      const corrupted = parseCommercialMetaFromNotes('Texto limpio\n__RESIGEST_OP_META__:{bad-json');
      expect(corrupted.cleanNotes).toBe('Texto limpio');
      expect(corrupted.meta.documentos).toEqual([]);
    });

    it('debe validar el mandato escrito cuando actua_como_operador es true', () => {
      expect(validateOperatorMandate({ actua_como_operador: false }).valid).toBe(true);
      expect(validateOperatorMandate({ actua_como_operador: true, mandato_referencia: 'MAND-1' }).valid).toBe(true);
      expect(validateOperatorMandate({ actua_como_operador: true, mandato_referencia: '' }).valid).toBe(false);
    });

    it('debe adjuntar y eliminar documentos de la carpeta documental y validar errores', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      // Error si no existe la operación
      const notFoundChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };
      mockSupabase.from.mockReturnValueOnce(notFoundChain);
      await expect(
        commercialOperationService.addDocumentAttachment(999, {
          tipo: 'di_externo',
          nombre: 'DI.pdf',
          emisor: 'Gestor',
          fecha: '2026-11-20',
          procedencia: 'externo',
        })
      ).rejects.toThrow('Operación comercial no encontrada');

      // Error si faltan nombre o emisor
      const existingOp = {
        id: 50,
        user_id: mockUser.id,
        company_id: 10,
        numero_operacion: 'OP-2026-000050',
        estado: 'abierta',
        observaciones: serializeCommercialMetaToNotes('Base', {
          modalidad_posesion: 'intermediacion_sin_posesion',
          actua_como_operador: false,
          documentos: [
            {
              id: 'doc-existing',
              tipo: 'albaran_bascula',
              nombre: 'ALB-1.pdf',
              emisor: 'Planta',
              fecha: '2026-11-19',
              procedencia: 'externo',
            },
          ],
        }),
      };

      const foundChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existingOp, error: null }),
      };
      mockSupabase.from.mockReturnValueOnce(foundChain);
      await expect(
        commercialOperationService.addDocumentAttachment(50, {
          tipo: 'di_externo',
          nombre: '',
          emisor: 'Gestor',
          fecha: '2026-11-20',
          procedencia: 'externo',
        })
      ).rejects.toThrow('Debe indicar el nombre del documento y el emisor');

      // Eliminar documento existente
      const updateChain = {
        update: jest.fn().mockImplementation((payload: any) => ({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { ...existingOp, ...payload },
            error: null,
          }),
        })),
      };
      mockSupabase.from
        .mockReturnValueOnce(foundChain)
        .mockReturnValueOnce(foundChain)
        .mockReturnValueOnce(updateChain);

      const afterRemove = await commercialOperationService.removeDocumentAttachment(50, 'doc-existing');
      expect(afterRemove.documentos_adjuntos).toEqual([]);

      // Error al eliminar si no existe la operación
      mockSupabase.from.mockReturnValueOnce(notFoundChain);
      await expect(
        commercialOperationService.removeDocumentAttachment(999, 'doc-1')
      ).rejects.toThrow('Operación comercial no encontrada');
    });

    it('debe rechazar update si se activa actua_como_operador sin mandato_referencia', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      await expect(
        commercialOperationService.update(50, {
          actua_como_operador: true,
          mandato_referencia: '',
        })
      ).rejects.toThrow(/mandato/i);
    });

    it('debe calcular rentabilidad y serializar operaciones multimaterial con varias líneas LER (Hito C.4)', () => {
      const multiProfit = calculateProfitability({
        coste_transporte: 50,
        otros_costes: 10,
        lineas_materiales: [
          {
            id: 'l1',
            codigo_ler: '17 04 05',
            descripcion_residuo: 'Hierro y acero',
            peligrosidad: 'no-peligroso',
            cantidad_t: 2,
            tipo_precio: 'por_tonelada',
            precio_unitario_compra: 100, // 200
            precio_unitario_venta: 180, // 360
            di_referencia: 'DI-101',
          },
          {
            id: 'l2',
            codigo_ler: '17 04 01',
            descripcion_residuo: 'Cobre',
            peligrosidad: 'no-peligroso',
            cantidad_t: 0.5, // 500 kg
            tipo_precio: 'por_kg',
            precio_unitario_compra: 4, // 2000
            precio_unitario_venta: 5.5, // 2750
            di_referencia: 'DI-102',
          },
          {
            id: 'l3',
            codigo_ler: '17 04 02',
            descripcion_residuo: 'Aluminio lote',
            peligrosidad: 'no-peligroso',
            cantidad_t: 1,
            tipo_precio: 'lote_fijo',
            precio_unitario_compra: 100,
            precio_unitario_venta: 200,
          },
        ],
      });

      expect(multiProfit.toneladas).toBe(3.5);
      expect(multiProfit.coste_compra_total).toBe(2300);
      expect(multiProfit.ingreso_venta_total).toBe(3310);
      expect(multiProfit.margen_bruto_total).toBe(950);

      const notes = serializeCommercialMetaToNotes('Operación conjunta chatarrería', {
        modalidad_posesion: 'almacenamiento_planta_propia',
        actua_como_operador: false,
        documentos: [],
        lineas_materiales: [
          {
            id: 'l1',
            codigo_ler: '17 04 05',
            descripcion_residuo: 'Hierro y acero',
            peligrosidad: 'no-peligroso',
            cantidad_t: 2,
            tipo_precio: 'por_tonelada',
            precio_unitario_compra: 100,
            precio_unitario_venta: 180,
          },
        ],
      });

      const parsed = parseCommercialMetaFromNotes(notes);
      expect(parsed.cleanNotes).toBe('Operación conjunta chatarrería');
      expect(parsed.meta.lineas_materiales).toHaveLength(1);
      expect(parsed.meta.lineas_materiales?.[0].codigo_ler).toBe('17 04 05');
    });
  });
});
