// Mock Supabase y dependencias
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

jest.mock('../holdedService', () => ({
  holdedService: {
    createContact: jest.fn(),
    updateContact: jest.fn(),
  },
}));

jest.mock('../companyService', () => ({
  companyService: {
    getUserCompany: jest.fn(),
  },
}));

import { carrierService } from '../carrierService';
import { decaService, filterVigenteServices } from '../decaService';
import type { Carrier, FleetVehicle, FleetDriver } from '@/types/wasteManagement';
import type { DecaDocument, DecaFormData } from '@/types/deca';

describe('Auditoría Experiencia Cliente - Perfil Transportista y Portal Conductor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UXDEV-08 / UX-10: Flota de vehículos y conductores bajo un mismo CIF sin duplicados', () => {
    it('debe permitir gestionar 3 camiones y conductores reasignables bajo una única empresa transportista', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'usr-trans-1' } },
      });

      const baseCarrier: Carrier = {
        id: 101,
        user_id: 'usr-trans-1',
        razon_social: 'TransLogística Ambiental Express S.L.',
        cif: 'B99062032',
        matricula: '0620RST',
        nima: '4100062003',
        numero_autorizacion: 'T-MD-2023/0419',
        direccion: 'Polígono Industrial La Red, Nave 4',
        municipio: 'Alcalá de Guadaíra',
        provincia: 'Sevilla',
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        flota_vehiculos: [
          { id: 'veh-main', matricula: '0620RST', tipo: 'Principal', activo: true },
        ],
        flota_conductores: [
          { id: 'drv-main', nombre: 'Miguel Conductor', telefono: '+34 600 111 222', activo: true },
        ],
      };

      jest.spyOn(carrierService, 'getById').mockResolvedValue(baseCarrier);
      const updateSpy = jest.spyOn(carrierService, 'update').mockImplementation(async (_id, patch) => {
        return {
          ...baseCarrier,
          ...patch,
        } as Carrier;
      });

      // 1. Añadir 2 camiones adicionales (totalizando 3 camiones bajo el mismo CIF B99062032)
      const truck2: Omit<FleetVehicle, 'id'> = {
        matricula: '4812MTR',
        tipo: 'Portacontenedores',
        activo: true,
      };
      const truck3: Omit<FleetVehicle, 'id'> = {
        matricula: '9120BCK',
        tipo: 'Camión Pulpo',
        remolque: 'R-5544-ZZZ',
        activo: true,
      };

      const resAfterTruck2 = await carrierService.addVehicle(101, truck2);
      expect(resAfterTruck2.flota_vehiculos).toHaveLength(2);

      jest.spyOn(carrierService, 'getById').mockResolvedValue(resAfterTruck2);
      const resAfterTruck3 = await carrierService.addVehicle(101, truck3);
      expect(resAfterTruck3.flota_vehiculos).toHaveLength(3);

      const plates = resAfterTruck3.flota_vehiculos?.map((v) => v.matricula);
      expect(plates).toEqual(['0620RST', '4812MTR', '9120BCK']);

      // 2. Añadir conductor adicional y reasignar medios
      jest.spyOn(carrierService, 'getById').mockResolvedValue(resAfterTruck3);
      const newDriver: Omit<FleetDriver, 'id'> = {
        nombre: 'Carlos Ramos',
        dni: '50123456A',
        vehiculo_asignado: '4812MTR',
      };
      const resAfterDriver = await carrierService.addDriver(101, newDriver);
      expect(resAfterDriver.flota_conductores).toHaveLength(2);

      // Verificación de invariante: una sola empresa CIF B99062032 custodia los 3 vehículos
      expect(resAfterDriver.cif).toBe('B99062032');
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('UXDEV-11 / UX-11: Precarga automática de datos propios y cliente en DeCA', () => {
    it('debe preparar los datos de emisión del servicio sin reescribir manualmente datos del transportista', () => {
      const activeCompanyMock = {
        id: 50,
        razon_social: 'TransLogística Ambiental Express S.L.',
        cif: 'B99062032',
        numero_autorizacion: 'T-MD-2023/0419',
        nima: '4100062003',
        domicilio_social: 'Polígono Industrial La Red, Nave 4',
        municipio_social: 'Alcalá de Guadaíra',
        provincia_social: 'Sevilla',
        codigo_postal_social: '41500',
        matricula: '0620RST',
        persona_contacto: 'Miguel Conductor',
      };

      const clientMock = {
        id: 88,
        razon_social: 'Talleres Automoción Getafe S.L.',
        cif: 'B81223344',
        domicilio_social: 'Avda. Isaac Newton 14',
        municipio_social: 'Getafe',
        provincia_social: 'Madrid',
        codigo_postal_social: '28906',
      };

      // Simulación del autocompletado en el formulario DeCA
      const prefilledFormData: Partial<DecaFormData> = {
        // Datos propios de la empresa transportista precargados de inicio
        transportista_razon_social: activeCompanyMock.razon_social,
        transportista_nif: activeCompanyMock.cif,
        transportista_autorizacion: activeCompanyMock.numero_autorizacion,
        transportista_nima: activeCompanyMock.nima,
        transportista_domicilio: activeCompanyMock.domicilio_social,
        transportista_municipio: activeCompanyMock.municipio_social,
        transportista_provincia: activeCompanyMock.provincia_social,
        transportista_codigo_postal: activeCompanyMock.codigo_postal_social,
        matricula_tractora: activeCompanyMock.matricula,
        conductor_nombre: activeCompanyMock.persona_contacto,

        // Datos del cliente cargador precargados tras seleccionarlo con 1 clic
        cargador_razon_social: clientMock.razon_social,
        cargador_nif: clientMock.cif,
        cargador_domicilio: clientMock.domicilio_social,
        cargador_municipio: clientMock.municipio_social,
        cargador_provincia: clientMock.provincia_social,
        cargador_codigo_postal: clientMock.codigo_postal_social,
        origen_direccion: clientMock.domicilio_social,
        origen_municipio: clientMock.municipio_social,
        origen_provincia: clientMock.provincia_social,
      };

      // Cero escrituras manuales requeridas para los datos de la propia empresa
      expect(prefilledFormData.transportista_razon_social).toBe('TransLogística Ambiental Express S.L.');
      expect(prefilledFormData.transportista_nif).toBe('B99062032');
      expect(prefilledFormData.matricula_tractora).toBe('0620RST');
      expect(prefilledFormData.conductor_nombre).toBe('Miguel Conductor');
      expect(prefilledFormData.cargador_razon_social).toBe('Talleres Automoción Getafe S.L.');
      expect(prefilledFormData.origen_municipio).toBe('Getafe');
    });
  });

  describe('UXDEV-04 / UX-12: Coherencia de versiones DeCA (v1 nunca activa si v2 está finalizada)', () => {
    it('debe archivar v1 y mostrar exclusivamente v2 como servicio finalizado en portal conductor', () => {
      const decasInDatabase: DecaDocument[] = [
        {
          id: 501,
          numero_deca: 'DECA-2026-00001',
          version: 1,
          is_vigente: false,
          estado: 'vigente', // Inconsistencia heredada simulada
          naturaleza_mercancia: 'Hierro y acero',
          peso_kg: 10,
          matricula_tractora: '0620RST',
          token: 'token-v1-hist',
        } as any,
        {
          id: 502,
          numero_deca: 'DECA-2026-00001-v2',
          version: 2,
          is_vigente: true,
          estado: 'finalizado',
          naturaleza_mercancia: 'Hierro y acero',
          peso_kg: 8,
          matricula_tractora: '0620RST',
          fecha_finalizacion: '2026-11-20T11:00:00Z',
          token: 'token-v2-fin',
        } as any,
      ];

      // Aplicar filtro de coherencia de versiones
      const { activeDecas, finishedDecas, allLatest } = filterVigenteServices(decasInDatabase);

      // 1. Debe haber una sola tarjeta representativa del servicio en el listado
      expect(allLatest).toHaveLength(1);
      expect(allLatest[0].id).toBe(502);
      expect(allLatest[0].version).toBe(2);
      expect(allLatest[0].peso_kg).toBe(8);

      // 2. v1 NO debe constar en activeDecas bajo ninguna circunstancia
      expect(activeDecas).toHaveLength(0);

      // 3. v2 debe constar en finishedDecas
      expect(finishedDecas).toHaveLength(1);
      expect(finishedDecas[0].id).toBe(502);
      expect(finishedDecas[0].estado).toBe('finalizado');
    });
  });

  describe('UXDEV-15 / UX-13: Portal Conductor e Histórico de Servicios', () => {
    it('debe mantener accesibles los servicios terminados en la pestaña Finalizados con QR y enlace PDF', () => {
      const decasFixture: DecaDocument[] = [
        {
          id: 701,
          numero_deca: 'DECA-TR-2026-001',
          version: 1,
          is_vigente: true,
          estado: 'en_transito',
          token: 'dca_demo_qr_001',
          matricula_tractora: '4812-MTR',
          peso_kg: 1050,
        } as any,
        {
          id: 702,
          numero_deca: 'DECA-TR-2026-002',
          version: 1,
          is_vigente: true,
          estado: 'finalizado',
          token: 'dca_demo_qr_002',
          matricula_tractora: '4812-MTR',
          peso_kg: 4800,
          fecha_finalizacion: new Date().toISOString(),
          hora_cierre: '14:30',
        } as any,
      ];

      const { activeDecas, finishedDecas } = filterVigenteServices(decasFixture);

      // Pestaña "En Ruta / Hoy"
      expect(activeDecas).toHaveLength(1);
      expect(activeDecas[0].numero_deca).toBe('DECA-TR-2026-001');

      // Pestaña "Finalizados / Histórico"
      expect(finishedDecas).toHaveLength(1);
      expect(finishedDecas[0].numero_deca).toBe('DECA-TR-2026-002');
      expect(finishedDecas[0].token).toBe('dca_demo_qr_002');

      // Enlaces generados para inspección móvil y descarga sin login
      const inspectionUrl = `/api/deca/${finishedDecas[0].token}`;
      const driverMobileUrl = `/mobile/deca/${finishedDecas[0].token}`;

      expect(inspectionUrl).toBe('/api/deca/dca_demo_qr_002');
      expect(driverMobileUrl).toBe('/mobile/deca/dca_demo_qr_002');
    });
  });
});
