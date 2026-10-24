const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

const mockHoldedService = {
  createContact: jest.fn(),
  updateContact: jest.fn(),
};
jest.mock('../holdedService', () => ({
  holdedService: mockHoldedService,
}));

const mockCompanyService = {
  getUserCompany: jest.fn(),
};
jest.mock('../companyService', () => ({
  companyService: mockCompanyService,
}));

import { treatmentManagerService } from '../treatmentManagerService';
import type { TreatmentManagerFormData } from '@/types/wasteManagement';

describe('treatmentManagerService - Gestores de Tratamiento Autorizados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(treatmentManagerService.getAll()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe combinar gestores de treatment_managers con empresas de rol gestor sin duplicar CIFs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-tm-1' } },
      });

      const managersList = [
        { id: 1, user_id: 'user-tm-1', razon_social: 'Gestor A', cif: 'A11111111', activo: true },
      ];

      const unifiedCompanies = [
        // Mismo CIF -> no se duplica
        { id: 10, user_id: 'user-tm-1', razon_social: 'Gestor A Duplicado', cif: 'A11111111', roles: ['gestor'], activo: true },
        // Nuevo gestor con array roles
        { id: 20, user_id: 'user-tm-1', razon_social: 'Gestor B', cif: 'A22222222', roles: ['gestor'], activo: true },
        // Nuevo gestor con tipo_empresa legado
        { id: 30, user_id: 'user-tm-1', razon_social: 'Gestor C', cif: 'A33333333', tipo_empresa: 'gestor', roles: null, activo: true },
        // Otro rol
        { id: 40, user_id: 'user-tm-1', razon_social: 'Transportista D', cif: 'A44444444', roles: ['transportista'], activo: true },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'treatment_managers') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: managersList, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: unifiedCompanies, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await treatmentManagerService.getAll();

      expect(result).toHaveLength(3);
      expect(result.map(g => g.cif)).toEqual(['A11111111', 'A22222222', 'A33333333']);
    });

    it('debe devolver la lista incluso si la integración con companies falla', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-tm-1' } },
      });

      const managersList = [{ id: 1, cif: 'A11111111' }];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'treatment_managers') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: managersList, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'companies') {
          throw new Error('Companies connection error');
        }
        return {};
      });

      const result = await treatmentManagerService.getAll();

      expect(result).toEqual(managersList);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getById', () => {
    it('debe retornar un gestor por su ID', async () => {
      const mockManager = { id: 3, nombre: 'Planta Tratamiento Norte' };

      const singleMock = jest.fn().mockResolvedValue({ data: mockManager, error: null });
      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await treatmentManagerService.getById(3);

      expect(eqMock).toHaveBeenCalledWith('id', 3);
      expect(result).toEqual(mockManager);
    });

    it('debe lanzar error si no se encuentra el gestor o falla la consulta', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Manager not found' },
      });
      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(treatmentManagerService.getById(99)).rejects.toThrow(
        'Error al obtener gestor: Manager not found'
      );
    });
  });

  describe('create con sincronización Holded', () => {
    const validManagerData: TreatmentManagerFormData = {
      nombre: 'Gestora Integral',
      razon_social: 'Gestora Integral S.A.',
      cif: 'A12345678',
      direccion: 'Polígono Verde 5',
      municipio: 'Pinto',
      provincia: 'Madrid',
      codigo_postal: '28320',
      telefono: '915555555',
      email: 'gestora@reciclaje.com',
    };

    it('debe fallar si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(treatmentManagerService.create(validManagerData)).rejects.toThrow(
        'Usuario no autenticado'
      );
    });

    it('debe crear el gestor y sincronizarlo con Holded si hay API Key', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-tm-1' } },
      });

      mockCompanyService.getUserCompany.mockResolvedValue({
        id: 1,
        holded_api_key: 'holded_key_tm_123',
      });

      mockHoldedService.createContact.mockResolvedValue({
        id: 'holded-tm-888',
      });

      const createdManager = { id: 10, ...validManagerData, user_id: 'user-tm-1' };

      const singleInsertMock = jest.fn().mockResolvedValue({ data: createdManager, error: null });
      const selectInsertMock = jest.fn().mockReturnValue({ single: singleInsertMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectInsertMock });

      const updateHoldedMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'treatment_managers') {
          return {
            insert: insertMock,
            update: updateHoldedMock,
          };
        }
        return {};
      });

      const result = await treatmentManagerService.create(validManagerData);

      expect(mockHoldedService.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Gestora Integral S.A.',
          email: 'gestora@reciclaje.com',
          type: 'supplier',
          isSupplier: 1,
        }),
        'holded_key_tm_123'
      );
      expect(result.holded_contact_id).toBe('holded-tm-888');
    });

    it('debe crear el gestor sin fallar si la llamada a Holded falla', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-tm-1' } },
      });

      mockCompanyService.getUserCompany.mockResolvedValue({
        holded_api_key: 'holded_key_tm_123',
      });

      mockHoldedService.createContact.mockRejectedValue(new Error('Holded 500 server error'));

      const createdManager = { id: 11, ...validManagerData, user_id: 'user-tm-1' };

      const singleInsertMock = jest.fn().mockResolvedValue({ data: createdManager, error: null });
      const selectInsertMock = jest.fn().mockReturnValue({ single: singleInsertMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectInsertMock });

      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await treatmentManagerService.create(validManagerData);

      expect(result.id).toBe(11);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('debe lanzar error si la inserción en Supabase falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      mockCompanyService.getUserCompany.mockResolvedValue(null);

      const singleInsertFail = jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleInsertFail }) }),
      });

      await expect(treatmentManagerService.create(validManagerData)).rejects.toThrow('Error al crear gestor: Insert failed');
    });
  });

  describe('update, softDelete y delete', () => {
    it('update debe actualizar los datos del gestor y sincronizar con Holded', async () => {
      jest.spyOn(treatmentManagerService, 'getById').mockResolvedValue({
        id: 4,
        nombre: 'Antiguo',
        holded_contact_id: 'holded-contact-4',
      } as any);

      mockCompanyService.getUserCompany.mockResolvedValue({
        holded_api_key: 'holded_key_tm',
      });

      const updatedManager = { id: 4, nombre: 'Nuevo Nombre', razon_social: 'Nuevo S.A.' };

      const singleUpdateMock = jest.fn().mockResolvedValue({ data: updatedManager, error: null });
      const selectUpdateMock = jest.fn().mockReturnValue({ single: singleUpdateMock });
      const eqUpdateMock = jest.fn().mockReturnValue({ select: selectUpdateMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqUpdateMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      mockHoldedService.updateContact.mockResolvedValue({});

      const result = await treatmentManagerService.update(4, { nombre: 'Nuevo Nombre' });

      expect(mockHoldedService.updateContact).toHaveBeenCalledWith(
        'holded-contact-4',
        expect.objectContaining({ name: 'Nuevo S.A.' }),
        'holded_key_tm'
      );
      expect(result).toEqual(updatedManager);
    });

    it('update debe tolerar fallos en Holded y lanzar error si falla Supabase', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      jest.spyOn(treatmentManagerService, 'getById').mockResolvedValue({
        id: 4,
        holded_contact_id: 'holded-4',
      } as any);

      mockCompanyService.getUserCompany.mockResolvedValue({ holded_api_key: 'key' });
      mockHoldedService.updateContact.mockRejectedValue(new Error('Update failed in Holded'));

      const singleUpdateMock = jest.fn().mockResolvedValue({ data: { id: 4 }, error: null });
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleUpdateMock }) }) }),
      });

      const result = await treatmentManagerService.update(4, {});
      expect(result.id).toBe(4);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();

      // Error en Supabase
      const singleFail = jest.fn().mockResolvedValue({ data: null, error: { message: 'Update DB error' } });
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleFail }) }) }),
      });

      await expect(treatmentManagerService.update(4, {})).rejects.toThrow('Error al actualizar gestor: Update DB error');
    });

    it('softDelete y delete deben gestionar el borrado lógico y físico', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });

      mockSupabase.from.mockImplementation(() => ({
        update: updateMock,
        delete: deleteMock,
      }));

      await expect(treatmentManagerService.softDelete(1)).resolves.toBeUndefined();
      expect(updateMock).toHaveBeenCalledWith({ activo: false });

      await expect(treatmentManagerService.delete(1)).resolves.toBeUndefined();
      expect(deleteMock).toHaveBeenCalled();
    });

    it('softDelete y delete deben lanzar error si Supabase falla', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: { message: 'Soft error' } }) }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: { message: 'Delete error' } }) }),
      }));

      await expect(treatmentManagerService.softDelete(1)).rejects.toThrow('Error al desactivar gestor: Soft error');
      await expect(treatmentManagerService.delete(1)).rejects.toThrow('Error al eliminar gestor: Delete error');
    });
  });
});
