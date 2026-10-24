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

import { carrierService } from '../carrierService';
import type { Carrier, CarrierFormData } from '@/types/wasteManagement';

describe('carrierService - Gestión de Transportistas e Integración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(carrierService.getAll()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe combinar transportistas de la tabla carriers con empresas con rol transportista unificadas sin duplicar CIFs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const carriersList = [
        { id: 1, user_id: 'user-1', razon_social: 'Trans A', cif: 'B11111111', activo: true },
      ];

      const unifiedCompanies = [
        // Mismo CIF que en carriers -> no se debe duplicar
        { id: 10, user_id: 'user-1', razon_social: 'Trans A Duplicado', cif: 'B11111111', roles: ['transportista'], activo: true },
        // Nuevo transportista con array roles
        { id: 20, user_id: 'user-1', razon_social: 'Trans B', cif: 'B22222222', roles: ['transportista'], activo: true },
        // Nuevo transportista con tipo_empresa legado
        { id: 30, user_id: 'user-1', razon_social: 'Trans C', cif: 'B33333333', tipo_empresa: 'transportista', roles: null, activo: true },
        // Empresa con otro rol -> no se debe incluir
        { id: 40, user_id: 'user-1', razon_social: 'Productor D', cif: 'B44444444', roles: ['productor'], activo: true },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carriers') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: carriersList, error: null }),
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

      const result = await carrierService.getAll();

      expect(result).toHaveLength(3);
      expect(result.map(c => c.cif)).toEqual(['B11111111', 'B22222222', 'B33333333']);
    });

    it('debe devolver la lista de carriers incluso si la consulta a companies falla', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const carriersList = [
        { id: 1, user_id: 'user-1', razon_social: 'Trans A', cif: 'B11111111' },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carriers') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: carriersList, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'companies') {
          throw new Error('Companies table error');
        }
        return {};
      });

      const result = await carrierService.getAll();

      expect(result).toEqual(carriersList);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getById', () => {
    it('debe retornar un transportista por su ID', async () => {
      const mockCarrier = { id: 5, razon_social: 'Transportes Rápidos S.L.' };

      const singleMock = jest.fn().mockResolvedValue({ data: mockCarrier, error: null });
      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await carrierService.getById(5);

      expect(eqMock).toHaveBeenCalledWith('id', 5);
      expect(result).toEqual(mockCarrier);
    });

    it('debe lanzar error si la consulta por ID falla', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Carrier not found' },
      });
      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(carrierService.getById(99)).rejects.toThrow(
        'Error al obtener transportista: Carrier not found'
      );
    });
  });

  describe('create con sincronización Holded', () => {
    const validCarrierData: CarrierFormData = {
      razon_social: 'Transportes Express S.L.',
      cif: 'B99999999',
      direccion: 'C/ Logística 1',
      municipio: 'Madrid',
      provincia: 'Madrid',
      codigo_postal: '28001',
      telefono: '912345678',
      email: 'info@express.com',
    };

    it('debe fallar si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(carrierService.create(validCarrierData)).rejects.toThrow('Usuario no autenticado');
    });

    it('debe crear el transportista y sincronizarlo con Holded si la empresa tiene API Key', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      mockCompanyService.getUserCompany.mockResolvedValue({
        id: 10,
        holded_api_key: 'holded_secret_key_123',
      });

      mockHoldedService.createContact.mockResolvedValue({
        id: 'holded-contact-999',
      });

      const createdCarrier = { id: 7, ...validCarrierData, user_id: 'user-1' };

      const singleInsertMock = jest.fn().mockResolvedValue({ data: createdCarrier, error: null });
      const selectInsertMock = jest.fn().mockReturnValue({ single: singleInsertMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectInsertMock });

      const updateHoldedMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carriers') {
          return {
            insert: insertMock,
            update: updateHoldedMock,
          };
        }
        return {};
      });

      const result = await carrierService.create(validCarrierData);

      expect(mockHoldedService.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Transportes Express S.L.',
          email: 'info@express.com',
          type: 'supplier',
          isSupplier: 1,
        }),
        'holded_secret_key_123'
      );
      expect(result.holded_contact_id).toBe('holded-contact-999');
    });

    it('debe crear el transportista sin fallar si la sincronización con Holded arroja un error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      mockCompanyService.getUserCompany.mockResolvedValue({
        id: 10,
        holded_api_key: 'holded_secret_key_123',
      });

      mockHoldedService.createContact.mockRejectedValue(new Error('Holded API timeout'));

      const createdCarrier = { id: 8, ...validCarrierData, user_id: 'user-1' };

      const singleInsertMock = jest.fn().mockResolvedValue({ data: createdCarrier, error: null });
      const selectInsertMock = jest.fn().mockReturnValue({ single: singleInsertMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectInsertMock });

      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await carrierService.create(validCarrierData);

      expect(result.id).toBe(8);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('No se pudo sincronizar con Holded:'),
        expect.anything()
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('debe actualizar el transportista y sincronizar cambio con Holded', async () => {
      jest.spyOn(carrierService, 'getById').mockResolvedValue({
        id: 5,
        razon_social: 'Nombre Antiguo',
        holded_contact_id: 'holded-555',
      } as any);

      mockCompanyService.getUserCompany.mockResolvedValue({
        id: 1,
        holded_api_key: 'holded_api_key_abc',
      });

      const updatedCarrier = {
        id: 5,
        razon_social: 'Nombre Nuevo',
        cif: 'B11111111',
      };

      const singleUpdateMock = jest.fn().mockResolvedValue({ data: updatedCarrier, error: null });
      const selectUpdateMock = jest.fn().mockReturnValue({ single: singleUpdateMock });
      const eqUpdateMock = jest.fn().mockReturnValue({ select: selectUpdateMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqUpdateMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      mockHoldedService.updateContact.mockResolvedValue({});

      const result = await carrierService.update(5, { razon_social: 'Nombre Nuevo' });

      expect(mockHoldedService.updateContact).toHaveBeenCalledWith(
        'holded-555',
        expect.objectContaining({ name: 'Nombre Nuevo' }),
        'holded_api_key_abc'
      );
      expect(result).toEqual(updatedCarrier);
    });

    it('debe actualizar el transportista sin fallar si la actualización en Holded arroja error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      jest.spyOn(carrierService, 'getById').mockResolvedValue({
        id: 5,
        holded_contact_id: 'holded-555',
      } as any);

      mockCompanyService.getUserCompany.mockResolvedValue({
        holded_api_key: 'holded_api_key_abc',
      });

      const updatedCarrier = { id: 5, razon_social: 'Nombre' };
      const singleUpdateMock = jest.fn().mockResolvedValue({ data: updatedCarrier, error: null });
      const selectUpdateMock = jest.fn().mockReturnValue({ single: singleUpdateMock });
      const eqUpdateMock = jest.fn().mockReturnValue({ select: selectUpdateMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqUpdateMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      mockHoldedService.updateContact.mockRejectedValue(new Error('Holded contact not found'));

      const result = await carrierService.update(5, { razon_social: 'Nombre' });

      expect(result).toEqual(updatedCarrier);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('softDelete y delete', () => {
    it('softDelete debe desactivar el transportista', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(carrierService.softDelete(1)).resolves.toBeUndefined();
      expect(updateMock).toHaveBeenCalledWith({ activo: false });
    });

    it('softDelete debe lanzar error si Supabase falla', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: { message: 'Soft delete error' } });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(carrierService.softDelete(1)).rejects.toThrow('Error al desactivar transportista: Soft delete error');
    });

    it('delete debe eliminar el transportista de la base de datos', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ delete: deleteMock });

      await expect(carrierService.delete(1)).resolves.toBeUndefined();
      expect(deleteMock).toHaveBeenCalled();
    });

    it('delete debe lanzar error si Supabase falla', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: { message: 'Delete error' } });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ delete: deleteMock });

      await expect(carrierService.delete(1)).rejects.toThrow('Error al eliminar transportista: Delete error');
    });

    it('create y update deben lanzar error si Supabase falla en la inserción o actualización', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      mockCompanyService.getUserCompany.mockResolvedValue(null);

      const singleInsertFail = jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleInsertFail }) }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: singleInsertFail }) }) }),
      });

      await expect(carrierService.create({ razon_social: 'Test' } as any)).rejects.toThrow('Error al crear transportista: Insert failed');
      await expect(carrierService.update(1, { razon_social: 'Test' } as any)).rejects.toThrow('Error al actualizar transportista: Insert failed');
    });
  });
});
