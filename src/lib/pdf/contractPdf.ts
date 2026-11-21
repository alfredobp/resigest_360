import jsPDF from 'jspdf';
import type { WasteContract, WasteContractRevision } from '@/types/wasteManagement';
import { PDF_COLORS, PDF_LAYOUT } from './pdfTheme';
import {
  applyDeterministicMetadata,
  drawDataTable,
  drawDocumentHeader,
  drawDraftWatermark,
  drawMetadataStrip,
  drawPageFooters,
  drawSectionHeader,
  drawSignatureBlocks,
  drawTwoColumnCards,
  ensurePageSpace,
  formatSafeDate,
  formatSafeDateTime,
  setDraw,
  setFill,
  setText,
  type CardRow,
  type TableColumn,
  type TableRow,
} from './pdfComponents';

export interface ContractPdfOptions {
  /** Prepara las cajas pendientes limpias para co-firma PAdES (sin texto "Pendiente" congelado). */
  padesMode?: boolean;
}

export async function generateContractPDF(
  contractInput: WasteContract,
  archivedRevision?: WasteContractRevision,
  options?: ContractPdfOptions
): Promise<jsPDF> {
  // UXDEV-02 / RES6-I02: Recuperación de revisión custodiada con snapshot congelado
  const contract: WasteContract = archivedRevision
    ? {
      ...contractInput,
      version: archivedRevision.version,
      cantidad_maxima_anual: archivedRevision.cantidad_maxima_anual ?? contractInput.cantidad_maxima_anual,
      unidad_cantidad: archivedRevision.unidad_cantidad ?? contractInput.unidad_cantidad,
      frecuencia_recogida: archivedRevision.frecuencia_recogida ?? contractInput.frecuencia_recogida,
      precio_unitario: archivedRevision.precio_unitario ?? contractInput.precio_unitario,
      moneda: archivedRevision.moneda ?? contractInput.moneda,
      fecha_inicio: archivedRevision.fecha_inicio ?? contractInput.fecha_inicio,
      fecha_fin: archivedRevision.fecha_fin ?? contractInput.fecha_fin,
      codigos_ler: archivedRevision.codigos_ler ?? contractInput.codigos_ler,
      operaciones_tratamiento: archivedRevision.operaciones_tratamiento ?? contractInput.operaciones_tratamiento,
      contract_waste_codes: archivedRevision.contract_waste_codes ?? contractInput.contract_waste_codes,
      firmado_productor: archivedRevision.firmado_productor ?? false,
      firma_productor_url: archivedRevision.firma_productor_url,
      fecha_firma_productor: archivedRevision.fecha_firma_productor,
      firmado_gestor: archivedRevision.firmado_gestor ?? false,
      firma_gestor_url: archivedRevision.firma_gestor_url,
      fecha_firma_gestor: archivedRevision.fecha_firma_gestor,
      documento_url: archivedRevision.documento_url,
      metadata_snapshot: archivedRevision.metadata_snapshot ?? contractInput.metadata_snapshot ?? null,
      estado:
        (archivedRevision.firmado_productor || Boolean(archivedRevision.firma_productor_url)) &&
          (archivedRevision.firmado_gestor || Boolean(archivedRevision.firma_gestor_url))
          ? 'vigente'
          : contractInput.estado,
    }
    : contractInput;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;
  const contentW = pageWidth - marginX * 2;

  // UXDEV-02 / UXDEV-05: Metadatos forenses deterministas (/CreationDate, /ModDate, /ID)
  const deterministicDateIso =
    contract.metadata_snapshot?.snapshot_date ||
    contract.fecha_firma_gestor ||
    contract.fecha_firma_productor ||
    (contract.fecha_contrato ? `${contract.fecha_contrato.split('T')[0]}T00:00:00Z` : '2026-01-01T00:00:00Z');

  applyDeterministicMetadata(doc, {
    title: `Contrato_${contract.numero_contrato || contract.id}_v${contract.version || 1}`,
    subject: `Contrato de Tratamiento RD 553/2020 (v${contract.version || 1})`,
    creator: 'RESIGEST 360',
    createdIso: deterministicDateIso,
    updatedIso: deterministicDateIso,
    fileIdSeed:
      contract.metadata_snapshot?.pdf_hash ||
      `${contract.id || 0}${contract.numero_contrato || 'CT'}v${contract.version || 1}${deterministicDateIso}`,
  });

  const estado = (contract.estado || 'borrador').toUpperCase();
  const refValue = contract.numero_contrato || `#${contract.id}`;

  // --- CABECERA EJECUTIVA ---
  let yPos = drawDocumentHeader(doc, {
    title: 'CONTRATO DE TRATAMIENTO DE RESIDUOS',
    subtitle: 'Formalización de obligaciones según Art. 5 del Real Decreto 553/2020',
    refLabel: 'REFERENCIA CONTRATO',
    refValue,
    versionText: `v${contract.version || 1}`,
    statusText: estado,
  });

  // --- TIRA DE METADATOS ---
  const vigenciaText =
    contract.fecha_inicio || contract.fecha_fin
      ? `${formatSafeDate(contract.fecha_inicio)} – ${formatSafeDate(contract.fecha_fin)}`
      : 'No especificada';
  const maxAnualText = contract.cantidad_maxima_anual
    ? `${contract.cantidad_maxima_anual} ${contract.unidad_cantidad || 't'}/año`
    : 'Sin límite';

  yPos = drawMetadataStrip(
    doc,
    [
      { label: 'Fecha Emisión', value: formatSafeDate(contract.fecha_contrato) },
      { label: 'Vigencia', value: vigenciaText },
      { label: 'Modalidad', value: (contract.tipo_contrato || 'tratamiento').toUpperCase() },
      { label: 'Máximo Anual', value: maxAnualText, highlight: true },
    ],
    yPos
  );

  // --- 1. PARTES INTERVINIENTES (2 COLUMNAS PARALELAS) ---
  // RES6-I02: Priorizar snapshot congelado frente a datos vivos
  const producerData = contract.metadata_snapshot?.company || contract.company;
  const producerCenterData = contract.metadata_snapshot?.producer_center || contract.producer_center;
  const gestorData = contract.metadata_snapshot?.gestor_company || contract.treatment_manager || contract.gestor_company;
  const gestorCenterData = contract.metadata_snapshot?.gestor_center || contract.gestor_center;

  yPos = drawSectionHeader(doc, '1. Partes Intervinientes', yPos);

  const producerRows: CardRow[] = producerData
    ? [
      { label: 'Razón Social', value: producerData.razon_social || '-', boldValue: true },
      { label: 'CIF / NIF', value: producerData.cif || '-' },
      { label: 'NIMA', value: producerData.nima || '-' },
      {
        label: 'Domicilio',
        value: [producerData.domicilio_social, producerData.municipio_social].filter(Boolean).join(', ') || '-',
      },
      ...(producerCenterData
        ? [{ label: 'Centro Origen', value: `${producerCenterData.nombre} (NIMA: ${producerCenterData.nima || '-'})` }]
        : []),
    ]
    : [];

  const gestorRows: CardRow[] = [];
  if (gestorData) {
    gestorRows.push(
      { label: 'Razón Social', value: gestorData.razon_social || '-', boldValue: true },
      { label: 'CIF / NIF', value: gestorData.cif || '-' },
      { label: 'NIMA', value: gestorData.nima || '-' }
    );
    if ('numero_autorizacion' in gestorData && gestorData.numero_autorizacion) {
      gestorRows.push({ label: 'Nº Autoriz.', value: gestorData.numero_autorizacion });
    } else if ('numero_inscripcion' in gestorData && gestorData.numero_inscripcion) {
      gestorRows.push({ label: 'Nº Inscrip.', value: gestorData.numero_inscripcion });
    }
    const address =
      ('direccion' in gestorData ? gestorData.direccion : '') ||
      ('domicilio_social' in gestorData ? gestorData.domicilio_social : '');
    const muni =
      ('municipio' in gestorData ? gestorData.municipio : '') ||
      ('municipio_social' in gestorData ? gestorData.municipio_social : '');
    gestorRows.push({
      label: 'Domicilio',
      value: [address, muni].filter(Boolean).join(', ') || '-',
    });
    if (gestorCenterData) {
      gestorRows.push({
        label: 'Instalación',
        value: `${gestorCenterData.nombre} (NIMA: ${gestorCenterData.nima || '-'})`,
      });
    }
  }

  yPos = drawTwoColumnCards(
    doc,
    {
      title: 'Productor / Cliente (Origen)',
      rows: producerRows,
      emptyMessage: 'Datos del productor no asociados en este contrato.',
    },
    {
      title: 'Gestor Autorizado (Destino)',
      rows: gestorRows,
      emptyMessage: 'Gestor autorizado no asignado en este contrato.',
    },
    yPos,
    22
  );

  // --- 2. RESIDUOS OBJETO DEL CONTRATO (MATRIZ LER Y OPERACIONES) ---
  yPos = ensurePageSpace(doc, yPos, 24);
  yPos = drawSectionHeader(doc, '2. Residuos Objeto del Contrato (Matriz LER y Operaciones)', yPos);

  const wasteCodesList = contract.contract_waste_codes || [];
  const simpleLerCodes = contract.codigos_ler || [];

  if (wasteCodesList.length > 0) {
    const columns: TableColumn[] = [
      { header: 'Código LER', width: 28, align: 'left' },
      { header: 'Descripción del Residuo', width: 78, align: 'left' },
      { header: 'Op.', width: 18, align: 'center' },
      { header: 'Cant. Est.', width: 28, align: 'right' },
      { header: 'Tarifa', width: 28, align: 'right' },
    ];

    const rows: TableRow[] = wasteCodesList.map((item) => {
      const isPeligroso = item.codigo_ler.includes('*');
      const cantText =
        item.cantidad_estimada_anual !== undefined && item.cantidad_estimada_anual !== null
          ? `${item.cantidad_estimada_anual} t/año`
          : '-';
      const precioText =
        item.tarifa_gestion !== undefined && item.tarifa_gestion !== null ? `${item.tarifa_gestion} €/t` : '-';

      return {
        cells: [
          {
            text: isPeligroso ? `${item.codigo_ler} (RP)` : item.codigo_ler,
            bold: true,
            color: isPeligroso ? PDF_COLORS.danger : PDF_COLORS.inkPrimary,
          },
          { text: item.descripcion_ler || 'Sin descripción', color: PDF_COLORS.inkSecondary },
          { text: item.operacion_tratamiento || '-', bold: true, color: PDF_COLORS.brandPrimary },
          { text: cantText },
          { text: precioText, bold: true },
        ],
      };
    });

    yPos = drawDataTable(doc, columns, rows, yPos);
  } else if (simpleLerCodes.length > 0) {
    const columns: TableColumn[] = [
      { header: 'Código LER', width: 38, align: 'left' },
      { header: 'Operación Asignada', width: 42, align: 'center' },
      { header: 'Descripción / Especificación', width: 100, align: 'left' },
    ];
    const rows: TableRow[] = simpleLerCodes.map((code, index) => {
      const op = contract.operaciones_tratamiento?.[index] || contract.operaciones_tratamiento?.[0] || 'R/D según DI';
      const isPeligroso = code.includes('*');
      return {
        cells: [
          {
            text: isPeligroso ? `${code} (RP)` : code,
            bold: true,
            color: isPeligroso ? PDF_COLORS.danger : PDF_COLORS.inkPrimary,
          },
          { text: op, bold: true, color: PDF_COLORS.brandPrimary },
          { text: contract.descripcion_residuos || 'Según autorización de gestor', color: PDF_COLORS.inkSecondary },
        ],
      };
    });
    yPos = drawDataTable(doc, columns, rows, yPos);
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    setText(doc, PDF_COLORS.inkMuted);
    const emptyText = doc.splitTextToSize(
      contract.descripcion_residuos || 'Residuos autorizados según Anexo Técnico o Documentos de Identificación (DIs) vinculados.',
      contentW - 4
    ) as string[];
    doc.text(emptyText, marginX + 2, yPos + 2);
    yPos += emptyText.length * 4 + 5;
  }

  if (wasteCodesList.length > 0 && contract.descripcion_residuos) {
    const descLines = doc.splitTextToSize(contract.descripcion_residuos, contentW - 8) as string[];
    const boxH = descLines.length * 3.6 + 8;
    yPos = ensurePageSpace(doc, yPos, boxH + 4);
    setFill(doc, PDF_COLORS.surfaceMuted);
    setDraw(doc, PDF_COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, yPos, contentW, boxH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    setText(doc, PDF_COLORS.inkPrimary);
    doc.text('Especificaciones técnicas adicionales:', marginX + 3.5, yPos + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setText(doc, PDF_COLORS.inkSecondary);
    doc.text(descLines, marginX + 3.5, yPos + 8.8);
    yPos += boxH + 4;
  }

  // --- 3. CONDICIONES TÉCNICAS, ACEPTACIÓN Y RECHAZO (ART. 5 RD 553/2020) ---
  const precioText = contract.precio_unitario
    ? `${contract.precio_unitario} ${contract.moneda || 'EUR'}`
    : 'Según matriz de residuos o tarifas vigentes en báscula';
  const periodicidadStr =
    contract.frecuencia_recogida || 'Según necesidades operativas de producción y límites legales de almacenamiento';

  const condParagraphs: Array<{ label: string; body: string }> = [
    { label: 'Precio general / referencia:', body: precioText },
    { label: 'Periodicidad estimada de traslados:', body: periodicidadStr },
    {
      label: 'Condiciones de aceptación:',
      body: 'Conformidad estricta del residuo entregado con el código LER contratado, ausencia de impropios no autorizados, envasado y etiquetado reglamentario vigente y verificación de peso neto en báscula calibrada de destino.',
    },
    {
      label: 'Obligaciones en caso de rechazo (Art. 5.h y Arts. 6 y 7 RD 553/2020):',
      body: 'En caso de disconformidad en la recepción, el gestor comunicará motivadamente el rechazo al operador del traslado y al productor en un plazo máximo de 30 días naturales desde la recepción del residuo, acordando su devolución a la instalación de origen o el traslado a otra instalación de tratamiento autorizada a costa del operador del traslado.',
    },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const measuredBlocks = condParagraphs.map((p) => {
    const lines = doc.splitTextToSize(`${p.label} ${p.body}`, contentW - 8) as string[];
    return { ...p, lines };
  });
  const condBoxH = measuredBlocks.reduce((acc, b) => acc + b.lines.length * 3.6 + 2.2, 5);

  yPos = ensurePageSpace(doc, yPos, condBoxH + 14);
  yPos = drawSectionHeader(doc, '3. Condiciones Técnicas, Aceptación y Rechazo (Art. 5 RD 553/2020)', yPos);

  setFill(doc, PDF_COLORS.surfaceMuted);
  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, yPos, contentW, condBoxH, 2, 2, 'FD');

  let innerY = yPos + 5;
  for (const block of measuredBlocks) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setText(doc, PDF_COLORS.inkPrimary);
    doc.text(block.label, marginX + 4, innerY);
    const labelW = doc.getTextWidth(`${block.label} `);

    doc.setFont('helvetica', 'normal');
    setText(doc, PDF_COLORS.inkSecondary);
    if (labelW < contentW - 40) {
      const firstLineMax = contentW - 8 - labelW;
      const bodyLines = doc.splitTextToSize(block.body, contentW - 8) as string[];
      if (bodyLines.length === 1 && doc.getTextWidth(block.body) <= firstLineMax) {
        doc.text(block.body, marginX + 4 + labelW, innerY);
        innerY += 4.6;
        continue;
      }
    }
    const wrappedBody = doc.splitTextToSize(block.body, contentW - 8) as string[];
    doc.text(wrappedBody, marginX + 4, innerY + 3.6);
    innerY += wrappedBody.length * 3.5 + 4.8;
  }
  yPos = Math.max(yPos + condBoxH, innerY) + 4;

  // --- CLÁUSULAS ADICIONALES / NOTAS ---
  let sectionNum = 4;
  if (contract.notas) {
    const noteLines = doc.splitTextToSize(contract.notas, contentW - 8) as string[];
    const noteH = noteLines.length * 3.8 + 7;
    yPos = ensurePageSpace(doc, yPos, Math.min(noteH, 32) + 12);
    yPos = drawSectionHeader(doc, `${sectionNum}. Cláusulas Adicionales / Notas`, yPos);
    sectionNum += 1;

    setFill(doc, PDF_COLORS.white);
    setDraw(doc, PDF_COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, yPos, contentW, noteH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.8);
    setText(doc, PDF_COLORS.inkSecondary);
    doc.text(noteLines, marginX + 4, yPos + 5);
    yPos += noteH + 4.5;
  }

  // --- FIRMAS ---
  yPos = ensurePageSpace(doc, yPos, 46);
  yPos = drawSectionHeader(doc, `${sectionNum}. Formalización y Firmas Digitales`, yPos);

  const producerSigned =
    (contract.firmado_productor || Boolean(contract.firma_productor_url)) &&
    (Boolean(contract.firma_productor_url) || Boolean(contract.fecha_firma_productor));
  const gestorSigned =
    (contract.firmado_gestor || Boolean(contract.firma_gestor_url)) &&
    (Boolean(contract.firma_gestor_url) || Boolean(contract.fecha_firma_gestor));

  const padesMode = Boolean(options?.padesMode);

  await drawSignatureBlocks(
    doc,
    [
      {
        roleKey: 'productor',
        roleTitle: 'Por el Productor',
        imageUrl: contract.firma_productor_url,
        isSigned: producerSigned,
        hidePendingPlaceholder: padesMode,
        neutralStatus: padesMode,
        statusLabel: producerSigned
          ? 'Firmado digitalmente'
          : padesMode
            ? 'Firma electrónica (PAdES)'
            : 'Pendiente de firma',
        timestamp: contract.fecha_firma_productor ? `Fecha: ${formatSafeDateTime(contract.fecha_firma_productor)}` : undefined,
      },
      {
        roleKey: 'gestor',
        roleTitle: 'Por el Gestor Autorizado',
        imageUrl: contract.firma_gestor_url,
        isSigned: gestorSigned,
        hidePendingPlaceholder: padesMode,
        neutralStatus: padesMode,
        statusLabel: gestorSigned
          ? 'Firmado digitalmente'
          : padesMode
            ? 'Firma electrónica (PAdES)'
            : 'Pendiente de firma',
        timestamp: contract.fecha_firma_gestor ? `Fecha: ${formatSafeDateTime(contract.fecha_firma_gestor)}` : undefined,
      },
    ],
    yPos
  );

  // --- PIE DE PÁGINA ---
  // RES6-I07: Distinguir contrato formalizado vs borrador sin validez vinculante
  const isFirmado =
    ((contract.firmado_productor || Boolean(contract.firma_productor_url)) &&
      (contract.firmado_gestor || Boolean(contract.firma_gestor_url))) ||
    contract.estado === 'vigente';

  const footerText = isFirmado
    ? 'Este documento tiene validez contractual según el RD 553/2020 de traslado de residuos.'
    : padesMode
      ? 'Documento para formalización electrónica (RD 553/2020). Validez contractual vinculada a las firmas electrónicas incorporadas.'
      : 'Documento provisional / en tramitación sin validez contractual vinculante hasta su formalización por ambas partes.';

  drawPageFooters(doc, { legalText: footerText });

  if (contract.estado === 'borrador') {
    drawDraftWatermark(doc, 'BORRADOR - NO OFICIAL');
  }

  return doc;
}
