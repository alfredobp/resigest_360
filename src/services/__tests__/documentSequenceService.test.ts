// =====================================================
// UNIT TESTS: documentSequenceService
// =====================================================

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  rpc: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import documentSequenceService, {
  normalizeCompanyCodeTag,
  resolveE3LNimaParts,
  buildContractCode,
  buildDICode,
  buildNTCode,
  resolveDocumentYear,
} from '../documentSequenceService';

describe('documentSequenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeCompanyCodeTag', () => {
    it('normaliza el CIF eliminando guiones y espacios en mayúsculas', () => {
      expect(normalizeCompanyCodeTag('b-12345678 ', 7)).toBe('B12345678');
    });

    it('usa EMP{companyId} como fallback cuando el CIF está vacío', () => {
      expect(normalizeCompanyCodeTag('', 42)).toBe('EMP42');
      expect(normalizeCompanyCodeTag(null, undefined)).toBe('EMP0');
    });
  });

  describe('resolveE3LNimaParts', () => {
    it('devuelve origen 10 cuando el NIMA tiene 10 dígitos y prefijo provincial INE 01-52', () => {
      expect(resolveE3LNimaParts('1100000001')).toEqual({
        origin: '10',
        validNima: '1100000001',
      });
      expect(resolveE3LNimaParts('52-12345678')).toEqual({
        origin: '10',
        validNima: '5212345678',
      });
    });

    it('devuelve origen 01 y 9999999999 cuando el NIMA es nulo o inválido', () => {
      expect(resolveE3LNimaParts(null)).toEqual({
        origin: '01',
        validNima: '9999999999',
      });
      expect(resolveE3LNimaParts('9900000001')).toEqual({
        origin: '01',
        validNima: '9999999999',
      });
      expect(resolveE3LNimaParts('12345')).toEqual({
        origin: '01',
        validNima: '9999999999',
      });
    });
  });

  describe('builders deterministas de códigos', () => {
    it('buildContractCode genera CT-{CIF}-{AÑO}-{000001}', () => {
      expect(buildContractCode('B12345678', 2026, 1)).toBe('CT-B12345678-2026-000001');
      expect(buildContractCode('B-12345678', 2026, 42)).toBe('CT-B12345678-2026-000042');
      expect(buildContractCode('', 2026, 0, 9)).toBe('CT-EMP9-2026-000001');
    });

    it('buildDICode genera DCSCode válido E3L 3.3 de 26 caracteres', () => {
      const withNima = buildDICode('1100000001', 2026, 15);
      expect(withNima).toBe('DCS10110000000120260000015');
      expect(withNima).toHaveLength(26);

      const withoutNima = buildDICode(undefined, 2026, 3);
      expect(withoutNima).toBe('DCS01999999999920260000003');
      expect(withoutNima).toHaveLength(26);
    });

    it('buildNTCode genera NTCode válido E3L 3.3 de 25 caracteres', () => {
      const withNima = buildNTCode('4100012345', 2026, 7);
      expect(withNima).toBe('NT10410001234520260000007');
      expect(withNima).toHaveLength(25);

      const withoutNima = buildNTCode('', 2026, 2);
      expect(withoutNima).toBe('NT01999999999920260000002');
      expect(withoutNima).toHaveLength(25);
    });

    it('buildContractCode, buildDICode y buildNTCode usan valores por defecto cuando se omiten año y secuencia', () => {
      const currentYear = new Date().getFullYear();
      expect(buildContractCode('B11111111')).toBe(`CT-B11111111-${currentYear}-000001`);
      expect(buildDICode('1100000001')).toBe(`DCS101100000001${currentYear}0000001`);
      expect(buildNTCode('1100000001')).toBe(`NT101100000001${currentYear}0000001`);
    });
  });

  describe('resolveDocumentYear', () => {
    it('extrae el año de fechas YYYY-MM-DD válidas y usa año actual en entradas inválidas', () => {
      const currentYear = new Date().getFullYear();
      expect(resolveDocumentYear('2027-03-15')).toBe(2027);
      expect(resolveDocumentYear('2026-11-21T10:00:00Z')).toBe(2026);
      expect(resolveDocumentYear('1990-01-01')).toBe(currentYear);
      expect(resolveDocumentYear(null)).toBe(currentYear);
      expect(resolveDocumentYear('fecha-invalida')).toBe(currentYear);
    });
  });

  describe('previewNextCode', () => {
    it('lanza error si companyId no es válido', async () => {
      await expect(documentSequenceService.previewNextCode(0, 'contract')).rejects.toThrow(
        'companyId válido'
      );
    });

    it('lanza error si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(documentSequenceService.previewNextCode(5, 'di')).rejects.toThrow(
        'Usuario no autenticado'
      );
    });

    it('devuelve el código calculado por la RPC preview_company_document_code', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      mockSupabase.rpc.mockResolvedValue({
        data: 'CT-B12345678-2026-000008',
        error: null,
      });

      const code = await documentSequenceService.previewNextCode(5, 'contract', {
        year: 2026,
        cif: 'B12345678',
      });

      expect(code).toBe('CT-B12345678-2026-000008');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('preview_company_document_code', {
        p_company_id: 5,
        p_doc_type: 'contract',
        p_year: 2026,
        p_nima: null,
      });
    });

    it('aplica fallback determinista por tipo de documento si la RPC falla o no está desplegada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'function not found' } });

      const contractCode = await documentSequenceService.previewNextCode(5, 'contract', {
        year: 2026,
        cif: 'B99887766',
      });
      expect(contractCode).toBe('CT-B99887766-2026-000001');

      const diCode = await documentSequenceService.previewNextCode(5, 'di', {
        year: 2026,
        nima: '1100000009',
      });
      expect(diCode).toBe('DCS10110000000920260000001');

      mockSupabase.rpc.mockRejectedValueOnce(new Error('network error'));
      const ntCode = await documentSequenceService.previewNextCode(5, 'nt', {
        year: 2026,
        nima: '2800000005',
      });
      expect(ntCode).toBe('NT10280000000520260000001');
    });
  });
});

