import type { AppModule, CompanyRole, MembershipRole, OperationalProfile } from '@/types/wasteManagement';

export interface ProfileDefinition {
  id: OperationalProfile;
  label: string;
  shortLabel: string;
  description: string;
  defaultCompanyType: 'productor' | 'gestor' | 'transportista' | 'negociante' | 'agente';
  defaultRoles: CompanyRole[];
  defaultModules: AppModule[];
  homePath: string;
}

export const ALL_MODULES: AppModule[] = [
  'empresas',
  'contratos',
  'gestores',
  'flota_transporte',
  'di',
  'deca',
  'archivo_cronologico',
  'operaciones_comerciales',
  'memorias_anuales',
  'sira_integraciones',
];

export const MODULE_LABELS: Record<AppModule, string> = {
  empresas: 'Empresas y Contactos',
  contratos: 'Contratos de Tratamiento',
  gestores: 'Gestores de Tratamiento',
  flota_transporte: 'Flota y Transportistas',
  di: 'Documentos de Identificación (DI)',
  deca: 'Control DeCA y Conductor',
  archivo_cronologico: 'Archivo Cronológico',
  operaciones_comerciales: 'Operaciones Comerciales y Báscula',
  memorias_anuales: 'Memorias Anuales',
  sira_integraciones: 'Integraciones SIRA y Auditoría',
};

export const PROFILE_DEFINITIONS: Record<OperationalProfile, ProfileDefinition> = {
  productor: {
    id: 'productor',
    label: 'Productor de Residuos',
    shortLabel: 'Productor',
    description: 'Centros de producción, contratos de tratamiento, retiradas (DI), DeCA y archivo cronológico de productor.',
    defaultCompanyType: 'productor',
    defaultRoles: ['productor'],
    defaultModules: ['empresas', 'contratos', 'di', 'deca', 'archivo_cronologico'],
    homePath: '/app',
  },
  chatarreria: {
    id: 'chatarreria',
    label: 'Chatarrería / Metales',
    shortLabel: 'Chatarrería',
    description: 'Entradas, salidas, báscula de pesajes, existencias, compraventa de materiales, DI y archivo cronológico.',
    defaultCompanyType: 'gestor',
    defaultRoles: ['gestor'],
    defaultModules: ['empresas', 'di', 'deca', 'archivo_cronologico', 'operaciones_comerciales', 'memorias_anuales'],
    homePath: '/app',
  },
  gestor_rp: {
    id: 'gestor_rp',
    label: 'Gestor de Residuos Peligrosos',
    shortLabel: 'Gestor RP',
    description: 'Planta de tratamiento, contratos, autorizaciones, DI, archivo cronológico, SIRA y memorias anuales.',
    defaultCompanyType: 'gestor',
    defaultRoles: ['gestor'],
    defaultModules: ['empresas', 'contratos', 'gestores', 'di', 'deca', 'archivo_cronologico', 'memorias_anuales', 'sira_integraciones'],
    homePath: '/app',
  },
  baterias: {
    id: 'baterias',
    label: 'Gestor / Logística de Baterías y RAEE',
    shortLabel: 'Baterías / RAEE',
    description: 'Trazabilidad de baterías y RAEE, contratos, DI, DeCA, archivo cronológico y memorias anuales.',
    defaultCompanyType: 'gestor',
    defaultRoles: ['gestor'],
    defaultModules: ['empresas', 'contratos', 'di', 'deca', 'archivo_cronologico', 'memorias_anuales'],
    homePath: '/app',
  },
  transportista: {
    id: 'transportista',
    label: 'Transportista de Residuos',
    shortLabel: 'Transportista',
    description: 'Interfaz móvil simplificada para conductores, servicios asignados, flota, traslados en tránsito y DeCA/QR.',
    defaultCompanyType: 'transportista',
    defaultRoles: ['transportista'],
    defaultModules: ['di', 'deca', 'flota_transporte'],
    homePath: '/transporte',
  },
  negociante: {
    id: 'negociante',
    label: 'Negociante / Intermediario Comercial',
    shortLabel: 'Negociante',
    description: 'Operaciones comerciales aisladas, márgenes, compras/ventas, logística, contratos, DI y memorias.',
    defaultCompanyType: 'negociante',
    defaultRoles: ['negociante'],
    defaultModules: ['empresas', 'contratos', 'gestores', 'flota_transporte', 'di', 'deca', 'operaciones_comerciales', 'memorias_anuales'],
    homePath: '/app',
  },
  completo: {
    id: 'completo',
    label: 'Modo Completo Multiactividad',
    shortLabel: 'Completo',
    description: 'Todos los módulos operativos y de consultoría habilitados.',
    defaultCompanyType: 'gestor',
    defaultRoles: ['productor', 'gestor', 'transportista', 'negociante'],
    defaultModules: [...ALL_MODULES],
    homePath: '/app',
  },
};

export const ROUTE_MODULE_RULES: Array<{ prefix: string; module: AppModule }> = [
  { prefix: '/residuos/operaciones', module: 'operaciones_comerciales' },
  { prefix: '/residuos/memorias-anuales', module: 'memorias_anuales' },
  { prefix: '/residuos/integraciones', module: 'sira_integraciones' },
  { prefix: '/residuos/gestores', module: 'gestores' },
  { prefix: '/residuos/transportistas', module: 'flota_transporte' },
  { prefix: '/residuos/contratos', module: 'contratos' },
  { prefix: '/residuos/archivo-cronologico', module: 'archivo_cronologico' },
  { prefix: '/residuos/notificaciones-previas', module: 'di' },
  { prefix: '/residuos/documentos-identificacion', module: 'di' },
  { prefix: '/residuos/deca', module: 'deca' },
  { prefix: '/residuos/empresas', module: 'empresas' },
  { prefix: '/transporte', module: 'flota_transporte' },
];

export const ALWAYS_ALLOWED_AUTHENTICATED_PREFIXES = [
  '/app',
  '/residuos/mi-empresa',
  '/profile',
  '/support',
  '/soporte',
  '/onboarding',
];

export function isValidOperationalProfile(value?: string | null): value is OperationalProfile {
  return Boolean(value && value in PROFILE_DEFINITIONS);
}

/**
 * Resuelve el perfil operativo efectivo a partir del campo explícito o de los campos legados.
 */
export function normalizeOperationalProfile(
  perfilOperativo?: string | null,
  tipoEmpresa?: string | null,
  roles?: string[] | null
): OperationalProfile {
  if (isValidOperationalProfile(perfilOperativo)) {
    return perfilOperativo;
  }

  const safeRoles = Array.isArray(roles) ? roles : [];
  if (safeRoles.includes('negociante') && safeRoles.includes('gestor') && safeRoles.includes('productor')) {
    return 'completo';
  }
  if (safeRoles.includes('negociante') || tipoEmpresa === 'negociante') {
    return 'negociante';
  }
  if (safeRoles.includes('transportista') || tipoEmpresa === 'transportista') {
    return 'transportista';
  }
  if (safeRoles.includes('gestor') || tipoEmpresa === 'gestor') {
    return 'gestor_rp';
  }
  return 'productor';
}

export function getDefaultModulesForProfile(profile: OperationalProfile): AppModule[] {
  return [...PROFILE_DEFINITIONS[profile].defaultModules];
}

export function getHomePathForProfile(profile: OperationalProfile): string {
  return PROFILE_DEFINITIONS[profile].homePath;
}

export function getModuleLabel(module: AppModule): string {
  return MODULE_LABELS[module] || module;
}

/**
 * Calcula los módulos efectivos de una empresa aplicando las restricciones de visibilidad comercial.
 */
export function getEffectiveModules(
  company?: {
    perfil_operativo?: string | null;
    modulos_activos?: string[] | null;
    tipo_empresa?: string | null;
    roles?: string[] | null;
  } | null,
  options?: { canViewCommercial?: boolean }
): AppModule[] {
  if (!company) {
    return [];
  }

  const profile = normalizeOperationalProfile(
    company.perfil_operativo,
    company.tipo_empresa,
    company.roles
  );

  const explicitModules = Array.isArray(company.modulos_activos)
    ? company.modulos_activos.filter((m): m is AppModule => ALL_MODULES.includes(m as AppModule))
    : [];

  const baseModules = explicitModules.length > 0 ? explicitModules : getDefaultModulesForProfile(profile);

  if (options?.canViewCommercial === false) {
    return baseModules.filter((m) => m !== 'operaciones_comerciales');
  }

  return baseModules;
}

/**
 * Devuelve el módulo requerido para una ruta dada o null si no requiere módulo específico.
 */
export function getRequiredModuleForPath(pathname: string): AppModule | null {
  const matched = ROUTE_MODULE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
  return matched ? matched.module : null;
}

/**
 * Determina si un rol de membresía tiene permisos de escritura sobre registros operativos.
 */
export function canWriteWithMembershipRole(
  role?: MembershipRole | null,
  isAdmin = false
): boolean {
  if (isAdmin) return true;
  if (!role) return true;
  return role === 'owner' || role === 'consultor_admin' || role === 'consultor_operador';
}

/**
 * Determina si un rol de membresía puede editar la configuración e identidad de la empresa.
 */
export function canManageCompanyWithMembershipRole(
  role?: MembershipRole | null,
  isAdmin = false
): boolean {
  if (isAdmin) return true;
  if (!role) return true;
  return role === 'owner' || role === 'consultor_admin';
}

/**
 * Identifica si una ruta corresponde exclusivamente a creación o edición de registros.
 */
export function isWriteOnlyPath(pathname: string): boolean {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  return (
    clean.endsWith('/nuevo') ||
    clean.endsWith('/nueva') ||
    clean.endsWith('/editar')
  );
}

/**
 * Determina si un usuario con ciertos módulos activos y rol puede acceder a una ruta concreta.
 */
export function canAccessPath(
  pathname: string,
  modules: AppModule[],
  isAdmin = false,
  options?: {
    membershipRole?: MembershipRole;
    perfilOperativo?: OperationalProfile;
  }
): boolean {
  if (!pathname) return true;
  if (isAdmin) return true;

  if (pathname === '/platform-admin' || pathname.startsWith('/platform-admin/')) {
    return false;
  }

  // Bloquear rutas de creación/edición para usuarios con rol de solo lectura
  if (
    options?.membershipRole &&
    !canWriteWithMembershipRole(options.membershipRole, false) &&
    isWriteOnlyPath(pathname)
  ) {
    return false;
  }

  // Restricciones específicas del perfil transportista: no gestiona Notificaciones Previas (NT) ni emite nuevos DIs
  if (options?.perfilOperativo === 'transportista') {
    if (
      pathname === '/residuos/notificaciones-previas' ||
      pathname.startsWith('/residuos/notificaciones-previas/') ||
      pathname === '/residuos/documentos-identificacion/nuevo'
    ) {
      return false;
    }
  }

  if (
    ALWAYS_ALLOWED_AUTHENTICATED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

  const requiredModule = getRequiredModuleForPath(pathname);
  if (!requiredModule) {
    return true;
  }

  return modules.includes(requiredModule);
}

