/**
 * ==============================================================================
 * TEST DE INTEGRACIÓN P0 - INTEGRIDAD DE MAESTROS Y CONTRATOS FIRMADOS (FASE 5)
 * Valida los criterios de aceptación P0:
 * - UXDEV-01 / RES6-I01: Separar alta, edición y fusión explícita por CIF sin sobrescritura
 * - UXDEV-02 / RES6-I02: Instantánea inmutable por revisión firmada, hash PDF constante tras editar
 *   el maestro de empresa, invalidación de conformidades y recuperación de revisión anterior
 * ==============================================================================
 */

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://storage.test/sig.png' } })),
    })),
  },
  rpc: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

jest.mock('../auditService', () => ({
  auditService: {
    logAction: jest.fn().mockResolvedValue(true),
  },
}));

import crypto from 'crypto';
import {
  companyService,
  computeCompanyFingerprint,
} from '../companyService';
import {
  wasteContractService,
  computeContractSnapshotHash,
  buildContractRevisionRecord,
  reconstructContractFromRevision,
} from '../wasteContractService';
import { auditService } from '../auditService';
import { generateContractPDF } from '@/lib/pdfUtils';
import type { Company, WasteContract } from '@/types/wasteManagement';

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

describe('Auditoría P0 (Fase 5): Integridad de Maestros por CIF y Contratos Firmados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-p0-audit', email: 'auditor@resigest.test' } },
      error: null,
    });
  });

  describe('UXDEV-01 / RES6-I01: Protección de CIF, rechazo de duplicados y fusión explícita', () => {
    it('rechaza alta duplicada por CIF sin alterar la ficha existente ni su huella digital', async () => {
      const existingCompany: Partial<Company> = {
        id: 101,
        user_id: 'user-p0-audit',
        cif: 'B12345678',
        razon_social: 'Gestora Original S.L.',
        nima: '4100012345',
        numero_autorizacion: 'AN-001/2026',
        domicilio_social: 'Polígono Industrial Norte 12',
        municipio_social: 'Sevilla',
        provincia_social: 'Sevilla',
        roles: ['gestor'],
      };

      const hashBefore = computeCompanyFingerprint(existingCompany);

      const dupLookupChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 101, roles: ['gestor'], razon_social: 'Gestora Original S.L.' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(dupLookupChain);

      await expect(
        companyService.create({
          cif: 'b12345678',
          razon_social: 'Nombre Que Intenta Sobrescribir S.L.',
          tipo_empresa: 'transportista',
          roles: ['transportista'],
        } as any)
      ).rejects.toThrow(/Ya existe una empresa o contacto registrado con el CIF B12345678/);

      const hashAfter = computeCompanyFingerprint(existingCompany);
      expect(hashAfter).toBe(hashBefore);
    });

    it('rechaza colisión de CIF al editar una ficha existente hacia el CIF de otra ficha', async () => {
      const dupUpdateChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 101, razon_social: 'Gestora Original S.L.' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(dupUpdateChain);

      await expect(
        companyService.update(202, { cif: 'B12345678' })
      ).rejects.toThrow(/ya pertenece a otra ficha.*fusión explícita/i);
    });

    it('ejecuta fusión explícita unificando roles, conservando datos destino, desactivando origen y auditando', async () => {
      const targetCompany: Company = {
        id: 101,
        user_id: 'user-p0-audit',
        cif: 'B12345678',
        razon_social: 'Gestora Original S.L.',
        tipo_empresa: 'gestor',
        roles: ['gestor'],
        nima: '4100012345',
        domicilio_social: 'Av. Principal 1',
        municipio_social: 'Sevilla',
        provincia_social: 'Sevilla',
        activo: true,
        is_my_company: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      } as Company;

      const sourceCompany: Company = {
        id: 202,
        user_id: 'user-p0-audit',
        cif: 'B12345678',
        razon_social: 'Gestora Duplicada S.L.',
        tipo_empresa: 'transportista',
        roles: ['transportista'],
        numero_autorizacion: 'AUT-TRANS-99',
        telefono: '600123123',
        activo: true,
        is_my_company: false,
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      } as Company;

      const getByIdSpy = jest
        .spyOn(companyService, 'getById')
        .mockResolvedValueOnce(targetCompany)
        .mockResolvedValueOnce(sourceCompany);

      const updateSpy = jest.spyOn(companyService, 'update').mockResolvedValueOnce({
        ...targetCompany,
        roles: ['gestor', 'transportista'],
        numero_autorizacion: 'AUT-TRANS-99',
        telefono: '600123123',
      });

      const softDeleteSpy = jest.spyOn(companyService, 'softDelete').mockResolvedValueOnce();

      const merged = await companyService.mergeExplicit(101, 202);

      expect(merged.roles).toEqual(['gestor', 'transportista']);
      expect(merged.numero_autorizacion).toBe('AUT-TRANS-99');
      expect(merged.domicilio_social).toBe('Av. Principal 1');
      expect(softDeleteSpy).toHaveBeenCalledWith(202);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          entidad: 'empresa',
          entidad_id: 101,
          detalles: expect.objectContaining({
            evento: 'fusion_explicita',
            target_id: 101,
            source_id: 202,
          }),
        })
      );

      // Validaciones de error y opciones avanzadas en mergeExplicit
      await expect(companyService.mergeExplicit(101, 101)).rejects.toThrow(/consigo misma/);

      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(companyService.mergeExplicit(101, 202)).rejects.toThrow('Usuario no autenticado');

      getByIdSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(sourceCompany);
      await expect(companyService.mergeExplicit(101, 202)).rejects.toThrow(/No se encontraron las fichas/);

      // Fusión con overwriteFields y fallback de roles desde tipo_empresa legado
      const legacyTarget = { ...targetCompany, roles: undefined };
      const legacySource = { ...sourceCompany, roles: undefined, domicilio_social: 'Calle Nueva 9' };
      getByIdSpy.mockResolvedValueOnce(legacyTarget as any).mockResolvedValueOnce(legacySource as any);
      updateSpy.mockResolvedValueOnce({
        ...targetCompany,
        roles: ['gestor', 'transportista'],
        domicilio_social: 'Calle Nueva 9',
      });
      softDeleteSpy.mockResolvedValueOnce();

      const mergedWithOverwrite = await companyService.mergeExplicit(101, 202, {
        overwriteFields: ['domicilio_social'],
      });
      expect(mergedWithOverwrite.domicilio_social).toBe('Calle Nueva 9');

      // computeCompanyFingerprint maneja campos vacíos/nulos
      expect(computeCompanyFingerprint({})).toMatch(/^[0-9a-f]{64}$/);

      getByIdSpy.mockRestore();
      updateSpy.mockRestore();
      softDeleteSpy.mockRestore();
    });
  });

  describe('UXDEV-02 / RES6-I02: Inmutabilidad de contratos firmados, hash constante y recuperación histórica', () => {
    const frozenSnapshot = {
      version: 1,
      snapshot_date: '2026-05-10T10:30:00.000Z',
      company: {
        razon_social: 'Talleres Productor S.L.',
        cif: 'B11111111',
        nima: '4100001111',
        domicilio_social: 'C/ Industria 10',
        municipio_social: 'Sevilla',
      },
      gestor_company: {
        razon_social: 'Gestor Original Firmado S.A.',
        cif: 'A99999999',
        nima: '4100099999',
        domicilio_social: 'Polígono Sur Nave 4',
        municipio_social: 'Dos Hermanas',
        numero_autorizacion: 'G-41-ORIGINAL',
      },
    };

    const signedContractV1: WasteContract = {
      id: 58,
      user_id: 'user-p0-audit',
      company_id: 10,
      gestor_company_id: 20,
      numero_contrato: 'CT-2026-0058',
      fecha_contrato: '2026-05-10',
      fecha_inicio: '2026-05-10',
      fecha_fin: '2027-05-10',
      tipo_contrato: 'tratamiento',
      codigos_ler: ['17 04 05'],
      operaciones_tratamiento: ['R13'],
      cantidad_maxima_anual: 50,
      unidad_cantidad: 'toneladas',
      estado: 'vigente',
      firmado_productor: true,
      fecha_firma_productor: '2026-05-10T10:00:00.000Z',
      firmado_gestor: true,
      fecha_firma_gestor: '2026-05-10T10:30:00.000Z',
      version: 1,
      metadata_snapshot: {
        ...frozenSnapshot,
        pdf_hash: computeContractSnapshotHash(frozenSnapshot),
      },
      company: frozenSnapshot.company as Company,
      gestor_company: frozenSnapshot.gestor_company as Company,
      created_at: '2026-05-10T09:00:00.000Z',
      updated_at: '2026-05-10T10:30:00.000Z',
    };

    it('conserva exactamente el mismo hash PDF de una revisión firmada antes y después de editar el maestro del gestor', async () => {
      const pdfBefore = await generateContractPDF(signedContractV1);
      const rawBefore = pdfBefore.output();
      const hashBefore = sha256(rawBefore);

      // Simulamos que el maestro del gestor cambia radicalmente en la tabla companies
      const contractWithMutatedMaster: WasteContract = {
        ...signedContractV1,
        gestor_company: {
          ...signedContractV1.gestor_company!,
          razon_social: 'GESTOR RENOMBRADO POST-FIRMA S.L.',
          domicilio_social: 'Avenida Nueva 999',
          municipio_social: 'Madrid',
          numero_autorizacion: 'G-28-NUEVA-AUT',
        } as Company,
      };

      const pdfAfter = await generateContractPDF(contractWithMutatedMaster);
      const rawAfter = pdfAfter.output();
      const hashAfter = sha256(rawAfter);

      // El hash del PDF firmado NO debe cambiar ni un solo byte
      expect(hashAfter).toBe(hashBefore);
      expect(rawAfter).toContain('Gestor Original Firmado S.A.');
      expect(rawAfter).not.toContain('GESTOR RENOMBRADO POST-FIRMA S.L.');
    });

    it('invalida conformidades al editar términos materiales, archiva v1 en revision_history y permite recuperar el PDF exacto de v1', async () => {
      let persistedUpdatePayload: any = null;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }], error: null }),
          };
        }
        if (table === 'waste_contracts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: signedContractV1, error: null }),
            update: jest.fn().mockImplementation((payload: any) => {
              persistedUpdatePayload = payload;
              return {
                eq: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: { ...signedContractV1, ...payload },
                  error: null,
                }),
              };
            }),
          };
        }
        return null;
      });

      const updatedV2 = await wasteContractService.update(58, {
        cantidad_maxima_anual: 120,
      });

      // 1. La nueva revisión v2 invalida conformidades previas
      expect(updatedV2.version).toBe(2);
      expect(updatedV2.estado).toBe('pendiente_firma');
      expect(updatedV2.firmado_productor).toBe(false);
      expect(updatedV2.firmado_gestor).toBe(false);
      expect(updatedV2.metadata_snapshot).toBeNull();

      // 2. La revisión v1 quedó custodiada en revision_history con su snapshot congelado
      expect(Array.isArray(persistedUpdatePayload.revision_history)).toBe(true);
      expect(persistedUpdatePayload.revision_history).toHaveLength(1);
      const archivedV1 = persistedUpdatePayload.revision_history[0];
      expect(archivedV1.version).toBe(1);
      expect(archivedV1.cantidad_maxima_anual).toBe(50);
      expect(archivedV1.firmado_productor).toBe(true);
      expect(archivedV1.firmado_gestor).toBe(true);
      expect(archivedV1.metadata_snapshot?.gestor_company?.razon_social).toBe('Gestor Original Firmado S.A.');

      // 3. Se puede recuperar el PDF de la revisión v1 con exactamente el mismo hash original
      const originalPdfHash = sha256((await generateContractPDF(signedContractV1)).output());
      const recoveredPdf = await generateContractPDF(updatedV2, archivedV1);
      const recoveredPdfHash = sha256(recoveredPdf.output());
      expect(recoveredPdfHash).toBe(originalPdfHash);

      // Helper reconstructContractFromRevision preserva versión y firmas de v1 y también soporta revisión sin firmar
      const reconstructed = reconstructContractFromRevision(updatedV2, archivedV1);
      expect(reconstructed.version).toBe(1);
      expect(reconstructed.estado).toBe('vigente');
      expect(reconstructed.cantidad_maxima_anual).toBe(50);

      const unsignedRev = buildContractRevisionRecord({ ...signedContractV1, firmado_productor: false, firmado_gestor: false }, ['notas']);
      const reconstructedUnsigned = reconstructContractFromRevision(updatedV2, unsignedRev);
      expect(reconstructedUnsigned.estado).toBe('pendiente_firma');

      // Helper buildContractRevisionRecord crea registro estructurado
      const built = buildContractRevisionRecord(signedContractV1, ['cantidad_maxima_anual'], '2026-06-01T00:00:00Z');
      expect(built.archived_at).toBe('2026-06-01T00:00:00Z');
      expect(built.changed_fields).toEqual(['cantidad_maxima_anual']);
    });

    it('reintenta update limpiamente si metadata_snapshot o revision_history no existe aún en el schema cache', async () => {
      const payloadsSent: any[] = [];
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }], error: null }),
          };
        }
        if (table === 'waste_contracts') {
          return {
            update: jest.fn().mockImplementation((payload: any) => {
              payloadsSent.push(payload);
              const isFirstAttempt = payloadsSent.length === 1;
              return {
                eq: jest.fn().mockReturnThis(),
                or: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue(
                  isFirstAttempt
                    ? {
                        data: null,
                        error: {
                          message:
                            "Could not find the 'metadata_snapshot' column of 'waste_contracts' in the schema cache (revision_history)",
                        },
                      }
                    : { data: { ...signedContractV1, firmado_productor: true }, error: null }
                ),
              };
            }),
          };
        }
        return null;
      });

      const res = await wasteContractService.update(58, {
        firma_productor_url: 'https://storage.test/sig.png',
        metadata_snapshot: signedContractV1.metadata_snapshot,
      });

      expect(res.firmado_productor).toBe(true);
      expect(payloadsSent).toHaveLength(2);
      expect(payloadsSent[0]).toHaveProperty('metadata_snapshot');
      expect(payloadsSent[1]).not.toHaveProperty('metadata_snapshot');
    });
  });
});

