const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import { companyService } from '../companyService';
import type { Company, CompanyFormData } from '@/types/wasteManagement';

describe('companyService - Gestión de Empresas y Directorio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserCompany', () => {
    it('debe fallar si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(companyService.getUserCompany()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe priorizar la empresa marcada explícitamente con is_my_company', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const myComp = { id: 10, razon_social: 'Mi Empresa Propia', is_my_company: true };

      const maybeSingleMock = jest.fn().mockResolvedValue({ data: myComp, error: null });
      const limitMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqActivoMock = jest.fn().mockReturnValue({ limit: limitMock });
      const eqMyCompMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqMyCompMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await companyService.getUserCompany();

      expect(result).toEqual(myComp);
    });

    it('debe usar fallback para obtener la primera empresa activa si no tiene is_my_company', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const fallbackComp = { id: 2, razon_social: 'Empresa Fallback' };

      // Primer select (is_my_company) devuelve data null
      const firstMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const firstLimit = jest.fn().mockReturnValue({ maybeSingle: firstMaybeSingle });
      const firstEqActivo = jest.fn().mockReturnValue({ limit: firstLimit });
      const firstEqMyComp = jest.fn().mockReturnValue({ eq: firstEqActivo });
      const firstEqUser = jest.fn().mockReturnValue({ eq: firstEqMyComp });

      // Segundo select (fallback)
      const secondMaybeSingle = jest.fn().mockResolvedValue({ data: fallbackComp, error: null });
      const secondLimit = jest.fn().mockReturnValue({ maybeSingle: secondMaybeSingle });
      const secondOrder = jest.fn().mockReturnValue({ limit: secondLimit });
      const secondEqActivo = jest.fn().mockReturnValue({ order: secondOrder });
      const secondEqUser = jest.fn().mockReturnValue({ eq: secondEqActivo });

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        return {
          select: jest.fn().mockReturnValue(callCount === 1 ? { eq: firstEqUser } : { eq: secondEqUser }),
        };
      });

      const result = await companyService.getUserCompany();

      expect(result).toEqual(fallbackComp);
    });

    it('debe lanzar error si el fallback de Supabase falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'Database fallback error' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      });

      await expect(companyService.getUserCompany()).rejects.toThrow(
        'Error al obtener empresa: Database fallback error'
      );
    });
  });

  describe('getById, getAllContacts y getAll', () => {
    it('getById debe retornar una empresa con sus centros de producción', async () => {
      const mockComp = { id: 1, razon_social: 'Test S.L.', production_centers: [] };

      const singleMock = jest.fn().mockResolvedValue({ data: mockComp, error: null });
      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await companyService.getById(1);

      expect(eqMock).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockComp);
    });

    it('getById debe lanzar error si falla la consulta', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Company not found' },
      });
      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(companyService.getById(99)).rejects.toThrow(
        'Error al obtener empresa: Company not found'
      );
    });

    it('getAllContacts debe obtener las empresas activas del usuario', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const mockList = [{ id: 1, activo: true }];
      const orderMock = jest.fn().mockResolvedValue({ data: mockList, error: null });
      const eqActivoMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await companyService.getAllContacts();

      expect(result).toEqual(mockList);
    });

    it('getAllContacts debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(companyService.getAllContacts()).rejects.toThrow('Usuario no autenticado');
    });

    it('getAll debe obtener todas las empresas del usuario', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const mockList = [{ id: 1 }, { id: 2 }];
      const orderMock = jest.fn().mockResolvedValue({ data: mockList, error: null });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await companyService.getAll();

      expect(result).toEqual(mockList);
    });
  });

  describe('getByRole y getByType', () => {
    it('debe filtrar empresas por rol en array roles o en tipo_empresa', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const mockCompanies = [
        { id: 1, user_id: 'user-1', roles: ['gestor', 'transportista'] },
        { id: 2, user_id: 'user-1', tipo_empresa: 'gestor', roles: null },
        { id: 3, user_id: 'user-1', roles: ['productor'] },
        { id: 4, user_id: 'other-user', roles: ['gestor'] },
      ];

      const orderMock = jest.fn().mockResolvedValue({ data: mockCompanies, error: null });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await companyService.getByRole('gestor');

      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).toEqual([1, 2]);
    });

    it('getByType debe ser un alias funcional de getByRole', async () => {
      const spyRole = jest.spyOn(companyService, 'getByRole').mockResolvedValue([{ id: 1 } as any]);

      const result = await companyService.getByType('transportista');

      expect(spyRole).toHaveBeenCalledWith('transportista');
      expect(result).toHaveLength(1);
      spyRole.mockRestore();
    });
  });

  describe('search', () => {
    it('debe devolver todos los contactos si la consulta está vacía', async () => {
      const spyAll = jest.spyOn(companyService, 'getAllContacts').mockResolvedValue([{ id: 1 } as any]);

      const result = await companyService.search('   ');

      expect(spyAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      spyAll.mockRestore();
    });

    it('debe buscar por texto en múltiples campos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const mockResults = [{ id: 1, razon_social: 'Reciclajes Madrid' }];

      let queryObj: any = {};
      queryObj.then = (resolve: any) => resolve({ data: mockResults, error: null });
      queryObj.eq = jest.fn().mockReturnValue(queryObj);

      const limitMock = jest.fn().mockReturnValue(queryObj);
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const eqActivoMock = jest.fn().mockReturnValue({ order: orderMock });
      const orMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const selectMock = jest.fn().mockReturnValue({ or: orMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await companyService.search('Madrid');

      expect(orMock).toHaveBeenCalledWith(expect.stringContaining('razon_social.ilike.%Madrid%'));
      expect(result).toEqual(mockResults);
    });
  });

  describe('create, update y delete', () => {
    const validFormData: CompanyFormData = {
      razon_social: 'EcoGest S.L.',
      cif: 'B12345678',
      tipo_empresa: 'gestor',
    };

    it('create debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(companyService.create(validFormData)).rejects.toThrow('Usuario no autenticado');
    });

    it('create debe actualizar y unificar roles si ya existe una empresa con ese CIF', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const existingComp = { id: 8, roles: ['productor'] };

      const maybeSingleMock = jest.fn().mockResolvedValue({ data: existingComp, error: null });
      const eqCifMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqCifMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });

      mockSupabase.from.mockReturnValue({ select: selectMock });

      const spyUpdate = jest.spyOn(companyService, 'update').mockResolvedValue({
        id: 8,
        roles: ['productor', 'gestor'],
      } as any);

      const result = await companyService.create({ ...validFormData, roles: ['gestor'] });

      expect(spyUpdate).toHaveBeenCalledWith(8, expect.objectContaining({
        roles: ['productor', 'gestor'],
      }));
      expect(result.id).toBe(8);
      spyUpdate.mockRestore();
    });

    it('create debe insertar nueva empresa si no existía el CIF', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      // No existe
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: null });
      const eqCifMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqCifMock });
      const selectCheckMock = jest.fn().mockReturnValue({ eq: eqUserMock });

      const newCompany = { id: 20, ...validFormData, user_id: 'user-1' };
      const singleInsertMock = jest.fn().mockResolvedValue({ data: newCompany, error: null });
      const selectInsertMock = jest.fn().mockReturnValue({ single: singleInsertMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectInsertMock });

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? { select: selectCheckMock } : { insert: insertMock };
      });

      const result = await companyService.create(validFormData);

      expect(result).toEqual(newCompany);
    });

    it('update debe modificar datos de la empresa', async () => {
      const updated = { id: 1, razon_social: 'Nuevo Nombre' };

      const singleMock = jest.fn().mockResolvedValue({ data: updated, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      const result = await companyService.update(1, { razon_social: 'Nuevo Nombre' });

      expect(eqMock).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(updated);
    });

    it('softDelete y delete deben gestionar el borrado lógico y físico', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });

      mockSupabase.from.mockImplementation(() => ({
        update: updateMock,
        delete: deleteMock,
      }));

      await expect(companyService.softDelete(1)).resolves.toBeUndefined();
      expect(updateMock).toHaveBeenCalledWith({ activo: false });

      await expect(companyService.delete(1)).resolves.toBeUndefined();
      expect(deleteMock).toHaveBeenCalled();
    });

    it('debe manejar errores en create, update, softDelete y delete', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      const failSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null }) }) }) }),
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: failSingle }) }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: failSingle }), error: { message: 'Soft delete error' } }) }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: { message: 'Delete error' } }) }),
      });

      await expect(companyService.create({ cif: 'B111' } as any)).rejects.toThrow('Error al crear empresa: DB Error');
      await expect(companyService.update(1, {})).rejects.toThrow('Error al actualizar empresa: DB Error');
      await expect(companyService.softDelete(1)).rejects.toThrow('Error al desactivar empresa: Soft delete error');
      await expect(companyService.delete(1)).rejects.toThrow('Error al eliminar empresa: Delete error');
    });

    it('debe manejar errores en getAllContacts, getAll, getByRole y search', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      const failPromise = Promise.resolve({ data: null, error: { message: 'Query fail' } });
      const chainable: any = {
        eq: jest.fn().mockImplementation(() => chainable),
        order: jest.fn().mockImplementation(() => failPromise),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(chainable),
      });

      await expect(companyService.getAllContacts()).rejects.toThrow('Error al obtener empresas: Query fail');
      await expect(companyService.getAll()).rejects.toThrow('Error al obtener empresas: Query fail');
      await expect(companyService.getByRole('gestor')).rejects.toThrow('Error al obtener empresas por rol: Query fail');
    });
  });

  describe('uploadLogo y hasCompany', () => {
    it('uploadLogo debe subir imagen a Storage y retornar publicUrl', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const mockFile = { name: 'logo.png' } as any;

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://supabase.co/storage/images/logo.png' },
        }),
      });

      const url = await companyService.uploadLogo(mockFile, 5);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('images');
      expect(url).toBe('https://supabase.co/storage/images/logo.png');
    });

    it('hasCompany debe retornar true si el usuario tiene empresa', async () => {
      jest.spyOn(companyService, 'getUserCompany').mockResolvedValue({ id: 1 } as any);

      const has = await companyService.hasCompany();
      expect(has).toBe(true);
    });
  });

  describe('validateCIF y validateNIMA', () => {
    it.each(['12345678Z', 'X1234567L', 'B12345678', 'A87654321'])(
      'debe validar formatos válidos de CIF/NIF/NIE: %s',
      (cif) => {
        expect(companyService.validateCIF(cif)).toBe(true);
      }
    );

    it.each(['', '1234', 'INVALIDO', '1234567890'])(
      'debe rechazar formatos inválidos de CIF: %s',
      (cif) => {
        expect(companyService.validateCIF(cif)).toBe(false);
      }
    );

    it.each(['2800000001', 'A123456789B'])(
      'debe validar formatos válidos de NIMA: %s',
      (nima) => {
        expect(companyService.validateNIMA(nima)).toBe(true);
      }
    );

    it.each(['', '123', 'ESTO_TIENE_DEMASIADOS_CARACTERES_123456'])(
      'debe rechazar formatos inválidos de NIMA: %s',
      (nima) => {
        expect(companyService.validateNIMA(nima)).toBe(false);
      }
    );
  });
});
