import {
  formatDriverQuickCopy,
  formatVehicleQuickCopy,
  getDaysUntilDate,
  getDriverComplianceAlerts,
  getExpiryStatus,
  getVehicleComplianceAlerts,
  isValidSpanishDniNie,
  normalizeDni,
  normalizePlate,
  validateDriverForm,
  validateVehicleForm,
} from '../fleetValidation';
import type { CarrierDriver, CarrierVehicle } from '@/types/wasteManagement';

describe('fleetValidation - Validaciones y alertas de Conductores y Vehículos', () => {
  describe('normalizePlate y normalizeDni', () => {
    it('debe normalizar matrículas eliminando espacios extra y pasando a mayúsculas', () => {
      expect(normalizePlate('  1234  bbb ')).toBe('1234 BBB');
      expect(normalizePlate('r-5678-ccc')).toBe('R-5678-CCC');
      expect(normalizePlate('')).toBeUndefined();
      expect(normalizePlate('   ')).toBeUndefined();
      expect(normalizePlate(null)).toBeUndefined();
    });

    it('debe normalizar DNI/NIE eliminando espacios y guiones', () => {
      expect(normalizeDni('12345678-z')).toBe('12345678Z');
      expect(normalizeDni(' x 1234567 l ')).toBe('X1234567L');
      expect(normalizeDni('')).toBeUndefined();
      expect(normalizeDni(undefined)).toBeUndefined();
    });
  });

  describe('isValidSpanishDniNie', () => {
    it('debe validar DNIs españoles válidos e inválidos', () => {
      expect(isValidSpanishDniNie('12345678Z')).toBe(true);
      expect(isValidSpanishDniNie('12345678-z')).toBe(true);
      expect(isValidSpanishDniNie('12345678A')).toBe(false);
      expect(isValidSpanishDniNie('1234Z')).toBe(false);
      expect(isValidSpanishDniNie('')).toBe(false);
    });

    it('debe validar NIEs españoles (X, Y, Z) válidos e inválidos', () => {
      expect(isValidSpanishDniNie('X1234567L')).toBe(true);
      expect(isValidSpanishDniNie('Y1234567X')).toBe(true);
      expect(isValidSpanishDniNie('Z1234567R')).toBe(true);
      expect(isValidSpanishDniNie('X1234567A')).toBe(false);
    });
  });

  describe('getDaysUntilDate y getExpiryStatus', () => {
    const ref = new Date('2026-06-01T12:00:00');

    it('debe clasificar correctamente fechas caducadas, próximas, vigentes y nulas', () => {
      expect(getDaysUntilDate(null, ref)).toBeNull();
      expect(getDaysUntilDate('fecha-invalida', ref)).toBeNull();
      expect(getExpiryStatus(undefined, 30, ref)).toBe('no_aplica');

      expect(getExpiryStatus('2026-05-20', 30, ref)).toBe('caducado');
      expect(getExpiryStatus('2026-06-15', 30, ref)).toBe('proximo');
      expect(getExpiryStatus('2026-06-01', 30, ref)).toBe('proximo');
      expect(getExpiryStatus('2026-09-01', 30, ref)).toBe('vigente');
    });
  });

  describe('getDriverComplianceAlerts y getVehicleComplianceAlerts', () => {
    const ref = new Date('2026-06-01T10:00:00');

    it('debe generar alertas de ADR y CAP para conductores', () => {
      const alerts = getDriverComplianceAlerts(
        {
          id: 1,
          nombre: 'Carlos Ruiz',
          tiene_adr: true,
          fecha_caducidad_adr: '2026-05-15',
          fecha_caducidad_cap: '2026-06-10',
        },
        30,
        ref
      );

      expect(alerts).toHaveLength(2);
      expect(alerts[0]).toMatchObject({
        entityType: 'driver',
        documentType: 'ADR',
        status: 'caducado',
      });
      expect(alerts[1]).toMatchObject({
        entityType: 'driver',
        documentType: 'CAP',
        status: 'proximo',
        daysRemaining: 9,
      });

      const okAlerts = getDriverComplianceAlerts(
        {
          id: 2,
          nombre: 'Ana Pérez',
          tiene_adr: false,
          fecha_caducidad_adr: '2026-01-01',
          fecha_caducidad_cap: '2027-01-01',
        },
        30,
        ref
      );
      expect(okAlerts).toHaveLength(0);

      // Cubrir ramas inversas: ADR próximo en 1 día y CAP caducado
      const reversedAlerts = getDriverComplianceAlerts(
        {
          id: 3,
          nombre: 'Pedro',
          tiene_adr: true,
          fecha_caducidad_adr: '2026-06-02',
          fecha_caducidad_cap: '2026-05-01',
        },
        30,
        ref
      );
      expect(reversedAlerts).toHaveLength(2);
      expect(reversedAlerts[0].message).toContain('en 1 día');
      expect(reversedAlerts[1].status).toBe('caducado');
    });

    it('debe generar alertas de ITV, Seguro y ADR para vehículos', () => {
      const alerts = getVehicleComplianceAlerts(
        {
          id: 10,
          matricula: '1234-BBB',
          fecha_caducidad_itv: '2026-05-01',
          fecha_caducidad_seguro: '2026-06-02',
          tiene_adr: true,
          fecha_caducidad_adr: '2026-06-20',
        },
        30,
        ref
      );

      expect(alerts).toHaveLength(3);
      expect(alerts.map((a) => `${a.documentType}:${a.status}`)).toEqual([
        'ITV:caducado',
        'Seguro:proximo',
        'ADR:proximo',
      ]);
      expect(alerts[1].message).toContain('en 1 día');
    });
  });

  describe('validateDriverForm y validateVehicleForm', () => {
    it('debe validar los campos obligatorios y reglas de negocio de conductores', () => {
      expect(validateDriverForm({ nombre: '   ' }).nombre).toBeTruthy();
      expect(
        validateDriverForm({
          nombre: 'Juan',
          dni: '12345678A',
          email: 'correo-invalido',
          tiene_adr: true,
        })
      ).toEqual({
        dni: expect.any(String),
        email: expect.any(String),
        fecha_caducidad_adr: expect.any(String),
      });

      expect(
        validateDriverForm({
          nombre: 'Juan',
          dni: '12345678Z',
          email: 'juan@empresa.es',
          tiene_adr: true,
          fecha_caducidad_adr: '2027-01-01',
        })
      ).toEqual({});
    });

    it('debe validar los campos obligatorios y reglas de negocio de vehículos', () => {
      expect(validateVehicleForm({ matricula: '' }).matricula).toBeTruthy();
      expect(
        validateVehicleForm({
          matricula: '1234-BBB',
          mma_kg: -10,
          tara_kg: -5,
          tiene_adr: true,
        })
      ).toEqual({
        mma_kg: expect.any(String),
        tara_kg: expect.any(String),
        fecha_caducidad_adr: expect.any(String),
      });

      expect(
        validateVehicleForm({
          matricula: '1234-BBB',
          mma_kg: 10000,
          tara_kg: 12000,
        }).tara_kg
      ).toContain('no puede superar');

      expect(
        validateVehicleForm({
          matricula: '1234-BBB',
          mma_kg: 40000,
          tara_kg: 14000,
          tiene_adr: false,
        })
      ).toEqual({});
    });
  });

  describe('formatDriverQuickCopy y formatVehicleQuickCopy', () => {
    it('debe formatear textos legibles para copia rápida en portapapeles', () => {
      const driver: CarrierDriver = {
        id: 1,
        user_id: 'u-1',
        nombre: 'Luis Gómez',
        dni: '12345678Z',
        telefono: '600111222',
        email: 'luis@trans.es',
        vehiculo_asignado: '1234-BBB',
        remolque_asignado: 'R-9999-CCC',
        carnet_tipo: 'C+E',
        tiene_adr: true,
        fecha_caducidad_adr: '2027-05-01',
        fecha_caducidad_cap: '2028-01-01',
        activo: true,
        created_at: '',
        updated_at: '',
      };
      const drvText = formatDriverQuickCopy(driver);
      expect(drvText).toContain('Conductor: Luis Gómez');
      expect(drvText).toContain('DNI/NIE: 12345678Z');
      expect(drvText).toContain('1234-BBB / Remolque: R-9999-CCC');
      expect(drvText).toContain('ADR: Sí (hasta 2027-05-01)');
      expect(drvText).toContain('CAP: hasta 2028-01-01');

      const vehicle: CarrierVehicle = {
        id: 2,
        user_id: 'u-1',
        matricula: '1234-BBB',
        tipo: 'Tractora',
        remolque_habitual: 'R-9999-CCC',
        marca_modelo: 'Volvo FH',
        fecha_caducidad_itv: '2027-03-01',
        fecha_caducidad_seguro: '2027-04-01',
        tiene_adr: true,
        fecha_caducidad_adr: '2027-06-01',
        tarjeta_transporte: 'MDP-123',
        activo: true,
        created_at: '',
        updated_at: '',
      };
      const vehText = formatVehicleQuickCopy(vehicle);
      expect(vehText).toContain('Matrícula: 1234-BBB (Tractora)');
      expect(vehText).toContain('ITV: 2027-03-01');
      expect(vehText).toContain('Seguro: 2027-04-01');
      expect(vehText).toContain('Tarjeta Transporte: MDP-123');

      // Ramas con campos opcionales mínimos / sin fechas
      const minimalDriver: CarrierDriver = {
        id: 3,
        user_id: 'u-1',
        nombre: 'Mario',
        vehiculo_asignado: '9999-ZZZ',
        tiene_adr: true,
        activo: true,
        created_at: '',
        updated_at: '',
      };
      expect(formatDriverQuickCopy(minimalDriver)).toBe(
        'Conductor: Mario | Vehículo: 9999-ZZZ | ADR: Sí'
      );

      const minimalVehicle: CarrierVehicle = {
        id: 4,
        user_id: 'u-1',
        matricula: '9999-ZZZ',
        tipo: 'Rígido',
        tiene_adr: true,
        activo: true,
        created_at: '',
        updated_at: '',
      };
      expect(formatVehicleQuickCopy(minimalVehicle)).toBe(
        'Matrícula: 9999-ZZZ (Rígido) | ADR: Sí'
      );
    });
  });
});
