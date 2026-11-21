import { NextRequest } from 'next/server';
import { GET as listSignedGET, POST as uploadSignedPOST } from '@/app/api/pdf/signed/route';
import { GET as downloadSignedGET } from '@/app/api/pdf/signed/[id]/route';
import { InvalidPadesSignatureError, inspectSignedPdf } from '@/lib/pdf/padesInspector';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockStorageUpload = jest.fn();
const mockStorageDownload = jest.fn();
const mockStorageRemove = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
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

function makeChain(result: { data?: any; error?: any }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
  return chain;
}

describe('/api/pdf/signed & /api/pdf/signed/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageRemove.mockResolvedValue({ error: null });
  });

  describe('GET /api/pdf/signed', () => {
    it('devuelve 401 si no hay usuario autenticado', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const req = new NextRequest('http://localhost/api/pdf/signed?entityType=contract&entityId=1');
      const res = await listSignedGET(req);
      expect(res.status).toBe(401);
    });

    it('devuelve 400 si faltan parámetros válidos', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      const req = new NextRequest('http://localhost/api/pdf/signed?entityType=invalid');
      const res = await listSignedGET(req);
      expect(res.status).toBe(400);
    });

    it('devuelve 404 si la entidad pertenece a otro tenant', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }] }) };
        }
        if (table === 'company_memberships') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [] }) };
        }
        if (table === 'waste_contracts') {
          return makeChain({ data: { id: 99, user_id: 'other-user', company_id: 999 }, error: null });
        }
        return makeChain({ data: [], error: null });
      });

      const req = new NextRequest('http://localhost/api/pdf/signed?entityType=contract&entityId=99');
      const res = await listSignedGET(req);
      expect(res.status).toBe(404);
    });

    it('devuelve 200 con documentos firmados del tenant', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }] }) };
        }
        if (table === 'company_memberships') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [] }) };
        }
        if (table === 'waste_contracts') {
          return makeChain({ data: { id: 42, user_id: 'u1', company_id: 10 }, error: null });
        }
        if (table === 'signed_documents') {
          return makeChain({ data: [{ id: 'sig-1', signer_cn: 'EMPRESA' }], error: null });
        }
        return makeChain({ data: [], error: null });
      });

      const req = new NextRequest('http://localhost/api/pdf/signed?entityType=contract&entityId=42');
      const res = await listSignedGET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.documents).toHaveLength(1);
    });

    it('devuelve 500 si falla la consulta de signed_documents', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }] }) };
        }
        if (table === 'company_memberships') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [] }) };
        }
        if (table === 'waste_contracts') {
          return makeChain({ data: { id: 42, user_id: 'u1', company_id: 10 }, error: null });
        }
        if (table === 'signed_documents') {
          return makeChain({ data: null, error: { message: 'Query failed' } });
        }
        return makeChain({ data: [], error: null });
      });

      const req = new NextRequest('http://localhost/api/pdf/signed?entityType=contract&entityId=42');
      const res = await listSignedGET(req);
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/pdf/signed', () => {
    function buildUploadRequest(fileContent = '%PDF-1.4 signed') {
      const formData = new FormData();
      const file = new File([fileContent], 'di_10_firmado.pdf', { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('entityType', 'di');
      formData.append('entityId', '10');
      formData.append('entityVersion', '1');
      formData.append('fileName', 'di_10_firmado.pdf');

      return {
        formData: async () => formData,
      } as unknown as NextRequest;
    }

    it('devuelve 401 sin sesión', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const res = await uploadSignedPOST(buildUploadRequest());
      expect(res.status).toBe(401);
    });

    it('devuelve 400 si inspectSignedPdf rechaza la firma PAdES', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }] }) };
        }
        if (table === 'company_memberships') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [] }) };
        }
        if (table === 'identification_documents') {
          return makeChain({ data: { id: 10, user_id: 'u1', company_id: 10 }, error: null });
        }
        return makeChain({ data: null, error: null });
      });

      (inspectSignedPdf as jest.Mock).mockImplementation(() => {
        throw new InvalidPadesSignatureError('El PDF no contiene ninguna firma electrónica PAdES');
      });

      const res = await uploadSignedPOST(buildUploadRequest());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('PAdES');
    });

    it('custodia el PDF firmado, inserta en signed_documents y audita (201)', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockStorageUpload.mockResolvedValue({ error: null });

      const auditInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }] }) };
        }
        if (table === 'company_memberships') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [] }) };
        }
        if (table === 'identification_documents') {
          return makeChain({ data: { id: 10, user_id: 'u1', company_id: 10 }, error: null });
        }
        if (table === 'signed_documents') {
          return makeChain({
            data: { id: 'sig-uuid-1', signer_cn: 'ALFREDO', sha256_hash: 'a'.repeat(64) },
            error: null,
          });
        }
        if (table === 'audit_logs') {
          return { insert: auditInsert };
        }
        return makeChain({ data: null, error: null });
      });

      (inspectSignedPdf as jest.Mock).mockReturnValue({
        sha256Hash: 'a'.repeat(64),
        fileSizeBytes: 512,
        signatureCount: 1,
        signatureLevel: 'PAdES-BES',
        signerCn: 'ALFREDO',
        signerNif: '12345678Z',
        issuerCn: 'AC FNMT',
        certificateSerial: '01AB',
        certificateValidFrom: '2025-01-01T00:00:00Z',
        certificateValidTo: '2028-01-01T00:00:00Z',
      });

      const res = await uploadSignedPOST(buildUploadRequest());
      expect(res.status).toBe(201);
      expect(mockStorageUpload).toHaveBeenCalledTimes(1);
      expect(auditInsert).toHaveBeenCalledTimes(1);
    });

    it('devuelve 400 si falta archivo o metadatos Zod inválidos', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      const emptyForm = new FormData();
      const resNoFile = await uploadSignedPOST({
        formData: async () => emptyForm,
      } as unknown as NextRequest);
      expect(resNoFile.status).toBe(400);

      const badMetaForm = new FormData();
      badMetaForm.append('file', new File(['%PDF-1.4'], 'bad.txt', { type: 'text/plain' }));
      badMetaForm.append('entityType', 'invalid');
      badMetaForm.append('entityId', '');
      const resBadMeta = await uploadSignedPOST({
        formData: async () => badMetaForm,
      } as unknown as NextRequest);
      expect(resBadMeta.status).toBe(400);
    });

    it('devuelve 500 si falla storage upload o inserción en signed_documents', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [] }) };
        }
        if (table === 'company_memberships') {
          return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [{ company_id: 10 }] }) };
        }
        if (table === 'identification_documents') {
          return makeChain({ data: { id: 10, user_id: 'other', company_id: 10 }, error: null });
        }
        if (table === 'signed_documents') {
          return makeChain({ data: null, error: { message: 'DB error' } });
        }
        return makeChain({ data: null, error: null });
      });

      (inspectSignedPdf as jest.Mock).mockReturnValue({
        sha256Hash: 'a'.repeat(64),
        fileSizeBytes: 512,
        signatureCount: 1,
        signatureLevel: 'PAdES-BES',
        signerCn: 'ALFREDO',
        signerNif: '12345678Z',
        issuerCn: 'AC FNMT',
        certificateSerial: '01AB',
        certificateValidFrom: null,
        certificateValidTo: null,
      });

      mockStorageUpload.mockResolvedValueOnce({ error: { message: 'Bucket missing' } });
      const resStorageErr = await uploadSignedPOST(buildUploadRequest());
      expect(resStorageErr.status).toBe(500);

      mockStorageUpload.mockResolvedValueOnce({ error: null });
      const resDbErr = await uploadSignedPOST(buildUploadRequest());
      expect(resDbErr.status).toBe(500);
      expect(mockStorageRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/pdf/signed/[id]', () => {
    it('devuelve 400 si el id está vacío', async () => {
      const res = await downloadSignedGET(
        new NextRequest('http://localhost/api/pdf/signed/'),
        { params: Promise.resolve({ id: '   ' }) }
      );
      expect(res.status).toBe(400);
    });

    it('devuelve 401 sin sesión', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const res = await downloadSignedGET(
        new NextRequest('http://localhost/api/pdf/signed/sig-1'),
        { params: Promise.resolve({ id: 'sig-1' }) }
      );
      expect(res.status).toBe(401);
    });

    it('devuelve 404 si no existe el registro', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockFrom.mockImplementation(() => makeChain({ data: null, error: null }));
      const res = await downloadSignedGET(
        new NextRequest('http://localhost/api/pdf/signed/sig-missing'),
        { params: Promise.resolve({ id: 'sig-missing' }) }
      );
      expect(res.status).toBe(404);
    });

    it('devuelve 403 si el documento pertenece a otro tenant', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u-intruder' } }, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'signed_documents') {
          return makeChain({
            data: { id: 'sig-1', user_id: 'u-owner', company_id: 10, storage_path: '10/a.pdf' },
            error: null,
          });
        }
        return makeChain({ data: null, error: null });
      });

      const res = await downloadSignedGET(
        new NextRequest('http://localhost/api/pdf/signed/sig-1'),
        { params: Promise.resolve({ id: 'sig-1' }) }
      );
      expect(res.status).toBe(403);
    });

    it('devuelve 500 si falla la descarga de Storage', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockFrom.mockImplementation(() =>
        makeChain({
          data: {
            id: 'sig-1',
            user_id: 'u1',
            company_id: 10,
            storage_path: '10/contract/42/doc.pdf',
            file_name: 'doc.pdf',
            sha256_hash: 'b'.repeat(64),
          },
          error: null,
        })
      );
      mockStorageDownload.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const res = await downloadSignedGET(
        new NextRequest('http://localhost/api/pdf/signed/sig-1'),
        { params: Promise.resolve({ id: 'sig-1' }) }
      );
      expect(res.status).toBe(500);
    });

    it('devuelve 200 con binario PDF y cabecera X-Document-SHA256 para propietario', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
      mockFrom.mockImplementation(() =>
        makeChain({
          data: {
            id: 'sig-1',
            user_id: 'u1',
            company_id: 10,
            storage_path: '10/contract/42/doc.pdf',
            file_name: 'contrato_42_firmado.pdf',
            sha256_hash: 'b'.repeat(64),
          },
          error: null,
        })
      );
      mockStorageDownload.mockResolvedValue({
        data: new Blob(['%PDF-1.4 firmado'], { type: 'application/pdf' }),
        error: null,
      });

      const res = await downloadSignedGET(
        new NextRequest('http://localhost/api/pdf/signed/sig-1'),
        { params: Promise.resolve({ id: 'sig-1' }) }
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('X-Document-SHA256')).toBe('b'.repeat(64));
    });
  });
});

