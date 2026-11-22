import { POST } from '@/app/api/assistant/legal/route';
import { resetRateLimit } from '@/lib/rateLimit';

const mockGetUser = jest.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => mockSupabase),
}));

const mockAskLegalAssistant = jest.fn();
jest.mock('@/services/legalAssistantService', () => ({
  askLegalAssistant: (...args: unknown[]) => mockAskLegalAssistant(...args),
}));

describe('POST /api/assistant/legal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimit();
  });

  it('devuelve 401 si no hay usuario autenticado', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const req = new Request('http://localhost/api/assistant/legal', {
      method: 'POST',
      body: JSON.stringify({ question: '¿Qué plazo tiene el DI?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('devuelve 400 si la pregunta es inválida', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });

    const req = new Request('http://localhost/api/assistant/legal', {
      method: 'POST',
      body: JSON.stringify({ question: 'a' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('devuelve 400 si el cuerpo JSON está mal formado', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });

    const req = new Request('http://localhost/api/assistant/legal', {
      method: 'POST',
      body: '{invalid-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('devuelve 200 con respuesta y citas en happy path', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockAskLegalAssistant.mockResolvedValueOnce({
      logId: '550e8400-e29b-41d4-a716-446655440000',
      answer: 'El plazo es de 30 días naturales.',
      sources: [],
      model: 'gemini-3.5-flash-lite',
      retrievalMode: 'hybrid',
      demoMode: false,
      disclaimer: 'Orientación informativa',
    });

    const req = new Request('http://localhost/api/assistant/legal', {
      method: 'POST',
      body: JSON.stringify({
        question: '¿Qué plazo tiene el gestor para aceptar un DI?',
        perfilOperativo: 'productor',
      }),
    });

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.answer).toContain('30 días');
    expect(mockAskLegalAssistant).toHaveBeenCalledWith(
      mockSupabase,
      'u1',
      expect.objectContaining({
        question: '¿Qué plazo tiene el gestor para aceptar un DI?',
        perfilOperativo: 'productor',
      })
    );
  });

  it('devuelve 429 al superar el rate limit', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-rate' } }, error: null });
    mockAskLegalAssistant.mockResolvedValue({
      logId: null,
      answer: 'ok',
      sources: [],
      model: 'offline',
      retrievalMode: 'local_fallback',
      demoMode: true,
      disclaimer: 'd',
    });

    for (let i = 0; i < 15; i += 1) {
      const res = await POST(
        new Request('http://localhost/api/assistant/legal', {
          method: 'POST',
          body: JSON.stringify({ question: '¿Plazo de memoria anual?' }),
        })
      );
      expect(res.status).toBe(200);
    }

    const blocked = await POST(
      new Request('http://localhost/api/assistant/legal', {
        method: 'POST',
        body: JSON.stringify({ question: '¿Plazo de memoria anual?' }),
      })
    );
    expect(blocked.status).toBe(429);
  });

  it('devuelve 500 si el servicio lanza un error inesperado', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } }, error: null });
    mockAskLegalAssistant.mockRejectedValueOnce(new Error('Gemini down'));

    const res = await POST(
      new Request('http://localhost/api/assistant/legal', {
        method: 'POST',
        body: JSON.stringify({ question: '¿Plazo de almacenamiento?' }),
      })
    );

    expect(res.status).toBe(500);
    consoleSpy.mockRestore();
  });
});
