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
} from '../commercialOperationService';
import { holdedService } from '../holdedService';
import { auditService } from '../auditService';
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
  });
});
