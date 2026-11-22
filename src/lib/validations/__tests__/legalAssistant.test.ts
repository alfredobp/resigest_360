import {
  legalFeedbackSchema,
  legalQuestionSchema,
} from '@/lib/validations/legalAssistant';

describe('legalAssistant validations', () => {
  describe('legalQuestionSchema', () => {
    it('acepta una consulta válida con contexto opcional', () => {
      const result = legalQuestionSchema.safeParse({
        question: '¿Cuánto tiempo puedo almacenar residuos peligrosos?',
        history: [
          { role: 'user', content: 'Hola' },
          { role: 'assistant', content: '¿En qué te puedo ayudar?' },
        ],
        pathname: '/residuos/traslados',
        perfilOperativo: 'productor',
        region: 'Andalucía',
        companyId: 42,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.question).toBe('¿Cuánto tiempo puedo almacenar residuos peligrosos?');
        expect(result.data.history).toHaveLength(2);
      }
    });

    it('rechaza preguntas demasiado cortas o vacías', () => {
      const res = legalQuestionSchema.safeParse({ question: '  di  ' });
      expect(res.success).toBe(false);
    });

    it('rechaza preguntas que superan 1000 caracteres', () => {
      const res = legalQuestionSchema.safeParse({ question: 'a'.repeat(1001) });
      expect(res.success).toBe(false);
    });

    it('rechaza perfiles operativos no válidos', () => {
      const res = legalQuestionSchema.safeParse({
        question: '¿Plazo de memoria anual?',
        perfilOperativo: 'desconocido',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('legalFeedbackSchema', () => {
    it('acepta valoración positiva y negativa con UUID válido', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(legalFeedbackSchema.safeParse({ logId: validUuid, feedback: 1 }).success).toBe(true);
      expect(legalFeedbackSchema.safeParse({ logId: validUuid, feedback: -1 }).success).toBe(true);
    });

    it('rechaza UUID inválido o feedback fuera de -1/1', () => {
      expect(legalFeedbackSchema.safeParse({ logId: 'not-a-uuid', feedback: 1 }).success).toBe(false);
      expect(
        legalFeedbackSchema.safeParse({
          logId: '550e8400-e29b-41d4-a716-446655440000',
          feedback: 0,
        }).success
      ).toBe(false);
    });
  });
});
