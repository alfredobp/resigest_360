const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import {
  DELEGATION_TERMS_VERSION,
  computeDelegationExpiryIso,
  delegationService,
  isDelegationActive,
  validateDelegationPayload,
} from '../delegationService';

describe('delegationService - Delegación Explícita con Consentimiento y Caducidad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Helpers de vigencia y validación', () => {
    it('isDelegationActive evalúa fechas futuras, pasadas, nulas e inválidas', () => {
      const ref = new Date('2026-11-22T10:00:00.000Z');
      expect(isDelegationActive(null, ref)).toBe(true);
      expect(isDelegationActive(undefined, ref)).toBe(true);
      expect(isDelegationActive('2026-11-25T10:00:00.000Z', ref)).toBe(true);
      expect(isDelegationActive('2026-11-20T10:00:00.000Z', ref)).toBe(false);
      expect(isDelegationActive('fecha-invalida', ref)).toBe(false);
    });

    it('computeDelegationExpiryIso suma días correctamente con mínimo 1 día', () => {
      const ref = new Date('2026-11-22T10:00:00.000Z');
      expect(computeDelegationExpiryIso(7, ref)).toBe('2026-11-29T10:00:00.000Z');
      expect(computeDelegationExpiryIso(0, ref)).toBe('2026-11-23T10:00:00.000Z');
    });

    it('validateDelegationPayload rechaza entradas inválidas y acepta válidas', () => {
      const futureIso = computeDelegationExpiryIso(10);

      expect(() =>
        validateDelegationPayload({
          companyId: 0,
          role: 'consultor_admin',
          canViewCommercial: false,
          expiresAt: futureIso,
          termsAccepted: true,
        })
      ).toThrow('Identificador de empresa inválido');

      expect(() =>
        validateDelegationPayload({
          companyId: 10,
          role: 'owner' as any,
          canViewCommercial: false,
          expiresAt: futureIso,
          termsAccepted: true,
        })
      ).toThrow('Rol de delegación no permitido');

      expect(() =>
        validateDelegationPayload({
          companyId: 10,
          role: 'consultor_admin',
          canViewCommercial: false,
          expiresAt: '',
          termsAccepted: true,
        })
      ).toThrow('fecha de caducidad');

      expect(() =>
        validateDelegationPayload({
          companyId: 10,
          role: 'consultor_admin',
          canViewCommercial: false,
          expiresAt: '2020-01-01T00:00:00.000Z',
          termsAccepted: true,
        })
      ).toThrow('posterior a la fecha y hora actuales');

      expect(() =>
        validateDelegationPayload(
          {
            companyId: 10,
            role: 'consultor_admin',
            canViewCommercial: false,
            expiresAt: futureIso,
            termsAccepted: false,
          },
          { requireTermsAcceptance: true }
        )
      ).toThrow('aceptar expresamente las condiciones legales');

      expect(() =>
        validateDelegationPayload(
          {
            companyId: 10,
            role: 'consultor_admin',
            canViewCommercial: false,
            expiresAt: futureIso,
            reason: '   ',
          },
          { requireReason: true }
        )
      ).toThrow('motivo o referencia');

      expect(() =>
        validateDelegationPayload(
          {
            companyId: 10,
            role: 'lectura',
            canViewCommercial: false,
            expiresAt: futureIso,
            termsAccepted: true,
            reason: 'Contrato #1',
          },
          { requireTermsAcceptance: true, requireReason: true }
        )
      ).not.toThrow();
    });
  });

  describe('getCompanyDelegations', () => {
    it('falla con companyId inválido o sin usuario autenticado', async () => {
      await expect(delegationService.getCompanyDelegations(0)).rejects.toThrow(
        'Identificador de empresa inválido'
      );

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(delegationService.getCompanyDelegations(10)).rejects.toThrow(
        'Usuario no autenticado'
      );
    });

    it('devuelve las delegaciones de la RPC y propaga errores', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'owner-1', email: 'owner@empresa.es' } },
      });

      const mockRecords = [
        {
          id: 1,
          company_id: 10,
          user_id: 'admin-1',
          delegate_email: 'admin@resigest.com',
          delegate_name: 'Admin ResiGest',
          role: 'consultor_admin',
          can_view_commercial: false,
          expires_at: computeDelegationExpiryIso(7),
        },
      ];
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockRecords, error: null });

      const result = await delegationService.getCompanyDelegations(10);
      expect(result).toEqual(mockRecords);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_company_delegations', {
        p_company_id: 10,
      });

      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      expect(await delegationService.getCompanyDelegations(10)).toEqual([]);

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Acceso denegado' },
      });
      await expect(delegationService.getCompanyDelegations(10)).rejects.toThrow(
        'Error al cargar delegaciones'
      );
    });
  });

  describe('grantPilotDelegation', () => {
    it('exige autenticación y llama a la RPC con todos los parámetros de consentimiento', async () => {
      const futureIso = computeDelegationExpiryIso(30);
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      await expect(
        delegationService.grantPilotDelegation({
          companyId: 10,
          role: 'consultor_admin',
          canViewCommercial: false,
          expiresAt: futureIso,
          termsAccepted: true,
        })
      ).rejects.toThrow('Usuario no autenticado');

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'owner-1', email: 'owner@empresa.es' } },
      });

      const createdRecord = {
        id: 2,
        company_id: 10,
        user_id: 'admin-1',
        delegate_email: 'admin@resigest.com',
        delegate_name: 'Admin ResiGest',
        role: 'consultor_operador',
        can_view_commercial: true,
        expires_at: futureIso,
        terms_version: DELEGATION_TERMS_VERSION,
      };
      mockSupabase.rpc.mockResolvedValueOnce({ data: createdRecord, error: null });

      const res = await delegationService.grantPilotDelegation({
        companyId: 10,
        role: 'consultor_operador',
        canViewCommercial: true,
        expiresAt: futureIso,
        termsAccepted: true,
        reason: 'Soporte piloto',
      });

      expect(res).toEqual(createdRecord);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('grant_company_delegation', {
        p_company_id: 10,
        p_role: 'consultor_operador',
        p_can_view_commercial: true,
        p_expires_at: futureIso,
        p_reason: 'Soporte piloto',
        p_terms_accepted: true,
        p_terms_version: DELEGATION_TERMS_VERSION,
        p_delegate_email: null,
      });

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'owner-1', email: 'owner@empresa.es' } },
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'No encontrado' },
      });

      await expect(
        delegationService.grantPilotDelegation({
          companyId: 10,
          role: 'lectura',
          canViewCommercial: false,
          expiresAt: futureIso,
          termsAccepted: true,
        })
      ).rejects.toThrow('No se pudo autorizar la delegación');
    });
  });

  describe('revokeDelegation', () => {
    it('invoca RPC revoke_company_delegation, limpia cookie activa si aplica y maneja errores', async () => {
      await expect(delegationService.revokeDelegation(0)).rejects.toThrow(
        'Identificador de empresa inválido'
      );

      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(delegationService.revokeDelegation(10)).rejects.toThrow(
        'Usuario no autenticado'
      );

      // Revocación por titular
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'owner-1', email: 'owner@empresa.es' } },
      });
      mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });

      await delegationService.revokeDelegation(10, 'admin-1');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('revoke_company_delegation', {
        p_company_id: 10,
        p_delegate_user_id: 'admin-1',
      });

      // Auto-revocación por admin limpia cookie activa si coincide con companyId
      const originalDoc = (global as any).document;
      (global as any).document = { cookie: 'resigest_active_company_id=10' };
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-1', email: 'admin@resigest.com' } },
      });
      mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null });

      await delegationService.revokeDelegation(10);
      expect((global as any).document.cookie).toContain('max-age=0');
      (global as any).document = originalDoc;

      // Fallo en RPC
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'admin-1', email: 'admin@resigest.com' } },
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RLS error' },
      });

      await expect(delegationService.revokeDelegation(10)).rejects.toThrow(
        'No se pudo revocar la delegación: RLS error'
      );
    });
  });
});
