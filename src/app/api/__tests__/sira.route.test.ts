/**
 * @jest-environment node
 */
import { POST } from '../residuos/sira/enviar-di/route';
import { siraService } from '@/services/siraService';
import * as fs from 'fs';

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockDocSingle = jest.fn();
const mockSubSingle = jest.fn();
const mockSubUpdateEq = jest.fn();
const mockDocUpdateEq = jest.fn();
const mockAuditInsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'identification_documents') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: mockDocSingle,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: mockDocUpdateEq,
            }),
          }),
        };
      }
      if (table === 'sira_submissions') {
        return {
          insert: () => ({
            select: () => ({
              single: mockSubSingle,
            }),
          }),
          update: () => ({
            eq: mockSubUpdateEq,
          }),
        };
      }
      if (table === 'audit_logs') {
        return {
          insert: mockAuditInsert,
        };
      }
      return {};
    },
  }),
}));

jest.mock('@/services/siraService', () => ({
  siraService: {
    generateDIXml: jest.fn(() => '<wasteDCS DCSCode="DI-1"/>'),
    extractSiraError: jest.fn(() => 'JA000018: Error de validación SIRA'),
  },
}));

const makeReq = (body: any) =>
  new Request('http://localhost/api/residuos/sira/enviar-di', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;

describe('POST /api/residuos/sira/enviar-di', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockGetUser.mockResolvedValue({ data: { user: { id: 'u-sira-1' } }, error: null });
    mockSubSingle.mockResolvedValue({ data: { id: 500 }, error: null });
    mockSubUpdateEq.mockResolvedValue({ error: null });
    mockDocUpdateEq.mockResolvedValue({ error: null });
    mockAuditInsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('devuelve 400 si no se proporciona documentId', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('devuelve 401 si el usuario no está autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No auth') });
    const res = await POST(makeReq({ documentId: 10 }));
    expect(res.status).toBe(401);
  });

  it('devuelve 404 si el documento no existe o no pertenece al usuario', async () => {
    mockDocSingle.mockResolvedValue({ data: null, error: new Error('Not found') });
    const res = await POST(makeReq({ documentId: 999 }));
    expect(res.status).toBe(404);
  });

  it('devuelve 400 y registra auditoría si la empresa no tiene credenciales SIRA (array o null)', async () => {
    mockDocSingle.mockResolvedValue({
      data: {
        id: 10,
        company_id: 2,
        numero_documento: 'DI-2026-001',
        productor_razon_social: 'Prod S.L.',
        company: null,
      },
      error: null,
    });

    const res = await POST(makeReq({ documentId: 10 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Credenciales de SIRA no configuradas');
    expect(mockAuditInsert).toHaveBeenCalled();
  });

  it('procesa envío exitoso a SIRA en development guardando logs XML, actualiza sira_submissions e identification_documents', async () => {
    (process.env as any).NODE_ENV = 'development';
    mockDocSingle.mockResolvedValue({
      data: {
        id: 10,
        company_id: 2,
        numero_documento: 'DI-2026-001',
        productor_razon_social: 'Prod S.L.',
        notas: '',
        company: [{ sira_usuario: 'user_sira', sira_password: 'pass_sira' }],
      },
      error: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<Envelope><Body><IdSira>SIRA-OK-777</IdSira></Body></Envelope>',
    }) as any;

    const res = await POST(makeReq({ documentId: 10 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.siraId).toBe('SIRA-OK-777');
    expect(json.submissionId).toBe(500);
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    expect(mockSubUpdateEq).toHaveBeenCalledWith('id', 500);
    expect(mockDocUpdateEq).toHaveBeenCalledWith('user_id', 'u-sira-1');
  });

  it('maneja rechazo HTTP no-ok o resultWrong de SIRA y tolera fallo al insertar submission', async () => {
    mockSubSingle.mockRejectedValueOnce(new Error('DB table init error'));
    mockDocSingle.mockResolvedValue({
      data: {
        id: 11,
        company_id: 2,
        numero_documento: 'DI-2026-002',
        company: { sira_usuario: 'user_sira', sira_password: 'pass_sira' },
      },
      error: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => '<resultWrong>Invalid LER</resultWrong>',
    }) as any;

    const res = await POST(makeReq({ documentId: 11 }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe('SIRA ha rechazado el documento');
    expect(siraService.extractSiraError).toHaveBeenCalled();
  });

  it('actualiza submission a rechazado cuando submissionId existe y hay SOAP Fault', async () => {
    mockDocSingle.mockResolvedValue({
      data: {
        id: 11,
        company_id: 2,
        numero_documento: 'DI-2026-002',
        company: { sira_usuario: 'user_sira', sira_password: 'pass_sira' },
      },
      error: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<soapenv:Fault><faultstring>Invalid LER</faultstring></soapenv:Fault>',
    }) as any;

    const res = await POST(makeReq({ documentId: 11 }));
    expect(res.status).toBe(400);
    expect(mockSubUpdateEq).toHaveBeenCalledWith('id', 500);
  });

  it('devuelve 500 y marca submission como error si fetch a SIRA lanza excepción de red', async () => {
    mockDocSingle.mockResolvedValue({
      data: {
        id: 12,
        company_id: 2,
        numero_documento: 'DI-2026-003',
        company: { sira_usuario: 'user_sira', sira_password: 'pass_sira' },
      },
      error: null,
    });

    global.fetch = jest.fn().mockRejectedValue(new Error('SIRA timeout'));

    const res = await POST(makeReq({ documentId: 12 }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('SIRA timeout');
    expect(mockSubUpdateEq).toHaveBeenCalledWith('id', 500);
  });
});
