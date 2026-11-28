// =====================================================
// DOCUMENT SEQUENCE SERVICE
// Numeración consecutiva, coherente por empresa y año
// para Contratos, DI (E3L 3.3) y NT (E3L 3.3)
// =====================================================

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export type SequentialDocumentType = 'contract' | 'di' | 'nt';

export interface PreviewCodeOptions {
  year?: number;
  cif?: string | null;
  nima?: string | null;
}

const VALID_NIMA_REGEX = /^(0[1-9]|[1-4][0-9]|5[0-2])\d{8}$/;

/**
 * Normaliza el identificador de empresa (CIF o fallback EMP{id}) para códigos de contrato.
 */
export function normalizeCompanyCodeTag(
  cif?: string | null,
  companyId?: number | null
): string {
  const cleaned = String(cif || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (cleaned.length > 0) {
    return cleaned;
  }

  return `EMP${companyId ?? 0}`;
}

/**
 * Resuelve el par (origen, NIMA) conforme a E3L 3.3 (SIRA / eSIR).
 */
export function resolveE3LNimaParts(nima?: string | null): {
  origin: '01' | '10';
  validNima: string;
} {
  const digits = String(nima || '').replace(/\D/g, '');
  if (VALID_NIMA_REGEX.test(digits)) {
    return { origin: '10', validNima: digits };
  }
  return { origin: '01', validNima: '9999999999' };
}

/**
 * Construye el código de Contrato coherente con la empresa:
 * CT-{CIF}-{AÑO}-{CORRELATIVO 6 dígitos}
 */
export function buildContractCode(
  cifOrTag: string | null | undefined,
  year: number = new Date().getFullYear(),
  seq = 1,
  companyId?: number | null
): string {
  const tag = normalizeCompanyCodeTag(cifOrTag, companyId);
  const safeSeq = Math.max(1, Math.floor(Number(seq) || 1));
  return `CT-${tag}-${year}-${String(safeSeq).padStart(6, '0')}`;
}

/**
 * Construye el código de Documento de Identificación (DI) conforme a E3L 3.3 (26 caracteres):
 * DCS + origen (2) + NIMA (10) + año (4) + correlativo (7)
 */
export function buildDICode(
  nima: string | null | undefined,
  year: number = new Date().getFullYear(),
  seq = 1
): string {
  const { origin, validNima } = resolveE3LNimaParts(nima);
  const safeSeq = Math.max(1, Math.floor(Number(seq) || 1));
  return `DCS${origin}${validNima}${year}${String(safeSeq).padStart(7, '0')}`;
}

/**
 * Construye el código de Notificación Previa (NT) conforme a E3L 3.3 (25 caracteres):
 * NT + origen (2) + NIMA (10) + año (4) + correlativo (7)
 */
export function buildNTCode(
  nima: string | null | undefined,
  year: number = new Date().getFullYear(),
  seq = 1
): string {
  const { origin, validNima } = resolveE3LNimaParts(nima);
  const safeSeq = Math.max(1, Math.floor(Number(seq) || 1));
  return `NT${origin}${validNima}${year}${String(safeSeq).padStart(7, '0')}`;
}

/**
 * Extrae el año natural a partir de una fecha ISO/YYYY-MM-DD con fallback al año actual.
 */
export function resolveDocumentYear(dateStr?: string | null): number {
  if (dateStr) {
    const match = String(dateStr).trim().match(/^(\d{4})/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 2000 && parsed <= 2100) {
        return parsed;
      }
    }
  }
  return new Date().getFullYear();
}

export const documentSequenceService = {
  normalizeCompanyCodeTag,
  resolveE3LNimaParts,
  buildContractCode,
  buildDICode,
  buildNTCode,
  resolveDocumentYear,

  /**
   * Obtiene una vista previa del próximo código consecutivo para la empresa y año indicados
   * SIN incrementar el contador en base de datos (el incremento atómico ocurre en el INSERT).
   */
  async previewNextCode(
    companyId: number,
    docType: SequentialDocumentType,
    options: PreviewCodeOptions = {}
  ): Promise<string> {
    if (!companyId || companyId <= 0) {
      throw new Error('Se requiere un companyId válido para previsualizar el código.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const year = options.year ?? new Date().getFullYear();

    try {
      const { data, error } = await supabase.rpc('preview_company_document_code', {
        p_company_id: companyId,
        p_doc_type: docType,
        p_year: year,
        p_nima: options.nima || null,
      });

      if (!error && typeof data === 'string' && data.trim().length > 0) {
        return data.trim();
      }
    } catch {
      // Fallback defensivo si la RPC aún no está desplegada en el entorno remoto
    }

    if (docType === 'contract') {
      return buildContractCode(options.cif, year, 1, companyId);
    }
    if (docType === 'di') {
      return buildDICode(options.nima, year, 1);
    }
    return buildNTCode(options.nima, year, 1);
  },
};

export default documentSequenceService;

