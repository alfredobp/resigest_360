const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import fleetService from '@/services/fleetService';

function createChain(resolvedData: unknown, error: { message: string } | null = null) {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: resolvedData, error }),
    single: jest.fn().mockResolvedValue({ data: resolvedData, error }),
  };
  return chain;
}

describe('fleetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
  });

  it('throws when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(fleetService.getVehicles()).rejects.toThrow('Usuario no autenticado');
    await expect(fleetService.getDrivers()).rejects.toThrow('Usuario no autenticado');
  });

  it('fetches vehicles filtered by user_id', async () => {
    const chain = createChain([{ id: 1, matricula: '1234ABC', activo: true }]);
    mockSupabase.from.mockReturnValue(chain);

    const result = await fleetService.getVehicles();
    expect(mockSupabase.from).toHaveBeenCalledWith('fleet_vehicles');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(result).toHaveLength(1);
  });

  it('creates, updates, and deletes a vehicle', async () => {
    const createChainObj = createChain({ id: 10, matricula: '9999XYZ' });
    mockSupabase.from.mockReturnValue(createChainObj);
    const created = await fleetService.createVehicle({
      tipo: 'tractora',
      matricula: ' 9999 xyz ',
      adr_habilitado: false,
      activo: true,
    });
    expect(created.id).toBe(10);

    const updateChainObj = createChain({ id: 10, matricula: '8888XYZ' });
    mockSupabase.from.mockReturnValue(updateChainObj);
    const updated = await fleetService.updateVehicle(10, { matricula: '8888 xyz' });
    expect(updated.matricula).toBe('8888XYZ');
    expect(updateChainObj.eq).toHaveBeenCalledWith('user_id', 'user-123');

    const delChain: Record<string, jest.Mock> = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn(),
    };
    delChain.eq.mockReturnValueOnce(delChain).mockResolvedValueOnce({ error: null });
    mockSupabase.from.mockReturnValue(delChain);
    await expect(fleetService.deleteVehicle(10)).resolves.toBeUndefined();
  });

  it('creates, updates, and deletes a driver', async () => {
    const createChainObj = createChain({ id: 20, dni: '12345678A' });
    mockSupabase.from.mockReturnValue(createChainObj);
    const created = await fleetService.createDriver({
      nombre_completo: 'Carlos',
      dni: '12345678-a',
      adr_habilitado: false,
      activo: true,
    });
    expect(created.id).toBe(20);

    const updateChainObj = createChain({ id: 20, dni: '12345678A' });
    mockSupabase.from.mockReturnValue(updateChainObj);
    const updated = await fleetService.updateDriver(20, { dni: '12345678A' });
    expect(updated.id).toBe(20);

    const delChain: Record<string, jest.Mock> = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn(),
    };
    delChain.eq.mockReturnValueOnce(delChain).mockResolvedValueOnce({ error: null });
    mockSupabase.from.mockReturnValue(delChain);
    await expect(fleetService.deleteDriver(20)).resolves.toBeUndefined();
  });

  it('computes expiring alerts for vehicles and drivers', async () => {
    const soonDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    const pastDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    const vehChain = createChain([
      {
        id: 1,
        matricula: '1111AAA',
        activo: true,
        itv_caducidad: pastDate,
        seguro_caducidad: soonDate,
        adr_habilitado: true,
        adr_caducidad: soonDate,
      },
      { id: 2, matricula: '2222BBB', activo: false, itv_caducidad: pastDate },
    ]);
    const drvChain = createChain([
      {
        id: 1,
        nombre_completo: 'Driver 1',
        activo: true,
        adr_habilitado: true,
        adr_caducidad: soonDate,
      },
    ]);

    mockSupabase.from
      .mockReturnValueOnce(vehChain)
      .mockReturnValueOnce(drvChain);

    const alerts = await fleetService.getExpiringAlerts(30);
    expect(alerts).toHaveLength(4);
    expect(alerts[0].severity).toBe('critico');
    expect(alerts[0].documentType).toBe('ITV');
  });

  it('throws descriptive errors when supabase fails', async () => {
    const errChain = createChain(null, { message: 'DB error' });
    mockSupabase.from.mockReturnValue(errChain);
    await expect(fleetService.getVehicles()).rejects.toThrow('Error al cargar vehículos: DB error');
    await expect(fleetService.getDrivers()).rejects.toThrow('Error al cargar conductores: DB error');
    await expect(
      fleetService.createVehicle({
        tipo: 'tractora',
        matricula: '1234ABC',
        adr_habilitado: false,
        activo: true,
      })
    ).rejects.toThrow('Error al crear vehículo: DB error');
    await expect(fleetService.updateVehicle(1, { activo: false })).rejects.toThrow(
      'Error al actualizar vehículo: DB error'
    );
    await expect(
      fleetService.createDriver({
        nombre_completo: 'Test',
        dni: '12345678A',
        adr_habilitado: false,
        activo: true,
      })
    ).rejects.toThrow('Error al crear conductor: DB error');
    await expect(fleetService.updateDriver(1, { activo: false })).rejects.toThrow(
      'Error al actualizar conductor: DB error'
    );

    const delErrChain: Record<string, jest.Mock> = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn(),
    };
    delErrChain.eq
      .mockReturnValueOnce(delErrChain)
      .mockResolvedValueOnce({ error: { message: 'Del error' } });
    mockSupabase.from.mockReturnValue(delErrChain);
    await expect(fleetService.deleteVehicle(1)).rejects.toThrow(
      'Error al eliminar vehículo: Del error'
    );

    const delDrvErrChain: Record<string, jest.Mock> = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn(),
    };
    delDrvErrChain.eq
      .mockReturnValueOnce(delDrvErrChain)
      .mockResolvedValueOnce({ error: { message: 'Del error' } });
    mockSupabase.from.mockReturnValue(delDrvErrChain);
    await expect(fleetService.deleteDriver(1)).rejects.toThrow(
      'Error al eliminar conductor: Del error'
    );
  });

  it('throws when unauthenticated on mutations', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(
      fleetService.createVehicle({
        tipo: 'tractora',
        matricula: '1234ABC',
        adr_habilitado: false,
        activo: true,
      })
    ).rejects.toThrow('Usuario no autenticado');
    await expect(fleetService.updateVehicle(1, {})).rejects.toThrow('Usuario no autenticado');
    await expect(fleetService.deleteVehicle(1)).rejects.toThrow('Usuario no autenticado');
    await expect(
      fleetService.createDriver({
        nombre_completo: 'Test',
        dni: '12345678A',
        adr_habilitado: false,
        activo: true,
      })
    ).rejects.toThrow('Usuario no autenticado');
    await expect(fleetService.updateDriver(1, {})).rejects.toThrow('Usuario no autenticado');
    await expect(fleetService.deleteDriver(1)).rejects.toThrow('Usuario no autenticado');
  });
});
