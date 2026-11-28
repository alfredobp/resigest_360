import { NextRequest } from 'next/server';

const mockFrom = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

import { GET, POST } from '../route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/deca/dca_test/driver-action', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function setupTableMocks(opts: {
  deca?: Record<string, unknown> | null;
  companyConfig?: Record<string, unknown> | null;
  drivers?: Array<{ id: number; dni: string; nombre?: string }>;
  updateError?: { message: string } | null;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'deca_documents') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: opts.deca ?? null, error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: opts.updateError ?? null }),
        }),
      };
    }
    if (table === 'companies') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: opts.companyConfig ? { app_config: { deca: opts.companyConfig } } : null,
          error: null,
        }),
      };
    }
    if (table === 'carrier_drivers') {
      const chain: Record<string, jest.Mock> = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(),
      };
      chain.eq
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce({ data: opts.drivers ?? [] });
      return chain;
    }
    if (table === 'identification_documents') {
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
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
}

describe('/api/deca/[token]/driver-action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: {
        publicUrl:
          'https://example.supabase.co/storage/v1/object/public/deca-evidences/deca/2/ticket.png',
      },
    });
  });

  it('GET returns company deca config with defaults and handles missing/404', async () => {
    const res400 = await GET(new NextRequest('http://localhost/api/deca/driver-action'), {
      params: Promise.resolve({ token: '' }),
    });
    expect(res400.status).toBe(400);

    setupTableMocks({ deca: null });
    const res404 = await GET(new NextRequest('http://localhost/api/deca/dca_404/driver-action'), {
      params: Promise.resolve({ token: 'dca_404' }),
    });
    expect(res404.status).toBe(404);

    setupTableMocks({
      deca: { id: 1, user_id: 'u1', company_id: 10 },
      companyConfig: { permitir_firma_movil: false },
    });
    const res200 = await GET(new NextRequest('http://localhost/api/deca/dca_123/driver-action'), {
      params: Promise.resolve({ token: 'dca_123' }),
    });
    expect(res200.status).toBe(200);
    const json = await res200.json();
    expect(json.config.permitir_firma_movil).toBe(false);
    expect(json.config.permitir_subida_ticket).toBe(true);
  });

  it('returns 400 if token or action is missing', async () => {
    const res1 = await POST(makeRequest({ action: 'sign' }), {
      params: Promise.resolve({ token: '' }),
    });
    expect(res1.status).toBe(400);

    const res2 = await POST(makeRequest({}), {
      params: Promise.resolve({ token: 'dca_123' }),
    });
    expect(res2.status).toBe(400);
  });

  it('returns 404 when deca is not found', async () => {
    setupTableMocks({ deca: null });
    const res = await POST(makeRequest({ action: 'finalize', driverDniOrPin: '12345678A' }), {
      params: Promise.resolve({ token: 'dca_missing' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 401 when driverDniOrPin is missing and 403 when invalid', async () => {
    setupTableMocks({
      deca: { id: 1, user_id: 'u1', version: 1, conductor_dni: '12345678A' },
      drivers: [{ id: 1, dni: '99999999Z' }],
    });

    const res401 = await POST(makeRequest({ action: 'finalize' }), {
      params: Promise.resolve({ token: 'dca_123' }),
    });
    expect(res401.status).toBe(401);

    const res403 = await POST(makeRequest({ action: 'finalize', driverDniOrPin: '00000000X' }), {
      params: Promise.resolve({ token: 'dca_123' }),
    });
    expect(res403.status).toBe(403);
  });

  it('signs deca and linked DI when valid', async () => {
    setupTableMocks({
      deca: {
        id: 1,
        user_id: 'u1',
        version: 1,
        conductor_dni: '12345678A',
        conductor_nombre: 'Carlos',
        identification_document_id: 55,
      },
    });

    const res = await POST(
      makeRequest({
        action: 'sign',
        driverDniOrPin: '12345678A',
        signatureDataUrl: 'data:image/png;base64,AAA',
      }),
      { params: Promise.resolve({ token: 'dca_123' }) }
    );
    expect(res.status).toBe(200);
  });

  it('uploads ticket to storage (with fallback) and finalizes deca', async () => {
    setupTableMocks({
      deca: { id: 2, user_id: 'u1', version: 1, conductor_dni: '12345678A' },
    });

    const ticketRes = await POST(
      makeRequest({
        action: 'report_ticket',
        driverDniOrPin: '12345678A',
        ticketDataUrl: 'data:image/png;base64,BBB',
        incidentNote: 'Peso correcto',
      }),
      { params: Promise.resolve({ token: 'dca_123' }) }
    );
    expect(ticketRes.status).toBe(200);
    expect(mockUpload).toHaveBeenCalled();

    // Test storage fallback when upload returns error
    mockUpload.mockResolvedValueOnce({ error: { message: 'Bucket missing' } });
    const fallbackRes = await POST(
      makeRequest({
        action: 'report_ticket',
        driverDniOrPin: '12345678A',
        ticketDataUrl: 'data:image/png;base64,BBB',
      }),
      { params: Promise.resolve({ token: 'dca_123' }) }
    );
    expect(fallbackRes.status).toBe(200);

    const finRes = await POST(
      makeRequest({ action: 'finalize', driverDniOrPin: '12345678A' }),
      { params: Promise.resolve({ token: 'dca_123' }) }
    );
    expect(finRes.status).toBe(200);
  });

  it('validates missing signature, unsupported action, and carrier_drivers fallback', async () => {
    setupTableMocks({
      deca: { id: 3, user_id: 'u1', version: 1 },
      drivers: [{ id: 1, dni: '77777777B', nombre: 'Luis' }],
    });

    const missingSigRes = await POST(
      makeRequest({ action: 'sign', driverDniOrPin: '77777777B' }),
      { params: Promise.resolve({ token: 'dca_123' }) }
    );
    expect(missingSigRes.status).toBe(400);

    setupTableMocks({
      deca: { id: 3, user_id: 'u1', version: 1 },
      drivers: [],
    });

    const unsupportedRes = await POST(
      makeRequest({ action: 'unknown', driverDniOrPin: '1234' }),
      { params: Promise.resolve({ token: 'dca_123' }) }
    );
    expect(unsupportedRes.status).toBe(400);
  });

  it('returns 403 when actions are disabled in company app_config', async () => {
    setupTableMocks({
      deca: { id: 5, user_id: 'u1', company_id: 10, version: 1, conductor_dni: '12345678A' },
      companyConfig: {
        permitir_firma_movil: false,
        permitir_subida_ticket: false,
        permitir_finalizar_movil: false,
      },
    });

    expect(
      (
        await POST(
          makeRequest({ action: 'sign', driverDniOrPin: '12345678A', signatureDataUrl: 'x' }),
          { params: Promise.resolve({ token: 'dca_123' }) }
        )
      ).status
    ).toBe(403);

    expect(
      (
        await POST(
          makeRequest({ action: 'report_ticket', driverDniOrPin: '12345678A' }),
          { params: Promise.resolve({ token: 'dca_123' }) }
        )
      ).status
    ).toBe(403);

    expect(
      (
        await POST(
          makeRequest({ action: 'finalize', driverDniOrPin: '12345678A' }),
          { params: Promise.resolve({ token: 'dca_123' }) }
        )
      ).status
    ).toBe(403);
  });

  it('returns 500 when supabase update fails', async () => {
    setupTableMocks({
      deca: { id: 4, user_id: 'u1', version: 1, conductor_dni: '12345678A' },
      updateError: { message: 'Update failed' },
    });

    const res = await POST(
      makeRequest({ action: 'finalize', driverDniOrPin: '12345678A' }),
      { params: Promise.resolve({ token: 'dca_123' }) }
    );
    expect(res.status).toBe(500);
  });
});
