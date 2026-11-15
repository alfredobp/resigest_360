const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import {
  ACTIVE_COMPANY_COOKIE,
  applyTenantScope,
  getActiveCompanyCookie,
  resolveTenantContext,
  sanitizeCompanySecrets,
  setActiveCompanyCookie,
  tenantContextService,
} from '../tenantContextService';

describe('tenantContextService - Contexto Multi-Empresa, Perfiles y Permisos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cookies de empresa activa', () => {
    it('debe parsear correctamente la cookie resigest_active_company_id', () => {
      expect(getActiveCompanyCookie('')).toBeNull();
      expect(getActiveCompanyCookie('otra=1; foo=bar')).toBeNull();
      expect(getActiveCompanyCookie(`${ACTIVE_COMPANY_COOKIE}=42; other=1`)).toBe(42);
      expect(getActiveCompanyCookie(`${ACTIVE_COMPANY_COOKIE}=abc`)).toBeNull();
    });

    it('debe gestionar setActiveCompanyCookie de forma segura en entorno node/browser', () => {
      setActiveCompanyCookie(99);
      const originalDoc = (global as any).document;
      (global as any).document = { cookie: '' };

      setActiveCompanyCookie(77);
      expect((global as any).document.cookie).toContain(`${ACTIVE_COMPANY_COOKIE}=77`);
      expect(getActiveCompanyCookie()).toBe(77);

      setActiveCompanyCookie(null);
      expect((global as any).document.cookie).toContain('max-age=0');

      (global as any).document = originalDoc;
    });
  });

  describe('resolveTenantContext & getTenantContext', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(tenantContextService.getTenantContext()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe resolver un usuario nuevo sin empresas con onboarding pendiente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'uid-new', email: 'nuevo@resigest.test' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'user' } }),
          };
        }
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [] }),
        };
      });

      const ctx = await resolveTenantContext(mockSupabase);
      expect(ctx.hasOwnCompany).toBe(false);
      expect(ctx.hasCompletedOnboarding).toBe(false);
      expect(ctx.activeCompany).toBeNull();
      expect(ctx.isPlatformAdmin).toBe(false);
    });

    it('debe resolver empresa propia, membresías de consultoría y seleccionar la empresa activa', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'uid-consultor', email: 'consultor@metodoambiental.test' } },
      });

      const ownCompany = {
        id: 10,
        user_id: 'uid-consultor',
        razon_social: 'Método Ambiental S.L.',
        tipo_empresa: 'agente',
        is_my_company: true,
        activo: true,
        perfil_operativo: 'gestor_rp',
        onboarding_completado: true,
      };

      const clientCompany = {
        id: 20,
        user_id: 'uid-prod',
        razon_social: 'Productor Cliente S.L.',
        tipo_empresa: 'productor',
        is_my_company: true,
        activo: true,
        perfil_operativo: 'productor',
        modulos_activos: ['di', 'contratos', 'operaciones_comerciales'],
        onboarding_completado: true,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'user' } }),
          };
        }
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [ownCompany] }),
            }),
          };
        }
        if (table === 'company_memberships') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  company_id: 20,
                  role: 'consultor_admin',
                  can_view_commercial: false,
                  company: clientCompany,
                },
              ],
            }),
          };
        }
        return {};
      });

      // Sin cookie preferida -> empresa propia
      const defaultCtx = await tenantContextService.getTenantContext();
      expect(defaultCtx.activeCompanyId).toBe(10);
      expect(defaultCtx.accessibleCompanies).toHaveLength(2);

      // Cambiando a empresa cliente 20 (can_view_commercial = false debe ocultar operaciones_comerciales)
      const switchedCtx = await tenantContextService.getTenantContext(20);
      expect(switchedCtx.activeCompanyId).toBe(20);
      expect(switchedCtx.membershipRole).toBe('consultor_admin');
      expect(switchedCtx.canViewCommercial).toBe(false);
      expect(switchedCtx.activeModules).toEqual(['di', 'contratos']);
      expect(switchedCtx.activeModules).not.toContain('operaciones_comerciales');
    });

    it('debe identificar superadmin por role en profiles y permitir assertModuleAccess', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'uid-admin', email: 'admin@empresa.es' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'superadmin' } }),
          };
        }
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 1,
                    user_id: 'uid-admin',
                    razon_social: 'Admin Corp',
                    is_my_company: true,
                    activo: true,
                    perfil_operativo: 'productor',
                    onboarding_completado: true,
                  },
                ],
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [] }),
        };
      });

      const ctx = await tenantContextService.assertModuleAccess('operaciones_comerciales');
      expect(ctx.isPlatformAdmin).toBe(true);
    });

    it('debe denegar assertModuleAccess si el usuario normal no tiene el módulo habilitado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'uid-prod', email: 'prod@resigest.test' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'user' } }),
          };
        }
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 5,
                    user_id: 'uid-prod',
                    razon_social: 'Productor SA',
                    is_my_company: true,
                    activo: true,
                    perfil_operativo: 'productor',
                    onboarding_completado: true,
                  },
                ],
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [] }),
        };
      });

      await expect(
        tenantContextService.assertModuleAccess('operaciones_comerciales')
      ).rejects.toThrow('Acceso denegado');

      const writeCtx = await tenantContextService.assertWriteAccess();
      expect(writeCtx.canWrite).toBe(true);
      expect(writeCtx.canManageCompany).toBe(true);
    });

    it('debe denegar assertWriteAccess cuando la membresía activa tiene rol lectura', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'uid-reader', email: 'lector@resigest.test' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'user' } }),
          };
        }
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        if (table === 'company_memberships') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  company_id: 50,
                  role: 'lectura',
                  can_view_commercial: false,
                  company: {
                    id: 50,
                    user_id: 'uid-owner',
                    razon_social: 'Cliente Solo Lectura SL',
                    is_my_company: true,
                    activo: true,
                    perfil_operativo: 'productor',
                    onboarding_completado: true,
                  },
                },
              ],
            }),
          };
        }
        return {};
      });

      const ctx = await tenantContextService.getTenantContext(50);
      expect(ctx.membershipRole).toBe('lectura');
      expect(ctx.canWrite).toBe(false);
      expect(ctx.canManageCompany).toBe(false);

      await expect(tenantContextService.assertWriteAccess(50)).rejects.toThrow(
        'tu rol de solo lectura no permite crear'
      );
    });

    it('debe tolerar errores en profiles o company_memberships', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'uid-resilient', email: 'user@resigest.test' } },
      });

      mockSupabase.from.mockImplementation(() => {
        throw new Error('Tabla no existe');
      });

      const ctx = await resolveTenantContext(mockSupabase);
      expect(ctx.userId).toBe('uid-resilient');
      expect(ctx.accessibleCompanies).toEqual([]);
      tenantContextService.setActiveCompany(null);
    });
  });

  describe('sanitizeCompanySecrets y applyTenantScope', () => {
    it('enmascara credenciales SIRA y Holded para usuarios delegados o rol lectura y las conserva para propietarios', () => {
      expect(sanitizeCompanySecrets(null, 'u1')).toBeNull();

      const comp: any = {
        id: 20,
        user_id: 'uid-owner',
        razon_social: 'Cliente S.L.',
        sira_password: 'mi-password-secreto',
        holded_api_key: '1234567890abcdef',
      };

      // Propietario normal conserva credenciales
      expect(sanitizeCompanySecrets(comp, 'uid-owner', 'owner')).toEqual(comp);

      // Consultor / delegado ve credenciales enmascaradas
      const maskedDelegated = sanitizeCompanySecrets(comp, 'uid-consultor', 'consultor_admin');
      expect(maskedDelegated?.sira_password).toBe('••••••••');
      expect(maskedDelegated?.holded_api_key).toBe('••••cdef');

      // Rol lectura incluso si coincidiera user_id también enmascara
      const maskedReadOnly = sanitizeCompanySecrets(comp, 'uid-owner', 'lectura');
      expect(maskedReadOnly?.sira_password).toBe('••••••••');
      expect(maskedReadOnly?.holded_api_key).toBe('••••cdef');

      // Sin credenciales no introduce valores falsos
      const emptyComp: any = { id: 21, user_id: 'uid-owner', sira_password: '', holded_api_key: '' };
      expect(sanitizeCompanySecrets(emptyComp, 'uid-consultor', 'lectura')).toEqual(emptyComp);
    });

    it('aplica .or con empresa activa cuando está soportado o .eq(user_id) como fallback', () => {
      const orMock = jest.fn().mockReturnValue('or-result');
      const eqMock = jest.fn().mockReturnValue('eq-result');
      const queryWithOr = { or: orMock, eq: eqMock };
      const queryWithoutOr = { eq: eqMock };

      expect(applyTenantScope(queryWithOr, 'u-1', 42)).toBe('or-result');
      expect(orMock).toHaveBeenCalledWith('user_id.eq.u-1,company_id.eq.42');

      expect(applyTenantScope(queryWithOr, 'u-1', null)).toBe('eq-result');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'u-1');

      expect(applyTenantScope(queryWithoutOr, 'u-1', 42)).toBe('eq-result');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'u-1');
    });
  });
});

