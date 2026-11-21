import jsPDF from 'jspdf';
import type { CommercialOperation } from '@/types/wasteManagement';
import { PDF_COLORS, PDF_LAYOUT } from './pdfTheme';
import {
  applyDeterministicMetadata,
  drawDataTable,
  drawDocumentHeader,
  drawDraftWatermark,
  drawKpiCards,
  drawMetadataStrip,
  drawPageFooters,
  drawSectionHeader,
  drawTwoColumnCards,
  ensurePageSpace,
  formatSafeDate,
  setDraw,
  setFill,
  setText,
  type TableColumn,
  type TableRow,
} from './pdfComponents';

export async function generateCommercialOperationPDF(op: CommercialOperation): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;
  const contentW = pageWidth - marginX * 2;

  // UXDEV-05 / UXDEV-12: Metadatos forenses deterministas (/CreationDate y /ModDate)
  const docDateIso = op.updated_at || op.created_at || `${op.fecha}T00:00:00Z`;
  applyDeterministicMetadata(doc, {
    title: `Liquidacion_${op.numero_operacion}`,
    subject: `Operación comercial ${op.numero_operacion} (${op.estado.toUpperCase()})`,
    creator: 'RESIGEST 360',
    createdIso: docDateIso,
    updatedIso: docDateIso,
  });

  const isProvisional = op.estado === 'borrador' || op.estado === 'abierta' || op.estado === 'en_transito';

  // --- CABECERA EJECUTIVA ---
  let yPos = drawDocumentHeader(doc, {
    title: isProvisional ? 'LIQUIDACIÓN PROVISIONAL DE OPERACIÓN COMERCIAL' : 'LIQUIDACIÓN DE OPERACIÓN COMERCIAL',
    subtitle: isProvisional
      ? 'Documento económico de intermediación · PROVISIONAL (NO ES FACTURA)'
      : 'Documento económico de intermediación · Arts. 23-24 Ley 7/2022',
    refLabel: 'OPERACIÓN COMERCIAL',
    refValue: op.numero_operacion,
    versionText: isProvisional ? 'PROVISIONAL' : undefined,
    statusText: op.estado.toUpperCase(),
    statusTone: isProvisional ? 'warning' : 'success',
  });

  const ton = (op.cantidad_real_t && op.cantidad_real_t > 0 ? op.cantidad_real_t : op.cantidad_estimada_t) || 0;

  yPos = drawMetadataStrip(
    doc,
    [
      { label: 'Fecha Operación', value: formatSafeDate(op.fecha) },
      { label: 'Código LER', value: op.codigo_ler || '-' },
      { label: 'Toneladas Totales', value: `${ton.toFixed(3)} t ${op.cantidad_real_t ? '(Báscula)' : '(Est.)'}`, highlight: true },
      { label: 'Documento DI', value: op.identification_document_id ? `DI #${op.identification_document_id}` : 'No vinculado' },
    ],
    yPos
  );

  // --- 1. TRAZABILIDAD FÍSICA Y AMBIENTAL ---
  yPos = drawSectionHeader(doc, '1. Trazabilidad Física y Ambiental del Residuo', yPos);
  yPos = drawTwoColumnCards(
    doc,
    {
      title: 'Origen y Residuo',
      rows: [
        {
          label: 'Productor',
          value: op.origen_nombre_personalizado || op.origen_productor?.razon_social || '-',
          boldValue: true,
        },
        { label: 'Residuo', value: `${op.codigo_ler} - ${op.descripcion_residuo || '-'}` },
        { label: 'Peso', value: `${ton.toFixed(3)} t ${op.cantidad_real_t ? '(Verificado en báscula)' : '(Estimado)'}` },
      ],
    },
    {
      title: 'Destino y Transporte',
      rows: [
        {
          label: 'Gestor',
          value: op.destino_nombre_personalizado || op.destino_gestor?.razon_social || '-',
          boldValue: true,
        },
        { label: 'Transportista', value: op.transportista_nombre_personalizado || op.transportista?.razon_social || '-' },
        { label: 'Matrícula', value: op.transportista_matricula || '-' },
      ],
    },
    yPos,
    22
  );

  // --- 2. LIQUIDACIÓN ECONÓMICA (TABLA FINANCIERA) ---
  yPos = drawSectionHeader(doc, '2. Liquidación Económica de Intermediación', yPos);

  const columns: TableColumn[] = [
    { header: 'Concepto', width: 58, align: 'left' },
    { header: 'Contraparte / Detalle', width: 84, align: 'left' },
    { header: 'Importe', width: 38, align: 'right' },
  ];

  const rows: TableRow[] = [
    {
      cells: [
        { text: 'Ingreso Venta (Cliente)', bold: true },
        { text: op.cliente_razon_social || op.cliente_comercial?.razon_social || '-', color: PDF_COLORS.inkSecondary },
        { text: `+ ${(op.ingreso_venta_total || 0).toFixed(2)} €`, bold: true, color: PDF_COLORS.brandPrimary },
      ],
    },
    {
      cells: [
        { text: 'Coste Compra (Proveedor)', bold: true },
        { text: op.proveedor_razon_social || op.proveedor_comercial?.razon_social || '-', color: PDF_COLORS.inkSecondary },
        { text: `- ${(op.coste_compra_total || 0).toFixed(2)} €`, bold: true, color: PDF_COLORS.danger },
      ],
    },
    {
      cells: [
        { text: 'Coste de Transporte (Flete)', bold: true },
        {
          text: op.transportista_nombre_personalizado || op.transportista?.razon_social || '-',
          color: PDF_COLORS.inkSecondary,
        },
        { text: `- ${(op.coste_transporte || 0).toFixed(2)} €`, bold: true, color: PDF_COLORS.danger },
      ],
    },
  ];

  if (op.otros_costes > 0) {
    rows.push({
      cells: [
        { text: 'Otros Costes Accesorios', bold: true },
        { text: op.descripcion_otros_costes || 'Tasas / Cánones', color: PDF_COLORS.inkSecondary },
        { text: `- ${(op.otros_costes || 0).toFixed(2)} €`, bold: true, color: PDF_COLORS.danger },
      ],
    });
  }

  yPos = drawDataTable(doc, columns, rows, yPos);

  // --- 3. RESULTADO Y MARGEN NETO ---
  const esPositivo = (op.margen_bruto_total || 0) >= 0;
  const margenColor = esPositivo ? PDF_COLORS.brandPrimary : PDF_COLORS.danger;

  yPos = drawSectionHeader(doc, '3. Resultado y Rentabilidad de la Operación', yPos);
  yPos = drawKpiCards(
    doc,
    [
      {
        label: 'Margen Bruto Resultante',
        value: `${(op.margen_bruto_total || 0).toFixed(2)} €`,
        subtext: esPositivo ? 'Resultado positivo' : 'Resultado negativo',
        accentColor: margenColor,
        valueColor: margenColor,
      },
      {
        label: 'Margen Unitario',
        value: `${(op.margen_unitario_tonelada || 0).toFixed(2)} €/t`,
        subtext: 'Por tonelada gestionada',
        accentColor: PDF_COLORS.inkPrimary,
      },
      {
        label: 'Rentabilidad sobre Venta',
        value: `${(op.porcentaje_margen || 0).toFixed(1)}%`,
        subtext: 'Margen porcentual neto',
        accentColor: margenColor,
        valueColor: margenColor,
      },
    ],
    yPos
  );

  // --- OBSERVACIONES ---
  if (op.observaciones) {
    const obsLines = doc.splitTextToSize(op.observaciones, contentW - 8) as string[];
    const obsH = obsLines.length * 3.8 + 8;
    yPos = ensurePageSpace(doc, yPos, obsH + 10);
    yPos = drawSectionHeader(doc, '4. Observaciones y Condiciones Particulares', yPos);

    setFill(doc, PDF_COLORS.surfaceMuted);
    setDraw(doc, PDF_COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, yPos, contentW, obsH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    setText(doc, PDF_COLORS.inkSecondary);
    doc.text(obsLines, marginX + 4, yPos + 5.2);
  }

  // --- PIE DE PÁGINA (UXDEV-12) ---
  drawPageFooters(doc, {
    legalText:
      'Documento económico de intermediación (Arts. 23-24 Ley 7/2022). NO constituye factura fiscal ni certifica el tratamiento ambiental (RD 553/2020).',
    secondaryLine: `Estado documental: ${op.estado.toUpperCase()}${isProvisional ? ' — Operación abierta/provisional (NO ES FACTURA)' : ''
      } · Generado por RESIGEST 360 el ${formatSafeDate(docDateIso)}.`,
  });

  if (op.estado === 'borrador') {
    drawDraftWatermark(doc, 'PROVISIONAL - BORRADOR');
  }

  return doc;
}
