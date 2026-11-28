import pdfSignatureService from '@/services/pdfSignatureService';
import * as autoFirmaClient from '@/lib/signature/autoFirmaClient';
import type { SignedDocumentRecord } from '@/lib/validations/digitalSignature';

jest.mock('@/lib/signature/autoFirmaClient', () => ({
  ...jest.requireActual('@/lib/signature/autoFirmaClient'),
  signPdfWithAutoFirma: jest.fn(),
}));

const MOCK_RECORD: SignedDocumentRecord = {
  id: 'doc-uuid-1',
  user_id: 'user-1',
  company_id: 10,
  entity_type: 'contract',
  entity_id: '42',
  entity_version: 1,
  storage_path: '10/contract/42/file.pdf',
  file_name: 'contrato_42_firmado.pdf',
  file_size_bytes: 2048,
  sha256_hash: 'a'.repeat(64),
  signature_level: 'PAdES-BES',
  signature_provider: 'autofirma',
  signature_count: 1,
  signer_cn: 'EMPRESA DEMO S.L.',
  signer_nif: 'B12345678',
  issuer_cn: 'AC FNMT',
  certificate_serial: '01AB',
  signed_at: '2026-11-21T10:00:00Z',
  created_at: '2026-11-21T10:00:00Z',
};

describe('pdfSignatureService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('lista documentos firmados para una entidad', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [MOCK_RECORD] }),
    });

    const docs = await pdfSignatureService.getSignedDocuments('contract', 42);
    expect(docs).toEqual([MOCK_RECORD]);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pdf/signed?entityType=contract&entityId=42',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('lanza error descriptivo si falla getSignedDocuments', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'No autorizado' }),
    });

    await expect(pdfSignatureService.getSignedDocuments('di', 99)).rejects.toThrow(
      'No autorizado'
    );
  });

  it('ejecuta el flujo completo signAndStoreWithAutoFirma', async () => {
    (autoFirmaClient.signPdfWithAutoFirma as jest.Mock).mockResolvedValue(
      Buffer.from('%PDF-1.4 signed').toString('base64')
    );
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ document: MOCK_RECORD }),
    });

    const rawBuffer = new TextEncoder().encode('%PDF-1.4 original').buffer;
    const result = await pdfSignatureService.signAndStoreWithAutoFirma({
      pdfBuffer: rawBuffer,
      entityType: 'contract',
      entityId: 42,
      entityVersion: 1,
      signerRole: 'productor',
      fileName: 'contrato_42.pdf',
      options: { includeVisualStamp: true },
    });

    expect(result.record).toEqual(MOCK_RECORD);
    expect(result.signedBlob).toBeInstanceOf(Blob);
    expect(autoFirmaClient.signPdfWithAutoFirma).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pdf/signed',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('lanza error si uploadSignedPdf devuelve status de error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Firma PAdES inválida' }),
    });

    await expect(
      pdfSignatureService.uploadSignedPdf({
        signedPdfBlob: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
        entityType: 'di',
        entityId: 10,
        fileName: 'di_10.pdf',
      })
    ).rejects.toThrow('Firma PAdES inválida');
  });

  it('recupera Blob y ArrayBuffer del PDF firmado custodiado', async () => {
    const fakeBlob = new Blob(['%PDF-1.4 custodiado'], { type: 'application/pdf' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => fakeBlob,
    });

    const buf = await pdfSignatureService.fetchSignedPdfArrayBuffer('doc-uuid-1');
    expect(buf.byteLength).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pdf/signed/doc-uuid-1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('lanza error si falla la descarga de un PDF firmado', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Sin permisos' }),
    });

    await expect(pdfSignatureService.fetchSignedPdfBlob('doc-uuid-1')).rejects.toThrow(
      'Sin permisos'
    );
  });

  it('usa mensajes por defecto cuando el cuerpo de error no es JSON válido', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('bad json');
      },
    });

    await expect(pdfSignatureService.getSignedDocuments('contract', 1)).rejects.toThrow(
      /historial de firmas/i
    );
    await expect(
      pdfSignatureService.uploadSignedPdf({
        signedPdfBlob: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
        entityType: 'contract',
        entityId: 1,
        fileName: 'c.pdf',
      })
    ).rejects.toThrow(/verificar y custodiar/i);
    await expect(pdfSignatureService.fetchSignedPdfBlob('id-1')).rejects.toThrow(
      /descargar el PDF firmado/i
    );
  });

  it('devuelve array vacío si documents no es un array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: null }),
    });
    const docs = await pdfSignatureService.getSignedDocuments('contract', 1);
    expect(docs).toEqual([]);
  });

  it('dispara la descarga en navegador mediante downloadSignedDocument', async () => {
    const fakeBlob = new Blob(['%PDF-1.4 custodiado'], { type: 'application/pdf' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => fakeBlob,
    });

    const click = jest.fn();
    const fakeLink = { href: '', download: '', click };
    const origDocument = global.document;
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;

    (global as any).document = {
      createElement: jest.fn().mockReturnValue(fakeLink),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      },
    };
    URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = jest.fn();

    try {
      await pdfSignatureService.downloadSignedDocument('doc-uuid-1', 'mi contrato.pdf');
      expect(click).toHaveBeenCalledTimes(1);
      expect(fakeLink.download).toBe('mi_contrato.pdf');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    } finally {
      (global as any).document = origDocument;
      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
    }
  });
});

