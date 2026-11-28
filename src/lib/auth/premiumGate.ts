import type { SupabaseClient } from '@supabase/supabase-js';
import {
  evaluateCompanyPremiumFeature,
  type PremiumEvaluation,
  type PremiumFeatureKey,
} from '@/lib/auth/premiumAccess';

/**
 * Comprueba en servidor (API Routes) si la empresa tiene activa la modalidad Premium indicada.
 */
export async function checkCompanyPremiumFeature(
  supabase: SupabaseClient,
  scope: { companyId?: number | null; userId: string },
  feature: PremiumFeatureKey
): Promise<PremiumEvaluation> {
  try {
    const query = supabase
      .from('companies')
      .select('plan_tier, premium_features, modulos_activos, trial_ends_at, premium_expires_at');

    const { data } = scope.companyId
      ? await query.eq('id', scope.companyId).maybeSingle()
      : await query.eq('user_id', scope.userId).eq('is_my_company', true).maybeSingle();

    return evaluateCompanyPremiumFeature(data, feature);
  } catch {
    return {
      active: false,
      status: 'basic',
      validUntil: null,
      daysRemaining: null,
      showExpiringWarning: false,
    };
  }
}
