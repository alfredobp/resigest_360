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
    it('debe devolver un documento por su ID', async () => {
      const mockDoc = { id: 10, numero_documento: 'DI-010' };

      const singleMock = jest.fn().mockResolvedValue({ data: mockDoc, error: null });
      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await identificationDocumentService.getById(10);

      expect(eqMock).toHaveBeenCalledWith('id', 10);
      expect(result).toEqual(mockDoc);
    });

    it('debe lanzar error si falla al obtener el documento', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Doc not found' },
      });
      const eqMock = jest.fn().mockReturnValue({ single: singleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(identificationDocumentService.getById(99)).rejects.toThrow(
        'Error al obtener documento: Doc not found'
      );
    });
  });

  describe('getByContract', () => {
    it('debe devolver documentos filtrados por contrato', async () => {
      const mockDocs = [{ id: 1, contract_id: 5 }];

      const orderMock = jest.fn().mockResolvedValue({ data: mockDocs, error: null });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await identificationDocumentService.getByContract(5);

      expect(eqMock).toHaveBeenCalledWith('contract_id', 5);
      expect(result).toEqual(mockDocs);
    });

    it('debe lanzar error si falla la consulta por contrato', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Contract query error' },
      });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
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

    it('update debe actualizar los campos del documento', async () => {
      const updateData = { cantidad: 200 };
      const updatedDoc = { id: 5, cantidad: 200 };

      const singleMock = jest.fn().mockResolvedValue({ data: updatedDoc, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      const result = await identificationDocumentService.update(5, updateData);

      expect(updateMock).toHaveBeenCalledWith(updateData);
      expect(eqMock).toHaveBeenCalledWith('id', 5);
      expect(result).toEqual(updatedDoc);
    });

    it('update debe lanzar error si falla en Supabase', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update error' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(identificationDocumentService.update(5, {})).rejects.toThrow(
        'Error al actualizar documento: Update error'
      );
    });

    it('delete debe eliminar el documento', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ delete: deleteMock });

      await expect(identificationDocumentService.delete(7)).resolves.toBeUndefined();
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 7);
    });

    it('delete debe lanzar error si falla', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: { message: 'Delete constraint' } });
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
      const updatedDoc = { id: 1, estado_traslado: 'tratado', estado: 'completado' } as any;
      jest.spyOn(identificationDocumentService, 'update').mockResolvedValue(updatedDoc);

      await identificationDocumentService.completeTreatment(1, {
        operacion_tratamiento: 'R03',
        descripcion_tratamiento: 'Reciclado de papel',
      });

      expect(identificationDocumentService.update).toHaveBeenCalledWith(1, expect.objectContaining({
        operacion_tratamiento: 'R03',
        estado_traslado: 'tratado',
        estado: 'completado',
      }));
      expect(mockSyncEntryFromDI).toHaveBeenCalledWith(updatedDoc);
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
});

