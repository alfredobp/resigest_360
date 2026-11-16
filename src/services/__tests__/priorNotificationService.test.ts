const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: (_table: string) => ({
    select: (...args: any[]) => {
      mockSelect(...args);
      return {
        eq: (...eqArgs: any[]) => {
          mockEq(...eqArgs);
          return {
            order: mockOrder,
            eq: (...eqArgs2: any[]) => {
              mockEq(...eqArgs2);
              return {
                single: mockSingle,
              };
            },
          };
        },
      };
    },
    insert: (data: any) => {
      mockInsert(data);
      return {
        select: () => ({
          single: mockSingle,
        }),
      };
    },
    update: (data: any) => {
      mockUpdate(data);
      return {
        eq: (...eqArgs: any[]) => {
          mockEq(...eqArgs);
          return {
            eq: (...eqArgs2: any[]) => {
              mockEq(...eqArgs2);
              return {
                select: () => ({
                  single: mockSingle,
                }),
              };
            },
          };
        },
      };
    },
    delete: () => ({
      eq: (...eqArgs: any[]) => {
        mockEq(...eqArgs);
        return {
          eq: (...eqArgs2: any[]) => {
            mockEq(...eqArgs2);
            return mockSingle();
          },
        };
      },
    }),
  }),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import {
  formatNTCode,
  validateNTForE3L,
  priorNotificationService,
} from '../priorNotificationService';

describe('priorNotificationService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-nt-123' } },
      error: null,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('formatNTCode', () => {
    it('mantiene un código válido de 25 caracteres que cumple el patrón E3L', () => {
      const validCode = 'NT10110000000120260000042';
      expect(formatNTCode(validCode, '1100000001')).toBe(validCode);
      expect(priorNotificationService.formatNTCode(validCode, '1100000001')).toBe(validCode);
    });

    it('genera un código canónico cuando el formato previo no cumple la expresión regular', () => {
      const res = formatNTCode('NT-DUMMY', '1100000001', 5);
      const currentYear = new Date().getFullYear().toString();
      expect(res).toBe(`NT101100000001${currentYear}0000005`);
    });

    it('usa origen 01 y NIMA 9999999999 si el NIMA no es válido', () => {
      const res = formatNTCode(null, 'INVALIDO', 'abc');
      const currentYear = new Date().getFullYear().toString();
      expect(res).toBe(`NT019999999999${currentYear}0000001`);
    });
  });

  describe('validateNTForE3L', () => {
    const validNt = {
      operador_cif: 'B11223344',
      productor_cif: 'A12345678',
      gestor_cif: 'B87654321',
      codigo_ler: '150110*',
      operacion_tratamiento: 'R13',
      cantidad_estimada_kg: 5000,
      fecha_fin: '2027-12-31',
      productor_nima: '1100000001',
      gestor_nima: '1100000002',
      productor_municipio: 'Puerto Real',
      gestor_municipio: 'Jerez de la Frontera',
    };

    it('valida con éxito una NT con todos los datos requeridos', () => {
      const result = validateNTForE3L(validNt);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(priorNotificationService.validateForE3L(validNt).valid).toBe(true);
    });

    it('detecta errores de validación si faltan CIFs obligatorios', () => {
      const result = validateNTForE3L({
        ...validNt,
        operador_cif: '',
        productor_cif: '',
        gestor_cif: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('detecta código LER inválido', () => {
      const result = validateNTForE3L({
        ...validNt,
        codigo_ler: '123',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('LER'))).toBe(true);
    });

    it('detecta operación de tratamiento inválida', () => {
      const result = validateNTForE3L({
        ...validNt,
        operacion_tratamiento: 'Z99',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('tratamiento'))).toBe(true);
    });

    it('detecta cantidad estimada menor o igual a 0 y fecha de fin ausente', () => {
      const result = validateNTForE3L({
        ...validNt,
        cantidad_estimada_kg: 0,
        fecha_fin: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('NTResidueQuantity'))).toBe(true);
      expect(result.errors.some((e) => e.includes('fecha de finalización'))).toBe(true);
    });

    it('emite warnings si faltan NIMAs o municipios', () => {
      const result = validateNTForE3L({
        ...validNt,
        productor_nima: '',
        gestor_nima: '',
        productor_municipio: '',
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('exige 10 días de preaviso y máximo 3 años de vigencia (Art. 8.2 y 8.3 RD 553/2020) y acepta R14/R15/R1201', () => {
      const lessThan10Days = validateNTForE3L({
        ...validNt,
        fecha_notificacion: '2026-05-01',
        fecha_inicio: '2026-05-05',
        fecha_fin: '2026-06-01',
      });
      expect(lessThan10Days.valid).toBe(false);
      expect(lessThan10Days.errors.some((e) => e.includes('10 días naturales'))).toBe(true);

      const endBeforeStart = validateNTForE3L({
        ...validNt,
        fecha_notificacion: '2026-05-01',
        fecha_inicio: '2026-05-20',
        fecha_fin: '2026-05-10',
      });
      expect(endBeforeStart.valid).toBe(false);
      expect(endBeforeStart.errors.some((e) => e.includes('anterior a la fecha de inicio'))).toBe(true);

      const moreThan3Years = validateNTForE3L({
        ...validNt,
        fecha_notificacion: '2026-05-01',
        fecha_inicio: '2026-05-20',
        fecha_fin: '2030-05-20',
      });
      expect(moreThan3Years.valid).toBe(false);
      expect(moreThan3Years.errors.some((e) => e.includes('máximo de 3 años'))).toBe(true);

      expect(
        validateNTForE3L({
          ...validNt,
          operacion_tratamiento: 'R14',
          fecha_notificacion: '2026-05-01',
          fecha_inicio: '2026-05-15',
          fecha_fin: '2027-05-15',
        }).valid
      ).toBe(true);
      expect(validateNTForE3L({ ...validNt, operacion_tratamiento: 'R1201' }).valid).toBe(true);
    });
  });

  describe('generateNTXml', () => {
    it('genera el XML <wasteNT> para residuo peligroso con tabla5', () => {
      const xml = priorNotificationService.generateNTXml({
        id: 42,
        numero_notificacion: 'NT10110000000120260000042',
        operador_cif: 'B11223344',
        operador_razon_social: 'Operador Test S.L.',
        operador_nima: '1100000001',
        operador_provincia: 'Cádiz',
        operador_municipio: 'Puerto Real',
        productor_cif: 'A12345678',
        productor_razon_social: 'Productor Test S.A.',
        productor_nima: '1100000002',
        productor_provincia: 'Cádiz',
        gestor_cif: 'B87654321',
        gestor_razon_social: 'Gestor Test S.L.',
        gestor_nima: '1100000003',
        gestor_provincia: 'Cádiz',
        codigo_ler: '150110*',
        peligrosidad: 'peligroso',
        caracteristica_peligrosidad: 'HP4',
        operacion_tratamiento: 'R13',
        cantidad_estimada_kg: 2500,
        descripcion_residuo: 'Envases contaminados',
      });

      expect(xml).toContain('<wasteNT');
      expect(xml).toContain('NTCode="NT10110000000120260000042"');
      expect(xml).toContain('NTFrequency="Periodica"');
      expect(xml).toContain('NTRegional="S"');
      expect(xml).toContain('NTSendtoDestinationAuthority="N"');
      expect(xml).toContain('<NTTransferOperatorData>');
      expect(xml).toContain('<NTProducerData>');
      expect(xml).toContain('<NTAdresseeData>');
      expect(xml).toContain('<NTTransportedResidues>');
      expect(xml).toContain('LERCode="150110"');
      expect(xml).toContain('dangerousResidueType');
      expect(xml).toContain('<table5>HP4</table5>');
      expect(xml).toContain('<table2>R13</table2>');
      expect(xml).toContain('<NTResidueQuantity>2500.000</NTResidueQuantity>');
    });

    it('genera el XML <wasteNT> para residuo no peligroso con P03 y truncado a 3 dígitos en table2', () => {
      const xml = priorNotificationService.generateNTXml({
        id: 10,
        operador_cif: 'B11223344',
        productor_cif: 'A12345678',
        gestor_cif: 'B87654321',
        codigo_ler: '150101',
        peligrosidad: 'no-peligroso',
        operacion_tratamiento: 'R1201',
        cantidad_estimada_kg: 1000,
      });

      expect(xml).toContain('noDangerousResidueType');
      expect(xml).toContain('producerTypeCode="P03"');
      expect(xml).not.toContain('<table5>');
      expect(xml).toContain('<table2>R12</table2>');
      expect(xml).toContain('<process operationIdProcessCode="R1201"/>');
    });
  });

  describe('CRUD operations', () => {
    it('getAll devuelve el listado de notificaciones del usuario', async () => {
      const mockList = [{ id: 1, numero_notificacion: 'NT1' }, { id: 2, numero_notificacion: 'NT2' }];
      mockOrder.mockResolvedValue({ data: mockList, error: null });

      const res = await priorNotificationService.getAll();
      expect(res).toEqual(mockList);
    });

    it('getAll lanza error si el usuario no está autenticado', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(priorNotificationService.getAll()).rejects.toThrow('Usuario no autenticado');
    });

    it('getAll lanza error si supabase falla', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB fail' } });
      await expect(priorNotificationService.getAll()).rejects.toThrow('Error al obtener notificaciones previas');
    });

    it('getById devuelve una notificación específica', async () => {
      const mockItem = { id: 10, numero_notificacion: 'NT10' };
      mockSingle.mockResolvedValue({ data: mockItem, error: null });

      const res = await priorNotificationService.getById(10);
      expect(res).toEqual(mockItem);
    });

    it('getById lanza error si no se encuentra o usuario no auth', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      await expect(priorNotificationService.getById(99)).rejects.toThrow('Notificación Previa no encontrada');

      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(priorNotificationService.getById(10)).rejects.toThrow('Usuario no autenticado');
    });

    it('create inserta y devuelve la notificación creada', async () => {
      const mockCreated = { id: 100, company_id: 1, numero_notificacion: 'NT100' };
      mockSingle.mockResolvedValue({ data: mockCreated, error: null });

      const res = await priorNotificationService.create({ company_id: 1, numero_notificacion: 'NT100' });
      expect(res).toEqual(mockCreated);
    });

    it('create autogenera numero_notificacion E3L cuando viene vacío', async () => {
      const mockCreated = { id: 101, company_id: 1, numero_notificacion: 'NT10110000000220260000001' };
      mockSingle.mockResolvedValue({ data: mockCreated, error: null });

      const res = await priorNotificationService.create({
        company_id: 1,
        numero_notificacion: '   ',
        productor_nima: '1100000002',
      });

      expect(res).toEqual(mockCreated);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          numero_notificacion: expect.stringMatching(/^NT101100000002\d{4}\d{7}$/),
          user_id: 'user-nt-123',
        })
      );
    });

    it('create valida que venga company_id', async () => {
      await expect(priorNotificationService.create({})).rejects.toThrow('Falta el ID de empresa');
    });

    it('create y update rechazan plazos inferiores a 10 días de preaviso o superiores a 3 años', async () => {
      await expect(
        priorNotificationService.create({
          company_id: 1,
          fecha_notificacion: '2026-05-01',
          fecha_inicio: '2026-05-05',
          fecha_fin: '2026-06-01',
        })
      ).rejects.toThrow('10 días naturales');

      await expect(
        priorNotificationService.update(100, {
          fecha_inicio: '2026-05-20',
          fecha_fin: '2030-05-20',
        })
      ).rejects.toThrow('máximo de 3 años');
    });

    it('create lanza error si el usuario no está autenticado', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(priorNotificationService.create({ company_id: 1 })).rejects.toThrow('Usuario no autenticado');
    });

    it('create lanza error si supabase falla', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert error' } });
      await expect(priorNotificationService.create({ company_id: 1 })).rejects.toThrow('Error al crear Notificación Previa');
    });

    it('update actualiza los datos y devuelve el registro', async () => {
      const mockUpdated = { id: 100, estado: 'aceptada' };
      mockSingle.mockResolvedValue({ data: mockUpdated, error: null });

      const res = await priorNotificationService.update(100, { estado: 'aceptada' });
      expect(res).toEqual(mockUpdated);
    });

    it('update lanza error si usuario no auth o falla DB', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(priorNotificationService.update(100, {})).rejects.toThrow('Usuario no autenticado');

      mockSingle.mockResolvedValue({ data: null, error: { message: 'Update error' } });
      await expect(priorNotificationService.update(100, {})).rejects.toThrow('Error al actualizar Notificación Previa');
    });

    it('delete elimina la notificación', async () => {
      mockSingle.mockResolvedValue({ error: null });
      await expect(priorNotificationService.delete(100)).resolves.not.toThrow();
    });

    it('delete lanza error si falla o no auth', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(priorNotificationService.delete(100)).rejects.toThrow('Usuario no autenticado');

      mockSingle.mockResolvedValue({ error: { message: 'Delete error' } });
      await expect(priorNotificationService.delete(100)).rejects.toThrow('Error al eliminar Notificación Previa');
    });
  });

  describe('sendToSira', () => {
    it('llama a la ruta api y devuelve la respuesta satisfactoria', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Aceptada', siraId: 'SIRA-1234' }),
      });

      const res = await priorNotificationService.sendToSira(50);
      expect(res.success).toBe(true);
      expect(res.siraId).toBe('SIRA-1234');
    });

    it('lanza error si la respuesta HTTP es error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Error de validación SIRA' }),
      });

      await expect(priorNotificationService.sendToSira(50)).rejects.toThrow('Error de validación SIRA');
    });

    it('propaga excepciones de red', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await expect(priorNotificationService.sendToSira(50)).rejects.toThrow('Network error');
    });
  });
});
