const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

jest.mock('@/services/wasteContractService', () => ({
  getContractEffectiveStatus: jest.fn((contract: any) => {
    if (contract.estado === 'caducado') {
      return { status: 'caducado', isExpired: true };
    }
    return { status: contract.estado || 'vigente', isExpired: false };
  }),
}));

import { dashboardService } from '../dashboardService';
import { getContractEffectiveStatus } from '@/services/wasteContractService';

describe('dashboardService - Dashboard Ejecutivo e Indicadores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUser = { id: 'user-dash-123' };

  describe('getExecutiveOverview', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(dashboardService.getExecutiveOverview()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe procesar alertas por tránsito, discrepancia de peso, rechazo, contratos y autorizaciones', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const pastDate = '2020-01-01';
      const nearFutureDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const mockDIs = [
        {
          id: 1,
          numero_documento: 'DI-001',
          estado: 'en_transito',
          estado_traslado: 'en_transito',
          codigo_ler: '15 01 10*',
          gestor_razon_social: 'Gestor Alfa',
          fecha_salida: '2025-05-01',
        },
        {
          id: 2,
          numero_documento: 'DI-002',
          estado: 'completado',
          estado_traslado: 'entregado',
          porcentaje_discrepancia: 8,
          diferencia_peso_kg: 120,
          codigo_ler: '20 01 01',
          unidad: 'kg',
          cantidad: 1500,
          peso_destino_kg: 1620,
          gestor_razon_social: 'Gestor Beta',
          fecha_documento: '2025-05-02',
        },
        {
          id: 3,
          numero_documento: 'DI-003',
          estado: 'en_transito',
          estado_traslado: 'rechazado_total',
          motivo_incidencia: 'Residuo no admisible',
          codigo_ler: '15 01 02',
          gestor_razon_social: 'Gestor Gamma',
          fecha_documento: '2025-05-03',
        },
        {
          id: 4,
          numero_documento: 'DI-004',
          estado: 'completado',
          estado_traslado: 'aceptado',
          codigo_ler: '15 01 10*',
          peso_origen_kg: 2000,
          peligrosidad: 'peligroso',
        },
        {
          id: 5,
          numero_documento: 'DI-005',
          estado: 'completado',
          estado_traslado: 'tratado',
          codigo_ler: '20 01 01',
          cantidad: 3, // toneladas por defecto
          unidad: 'toneladas',
          peligrosidad: 'no-peligroso',
        },
      ];

      const mockContracts = [
        {
          id: 10,
          numero_contrato: 'CTR-CADUCADO',
          estado: 'caducado',
          fecha_fin: pastDate,
        },
        {
          id: 11,
          numero_contrato: 'CTR-PROXIMO',
          estado: 'vigente',
          fecha_fin: nearFutureDate,
        },
      ];

      const mockAuths = [
        {
          id: 20,
          numero_autorizacion: 'AUTH-VENCIDA',
          titulo: 'Autorización Gestor Residuos',
          es_indefinida: false,
          fecha_vencimiento: pastDate,
        },
        {
          id: 21,
          numero_autorizacion: 'AUTH-VALIDA',
          titulo: 'Autorización Indefinida',
          es_indefinida: true,
          fecha_vencimiento: null,
        },
      ];

      const mockOps = [
        {
          id: 100,
          estado: 'abierta',
          ingreso_venta_total: 1000,
          coste_compra_total: 500,
          coste_transporte: 100,
          otros_costes: 50,
          margen_bruto_total: 350,
          cantidad_real_t: 10,
        },
        {
          id: 101,
          estado: 'completada',
          ingreso_venta_total: 500,
          coste_compra_total: 200,
          coste_transporte: 50,
          otros_costes: 0,
          margen_bruto_total: 250,
          cantidad_estimada_t: 5,
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        let data: any[] = [];
        if (table === 'identification_documents') data = mockDIs;
        else if (table === 'waste_contracts') data = mockContracts;
        else if (table === 'environmental_authorizations') data = mockAuths;
        else if (table === 'commercial_operations') data = mockOps;

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data, error: null }),
        };
      });

      const res = await dashboardService.getExecutiveOverview();

      // Comprobación de Alertas
      expect(res.alertas.disEnTransitoCount).toBe(1);
      expect(res.alertas.disDiscrepanciaCount).toBe(2); // DI 2 (peso >5%) y DI 3 (rechazo)
      expect(res.alertas.contratosCaducadosCount).toBe(1);
      expect(res.alertas.contratosPorVencerCount).toBe(1);
      expect(res.alertas.autorizacionesPorVencerCount).toBe(1);
      expect(res.alertas.totalCriticas).toBeGreaterThanOrEqual(2);
      expect(res.alertas.totalAdvertencias).toBeGreaterThanOrEqual(2);

      // Comprobación de Residuos
      expect(res.residuos.totalDIs).toBe(5);
      expect(res.residuos.disCompletados).toBe(3); // DIs 2, 4, 5 con estado === 'completado'
      expect(res.residuos.totalToneladas).toBeCloseTo(1.62 + 2.0 + 3.0, 2);
      expect(res.residuos.toneladasPeligrosas).toBe(2.0); // DI 4 (peso_origen_kg 2000 = 2t)
      expect(res.residuos.topLER.length).toBeGreaterThan(0);
      expect(res.residuos.topLER[0].porcentaje).toBeGreaterThan(0);

      // Comprobación Comercial
      expect(res.comercial.totalOperaciones).toBe(2);
      expect(res.comercial.operacionesAbiertas).toBe(1);
      expect(res.comercial.facturacionVenta).toBe(1500);
      expect(res.comercial.costesTotales).toBe(900);
      expect(res.comercial.margenBrutoTotal).toBe(600);
      expect(res.comercial.margenMedioTon).toBe(40);
      expect(res.comercial.rentabilidadPorcentaje).toBe(40);
    });

    it('debe manejar ramas de diferencia de peso negativa, unidad kg, LER duplicado y datos vacíos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const futureFarDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const mockDIs = [
        {
          id: 1,
          numero_documento: 'DI-DISC-NEG',
          estado: 'completado',
          estado_traslado: 'aceptado',
          porcentaje_discrepancia: -10,
          diferencia_peso_kg: -200,
          codigo_ler: '15 01 02',
          unidad: 'kg',
          cantidad: 1000, // triggers line 193: unidad === 'kg'
          peso_destino_kg: 0,
          peso_origen_kg: 0,
          gestor_razon_social: 'Gestor Recicla',
        },
        {
          id: 2,
          numero_documento: 'DI-LER-DUP',
          estado: 'completado',
          estado_traslado: 'tratado',
          codigo_ler: '15 01 02', // duplicate LER key to trigger lerMap.has branch
          unidad: 'toneladas',
          cantidad: 2,
          peso_destino_kg: 0,
          peso_origen_kg: 0,
        },
      ];

      const mockContracts = [
        {
          id: 1,
          numero_contrato: 'CTR-LEJOS',
          estado: 'vigente',
          fecha_fin: futureFarDate, // daysLeft > 60 -> does not trigger alert
        },
      ];

      const mockAuths = [
        {
          id: 1,
          numero_autorizacion: 'AUT-FUTURO',
          es_indefinida: false,
          fecha_vencimiento: futureFarDate, // not expired
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        let data: any[] = [];
        if (table === 'identification_documents') data = mockDIs;
        else if (table === 'waste_contracts') data = mockContracts;
        else if (table === 'environmental_authorizations') data = mockAuths;
        else if (table === 'commercial_operations') data = [];

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data, error: null }),
        };
      });

      const res = await dashboardService.getExecutiveOverview();

      expect(res.alertas.disDiscrepanciaCount).toBe(1);
      expect(res.alertas.lista[0].descripcion).toContain('-200 kg');
      expect(res.residuos.totalToneladas).toBe(3); // 1.0 + 2.0
      expect(res.comercial.totalOperaciones).toBe(0);
      expect(res.comercial.rentabilidadPorcentaje).toBe(0);
      expect(res.comercial.margenMedioTon).toBe(0);
    });
  });

  describe('getDashboardStats', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(dashboardService.getDashboardStats()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe calcular contadores y peso total en toneladas', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockDiDetails = [
        { peso_destino_kg: 2500, unidad: 'kg' },
        { peso_origen_kg: 1000, unidad: 'kg' },
        { cantidad: 500, unidad: 'litros' },
        { cantidad: 4, unidad: 'toneladas' },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        return {
          select: jest.fn().mockImplementation((_cols: string, opts?: any) => {
            if (opts?.head) {
              let count = 0;
              if (table === 'treatment_managers') count = 3;
              if (table === 'carriers') count = 2;
              if (table === 'identification_documents') count = 4;
              return {
                eq: jest.fn().mockImplementation(() => ({
                  eq: jest.fn().mockResolvedValue({ count, error: null }),
                  then: (resolve: any) => resolve({ count, error: null }),
                })),
              };
            }
            return {
              eq: jest.fn().mockResolvedValue({ data: mockDiDetails, error: null }),
            };
          }),
        };
      });

      const stats = await dashboardService.getDashboardStats();

      expect(stats.gestores).toBe(3);
      expect(stats.carriers).toBe(2);
      expect(stats.suppliers).toBe(5);
      expect(stats.diTotal).toBe(4);
      // 2.5 + 1.0 + 0.5 + 4.0 = 8.00 t
      expect(stats.totalWasteTonnes).toBe('8.00');
    });
  });

  describe('getMonthlyWasteData', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(dashboardService.getMonthlyWasteData()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe agrupar los pesos por meses correctamente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const currentYear = new Date().getFullYear();
      const mockRows = [
        {
          fecha_documento: `${currentYear}-01-15`,
          peso_destino_kg: 1200,
        },
        {
          fecha_documento: `${currentYear}-01-20`,
          peso_origen_kg: 800,
        },
        {
          fecha_documento: `${currentYear}-03-10`,
          cantidad: 500,
          unidad: 'kg',
        },
        {
          fecha_documento: `${currentYear}-03-12`,
          cantidad: 2.5,
          unidad: 'toneladas',
        },
      ];

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRows, error: null }),
      };
      mockSupabase.from.mockReturnValue(queryChain);

      const res = await dashboardService.getMonthlyWasteData();

      expect(res).toHaveLength(12);
      const ene = res.find(m => m.name === 'Ene');
      const mar = res.find(m => m.name === 'Mar');
      const feb = res.find(m => m.name === 'Feb');

      expect(ene?.value).toBe(2.0); // 1.2 + 0.8
      expect(mar?.value).toBe(3.0); // 0.5 + 2.5
      expect(feb?.value).toBe(0);
    });
  });

  describe('getRecentActivity', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(dashboardService.getRecentActivity()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe retornar hasta 6 documentos recientes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockRecent = [
        { id: 1, numero_documento: 'DI-01' },
        { id: 2, numero_documento: 'DI-02' },
      ];

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockRecent, error: null }),
      };
      mockSupabase.from.mockReturnValue(queryChain);

      const res = await dashboardService.getRecentActivity();
      expect(res).toEqual(mockRecent);
      expect(queryChain.limit).toHaveBeenCalledWith(6);
    });
  });
});
