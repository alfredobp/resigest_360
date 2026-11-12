import {
  CAUSAS_DISCREPANCIA,
  CAUSA_DISCREPANCIA_LABELS,
  discrepancyJustificationSchema,
  isWeightDiscrepancy,
  parseDiscrepancyJustification,
  MIN_JUSTIFICATION_LENGTH,
  MAX_JUSTIFICATION_LENGTH,
} from '../discrepancyJustification';

describe('discrepancyJustification', () => {
  describe('isWeightDiscrepancy', () => {
    it('devuelve false si falta peso de destino u origen', () => {
      expect(isWeightDiscrepancy(100, undefined)).toBe(false);
      expect(isWeightDiscrepancy(100, null)).toBe(false);
      expect(isWeightDiscrepancy(0, 50)).toBe(false);
      expect(isWeightDiscrepancy(null, 50)).toBe(false);
      expect(isWeightDiscrepancy(-10, 50)).toBe(false);
    });

    it('devuelve false dentro de tolerancia (<= 5% y <= 200 kg)', () => {
      expect(isWeightDiscrepancy(1000, 950)).toBe(false);
      expect(isWeightDiscrepancy(1000, 1000)).toBe(false);
    });

    it('detecta desviación relativa superior al 5%', () => {
      expect(isWeightDiscrepancy(3, 2.5)).toBe(true);
      expect(isWeightDiscrepancy(1000, 1060)).toBe(true);
    });

    it('detecta desviación absoluta superior a 200 kg aunque el % sea bajo', () => {
      expect(isWeightDiscrepancy(10000, 9750)).toBe(true);
    });
  });

  describe('schema y parseDiscrepancyJustification', () => {
    const validText = 'Merma por escurrido del residuo húmedo en planta.';

    it('acepta todas las causas definidas con etiqueta', () => {
      for (const causa of CAUSAS_DISCREPANCIA) {
        expect(CAUSA_DISCREPANCIA_LABELS[causa]).toBeTruthy();
        expect(discrepancyJustificationSchema.safeParse({ causa, texto: validText }).success).toBe(true);
      }
    });

    it('normaliza espacios del texto', () => {
      const parsed = parseDiscrepancyJustification({ causa: 'otro', texto: `   ${validText}   ` });
      expect(parsed).toEqual({ causa: 'otro', texto: validText });
    });

    it('rechaza causa inválida', () => {
      expect(() => parseDiscrepancyJustification({ causa: 'inventada', texto: validText })).toThrow(
        'Seleccione una causa válida de la discrepancia.'
      );
    });

    it('rechaza texto demasiado corto (tras trim)', () => {
      expect(() => parseDiscrepancyJustification({ causa: 'otro', texto: `   ${'a'.repeat(MIN_JUSTIFICATION_LENGTH - 1)}  ` })).toThrow(
        `al menos ${MIN_JUSTIFICATION_LENGTH} caracteres`
      );
    });

    it('rechaza texto demasiado largo', () => {
      expect(() => parseDiscrepancyJustification({ causa: 'otro', texto: 'a'.repeat(MAX_JUSTIFICATION_LENGTH + 1) })).toThrow(
        `no puede superar ${MAX_JUSTIFICATION_LENGTH}`
      );
    });

    it('usa mensaje genérico si zod no aporta issues', () => {
      const spy = jest.spyOn(discrepancyJustificationSchema, 'safeParse').mockReturnValueOnce({
        success: false,
        error: { issues: [] },
      } as any);
      expect(() => parseDiscrepancyJustification({})).toThrow('Justificación de discrepancia no válida.');
      spy.mockRestore();
    });
  });
});
