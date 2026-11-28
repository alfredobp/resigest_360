import {
  normalizeDni,
  normalizePlate,
  validateFleetDriver,
  validateFleetVehicle,
} from '@/lib/validations/fleetValidation';

describe('fleetValidation', () => {
  it('normalizes plates and DNIs', () => {
    expect(normalizePlate(' 1234 abc ')).toBe('1234ABC');
    expect(normalizeDni(' 12345678-a ')).toBe('12345678A');
  });

  describe('validateFleetVehicle', () => {
    it('returns empty errors for valid vehicle', () => {
      const errors = validateFleetVehicle({
        tipo: 'tractora',
        matricula: '1234ABC',
        tara_kg: 7500,
        mma_kg: 40000,
        adr_habilitado: true,
        adr_caducidad: '2027-01-01',
      });
      expect(errors).toEqual({});
    });

    it('validates required and numeric constraints', () => {
      const errors = validateFleetVehicle({
        matricula: 'AB',
        tara_kg: -10,
        mma_kg: 0,
        adr_habilitado: true,
      });
      expect(errors.tipo).toBeDefined();
      expect(errors.matricula).toBeDefined();
      expect(errors.tara_kg).toBeDefined();
      expect(errors.mma_kg).toBeDefined();
      expect(errors.adr_caducidad).toBeDefined();
    });

    it('rejects empty plate and tara > mma', () => {
      const errors = validateFleetVehicle({
        tipo: 'rigido',
        matricula: '',
        tara_kg: 20000,
        mma_kg: 15000,
      });
      expect(errors.matricula).toBeDefined();
      expect(errors.tara_kg).toBeDefined();
    });
  });

  describe('validateFleetDriver', () => {
    it('returns empty errors for valid driver', () => {
      const errors = validateFleetDriver({
        nombre_completo: 'Carlos Ruiz',
        dni: '12345678A',
        pin_acceso: '1234',
        adr_habilitado: true,
        adr_caducidad: '2027-05-01',
      });
      expect(errors).toEqual({});
    });

    it('validates missing name, invalid DNI, invalid PIN, and missing ADR date', () => {
      const errors = validateFleetDriver({
        nombre_completo: '  ',
        dni: 'INVALID',
        pin_acceso: '12',
        adr_habilitado: true,
      });
      expect(errors.nombre_completo).toBeDefined();
      expect(errors.dni).toBeDefined();
      expect(errors.pin_acceso).toBeDefined();
      expect(errors.adr_caducidad).toBeDefined();
    });

    it('requires DNI when empty', () => {
      const errors = validateFleetDriver({
        nombre_completo: 'Ana López',
        dni: '',
      });
      expect(errors.dni).toBeDefined();
    });
  });
});
