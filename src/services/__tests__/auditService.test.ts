const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import { auditService } from '../auditService';
import type { AuditLogEntry } from '@/types/wasteManagement';

describe('auditService - Trazabilidad y Registro de Auditoría', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAction', () => {
    it('debe registrar una acción con usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-audit-123' } },
      });

      const mockCreatedLog: AuditLogEntry = {
        id: 1,
        user_id: 'user-audit-123',
        company_id: 10,
        entidad: 'di',
        entidad_id: '55',
        accion: 'crear',
        detalles: { numero_documento: 'DI-001' },
        ip_address: '192.168.1.1',
        created_at: '2026-10-24T12:00:00Z',
      };

      const singleMock = jest.fn().mockResolvedValue({ data: mockCreatedLog, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await auditService.logAction({
        company_id: 10,
        entidad: 'di',
        entidad_id: 55,
        accion: 'crear',
        detalles: { numero_documento: 'DI-001' },
        ip_address: '192.168.1.1',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-audit-123',
          company_id: 10,
          entidad: 'di',
          entidad_id: '55',
          accion: 'crear',
          ip_address: '192.168.1.1',
        })
      );
      expect(result).toEqual(mockCreatedLog);
    });

    it('debe registrar acción asignando null a user_id si no hay sesión activa', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const mockCreatedLog: AuditLogEntry = {
        id: 2,
        user_id: null,
        company_id: null,
        entidad: 'contrato',
        entidad_id: null,
        accion: 'actualizar',
        detalles: {},
        ip_address: null,
        created_at: '2026-10-24T12:00:00Z',
      };

      const singleMock = jest.fn().mockResolvedValue({ data: mockCreatedLog, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await auditService.logAction({
        entidad: 'contrato',
        accion: 'actualizar',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null,
          company_id: null,
          entidad_id: null,
        })
      );
      expect(result).toEqual(mockCreatedLog);
    });

    it('debe retornar null y loguear advertencia si Supabase devuelve error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Table audit_logs does not exist' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await auditService.logAction({
        entidad: 'contrato',
        accion: 'crear',
      });

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('no se pudo guardar el registro de auditoría:'),
        'Table audit_logs does not exist'
      );
      consoleWarnSpy.mockRestore();
    });

    it('debe capturar excepciones no controladas y retornar null', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth service network crash'));

      const result = await auditService.logAction({
        entidad: 'empresa',
        accion: 'crear',
      });

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('excepción al registrar auditoría:'),
        'Auth service network crash'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getRecentLogs', () => {
    it('debe consultar logs recientes con límite por defecto de 50', async () => {
      const mockLogs = [{ id: 1, accion: 'crear' }];

      const limitMock = jest.fn().mockResolvedValue({ data: mockLogs, error: null });
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ order: orderMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await auditService.getRecentLogs();

      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(limitMock).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockLogs);
    });

    it('debe aplicar filtros opcionales por entidad, acción, company_id y límite personalizado', async () => {
      const mockLogs = [{ id: 5, accion: 'firmar' }];

      let queryObj: any = {};
      const limitMock = jest.fn().mockImplementation(() => queryObj);
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ order: orderMock });

      queryObj.then = (resolve: any) => resolve({ data: mockLogs, error: null });
      queryObj.eq = jest.fn().mockReturnValue(queryObj);

      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await auditService.getRecentLogs({
        limit: 10,
        entidad: 'di',
        accion: 'crear',
        company_id: 3,
      });

      expect(limitMock).toHaveBeenCalledWith(10);
      expect(queryObj.eq).toHaveBeenCalledWith('entidad', 'di');
      expect(queryObj.eq).toHaveBeenCalledWith('accion', 'crear');
      expect(queryObj.eq).toHaveBeenCalledWith('company_id', 3);
      expect(result).toEqual(mockLogs);
    });

    it('debe retornar array vacío si ocurre error en la consulta', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      let queryObj: any = {};
      queryObj.then = (resolve: any) => resolve({ data: null, error: { message: 'Query failed' } });
      const limitMock = jest.fn().mockReturnValue(queryObj);
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ order: orderMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await auditService.getRecentLogs();

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('debe retornar array vacío ante una excepción en la llamada', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Supabase client crash');
      });

      const result = await auditService.getRecentLogs();

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getLogsForEntity', () => {
    it('debe obtener los logs filtrados por entidad e ID', async () => {
      const mockLogs = [{ id: 10, entidad: 'di', entidad_id: '5' }];

      const orderMock = jest.fn().mockResolvedValue({ data: mockLogs, error: null });
      const eqIdMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqEntidadMock = jest.fn().mockReturnValue({ eq: eqIdMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqEntidadMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await auditService.getLogsForEntity('di', 5);

      expect(eqEntidadMock).toHaveBeenCalledWith('entidad', 'di');
      expect(eqIdMock).toHaveBeenCalledWith('entidad_id', '5');
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockLogs);
    });

    it('debe retornar array vacío y advertir si ocurre error en la consulta', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const orderMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });
      const eqIdMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqEntidadMock = jest.fn().mockReturnValue({ eq: eqIdMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqEntidadMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await auditService.getLogsForEntity('contrato', '99');

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('debe retornar array vacío ante una excepción en getLogsForEntity', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected crash');
      });

      const result = await auditService.getLogsForEntity('contrato', '99');

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('exportLogsToCSV', () => {
    it('debe generar el archivo CSV y activar la descarga simulada en navegador', () => {
      const mockLogs: AuditLogEntry[] = [
        {
          id: 1,
          created_at: '2026-10-24T10:00:00Z',
          entidad: 'contrato',
          entidad_id: '10',
          accion: 'crear',
          user_id: 'user-1',
          company_id: 2,
          detalles: { motivo: 'Nuevo contrato "con comillas"' },
        },
      ];

      const mockClick = jest.fn();
      const mockLink = {
        href: '',
        setAttribute: jest.fn(),
        click: mockClick,
      };

      const originalBlob = (global as any).Blob;
      const originalURL = (global as any).URL;
      const originalDocument = (global as any).document;

      (global as any).Blob = jest.fn().mockImplementation((content, options) => ({ content, options }));
      (global as any).URL = {
        createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
      };
      (global as any).document = {
        createElement: jest.fn().mockReturnValue(mockLink),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn(),
        },
      };

      auditService.exportLogsToCSV(mockLogs);

      expect((global as any).URL.createObjectURL).toHaveBeenCalled();
      expect((global as any).document.createElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect((global as any).document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect((global as any).document.body.removeChild).toHaveBeenCalledWith(mockLink);

      // Restaurar globals
      (global as any).Blob = originalBlob;
      (global as any).URL = originalURL;
      (global as any).document = originalDocument;
    });
  });
});
