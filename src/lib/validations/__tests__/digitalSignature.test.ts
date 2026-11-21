import {
  buildAutoFirmaExtraParams,
  sanitizeExtraParamValue,
  sanitizePdfFileName,
  signedDocumentUploadSchema,
} from '@/lib/validations/digitalSignature';

describe('digitalSignature validations', () => {
  describe('signedDocumentUploadSchema', () => {
    it('valida un payload correcto con hash SHA-256 original', () => {
      const result = signedDocumentUploadSchema.safeParse({
        entityType: 'contract',
        entityId: '42',
        entityVersion: '2',
        fileName: 'contrato_CT-2026-001.pdf',
        originalSha256Hash: 'a'.repeat(64),
        signatureProvider: 'autofirma',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityVersion).toBe(2);
        expect(result.data.originalSha256Hash).toBe('a'.repeat(64));
      }
    });

    it('acepta originalSha256Hash vacío y lo normaliza a undefined', () => {
      const result = signedDocumentUploadSchema.safeParse({
        entityType: 'di',
        entityId: '101',
        fileName: 'DI_2026_001.PDF',
        originalSha256Hash: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.originalSha256Hash).toBeUndefined();
        expect(result.data.signatureProvider).toBe('autofirma');
      }
    });

    it('rechaza extensión distinta de .pdf', () => {
      const result = signedDocumentUploadSchema.safeParse({
        entityType: 'di',
        entityId: '101',
        fileName: 'documento.docx',
      });

      expect(result.success).toBe(false);
    });

    it('rechaza entityType no soportado o hash SHA-256 inválido', () => {
      const badType = signedDocumentUploadSchema.safeParse({
        entityType: 'invoice',
        entityId: '1',
        fileName: 'test.pdf',
      });
      expect(badType.success).toBe(false);

      const badHash = signedDocumentUploadSchema.safeParse({
        entityType: 'contract',
        entityId: '1',
        fileName: 'test.pdf',
        originalSha256Hash: 'not-a-valid-hash',
      });
      expect(badHash.success).toBe(false);
    });
  });

  describe('buildAutoFirmaExtraParams', () => {
    it('genera parámetros PAdES-BES con sello visual por defecto', () => {
      const params = buildAutoFirmaExtraParams();
      expect(params).toContain('format=PAdES');
      expect(params).toContain('signatureSubFilter=ETSI.CAdES.detached');
      expect(params).toContain('signaturePage=-1');
      expect(params).toContain('layer2Text=');
    });

    it('omite coordenadas de sello visual cuando includeVisualStamp es false', () => {
      const params = buildAutoFirmaExtraParams({
        includeVisualStamp: false,
        reason: 'Firma\ncon=caracteres',
        location: 'Sevilla',
      });

      expect(params).toContain('signatureReason=Firma con caracteres');
      expect(params).toContain('signatureProductionCity=Sevilla');
      expect(params).not.toContain('signaturePositionOnPageLowerLeftX');
    });

    it('desplaza las coordenadas para evitar solapamiento en co-firmas', () => {
      const slot0 = buildAutoFirmaExtraParams({ includeVisualStamp: true, signatureSlotIndex: 0 });
      const slot1 = buildAutoFirmaExtraParams({ includeVisualStamp: true, signatureSlotIndex: 1 });
      const slot2 = buildAutoFirmaExtraParams({ includeVisualStamp: true, signatureSlotIndex: 2 });

      expect(slot0).toContain('signaturePositionOnPageLowerLeftX=36');
      expect(slot1).toContain('signaturePositionOnPageLowerLeftX=310');
      expect(slot2).toContain('signaturePositionOnPageLowerLeftY=72');
    });
  });

  describe('sanitize helpers', () => {
    it('sanitiza valores de extraParams y nombres de archivo PDF', () => {
      expect(sanitizeExtraParamValue('A=B\r\nC  D')).toBe('A B C D');
      expect(sanitizePdfFileName('mi contrato / 2026')).toBe('mi_contrato_2026.pdf');
      expect(sanitizePdfFileName('DI-2026_01.pdf')).toBe('DI-2026_01.pdf');
    });
  });
});

