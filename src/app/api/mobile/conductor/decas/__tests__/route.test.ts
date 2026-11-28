import { NextRequest } from 'next/server';

const mockFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import { GET } from '../route';
import {
  DRIVER_SESSION_COOKIE,
  signDriverSessionToken,
} from '@/lib/auth/driverSession';

describe('GET /api/mobile/conductor/decas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('returns 401 when cookie is missing or invalid', async () => {
    const req = new NextRequest('http://localhost/api/mobile/conductor/decas');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns vigentes and historial filtered by driver DNI', async () => {
    const token = signDriverSessionToken({
      driverId: 5,
      companyId: 10,
      userId: 'u1',
      dni: '12345678A',
      nombre: 'Carlos',
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'companies') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { razon_social: 'Trans Eco', nombre_comercial: null, logo_url: null },
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: undefined,
        // handle two .order() calls
        ...(function () {
          const chain: Record<string, jest.Mock> = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn(),
          };
          chain.order
            .mockReturnValueOnce(chain)
            .mockResolvedValueOnce({
              data: [
                { id: 1, conductor_dni: '12345678A', estado: 'vigente', numero_deca: 'D1' },
                { id: 2, conductor_dni: '12345678A', estado: 'finalizado', numero_deca: 'D2' },
                { id: 3, conductor_dni: '99999999Z', estado: 'vigente', numero_deca: 'D3' },
                { id: 4, conductor_dni: null, conductor_nombre: 'Carlos', estado: 'en_transito', numero_deca: 'D4' },
                { id: 5, conductor_dni: '12345678A', estado: 'anulado', numero_deca: 'D5' },
              ],
              error: null,
            });
          return chain;
        })(),
      };
    });

    const req = new NextRequest('http://localhost/api/mobile/conductor/decas', {
      headers: { cookie: `${DRIVER_SESSION_COOKIE}=${token}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.vigentes).toHaveLength(2);
    expect(json.historial).toHaveLength(2);
    expect(json.company.razon_social).toBe('Trans Eco');
    expect(json.company.logo_url).toBeNull();
  });

  it('handles null companyId fallback and returns 500 on DB error', async () => {
    const tokenNoCompany = signDriverSessionToken({
      driverId: 5,
      companyId: null,
      userId: 'u1',
      dni: '12345678A',
      nombre: 'Carlos',
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'companies') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        };
      }
      const chain: Record<string, jest.Mock> = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn(),
      };
      chain.order
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
      return chain;
    });

    const req = new NextRequest('http://localhost/api/mobile/conductor/decas', {
      headers: { cookie: `${DRIVER_SESSION_COOKIE}=${tokenNoCompany}` },
    });
    expect((await GET(req)).status).toBe(500);
  });
});
