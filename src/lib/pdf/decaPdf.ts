import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { DecaDocument } from '@/types/deca';
import { PDF_COLORS, PDF_LAYOUT } from './pdfTheme';
import {
  applyDeterministicMetadata,
  drawDocumentHeader,
  drawMetadataStrip,
  drawPageFooters,
  drawSectionHeader,
  drawTwoColumnCards,
  ensurePageSpace,
  formatSafeDate,
  formatSafeDateTime,
  setDraw,
  setFill,
  setText,
} from './pdfComponents';

export interface DecaPdfOptions {
  /** Marca temporal ISO real de la versión v1 original (INC12: evita sobrescribir la hora histórica de v1 con la de v2). */
  firstVersionCreatedAt?: string | null;
}

export async function generateDecaPDF(
  deca: DecaDocument,
  inspectionUrl: string,
  options?: DecaPdfOptions
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // RES6-I08 / D05 / N05: Metadatos forenses deterministas (/CreationDate y /ModDate)
  const deterministicCreatedIso =
    deca.created_at || (deca.fecha_transporte ? `${deca.fecha_transporte}T08:00:00Z` : '2026-01-01T08:00:00Z');
  const deterministicUpdatedIso = deca.updated_at || deterministicCreatedIso;

  applyDeterministicMetadata(doc, {
    title: `DeCA ${deca.numero_deca || ''} v${deca.version || 1}`,
    subject: 'Documento Electrónico de Control y Acompañamiento (DeCA) - RD 553/2020',
    author: deca.transportista_razon_social || 'ResiGest 360',
    creator: 'ResiGest 360 Medio Ambiente',
    createdIso: deterministicCreatedIso,
    updatedIso: deterministicUpdatedIso,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;
  const contentW = pageWidth - marginX * 2;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(inspectionUrl, {
      margin: 1,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('Error generando QR para DeCA:', err);
  }

  // --- CABECERA EJECUTIVA CON QR DE INSPECCIÓN ---
  let yPos = drawDocumentHeader(doc, {
    title: 'DOCUMENTO ELECTRÓNICO DE CONTROL ADMINISTRATIVO (DeCA)',
    subtitle: 'Transporte de Mercancías por Carretera · Orden FOM/2861/2012, Ley 9/2025 y Res. 5 junio 2026',
    refLabel: 'Nº DECA',
    refValue: deca.numero_deca || 'DECA-BORRADOR',
    versionText: `v${deca.version || 1} (${deca.is_vigente ? 'Vigente' : 'Histórica'})`,
    statusText: (deca.estado || 'VIGENTE').toUpperCase(),
    statusTone: deca.is_vigente === false ? 'warning' : undefined,
    qrDataUrl,
    qrCaption: 'INSPECCIÓN EN RUTA',
  });

  // --- TIRA DE METADATOS ---
  yPos = drawMetadataStrip(
    doc,
    [
      { label: 'Fecha Transporte', value: formatSafeDate(deca.fecha_transporte) },
      { label: 'Versión Documental', value: deca.is_vigente ? `v${deca.version} (Vigente)` : `v${deca.version} (Histórica)` },
      { label: 'Doc. Identificación (DI)', value: deca.numero_di || 'N/A', highlight: Boolean(deca.numero_di) },
      { label: 'Notificación Traslado (NT)', value: deca.numero_nt || 'No aplica' },
    ],
    yPos
  );

  // --- 1. PARTES INTERVINIENTES ---
  yPos = drawSectionHeader(doc, '1. Partes Intervinientes en el Contrato de Transporte', yPos);
  yPos = drawTwoColumnCards(
    doc,
    {
      title: 'Cargador Contractual',
      rows: [
        { label: 'Razón Social', value: deca.cargador_razon_social || '-', boldValue: true },
        { label: 'NIF / CIF', value: deca.cargador_nif || '-' },
        { label: 'Domicilio', value: deca.cargador_domicilio || '-' },
        {
          label: 'Población',
          value:
            [
              deca.cargador_codigo_postal,
              deca.cargador_municipio,
              deca.cargador_provincia ? `(${deca.cargador_provincia})` : '',
            ]
              .filter(Boolean)
              .join(' ') || '-',
        },
      ],
    },
    {
      title: 'Transportista Efectivo',
      rows: [
        { label: 'Razón Social', value: deca.transportista_razon_social || '-', boldValue: true },
        { label: 'NIF / CIF', value: deca.transportista_nif || '-' },
        { label: 'Autorización', value: deca.transportista_autorizacion || deca.transportista_nima || 'Inscrito en registro' },
        {
          label: 'Domicilio',
          value: [deca.transportista_domicilio, deca.transportista_municipio].filter(Boolean).join(', ') || '-',
        },
      ],
    },
    yPos,
    22
  );

  // --- 2. PUNTOS DE CARGA Y ENTREGA ---
  yPos = drawSectionHeader(doc, '2. Puntos de Carga (Origen) y Entrega (Destino)', yPos);
  yPos = drawTwoColumnCards(
    doc,
    {
      title: 'Lugar de Origen (Carga)',
      rows: [
        { label: 'Dirección', value: deca.origen_direccion || '-' },
        { label: 'Municipio', value: `${deca.origen_municipio || '-'} (${deca.origen_provincia || '-'})` },
        ...(deca.origen_nima ? [{ label: 'NIMA', value: deca.origen_nima }] : []),
      ],
    },
    {
      title: 'Lugar de Destino (Entrega)',
      rows: [
        { label: 'Dirección', value: deca.destino_direccion || '-' },
        { label: 'Municipio', value: `${deca.destino_municipio || '-'} (${deca.destino_provincia || '-'})` },
        ...(deca.destino_nima ? [{ label: 'NIMA', value: deca.destino_nima }] : []),
      ],
    },
    yPos,
    20
  );

  // --- 3. MERCANCÍA Y VEHÍCULO (2 COLUMNAS) ---
  yPos = drawSectionHeader(doc, '3. Mercancía Transportada y Datos Operativos', yPos);
  yPos = drawTwoColumnCards(
    doc,
    {
      title: 'Mercancía y Cantidad',
      rows: [
        { label: 'Naturaleza', value: deca.naturaleza_mercancia || 'Mercancía de transporte general', boldValue: true },
        {
          label: 'Peso',
          value: deca.peso_kg ? `${deca.peso_kg.toLocaleString('es-ES')} kg` : deca.magnitud_alternativa || 'No determinado',
        },
        {
          label: 'Código LER',
          value: deca.codigo_ler ? `${deca.codigo_ler}${deca.descripcion_ler ? ` - ${deca.descripcion_ler}` : ''}` : 'No aplica',
        },
      ],
    },
    {
      title: 'Vehículo y Conductor',
      rows: [
        { label: 'Tractora', value: deca.matricula_tractora || 'PENDIENTE', boldValue: true },
        { label: 'Remolque', value: deca.matricula_remolque || 'No lleva / No consta' },
        { label: 'Conductor', value: deca.conductor_nombre || 'Conductor de la empresa transportista' },
        { label: 'DNI / Aut.', value: deca.conductor_dni || deca.autorizacion_especial || '-' },
        { label: 'Horario', value: `${deca.hora_salida || 'Antes de inicio'} – ${deca.hora_cierre || 'En curso'}` },
      ],
    },
    yPos,
    20
  );

  // --- 4. OBSERVACIONES Y RESERVAS ---
  const obsText = deca.observaciones_reservas || 'Sin observaciones ni reservas consignadas al inicio del transporte.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  const obsLines = doc.splitTextToSize(obsText, contentW - 8) as string[];
  const obsH = Math.max(14, obsLines.length * 3.8 + 7);

  yPos = ensurePageSpace(doc, yPos, obsH + 12);
  yPos = drawSectionHeader(doc, '4. Observaciones y Reservas de las Partes', yPos);

  setFill(doc, PDF_COLORS.surfaceMuted);
  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, yPos, contentW, obsH, 1.8, 1.8, 'FD');

  setText(doc, PDF_COLORS.inkSecondary);
  doc.text(obsLines, marginX + 4, yPos + 5.2);

  // --- PIE DE PÁGINA NORMATIVO (INC12: conservar hora real de v1 sin sobrescribirla con v2) ---
  const footerDateLabel =
    deca.version > 1
      ? options?.firstVersionCreatedAt
        ? `v1: ${formatSafeDateTime(options.firstVersionCreatedAt)} | v${deca.version}: ${formatSafeDateTime(deterministicCreatedIso)}`
        : `v${deca.version} emitida: ${formatSafeDateTime(deterministicCreatedIso)} | Mod.: ${formatSafeDateTime(deterministicUpdatedIso)}`
      : `Emitido: ${formatSafeDateTime(deterministicCreatedIso)}`;

  drawPageFooters(doc, {
    legalText:
      'Documento Electrónico de Control Administrativo (DeCA). Válido para inspección en carretera conforme a la Orden FOM/2861/2012 y Resolución de 5 de junio de 2026. Custodia legal mínima: 1 año.',
    secondaryLine: `URL de comprobación: ${inspectionUrl}`,
    rightText: footerDateLabel,
  });

  return doc;
}

