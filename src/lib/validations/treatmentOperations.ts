// =====================================================
// CATÁLOGO OFICIAL DE OPERACIONES DE TRATAMIENTO R / D
// Ley 7/2022 (Anexos II y III) + sugerencias por LER
// =====================================================

export interface TreatmentOperationDef {
  code: string;
  type: 'R' | 'D';
  label: string;
  requiresPriorNotification: boolean;
}

export const RECOVERY_OPERATIONS: TreatmentOperationDef[] = [
  { code: 'R01', type: 'R', label: 'Utilización principal como combustible u otro modo de producir energía', requiresPriorNotification: false },
  { code: 'R02', type: 'R', label: 'Recuperación o regeneración de disolventes', requiresPriorNotification: false },
  { code: 'R03', type: 'R', label: 'Reciclado o recuperación de sustancias orgánicas (papel, plástico, madera, compostaje)', requiresPriorNotification: false },
  { code: 'R04', type: 'R', label: 'Reciclado o recuperación de metales y de compuestos metálicos', requiresPriorNotification: false },
  { code: 'R05', type: 'R', label: 'Reciclado o recuperación de otras materias inorgánicas (vidrio, RCD, áridos)', requiresPriorNotification: false },
  { code: 'R06', type: 'R', label: 'Regeneración de ácidos o de bases', requiresPriorNotification: false },
  { code: 'R07', type: 'R', label: 'Valorización de componentes utilizados para reducir la contaminación', requiresPriorNotification: false },
  { code: 'R08', type: 'R', label: 'Valorización de componentes procedentes de catalizadores', requiresPriorNotification: false },
  { code: 'R09', type: 'R', label: 'Regeneración u otro nuevo empleo de aceites', requiresPriorNotification: false },
  { code: 'R10', type: 'R', label: 'Tratamiento de los suelos que produzca un beneficio a la agricultura o ecología', requiresPriorNotification: false },
  { code: 'R11', type: 'R', label: 'Utilización de residuos obtenidos a partir de cualquiera de las operaciones R01 a R10', requiresPriorNotification: false },
  { code: 'R12', type: 'R', label: 'Intercambio/pretratamiento de residuos para someterlos a cualquiera de las operaciones R01 a R11', requiresPriorNotification: false },
  { code: 'R13', type: 'R', label: 'Almacenamiento de residuos en espera de cualquiera de las operaciones R01 a R12', requiresPriorNotification: false },
];

export const DISPOSAL_OPERATIONS: TreatmentOperationDef[] = [
  { code: 'D01', type: 'D', label: 'Depósito sobre el suelo o en su interior (vertedero)', requiresPriorNotification: true },
  { code: 'D02', type: 'D', label: 'Tratamiento en medio terrestre', requiresPriorNotification: true },
  { code: 'D03', type: 'D', label: 'Inyección en profundidad', requiresPriorNotification: true },
  { code: 'D04', type: 'D', label: 'Embalse superficial', requiresPriorNotification: true },
  { code: 'D05', type: 'D', label: 'Depósito controlado en lugares especialmente diseñados', requiresPriorNotification: true },
  { code: 'D06', type: 'D', label: 'Vertido en el medio acuático, salvo en el mar', requiresPriorNotification: true },
  { code: 'D07', type: 'D', label: 'Vertido en el mar, incluida la inserción en el lecho marino', requiresPriorNotification: true },
  { code: 'D08', type: 'D', label: 'Tratamiento biológico no especificado en otros apartados', requiresPriorNotification: true },
  { code: 'D09', type: 'D', label: 'Tratamiento físico-químico no especificado en otros apartados', requiresPriorNotification: true },
  { code: 'D10', type: 'D', label: 'Incineración en tierra', requiresPriorNotification: true },
  { code: 'D11', type: 'D', label: 'Incineración en el mar', requiresPriorNotification: true },
  { code: 'D12', type: 'D', label: 'Almacenamiento permanente', requiresPriorNotification: true },
  { code: 'D13', type: 'D', label: 'Combinación o mezcla previa a cualquiera de las operaciones D01 a D12', requiresPriorNotification: true },
  { code: 'D14', type: 'D', label: 'Reenvasado previo a cualquiera de las operaciones D01 a D13', requiresPriorNotification: true },
  { code: 'D15', type: 'D', label: 'Almacenamiento en espera de cualquiera de las operaciones D01 a D14', requiresPriorNotification: true },
];

export const TREATMENT_OPERATIONS: TreatmentOperationDef[] = [
  ...RECOVERY_OPERATIONS,
  ...DISPOSAL_OPERATIONS,
];

const OPERATION_BY_CODE = new Map<string, TreatmentOperationDef>(
  TREATMENT_OPERATIONS.map((op) => [op.code, op])
);

export function normalizeOperationCode(raw?: string | null): string {
  if (!raw) return '';
  return raw.trim().toUpperCase().replace(/^([RD])(\d)$/, '$10$2');
}

export function getOperationDef(code?: string | null): TreatmentOperationDef | undefined {
  const norm = normalizeOperationCode(code);
  return norm ? OPERATION_BY_CODE.get(norm) : undefined;
}

export interface LerOperationSuggestion {
  codes: string[];
  reason: string;
}

/**
 * Devuelve operaciones habituales (orientativas) según código/capítulo LER.
 * Nota: la operación legalmente válida siempre depende de la Autorización Ambiental del gestor.
 */
export function getSuggestedOperationsForLer(codigoLer?: string | null): LerOperationSuggestion {
  const clean = (codigoLer || '').trim().replace(/\s+/g, ' ');
  if (!clean) {
    return {
      codes: ['R13', 'R12', 'R03', 'R04', 'R05'],
      reason: 'Selecciona un código LER para ver sugerencias orientativas según la Ley 7/2022.',
    };
  }

  const isHazardous = clean.includes('*');
  const digitsOnly = clean.replace(/[^0-9]/g, '');

  // Aceites usados (13 02 *)
  if (digitsOnly.startsWith('1302') || digitsOnly.startsWith('1301') || digitsOnly.startsWith('1303')) {
    return {
      codes: ['R09', 'R13', 'R01', 'D09'],
      reason: 'Aceites industriales usados: prioritariamente regeneración (R09) o almacenamiento previo (R13).',
    };
  }

  // Disolventes (14 06 *)
  if (digitsOnly.startsWith('1406')) {
    return {
      codes: ['R02', 'R13', 'R01', 'D09'],
      reason: 'Disolventes orgánicos: recuperación/regeneración (R02) o almacenamiento previo (R13).',
    };
  }

  // Envases contaminados (15 01 10*) y absorbentes contaminados (15 02 02*)
  if (digitsOnly.startsWith('150110') || digitsOnly.startsWith('150202')) {
    return {
      codes: ['R12', 'R13', 'R01', 'D09', 'D15'],
      reason: 'Envases o absorbentes contaminados (RP): pretratamiento (R12), almacenamiento (R13) o tratamiento físico-químico (D09).',
    };
  }

  // Metales y chatarra (12 01 01/02/03/04, 15 01 04, 17 04, 19 12 02/03, 20 01 40)
  if (
    digitsOnly.startsWith('150104') ||
    digitsOnly.startsWith('1704') ||
    digitsOnly.startsWith('191202') ||
    digitsOnly.startsWith('191203') ||
    digitsOnly.startsWith('200140') ||
    digitsOnly.startsWith('120101') ||
    digitsOnly.startsWith('120102') ||
    digitsOnly.startsWith('120103') ||
    digitsOnly.startsWith('120104')
  ) {
    return {
      codes: ['R04', 'R12', 'R13'],
      reason: 'Residuos metálicos: reciclado de metales (R04), clasificación (R12) o almacenamiento previo (R13).',
    };
  }

  // Pilas y baterías (16 06 *, 20 01 33/34)
  if (digitsOnly.startsWith('1606') || digitsOnly.startsWith('200133') || digitsOnly.startsWith('200134')) {
    return {
      codes: ['R04', 'R12', 'R13'],
      reason: 'Pilas y acumuladores: reciclado de metales (R04), desmontaje (R12) o almacenamiento previo (R13).',
    };
  }

  // RAEE / aparatos eléctricos y electrónicos (16 02, 20 01 35/36)
  if (digitsOnly.startsWith('1602') || digitsOnly.startsWith('200135') || digitsOnly.startsWith('200136')) {
    return {
      codes: ['R12', 'R04', 'R13'],
      reason: 'RAEE: descontaminación/desmontaje (R12), recuperación de metales (R04) o almacenamiento (R13).',
    };
  }

  // Papel, cartón, plástico, madera, orgánica (15 01 01/02/03, 20 01 01/08/38/39, 20 02 01, 02)
  if (
    digitsOnly.startsWith('150101') ||
    digitsOnly.startsWith('150102') ||
    digitsOnly.startsWith('150103') ||
    digitsOnly.startsWith('200101') ||
    digitsOnly.startsWith('200108') ||
    digitsOnly.startsWith('200138') ||
    digitsOnly.startsWith('200139') ||
    digitsOnly.startsWith('200201') ||
    digitsOnly.startsWith('02')
  ) {
    return {
      codes: ['R03', 'R12', 'R13'],
      reason: 'Fracción orgánica, papel, plástico o madera: reciclado orgánico (R03), clasificación (R12) o almacenamiento (R13).',
    };
  }

  // Vidrio, RCD, inertes, minerales (01, 15 01 07, 17 01, 17 05, 17 09)
  if (
    digitsOnly.startsWith('01') ||
    digitsOnly.startsWith('150107') ||
    digitsOnly.startsWith('1701') ||
    digitsOnly.startsWith('1705') ||
    digitsOnly.startsWith('1709')
  ) {
    return {
      codes: isHazardous ? ['R13', 'R12', 'D05', 'D15'] : ['R05', 'R12', 'R13', 'D01'],
      reason: isHazardous
        ? 'Residuo inorgánico peligroso: almacenamiento/pretratamiento (R13/R12) o depósito controlado (D05).'
        : 'Vidrio, RCD o minerales inertes: reciclado de materias inorgánicas (R05), clasificación (R12) o almacenamiento (R13).',
    };
  }

  // Fallback general según peligrosidad
  if (isHazardous) {
    return {
      codes: ['R13', 'R12', 'D09', 'D15'],
      reason: 'Residuo peligroso (*): consulta la Autorización Ambiental del gestor (habitualmente R13, R12, D09 o D15).',
    };
  }

  return {
    codes: ['R13', 'R12', 'R03', 'R05'],
    reason: 'Residuo no peligroso: prioriza valorización (R03/R05/R12/R13) según la autorización del gestor destino.',
  };
}

export interface PrioritizedOperationsResult {
  fromContract: TreatmentOperationDef[];
  fromAuthorization: TreatmentOperationDef[];
  suggestedByLer: TreatmentOperationDef[];
  suggestionReason: string;
  recoveryOperations: TreatmentOperationDef[];
  disposalOperations: TreatmentOperationDef[];
}

function toUniqueDefs(codes?: string[] | null): TreatmentOperationDef[] {
  if (!codes || codes.length === 0) return [];
  const seen = new Set<string>();
  const out: TreatmentOperationDef[] = [];
  for (const raw of codes) {
    const norm = normalizeOperationCode(raw);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    const def = OPERATION_BY_CODE.get(norm);
    if (def) {
      out.push(def);
    } else {
      out.push({
        code: norm,
        type: norm.startsWith('D') ? 'D' : 'R',
        label: norm.startsWith('D') ? 'Operación de eliminación' : 'Operación de valorización',
        requiresPriorNotification: norm.startsWith('D'),
      });
    }
  }
  return out;
}

export function getPrioritizedOperations(params: {
  codigoLer?: string | null;
  contractOps?: string[] | null;
  authorizedOps?: string[] | null;
}): PrioritizedOperationsResult {
  const fromContract = toUniqueDefs(params.contractOps);
  const contractSet = new Set(fromContract.map((o) => o.code));

  const fromAuthorization = toUniqueDefs(params.authorizedOps).filter((o) => !contractSet.has(o.code));
  const authSet = new Set([...contractSet, ...fromAuthorization.map((o) => o.code)]);

  const lerSuggestion = getSuggestedOperationsForLer(params.codigoLer);
  const suggestedByLer = toUniqueDefs(lerSuggestion.codes).filter((o) => !authSet.has(o.code));

  return {
    fromContract,
    fromAuthorization,
    suggestedByLer,
    suggestionReason: lerSuggestion.reason,
    recoveryOperations: RECOVERY_OPERATIONS,
    disposalOperations: DISPOSAL_OPERATIONS,
  };
}
