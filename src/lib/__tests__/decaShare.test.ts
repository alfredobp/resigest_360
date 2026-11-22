import {
  buildDecaMailtoUrl,
  buildDecaShareMessage,
  buildDecaWhatsAppUrl,
  normalizeWhatsAppPhone,
} from '../decaShare';

const sampleDoc = {
  numero_deca: 'DECA-2026-001',
  version: 2,
  matricula_tractora: '1234-BBB',
  matricula_remolque: 'R-9999-CCC',
  conductor_nombre: 'Carlos Ruiz',
  origen_municipio: 'Sevilla',
  destino_municipio: 'Málaga',
  fecha_transporte: '2026-11-22',
  token: 'tok-abc-123',
};

describe('decaShare - Utilidades para compartir DeCA por WhatsApp, Email y móvil', () => {
  describe('normalizeWhatsAppPhone', () => {
    it('debe normalizar números españoles y prefijos internacionales', () => {
      expect(normalizeWhatsAppPhone('600 123 456')).toBe('34600123456');
      expect(normalizeWhatsAppPhone('+34 612-345-678')).toBe('34612345678');
      expect(normalizeWhatsAppPhone('0034 699 000 111')).toBe('34699000111');
      expect(normalizeWhatsAppPhone('12345')).toBeNull();
      expect(normalizeWhatsAppPhone('')).toBeNull();
      expect(normalizeWhatsAppPhone(null)).toBeNull();
      expect(normalizeWhatsAppPhone('---')).toBeNull();
    });
  });

  describe('buildDecaShareMessage', () => {
    it('debe construir el mensaje completo con ambos enlaces públicos', () => {
      const msg = buildDecaShareMessage(sampleDoc, 'https://app.resigest.es/');
      expect(msg).toContain('DeCA DECA-2026-001 (v2)');
      expect(msg).toContain('Fecha: 2026-11-22');
      expect(msg).toContain('Conductor: Carlos Ruiz');
      expect(msg).toContain('Vehículo: 1234-BBB (Remolque: R-9999-CCC)');
      expect(msg).toContain('Ruta: Sevilla → Málaga');
      expect(msg).toContain('https://app.resigest.es/mobile/deca/tok-abc-123');
      expect(msg).toContain('https://app.resigest.es/api/deca/tok-abc-123');
    });

    it('debe omitir campos opcionales cuando no están presentes', () => {
      const msg = buildDecaShareMessage(
        {
          numero_deca: 'DECA-2026-002',
          version: 0,
          matricula_tractora: '5555-DDD',
          token: 'tok-xyz',
          origen_municipio: '',
          destino_municipio: '',
        },
        'https://app.resigest.es'
      );
      expect(msg).toContain('DeCA DECA-2026-002 (v1)');
      expect(msg).toContain('Vehículo: 5555-DDD');
      expect(msg).not.toContain('Remolque:');
      expect(msg).not.toContain('Conductor:');
      expect(msg).not.toContain('Ruta:');
    });
  });

  describe('buildDecaWhatsAppUrl y buildDecaMailtoUrl', () => {
    it('debe generar enlace wa.me con y sin teléfono del conductor', () => {
      const withPhone = buildDecaWhatsAppUrl(sampleDoc, 'https://app.resigest.es', '600 111 222');
      expect(withPhone).toContain('https://wa.me/34600111222?text=');
      expect(withPhone).toContain(encodeURIComponent('DECA-2026-001'));

      const withoutPhone = buildDecaWhatsAppUrl(sampleDoc, 'https://app.resigest.es', null);
      expect(withoutPhone).toContain('https://wa.me/?text=');
    });

    it('debe generar enlace mailto con y sin destinatario', () => {
      const withEmail = buildDecaMailtoUrl(sampleDoc, 'https://app.resigest.es', ' carlos@trans.es ');
      expect(withEmail).toContain('mailto:carlos@trans.es?subject=');
      expect(withEmail).toContain(encodeURIComponent('DECA-2026-001'));

      const withoutEmail = buildDecaMailtoUrl(sampleDoc, 'https://app.resigest.es');
      expect(withoutEmail).toContain('mailto:?subject=');
    });
  });
});
