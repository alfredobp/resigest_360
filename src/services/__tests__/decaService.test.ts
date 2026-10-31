const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import { decaService } from '../decaService';
import type { DecaDocument, DecaFormData } from '@/types/deca';
import type { IdentificationDocument } from '@/types/wasteManagement';

describe('decaService - Módulo DeCA (Documento Electrónico de Control Administrativo)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('debe lanzar error si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(decaService.getAll()).rejects.toThrow('Usuario no autenticado');
    });

    it('debe retornar todos los documentos DeCA del usuario', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      const mockList = [
        { id: 1, numero_deca: 'DECA-2026-00001', user_id: 'user-deca-1' },
      ];

      const order2Mock = jest.fn().mockResolvedValue({ data: mockList, error: null });
      const order1Mock = jest.fn().mockReturnValue({ order: order2Mock });
      const eqMock = jest.fn().mockReturnValue({ order: order1Mock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getAll();

      expect(mockSupabase.from).toHaveBeenCalledWith('deca_documents');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-deca-1');
      expect(result).toEqual(mockList);
    });

    it('debe retornar array vacío y registrar error si falla la consulta', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      const order2Mock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      const order1Mock = jest.fn().mockReturnValue({ order: order2Mock });
      const eqMock = jest.fn().mockReturnValue({ order: order1Mock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getAll();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getById', () => {
    it('debe obtener un DeCA por su ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });
      const mockDoc = { id: 5, numero_deca: 'DECA-2026-00005' };

      const maybeSingleMock = jest.fn().mockResolvedValue({ data: mockDoc, error: null });
      const eqUserMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getById(5);

      expect(eqMock).toHaveBeenCalledWith('id', 5);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-deca-1');
      expect(result).toEqual(mockDoc);
    });

    it('debe retornar null y loguear error si falla la consulta', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB query error' },
      });
      const eqUserMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getById(99);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getByToken', () => {
    it('debe retornar null directamente si el token está vacío', async () => {
      const result = await decaService.getByToken('');
      expect(result).toBeNull();
    });

    it('debe encontrar el documento DeCA por su token de inspección', async () => {
      const mockDoc = { id: 1, token: 'dca_validtoken123' };

      const maybeSingleMock = jest.fn().mockResolvedValue({ data: mockDoc, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getByToken('dca_validtoken123');

      expect(eqMock).toHaveBeenCalledWith('token', 'dca_validtoken123');
      expect(result).toEqual(mockDoc);
    });

    it('debe retornar null y registrar advertencia si no se encuentra la fila', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getByToken('dca_nonexistent');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No se encontró fila'),
        'dca_nonexistent'
      );
      consoleWarnSpy.mockRestore();
    });

    it('debe retornar null y registrar error si Supabase falla', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getByToken('dca_errortoken');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getNextNumero', () => {
    it('debe generar DECA-AÑO-00001 si no hay documentos previos en el año', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-deca-1' } } });
      const currentYear = new Date().getFullYear();

      const limitMock = jest.fn().mockResolvedValue({ data: [], error: null });
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const ilikeMock = jest.fn().mockReturnValue({ eq: eqMock, order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ ilike: ilikeMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getNextNumero();

      expect(result).toBe(`DECA-${currentYear}-00001`);
    });

    it('debe calcular el siguiente número correlativo si ya existen documentos previos', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-deca-1' } } });
      const currentYear = new Date().getFullYear();

      const limitMock = jest.fn().mockResolvedValue({
        data: [{ numero_deca: `DECA-${currentYear}-00042` }],
        error: null,
      });
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const ilikeMock = jest.fn().mockReturnValue({ eq: eqMock, order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ ilike: ilikeMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getNextNumero();

      expect(result).toBe(`DECA-${currentYear}-00043`);
    });
  });

  describe('create', () => {
    const validFormData: DecaFormData = {
      numero_deca: 'DECA-2026-00001',
      cargador_razon_social: 'Cargador Test S.L.',
      cargador_nif: 'B11111111',
      cargador_domicilio: 'Calle Test 1',
      transportista_razon_social: 'Trans Test S.A.',
      transportista_nif: 'A22222222',
      origen_direccion: 'Origen 1',
      origen_municipio: 'Madrid',
      origen_provincia: 'Madrid',
      destino_direccion: 'Destino 1',
      destino_municipio: 'Toledo',
      destino_provincia: 'Toledo',
      naturaleza_mercancia: 'Residuos',
      peso_kg: 1000,
      matricula_tractora: '1234-ABC',
      fecha_transporte: '2026-10-24',
      estado: 'vigente',
    };

    it('debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(decaService.create(validFormData)).rejects.toThrow('Usuario no autenticado');
    });

    it('debe crear un nuevo DeCA con token y registrar auditoría', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      const createdDoc = {
        id: 10,
        ...validFormData,
        numero_deca: 'DECA-2026-00001',
        token: 'dca_mockedtoken',
        user_id: 'user-deca-1',
      };

      const singleMock = jest.fn().mockResolvedValue({ data: createdDoc, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_documents') {
          return {
            insert: insertMock,
            select: jest.fn().mockReturnValue({
              ilike: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'deca_audit_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await decaService.create(validFormData);

      expect(result).toEqual(createdDoc);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cargador_razon_social: 'Cargador Test S.L.',
          version: 1,
          is_vigente: true,
          token: expect.stringMatching(/^dca_[a-z0-9]{32}$/),
        })
      );
    });

    it('debe lanzar error si falla la inserción en Supabase', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      await expect(decaService.create({ ...validFormData, numero_deca: 'CUSTOM-1' })).rejects.toThrow(
        'Error al crear documento DeCA: Insert failed'
      );
    });
  });

  describe('createFromIdentificationDocument', () => {
    it('debe mapear correctamente un Documento de Identificación a formato DeCA', async () => {
      const mockDI: Partial<IdentificationDocument> = {
        id: 77,
        company_id: 2,
        numero_documento: 'DI-2026-00077',
        productor_razon_social: 'Productor Origen',
        productor_cif: 'B99999999',
        productor_direccion: 'Polígono Origen',
        productor_municipio: 'Madrid',
        productor_provincia: 'Madrid',
        productor_nima: '2800000001',
        gestor_direccion: 'Instalación Gestor',
        gestor_municipio: 'Pinto',
        gestor_provincia: 'Madrid',
        gestor_nima: '2800000002',
        transportista_razon_social: 'Transportes Rápidos',
        transportista_cif: 'A33333333',
        transportista_direccion: 'C/ Transporte 1',
        transportista_nima: '2800000003',
        descripcion_residuo: 'Aceite usado',
        codigo_ler: '13 02 05*',
        peligrosidad: 'peligroso',
        cantidad: 5,
        unidad: 'toneladas', // 5 toneladas = 5000 kg
        fecha_documento: '2026-10-24',
      };

      const cargadorData = {
        cargador_razon_social: 'Empresa Cargadora S.L.',
        cargador_nif: 'B44444444',
        cargador_domicilio: 'C/ Central 10',
        matricula_tractora: '5678-DEF',
      };

      const spyCreate = jest.spyOn(decaService, 'create').mockResolvedValue({ id: 99 } as any);

      await decaService.createFromIdentificationDocument(mockDI as IdentificationDocument, cargadorData);

      expect(spyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          identification_document_id: 77,
          peso_kg: 5000,
          cargador_razon_social: 'Empresa Cargadora S.L.',
          es_residuo_peligroso: true,
          matricula_tractora: '5678-DEF',
          numero_di: 'DI-2026-00077',
        })
      );

      spyCreate.mockRestore();
    });

    it('debe aplicar los valores por defecto si los datos del cargador y DI están incompletos', async () => {
      const minimalDI: Partial<IdentificationDocument> = {
        id: 88,
        cantidad: 300,
        unidad: 'kg', // no es toneladas
        codigo_ler: '20 01 01',
        peligrosidad: 'no-peligroso',
        fecha_recogida: '2026-10-25',
      };

      const spyCreate = jest.spyOn(decaService, 'create').mockResolvedValue({ id: 100 } as any);

      await decaService.createFromIdentificationDocument(minimalDI as IdentificationDocument, {} as any);

      expect(spyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          peso_kg: 300,
          cargador_razon_social: undefined,
          cargador_domicilio: 'No especificado',
          cargador_municipio: 'No especificado',
          cargador_provincia: 'No especificado',
          transportista_razon_social: 'No especificado',
          transportista_nif: 'No especificado',
          origen_direccion: 'Instalación del Productor',
          origen_municipio: 'No especificado',
          destino_direccion: 'Instalación de Tratamiento de Destino',
          destino_municipio: 'No especificado',
          es_residuo_peligroso: false,
          matricula_tractora: 'PENDIENTE',
          fecha_transporte: '2026-10-25',
        })
      );

      spyCreate.mockRestore();
    });
  });

  describe('createNewVersion (Versionado inmutable)', () => {
    const currentDeca: DecaDocument = {
      id: 1,
      user_id: 'user-deca-1',
      numero_deca: 'DECA-2026-00001',
      version: 1,
      is_vigente: true,
      token: 'dca_tok1',
      cargador_razon_social: 'Cargador Original',
      cargador_nif: 'B11111111',
      cargador_domicilio: 'Dir',
      transportista_razon_social: 'Trans',
      transportista_nif: 'B22222222',
      origen_direccion: 'O',
      origen_municipio: 'Madrid',
      origen_provincia: 'Madrid',
      destino_direccion: 'D',
      destino_municipio: 'Toledo',
      destino_provincia: 'Toledo',
      naturaleza_mercancia: 'M',
      peso_kg: 500,
      matricula_tractora: '1111-AAA',
      fecha_transporte: '2026-10-24',
      estado: 'vigente',
      created_at: '2026-10-24T00:00:00Z',
      updated_at: '2026-10-24T00:00:00Z',
    };

    it('debe fallar si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        decaService.createNewVersion(currentDeca, { peso_kg: 600 }, 'Cambio de peso')
      ).rejects.toThrow('Usuario no autenticado');
    });

    it('debe marcar la versión anterior como no vigente y crear la versión 2', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      const updatedPreviousMock = jest.fn().mockResolvedValue({ error: null });
      const eqUpdateMock = jest.fn().mockReturnValue({ eq: updatedPreviousMock });

      const singleInsertMock = jest.fn().mockResolvedValue({
        data: { ...currentDeca, id: 2, version: 2, previous_version_id: 1, peso_kg: 600 },
        error: null,
      });
      const selectInsertMock = jest.fn().mockReturnValue({ single: singleInsertMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectInsertMock });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_documents') {
          return {
            update: jest.fn().mockReturnValue({ eq: eqUpdateMock }),
            insert: insertMock,
          };
        }
        if (table === 'deca_audit_logs') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      const result = await decaService.createNewVersion(
        currentDeca,
        { peso_kg: 600 },
        'Ajuste tras pesada'
      );

      expect(result.version).toBe(2);
      expect(result.peso_kg).toBe(600);
    });

    it('debe manejar fallback de número con sufijo -v2 si hay conflicto de unicidad', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      // Primer insert falla con deca_documents_numero_deca_key
      const firstInsertFail = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'duplicate key value violates unique constraint deca_documents_numero_deca_key' },
      });
      const secondInsertSuccess = jest.fn().mockResolvedValue({
        data: { ...currentDeca, id: 3, version: 2, numero_deca: 'DECA-2026-00001-v2' },
        error: null,
      });

      let callCount = 0;
      const selectInsertMock = jest.fn().mockImplementation(() => ({
        single: () => {
          callCount++;
          return callCount === 1 ? firstInsertFail() : secondInsertSuccess();
        },
      }));

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_documents') {
          return {
            update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }),
            insert: jest.fn().mockReturnValue({ select: selectInsertMock }),
          };
        }
        if (table === 'deca_audit_logs') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      const result = await decaService.createNewVersion(currentDeca, {}, 'Reintento con sufijo');

      expect(result.numero_deca).toBe('DECA-2026-00001-v2');
    });

    it('debe lanzar error si la inserción de la nueva versión falla definitivamente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      const insertFailMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Fatal database error on insert version' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: insertFailMock });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_documents') {
          return {
            update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }),
            insert: jest.fn().mockReturnValue({ select: selectMock }),
          };
        }
        return {};
      });

      await expect(
        decaService.createNewVersion(currentDeca, {}, 'Error forzado')
      ).rejects.toThrow('Error al versionar DeCA: Fatal database error on insert version');
    });
  });

  describe('finalizeService y logAudit', () => {
    it('logAudit debe capturar excepciones sin romper el flujo', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_audit_logs') {
          return {
            insert: jest.fn().mockRejectedValue(new Error('Audit table down')),
          };
        }
        return {};
      });

      await expect(
        decaService.logAudit(1, 'creacion', 1, { test: true })
      ).resolves.toBeUndefined();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Advertencia al registrar auditoría DeCA:'),
        expect.anything()
      );
      consoleWarnSpy.mockRestore();
    });

    it('finalizeService debe marcar estado como finalizado y registrar fecha_finalizacion', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });
      const finalizedDoc = { id: 1, estado: 'finalizado', version: 1 };

      const singleMock = jest.fn().mockResolvedValue({ data: finalizedDoc, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqUserMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_documents') {
          return { update: updateMock };
        }
        if (table === 'deca_audit_logs') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      const result = await decaService.finalizeService(1);

      expect(result.estado).toBe('finalizado');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'finalizado',
          fecha_finalizacion: expect.any(String),
        })
      );
    });

    it('finalizeService debe lanzar error si falla la actualización en Supabase', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqUserMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(decaService.finalizeService(1)).rejects.toThrow(
        'Error al finalizar servicio DeCA: Update failed'
      );
    });
  });

  describe('isTokenExpired', () => {
    it('debe retornar false si el DeCA no está finalizado', () => {
      const doc = { fecha_finalizacion: undefined } as any;
      expect(decaService.isTokenExpired(doc)).toBe(false);
    });

    it('debe retornar false si la finalización ocurrió hace menos de 7 días', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const doc = { fecha_finalizacion: threeDaysAgo } as any;

      expect(decaService.isTokenExpired(doc)).toBe(false);
    });

    it('debe retornar true si han transcurrido más de 7 días naturales desde la finalización', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const doc = { fecha_finalizacion: tenDaysAgo } as any;

      expect(decaService.isTokenExpired(doc)).toBe(true);
    });
  });
});
