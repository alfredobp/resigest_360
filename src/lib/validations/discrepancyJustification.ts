import { z } from 'zod';
import type { CausaDiscrepancia } from '@/types/wasteManagement';

/** Umbrales de discrepancia de báscula (RD 553/2020): desviación relativa (%) o absoluta (kg). */
export const DISCREPANCY_PCT_THRESHOLD = 5;
export const DISCREPANCY_KG_THRESHOLD = 200;
export const MIN_JUSTIFICATION_LENGTH = 20;
export const MAX_JUSTIFICATION_LENGTH = 2000;

export const CAUSAS_DISCREPANCIA = [
  'merma_humedad',
  'evaporacion',
  'tara_bascula',
  'estimacion_origen',
  'otro',
] as const satisfies readonly CausaDiscrepancia[];

export const CAUSA_DISCREPANCIA_LABELS: Record<CausaDiscrepancia, string> = {
  merma_humedad: 'Merma por humedad / secado',
  evaporacion: 'Evaporación de fracción volátil',
  tara_bascula: 'Diferencia de tara o calibración de báscula',
  estimacion_origen: 'Peso estimado en origen (sin báscula)',
  otro: 'Otra causa',
};

export const discrepancyJustificationSchema = z.object({
  causa: z.enum(CAUSAS_DISCREPANCIA, { message: 'Seleccione una causa válida de la discrepancia.' }),
  texto: z
    .string()
    .trim()
    .min(MIN_JUSTIFICATION_LENGTH, `La justificación debe tener al menos ${MIN_JUSTIFICATION_LENGTH} caracteres.`)
    .max(MAX_JUSTIFICATION_LENGTH, `La justificación no puede superar ${MAX_JUSTIFICATION_LENGTH} caracteres.`),
});

export type DiscrepancyJustificationInput = z.infer<typeof discrepancyJustificationSchema>;

/**
 * Indica si la diferencia entre peso en origen y en destino supera los umbrales de tolerancia.
 */
export function isWeightDiscrepancy(pesoOrigen: number | null | undefined, pesoDestino: number | null | undefined): boolean {
  if (pesoDestino === undefined || pesoDestino === null || !pesoOrigen || pesoOrigen <= 0) return false;
  const diff = Math.abs(pesoDestino - pesoOrigen);
  const pct = (diff / pesoOrigen) * 100;
  return pct > DISCREPANCY_PCT_THRESHOLD || diff > DISCREPANCY_KG_THRESHOLD;
}

/**
 * Valida una justificación y devuelve los datos normalizados o lanza un Error descriptivo.
 */
export function parseDiscrepancyJustification(input: unknown): DiscrepancyJustificationInput {
  const result = discrepancyJustificationSchema.safeParse(input);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message || 'Justificación de discrepancia no válida.');
  }
  return result.data;
}
