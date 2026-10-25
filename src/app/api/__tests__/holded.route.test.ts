/**
 * @jest-environment node
 */
import { GET, POST } from '../holded/route';

const mockGetUser = jest.fn();
const mockLimit = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: () => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        not: () => chain,
        order: () => chain,
        limit: mockLimit,
      };
      return chain;
    },
  }),
}));

const req = (url: string, init?: RequestInit) => new Request(url, init) as any;

describe('/api/holded', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockLimit.mockResolvedValue({ data: [{ holded_api_key: 'srv-key' }], error: null });
    global.fetch = jest.fn().mockResolvedValue({ status: 200, json: async () => ({ ok: true }) }) as any;
  });

  it('devuelve 401 sin sesión', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(req('http://x/api/holded?action=listContacts'));
    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('devuelve 400 si la empresa no tiene clave', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });
    const res = await GET(req('http://x/api/holded?action=listContacts'));
    expect(res.status).toBe(400);
  });

  it('ignora el header x-holded-key y usa la clave del servidor', async () => {
    await GET(req('http://x/api/holded?action=listContacts', { headers: { 'x-holded-key': 'atacante' } }));
    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(init.headers.key).toBe('srv-key');
  });

  it('rechaza ids con caracteres de ruta', async () => {
    const res = await GET(req('http://x/api/holded?action=getContact&id=..%2F..%2Fx'));
    expect(res.status).toBe(400);
    const res2 = await POST(req('http://x/api/holded?action=updateContact&id=a/b', { method: 'POST', body: '{}' }));
    expect(res2.status).toBe(400);
  });

  it('acepta id válido y acción desconocida devuelve 400', async () => {
    expect((await GET(req('http://x/api/holded?action=getContact&id=abc-123'))).status).toBe(200);
    expect((await GET(req('http://x/api/holded?action=foo'))).status).toBe(400);
    expect((await POST(req('http://x/api/holded?action=foo', { method: 'POST', body: '{}' }))).status).toBe(400);
  });

  it('POST crea contacto, factura y recurrente; falla con JSON inválido', async () => {
    for (const a of ['createContact', 'createInvoice', 'createRecurringInvoice']) {
      const r = await POST(req(`http://x/api/holded?action=${a}`, { method: 'POST', body: '{"a":1}' }));
      expect(r.status).toBe(200);
    }
    const bad = await POST(req('http://x/api/holded?action=createContact', { method: 'POST', body: 'no-json' }));
    expect(bad.status).toBe(400);
  });

  it('POST updateContact con id válido', async () => {
    const r = await POST(req('http://x/api/holded?action=updateContact&id=c1', { method: 'POST', body: '{}' }));
    expect(r.status).toBe(200);
  });

  it('devuelve 502 sin filtrar el error upstream', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValue(new Error('secreto interno'));
    const res = await GET(req('http://x/api/holded?action=listContacts'));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('secreto');
    const res2 = await POST(req('http://x/api/holded?action=createContact', { method: 'POST', body: '{}' }));
    expect(res2.status).toBe(502);
  });
});
