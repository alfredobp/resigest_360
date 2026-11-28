import type { ExecutiveDashboardData } from '@/services/dashboardService';
import type { CompanyRole } from '@/types/wasteManagement';

export interface DemoRecentDI {
  id: string;
  numero_documento: string;
  estado_traslado: string;
  productor_razon_social: string;
  gestor_razon_social: string;
  fecha_documento: string;
}

export interface DemoDashboardPayload {
  overview: ExecutiveDashboardData;
  monthlyData: Array<{ name: string; value: number }>;
  recentDIs: DemoRecentDI[];
}

export function getDemoDashboardData(role?: CompanyRole | null): DemoDashboardPayload {
  const isTransportista = role === 'transportista';
  const isNegociante = role === 'negociante';

  const overview: ExecutiveDashboardData = {
    conformidad: {
      estado: 'conforme',
      porcentaje: 96,
      totalEvaluados: isTransportista ? 32 : 19,
      totalConformes: isTransportista ? 31 : 18,
      totalNoConformes: 1,
      fechaEvaluacion: new Date().toISOString(),
    },
    alertas: {
      totalCriticas: 1,
      totalAdvertencias: 3,
      lista: [],
      disEnTransitoCount: isTransportista ? 4 : 2,
      disDiscrepanciaCount: 1,
      disSinContratoCount: 0,
      disTratamientoNoAutorizadoCount: 0,
      contratosCaducadosCount: 0,
      contratosPorVencerCount: 2,
      autorizacionesPorVencerCount: 0,
    },
    residuos: {
      totalToneladas: isTransportista ? 148.5 : 86.4,
      toneladasPeligrosas: isTransportista ? 24.2 : 12.8,
      toneladasNoPeligrosas: isTransportista ? 124.3 : 73.6,
      totalDIs: isTransportista ? 32 : 19,
      disCompletados: isTransportista ? 28 : 17,
      topLER: [
        {
          codigo_ler: '17 04 05',
          descripcion: 'Hierro y acero (chatarra férrica)',
          toneladas: 42.6,
          porcentaje: 49.3,
          peligroso: false,
        },
        {
          codigo_ler: '15 01 01',
          descripcion: 'Envases de papel y cartón',
          toneladas: 21.4,
          porcentaje: 24.8,
          peligroso: false,
        },
        {
          codigo_ler: '13 02 08*',
          descripcion: 'Otros aceites de motor y lubricantes',
          toneladas: 12.8,
          porcentaje: 14.8,
          peligroso: true,
        },
        {
          codigo_ler: '20 01 39',
          descripcion: 'Plásticos industriales recuperables',
          toneladas: 9.6,
          porcentaje: 11.1,
          peligroso: false,
        },
      ],
    },
    comercial: {
      totalOperaciones: isNegociante ? 24 : 11,
      operacionesAbiertas: isNegociante ? 5 : 2,
      facturacionVenta: isNegociante ? 48750.0 : 18420.0,
      costesTotales: isNegociante ? 36180.0 : 14100.0,
      margenBrutoTotal: isNegociante ? 12570.0 : 4320.0,
      margenMedioTon: isNegociante ? 145.49 : 50.0,
      rentabilidadPorcentaje: isNegociante ? 25.8 : 23.4,
    },
  };

  const monthlyData = [
    { name: 'Ene', value: 11.2 },
    { name: 'Feb', value: 14.8 },
    { name: 'Mar', value: 12.5 },
    { name: 'Abr', value: 16.9 },
    { name: 'May', value: 15.1 },
    { name: 'Jun', value: 15.9 },
  ];

  const recentDIs: DemoRecentDI[] = [
    {
      id: 'demo-1',
      numero_documento: 'DI-2026-00041',
      estado_traslado: 'en_transito',
      productor_razon_social: 'Industrias Metálicas del Sur S.L.',
      gestor_razon_social: 'EcoValoración Andaluza S.A.',
      fecha_documento: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      numero_documento: 'DI-2026-00040',
      estado_traslado: 'aceptado',
      productor_razon_social: 'Logística & Embalajes Sevilla',
      gestor_razon_social: 'Recuperaciones Ibéricas S.L.',
      fecha_documento: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'demo-3',
      numero_documento: 'DI-2026-00039',
      estado_traslado: 'recepcionado',
      productor_razon_social: 'Talleres Mecánicos Bahía',
      gestor_razon_social: 'Gestor Autorizado RP Centro',
      fecha_documento: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  return { overview, monthlyData, recentDIs };
}
