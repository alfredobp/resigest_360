-- =====================================================
-- REVERT MULTI-RESIDUE CHANGES
-- Eliminar tabla de items de documentos de identificación
-- =====================================================

-- 1. Eliminar la tabla de items
DROP TABLE IF EXISTS public.identification_document_items CASCADE;

-- Comentario: Los campos en la tabla principal 'identification_documents'
-- nunca fueron eliminados, por lo que no es necesario restaurarlos.
-- Simplemente dejamos de usar la tabla relacional.
