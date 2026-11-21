import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/public/sign-contract-pades/route';
import { InvalidPadesSignatureError, inspectSignedPdf } from '@/lib/pdf/padesInspector';
import { rateLimit } from '@/lib/rateLimit';

const mockFrom = jest.fn();
const mockStorageUpload = jest.fn();
const mockStorageDownload = jest.fn();
const mockStorageRemove = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    storage: {
      from: jest.fn(() => ({
        upload: mockStorageUpload,
        download: mockStorageDownload,
        remove: mockStorageRemove,
      })),
    },
  })),
}));

jest.mock('@/lib/pdf/padesInspector', () => ({
  ...jest.requireActual('@/lib/pdf/padesInspector'),
  inspectSignedPdf: jest.fn(),
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => true),
  clientIp: jest.fn(() => '127.0.0.1'),
}));

function makeChain(result: { data?: any; error?: any }) {
  return {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

describe('/api/public/sign-contract-pades', () => {
  const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role';
    (rateLimit as jest.Mock).mockReturnValue(true);
    mockStorageRemove.mockResolvedValue({ error: null });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  });

  describe('GET', () => {
    it('devuelve 429 si excede rate limit y 400 si falta token', async () => {
      (rateLimit as jest.Mock).mockReturnValueOnce(false);
      const res429 = await GET(new NextRequest('http://localhost/api/public/sign-contract-pades?token=abc'));
      expect(res429.status).toBe(429);

      const res400 = await GET(new NextRequest('http://localhost/api/public/sign-contract-pades'));
      expect(res400.status).toBe(400);
    });

    it('devuelve enabled=false si falta SERVICE_ROLE_KEY', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const res = await GET(new NextRequest('http://localhost/api/public/sign-contract-pades?token=abc'));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ enabled: false, latestSignedDocument: null });
    });

    it('devuelve 404 si el token no corresponde a ningún contrato', async () => {
      mockFrom.mockImplementation(() => makeChain({ data: null, error: null }));
      const res = await GET(new NextRequest('http://localhost/api/public/sign-contract-pades?token=bad'));
      expect(res.status).toBe(404);
    });

    it('devuelve enabled=true y metadatos del último documento firmado, y permite descarga con download=1', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return makeChain({ data: { id: 42, company_id: 10, user_id: 'u1' }, error: null });
        }
        if (table === 'companies') {
          return makeChain({ data: { id: 10, firma_electronica_activa: true }, error: null });
        }
        if (table === 'signed_documents') {
          return makeChain({
            data: [
              {
                id: 'sig-1',
                file_name: 'contrato_42_firmado.pdf',
                storage_path: '10/contract/42/doc.pdf',
                sha256_hash: 'a'.repeat(64),
                signature_level: 'PAdES-BES',
                signature_count: 1,
                signer_cn: 'EMPRESA',
                signer_nif: 'B12345678',
                issuer_cn: 'AC FNMT',
                signed_at: '2026-11-21T10:00:00Z',
              },
            ],
            error: null,
          });
        }
        return makeChain({ data: null, error: null });
      });

      const res = await GET(new NextRequest('http://localhost/api/public/sign-contract-pades?token=tok-1'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
      expect(body.latestSignedDocument.id).toBe('sig-1');

      mockStorageDownload.mockResolvedValue({
        data: new Blob(['%PDF-1.4 firmado'], { type: 'application/pdf' }),
        error: null,
      });
      const dlRes = await GET(
        new NextRequest('http://localhost/api/public/sign-contract-pades?token=tok-1&download=1')
      );
      expect(dlRes.status).toBe(200);
      expect(dlRes.headers.get('Content-Type')).toBe('application/pdf');

      mockStorageDownload.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
      const dlErr = await GET(
        new NextRequest('http://localhost/api/public/sign-contract-pades?token=tok-1&download=1')
      );
      expect(dlErr.status).toBe(500);
    });

    it('devuelve 404 con download=1 cuando no hay PDF firmado previo', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return makeChain({ data: { id: 42, company_id: 10, user_id: 'u1' }, error: null });
        }
        if (table === 'companies') {
          return makeChain({ data: { id: 10, firma_electronica_activa: true }, error: null });
        }
        return makeChain({ data: [], error: null });
      });

      const res = await GET(
        new NextRequest('http://localhost/api/public/sign-contract-pades?token=tok-1&download=1')
      );
      expect(res.status).toBe(404);
    });
  });

  describe('POST', () => {
    function buildFormRequest(overrides?: { token?: string; role?: string; withFile?: boolean }) {
      const fd = new FormData();
      if (overrides?.token !== '') fd.append('token', overrides?.token ?? 'tok-1');
      if (overrides?.role !== '') fd.append('role', overrides?.role ?? 'gestor');
      if (overrides?.withFile !== false) {
        fd.append('file', new File(['%PDF-1.4'], 'contrato_firmado.pdf', { type: 'application/pdf' }));
      }
      return {
        headers: new Headers(),
        formData: async () => fd,
      } as unknown as NextRequest;
    }

    it('devuelve 503 si falta SERVICE_ROLE_KEY y 400 con parámetros inválidos', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const res503 = await POST(buildFormRequest());
      expect(res503.status).toBe(503);

      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role';
      expect((await POST(buildFormRequest({ token: '' }))).status).toBe(400);
      expect((await POST(buildFormRequest({ role: 'transportista' }))).status).toBe(400);
      expect((await POST(buildFormRequest({ withFile: false }))).status).toBe(400);
    });

    it('devuelve 403 si la empresa no tiene firma_electronica_activa', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return makeChain({
            data: { id: 42, company_id: 10, user_id: 'u1', firmado_productor: false, firmado_gestor: false },
            error: null,
          });
        }
        if (table === 'companies') {
          return makeChain({ data: { id: 10, firma_electronica_activa: false }, error: null });
        }
        return makeChain({ data: null, error: null });
      });

      const res = await POST(buildFormRequest());
      expect(res.status).toBe(403);
    });

    it('devuelve 409 si el rol ya ha firmado previamente (bloqueo)', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return makeChain({
            data: { id: 42, company_id: 10, user_id: 'u1', firmado_productor: true, firmado_gestor: true },
            error: null,
          });
        }
        if (table === 'companies') {
          return makeChain({ data: { id: 10, firma_electronica_activa: true }, error: null });
        }
        return makeChain({ data: null, error: null });
      });

      const res = await POST(buildFormRequest({ role: 'gestor' }));
      expect(res.status).toBe(409);
    });

    it('devuelve 400 si la firma PAdES es inválida', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return makeChain({
            data: { id: 42, company_id: 10, user_id: 'u1', firmado_productor: false, firmado_gestor: false },
            error: null,
          });
        }
        if (table === 'companies') {
          return makeChain({ data: { id: 10, firma_electronica_activa: true }, error: null });
        }
        return makeChain({ data: null, error: null });
      });
      (inspectSignedPdf as jest.Mock).mockImplementation(() => {
        throw new InvalidPadesSignatureError('Firma PAdES inválida');
      });

      const res = await POST(buildFormRequest({ role: 'productor' }));
      expect(res.status).toBe(400);
    });

    it('custodia el PDF firmado, actualiza waste_contracts a vigente y registra auditoría (201)', async () => {
      const updateEq = jest.fn().mockResolvedValue({ error: null });
      const updateFn = jest.fn(() => ({ eq: updateEq }));
      const auditInsert = jest.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return {
            ...makeChain({
              data: {
                id: 42,
                company_id: 10,
                user_id: 'u1',
                numero_contrato: 'CT-2026-01',
                version: 1,
                estado: 'pendiente_firma',
                firmado_productor: true,
                firmado_gestor: false,
              },
              error: null,
            }),
            update: updateFn,
          };
        }
        if (table === 'companies') {
          return makeChain({ data: { id: 10, firma_electronica_activa: true }, error: null });
        }
        if (table === 'signed_documents') {
          return makeChain({
            data: { id: 'sig-99', signer_cn: 'GESTOR DEMO', sha256_hash: 'c'.repeat(64) },
            error: null,
          });
        }
        if (table === 'audit_logs') {
          return { insert: auditInsert };
        }
        return makeChain({ data: null, error: null });
      });

      mockStorageUpload.mockResolvedValue({ error: null });
      (inspectSignedPdf as jest.Mock).mockReturnValue({
        sha256Hash: 'c'.repeat(64),
        fileSizeBytes: 1024,
        signatureCount: 2,
        signatureLevel: 'PAdES-BES',
        signerCn: 'GESTOR DEMO',
        signerNif: 'B99999999',
        issuerCn: 'AC FNMT',
        certificateSerial: '99AA',
        certificateValidFrom: null,
        certificateValidTo: null,
      });

      const res = await POST(buildFormRequest({ role: 'gestor' }));
      expect(res.status).toBe(201);
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ firmado_gestor: true, estado: 'vigente' })
      );
      expect(auditInsert).toHaveBeenCalledTimes(1);
    });

    it('cubre rate limit 429, contrato 404, errores de storage/BD 500 y borrador->pendiente_firma', async () => {
      (rateLimit as jest.Mock).mockReturnValueOnce(false);
      expect((await POST(buildFormRequest())).status).toBe(429);

      mockFrom.mockImplementation(() => makeChain({ data: null, error: null }));
      expect((await POST(buildFormRequest())).status).toBe(404);

      const updateEq = jest.fn().mockResolvedValue({ error: null });
      const updateFn = jest.fn(() => ({ eq: updateEq }));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return {
            ...makeChain({
              data: { id: 43, company_id: 10, user_id: 'u1', estado: 'borrador', firmado_productor: false, firmado_gestor: false },
              error: null,
            }),
            update: updateFn,
          };
        }
        if (table === 'companies') {
          return makeChain({ data: { id: 10, firma_electronica_activa: true }, error: null });
        }
        if (table === 'signed_documents') {
          return makeChain({ data: null, error: { message: 'db err' } });
        }
        return makeChain({ data: null, error: null });
      });

      (inspectSignedPdf as jest.Mock).mockReturnValue({
        sha256Hash: 'd'.repeat(64),
        fileSizeBytes: 512,
        signatureCount: 1,
        signatureLevel: 'PAdES-BES',
        signerCn: 'PRODUCTOR',
        signerNif: 'A11111111',
        issuerCn: 'AC FNMT',
        certificateSerial: '11BB',
        certificateValidFrom: null,
        certificateValidTo: null,
      });

      mockStorageUpload.mockResolvedValueOnce({ error: { message: 'storage err' } });
      expect((await POST(buildFormRequest({ role: 'productor' }))).status).toBe(500);

      mockStorageUpload.mockResolvedValueOnce({ error: null });
      mockStorageRemove.mockRejectedValueOnce(new Error('cleanup err'));
      expect((await POST(buildFormRequest({ role: 'productor' }))).status).toBe(500);

      // Caso borrador firmado por productor -> pendiente_firma
      mockFrom.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return {
            ...makeChain({
              data: { id: 43, company_id: 10, user_id: 'u1', estado: 'borrador', firmado_productor: false, firmado_gestor: false },
              error: null,
            }),
            update: updateFn,
          };
        }
        if (table === 'companies') {
          return makeChain({ data: { id: 10, firma_electronica_activa: true }, error: null });
        }
        if (table === 'signed_documents') {
          return makeChain({ data: { id: 'sig-100', signer_cn: 'PRODUCTOR' }, error: null });
        }
        return { insert: jest.fn().mockRejectedValue(new Error('audit err')) };
      });
      mockStorageUpload.mockResolvedValueOnce({ error: null });
      const resDraft = await POST(buildFormRequest({ role: 'productor' }));
      expect(resDraft.status).toBe(201);
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ firmado_productor: true, estado: 'pendiente_firma' })
      );
    });
  });
});

