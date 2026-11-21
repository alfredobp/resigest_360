import { z } from 'zod';

export const SIGNED_ENTITY_TYPES = [
  'contract',
  'di',
  'deca',
  'memoria_anual',
  'commercial_operation',
] as const;

export type SignedEntityType = (typeof SIGNED_ENTITY_TYPES)[number];

export const SIGNATURE_PROVIDERS = ['autofirma'] as const;
export type SignatureProvider = (typeof SIGNATURE_PROVIDERS)[number];

export const MAX_SIGNED_PDF_BYTES = 15 * 1024 * 1024; // 15 MB

export const signedDocumentUploadSchema = z.object({
  entityType: z.enum(SIGNED_ENTITY_TYPES),
  entityId: z
    .string()
    .trim()
    .min(1, 'El identificador de la entidad es obligatorio')
    .max(64, 'Identificador de entidad demasiado largo'),
  entityVersion: z.coerce.number().int().min(1).max(999).default(1),
  fileName: z
    .string()
    .trim()
    .min(1, 'El nombre del archivo es obligatorio')
    .max(200, 'Nombre de archivo demasiado largo')
    .refine((val) => val.toLowerCase().endsWith('.pdf'), {
      message: 'El archivo firmado debe tener extensión .pdf',
    }),
  originalSha256Hash: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i, 'El hash SHA-256 original debe tener 64 caracteres hexadecimales')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v.toLowerCase() : undefined)),
  signatureProvider: z.enum(SIGNATURE_PROVIDERS).default('autofirma'),
});

export type SignedDocumentUploadInput = z.infer<typeof signedDocumentUploadSchema>;

export const autoFirmaOptionsSchema = z.object({
  includeVisualStamp: z.boolean().default(true),
  stampPage: z.number().int().default(-1), // -1 = última página en AutoFirma
  reason: z.string().trim().max(180).optional(),
  location: z.string().trim().max(120).optional(),
  isCoSign: z.boolean().default(false),
  signatureSlotIndex: z.number().int().min(0).max(5).default(0),
});

export type AutoFirmaSignOptions = z.input<typeof autoFirmaOptionsSchema>;

export interface SignedDocumentRecord {
  id: string;
  user_id: string;
  company_id: number;
  entity_type: SignedEntityType;
  entity_id: string;
  entity_version: number;
  storage_path: string;
  file_name: string;
  file_size_bytes: number;
  sha256_hash: string;
  original_sha256_hash?: string | null;
  signature_level: string;
  signature_provider: SignatureProvider;
  signature_count: number;
  signer_cn: string;
  signer_nif?: string | null;
  issuer_cn: string;
  certificate_serial: string;
  certificate_valid_to?: string | null;
  signed_at: string;
  created_at: string;
}

/**
 * Sanitiza un valor para incluirlo de forma segura en extraParams de AutoFirma
 * (formato clave=valor separado por saltos de línea).
 */
export function sanitizeExtraParamValue(value: string): string {
  return value.replace(/[\r\n=]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Construye el bloque `extraParams` para AutoFirma (PAdES-BES / ETSI.CAdES.detached).
 * Incluye opcionalmente sello visual en la última página sin solapar co-firmas.
 */
export function buildAutoFirmaExtraParams(rawOptions?: AutoFirmaSignOptions): string {
  const opts = autoFirmaOptionsSchema.parse(rawOptions ?? {});
  const lines: string[] = [
    'format=PAdES',
    'signatureSubFilter=ETSI.CAdES.detached',
    'certificationLevel=0',
  ];

  if (opts.reason) {
    lines.push(`signatureReason=${sanitizeExtraParamValue(opts.reason)}`);
  }
  if (opts.location) {
    lines.push(`signatureProductionCity=${sanitizeExtraParamValue(opts.location)}`);
  }

  if (opts.includeVisualStamp) {
    // Desplazamiento horizontal/vertical para que las co-firmas no se pisen entre sí
    const slot = opts.signatureSlotIndex;
    const col = slot % 2;
    const row = Math.floor(slot / 2);

    const llx = col === 0 ? 36 : 310;
    const urx = col === 0 ? 285 : 559;
    const lly = 24 + row * 48;
    const ury = lly + 40;

    lines.push(`signaturePage=${opts.stampPage}`);
    lines.push(`signaturePositionOnPageLowerLeftX=${llx}`);
    lines.push(`signaturePositionOnPageLowerLeftY=${lly}`);
    lines.push(`signaturePositionOnPageUpperRightX=${urx}`);
    lines.push(`signaturePositionOnPageUpperRightY=${ury}`);
    lines.push('layer2FontFamily=1');
    lines.push('layer2FontSize=8');
    lines.push(
      'layer2Text=Firmado digitalmente por $$SUBJECTCN$$\\nFecha: $$SIGNDATE=dd/MM/yyyy HH:mm:ss$$'
    );
  }

  return lines.join('\n');
}

/**
 * Sanitiza el nombre del archivo PDF antes de almacenarlo en Storage.
 */
export function sanitizePdfFileName(fileName: string): string {
  const base = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  if (!base.toLowerCase().endsWith('.pdf')) {
    return `${base}.pdf`;
  }
  return base;
}

