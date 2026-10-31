const mockStorageFrom = {
  upload: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
  storage: {
    from: jest.fn(() => mockStorageFrom),
  },
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

if (typeof atob === 'undefined') {
  (global as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

import {
  wasteContractService,
  validateContractActivation,
  getContractEffectiveStatus,
} from '../wasteContractService';
import type { WasteContract, WasteContractFormData } from '@/types/wasteManagement';

describe('wasteContractService - Gestión de Contratos de Tratamiento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUser = { id: 'user-contract-123' };
  const mockUserCompanies = [{ id: 10 }, { id: 20 }];

  const setupTenantContext = (userId = 'user-contract-123', companies = [{ id: 10 }, { id: 20 }]) => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
    });

    const companiesChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: companies, error: null }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'companies') return companiesChain;
      return null;
    });

    return { companiesChain };
  };

  describe('Tenant Context & Multi-tenancy Isolation', () => {
    it('debe fallar si no hay usuario autenticado al llamar a getAll', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(wasteContractService.getAll()).rejects.toThrow('Usuario no autenticado');
    });
  });

  describe('Firma pública por token (RPC)', () => {
    const pngBase64 = 'data:image/png;base64,iVBORw0KGgo=';

    it('getBySigningToken usa la RPC y devuelve el contrato', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: { id: 5 }, error: null });
      const result = await wasteContractService.getBySigningToken('tok');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_contract_by_signing_token', { p_token: 'tok' });
      expect(result).toEqual({ id: 5 });
    });

    it('getBySigningToken devuelve null si no hay contrato y lanza ante error', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      expect(await wasteContractService.getBySigningToken('x')).toBeNull();
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
      await expect(wasteContractService.getBySigningToken('x')).rejects.toThrow('Error al obtener contrato por token: boom');
    });

    it('signContractByToken firma vía RPC con el rol indicado', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: { id: 7 }, error: null })
        .mockResolvedValueOnce({ data: { id: 7, firma_productor_url: 'http://sig' }, error: null });
      mockStorageFrom.upload.mockResolvedValue({ error: null });
      mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://sig' } });

      const result = await wasteContractService.signContractByToken('tok', pngBase64, 'productor');

      expect(mockSupabase.rpc).toHaveBeenLastCalledWith('sign_contract_by_signing_token', {
        p_token: 'tok',
        p_role: 'productor',
        p_signature_url: 'http://sig',
      });
      expect(result).toEqual({ id: 7, firma_productor_url: 'http://sig' });
    });

    it('signContractByToken falla si el token no es válido, la subida falla o la RPC falla', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      await expect(wasteContractService.signContractByToken('x', pngBase64, 'gestor')).rejects.toThrow('Contrato no encontrado o token inválido');

      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 7 }, error: null });
      mockStorageFrom.upload.mockResolvedValueOnce({ error: { message: 'storage' } });
      await expect(wasteContractService.signContractByToken('x', pngBase64, 'gestor')).rejects.toThrow('Error al subir firma: storage');

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: { id: 7 }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'ya firmado' } });
      mockStorageFrom.upload.mockResolvedValueOnce({ error: null });
      mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'u' } });
      await expect(wasteContractService.signContractByToken('x', pngBase64, 'gestor')).rejects.toThrow('Error al actualizar firma: ya firmado');
    });
  });

  describe('getAll', () => {
    it('debe filtrar por empresas asociadas si el usuario tiene empresas', async () => {
      setupTenantContext('user-1', [{ id: 5 }, { id: 8 }]);

      const mockContracts = [{ id: 101, numero_contrato: 'CT-01' }];
      const queryChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockContracts, error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 5 }, { id: 8 }], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      const result = await wasteContractService.getAll();

      expect(queryChain.or).toHaveBeenCalledWith(
        'user_id.eq.user-1,company_id.in.(5,8),gestor_company_id.in.(5,8)'
      );
      expect(result).toEqual(mockContracts);
    });

    it('debe filtrar solo por user_id si el usuario no tiene empresas asociadas', async () => {
      setupTenantContext('user-2', []);

      const mockContracts = [{ id: 102, numero_contrato: 'CT-02' }];
      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockContracts, error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      const result = await wasteContractService.getAll();

      expect(queryChain.eq).toHaveBeenCalledWith('user_id', 'user-2');
      expect(result).toEqual(mockContracts);
    });

    it('debe lanzar error cuando falla la consulta de contratos', async () => {
      setupTenantContext('user-1', []);

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Connection failed' } }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      await expect(wasteContractService.getAll()).rejects.toThrow('Error al obtener contratos: DB Connection failed');
    });
  });

  describe('getById', () => {
    it('debe retornar null si no existe el contrato', async () => {
      setupTenantContext('user-1', [{ id: 1 }]);

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      const result = await wasteContractService.getById(999);
      expect(result).toBeNull();
    });

    it('debe cargar centros y códigos LER de fallback si no venían en la relación', async () => {
      setupTenantContext('user-1', [{ id: 1 }]);

      const mockContract = {
        id: 1,
        numero_contrato: 'CT-1',
        producer_center_id: 10,
        gestor_center_id: 20,
        contract_waste_codes: [],
      };

      const mockWasteCodes = [{ id: 50, codigo_ler: '15 01 01' }];
      const mockCenters = [
        { id: 10, nombre: 'Planta Origen' },
        { id: 20, nombre: 'Planta Gestora' },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
          };
        }
        if (table === 'waste_contracts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { ...mockContract }, error: null }),
          };
        }
        if (table === 'contract_waste_codes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockWasteCodes, error: null }),
          };
        }
        if (table === 'production_centers') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({ data: mockCenters, error: null }),
          };
        }
        return null;
      });

      const result = await wasteContractService.getById(1);

      expect(result).toBeDefined();
      expect(result?.contract_waste_codes).toEqual(mockWasteCodes);
      expect(result?.producer_center).toEqual(mockCenters[0]);
      expect(result?.gestor_center).toEqual(mockCenters[1]);
    });

    it('debe usar filtro eq(user_id) si companyIds está vacío y lanzar error si la query falla', async () => {
      setupTenantContext('user-empty', []);

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'Select error' } }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      await expect(wasteContractService.getById(5)).rejects.toThrow('Error al obtener contrato: Select error');
    });
  });

  describe('getByStatus y getActive', () => {
    it('debe filtrar contratos por estado', async () => {
      setupTenantContext('u1', [{ id: 10 }]);

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [{ id: 1, estado: 'borrador' }], error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      const res = await wasteContractService.getByStatus('borrador');
      expect(queryChain.eq).toHaveBeenCalledWith('estado', 'borrador');
      expect(res).toHaveLength(1);
    });

    it('debe filtrar contratos activos con getActive', async () => {
      const spy = jest.spyOn(wasteContractService, 'getByStatus').mockResolvedValue([] as any);
      await wasteContractService.getActive();
      expect(spy).toHaveBeenCalledWith('vigente');
      spy.mockRestore();
    });

    it('debe lanzar error si getByStatus falla', async () => {
      setupTenantContext('u1', []);

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Status error' } }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      await expect(wasteContractService.getByStatus('vigente')).rejects.toThrow('Error al obtener contratos: Status error');
    });
  });

  describe('getByCompany', () => {
    it('debe retornar array vacío si la empresa no pertenece al tenant del usuario', async () => {
      setupTenantContext('u1', [{ id: 10 }, { id: 20 }]);

      const result = await wasteContractService.getByCompany(999);
      expect(result).toEqual([]);
    });

    it('debe retornar contratos si la empresa sí pertenece al tenant', async () => {
      setupTenantContext('u1', [{ id: 10 }, { id: 20 }]);

      const mockContracts = [{ id: 50, company_id: 10 }];
      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockContracts, error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }, { id: 20 }], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      const result = await wasteContractService.getByCompany(10);
      expect(queryChain.eq).toHaveBeenCalledWith('company_id', 10);
      expect(result).toEqual(mockContracts);
    });

    it('debe lanzar error si falla la query en getByCompany', async () => {
      setupTenantContext('u1', [{ id: 10 }]);

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Company error' } }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      await expect(wasteContractService.getByCompany(10)).rejects.toThrow('Error al obtener contratos: Company error');
    });
  });

  describe('search', () => {
    it('debe buscar por número o descripción filtrando por tenant', async () => {
      setupTenantContext('u1', [{ id: 5 }]);

      const mockResults = [{ id: 1, numero_contrato: 'CT-ABC' }];
      const queryChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockResults, error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 5 }], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      const result = await wasteContractService.search('ABC');
      expect(queryChain.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockResults);
    });

    it('debe buscar sin empresas con eq(user_id) y lanzar error en fallo', async () => {
      setupTenantContext('u-solo', []);

      const queryChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Search error' } }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      await expect(wasteContractService.search('algo')).rejects.toThrow('Error al buscar contratos: Search error');
    });
  });

  describe('create', () => {
    it('debe fallar si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        wasteContractService.create({
          company_id: 1,
          tipo_contrato: 'tratamiento',
          numero_contrato: 'CT-NEW',
          fecha_contrato: '2026-01-01',
          fecha_inicio: '2026-01-01',
          fecha_fin: '2027-01-01',
          estado: 'borrador',
          descripcion_residuos: 'Residuos varios',
        })
      ).rejects.toThrow('Usuario no autenticado');
    });

    it('debe crear un contrato e insertar contract_waste_codes detallados', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-creator' } },
      });

      const createdMock = { id: 77, numero_contrato: 'CT-77' };
      const contractWasteCodesInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: createdMock, error: null }),
          };
        }
        if (table === 'contract_waste_codes') {
          return {
            insert: contractWasteCodesInsert,
          };
        }
        return null;
      });

      const formData: WasteContractFormData = {
        company_id: 1,
        gestor_company_id: 2,
        tipo_contrato: 'tratamiento',
        numero_contrato: 'CT-77',
        fecha_contrato: '2026-01-01',
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-12-31',
        estado: 'borrador',
        descripcion_residuos: 'Papel y cartón',
        contract_waste_codes: [
          {
            codigo_ler: ' 15 01 01 ',
            descripcion_ler: 'Envases de papel',
            operacion_tratamiento: ' r03 ',
            tarifa_gestion: 25,
            tipo_precio: 'por_tonelada',
            cantidad_estimada_anual: 100,
          },
        ],
      };

      const result = await wasteContractService.create(formData);

      expect(result).toEqual(createdMock);
      expect(contractWasteCodesInsert).toHaveBeenCalledWith([
        {
          contract_id: 77,
          codigo_ler: '15 01 01',
          descripcion_ler: 'Envases de papel',
          operacion_tratamiento: 'R03',
          tarifa_gestion: 25,
          tipo_precio: 'por_tonelada',
          cantidad_estimada_anual: 100,
        },
      ]);
    });

    it('debe manejar error de inserción del contrato', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-creator' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert constraint error' } }),
          };
        }
        return null;
      });

      await expect(
        wasteContractService.create({
          company_id: 1,
          tipo_contrato: 'tratamiento',
          numero_contrato: 'CT-ERR',
          fecha_contrato: '2026-01-01',
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-12-31',
          estado: 'borrador',
          descripcion_residuos: 'Error',
        })
      ).rejects.toThrow('Error al crear contrato: Insert constraint error');
    });
  });

  describe('getBySigningToken', () => {
    it('debe obtener un contrato por token de firma', async () => {
      const mockContract = { id: 88, signing_token: 'valid-token' };
      mockSupabase.rpc.mockResolvedValue({ data: mockContract, error: null });

      const res = await wasteContractService.getBySigningToken('valid-token');
      expect(res).toEqual(mockContract);
    });

    it('debe lanzar error si la búsqueda por token falla', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'Invalid token' } });

      await expect(wasteContractService.getBySigningToken('bad-token')).rejects.toThrow(
        'Error al obtener contrato por token: Invalid token'
      );
    });
  });

  describe('update', () => {
    it('debe actualizar contrato y reemplazar contract_waste_codes si se envían', async () => {
      setupTenantContext('user-1', [{ id: 5 }]);
      const updatedMock = { id: 10, estado: 'vigente' };
      const wasteDeleteMock = jest.fn().mockReturnThis();
      const wasteEqMock = jest.fn().mockResolvedValue({ error: null });
      const wasteInsertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 5 }], error: null }),
          };
        }
        if (table === 'waste_contracts') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: updatedMock, error: null }),
          };
        }
        if (table === 'contract_waste_codes') {
          return {
            delete: wasteDeleteMock,
            eq: wasteEqMock,
            insert: wasteInsertMock,
          };
        }
        return null;
      });

      const result = await wasteContractService.update(10, {
        estado: 'vigente',
        contract_waste_codes: [
          {
            codigo_ler: ' 20 01 01 ',
            operacion_tratamiento: ' r12 ',
          },
        ],
      });

      expect(result).toEqual(updatedMock);
      expect(wasteDeleteMock).toHaveBeenCalled();
      expect(wasteInsertMock).toHaveBeenCalled();
    });

    it('debe soportar contractWasteCodes en camelCase sin enviarlo como columna a waste_contracts', async () => {
      setupTenantContext('user-1', []);
      const updatedMock = { id: 10, estado: 'vigente' };
      const contractUpdateMock = jest.fn().mockReturnThis();
      const wasteDeleteMock = jest.fn().mockReturnThis();
      const wasteEqMock = jest.fn().mockResolvedValue({ error: null });
      const wasteInsertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') {
          return {
            update: contractUpdateMock,
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: updatedMock, error: null }),
          };
        }
        if (table === 'contract_waste_codes') {
          return {
            delete: wasteDeleteMock,
            eq: wasteEqMock,
            insert: wasteInsertMock,
          };
        }
        return null;
      });

      await wasteContractService.update(10, {
        estado: 'vigente',
        contractWasteCodes: [
          {
            codigo_ler: ' 15 01 02 ',
            operacion_tratamiento: ' r03 ',
          },
        ],
      } as any);

      const sentPayload = contractUpdateMock.mock.calls[0][0];
      expect(sentPayload.contractWasteCodes).toBeUndefined();
      expect(sentPayload.codigos_ler).toEqual(['15 01 02']);
      expect(sentPayload.operaciones_tratamiento).toEqual(['R03']);
      expect(wasteInsertMock).toHaveBeenCalled();
    });

    it('debe lanzar error cuando el update falla', async () => {
      setupTenantContext('user-1', []);
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
          };
        }
        return null;
      });

      await expect(wasteContractService.update(10, { estado: 'cancelado' })).rejects.toThrow(
        'Error al actualizar contrato: Update failed'
      );
    });
  });

  describe('activate', () => {
    it('debe lanzar error si el contrato no existe', async () => {
      jest.spyOn(wasteContractService, 'getById').mockResolvedValue(null);

      await expect(wasteContractService.activate(99)).rejects.toThrow('Contrato no encontrado');
    });

    it('debe lanzar error si la validación legal no se cumple', async () => {
      jest.spyOn(wasteContractService, 'getById').mockResolvedValue({
        id: 99,
        // Sin productor ni gestor
      } as any);

      await expect(wasteContractService.activate(99)).rejects.toThrow('No se puede activar el contrato:');
    });

    it('debe activar el contrato a vigente si cumple todos los requisitos', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 10);

      const validContract: any = {
        id: 99,
        company_id: 1,
        gestor_company_id: 2,
        fecha_inicio: '2026-01-01',
        fecha_fin: tomorrow.toISOString().split('T')[0],
        codigos_ler: ['15 01 01'],
        operaciones_tratamiento: ['R03'],
      };

      jest.spyOn(wasteContractService, 'getById').mockResolvedValue(validContract);
      const updateSpy = jest.spyOn(wasteContractService, 'update').mockResolvedValue({
        ...validContract,
        estado: 'vigente',
      });

      const res = await wasteContractService.activate(99);
      expect(updateSpy).toHaveBeenCalledWith(99, { estado: 'vigente' });
      expect(res.estado).toBe('vigente');
    });
  });

  describe('delete', () => {
    it('debe eliminar contrato filtrando por usuario y empresas asociadas', async () => {
      setupTenantContext('user-1', [{ id: 5 }]);

      const queryChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 5 }], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      await wasteContractService.delete(123);
      expect(queryChain.delete).toHaveBeenCalled();
      expect(queryChain.eq).toHaveBeenCalledWith('id', 123);
    });

    it('debe lanzar error si la eliminación falla', async () => {
      setupTenantContext('user-1', []);

      const queryChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ error: { message: 'Foreign key error' } }),
      };
      // when empty companyIds: queryChain.eq('user_id', userId)
      queryChain.eq.mockReturnValue({
        ...queryChain,
        then: (resolve: any) => resolve({ error: { message: 'Foreign key error' } }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      await expect(wasteContractService.delete(123)).rejects.toThrow('Error al eliminar contrato:');
    });
  });

  describe('status transitions: updateStatus, finalize, cancel', () => {
    it('debe actualizar el estado del contrato', async () => {
      const updateSpy = jest.spyOn(wasteContractService, 'update').mockResolvedValue({ id: 1, estado: 'finalizado' } as any);

      await wasteContractService.finalize(1);
      expect(updateSpy).toHaveBeenCalledWith(1, { estado: 'finalizado' });

      await wasteContractService.cancel(1);
      expect(updateSpy).toHaveBeenCalledWith(1, { estado: 'cancelado' });

      updateSpy.mockRestore();
    });
  });

  describe('uploadDocument', () => {
    it('debe fallar si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const file = new File(['dummy'], 'contrato.pdf', { type: 'application/pdf' });
      await expect(wasteContractService.uploadDocument(file, 5)).rejects.toThrow('Usuario no autenticado');
    });

    it('debe subir el archivo y asociar la URL del documento al contrato', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u-doc' } },
      });

      mockStorageFrom.upload.mockResolvedValue({ error: null });
      mockStorageFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/contract.pdf' },
      });

      const updateSpy = jest.spyOn(wasteContractService, 'update').mockResolvedValue({} as any);

      const file = new File(['content'], 'contrato.pdf', { type: 'application/pdf' });
      const url = await wasteContractService.uploadDocument(file, 45);

      expect(mockStorageFrom.upload).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(45, { documento_url: 'https://storage.supabase.co/contract.pdf' });
      expect(url).toBe('https://storage.supabase.co/contract.pdf');

      updateSpy.mockRestore();
    });

    it('debe lanzar error si la subida a Storage falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u-doc' } },
      });

      mockStorageFrom.upload.mockResolvedValue({ error: { message: 'Bucket full' } });

      const file = new File(['content'], 'contrato.pdf', { type: 'application/pdf' });
      await expect(wasteContractService.uploadDocument(file, 45)).rejects.toThrow(
        'Error al subir documento: Bucket full'
      );
    });
  });

  describe('Helper utilities: generateContractNumber, validateDates, isCurrentlyActive', () => {
    it('debe generar el número de contrato con formato correcto', () => {
      const number = wasteContractService.generateContractNumber(42);
      expect(number).toMatch(/^CT-42-\d{4}-\d+$/);
    });

    it('debe validar fechas correctamente', () => {
      expect(wasteContractService.validateDates('2026-01-01', '2026-12-31')).toBe(true);
      expect(wasteContractService.validateDates('2026-12-31', '2026-01-01')).toBe(false);
    });

    it('debe verificar si un contrato está vigente', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const future = new Date(Date.now() + 86400000).toISOString();

      expect(wasteContractService.isCurrentlyActive({ estado: 'borrador' } as any)).toBe(false);

      expect(wasteContractService.isCurrentlyActive({
        estado: 'vigente',
        fecha_inicio: future,
      } as any)).toBe(false);

      expect(wasteContractService.isCurrentlyActive({
        estado: 'vigente',
        fecha_inicio: past,
        fecha_fin: past,
      } as any)).toBe(false);

      expect(wasteContractService.isCurrentlyActive({
        estado: 'vigente',
        fecha_inicio: past,
        fecha_fin: future,
      } as any)).toBe(true);
    });
  });

  describe('getExpiringSoon', () => {
    it('debe consultar contratos vigentes entre hoy y 30 días filtrando por tenant', async () => {
      setupTenantContext('user-1', [{ id: 10 }]);
      const mockExpiring = [{ id: 1, fecha_fin: '2026-11-01' }];
      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockExpiring, error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      const res = await wasteContractService.getExpiringSoon();
      expect(queryChain.eq).toHaveBeenCalledWith('estado', 'vigente');
      expect(queryChain.or).toHaveBeenCalledWith(
        'user_id.eq.user-1,company_id.in.(10),gestor_company_id.in.(10)'
      );
      expect(res).toEqual(mockExpiring);
    });

    it('debe lanzar error cuando falla getExpiringSoon', async () => {
      setupTenantContext('user-1', []);
      const queryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Query timeout' } }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'waste_contracts') return queryChain;
        return null;
      });

      await expect(wasteContractService.getExpiringSoon()).rejects.toThrow(
        'Error al obtener contratos por vencer: Query timeout'
      );
    });
  });

  describe('signContract & signContractByToken', () => {
    const dummySignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=';

    it('debe fallar signContract si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        wasteContractService.signContract(1, dummySignature, 'productor')
      ).rejects.toThrow('Usuario no autenticado');
    });

    it('debe subir la firma y actualizar contrato para rol productor', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u-signer' } },
      });

      mockStorageFrom.upload.mockResolvedValue({ error: null });
      mockStorageFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage/signature-prod.png' },
      });

      const updateSpy = jest.spyOn(wasteContractService, 'update').mockResolvedValue({
        id: 1,
        firma_productor_url: 'https://storage/signature-prod.png',
      } as any);

      const res = await wasteContractService.signContract(1, dummySignature, 'productor');

      expect(mockStorageFrom.upload).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(1, expect.objectContaining({
        firma_productor_url: 'https://storage/signature-prod.png',
      }));
      expect(res.firma_productor_url).toBe('https://storage/signature-prod.png');

      updateSpy.mockRestore();
    });

    it('debe subir la firma y actualizar contrato para rol gestor', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u-signer' } },
      });

      mockStorageFrom.upload.mockResolvedValue({ error: null });
      mockStorageFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage/signature-gestor.png' },
      });

      const updateSpy = jest.spyOn(wasteContractService, 'update').mockResolvedValue({
        id: 2,
        firma_gestor_url: 'https://storage/signature-gestor.png',
      } as any);

      const res = await wasteContractService.signContract(2, dummySignature, 'gestor');

      expect(updateSpy).toHaveBeenCalledWith(2, expect.objectContaining({
        firma_gestor_url: 'https://storage/signature-gestor.png',
      }));

      updateSpy.mockRestore();
    });

    it('debe lanzar error si upload falla en signContract', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u-signer' } },
      });

      mockStorageFrom.upload.mockResolvedValue({ error: { message: 'Storage error' } });

      await expect(
        wasteContractService.signContract(1, dummySignature, 'productor')
      ).rejects.toThrow('Error al subir firma: Storage error');
    });

    it('debe firmar por token público correctamente', async () => {
      jest.spyOn(wasteContractService, 'getBySigningToken').mockResolvedValue({
        id: 77,
        signing_token: 'token-abc',
      } as any);

      mockStorageFrom.upload.mockResolvedValue({ error: null });
      mockStorageFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage/pub-sign.png' },
      });

      mockSupabase.rpc.mockResolvedValue({
        data: { id: 77, firma_gestor_url: 'https://storage/pub-sign.png' },
        error: null,
      });

      const res = await wasteContractService.signContractByToken('token-abc', dummySignature, 'gestor');

      expect(res.firma_gestor_url).toBe('https://storage/pub-sign.png');
    });

    it('debe lanzar error si el token no es válido en signContractByToken', async () => {
      jest.spyOn(wasteContractService, 'getBySigningToken').mockResolvedValue(null);

      await expect(
        wasteContractService.signContractByToken('invalid', dummySignature, 'productor')
      ).rejects.toThrow('Contrato no encontrado o token inválido');
    });

    it('debe lanzar error si la subida o la actualización fallan en signContractByToken', async () => {
      jest.spyOn(wasteContractService, 'getBySigningToken').mockResolvedValue({ id: 10 } as any);
      mockStorageFrom.upload.mockResolvedValue({ error: { message: 'Upload fail' } });

      await expect(
        wasteContractService.signContractByToken('tok', dummySignature, 'productor')
      ).rejects.toThrow('Error al subir firma: Upload fail');

      mockStorageFrom.upload.mockResolvedValue({ error: null });
      mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'url' } });

      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'Token update fail' } });

      await expect(
        wasteContractService.signContractByToken('tok', dummySignature, 'productor')
      ).rejects.toThrow('Error al actualizar firma: Token update fail');
    });
  });

  describe('validateContractActivation helper', () => {
    it('debe retornar canActivate: false si faltan campos obligatorios', () => {
      const incompleteContract: any = {};
      const res = validateContractActivation(incompleteContract);

      expect(res.canActivate).toBe(false);
      expect(res.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('empresa productora'),
          expect.stringContaining('gestor de tratamiento'),
          expect.stringContaining('fechas de inicio y fin'),
          expect.stringContaining('código LER'),
          expect.stringContaining('operación de tratamiento'),
        ])
      );
    });

    it('debe validar cuando el contrato ya ha expirado', () => {
      const expiredContract: any = {
        company_id: 1,
        gestor_company_id: 2,
        fecha_inicio: '2020-01-01',
        fecha_fin: '2020-12-31',
        codigos_ler: ['15 01 01'],
        operaciones_tratamiento: ['R03'],
      };

      const res = validateContractActivation(expiredContract);
      expect(res.canActivate).toBe(false);
      expect(res.checklist.isNotExpired).toBe(false);
      expect(res.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('ya ha expirado')])
      );
    });

    it('debe retornar canActivate: true cuando cumple todos los requisitos legales', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      const validContract: any = {
        company: { id: 1, razon_social: 'Productor' },
        gestor_company: { id: 2, razon_social: 'Gestor' },
        fecha_inicio: '2026-01-01',
        fecha_fin: futureDate.toISOString().split('T')[0],
        contract_waste_codes: [
          { codigo_ler: '15 01 02', operacion_tratamiento: 'R03' },
        ],
      };

      const res = validateContractActivation(validContract);
      expect(res.canActivate).toBe(true);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  describe('getContractEffectiveStatus helper', () => {
    it('debe manejar estados cancelado y finalizado directamente', () => {
      expect(getContractEffectiveStatus({ estado: 'cancelado' } as any)).toEqual({
        status: 'cancelado',
        isExpired: false,
        label: 'Cancelado',
      });

      expect(getContractEffectiveStatus({ estado: 'finalizado' } as any)).toEqual({
        status: 'finalizado',
        isExpired: false,
        label: 'Finalizado',
      });
    });

    it('debe manejar borrador vigente y borrador vencido', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const past = new Date(Date.now() - 86400000).toISOString();

      expect(getContractEffectiveStatus({ estado: 'borrador', fecha_fin: future } as any)).toEqual({
        status: 'borrador',
        isExpired: false,
        label: 'Borrador',
      });

      expect(getContractEffectiveStatus({ estado: 'borrador', fecha_fin: past } as any)).toEqual({
        status: 'borrador',
        isExpired: true,
        label: 'Borrador (Vencido)',
      });
    });

    it('debe determinar si un contrato vigente ha caducado', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const past = new Date(Date.now() - 86400000).toISOString();

      expect(getContractEffectiveStatus({ estado: 'vigente', fecha_fin: future } as any)).toEqual({
        status: 'vigente',
        isExpired: false,
        label: 'Vigente',
      });

      expect(getContractEffectiveStatus({ estado: 'vigente', fecha_fin: past } as any)).toEqual({
        status: 'caducado',
        isExpired: true,
        label: 'Caducado',
      });
    });
  });
});
