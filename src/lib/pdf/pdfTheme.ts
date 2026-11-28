export type RGB = readonly [number, number, number];

export interface BadgePalette {
  bg: RGB;
  border: RGB;
  text: RGB;
}

export const PDF_LAYOUT = {
  marginX: 15,
  marginTop: 12,
  footerZoneHeight: 20,
  cardGap: 5,
  cardRadius: 2,
  accentBarHeight: 2.8,
} as const;

export const PDF_COLORS = {
  // Identidad ResiGest 360 (Opción A · Ejecutivo Esmeralda)
  brandPrimary: [4, 120, 87] as RGB,      // Emerald 700 (#047857)
  brandDark: [6, 95, 70] as RGB,          // Emerald 800 (#065F46)
  brandLight: [236, 253, 245] as RGB,     // Emerald 50  (#ECFDF5)
  brandBorder: [167, 243, 208] as RGB,    // Emerald 200 (#A7F3D0)

  // Tintas y grises neutros (Slate)
  inkPrimary: [15, 23, 42] as RGB,        // Slate 900 (#0F172A)
  inkSecondary: [51, 65, 85] as RGB,      // Slate 700 (#334155)
  inkMuted: [100, 116, 139] as RGB,       // Slate 500 (#64748B)
  inkSubtle: [148, 163, 184] as RGB,      // Slate 400 (#94A3B8)

  // Superficies y bordes
  white: [255, 255, 255] as RGB,
  surfaceMuted: [248, 250, 252] as RGB,   // Slate 50  (#F8FAFC)
  surfaceSubtle: [241, 245, 249] as RGB,  // Slate 100 (#F1F5F9)
  border: [226, 232, 240] as RGB,         // Slate 200 (#E2E8F0)
  borderStrong: [203, 213, 225] as RGB,   // Slate 300 (#CBD5E1)

  // Semánticos
  danger: [185, 28, 28] as RGB,           // Red 700   (#B91C1C)
  dangerBg: [254, 242, 242] as RGB,       // Red 50    (#FEF2F2)
  dangerBorder: [254, 202, 202] as RGB,   // Red 200   (#FECACA)

  warning: [180, 83, 9] as RGB,           // Amber 700 (#B45309)
  warningBg: [255, 251, 235] as RGB,      // Amber 50  (#FFFBEB)
  warningBorder: [253, 230, 138] as RGB,  // Amber 200 (#FDE68A)

  info: [3, 105, 161] as RGB,             // Sky 700   (#0369A1)
  infoBg: [240, 249, 255] as RGB,         // Sky 50    (#F0F9FF)
  infoBorder: [186, 230, 253] as RGB,     // Sky 200   (#BAE6FD)

  watermark: [216, 222, 230] as RGB,
} as const;

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const BADGE_PALETTES: Record<BadgeTone, BadgePalette> = {
  success: {
    bg: PDF_COLORS.brandLight,
    border: PDF_COLORS.brandBorder,
    text: PDF_COLORS.brandDark,
  },
  warning: {
    bg: PDF_COLORS.warningBg,
    border: PDF_COLORS.warningBorder,
    text: PDF_COLORS.warning,
  },
  danger: {
    bg: PDF_COLORS.dangerBg,
    border: PDF_COLORS.dangerBorder,
    text: PDF_COLORS.danger,
  },
  info: {
    bg: PDF_COLORS.infoBg,
    border: PDF_COLORS.infoBorder,
    text: PDF_COLORS.info,
  },
  neutral: {
    bg: PDF_COLORS.surfaceSubtle,
    border: PDF_COLORS.borderStrong,
    text: PDF_COLORS.inkSecondary,
  },
};

export function resolveStatusBadgeTone(status?: string | null): BadgeTone {
  const normalized = (status || '').toLowerCase();
  if (
    normalized.includes('vigente') ||
    normalized.includes('aceptado') ||
    normalized.includes('completado') ||
    normalized.includes('presentada') ||
    normalized.includes('liquidada') ||
    normalized.includes('cerrada') ||
    normalized.includes('facturada')
  ) {
    return 'success';
  }
  if (
    normalized.includes('rechaz') ||
    normalized.includes('anulad') ||
    normalized.includes('cancel') ||
    normalized.includes('peligroso') ||
    normalized.includes('incidencia')
  ) {
    return 'danger';
  }
  if (
    normalized.includes('borrador') ||
    normalized.includes('pendiente') ||
    normalized.includes('provisional') ||
    normalized.includes('hist') ||
    normalized.includes('abierta')
  ) {
    return 'warning';
  }
  if (normalized.includes('transito') || normalized.includes('tránsito') || normalized.includes('curso')) {
    return 'info';
  }
  return 'neutral';
}

