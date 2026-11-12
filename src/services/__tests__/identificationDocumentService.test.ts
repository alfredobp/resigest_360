const mockStorageFrom = {
  upload: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(() => mockStorageFrom),
  },
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

if (typeof atob === 'undefined') {
  (global as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

const mockSyncEntryFromDI = jest.fn();
jest.mock('@/services/chronologicalRegistryService', () => ({
  syncEntryFromDI: (...args: any[]) => mockSyncEntryFromDI(...args),
}));

import {
  identificationDocumentService,
  getTrackingStatusMeta,
} from '../identificationDocumentService';
import type { IdentificationDocument } from '@/types/wasteManagement';

describe('identificationDocumentService - Entidad Documentos de Identificación (DI)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDocumentNumber', () => {
    it('debe generar un número de documento con el formato NIMA + AÑO + 7 DÍGITOS', () => {
      const nima = '2800000001';
      const docNumber = identificationDocumentService.generateDocumentNumber(nima);
      const currentYear = new Date().getFullYear().toString();

      expect(docNumber.startsWith(`${nima}${currentYear}`)).toBe(true);
      expect(docNumber.length).toBe(nima.length + currentYear.length + 7);
    });
  });

  describe('getAll', () => {
    it('debe lanzar error si el usuario no está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(identificationDocumentService.getAll()).rejects.toThrow(
        'Usuario no autenticado'
      );
    });

    it('debe devolver todos los documentos del usuario ordenados por fecha', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-1' } },
      });

      const mockDocs = [
        { id: 1, numero_documento: 'DI-001', user_id: 'user-uuid-1' },
        { id: 2, numero_documento: 'DI-002', user_id: 'user-uuid-1' },
      ];

      const orderMock = jest.fn().mockResolvedValue({ data: mockDocs, error: null });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await identificationDocumentService.getAll();

      expect(mockSupabase.from).toHaveBeenCalledWith('identification_documents');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-uuid-1');
      expect(orderMock).toHaveBeenCalledWith('fecha_documento', { ascending: false });
      expect(result).toEqual(mockDocs);
    });

    it('debe lanzar error si la consulta a Supabase falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-1' } },
      });

      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database query failed' },
      });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(identificationDocumentService.getAll()).rejects.toThrow(
        'Error al obtener documentos: Database query failed'
      );
    });
  });

  describe('getById', () => {
    it('debe devolver un documento por su ID filtrando por user_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } });
      const mockDoc = { id: 10, numero_documento: 'DI-010' };

      const singleMock = jest.fn().mockResolvedValue({ data: mockDoc, error: null });
      const eqUserMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await identificationDocumentService.getById(10);

      expect(eqMock).toHaveBeenCalledWith('id', 10);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-1');
      expect(result).toEqual(mockDoc);
    });

    it('debe lanzar error si no hay usuario o si falla al obtener el documento', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(identificationDocumentService.getById(99)).rejects.toThrow('Usuario no autenticado');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } });
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Doc not found' },
      });
      const eqUserMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(identificationDocumentService.getById(99)).rejects.toThrow(
        'Error al obtener documento: Doc not found'
      );
    });
  });

  describe('getByContract', () => {
    it('debe devolver documentos filtrados por contrato y user_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } });
      const mockDocs = [{ id: 1, contract_id: 5 }];

      const orderMock = jest.fn().mockResolvedValue({ data: mockDocs, error: null });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await identificationDocumentService.getByContract(5);

      expect(eqMock).toHaveBeenCalledWith('contract_id', 5);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-1');
      expect(result).toEqual(mockDocs);
    });

    it('debe lanzar error si no hay usuario o si falla la consulta por contrato', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(identificationDocumentService.getByContract(5)).rejects.toThrow('Usuario no autenticado');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } });
      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Contract query error' },
      });
      const eqUserMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(identificationDocumentService.getByContract(5)).rejects.toThrow(
        'Error al obtener documentos: Contract query error'
      );
    });
  });

  describe('create, update y delete', () => {
    it('create debe fallar si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(identificationDocumentService.create({})).rejects.toThrow(
        'Usuario no autenticado'
      );
    });

    it('create debe insertar el documento asignando user_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-1' } },
      });

      const payload = { numero_documento: 'DI-NEW', cantidad: 100 };
      const createdDoc = { id: 15, ...payload, user_id: 'user-uuid-1' };

      const singleMock = jest.fn().mockResolvedValue({ data: createdDoc, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await identificationDocumentService.create(payload);

      expect(insertMock).toHaveBeenCalledWith({
        ...payload,
        user_id: 'user-uuid-1',
      });
      expect(result).toEqual(createdDoc);
    });

    it('create debe lanzar error si Supabase falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-uuid-1' } },
      });

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      await expect(identificationDocumentService.create({})).rejects.toThrow(
        'Error al crear documento: Insert failed'
      );
    });

    it('update debe actualizar los campos del documento filtrando por user_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } });
      const updateData = { cantidad: 200 };
      const updatedDoc = { id: 5, cantidad: 200 };

      const singleMock = jest.fn().mockResolvedValue({ data: updatedDoc, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqUserMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      const result = await identificationDocumentService.update(5, updateData);

      expect(updateMock).toHaveBeenCalledWith(updateData);
      expect(eqMock).toHaveBeenCalledWith('id', 5);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-1');
      expect(result).toEqual(updatedDoc);
    });

    it('update debe lanzar error si no hay usuario o si falla en Supabase', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(identificationDocumentService.update(5, {})).rejects.toThrow('Usuario no autenticado');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } });
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update error' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqUserMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(identificationDocumentService.update(5, {})).rejects.toThrow(
        'Error al actualizar documento: Update error'
      );
    });

    it('delete debe eliminar el documento filtrando por user_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } });
      const eqUserMock = jest.fn().mockResolvedValue({ error: null });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ delete: deleteMock });

      await expect(identificationDocumentService.delete(7)).resolves.toBeUndefined();
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 7);
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-uuid-1');
    });

    it('delete debe lanzar error si no hay usuario o si falla', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(identificationDocumentService.delete(7)).rejects.toThrow('Usuario no autenticado');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } });
      const eqUserMock = jest.fn().mockResolvedValue({ error: { message: 'Delete constraint' } });
      const eqMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ delete: deleteMock });

      await expect(identificationDocumentService.delete(7)).rejects.toThrow(
        'Error al eliminar documento: Delete constraint'
      );
    });
  });

  describe('updateStatus y signDocument', () => {
    it('updateStatus debe delegar en update pasando el estado', async () => {
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1 } as any);

      await identificationDocumentService.updateStatus(1, 'completado');

      expect(spyUpdate).toHaveBeenCalledWith(1, { estado: 'completado' });
      spyUpdate.mockRestore();
    });

    it.each([
      ['productor', 'firmado_productor', 'fecha_firma_productor'],
      ['gestor', 'firmado_gestor', 'fecha_firma_gestor'],
      ['transportista', 'firmado_transportista', 'fecha_firma_transportista'],
    ])('signDocument debe firmar como %s registrando booleano y fecha', async (role, flagKey, dateKey) => {
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1 } as any);

      await identificationDocumentService.signDocument(1, role as any);

      expect(spyUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        [flagKey]: true,
        [dateKey]: expect.any(String),
      }));
      spyUpdate.mockRestore();
    });

    it('uploadSignatureImage debe subir la imagen a storage y devolver la url publica', async () => {
      mockStorageFrom.upload.mockResolvedValue({ error: null });
      mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/sig.png' } });

      const url = await identificationDocumentService.uploadSignatureImage(
        1,
        'productor',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII='
      );

      expect(url).toBe('https://example.com/sig.png');
      expect(mockStorageFrom.upload).toHaveBeenCalled();
    });

    it('uploadSignatureImage debe lanzar error si storage falla', async () => {
      mockStorageFrom.upload.mockResolvedValue({ error: { message: 'Bucket not found' } });

      await expect(
        identificationDocumentService.uploadSignatureImage(1, 'gestor', 'data:image/png;base64,abc')
      ).rejects.toThrow('Error al subir firma: Bucket not found');
    });

    it('signDocument con signatureBase64 y signerInfo debe registrar URL y datos de intervinientes', async () => {
      jest.spyOn(identificationDocumentService, 'uploadSignatureImage').mockResolvedValue('https://example.com/sig-prod.png');
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1 } as any);

      await identificationDocumentService.signDocument(
        1,
        'productor',
        'data:image/png;base64,dummy',
        { nombre: 'Juan Productor', dni: '12345678A' }
      );

      expect(spyUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        firmado_productor: true,
        firma_productor_url: 'https://example.com/sig-prod.png',
        nombre_productor: 'Juan Productor',
        dni_productor: '12345678A',
      }));

      await identificationDocumentService.signDocument(
        1,
        'gestor',
        'data:image/png;base64,dummy',
        { nombre: 'Pedro Gestor', dni: '87654321B' }
      );
      expect(spyUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        firmado_gestor: true,
        firma_gestor_url: 'https://example.com/sig-prod.png',
        nombre_gestor: 'Pedro Gestor',
        dni_gestor: '87654321B',
      }));

      await identificationDocumentService.signDocument(
        1,
        'transportista',
        'data:image/png;base64,dummy',
        { nombre: 'Carlos Chofer', dni: '11223344C' }
      );
      expect(spyUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        firmado_transportista: true,
        firma_transportista_url: 'https://example.com/sig-prod.png',
        nombre_transportista: 'Carlos Chofer',
        dni_transportista: '11223344C',
      }));

      spyUpdate.mockRestore();
    });
  });

  describe('Ciclo de vida del traslado (departure, reception, incident, treatment)', () => {
    it('recordDeparture debe marcar traslado en_transito y firma de transportista', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 1,
        codigo_ler: '15 01 01',
        operacion_tratamiento: 'R13',
        contract_id: 10,
        contract: {
          id: 10,
          estado: 'vigente',
          contract_waste_codes: [{ codigo_ler: '15 01 01', operacion_tratamiento: 'R13' }],
        },
      } as any);
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1 } as any);

      await identificationDocumentService.recordDeparture(1, {
        fecha_salida: '2026-10-24T08:00:00Z',
        transportista_matricula: '1234-XYZ',
      });

      expect(spyUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        transportista_matricula: '1234-XYZ',
        estado_traslado: 'en_transito',
        firmado_transportista: true,
      }));
      spyUpdate.mockRestore();
    });

    it('recordDeparture con signatureBase64 debe subir firma y guardarla', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 1,
        codigo_ler: '15 01 01',
        operacion_tratamiento: 'R13',
        contract_id: 10,
        contract: {
          id: 10,
          estado: 'vigente',
          contract_waste_codes: [{ codigo_ler: '15 01 01', operacion_tratamiento: 'R13' }],
        },
      } as any);
      jest.spyOn(identificationDocumentService, 'uploadSignatureImage').mockResolvedValue('https://example.com/sig-trans.png');
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1 } as any);

      await identificationDocumentService.recordDeparture(1, {
        fecha_salida: '2026-10-24T08:00:00Z',
        transportista_matricula: '1234-XYZ',
        signatureBase64: 'data:image/png;base64,transp',
      });

      expect(spyUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        firma_transportista_url: 'https://example.com/sig-trans.png',
        estado_traslado: 'en_transito',
        firmado_transportista: true,
      }));
      spyUpdate.mockRestore();
    });

    it('recordReception debe calcular discrepancias y disparar sincronización con Archivo Cronológico si es aceptado', async () => {
      const mockDoc = {
        id: 1,
        unidad: 'toneladas',
        cantidad: 2, // 2 toneladas = 2000 kg
      } as any;

      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(mockDoc);
      const updatedDoc = { id: 1, estado_traslado: 'aceptado' } as any;
      jest.spyOn(identificationDocumentService, 'update').mockResolvedValue(updatedDoc);

      const result = await identificationDocumentService.recordReception(1, {
        fecha_llegada_destino: '2026-10-24T12:00:00Z',
        peso_destino_kg: 1950,
        resultado_recepcion: 'aceptado',
      });

      expect(identificationDocumentService.update).toHaveBeenCalledWith(1, expect.objectContaining({
        peso_origen_kg: 2000,
        diferencia_peso_kg: -50,
        porcentaje_discrepancia: -2.5,
        estado_traslado: 'aceptado',
        firmado_gestor: true,
      }));
      expect(mockSyncEntryFromDI).toHaveBeenCalledWith(updatedDoc);
      expect(result).toEqual(updatedDoc);
    });

    it('recordReception con signatureBase64 debe subir firma y guardarla', async () => {
      jest.spyOn(identificationDocumentService, 'uploadSignatureImage').mockResolvedValue('https://example.com/sig-gestor.png');
      const mockDoc = { id: 1, peso_origen_kg: 500, cantidad: 500 } as any;
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(mockDoc);
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1, estado_traslado: 'aceptado' } as any);

      await identificationDocumentService.recordReception(1, {
        fecha_llegada_destino: '2026-10-24T12:00:00Z',
        peso_destino_kg: 500,
        resultado_recepcion: 'aceptado',
        signatureBase64: 'data:image/png;base64,gest',
      });

      expect(spyUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        firma_gestor_url: 'https://example.com/sig-gestor.png',
        firmado_gestor: true,
      }));
      spyUpdate.mockRestore();
    });

    it('recordReception debe manejar rechazos parciales y sincronización fallida sin propagar error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockSyncEntryFromDI.mockRejectedValueOnce(new Error('Sync failed'));

      const mockDoc = {
        id: 1,
        peso_origen_kg: 1000,
        cantidad: 1000,
      } as any;

      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(mockDoc);
      jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1, estado_traslado: 'aceptado' } as any);

      // Prueba con sync fallido en aceptado
      await identificationDocumentService.recordReception(1, {
        fecha_llegada_destino: '2026-10-24T12:00:00Z',
        peso_destino_kg: 950,
        resultado_recepcion: 'aceptado',
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('no se pudo sincronizar automáticamente'),
        expect.anything()
      );

      // Prueba con rechazado_total
      jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1, estado_traslado: 'rechazado_total' } as any);
      const resTotal = await identificationDocumentService.recordReception(1, {
        fecha_llegada_destino: '2026-10-24T12:00:00Z',
        peso_destino_kg: 0,
        resultado_recepcion: 'rechazado_total',
      });
      expect(resTotal.estado_traslado).toBe('rechazado_total');

      // Prueba con resultado_recepcion 'recepcionado' genérico
      jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1, estado_traslado: 'recepcionado' } as any);
      const resGenerico = await identificationDocumentService.recordReception(1, {
        fecha_llegada_destino: '2026-10-24T12:00:00Z',
        peso_destino_kg: 500,
        resultado_recepcion: 'otro' as any,
      });
      expect(resGenerico.estado_traslado).toBe('recepcionado');

      consoleWarnSpy.mockRestore();
    });

    it('completeTreatment debe capturar error si la sincronización falla sin detener el flujo', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockSyncEntryFromDI.mockRejectedValueOnce(new Error('Sync failed in completeTreatment'));

      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 1,
        codigo_ler: '15 01 01',
        operacion_tratamiento: 'R13',
        estado: 'activo',
        estado_traslado: 'aceptado',
        tipo_notificacion: 'sin-notificacion',
      } as any);

      const updatedDoc = { id: 1, estado_traslado: 'tratado', estado: 'completado' } as any;
      jest.spyOn(identificationDocumentService, 'update').mockResolvedValue(updatedDoc);

      const result = await identificationDocumentService.completeTreatment(1, {
        operacion_tratamiento: 'R03',
        descripcion_tratamiento: 'Reciclado de papel',
      });

      expect(result).toEqual(updatedDoc);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('recordIncident debe registrar la incidencia y actualizar el estado', async () => {
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1 } as any);

      await identificationDocumentService.recordIncident(1, {
        tipo_incidencia: 'discrepancia_peso',
        motivo_incidencia: 'Exceso de agua en residuo',
        resultado_recepcion: 'rechazado_parcial',
        cantidad_rechazada_kg: 150,
      });

      expect(spyUpdate).toHaveBeenCalledWith(1, {
        tipo_incidencia: 'discrepancia_peso',
        motivo_incidencia: 'Exceso de agua en residuo',
        resultado_recepcion: 'rechazado_parcial',
        cantidad_rechazada_kg: 150,
        estado_traslado: 'rechazado_parcial',
      });
      spyUpdate.mockRestore();
    });

    it('completeTreatment debe certificar tratamiento y cerrar documento con sync', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 1,
        codigo_ler: '15 01 01',
        operacion_tratamiento: 'R13',
        estado: 'activo',
        estado_traslado: 'aceptado',
        tipo_notificacion: 'sin-notificacion',
      } as any);

      const updatedDoc = { id: 1, estado_traslado: 'tratado', estado: 'completado' } as any;
      jest.spyOn(identificationDocumentService, 'update').mockResolvedValue(updatedDoc);

      await identificationDocumentService.completeTreatment(1, {
        operacion_tratamiento: 'R03',
        descripcion_tratamiento: 'Reciclado de papel',
      });

      expect(identificationDocumentService.update).toHaveBeenCalledWith(1, expect.objectContaining({
        operacion_tratamiento: 'R13',
        operacion_tratamiento_ejecutada: 'R03',
        estado_traslado: 'tratado',
        estado: 'completado',
      }));
      expect(mockSyncEntryFromDI).toHaveBeenCalledWith(updatedDoc);
    });

    it('recordDeparture debe bloquear la salida sin contrato vinculado ni acreditación externa y validar contratos/autorizaciones', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

      // 1. Sin contrato ni acreditación externa
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 50,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        tipo_notificacion: 'sin-notificacion',
      } as any);

      await expect(
        identificationDocumentService.recordDeparture(50, {
          fecha_salida: '2026-11-10T12:40',
        })
      ).rejects.toThrow('art. 5 RD 553/2020');

      // 2. Contrato vinculado no encontrado
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 51,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        contract_id: 999,
      } as any);
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }));
      await expect(
        identificationDocumentService.recordDeparture(51, { fecha_salida: '2026-11-10T12:40' })
      ).rejects.toThrow('no existe o no es accesible');

      // 3. Contrato en borrador / vencido / LER no incluido
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 52,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        contract_id: 10,
        contract: { id: 10, numero_contrato: 'CT-1', estado: 'borrador', contract_waste_codes: [{ codigo_ler: '17 04 05' }] },
      } as any);
      await expect(
        identificationDocumentService.recordDeparture(52, { fecha_salida: '2026-11-10T12:40' })
      ).rejects.toThrow("estado 'borrador'");

      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 53,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        contract_id: 10,
        contract: { id: 10, numero_contrato: 'CT-1', estado: 'vigente', fecha_fin: '2020-01-01', contract_waste_codes: [{ codigo_ler: '17 04 05' }] },
      } as any);
      await expect(
        identificationDocumentService.recordDeparture(53, { fecha_salida: '2026-11-10T12:40' })
      ).rejects.toThrow('venció');

      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 54,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        contract_id: 10,
        contract: { id: 10, numero_contrato: 'CT-1', estado: 'vigente', codigos_ler: ['20 01 01'], contract_waste_codes: [{ codigo_ler: '20 01 01' }] },
      } as any);
      await expect(
        identificationDocumentService.recordDeparture(54, { fecha_salida: '2026-11-10T12:40' })
      ).rejects.toThrow('no está incluido en el contrato');

      // 4. Con contrato externo acreditado debe permitir salida y preservar fecha_salida ISO
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 55,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        tipo_notificacion: 'sin-notificacion',
      } as any);
      const spyUpd = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 55, estado_traslado: 'en_transito' } as any);
      await identificationDocumentService.recordDeparture(55, {
        fecha_salida: '2026-11-10T12:40',
        contrato_externo_referencia: 'EXT-2026-01',
        contrato_externo_evidencia_url: 'https://storage/ext.pdf',
      });
      expect(spyUpd).toHaveBeenCalledWith(55, expect.objectContaining({
        estado_traslado: 'en_transito',
        contrato_externo_referencia: 'EXT-2026-01',
      }));
      spyUpd.mockRestore();
    });

    it('completeTreatment debe bloquear operaciones no autorizadas (D01), conservar prevista/ejecutada y soportar idempotencia', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

      // 1. Código inválido
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 60,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
      } as any);
      await expect(
        identificationDocumentService.completeTreatment(60, { operacion_tratamiento: 'INVALID' })
      ).rejects.toThrow('Operación de tratamiento inválida');

      // 2. Idempotencia en re-cierre con misma operación vs bloqueo en operación distinta
      const alreadyClosed = {
        id: 61,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        operacion_tratamiento_ejecutada: 'R04',
        estado_traslado: 'tratado',
        estado: 'completado',
      } as any;
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(alreadyClosed);
      await expect(
        identificationDocumentService.completeTreatment(61, { operacion_tratamiento: 'R4' })
      ).resolves.toEqual(alreadyClosed);
      await expect(
        identificationDocumentService.completeTreatment(61, { operacion_tratamiento: 'R13' })
      ).rejects.toThrow('no puede sobrescribirse');

      // 3. Bloqueo D01 cuando DI es sin-notificacion
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 62,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        tipo_notificacion: 'sin-notificacion',
      } as any);
      await expect(
        identificationDocumentService.completeTreatment(62, { operacion_tratamiento: 'D01' })
      ).rejects.toThrow('requieren Notificación Previa');

      // 4. Bloqueo de operación no autorizada en autorización ambiental del gestor (con-notificacion-previa)
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 63,
        user_id: 'user-1',
        codigo_ler: '17 04 05',
        gestor_cif: 'B11111111',
        operacion_tratamiento: 'R13',
        tipo_notificacion: 'con-notificacion-previa',
      } as any);
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [{ id: 88, cif: 'B11111111' }], error: null }),
            }),
          };
        }
        if (table === 'environmental_authorizations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [{
                      id: 1,
                      activo: true,
                      es_indefinida: true,
                      waste_codes: [{ codigo_ler: '17 04 05', operaciones_tratamiento: ['R04', 'R13'] }],
                    }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        identificationDocumentService.completeTreatment(63, { operacion_tratamiento: 'D01' })
      ).rejects.toThrow('solo contempla R04, R13');

      // 5. Permitir R04 autorizado conservando R13 como prevista
      const spyUpd = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({
        id: 63,
        operacion_tratamiento: 'R13',
        operacion_tratamiento_ejecutada: 'R04',
        estado_traslado: 'tratado',
        estado: 'completado',
      } as any);

      await identificationDocumentService.completeTreatment(63, {
        operacion_tratamiento: 'R4',
        fecha_tratamiento: '2026-11-10T12:40',
      });
      expect(spyUpd).toHaveBeenCalledWith(63, expect.objectContaining({
        operacion_tratamiento: 'R13',
        operacion_tratamiento_ejecutada: 'R04',
      }));
      spyUpd.mockRestore();
    });

    it('debe cubrir validación de fecha inválida/vacía, D01 en salida, contrato sin operación amparada y autorización caducada', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      const { normalizeLocalDateTimeToIso, normalizeOperationCode } = await import('../identificationDocumentService');
      expect(normalizeOperationCode(null)).toBe('');
      expect(normalizeOperationCode('custom')).toBe('CUSTOM');
      expect(normalizeLocalDateTimeToIso(null)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(normalizeLocalDateTimeToIso('fecha-invalida')).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      // Salida con D01 sin notificación previa
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 70,
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'D01',
        tipo_notificacion: 'sin-notificacion',
      } as any);
      await expect(
        identificationDocumentService.recordDeparture(70, {
          fecha_salida: '2026-11-10T12:40',
          contrato_externo_referencia: 'EXT-1',
          supuesto_excepcion_contrato: 'Operación exenta',
        })
      ).rejects.toThrow('exige Notificación Previa');

      // Autorización caducada en completeTreatment y bloqueo contractual
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        id: 71,
        user_id: 'user-1',
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        tipo_notificacion: 'con-notificacion-previa',
        contract_id: 9,
        contract: {
          id: 9,
          numero_contrato: 'CT-9',
          gestor_company_id: 20,
          operaciones_tratamiento: ['R13'],
          contract_waste_codes: [],
        },
      } as any);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'contract_waste_codes') {
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }) };
        }
        return {};
      });
      await expect(
        identificationDocumentService.completeTreatment(71, { operacion_tratamiento: 'R04' })
      ).rejects.toThrow('no está amparada por el contrato');
    });
  });

  describe('getStats', () => {
    it('debe calcular métricas y totales agrupados por estado de traslado', async () => {
      const mockDocs: any[] = [
        { id: 1, estado_traslado: 'borrador' },
        { id: 2, estado_traslado: null },
        { id: 3, estado_traslado: 'en_transito' },
        { id: 4, estado_traslado: 'recepcionado' },
        { id: 5, estado_traslado: 'aceptado' },
        { id: 6, estado_traslado: 'rechazado_parcial' },
        { id: 7, estado_traslado: 'rechazado_total' },
        { id: 8, estado_traslado: 'tratado' },
      ];

      jest.spyOn(identificationDocumentService, 'getAll').mockResolvedValue(mockDocs);

      const stats = await identificationDocumentService.getStats();

      expect(stats.total).toBe(8);
      expect(stats.borradores).toBe(2);
      expect(stats.enTransito).toBe(1);
      expect(stats.recepcionados).toBe(1);
      expect(stats.aceptados).toBe(1);
      expect(stats.incidencias).toBe(2);
      expect(stats.tratados).toBe(1);
    });
  });

  describe('getTrackingStatusMeta', () => {
    it.each([
      ['borrador', 'Borrador / Registrado', 'light', 1],
      ['en_transito', 'En Tránsito', 'info', 2],
      ['recepcionado', 'Recepcionado en Báscula', 'warning', 3],
      ['aceptado', 'Aceptado por Gestor', 'success', 4],
      ['rechazado_parcial', 'Aceptado Parcial / Rechazo', 'warning', 4],
      ['rechazado_total', 'Rechazo Total en Destino', 'error', 4],
      ['tratado', 'Tratado y Cerrado', 'success', 5],
    ])('debe devolver metadatos correctos para estado %s', (estado, label, color, step) => {
      const meta = getTrackingStatusMeta({
        estado_traslado: estado as any,
        cantidad: 100,
        peso_destino_kg: 100,
      } as IdentificationDocument);

      expect(meta.label).toBe(label);
      expect(meta.badgeColor).toBe(color);
      expect(meta.step).toBe(step);
      expect(meta.hasDiscrepancy).toBe(false);
    });

    it('debe alertar discrepancia cuando la diferencia de peso supera el 5% o 200 kg', () => {
      const meta = getTrackingStatusMeta({
        estado_traslado: 'recepcionado',
        peso_origen_kg: 1000,
        peso_destino_kg: 850, // 15% de diferencia (> 5%)
        diferencia_peso_kg: -150,
        porcentaje_discrepancia: -15,
      } as IdentificationDocument);

      expect(meta.hasDiscrepancy).toBe(true);
      expect(meta.discrepancyMessage).toContain('Discrepancia de peso');

      // Caso de diferencia absoluta > 200 kg con porcentaje <= 5%
      const metaLarge = getTrackingStatusMeta({
        estado_traslado: 'recepcionado',
        peso_origen_kg: 10000,
        peso_destino_kg: 9750, // diff = 250 kg (> 200), pct = 2.5% (<= 5%)
        diferencia_peso_kg: 250,
        porcentaje_discrepancia: 2.5,
      } as IdentificationDocument);
      expect(metaLarge.hasDiscrepancy).toBe(true);

      // Caso sin pesoDestino definido o sin pesoOrigen
      const metaNoDestino = getTrackingStatusMeta({
        estado_traslado: 'en_transito',
        cantidad: 0,
      } as IdentificationDocument);
      expect(metaNoDestino.hasDiscrepancy).toBe(false);

      // Estado no contemplado usa default 'borrador'
      const metaDefault = getTrackingStatusMeta({
        estado_traslado: 'desconocido' as any,
        cantidad: 50,
      } as IdentificationDocument);
      expect(metaDefault.key).toBe('borrador');
    });

    it('signDocument no debe modificar datos si se pasa un rol desconocido', async () => {
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 1 } as any);

      await identificationDocumentService.signDocument(1, 'otro_rol' as any);

      expect(spyUpdate).toHaveBeenCalledWith(1, {});
      spyUpdate.mockRestore();
    });
  });

  describe('Justificación de discrepancias de báscula', () => {
    const baseDoc = {
      id: 117,
      company_id: 5,
      estado_traslado: 'aceptado',
      peso_origen_kg: 3,
      peso_destino_kg: 2.5,
      diferencia_peso_kg: -0.5,
      porcentaje_discrepancia: -16.67,
    } as any;
    const validPayload = { causa: 'merma_humedad' as const, texto: 'Merma por escurrido del residuo húmedo en planta.' };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'gestor@example.com', user_metadata: {} } },
      });
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('getTrackingStatusMeta marca la discrepancia como justificada solo si hay texto', () => {
      expect(getTrackingStatusMeta(baseDoc).isDiscrepancyJustified).toBe(false);
      expect(getTrackingStatusMeta({ ...baseDoc, justificacion_discrepancia: '   ' }).isDiscrepancyJustified).toBe(false);
      const meta = getTrackingStatusMeta({ ...baseDoc, justificacion_discrepancia: validPayload.texto });
      expect(meta.hasDiscrepancy).toBe(true);
      expect(meta.isDiscrepancyJustified).toBe(true);
      // Sin discrepancia nunca se considera justificada
      expect(getTrackingStatusMeta({ ...baseDoc, peso_destino_kg: 3, justificacion_discrepancia: 'x' }).isDiscrepancyJustified).toBe(false);
    });

    it('justifyDiscrepancy guarda causa, texto, autoría y fecha', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(baseDoc);
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ ...baseDoc } as any);

      await identificationDocumentService.justifyDiscrepancy(117, { ...validPayload, texto: `  ${validPayload.texto}  ` });

      expect(spyUpdate).toHaveBeenCalledWith(117, expect.objectContaining({
        causa_discrepancia: 'merma_humedad',
        justificacion_discrepancia: validPayload.texto,
        justificacion_discrepancia_by: 'user-123',
        justificacion_discrepancia_by_nombre: 'gestor@example.com',
        justificacion_discrepancia_at: expect.any(String),
      }));
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('justifyDiscrepancy usa el nombre completo del usuario si existe', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'g@example.com', user_metadata: { full_name: 'Ana Gestora' } } },
      });
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(baseDoc);
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ ...baseDoc } as any);

      await identificationDocumentService.justifyDiscrepancy(117, validPayload);

      expect(spyUpdate).toHaveBeenCalledWith(117, expect.objectContaining({ justificacion_discrepancia_by_nombre: 'Ana Gestora' }));
    });

    it('justifyDiscrepancy permite añadir la justificación en un DI cerrado sin justificar', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({ ...baseDoc, estado_traslado: 'tratado' });
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ ...baseDoc } as any);

      await identificationDocumentService.justifyDiscrepancy(117, validPayload);
      expect(spyUpdate).toHaveBeenCalled();
    });

    it('justifyDiscrepancy permite editar si el DI no está cerrado', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({ ...baseDoc, justificacion_discrepancia: 'Texto previo suficientemente largo' });
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ ...baseDoc } as any);

      await identificationDocumentService.justifyDiscrepancy(117, validPayload);
      expect(spyUpdate).toHaveBeenCalled();
    });

    it('justifyDiscrepancy impide modificar una justificación en un DI cerrado', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({
        ...baseDoc,
        estado_traslado: 'tratado',
        justificacion_discrepancia: 'Texto previo suficientemente largo',
      });
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update');

      await expect(identificationDocumentService.justifyDiscrepancy(117, validPayload)).rejects.toThrow('no puede modificarse');
      expect(spyUpdate).not.toHaveBeenCalled();
    });

    it('justifyDiscrepancy rechaza DIs sin discrepancia', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({ ...baseDoc, peso_destino_kg: 3 });
      await expect(identificationDocumentService.justifyDiscrepancy(117, validPayload)).rejects.toThrow('no presenta una discrepancia');
    });

    it('justifyDiscrepancy valida el contenido de la justificación', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(baseDoc);
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update');
      await expect(identificationDocumentService.justifyDiscrepancy(117, { causa: 'otro', texto: 'corto' })).rejects.toThrow('al menos 20');
      expect(spyUpdate).not.toHaveBeenCalled();
    });

    it('justifyDiscrepancy exige usuario autenticado', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(baseDoc);
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(identificationDocumentService.justifyDiscrepancy(117, validPayload)).rejects.toThrow('Usuario no autenticado');
    });

    it('recordReception guarda la justificación si hay discrepancia y se aporta', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({ id: 117, peso_origen_kg: 3 } as any);
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 117, estado_traslado: 'aceptado' } as any);

      await identificationDocumentService.recordReception(117, {
        fecha_llegada_destino: '2026-11-12T13:35:00Z',
        peso_destino_kg: 2.5,
        resultado_recepcion: 'aceptado',
        causa_discrepancia: 'merma_humedad',
        justificacion_discrepancia: validPayload.texto,
      });

      const sent = spyUpdate.mock.calls[0][1];
      expect(sent).toEqual(expect.objectContaining({
        causa_discrepancia: 'merma_humedad',
        justificacion_discrepancia: validPayload.texto,
        justificacion_discrepancia_by: 'user-123',
      }));
    });

    it('recordReception ignora la justificación si no hay discrepancia', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({ id: 117, peso_origen_kg: 1000 } as any);
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update').mockResolvedValue({ id: 117, estado_traslado: 'aceptado' } as any);

      await identificationDocumentService.recordReception(117, {
        fecha_llegada_destino: '2026-11-12T13:35:00Z',
        peso_destino_kg: 990,
        resultado_recepcion: 'aceptado',
        causa_discrepancia: 'otro',
        justificacion_discrepancia: validPayload.texto,
      });

      const sent = spyUpdate.mock.calls[0][1];
      expect(sent).not.toHaveProperty('justificacion_discrepancia');
      expect(sent).not.toHaveProperty('causa_discrepancia');
    });

    it('recordReception rechaza una justificación incompleta', async () => {
      jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue({ id: 117, peso_origen_kg: 3 } as any);
      const spyUpdate = jest.spyOn(identificationDocumentService, 'update');

      await expect(identificationDocumentService.recordReception(117, {
        fecha_llegada_destino: '2026-11-12T13:35:00Z',
        peso_destino_kg: 2.5,
        resultado_recepcion: 'aceptado',
        justificacion_discrepancia: validPayload.texto,
      })).rejects.toThrow('causa válida');
      expect(spyUpdate).not.toHaveBeenCalled();
    });
  });
});
