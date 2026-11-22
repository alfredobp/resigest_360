import { createClient } from '@/lib/supabase/client';
import {
  canManageCompanyWithMembershipRole,
  canWriteWithMembershipRole,
  getEffectiveModules,
  getHomePathForProfile,
  getModuleLabel,
  normalizeOperationalProfile,
} from '@/lib/profiles/moduleCatalog';
import type {
  AppModule,
  Company,
  MembershipRole,
  OperationalProfile,
} from '@/types/wasteManagement';

export const ACTIVE_COMPANY_COOKIE = 'resigest_active_company_id';

export interface AccessibleCompany {
  company: Company;
  membershipRole: MembershipRole;
  canViewCommercial: boolean;
  isOwner: boolean;
  expiresAt?: string | null;
}

export interface FullTenantContext {
  userId: string;
  userEmail: string;
  activeCompanyId: number | null;
  activeCompany: Company | null;
  companyIds: number[];
  accessibleCompanies: AccessibleCompany[];
  perfilOperativo: OperationalProfile;
  activeModules: AppModule[];
  membershipRole: MembershipRole;
  canWrite: boolean;
  canManageCompany: boolean;
  canViewCommercial: boolean;
  isDelegated: boolean;
  activeDelegationExpiresAt: string | null;
  isAccountBlocked: boolean;
  blockedReason: string | null;
  hasOwnCompany: boolean;
  hasCompletedOnboarding: boolean;
  isPlatformAdmin: boolean;
  homePath: string;
}

const ADMIN_EMAILS = [
  'alfredobape@gmail.com',
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
  process.env.NOTIFICATION_ADMIN_EMAIL || '',
]
  .filter(Boolean)
  .map((e) => e.toLowerCase().trim());

export function getActiveCompanyCookie(cookieSource?: string): number | null {
  const rawCookie =
    cookieSource !== undefined
      ? cookieSource
      : typeof document !== 'undefined'
        ? document.cookie
        : '';

  if (!rawCookie) return null;
  const match = rawCookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ACTIVE_COMPANY_COOKIE}=`));

  if (!match) return null;
  const rawVal = decodeURIComponent(match.slice(ACTIVE_COMPANY_COOKIE.length + 1));
  const parsed = Number(rawVal);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function setActiveCompanyCookie(companyId: number | null): void {
  if (typeof document === 'undefined') return;
  if (companyId === null) {
    document.cookie = `${ACTIVE_COMPANY_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${ACTIVE_COMPANY_COOKIE}=${encodeURIComponent(String(companyId))}; path=/; max-age=2592000; SameSite=Lax`;
}

export function sanitizeCompanySecrets(
  company: Company | null,
  currentUserId?: string | null,
  membershipRole?: MembershipRole
): Company | null {
  if (!company) return null;
  const isDelegatedOrReadOnly =
    membershipRole === 'lectura' ||
    Boolean(company.user_id && currentUserId && company.user_id !== currentUserId);

  if (!isDelegatedOrReadOnly) {
    return company;
  }

  return {
    ...company,
    sira_password: company.sira_password ? '••••••••' : company.sira_password,
    holded_api_key: company.holded_api_key
      ? `••••${String(company.holded_api_key).slice(-4)}`
      : company.holded_api_key,
  };
}

export function applyTenantScope<T>(
  query: T,
  userId: string,
  activeCompanyId?: number | null
): T {
  const companyId = activeCompanyId !== undefined ? activeCompanyId : getActiveCompanyCookie();
  if (
    companyId &&
    Number.isInteger(companyId) &&
    companyId > 0 &&
    typeof (query as any)?.eq === 'function'
  ) {
    return (query as any).eq('company_id', companyId) as T;
  }
  return (query as any).eq('user_id', userId) as T;
}

/**
 * Aplica alcance multi-actor para Documentos de Identificación (DI):
 * aísla estrictamente por la empresa activa cuando está definida (evitando mezclar registros propios
 * de un admin o consultor con los de una empresa delegada) y permite consultar el DI si la empresa activa
 * interviene como productor (`company_id`), transportista (`transportista_company_id` / `transportista_cif`)
 * o gestor destinatario (`gestor_company_id` / `gestor_cif`) (P1 QA5-I01).
 */
export function applyDITenantScope<T>(
  query: T,
  userId: string,
  activeCompanyId?: number | null,
  activeCompanyCif?: string | null
): T {
  const companyId = activeCompanyId !== undefined ? activeCompanyId : getActiveCompanyCookie();
  const cleanCif = activeCompanyCif ? activeCompanyCif.replace(/[,()'"%\s]/g, '').toUpperCase() : '';
  const hasValidCompanyId = Boolean(companyId && Number.isInteger(companyId) && companyId > 0);
  if (hasValidCompanyId || cleanCif) {
    if (typeof (query as any)?.or === 'function') {
      const clauses: string[] = [];
      if (!hasValidCompanyId) {
        clauses.push(`user_id.eq.${userId}`);
      }
      if (hasValidCompanyId) {
        clauses.push(`company_id.eq.${companyId}`);
        clauses.push(`transportista_company_id.eq.${companyId}`);
        clauses.push(`gestor_company_id.eq.${companyId}`);
      }
      if (cleanCif) {
        clauses.push(`transportista_cif.ilike.${cleanCif}`);
        clauses.push(`gestor_cif.ilike.${cleanCif}`);
      }
      return (query as any).or(clauses.join(',')) as T;
    }
  }
  return (query as any).eq('user_id', userId) as T;
}

export async function resolveTenantContext(
  supabaseClient: any,
  preferredCompanyId?: number | null
): Promise<FullTenantContext> {
  const { data: authData } = await supabaseClient.auth.getUser();
  const user = authData?.user;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  let isPlatformAdmin = ADMIN_EMAILS.includes(userEmail);

  // Comprobar rol en profiles de forma segura
  if (!isPlatformAdmin && typeof supabaseClient.from === 'function') {
    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
        isPlatformAdmin = true;
      }
    } catch {
      // Fallback seguro si no existe profiles en mock o tabla
    }
  }

  let allOwnCompanies: Company[] = [];
  if (typeof supabaseClient.from === 'function') {
    try {
      const { data } = await supabaseClient
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('is_my_company', { ascending: false })
        .order('created_at', { ascending: true });
      if (Array.isArray(data)) {
        allOwnCompanies = data as Company[];
      }
    } catch {
      allOwnCompanies = [];
    }
  }

  const ownCompanies = allOwnCompanies.filter((c) => c.activo !== false);
  const blockedOwnCompanies = allOwnCompanies.filter(
    (c) => c.is_my_company && c.activo === false
  );

  // Filtrar empresas titulares propias (o si solo creó una empresa marcada sin is_my_company)
  const myCompanies = ownCompanies.filter((c) => c.is_my_company);
  const primaryOwnCompanies = myCompanies.length > 0 ? myCompanies : [];

  const accessibleMap = new Map<number, AccessibleCompany>();
  primaryOwnCompanies.forEach((company) => {
    accessibleMap.set(company.id, {
      company,
      membershipRole: 'owner',
      canViewCommercial: true,
      isOwner: true,
    });
  });

  // Membresías de consultoría / delegación (Bloque 2 + caducidad)
  if (typeof supabaseClient.from === 'function') {
    try {
      const { data: memberships } = await supabaseClient
        .from('company_memberships')
        .select('company_id, role, can_view_commercial, expires_at, company:companies(*)')
        .eq('user_id', user.id);

      if (Array.isArray(memberships)) {
        const nowMs = Date.now();
        memberships.forEach((m: any) => {
          const comp = m.company as Company | null;
          if (!comp || comp.activo === false) return;
          if (m.expires_at) {
            const expMs = new Date(m.expires_at).getTime();
            if (Number.isNaN(expMs) || expMs <= nowMs) {
              return;
            }
          }
          if (!accessibleMap.has(comp.id)) {
            const role = (m.role as MembershipRole) || 'consultor_operador';
            accessibleMap.set(comp.id, {
              company: sanitizeCompanySecrets(comp, user.id, role) as Company,
              membershipRole: role,
              canViewCommercial: Boolean(m.can_view_commercial),
              isOwner: comp.user_id === user.id,
              expiresAt: m.expires_at || null,
            });
          }
        });
      }
    } catch {
      // Tabla company_memberships aún no aplicada o no mockeada
    }
  }

  const accessibleCompanies = Array.from(accessibleMap.values());
  const targetId = preferredCompanyId !== undefined ? preferredCompanyId : getActiveCompanyCookie();

  // El administrador de plataforma no es un usuario operativo normal:
  // solo adopta una empresa cuando la selecciona explícitamente (cookie/preferredCompanyId).
  const selectedEntry = isPlatformAdmin
    ? (targetId ? accessibleCompanies.find((item) => item.company.id === targetId) : undefined) || null
    : (targetId ? accessibleCompanies.find((item) => item.company.id === targetId) : undefined) ||
    accessibleCompanies.find((item) => item.isOwner) ||
    accessibleCompanies[0] ||
    null;

  const activeCompany = selectedEntry?.company || null;

  // Sincronizar cookie si apuntaba a una empresa inaccesible o si el usuario no tiene empresas
  if (typeof document !== 'undefined' && targetId) {
    if (activeCompany && activeCompany.id !== targetId) {
      setActiveCompanyCookie(activeCompany.id);
    } else if (!activeCompany) {
      setActiveCompanyCookie(null);
    }
  }

  const isDelegated = Boolean(selectedEntry && !selectedEntry.isOwner);
  const canViewCommercial = selectedEntry ? selectedEntry.canViewCommercial : true;
  const membershipRole: MembershipRole = selectedEntry?.membershipRole || 'owner';
  const effectiveAdminBypass = isPlatformAdmin && !isDelegated;
  const canWrite = canWriteWithMembershipRole(membershipRole, effectiveAdminBypass);
  const canManageCompany = canManageCompanyWithMembershipRole(membershipRole, effectiveAdminBypass);

  const perfilOperativo: OperationalProfile = activeCompany
    ? normalizeOperationalProfile(
      activeCompany.perfil_operativo,
      activeCompany.tipo_empresa,
      activeCompany.roles
    )
    : 'productor';

  const activeModules = activeCompany
    ? getEffectiveModules(activeCompany, { canViewCommercial })
    : [];

  const hasOwnCompany = primaryOwnCompanies.length > 0;
  const isAccountBlocked =
    !isPlatformAdmin && accessibleCompanies.length === 0 && blockedOwnCompanies.length > 0;
  const blockedReason = isAccountBlocked
    ? ((blockedOwnCompanies[0] as any)?.blocked_reason as string | null) || null
    : null;
  const hasCompletedOnboarding = Boolean(
    isPlatformAdmin ||
    isAccountBlocked ||
    (activeCompany && (activeCompany.onboarding_completado || accessibleCompanies.length > 0))
  );
  const homePath =
    isPlatformAdmin && !activeCompany
      ? '/platform-admin'
      : getHomePathForProfile(perfilOperativo);

  return {
    userId: user.id,
    userEmail,
    activeCompanyId: activeCompany?.id ?? null,
    activeCompany,
    companyIds: Array.from(
      new Set([
        ...ownCompanies.map((c) => c.id),
        ...accessibleCompanies.map((a) => a.company.id),
      ])
    ),
    accessibleCompanies,
    perfilOperativo,
    activeModules,
    membershipRole,
    canWrite: isAccountBlocked ? false : canWrite,
    canManageCompany: isAccountBlocked ? false : canManageCompany,
    canViewCommercial,
    isDelegated,
    activeDelegationExpiresAt: selectedEntry?.expiresAt ?? null,
    isAccountBlocked,
    blockedReason,
    hasOwnCompany,
    hasCompletedOnboarding,
    isPlatformAdmin,
    homePath,
  };
}

export const tenantContextService = {
  async getTenantContext(preferredCompanyId?: number | null): Promise<FullTenantContext> {
    const supabase = createClient();
    return resolveTenantContext(supabase, preferredCompanyId);
  },

  async assertModuleAccess(module: AppModule, preferredCompanyId?: number | null): Promise<FullTenantContext> {
    const ctx = await this.getTenantContext(preferredCompanyId);
    const hasAdminBypass = ctx.isPlatformAdmin && !ctx.isDelegated;
    if (!hasAdminBypass && ctx.activeCompany && !ctx.activeModules.includes(module)) {
      throw new Error(
        `Acceso denegado: el módulo "${getModuleLabel(module)}" no está habilitado para la empresa activa.`
      );
    }
    return ctx;
  },

  async assertWriteAccess(preferredCompanyId?: number | null): Promise<FullTenantContext> {
    const ctx = await this.getTenantContext(preferredCompanyId);
    if (!ctx.canWrite) {
      throw new Error(
        'Acceso denegado: tu rol de solo lectura no permite crear, modificar ni eliminar registros.'
      );
    }
    return ctx;
  },

  setActiveCompany(companyId: number | null): void {
    setActiveCompanyCookie(companyId);
  },
};

export default tenantContextService;

