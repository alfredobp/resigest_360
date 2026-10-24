const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import { authorizationService } from '../authorizationService';
import type {
  EnvironmentalAuthorization,
  EnvironmentalAuthorizationFormData,
} from '@/types/wasteManagement';

describe('authorizationService - Autorizaciones Ambientales y Matriz LER', () => {
  const validFormData: EnvironmentalAuthorizationFormData = {
    company_id: 1,
    numero_autorizacion: 'AUT-2026-MAD-001',
    titulo: 'Autorización Gestor R03',
    es_indefinida: true,
    waste_codes: [
      {
        codigo_ler: '15 01 01',
        descripcion_ler: 'Envases de papel',
        operaciones_tratamiento: ['R03'],
        capacidad_anual_toneladas: 5000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('debe fallar si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(authorizationService.getAll()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe devolver todas las autorizaciones activas del usuario', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const mockAuths = [{ id: 1, numero_autorizacion: 'AUT-001' }];

      const orderMock = jest.fn().mockResolvedValue({ data: mockAuths, error: null });
      const eqActivoMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await authorizationService.getAll();

      expect(mockSupabase.from).toHaveBeenCalledWith('environmental_authorizations');
      expect(result).toEqual(mockAuths);
    });

    it('debe lanzar error si falla la consulta', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      const eqActivoMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(authorizationService.getAll()).rejects.toThrow('Error al obtener autorizaciones: Database error');
    });
  });

  describe('getByCompany', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(authorizationService.getByCompany(5)).rejects.toThrow('Usuario no autenticado');
    });

    it('debe consultar autorizaciones de una empresa concreta', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const mockAuths = [{ id: 10, company_id: 5 }];

      const orderMock = jest.fn().mockResolvedValue({ data: mockAuths, error: null });
      const eqActivoMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqCompanyMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqCompanyMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await authorizationService.getByCompany(5);

      expect(eqCompanyMock).toHaveBeenCalledWith('company_id', 5);
      expect(result).toEqual(mockAuths);
    });

    it('debe lanzar error si falla la consulta por empresa', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Company auth query failed' },
      });
      const eqActivoMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqCompanyMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqCompanyMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(authorizationService.getByCompany(5)).rejects.toThrow(
        'Error al obtener autorizaciones de la empresa: Company auth query failed'
      );
    });
  });

  describe('getAuthorizedScope (Matriz LER y alcance)', () => {
    it('debe devolver alcance por defecto si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await authorizationService.getAuthorizedScope(1);

      expect(result.hasAnyAuthorizationConfigured).toBe(false);
      expect(result.isAuthorized).toBe(true);
      expect(result.authorizations).toEqual([]);
    });

    it('debe procesar y construir la matriz de códigos LER y operaciones autorizadas vigentes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const mockData = [
        {
          id: 1,
          es_indefinida: true,
          waste_codes: [
            {
              codigo_ler: '15 01 01',
              descripcion_ler: 'Envases de papel y cartón',
              operaciones_tratamiento: ['R03', 'r13'],
            },
            {
              codigo_ler: '15 01 02',
              descripcion_ler: 'Envases de plástico',
              operaciones_tratamiento: ['R03'],
            },
          ],
        },
        {
          id: 2,
          es_indefinida: false,
          fecha_vencimiento: '2030-01-01', // Vigente
          waste_codes: [
            {
              codigo_ler: '15 01 01', // Mismo LER pero añade operación
              descripcion_ler: 'Envases de papel y cartón',
              operaciones_tratamiento: ['R12'],
            },
          ],
        },
        {
          id: 3,
          es_indefinida: false,
          fecha_vencimiento: '2020-01-01', // Caducada -> no debe entrar
          waste_codes: [
            {
              codigo_ler: '20 03 01',
              descripcion_ler: 'Mezclas',
              operaciones_tratamiento: ['D10'],
            },
          ],
        },
      ];

      let queryObj: any = {};
      queryObj.then = (resolve: any) => resolve({ data: mockData, error: null });
      queryObj.or = jest.fn().mockReturnValue(queryObj);

      const eqActivoMock = jest.fn().mockReturnValue(queryObj);
      const eqCompanyMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqCompanyMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await authorizationService.getAuthorizedScope(5, 2, '2026-10-24');

      expect(queryObj.or).toHaveBeenCalledWith('production_center_id.eq.2,production_center_id.is.null');
      expect(result.hasAnyAuthorizationConfigured).toBe(true);
      expect(result.isAuthorized).toBe(true);
      expect(result.authorizations).toHaveLength(2); // auth 1 e indefinida + auth 2 vigente

      // Comprobar matriz de operaciones combinadas normalizadas
      expect(result.authorizedLers['15 01 01']).toEqual(['R03', 'R13', 'R12']);
      expect(result.authorizedLers['15 01 02']).toEqual(['R03']);
      expect(result.authorizedLers['20 03 01']).toBeUndefined(); // Por estar caducada

      expect(result.lerDescriptions['15 01 01']).toBe('Envases de papel y cartón');
    });

    it('debe capturar excepciones no controladas en la consulta y devolver alcance seguro', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      mockSupabase.from.mockImplementation(() => {
        throw new Error('Fatal connection crash inside query');
      });

      const result = await authorizationService.getAuthorizedScope(5);

      expect(result.hasAnyAuthorizationConfigured).toBe(false);
      expect(result.isAuthorized).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('debe manejar autorizaciones sin fecha de vencimiento y registrar error si falla la inserción de códigos', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      // 1. Auth sin fecha_vencimiento ni es_indefinida
      const authSinVencimiento = {
        id: 99,
        es_indefinida: false,
        fecha_vencimiento: null,
        waste_codes: [],
      };
      let queryObj: any = {};
      queryObj.then = (resolve: any) => resolve({ data: [authSinVencimiento], error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(queryObj),
            }),
          }),
        }),
      });

      const scope = await authorizationService.getAuthorizedScope(1);
      expect(scope.authorizations).toHaveLength(1);

      // 2. create con fallo en códigos de residuo
      const singleMock = jest.fn().mockResolvedValue({ data: { id: 10 }, error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'environmental_authorizations') {
          return { insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleMock }) }) };
        }
        if (table === 'authorization_waste_codes') {
          return { insert: jest.fn().mockResolvedValue({ error: { message: 'Waste code insert error' } }) };
        }
        return {};
      });

      await authorizationService.create({
        ...validFormData,
        activo: false,
        es_indefinida: false,
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('update debe funcionar si waste_codes es undefined', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const singleMock = jest.fn().mockResolvedValue({ data: { id: 10 }, error: null });
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({ single: singleMock }),
            }),
          }),
        }),
      });

      const result = await authorizationService.update(10, {
        company_id: 1,
        numero_autorizacion: 'AUT-001',
        titulo: 'Autorización Actualizada',
      });

      expect(result.id).toBe(10);
    });

    it('getAuthorizedScope debe manejar error en query o data vacía', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      // Caso con error
      let queryObjError: any = {};
      queryObjError.then = (resolve: any) => resolve({ data: null, error: { message: 'DB error' } });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(queryObjError),
            }),
          }),
        }),
      });

      const resError = await authorizationService.getAuthorizedScope(1);
      expect(resError.hasAnyAuthorizationConfigured).toBe(false);

      // Caso data vacía y sin transferDateStr
      let queryObjEmpty: any = {};
      queryObjEmpty.then = (resolve: any) => resolve({ data: [], error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(queryObjEmpty),
            }),
          }),
        }),
      });

      const resEmpty = await authorizationService.getAuthorizedScope(1);
      expect(resEmpty.hasAnyAuthorizationConfigured).toBe(false);
    });

    it('getAuthorizedScope debe manejar auth sin waste_codes y waste_codes con campos nulos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const mockData = [
        {
          id: 1,
          es_indefinida: true,
          waste_codes: null, // no es array
        },
        {
          id: 2,
          es_indefinida: true,
          waste_codes: [
            {
              codigo_ler: '15 01 01',
              descripcion_ler: null,
              operaciones_tratamiento: null,
            },
          ],
        },
      ];

      let queryObj: any = {};
      queryObj.then = (resolve: any) => resolve({ data: mockData, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(queryObj),
            }),
          }),
        }),
      });

      const res = await authorizationService.getAuthorizedScope(1);
      expect(res.hasAnyAuthorizationConfigured).toBe(true);
      expect(res.authorizedLers['15 01 01']).toEqual([]);
      expect(res.lerDescriptions['15 01 01']).toBeUndefined();
    });
  });

  describe('create, update y delete', () => {
    it('create debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(authorizationService.create(validFormData)).rejects.toThrow('Usuario no autenticado');
    });

    it('create debe insertar la autorización y sus códigos LER asociados', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const createdAuth = { id: 10, ...validFormData, user_id: 'user-auth-1' };

      const singleMock = jest.fn().mockResolvedValue({ data: createdAuth, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertAuthMock = jest.fn().mockReturnValue({ select: selectMock });
      const insertCodesMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'environmental_authorizations') {
          return { insert: insertAuthMock };
        }
        if (table === 'authorization_waste_codes') {
          return { insert: insertCodesMock };
        }
        return {};
      });

      const result = await authorizationService.create(validFormData);

      expect(insertAuthMock).toHaveBeenCalledWith(
        expect.objectContaining({
          numero_autorizacion: 'AUT-2026-MAD-001',
          user_id: 'user-auth-1',
          es_indefinida: true,
        })
      );
      expect(insertCodesMock).toHaveBeenCalledWith([
        expect.objectContaining({
          authorization_id: 10,
          codigo_ler: '15 01 01',
          capacidad_anual_toneladas: 5000,
        }),
      ]);
      expect(result).toEqual(createdAuth);
    });

    it('create debe lanzar error si falla la inserción de la autorización', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert auth failed' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertAuthMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertAuthMock });

      await expect(authorizationService.create(validFormData)).rejects.toThrow(
        'Error al registrar autorización: Insert auth failed'
      );
    });

    it('update debe actualizar la autorización y reemplazar sus códigos LER', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const updatedAuth = { id: 10, ...validFormData };

      const singleMock = jest.fn().mockResolvedValue({ data: updatedAuth, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqUserMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqIdMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateAuthMock = jest.fn().mockReturnValue({ eq: eqIdMock });

      const deleteCodesMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const insertCodesMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'environmental_authorizations') {
          return { update: updateAuthMock };
        }
        if (table === 'authorization_waste_codes') {
          return { delete: deleteCodesMock, insert: insertCodesMock };
        }
        return {};
      });

      const result = await authorizationService.update(10, validFormData);

      expect(eqIdMock).toHaveBeenCalledWith('id', 10);
      expect(deleteCodesMock).toHaveBeenCalled();
      expect(insertCodesMock).toHaveBeenCalled();
      expect(result).toEqual(updatedAuth);
    });

    it('delete debe desactivar la autorización (soft delete)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const eqUserMock = jest.fn().mockResolvedValue({ error: null });
      const eqIdMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqIdMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(authorizationService.delete(10)).resolves.toBeUndefined();

      expect(updateMock).toHaveBeenCalledWith({ activo: false });
      expect(eqIdMock).toHaveBeenCalledWith('id', 10);
    });

    it('delete y update deben lanzar error si el usuario no está autenticado o la consulta falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(authorizationService.update(1, validFormData)).rejects.toThrow('Usuario no autenticado');
      await expect(authorizationService.delete(1)).rejects.toThrow('Usuario no autenticado');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      const failSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Update error' } });
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: failSingle }) }) }) }),
      });

      await expect(authorizationService.update(1, validFormData)).rejects.toThrow('Error al actualizar autorización: Update error');
    });

    it('delete debe lanzar error si Supabase falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-auth-1' } },
      });

      const eqUserMock = jest.fn().mockResolvedValue({ error: { message: 'Delete error' } });
      const eqIdMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqIdMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(authorizationService.delete(10)).rejects.toThrow('Error al eliminar autorización: Delete error');
    });
  });
});
