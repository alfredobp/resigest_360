import crypto from 'crypto';
import forge from 'node-forge';
import { MAX_SIGNED_PDF_BYTES } from '@/lib/validations/digitalSignature';

export class InvalidPadesSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPadesSignatureError';
  }
}

export interface PadesInspectionResult {
  sha256Hash: string;
  fileSizeBytes: number;
  signatureCount: number;
  signatureLevel: 'PAdES-BES' | 'PAdES-T';
  signerCn: string;
  signerNif: string | null;
  issuerCn: string;
  certificateSerial: string;
  certificateValidFrom: string | null;
  certificateValidTo: string | null;
}

interface ExtractedSignatureBlock {
  byteRange: [number, number, number, number];
  contentsHex: string;
}

const BYTE_RANGE_REGEX =
  /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g;

const NIF_OID = '2.5.4.5'; // serialNumber OID usado por FNMT / eIDAS para NIF/CIF

/**
 * Extrae el valor de un atributo de un Distinguished Name de X.509.
 */
function getAttrValue(
  attrs: Array<{ shortName?: string; type?: string; value?: unknown }>,
  shortName: string,
  oid?: string
): string | null {
  const found = attrs.find(
    (attr) =>
      (attr.shortName && attr.shortName.toUpperCase() === shortName.toUpperCase()) ||
      (oid && attr.type === oid)
  );
  if (!found || found.value === undefined || found.value === null) {
    return null;
  }
  const str = String(found.value).trim();
  return str.length > 0 ? str : null;
}

/**
 * Extrae el NIF/CIF español de los atributos del certificado X.509 (formato FNMT / eIDAS).
 */
export function extractSpanishNifFromCertificate(cert: forge.pki.Certificate): string | null {
  const attrs = cert.subject.attributes as Array<{
    shortName?: string;
    type?: string;
    value?: unknown;
  }>;

  const serialAttr = getAttrValue(attrs, 'serialNumber', NIF_OID);
  if (serialAttr) {
    // Formato eIDAS habitual: "IDCES-12345678Z" o "VATES-B12345678"
    const cleaned = serialAttr.replace(/^(IDCES|VATES|NIF|CIF)[-:\s]*/i, '').trim().toUpperCase();
    if (cleaned) return cleaned;
  }

  // Fallback: algunos certificados FNMT incluyen "- NIF 12345678Z" en el CN
  const cn = getAttrValue(attrs, 'CN');
  if (cn) {
    const match = cn.match(/\b([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J])\b/i);
    if (match) return match[1].toUpperCase();
  }

  return null;
}

/**
 * Localiza todos los bloques /ByteRange y sus /Contents <hex> dentro del PDF.
 */
function extractSignatureBlocks(pdfBuffer: Buffer): ExtractedSignatureBlock[] {
  const latin1 = pdfBuffer.toString('latin1');
  const blocks: ExtractedSignatureBlock[] = [];
  let match: RegExpExecArray | null;

  BYTE_RANGE_REGEX.lastIndex = 0;
  while ((match = BYTE_RANGE_REGEX.exec(latin1)) !== null) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    const c = Number(match[3]);
    const d = Number(match[4]);

    if (
      !Number.isInteger(a) ||
      !Number.isInteger(b) ||
      !Number.isInteger(c) ||
      !Number.isInteger(d) ||
      a !== 0 ||
      b <= 0 ||
      c <= b ||
      d <= 0 ||
      c + d > pdfBuffer.length
    ) {
      throw new InvalidPadesSignatureError(
        'El rango de bytes (/ByteRange) de la firma PDF no es válido o está manipulado.'
      );
    }

    // El bloque /Contents <...> se encuentra exactamente entre b y c
    const gapSlice = latin1.slice(b, c);
    const hexMatch = gapSlice.match(/<([0-9a-fA-F\s]+)>/);
    if (!hexMatch) {
      throw new InvalidPadesSignatureError(
        'No se encontró el contenedor criptográfico /Contents asociado al ByteRange.'
      );
    }

    const cleanedHex = hexMatch[1].replace(/\s+/g, '');
    if (cleanedHex.length < 32) {
      throw new InvalidPadesSignatureError(
        'El contenedor PKCS#7 /Contents está vacío o incompleto.'
      );
    }

    blocks.push({
      byteRange: [a, b, c, d],
      contentsHex: cleanedHex,
    });
  }

  return blocks;
}

/**
 * Elimina el relleno de ceros (0x00) al final del buffer DER de un PKCS#7 embebido en PDF.
 */
function trimTrailingZeroPadding(rawBytes: Buffer): Buffer {
  let end = rawBytes.length;
  while (end > 0 && rawBytes[end - 1] === 0) {
    end--;
  }
  return rawBytes.subarray(0, end);
}

/**
 * Selecciona el certificado de usuario final (firmante) dentro de una cadena PKCS#7,
 * priorizando el que no es CA o coincide con el primer elemento no emisor.
 */
function pickSignerCertificate(certs: forge.pki.Certificate[]): forge.pki.Certificate {
  if (certs.length === 1) {
    return certs[0];
  }

  const endEntity = certs.find((cert) => {
    const bc = cert.getExtension('basicConstraints') as { cA?: boolean } | null;
    return !bc || !bc.cA;
  });

  return endEntity ?? certs[0];
}

/**
 * Inspecciona un PDF firmado (generado por AutoFirma u otro firmante PAdES),
 * valida la presencia e integridad estructural de la firma PKCS#7/CMS y extrae
 * los metadatos fiables del certificado X.509 firmante.
 */
export function inspectSignedPdf(pdfBuffer: Buffer): PadesInspectionResult {
  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new InvalidPadesSignatureError('El documento PDF firmado está vacío.');
  }

  if (pdfBuffer.length > MAX_SIGNED_PDF_BYTES) {
    throw new InvalidPadesSignatureError(
      `El PDF firmado excede el tamaño máximo permitido (${Math.round(MAX_SIGNED_PDF_BYTES / (1024 * 1024))} MB).`
    );
  }

  const header = pdfBuffer.subarray(0, 5).toString('latin1');
  if (header !== '%PDF-') {
    throw new InvalidPadesSignatureError('El archivo proporcionado no es un documento PDF válido.');
  }

  const blocks = extractSignatureBlocks(pdfBuffer);
  if (blocks.length === 0) {
    throw new InvalidPadesSignatureError(
      'El PDF no contiene ninguna firma electrónica PAdES (/ByteRange).'
    );
  }

  // Verificar que la última firma cubre hasta el final del PDF (sin bytes añadidos tras firmar)
  const latestBlock = blocks[blocks.length - 1];
  const [, , c, d] = latestBlock.byteRange;
  const trailingBytes = pdfBuffer.length - (c + d);
  if (trailingBytes > 2) {
    throw new InvalidPadesSignatureError(
      'El PDF contiene datos añadidos después de la última firma digital.'
    );
  }

  // Decodificar el bloque PKCS#7 / CMS
  let pkcs7Message: forge.pkcs7.PkcsSignedData;
  try {
    const rawDer = trimTrailingZeroPadding(Buffer.from(latestBlock.contentsHex, 'hex'));
    const asn1 = forge.asn1.fromDer(forge.util.createBuffer(rawDer.toString('binary')));
    pkcs7Message = forge.pkcs7.messageFromAsn1(asn1) as forge.pkcs7.PkcsSignedData;
  } catch {
    throw new InvalidPadesSignatureError(
      'El bloque criptográfico CMS/PKCS#7 del PDF está corrupto o no es estándar.'
    );
  }

  const certificates = pkcs7Message.certificates ?? [];
  if (certificates.length === 0) {
    throw new InvalidPadesSignatureError(
      'La firma PKCS#7 no incluye el certificado X.509 del firmante.'
    );
  }

  const signerCert = pickSignerCertificate(certificates);
  const subjectAttrs = signerCert.subject.attributes as Array<{
    shortName?: string;
    type?: string;
    value?: unknown;
  }>;
  const issuerAttrs = signerCert.issuer.attributes as Array<{
    shortName?: string;
    type?: string;
    value?: unknown;
  }>;

  const signerCn =
    getAttrValue(subjectAttrs, 'CN') ||
    getAttrValue(subjectAttrs, 'O') ||
    'Titular desconocido';
  const issuerCn =
    getAttrValue(issuerAttrs, 'CN') ||
    getAttrValue(issuerAttrs, 'O') ||
    'Emisor desconocido';
  const signerNif = extractSpanishNifFromCertificate(signerCert);

  // Detectar presencia de TimeStampToken (OID 1.2.840.113549.1.9.16.2.14) para PAdES-T
  const hasTimestamp = latestBlock.contentsHex
    .toLowerCase()
    .includes('2a864886f70d010910020e');

  const sha256Hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

  return {
    sha256Hash,
    fileSizeBytes: pdfBuffer.length,
    signatureCount: blocks.length,
    signatureLevel: hasTimestamp ? 'PAdES-T' : 'PAdES-BES',
    signerCn,
    signerNif,
    issuerCn,
    certificateSerial: signerCert.serialNumber || 'N/A',
    certificateValidFrom: signerCert.validity?.notBefore
      ? signerCert.validity.notBefore.toISOString()
      : null,
    certificateValidTo: signerCert.validity?.notAfter
      ? signerCert.validity.notAfter.toISOString()
      : null,
  };
}

