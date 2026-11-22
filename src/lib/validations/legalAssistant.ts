import { z } from 'zod';

const OPERATIONAL_PROFILES = [
  'productor',
  'chatarreria',
  'gestor_rp',
  'baterias',
  'transportista',
  'negociante',
  'completo',
] as const;

export const legalHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
});

export const legalQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, 'Escribe una duda de al menos 3 caracteres.')
    .max(1000, 'La consulta no puede superar los 1000 caracteres.'),
  history: z.array(legalHistoryItemSchema).max(6).optional().default([]),
  pathname: z.string().trim().max(200).optional(),
  perfilOperativo: z.enum(OPERATIONAL_PROFILES).optional(),
  region: z.string().trim().max(100).optional(),
  companyId: z.number().int().positive().nullable().optional(),
});

export const legalFeedbackSchema = z.object({
  logId: z.string().uuid('Identificador de consulta inválido.'),
  feedback: z.union([z.literal(1), z.literal(-1)]),
});

export type LegalQuestionInput = z.infer<typeof legalQuestionSchema>;
export type LegalFeedbackInput = z.infer<typeof legalFeedbackSchema>;
