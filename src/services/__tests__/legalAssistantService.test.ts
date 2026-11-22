import type { SupabaseClient } from '@supabase/supabase-js';
import {
  askLegalAssistant,
  buildLegalSystemPrompt,
  buildOfflineFallbackAnswer,
  extractSearchTerms,
  generateGeminiLegalAnswer,
  generateQueryEmbedding,
  LEGAL_ASSISTANT_DISCLAIMER,
  mapChunksToCitations,
  normalizeSpanishText,
  retrieveLegalChunks,
  searchLocalLegalCorpus,
  submitLegalFeedback,
} from '@/services/legalAssistantService';

const originalEnv = process.env;
const originalFetch = global.fetch;

function createMockSupabase() {
  const single = jest.fn().mockResolvedValue({ data: { id: 'log-uuid-1' }, error: null });
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });

  const eqUser = jest.fn().mockResolvedValue({ error: null });
  const eqId = jest.fn().mockReturnValue({ eq: eqUser });
  const update = jest.fn().mockReturnValue({ eq: eqId });

  const from = jest.fn().mockReturnValue({ insert, update });
  const rpc = jest.fn();

  return {
    client: { from, rpc } as unknown as SupabaseClient,
    from,
    rpc,
    insert,
    update,
    eqId,
    eqUser,
    single,
  };
}

describe('legalAssistantService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_CHAT_MODEL;
    delete process.env.GEMINI_EMBEDDING_MODEL;
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('normaliza texto español y extrae términos relevantes sin stopwords', () => {
    expect(normalizeSpanishText('¿Cuándo es obligatoria la Notificación Previa (NT)?')).toBe(
      'cuando es obligatoria la notificacion previa nt'
    );
    const terms = extractSearchTerms('¿Cuándo es obligatoria la Notificación Previa (NT)?');
    expect(terms).toContain('obligatoria');
    expect(terms).toContain('notificacion');
    expect(terms).toContain('nt');
    expect(terms).not.toContain('la');
    expect(extractSearchTerms('   ')).toEqual([]);
  });

  it('busca en el corpus local y prioriza artículos relevantes sobre almacenamiento de residuos peligrosos', () => {
    const results = searchLocalLegalCorpus('¿Cuánto tiempo máximo puedo almacenar residuos peligrosos?', 'Andalucía', 4);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].articleRef).toContain('Art. 21 Ley 7/2022');
  });

  it('devuelve fragmentos por defecto si no hay coincidencias léxicas exactas', () => {
    const results = searchLocalLegalCorpus('xyzqwerty12345', undefined, 3);
    expect(results).toHaveLength(3);
  });

  it('construye un prompt con contexto anonimizado y fuentes normativas', () => {
    const chunks = searchLocalLegalCorpus('notificación previa NT', undefined, 2);
    const prompt = buildLegalSystemPrompt(chunks, {
      perfilOperativo: 'productor',
      region: 'Sevilla',
      pathname: '/residuos/traslados',
    });

    expect(prompt).toContain('Perfil operativo del usuario en ResiGest 360: productor');
    expect(prompt).toContain('Sevilla');
    expect(prompt).toContain('/residuos/traslados');
    expect(prompt).toContain('[FUENTE 1]');
  });

  it('construye respuesta offline cuando no hay GEMINI_API_KEY', () => {
    const chunks = searchLocalLegalCorpus('memoria anual', undefined, 2);
    const answer = buildOfflineFallbackAnswer('¿Plazo memoria anual?', chunks);
    expect(answer).toContain('GEMINI_API_KEY');
    expect(answer).toContain(chunks[0].articleRef);

    const emptyAnswer = buildOfflineFallbackAnswer('sin fuentes', []);
    expect(emptyAnswer).toContain('No se han encontrado artículos');
  });

  it('genera embedding con Gemini y maneja respuestas fallidas devolviendo null', async () => {
    const vector = Array.from({ length: 768 }, (_, i) => i * 0.001);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: { values: vector } }),
    }) as unknown as typeof fetch;

    const okResult = await generateQueryEmbedding('plazo di', 'fake-key');
    expect(okResult).toHaveLength(768);

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
    }) as unknown as typeof fetch;
    expect(await generateQueryEmbedding('plazo di', 'fake-key')).toBeNull();

    global.fetch = jest.fn().mockRejectedValueOnce(new Error('network')) as unknown as typeof fetch;
    expect(await generateQueryEmbedding('plazo di', 'fake-key')).toBeNull();
  });

  it('recupera chunks vía RPC híbrida de Supabase y cae a fallback local si falla o está vacío', async () => {
    const mock = createMockSupabase();
    mock.rpc.mockResolvedValueOnce({
      data: [
        {
          chunk_id: 10,
          document_code: 'RD_553_2020',
          document_title: 'RD 553/2020',
          ambito: 'estatal',
          ccaa: null,
          boe_url: 'https://boe.es/rd553',
          article_ref: 'Art. 7 RD 553/2020',
          section_title: 'Aceptación DI',
          content: 'Treinta días naturales desde la recepción.',
          score: 0.032,
        },
      ],
      error: null,
    });

    const vector = Array.from({ length: 768 }, () => 0.1);
    const hybrid = await retrieveLegalChunks(mock.client, 'plazo aceptación DI', 'Madrid', vector, 6);
    expect(hybrid.retrievalMode).toBe('hybrid');
    expect(hybrid.chunks[0].articleRef).toBe('Art. 7 RD 553/2020');

    mock.rpc.mockResolvedValueOnce({ data: null, error: { message: 'function not found' } });
    const fallback = await retrieveLegalChunks(mock.client, 'plazo aceptación DI', 'Madrid', null, 6);
    expect(fallback.retrievalMode).toBe('local_fallback');
    expect(fallback.chunks.length).toBeGreaterThan(0);
  });

  it('genera respuesta con Gemini API y maneja errores HTTP o respuesta vacía', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'El plazo es de 30 días (**Art. 7 RD 553/2020**).' }] } }],
      }),
    }) as unknown as typeof fetch;

    const text = await generateGeminiLegalAnswer({
      apiKey: 'fake-key',
      model: 'gemini-3.5-flash-lite',
      systemPrompt: 'sys',
      question: '¿Plazo DI?',
      history: [{ role: 'user', content: 'Hola' }, { role: 'assistant', content: 'Buenas' }],
    });
    expect(text).toContain('30 días');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    }) as unknown as typeof fetch;

    await expect(
      generateGeminiLegalAnswer({
        apiKey: 'fake-key',
        model: 'gemini-3.5-flash-lite',
        systemPrompt: 'sys',
        question: '¿Plazo DI?',
      })
    ).rejects.toThrow('Error del proveedor Gemini (500)');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [] }),
    }) as unknown as typeof fetch;

    await expect(
      generateGeminiLegalAnswer({
        apiKey: 'fake-key',
        model: 'gemini-3.5-flash-lite',
        systemPrompt: 'sys',
        question: '¿Plazo DI?',
      })
    ).rejects.toThrow('El modelo no devolvió contenido');
  });

  it('orquesta askLegalAssistant en modo offline y registra el log multi-tenant', async () => {
    const mock = createMockSupabase();
    mock.rpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await askLegalAssistant(mock.client, 'user-123', {
      question: '¿Cuándo es obligatoria la Notificación Previa (NT)?',
      perfilOperativo: 'productor',
      region: 'Andalucía',
      companyId: 7,
    });

    expect(result.demoMode).toBe(true);
    expect(result.retrievalMode).toBe('local_fallback');
    expect(result.logId).toBe('log-uuid-1');
    expect(result.disclaimer).toBe(LEGAL_ASSISTANT_DISCLAIMER);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(mock.from).toHaveBeenCalledWith('legal_assistant_logs');
    expect(mock.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        company_id: 7,
      })
    );
  });

  it('orquesta askLegalAssistant con GEMINI_API_KEY activa', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const mock = createMockSupabase();
    const vector = Array.from({ length: 768 }, () => 0.05);

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ embedding: { values: vector } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Máximo 6 meses para RP (**Art. 21 Ley 7/2022**).' }] } }],
        }),
      }) as unknown as typeof fetch;

    mock.rpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await askLegalAssistant(mock.client, 'user-123', {
      question: '¿Plazo almacenamiento residuos peligrosos?',
    });

    expect(result.demoMode).toBe(false);
    expect(result.answer).toContain('6 meses');
  });

  it('rechaza askLegalAssistant y submitLegalFeedback sin userId', async () => {
    const mock = createMockSupabase();
    await expect(askLegalAssistant(mock.client, '', { question: 'hola mundo' })).rejects.toThrow(
      'Usuario no autenticado'
    );
    await expect(submitLegalFeedback(mock.client, '', 'log-1', 1)).rejects.toThrow(
      'Usuario no autenticado'
    );
  });

  it('registra feedback filtrando por id y user_id (multi-tenancy)', async () => {
    const mock = createMockSupabase();
    const res = await submitLegalFeedback(mock.client, 'user-123', 'log-uuid-1', 1);
    expect(res).toEqual({ success: true });
    expect(mock.from).toHaveBeenCalledWith('legal_assistant_logs');
    expect(mock.update).toHaveBeenCalledWith({ feedback: 1 });
    expect(mock.eqId).toHaveBeenCalledWith('id', 'log-uuid-1');
    expect(mock.eqUser).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('lanza error si Supabase falla al actualizar feedback', async () => {
    const mock = createMockSupabase();
    mock.eqUser.mockResolvedValueOnce({ error: { message: 'RLS denied' } });

    await expect(submitLegalFeedback(mock.client, 'user-123', 'log-uuid-1', -1)).rejects.toThrow(
      'No se pudo guardar la valoración: RLS denied'
    );
  });

  it('trunca excerpts largos en mapChunksToCitations', () => {
    const citations = mapChunksToCitations([
      {
        chunkId: '1',
        documentCode: 'LEY_7_2022',
        documentTitle: 'Ley 7/2022',
        ambito: 'estatal',
        articleRef: 'Art. 21',
        sectionTitle: 'Almacenamiento',
        content: 'x'.repeat(300),
        score: 1,
      },
    ]);
    expect(citations[0].excerpt.endsWith('...')).toBe(true);
    expect(citations[0].excerpt.length).toBeLessThanOrEqual(220);
  });
});
