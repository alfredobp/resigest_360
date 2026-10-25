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

// Setup DOM mocks for exports
if (typeof URL.createObjectURL === 'undefined') {
  (URL as any).createObjectURL = jest.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  (URL as any).revokeObjectURL = jest.fn();
}

if (typeof document === 'undefined') {
  (global as any).document = {
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
    createElement: jest.fn(() => ({
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn(),
    })),
  };
}

import { adminPlatformService } from '../adminPlatformService';
import type { Company, CompanyAuditDetail, PlatformCompanyRecord } from '@/types/wasteManagement';

describe('adminPlatformService - Administración y Auditoría de Plataforma', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkIsAdmin', () => {
    it('debe retornar true si el email está en la lista de administradores predefinidos', async () => {
      const isAdmin = await adminPlatformService.checkIsAdmin('demo@resigest.com', 'user-123');
      expect(isAdmin).toBe(true);
    });

    it('debe retornar false si no se pasan parámetros y no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const isAdmin = await adminPlatformService.checkIsAdmin();
      expect(isAdmin).toBe(false);
    });

    it('debe consultar tabla profiles y retornar true si el rol es admin o superadmin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-admin-db', email: 'custom@empresa.com' } },
      });

      const profileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'superadmin' }, error: null }),
      };
      mockSupabase.from.mockReturnValue(profileChain);

      const isAdmin = await adminPlatformService.checkIsAdmin();
      expect(isAdmin).toBe(true);
      expect(profileChain.eq).toHaveBeenCalledWith('id', 'user-admin-db');
    });

    it('debe soportar paso explícito de email y userId sin consultar supabase.auth', async () => {
      const profileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
      };
      mockSupabase.from.mockReturnValue(profileChain);

      const isAdmin = await adminPlatformService.checkIsAdmin('direct@empresa.com', 'user-direct-id');
      expect(isAdmin).toBe(true);
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
    });

    it('debe retornar false si en profiles tiene otro rol y capturar excepciones', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-regular', email: 'regular@empresa.com' } },
      });

      const profileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockRejectedValue(new Error('Profile query failed')),
      };
      mockSupabase.from.mockReturnValue(profileChain);

      const isAdmin = await adminPlatformService.checkIsAdmin();
      expect(isAdmin).toBe(false);
    });
  });

  describe('getPlatformStats', () => {
    it('debe retornar datos de la función RPC get_platform_stats si está disponible', async () => {
      const mockRpcStats = {
        totalCompanies: 25,
        myCompanies: 2,
        totalUsers: 50,
        totalDIs: 120,
        totalContracts: 30,
        totalCenters: 40,
        totalToneladas: 1500.5,
      };

      mockSupabase.rpc.mockResolvedValue({ data: mockRpcStats, error: null });

      const stats = await adminPlatformService.getPlatformStats();
      expect(stats).toEqual(mockRpcStats);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_platform_stats');
    });

    it('debe ejecutar fallback con consultas paralelas si el RPC falla', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('RPC not found'));

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [{ id: 1, is_my_company: true }, { id: 2, is_my_company: false }],
              count: 2,
              error: null,
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: jest.fn().mockResolvedValue({ count: 5, data: [{}, {}], error: null }),
          };
        }
        if (table === 'identification_documents') {
          return {
            select: jest.fn().mockResolvedValue({
              count: 2,
              data: [{ cantidad: '10.5' }, { cantidad_estimada: '5.5' }],
              error: null,
            }),
          };
        }
        if (table === 'waste_contracts') {
          return { select: jest.fn().mockResolvedValue({ count: 3, data: [], error: null }) };
        }
        if (table === 'production_centers') {
          return { select: jest.fn().mockResolvedValue({ count: 4, data: [], error: null }) };
        }
        return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
      });

      const stats = await adminPlatformService.getPlatformStats();

      expect(stats.totalCompanies).toBe(2);
      expect(stats.myCompanies).toBe(1);
      expect(stats.totalUsers).toBe(5);
      expect(stats.totalDIs).toBe(2);
      expect(stats.totalToneladas).toBe(16); // 10.5 + 5.5
      expect(stats.totalContracts).toBe(3);
      expect(stats.totalCenters).toBe(4);
    });

    it('debe retornar estadísticas en cero si ocurre un fallo catastrófico en las consultas', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC error') });
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database down');
      });

      const stats = await adminPlatformService.getPlatformStats();
      expect(stats.totalCompanies).toBe(0);
      expect(stats.totalToneladas).toBe(0);
    });
  });

  describe('getAllPlatformCompanies', () => {
    it('debe filtrar empresas por type (my/contacts), search textual y roles', async () => {
      const mockCompanies = [
        {
          id: 1,
          razon_social: 'ResiGest Gestora S.L.',
          cif: 'B11223344',
          is_my_company: true,
          user_id: 'usr-1',
          tipo_empresa: 'gestor',
          roles: ['gestor'],
        },
        {
          id: 2,
          razon_social: 'Cantera Norte S.A.',
          cif: 'A55667788',
          is_my_company: false,
          user_id: 'usr-2',
          tipo_empresa: 'productor',
          roles: ['productor'],
        },
      ];

      const compChain: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      compChain.then = (resolve: any) => Promise.resolve({ data: mockCompanies, error: null }).then(resolve);

      const profilesChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            { id: 'usr-1', email: 'admin@resigest.com', first_name: 'Admin', last_name: 'Total' },
            { id: 'usr-2', email: 'cantera@norte.com', first_name: 'Pedro', last_name: 'Pérez' },
          ],
          error: null,
        }),
      };

      const centersChain = {
        select: jest.fn().mockResolvedValue({ data: [{ id: 10, company_id: 1 }], error: null }),
      };
      const disChain = {
        select: jest.fn().mockResolvedValue({ data: [{ id: 20, company_id: 1, gestor_id: 2 }], error: null }),
      };
      const contractsChain = {
        select: jest.fn().mockResolvedValue({ data: [{ id: 30, company_id: 1, gestor_company_id: 2 }], error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return compChain;
        if (table === 'profiles') return profilesChain;
        if (table === 'production_centers') return centersChain;
        if (table === 'identification_documents') return disChain;
        if (table === 'waste_contracts') return contractsChain;
        return null;
      });

      const resAll = await adminPlatformService.getAllPlatformCompanies({
        type: 'my',
        search: 'ResiGest',
        role: 'gestor',
      });

      expect(compChain.eq).toHaveBeenCalledWith('is_my_company', true);
      expect(resAll).toHaveLength(1);
      expect(resAll[0].user_email).toBe('admin@resigest.com');
      expect(resAll[0].user_name).toBe('Admin Total');
      expect(resAll[0].centers_count).toBe(1);
      expect(resAll[0].dis_count).toBe(1);
      expect(resAll[0].contracts_count).toBe(1);
    });

    it('debe manejar usuario autenticado sin email y retornar false si no tiene rol de admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-no-email', email: null } },
      });

      const profileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'operator' }, error: null }),
      };
      mockSupabase.from.mockReturnValue(profileChain);

      const isAdmin = await adminPlatformService.checkIsAdmin();
      expect(isAdmin).toBe(false);
    });

    it('debe filtrar por rol usando fallback de tipo_empresa o productor por defecto', async () => {
      const mockCompanies = [
        {
          id: 10,
          razon_social: 'Empresa Agente',
          roles: [],
          tipo_empresa: 'agente',
        },
        {
          id: 11,
          razon_social: 'Empresa Sin Rol',
          roles: null,
          tipo_empresa: null,
        },
      ];

      const compChain: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      compChain.then = (resolve: any) => Promise.resolve({ data: mockCompanies, error: null }).then(resolve);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return compChain;
        return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
      });

      const agenteRes = await adminPlatformService.getAllPlatformCompanies({ role: 'agente' });
      expect(agenteRes).toHaveLength(1);
      expect(agenteRes[0].id).toBe(10);

      const productorRes = await adminPlatformService.getAllPlatformCompanies({ role: 'productor' });
      expect(productorRes).toHaveLength(1);
      expect(productorRes[0].id).toBe(11);
    });

    it('debe filtrar por type contacts, capturar fallo en profiles y buscar por nombre comercial, nima o municipio', async () => {
      const mockCompanies = [
        {
          id: 3,
          razon_social: 'Cantera Sur S.L.',
          nombre_comercial: 'EcoCantera',
          nima: 'NIMA-3344',
          cif: 'B99001122',
          municipio_social: 'Sevilla',
          provincia_social: 'Sevilla',
          is_my_company: false,
          user_id: 'usr-missing-profile',
          roles: undefined,
          tipo_empresa: undefined,
        },
        {
          id: 4,
          razon_social: 'Chatarrería Este',
          nombre_comercial: '',
          cif: 'B12341234',
          municipio_social: 'Málaga',
          provincia_social: 'Málaga',
          is_my_company: false,
          user_id: null,
          roles: ['transportista'],
        },
      ];

      const compChain: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      compChain.then = (resolve: any) => Promise.resolve({ data: mockCompanies, error: null }).then(resolve);

      const profilesChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockRejectedValue(new Error('Profile fetch warning')),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return compChain;
        if (table === 'profiles') return profilesChain;
        return { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
      });

      const res = await adminPlatformService.getAllPlatformCompanies({
        type: 'contacts',
        search: 'EcoCantera',
      });

      expect(compChain.eq).toHaveBeenCalledWith('is_my_company', false);
      expect(res).toHaveLength(1);
      expect(res[0].user_email).toBe('Desconocido');

      // Buscar por provincia
      const byProv = await adminPlatformService.getAllPlatformCompanies({ search: 'Málaga' });
      expect(byProv).toHaveLength(1);
    });

    it('debe lanzar error si falla la consulta de empresas', async () => {
      const compChain: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      compChain.then = (resolve: any) =>
        Promise.resolve({ data: null, error: new Error('Permission denied') }).then(resolve);
      mockSupabase.from.mockReturnValue(compChain);

      await expect(adminPlatformService.getAllPlatformCompanies()).rejects.toThrow(
        'Error al cargar empresas de la plataforma'
      );
    });
  });

  describe('getCompanyAuditDetail', () => {
    it('debe cargar el expediente completo de la empresa incluyendo centros, DIs, contratos y autorizaciones', async () => {
      const mockCompany: Partial<Company> = {
        id: 50,
        razon_social: 'Empresa Auditada S.A.',
        cif: 'A12349999',
        user_id: 'usr-audit',
      };

      const compChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCompany, error: null }),
      };

      const profChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'usr-audit', email: 'titular@auditada.com' },
          error: null,
        }),
      };

      const centersChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [{ id: 1, nombre: 'Planta Central' }], error: null }),
      };

      const disChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 101, cantidad: 5.5 }, { id: 102, cantidad_estimada: 4.5 }],
          error: null,
        }),
      };

      const contractsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [{ id: 201, numero_contrato: 'CTR-01' }], error: null }),
      };

      const authsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [{ id: 301, numero_autorizacion: 'AUT-01' }], error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return compChain;
        if (table === 'profiles') return profChain;
        if (table === 'production_centers') return centersChain;
        if (table === 'identification_documents') return disChain;
        if (table === 'waste_contracts') return contractsChain;
        if (table === 'environmental_authorizations') return authsChain;
        return null;
      });

      const detail = await adminPlatformService.getCompanyAuditDetail(50);

      expect(detail.company.id).toBe(50);
      expect(detail.userProfile?.email).toBe('titular@auditada.com');
      expect(detail.productionCenters).toHaveLength(1);
      expect(detail.recentDIs).toHaveLength(2);
      expect(detail.contracts).toHaveLength(1);
      expect(detail.authorizations).toHaveLength(1);
      expect(detail.stats.totalTonsEstimated).toBe(10); // 5.5 + 4.5
      expect(detail.stats.totalCenters).toBe(1);
    });

    it('getCompanyAuditDetail debe manejar empresa sin user_id, DIs con cantidades inválidas (NaN) y sin autorizaciones', async () => {
      const mockCompanyNoUser: Partial<Company> = {
        id: 55,
        razon_social: '',
        cif: '',
        user_id: undefined,
      };

      const compChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCompanyNoUser, error: null }),
      };

      const centersChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const disChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 105, cantidad: 'invalido' }],
          error: null,
        }),
      };

      const contractsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const authsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Table not found')),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') return compChain;
        if (table === 'production_centers') return centersChain;
        if (table === 'identification_documents') return disChain;
        if (table === 'waste_contracts') return contractsChain;
        if (table === 'environmental_authorizations') return authsChain;
        return null;
      });

      const detail = await adminPlatformService.getCompanyAuditDetail(55);
      expect(detail.company.id).toBe(55);
      expect(detail.userProfile).toBeNull();
      expect(detail.stats.totalTonsEstimated).toBe(0);

      // Exportar JSON para una empresa con razon_social y cif vacíos
      expect(() => adminPlatformService.exportCompanyDataJSON(detail)).not.toThrow();
    });

    it('debe lanzar error si la empresa no existe', async () => {
      const compChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Empresa not found') }),
      };
      mockSupabase.from.mockReturnValue(compChain);

      await expect(adminPlatformService.getCompanyAuditDetail(999)).rejects.toThrow('Empresa no encontrada');
    });
  });

  describe('Exportaciones CSV y JSON', () => {
    it('exportCompaniesCSV debe generar y descargar archivo CSV con empresas activas e inactivas', () => {
      const records: PlatformCompanyRecord[] = [
        {
          id: 1,
          razon_social: 'Empresa "Plataforma" S.L.',
          nombre_comercial: 'EcoComercial',
          cif: 'B12345678',
          roles: ['gestor', 'transportista'],
          is_my_company: true,
          user_email: 'admin@ecocomercial.com',
          created_at: '2025-01-10T10:00:00Z',
          activo: true,
        } as any,
        {
          id: 2,
          razon_social: '',
          nombre_comercial: '',
          cif: '',
          tipo_empresa: 'transportista',
          is_my_company: false,
          activo: false,
          created_at: null,
        } as any,
      ];

      expect(() => adminPlatformService.exportCompaniesCSV(records)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('exportCompaniesCSV no debe hacer nada si el array está vacío', () => {
      expect(() => adminPlatformService.exportCompaniesCSV([])).not.toThrow();
    });

    it('exportCompanyDataJSON debe generar y descargar archivo JSON estructurado', () => {
      const auditDetail: CompanyAuditDetail = {
        company: { id: 1, razon_social: 'Empresa Test', cif: 'B00000000' } as any,
        userProfile: null,
        productionCenters: [],
        recentDIs: [],
        contracts: [],
        authorizations: [],
        stats: { totalDIs: 0, totalContracts: 0, totalCenters: 0, totalTonsEstimated: 0 },
      };

      expect(() => adminPlatformService.exportCompanyDataJSON(auditDetail)).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });
});
