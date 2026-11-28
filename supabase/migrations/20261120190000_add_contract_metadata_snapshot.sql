-- ==============================================================================
-- RESIGEST 360 - INSTANTÁNEA INMUTABLE DE CONTRATOS FIRMADOS (UXDEV-02 / RES6-I02)
-- Añade la columna metadata_snapshot (y asegura revision_history) en waste_contracts
-- y refresca el schema cache de PostgREST.
-- ==============================================================================

ALTER TABLE public.waste_contracts
  ADD COLUMN IF NOT EXISTS metadata_snapshot JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS revision_history JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.waste_contracts.metadata_snapshot IS
  'Instantánea inmutable de partes, centros y hash congelados al firmar el contrato (UXDEV-02 / RES6-I02).';

NOTIFY pgrst, 'reload schema';

