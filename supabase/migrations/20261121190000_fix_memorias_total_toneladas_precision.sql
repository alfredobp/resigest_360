-- ============================================================================
-- Migración: Precisión de 3 decimales (kg -> toneladas) en memorias_anuales
-- Fecha: 2026-11-21
-- Motivo: total_toneladas era DECIMAL(10,2), truncando/redondeando pesos
--         menores de 5 kg (ej. 2 kg = 0.002 t -> 0.00 t) respecto a resumen_ler.
-- ============================================================================

ALTER TABLE public.memorias_anuales
  ALTER COLUMN total_toneladas TYPE NUMERIC(12, 3);

-- Recalcular total_toneladas en registros existentes a partir de resumen_ler
UPDATE public.memorias_anuales m
SET total_toneladas = ROUND(
  COALESCE(
    (
      SELECT SUM(COALESCE((elem->>'cantidad_total')::numeric, 0))
      FROM jsonb_array_elements(m.resumen_ler) AS elem
    ),
    m.total_toneladas,
    0
  ),
  3
)
WHERE jsonb_typeof(m.resumen_ler) = 'array'
  AND jsonb_array_length(m.resumen_ler) > 0;

