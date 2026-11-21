import jsPDF from 'jspdf';
import {
  BADGE_PALETTES,
  PDF_COLORS,
  PDF_LAYOUT,
  resolveStatusBadgeTone,
  type BadgeTone,
  type RGB,
} from './pdfTheme';

interface JsPDFInternalExt {
  events?: {
    subscribe?: (eventName: string, cb: (this: { internal: { write: (s: string) => void } }) => void) => void;
  };
  write?: (s: string) => void;
}

interface JsPDFExt {
  setCreationDate?: (date: Date) => void;
  setFileId?: (id: string) => void;
  setGState?: (gState: unknown) => void;
  GState?: new (params: { opacity: number }) => unknown;
  internal?: JsPDFInternalExt;
}

// =============================================================================
// Utilidades de formato y carga segura de recursos
// =============================================================================

export function formatSafeDate(d?: string | null): string {
  if (!d) return 'No especificada';
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, day] = trimmed.split('-').map(Number);
    const localDate = new Date(y, m - 1, day);
    return isNaN(localDate.getTime()) ? 'Fecha no disponible' : localDate.toLocaleDateString('es-ES');
  }
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleDateString('es-ES');
}

export function formatSafeDateTime(d?: string | null): string {
  if (!d) return '';
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, day] = trimmed.split('-').map(Number);
    const localDate = new Date(y, m - 1, day);
    return isNaN(localDate.getTime()) ? '' : localDate.toLocaleDateString('es-ES');
  }
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toPdfInfoDateString(
  dateInput?: string | null,
  fallbackIso = '2026-01-01T00:00:00Z'
): string {
  const parsed = dateInput ? new Date(dateInput) : new Date(fallbackIso);
  const d = isNaN(parsed.getTime()) ? new Date(fallbackIso) : parsed;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `D:${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}+00'00'`;
}

export function fitText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '-';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && doc.getTextWidth(`${truncated}...`) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length > 0 ? `${truncated}...` : text;
}

export async function loadImageAsBase64(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;
  if (typeof fetch !== 'function' || typeof FileReader === 'undefined') return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Advertencia: no se pudo cargar la imagen para el PDF:', error);
    return null;
  }
}

// =============================================================================
// Metadatos forenses deterministas (inmutabilidad de hashes PDF)
// =============================================================================

export interface DeterministicMetadataOptions {
  title: string;
  subject: string;
  author?: string;
  creator?: string;
  createdIso: string;
  updatedIso?: string;
  fileIdSeed?: string;
}

export function applyDeterministicMetadata(doc: jsPDF, opts: DeterministicMetadataOptions): void {
  const createdDate = new Date(opts.createdIso);
  const safeCreated = isNaN(createdDate.getTime()) ? new Date('2026-01-01T00:00:00Z') : createdDate;
  const pdfModDate = toPdfInfoDateString(opts.updatedIso || opts.createdIso, opts.createdIso);
  const pdfCreatedDate = toPdfInfoDateString(safeCreated.toISOString(), '2026-01-01T00:00:00Z');

  doc.setProperties({
    title: opts.title,
    subject: opts.subject,
    author: opts.author || 'ResiGest 360',
    creator: opts.creator || 'RESIGEST 360',
  });

  const ext = doc as unknown as JsPDFExt;
  if (typeof ext.setCreationDate === 'function') {
    ext.setCreationDate(safeCreated);
  }
  if (opts.fileIdSeed && typeof ext.setFileId === 'function') {
    const stableFileId = opts.fileIdSeed
      .replace(/[^0-9a-fA-F]/g, '0')
      .padEnd(32, '0')
      .slice(0, 32);
    ext.setFileId(stableFileId);
  }
  if (ext.internal?.events?.subscribe) {
    ext.internal.events.subscribe('putInfo', function () {
      this.internal.write(`/CreationDate (${pdfCreatedDate})`);
      this.internal.write(`/ModDate (${pdfModDate})`);
    });
  }
}

// =============================================================================
// Helpers de color y saltos de página
// =============================================================================

export function setFill(doc: jsPDF, color: RGB): void {
  doc.setFillColor(color[0], color[1], color[2]);
}

export function setText(doc: jsPDF, color: RGB): void {
  doc.setTextColor(color[0], color[1], color[2]);
}

export function setDraw(doc: jsPDF, color: RGB): void {
  doc.setDrawColor(color[0], color[1], color[2]);
}

export function ensurePageSpace(doc: jsPDF, yPos: number, requiredHeight: number, topStart = 18): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos + requiredHeight > pageHeight - PDF_LAYOUT.footerZoneHeight) {
    doc.addPage();
    // Sutil barra superior de continuidad en páginas siguientes
    setFill(doc, PDF_COLORS.brandPrimary);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 1.8, 'F');
    return topStart;
  }
  return yPos;
}

// =============================================================================
// Primitivas visuales (Opción A · Ejecutivo Esmeralda)
// =============================================================================

export function drawStatusBadge(
  doc: jsPDF,
  text: string,
  rightX: number,
  topY: number,
  tone?: BadgeTone
): number {
  const resolvedTone = tone || resolveStatusBadgeTone(text);
  const palette = BADGE_PALETTES[resolvedTone];
  const label = text.toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const textW = doc.getTextWidth(label);
  const padX = 3.2;
  const badgeW = textW + padX * 2;
  const badgeH = 5;
  const x = rightX - badgeW;

  setFill(doc, palette.bg);
  setDraw(doc, palette.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, topY, badgeW, badgeH, 2.2, 2.2, 'FD');

  setText(doc, palette.text);
  doc.text(label, x + badgeW / 2, topY + 3.55, { align: 'center' });
  return badgeW;
}

export interface DocumentHeaderOptions {
  title: string;
  subtitle: string;
  refLabel?: string;
  refValue: string;
  versionText?: string;
  statusText: string;
  statusTone?: BadgeTone;
  qrDataUrl?: string;
  qrCaption?: string;
}

export function drawDocumentHeader(doc: jsPDF, opts: DocumentHeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;

  // Franja superior de acento corporativo Emerald
  setFill(doc, PDF_COLORS.brandDark);
  doc.rect(0, 0, pageWidth * 0.45, PDF_LAYOUT.accentBarHeight, 'F');
  setFill(doc, PDF_COLORS.brandPrimary);
  doc.rect(pageWidth * 0.45, 0, pageWidth * 0.55, PDF_LAYOUT.accentBarHeight, 'F');

  const topY = 9;

  // Monograma vectorial ResiGest 360
  setFill(doc, PDF_COLORS.brandPrimary);
  doc.roundedRect(marginX, topY, 5.8, 5.8, 1.3, 1.3, 'F');
  setText(doc, PDF_COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('R', marginX + 2.9, topY + 4.1, { align: 'center' });

  setText(doc, PDF_COLORS.brandDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RESIGEST 360', marginX + 7.8, topY + 4);

  setText(doc, PDF_COLORS.inkSubtle);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('|  Gestión Ambiental', marginX + 31.5, topY + 4);

  // Caja derecha (Referencia + Estado, o con QR para DeCA)
  const hasQr = Boolean(opts.qrDataUrl);
  const boxW = hasQr ? 68 : 54;
  const boxH = hasQr ? 24 : 20;
  const boxX = pageWidth - marginX - boxW;
  const boxY = topY - 0.5;

  setFill(doc, PDF_COLORS.surfaceMuted);
  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

  if (hasQr && opts.qrDataUrl) {
    const qrSize = 18.5;
    const qrX = boxX + boxW - qrSize - 2.5;
    const qrY = boxY + 1.8;
    doc.addImage(opts.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    setText(doc, PDF_COLORS.brandDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.text(opts.qrCaption || 'INSPECCIÓN EN RUTA', qrX + qrSize / 2, boxY + boxH - 1.3, {
      align: 'center',
    });

    // Texto referencia a la izquierda del QR
    const textRight = qrX - 2.5;
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.text((opts.refLabel || 'REFERENCIA').toUpperCase(), textRight, boxY + 4.8, { align: 'right' });

    setText(doc, PDF_COLORS.inkPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text(fitText(doc, opts.refValue, boxW - qrSize - 8), textRight, boxY + 9.8, { align: 'right' });

    if (opts.versionText) {
      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.text(fitText(doc, opts.versionText, boxW - qrSize - 8), textRight, boxY + 14.2, { align: 'right' });
    }
    drawStatusBadge(doc, opts.statusText, textRight, boxY + 16.5, opts.statusTone);
  } else {
    const rightEdge = boxX + boxW - 3.5;
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.text((opts.refLabel || 'REFERENCIA OFICIAL').toUpperCase(), rightEdge, boxY + 4.8, { align: 'right' });

    setText(doc, PDF_COLORS.inkPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(fitText(doc, opts.refValue, boxW - 7), rightEdge, boxY + 10.2, { align: 'right' });

    const badgeW = drawStatusBadge(doc, opts.statusText, rightEdge, boxY + 12.8, opts.statusTone);
    if (opts.versionText) {
      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const maxVerW = boxW - badgeW - 9;
      if (maxVerW > 8) {
        doc.text(fitText(doc, opts.versionText, maxVerW), rightEdge - badgeW - 2.5, boxY + 16.3, {
          align: 'right',
        });
      }
    }
  }

  // Título y subtítulo a la izquierda
  const titleMaxW = boxX - marginX - 5;
  setText(doc, PDF_COLORS.inkPrimary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  const titleLines = doc.splitTextToSize(opts.title, titleMaxW);
  doc.text(titleLines, marginX, topY + 11.5);

  const afterTitleY = topY + 11.5 + (titleLines.length - 1) * 5.2 + 4.5;
  setText(doc, PDF_COLORS.inkMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  const subLines = doc.splitTextToSize(opts.subtitle, titleMaxW);
  doc.text(subLines, marginX, afterTitleY);

  const leftBottom = afterTitleY + (subLines.length - 1) * 3.5 + 3;
  const headerBottom = Math.max(leftBottom, boxY + boxH + 3.5);

  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(marginX, headerBottom, pageWidth - marginX, headerBottom);

  return headerBottom + 4.5;
}

export interface MetadataStripItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export function drawMetadataStrip(doc: jsPDF, items: MetadataStripItem[], yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;
  const contentW = pageWidth - marginX * 2;
  const colW = contentW / Math.max(items.length, 1);
  const stripH = 12.5;

  setFill(doc, PDF_COLORS.surfaceMuted);
  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, yPos, contentW, stripH, 1.8, 1.8, 'FD');

  items.forEach((item, idx) => {
    const x = marginX + idx * colW + 3.5;
    const maxW = colW - 6;

    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.text(item.label.toUpperCase(), x, yPos + 4.6);

    setText(doc, item.highlight ? PDF_COLORS.brandPrimary : PDF_COLORS.inkPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.text(fitText(doc, item.value || '-', maxW), x, yPos + 9.6);
  });

  return yPos + stripH + 4.5;
}

export function drawSectionHeader(doc: jsPDF, title: string, yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;

  setFill(doc, PDF_COLORS.brandPrimary);
  doc.roundedRect(marginX, yPos, 1.8, 4.6, 0.6, 0.6, 'F');

  setText(doc, PDF_COLORS.inkPrimary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(title.toUpperCase(), marginX + 4, yPos + 3.6);

  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.line(marginX, yPos + 6.2, pageWidth - marginX, yPos + 6.2);

  return yPos + 9;
}

export interface CardRow {
  label: string;
  value: string;
  boldValue?: boolean;
}

export interface InfoCardData {
  title: string;
  rows: CardRow[];
  emptyMessage?: string;
}

function measureCardHeight(doc: jsPDF, card: InfoCardData, cardW: number, labelW: number): number {
  const valueW = cardW - labelW - 7;
  let h = 10; // header + divider
  if (card.rows.length === 0) {
    return h + 8;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  for (const row of card.rows) {
    const lines = doc.splitTextToSize(row.value || '-', valueW);
    h += Math.max(4.4, lines.length * 3.5 + 1.2);
  }
  return h + 2.5;
}

function renderCardContent(
  doc: jsPDF,
  card: InfoCardData,
  x: number,
  y: number,
  w: number,
  h: number,
  labelW: number
): void {
  setFill(doc, PDF_COLORS.surfaceMuted);
  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, PDF_LAYOUT.cardRadius, PDF_LAYOUT.cardRadius, 'FD');

  setText(doc, PDF_COLORS.brandDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.text(card.title.toUpperCase(), x + 3.5, y + 5.2);

  setDraw(doc, PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(x + 3.5, y + 7, x + w - 3.5, y + 7);

  let rowY = y + 10.8;
  if (card.rows.length === 0) {
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text(card.emptyMessage || 'Sin datos asociados.', x + 3.5, rowY);
    return;
  }

  const valueX = x + 3.5 + labelW;
  const valueW = w - labelW - 7;

  for (const row of card.rows) {
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.3);
    doc.text(`${row.label}:`, x + 3.5, rowY);

    setText(doc, PDF_COLORS.inkPrimary);
    doc.setFont('helvetica', row.boldValue ? 'bold' : 'normal');
    doc.setFontSize(7.6);
    const lines = doc.splitTextToSize(row.value || '-', valueW);
    doc.text(lines, valueX, rowY);
    rowY += Math.max(4.4, lines.length * 3.5 + 1.2);
  }
}

export function drawTwoColumnCards(
  doc: jsPDF,
  left: InfoCardData,
  right: InfoCardData,
  yPos: number,
  labelW = 24
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;
  const gap = PDF_LAYOUT.cardGap;
  const cardW = (pageWidth - marginX * 2 - gap) / 2;

  const leftH = measureCardHeight(doc, left, cardW, labelW);
  const rightH = measureCardHeight(doc, right, cardW, labelW);
  const boxH = Math.max(leftH, rightH);

  const safeY = ensurePageSpace(doc, yPos, boxH + 4);
  renderCardContent(doc, left, marginX, safeY, cardW, boxH, labelW);
  renderCardContent(doc, right, marginX + cardW + gap, safeY, cardW, boxH, labelW);

  return safeY + boxH + 4.5;
}

export interface KpiCardItem {
  label: string;
  value: string;
  subtext?: string;
  accentColor?: RGB;
  valueColor?: RGB;
}

export function drawKpiCards(doc: jsPDF, items: KpiCardItem[], yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = PDF_LAYOUT.marginX;
  const gap = 4;
  const count = Math.max(items.length, 1);
  const cardW = (pageWidth - marginX * 2 - gap * (count - 1)) / count;
  const cardH = 17.5;

  const safeY = ensurePageSpace(doc, yPos, cardH + 4);

  items.forEach((item, idx) => {
    const x = marginX + idx * (cardW + gap);
    const accent = item.accentColor || PDF_COLORS.brandPrimary;

    setFill(doc, PDF_COLORS.surfaceMuted);
    setDraw(doc, PDF_COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, safeY, cardW, cardH, 1.8, 1.8, 'FD');

    // Acento lateral izquierdo
    setFill(doc, accent);
    doc.rect(x, safeY + 1.2, 1.4, cardH - 2.4, 'F');

    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.text(fitText(doc, item.label.toUpperCase(), cardW - 6), x + 4, safeY + 4.8);

    setText(doc, item.valueColor || PDF_COLORS.inkPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(fitText(doc, item.value, cardW - 6), x + 4, safeY + 10.8);

    if (item.subtext) {
      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.6);
      doc.text(fitText(doc, item.subtext, cardW - 6), x + 4, safeY + 15);
    }
  });

  return safeY + cardH + 4.5;
}

// =============================================================================
// Motor de tablas con salto de página y repetición de cabecera
// =============================================================================

export interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableCell {
  text: string;
  bold?: boolean;
  color?: RGB;
}

export interface TableRow {
  cells: TableCell[];
  isSummary?: boolean;
}

export function drawDataTable(
  doc: jsPDF,
  columns: TableColumn[],
  rows: TableRow[],
  startY: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = PDF_LAYOUT.marginX;
  const tableW = pageWidth - marginX * 2;
  const headerH = 7;

  const drawHeaderRow = (y: number): number => {
    setFill(doc, PDF_COLORS.inkPrimary);
    doc.rect(marginX, y, tableW, headerH, 'F');

    setText(doc, PDF_COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);

    let colX = marginX;
    for (const col of columns) {
      const align = col.align || 'left';
      const textX =
        align === 'right' ? colX + col.width - 2.5 : align === 'center' ? colX + col.width / 2 : colX + 2.5;
      doc.text(col.header.toUpperCase(), textX, y + 4.7, { align });
      colX += col.width;
    }
    return y + headerH;
  };

  let yPos = ensurePageSpace(doc, startY, headerH + 10);
  yPos = drawHeaderRow(yPos);

  rows.forEach((row, rowIndex) => {
    // Calcular líneas por celda para determinar altura dinámica de fila
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    const wrappedCells = row.cells.map((cell, colIdx) => {
      const col = columns[colIdx];
      const maxW = Math.max((col?.width || 20) - 5, 6);
      return doc.splitTextToSize(cell.text || '-', maxW) as string[];
    });

    const maxLines = Math.max(1, ...wrappedCells.map((lines) => lines.length));
    const rowH = Math.max(7.2, maxLines * 3.6 + 3.2);

    if (yPos + rowH > pageHeight - PDF_LAYOUT.footerZoneHeight - 4) {
      doc.addPage();
      setFill(doc, PDF_COLORS.brandPrimary);
      doc.rect(0, 0, pageWidth, 1.8, 'F');
      yPos = drawHeaderRow(16);
    }

    if (row.isSummary) {
      setFill(doc, PDF_COLORS.brandLight);
      doc.rect(marginX, yPos, tableW, rowH, 'F');
    } else if (rowIndex % 2 === 1) {
      setFill(doc, PDF_COLORS.surfaceMuted);
      doc.rect(marginX, yPos, tableW, rowH, 'F');
    }

    setDraw(doc, PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(marginX, yPos + rowH, marginX + tableW, yPos + rowH);

    let colX = marginX;
    row.cells.forEach((cell, colIdx) => {
      const col = columns[colIdx];
      if (!col) return;
      const align = col.align || 'left';
      const textX =
        align === 'right' ? colX + col.width - 2.5 : align === 'center' ? colX + col.width / 2 : colX + 2.5;

      doc.setFont('helvetica', cell.bold || row.isSummary ? 'bold' : 'normal');
      doc.setFontSize(7.6);
      setText(doc, cell.color || (row.isSummary ? PDF_COLORS.brandDark : PDF_COLORS.inkPrimary));

      const lines = wrappedCells[colIdx] || ['-'];
      doc.text(lines, textX, yPos + 4.7, { align });
      colX += col.width;
    });

    yPos += rowH;
  });

  return yPos + 4.5;
}

// =============================================================================
// Bloques de firma (2 o 3 columnas)
// =============================================================================

export interface SignatureBlockData {
  roleKey?: 'productor' | 'gestor' | 'transportista';
  roleTitle: string;
  imageUrl?: string | null;
  statusLabel: string;
  isSigned: boolean;
  hidePendingPlaceholder?: boolean;
  neutralStatus?: boolean;
  signerDetails?: string;
  timestamp?: string;
}

export interface PdfSignatureBoxCoords {
  roleKey?: 'productor' | 'gestor' | 'transportista';
  page: number;
  llx: number;
  lly: number;
  urx: number;
  ury: number;
}

export type JsPDFWithSignatureBoxes = jsPDF & {
  __signatureBoxes?: PdfSignatureBoxCoords[];
};

const MM_TO_PT = 72 / 25.4;

export async function drawSignatureBlocks(
  doc: jsPDF,
  blocks: SignatureBlockData[],
  yPos: number
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = PDF_LAYOUT.marginX;
  const gap = 4.5;
  const count = Math.max(blocks.length, 1);
  const cardW = (pageWidth - marginX * 2 - gap * (count - 1)) / count;
  const cardH = 34;

  const safeY = ensurePageSpace(doc, yPos, cardH + 6);
  const currentPage =
    typeof doc.getNumberOfPages === 'function' ? doc.getNumberOfPages() : 1;
  const computedBoxes: PdfSignatureBoxCoords[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const x = marginX + i * (cardW + gap);

    // Coordenadas PDF (origen abajo-izquierda, en puntos) del área interior de rúbrica/sello
    computedBoxes.push({
      roleKey: block.roleKey,
      page: currentPage,
      llx: Math.round((x + 2.5) * MM_TO_PT),
      urx: Math.round((x + cardW - 2.5) * MM_TO_PT),
      lly: Math.round((pageHeight - (safeY + 19.8)) * MM_TO_PT),
      ury: Math.round((pageHeight - (safeY + 6.0)) * MM_TO_PT),
    });

    setFill(doc, PDF_COLORS.surfaceMuted);
    setDraw(doc, PDF_COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, safeY, cardW, cardH, 2, 2, 'FD');

    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    doc.text(fitText(doc, block.roleTitle.toUpperCase(), cardW - 6), x + 3, safeY + 4.8);

    // Imagen de firma si existe
    const sigLineY = safeY + 20.5;
    if (block.imageUrl) {
      const signatureBase64 = await loadImageAsBase64(block.imageUrl);
      if (signatureBase64) {
        try {
          const imgW = Math.min(cardW - 10, 42);
          doc.addImage(signatureBase64, 'PNG', x + (cardW - imgW) / 2, safeY + 6.5, imgW, 13);
        } catch (e) {
          console.warn('No se pudo renderizar la imagen de firma en el PDF:', e);
        }
      }
    } else if (!block.isSigned && !block.hidePendingPlaceholder) {
      setText(doc, PDF_COLORS.inkSubtle);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.text('Pendiente de rúbrica', x + cardW / 2, safeY + 14.5, { align: 'center' });
    }

    // Línea de firma
    setDraw(doc, PDF_COLORS.borderStrong);
    doc.setLineWidth(0.3);
    doc.line(x + 3.5, sigLineY, x + cardW - 3.5, sigLineY);

    // Estado de firma
    setText(
      doc,
      block.isSigned
        ? PDF_COLORS.brandPrimary
        : block.neutralStatus
          ? PDF_COLORS.inkMuted
          : PDF_COLORS.warning
    );
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.1);
    doc.text(fitText(doc, block.statusLabel, cardW - 6), x + 3, sigLineY + 4.2);

    // Nombre / DNI
    if (block.signerDetails) {
      setText(doc, PDF_COLORS.inkSecondary);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.text(fitText(doc, block.signerDetails, cardW - 6), x + 3, sigLineY + 8);
    }

    // Timestamp
    if (block.timestamp) {
      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.9);
      doc.text(fitText(doc, block.timestamp, cardW - 6), x + 3, sigLineY + (block.signerDetails ? 11.4 : 8));
    }
  }

  (doc as JsPDFWithSignatureBoxes).__signatureBoxes = computedBoxes;

  return safeY + cardH + 4;
}

// =============================================================================
// Pies de página y marca de agua
// =============================================================================

export interface PageFooterOptions {
  legalText: string;
  secondaryLine?: string;
  rightText?: string;
}

export function drawPageFooters(doc: jsPDF, opts: PageFooterOptions): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = PDF_LAYOUT.marginX;
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const lineY = pageHeight - 16.5;
    setDraw(doc, PDF_COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(marginX, lineY, pageWidth - marginX, lineY);

    // Numeración a la derecha
    const pageLabel = opts.rightText ? `${opts.rightText}  ·  Página ${i} de ${totalPages}` : `Página ${i} de ${totalPages}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setText(doc, PDF_COLORS.inkSecondary);
    const rightW = doc.getTextWidth(pageLabel) + 4;
    doc.text(pageLabel, pageWidth - marginX, lineY + 4.2, { align: 'right' });

    // Texto legal a la izquierda (envuelto sin invadir la numeración)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    setText(doc, PDF_COLORS.inkMuted);
    const maxLegalW = pageWidth - marginX * 2 - rightW;
    const legalLines = (doc.splitTextToSize(opts.legalText, maxLegalW) as string[]).slice(0, 2);
    doc.text(legalLines, marginX, lineY + 4.2);

    if (opts.secondaryLine) {
      const secY = lineY + 4.2 + legalLines.length * 3.1;
      doc.setFontSize(6.2);
      doc.text(fitText(doc, opts.secondaryLine, pageWidth - marginX * 2), marginX, secY);
    }

    // Fina línea de acento inferior
    setFill(doc, PDF_COLORS.brandPrimary);
    doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');
  }
}

export function drawDraftWatermark(doc: jsPDF, text = 'BORRADOR - NO OFICIAL'): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();
  const ext = doc as unknown as JsPDFExt;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const supportsGState = typeof ext.setGState === 'function' && typeof ext.GState === 'function';
    if (supportsGState && ext.GState && ext.setGState) {
      ext.setGState(new ext.GState({ opacity: 0.14 }));
      setText(doc, PDF_COLORS.inkMuted);
    } else {
      setText(doc, PDF_COLORS.watermark);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    doc.text(text, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 42 });

    if (supportsGState && ext.GState && ext.setGState) {
      ext.setGState(new ext.GState({ opacity: 1 }));
    }
  }
}

