// ==============================================================================
// PRUEBAS UNITARIAS: scrapYardService.test.ts (UXDEV-09 / UXDEV-14)
// Cobertura >= 80% para el servicio de báscula multimaterial de chatarrería
// ==============================================================================

import {
  scrapYardService,
  calculateMultiMaterialTotals,
  generateScaleTicketNumber
} from '../scrapYardService';
import type { ScrapYardEntryFormData, ScrapYardMaterialLine } from '@/types/wasteManagement';

// Mock de Supabase
const mockUser = { id: 'usr-chatarreria-test', email: 'chatarreria@test.com' };
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
  }
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock de chronologicalRegistryService
const mockCreatedAsientos: any[] = [];
jest.mock('../chronologicalRegistryService', () => ({
  createChronologicalEntry: jest.fn(async (payload) => {
    const id = mockCreatedAsientos.length + 101;
    const asiento = {
      id,
      numero_asiento: `AS-${new Date().getFullYear()}-${id}`,
      ...payload,
    };
    mockCreatedAsientos.push(asiento);
    return asiento;
  })
}));

// Mock de companyService
jest.mock('../companyService', () => ({
  __esModule: true,
  default: {
    getUserCompany: jest.fn().mockResolvedValue({
      id: 99,
      razon_social: 'Chatarrería y Recuperaciones Toledo SL',
      cif: 'B45000999',
      nima: '4500000001',
      domicilio_instalacion: 'Polígono Industrial Las Nieves, 12',
      municipio_instalacion: 'Toledo',
      provincia_instalacion: 'Toledo'
    })
  }
}));

// Mock de auditService
jest.mock('../auditService', () => ({
  auditService: {
    logAction: jest.fn().mockResolvedValue(true)
  }
}));

describe('scrapYardService - Pruebas Unitarias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatedAsientos.length = 0;
  });

  describe('calculateMultiMaterialTotals', () => {
    it('calcula con precisión el caso auditado: 11 kg Fe (0.10 €/kg) + 22 kg Cu (5.00 €/kg) = 33 kg y 111.10 €', () => {
      const lines: ScrapYardMaterialLine[] = [
        {
          id: '1',
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro y acero',
          peligrosidad: 'no-peligroso',
          peso_kg: 11,
          precio_eur_kg: 0.10,
        },
        {
          id: '2',
          codigo_ler: '17 04 01',
          descripcion_residuo: 'Cobre, bronce, latón',
          peligrosidad: 'no-peligroso',
          peso_kg: 22,
          precio_eur_kg: 5.00,
        }
      ];

      const totals = calculateMultiMaterialTotals(lines);

      expect(totals.total_kg).toBe(33);
      expect(totals.total_importe_eur).toBe(111.10);
    });

    it('gestiona recepciones sin compra / a coste cero (precios omitidos)', () => {
      const lines: ScrapYardMaterialLine[] = [
        {
          id: '1',
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro',
          peligrosidad: 'no-peligroso',
          peso_kg: 150,
        }
      ];

      const totals = calculateMultiMaterialTotals(lines);

      expect(totals.total_kg).toBe(150);
      expect(totals.total_importe_eur).toBe(0);
    });

    it('devuelve ceros cuando la lista de líneas está vacía', () => {
      const totals = calculateMultiMaterialTotals([]);
      expect(totals.total_kg).toBe(0);
      expect(totals.total_importe_eur).toBe(0);
    });

    it('maneja valores no numéricos o nulos de forma segura', () => {
      const lines: any[] = [
        {
          id: '1',
          codigo_ler: '17 04 05',
          peso_kg: null,
          precio_eur_kg: undefined
        }
      ];
      const totals = calculateMultiMaterialTotals(lines);
      expect(totals.total_kg).toBe(0);
      expect(totals.total_importe_eur).toBe(0);
    });
  });

  describe('generateScaleTicketNumber', () => {
    it('genera un formato TB-YYYY-XXXX consistente', () => {
      const ticket = generateScaleTicketNumber(2026);
      expect(ticket).toMatch(/^TB-2026-\d{4}$/);
    });

    it('toma el año actual si no se proporciona', () => {
      const ticket = generateScaleTicketNumber();
      const curYear = new Date().getFullYear();
      expect(ticket).toContain(`TB-${curYear}-`);
    });
  });

  describe('registerMultiMaterialEntry', () => {
    it('falla si no hay usuario autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const entry: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        proveedor_tipo: 'particular',
        proveedor_nombre: 'Juan Perez',
        proveedor_nif: '12345678Z',
        lineas: [{ id: '1', codigo_ler: '17 04 05', descripcion_residuo: 'Hierro', peligrosidad: 'no-peligroso', peso_kg: 10 }]
      };

      await expect(scrapYardService.registerMultiMaterialEntry(entry)).rejects.toThrow('No hay usuario autenticado');
    });

    it('falla si el nombre del proveedor está vacío', async () => {
      const entry: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        proveedor_tipo: 'particular',
        proveedor_nombre: '   ',
        proveedor_nif: '12345678Z',
        lineas: [{ id: '1', codigo_ler: '17 04 05', descripcion_residuo: 'Hierro', peligrosidad: 'no-peligroso', peso_kg: 10 }]
      };

      await expect(scrapYardService.registerMultiMaterialEntry(entry)).rejects.toThrow('Debe especificar el nombre o razón social');
    });

    it('falla si no hay líneas de materiales', async () => {
      const entry: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        proveedor_tipo: 'particular',
        proveedor_nombre: 'Juan Perez',
        proveedor_nif: '12345678Z',
        lineas: []
      };

      await expect(scrapYardService.registerMultiMaterialEntry(entry)).rejects.toThrow('Debe incluir al menos una línea');
    });

    it('falla si una línea no tiene código LER', async () => {
      const entry: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        proveedor_tipo: 'particular',
        proveedor_nombre: 'Juan Perez',
        proveedor_nif: '12345678Z',
        lineas: [{ id: '1', codigo_ler: '   ', descripcion_residuo: 'Hierro', peligrosidad: 'no-peligroso', peso_kg: 10 }]
      };

      await expect(scrapYardService.registerMultiMaterialEntry(entry)).rejects.toThrow('no tiene un código LER seleccionado');
    });

    it('falla si una línea tiene peso <= 0', async () => {
      const entry: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        proveedor_tipo: 'particular',
        proveedor_nombre: 'Juan Perez',
        proveedor_nif: '12345678Z',
        lineas: [{ id: '1', codigo_ler: '17 04 05', descripcion_residuo: 'Hierro', peligrosidad: 'no-peligroso', peso_kg: 0 }]
      };

      await expect(scrapYardService.registerMultiMaterialEntry(entry)).rejects.toThrow('debe tener un peso superior a 0 kg');
    });

    it('registra con éxito dos líneas de materiales generando dos asientos enlazados al mismo ticket', async () => {
      const entry: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        ticket_numero: 'TB-2026-9901',
        proveedor_tipo: 'particular',
        proveedor_nombre: 'Manuel Toledo',
        proveedor_nif: '03889912K',
        vehiculo_matricula: '5566-BBB',
        observaciones: 'Descarga en patio 2',
        lineas: [
          {
            id: 'l1',
            codigo_ler: '17 04 05',
            descripcion_residuo: 'Hierro y acero',
            peligrosidad: 'no-peligroso',
            peso_kg: 11,
            precio_eur_kg: 0.10
          },
          {
            id: 'l2',
            codigo_ler: '17 04 01',
            descripcion_residuo: 'Cobre, bronce, latón',
            peligrosidad: 'no-peligroso',
            peso_kg: 22,
            precio_eur_kg: 5.00
          }
        ]
      };

      const result = await scrapYardService.registerMultiMaterialEntry(entry);

      expect(result.ticket_numero).toBe('TB-2026-9901');
      expect(result.total_kg).toBe(33);
      expect(result.total_importe_eur).toBe(111.10);
      expect(result.lineas).toHaveLength(2);
      expect(result.lineas[0].asiento_id).toBeDefined();
      expect(result.lineas[1].asiento_id).toBeDefined();

      // Verificar que ambos asientos tienen el ticket como referencia
      expect(mockCreatedAsientos).toHaveLength(2);
      expect(mockCreatedAsientos[0].numero_documento_referencia).toBe('TB-2026-9901');
      expect(mockCreatedAsientos[1].numero_documento_referencia).toBe('TB-2026-9901');
      expect(mockCreatedAsientos[0].tipo_operacion).toBe('entrada_recepcion');
      expect(mockCreatedAsientos[1].tipo_operacion).toBe('entrada_recepcion');
    });

    it('genera un ticket automático si no se especifica ticket_numero', async () => {
      const entry: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        proveedor_tipo: 'empresa',
        proveedor_nombre: 'Empresa Metalúrgica SA',
        proveedor_nif: 'A12345678',
        lineas: [
          {
            id: 'l1',
            codigo_ler: '17 04 05',
            descripcion_residuo: 'Hierro',
            peligrosidad: 'no-peligroso',
            peso_kg: 50
          }
        ]
      };

      const result = await scrapYardService.registerMultiMaterialEntry(entry);
      expect(result.ticket_numero).toMatch(/^TB-\d{4}-\d{4}$/);
    });

    it('maneja residuos peligrosos, dirección completa y fallback de empresa cuando no tiene domicilio_instalacion', async () => {
      const companyService = require('../companyService').default;
      companyService.getUserCompany.mockResolvedValueOnce({
        id: 77,
        nombre_comercial: 'Recuperaciones Alternativas',
        cif: 'B99988877',
        domicilio_social: 'Polígono Sur 4',
        municipio_social: 'Madrid',
        provincia_social: 'Madrid'
      });

      const entry: ScrapYardEntryFormData = {
        fecha: '',
        proveedor_tipo: 'empresa',
        proveedor_nombre: 'Talleres Norte SL',
        proveedor_nif: 'B11223344',
        proveedor_direccion: 'Calle Falsa 123',
        proveedor_municipio: 'Getafe',
        proveedor_provincia: 'Madrid',
        production_center_id: 12,
        lineas: [
          {
            id: 'l1',
            codigo_ler: '17 04 09*',
            descripcion_residuo: 'Residuos metálicos contaminados',
            peligrosidad: undefined as any,
            peso_kg: 85,
            operacion_rd: 'R04'
          }
        ]
      };

      const result = await scrapYardService.registerMultiMaterialEntry(entry);
      expect(result.lineas[0].asiento_id).toBeDefined();
      expect(mockCreatedAsientos[0].peligrosidad).toBe('peligroso');
      expect(mockCreatedAsientos[0].operacion_rd).toBe('R04');
      expect(mockCreatedAsientos[0].destino_razon_social).toBe('Recuperaciones Alternativas');
    });

    it('maneja fallback cuando getUserCompany devuelve null', async () => {
      const companyService = require('../companyService').default;
      companyService.getUserCompany.mockResolvedValueOnce(null);

      const entry: ScrapYardEntryFormData = {
        fecha: '2026-11-20',
        proveedor_tipo: 'particular',
        proveedor_nombre: 'Pedro Soler',
        proveedor_nif: '77665544H',
        lineas: [
          {
            id: 'l1',
            codigo_ler: '17 04 02',
            descripcion_residuo: 'Aluminio',
            peligrosidad: 'no-peligroso',
            peso_kg: 40
          }
        ]
      };

      const result = await scrapYardService.registerMultiMaterialEntry(entry);
      expect(mockCreatedAsientos[0].destino_razon_social).toBe('Chatarrería Receptora');
    });
  });

  describe('generateScaleTicketPrintHTML', () => {
    it('produce un HTML estructurado con la información de la entrega, materiales y referencias legales', () => {
      const entry = {
        id: 'ent-1',
        user_id: 'usr-1',
        ticket_numero: 'TB-2026-7788',
        fecha: '2026-11-20',
        proveedor_tipo: 'particular' as const,
        proveedor_nombre: 'Antonio Gomez',
        proveedor_nif: '11223344X',
        vehiculo_matricula: '1234-XYZ',
        total_kg: 33,
        total_importe_eur: 111.10,
        created_at: new Date().toISOString(),
        lineas: [
          {
            id: '1',
            codigo_ler: '17 04 05',
            descripcion_residuo: 'Hierro y acero',
            peligrosidad: 'no-peligroso' as const,
            peso_kg: 11,
            precio_eur_kg: 0.10,
            subtotal_eur: 1.10
          },
          {
            id: '2',
            codigo_ler: '17 04 01',
            descripcion_residuo: 'Cobre',
            peligrosidad: 'no-peligroso' as const,
            peso_kg: 22,
            precio_eur_kg: 5.00,
            subtotal_eur: 110.00
          }
        ]
      };

      const html = scrapYardService.generateScaleTicketPrintHTML(entry, {
        razon_social: 'Chatarrería Toledo SL',
        cif: 'B45123456',
        nima: '4500000001'
      });

      expect(html).toContain('TB-2026-7788');
      expect(html).toContain('Antonio Gomez');
      expect(html).toContain('17 04 05');
      expect(html).toContain('17 04 01');
      expect(html).toContain('33');
      expect(html).toContain('111,10');
      expect(html).toContain('Ley 7/2022');
      expect(html).toContain('RD 553/2020');
    });

    it('genera HTML con valores por defecto si no se pasa companyInfo ni matrícula', () => {
      const entry = {
        id: 'ent-2',
        user_id: 'usr-2',
        ticket_numero: 'TB-2026-0002',
        fecha: '2026-11-20',
        proveedor_tipo: 'empresa' as const,
        proveedor_nombre: 'Constructora Alfa',
        proveedor_nif: '',
        total_kg: 50,
        total_importe_eur: 0,
        created_at: new Date().toISOString(),
        lineas: [
          {
            id: '1',
            codigo_ler: '17 04 05',
            descripcion_residuo: 'Hierro',
            peligrosidad: 'no-peligroso' as const,
            peso_kg: 50
          }
        ]
      };

      const html = scrapYardService.generateScaleTicketPrintHTML(entry);
      expect(html).toContain('RECUPERACIONES Y CHATARRERÍA');
      expect(html).toContain('No indicado');
      expect(html).not.toContain('Total Liquidación Compra:');
    });
  });
});
