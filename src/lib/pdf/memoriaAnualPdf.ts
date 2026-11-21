import jsPDF from 'jspdf';
import type { MemoriaAnual } from '@/types/wasteManagement';
import { PDF_COLORS, PDF_LAYOUT } from './pdfTheme';
import {
  applyDeterministicMetadata,
  drawDataTable,
  drawDocumentHeader,
  drawDraftWatermark,
  drawKpiCards,
  drawPageFooters,
  drawSectionHeader,
  drawTwoColumnCards,
  formatSafeDateTime,
  setText,
  type TableColumn,
  type TableRow,
} from './pdfComponents';

export async function generateMemoriaAnualPDF(memoria: MemoriaAnual): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginX = PDF_LAYOUT.marginX;

  const docDateIso = memoria.updated_at || memoria.created_at || `${memoria.año || 2026}-12-31T00:00:00Z`;
  applyDeterministicMetadata(doc, {
    title: `Memoria_Anual_${memoria.año}_${memoria.numero_memoria}`,
    subject: `Memoria Anual de Residuos Ley 7/2022 - Ejercicio ${memoria.año}`,
    author: memoria.nombre_empresa || 'ResiGest 360',
    creator: 'RESIGEST 360',
    createdIso: memoria.created_at || docDateIso,
    updatedIso: docDateIso,
  });

  const estado = (memoria.estado || 'borrador').toUpperCase();

  // --- CABECERA EJECUTIVA ---
  let yPos = drawDocumentHeader(doc, {
    title: 'MEMORIA ANUAL DE RESIDUOS',
    subtitle: `Art. 65 Ley 7/2022 · Ejercicio ${memoria.año} · Modalidad: ${memoria.tipo_memoria.toUpperCase()}`,
    refLabel: 'REFERENCIA MEMORIA',
    refValue: memoria.numero_memoria || `MEM-${memoria.año}`,
    versionText: `Año ${memoria.año}`,
    statusText: estado,
  });

  // --- 1. DATOS IDENTIFICATIVOS ---
  yPos = drawSectionHeader(doc, '1. Datos Identificativos de la Empresa y Centro', yPos);
  yPos = drawTwoColumnCards(
    doc,
    {
      title: 'Titular / Empresa',
      rows: [
        { label: 'Razón Social', value: memoria.nombre_empresa || '-', boldValue: true },
        { label: 'NIF / CIF', value: memoria.nif_empresa || '-' },
        { label: 'Modalidad', value: memoria.tipo_memoria.toUpperCase() },
      ],
    },
    {
      title: 'Instalación / Centro',
      rows: [
        { label: 'Instalación', value: memoria.nombre_centro || 'Sede Principal', boldValue: true },
        { label: 'NIMA', value: memoria.nima || '-' },
        { label: 'Municipio', value: memoria.municipio_centro || '-' },
      ],
    },
    yPos,
    22
  );

  const resumen = memoria.resumen_ler || [];
  // Priorizar la suma exacta de resumen_ler (precisión de 3 decimales / kg) para evitar
  // discrepancias si total_toneladas en BD fue redondeado a 2 decimales (ej. 0.002 t -> 0.00 t).
  const effectiveTotalTonnes =
    resumen.length > 0
      ? resumen.reduce((sum, item) => sum + (Number(item.cantidad_total) || 0), 0)
      : Number(memoria.total_toneladas) || 0;

  // --- KPIs RESUMEN ---
  yPos = drawKpiCards(
    doc,
    [
      {
        label: 'Total Movimientos / DIs',
        value: String(memoria.total_movimientos || 0),
        subtext: `Registros computados en ${memoria.año}`,
        accentColor: PDF_COLORS.brandPrimary,
        valueColor: PDF_COLORS.brandDark,
      },
      {
        label: 'Total Residuos Gestionados',
        value: `${effectiveTotalTonnes.toFixed(3)} t`,
        subtext: 'Peso total acumulado (toneladas)',
        accentColor: PDF_COLORS.inkPrimary,
        valueColor: PDF_COLORS.brandDark,
      },
    ],
    yPos
  );

  // --- 2. RESUMEN POR CÓDIGO LER ---
  yPos = drawSectionHeader(doc, '2. Balance Anual por Código LER', yPos);

  if (resumen.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.2);
    setText(doc, PDF_COLORS.inkMuted);
    doc.text('No hay registros de residuos computados en este ejercicio.', marginX + 2, yPos + 4);
  } else {
    const columns: TableColumn[] = [
      { header: 'Código LER', width: 28, align: 'left' },
      { header: 'Descripción del Residuo', width: 96, align: 'left' },
      { header: 'Movimientos', width: 26, align: 'right' },
      { header: 'Total (t)', width: 30, align: 'right' },
    ];

    const rows: TableRow[] = resumen.map((item) => {
      const isPeligroso = item.codigo_ler.includes('*');
      return {
        cells: [
          {
            text: isPeligroso ? `${item.codigo_ler} (RP)` : item.codigo_ler,
            bold: true,
            color: isPeligroso ? PDF_COLORS.danger : PDF_COLORS.inkPrimary,
          },
          { text: item.descripcion || 'Sin descripción', color: PDF_COLORS.inkSecondary },
          { text: String(item.numero_movimientos) },
          { text: `${(Number(item.cantidad_total) || 0).toFixed(3)} t`, bold: true },
        ],
      };
    });

    rows.push({
      isSummary: true,
      cells: [
        { text: 'TOTAL', bold: true },
        { text: `${resumen.length} ${resumen.length === 1 ? 'código LER declarado' : 'códigos LER declarados'}`, bold: true },
        { text: String(memoria.total_movimientos || 0), bold: true },
        { text: `${effectiveTotalTonnes.toFixed(3)} t`, bold: true },
      ],
    });

    drawDataTable(doc, columns, rows, yPos);
  }

  // --- PIE DE PÁGINA ---
  drawPageFooters(doc, {
    legalText: 'Memoria Anual generada conforme al artículo 65 de la Ley 7/2022 y normativa autonómica aplicable.',
    secondaryLine: `Sistema de Gestión RESIGEST 360 · Registro: ${formatSafeDateTime(docDateIso) || memoria.año}`,
  });

  if (memoria.estado === 'borrador') {
    drawDraftWatermark(doc, 'BORRADOR - NO PRESENTADA');
  }

  return doc;
}

