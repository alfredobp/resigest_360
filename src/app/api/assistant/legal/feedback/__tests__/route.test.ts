import { POST } from '@/app/api/assistant/legal/feedback/route';
import { resetRateLimit } from '@/lib/rateLimit';

const mockGetUser = jest.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => mockSupabase),
}));

const mockSubmitLegalFeedback = jest.fn();
jest.mock('@/services/legalAssistantService', () => ({
  submitLegalFeedback: (...args: unknown[]) => mockSubmitLegalFeedback(...args),
}));

describe('POST /api/assistant/legal/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimit();
  });

  it('devuelve 401 si no hay usuario autenticado', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await POST(
      new Request('http://localhost/api/assistant/legal/feedback', {
        method: 'POST',
        body: JSON.stringify({ logId: '550e8400-e29b-41d4-a716-446655440000', feedback: 1 }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('devuelve 400 si el payload es inválido', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(
      new Request('http://localhost/api/assistant/legal/feedback', {
        method: 'POST',
        body: JSON.stringify({ logId: 'invalid', feedback: 5 }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('devuelve 400 si el cuerpo JSON está mal formado', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const res = await POST(
      new Request('http://localhost/api/assistant/legal/feedback', {
        method: 'POST',
        body: '{invalid-json',
      })
    );
    expect(res.status).toBe(400);
  });

  it('devuelve 200 al guardar feedback válido', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockSubmitLegalFeedback.mockResolvedValueOnce({ success: true });

    const res = await POST(
      new Request('http://localhost/api/assistant/legal/feedback', {
        method: 'POST',
        body: JSON.stringify({ logId: '550e8400-e29b-41d4-a716-446655440000', feedback: 1 }),
      })
    );

    expect(res.status).toBe(200);
    expect(mockSubmitLegalFeedback).toHaveBeenCalledWith(
      mockSupabase,
      'u1',
      '550e8400-e29b-41d4-a716-446655440000',
      1
    );
  });

  it('devuelve 500 si falla el guardado en Supabase', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    mockSubmitLegalFeedback.mockRejectedValueOnce(new Error('DB error'));

    const res = await POST(
      new Request('http://localhost/api/assistant/legal/feedback', {
        method: 'POST',
        body: JSON.stringify({ logId: '550e8400-e29b-41d4-a716-446655440000', feedback: -1 }),
      })
    );

    expect(res.status).toBe(500);
    consoleSpy.mockRestore();
  });
});
