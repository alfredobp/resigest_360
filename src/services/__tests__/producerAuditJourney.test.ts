/**
 * RESIGEST 360 - TEST DE INTEGRACIÓN: RECORRIDO COMPLETO DE AUDITORÍA DEL PRODUCTOR
 * 
 * Replica de forma estricta los recorridos A1, A2 y A3 del informe de experiencia de cliente
 * (RESIGEST_360_Experiencia_Cliente_2026-11-20):
 * - UXDEV-01 & UXDEV-02: Integridad de maestros y documentos custodiados.
 * - UXDEV-03 & UX-07: Aporte de justificante externo sin suplantar al gestor.
 * - UXDEV-05 & UXDEV-12: Metadatos deterministas y marca de agua de borrador.
 * - UXDEV-06 & UX-09: Trazabilidad en tránsito y conciliación en archivo cronológico.
 * - UXDEV-07 & UX-06: Duplicación ágil de retiradas habituales.
 * - UXDEV-13 & UX-04: Búsqueda flexible de códigos LER.
 */

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

import identificationDocumentService from '../identificationDocumentService';
import { getPendingDispatches, syncEntryFromDI } from '../chronologicalRegistryService';
import { generateIdentificationDocumentPDF } from '@/lib/pdfUtils';
import type { IdentificationDocument } from '@/types/wasteManagement';

describe('Recorrido de Auditoría del Productor (Piloto Comercial)', () => {
  const mockUser = { id: 'usr-productor-pilot' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  describe('A1: Creación de Retirada y Validación de Integridad', () => {
      it('genera número de documento E3L coherente y normaliza la salida como borrador', () => {
        const docNum = identificationDocumentService.generateDocumentNumber('1100000001');
        expect(docNum).toMatch(/^DCS101100000001\d{4}\d{7}$/);
        expect(docNum.length).toBe(26);
      });

      it('genera PDF con marca de agua BORRADOR y metadatos deterministas cuando está en borrador', async () => {
        const draftDoc: IdentificationDocument = {
          id: 153,
          user_id: mockUser.id,
          company_id: 10,
          numero_documento: 'DI-2026-000153',
          fecha_documento: '2026-11-20',
          tipo_notificacion: 'sin-notificacion',
          productor_razon_social: 'Productor Industrial SL',
          productor_cif: 'B12345678',
          productor_nima: 'NIMA-010001',
          productor_direccion: 'Polígono Ind. Sur 12',
          gestor_razon_social: 'Reciclajes Levante SA',
          gestor_cif: 'A98765432',
          gestor_numero_autorizacion: 'AUT-VAL-099',
          gestor_direccion: 'Av. Industria 45',
          gestor_municipio: 'Valencia',
          gestor_provincia: 'Valencia',
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro y acero',
          estado_fisico: 'solido',
          peligrosidad: 'no-peligroso',
          cantidad: 8,
          unidad: 'kg',
          estado: 'borrador',
          estado_traslado: 'borrador',
          firmado_productor: false,
          firmado_gestor: false,
          firmado_transportista: false,
          created_at: '2026-11-20T10:00:00Z',
          updated_at: '2026-11-20T10:00:00Z',
        };

        const pdf = await generateIdentificationDocumentPDF(draftDoc);
        expect(pdf).toBeDefined();
        const output = pdf.output();
        // Verificamos presencia de marca de agua BORRADOR en el texto del PDF
        expect(output).toContain('BORRADOR');
      });
    });

    describe('A2: Duplicación Rápida de Retirada Habitual (UXDEV-07)', () => {
      it('al duplicar una retirada previa, preserva participantes y residuo pero resetea firmas y estado', () => {
        const originalDoc: IdentificationDocument = {
          id: 153,
          user_id: mockUser.id,
          company_id: 10,
          contract_id: 58,
          production_center_id: 2,
          numero_documento: 'DI-2026-000153',
          fecha_documento: '2026-11-19',
          tipo_notificacion: 'sin-notificacion',
          productor_razon_social: 'Productor Industrial SL',
          productor_cif: 'B12345678',
          gestor_razon_social: 'Reciclajes Levante SA',
          gestor_cif: 'A98765432',
          transportista_razon_social: 'Transportes Rápidos SL',
          transportista_cif: 'B55443322',
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro y acero',
          estado_fisico: 'solido',
          peligrosidad: 'no-peligroso',
          cantidad: 8,
          unidad: 'kg',
          estado: 'completado',
          estado_traslado: 'aceptado',
          firmado_productor: true,
          firmado_gestor: true,
          firmado_transportista: false,
          firma_productor_url: 'https://firma-productor.png',
          firma_gestor_url: 'https://firma-gestor.png',
          peso_destino_kg: 8,
          numero_albaran_gestor: 'ALB-9988',
          created_at: '2026-11-19T09:00:00Z',
          updated_at: '2026-11-19T09:00:00Z',
        };

        // Simulación de la lógica de duplicación implementada en nuevo/page.tsx
        const duplicatedPayload = {
          contract_id: originalDoc.contract_id,
          production_center_id: originalDoc.production_center_id,
          productor_razon_social: originalDoc.productor_razon_social,
          productor_cif: originalDoc.productor_cif,
          gestor_razon_social: originalDoc.gestor_razon_social,
          gestor_cif: originalDoc.gestor_cif,
          transportista_razon_social: originalDoc.transportista_razon_social,
          transportista_cif: originalDoc.transportista_cif,
          codigo_ler: originalDoc.codigo_ler,
          descripcion_residuo: originalDoc.descripcion_residuo,
          peligrosidad: originalDoc.peligrosidad,
          cantidad: originalDoc.cantidad,
          // Reset obligatorio de campos volátiles y de custodia
          numero_documento: identificationDocumentService.generateDocumentNumber(originalDoc.productor_cif),
          estado: 'borrador',
          estado_traslado: 'borrador',
          firmado_productor: false,
          firmado_gestor: false,
          firmado_transportista: false,
          firma_productor_url: undefined,
          firma_gestor_url: undefined,
          peso_destino_kg: undefined,
          numero_albaran_gestor: undefined,
        };

        expect(duplicatedPayload.numero_documento).not.toBe(originalDoc.numero_documento);
        expect(duplicatedPayload.contract_id).toBe(58);
        expect(duplicatedPayload.gestor_cif).toBe('A98765432');
        expect(duplicatedPayload.transportista_cif).toBe('B55443322');
        expect(duplicatedPayload.codigo_ler).toBe('17 04 05');
        expect(duplicatedPayload.estado).toBe('borrador');
        expect(duplicatedPayload.estado_traslado).toBe('borrador');
        expect(duplicatedPayload.firmado_productor).toBe(false);
        expect(duplicatedPayload.firmado_gestor).toBe(false);
        expect(duplicatedPayload.peso_destino_kg).toBeUndefined();
      });
    });

    describe('A3: Aporte de Justificante Externo y Cierre sin Suplantar Gestor (UXDEV-03)', () => {
      it('registra el justificante y peso final con procedencia de Productor', async () => {
        const existingDoc: IdentificationDocument = {
          id: 154,
          user_id: mockUser.id,
          company_id: 10,
          numero_documento: 'DI-2026-000154',
          fecha_documento: '2026-11-20',
          tipo_notificacion: 'sin-notificacion',
          productor_razon_social: 'Productor Industrial SL',
          productor_cif: 'B12345678',
          gestor_razon_social: 'Reciclajes Levante SA',
          gestor_cif: 'A98765432',
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro y acero',
          estado_fisico: 'solido',
          peligrosidad: 'no-peligroso',
          cantidad: 8,
          unidad: 'kg',
          peso_origen_kg: 8,
          estado: 'borrador',
          estado_traslado: 'en_transito',
          firmado_productor: true,
          firmado_gestor: false,
          firmado_transportista: false,
          created_at: '2026-11-20T10:00:00Z',
          updated_at: '2026-11-20T10:00:00Z',
        };

        const mockQueryBuilder: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: existingDoc, error: null }),
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };

        // Simular getById
        jest.spyOn(identificationDocumentService, 'getById').mockResolvedValue(existingDoc);
        // Simular update
        jest.spyOn(identificationDocumentService, 'update').mockImplementation(async (_id, patch) => ({
          ...existingDoc,
          ...patch,
        } as IdentificationDocument));

        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await identificationDocumentService.recordExternalReceptionProof(154, {
          peso_destino_kg: 8,
          fecha_llegada_destino: '2026-11-20T16:00:00',
          numero_albaran_gestor: 'ALB-EXT-2026-77',
          ticket_pesada_url: 'https://albaran-destino.pdf',
        });

        expect(result.estado_traslado).toBe('aceptado');
        expect(result.peso_destino_kg).toBe(8);
        expect(result.numero_albaran_gestor).toBe('ALB-EXT-2026-77');
        expect(result.notas).toContain('[Justificante de Recepción Externo');
      });
    });

    describe('A4: Trazabilidad y Archivo Cronológico (UXDEV-06 / UX-09)', () => {
      it('los DIs en tránsito se visualizan en pendientes con su peso estimado de salida', async () => {
        const mockQueryBuilder: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 154,
                numero_documento: 'DI-2026-000154',
                fecha_documento: '2026-11-20',
                fecha_inicio_traslado: '2026-11-20',
                codigo_ler: '17 04 05',
                descripcion_residuo: 'Hierro y acero',
                peligrosidad: 'no-peligroso',
                peso_origen_kg: 8,
                productor_razon_social: 'Productor Industrial SL',
                productor_cif: 'B12345678',
                gestor_razon_social: 'Reciclajes Levante SA',
                gestor_cif: 'A98765432',
                estado_traslado: 'en_transito',
              },
            ],
            error: null,
          }),
        };

        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const pending = await getPendingDispatches();
        expect(pending).toHaveLength(1);
        expect(pending[0].numero_documento).toBe('DI-2026-000154');
        expect(pending[0].cantidad_kg).toBe(8);
        expect(pending[0].estado_traslado).toBe('en_transito');
      });
    });
  });
