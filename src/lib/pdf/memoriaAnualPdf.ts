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

export interface MemoriaDetalleMovimiento {
  numero_di?: string;
  fecha?: string;
  codigo_ler?: string;
  descripcion?: string;
  cantidad_toneladas?: number;
  operacion_tratamiento?: string;
  gestor_nombre?: string;
  gestor_nima?: string;
}

export async function generateMemoriaAnualPDF(
  memoria: MemoriaAnual,
  detalle?: { movimientos?: MemoriaDetalleMovimiento[] } | null
): Promise<jsPDF> {
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

  const rawEstado = (memoria.estado || 'borrador').toLowerCase();
  const isDraft = rawEstado === 'borrador';
  const isPresented = rawEstado === 'presentada' || rawEstado === 'archivada';
  const estado = rawEstado.toUpperCase();

  // --- CABECERA EJECUTIVA (INC16: diferenciar resumen en borrador vs modelo completado vs declaración presentada) ---
  let yPos = drawDocumentHeader(doc, {
    title: isDraft
      ? 'RESUMEN DE MEMORIA ANUAL DE RESIDUOS (BORRADOR)'
      : isPresented
        ? 'MEMORIA ANUAL DE RESIDUOS (DECLARACIÓN PRESENTADA)'
        : 'MEMORIA ANUAL DE RESIDUOS (MODELO DE REVISIÓN)',
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

    yPos = drawDataTable(doc, columns, rows, yPos);
  }

  // --- 3. DESGLOSE POR DESTINO Y OPERACIÓN R/D (INC16: conciliar con CSV) ---
  const movimientos = detalle?.movimientos || [];
  if (movimientos.length > 0) {
    yPos = drawSectionHeader(doc, '3. Desglose por Destino (Gestor) y Operación de Tratamiento (R/D)', yPos);
    const destColumns: TableColumn[] = [
      { header: 'Nº DI', width: 38, align: 'left' },
      { header: 'LER', width: 22, align: 'left' },
      { header: 'Op. R/D', width: 20, align: 'center' },
      { header: 'Gestor Destinatario (NIMA)', width: 74, align: 'left' },
      { header: 'Cant. (t)', width: 26, align: 'right' },
    ];
    const destRows: TableRow[] = movimientos.map((m) => ({
      cells: [
        { text: m.numero_di || '-', bold: true },
        { text: m.codigo_ler || '-' },
        { text: m.operacion_tratamiento || '-', bold: true, color: PDF_COLORS.brandPrimary },
        {
          text: [m.gestor_nombre || '-', m.gestor_nima ? `(${m.gestor_nima})` : null].filter(Boolean).join(' '),
          color: PDF_COLORS.inkSecondary,
        },
        { text: `${(Number(m.cantidad_toneladas) || 0).toFixed(3)} t`, bold: true },
      ],
    }));
    drawDataTable(doc, destColumns, destRows, yPos);
  }

  // --- PIE DE PÁGINA (INC16) ---
  const legalText = isDraft
    ? 'RESUMEN INFORMATIVO EN BORRADOR (art. 65 Ley 7/2022). Documento de trabajo interno no presentado ante la autoridad competente.'
    : isPresented
      ? 'Memoria Anual declarada como PRESENTADA conforme al artículo 65 de la Ley 7/2022. Conserve el justificante oficial del registro administrativo.'
      : 'Memoria Anual preparada para revisión conforme al artículo 65 de la Ley 7/2022. Pendiente de presentación ante la autoridad competente.';

  drawPageFooters(doc, {
    legalText,
    secondaryLine: `Sistema de Gestión RESIGEST 360 · Registro: ${formatSafeDateTime(docDateIso) || memoria.año}`,
  });

  if (isDraft) {
    drawDraftWatermark(doc, 'BORRADOR - NO PRESENTADA');
  }

  return doc;
}

