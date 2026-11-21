import { createClient } from '@/lib/supabase/client';
import { applyTenantScope } from './tenantContextService';
import { buildNTCode, resolveDocumentYear } from './documentSequenceService';
import type { PriorNotification } from '@/types/wasteManagement';
import {
  buildAuthorizationIdXml,
  formatNima,
  getCACodeByProvince,
  getProvinceCodeByName,
  siraService,
} from './siraService';

const supabase = createClient();

/**
 * Normaliza y valida un código oficial de Notificación Previa (NT) conforme a E3L 3.3:
 * NT + origen (2 dígitos) + NIMA (10 dígitos) + año (4 dígitos) + correlativo (7 dígitos) = 25 caracteres
 */
export const formatNTCode = (
  rawCode: string | undefined | null,
  nima: string,
  ntId?: number | string
): string => {
  const cleanCode = String(rawCode || '').trim();
  const validPattern = /^NT(([01][0-9]9999999999)|([01][0-9]|[235]0)(0[1-9]|[1-4][0-9]|5[0-2])\d{8})\d{4}\d{7}$/;
  if (validPattern.test(cleanCode)) {
    return cleanCode;
  }

  const currentYear = new Date().getFullYear().toString();
  const validNima = /^(0[1-9]|[1-4][0-9]|5[0-2])\d{8}$/.test(nima) ? nima : '9999999999';
  const origin = validNima === '9999999999' ? '01' : '10';
  const seqDigits = String(ntId || '').replace(/\D/g, '') || String(cleanCode).replace(/\D/g, '') || '1';
  const paddedSeq = seqDigits.padStart(7, '0').slice(-7);

  return `NT${origin}${validNima}${currentYear}${paddedSeq}`;
};

const normalizeLerCode = (rawLer: string): string => {
  if (!rawLer) return '999999';
  return String(rawLer).replace(/[\s*.-]/g, '').trim();
};

const normalizeOperation = (op: string): string => {
  if (!op) return 'R13';
  const cleanOp = String(op).trim().toUpperCase();
  return cleanOp.replace(/^([RD])(\d)$/, '$10$2');
};

const normalizeHpCode = (hp: string): string => {
  if (!hp) return 'HP4';
  const cleanHp = String(hp).trim().toUpperCase().replace(/\s+/g, '');
  const match = cleanHp.match(/^(?:HP|H)0?([1-9]|1[0-5])$/);
  return match ? `HP${match[1]}` : 'HP4';
};

export interface E3LNTValidationResult {
  valid: boolean;
  schemaVersion: string;
  errors: string[];
  warnings: string[];
}

export function validateNTDateRules(nt: Partial<PriorNotification>): string[] {
  const errors: string[] = [];

  if (nt.fecha_inicio && nt.fecha_fin) {
    const startTime = new Date(nt.fecha_inicio).getTime();
    const endTime = new Date(nt.fecha_fin).getTime();
    if (!isNaN(startTime) && !isNaN(endTime)) {
      if (endTime < startTime) {
        errors.push('La fecha de finalización de la Notificación Previa no puede ser anterior a la fecha de inicio.');
      } else {
        const maxEnd = new Date(nt.fecha_inicio);
        maxEnd.setFullYear(maxEnd.getFullYear() + 3);
        if (endTime > maxEnd.getTime()) {
          errors.push('La vigencia de la Notificación Previa no puede superar el plazo máximo de 3 años (art. 8.3 RD 553/2020).');
        }
      }
    }
  }

  if (nt.fecha_notificacion && nt.fecha_inicio) {
    const notifTime = new Date(nt.fecha_notificacion).getTime();
    const startTime = new Date(nt.fecha_inicio).getTime();
    if (!isNaN(notifTime) && !isNaN(startTime)) {
      const diffDays = Math.round((startTime - notifTime) / (1000 * 60 * 60 * 24));
      if (diffDays < 10) {
        errors.push('La Notificación Previa debe presentarse con al menos 10 días naturales de antelación al inicio del traslado (art. 8.2 RD 553/2020).');
      }
    }
  }

  return errors;
}

export function validateNTForE3L(nt: Partial<PriorNotification>): E3LNTValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!nt.operador_cif || !String(nt.operador_cif).trim()) {
    errors.push('Falta el CIF/NIF del Operador del traslado (NTTransferOperatorData/nationalId).');
  }
  if (!nt.productor_cif || !String(nt.productor_cif).trim()) {
    errors.push('Falta el CIF/NIF del Productor / Origen (NTProducerData/nationalId).');
  }
  if (!nt.gestor_cif || !String(nt.gestor_cif).trim()) {
    errors.push('Falta el CIF/NIF del Gestor Destinatario (NTAdresseeData/nationalId).');
  }

  const cleanLer = normalizeLerCode(nt.codigo_ler || '');
  if (!/^\d{6}$/.test(cleanLer)) {
    errors.push(`Código LER inválido (${nt.codigo_ler || 'vacío'}): debe contener 6 dígitos numéricos.`);
  }

  const op = normalizeOperation(nt.operacion_tratamiento || '');
  if (!/^(R(0[1-9]|1[0-5])|D(0[1-9]|1[0-5]))(\d{2})?$/.test(op)) {
    errors.push(`Operación de tratamiento inválida (${op || 'vacía'}).`);
  }

  if (!nt.cantidad_estimada_kg || Number(nt.cantidad_estimada_kg) <= 0) {
    errors.push('La cantidad estimada en Kg (NTResidueQuantity) debe ser mayor que 0.');
  }

  if (!nt.fecha_fin) {
    errors.push('Falta la fecha de finalización o vigencia de la Notificación Previa.');
  }

  errors.push(...validateNTDateRules(nt));

  const nimaPattern = /^(0[1-9]|[1-4][0-9]|5[0-2])\d{8}$/;
  if (!nt.productor_nima) {
    warnings.push('Falta NIMA del centro productor.');
  } else if (!nimaPattern.test(String(nt.productor_nima).trim())) {
    errors.push(`NIMA del centro productor inválido (${nt.productor_nima}): debe tener 10 dígitos con prefijo provincial INE 01–52 (RD 764/2026).`);
  }
  if (!nt.gestor_nima) {
    warnings.push('Falta NIMA de la instalación de destino.');
  } else if (!nimaPattern.test(String(nt.gestor_nima).trim())) {
    errors.push(`NIMA de la instalación de destino inválido (${nt.gestor_nima}): debe tener 10 dígitos con prefijo provincial INE 01–52 (RD 764/2026).`);
  }

  // RD 553/2020: En operaciones intermedias (R12, R13, D13, D14, D15), advertir si falta instalación de tratamiento posterior
  const opBase = op.slice(0, 3);
  if (['R12', 'R13', 'D13', 'D14', 'D15'].includes(opBase) && !nt.destino_posterior_razon_social && !nt.destino_posterior_nima) {
    warnings.push(`La operación ${op} es intermedia (almacenamiento/agrupación): debe consignar la instalación de destino posterior prevista (RD 553/2020).`);
  }

  if (!nt.productor_municipio || !nt.gestor_municipio) {
    warnings.push('Falta municipio oficial en origen o destino.');
  }
  if (!nt.operador_codigo_postal) warnings.push('Falta código postal del operador del traslado.');
  if (!nt.productor_codigo_postal) warnings.push('Falta código postal del centro productor.');
  if (!nt.gestor_codigo_postal) warnings.push('Falta código postal del gestor destinatario.');
  if (!nt.operador_telefono && !nt.operador_email) warnings.push('Faltan datos de contacto del operador.');

  return {
    valid: errors.length === 0,
    schemaVersion: 'E3L v3.3 (Junta de Andalucía / SIRA)',
    errors,
    warnings,
  };
}

export const priorNotificationService = {
  /**
   * Obtener todas las Notificaciones Previas del usuario
   */
  async getAll(): Promise<PriorNotification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const baseQuery = supabase
      .from('prior_notifications')
      .select(`
        *,
        company:companies(*)
      `);

    const { data, error } = await applyTenantScope(baseQuery, user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener notificaciones previas: ${error.message}`);
    }

    return (data || []) as PriorNotification[];
  },

  /**
   * Obtener Notificación Previa por ID
   */
  async getById(id: number): Promise<PriorNotification> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const baseQuery = supabase
      .from('prior_notifications')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id);

    const { data, error } = await applyTenantScope(baseQuery, user.id)
      .single();

    if (error || !data) {
      throw new Error(`Notificación Previa no encontrada: ${error?.message || 'ID inexistente'}`);
    }

    return data as PriorNotification;
  },

  /**
   * Crear nueva Notificación Previa
   */
  async create(notificationData: Partial<PriorNotification>): Promise<PriorNotification> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    if (!notificationData.company_id) {
      throw new Error('Falta el ID de empresa para asociar la Notificación Previa');
    }

    const dateErrors = validateNTDateRules(notificationData);
    if (dateErrors.length > 0) {
      throw new Error(dateErrors[0]);
    }

    const { numero_notificacion: _ignoredNtNumber, ...insertData } = notificationData;
    void _ignoredNtNumber;

    // Fallback E3L coherente (en BD el trigger BEFORE INSERT asigna el correlativo atómico definitivo)
    const fallbackNtCode = buildNTCode(
      insertData.productor_nima || insertData.operador_nima || '',
      resolveDocumentYear(insertData.fecha_notificacion),
      1
    );

    const { data, error } = await supabase
      .from('prior_notifications')
      .insert({
        ...insertData,
        numero_notificacion: fallbackNtCode,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear Notificación Previa: ${error.message}`);
    }

    return data as PriorNotification;
  },

  /**
   * Actualizar Notificación Previa
   */
  async update(id: number, notificationData: Partial<PriorNotification>): Promise<PriorNotification> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const existing = await this.getById(id).catch(() => null);
    if (existing && (existing.estado === 'aceptada' || existing.estado === 'enviada_sira')) {
      throw new Error(
        `No se puede modificar una Notificación Previa en estado '${existing.estado}'.`
      );
    }

    const mergedForValidation = existing
      ? { ...existing, ...notificationData }
      : notificationData;
    const dateErrors = validateNTDateRules(mergedForValidation);
    if (dateErrors.length > 0) {
      throw new Error(dateErrors[0]);
    }

    const { numero_notificacion: _immutableNtNumber, ...mutableData } = notificationData;
    void _immutableNtNumber;

    const updateQuery = supabase
      .from('prior_notifications')
      .update({
        ...mutableData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    const { data, error } = await applyTenantScope(updateQuery, user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar Notificación Previa: ${error.message}`);
    }

    return data as PriorNotification;
  },

  /**
   * Eliminar Notificación Previa (solo en borrador o rechazada)
   */
  async delete(id: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const existing = await this.getById(id).catch(() => null);
    if (existing && existing.estado && !['borrador', 'rechazada'].includes(existing.estado)) {
      throw new Error(
        `No se puede eliminar una Notificación Previa en estado '${existing.estado}' (solo borrador o rechazada).`
      );
    }

    const deleteQuery = supabase
      .from('prior_notifications')
      .delete()
      .eq('id', id);

  const { error } = await applyTenantScope(deleteQuery, user.id);

  if(error) {
    throw new Error(`Error al eliminar Notificación Previa: ${error.message}`);
  }
},

  /**
   * Formatea un número oficial de NT
   */
  formatNTCode(rawCode: string | undefined | null, nima: string, ntId?: number | string): string {
    return formatNTCode(rawCode, nima, ntId);
  },

    /**
     * Valida los requisitos de la NT antes de transmitir a SIRA
     */
    validateForE3L(nt: Partial<PriorNotification>): E3LNTValidationResult {
  return validateNTForE3L(nt);
},

/**
 * Genera el XML E3L <wasteNT> conforme a e3l-waste.xsd
 */
generateNTXml(nt: Partial<PriorNotification>): string {
  const clean = (val: any) => (val ? siraService.escapeXml(String(val)).trim() : '');
  const isDanger = nt.peligrosidad === 'peligroso' || String(nt.codigo_ler || '').includes('*');
  const cleanLer = normalizeLerCode(nt.codigo_ler || '');
  const cleanOp = normalizeOperation(nt.operacion_tratamiento || 'R13');

  const date = new Date();
  const fallbackDate = date.toISOString().split('T')[0];
  const rawNotifDate = nt.fecha_notificacion ? String(nt.fecha_notificacion).split('T')[0] : '';
  const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawNotifDate) ? rawNotifDate : fallbackDate;
  const ntYear = formattedDate.slice(0, 4);
  const startDate = nt.fecha_inicio ? String(nt.fecha_inicio).split('T')[0] : formattedDate;
  const endDate = nt.fecha_fin ? String(nt.fecha_fin).split('T')[0] : `${date.getFullYear() + 1}-12-31`;

  const buildAddressXml = (
    rawAddress: string | undefined,
    rawCp: string | undefined,
    rawMuni: string | undefined,
    rawProv: string | undefined,
    indent = '                '
  ) => {
    const provName = clean(rawProv || 'Cádiz');
    const provCode = getProvinceCodeByName(rawProv || 'Cádiz');
    const muniName = clean(rawMuni) || (provCode === '11' ? 'Puerto Real' : 'Municipio');
    const muniCode = siraService.getMunicipalityCode(provCode, muniName);
    const address = clean(rawAddress) || 'Sin dirección';
    const cp = clean(rawCp);
    const cpLine = /^\d{5}$/.test(cp) ? `\n${indent}    <CP>${cp}</CP>` : '';
    const caCode = getCACodeByProvince(provCode);
    return `${indent}<spanishAddress>
${indent}    <vial vialCode="009" vialDescription="Calle"/>
${indent}    <address>${address}</address>${cpLine}
${indent}    <municipality municipalityCode="${muniCode}" municipalityName="${muniName}"/>
${indent}    <province provinceCode="${provCode}" provinceName="${provName}"/>
${indent}    <CA CACode="${caCode}"/>
${indent}    <country countryCode="724"/>
${indent}</spanishAddress>`;
  };

  const buildContactXml = (rawPhone: string | undefined, rawEmail: string | undefined, indent = '            ') => {
    const phone = clean(rawPhone).replace(/\D/g, '').slice(0, 13);
    const email = clean(rawEmail);
    const safeEmail = email.includes('@') ? email.slice(0, 50) : '';
    // EsirAugiasPR4.xsd (SIRA live): <centerContact>, <phone> y <mail> tienen minOccurs="1"
    return `\n${indent}<centerContact>\n${indent}    <phone>${phone}</phone>\n${indent}    <mail>${safeEmail}</mail>\n${indent}</centerContact>`;
  };

  const opProvCode = getProvinceCodeByName(nt.operador_provincia || 'Cádiz');
  const opNima = formatNima(nt.operador_nima, opProvCode);
  const prodProvCode = getProvinceCodeByName(nt.productor_provincia || 'Cádiz');
  const prodNima = formatNima(nt.productor_nima, prodProvCode);
  const gestProvCode = getProvinceCodeByName(nt.gestor_provincia || 'Cádiz');
  const gestNima = formatNima(nt.gestor_nima, gestProvCode);

  const rawWeight = Number(nt.cantidad_estimada_kg || 1000);
  const cleanQuantity = (!isNaN(rawWeight) && rawWeight > 0 ? rawWeight : 1000).toFixed(3);

  const residueTypeAttr = isDanger
    ? 'xsi:type="wassup:dangerousResidueType"'
    : 'xsi:type="wassup:noDangerousResidueType"';
  const residueTablesType = isDanger
    ? 'xsi:type="wassup:tablesDangerousType"'
    : 'xsi:type="wassup:tablesNoDangerousType"';
  const hpBlock = isDanger
    ? `\n            <table5>${normalizeHpCode(nt.caracteristica_peligrosidad || '')}</table5>`
    : '';

  const ntCode = formatNTCode(nt.numero_notificacion, prodNima, nt.id);

  const xmlnsWassup = 'xmlns:wassup="e3l://eterproject.org/3.0/wasteSupport"';
  const xmlnsCommon = 'xmlns:common="e3l://eterproject.org/3.0/common"';
  const xmlnsXsi = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';

  const isIndividual = nt.tipo_notificacion === 'individual' || nt.tipo_notificacion === 'puntual';
  const isRegional = !nt.tipo_traslado || nt.tipo_traslado === 'autonomico';
  const frequency = clean(nt.frecuencia) || (isIndividual ? 'Puntual' : 'Periodica');

  const opBase = cleanOp.slice(0, 3);
  const isIntermediateOp = ['R12', 'R13', 'D13', 'D14', 'D15'].includes(opBase);
  const hasFinalDestination =
    isIntermediateOp &&
    Boolean(nt.destino_posterior_razon_social || nt.destino_posterior_nima || nt.destino_posterior_cif);

  let finalAdresseeBlock = '';
  if (hasFinalDestination) {
    const finalProvCode = getProvinceCodeByName(nt.gestor_provincia || 'Cádiz');
    const finalNima = formatNima(nt.destino_posterior_nima, finalProvCode);
    const finalOp = normalizeOperation(nt.destino_posterior_operacion_rd || 'R04').slice(0, 3);
    const finalCif = clean(nt.destino_posterior_cif);
    const finalName = clean(nt.destino_posterior_razon_social);
    finalAdresseeBlock = `

    <!-- 5. Tratamiento posterior (operación intermedia) -->
    <NTFinalAdresseeData>
        <AdresseeData>${finalCif ? `
            <entityId>
                <nationalId>${finalCif}</nationalId>
            </entityId>` : ''}
            <entityFJ entityFJCode="J" />${finalName ? `
            <entityName>
                <reason>
                    <reasonName>${finalName}</reasonName>
                    <reasonAssociation associationCode="99" associationDescription="Otra"/>
                </reason>
            </entityName>` : ''}
            <entityCenter>
                <centerID centerCode="${finalNima}" />
                <centerEconomicActivity>S/D</centerEconomicActivity>
                <centerAddress>
${buildAddressXml(nt.gestor_direccion, nt.gestor_codigo_postal, nt.gestor_municipio, nt.gestor_provincia, '                    ')}
                </centerAddress>${buildContactXml(nt.gestor_telefono, nt.gestor_email, '                ')}
                <wasteCenterAuthorization>
${buildAuthorizationIdXml(undefined, finalNima, '                    ')}
                    <authorizationCode>${isDanger ? 'G01' : 'G04'}</authorizationCode>
                </wasteCenterAuthorization>
            </entityCenter>
            <wasteManagerType managerTypeCode="${isDanger ? 'G01' : 'G04'}"/>
        </AdresseeData>
        <Operation>${finalOp}</Operation>
    </NTFinalAdresseeData>`;
  }

  return `
<wasteNT 
    ${xmlnsWassup}
    ${xmlnsCommon}
    ${xmlnsXsi}
    NTCode="${ntCode}"
    NTYear="${ntYear}"
    NTDate="${formattedDate}"
    NTStartDate="${startDate}"
    NTEndDate="${endDate}"
    NTFrequency="${frequency}"
    NTIndividual="${isIndividual ? 'S' : 'N'}"
    NTRegional="${isRegional ? 'S' : 'N'}"
    NTSendtoDestinationAuthority="${isRegional ? 'N' : 'S'}">

    <!-- 1. Operador del Traslado -->
    <NTTransferOperatorData>
        <entityId>
            <nationalId>${clean(nt.operador_cif)}</nationalId>
        </entityId>
        <entityFJ entityFJCode="J" />
        <entityName>
            <reason>
                <reasonName>${clean(nt.operador_razon_social)}</reasonName>
                <reasonAssociation associationCode="99" associationDescription="Otra"/>
            </reason>
        </entityName>
        <entityCenter>
            <centerID centerCode="${opNima}" />
            <centerEconomicActivity>S/D</centerEconomicActivity>
            <centerAddress>
${buildAddressXml(nt.operador_direccion, nt.operador_codigo_postal, nt.operador_municipio, nt.operador_provincia)}
            </centerAddress>${buildContactXml(nt.operador_telefono, nt.operador_email)}
            <wasteCenterAuthorization>
${buildAuthorizationIdXml((nt as any).operador_numero_autorizacion, opNima, '                ')}
                <authorizationCode>${isDanger ? 'P01' : 'P03'}</authorizationCode>
            </wasteCenterAuthorization>
        </entityCenter>
        <wasteTransferOperatorType operatorTypeCode="${isDanger ? 'P01' : 'P03'}"/>
    </NTTransferOperatorData>

    <!-- 2. Productor -->
    <NTProducerData>
        <entityId>
            <nationalId>${clean(nt.productor_cif)}</nationalId>
        </entityId>
        <entityFJ entityFJCode="J" />
        <entityName>
            <reason>
                <reasonName>${clean(nt.productor_razon_social)}</reasonName>
                <reasonAssociation associationCode="99" associationDescription="Otra"/>
            </reason>
        </entityName>
        <entityCenter>
            <centerID centerCode="${prodNima}" />
            <centerEconomicActivity>S/D</centerEconomicActivity>
            <centerAddress>
${buildAddressXml(nt.productor_direccion, nt.productor_codigo_postal, nt.productor_municipio, nt.productor_provincia)}
            </centerAddress>${buildContactXml(nt.productor_telefono, nt.productor_email)}
            <wasteCenterAuthorization>
${buildAuthorizationIdXml((nt as any).productor_numero_autorizacion, prodNima, '                ')}
                <authorizationCode>${isDanger ? 'P01' : 'P03'}</authorizationCode>
            </wasteCenterAuthorization>
        </entityCenter>
        <wasteProducerType producerTypeCode="${isDanger ? 'P01' : 'P03'}"/>
    </NTProducerData>

    <!-- 3. Destinatario -->
    <NTAdresseeData>
        <entityId>
            <nationalId>${clean(nt.gestor_cif)}</nationalId>
        </entityId>
        <entityFJ entityFJCode="J" />
        <entityName>
            <reason>
                <reasonName>${clean(nt.gestor_razon_social)}</reasonName>
                <reasonAssociation associationCode="99" associationDescription="Otra"/>
            </reason>
        </entityName>
        <entityCenter>
            <centerID centerCode="${gestNima}" />
            <centerEconomicActivity>S/D</centerEconomicActivity>
            <centerAddress>
${buildAddressXml(nt.gestor_direccion, nt.gestor_codigo_postal, nt.gestor_municipio, nt.gestor_provincia)}
            </centerAddress>${buildContactXml(nt.gestor_telefono, nt.gestor_email)}
            <wasteCenterAuthorization>
${buildAuthorizationIdXml(nt.gestor_numero_autorizacion, gestNima, '                ')}
                <authorizationCode>${isDanger ? 'G01' : 'G04'}</authorizationCode>
            </wasteCenterAuthorization>
        </entityCenter>
        <wasteManagerType managerTypeCode="${isDanger ? 'G01' : 'G04'}"/>
    </NTAdresseeData>

    <!-- 4. Residuos transportados -->
    <NTTransportedResidues>
        <NTResidueIdentification LERCode="${cleanLer}" ${residueTypeAttr}>
            <residueBag>
                 <bagProcess internalIdProcessCode="99"/>
                 <bagResidueId residueCode="999" residueDescription="${clean(nt.descripcion_residuo)}"/>
            </residueBag>
            <residueTables ${residueTablesType}>
                <table2>${cleanOp.slice(0, 3)}</table2>${hpBlock}${cleanOp.length >= 5 ? `\n                <process operationIdProcessCode="${cleanOp.slice(0, 5)}"/>` : ''}
            </residueTables>
        </NTResidueIdentification>
        <NTOtherResidueData>
            <NTResidueQuantity>${cleanQuantity}</NTResidueQuantity>
        </NTOtherResidueData>
    </NTTransportedResidues>${finalAdresseeBlock}

</wasteNT>`.trim();
},

  /**
   * Enviar Notificación Previa a SIRA (Junta de Andalucía)
   */
  async sendToSira(notificationId: number, validateOnly = false): Promise < { success: boolean; message: string; siraId?: string; platform?: string; platformName?: string } > {
  try {
    const response = await fetch('/api/residuos/sira/enviar-nt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, validateOnly }),
    });
    const result = await response.json();
    if(!response.ok) throw new Error(result.error || result.message || 'Error al conectar con SIRA');
    return result;
  } catch(error: any) {
    console.error('SIRA NT Service Error:', error);
    throw error;
  }
},
};

