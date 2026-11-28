import type { Side, Alignment } from 'driver.js';
import type { CompanyRole } from '@/types/wasteManagement';

export interface OnboardingTourStep {
  id: string;
  route: string;
  element: string;
  popover: {
    title: string;
    description: string;
    side?: Side;
    align?: Alignment;
  };
}

export interface RoleOptionMeta {
  role: CompanyRole;
  label: string;
  description: string;
  isPilot: boolean;
}

export const ONBOARDING_ROLE_OPTIONS: RoleOptionMeta[] = [
  {
    role: 'transportista',
    label: 'Transportista',
    description: 'Gestión de flota, vehículos, control DeCA en tránsito, DIs y envíos SIRA.',
    isPilot: true,
  },
  {
    role: 'productor',
    label: 'Productor de Residuos',
    description: 'Perfil de empresa, contratos, DIs/NT, SIRA y Archivo Cronológico.',
    isPilot: true,
  },
  {
    role: 'negociante',
    label: 'Negociante / Intermediario',
    description: 'Operaciones comerciales, directorio, márgenes, contratos, DIs/NT y SIRA.',
    isPilot: true,
  },
  // TODO: Completar experiencia y pasos específicos de piloto para Gestor, Agente, Cliente y Proveedor.
  {
    role: 'gestor',
    label: 'Gestor de Residuos',
    description: 'Planta de tratamiento, SIRA, memorias anuales y control documental (tour base).',
    isPilot: false,
  },
  {
    role: 'agente',
    label: 'Agente',
    description: 'Intermediación por cuenta de terceros y seguimiento documental (tour base).',
    isPilot: false,
  },
];

const REPLAY_TIP_STEP: OnboardingTourStep = {
  id: 'user-menu-replay',
  route: '/app',
  element: '[data-tour="user-menu-trigger"]',
  popover: {
    title: 'Tu menú y repetición del tour',
    description:
      'Desde aquí puedes acceder a tu perfil, configuración y volver a lanzar este tour guiado siempre que lo necesites.',
    side: 'bottom',
    align: 'end',
  },
};

const SHARED_COMPANY_PROFILE_STEPS: OnboardingTourStep[] = [
  {
    id: 'mi-empresa-perfil',
    route: '/residuos/mi-empresa',
    element: '[data-tour="mi-empresa-tipo"]',
    popover: {
      title: 'Configura el perfil de tu empresa',
      description:
        'Selecciona el tipo de empresa (Productor, Transportista, Negociante, Gestor o Agente) y completa tu CIF, NIMA y número de inscripción para operar legalmente.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    id: 'mi-empresa-sira',
    route: '/residuos/mi-empresa',
    element: '[data-tour="mi-empresa-sira"]',
    popover: {
      title: 'Conexión SIRA (Junta de Andalucía)',
      description:
        'SIRA es la plataforma oficial de la Junta de Andalucía. Activa aquí tus credenciales Web Service (Usuario y Contraseña WS) para enviar Documentos de Identificación (DI) firmados mediante protocolo cifrado E3L.',
      side: 'top',
      align: 'start',
    },
  },
];

const SHARED_DI_NT_STEPS: OnboardingTourStep[] = [
  {
    id: 'di-listado',
    route: '/residuos/documentos-identificacion',
    element: '[data-tour="di-header"]',
    popover: {
      title: 'Documentos de Identificación (DI)',
      description:
        'Consulta tus traslados activos, filtra por estado (En Tránsito, En Báscula, Aceptados o Incidencias) y accede al detalle de cada DI.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    id: 'di-nuevo-perspectiva',
    route: '/residuos/documentos-identificacion/nuevo',
    element: '[data-tour="di-nuevo-perspectiva"]',
    popover: {
      title: 'Crear un nuevo DI (RD 553/2020)',
      description:
        'Al entrar en un nuevo DI, elige primero si lo emites como Productor/Poseedor o como Gestor Receptor para autorrellenar los datos de tu empresa.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    id: 'di-nuevo-datos-nt',
    route: '/residuos/documentos-identificacion/nuevo',
    element: '[data-tour="di-nuevo-datos"]',
    popover: {
      title: 'Datos del Documento y Notificación de Traslado (NT)',
      description:
        'Asigna el número de DI, centro de origen y contrato de tratamiento. Cuando el traslado requiere Notificación Previa de Traslado (NT) según normativa (residuos peligrosos o traslado entre CCAA), aquí queda vinculado al expediente oficial.',
      side: 'top',
      align: 'start',
    },
  },
  {
    id: 'di-nuevo-sira',
    route: '/residuos/documentos-identificacion/nuevo',
    element: '[data-tour="di-nuevo-sira-transportista"]',
    popover: {
      title: 'Campos obligatorios para envío a SIRA',
      description:
        'Los datos del transportista (NIMA, matrícula y dirección) son validados automáticamente antes de transmitir el DI a SIRA sin rechazos.',
      side: 'top',
      align: 'start',
    },
  },
  {
    id: 'integraciones-sira',
    route: '/residuos/integraciones',
    element: '[data-tour="integraciones-sira"]',
    popover: {
      title: 'Monitorización y reintentos SIRA / E3L',
      description:
        'En Integraciones y Auditoría puedes revisar la tasa de éxito de tus envíos telemáticos a SIRA, inspeccionar el XML E3L y reintentar envíos si fuera necesario.',
      side: 'bottom',
      align: 'start',
    },
  },
];

const BASE_FALLBACK_STEPS: OnboardingTourStep[] = [
  {
    id: 'dashboard-welcome',
    route: '/app',
    element: '[data-tour="dashboard-header"]',
    popover: {
      title: 'Centro de Control Ejecutivo',
      description:
        'Aquí tienes una visión general de alertas normativas, traslados activos y actividad reciente de tu empresa.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    id: 'sidebar-nav',
    route: '/app',
    element: '[data-tour="sidebar-nav"]',
    popover: {
      title: 'Menú de navegación',
      description:
        'Accede rápidamente a todos los módulos de ResiGest 360 desde la barra lateral.',
      side: 'right',
      align: 'start',
    },
  },
  ...SHARED_COMPANY_PROFILE_STEPS,
  REPLAY_TIP_STEP,
];

/**
 * Registro centralizado de tours por rol.
 * IMPORTANTE: Cada vez que se añada una nueva feature o módulo en ResiGest 360,
 * se debe actualizar este registro con los pasos correspondientes para los roles afectados.
 */
export const ONBOARDING_TOURS: Record<CompanyRole, OnboardingTourStep[]> = {
  transportista: [
    {
      id: 'transportista-dashboard',
      route: '/app',
      element: '[data-tour="dashboard-header"]',
      popover: {
        title: 'Bienvenido al modo Transportista',
        description:
          'Desde el Centro de Control supervisarás tus traslados en curso, alertas de documentación y avisos urgentes.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      id: 'transportista-sidebar',
      route: '/app',
      element: '[data-tour="sidebar-nav"]',
      popover: {
        title: 'Tus módulos principales',
        description:
          'En el menú lateral tienes acceso directo a Mi Empresa, Transportistas, Control DeCA, Documentos de Identificación e Integraciones SIRA.',
        side: 'right',
        align: 'start',
      },
    },
    ...SHARED_COMPANY_PROFILE_STEPS,
    {
      id: 'transportista-flota',
      route: '/residuos/flota',
      element: '[data-tour="flota-header"]',
      popover: {
        title: 'Mi Flota y Conductores',
        description:
        'Da de alta vehículos propios (tractoras, remolques, cisternas), conductores y controla vencimientos de ITV, Seguro y ADR.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      id: 'transportista-deca',
      route: '/residuos/deca',
      element: '[data-tour="deca-header"]',
      popover: {
        title: 'Control DeCA en tránsito',
        description:
          'Genera hojas de ruta DeCA, consulta códigos QR para conductores y controla las entregas en tiempo real.',
        side: 'bottom',
        align: 'start',
      },
    },
    ...SHARED_DI_NT_STEPS,
    {
      id: 'transportista-calendario',
      route: '/residuos/calendario',
      element: '[data-tour="calendario-header"]',
      popover: {
        title: 'Calendario Operativo',
        description:
          'Visualiza en formato calendario tus traslados DI, NTs, portes DeCA, caducidades de contratos, ITV, seguros y ADR/CAP.',
        side: 'bottom',
        align: 'start',
      },
    },
    REPLAY_TIP_STEP,
  ],

  productor: [
    {
      id: 'productor-dashboard',
      route: '/app',
      element: '[data-tour="dashboard-header"]',
      popover: {
        title: 'Bienvenido al modo Productor',
        description:
          'Controla tus retiradas de residuos, contratos próximos a vencer y el cumplimiento de la Ley 7/2022.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      id: 'productor-quick-actions',
      route: '/app',
      element: '[data-tour="dashboard-quick-actions"]',
      popover: {
        title: 'Acciones rápidas',
        description:
          'Crea un nuevo traslado (DI) o consulta tu Archivo Cronológico con un solo clic.',
        side: 'bottom',
        align: 'end',
      },
    },
    ...SHARED_COMPANY_PROFILE_STEPS,
    {
      id: 'productor-contratos',
      route: '/residuos/contratos',
      element: '[data-tour="contratos-header"]',
      popover: {
        title: 'Contratos de Tratamiento',
        description:
          'Gestiona tus contratos vigentes con gestores autorizados y solicita firmas digitales.',
        side: 'bottom',
        align: 'start',
      },
    },
    ...SHARED_DI_NT_STEPS,
    {
      id: 'productor-archivo',
      route: '/residuos/archivo-cronologico',
      element: '[data-tour="archivo-header"]',
      popover: {
        title: 'Archivo Cronológico Obligatorio',
        description:
          'Todos tus movimientos quedan registrados automáticamente para auditorías e inspecciones.',
        side: 'bottom',
        align: 'start',
      },
    },
    REPLAY_TIP_STEP,
  ],

  negociante: [
    {
      id: 'negociante-dashboard',
      route: '/app',
      element: '[data-tour="dashboard-header"]',
      popover: {
        title: 'Bienvenido al modo Negociante',
        description:
          'Supervisa en tiempo real tus operaciones de intermediación, márgenes comerciales y alertas documentales.',
        side: 'bottom',
        align: 'start',
      },
    },
    ...SHARED_COMPANY_PROFILE_STEPS,
    {
      id: 'negociante-empresas',
      route: '/residuos/empresas',
      element: '[data-tour="empresas-header"]',
      popover: {
        title: 'Directorio de Empresas y Contactos',
        description:
          'Centraliza productores, gestores finales y clientes con los que operas habitualmente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      id: 'negociante-operaciones',
      route: '/residuos/operaciones',
      element: '[data-tour="operaciones-header"]',
      popover: {
        title: 'Operaciones Comerciales',
        description:
          'Registra compras, ventas, costes logísticos y controla la rentabilidad por tonelada.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      id: 'negociante-contratos',
      route: '/residuos/contratos',
      element: '[data-tour="contratos-header"]',
      popover: {
        title: 'Contratos y Trazabilidad',
        description:
          'Asegura que cada operación cuenta con contrato de tratamiento antes de emitir los traslados.',
        side: 'bottom',
        align: 'start',
      },
    },
    ...SHARED_DI_NT_STEPS,
    {
      id: 'transportista-calendario',
      route: '/residuos/calendario',
      element: '[data-tour="calendario-header"]',
      popover: {
        title: 'Calendario Operativo',
        description:
          'Visualiza en formato calendario tus traslados DI, NTs, portes DeCA, caducidades de contratos, ITV, seguros y ADR/CAP.',
        side: 'bottom',
        align: 'start',
      },
    },
    REPLAY_TIP_STEP,
  ],

  // TODO: Definir pasos específicos para 'gestor' tras el piloto (SIRA, Memorias Anuales, Recepción en Planta).
  gestor: BASE_FALLBACK_STEPS,
  // TODO: Definir pasos específicos para 'agente' tras el piloto.
  agente: BASE_FALLBACK_STEPS,
  // TODO: Definir pasos específicos para 'cliente' tras el piloto.
  cliente: BASE_FALLBACK_STEPS,
  // TODO: Definir pasos específicos para 'proveedor' tras el piloto.
  proveedor: BASE_FALLBACK_STEPS,
};

export function getTourStepsForRole(role?: CompanyRole | null): OnboardingTourStep[] {
  if (!role || !ONBOARDING_TOURS[role]) {
    return BASE_FALLBACK_STEPS;
  }
  return ONBOARDING_TOURS[role];
}
