import { createClient } from '@/lib/supabase/client';
import type { PriorNotification } from '@/types/wasteManagement';
import {
  formatNima,
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
  if (!/^(R0[1-9]|R1[0-3]|D0[1-9]|D1[0-5])$/.test(op)) {
    errors.push(`Operación de tratamiento inválida (${op || 'vacía'}).`);
  }

  if (!nt.cantidad_estimada_kg || Number(nt.cantidad_estimada_kg) <= 0) {
    errors.push('La cantidad estimada en Kg (NTResidueQuantity) debe ser mayor que 0.');
  }

  if (!nt.fecha_fin) {
    errors.push('Falta la fecha de finalización o vigencia de la Notificación Previa.');
  }

  if (!nt.productor_nima) warnings.push('Falta NIMA del centro productor.');
  if (!nt.gestor_nima) warnings.push('Falta NIMA de la instalación de destino.');
  if (!nt.productor_municipio || !nt.gestor_municipio) {
    warnings.push('Falta municipio oficial en origen o destino.');
  }

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

    const { data, error } = await supabase
      .from('prior_notifications')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('user_id', user.id)
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

    const { data, error } = await supabase
      .from('prior_notifications')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
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

    const { data, error } = await supabase
      .from('prior_notifications')
      .insert({
        ...notificationData,
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

    const { data, error } = await supabase
      .from('prior_notifications')
      .update({
        ...notificationData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
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

    const { error } = await supabase
      .from('prior_notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
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
    const formattedDate = nt.fecha_notificacion || date.toISOString().split('T')[0];
    const startDate = nt.fecha_inicio || formattedDate;
    const endDate = nt.fecha_fin || `${new Date().getFullYear() + 1}-12-31`;

    const opProvCode = getProvinceCodeByName(nt.operador_provincia || 'Cádiz');
    const opNima = formatNima(nt.operador_nima, opProvCode);
    const opMuniName = clean(nt.operador_municipio) || (opProvCode === '11' ? 'Puerto Real' : 'Municipio');
    const opMuniCode = siraService.getMunicipalityCode(opProvCode, opMuniName);
    const opAddress = clean(nt.operador_direccion) || 'Calle Principal';
    const opCp = clean(nt.operador_codigo_postal) || `${opProvCode}001`;
    const opPhone = clean(nt.operador_telefono).replace(/\D/g, '') || '900000000';
    const opEmail = clean(nt.operador_email).includes('@') ? clean(nt.operador_email) : 'contacto@resigest.com';

    const prodProvCode = getProvinceCodeByName(nt.productor_provincia || 'Cádiz');
    const prodNima = formatNima(nt.productor_nima, prodProvCode);
    const prodMuniName = clean(nt.productor_municipio) || (prodProvCode === '11' ? 'Puerto Real' : 'Municipio');
    const prodMuniCode = siraService.getMunicipalityCode(prodProvCode, prodMuniName);
    const prodAddress = clean(nt.productor_direccion) || 'Calle Principal';
    const prodCp = clean(nt.productor_codigo_postal) || `${prodProvCode}001`;
    const prodPhone = clean(nt.productor_telefono).replace(/\D/g, '') || '900000000';
    const prodEmail = clean(nt.productor_email).includes('@') ? clean(nt.productor_email) : 'contacto@resigest.com';

    const gestProvCode = getProvinceCodeByName(nt.gestor_provincia || 'Cádiz');
    const gestNima = formatNima(nt.gestor_nima, gestProvCode);
    const gestMuniName = clean(nt.gestor_municipio) || (gestProvCode === '11' ? 'Puerto Real' : 'Municipio');
    const gestMuniCode = siraService.getMunicipalityCode(gestProvCode, gestMuniName);
    const gestAddress = clean(nt.gestor_direccion) || 'Calle Principal';
    const gestCp = clean(nt.gestor_codigo_postal) || `${gestProvCode}001`;
    const gestPhone = clean(nt.gestor_telefono).replace(/\D/g, '') || '900000000';
    const gestEmail = clean(nt.gestor_email).includes('@') ? clean(nt.gestor_email) : 'contacto@resigest.com';
    const gestAuth = clean(nt.gestor_numero_autorizacion) || gestNima;

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

    return `
<wasteNT 
    ${xmlnsWassup}
    ${xmlnsCommon}
    ${xmlnsXsi}
    NTCode="${ntCode}"
    NTYear="${date.getFullYear()}"
    NTDate="${formattedDate}"
    NTStartDate="${startDate}"
    NTEndDate="${endDate}"
    NTFrequency="${frequency}"
    NTIndividual="${isIndividual ? 'S' : 'N'}"
    NTRegional="${isRegional ? 'S' : 'N'}"
    NTSendtoDestinationAuthority="N">

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
                <spanishAddress>
                    <vial vialCode="009" vialDescription="Calle"/>
                    <address>${opAddress}</address>
                    <CP>${opCp}</CP>
                    <municipality municipalityCode="${opMuniCode}" municipalityName="${opMuniName}"/>
                    <province provinceCode="${opProvCode}" provinceName="${clean(nt.operador_provincia || 'Cádiz')}"/>
                </spanishAddress>
            </centerAddress>
            <centerContact>
                <phone>${opPhone}</phone>
                <mail>${opEmail}</mail>
            </centerContact>
            <wasteCenterAuthorization>
                <authorizationId>
                    <authorizationIdFree>${opNima}</authorizationIdFree>
                </authorizationId>
                <authorizationCode>${isDanger ? 'P01' : 'P02'}</authorizationCode>
            </wasteCenterAuthorization>
        </entityCenter>
        <wasteTransferOperatorType operatorTypeCode="P01"/>
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
                <spanishAddress>
                    <vial vialCode="009" vialDescription="Calle"/>
                    <address>${prodAddress}</address>
                    <CP>${prodCp}</CP>
                    <municipality municipalityCode="${prodMuniCode}" municipalityName="${prodMuniName}"/>
                    <province provinceCode="${prodProvCode}" provinceName="${clean(nt.productor_provincia || 'Cádiz')}"/>
                </spanishAddress>
            </centerAddress>
            <centerContact>
                <phone>${prodPhone}</phone>
                <mail>${prodEmail}</mail>
            </centerContact>
            <wasteCenterAuthorization>
                <authorizationId>
                    <authorizationIdFree>${prodNima}</authorizationIdFree>
                </authorizationId>
                <authorizationCode>${isDanger ? 'P01' : 'P02'}</authorizationCode>
            </wasteCenterAuthorization>
        </entityCenter>
        <wasteProducerType producerTypeCode="${isDanger ? 'P01' : 'P02'}"/>
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
                <spanishAddress>
                    <vial vialCode="009" vialDescription="Calle"/>
                    <address>${gestAddress}</address>
                    <CP>${gestCp}</CP>
                    <municipality municipalityCode="${gestMuniCode}" municipalityName="${gestMuniName}"/>
                    <province provinceCode="${gestProvCode}" provinceName="${clean(nt.gestor_provincia || 'Cádiz')}"/>
                </spanishAddress>
            </centerAddress>
            <centerContact>
                <phone>${gestPhone}</phone>
                <mail>${gestEmail}</mail>
            </centerContact>
            <wasteCenterAuthorization>
                <authorizationId>
                    <authorizationIdFree>${gestAuth}</authorizationIdFree>
                </authorizationId>
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
                <table2>${cleanOp}</table2>${hpBlock}
            </residueTables>
        </NTResidueIdentification>
        <NTOtherResidueData>
            <NTResidueQuantity>${cleanQuantity}</NTResidueQuantity>
        </NTOtherResidueData>
    </NTTransportedResidues>

</wasteNT>`.trim();
  },

  /**
   * Enviar Notificación Previa a SIRA (Junta de Andalucía)
   */
  async sendToSira(notificationId: number, validateOnly = false): Promise<{ success: boolean; message: string; siraId?: string }> {
    try {
      const response = await fetch('/api/residuos/sira/enviar-nt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, validateOnly }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || 'Error al conectar con SIRA');
      return result;
    } catch (error: any) {
      console.error('SIRA NT Service Error:', error);
      throw error;
    }
  },
};

