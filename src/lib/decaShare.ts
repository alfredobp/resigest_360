// =====================================================
// DECA QUICK SHARE HELPERS
// Generación de mensajes y enlaces rápidos para compartir DeCA
// por WhatsApp, Email y Web Share API
// =====================================================

import type { DecaDocument } from '@/types/deca';

/**
 * Normaliza un teléfono español/internacional para enlaces wa.me/<digits>.
 * Si tiene 9 dígitos españoles (empieza por 6, 7, 8 o 9), añade prefijo 34.
 */
export function normalizeWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D+/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.length === 9 && /^[6789]/.test(digits)) {
    return `34${digits}`;
  }

  return digits.length >= 9 ? digits : null;
}

export type DecaSharePayload = Pick<
  DecaDocument,
  'numero_deca' | 'version' | 'matricula_tractora' | 'token'
> &
  Partial<
    Pick<
      DecaDocument,
      | 'matricula_remolque'
      | 'conductor_nombre'
      | 'origen_municipio'
      | 'destino_municipio'
      | 'fecha_transporte'
    >
  >;

/**
 * Construye el texto formateado listo para enviar por WhatsApp, Email o portapapeles.
 */
export function buildDecaShareMessage(
  doc: DecaSharePayload,
  originUrl: string
): string {
  const cleanOrigin = originUrl.replace(/\/+$/, '');
  const driverLink = `${cleanOrigin}/mobile/deca/${doc.token}`;
  const pdfLink = `${cleanOrigin}/api/deca/${doc.token}`;

  const vehicleInfo = doc.matricula_remolque
    ? `${doc.matricula_tractora} (Remolque: ${doc.matricula_remolque})`
    : doc.matricula_tractora;

  const lines = [
    `DeCA ${doc.numero_deca} (v${doc.version || 1})`,
    doc.fecha_transporte ? `Fecha: ${doc.fecha_transporte}` : null,
    doc.conductor_nombre ? `Conductor: ${doc.conductor_nombre}` : null,
    `Vehículo: ${vehicleInfo}`,
    doc.origen_municipio || doc.destino_municipio
      ? `Ruta: ${doc.origen_municipio || '-'} → ${doc.destino_municipio || '-'}`
      : null,
    '',
    `Vista móvil + QR conductor: ${driverLink}`,
    `PDF oficial inspección: ${pdfLink}`,
  ];

  return lines.filter((line): line is string => line !== null).join('\n');
}

/**
 * Genera enlace directo de WhatsApp (al número del conductor si está disponible).
 */
export function buildDecaWhatsAppUrl(
  doc: Parameters<typeof buildDecaShareMessage>[0],
  originUrl: string,
  phone?: string | null
): string {
  const text = encodeURIComponent(buildDecaShareMessage(doc, originUrl));
  const waPhone = normalizeWhatsAppPhone(phone);
  return waPhone ? `https://wa.me/${waPhone}?text=${text}` : `https://wa.me/?text=${text}`;
}

/**
 * Genera enlace mailto: con asunto y cuerpo precargados.
 */
export function buildDecaMailtoUrl(
  doc: Parameters<typeof buildDecaShareMessage>[0],
  originUrl: string,
  email?: string | null
): string {
  const to = email ? email.trim() : '';
  const subject = encodeURIComponent(
    `DeCA ${doc.numero_deca} (v${doc.version || 1}) - ${doc.matricula_tractora}`
  );
  const body = encodeURIComponent(buildDecaShareMessage(doc, originUrl));
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
