import { getEffectiveRole, isTransportistaMode } from '@/lib/roleHelpers';

describe('roleHelpers', () => {
  describe('getEffectiveRole', () => {
    it('prioritizes activeRole when present', () => {
      expect(getEffectiveRole('transportista', 'productor')).toBe('transportista');
      expect(getEffectiveRole('negociante', 'transportista')).toBe('negociante');
    });

    it('falls back to valid companyType when activeRole is null/undefined', () => {
      expect(getEffectiveRole(null, 'transportista')).toBe('transportista');
      expect(getEffectiveRole(undefined, 'gestor')).toBe('gestor');
      expect(getEffectiveRole(null, 'productor')).toBe('productor');
      expect(getEffectiveRole(null, 'negociante')).toBe('negociante');
      expect(getEffectiveRole(null, 'agente')).toBe('agente');
      expect(getEffectiveRole(null, 'cliente')).toBe('cliente');
      expect(getEffectiveRole(null, 'proveedor')).toBe('proveedor');
    });

    it('returns null when neither activeRole nor valid companyType is provided', () => {
      expect(getEffectiveRole(null, null)).toBeNull();
      expect(getEffectiveRole(undefined, 'desconocido')).toBeNull();
    });
  });

  describe('isTransportistaMode', () => {
    it('returns true only when effective role is transportista', () => {
      expect(isTransportistaMode('transportista', 'productor')).toBe(true);
      expect(isTransportistaMode(null, 'transportista')).toBe(true);
      expect(isTransportistaMode('productor', 'transportista')).toBe(false);
      expect(isTransportistaMode(null, 'gestor')).toBe(false);
      expect(isTransportistaMode(null, null)).toBe(false);
    });
  });
});
