const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

const mockGetActiveCompanyCookie = jest.fn<number | null, []>(() => null);
jest.mock('@/services/tenantContextService', () => ({
  getActiveCompanyCookie: () => mockGetActiveCompanyCookie(),
  applyTenantScope: (query: any, userId: string, activeCompanyId?: number | null) => {
    const cid = activeCompanyId !== undefined ? activeCompanyId : mockGetActiveCompanyCookie();
    if (cid && typeof query.or === 'function') {
      return query.or(`user_id.eq.${userId},company_id.eq.${cid}`);
    }
    return query.eq('user_id', userId);
  },
}));

import fleetService from '../fleetService';
import type { Carrier } from '@/types/wasteManagement';

const createQueryChain = (resolvedData: any, error: any = null) => {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: resolvedData, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data: resolvedData, error }),
    then: (resolve: any) => Promise.resolve({ data: resolvedData, error }).then(resolve),
  };
  return chain;
};

describe('fleetService - Gestión relacional multi-tenant de Conductores y Vehículos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveCompanyCookie.mockReturnValue(null);
  });

  describe('Autenticación', () => {
    it('debe lanzar error si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(fleetService.getDrivers()).rejects.toThrow('Usuario no autenticado');
      await expect(fleetService.getVehicles()).rejects.toThrow('Usuario no autenticado');
      await expect(fleetService.createDriver({ nombre: 'Test' })).rejects.toThrow('Usuario no autenticado');
      await expect(fleetService.createVehicle({ matricula: '1234-BBB' })).rejects.toThrow('Usuario no autenticado');
    });
  });

  describe('Conductores (carrier_drivers)', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-fleet-1' } } });
    });

    it('debe listar conductores aplicando aislamiento multi-tenant y filtros opcionales', async () => {
      const chain = createQueryChain([{ id: 1, nombre: 'Carlos', activo: true }]);
      mockSupabase.from.mockReturnValueOnce(chain);

      const res = await fleetService.getDrivers({ companyId: 42, carrierId: 7 });

      expect(mockSupabase.from).toHaveBeenCalledWith('carrier_drivers');
      expect(chain.or).toHaveBeenCalledWith('user_id.eq.user-fleet-1,company_id.eq.42');
      expect(chain.eq).toHaveBeenCalledWith('activo', true);
      expect(chain.eq).toHaveBeenCalledWith('carrier_id', 7);
      expect(res).toHaveLength(1);
    });

    it('debe lanzar error si falla la consulta de conductores', async () => {
      mockSupabase.from.mockReturnValueOnce(createQueryChain(null, { message: 'DB error' }));
      await expect(fleetService.getDrivers()).rejects.toThrow('Error al obtener conductores: DB error');
    });

    it('debe obtener un conductor por ID y manejar errores', async () => {
      mockSupabase.from.mockReturnValueOnce(createQueryChain({ id: 5, nombre: 'Ana' }));
      const driver = await fleetService.getDriverById(5);
      expect(driver?.nombre).toBe('Ana');

      mockSupabase.from.mockReturnValueOnce(createQueryChain(null, { message: 'Not found err' }));
      await expect(fleetService.getDriverById(5)).rejects.toThrow('Error al obtener conductor: Not found err');
    });

    it('debe crear un conductor normalizando DNI y matrículas', async () => {
      const chain = createQueryChain({ id: 10, nombre: 'Carlos', dni: '12345678Z' });
      mockSupabase.from.mockReturnValueOnce(chain);

      const created = await fleetService.createDriver({
        company_id: 42,
        nombre: '  Carlos  ',
        dni: '12345678-z',
        telefono: '600123123',
        vehiculo_asignado: '1234 bbb',
        remolque_asignado: 'r-1234-bbb',
        tiene_adr: true,
        fecha_caducidad_adr: '2027-01-01',
      });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-fleet-1',
          company_id: 42,
          nombre: 'Carlos',
          dni: '12345678Z',
          vehiculo_asignado: '1234 BBB',
          remolque_asignado: 'R-1234-BBB',
          tiene_adr: true,
          fecha_caducidad_adr: '2027-01-01',
        })
      );
      expect(created.id).toBe(10);
    });

    it('debe actualizar, activar/desactivar y eliminar un conductor', async () => {
      const updateChain = createQueryChain({ id: 10, nombre: 'Carlos Mod', activo: false });
      mockSupabase.from.mockReturnValueOnce(updateChain);

      const updated = await fleetService.updateDriver(10, {
        nombre: 'Carlos Mod',
        dni: '12345678-z',
        telefono: '611000000',
        email: 'c@trans.es',
        vehicle_id: 3,
        carrier_id: 2,
        vehiculo_asignado: '9999-zzz',
        remolque_asignado: 'r-9999-zzz',
        carnet_tipo: 'C+E',
        tiene_adr: false,
        fecha_caducidad_adr: '2027-01-01',
        fecha_caducidad_cap: '2028-01-01',
        notas: 'ok',
        activo: false,
      });

      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Carlos Mod',
          tiene_adr: false,
          fecha_caducidad_adr: null,
          activo: false,
        })
      );
      expect(updated.activo).toBe(false);

      const toggleChain = createQueryChain({ id: 10, activo: true });
      mockSupabase.from.mockReturnValueOnce(toggleChain);
      await fleetService.toggleDriverActive(10, true);
      expect(toggleChain.update).toHaveBeenCalledWith({ activo: true });

      const deleteChain = createQueryChain(null, null);
      mockSupabase.from.mockReturnValueOnce(deleteChain);
      await fleetService.deleteDriver(10);
      expect(deleteChain.delete).toHaveBeenCalled();

      const deleteErrChain = createQueryChain(null, { message: 'FK error' });
      mockSupabase.from.mockReturnValueOnce(deleteErrChain);
      await expect(fleetService.deleteDriver(10)).rejects.toThrow('Error al eliminar conductor: FK error');
    });
  });

  describe('Vehículos (carrier_vehicles)', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-fleet-1' } } });
    });

    it('debe listar vehículos con aislamiento multi-tenant y filtros', async () => {
      const chain = createQueryChain([{ id: 1, matricula: '1234-BBB', tipo: 'Tractora', activo: true }]);
      mockSupabase.from.mockReturnValueOnce(chain);

      const res = await fleetService.getVehicles({ companyId: 99, carrierId: 3 });

      expect(mockSupabase.from).toHaveBeenCalledWith('carrier_vehicles');
      expect(chain.or).toHaveBeenCalledWith('user_id.eq.user-fleet-1,company_id.eq.99');
      expect(chain.eq).toHaveBeenCalledWith('activo', true);
      expect(chain.eq).toHaveBeenCalledWith('carrier_id', 3);
      expect(res).toHaveLength(1);
    });

    it('debe obtener un vehículo por ID y lanzar error si falla', async () => {
      mockSupabase.from.mockReturnValueOnce(createQueryChain({ id: 8, matricula: '5555-CCC' }));
      const veh = await fleetService.getVehicleById(8);
      expect(veh?.matricula).toBe('5555-CCC');

      mockSupabase.from.mockReturnValueOnce(createQueryChain(null, { message: 'Err veh' }));
      await expect(fleetService.getVehicleById(8)).rejects.toThrow('Error al obtener vehículo: Err veh');
    });

    it('debe crear un vehículo validando matrícula obligatoria y normalizando datos', async () => {
      await expect(fleetService.createVehicle({ matricula: '   ' })).rejects.toThrow(
        'La matrícula del vehículo es obligatoria'
      );

      const chain = createQueryChain({ id: 20, matricula: '1234-BBB', tipo: 'Tractora' });
      mockSupabase.from.mockReturnValueOnce(chain);

      const created = await fleetService.createVehicle({
        matricula: '1234-bbb',
        tipo: 'Cisterna',
        remolque_habitual: 'r-1234-bbb',
        marca_modelo: 'Volvo FH',
        mma_kg: 40000,
        tara_kg: 14500,
        fecha_caducidad_itv: '2027-01-01',
        fecha_caducidad_seguro: '2027-02-01',
        tiene_adr: true,
        fecha_caducidad_adr: '2027-03-01',
        tarjeta_transporte: 'MDP-1',
      });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          matricula: '1234-BBB',
          tipo: 'Cisterna',
          remolque_habitual: 'R-1234-BBB',
          mma_kg: 40000,
          tara_kg: 14500,
          tiene_adr: true,
          fecha_caducidad_adr: '2027-03-01',
        })
      );
      expect(created.id).toBe(20);
    });

    it('debe actualizar, desactivar y eliminar un vehículo', async () => {
      await expect(fleetService.updateVehicle(20, { matricula: '' })).rejects.toThrow(
        'La matrícula del vehículo es obligatoria'
      );

      const updateChain = createQueryChain({ id: 20, matricula: '2222-DDD', activo: true });
      mockSupabase.from.mockReturnValueOnce(updateChain);

      await fleetService.updateVehicle(20, {
        matricula: '2222-ddd',
        tipo: 'Rígido',
        remolque_habitual: 'r-2222-ddd',
        marca_modelo: 'Scania',
        mma_kg: 26000,
        tara_kg: 11000,
        fecha_caducidad_itv: '2027-05-01',
        fecha_caducidad_seguro: '2027-06-01',
        tiene_adr: false,
        fecha_caducidad_adr: '2027-07-01',
        tarjeta_transporte: 'MDP-2',
        autorizacion_especial: 'RP',
        notas: 'Revisión OK',
        activo: true,
      });

      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          matricula: '2222-DDD',
          tiene_adr: false,
          fecha_caducidad_adr: null,
        })
      );

      const toggleChain = createQueryChain({ id: 20, activo: false });
      mockSupabase.from.mockReturnValueOnce(toggleChain);
      await fleetService.toggleVehicleActive(20, false);
      expect(toggleChain.update).toHaveBeenCalledWith({ activo: false });

      const deleteChain = createQueryChain(null, null);
      mockSupabase.from.mockReturnValueOnce(deleteChain);
      await fleetService.deleteVehicle(20);
      expect(deleteChain.delete).toHaveBeenCalled();

      const deleteErrChain = createQueryChain(null, { message: 'Del err' });
      mockSupabase.from.mockReturnValueOnce(deleteErrChain);
      await expect(fleetService.deleteVehicle(20)).rejects.toThrow('Error al eliminar vehículo: Del err');

      // INC10: Traducción legible de error 23505 / uq_carrier_vehicles_company_norm_plate en create y update
      const dupCreateChain = createQueryChain(null, {
        code: '23505',
        message: 'duplicate key value violates unique constraint "uq_carrier_vehicles_company_norm_plate"',
      });
      mockSupabase.from.mockReturnValueOnce(dupCreateChain);
      await expect(fleetService.createVehicle({ matricula: '2345ZZZ' })).rejects.toThrow(
        'Ya existe un vehículo activo con la matrícula'
      );

      const dupUpdateChain = createQueryChain(null, {
        code: '23505',
        message: 'duplicate key value violates unique constraint "uq_carrier_vehicles_company_norm_plate"',
      });
      mockSupabase.from.mockReturnValueOnce(dupUpdateChain);
      await expect(fleetService.updateVehicle(20, { matricula: '2345ZZZ' })).rejects.toThrow(
        'Ya existe un vehículo activo con esa matrícula'
      );
    });
  });

  describe('syncLegacyFleetFromCarriers', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-fleet-1' } } });
    });

    it('debe importar vehículos y conductores legacy sin duplicar los ya existentes', async () => {
      expect(await fleetService.syncLegacyFleetFromCarriers([])).toEqual({
        importedVehicles: 0,
        importedDrivers: 0,
      });

      // getVehicles existente + getDrivers existente
      mockSupabase.from
        .mockReturnValueOnce(createQueryChain([{ id: 1, matricula: '1111-AAA', activo: true }]))
        .mockReturnValueOnce(createQueryChain([{ id: 1, nombre: 'Ya Existe', dni: '12345678Z', activo: true }]))
        // createVehicle para el vehículo nuevo
        .mockReturnValueOnce(createQueryChain({ id: 2, matricula: '2222-BBB' }))
        // createDriver para el conductor nuevo
        .mockReturnValueOnce(createQueryChain({ id: 2, nombre: 'Nuevo Conductor' }));

      const carriers: Carrier[] = [
        {
          id: 50,
          user_id: 'user-fleet-1',
          razon_social: 'Trans Demo SL',
          cif: 'B12345678',
          activo: true,
          created_at: '',
          updated_at: '',
          source: 'carriers',
          flota_vehiculos: [
            { id: 'v1', matricula: '1111-AAA', tipo: 'Tractora' }, // duplicado
            { id: 'v2', matricula: '2222-BBB', tipo: 'Rígido', remolque: 'R-2222' }, // nuevo
          ],
          flota_conductores: [
            { id: 'd1', nombre: 'Ya Existe', dni: '12345678Z' }, // duplicado por DNI
            { id: 'd2', nombre: 'Nuevo Conductor', telefono: '600000000' }, // nuevo
          ],
        },
      ];

      const summary = await fleetService.syncLegacyFleetFromCarriers(carriers, 10);

      expect(summary).toEqual({
        importedVehicles: 1,
        importedDrivers: 1,
      });
    });
  });
});
