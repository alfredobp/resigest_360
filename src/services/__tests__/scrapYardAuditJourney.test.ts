// ==============================================================================
// AUDITORÍA DE EXPERIENCIA DE CLIENTE - FASE 3: CHATARRERÍA (UXDEV-09, 10, 14)
// Valida los flujos de recepción multimaterial, ticket de báscula conjunto,
// expedición de salida y control estricto de existencias por LER.
// ==============================================================================

// Simulación de base de datos en memoria para el recorrido
const inMemoryChronoTable: any[] = [];
const inMemoryDiTable: any[] = [];

const mockUser = { id: 'usr-chat-audit', email: 'audit-chatarreria@test.com' };

const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
  },
  from: (table: string) => {
    if (table === 'chronological_registry') {
      return {
        select: (_cols?: string) => ({
          order: () => ({
            order: () => Promise.resolve({ data: [...inMemoryChronoTable], error: null }),
            limit: () => ({
              maybeSingle: () => Promise.resolve({ data: inMemoryChronoTable[inMemoryChronoTable.length - 1] || null, error: null }),
              single: () => Promise.resolve({ data: inMemoryChronoTable[inMemoryChronoTable.length - 1] || null, error: null })
            })
          }),
          eq: (f: string, v: any) => ({
            order: () => ({
              order: () => Promise.resolve({ data: inMemoryChronoTable.filter(x => x[f] === v), error: null })
            }),
            single: () => Promise.resolve({ data: inMemoryChronoTable.find(x => x[f] === v) || null, error: null }),
            maybeSingle: () => Promise.resolve({ data: inMemoryChronoTable.find(x => x[f] === v) || null, error: null }),
            limit: () => ({
              maybeSingle: () => Promise.resolve({ data: inMemoryChronoTable.filter(x => x[f] === v)[0] || null, error: null })
            })
          }),
          maybeSingle: () => Promise.resolve({ data: inMemoryChronoTable[0] || null, error: null }),
          single: () => Promise.resolve({ data: inMemoryChronoTable[0] || null, error: null })
        }),
        insert: (payloads: any[]) => ({
          select: () => ({
            single: () => {
              const item = { id: inMemoryChronoTable.length + 1, ...payloads[0] };
              inMemoryChronoTable.push(item);
              return Promise.resolve({ data: item, error: null });
            }
          })
        })
      };
    }
    if (table === 'identification_documents') {
      return {
        select: () => ({
          eq: (f: string, v: any) => ({
            single: () => Promise.resolve({ data: inMemoryDiTable.find(x => x[f] === v) || null, error: null }),
            eq: () => Promise.resolve({ data: inMemoryDiTable.filter(x => x[f] === v), error: null })
          })
        }),
        delete: () => ({
          eq: (f1: string, v1: any) => ({
            eq: (f2: string, v2: any) => {
              const idx = inMemoryDiTable.findIndex(x => x[f1] === v1 && x[f2] === v2);
              if (idx >= 0) inMemoryDiTable.splice(idx, 1);
              return Promise.resolve({ error: null });
            }
          })
        })
      };
    }
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null })
        })
      })
    };
  }
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

jest.mock('../companyService', () => ({
  __esModule: true,
  default: {
    getUserCompany: jest.fn().mockResolvedValue({
      id: 50,
      razon_social: 'Chatarrería y Recuperaciones Toledo SL',
      cif: 'B45123987',
      nima: '4500001234',
      tipo_empresa: 'gestor',
      domicilio_instalacion: 'C/ Polígono 15',
      municipio_instalacion: 'Toledo',
      provincia_instalacion: 'Toledo'
    })
  }
}));

jest.mock('../auditService', () => ({
  auditService: {
    logAction: jest.fn().mockResolvedValue(true)
  }
}));

import {
  scrapYardService,
  calculateMultiMaterialTotals
} from '../scrapYardService';
import identificationDocumentService from '../identificationDocumentService';
import type { ScrapYardEntryFormData } from '@/types/wasteManagement';

describe('Auditoría Experiencia Cliente - Fase 3: Chatarrería y Multimaterial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    inMemoryChronoTable.length = 0;
    inMemoryDiTable.length = 0;
  });

  describe('UXDEV-09 / UX-14, UX-15, UX-16, UX-17: Recepción Multimaterial con Ticket Conjunto', () => {
    it('atiende a un proveedor con dos materiales (11 kg Fe y 22 kg Cu), generando un ticket de 33 kg y dos asientos cronológicos enlazados sin duplicados', async () => {
      const entryPayload: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        ticket_numero: 'TB-2026-8800',
        proveedor_tipo: 'particular',
        proveedor_nombre: 'Manuel Gonzalez Particular',
        proveedor_nif: '03998877A',
        vehiculo_matricula: '1120-UXT',
        lineas: [
          {
            id: 'l-hierro',
            codigo_ler: '17 04 05',
            descripcion_residuo: 'Hierro y acero',
            peligrosidad: 'no-peligroso',
            peso_kg: 11,
            precio_eur_kg: 0.10 // 11 kg * 0,10 €/kg = 1,10 €
          },
          {
            id: 'l-cobre',
            codigo_ler: '17 04 01',
            descripcion_residuo: 'Cobre, bronce, latón',
            peligrosidad: 'no-peligroso',
            peso_kg: 22,
            precio_eur_kg: 5.00 // 22 kg * 5,00 €/kg = 110,00 €
          }
        ]
      };

      const result = await scrapYardService.registerMultiMaterialEntry(entryPayload);

      // Verificación de totales conjuntos
      expect(result.ticket_numero).toBe('TB-2026-8800');
      expect(result.total_kg).toBe(33);
      expect(result.total_importe_eur).toBe(111.10);
      expect(result.lineas).toHaveLength(2);

      // Verificación de asientos cronológicos generados
      expect(inMemoryChronoTable).toHaveLength(2);
      const [asiento1, asiento2] = inMemoryChronoTable;

      expect(asiento1.tipo_operacion).toBe('entrada_recepcion');
      expect(asiento1.codigo_ler).toBe('17 04 05');
      expect(asiento1.cantidad_kg).toBe(11);
      expect(asiento1.numero_documento_referencia).toBe('TB-2026-8800');
      expect(asiento1.origen_razon_social).toBe('Manuel Gonzalez Particular');

      expect(asiento2.tipo_operacion).toBe('entrada_recepcion');
      expect(asiento2.codigo_ler).toBe('17 04 01');
      expect(asiento2.cantidad_kg).toBe(22);
      expect(asiento2.numero_documento_referencia).toBe('TB-2026-8800');
      expect(asiento2.origen_razon_social).toBe('Manuel Gonzalez Particular');

      // Comprobar generación del justificante conjunto imprimible
      const htmlTicket = scrapYardService.generateScaleTicketPrintHTML(result);
      expect(htmlTicket).toContain('TB-2026-8800');
      expect(htmlTicket).toContain('33');
      expect(htmlTicket).toContain('111,10');
    });

    it('gestiona entregas a coste cero o sin precio acordado sin generar importes indebidos', () => {
      const totals = calculateMultiMaterialTotals([
        { id: '1', codigo_ler: '17 04 05', descripcion_residuo: 'Hierro', peligrosidad: 'no-peligroso', peso_kg: 100 }
      ]);
      expect(totals.total_kg).toBe(100);
      expect(totals.total_importe_eur).toBe(0);
    });
  });

  describe('UXDEV-10 / UX-20: Salida y No Descuento por Borrador', () => {
    it('garantiza que borrar un borrador de DI nunca descuenta stock físico del archivo cronológico', async () => {
      // 1. Asiento de stock en planta (33 kg)
      inMemoryChronoTable.push({
        id: 1,
        tipo_operacion: 'entrada_recepcion',
        codigo_ler: '17 04 05',
        cantidad_kg: 33,
        numero_documento_referencia: 'TB-2026-INIT'
      });

      // 2. Simular borrador de salida DI
      inMemoryDiTable.push({
        id: 501,
        user_id: mockUser.id,
        estado: 'borrador',
        numero_documento: 'DI-BORRADOR-001',
        cantidad: 33,
        unidad: 'kg'
      });

      expect(inMemoryChronoTable).toHaveLength(1);
      expect(inMemoryDiTable).toHaveLength(1);

      // 3. Eliminar el borrador
      await identificationDocumentService.delete(501);

      // 4. El borrador fue eliminado de identification_documents pero el stock cronológico permanece intacto
      expect(inMemoryDiTable).toHaveLength(0);
      expect(inMemoryChronoTable).toHaveLength(1);
      expect(inMemoryChronoTable[0].cantidad_kg).toBe(33);
    });
  });
});
