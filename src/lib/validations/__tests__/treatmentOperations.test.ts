import {
  DISPOSAL_OPERATIONS,
  RECOVERY_OPERATIONS,
  TREATMENT_OPERATIONS,
  getOperationDef,
  getPrioritizedOperations,
  getSuggestedOperationsForLer,
  normalizeOperationCode,
} from '../treatmentOperations';

describe('treatmentOperations', () => {
  it('incluye catálogo completo R01-R13 y D01-D15 según Ley 7/2022', () => {
    expect(RECOVERY_OPERATIONS).toHaveLength(13);
    expect(DISPOSAL_OPERATIONS).toHaveLength(15);
    expect(TREATMENT_OPERATIONS).toHaveLength(28);
    expect(DISPOSAL_OPERATIONS.every((op) => op.requiresPriorNotification)).toBe(true);
    expect(RECOVERY_OPERATIONS.every((op) => !op.requiresPriorNotification)).toBe(true);
  });

  it('normaliza códigos R/D de 1 o 2 dígitos y recupera su definición', () => {
    expect(normalizeOperationCode('r3')).toBe('R03');
    expect(normalizeOperationCode(' D1 ')).toBe('D01');
    expect(normalizeOperationCode('R13')).toBe('R13');
    expect(normalizeOperationCode('')).toBe('');
    expect(normalizeOperationCode(null)).toBe('');

    expect(getOperationDef('r4')?.code).toBe('R04');
    expect(getOperationDef('D09')?.requiresPriorNotification).toBe(true);
    expect(getOperationDef('')).toBeUndefined();
    expect(getOperationDef('X99')).toBeUndefined();
  });

  it('sugiere operaciones adecuadas según familia/capítulo LER', () => {
    expect(getSuggestedOperationsForLer('').codes).toContain('R13');
    expect(getSuggestedOperationsForLer('13 02 05*').codes[0]).toBe('R09');
    expect(getSuggestedOperationsForLer('14 06 03*').codes[0]).toBe('R02');
    expect(getSuggestedOperationsForLer('15 01 10*').codes).toContain('R12');
    expect(getSuggestedOperationsForLer('17 04 05').codes[0]).toBe('R04');
    expect(getSuggestedOperationsForLer('16 06 01*').codes[0]).toBe('R04');
    expect(getSuggestedOperationsForLer('20 01 35*').codes[0]).toBe('R12');
    expect(getSuggestedOperationsForLer('15 01 01').codes[0]).toBe('R03');
    expect(getSuggestedOperationsForLer('01 01 01').codes[0]).toBe('R05');
    expect(getSuggestedOperationsForLer('17 05 03*').codes).toContain('D05');
    expect(getSuggestedOperationsForLer('18 01 03*').codes).toContain('D09');
    expect(getSuggestedOperationsForLer('20 03 01').codes).toContain('R13');
  });

  it('prioriza contrato > autorización > sugerencias por LER sin duplicados', () => {
    const res = getPrioritizedOperations({
      codigoLer: '15 01 01',
      contractOps: ['r3', 'R03'],
      authorizedOps: ['R03', 'R13', 'R99'],
    });

    expect(res.fromContract.map((o) => o.code)).toEqual(['R03']);
    expect(res.fromAuthorization.map((o) => o.code)).toEqual(['R13', 'R99']);
    // R03 y R13 ya aparecían en contrato/autorización, así que en sugerencias queda R12
    expect(res.suggestedByLer.map((o) => o.code)).toEqual(['R12']);
    expect(res.suggestionReason).toContain('R03');
  });

  it('soporta códigos personalizados de eliminación (D99) y listas vacías', () => {
    const res = getPrioritizedOperations({
      codigoLer: '13 02 05*',
      contractOps: ['D99', ''],
      authorizedOps: [],
    });
    expect(res.fromContract).toHaveLength(1);
    expect(res.fromContract[0].type).toBe('D');
    expect(res.fromContract[0].requiresPriorNotification).toBe(true);
  });
});
