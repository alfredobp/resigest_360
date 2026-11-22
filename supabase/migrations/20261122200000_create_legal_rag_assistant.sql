-- ============================================================================
-- RAG Asistente Legal de Residuos (Fase Piloto)
-- Habilita pgvector, tablas de conocimiento normativo, búsqueda híbrida (RRF)
-- y registro multi-tenant de consultas/feedback.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Catálogo de documentos normativos (Ley 7/2022, RD 553/2020, LER, CCAA...)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  ambito TEXT NOT NULL CHECK (ambito IN ('estatal', 'ue', 'ccaa', 'plataforma')),
  ccaa TEXT,
  boe_url TEXT,
  vigente BOOLEAN NOT NULL DEFAULT TRUE,
  published_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Fragmentos (chunks) por artículo con embedding vectorial (768 dims) + FTS español
CREATE TABLE IF NOT EXISTS public.legal_chunks (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  article_ref TEXT NOT NULL,
  section_title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  embedding vector(768),
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'spanish',
      COALESCE(article_ref, '') || ' ' || COALESCE(section_title, '') || ' ' || COALESCE(content, '')
    )
  ) STORED,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, article_ref)
);

CREATE INDEX IF NOT EXISTS idx_legal_chunks_document_id
  ON public.legal_chunks (document_id);

CREATE INDEX IF NOT EXISTS idx_legal_chunks_fts
  ON public.legal_chunks USING GIN (fts);

CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding_hnsw
  ON public.legal_chunks USING hnsw (embedding vector_cosine_ops);

-- 3. Historial multi-tenant de consultas y feedback 👍/👎
CREATE TABLE IF NOT EXISTS public.legal_assistant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  pathname TEXT,
  perfil_operativo TEXT,
  region TEXT,
  model TEXT NOT NULL,
  retrieval_mode TEXT NOT NULL DEFAULT 'hybrid',
  feedback SMALLINT CHECK (feedback IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_assistant_logs_user_created
  ON public.legal_assistant_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_assistant_logs_company_created
  ON public.legal_assistant_logs (company_id, created_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_assistant_logs ENABLE ROW LEVEL SECURITY;

-- Base normativa: lectura solo para usuarios autenticados
DROP POLICY IF EXISTS "legal_documents_authenticated_read" ON public.legal_documents;
CREATE POLICY "legal_documents_authenticated_read"
  ON public.legal_documents
  FOR SELECT
  TO authenticated
  USING (vigente = TRUE);

DROP POLICY IF EXISTS "legal_chunks_authenticated_read" ON public.legal_chunks;
CREATE POLICY "legal_chunks_authenticated_read"
  ON public.legal_chunks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.legal_documents d
      WHERE d.id = legal_chunks.document_id
        AND d.vigente = TRUE
    )
  );

-- Logs de consultas: aislamiento estricto por user_id
DROP POLICY IF EXISTS "legal_assistant_logs_owner_select" ON public.legal_assistant_logs;
CREATE POLICY "legal_assistant_logs_owner_select"
  ON public.legal_assistant_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "legal_assistant_logs_owner_insert" ON public.legal_assistant_logs;
CREATE POLICY "legal_assistant_logs_owner_insert"
  ON public.legal_assistant_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "legal_assistant_logs_owner_update" ON public.legal_assistant_logs;
CREATE POLICY "legal_assistant_logs_owner_update"
  ON public.legal_assistant_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. RPC de búsqueda híbrida: pgvector + Full-Text Search con Reciprocal Rank Fusion (RRF)
CREATE OR REPLACE FUNCTION public.match_legal_chunks(
  query_text TEXT,
  query_embedding vector(768) DEFAULT NULL,
  match_count INT DEFAULT 6,
  filter_ccaa TEXT DEFAULT NULL
)
RETURNS TABLE (
  chunk_id BIGINT,
  document_code TEXT,
  document_title TEXT,
  ambito TEXT,
  ccaa TEXT,
  boe_url TEXT,
  article_ref TEXT,
  section_title TEXT,
  content TEXT,
  score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH base_chunks AS (
    SELECT
      c.id,
      d.code AS document_code,
      d.title AS document_title,
      d.ambito,
      d.ccaa,
      d.boe_url,
      c.article_ref,
      c.section_title,
      c.content,
      c.embedding,
      c.fts
    FROM public.legal_chunks c
    INNER JOIN public.legal_documents d ON d.id = c.document_id
    WHERE d.vigente = TRUE
      AND (
        d.ambito IN ('estatal', 'ue', 'plataforma')
        OR (filter_ccaa IS NOT NULL AND LOWER(COALESCE(d.ccaa, '')) = LOWER(filter_ccaa))
      )
  ),
  semantic AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) AS rank_ix
    FROM base_chunks
    WHERE query_embedding IS NOT NULL
      AND embedding IS NOT NULL
    ORDER BY embedding <=> query_embedding
    LIMIT GREATEST(match_count * 3, 12)
  ),
  lexical AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(fts, websearch_to_tsquery('spanish', query_text)) DESC
      ) AS rank_ix
    FROM base_chunks
    WHERE NULLIF(TRIM(query_text), '') IS NOT NULL
      AND fts @@ websearch_to_tsquery('spanish', query_text)
    LIMIT GREATEST(match_count * 3, 12)
  ),
  combined AS (
    SELECT
      COALESCE(s.id, l.id) AS id,
      COALESCE(1.0 / (60 + s.rank_ix), 0.0) + COALESCE(1.0 / (60 + l.rank_ix), 0.0) AS rrf_score
    FROM semantic s
    FULL OUTER JOIN lexical l ON s.id = l.id
  )
  SELECT
    b.id AS chunk_id,
    b.document_code,
    b.document_title,
    b.ambito,
    b.ccaa,
    b.boe_url,
    b.article_ref,
    b.section_title,
    b.content,
    c.rrf_score AS score
  FROM combined c
  INNER JOIN base_chunks b ON b.id = c.id
  ORDER BY c.rrf_score DESC
  LIMIT GREATEST(1, LEAST(match_count, 12));
$$;
