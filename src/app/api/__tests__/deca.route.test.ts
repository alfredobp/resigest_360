/**
 * @jest-environment node
 */
import { GET } from '../deca/[token]/route';
import { decaService } from '@/services/decaService';
import { generateDecaPDF } from '@/lib/pdfUtils';

const mockMaybeSingle = jest.fn();
const mockInsertAudit = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === 'deca_documents') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        };
      }
      if (table === 'deca_audit_logs') {
        return {
          insert: mockInsertAudit,
        };
      }
      return {};
    },
  }),
}));

jest.mock('@/services/decaService', () => ({
  decaService: {
    isTokenExpired: jest.fn(),
  },
}));

jest.mock('@/lib/pdfUtils', () => ({
  generateDecaPDF: jest.fn(),
}));

const makeReq = (url = 'https://resigest.com/api/deca/tok123', headers: Record<string, string> = {}) =>
  new Request(url, { headers }) as any;

describe('GET /api/deca/[token]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertAudit.mockResolvedValue({ error: null });
    (decaService.isTokenExpired as jest.Mock).mockReturnValue(false);
    (generateDecaPDF as jest.Mock).mockResolvedValue({
      output: () => new Uint8Array([37, 80, 68, 70]).buffer,
    });
  });

  it('devuelve 400 si no se proporciona token', async () => {
    const res = await GET(makeReq(), { params: Promise.resolve({ token: '' }) });
    expect(res.status).toBe(400);
  });

  it('devuelve 404 HTML si el documento DeCA no existe', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await GET(makeReq(), { params: Promise.resolve({ token: 'no_existe' }) });
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Documento de Control no encontrado');
  });

  it('devuelve 410 HTML si el enlace de inspección ha caducado (>7 días)', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 1, numero_deca: 'DECA-2026-00001', version: 1, fecha_finalizacion: '2026-01-01T00:00:00Z' },
      error: null,
    });
    (decaService.isTokenExpired as jest.Mock).mockReturnValue(true);

    const res = await GET(makeReq(), { params: Promise.resolve({ token: 'dca_expired' }) });
    expect(res.status).toBe(410);
    const html = await res.text();
    expect(html).toContain('Enlace de Inspección Caducado');
  });

  it('genera y descarga directamente el PDF con cabeceras inline y registra auditoría', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 10,
        user_id: 'user-1',
        numero_deca: 'DECA-2026-00010',
        version: 2,
      },
      error: null,
    });

    const req = makeReq('https://resigest.com/api/deca/dca_ok', {
      'x-forwarded-for': '203.0.113.10',
      'user-agent': 'GuardiaCivil-Inspector/1.0',
      host: 'app.resigest.com',
      'x-forwarded-proto': 'https',
    });

    const res = await GET(req, { params: Promise.resolve({ token: 'dca_ok' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('DECA-2026-00010_v2.pdf');
    expect(mockInsertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        deca_id: 10,
        user_id: 'user-1',
        accion: 'inspeccion_descarga',
        version_resultante: 2,
      })
    );
  });

  it('continúa sirviendo el PDF aunque falle el insert de auditoría y usa fallbacks de cabeceras', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 11,
        user_id: null,
        numero_deca: '',
        version: 1,
      },
      error: null,
    });
    mockInsertAudit.mockRejectedValue(new Error('Audit DB error'));

    const res = await GET(makeReq(), { params: Promise.resolve({ token: 'dca_fallback' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('DECA_v1.pdf');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('devuelve 500 si ocurre una excepción inesperada al generar el PDF', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockMaybeSingle.mockResolvedValue({
      data: { id: 12, numero_deca: 'DECA-2026-00012', version: 1 },
      error: null,
    });
    (generateDecaPDF as jest.Mock).mockRejectedValue(new Error('PDF engine error'));

    const res = await GET(makeReq(), { params: Promise.resolve({ token: 'dca_err' }) });
    expect(res.status).toBe(500);
    errSpy.mockRestore();
  });
});

