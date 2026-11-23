const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import {
  quickSearchService,
  getTenantContext,
  SearchRecordItem,
} from '../quickSearchService';

describe('quickSearchService - Servicio de búsqueda global multi-tenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTenantContext', () => {
    it('debe obtener el contexto con userId y companyIds cuando el usuario está autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-search-123' } },
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({
          data: [{ id: 101 }, { id: 102 }],
        }),
      });

      const context = await getTenantContext();

      expect(context).toEqual({
        userId: 'user-search-123',
        companyIds: [101, 102],
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('companies');
    });

    it('debe manejar empresas vacías o nulas correctamente', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-search-456' } },
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({
          data: null,
        }),
      });

      const context = await getTenantContext();

      expect(context).toEqual({
        userId: 'user-search-456',
        companyIds: [],
      });
    });

    it('debe lanzar un error si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
      });

      await expect(getTenantContext()).rejects.toThrow('Usuario no autenticado');
    });
  });

  describe('searchRecords', () => {
    it('debe retornar un array vacío si la consulta es vacía o tiene menos de 2 caracteres', async () => {
      expect(await quickSearchService.searchRecords('')).toEqual([]);
      expect(await quickSearchService.searchRecords('   ')).toEqual([]);
      expect(await quickSearchService.searchRecords('a')).toEqual([]);
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-search-sanitized' } },
      });
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ data: [] }),
      });
      expect(await quickSearchService.searchRecords('(%a),')).toEqual([]);
    });

    it('debe realizar búsquedas paralelas y formatear resultados cuando el usuario tiene empresas asociadas', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      });

      const mockCompaniesTenant = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }] }),
      };

      const mockContractsChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [
            { id: 1, numero_contrato: 'CTR-2026-001', estado: 'vigente' },
          ],
          error: null,
        }),
      };

      const mockDocsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            { id: 2, numero_documento: 'DI-998877', estado: 'Completado' },
          ],
          error: null,
        }),
      };

      const mockCompaniesChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            { id: 3, razon_social: 'EcoReciclajes SL', cif: 'B12345678' },
          ],
          error: null,
        }),
      };

      const mockGestoresChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            { id: 4, nombre: 'Planta Tratamiento Norte', numero_autorizacion: 'AUT-001' },
          ],
          error: null,
        }),
      };

      const mockCarriersChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            { id: 5, razon_social: 'Transportes Rápidos', numero_autorizacion: 'TR-77' },
          ],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'waste_contracts') return mockContractsChain;
        if (table === 'identification_documents') return mockDocsChain;
        if (table === 'treatment_managers') return mockGestoresChain;
        if (table === 'carriers') return mockCarriersChain;
        if (table === 'companies') {
          // Si tiene select('id') es la llamada de tenant, de lo contrario la búsqueda
          return mockCompaniesTenant;
        }
        return {};
      });

      // Segunda llamada a companies debe retornar mockCompaniesChain
      mockCompaniesTenant.eq.mockImplementationOnce(() => Promise.resolve({ data: [{ id: 10 }] }))
        .mockImplementationOnce(() => mockCompaniesChain);

      const results = await quickSearchService.searchRecords('reciclaje');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.category === 'contracts')).toBe(true);
      expect(results.some((r) => r.category === 'documents')).toBe(true);
      expect(results.some((r) => r.category === 'gestores')).toBe(true);
      expect(results.some((r) => r.category === 'carriers')).toBe(true);
    });

    it('debe buscar contratos con eq(user_id) cuando el usuario no tiene empresas asociadas', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-no-companies' } },
      });

      const mockContractsChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: 11, contract_number: 'CTR-NO-CO', status: undefined }],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'waste_contracts') return mockContractsChain;
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const results = await quickSearchService.searchRecords('CTR%_');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'contract-11',
        title: 'Contrato: CTR-NO-CO',
        subtitle: 'Estado: Activo',
        category: 'contracts',
        href: '/residuos/contratos/11',
        badge: 'Contrato',
      });
    });

    it('debe tolerar errores individuales en tablas sin fallar la búsqueda global', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-errors' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return {
            select: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          };
        }
        if (table === 'identification_documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 99, document_number: 'DOC-123' }],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const results = await quickSearchService.searchRecords('DOC');

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('documents');
      expect(results[0].title).toBe('DI: DOC-123');
      expect(results[0].subtitle).toBe('Documento de Identificación');
    });

    it('debe manejar campos opcionales nulos en gestores y transportistas', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-empty-fields' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'treatment_managers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 101, nombre: 'Gestor Sin Autorizacion', numero_autorizacion: null }],
              error: null,
            }),
          };
        }
        if (table === 'carriers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 202, razon_social: 'Trans Sin Auth', numero_autorizacion: null }],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const results = await quickSearchService.searchRecords('Sin Auth');

      expect(results).toHaveLength(2);
      expect(results.find(r => r.id === 'gestor-101')?.subtitle).toBe('Gestor de Residuos');
      expect(results.find(r => r.id === 'carrier-202')?.subtitle).toBe('Transportista');
    });

    it('debe manejar contratos sin contract_number, DIs con solo id, empresas sin cif y fallos en gestores/transportistas', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-fallbacks' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'waste_contracts') {
          return {
            select: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ id: 88, contract_number: '', status: '' }],
              error: null,
            }),
          };
        }
        if (table === 'identification_documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 77, tracking_number: null, document_number: null, estado: null }],
              error: null,
            }),
          };
        }
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 66, razon_social: 'Empresa Sin CIF', cif: null }],
              error: null,
            }),
          };
        }
        if (table === 'treatment_managers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Gestor error' },
            }),
          };
        }
        if (table === 'carriers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Carrier error' },
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const results = await quickSearchService.searchRecords('Fallbacks');

      expect(results.length).toBe(3);
      expect(results.find(r => r.id === 'contract-88')?.title).toBe('Contrato: 88');
      expect(results.find(r => r.id === 'contract-88')?.subtitle).toBe('Estado: Activo');
      expect(results.find(r => r.id === 'doc-77')?.title).toBe('DI: 77');
      expect(results.find(r => r.id === 'doc-77')?.subtitle).toBe('Documento de Identificación');
      expect(results.find(r => r.id === 'comp-66')?.subtitle).toBe('Empresa');
    });

    it('debe filtrar categorías según allowedModules cuando se especifica en options', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-filtered-mods' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'identification_documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 500, numero_documento: 'DI-SOLO-500', estado: 'En tránsito' }],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [] }),
        };
      });

      const results = await quickSearchService.searchRecords('500', 4, {
        allowedModules: ['di'],
      });

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('documents');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('waste_contracts');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('treatment_managers');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('carriers');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('carrier_drivers');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('carrier_vehicles');
    });

    it('debe buscar conductores y vehículos cuando el módulo flota_transporte está habilitado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-fleet-search' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carrier_drivers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 301,
                  nombre: 'Carlos Conductor',
                  dni: '12345678Z',
                  vehiculo_asignado: '1234-BBB',
                },
                {
                  id: 302,
                  nombre: 'Sin Meta',
                  dni: null,
                  vehiculo_asignado: null,
                },
              ],
              error: null,
            }),
          };
        }
        if (table === 'carrier_vehicles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 401,
                  matricula: '1234-BBB',
                  tipo: 'Tractora',
                  marca_modelo: 'Volvo FH',
                  remolque_habitual: 'R-1234-BBB',
                },
              ],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const results = await quickSearchService.searchRecords('1234', 4, {
        allowedModules: ['flota_transporte'],
      });

      const driverRes = results.find((r) => r.id === 'driver-301');
      const driverNoMeta = results.find((r) => r.id === 'driver-302');
      const vehicleRes = results.find((r) => r.id === 'vehicle-401');

      expect(driverRes).toEqual({
        id: 'driver-301',
        title: 'Carlos Conductor',
        subtitle: 'DNI: 12345678Z · Vehículo: 1234-BBB',
        category: 'drivers',
        href: '/residuos/flota?tab=conductores&q=12345678Z',
        badge: 'Conductor',
      });
      expect(driverNoMeta?.subtitle).toBe('Conductor de flota');
      expect(vehicleRes).toEqual({
        id: 'vehicle-401',
        title: '1234-BBB',
        subtitle: 'Tractora · Volvo FH · Remolque: R-1234-BBB',
        category: 'vehicles',
        href: '/residuos/flota?tab=vehiculos&q=1234-BBB',
        badge: 'Vehículo',
      });
    });

    it('debe buscar todas las versiones de DeCA cuando el módulo deca está habilitado (Hito C.3)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-deca-search' } },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'deca_documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 701,
                  numero_deca: 'DECA-2026-00001',
                  version: 1,
                  is_vigente: false,
                  matricula_tractora: '2345-ZZZ',
                  cargador_razon_social: 'Productor Demo',
                  codigo_ler: '15 01 01',
                  fecha_transporte: '2026-11-23',
                  token: 'dca_tok_v1',
                },
                {
                  id: 702,
                  numero_deca: 'DECA-2026-00001-v2',
                  version: 2,
                  is_vigente: true,
                  matricula_tractora: '4567-ZZZ',
                  cargador_razon_social: null,
                  codigo_ler: null,
                  fecha_transporte: null,
                  token: null,
                },
              ],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const results = await quickSearchService.searchRecords('DECA', 4, {
        allowedModules: ['deca'],
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'deca-701',
        title: 'DeCA: DECA-2026-00001 (v1 · Histórica)',
        subtitle: 'Matrícula: 2345-ZZZ · Productor Demo · LER 15 01 01 · 2026-11-23',
        category: 'deca',
        href: '/mobile/deca/dca_tok_v1',
        badge: 'DeCA v1 (Hist.)',
      });
      expect(results[1].href).toBe('/residuos/deca');
      expect(results[1].badge).toBe('DeCA v2');
    });
  });
});
