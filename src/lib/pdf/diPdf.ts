import jsPDF from 'jspdf';
import type { IdentificationDocument } from '@/types/wasteManagement';
import { CAUSA_DISCREPANCIA_LABELS } from '@/lib/validations/discrepancyJustification';
import { PDF_COLORS, PDF_LAYOUT } from './pdfTheme';
import {
  applyDeterministicMetadata,
  drawDocumentHeader,
  drawDraftWatermark,
  drawKpiCards,
  drawMetadataStrip,
  drawPageFooters,
  drawSectionHeader,
  drawSignatureBlocks,
  drawStatusBadge,
  drawTwoColumnCards,
  ensurePageSpace,
  fitText,
  formatSafeDate,
  formatSafeDateTime,
  setDraw,
  setFill,
  setText,
  type CardRow,
} from './pdfComponents';

interface WasteTypeFallback {
  codigo_ler?: string;
  descripcion?: string;
  estado?: string;
}

export interface DiPdfOptions {
  /** Prepara las cajas pendientes limpias para co-firma PAdES (sin texto "Pendiente" congelado). */
  padesMode?: boolean;
}

export async function generateIdentificationDocumentPDF(
  docData: IdentificationDocument,
  options?: DiPdfOptions
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // UXDEV-05: Metadatos forenses deterministas (/CreationDate y /ModDate)
  const deterministicCreatedIso =
    docData.created_at || (docData.fecha_documento ? `${docData.fecha_documento}T08:00:00Z` : '2026-01-01T08:00:00Z');
  const deterministicUpdatedIso = docData.updated_at || deterministicCreatedIso;

  applyDeterministicMetadata(doc, {
    title: `DI ${docData.numero_documento || ''}`,
    subject: 'Documento de Identificación (DI) de Traslado de Residuos - RD 553/2020',
    author: docData.productor_razon_social || 'ResiGest 360',
    creator: 'ResiGest 360 Medio Ambiente',
    createdIso: deterministicCreatedIso,
    updatedIso: deterministicUpdatedIso,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;
  const contentW = pageWidth - marginX * 2;
  const estadoLabel = (docData.estado_traslado || docData.estado || 'BORRADOR').toUpperCase();

  // --- CABECERA EJECUTIVA ---
  let yPos = drawDocumentHeader(doc, {
    title: 'DOCUMENTO DE IDENTIFICACIÓN (DI)',
    subtitle: 'Control y seguimiento de traslados en el interior del territorio del Estado · Real Decreto 553/2020',
    refLabel: 'Nº IDENTIFICACIÓN (DI)',
    refValue: docData.numero_documento || 'DI-BORRADOR',
    versionText: docData.numero_notificacion ? `NT: ${docData.numero_notificacion}` : undefined,
    statusText: estadoLabel,
  });

  // --- TIRA DE METADATOS ---
  const tipoTraslado =
    docData.tipo_notificacion === 'con-notificacion-previa' ? 'Con Notificación Previa (NT)' : 'Sin Notificación Previa';

  // INC13: Derivar la relación contractual real sin inventar "Asociado" cuando falta contrato
  const contractRef = docData.contrato_externo_referencia
    ? docData.contrato_externo_referencia
    : docData.contract_id
      ? `CTR #${docData.contract_id}`
      : 'Sin contrato';

  const metadataItems = [
    { label: 'Fecha Traslado', value: formatSafeDate(docData.fecha_documento) },
    { label: 'Régimen de Traslado', value: tipoTraslado },
    { label: 'Nº Albarán Gestor', value: docData.numero_albaran_gestor || 'Pendiente' },
    {
      label: 'Contrato de Tratamiento',
      value: contractRef,
      highlight: Boolean(docData.contrato_externo_referencia || docData.contract_id),
    },
    ...(docData.numero_notificacion
      ? [{ label: 'Notificación Previa (NT)', value: docData.numero_notificacion, highlight: true }]
      : []),
  ];

  yPos = drawMetadataStrip(doc, metadataItems, yPos);

  // Operador del traslado si es distinto del productor
  if (
    docData.operador_razon_social &&
    docData.operador_razon_social.trim().toLowerCase() !== (docData.productor_razon_social || '').trim().toLowerCase()
  ) {
    const opH = 9.5;
    setFill(doc, PDF_COLORS.brandLight);
    setDraw(doc, PDF_COLORS.brandBorder);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, yPos, contentW, opH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    setText(doc, PDF_COLORS.brandDark);
    doc.text('OPERADOR DEL TRASLADO:', marginX + 3.5, yPos + 5.8);

    doc.setFont('helvetica', 'normal');
    setText(doc, PDF_COLORS.inkPrimary);
    const opInfo = [
      docData.operador_razon_social,
      docData.operador_cif ? `CIF: ${docData.operador_cif}` : null,
      docData.operador_nima ? `NIMA: ${docData.operador_nima}` : null,
      docData.operador_tipo ? `(${docData.operador_tipo.toUpperCase()})` : null,
    ]
      .filter(Boolean)
      .join('  ·  ');
    doc.text(fitText(doc, opInfo, contentW - 48), marginX + 42, yPos + 5.8);
    yPos += opH + 3.5;
  }

  // --- 1. ORIGEN (PRODUCTOR) Y DESTINO (GESTOR) EN 2 COLUMNAS ---
  yPos = drawSectionHeader(doc, '1. Origen (Productor) y Destino (Gestor Autorizado)', yPos);

  const productorDir = [
    docData.productor_direccion,
    [docData.productor_municipio, docData.productor_provincia ? `(${docData.productor_provincia})` : '']
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const gestorDir = [
    docData.gestor_direccion,
    [docData.gestor_municipio, docData.gestor_provincia ? `(${docData.gestor_provincia})` : '']
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const prodRows: CardRow[] = [
    { label: 'Razón Social', value: docData.productor_razon_social || '-', boldValue: true },
    { label: 'NIF / CIF', value: docData.productor_cif || '-' },
    { label: 'NIMA Origen', value: docData.productor_nima || '-' },
    ...(docData.production_center?.nombre ? [{ label: 'Centro', value: docData.production_center.nombre }] : []),
    { label: 'Domicilio', value: productorDir || '-' },
  ];

  const gestorRows: CardRow[] = [
    { label: 'Razón Social', value: docData.gestor_razon_social || '-', boldValue: true },
    { label: 'NIF / CIF', value: docData.gestor_cif || '-' },
    { label: 'NIMA Destino', value: docData.gestor_nima || '-' },
    { label: 'Nº Autoriz.', value: docData.gestor_numero_autorizacion || '-' },
    { label: 'Domicilio', value: gestorDir || '-' },
  ];

  yPos = drawTwoColumnCards(
    doc,
    { title: 'Productor / Centro de Origen', rows: prodRows },
    { title: 'Gestor / Instalación de Tratamiento', rows: gestorRows },
    yPos,
    22
  );

  // --- 2. TRANSPORTISTA DEL TRASLADO ---
  yPos = ensurePageSpace(doc, yPos, 24);
  yPos = drawSectionHeader(doc, '2. Transportista del Traslado', yPos);

  yPos = drawMetadataStrip(
    doc,
    [
      { label: 'Razón Social', value: docData.transportista_razon_social || 'Transporte propio / No asignado' },
      {
        label: 'NIF / NIMA',
        value: [docData.transportista_cif || '-', docData.transportista_nima].filter(Boolean).join(' · '),
      },
      { label: 'Matrícula', value: docData.transportista_matricula || '-' },
      { label: 'Fecha / Hora Salida', value: docData.fecha_salida ? formatSafeDateTime(docData.fecha_salida) : 'No registrada' },
    ],
    yPos
  );

  // --- 3. CARACTERIZACIÓN DEL RESIDUO ---
  const wasteTypeObj = (docData as IdentificationDocument & { waste_type?: WasteTypeFallback }).waste_type;
  const lerCode = docData.codigo_ler || wasteTypeObj?.codigo_ler || 'Sin código LER';
  const isPeligroso = docData.peligrosidad === 'peligroso' || lerCode.includes('*');
  const descText = docData.descripcion_residuo || wasteTypeObj?.descripcion || '-';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  const descLines = doc.splitTextToSize(`Descripción: ${descText}`, contentW - 8) as string[];
  const resCardH = 16 + descLines.length * 3.8 + 4;

  yPos = ensurePageSpace(doc, yPos, resCardH + 12);
  yPos = drawSectionHeader(doc, '3. Caracterización del Residuo Trasladado', yPos);

  setFill(doc, PDF_COLORS.white);
  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, yPos, contentW, resCardH, 2, 2, 'FD');

  // Fila superior: LER + badge peligrosidad + estado físico/envases
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setText(doc, isPeligroso ? PDF_COLORS.danger : PDF_COLORS.brandDark);
  doc.text(`LER ${lerCode}`, marginX + 4, yPos + 6.5);

  drawStatusBadge(
    doc,
    isPeligroso ? 'RESIDUO PELIGROSO' : 'NO PELIGROSO',
    marginX + 68,
    yPos + 2.6,
    isPeligroso ? 'danger' : 'success'
  );

  const estadoFisico = docData.estado_fisico || wasteTypeObj?.estado || '-';
  const envasesInfo =
    docData.numero_envases || docData.tipo_envases
      ? `${docData.numero_envases || '-'} (${docData.tipo_envases || 'bultos'})`
      : 'A granel / No especificado';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  setText(doc, PDF_COLORS.inkSecondary);
  doc.text(
    fitText(doc, `Estado físico: ${estadoFisico}  ·  Envases: ${envasesInfo}`, contentW - 76),
    pageWidth - marginX - 4,
    yPos + 6.2,
    { align: 'right' }
  );

  setDraw(doc, PDF_COLORS.surfaceSubtle);
  doc.line(marginX + 4, yPos + 9.2, pageWidth - marginX - 4, yPos + 9.2);

  // Descripción
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  setText(doc, PDF_COLORS.inkPrimary);
  doc.text(descLines, marginX + 4, yPos + 13.5);

  // Operaciones de tratamiento
  const opY = yPos + 13.5 + descLines.length * 3.8 + 1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  setText(doc, PDF_COLORS.inkMuted);
  doc.text('Operación prevista:', marginX + 4, opY);
  setText(doc, PDF_COLORS.brandPrimary);
  doc.text(docData.operacion_tratamiento || 'Según contrato / autorización', marginX + 33, opY);

  if (docData.operacion_tratamiento_ejecutada) {
    setText(doc, PDF_COLORS.inkMuted);
    doc.text('Operación ejecutada:', marginX + 95, opY);
    setText(doc, PDF_COLORS.inkPrimary);
    doc.text(docData.operacion_tratamiento_ejecutada, marginX + 126, opY);
  }

  yPos += resCardH + 4.5;

  // --- 4. CONTROL DE PESAJE Y DICTAMEN DE RECEPCIÓN ---
  yPos = ensurePageSpace(doc, yPos, 30);
  yPos = drawSectionHeader(doc, '4. Control de Pesaje en Báscula y Dictamen de Recepción', yPos);

  const pesoOrigenText = docData.peso_origen_kg ? `${docData.peso_origen_kg} kg` : `${docData.cantidad} ${docData.unidad}`;
  const pesoDestinoText = docData.peso_destino_kg ? `${docData.peso_destino_kg} kg` : 'Pendiente en báscula';
  const dictamen = (docData.resultado_recepcion || 'Conforme pendiente').toUpperCase();
  const hasDiscrepancia = docData.diferencia_peso_kg !== undefined && docData.diferencia_peso_kg !== null;
  const discText = hasDiscrepancia
    ? `${(docData.diferencia_peso_kg || 0) > 0 ? '+' : ''}${docData.diferencia_peso_kg} kg (${docData.porcentaje_discrepancia || 0}%)`
    : dictamen;

  yPos = drawKpiCards(
    doc,
    [
      {
        label: 'Peso Declarado Origen',
        value: pesoOrigenText,
        subtext: 'Declaración en salida',
        accentColor: PDF_COLORS.inkMuted,
      },
      {
        label: 'Peso Neto en Destino',
        value: pesoDestinoText,
        subtext: docData.fecha_llegada_destino
          ? `Llegada: ${formatSafeDateTime(docData.fecha_llegada_destino)}`
          : 'Pendiente de pesaje',
        accentColor: PDF_COLORS.brandPrimary,
      },
      {
        label: hasDiscrepancia ? 'Discrepancia / Dictamen' : 'Dictamen de Recepción',
        value: discText,
        subtext: hasDiscrepancia ? `Dictamen: ${dictamen}` : 'Control de recepción',
        accentColor: docData.motivo_incidencia ? PDF_COLORS.danger : PDF_COLORS.brandPrimary,
        valueColor: docData.motivo_incidencia ? PDF_COLORS.danger : PDF_COLORS.inkPrimary,
      },
    ],
    yPos
  );

  // Caja de incidencia / rechazo si existe
  if (docData.motivo_incidencia) {
    const motivoText = `${docData.tipo_incidencia ? `${docData.tipo_incidencia}: ` : ''}${docData.motivo_incidencia}`;
    const motivoLines = doc.splitTextToSize(motivoText, contentW - 8) as string[];
    const boxH = motivoLines.length * 3.6 + 8;
    yPos = ensurePageSpace(doc, yPos, boxH + 4);

    setFill(doc, PDF_COLORS.dangerBg);
    setDraw(doc, PDF_COLORS.dangerBorder);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, yPos, contentW, boxH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    setText(doc, PDF_COLORS.danger);
    doc.text('INCIDENCIA / RECHAZO EN RECEPCIÓN:', marginX + 3.5, yPos + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setText(doc, PDF_COLORS.inkPrimary);
    doc.text(motivoLines, marginX + 3.5, yPos + 8.8);
    yPos += boxH + 3.5;
  }

  // Caja de justificación de discrepancia si existe
  if (docData.justificacion_discrepancia) {
    const causaLabel = docData.causa_discrepancia
      ? CAUSA_DISCREPANCIA_LABELS[docData.causa_discrepancia] || docData.causa_discrepancia
      : 'Sin causa tipificada';
    const justLines = doc.splitTextToSize(`${causaLabel}: ${docData.justificacion_discrepancia}`, contentW - 8) as string[];
    const autoria = [
      docData.justificacion_discrepancia_by_nombre,
      docData.justificacion_discrepancia_at ? formatSafeDateTime(docData.justificacion_discrepancia_at) : null,
    ]
      .filter(Boolean)
      .join(' · ');
    const boxH = justLines.length * 3.6 + (autoria ? 11.5 : 8);
    yPos = ensurePageSpace(doc, yPos, boxH + 4);

    setFill(doc, PDF_COLORS.warningBg);
    setDraw(doc, PDF_COLORS.warningBorder);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, yPos, contentW, boxH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    setText(doc, PDF_COLORS.warning);
    doc.text('JUSTIFICACIÓN DE DISCREPANCIA DE BÁSCULA:', marginX + 3.5, yPos + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setText(doc, PDF_COLORS.inkPrimary);
    doc.text(justLines, marginX + 3.5, yPos + 8.8);

    if (autoria) {
      doc.setFontSize(6.6);
      setText(doc, PDF_COLORS.inkMuted);
      doc.text(`Registrada por: ${autoria}`, marginX + 3.5, yPos + 8.8 + justLines.length * 3.6 + 1);
    }
    yPos += boxH + 3.5;
  }

  // --- 5. FIRMAS DE LOS INTERVINIENTES (3 COLUMNAS) ---
  yPos = ensurePageSpace(doc, yPos, 46);
  yPos = drawSectionHeader(doc, '5. Conformidad y Firmas de los Intervinientes', yPos);

  const formatSigner = (name?: string | null, dni?: string | null): string | undefined => {
    if (!name && !dni) return undefined;
    return [name, dni ? `(${dni})` : null].filter(Boolean).join(' ');
  };

  const padesMode = Boolean(options?.padesMode);

  // INC01: Separar conformidad interna, firma gráfica capturada y firma electrónica PAdES.
  // Nunca declarar "Firmado digitalmente (PAdES)" en un PDF generado sin firma criptográfica incrustada.
  const showProducerSignedFooter =
    Boolean(docData.firmado_productor) && (!padesMode || Boolean(docData.firma_productor_url));
  const showTransportistaSignedFooter =
    Boolean(docData.firmado_transportista) && (!padesMode || Boolean(docData.firma_transportista_url));
  const showGestorSignedFooter =
    Boolean(docData.firmado_gestor) && (!padesMode || Boolean(docData.firma_gestor_url));

  await drawSignatureBlocks(
    doc,
    [
      {
        roleKey: 'productor',
        roleTitle: 'El Productor / Remitente',
        imageUrl: docData.firma_productor_url,
        isSigned: showProducerSignedFooter,
        hidePendingPlaceholder: padesMode,
        neutralStatus: padesMode,
        statusLabel: showProducerSignedFooter
          ? docData.firma_productor_url
            ? 'Firma gráfica en salida'
            : 'Conformidad interna en salida'
          : padesMode
            ? 'Espacio firma electrónica (PAdES)'
            : 'Pendiente de firma',
        signerDetails: showProducerSignedFooter
          ? formatSigner(docData.nombre_productor, docData.dni_productor)
          : undefined,
        timestamp:
          showProducerSignedFooter && docData.fecha_firma_productor
            ? formatSafeDateTime(docData.fecha_firma_productor)
            : undefined,
      },
      {
        roleKey: 'transportista',
        roleTitle: 'El Transportista',
        imageUrl: docData.firma_transportista_url,
        isSigned: showTransportistaSignedFooter,
        hidePendingPlaceholder: padesMode,
        neutralStatus: padesMode,
        statusLabel: showTransportistaSignedFooter
          ? docData.firma_transportista_url
            ? 'Firma gráfica en carga'
            : 'Conformidad interna en carga'
          : padesMode
            ? 'Espacio firma electrónica (PAdES)'
            : 'Pendiente de firma',
        signerDetails: showTransportistaSignedFooter
          ? formatSigner(docData.nombre_transportista, docData.dni_transportista)
          : undefined,
        timestamp:
          showTransportistaSignedFooter && docData.fecha_firma_transportista
            ? formatSafeDateTime(docData.fecha_firma_transportista)
            : undefined,
      },
      {
        roleKey: 'gestor',
        roleTitle: 'El Gestor Destinatario',
        imageUrl: docData.firma_gestor_url,
        isSigned: showGestorSignedFooter,
        hidePendingPlaceholder: padesMode,
        neutralStatus: padesMode,
        statusLabel: showGestorSignedFooter
          ? docData.firma_gestor_url
            ? 'Recepción con firma gráfica'
            : 'Recepción registrada en plataforma'
          : padesMode
            ? 'Espacio firma electrónica (PAdES)'
            : 'Pendiente de recepción',
        signerDetails: showGestorSignedFooter
          ? formatSigner(docData.nombre_gestor, docData.dni_gestor)
          : undefined,
        timestamp:
          showGestorSignedFooter && docData.fecha_firma_gestor
            ? formatSafeDateTime(docData.fecha_firma_gestor)
            : undefined,
      },
    ],
    yPos
  );

  // --- PIE DE PÁGINA Y MARCA DE AGUA BORRADOR (INC03 / UXDEV-12) ---
  // Usar estado_traslado como estado efectivo principal para evitar que un DI aceptado o en tránsito
  // herede la marca "BORRADOR - NO OFICIAL" de un campo legacy estado='borrador'.
  const effectiveStatus = (docData.estado_traslado || docData.estado || 'borrador').toLowerCase();
  const isDraft = effectiveStatus === 'borrador' || effectiveStatus === 'pendiente';
  const isFinalized =
    effectiveStatus === 'aceptado' || effectiveStatus === 'tratado' || effectiveStatus === 'finalizado';
  const isCompletelySigned = Boolean(docData.firmado_productor && docData.firmado_gestor);

  const legalText = isDraft
    ? 'COPIA DE BORRADOR (Real Decreto 553/2020). No válida como documento oficial de transporte ni control ambiental hasta inicio formal de traslado.'
    : isFinalized && isCompletelySigned
      ? 'Documento de control y seguimiento de traslados (art. 6 Real Decreto 553/2020). Recepción y conformidades registradas según sección 5.'
      : isFinalized
        ? 'Documento de traslado con recepción registrada (Real Decreto 553/2020). El alcance de conformidades y firmas consta en la sección 5.'
        : 'Documento de traslado en curso (Real Decreto 553/2020). Pendiente de recepción y formalización definitiva en destino.';

  drawPageFooters(doc, { legalText });

  if (isDraft) {
    drawDraftWatermark(doc, 'BORRADOR - NO OFICIAL');
  }

  return doc;
}

