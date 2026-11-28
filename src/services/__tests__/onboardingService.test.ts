const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    updateUser: jest.fn(),
  },
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

const mockGetUserCompany = jest.fn();
jest.mock('@/services/companyService', () => ({
  companyService: {
    getUserCompany: (...args: unknown[]) => mockGetUserCompany(...args),
  },
}));

import {
  onboardingService,
  isValidCompanyRole,
  readCachedOnboardingState,
  writeCachedOnboardingState,
} from '../onboardingService';

describe('onboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Simular localStorage en entorno node
    const store: Record<string, string> = {};
    (global as unknown as { window?: unknown }).window = {
      localStorage: {
        getItem: jest.fn((key: string) => store[key] ?? null),
        setItem: jest.fn((key: string, val: string) => {
          store[key] = val;
        }),
      },
    };
  });

  afterEach(() => {
    delete (global as unknown as { window?: unknown }).window;
  });

  describe('isValidCompanyRole', () => {
    it('valida roles de empresa permitidos', () => {
      expect(isValidCompanyRole('transportista')).toBe(true);
      expect(isValidCompanyRole('productor')).toBe(true);
      expect(isValidCompanyRole('negociante')).toBe(true);
      expect(isValidCompanyRole('invalid')).toBe(false);
      expect(isValidCompanyRole(123)).toBe(false);
    });
  });

  describe('caché localStorage', () => {
    it('devuelve null si no existe window o si el JSON es inválido', () => {
      (global as unknown as { window: { localStorage: { getItem: jest.Mock } } }).window.localStorage.getItem.mockReturnValue('{bad json');
      expect(readCachedOnboardingState()).toBeNull();

      delete (global as unknown as { window?: unknown }).window;
      expect(readCachedOnboardingState()).toBeNull();
      expect(() => writeCachedOnboardingState({ completed: true })).not.toThrow();
    });

    it('escribe y lee el estado cacheado correctamente', () => {
      writeCachedOnboardingState({ completed: true, role: 'productor' });
      expect(readCachedOnboardingState()).toEqual({
        completed: true,
        role: 'productor',
      });
    });
  });

  describe('getOnboardingState', () => {
    it('lanza error si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(onboardingService.getOnboardingState()).rejects.toThrow('Usuario no autenticado');
    });

    it('prioriza tipo_empresa de Mi Empresa sobre user_metadata', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'u-1',
            user_metadata: { onboarding_completed: true, onboarding_role: 'productor' },
          },
        },
        error: null,
      });
      mockGetUserCompany.mockResolvedValue({ id: 1, tipo_empresa: 'transportista' });

      const state = await onboardingService.getOnboardingState();
      expect(state).toEqual({
        completed: true,
        role: 'transportista',
        hasCompany: true,
      });
    });

    it('usa user_metadata cuando el usuario no tiene empresa creada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'u-2',
            user_metadata: { onboarding_completed: false, onboarding_role: 'negociante' },
          },
        },
        error: null,
      });
      mockGetUserCompany.mockResolvedValue(null);

      const state = await onboardingService.getOnboardingState();
      expect(state).toEqual({
        completed: false,
        role: 'negociante',
        hasCompany: false,
      });
    });

    it('continúa funcionando aunque companyService falle', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'u-3',
            user_metadata: {},
          },
        },
        error: null,
      });
      mockGetUserCompany.mockRejectedValue(new Error('DB error'));

      const state = await onboardingService.getOnboardingState();
      expect(state).toEqual({
        completed: false,
        role: null,
        hasCompany: false,
      });
    });
  });

  describe('saveOnboardingRole', () => {
    it('rechaza un rol inválido', async () => {
      await expect(
        onboardingService.saveOnboardingRole('inexistente' as unknown as 'productor')
      ).rejects.toThrow('Rol no válido');
    });

    it('guarda el rol en Supabase Auth y caché', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      await onboardingService.saveOnboardingRole('transportista');

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { onboarding_role: 'transportista' },
      });
      expect(readCachedOnboardingState()?.role).toBe('transportista');
    });

    it('lanza error si Supabase updateUser falla', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Auth failure' },
      });

      await expect(onboardingService.saveOnboardingRole('productor')).rejects.toThrow(
        'Error al guardar rol de onboarding: Auth failure'
      );
    });
  });

  describe('markOnboardingCompleted', () => {
    it('marca onboarding_completed=true y actualiza el rol si se proporciona', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      await onboardingService.markOnboardingCompleted('negociante');

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { onboarding_completed: true, onboarding_role: 'negociante' },
      });
      expect(readCachedOnboardingState()).toEqual({
        completed: true,
        role: 'negociante',
      });
    });

    it('lanza error si updateUser devuelve error', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Network error' },
      });

      await expect(onboardingService.markOnboardingCompleted()).rejects.toThrow(
        'Error al finalizar onboarding: Network error'
      );
    });
  });
});
