export type PlanTier = 'basico' | 'trial' | 'premium';

export type PremiumFeatureKey = 'transporte_pwa_evidencias';

export const DEFAULT_TRIAL_DAYS_BY_ROLE: Record<string, number> = {
  transportista: 15,
};

export const PREMIUM_FEATURE_LABELS: Record<PremiumFeatureKey, string> = {
  transporte_pwa_evidencias: 'PWA Conductores, Notificaciones Push y Evidencias DeCA',
};

export interface CompanyPremiumFields {
  plan_tier?: PlanTier | string | null;
  premium_features?: unknown;
  modulos_activos?: unknown;
  trial_ends_at?: string | null;
  premium_expires_at?: string | null;
}

export interface PremiumEvaluation {
  active: boolean;
  status: 'premium' | 'trial' | 'expired' | 'basic';
  validUntil: string | null;
  daysRemaining: number | null;
  showExpiringWarning: boolean;
}

function parseFeaturesList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string');
}

function computeDaysRemaining(isoDate: string, now: Date): number {
  const target = new Date(isoDate);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evalúa si una empresa tiene acceso activo a una modalidad/feature Premium.
 * - `showExpiringWarning` es true solo si quedan <= 15 días para expirar (si le quedan >15 días o es ilimitado, es false).
 */
export function evaluateCompanyPremiumFeature(
  company: CompanyPremiumFields | null | undefined,
  feature: PremiumFeatureKey,
  now: Date = new Date()
): PremiumEvaluation {
  if (!company) {
    return {
      active: false,
      status: 'basic',
      validUntil: null,
      daysRemaining: null,
      showExpiringWarning: false,
    };
  }

  const features = parseFeaturesList(company.premium_features);
  const modules = parseFeaturesList(company.modulos_activos);
  const hasFeatureFlag = features.includes(feature) || modules.includes(feature);
  const tier = company.plan_tier || 'basico';

  if (tier === 'premium' && hasFeatureFlag) {
    if (!company.premium_expires_at) {
      return {
        active: true,
        status: 'premium',
        validUntil: null,
        daysRemaining: null,
        showExpiringWarning: false,
      };
    }

    const days = computeDaysRemaining(company.premium_expires_at, now);
    if (days >= 0) {
      return {
        active: true,
        status: 'premium',
        validUntil: company.premium_expires_at,
        daysRemaining: days,
        showExpiringWarning: days <= 15,
      };
    }

    return {
      active: false,
      status: 'expired',
      validUntil: company.premium_expires_at,
      daysRemaining: days,
      showExpiringWarning: false,
    };
  }

  if (tier === 'trial' && hasFeatureFlag && company.trial_ends_at) {
    const days = computeDaysRemaining(company.trial_ends_at, now);
    if (days >= 0) {
      return {
        active: true,
        status: 'trial',
        validUntil: company.trial_ends_at,
        daysRemaining: days,
        showExpiringWarning: days <= 15,
      };
    }

    return {
      active: false,
      status: 'expired',
      validUntil: company.trial_ends_at,
      daysRemaining: days,
      showExpiringWarning: false,
    };
  }

  // Compatibilidad si se asignó el módulo directamente sin cambiar plan_tier
  if (hasFeatureFlag && tier === 'basico') {
    return {
      active: true,
      status: 'premium',
      validUntil: null,
      daysRemaining: null,
      showExpiringWarning: false,
    };
  }

  return {
    active: false,
    status: company.trial_ends_at ? 'expired' : 'basic',
    validUntil: company.trial_ends_at ?? null,
    daysRemaining: null,
    showExpiringWarning: false,
  };
}
