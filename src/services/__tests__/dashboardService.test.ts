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
        {
          id: 3,
          numero_documento: 'DI-DISC-JUSTIFICADA',
          estado: 'completado',
          estado_traslado: 'aceptado',
          porcentaje_discrepancia: -16.67,
          diferencia_peso_kg: -0.5,
          justificacion_discrepancia: 'Merma por escurrido del residuo húmedo en planta.', // no debe contar como incumplimiento
          codigo_ler: '15 01 02',
          unidad: 'kg',
          cantidad: 0,
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
          cantidad_maxima_anual: 50,
        },
        {
          id: 2,
          numero_contrato: 'CTR-SIN-CANTIDAD',
          estado: 'vigente',
          fecha_fin: futureFarDate,
          cantidad_maxima_anual: null, // A7-10: debe generar alerta de contrato incompleto
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
      expect(res.alertas.lista.some((a) => a.descripcion.includes('-200 kg'))).toBe(true);
      expect(res.alertas.lista.some((a) => a.id === 'contract-noqty-2')).toBe(true);
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

  describe('getDashboardChartsData', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(dashboardService.getDashboardChartsData()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe agregar residuos RP/RNP, flujo de planta, comercial, estados DI y resumen', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockDis = [
        {
          fecha_documento: '2026-01-10',
          peso_destino_kg: 2000,
          peligrosidad: 'peligroso',
          codigo_ler: '15 01 10*',
          estado: 'completado',
          estado_traslado: 'tratado',
        },
        {
          fecha_documento: '2026-01-18',
          peso_origen_kg: 1000,
          peligrosidad: 'no-peligroso',
          codigo_ler: '20 01 01',
          estado: 'activo',
          estado_traslado: 'en_transito',
        },
        {
          fecha_documento: '2026-02-05',
          cantidad: 4.5,
          unidad: 'toneladas',
          peligrosidad: 'no-peligroso',
          codigo_ler: '17 04 05',
          estado: 'borrador',
          estado_traslado: '',
        },
        {
          fecha_documento: '2026-02-08',
          peso_origen_kg: 3000,
          peligrosidad: 'no-peligroso',
          codigo_ler: '15 01 01',
          estado: 'completado',
          estado_traslado: 'aceptado',
        },
        {
          fecha_documento: '2026-02-09',
          cantidad: 1000,
          unidad: 'kg',
          peligrosidad: 'no-peligroso',
          codigo_ler: '15 01 01',
          estado: 'activo',
          estado_traslado: 'recepcionado',
        },
        {
          fecha_documento: '2026-02-12',
          cantidad: 1500,
          unidad: 'kg',
          codigo_ler: '16 06 01*',
          estado: 'activo',
          estado_traslado: 'rechazado_total',
        },
        {
          fecha_documento: null,
          cantidad: 1,
          unidad: 'toneladas',
          estado: 'borrador',
        },
      ];

      const mockChrono = [
        { fecha: '2026-01-12', tipo_operacion: 'entrada_recepcion', cantidad_kg: 5000 },
        { fecha: '2026-01-20', tipo_operacion: 'produccion_interna', cantidad_kg: 1000 },
        { fecha: '2026-01-25', tipo_operacion: 'salida_traslado', cantidad_kg: 2500 },
        // Intermediación de terceros no debe computar como salida de planta
        {
          fecha: '2026-01-28',
          tipo_operacion: 'salida_traslado',
          cantidad_kg: 9000,
          origen_tipo: 'tercero_productor',
          destino_tipo: 'tercero_gestor',
        },
      ];

      const mockOps = [
        {
          fecha: '2026-01-15',
          estado: 'completada',
          ingreso_venta_total: 4000,
          coste_compra_total: 2000,
          coste_transporte: 500,
          otros_costes: 100,
          margen_bruto_total: 1400,
        },
        {
          fecha: '2026-01-20',
          estado: 'cancelada',
          ingreso_venta_total: 9999,
          coste_compra_total: 1000,
          margen_bruto_total: 8999,
        },
      ];

      const buildChain = (data: any[]) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data, error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') return buildChain(mockDis);
        if (table === 'chronological_registry') return buildChain(mockChrono);
        if (table === 'commercial_operations') return buildChain(mockOps);
        return buildChain([]);
      });

      const res = await dashboardService.getDashboardChartsData({ year: 2026 });

      // INC09: Solo DIs efectivamente gestionados (completado/aceptado/tratado/recepcionado) computan en el gráfico
      expect(res.year).toBe(2026);
      expect(res.monthlyWaste).toHaveLength(12);
      expect(res.monthlyWaste[0]).toEqual({
        name: 'Ene',
        total: 2,
        peligrosos: 2,
        noPeligrosos: 0,
        diCount: 1,
      });
      expect(res.monthlyWaste[1]).toEqual({
        name: 'Feb',
        total: 4,
        peligrosos: 0,
        noPeligrosos: 4,
        diCount: 2,
      });

      expect(res.monthlyPlantFlow[0]).toEqual({
        name: 'Ene',
        entradas: 6,
        salidas: 2.5,
        neto: 3.5,
      });

      expect(res.monthlyCommercial[0]).toEqual({
        name: 'Ene',
        ingresos: 4000,
        costes: 2600,
        margen: 1400,
      });

      expect(res.diStatusDistribution).toEqual({
        completados: 3,
        enTransito: 1,
        borradores: 2,
        incidencias: 1,
        total: 7,
      });

      expect(res.summary.totalToneladas).toBe(6);
      expect(res.summary.promedioMensual).toBe(3);
      expect(res.summary.mesPico).toEqual({ name: 'Feb', value: 4 });
      expect(res.summary.porcentajePeligrosos).toBe(33.3);
      expect(res.summary.variacionUltimoMesPct).toBe(100);
    });

    it('INC09: contratos en borrador y DIs en borrador no producen Conformidad 100%', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const buildSimple = (data: any[]) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data, error: null }),
      });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') {
          return buildSimple([{ id: 162, estado: 'borrador', estado_traslado: 'borrador', cantidad: 1000, unidad: 'kg' }]);
        }
        if (table === 'waste_contracts') {
          return buildSimple([{ id: 71, estado: 'borrador', fecha_inicio: '2026-11-23', fecha_fin: '2027-11-23' }]);
        }
        return buildSimple([]);
      });

      const overview = await dashboardService.getExecutiveOverview({ includeCommercial: false });
      expect(overview.conformidad.estado).toBe('pendiente');
      expect(overview.conformidad.porcentaje).toBeNull();
      expect(overview.conformidad.totalEvaluados).toBe(0);
      expect(overview.residuos.totalToneladas).toBe(0);
    });

    it('debe filtrar por companyId, omitir comercial cuando includeCommercial es false y manejar ejercicio vacío', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const eqCalls: Array<[string, any]> = [];
      const queriedTables: string[] = [];

      mockSupabase.from.mockImplementation((table: string) => {
        queriedTables.push(table);
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn((col: string, val: any) => {
            eqCalls.push([col, val]);
            return {
              gte: jest.fn().mockReturnThis(),
              lte: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            };
          }),
        };
      });

      const res = await dashboardService.getDashboardChartsData({
        companyId: 42,
        year: 2025,
        includeCommercial: false,
      });

      expect(eqCalls).toContainEqual(['company_id', 42]);
      expect(queriedTables).not.toContain('commercial_operations');
      expect(res.year).toBe(2025);
      expect(res.summary).toEqual({
        totalToneladas: 0,
        promedioMensual: 0,
        mesPico: null,
        porcentajePeligrosos: 0,
        variacionUltimoMesPct: null,
      });
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

  describe('conformidad normativa real (F07)', () => {
    it('debe devolver estado pendiente cuando no hay registros evaluables', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }));

      const res = await dashboardService.getExecutiveOverview();
      expect(res.conformidad.estado).toBe('pendiente');
      expect(res.conformidad.porcentaje).toBeNull();
      expect(res.conformidad.totalEvaluados).toBe(0);
    });

    it('debe detectar incidencias por traslado sin contrato y operación ejecutada D01 no autorizada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockDIs = [
        {
          id: 115,
          numero_documento: 'DI-115',
          codigo_ler: '17 04 05',
          operacion_tratamiento: 'R13',
          operacion_tratamiento_ejecutada: 'D01',
          tipo_notificacion: 'con-notificacion-previa',
          estado_traslado: 'tratado',
          estado: 'completado',
          gestor_cif: 'B11111111',
          cantidad: 1,
          unidad: 'toneladas',
          fecha_documento: '2026-11-09',
        },
        {
          id: 116,
          numero_documento: 'DI-116',
          codigo_ler: '20 01 01',
          operacion_tratamiento: 'D05',
          tipo_notificacion: 'sin-notificacion',
          contrato_externo_referencia: 'EXT-1',
          estado_traslado: 'en_transito',
          estado: 'activo',
          cantidad: 0.5,
          unidad: 'toneladas',
          fecha_documento: '2026-11-09',
        },
      ];
      const mockAuths = [
        {
          id: 1,
          company_id: 20,
          activo: true,
          es_indefinida: true,
          waste_codes: [{ codigo_ler: '17 04 05', operaciones_tratamiento: ['R04', 'R13'] }],
        },
      ];
      const mockCompanies = [{ id: 20, cif: 'B11111111' }];

      mockSupabase.from.mockImplementation((table: string) => {
        let data: any[] = [];
        if (table === 'identification_documents') data = mockDIs;
        else if (table === 'environmental_authorizations') data = mockAuths;
        else if (table === 'companies') data = mockCompanies;
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data, error: null }),
        };
      });

      const res = await dashboardService.getExecutiveOverview();
      expect(res.conformidad.estado).toBe('incidencias');
      expect(res.conformidad.porcentaje).toBeLessThan(100);
      expect(res.alertas.disSinContratoCount).toBe(1);
      expect(res.alertas.disTratamientoNoAutorizadoCount).toBe(2);
      expect(Object.keys(res.alertas.tratamientoNoAutorizadoByDiId || {}).length).toBe(2);
      expect(res.alertas.totalCriticas).toBeGreaterThanOrEqual(3);
    });

    it('debe detectar LER no autorizado en matriz del gestor destino', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockDIs = [
        {
          id: 117,
          numero_documento: 'DI-117',
          codigo_ler: '99 99 99',
          operacion_tratamiento: 'R13',
          contract_id: 5,
          gestor_cif: 'B11111111',
          gestor_razon_social: 'Gestor Demo',
          estado_traslado: 'tratado',
          estado: 'completado',
          cantidad: 1,
          unidad: 'toneladas',
          fecha_documento: '2026-11-09',
        },
      ];
      const mockContracts = [{ id: 5, gestor_company_id: 20, estado: 'vigente' }];
      const mockAuths = [
        {
          id: 1,
          company_id: 20,
          activo: true,
          es_indefinida: true,
          waste_codes: [{ codigo_ler: '17 04 05', operaciones_tratamiento: ['R04'] }],
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        let data: any[] = [];
        if (table === 'identification_documents') data = mockDIs;
        else if (table === 'waste_contracts') data = mockContracts;
        else if (table === 'environmental_authorizations') data = mockAuths;
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data, error: null }),
        };
      });

      const res = await dashboardService.getExecutiveOverview();
      expect(res.alertas.disTratamientoNoAutorizadoCount).toBe(1);
      expect(res.alertas.tratamientoNoAutorizadoByDiId?.[117]).toContain('no figura en la matriz autorizada');
      expect(res.alertas.lista.some((a) => a.descripcion.includes('no figura en la matriz autorizada'))).toBe(true);
    });

    it('debe devolver conformidad 100% cuando todos los traslados tienen contrato y operación autorizada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const mockDIs = [
        {
          id: 116,
          numero_documento: 'DI-116',
          codigo_ler: '17 04 05',
          operacion_tratamiento: 'R13',
          operacion_tratamiento_ejecutada: 'R04',
          estado_traslado: 'tratado',
          estado: 'completado',
          contract_id: 5,
          gestor_cif: 'B11111111',
          cantidad: 2,
          unidad: 'toneladas',
          fecha_documento: '2026-11-09',
        },
      ];
      const mockAuths = [
        {
          id: 1,
          company_id: 20,
          company: { cif: 'B11111111' },
          activo: true,
          es_indefinida: true,
          waste_codes: [{ codigo_ler: '17 04 05', operaciones_tratamiento: ['R04', 'R13'] }],
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        let data: any[] = [];
        if (table === 'identification_documents') data = mockDIs;
        else if (table === 'environmental_authorizations') data = mockAuths;
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data, error: null }),
        };
      });

      const res = await dashboardService.getExecutiveOverview();
      expect(res.conformidad.estado).toBe('conforme');
      expect(res.conformidad.porcentaje).toBe(100);
      expect(res.alertas.disSinContratoCount).toBe(0);
      expect(res.alertas.disTratamientoNoAutorizadoCount).toBe(0);
    });

    it('debe soportar filtrado por companyId, omisión comercial y métricas de planta/existencias', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const eqCalls: Array<[string, any]> = [];
      mockSupabase.from.mockImplementation((table: string) => {
        let data: any[] = [];
        if (table === 'chronological_registry') {
          data = [
            { tipo_operacion: 'entrada_recepcion', cantidad_kg: 12000 },
            { tipo_operacion: 'salida_traslado', cantidad_kg: 4500 },
          ];
        } else if (table === 'waste_contracts') {
          data = [{ id: 1, estado: 'vigente', fecha_fin: '2028-01-01' }];
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn((col: string, val: any) => {
            eqCalls.push([col, val]);
            return Promise.resolve({ data, error: null });
          }),
        };
      });

      const res = await dashboardService.getExecutiveOverview({
        companyId: 77,
        includeCommercial: false,
      });

      expect(eqCalls).toContainEqual(['company_id', 77]);
      expect(res.comercial.totalOperaciones).toBe(0);
      expect(res.planta).toMatchObject({
        entradasToneladas: 12,
        salidasToneladas: 4.5,
        existenciasToneladas: 7.5,
        totalAsientos: 2,
        totalContratos: 1,
        contratosVigentes: 1,
      });
    });
  });
});
