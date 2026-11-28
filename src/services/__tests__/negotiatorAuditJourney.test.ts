/**
 * ==============================================================================
 * TEST DE INTEGRACIÓN - AUDITORÍA EXPERIENCIA DE CLIENTE (FASE 4: NEGOCIANTE)
 * Valida los recorridos UX-21, UX-22, UX-23, UX-24 (UXDEV-06, UXDEV-11, UXDEV-12, UXDEV-14)
 * ==============================================================================
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

jest.mock('../auditService', () => ({
  auditService: {
    logAction: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../chronologicalRegistryService', () => ({
  syncEntryFromCommercialOperation: jest.fn().mockResolvedValue(null),
}));

import {
  getEffectiveModules,
  canAccessPath,
} from '@/lib/profiles/moduleCatalog';
import {
  commercialOperationService,
  formatPriceUnitLabel,
  validateOperatorMandate,
  parseCommercialMetaFromNotes,
  serializeCommercialMetaToNotes,
} from '../commercialOperationService';
import { syncEntryFromCommercialOperation } from '../chronologicalRegistryService';
import { generateCommercialOperationPDF } from '@/lib/pdfUtils';
import type { CommercialOperation } from '@/types/wasteManagement';

describe('Auditoría Experiencia Cliente - Fase 4: Perfil Negociante / Agente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-negociante-1', email: 'negociante@resigest.test' } },
      error: null,
    });
  });

  describe('UXDEV-06 / UX-24: Acceso garantizado al Archivo Cronológico para Negociante', () => {
    it('habilita archivo_cronologico incluso cuando la empresa negociante conserva modulos_activos legados sin dicho módulo', () => {
      const modules = getEffectiveModules({
        perfil_operativo: 'negociante',
        modulos_activos: ['empresas', 'contratos', 'di', 'operaciones_comerciales'],
      });

      expect(modules).toContain('archivo_cronologico');
      expect(canAccessPath('/residuos/archivo-cronologico', modules, false, { perfilOperativo: 'negociante' })).toBe(true);
    });
  });

  describe('UXDEV-11 / UX-22: Intervención ambiental estructurada (posesión y mandato de operador)', () => {
    it('guarda operación sin posesión física sin generar salida de stock en planta propia', async () => {
      let persistedObservaciones = '';

      const countChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };

      const insertChain = {
        insert: jest.fn().mockImplementation((rows: any[]) => {
          persistedObservaciones = rows[0].observaciones || '';
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 39,
                ...rows[0],
                created_at: '2026-11-20T10:00:00Z',
                updated_at: '2026-11-20T10:00:00Z',
              },
              error: null,
            }),
          };
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(insertChain);

      const created = await commercialOperationService.create({
        fecha: '2026-11-20',
        estado: 'completada',
        modalidad_posesion: 'intermediacion_sin_posesion',
        actua_como_operador: false,
        codigo_ler: '17 04 05',
        descripcion_residuo: 'Hierro y acero',
        peligrosidad: 'no-peligroso',
        cantidad_estimada_t: 0.02,
        tipo_precio_compra: 'por_kg',
        precio_unitario_compra: 0.15,
        tipo_precio_venta: 'por_kg',
        precio_unitario_venta: 0.3,
        coste_transporte: 1.0,
        otros_costes: 0.5,
        observaciones: 'Intermediación directa sin paso por almacén propio.',
      });

      expect(created.modalidad_posesion).toBe('intermediacion_sin_posesion');
      expect(created.actua_como_operador).toBe(false);
      expect(created.observaciones).toBe('Intermediación directa sin paso por almacén propio.');
      expect(created.margen_bruto_total).toBe(1.5);
      // Nunca genera movimiento de stock físico propio al ser intermediación sin posesión
      expect(syncEntryFromCommercialOperation).not.toHaveBeenCalled();
      // Los metadatos estructurados quedan persistidos para recargas de sesión
      const reparsed = parseCommercialMetaFromNotes(persistedObservaciones);
      expect(reparsed.meta.modalidad_posesion).toBe('intermediacion_sin_posesion');
      expect(reparsed.meta.actua_como_operador).toBe(false);
    });

    it('bloquea la actuación como operador del traslado si no se aporta referencia de mandato escrito', async () => {
      const check = validateOperatorMandate({
        actua_como_operador: true,
        mandato_referencia: '   ',
      });
      expect(check.valid).toBe(false);
      expect(check.error).toMatch(/mandato/i);

      await expect(
        commercialOperationService.create({
          fecha: '2026-11-20',
          estado: 'abierta',
          modalidad_posesion: 'intermediacion_sin_posesion',
          actua_como_operador: true,
          mandato_referencia: '',
          codigo_ler: '17 04 05',
          descripcion_residuo: 'Hierro y acero',
          peligrosidad: 'no-peligroso',
          cantidad_estimada_t: 1,
          tipo_precio_compra: 'por_tonelada',
          precio_unitario_compra: 100,
          tipo_precio_venta: 'por_tonelada',
          precio_unitario_venta: 150,
        })
      ).rejects.toThrow(/mandato/i);
    });
  });

  describe('UXDEV-11 / UXDEV-14 / UX-23: Formato €/kg legible y carpeta documental con procedencia y hash', () => {
    it('formatea las unidades comerciales sin exponer identificadores técnicos como por_kg', () => {
      expect(formatPriceUnitLabel('por_kg')).toBe('€/kg');
      expect(formatPriceUnitLabel('por_tonelada')).toBe('€/t');
      expect(formatPriceUnitLabel('lote_fijo')).toBe('Lote fijo');
    });

    it('permite adjuntar un DI externo tras guardar y recuperarlo con procedencia y huella SHA-256', async () => {
      const baseOp: CommercialOperation = {
        id: 39,
        user_id: 'user-negociante-1',
        company_id: 50,
        numero_operacion: 'OP-2026-000002',
        fecha: '2026-11-20',
        estado: 'abierta',
        modalidad_posesion: 'intermediacion_sin_posesion',
        codigo_ler: '17 04 05',
        descripcion_residuo: 'Hierro y acero',
        peligrosidad: 'no-peligroso',
        cantidad_estimada_t: 0.02,
        tipo_precio_compra: 'por_kg',
        precio_unitario_compra: 0.15,
        coste_compra_total: 3.0,
        estado_pago_compra: 'pendiente',
        tipo_precio_venta: 'por_kg',
        precio_unitario_venta: 0.3,
        ingreso_venta_total: 6.0,
        estado_cobro_venta: 'pendiente',
        coste_transporte: 1.0,
        otros_costes: 0.5,
        margen_bruto_total: 1.5,
        margen_unitario_tonelada: 75,
        porcentaje_margen: 25,
        observaciones: serializeCommercialMetaToNotes('Operación sin posesión.', {
          modalidad_posesion: 'intermediacion_sin_posesion',
          actua_como_operador: false,
          documentos: [],
        }),
        created_at: '2026-11-20T10:00:00Z',
        updated_at: '2026-11-20T10:00:00Z',
      };

      let savedPayload: any = null;

      const selectByIdChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: baseOp, error: null }),
      };

      const updateChain = {
        update: jest.fn().mockImplementation((payload: any) => {
          savedPayload = payload;
          return {
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...baseOp, ...payload },
              error: null,
            }),
          };
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(selectByIdChain) // getById in addDocumentAttachment
        .mockReturnValueOnce(selectByIdChain) // getById in update
        .mockReturnValueOnce(updateChain); // update in Supabase

      const updated = await commercialOperationService.addDocumentAttachment(39, {
        tipo: 'di_externo',
        nombre: 'DI-EXT-2026-0041.pdf',
        emisor: 'UX20 Destino Gestor Ficticio',
        fecha: '2026-11-20',
        procedencia: 'externo',
        url: 'https://storage.ejemplo.test/di-ext-0041.pdf',
      });

      expect(updated.documentos_adjuntos).toHaveLength(1);
      const attached = updated.documentos_adjuntos![0];
      expect(attached.tipo).toBe('di_externo');
      expect(attached.procedencia).toBe('externo');
      expect(attached.emisor).toBe('UX20 Destino Gestor Ficticio');
      expect(attached.hash_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(savedPayload.observaciones).toContain('DI-EXT-2026-0041.pdf');
    });
  });

  describe('UXDEV-12: PDF económico abierto con estado visible y aviso de no factura', () => {
    it('genera PDF de liquidación provisional sin confundirlo con factura fiscal ni certificado ambiental', async () => {
      const openOp: CommercialOperation = {
        id: 39,
        user_id: 'user-negociante-1',
        numero_operacion: 'OP-2026-000002',
        fecha: '2026-11-20',
        estado: 'abierta',
        modalidad_posesion: 'intermediacion_sin_posesion',
        codigo_ler: '17 04 05',
        descripcion_residuo: 'Hierro y acero',
        peligrosidad: 'no-peligroso',
        cantidad_estimada_t: 0.02,
        tipo_precio_compra: 'por_kg',
        precio_unitario_compra: 0.15,
        coste_compra_total: 3.0,
        estado_pago_compra: 'pendiente',
        tipo_precio_venta: 'por_kg',
        precio_unitario_venta: 0.3,
        ingreso_venta_total: 6.0,
        estado_cobro_venta: 'pendiente',
        coste_transporte: 1.0,
        otros_costes: 0.5,
        margen_bruto_total: 1.5,
        margen_unitario_tonelada: 75,
        porcentaje_margen: 25,
        created_at: '2026-11-20T10:00:00Z',
        updated_at: '2026-11-20T10:00:00Z',
      };

      const pdf = await generateCommercialOperationPDF(openOp);
      const raw = pdf.output('datauristring');
      expect(raw).toContain('data:application/pdf');
      const internalText = JSON.stringify((pdf as any).internal?.pages || []);
      expect(internalText).toContain('PROVISIONAL');
      expect(internalText).toContain('NO ES FACTURA');
    });
  });
});

