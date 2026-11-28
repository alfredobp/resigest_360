import { evaluateCompanyPremiumFeature } from '@/lib/auth/premiumAccess';

describe('premiumAccess', () => {
  const now = new Date('2026-11-28T12:00:00Z');

  it('returns basic inactive when company is null or has no feature', () => {
    expect(evaluateCompanyPremiumFeature(null, 'transporte_pwa_evidencias', now)).toEqual({
      active: false,
      status: 'basic',
      validUntil: null,
      daysRemaining: null,
      showExpiringWarning: false,
    });

    expect(
      evaluateCompanyPremiumFeature({ plan_tier: 'basico', premium_features: [] }, 'transporte_pwa_evidencias', now)
    ).toMatchObject({ active: false, status: 'basic' });
  });

  it('returns active premium without warning when indefinite or > 15 days left', () => {
    const indefinite = evaluateCompanyPremiumFeature(
      { plan_tier: 'premium', premium_features: ['transporte_pwa_evidencias'], premium_expires_at: null },
      'transporte_pwa_evidencias',
      now
    );
    expect(indefinite).toMatchObject({ active: true, status: 'premium', showExpiringWarning: false });

    const farExpiry = evaluateCompanyPremiumFeature(
      {
        plan_tier: 'premium',
        premium_features: ['transporte_pwa_evidencias'],
        premium_expires_at: '2026-12-30T12:00:00Z',
      },
      'transporte_pwa_evidencias',
      now
    );
    expect(farExpiry).toMatchObject({ active: true, status: 'premium', showExpiringWarning: false });
  });

  it('shows warning when <= 15 days remain on trial or premium', () => {
    const trialRes = evaluateCompanyPremiumFeature(
      {
        plan_tier: 'trial',
        premium_features: ['transporte_pwa_evidencias'],
        trial_ends_at: '2026-12-10T12:00:00Z',
      },
      'transporte_pwa_evidencias',
      now
    );
    expect(trialRes).toMatchObject({
      active: true,
      status: 'trial',
      daysRemaining: 12,
      showExpiringWarning: true,
    });

    const premiumExpiring = evaluateCompanyPremiumFeature(
      {
        plan_tier: 'premium',
        premium_features: ['transporte_pwa_evidencias'],
        premium_expires_at: '2026-12-05T12:00:00Z',
      },
      'transporte_pwa_evidencias',
      now
    );
    expect(premiumExpiring).toMatchObject({
      active: true,
      status: 'premium',
      daysRemaining: 7,
      showExpiringWarning: true,
    });
  });

  it('returns expired when trial or premium date has passed', () => {
    const expiredTrial = evaluateCompanyPremiumFeature(
      {
        plan_tier: 'trial',
        premium_features: ['transporte_pwa_evidencias'],
        trial_ends_at: '2026-11-20T12:00:00Z',
      },
      'transporte_pwa_evidencias',
      now
    );
    expect(expiredTrial).toMatchObject({ active: false, status: 'expired', showExpiringWarning: false });

    const expiredPremium = evaluateCompanyPremiumFeature(
      {
        plan_tier: 'premium',
        premium_features: ['transporte_pwa_evidencias'],
        premium_expires_at: '2026-11-20T12:00:00Z',
      },
      'transporte_pwa_evidencias',
      now
    );
    expect(expiredPremium).toMatchObject({ active: false, status: 'expired', showExpiringWarning: false });
  });

  it('supports legacy modulos_activos grant', () => {
    const res = evaluateCompanyPremiumFeature(
      { plan_tier: 'basico', modulos_activos: ['transporte_pwa_evidencias'] },
      'transporte_pwa_evidencias',
      now
    );
    expect(res).toMatchObject({ active: true, status: 'premium', showExpiringWarning: false });
  });
});
