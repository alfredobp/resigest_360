import { checkCompanyPremiumFeature } from '@/lib/auth/premiumGate';

describe('premiumGate', () => {
  it('returns active when company has active premium feature', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            plan_tier: 'premium',
            premium_features: ['transporte_pwa_evidencias'],
            modulos_activos: [],
          },
        }),
      }),
    };

    const res = await checkCompanyPremiumFeature(
      mockSupabase as never,
      { companyId: 10, userId: 'u1' },
      'transporte_pwa_evidencias'
    );
    expect(res.active).toBe(true);
    expect(res.status).toBe('premium');

    const resByUser = await checkCompanyPremiumFeature(
      mockSupabase as never,
      { companyId: null, userId: 'u1' },
      'transporte_pwa_evidencias'
    );
    expect(resByUser.active).toBe(true);
  });

  it('returns inactive on missing data or thrown error', async () => {
    const mockSupabase = {
      from: jest.fn().mockImplementation(() => {
        throw new Error('DB down');
      }),
    };

    const res = await checkCompanyPremiumFeature(
      mockSupabase as never,
      { companyId: null, userId: 'u1' },
      'transporte_pwa_evidencias'
    );
    expect(res.active).toBe(false);
    expect(res.status).toBe('basic');
  });
});
