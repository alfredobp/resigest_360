import {
  INE_PROVINCE_NAMES,
  NIMA_LEGAL_DISCLAIMER,
  OFFICIAL_REGISTRATION_TYPES_RD764,
  PHYSICAL_CONTAINER_CATALOG,
  CONTAINER_MATERIALS,
  resolveIneProvinceCode,
  validateNimaRD764,
  canFinalizeOfficialDocumentWithNima,
  validateCenterRegistration,
  validateOwnershipTransferRD764,
  validateContainerSpecification,
  evaluateLegalObligations,
} from '../normativeCompliance';

describe('normativeCompliance - Ley 7/2022, RD 553/2020 y RD 764/2026', () => {
  describe('1. Provincias INE y validación NIMA (RD 764/2026)', () => {
    it('resolveIneProvinceCode debe resolver códigos directos (01–52) y nombres de provincia con/sin tildes', () => {
      expect(resolveIneProvinceCode('')).toBeNull();
      expect(resolveIneProvinceCode(null)).toBeNull();
      expect(resolveIneProvinceCode('41')).toBe('41');
      expect(resolveIneProvinceCode('11')).toBe('11');
      expect(resolveIneProvinceCode('Sevilla')).toBe('41');
      expect(resolveIneProvinceCode('Málaga')).toBe('29');
      expect(resolveIneProvinceCode('Cádiz')).toBe('11');
      expect(resolveIneProvinceCode('A Coruña')).toBe('15');
      expect(resolveIneProvinceCode('Bizkaia')).toBe('48');
      expect(resolveIneProvinceCode('Provincia Inventada')).toBeNull();
      expect(Object.keys(INE_PROVINCE_NAMES)).toHaveLength(52);
    });

    it('validateNimaRD764 debe validar formato exacto de 10 dígitos, prefijo INE y coherencia provincial sin inventar autorización', () => {
      // Vacío
      const emptyRes = validateNimaRD764('');
      expect(emptyRes.valid).toBe(false);
      expect(emptyRes.isAdministrativeAuthorization).toBe(false);
      expect(emptyRes.disclaimer).toBe(NIMA_LEGAL_DISCLAIMER);
      expect(emptyRes.errors[0]).toContain('vacío');

      // Más o menos de 10 dígitos o no numérico (ej: 783989383983)
      const tooLong = validateNimaRD764('783989383983', 'Sevilla');
      expect(tooLong.valid).toBe(false);
      expect(tooLong.errors.some((e) => e.includes('10 dígitos numéricos'))).toBe(true);
      expect(tooLong.errors.some((e) => e.includes('código provincial INE válido'))).toBe(true);

      // 10 dígitos pero provincia incoherente (NIMA 41 Sevilla en centro de Málaga 29)
      const mismatch = validateNimaRD764('4100023456', 'Málaga');
      expect(mismatch.valid).toBe(false);
      expect(mismatch.provinceMatchesCenter).toBe(false);
      expect(mismatch.errors.some((e) => e.includes('Incoherencia provincial en NIMA'))).toBe(true);

      // 10 dígitos válidos y coherentes con provincia
      const validSevilla = validateNimaRD764('4100023456', 'Sevilla');
      expect(validSevilla.valid).toBe(true);
      expect(validSevilla.provincePrefix).toBe('41');
      expect(validSevilla.provinceName).toBe('Sevilla');
      expect(validSevilla.provinceMatchesCenter).toBe(true);
      expect(validSevilla.isAdministrativeAuthorization).toBe(false);
      expect(validSevilla.errors).toHaveLength(0);
    });

    it('canFinalizeOfficialDocumentWithNima debe permitir guardar borrador en pendiente_verificar pero bloquear cierre oficial', () => {
      // Sin NIMA
      const noNima = canFinalizeOfficialDocumentWithNima('pendiente_verificar', '');
      expect(noNima.canSaveDraft).toBe(true);
      expect(noNima.canFinalizeOfficial).toBe(false);
      expect(noNima.effectiveStatus).toBe('pendiente_verificar');

      // Con NIMA inválido
      const invalidNima = canFinalizeOfficialDocumentWithNima('formato_valido', '9912345678', 'Cádiz');
      expect(invalidNima.canSaveDraft).toBe(true);
      expect(invalidNima.canFinalizeOfficial).toBe(false);
      expect(invalidNima.effectiveStatus).toBe('invalido');

      // Con NIMA válido pero estado pendiente_verificar
      const pendingVerify = canFinalizeOfficialDocumentWithNima('pendiente_verificar', '1100012345', 'Cádiz');
      expect(pendingVerify.canSaveDraft).toBe(true);
      expect(pendingVerify.canFinalizeOfficial).toBe(false);
      expect(pendingVerify.effectiveStatus).toBe('pendiente_verificar');

      // Con NIMA válido y verificado / formato_valido
      const verified = canFinalizeOfficialDocumentWithNima('verificado', '1100012345', 'Cádiz');
      expect(verified.canSaveDraft).toBe(true);
      expect(verified.canFinalizeOfficial).toBe(true);
      expect(verified.effectiveStatus).toBe('verificado');

      const defaultStatus = canFinalizeOfficialDocumentWithNima(undefined, '1100012345', 'Cádiz');
      expect(defaultStatus.canFinalizeOfficial).toBe(true);
      expect(defaultStatus.effectiveStatus).toBe('formato_valido');
    });
  });

  describe('2. Inscripciones RD 764/2026 y Cambios de Titularidad (art. 7.2.b)', () => {
    it('debe contener todos los códigos oficiales de inscripción del RD 764/2026 y validar registros', () => {
      const codes = Object.keys(OFFICIAL_REGISTRATION_TYPES_RD764);
      expect(codes).toEqual(
        expect.arrayContaining(['P01', 'P02', 'P03', 'G01', 'G02', 'G04', 'G05', 'E01', 'E02', 'T01', 'T02', 'N01', 'N02', 'A01', 'A02'])
      );

      expect(validateCenterRegistration({}).valid).toBe(false);
      expect(
        validateCenterRegistration({
          codigo_inscripcion: 'G01',
          numero_inscripcion: 'AN-G01-0452',
        }).valid
      ).toBe(true);
    });

    it('validateOwnershipTransferRD764 debe exigir nuevo titular distinto y NIMA conservado válido', () => {
      const invalidTransfer = validateOwnershipTransferRD764({
        previous_owner_nif: 'B11111111',
        previous_owner_razon_social: 'Antigua S.L.',
        new_owner_nif: 'B11111111',
        new_owner_razon_social: 'Misma S.L.',
        preserved_nima: 'BAD-NIMA',
      });
      expect(invalidTransfer.valid).toBe(false);
      expect(invalidTransfer.errors.length).toBeGreaterThanOrEqual(3);

      const missingParties = validateOwnershipTransferRD764({});
      expect(missingParties.valid).toBe(false);

      const validTransfer = validateOwnershipTransferRD764(
        {
          previous_owner_nif: 'B11111111',
          previous_owner_razon_social: 'Titular Anterior S.L.',
          new_owner_nif: 'B22222222',
          new_owner_razon_social: 'Nuevo Titular S.A.',
          fecha_cambio_titularidad: '2026-10-01',
          preserved_nima: '4100099887',
        },
        'Sevilla'
      );
      expect(validTransfer.valid).toBe(true);
      expect(validTransfer.errors).toHaveLength(0);
    });
  });

  describe('3. Catálogo cerrado de 17 tipos de contenedores + "Otro (especificar)"', () => {
    it('debe exponer exactamente los 17 tipos físicos más la opción "otro"', () => {
      expect(PHYSICAL_CONTAINER_CATALOG).toHaveLength(18);
      expect(CONTAINER_MATERIALS.length).toBeGreaterThanOrEqual(8);
    });

    it('debe exigir descripción personalizada cuando se selecciona "otro"', () => {
      const badOther = validateContainerSpecification({
        tipo_contenedor: 'otro',
        descripcion_personalizada: 'ab',
        numero_unidades: 2,
      });
      expect(badOther.valid).toBe(false);
      expect(badOther.errors.some((e) => e.includes('Otro (especificar)'))).toBe(true);

      const goodOther = validateContainerSpecification({
        tipo_contenedor: 'otro',
        descripcion_personalizada: 'Contenedor blindado plomo para baterías',
        numero_unidades: 2,
        peso_estimado_kg: 450,
      });
      expect(goodOther.valid).toBe(true);
      expect(goodOther.displayLabel).toBe('Otro: Contenedor blindado plomo para baterías');
      expect(goodOther.calculatedWeightKg).toBe(450);
    });

    it('no debe convertir automáticamente volumen (L o m3) en peso sin densidad justificada', () => {
      const noDensityM3 = validateContainerSpecification({
        tipo_contenedor: 'contenedor_metalico_obra',
        numero_unidades: 1,
        capacidad_valor: 7,
        capacidad_unidad: 'm3',
      });
      expect(noDensityM3.valid).toBe(true);
      expect(noDensityM3.calculatedWeightKg).toBeNull();
      expect(noDensityM3.warnings.some((w) => w.includes('No se convierte automáticamente a peso'))).toBe(true);

      const withDensityM3 = validateContainerSpecification({
        tipo_contenedor: 'contenedor_metalico_obra',
        numero_unidades: 2,
        capacidad_valor: 5,
        capacidad_unidad: 'm3',
        densidad_kg_m3: 850,
      });
      expect(withDensityM3.calculatedWeightKg).toBe(8500);

      const withDensityLiters = validateContainerSpecification({
        tipo_contenedor: 'bidon_tambor',
        numero_unidades: 4,
        capacidad_valor: 200,
        capacidad_unidad: 'L',
        densidad_kg_m3: 900,
      });
      expect(withDensityLiters.calculatedWeightKg).toBe(720);

      const capacityInKg = validateContainerSpecification({
        tipo_contenedor: 'big_bag',
        numero_unidades: 3,
        capacidad_valor: 1000,
        capacidad_unidad: 'kg',
      });
      expect(capacityInKg.calculatedWeightKg).toBe(3000);
    });

    it('debe validar granel sin envase y controles de residuos peligrosos (plazo 6 meses, etiquetado, retención, compatibilidad)', () => {
      const bulkValid = validateContainerSpecification({
        tipo_contenedor: 'granel_sin_envase',
        peso_estimado_kg: 12000,
      });
      expect(bulkValid.valid).toBe(true);

      const invalidTypeAndUnits = validateContainerSpecification({
        tipo_contenedor: 'inexistente' as any,
        numero_unidades: 0,
      });
      expect(invalidTypeAndUnits.valid).toBe(false);
      expect(invalidTypeAndUnits.errors).toHaveLength(2);

      // Residuo peligroso con depósito > 180 días y checks fallidos
      const refDate = new Date('2026-11-18T12:00:00Z');
      const hazardousExpired = validateContainerSpecification(
        {
          tipo_contenedor: 'grg_ibc',
          numero_unidades: 1,
          fecha_inicio_deposito: '2026-01-01',
          etiquetado_reglamentario: false,
          estanqueidad_retencion: false,
          compatibilidad_quimica: false,
        },
        true,
        refDate
      );
      expect(hazardousExpired.valid).toBe(false);
      expect(hazardousExpired.exceedsSixMonthHazardousLimit).toBe(true);
      expect(hazardousExpired.errors.length).toBeGreaterThanOrEqual(4);

      // Residuo peligroso sin fecha_inicio_deposito genera advertencia
      const hazardousNoDate = validateContainerSpecification(
        {
          tipo_contenedor: 'bidon_tambor',
          numero_unidades: 2,
          etiquetado_reglamentario: true,
        },
        true,
        refDate
      );
      expect(hazardousNoDate.valid).toBe(true);
      expect(hazardousNoDate.warnings.some((w) => w.includes('fecha de inicio de depósito'))).toBe(true);
    });
  });

  describe('4. Matriz de Obligaciones Legales (evaluateLegalObligations)', () => {
    it('debe evaluar productor de residuos peligrosos < 10 t/año (exento de Plan de Minimización pero obligado a NIMA, Archivo y Memoria 1 de marzo)', () => {
      const items = evaluateLegalObligations({
        profile: 'productor',
        generatesHazardousWaste: true,
        hazardousWasteTonnesPerYear: 4.2,
        nonHazardousWasteTonnesPerYear: 15,
        hasValidNima: true,
        nimaStatus: 'verificado',
        hasEnvironmentalAuthorization: false,
        hasValidTreatmentContracts: true,
        hasChronologicalArchiveEntries: true,
        hasSubmittedOrDraftAnnualReport: true,
        hasHazardousLabelingAndDepositDates: true,
        maxHazardousStorageDays: 45,
      });

      const byId = Object.fromEntries(items.map((i) => [i.id, i]));
      expect(byId.inscripcion_nima_rd764.estado).toBe('cumple');
      expect(byId.almacenamiento_etiquetado_rp_art21.estado).toBe('cumple');
      expect(byId.contrato_di_rd553.estado).toBe('cumple');
      expect(byId.archivo_cronologico_art64.estado).toBe('cumple');
      expect(byId.memoria_anual_art65.estado).toBe('cumple');
      expect(byId.plan_minimizacion_rp_art18.estado).toBe('no_aplica');
      expect(byId.plan_minimizacion_rp_art18.justificacion).toContain('< 10 t/año');
    });

    it('debe evaluar productor de residuos peligrosos >= 10 t/año con incidencias de NIMA y almacenamiento > 6 meses', () => {
      const items = evaluateLegalObligations({
        profile: 'productor',
        generatesHazardousWaste: true,
        hazardousWasteTonnesPerYear: 14.5,
        nonHazardousWasteTonnesPerYear: 0,
        hasValidNima: false,
        nimaStatus: 'invalido',
        hasEnvironmentalAuthorization: false,
        hasValidTreatmentContracts: false,
        hasChronologicalArchiveEntries: false,
        hasSubmittedOrDraftAnnualReport: false,
        hasMinimizationPlan: false,
        maxHazardousStorageDays: 210,
      });

      const byId = Object.fromEntries(items.map((i) => [i.id, i]));
      expect(byId.inscripcion_nima_rd764.estado).toBe('incidencia');
      expect(byId.almacenamiento_etiquetado_rp_art21.estado).toBe('incidencia');
      expect(byId.contrato_di_rd553.estado).toBe('pendiente_acreditar');
      expect(byId.archivo_cronologico_art64.estado).toBe('pendiente_acreditar');
      expect(byId.memoria_anual_art65.estado).toBe('pendiente_acreditar');
      expect(byId.plan_minimizacion_rp_art18.estado).toBe('pendiente_acreditar');
      expect(byId.plan_minimizacion_rp_art18.exigible).toBe(true);
    });

    it('debe evaluar productor exclusivo de residuos no peligrosos (<= 10 t/año vs > 1.000 t/año)', () => {
      const smallRnp = evaluateLegalObligations({
        profile: 'productor',
        generatesHazardousWaste: false,
        hazardousWasteTonnesPerYear: 0,
        nonHazardousWasteTonnesPerYear: 6.5,
        hasValidNima: false,
        hasEnvironmentalAuthorization: false,
        hasValidTreatmentContracts: true,
        hasChronologicalArchiveEntries: false,
        hasSubmittedOrDraftAnnualReport: false,
      });

      const smallMap = Object.fromEntries(smallRnp.map((i) => [i.id, i]));
      expect(smallMap.inscripcion_nima_rd764.estado).toBe('no_aplica');
      expect(smallMap.archivo_cronologico_art64.estado).toBe('no_aplica');
      expect(smallMap.memoria_anual_art65.estado).toBe('no_aplica');
      expect(smallMap.plan_minimizacion_rp_art18.estado).toBe('no_aplica');

      const largeRnp = evaluateLegalObligations({
        profile: 'productor',
        generatesHazardousWaste: false,
        hazardousWasteTonnesPerYear: 0,
        nonHazardousWasteTonnesPerYear: 1250,
        hasValidNima: false,
        hasEnvironmentalAuthorization: false,
        hasValidTreatmentContracts: true,
        hasChronologicalArchiveEntries: true,
        hasSubmittedOrDraftAnnualReport: false,
      });

      const largeMap = Object.fromEntries(largeRnp.map((i) => [i.id, i]));
      expect(largeMap.inscripcion_nima_rd764.exigible).toBe(true);
      expect(largeMap.inscripcion_nima_rd764.estado).toBe('pendiente_acreditar');
      expect(largeMap.archivo_cronologico_art64.estado).toBe('cumple');
    });

    it('debe evaluar gestor, transportista, negociante y consultora con representación delegada', () => {
      const managerItems = evaluateLegalObligations({
        profile: 'gestor',
        generatesHazardousWaste: true,
        hazardousWasteTonnesPerYear: 50,
        nonHazardousWasteTonnesPerYear: 200,
        hasValidNima: true,
        hasEnvironmentalAuthorization: true,
        hasValidTreatmentContracts: true,
        hasChronologicalArchiveEntries: true,
        hasSubmittedOrDraftAnnualReport: true,
        hasMinimizationPlan: true,
        hasHazardousLabelingAndDepositDates: false,
        isDelegatedRepresentation: true,
        hasDelegatedActorTrace: true,
      });

      const mgrMap = Object.fromEntries(managerItems.map((i) => [i.id, i]));
      expect(mgrMap.inscripcion_nima_rd764.estado).toBe('cumple');
      expect(mgrMap.almacenamiento_etiquetado_rp_art21.estado).toBe('pendiente_acreditar');
      expect(mgrMap.plan_minimizacion_rp_art18.estado).toBe('cumple');
      expect(mgrMap.representacion_delegada_consultoria.estado).toBe('cumple');

      const carrierItems = evaluateLegalObligations({
        profile: 'transportista',
        generatesHazardousWaste: false,
        hazardousWasteTonnesPerYear: 0,
        nonHazardousWasteTonnesPerYear: 100,
        hasValidNima: false,
        hasEnvironmentalAuthorization: false,
        hasValidTreatmentContracts: true,
        hasChronologicalArchiveEntries: true,
        hasSubmittedOrDraftAnnualReport: true,
      });
      const carrierMap = Object.fromEntries(carrierItems.map((i) => [i.id, i]));
      expect(carrierMap.almacenamiento_etiquetado_rp_art21.estado).toBe('no_aplica');
      expect(carrierMap.memoria_anual_art65.estado).toBe('cumple');
    });
  });
});

