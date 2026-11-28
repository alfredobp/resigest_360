import { createClient } from '@/lib/supabase/client';
import { companyService } from '@/services/companyService';
import type { CompanyRole } from '@/types/wasteManagement';

export interface OnboardingState {
  completed: boolean;
  role: CompanyRole | null;
  hasCompany: boolean;
}

const STORAGE_KEY = 'resigest_onboarding_state';

const VALID_ROLES: CompanyRole[] = [
  'productor',
  'gestor',
  'transportista',
  'negociante',
  'agente',
  'cliente',
  'proveedor',
];

export function isValidCompanyRole(value: unknown): value is CompanyRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as CompanyRole);
}

export function readCachedOnboardingState(): Partial<OnboardingState> | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      completed: Boolean(parsed.completed),
      role: isValidCompanyRole(parsed.role) ? parsed.role : null,
    };
  } catch {
    return null;
  }
}

export function writeCachedOnboardingState(state: Partial<OnboardingState>): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const current = readCachedOnboardingState() || {};
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completed: state.completed ?? current.completed ?? false,
        role: state.role !== undefined ? state.role : (current.role ?? null),
      })
    );
  } catch {
    // Ignorar errores de almacenamiento (modo privado / cuota)
  }
}

export const onboardingService = {
  /**
   * Obtiene el estado actual de onboarding combinando Supabase Auth user_metadata,
   * empresa propia (si existe) y caché localStorage.
   */
  async getOnboardingState(): Promise<OnboardingState> {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Usuario no autenticado');
    }

    const metadata = (user.user_metadata || {}) as Record<string, unknown>;
    const metaCompleted = Boolean(metadata.onboarding_completed);
    const metaRole = isValidCompanyRole(metadata.onboarding_role) ? metadata.onboarding_role : null;

    let companyRole: CompanyRole | null = null;
    let hasCompany = false;

    try {
      const company = await companyService.getUserCompany();
      if (company) {
        hasCompany = true;
        if (isValidCompanyRole(company.tipo_empresa)) {
          companyRole = company.tipo_empresa;
        }
      }
    } catch {
      // Si falla la consulta de empresa, continuamos con metadata/caché
    }

    const cached = readCachedOnboardingState();
    const resolvedRole = companyRole ?? metaRole ?? cached?.role ?? null;
    const resolvedCompleted = metaCompleted || Boolean(cached?.completed);

    writeCachedOnboardingState({
      completed: resolvedCompleted,
      role: resolvedRole,
    });

    return {
      completed: resolvedCompleted,
      role: resolvedRole,
      hasCompany,
    };
  },

  /**
   * Guarda el rol seleccionado en Supabase Auth user_metadata y caché local.
   */
  async saveOnboardingRole(role: CompanyRole): Promise<void> {
    if (!isValidCompanyRole(role)) {
      throw new Error(`Rol no válido: ${String(role)}`);
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { onboarding_role: role },
    });

    if (error) {
      throw new Error(`Error al guardar rol de onboarding: ${error.message}`);
    }

    writeCachedOnboardingState({ role });
  },

  /**
   * Marca el onboarding como completado o saltado en Supabase Auth user_metadata y caché local.
   */
  async markOnboardingCompleted(role?: CompanyRole | null): Promise<void> {
    const supabase = createClient();
    const payload: Record<string, unknown> = {
      onboarding_completed: true,
    };

    if (role && isValidCompanyRole(role)) {
      payload.onboarding_role = role;
    }

    const { error } = await supabase.auth.updateUser({
      data: payload,
    });

    if (error) {
      throw new Error(`Error al finalizar onboarding: ${error.message}`);
    }

    writeCachedOnboardingState({
      completed: true,
      ...(role && isValidCompanyRole(role) ? { role } : {}),
    });
  },
};

export default onboardingService;
