import type { ProductionCenterFormData } from '@/types/wasteManagement';

// Mock del cliente Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Importamos el servicio después de establecer el mock
import { productionCenterService } from '../productionCenterService';

describe('productionCenterService - Entidad Centros de Producción', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByCompanyId', () => {
    it('debe retornar la lista de centros de producción activos de una empresa', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const mockCenters = [
        { id: 1, nombre: 'Planta Principal', company_id: 10, activo: true },
        { id: 2, nombre: 'Almacén Norte', company_id: 10, activo: true },
      ];

      const orderMock = jest.fn().mockResolvedValue({ data: mockCenters, error: null });
      const eqActivoMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const eqCompanyMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqCompanyMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await productionCenterService.getByCompanyId(10);

      expect(mockSupabase.from).toHaveBeenCalledWith('production_centers');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqCompanyMock).toHaveBeenCalledWith('company_id', 10);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-123');
      expect(eqActivoMock).toHaveBeenCalledWith('activo', true);
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toEqual(mockCenters);
    });

    it('debe lanzar un error descriptivo si la consulta falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      const eqActivoMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqUserMock = jest.fn().mockReturnValue({ eq: eqActivoMock });
      const eqCompanyMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqCompanyMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(productionCenterService.getByCompanyId(10)).rejects.toThrow(
        'Error al obtener centros de producción: Database connection failed'
      );
    });
  });

  describe('getById', () => {
    it('debe retornar un centro de producción por su ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const mockCenter = { id: 5, nombre: 'Sede Central', company_id: 12 };

      const singleMock = jest.fn().mockResolvedValue({ data: mockCenter, error: null });
      const eqUserMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await productionCenterService.getById(5);

      expect(mockSupabase.from).toHaveBeenCalledWith('production_centers');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('id', 5);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-123');
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(mockCenter);
    });

    it('debe lanzar un error si falla al obtener el centro por ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });
      const eqUserMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(productionCenterService.getById(99)).rejects.toThrow(
        'Error al obtener centro de producción: Row not found'
      );
    });
  });

  describe('create', () => {
    const validFormData: ProductionCenterFormData = {
      company_id: 10,
      nombre: 'Nuevo Centro',
      direccion: 'Polígono Ind. 4',
      nima: '2800000001',
      municipio: 'Madrid',
      provincia: 'Madrid',
      codigo_postal: '28001',
    };

    it('debe lanzar error si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(productionCenterService.create(validFormData)).rejects.toThrow(
        'Usuario no autenticado'
      );
    });

    it('debe lanzar error si no se proporciona company_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });

      const invalidFormData = { ...validFormData, company_id: 0 as any };

      await expect(productionCenterService.create(invalidFormData)).rejects.toThrow(
        'El ID de la empresa es obligatorio'
      );
    });

    it('debe crear un nuevo centro de producción con activo por defecto en true', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });

      const createdCenter = { id: 101, ...validFormData, activo: true, user_id: 'user-uuid-123' };

      const singleMock = jest.fn().mockResolvedValue({ data: createdCenter, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await productionCenterService.create(validFormData);

      expect(mockSupabase.from).toHaveBeenCalledWith('production_centers');
      expect(insertMock).toHaveBeenCalledWith({
        ...validFormData,
        user_id: 'user-uuid-123',
        activo: true,
      });
      expect(result).toEqual(createdCenter);
    });

    it('debe respetar el valor de activo si se pasa explícitamente false', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });

      const formDataWithInactive = { ...validFormData, activo: false };
      const createdCenter = { id: 102, ...formDataWithInactive, user_id: 'user-uuid-123' };

      const singleMock = jest.fn().mockResolvedValue({ data: createdCenter, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await productionCenterService.create(formDataWithInactive);

      expect(insertMock).toHaveBeenCalledWith({
        ...formDataWithInactive,
        user_id: 'user-uuid-123',
        activo: false,
      });
      expect(result).toEqual(createdCenter);
    });

    it('debe lanzar error si Supabase devuelve un error en la inserción', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violated' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      await expect(productionCenterService.create(validFormData)).rejects.toThrow(
        'Error al crear centro de producción: Unique constraint violated'
      );
    });
  });

  describe('update', () => {
    it('debe actualizar los datos de un centro de producción existente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const updateData = { nombre: 'Centro Actualizado' };
      const updatedCenter = { id: 1, nombre: 'Centro Actualizado', company_id: 10 };

      const singleMock = jest.fn().mockResolvedValue({ data: updatedCenter, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqUserMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      const result = await productionCenterService.update(1, updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('production_centers');
      expect(updateMock).toHaveBeenCalledWith(updateData);
      expect(eqMock).toHaveBeenCalledWith('id', 1);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-123');
      expect(result).toEqual(updatedCenter);
    });

    it('debe lanzar error si falla la actualización', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error on update' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqUserMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(productionCenterService.update(1, { nombre: 'Test' })).rejects.toThrow(
        'Error al actualizar centro de producción: Database error on update'
      );
    });
  });

  describe('softDelete', () => {
    it('debe realizar un borrado lógico marcando activo como false', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const eqUserMock = jest.fn().mockResolvedValue({ error: null });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(productionCenterService.softDelete(1)).resolves.toBeUndefined();

      expect(mockSupabase.from).toHaveBeenCalledWith('production_centers');
      expect(updateMock).toHaveBeenCalledWith({ activo: false });
      expect(eqMock).toHaveBeenCalledWith('id', 1);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-123');
    });

    it('debe lanzar error si falla el borrado lógico', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const eqUserMock = jest.fn().mockResolvedValue({
        error: { message: 'Foreign key error' },
      });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(productionCenterService.softDelete(1)).rejects.toThrow(
        'Error al desactivar centro de producción: Foreign key error'
      );
    });
  });

  describe('delete', () => {
    it('debe eliminar permanentemente el centro de producción', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const eqUserMock = jest.fn().mockResolvedValue({ error: null });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ delete: deleteMock });

      await expect(productionCenterService.delete(1)).resolves.toBeUndefined();

      expect(mockSupabase.from).toHaveBeenCalledWith('production_centers');
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 1);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-123');
    });

    it('debe lanzar error si falla la eliminación permanente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
      });
      const eqUserMock = jest.fn().mockResolvedValue({
        error: { message: 'Delete constraint violation' },
      });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ delete: deleteMock });

      await expect(productionCenterService.delete(1)).rejects.toThrow(
        'Error al eliminar centro de producción: Delete constraint violation'
      );
    });
  });
});
