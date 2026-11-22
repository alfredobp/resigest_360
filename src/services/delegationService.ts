// ==============================================================================
// RESIGEST 360 - SERVICIO DE DELEGACIÓN EXPLÍCITA CON CONSENTIMIENTO Y CADUCIDAD
// ==============================================================================

import { createClient } from '@/lib/supabase/client';
import { getActiveCompanyCookie, setActiveCompanyCookie } from './tenantContextService';
import type {
  CompanyDelegationRecord,
  GrantDelegationInput,
  MembershipRole,
} from '@/types/wasteManagement';

export const DELEGATION_TERMS_VERSION = '2026-11-v1';

export const PILOT_DELEGATE_EMAIL = (
  process.env.NEXT_PUBLIC_DELEGATE_ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  'admin@resigest.com'
)
  .toLowerCase()
  .trim();

const ALLOWED_DELEGATION_ROLES: Array<Exclude<MembershipRole, 'owner'>> = [
  'consultor_admin',
  'consultor_operador',
  'lectura',
];

/**
 * Determina si una delegación está vigente en el instante dado.
 */
export function isDelegationActive(
  expiresAt?: string | null,
  referenceDate: Date = new Date()
): boolean {
  if (!expiresAt) return true;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() > referenceDate.getTime();
}

/**
 * Calcula una fecha ISO de caducidad a partir de un número de días desde ahora.
 */
export function computeDelegationExpiryIso(days: number, fromDate: Date = new Date()): string {
  const safeDays = Math.max(1, Math.floor(days));
  const target = new Date(fromDate.getTime() + safeDays * 24 * 60 * 60 * 1000);
  return target.toISOString();
}

/**
 * Valida la solicitud de concesión de delegación antes de invocar la RPC.
 */
export function validateDelegationPayload(
  input: GrantDelegationInput,
  options?: { requireTermsAcceptance?: boolean; requireReason?: boolean }
): void {
  if (!Number.isInteger(input.companyId) || input.companyId <= 0) {
    throw new Error('Identificador de empresa inválido para la delegación.');
  }

  if (!ALLOWED_DELEGATION_ROLES.includes(input.role)) {
    throw new Error('Rol de delegación no permitido.');
  }

  if (!input.expiresAt) {
    throw new Error('Debes indicar una fecha de caducidad para la delegación.');
  }

  const parsedExpiry = new Date(input.expiresAt);
  if (Number.isNaN(parsedExpiry.getTime()) || parsedExpiry.getTime() <= Date.now()) {
    throw new Error('La fecha de caducidad debe ser posterior a la fecha y hora actuales.');
  }

  if (options?.requireTermsAcceptance && !input.termsAccepted) {
    throw new Error(
      'Debes aceptar expresamente las condiciones legales de delegación antes de autorizar el acceso.'
    );
  }

  if (options?.requireReason && !input.reason?.trim()) {
    throw new Error(
      'Debes indicar un motivo o referencia de autorización (p. ej. contrato o ticket de soporte).'
    );
  }
}

export const delegationService = {
  /**
   * Obtiene las delegaciones registradas para una empresa concreta.
   */
  async getCompanyDelegations(companyId: number): Promise<CompanyDelegationRecord[]> {
    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw new Error('Identificador de empresa inválido.');
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase.rpc('get_company_delegations', {
      p_company_id: companyId,
    });

    if (error) {
      throw new Error(`Error al cargar delegaciones de la empresa: ${error.message}`);
    }

    return Array.isArray(data) ? (data as CompanyDelegationRecord[]) : [];
  },

  /**
   * Concede o actualiza la delegación al administrador oficial de la fase piloto.
   */
  async grantPilotDelegation(
    input: GrantDelegationInput,
    options?: { requireTermsAcceptance?: boolean; requireReason?: boolean }
  ): Promise<CompanyDelegationRecord> {
    validateDelegationPayload(input, {
      requireTermsAcceptance: options?.requireTermsAcceptance ?? true,
      requireReason: options?.requireReason ?? false,
    });

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase.rpc('grant_company_delegation', {
      p_company_id: input.companyId,
      p_role: input.role,
      p_can_view_commercial: Boolean(input.canViewCommercial),
      p_expires_at: input.expiresAt,
      p_reason: input.reason?.trim() || null,
      p_terms_accepted: Boolean(input.termsAccepted),
      p_terms_version: input.termsVersion || DELEGATION_TERMS_VERSION,
      p_delegate_email: input.delegateEmail?.trim() || null,
    });

    if (error || !data) {
      throw new Error(`No se pudo autorizar la delegación: ${error?.message || 'Respuesta vacía'}`);
    }

    return data as CompanyDelegationRecord;
  },

  /**
   * Revoca una delegación existente de forma atómica y auditada mediante RPC SECURITY DEFINER.
   * Si la empresa revocada era la activa en la sesión actual, limpia la cookie de contexto.
   */
  async revokeDelegation(companyId: number, delegateUserId?: string): Promise<void> {
    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw new Error('Identificador de empresa inválido.');
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const targetUserId = delegateUserId || user.id;

    const { error } = await supabase.rpc('revoke_company_delegation', {
      p_company_id: companyId,
      p_delegate_user_id: targetUserId,
    });

    if (error) {
      throw new Error(`No se pudo revocar la delegación: ${error.message}`);
    }

    if (targetUserId === user.id && getActiveCompanyCookie() === companyId) {
      setActiveCompanyCookie(null);
    }
  },
};

export default delegationService;
