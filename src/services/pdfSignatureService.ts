import {
  arrayBufferToBase64,
  base64ToPdfBlob,
  computeSha256Hex,
  signPdfWithAutoFirma,
} from '@/lib/signature/autoFirmaClient';
import {
  sanitizePdfFileName,
  type AutoFirmaSignOptions,
  type SignedDocumentRecord,
  type SignedEntityType,
  type SignerRole,
} from '@/lib/validations/digitalSignature';

export interface UploadSignedPdfParams {
  signedPdfBlob: Blob;
  entityType: SignedEntityType;
  entityId: string | number;
  entityVersion?: number;
  signerRole?: SignerRole;
  fileName: string;
  originalSha256Hash?: string;
}

export interface SignAndStoreWithAutoFirmaParams {
  pdfBuffer: ArrayBuffer;
  entityType: SignedEntityType;
  entityId: string | number;
  entityVersion?: number;
  signerRole?: SignerRole;
  fileName: string;
  options?: AutoFirmaSignOptions;
}

export interface SignAndStoreResult {
  record: SignedDocumentRecord;
  signedBlob: Blob;
}

/**
 * Servicio frontend para gestionar firmas electrónicas PAdES con AutoFirma
 * y su custodia inmutable en servidor (/api/pdf/signed).
 */
export const pdfSignatureService = {
  /**
   * Lista los documentos firmados custodiados para una entidad (contrato, DI, etc.).
   */
  async getSignedDocuments(
    entityType: SignedEntityType,
    entityId: string | number
  ): Promise<SignedDocumentRecord[]> {
    const params = new URLSearchParams({
      entityType,
      entityId: String(entityId),
    });

    const response = await fetch(`/api/pdf/signed?${params.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        errBody.error || 'No se pudo consultar el historial de firmas digitales.'
      );
    }

    const payload = await response.json();
    return Array.isArray(payload.documents) ? payload.documents : [];
  },

  /**
   * Sube un PDF ya firmado (PAdES) al servidor para verificación PKCS#7/X.509 y custodia inmutable.
   */
  async uploadSignedPdf(params: UploadSignedPdfParams): Promise<SignedDocumentRecord> {
    const safeFileName = sanitizePdfFileName(params.fileName);
    const formData = new FormData();
    formData.append('file', params.signedPdfBlob, safeFileName);
    formData.append('entityType', params.entityType);
    formData.append('entityId', String(params.entityId));
    formData.append('entityVersion', String(params.entityVersion ?? 1));
    if (params.signerRole) {
      formData.append('signerRole', params.signerRole);
    }
    formData.append('fileName', safeFileName);
    formData.append('signatureProvider', 'autofirma');

    if (params.originalSha256Hash) {
      formData.append('originalSha256Hash', params.originalSha256Hash);
    }

    const response = await fetch('/api/pdf/signed', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        payload.error || 'No se pudo verificar y custodiar el PDF firmado.'
      );
    }

    return payload.document as SignedDocumentRecord;
  },

  /**
   * Flujo completo: firma un PDF (nuevo o ya firmado para co-firma) con AutoFirma
   * y lo custodia de forma inmutable en el servidor.
   */
  async signAndStoreWithAutoFirma(
    params: SignAndStoreWithAutoFirmaParams
  ): Promise<SignAndStoreResult> {
    const [pdfBase64, originalSha256Hash] = await Promise.all([
      Promise.resolve(arrayBufferToBase64(params.pdfBuffer)),
      computeSha256Hex(params.pdfBuffer),
    ]);

    const signedBase64 = await signPdfWithAutoFirma(pdfBase64, params.options);
    const signedBlob = base64ToPdfBlob(signedBase64);

    const record = await this.uploadSignedPdf({
      signedPdfBlob: signedBlob,
      entityType: params.entityType,
      entityId: params.entityId,
      entityVersion: params.entityVersion,
      signerRole: params.signerRole,
      fileName: params.fileName,
      originalSha256Hash: originalSha256Hash || undefined,
    });

    return { record, signedBlob };
  },

  /**
   * Descarga el binario del PDF firmado custodiado como Blob.
   */
  async fetchSignedPdfBlob(signedDocumentId: string): Promise<Blob> {
    const response = await fetch(`/api/pdf/signed/${encodeURIComponent(signedDocumentId)}`, {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || 'No se pudo descargar el PDF firmado custodiado.');
    }

    return response.blob();
  },

  /**
   * Recupera el PDF firmado custodiado como ArrayBuffer (útil para co-firma secuencial).
   */
  async fetchSignedPdfArrayBuffer(signedDocumentId: string): Promise<ArrayBuffer> {
    const blob = await this.fetchSignedPdfBlob(signedDocumentId);
    return blob.arrayBuffer();
  },

  /**
   * Dispara la descarga en el navegador de un PDF firmado custodiado.
   */
  async downloadSignedDocument(signedDocumentId: string, fileName: string): Promise<void> {
    const blob = await this.fetchSignedPdfBlob(signedDocumentId);
    const safeName = sanitizePdfFileName(fileName);
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      URL.revokeObjectURL(url);
    }
  },
};

export default pdfSignatureService;

