jest.mock('@/services/identificationDocumentService', () => ({
  __esModule: true,
  default: { getAll: jest.fn().mockResolvedValue([]) },
}));
jest.mock('@/services/priorNotificationService', () => ({
  priorNotificationService: { getAll: jest.fn().mockResolvedValue([]) },
}));
jest.mock('@/services/wasteContractService', () => ({
  __esModule: true,
  default: { getAll: jest.fn().mockResolvedValue([]) },
}));
jest.mock('@/services/authorizationService', () => ({
  __esModule: true,
  default: { getByCompany: jest.fn().mockResolvedValue([]) },
}));
jest.mock('@/services/decaService', () => ({
  decaService: { getAll: jest.fn().mockResolvedValue([]) },
}));
jest.mock('@/services/fleetService', () => ({
  __esModule: true,
  default: {
    getVehicles: jest.fn().mockResolvedValue([]),
    getDrivers: jest.fn().mockResolvedValue([]),
  },
}));

import calendarService, { buildCalendarEvents } from '@/services/calendarService';

describe('calendarService', () => {
  it('builds general events (DI, NT, contracts, authorizations) and excludes transportista items when false', () => {
    const events = buildCalendarEvents({
      isTransportista: false,
      dis: [
        {
          id: 1,
          numero_documento: 'DI-001',
          codigo_ler: '15 01 01',
          fecha_documento: '2026-11-28',
          productor_razon_social: 'Prod S.L.',
          gestor_razon_social: 'Gestor S.A.',
          cantidad: 10,
          unidad: 'toneladas',
        } as never,
      ],
      nts: [
        {
          id: 2,
          numero_notificacion: 'NT-002',
          codigo_ler: '13 02 08*',
          fecha_inicio: '2026-11-28',
          fecha_fin: '2026-12-05',
          estado: 'aceptada',
        } as never,
      ],
      contracts: [
        {
          id: 3,
          numero_contrato: 'CT-003',
          fecha_fin: '2026-12-15',
          estado: 'vigente',
        } as never,
      ],
      authorizations: [
        {
          id: 4,
          numero_autorizacion: 'AUT-004',
          tipo_autorizacion: 'G01',
          fecha_vencimiento: '2026-12-20',
        } as never,
      ],
      decas: [{ id: 5, numero_deca: 'DECA-5', fecha_transporte: '2026-11-28', is_vigente: true } as never],
    });

    expect(events.map((e) => e.category)).toEqual(['di', 'nt', 'contrato', 'autorizacion']);
  });

  it('includes DeCA, ITV, Seguro, ADR and CAP events in transportista mode', () => {
    const events = buildCalendarEvents({
      isTransportista: true,
      dis: [],
      nts: [],
      contracts: [],
      authorizations: [],
      decas: [
        {
          id: 10,
          numero_deca: 'DECA-10',
          matricula_tractora: '1234ABC',
          origen_municipio: 'Sevilla',
          destino_municipio: 'Córdoba',
          fecha_transporte: '2026-11-28',
          estado: 'vigente',
          is_vigente: true,
        } as never,
        {
          id: 11,
          numero_deca: 'DECA-OLD',
          fecha_transporte: '2026-11-28',
          is_vigente: false,
        } as never,
      ],
      vehicles: [
        {
          id: 20,
          matricula: '1234ABC',
          tipo: 'Tractora',
          activo: true,
          tiene_adr: true,
          fecha_caducidad_itv: '2026-12-01',
          fecha_caducidad_seguro: '2026-12-10',
          fecha_caducidad_adr: '2026-12-15',
        } as never,
        {
          id: 21,
          matricula: 'INACTIVE',
          activo: false,
          fecha_caducidad_itv: '2026-12-01',
        } as never,
      ],
      drivers: [
        {
          id: 30,
          nombre: 'Carlos',
          activo: true,
          tiene_adr: true,
          fecha_caducidad_adr: '2026-12-18',
          fecha_caducidad_cap: '2026-12-22',
        } as never,
      ],
    });

    expect(events).toHaveLength(6);
    expect(events.some((e) => e.category === 'deca')).toBe(true);
    expect(events.some((e) => e.category === 'flota_itv_seguro')).toBe(true);
    expect(events.some((e) => e.category === 'flota_adr_cap')).toBe(true);
  });

  it('loads operational events via getOperationalEvents', async () => {
    const res1 = await calendarService.getOperationalEvents({
      companyId: 1,
      isTransportista: true,
    });
    expect(Array.isArray(res1)).toBe(true);

    const res2 = await calendarService.getOperationalEvents({
      companyId: null,
      isTransportista: false,
    });
    expect(Array.isArray(res2)).toBe(true);
  });

  it('handles rejected service calls and invalid dates gracefully', async () => {
    const diSvc = jest.requireMock('@/services/identificationDocumentService').default;
    const ntSvc = jest.requireMock('@/services/priorNotificationService').priorNotificationService;
    const ctSvc = jest.requireMock('@/services/wasteContractService').default;
    const authSvc = jest.requireMock('@/services/authorizationService').default;
    const decaSvc = jest.requireMock('@/services/decaService').decaService;
    const fleetSvc = jest.requireMock('@/services/fleetService').default;

    diSvc.getAll.mockRejectedValueOnce(new Error('DI fail'));
    ntSvc.getAll.mockRejectedValueOnce(new Error('NT fail'));
    ctSvc.getAll.mockRejectedValueOnce(new Error('CT fail'));
    authSvc.getByCompany.mockRejectedValueOnce(new Error('Auth fail'));
    decaSvc.getAll.mockRejectedValueOnce(new Error('Deca fail'));
    fleetSvc.getVehicles.mockRejectedValueOnce(new Error('Veh fail'));
    fleetSvc.getDrivers.mockRejectedValueOnce(new Error('Drv fail'));

    const res = await calendarService.getOperationalEvents({
      companyId: 1,
      isTransportista: true,
    });
    expect(res).toEqual([]);

    const skipped = buildCalendarEvents({
      isTransportista: true,
      dis: [{ id: 1, fecha_documento: 'invalid-date' } as never],
      nts: [{ id: 2, fecha_notificacion: null } as never],
      contracts: [{ id: 3, fecha_fin: null } as never],
      authorizations: [{ id: 4, fecha_vencimiento: null } as never],
      decas: [{ id: 5, fecha_transporte: null, is_vigente: true } as never],
    });
    expect(skipped).toEqual([]);
  });
});
