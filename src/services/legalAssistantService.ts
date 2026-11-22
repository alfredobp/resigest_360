import type { SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_LEGAL_CORPUS, type SeedLegalChunk } from '@/lib/legal/initialLegalCorpus';
import type {
  LegalAssistantRequest,
  LegalAssistantResponse,
  LegalChunkRecord,
  LegalRetrievalMode,
  LegalSourceCitation,
} from '@/types/legalAssistant';

export const LEGAL_ASSISTANT_DISCLAIMER =
  'Orientación informativa basada en normativa de residuos vigente. No sustituye asesoramiento jurídico vinculante ni resoluciones de la autoridad ambiental competente.';

const DEFAULT_GEMINI_CHAT_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const EMBEDDING_DIMENSION = 768;

interface RpcMatchRow {
  chunk_id: number | string;
  document_code: string;
  document_title: string;
  ambito: 'estatal' | 'ue' | 'ccaa';
  ccaa: string | null;
  boe_url: string | null;
  article_ref: string;
  section_title: string;
  content: string;
  score: number;
}

const SPANISH_STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en',
  'con', 'por', 'para', 'sobre', 'que', 'como', 'cuando', 'donde', 'quien', 'cual',
  'es', 'son', 'ser', 'esta', 'estan', 'tiene', 'tengo', 'debo', 'puedo', 'hay',
  'mi', 'mis', 'su', 'sus', 'se', 'si', 'no', 'o', 'y', 'u', 'lo', 'le', 'les', 'me',
]);

export function normalizeSpanishText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractSearchTerms(query: string): string[] {
  const normalized = normalizeSpanishText(query);
  if (!normalized) return [];
  const unique = new Set<string>();
  for (const token of normalized.split(' ')) {
    if (token.length >= 2 && !SPANISH_STOPWORDS.has(token)) {
      unique.add(token);
    }
  }
  return Array.from(unique);
}

/**
 * Búsqueda léxica local sobre el corpus semilla (fallback cuando pgvector aún no está migrado o poblado).
 */
export function searchLocalLegalCorpus(
  question: string,
  region?: string,
  limit = 5,
  corpus: SeedLegalChunk[] = INITIAL_LEGAL_CORPUS
): LegalChunkRecord[] {
  const terms = extractSearchTerms(question);
  const normalizedQuestion = normalizeSpanishText(question);
  const normalizedRegion = region ? normalizeSpanishText(region) : '';

  const scored = corpus.map((item) => {
    const haystack = normalizeSpanishText(
      `${item.articleRef} ${item.sectionTitle} ${item.keywords.join(' ')} ${item.content}`
    );
    const haystackWords = new Set(haystack.split(' '));
    const keywordsNorm = item.keywords.map((k) => normalizeSpanishText(k));
    const paddedQuestion = ` ${normalizedQuestion} `;

    let score = 0;
    for (const term of terms) {
      if (haystackWords.has(term)) {
        score += 1.5;
      } else if (term.length >= 4 && haystack.includes(term)) {
        score += 1;
      }
      if (keywordsNorm.some((kw) => kw === term || (term.length >= 4 && kw.includes(term)))) {
        score += 2;
      }
    }

    // Bonus por coincidencia de frases clave o siglas completas delimitadas por espacios
    for (const kw of keywordsNorm) {
      if (kw.length >= 2 && paddedQuestion.includes(` ${kw} `)) {
        score += 2.5;
      }
    }

    if (normalizedRegion && item.ccaa && normalizeSpanishText(item.ccaa) === normalizedRegion) {
      score += 0.5;
    }

    return { item, score };
  });

  const matching = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const selected = matching.length > 0 ? matching : scored.slice(0, Math.min(3, limit));

  return selected.map(({ item, score }) => ({
    chunkId: item.id,
    documentCode: item.documentCode,
    documentTitle: item.documentTitle,
    ambito: item.ambito,
    ccaa: item.ccaa ?? null,
    boeUrl: item.boeUrl,
    articleRef: item.articleRef,
    sectionTitle: item.sectionTitle,
    content: item.content,
    score: Number(score.toFixed(4)),
  }));
}

export async function generateQueryEmbedding(
  query: string,
  apiKey: string,
  model = process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_GEMINI_EMBEDDING_MODEL
): Promise<number[] | null> {
  try {
    const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:embedContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text: query }] },
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: EMBEDDING_DIMENSION,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { embedding?: { values?: number[] } };
    const values = json.embedding?.values;
    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }
    return values;
  } catch {
    return null;
  }
}

export async function retrieveLegalChunks(
  supabase: SupabaseClient,
  question: string,
  region?: string,
  embedding?: number[] | null,
  matchCount = 6
): Promise<{ chunks: LegalChunkRecord[]; retrievalMode: LegalRetrievalMode }> {
  try {
    const rpcPayload: Record<string, unknown> = {
      query_text: question,
      match_count: matchCount,
      filter_ccaa: region || null,
    };

    if (embedding && embedding.length === EMBEDDING_DIMENSION) {
      rpcPayload.query_embedding = `[${embedding.join(',')}]`;
    } else {
      rpcPayload.query_embedding = null;
    }

    const { data, error } = await supabase.rpc('match_legal_chunks', rpcPayload);

    if (!error && Array.isArray(data) && data.length > 0) {
      const chunks: LegalChunkRecord[] = (data as RpcMatchRow[]).map((row) => ({
        chunkId: String(row.chunk_id),
        documentCode: row.document_code,
        documentTitle: row.document_title,
        ambito: row.ambito,
        ccaa: row.ccaa,
        boeUrl: row.boe_url,
        articleRef: row.article_ref,
        sectionTitle: row.section_title,
        content: row.content,
        score: Number(row.score ?? 0),
      }));
      return { chunks, retrievalMode: 'hybrid' };
    }
  } catch {
    // Fallback al corpus local si la migración/RPC aún no está desplegada en el entorno
  }

  return {
    chunks: searchLocalLegalCorpus(question, region, Math.min(matchCount, 5)),
    retrievalMode: 'local_fallback',
  };
}

export function buildLegalSystemPrompt(
  chunks: LegalChunkRecord[],
  context: { perfilOperativo?: string; region?: string; pathname?: string }
): string {
  const contextLines: string[] = [];
  if (context.perfilOperativo) {
    contextLines.push(`- Perfil operativo del usuario en ResiGest 360: ${context.perfilOperativo}`);
  }
  if (context.region) {
    contextLines.push(`- Provincia / ámbito territorial aproximado: ${context.region}`);
  }
  if (context.pathname) {
    contextLines.push(`- Pantalla actual en la app: ${context.pathname}`);
  }

  const fragmentsText = chunks
    .map(
      (c, idx) =>
        `[FUENTE ${idx + 1}] ${c.articleRef} — ${c.sectionTitle} (${c.documentTitle})\n${c.content}`
    )
    .join('\n\n');

  return [
    'Eres el Asistente Legal de Residuos de ResiGest 360 (especializado en normativa española y europea de gestión de residuos).',
    'REGLAS ESTRICTAS:',
    '1. Responde EXCLUSIVAMENTE con base en las fuentes normativas proporcionadas más abajo. No inventes artículos, plazos, sanciones ni requisitos que no aparezcan en las fuentes.',
    '2. Si las fuentes no cubren un detalle concreto (por ejemplo, una tasa o trámite específico de una Comunidad Autónoma), indícalo claramente y recomienda consultar la normativa autonómica o a la autoridad ambiental competente.',
    '3. Cita siempre de forma explícita el artículo y la norma entre paréntesis o en negrita (ejemplo: **Art. 21 Ley 7/2022** o **Art. 8 RD 553/2020**).',
    '4. Responde en español claro, directo y práctico (máximo 250 palabras, usando viñetas si ayuda a la lectura).',
    '5. No solicites ni almacenes datos personales sensibles (CIF, nombres propios, teléfonos).',
    contextLines.length > 0 ? `\nCONTEXTO DEL USUARIO (anonimizado):\n${contextLines.join('\n')}` : '',
    `\nFUENTES NORMATIVAS RECUPERADAS:\n${fragmentsText}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildOfflineFallbackAnswer(question: string, chunks: LegalChunkRecord[]): string {
  const topChunks = chunks.slice(0, 3);
  if (topChunks.length === 0) {
    return 'No se han encontrado artículos normativos relevantes en la base local para esta consulta. Configura `GEMINI_API_KEY` y carga el corpus completo en Supabase para obtener respuestas generativas con búsqueda híbrida.';
  }

  const bullets = topChunks
    .map((c) => `• **${c.articleRef}** (${c.sectionTitle}): ${c.content}`)
    .join('\n\n');

  return [
    `Modo piloto sin clave \`GEMINI_API_KEY\` activa — mostrando los fragmentos normativos más relevantes encontrados para *"${question}"*:`,
    '',
    bullets,
    '',
    'Para activar respuestas redactadas por IA (gratis en Google AI Studio), añade `GEMINI_API_KEY` en tu `.env.local` y reinicia el servidor.',
  ].join('\n');
}

export async function generateGeminiLegalAnswer(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<string> {
  const url = `${GEMINI_API_BASE}/${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const contents = [
    ...(params.history ?? []).slice(-6).map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    })),
    {
      role: 'user',
      parts: [{ text: params.question }],
    },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: params.systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Error del proveedor Gemini (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('El modelo no devolvió contenido en la respuesta.');
  }

  return text;
}

export function mapChunksToCitations(chunks: LegalChunkRecord[]): LegalSourceCitation[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    documentCode: chunk.documentCode,
    documentTitle: chunk.documentTitle,
    articleRef: chunk.articleRef,
    sectionTitle: chunk.sectionTitle,
    excerpt:
      chunk.content.length > 220 ? `${chunk.content.slice(0, 217).trimEnd()}...` : chunk.content,
    boeUrl: chunk.boeUrl ?? null,
    ambito: chunk.ambito,
    ccaa: chunk.ccaa ?? null,
    score: chunk.score,
  }));
}

export async function askLegalAssistant(
  supabase: SupabaseClient,
  userId: string,
  payload: LegalAssistantRequest
): Promise<LegalAssistantResponse> {
  if (!userId) {
    throw new Error('Usuario no autenticado para consultar el asistente legal.');
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
  const chatModel = process.env.GEMINI_CHAT_MODEL?.trim() || DEFAULT_GEMINI_CHAT_MODEL;

  const queryEmbedding = apiKey ? await generateQueryEmbedding(payload.question, apiKey) : null;

  const { chunks, retrievalMode } = await retrieveLegalChunks(
    supabase,
    payload.question,
    payload.region,
    queryEmbedding,
    6
  );

  const sources = mapChunksToCitations(chunks);

  let answer: string;
  let usedModel = chatModel;
  let demoMode = false;

  if (apiKey) {
    const systemPrompt = buildLegalSystemPrompt(chunks, {
      perfilOperativo: payload.perfilOperativo,
      region: payload.region,
      pathname: payload.pathname,
    });
    answer = await generateGeminiLegalAnswer({
      apiKey,
      model: chatModel,
      systemPrompt,
      question: payload.question,
      history: payload.history,
    });
  } else {
    demoMode = true;
    usedModel = 'offline-corpus-fallback';
    answer = buildOfflineFallbackAnswer(payload.question, chunks);
  }

  // Registro multi-tenant best-effort (no bloquea la respuesta si aún no se ha aplicado la migración)
  let logId: string | null = null;
  try {
    const { data: logRow, error: logError } = await supabase
      .from('legal_assistant_logs')
      .insert({
        user_id: userId,
        company_id: payload.companyId ?? null,
        question: payload.question,
        answer,
        sources,
        pathname: payload.pathname ?? null,
        perfil_operativo: payload.perfilOperativo ?? null,
        region: payload.region ?? null,
        model: usedModel,
        retrieval_mode: retrievalMode,
      })
      .select('id')
      .single();

    if (!logError && logRow?.id) {
      logId = String(logRow.id);
    }
  } catch {
    logId = null;
  }

  return {
    logId,
    answer,
    sources,
    model: usedModel,
    retrievalMode,
    demoMode,
    disclaimer: LEGAL_ASSISTANT_DISCLAIMER,
  };
}

export async function submitLegalFeedback(
  supabase: SupabaseClient,
  userId: string,
  logId: string,
  feedback: -1 | 1
): Promise<{ success: boolean }> {
  if (!userId) {
    throw new Error('Usuario no autenticado para registrar feedback.');
  }

  const { error } = await supabase
    .from('legal_assistant_logs')
    .update({ feedback })
    .eq('id', logId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`No se pudo guardar la valoración: ${error.message}`);
  }

  return { success: true };
}

export const legalAssistantService = {
  normalizeSpanishText,
  extractSearchTerms,
  searchLocalLegalCorpus,
  generateQueryEmbedding,
  retrieveLegalChunks,
  buildLegalSystemPrompt,
  buildOfflineFallbackAnswer,
  generateGeminiLegalAnswer,
  mapChunksToCitations,
  askLegalAssistant,
  submitLegalFeedback,
};
