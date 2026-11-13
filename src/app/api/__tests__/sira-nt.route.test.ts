/**
 * @jest-environment node
 */
import { POST } from '../residuos/sira/enviar-nt/route';
import { priorNotificationService } from '@/services/priorNotificationService';
import { siraService } from '@/services/siraService';

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockNtSingle = jest.fn();
const mockSubSingle = jest.fn();
const mockSubUpdateEq = jest.fn();
const mockNtUpdateEq = jest.fn();
const mockAuditInsert = jest.fn();
const mockCompanyMaybeSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'prior_notifications') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: mockNtSingle,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: mockNtUpdateEq,
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
      if (table === 'companies') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          not: () => chain,
          neq: () => chain,
          limit: () => chain,
          maybeSingle: mockCompanyMaybeSingle,
        };
        return chain;
      }
      return {};
    },
  }),
}));

jest.mock('@/services/priorNotificationService', () => ({
  priorNotificationService: {
    validateForE3L: jest.fn(),
    generateNTXml: jest.fn(() => '<wasteNT NTCode="NT10110000000120260000001"/>'),
  },
}));

jest.mock('@/services/siraService', () => ({
  siraService: {
    extractSiraError: jest.fn(() => 'JA000026: Error de validación SIRA'),
  },
}));

const makeReq = (body: any) =>
  new Request('http://localhost/api/residuos/sira/enviar-nt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;

describe('POST /api/residuos/sira/enviar-nt', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-sira-nt-1' } }, error: null });
    mockSubSingle.mockResolvedValue({ data: { id: 700 }, error: null });
    mockSubUpdateEq.mockResolvedValue({ error: null });
    mockNtUpdateEq.mockResolvedValue({ error: null });
    mockAuditInsert.mockResolvedValue({ error: null });
    mockCompanyMaybeSingle.mockResolvedValue({ data: null, error: null });

    (priorNotificationService.validateForE3L as jest.Mock).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('devuelve 400 si no se proporciona notificationId', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('devuelve 401 si no hay usuario autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') });
    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(401);
  });

  it('devuelve 404 si la Notificación Previa no existe', async () => {
    mockNtSingle.mockResolvedValue({ data: null, error: new Error('Not found') });
    const res = await POST(makeReq({ notificationId: 999 }));
    expect(res.status).toBe(404);
  });

  it('devuelve 400 si la validación E3L detecta errores en la NT', async () => {
    mockNtSingle.mockResolvedValue({
      data: { id: 10, company_id: 1, user_id: 'user-sira-nt-1' },
      error: null,
    });
    (priorNotificationService.validateForE3L as jest.Mock).mockReturnValue({
      valid: false,
      errors: ['Falta el CIF del operador'],
      warnings: [],
    });

    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('no cumple las reglas del esquema E3L');
  });

  it('devuelve 400 si no se encuentran credenciales de SIRA', async () => {
    mockNtSingle.mockResolvedValue({
      data: { id: 10, company_id: 1, company: null },
      error: null,
    });
    mockCompanyMaybeSingle.mockResolvedValue({ data: null, error: null });

    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Credenciales de SIRA no configuradas');
  });

  it('envía y procesa con éxito una Notificación Previa a SIRA', async () => {
    mockNtSingle.mockResolvedValue({
      data: {
        id: 10,
        company_id: 1,
        numero_notificacion: 'NT10110000000120260000001',
        company: { sira_usuario: 'user_sira', sira_password: 'pass_sira' },
      },
      error: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => `
        <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
          <SOAP-ENV:Body>
            <sendWasteNTResponse xmlns="e3l://esir2014">
              <return>
                <result>
                  <resultRight>
                    <IdSira>SIRA-NT-2026-999</IdSira>
                  </resultRight>
                </result>
              </return>
            </sendWasteNTResponse>
          </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>
      `,
    });

    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.siraId).toBe('SIRA-NT-2026-999');
    expect(mockNtUpdateEq).toHaveBeenCalled();
  });

  it('valida con éxito en modo validateOnly sin guardar fecha_presentacion', async () => {
    mockNtSingle.mockResolvedValue({
      data: {
        id: 10,
        company_id: 1,
        company: { sira_usuario: 'user_sira', sira_password: 'pass_sira' },
      },
      error: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => `
        <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
          <SOAP-ENV:Body>
            <validateWasteNTResponse xmlns="e3l://esir2014">
              <return><result><resultRight/></result></return>
            </validateWasteNTResponse>
          </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>
      `,
    });

    const res = await POST(makeReq({ notificationId: 10, validateOnly: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('validada con éxito');
  });

  it('maneja rechazo de SIRA con código de error legible', async () => {
    mockNtSingle.mockResolvedValue({
      data: {
        id: 10,
        company_id: 1,
        company: { sira_usuario: 'user_sira', sira_password: 'pass_sira' },
      },
      error: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => `
        <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
          <SOAP-ENV:Body>
            <sendWasteNTResponse xmlns="e3l://esir2014">
              <return>
                <result>
                  <resultWrong code="JA000026" description="cvc-pattern-valid"/>
                </result>
              </return>
            </sendWasteNTResponse>
          </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>
      `,
    });

    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('SIRA ha rechazado la Notificación Previa');
  });

  it('utiliza credenciales de empresa secundaria si la principal o propia no tiene', async () => {
    mockNtSingle.mockResolvedValue({
      data: { id: 10, company_id: 1, company: null },
      error: null,
    });

    mockCompanyMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { sira_usuario: 'user_fallback', sira_password: 'pass_fallback' },
        error: null,
      });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '<IdSira>SIRA-1</IdSira>',
    });

    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(200);
  });

  it('captura excepciones y retorna 500', async () => {
    mockNtSingle.mockRejectedValue(new Error('Fatal error DB'));
    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(500);
  });

  it('guarda logs locales cuando NODE_ENV es development y maneja error de fetch con submissionId', async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';

    mockNtSingle.mockResolvedValue({
      data: {
        id: 10,
        company_id: 1,
        company: { sira_usuario: 'user_sira', sira_password: 'pass_sira' },
      },
      error: null,
    });

    global.fetch = jest.fn().mockRejectedValue(new Error('Network error on send'));

    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(500);
    expect(mockSubUpdateEq).toHaveBeenCalledWith('id', 700);

    (process.env as any).NODE_ENV = prevEnv;
  });

  it('escribe logs de respuesta en development en caso de respuesta exitosa', async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';

    mockNtSingle.mockResolvedValue({
      data: {
        id: 10,
        company_id: 1,
        company: { sira_usuario: 'user_sira', sira_password: 'pass_sira' },
      },
      error: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '<IdSira>SIRA-100</IdSira>',
    });

    const res = await POST(makeReq({ notificationId: 10 }));
    expect(res.status).toBe(200);

    (process.env as any).NODE_ENV = prevEnv;
  });
});
