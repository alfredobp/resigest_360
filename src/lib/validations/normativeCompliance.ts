// ==============================================================================
// RESIGEST 360 - MOTOR DE CUMPLIMIENTO NORMATIVO (LEY 7/2022, RD 553/2020, RD 764/2026)
// ==============================================================================

import type {
  CenterRegistration,
  ContainerMaterial,
  ContainerSpecification,
  LegalObligationItem,
  LegalObligationStatus,
  NimaVerificationStatus,
  OfficialRegistrationCode,
  OwnershipTransferRecord,
  PhysicalContainerTypeId,
} from '@/types/wasteManagement';

// ============================================================================
// 1. TABLA OFICIAL DE PROVINCIAS INE (01–52) Y VALIDACIÓN NIMA (RD 764/2026)
// ============================================================================

export const INE_PROVINCE_NAMES: Record<string, string> = {
  '01': 'Álava',
  '02': 'Albacete',
  '03': 'Alicante',
  '04': 'Almería',
  '05': 'Ávila',
  '06': 'Badajoz',
  '07': 'Illes Balears',
  '08': 'Barcelona',
  '09': 'Burgos',
  '10': 'Cáceres',
  '11': 'Cádiz',
  '12': 'Castellón',
  '13': 'Ciudad Real',
  '14': 'Córdoba',
  '15': 'A Coruña',
  '16': 'Cuenca',
  '17': 'Girona',
  '18': 'Granada',
  '19': 'Guadalajara',
  '20': 'Gipuzkoa',
  '21': 'Huelva',
  '22': 'Huesca',
  '23': 'Jaén',
  '24': 'León',
  '25': 'Lleida',
  '26': 'La Rioja',
  '27': 'Lugo',
  '28': 'Madrid',
  '29': 'Málaga',
  '30': 'Murcia',
  '31': 'Navarra',
  '32': 'Ourense',
  '33': 'Asturias',
  '34': 'Palencia',
  '35': 'Las Palmas',
  '36': 'Pontevedra',
  '37': 'Salamanca',
  '38': 'Santa Cruz de Tenerife',
  '39': 'Cantabria',
  '40': 'Segovia',
  '41': 'Sevilla',
  '42': 'Soria',
  '43': 'Tarragona',
  '44': 'Teruel',
  '45': 'Toledo',
  '46': 'Valencia',
  '47': 'Valladolid',
  '48': 'Bizkaia',
  '49': 'Zamora',
  '50': 'Zaragoza',
  '51': 'Ceuta',
  '52': 'Melilla',
};

export function resolveIneProvinceCode(provinceNameOrCode?: string | null): string | null {
  if (!provinceNameOrCode) return null;
  const trimmed = String(provinceNameOrCode).trim();
  if (/^(0[1-9]|[1-4][0-9]|5[0-2])$/.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const aliases: Record<string, string> = {
    alava: '01',
    araba: '01',
    albacete: '02',
    alicante: '03',
    alacant: '03',
    almeria: '04',
    avila: '05',
    badajoz: '06',
    baleares: '07',
    balears: '07',
    barcelona: '08',
    burgos: '09',
    caceres: '10',
    cadiz: '11',
    castellon: '12',
    castello: '12',
    'ciudad real': '13',
    cordoba: '14',
    coruna: '15',
    cuenca: '16',
    girona: '17',
    gerona: '17',
    granada: '18',
    guadalajara: '19',
    guipuzcoa: '20',
    gipuzkoa: '20',
    huelva: '21',
    huesca: '22',
    jaen: '23',
    leon: '24',
    lleida: '25',
    lerida: '25',
    rioja: '26',
    lugo: '27',
    madrid: '28',
    malaga: '29',
    murcia: '30',
    navarra: '31',
    ourense: '32',
    orense: '32',
    asturias: '33',
    palencia: '34',
    palmas: '35',
    pontevedra: '36',
    salamanca: '37',
    'santa cruz': '38',
    tenerife: '38',
    cantabria: '39',
    segovia: '40',
    sevilla: '41',
    soria: '42',
    tarragona: '43',
    teruel: '44',
    toledo: '45',
    valencia: '46',
    valladolid: '47',
    vizcaya: '48',
    bizkaia: '48',
    zamora: '49',
    zaragoza: '50',
    ceuta: '51',
    melilla: '52',
  };

  for (const [key, code] of Object.entries(aliases)) {
    if (normalized.includes(key)) {
      return code;
    }
  }
  return null;
}

export interface NimaValidationResult {
  valid: boolean;
  cleanNima: string;
  provincePrefix: string | null;
  provinceName: string | null;
  provinceMatchesCenter: boolean;
  isAdministrativeAuthorization: false;
  disclaimer: string;
  errors: string[];
}

export const NIMA_LEGAL_DISCLAIMER =
  'La validación de formato NIMA verifica la estructura de 10 dígitos y coherencia provincial INE (RD 764/2026), pero no sustituye ni acredita la inscripción o autorización administrativa en el Registro de Producción y Gestión de Residuos.';

/**
 * Valida un código NIMA conforme al RD 764/2026:
 * - Exactamente 10 dígitos numéricos (^[0-9]{10}$).
 * - Los 2 primeros dígitos corresponden al código INE provincial (01–52).
 * - Los 8 dígitos siguientes los asigna la autoridad ambiental (nunca se autogeneran).
 * - Coherencia con la provincia del centro o instalación.
 */
export function validateNimaRD764(
  nima?: string | null,
  centerProvinceNameOrCode?: string | null
): NimaValidationResult {
  const raw = String(nima || '').trim();
  const errors: string[] = [];

  if (!raw) {
    errors.push('El código NIMA está vacío.');
    return {
      valid: false,
      cleanNima: '',
      provincePrefix: null,
      provinceName: null,
      provinceMatchesCenter: false,
      isAdministrativeAuthorization: false,
      disclaimer: NIMA_LEGAL_DISCLAIMER,
      errors,
    };
  }

  if (!/^[0-9]{10}$/.test(raw)) {
    errors.push('El NIMA debe contener exactamente 10 dígitos numéricos (^[0-9]{10}$) conforme al RD 764/2026.');
  }

  const prefix = raw.length >= 2 ? raw.slice(0, 2) : null;
  const provinceName = prefix && INE_PROVINCE_NAMES[prefix] ? INE_PROVINCE_NAMES[prefix] : null;

  if (!provinceName) {
    errors.push(
      `Los 2 primeros dígitos del NIMA (${prefix || '--'}) no corresponden a un código provincial INE válido (01–52).`
    );
  }

  let provinceMatchesCenter = true;
  if (centerProvinceNameOrCode && String(centerProvinceNameOrCode).trim()) {
    const expectedProvCode = resolveIneProvinceCode(centerProvinceNameOrCode);
    if (expectedProvCode && prefix && expectedProvCode !== prefix) {
      provinceMatchesCenter = false;
      errors.push(
        `Incoherencia provincial en NIMA: el prefijo ${prefix} (${provinceName || 'desconocido'}) no coincide con la provincia del centro (${INE_PROVINCE_NAMES[expectedProvCode] || centerProvinceNameOrCode}, código INE ${expectedProvCode}).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    cleanNima: raw,
    provincePrefix: prefix,
    provinceName,
    provinceMatchesCenter,
    isAdministrativeAuthorization: false,
    disclaimer: NIMA_LEGAL_DISCLAIMER,
    errors,
  };
}

/**
 * Determina si se puede guardar como borrador interno o cerrar un documento oficial con el estado actual del NIMA.
 * Si el cliente aún no aporta NIMA o está 'pendiente_verificar', permite guardar borrador pero bloquea el cierre oficial.
 */
export function canFinalizeOfficialDocumentWithNima(
  status: NimaVerificationStatus | undefined,
  nima?: string | null,
  centerProvince?: string | null
): {
  canSaveDraft: boolean;
  canFinalizeOfficial: boolean;
  effectiveStatus: NimaVerificationStatus;
  reason?: string;
} {
  if (!nima || !String(nima).trim()) {
    return {
      canSaveDraft: true,
      canFinalizeOfficial: false,
      effectiveStatus: 'pendiente_verificar',
      reason: 'El centro o entidad aún no dispone de NIMA asignado (estado: pendiente de verificar). Puede guardar borrador interno, pero no cerrar ni emitir documento oficial.',
    };
  }

  const validation = validateNimaRD764(nima, centerProvince);
  if (!validation.valid) {
    return {
      canSaveDraft: true,
      canFinalizeOfficial: false,
      effectiveStatus: 'invalido',
      reason: validation.errors.join(' '),
    };
  }

  if (status === 'pendiente_verificar') {
    return {
      canSaveDraft: true,
      canFinalizeOfficial: false,
      effectiveStatus: 'pendiente_verificar',
      reason: 'El NIMA tiene formato válido pero figura pendiente de verificación administrativa.',
    };
  }

  return {
    canSaveDraft: true,
    canFinalizeOfficial: true,
    effectiveStatus: status || 'formato_valido',
  };
}

// ============================================================================
// 2. CATÁLOGO OFICIAL DE INSCRIPCIONES RD 764/2026 (ENTIDAD -> CENTRO -> INSCRIPCIÓN)
// ============================================================================

export interface RegistrationTypeMeta {
  code: OfficialRegistrationCode;
  label: string;
  actorCategory: 'productor' | 'gestor' | 'recogida_sin_instalacion' | 'transportista' | 'negociante' | 'agente';
  peligrosidad: 'peligroso' | 'no-peligroso' | 'ambos';
  requiresCenterNima: boolean;
}

export const OFFICIAL_REGISTRATION_TYPES_RD764: Record<OfficialRegistrationCode, RegistrationTypeMeta> = {
  P01: {
    code: 'P01',
    label: 'Productor de residuos peligrosos (>= 10 t/año)',
    actorCategory: 'productor',
    peligrosidad: 'peligroso',
    requiresCenterNima: true,
  },
  P02: {
    code: 'P02',
    label: 'Pequeño productor de residuos peligrosos (< 10 t/año)',
    actorCategory: 'productor',
    peligrosidad: 'peligroso',
    requiresCenterNima: true,
  },
  P03: {
    code: 'P03',
    label: 'Productor de residuos no peligrosos (> 1.000 t/año)',
    actorCategory: 'productor',
    peligrosidad: 'no-peligroso',
    requiresCenterNima: true,
  },
  G01: {
    code: 'G01',
    label: 'Instalación de tratamiento de residuos peligrosos',
    actorCategory: 'gestor',
    peligrosidad: 'peligroso',
    requiresCenterNima: true,
  },
  G02: {
    code: 'G02',
    label: 'Instalación de almacenamiento en el ámbito de la recogida de residuos peligrosos',
    actorCategory: 'gestor',
    peligrosidad: 'peligroso',
    requiresCenterNima: true,
  },
  G04: {
    code: 'G04',
    label: 'Instalación de tratamiento de residuos no peligrosos',
    actorCategory: 'gestor',
    peligrosidad: 'no-peligroso',
    requiresCenterNima: true,
  },
  G05: {
    code: 'G05',
    label: 'Instalación de almacenamiento en el ámbito de la recogida de residuos no peligrosos',
    actorCategory: 'gestor',
    peligrosidad: 'no-peligroso',
    requiresCenterNima: true,
  },
  E01: {
    code: 'E01',
    label: 'Recogida de residuos peligrosos sin instalación asociada',
    actorCategory: 'recogida_sin_instalacion',
    peligrosidad: 'peligroso',
    requiresCenterNima: true,
  },
  E02: {
    code: 'E02',
    label: 'Recogida de residuos no peligrosos sin instalación asociada',
    actorCategory: 'recogida_sin_instalacion',
    peligrosidad: 'no-peligroso',
    requiresCenterNima: true,
  },
  T01: {
    code: 'T01',
    label: 'Transportista profesional de residuos peligrosos',
    actorCategory: 'transportista',
    peligrosidad: 'peligroso',
    requiresCenterNima: true,
  },
  T02: {
    code: 'T02',
    label: 'Transportista profesional de residuos no peligrosos',
    actorCategory: 'transportista',
    peligrosidad: 'no-peligroso',
    requiresCenterNima: true,
  },
  N01: {
    code: 'N01',
    label: 'Negociante de residuos peligrosos',
    actorCategory: 'negociante',
    peligrosidad: 'peligroso',
    requiresCenterNima: true,
  },
  N02: {
    code: 'N02',
    label: 'Negociante de residuos no peligrosos',
    actorCategory: 'negociante',
    peligrosidad: 'no-peligroso',
    requiresCenterNima: true,
  },
  A01: {
    code: 'A01',
    label: 'Agente de residuos peligrosos',
    actorCategory: 'agente',
    peligrosidad: 'peligroso',
    requiresCenterNima: true,
  },
  A02: {
    code: 'A02',
    label: 'Agente de residuos no peligrosos',
    actorCategory: 'agente',
    peligrosidad: 'no-peligroso',
    requiresCenterNima: true,
  },
};

export function validateCenterRegistration(reg: Partial<CenterRegistration>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!reg.codigo_inscripcion || !OFFICIAL_REGISTRATION_TYPES_RD764[reg.codigo_inscripcion]) {
    errors.push('Debe indicar un código de inscripción oficial válido del RD 764/2026 (P01..P03, G01..G05, E01..E02, T01..T02, N01..N02, A01..A02).');
  }
  if (!reg.numero_inscripcion || !String(reg.numero_inscripcion).trim()) {
    errors.push('Debe indicar el número de inscripción o autorización en el Registro de Producción y Gestión de Residuos.');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Valida un cambio de titularidad de centro o instalación (art. 7.2.b RD 764/2026):
 * El centro físico conserva su NIMA histórico mientras cambia el NIF/razón social del titular.
 */
export function validateOwnershipTransferRD764(
  record: Partial<OwnershipTransferRecord>,
  centerProvince?: string | null
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!record.previous_owner_nif?.trim() || !record.previous_owner_razon_social?.trim()) {
    errors.push('Debe consignar el NIF y razón social del titular anterior de la instalación.');
  }
  if (!record.new_owner_nif?.trim() || !record.new_owner_razon_social?.trim()) {
    errors.push('Debe consignar el NIF y razón social del nuevo titular de la instalación.');
  }
  if (
    record.previous_owner_nif?.trim() &&
    record.new_owner_nif?.trim() &&
    record.previous_owner_nif.trim().toUpperCase() === record.new_owner_nif.trim().toUpperCase()
  ) {
    errors.push('El NIF del nuevo titular debe ser distinto al del titular anterior en un cambio de titularidad.');
  }
  if (!record.fecha_cambio_titularidad?.trim()) {
    errors.push('Debe indicar la fecha efectiva del cambio de titularidad.');
  }
  const nimaCheck = validateNimaRD764(record.preserved_nima, centerProvince);
  if (!nimaCheck.valid) {
    errors.push(`El NIMA conservado por la instalación no es válido (art. 7.2.b RD 764/2026): ${nimaCheck.errors.join(' ')}`);
  }
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 3. CATÁLOGO CERRADO DE 17 TIPOS DE CONTENEDORES + "OTRO (ESPECIFICAR)"
// ============================================================================

export interface PhysicalContainerCatalogItem {
  id: PhysicalContainerTypeId;
  label: string;
  typicalCapacityLabel: string;
  requiresCustomDescription: boolean;
  isBulkWithoutPackaging: boolean;
}

export const PHYSICAL_CONTAINER_CATALOG: PhysicalContainerCatalogItem[] = [
  {
    id: 'bidon_tambor',
    label: 'Bidón / Tambor',
    typicalCapacityLabel: '25 L, 50 L, 60 L, 120 L, 200 L, 220 L',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'grg_ibc',
    label: 'GRG / IBC (Contenedor intermedio para graneles)',
    typicalCapacityLabel: '600 L, 1.000 L',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'garrafa_jerrican',
    label: 'Garrafa / Jerrican',
    typicalCapacityLabel: '5 L, 10 L, 20 L, 25 L, 30 L',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'caja_cajon',
    label: 'Caja / Cajón',
    typicalCapacityLabel: 'Cartón, plástico, madera o metal',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'saco_bolsa',
    label: 'Saco / Bolsa',
    typicalCapacityLabel: 'Plástico, papel o rafia',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'big_bag',
    label: 'Big Bag / Saco flexible gran volumen (FIBC)',
    typicalCapacityLabel: '0,5 m³, 1 m³, 1,5 m³ / 500–1.500 kg',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'contenedor_movil_2_4_ruedas',
    label: 'Contenedor móvil 2 o 4 ruedas',
    typicalCapacityLabel: '120 L, 240 L, 360 L, 800 L, 1.000 L, 1.100 L',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'contenedor_metalico_obra',
    label: 'Contenedor metálico abierto / cerrado de obra',
    typicalCapacityLabel: '3 m³, 5 m³, 7 m³, 9 m³, 12 m³, 20 m³, 30 m³, 40 m³',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'contenedor_autocompactador',
    label: 'Contenedor autocompactador / compactador',
    typicalCapacityLabel: '10 m³ – 30 m³',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'contenedor_isotermo_refrigerado',
    label: 'Contenedor isotermo / refrigerado',
    typicalCapacityLabel: 'Capacidad variable',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'contenedor_especifico_biosanitario',
    label: 'Contenedor específico biosanitario / punzantes',
    typicalCapacityLabel: '1 L, 3 L, 5 L, 10 L, 30 L, 60 L',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'pallet_paletizado_retractilado',
    label: 'Pallet / Paletizado retractilado',
    typicalCapacityLabel: 'Europalet / Industrial',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'fardo_bala_prensada',
    label: 'Fardo / Bala prensada',
    typicalCapacityLabel: 'Prensado compacto',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'jaula_contenedor_malla',
    label: 'Jaula / Contenedor de malla',
    typicalCapacityLabel: 'Metálico / RAEE / Envases',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'cubeto_recipiente_retencion',
    label: 'Cubeto / Recipiente con retención',
    typicalCapacityLabel: 'Con bandeja colectora de derrames',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'cisterna_tanque_movil',
    label: 'Cisterna / Tanque móvil',
    typicalCapacityLabel: 'Granel líquido / Lodos',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: false,
  },
  {
    id: 'granel_sin_envase',
    label: 'Granel (sin envase, sobre caja/bañera/plataforma)',
    typicalCapacityLabel: 'Bañera / Plataforma / Caja abierta',
    requiresCustomDescription: false,
    isBulkWithoutPackaging: true,
  },
  {
    id: 'otro',
    label: 'Otro (especificar)',
    typicalCapacityLabel: 'Requiere descripción técnica obligatoria',
    requiresCustomDescription: true,
    isBulkWithoutPackaging: false,
  },
];

export const CONTAINER_MATERIALS: Array<{ id: ContainerMaterial; label: string }> = [
  { id: 'PEAD_plastico', label: 'PEAD / Plástico técnico' },
  { id: 'acero_metal', label: 'Acero / Metal' },
  { id: 'carton', label: 'Cartón' },
  { id: 'madera', label: 'Madera' },
  { id: 'rafia_textil', label: 'Rafia / Textil polipropileno' },
  { id: 'compuesto', label: 'Compuesto / Multicapa' },
  { id: 'sin_envase', label: 'Sin envase (Granel)' },
  { id: 'otro', label: 'Otro material' },
];

export interface ContainerValidationResult {
  valid: boolean;
  displayLabel: string;
  calculatedWeightKg: number | null;
  storageDaysElapsed: number | null;
  exceedsSixMonthHazardousLimit: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida la especificación de contenedor/envase conforme a las orientaciones normativas (Ley 7/2022 art. 21 y RD 553/2020):
 * - Si se elige 'otro', exige texto libre en descripcion_personalizada.
 * - No convierte automáticamente volumen (L o m3) en masa (kg/t) sin densidad justificada (densidad_kg_m3 > 0).
 * - En residuos peligrosos (isHazardous), verifica fecha_inicio_deposito, plazo máximo de 6 meses y etiquetado/retención.
 */
export function validateContainerSpecification(
  spec: Partial<ContainerSpecification>,
  isHazardous = false,
  referenceDate: Date = new Date()
): ContainerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const catalogItem = PHYSICAL_CONTAINER_CATALOG.find((item) => item.id === spec.tipo_contenedor);
  if (!catalogItem) {
    errors.push('Debe seleccionar un tipo físico de contenedor válido del catálogo oficial.');
  }

  if (spec.tipo_contenedor === 'otro') {
    const customDesc = String(spec.descripcion_personalizada || '').trim();
    if (customDesc.length < 3) {
      errors.push('Al seleccionar "Otro (especificar)", es obligatorio describir el tipo de envase o contenedor (mínimo 3 caracteres).');
    }
  }

  const units = Number(spec.numero_unidades ?? (catalogItem?.isBulkWithoutPackaging ? 1 : 0));
  if (!catalogItem?.isBulkWithoutPackaging && (!Number.isFinite(units) || units <= 0)) {
    errors.push('El número de bultos o unidades de envase debe ser mayor que 0.');
  }

  let calculatedWeightKg: number | null = null;
  if (typeof spec.peso_estimado_kg === 'number' && spec.peso_estimado_kg > 0) {
    calculatedWeightKg = spec.peso_estimado_kg;
  } else if (typeof spec.capacidad_valor === 'number' && spec.capacidad_valor > 0) {
    const effectiveUnits = units > 0 ? units : 1;
    if (spec.capacidad_unidad === 'kg') {
      calculatedWeightKg = parseFloat((spec.capacidad_valor * effectiveUnits).toFixed(3));
    } else if (spec.capacidad_unidad === 'L' || spec.capacidad_unidad === 'm3') {
      if (typeof spec.densidad_kg_m3 === 'number' && spec.densidad_kg_m3 > 0) {
        const totalM3 =
          spec.capacidad_unidad === 'm3'
            ? spec.capacidad_valor * effectiveUnits
            : (spec.capacidad_valor * effectiveUnits) / 1000;
        calculatedWeightKg = parseFloat((totalM3 * spec.densidad_kg_m3).toFixed(3));
      } else {
        warnings.push(
          `La capacidad del contenedor está expresada en volumen (${spec.capacidad_unidad}). No se convierte automáticamente a peso (kg/t) sin indicar una densidad técnica justificada (kg/m³) o el peso real en báscula.`
        );
      }
    }
  }

  let storageDaysElapsed: number | null = null;
  let exceedsSixMonthHazardousLimit = false;

  if (spec.fecha_inicio_deposito) {
    const depositDate = new Date(spec.fecha_inicio_deposito);
    if (!isNaN(depositDate.getTime())) {
      storageDaysElapsed = Math.floor((referenceDate.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24));
      if (isHazardous && storageDaysElapsed > 180) {
        exceedsSixMonthHazardousLimit = true;
        errors.push(
          `El almacenamiento temporal del residuo peligroso supera el plazo máximo legal de 6 meses (${storageDaysElapsed} días desde ${spec.fecha_inicio_deposito}, art. 21 Ley 7/2022).`
        );
      }
    }
  } else if (isHazardous) {
    warnings.push(
      'En residuos peligrosos es obligatorio consignar la fecha de inicio de depósito/almacenamiento para el etiquetado y control del plazo máximo de 6 meses (art. 21 Ley 7/2022).'
    );
  }

  if (isHazardous) {
    if (spec.etiquetado_reglamentario === false) {
      errors.push('Los envases de residuos peligrosos deben contar con etiquetado reglamentario claro, legible e indeleble (art. 21.c Ley 7/2022).');
    }
    if (spec.estanqueidad_retencion === false) {
      errors.push('Los envases de residuos peligrosos deben garantizar estanqueidad y retención frente a derrames.');
    }
    if (spec.compatibilidad_quimica === false) {
      errors.push('Incompatibilidad química declarada entre el residuo peligroso y el material del envase.');
    }
  }

  const displayLabel =
    spec.tipo_contenedor === 'otro'
      ? `Otro: ${String(spec.descripcion_personalizada || '').trim()}`
      : catalogItem?.label || 'Sin especificar';

  return {
    valid: errors.length === 0,
    displayLabel,
    calculatedWeightKg,
    storageDaysElapsed,
    exceedsSixMonthHazardousLimit,
    errors,
    warnings,
  };
}

// ============================================================================
// 4. MOTOR DE EVALUACIÓN DE OBLIGACIONES LEGALES (LEY 7/2022 Y RD 553/2020)
// ============================================================================

export interface LegalObligationsEvaluationInput {
  profile: string;
  generatesHazardousWaste: boolean;
  hazardousWasteTonnesPerYear: number;
  nonHazardousWasteTonnesPerYear: number;
  hasValidNima: boolean;
  nimaStatus?: NimaVerificationStatus;
  hasEnvironmentalAuthorization: boolean;
  hasValidTreatmentContracts: boolean;
  hasChronologicalArchiveEntries: boolean;
  hasSubmittedOrDraftAnnualReport: boolean;
  hasMinimizationPlan?: boolean;
  maxHazardousStorageDays?: number;
  hasHazardousLabelingAndDepositDates?: boolean;
  isDelegatedRepresentation?: boolean;
  hasDelegatedActorTrace?: boolean;
}

/**
 * Calcula la Matriz de Obligaciones Legales exigible al centro o entidad en función
 * de su actividad real, peligrosidad de sus códigos LER y umbrales de tonelaje anual
 * (> 10 t/año, > 1.000 t/año), diferenciando los 4 estados:
 * - 'cumple'
 * - 'pendiente_acreditar'
 * - 'no_aplica'
 * - 'incidencia'
 */
export function evaluateLegalObligations(
  input: LegalObligationsEvaluationInput
): LegalObligationItem[] {
  const obligations: LegalObligationItem[] = [];
  const p = String(input.profile || 'productor').toLowerCase();

  const isProducer = p === 'productor';
  const isManager =
    p === 'gestor' ||
    p === 'instalacion_tratamiento' ||
    p === 'chatarreria' ||
    p === 'gestor_rp' ||
    p === 'baterias';
  const isCarrier = p === 'transportista';
  const isBrokerOrAgent = p === 'negociante' || p === 'agente';
  const isConsultant = p === 'consultora' || Boolean(input.isDelegatedRepresentation);

  const hasRP = input.generatesHazardousWaste || input.hazardousWasteTonnesPerYear > 0;
  const rpTonnes = Number(input.hazardousWasteTonnesPerYear || 0);
  const rnpTonnes = Number(input.nonHazardousWasteTonnesPerYear || 0);

  // 1. Inscripción en Registro / Comunicación Previa y NIMA (Ley 7/2022 arts. 33-39 y RD 764/2026)
  const requiresRegistration =
    isManager ||
    isCarrier ||
    isBrokerOrAgent ||
    hasRP ||
    (isProducer && rnpTonnes > 1000);

  let regStatus: LegalObligationStatus = 'no_aplica';
  let regJustification = '';
  if (!requiresRegistration) {
    regStatus = 'no_aplica';
    regJustification = `Productor exclusivo de residuos no peligrosos con generación anual (${rnpTonnes.toFixed(2)} t/año) inferior o igual al umbral de 1.000 t/año (art. 35.1 Ley 7/2022).`;
  } else if (input.nimaStatus === 'invalido') {
    regStatus = 'incidencia';
    regJustification = 'El código NIMA consignado presenta formato o prefijo provincial INE inválido conforme al RD 764/2026.';
  } else if (input.hasValidNima && (isProducer || input.hasEnvironmentalAuthorization)) {
    regStatus = 'cumple';
    regJustification = isManager
      ? 'Centro con NIMA válido (RD 764/2026) y autorización administrativa de tratamiento/gestión vigente.'
      : 'Entidad/centro con NIMA de 10 dígitos coherente e inscripción/comunicación previa acreditada.';
  } else {
    regStatus = 'pendiente_acreditar';
    regJustification = isManager
      ? 'Requiere acreditar NIMA de 10 dígitos válido y autorización ambiental vigente de la instalación (art. 33 Ley 7/2022 y RD 764/2026).'
      : 'Requiere verificar inscripción en el Registro de Producción y Gestión de Residuos y NIMA de 10 dígitos asignado por la autoridad ambiental.';
  }

  obligations.push({
    id: 'inscripcion_nima_rd764',
    titulo: 'Inscripción Registral / Autorización y Código NIMA',
    normativa_referencia: 'Ley 7/2022 arts. 33, 35 y 39 | RD 764/2026',
    estado: regStatus,
    exigible: requiresRegistration,
    justificacion: regJustification,
  });

  // 2. Almacenamiento temporal, envasado y etiquetado de Residuos Peligrosos (Ley 7/2022 art. 21)
  let storageStatus: LegalObligationStatus = 'no_aplica';
  let storageJustification = '';
  if (!hasRP || isCarrier || isBrokerOrAgent) {
    storageStatus = 'no_aplica';
    storageJustification = 'Obligación específica para almacenamiento de residuos peligrosos en centro productor o instalación.';
  } else if (typeof input.maxHazardousStorageDays === 'number' && input.maxHazardousStorageDays > 180) {
    storageStatus = 'incidencia';
    storageJustification = `Superado el plazo máximo legal de 6 meses de almacenamiento de residuos peligrosos (${input.maxHazardousStorageDays} días, art. 21.b Ley 7/2022).`;
  } else if (input.hasHazardousLabelingAndDepositDates) {
    storageStatus = 'cumple';
    storageJustification = 'Envases de residuos peligrosos con fecha de inicio de depósito, etiquetado reglamentario y almacenamiento dentro del límite de 6 meses.';
  } else {
    storageStatus = 'pendiente_acreditar';
    storageJustification = 'Debe consignar fecha de inicio de depósito y verificar etiquetado reglamentario (LER, HP, NIMA, titular) en todos los envases de residuos peligrosos.';
  }

  obligations.push({
    id: 'almacenamiento_etiquetado_rp_art21',
    titulo: 'Almacenamiento Temporal (máx. 6 meses) y Etiquetado de Residuos Peligrosos',
    normativa_referencia: 'Ley 7/2022 art. 21',
    estado: storageStatus,
    exigible: hasRP && !isCarrier && !isBrokerOrAgent,
    justificacion: storageJustification,
  });

  // 3. Contrato de Tratamiento Previo y Documentos de Identificación (RD 553/2020 arts. 5 y 6)
  const requiresContractAndDI = isProducer || isManager || isBrokerOrAgent || isCarrier;
  obligations.push({
    id: 'contrato_di_rd553',
    titulo: 'Contrato de Tratamiento Previo y Documento de Identificación (DI)',
    normativa_referencia: 'RD 553/2020 arts. 5 y 6',
    estado: input.hasValidTreatmentContracts ? 'cumple' : 'pendiente_acreditar',
    exigible: requiresContractAndDI,
    justificacion: input.hasValidTreatmentContracts
      ? 'Traslados amparados por contrato de tratamiento vigente y Documento de Identificación.'
      : 'Todo traslado de residuos exige contrato de tratamiento formalizado previo a la salida y DI acompañante.',
  });

  // 4. Archivo Cronológico y Custodia 5 años (Ley 7/2022 art. 64)
  const requiresChronologicalArchive =
    isManager ||
    isCarrier ||
    isBrokerOrAgent ||
    hasRP ||
    (isProducer && rnpTonnes > 10);

  let chronoStatus: LegalObligationStatus = 'no_aplica';
  let chronoJustification = '';
  if (!requiresChronologicalArchive) {
    chronoStatus = 'no_aplica';
    chronoJustification = `Productor de residuos no peligrosos con generación anual (${rnpTonnes.toFixed(2)} t/año) inferior o igual a 10 t/año (exento según art. 64.1 Ley 7/2022).`;
  } else if (input.hasChronologicalArchiveEntries) {
    chronoStatus = 'cumple';
    chronoJustification = 'Libro de Archivo Cronológico activo con asientos trazables y bloqueo de borrado durante 5 años (art. 64 Ley 7/2022).';
  } else {
    chronoStatus = 'pendiente_acreditar';
    chronoJustification = 'Sujeto obligado a llevar Archivo Cronológico (productor RP, productor RNP > 10 t/año, gestor, transportista, negociante o agente). Sin asientos registrados en el ejercicio.';
  }

  obligations.push({
    id: 'archivo_cronologico_art64',
    titulo: 'Archivo Cronológico Digital (Custodia mínima 5 años)',
    normativa_referencia: 'Ley 7/2022 art. 64',
    estado: chronoStatus,
    exigible: requiresChronologicalArchive,
    justificacion: chronoJustification,
  });

  // 5. Memoria Anual Resumen antes del 1 de marzo (Ley 7/2022 art. 65)
  const requiresAnnualReport = isManager || isCarrier || isBrokerOrAgent || hasRP;
  let memoriaStatus: LegalObligationStatus = 'no_aplica';
  let memoriaJustification = '';
  if (!requiresAnnualReport) {
    memoriaStatus = 'no_aplica';
    memoriaJustification = 'Los productores exclusivos de residuos no peligrosos no tienen obligación estatal universal de presentar memoria anual antes del 1 de marzo (art. 65.1 Ley 7/2022).';
  } else if (input.hasSubmittedOrDraftAnnualReport) {
    memoriaStatus = 'cumple';
    memoriaJustification = 'Memoria anual generada/registrada para su presentación antes del 1 de marzo del año posterior al ejercicio.';
  } else {
    memoriaStatus = 'pendiente_acreditar';
    memoriaJustification = 'Obligación de presentar Memoria Anual resumen de contenido del Archivo Cronológico antes del 1 de marzo (art. 65 Ley 7/2022).';
  }

  obligations.push({
    id: 'memoria_anual_art65',
    titulo: 'Memoria Anual de Residuos (Plazo: antes del 1 de marzo)',
    normativa_referencia: 'Ley 7/2022 art. 65',
    estado: memoriaStatus,
    exigible: requiresAnnualReport,
    justificacion: memoriaJustification,
    fecha_limite: `${new Date().getFullYear() + 1}-03-01`,
  });

  // 6. Plan de Minimización de Residuos Peligrosos cada 4 años (Ley 7/2022 art. 18.7)
  const requiresMinimizationPlan = (isProducer || isManager) && hasRP && rpTonnes >= 10;
  let minPlanStatus: LegalObligationStatus = 'no_aplica';
  let minPlanJustification = '';
  if (!hasRP || (!isProducer && !isManager)) {
    minPlanStatus = 'no_aplica';
    minPlanJustification = 'Aplicable únicamente a productores de residuos peligrosos.';
  } else if (rpTonnes < 10) {
    minPlanStatus = 'no_aplica';
    minPlanJustification = `Exento de Plan de Minimización por generar menos de 10 t/año de residuos peligrosos en el centro (${rpTonnes.toFixed(2)} t/año < 10 t/año, art. 18.7 Ley 7/2022).`;
  } else if (input.hasMinimizationPlan) {
    minPlanStatus = 'cumple';
    minPlanJustification = `Productor de >= 10 t/año de RP (${rpTonnes.toFixed(2)} t/año) con Plan de Minimización cuatrienal acreditado.`;
  } else {
    minPlanStatus = 'pendiente_acreditar';
    minPlanJustification = `Superado el umbral de 10 t/año de residuos peligrosos por centro (${rpTonnes.toFixed(2)} t/año): debe disponer de Plan de Minimización cuatrienal (art. 18.7 Ley 7/2022).`;
  }

  obligations.push({
    id: 'plan_minimizacion_rp_art18',
    titulo: 'Plan de Minimización de Residuos Peligrosos (Cuatrienal >= 10 t/año)',
    normativa_referencia: 'Ley 7/2022 art. 18.7',
    estado: minPlanStatus,
    exigible: requiresMinimizationPlan,
    justificacion: minPlanJustification,
  });

  // 7. Trazabilidad de Representación Delegada (Consultoría Ambiental)
  if (isConsultant) {
    obligations.push({
      id: 'representacion_delegada_consultoria',
      titulo: 'Trazabilidad de Actuación por Representación Delegada',
      normativa_referencia: 'Ley 39/2015 art. 5 | Ley 7/2022 | RD 553/2020',
      estado: input.hasDelegatedActorTrace !== false ? 'cumple' : 'pendiente_acreditar',
      exigible: true,
      justificacion:
        'La consultora actúa por representación delegada: toda operación registra la empresa cliente titular de la obligación legal y el usuario consultor que ejecuta la acción.',
    });
  }

  return obligations;
}

