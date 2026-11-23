const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
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

    it('debe usar RPC get_deca_by_token cuando está disponible y manejar null o error con fallback', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const mockDoc = { id: 9, token: 'dca_rpc_1' };

      try {
        (mockSupabase as any).rpc = jest.fn()
          .mockResolvedValueOnce({ data: mockDoc, error: null })
          .mockResolvedValueOnce({ data: [mockDoc], error: null })
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValueOnce({ data: null, error: { message: 'rpc missing' } });

        expect(await decaService.getByToken('dca_rpc_1')).toEqual(mockDoc);
        expect(await decaService.getByToken('dca_rpc_arr')).toEqual(mockDoc);
        expect(await decaService.getByToken('dca_rpc_none')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalled();

        // Cuarta llamada devuelve error en RPC y hace fallback a from('deca_documents')
        const maybeSingleMock = jest.fn().mockResolvedValue({ data: mockDoc, error: null });
        const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
        const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
        mockSupabase.from.mockReturnValue({ select: selectMock });

        expect(await decaService.getByToken('dca_rpc_fallback')).toEqual(mockDoc);
      } finally {
        delete (mockSupabase as any).rpc;
        consoleWarnSpy.mockRestore();
      }
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
        transportista_company_id: 105,
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
          company_id: 105,
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

    it('debe lanzar error si la inserción de la nueva versión falla definitivamente y revertir is_vigente', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });

      const insertFailMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Fatal database error on insert version' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: insertFailMock });
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_documents') {
          return {
            update: updateMock,
            insert: jest.fn().mockReturnValue({ select: selectMock }),
          };
        }
        return {};
      });

      await expect(
        decaService.createNewVersion(currentDeca, {}, 'Error forzado')
      ).rejects.toThrow('Error al versionar DeCA: Fatal database error on insert version');

      expect(updateMock).toHaveBeenCalledTimes(2);
      expect(updateMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ is_vigente: false })
      );
      expect(updateMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ is_vigente: true })
      );
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

  describe('getByIdentificationDocument', () => {
    it('debe retornar lista vacía si diId es 0 o falsy', async () => {
      const result = await decaService.getByIdentificationDocument(0);
      expect(result).toEqual([]);
    });

    it('debe consultar documentos DeCA por identification_document_id filtrando por user_id cuando hay sesión', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-1' } },
      });
      const mockDocs = [
        { id: 10, numero_deca: 'DECA-2026-00010', identification_document_id: 120, version: 1, is_vigente: true },
      ];
      const orderMock = jest.fn().mockResolvedValue({ data: mockDocs, error: null });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock, order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getByIdentificationDocument(120);

      expect(mockSupabase.from).toHaveBeenCalledWith('deca_documents');
      expect(eqMock).toHaveBeenCalledWith('identification_document_id', 120);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-deca-1');
      expect(orderMock).toHaveBeenCalledWith('version', { ascending: false });
      expect(result).toEqual(mockDocs);
    });

    it('debe retornar array vacío y registrar error si falla la consulta', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const orderMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getByIdentificationDocument(120);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getLatestActiveVersion', () => {
    it('debe retornar null si currentDoc es falsy', async () => {
      const result = await decaService.getLatestActiveVersion(null as any);
      expect(result).toBeNull();
    });

    it('debe retornar el mismo documento si ya es vigente', async () => {
      const currentDoc = { id: 1, numero_deca: 'DECA-2026-00001', is_vigente: true } as any;
      const result = await decaService.getLatestActiveVersion(currentDoc);
      expect(result).toBe(currentDoc);
    });

    it('debe buscar y retornar la versión vigente si el documento está sustituido', async () => {
      const historicalDoc = { id: 1, user_id: 'user-deca-1', numero_deca: 'DECA-2026-00001', is_vigente: false, version: 1 } as any;
      const activeDoc = { id: 2, numero_deca: 'DECA-2026-00001-v2', is_vigente: true, version: 2 };

      const maybeSingleMock = jest.fn().mockResolvedValue({ data: activeDoc, error: null });
      const limitMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock, order: orderMock });
      const ilikeMock = jest.fn().mockReturnValue({ eq: eqMock });
      const selectMock = jest.fn().mockReturnValue({ ilike: ilikeMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await decaService.getLatestActiveVersion(historicalDoc);

      expect(mockSupabase.from).toHaveBeenCalledWith('deca_documents');
      expect(ilikeMock).toHaveBeenCalledWith('numero_deca', 'DECA-2026-00001%');
      expect(eqMock).toHaveBeenCalledWith('is_vigente', true);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-deca-1');
      expect(result).toEqual(activeDoc);
    });

    it('debe utilizar la RPC get_active_deca_by_token si el documento dispone de token', async () => {
      const activeDoc = { id: 2, numero_deca: 'DECA-2026-00001-v2', is_vigente: true, version: 2 };
      (mockSupabase as any).rpc = jest.fn()
        .mockResolvedValueOnce({ data: activeDoc, error: null })
        .mockResolvedValueOnce({ data: [activeDoc], error: null });

      try {
        const historicalDoc = { id: 1, token: 'tok-hist-1', numero_deca: 'DECA-2026-00001', is_vigente: false, version: 1 } as any;
        const res1 = await decaService.getLatestActiveVersion(historicalDoc);
        expect(res1).toEqual(activeDoc);

        const res2 = await decaService.getLatestActiveVersion(historicalDoc);
        expect(res2).toEqual(activeDoc);
      } finally {
        delete (mockSupabase as any).rpc;
      }
    });

    it('debe hacer fallback a consulta directa si la RPC get_active_deca_by_token falla', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const historicalDoc = { id: 1, user_id: 'user-deca-1', token: 'tok-hist-err', numero_deca: 'DECA-2026-00001', is_vigente: false, version: 1 } as any;
      const activeDoc = { id: 2, numero_deca: 'DECA-2026-00001-v2', is_vigente: true, version: 2 };

      (mockSupabase as any).rpc = jest.fn().mockRejectedValue(new Error('RPC missing'));

      const maybeSingleMock = jest.fn().mockResolvedValue({ data: activeDoc, error: null });
      const limitMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock, order: orderMock });
      const ilikeMock = jest.fn().mockReturnValue({ eq: eqMock });
      const selectMock = jest.fn().mockReturnValue({ ilike: ilikeMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      try {
        const res = await decaService.getLatestActiveVersion(historicalDoc);
        expect(res).toEqual(activeDoc);
      } finally {
        delete (mockSupabase as any).rpc;
        consoleWarnSpy.mockRestore();
      }
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

  describe('filterVigenteServices (UXDEV-04 / UX-12)', () => {
    it('debe garantizar que si v2 está finalizada, v1 nunca aparece como activa en ruta', () => {
      const decas: DecaDocument[] = [
        // v1 histórica de 10 kg
        {
          id: 1,
          numero_deca: 'DECA-2026-00001',
          version: 1,
          is_vigente: false,
          estado: 'vigente', // Estado desfasado en BD
          peso_kg: 10,
        } as any,
        // v2 finalizada de 8 kg
        {
          id: 2,
          numero_deca: 'DECA-2026-00001-v2',
          version: 2,
          is_vigente: true,
          estado: 'finalizado',
          peso_kg: 8,
          fecha_finalizacion: '2026-11-20T10:00:00Z',
        } as any,
      ];

      const { activeDecas, finishedDecas, allLatest } = decaService.filterVigenteServices(decas);

      expect(allLatest).toHaveLength(1);
      expect(allLatest[0].version).toBe(2);
      expect(allLatest[0].peso_kg).toBe(8);

      // v1 no debe aparecer en activeDecas bajo ninguna circunstancia
      expect(activeDecas).toHaveLength(0);

      // v2 debe constar en finishedDecas
      expect(finishedDecas).toHaveLength(1);
      expect(finishedDecas[0].id).toBe(2);
      expect(finishedDecas[0].version).toBe(2);
    });

    it('debe seleccionar exclusivamente la versión más alta activa cuando hay rectificación vigente', () => {
      const decas: DecaDocument[] = [
        {
          id: 10,
          numero_deca: 'DECA-2026-00050',
          version: 1,
          is_vigente: false,
          estado: 'sustituido',
        } as any,
        {
          id: 11,
          numero_deca: 'DECA-2026-00050-v2',
          version: 2,
          is_vigente: true,
          estado: 'en_transito',
        } as any,
      ];

      const { activeDecas, finishedDecas } = decaService.filterVigenteServices(decas);

      expect(activeDecas).toHaveLength(1);
      expect(activeDecas[0].version).toBe(2);
      expect(activeDecas[0].estado).toBe('en_transito');
      expect(finishedDecas).toHaveLength(0);
    });

    it('debe manejar array vacío de forma segura', () => {
      const result = decaService.filterVigenteServices([]);
      expect(result.activeDecas).toEqual([]);
      expect(result.finishedDecas).toEqual([]);
      expect(result.allLatest).toEqual([]);
    });
  });

  describe('modo delegado (company_id desde cookie activa)', () => {
    it('debe asignar automáticamente company_id desde la cookie activa al crear un DeCA en modo delegado', async () => {
      const tenantCtx = await import('../tenantContextService');
      const cookieSpy = jest.spyOn(tenantCtx, 'getActiveCompanyCookie').mockReturnValue(77);

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'consultant-user-1' } },
      });

      const insertSpy = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 500, numero_deca: 'DECA-2026-00099', company_id: 77, version: 1 },
            error: null,
          }),
        }),
      });

      const auditInsertSpy = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_documents') {
          return { insert: insertSpy };
        }
        return { insert: auditInsertSpy };
      });

      const created = await decaService.create({
        numero_deca: 'DECA-2026-00099',
        cargador_razon_social: 'Cargador SA',
        cargador_nif: 'A12345678',
        cargador_domicilio: 'Calle 1',
        cargador_municipio: 'Sevilla',
        cargador_provincia: 'Sevilla',
        transportista_razon_social: 'Trans Delegado SL',
        transportista_nif: 'B87654321',
        origen_direccion: 'Polígono 1',
        origen_municipio: 'Sevilla',
        origen_provincia: 'Sevilla',
        destino_direccion: 'Planta 2',
        destino_municipio: 'Málaga',
        destino_provincia: 'Málaga',
        naturaleza_mercancia: 'Chatarra',
        peso_kg: 1200,
        matricula_tractora: '1234-BBB',
        fecha_transporte: '2026-11-22',
        estado: 'vigente',
      });

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 77,
          user_id: 'consultant-user-1',
        })
      );
      expect(created.company_id).toBe(77);
      cookieSpy.mockRestore();
    });
  });
});
