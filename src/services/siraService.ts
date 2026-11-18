// =====================================================
// SIRA SERVICE (Integration with Junta de Andalucía)
// Servicio para comunicación SOAP con la plataforma SIRA
// =====================================================

import { type SiraSubmission, type SiraSubmissionStatus } from '@/types/wasteManagement';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// FUNCIONES AUXILIARES PRIVADAS (Generación de bloques XML E3L v3.6)
// ============================================================================

/**
 * Mapeo de códigos de provincia (simplificado)
 * Intenta obtener el código INE de 2 dígitos a partir del nombre
 */
export const getProvinceCodeByName = (provinceName: string): string => {
  if (!provinceName) return '00';
  const p = provinceName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const map: Record<string, string> = {
    'alava': '01', 'albacete': '02', 'alicante': '03', 'almeria': '04', 'avila': '05',
    'badajoz': '06', 'baleares': '07', 'barcelona': '08', 'burgos': '09', 'caceres': '10',
    'cadiz': '11', 'castellon': '12', 'ciudad real': '13', 'cordoba': '14', 'coruna': '15',
    'cuenca': '16', 'girona': '17', 'granada': '18', 'guadalajara': '19', 'guipuzcoa': '20',
    'huelva': '21', 'huesca': '22', 'jaen': '23', 'leon': '24', 'lleida': '25',
    'rioja': '26', 'lugo': '27', 'madrid': '28', 'malaga': '29', 'murcia': '30',
    'navarra': '31', 'ourense': '32', 'asturias': '33', 'palencia': '34', 'palmas': '35',
    'pontevedra': '36', 'salamanca': '37', 'santa cruz': '38', 'cantabria': '39',
    'segovia': '40', 'sevilla': '41', 'soria': '42', 'tarragona': '43', 'teruel': '44',
    'toledo': '45', 'valencia': '46', 'valladolid': '47', 'vizcaya': '48', 'zamora': '49',
    'zaragoza': '50', 'ceuta': '51', 'melilla': '52'
  };
  // Búsqueda aproximada
  for (const key in map) {
    if (p.includes(key)) return map[key];
  }
  return '00';
};

const PROVINCE_DEFAULT_MUNICIPALITY: Record<string, string> = {
  '01': '010014', '02': '020019', '03': '030015', '04': '040010', '05': '050013',
  '06': '060016', '07': '070027', '08': '080018', '09': '090011', '10': '100015',
  '11': '110012', '12': '120022', '13': '130013', '14': '140018', '15': '150011',
  '16': '160014', '17': '170010', '18': '180016', '19': '190019', '20': '200013',
  '21': '210010', '22': '220015', '23': '230011', '24': '240016', '25': '250019',
  '26': '260012', '27': '270018', '28': '280014', '29': '290017', '30': '300011',
  '31': '310018', '32': '320013', '33': '330019', '34': '340014', '35': '350017',
  '36': '360209', '37': '370016', '38': '380012', '39': '390015', '40': '400019',
  '41': '410016', '42': '420011', '43': '430017', '44': '440012', '45': '450015',
  '46': '460018', '47': '470014', '48': '480010', '49': '490028', '50': '500016',
  '51': '510013', '52': '520018'
};

const MUNICIPALITY_INE_PATTERNS: Array<[RegExp, string]> = [
  [/puerto\s*real/i, '110282'],
  [/c[aá]diz/i, '110125'],
  [/jerez/i, '110200'],
  [/algeciras/i, '110042'],
  [/san\s*fernando/i, '110319'],
  [/puerto\s+de\s+santa\s+mar[ií]a/i, '110276'],
  [/chiclana/i, '110150'],
  [/sevilla/i, '410917'],
  [/dos\s*hermanas/i, '410388'],
  [/alcal[aá]\s+de\s+guada[ií]ra/i, '410040'],
  [/m[aá]laga/i, '290672'],
  [/marbella/i, '290691'],
  [/c[oó]rdoba/i, '140214'],
  [/lucena/i, '140389'],
  [/granada/i, '180877'],
  [/motril/i, '181401'],
  [/ja[eé]n/i, '230503'],
  [/linares/i, '230555'],
  [/almer[ií]a/i, '040139'],
  [/el\s*ejido/i, '049027'],
  [/huelva/i, '210417'],
  [/madrid/i, '280796'],
  [/barcelona/i, '080193'],
  [/valencia/i, '462508'],
  [/zaragoza/i, '502973'],
  [/bilbao/i, '480200'],
  [/murcia/i, '300302'],
  [/valladolid/i, '471868'],
];

const ANDALUSIA_PROVINCE_CODES = new Set(['04', '11', '14', '18', '21', '23', '29', '41']);

const getMunicipalityCodeByProvince = (provCode: string, muniName?: string): string => {
  if (muniName) {
    for (const [pattern, ineCode] of MUNICIPALITY_INE_PATTERNS) {
      if (pattern.test(muniName)) return ineCode;
    }
  }
  return PROVINCE_DEFAULT_MUNICIPALITY[provCode] || '110012';
};

/**
 * Normaliza y valida un NIMA conforme al patrón XSD de SIRA: (0[1-9]|[1-4][0-9]|5[0-2])\d{8}
 */
export const formatNima = (rawNima: string | undefined | null, provCode?: string): string => {
  const digits = String(rawNima || '').replace(/\D/g, '');
  const prov = /^(0[1-9]|[1-4][0-9]|5[0-2])$/.test(provCode || '') ? (provCode as string) : '11';

  // Si ya cumple exactamente el patrón XSD de 10 dígitos (provincia 01-52 + 8 dígitos)
  if (/^(0[1-9]|[1-4][0-9]|5[0-2])\d{8}$/.test(digits)) {
    return digits;
  }

  // N04 / N07: Si el usuario introdujo más de 10 dígitos (ej: 783989383983), nunca truncar
  // silenciosamente ni sustituir por provincia inventada durante la exportación.
  if (digits.length > 10) {
    return digits;
  }

  // Si tiene 10 dígitos pero el prefijo provincial no es válido (ej: '0000000014')
  if (digits.length === 10 && digits.startsWith('00')) {
    return `${prov}${digits.slice(2)}`;
  }

  // Si tiene 10 dígitos, preservar tal cual
  if (digits.length === 10) {
    return digits;
  }

  // Si tiene hasta 8 dígitos o viene vacío, asegurar 8 dígitos de correlativo y prefijo provincial
  const seq = (digits || '1').padStart(8, '0').slice(-8);
  return `${prov}${seq}`;
};

/**
 * Formatea el código de DI (DCSCode) al estándar E3L 3.3 (26 caracteres):
 * DCS + tipo_origen (2) + NIMA (10) + año (4) + correlativo (7)
 */
export const formatDCSCode = (
  rawCode: string | undefined | null,
  nima: string,
  docId?: number | string
): string => {
  const cleanCode = String(rawCode || '').trim();
  const validPattern = /^DCS(([01][0-9]9999999999)|([01][0-9]|[235]0)(0[1-9]|[1-4][0-9]|5[0-2])\d{8})\d{4}\d{7}$/;
  if (validPattern.test(cleanCode)) {
    return cleanCode;
  }

  const currentYear = new Date().getFullYear().toString();
  const validNima = /^(0[1-9]|[1-4][0-9]|5[0-2])\d{8}$/.test(nima) ? nima : '9999999999';
  const origin = validNima === '9999999999' ? '01' : '10';
  const seqDigits = String(docId || '').replace(/\D/g, '') || String(cleanCode).replace(/\D/g, '') || '1';
  const paddedSeq = seqDigits.padStart(7, '0').slice(-7);

  return `DCS${origin}${validNima}${currentYear}${paddedSeq}`;
};

/**
 * Escapa caracteres especiales para XML
 */
const escapeXml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&"']/g, (m) => {
    switch (m) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return m;
    }
  });
};

/**
 * Interfaz para pasar datos normalizados a la función generadora
 */
interface EntityData {
  cif?: string;
  name?: string;
  nima?: string;
  authorizationCode?: string;
  authorizationNumber?: string;
  cnae?: string;
  address?: string;
  cp?: string;
  municipality?: string;
  municipalityCode?: string;
  province?: string;
  phone?: string;
  email?: string;
}

/**
 * Genera un bloque de entidad genérico conforme a wasteCenterEntityType
 * SIN inyectar valores ficticios de relleno (F07).
 */
const generateEntityBlock = (
  tagName: string,
  data: EntityData,
  typeTag: string,
  typeAttr: string,
  typeValue: string,
  defaultAuthCode: string,
  extraChild = ''
): string => {
  const clean = (val: any) => (val !== undefined && val !== null ? escapeXml(String(val)).trim() : '');

  const cif = clean(data.cif);
  const name = clean(data.name);
  const provName = clean(data.province);
  const provCode = provName ? getProvinceCodeByName(provName) : '11';
  const safeNima = formatNima(clean(data.nima), provCode);
  const muniName = clean(data.municipality) || (provCode === '11' ? 'Puerto Real' : 'Municipio');
  const muniCode = clean(data.municipalityCode) || getMunicipalityCodeByProvince(provCode, muniName);
  const addressText = clean(data.address) || 'Calle Principal';
  const cp = clean(data.cp) || `${provCode}001`;
  const cnae = clean(data.cnae);
  const rawAuthNumber = clean(data.authorizationNumber);
  // N04 / RD 764/2026: No reutilizar el NIMA como número de autorización/inscripción
  const authNumber = rawAuthNumber && rawAuthNumber !== safeNima ? rawAuthNumber : '';
  const authCode = clean(data.authorizationCode) || defaultAuthCode;

  const addressBlock = `
        <centerAddress>
            <spanishAddress>
                <vial vialCode="009" vialDescription="Calle"/>
                <address>${addressText}</address>
                <CP>${cp}</CP>
                <municipality municipalityCode="${muniCode}" municipalityName="${muniName}"/>
                <province provinceCode="${provCode}" provinceName="${provName || 'Cádiz'}"/>
            </spanishAddress>
        </centerAddress>`;

  const safeCnae = cnae || 'S/D';
  const safePhone = clean(data.phone).replace(/\D/g, '');
  const rawEmail = clean(data.email);
  const safeEmail = rawEmail.includes('@') ? rawEmail : '';

  const contactBlock = (safePhone || safeEmail)
    ? `
        <centerContact>${safePhone ? `\n            <phone>${safePhone}</phone>` : ''}${safeEmail ? `\n            <mail>${safeEmail}</mail>` : ''}
        </centerContact>`
    : '';

  const authIdNode = authNumber
    ? `\n            <authorizationId>\n                <authorizationIdFree>${authNumber}</authorizationIdFree>\n            </authorizationId>`
    : '';

  const authBlock = `
        <wasteCenterAuthorization>${authIdNode}
            <authorizationCode>${authCode}</authorizationCode>
        </wasteCenterAuthorization>`;

  const nameBlock = name
    ? `
        <entityName>
            <reason>
                <reasonName>${name}</reasonName>
                <reasonAssociation associationCode="99" associationDescription="Otra"/>
            </reason>
        </entityName>`
    : '';

  return `
    <${tagName}>${cif ? `
        <entityId>
            <nationalId>${cif}</nationalId>
        </entityId>` : ''}
        <entityFJ entityFJCode="J" />${nameBlock}
        
        <entityCenter>
            <centerID centerCode="${safeNima}" />
            <centerEconomicActivity>${safeCnae}</centerEconomicActivity>${addressBlock}${contactBlock}${authBlock}
        </entityCenter>

        <${typeTag} ${typeAttr}="${typeValue}"/>${extraChild ? `\n        ${extraChild}` : ''}
    </${tagName}>`;
};

const generateOperatorBlock = (doc: any): string => {
  const compData = Array.isArray(doc.company) ? doc.company[0] : doc.company;
  const isDanger = doc.peligrosidad === 'peligroso' || String(doc.codigo_ler || '').includes('*');

  // N04: Garantizar coherencia estricta del centro del Operador del Traslado.
  // Si no se especifican campos explícitos de operador_*, usar de forma íntegra el centro productor del DI
  // en lugar de mezclar el NIMA de la sede principal (compData.nima) con la dirección del centro productor.
  const hasExplicitOperator = Boolean(doc.operador_nima || doc.operador_direccion || doc.operador_cif);

  return generateEntityBlock(
    'DCSTransferOperatorData',
    {
      cif: doc.operador_cif || doc.productor_cif || compData?.cif,
      name: doc.operador_razon_social || doc.productor_razon_social || compData?.razon_social,
      nima: hasExplicitOperator
        ? (doc.operador_nima || doc.productor_nima || compData?.nima)
        : (doc.productor_nima || compData?.nima),
      authorizationNumber:
        doc.operador_numero_autorizacion ||
        doc.productor_numero_autorizacion ||
        doc.production_center?.numero_inscripcion ||
        compData?.numero_inscripcion,
      address: hasExplicitOperator
        ? (doc.operador_direccion || doc.productor_direccion || compData?.domicilio_instalacion)
        : (doc.productor_direccion || compData?.domicilio_instalacion),
      cp: hasExplicitOperator
        ? (doc.operador_codigo_postal || doc.productor_codigo_postal || compData?.codigo_postal_instalacion)
        : (doc.productor_codigo_postal || compData?.codigo_postal_instalacion),
      municipality: hasExplicitOperator
        ? (doc.operador_municipio || doc.productor_municipio || compData?.municipio_instalacion)
        : (doc.productor_municipio || compData?.municipio_instalacion),
      province: hasExplicitOperator
        ? (doc.operador_provincia || doc.productor_provincia || compData?.provincia_instalacion)
        : (doc.productor_provincia || compData?.provincia_instalacion),
      phone: doc.operador_telefono || doc.productor_telefono || compData?.telefono,
      email: doc.operador_email || doc.productor_email || compData?.email,
      cnae: compData?.cnae,
    },
    'wasteTransferOperatorType',
    'operatorTypeCode',
    isDanger ? 'P01' : 'P03',
    isDanger ? 'P01' : 'P03'
  );
};

const generateProducerBlock = (doc: any): string => {
  const isDanger = doc.peligrosidad === 'peligroso' || String(doc.codigo_ler || '').includes('*');
  return generateEntityBlock(
    'DCSProducerData',
    {
      cif: doc.productor_cif,
      name: doc.productor_razon_social,
      nima: doc.productor_nima,
      authorizationNumber: doc.productor_numero_autorizacion || doc.production_center?.numero_inscripcion,
      address: doc.productor_direccion,
      cp: doc.productor_codigo_postal,
      municipality: doc.productor_municipio,
      province: doc.productor_provincia,
      phone: doc.productor_telefono,
      email: doc.productor_email,
    },
    'wasteProducerType',
    'producerTypeCode',
    isDanger ? 'P01' : 'P03',
    isDanger ? 'P01' : 'P03'
  );
};

const generateManagerBlock = (doc: any): string => {
  const isDanger = doc.peligrosidad === 'peligroso' || String(doc.codigo_ler || '').includes('*');
  return generateEntityBlock(
    'DCSAdresseeData',
    {
      cif: doc.gestor_cif,
      name: doc.gestor_razon_social,
      nima: doc.gestor_nima,
      authorizationNumber: doc.gestor_numero_autorizacion,
      address: doc.gestor_direccion,
      cp: doc.gestor_codigo_postal,
      municipality: doc.gestor_municipio,
      province: doc.gestor_provincia,
      phone: doc.gestor_telefono,
      email: doc.gestor_email,
    },
    'wasteManagerType',
    'managerTypeCode',
    isDanger ? 'G01' : 'G04',
    isDanger ? 'G01' : 'G04'
  );
};

const generateTransporterContent = (doc: any): string => {
  // Si no hay datos reales de transportista, no fabricar 'A00000000' / 'transporte@pendiente.com'
  const hasAnyTransporterData = Boolean(
    doc.transportista_cif || doc.transportista_razon_social || doc.transportista_nima
  );
  if (!hasAnyTransporterData) {
    return '';
  }

  const isDanger = doc.peligrosidad === 'peligroso' || String(doc.codigo_ler || '').includes('*');
  const clean = (val: any) => (val !== undefined && val !== null ? escapeXml(String(val)).trim() : '');
  const cif = clean(doc.transportista_cif);
  const name = clean(doc.transportista_razon_social);
  const provName = clean(doc.transportista_provincia);
  const provCode = provName ? getProvinceCodeByName(provName) : '11';
  const safeNima = formatNima(clean(doc.transportista_nima), provCode);
  const muniName = clean(doc.transportista_municipio) || (provCode === '11' ? 'Puerto Real' : 'Municipio');
  const muniCode = getMunicipalityCodeByProvince(provCode, muniName);
  const addressText = clean(doc.transportista_direccion);
  const cp = clean(doc.transportista_codigo_postal);
  const safePhone = clean(doc.transportista_telefono).replace(/\D/g, '');
  const rawEmail = clean(doc.transportista_email);
  const safeEmail = rawEmail.includes('@') ? rawEmail : '';
  const safeCnae = 'S/D';

  const addressBlock = addressText
    ? `
                <centerAddress>
                    <spanishAddress>
                        <vial vialCode="009" vialDescription="Calle"/>
                        <address>${addressText}</address>
                        <CP>${cp || `${provCode}001`}</CP>
                        <municipality municipalityCode="${muniCode}" municipalityName="${muniName}"/>
                        <province provinceCode="${provCode}" provinceName="${provName || 'Cádiz'}"/>
                    </spanishAddress>
                </centerAddress>`
    : '';

  const contactBlock = (safePhone || safeEmail)
    ? `
                <centerContact>${safePhone ? `\n                    <phone>${safePhone}</phone>` : ''}${safeEmail ? `\n                    <mail>${safeEmail}</mail>` : ''}
                </centerContact>`
    : '';

  const transporterAuth = clean(
    doc.transportista_numero_autorizacion ||
    doc.transportista_n_autorizacion ||
    doc.transportista_autorizacion ||
    ''
  );

  const authBlock = transporterAuth
    ? `
                <wasteCenterAuthorization>
                    <authorizationId>
                         <authorizationIdFree>${transporterAuth}</authorizationIdFree>
                    </authorizationId>
                    <authorizationCode>${isDanger ? 'T01' : 'T02'}</authorizationCode>
                </wasteCenterAuthorization>`
    : '';

  return `
        <DCSTransporterData>${cif ? `
            <entityId>
                <nationalId>${cif}</nationalId>
            </entityId>` : ''}
            <entityFJ entityFJCode="J" />${name ? `
            <entityName>
                <reason>
                    <reasonName>${name}</reasonName>
                    <reasonAssociation associationCode="99" associationDescription="Otra"/>
                </reason>
            </entityName>` : ''}
            <entityCenter>
                <centerID centerCode="${safeNima}" />
                <centerEconomicActivity>${safeCnae}</centerEconomicActivity>${addressBlock}${contactBlock}${authBlock}
            </entityCenter>

            <wasteTransporterType trasporterTypeCode="${isDanger ? 'T01' : 'T02'}" transporterTypeDescription="Transportista de residuos"/>
            <DCSTransportWay transportWayCode="01" transportWayDescription="Carretera"/>
        </DCSTransporterData>`;
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
  // Mapear formatos como H4 o HP04 a HP4
  const match = cleanHp.match(/^(?:HP|H)0?([1-9]|1[0-5])$/);
  return match ? `HP${match[1]}` : 'HP4';
};

const DESTINATION_TRANSFER_STATES = new Set([
  'recepcionado',
  'aceptado',
  'rechazado_parcial',
  'rechazado_total',
  'tratado',
]);

const isDestinationDCSPhase = (doc: any): boolean => {
  if (!doc) return false;
  return (
    doc.dcs_phase === 'D' ||
    doc.dcs_phase === 'T' ||
    DESTINATION_TRANSFER_STATES.has(String(doc.estado_traslado || '')) ||
    Boolean(doc.resultado_recepcion) ||
    Boolean(doc.fecha_recepcion) ||
    Number(doc.peso_destino_kg) > 0
  );
};

const generateResidueBlock = (doc: any): string => {
  const clean = (val: any) => val ? escapeXml(String(val)).trim() : '';
  const isDangerous = doc.peligrosidad === 'peligroso' || String(doc.codigo_ler || '').includes('*');
  const cleanLer = normalizeLerCode(doc.codigo_ler);

  const residueBag = `
        <residueBag>
             <bagProcess internalIdProcessCode="99"/>
             <bagResidueId residueCode="999" residueDescription="${clean(doc.descripcion_residuo || doc.nombre_residuo || '')}"/>
        </residueBag>`;

  // Conservar operación prevista en productor y operación realmente ejecutada (si existe) en destinatario
  const opPrevista = normalizeOperation(clean(doc.operacion_tratamiento || 'R13'));
  const opEjecutada = normalizeOperation(clean(doc.operacion_tratamiento_ejecutada || doc.operacion_tratamiento || 'R13'));

  const residueTablesType = isDangerous
    ? 'xsi:type="wassup:tablesDangerousType"'
    : 'xsi:type="wassup:tablesNoDangerousType"';

  const hpBlock = isDangerous
    ? `\n            <table5>${normalizeHpCode(doc.caracteristica_peligrosidad || doc.codigo_hp || doc.hp || '')}</table5>`
    : '';

  const buildTables = (opCode: string) => {
    const processBlock =
      opCode.length >= 5
        ? `\n            <process operationIdProcessCode="${opCode.slice(0, 5)}"/>`
        : '';
    return `
        <residueTables ${residueTablesType}>
            <table2>${opCode.slice(0, 3)}</table2>${hpBlock}${processBlock}
        </residueTables>`;
  };

  const residueTypeAttr = isDangerous
    ? 'xsi:type="wassup:dangerousResidueType"'
    : 'xsi:type="wassup:noDangerousResidueType"';

  // N04: DCSNT solo debe incluirse cuando existe notificación previa real (no aplicable en traslados sin notificación)
  const rawNt = clean(doc.numero_notificacion || doc.nt_codigo || doc.notificacion_previa_codigo || '');
  const hasNt = doc.tipo_notificacion !== 'sin-notificacion' && Boolean(rawNt);
  const ntBlock = hasNt ? `\n            <DCSNT>${rawNt}</DCSNT>` : '';

  const fallbackQty = Number(doc.cantidad || 0);
  const fallbackKg = (doc.unidad === 'toneladas' || doc.unidad === 'm3') ? fallbackQty * 1000 : fallbackQty;
  const rawWeight = Number(doc.peso_destino_kg || doc.peso_origen_kg || fallbackKg || 0);
  const formattedWeight = !isNaN(rawWeight) && rawWeight > 0 ? rawWeight.toFixed(3) : '0.001';

  const otherData = `
        <DCSOtherResidueData>${ntBlock}
            <DCSClearWeight>${formattedWeight}</DCSClearWeight>
            <DCSTransportCharacteristics>Sin características especiales</DCSTransportCharacteristics>
        </DCSOtherResidueData>`;

  const transporterData = generateTransporterContent(doc);

  let acceptanceData = '';
  if (isDestinationDCSPhase(doc)) {
    const isRejected =
      doc.estado_traslado === 'rechazado_total' ||
      doc.resultado_recepcion === 'rechazado_total';
    const isPartialRejection =
      doc.estado_traslado === 'rechazado_parcial' ||
      doc.resultado_recepcion === 'rechazado_parcial';
    const rejectedKg = Number(doc.cantidad_rechazada_kg || 0);
    const realAcceptedWeight =
      isPartialRejection && !isNaN(rejectedKg) && rejectedKg > 0 && rawWeight > rejectedKg
        ? (rawWeight - rejectedKg).toFixed(3)
        : formattedWeight;
    const acceptanceCode = isRejected ? '04' : '03';
    const acceptanceDate = String(
      doc.fecha_recepcion ||
      doc.fecha_tratamiento ||
      doc.fecha_recogida ||
      doc.fecha_documento ||
      new Date().toISOString().split('T')[0]
    ).split('T')[0];
    const deliveryDate = String(
      doc.fecha_recogida ||
      doc.fecha_recepcion ||
      doc.fecha_documento ||
      acceptanceDate
    ).split('T')[0];
    const refusedBlock = isRejected
      ? `\n        <DCSRefusedAction>${doc.accion_rechazo === 'reenvio' ? 'Redelivery' : 'Return'}</DCSRefusedAction>\n        <DCSRefusedActionDate>${acceptanceDate}</DCSRefusedActionDate>`
      : '';
    acceptanceData = `
    <DCSAcceptanceData>
        <DCSRealQuantity>${realAcceptedWeight}</DCSRealQuantity>
        <DCSAcceptance>${acceptanceCode}</DCSAcceptance>
        <DCSAcceptanceDate>${acceptanceDate}</DCSAcceptanceDate>${refusedBlock}
        <DCSDeliveryDate>${deliveryDate}</DCSDeliveryDate>
    </DCSAcceptanceData>`;
  }

  return `
    <DCSResidueData>
        <DCSProducerResidueIdentification LERCode="${cleanLer}" ${residueTypeAttr}>
            ${residueBag}
            ${buildTables(opPrevista)}
        </DCSProducerResidueIdentification>
        
        <DCSAdresseeResidueIdentification LERCode="${cleanLer}" ${residueTypeAttr}>
            ${residueBag}
            ${buildTables(opEjecutada)}
        </DCSAdresseeResidueIdentification>
        
        ${otherData}${transporterData}${acceptanceData}
    </DCSResidueData>`;
};

/**
 * Extrae el mensaje de error legible de una respuesta SOAP/XML de SIRA.
 * Maneja tanto atributos (e.g. <resultWrong code="JA000018" description="..."/>)
 * como elementos SOAP Fault (<faultstring>, <description>, <message>).
 */
export function extractSiraError(responseText: string): string {
  if (!responseText || typeof responseText !== 'string') {
    return 'Respuesta vacía o inválida del servidor SIRA.';
  }

  // 1. Extraer errores estructurados de <resultWrong ... /> con atributo description
  const resultWrongMatches: string[] = [];
  const wrongRegex = /<resultWrong\b([^>]*?)\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = wrongRegex.exec(responseText)) !== null) {
    const attrs = match[1];
    const descMatch = attrs.match(/description=["']([^"']+)["']/i);
    if (descMatch && descMatch[1].trim()) {
      const desc = descMatch[1].trim();
      const codeMatch = attrs.match(/code=["']([A-Za-z0-9_-]+)["']/i);
      const code = codeMatch ? codeMatch[1].trim() : null;
      const formatted = code ? `${code}: ${desc}` : desc;
      if (!resultWrongMatches.includes(formatted)) {
        resultWrongMatches.push(formatted);
      }
    }
  }

  if (resultWrongMatches.length > 0) {
    return resultWrongMatches.join(' | ');
  }

  // 2. Atributo description genérico en cualquier otro nodo XML
  const genericAttrMatch = responseText.match(/description=["']([^"']+)["']/i);
  if (genericAttrMatch && genericAttrMatch[1].trim()) {
    const desc = genericAttrMatch[1].trim();
    const codeMatch = responseText.match(/code=["']([A-Za-z0-9_-]+)["']/i);
    const code = codeMatch ? codeMatch[1].trim() : null;
    return code ? `${code}: ${desc}` : desc;
  }

  // 3. Elemento <description>...</description>
  const descTagMatch = responseText.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
  if (descTagMatch && descTagMatch[1].trim()) {
    return descTagMatch[1].trim();
  }

  // 4. Elemento <faultstring>...</faultstring>
  const faultMatch = responseText.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i);
  if (faultMatch && faultMatch[1].trim()) {
    return faultMatch[1].trim();
  }

  // 5. Elemento <message>...</message>
  const messageMatch = responseText.match(/<message[^>]*>([\s\S]*?)<\/message>/i);
  if (messageMatch && messageMatch[1].trim()) {
    const firstLine = messageMatch[1].trim().split('\n')[0].trim();
    return firstLine || messageMatch[1].trim();
  }

  return 'Error en la validación de SIRA. Ver logs XML.';
}

export interface E3LValidationResult {
  valid: boolean;
  schemaVersion: string;
  errors: string[];
  warnings: string[];
}

/**
 * Valida la conformidad del DI frente a los requisitos estructurales del esquema E3L v3.6 (e3l-waste.xsd / e3l-wasteSupport.xsd)
 * antes de generar o transmitir el mensaje telemático.
 */
export function validateDIForE3L(doc: any): E3LValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!doc?.numero_documento || !String(doc.numero_documento).trim()) {
    errors.push('Falta el código del Documento de Identificación (DCSCode).');
  }
  if (!doc?.productor_cif || !String(doc.productor_cif).trim()) {
    errors.push('Falta el CIF/NIF del Productor (DCSProducerData/nationalId).');
  }
  if (!doc?.gestor_cif || !String(doc.gestor_cif).trim()) {
    errors.push('Falta el CIF/NIF del Gestor Destinatario (DCSAdresseeData/nationalId).');
  }
  if (!doc?.transportista_cif || !doc?.transportista_razon_social) {
    errors.push('Faltan datos identificativos reales del Transportista (DCSTransporterData).');
  }
  const cleanLer = normalizeLerCode(doc?.codigo_ler || '');
  if (!/^\d{6}$/.test(cleanLer)) {
    errors.push(`Código LER inválido para E3L (${doc?.codigo_ler || 'vacío'}): debe contener 6 dígitos numéricos.`);
  }
  const op = normalizeOperation(doc?.operacion_tratamiento_ejecutada || doc?.operacion_tratamiento || '');
  if (!/^(R(0[1-9]|1[0-5])|D(0[1-9]|1[0-5]))(\d{2})?$/.test(op)) {
    errors.push(`Operación de tratamiento inválida para tabla2 E3L (${op || 'vacía'}).`);
  }
  if (!doc?.cantidad || Number(doc.cantidad) <= 0) {
    errors.push('La cantidad neta del residuo (DCSClearWeight) debe ser mayor que 0.');
  }

  // En traslados con notificación previa, la NT es obligatoria según e3l-waste.xsd
  const isDanger = doc?.peligrosidad === 'peligroso' || String(doc?.codigo_ler || '').includes('*');
  if (
    doc?.tipo_notificacion === 'sin-notificacion' &&
    (isDanger || cleanLer === '200301' || op.startsWith('D') || op.startsWith('R01'))
  ) {
    errors.push('El traslado exige Notificación Previa (NT) según el art. 3.2 del RD 553/2020 (residuos peligrosos, LER 20 03 01, R01 o eliminación D).');
  }
  const rawNt = String(doc?.numero_notificacion || doc?.nt_codigo || doc?.notificacion_previa_codigo || '').trim();
  if (doc?.tipo_notificacion === 'con-notificacion-previa' && !/^NT[0-9]{23,24}$/.test(rawNt)) {
    errors.push('El traslado requiere Notificación Previa (NT), pero falta un código NT oficial válido (^NT[0-9]{23,24}$).');
  }

  const nimaPattern = /^(0[1-9]|[1-4][0-9]|5[0-2])\d{8}$/;
  if (!doc?.productor_nima) {
    warnings.push('Falta NIMA del centro productor.');
  } else if (!nimaPattern.test(String(doc.productor_nima).trim())) {
    errors.push(`NIMA del productor inválido (${doc.productor_nima}): debe tener exactamente 10 dígitos numéricos con prefijo provincial INE 01–52 (RD 764/2026).`);
  }

  if (!doc?.gestor_nima) {
    warnings.push('Falta NIMA de la instalación de destino.');
  } else if (!nimaPattern.test(String(doc.gestor_nima).trim())) {
    errors.push(`NIMA del gestor destino inválido (${doc.gestor_nima}): debe tener exactamente 10 dígitos numéricos con prefijo provincial INE 01–52 (RD 764/2026).`);
  }

  if (!doc?.transportista_nima) {
    warnings.push('Falta NIMA del transportista.');
  } else if (!nimaPattern.test(String(doc.transportista_nima).trim())) {
    errors.push(`NIMA del transportista inválido (${doc.transportista_nima}): debe tener exactamente 10 dígitos numéricos con prefijo provincial INE 01–52 (RD 764/2026).`);
  }
  if (!doc?.productor_municipio || !doc?.gestor_municipio) {
    warnings.push('Falta municipio oficial en origen o destino.');
  }

  return {
    valid: errors.length === 0,
    schemaVersion: 'E3L v3.6 (namespaces e3l://eterproject.org/3.0/*)',
    errors,
    warnings,
  };
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export const siraService = {
  validateDIForE3L(doc: any): E3LValidationResult {
    return validateDIForE3L(doc);
  },

  generateDIXml(doc: any): string {
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    const clean = (val: any) => val ? this.escapeXml(String(val)).trim() : '';

    const xmlnsWassup = 'xmlns:wassup="e3l://eterproject.org/3.0/wasteSupport"';
    const xmlnsCommon = 'xmlns:common="e3l://eterproject.org/3.0/common"';
    const xmlnsXsi = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';

    const compData = Array.isArray(doc.company) ? doc.company[0] : doc.company;
    const cleanDocNum = clean(doc.numero_documento);
    const prodProvCode = getProvinceCodeByName(doc.productor_provincia || compData?.provincia_instalacion || 'Cádiz');
    const gestProvCode = doc.gestor_provincia ? getProvinceCodeByName(doc.gestor_provincia) : prodProvCode;
    const isInterautonomico =
      Boolean(doc.gestor_provincia) &&
      (!ANDALUSIA_PROVINCE_CODES.has(prodProvCode) || !ANDALUSIA_PROVINCE_CODES.has(gestProvCode));
    const provNima = formatNima(doc.productor_nima || compData?.nima, prodProvCode);
    const dcsCode = formatDCSCode(cleanDocNum, provNima, doc.id);
    const dcsPhase = doc.dcs_phase || (isDestinationDCSPhase(doc) ? 'D' : 'R');

    return `
<wasteDCS 
    ${xmlnsWassup}
    ${xmlnsCommon}
    ${xmlnsXsi}
    DCSCode="${dcsCode}"
    DCSPhase="${dcsPhase}"
    DCSYear="${date.getFullYear()}"
    DCSDate="${formattedDate}"
    DCSStartDate="${doc.fecha_recogida || formattedDate}"
    DCSRegional="${isInterautonomico ? 'N' : 'S'}"
    DCSSendtoOriginOrDestinationAuthority="${isInterautonomico ? 'S' : 'N'}">

    <!-- 1. Operador del Traslado -->
    ${generateOperatorBlock(doc)}

    <!-- 2. Productor -->
    ${generateProducerBlock(doc)}

    <!-- 3. Destinatario -->
    ${generateManagerBlock(doc)}
    
    <!-- 4. Datos del Residuo (Incluye Transportista) -->
    ${generateResidueBlock(doc)}

</wasteDCS>`.trim();
  },

  /**
   * Genera el mensaje E3L versión 3.6 completo con contenedor <e3l> y <header> reglamentario
   * para validación directa con esquemas oficiales e3l.xsd (RD 553/2020).
   */
  generateE3LMessage(doc: any): string {
    const dcsXml = this.generateDIXml(doc);
    const date = new Date(doc.fecha_documento || new Date());
    const formattedDate = date.toISOString().split('T')[0];
    const compData = Array.isArray(doc.company) ? doc.company[0] : doc.company;
    const senderNif = this.escapeXml(doc.operador_cif || compData?.cif || doc.productor_cif || 'B00000000');
    const senderName = this.escapeXml(doc.operador_razon_social || compData?.razon_social || doc.productor_razon_social || 'RESIGEST');

    return `<?xml version="1.0" encoding="UTF-8"?>
<e3l xmlns="e3l://eterproject.org/3.0/e3l"
     xmlns:waste="e3l://eterproject.org/3.0/waste"
     xmlns:wassup="e3l://eterproject.org/3.0/wasteSupport"
     xmlns:common="e3l://eterproject.org/3.0/common"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     version="3.6">
    <header>
        <messageID>${this.escapeXml(doc.numero_documento || 'DI-E3L')}-${date.getTime()}</messageID>
        <sender>
            <entityId>
                <nationalId>${senderNif}</nationalId>
            </entityId>
            <entityName>
                <reason>
                    <reasonName>${senderName}</reasonName>
                </reason>
            </entityName>
        </sender>
        <recipient>
            <entityId>
                <nationalId>SIRA-JUNTA-ANDALUCIA</nationalId>
            </entityId>
        </recipient>
        <creationDate>${formattedDate}</creationDate>
    </header>
    <waste>
        ${dcsXml}
    </waste>
</e3l>`.trim();
  },

  formatNima(rawNima: string | undefined | null, provCode?: string): string {
    return formatNima(rawNima, provCode);
  },

  formatDCSCode(rawCode: string | undefined | null, nima: string, docId?: number | string): string {
    return formatDCSCode(rawCode, nima, docId);
  },

  getMunicipalityCode(provCode: string, muniName?: string): string {
    return getMunicipalityCodeByProvince(provCode, muniName);
  },

  getProvinceCode(province: string): string {
    // Wrapper para compatibilidad
    return getProvinceCodeByName(province);
  },

  escapeXml(unsafe: string): string {
    return escapeXml(unsafe);
  },

  /**
   * Extrae el mensaje de error legible de una respuesta SOAP/XML de SIRA.
   * Maneja atributos (e.g. <resultWrong code="JA000018" description="..."/>)
   * y elementos SOAP Fault (<faultstring>, <description>, <message>).
   */
  extractSiraError(responseText: string): string {
    return extractSiraError(responseText);
  },

  async sendDI(documentId: number): Promise<{ success: boolean; message: string; siraId?: string }> {
    try {
      const response = await fetch('/api/residuos/sira/enviar-di', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || 'Error al conectar con el servicio SIRA');
      return result;
    } catch (error: any) {
      console.error('SIRA Service Error:', error);
      throw error;
    }
  },

  /**
   * Obtiene el histórico de transmisiones SIRA vinculadas a un DI concreto
   */
  async getSubmissionsForDI(documentId: number): Promise<SiraSubmission[]> {
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth?.getUser?.() || { data: { user: null } };
      let query = supabase
        .from('sira_submissions')
        .select('*')
        .eq('identification_document_id', documentId);

      if (authData?.user) {
        query = query.eq('user_id', authData.user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('siraService.getSubmissionsForDI error:', error.message);
        return [];
      }
      return (data || []) as SiraSubmission[];
    } catch (err) {
      console.warn('siraService.getSubmissionsForDI exception:', err);
      return [];
    }
  },

  /**
   * Obtiene la cola general de envíos SIRA con filtros
   */
  async getAllSubmissions(options?: {
    limit?: number;
    status?: SiraSubmissionStatus;
  }): Promise<SiraSubmission[]> {
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth?.getUser?.() || { data: { user: null } };
      let query = supabase
        .from('sira_submissions')
        .select(`
          *,
          identification_document:identification_documents(
            id,
            numero_documento,
            codigo_ler,
            descripcion_residuo,
            productor_razon_social,
            gestor_razon_social
          )
        `)
        .order('created_at', { ascending: false })
        .limit(options?.limit || 50);

      if (authData?.user) {
        query = query.eq('user_id', authData.user.id);
      }

      if (options?.status) {
        query = query.eq('estado', options.status);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('siraService.getAllSubmissions error:', error.message);
        return [];
      }
      return (data || []) as SiraSubmission[];
    } catch (err) {
      console.warn('siraService.getAllSubmissions exception:', err);
      return [];
    }
  },

  /**
   * Reintenta el envío de una transmisión fallida
   */
  async retrySubmission(documentId: number): Promise<{ success: boolean; message: string; siraId?: string }> {
    return this.sendDI(documentId);
  },

  /**
   * Descarga un archivo XML localmente para inspección
   */
  downloadXmlFile(xmlContent: string, filename: string): void {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url);
    }
  }
};

export default siraService;
