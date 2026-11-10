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
const getProvinceCodeByName = (provinceName: string): string => {
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

const getMunicipalityCodeByProvince = (provCode: string): string => {
  const map: Record<string, string> = {
    '01': '010590', '02': '020032', '03': '030140', '04': '040139', '05': '050190',
    '06': '060150', '07': '070405', '08': '080193', '09': '090590', '10': '100370',
    '11': '110123', '12': '120400', '13': '130340', '14': '140215', '15': '150300',
    '16': '160780', '17': '170790', '18': '180873', '19': '191300', '20': '200690',
    '21': '210413', '22': '221250', '23': '230502', '24': '240890', '25': '251200',
    '26': '260890', '27': '270280', '28': '280796', '29': '290672', '30': '300300',
    '31': '312010', '32': '320540', '33': '330440', '34': '341200', '35': '350160',
    '36': '360380', '37': '372740', '38': '380380', '39': '390750', '40': '401940',
    '41': '410917', '42': '421730', '43': '431480', '44': '442160', '45': '451680',
    '46': '462500', '47': '471860', '48': '480200', '49': '492750', '50': '502970',
    '51': '510010', '52': '520010'
  };
  return map[provCode] || '';
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
  const nima = clean(data.nima);
  const provName = clean(data.province);
  const provCode = provName ? getProvinceCodeByName(provName) : '';
  const muniName = clean(data.municipality);
  const muniCode = clean(data.municipalityCode) || (provCode ? getMunicipalityCodeByProvince(provCode) : '');
  const addressText = clean(data.address);
  const cp = clean(data.cp);
  const phone = clean(data.phone);
  const email = clean(data.email);
  const cnae = clean(data.cnae);
  const authNumber = clean(data.authorizationNumber || data.nima);
  const authCode = clean(data.authorizationCode) || defaultAuthCode;

  const hasAddress = Boolean(addressText || cp || muniName || provName);
  const addressBlock = hasAddress
    ? `
        <centerAddress>
            <spanishAddress>
                <vial vialCode="009" vialDescription="Calle"/>${addressText ? `\n                <address>${addressText}</address>` : ''}${cp ? `\n                <CP>${cp}</CP>` : ''}${muniName ? `\n                <municipality${muniCode ? ` municipalityCode="${muniCode}"` : ''} municipalityName="${muniName}"/>` : ''}${provName ? `\n                <province${provCode && provCode !== '00' ? ` provinceCode="${provCode}"` : ''} provinceName="${provName}"/>` : ''}
            </spanishAddress>
        </centerAddress>`
    : '';

  const contactBlock =
    phone || email
      ? `
        <centerContact>${phone ? `\n            <phone>${phone}</phone>` : ''}${email ? `\n            <mail>${email}</mail>` : ''}
        </centerContact>`
      : '';

  const authBlock = authNumber
    ? `
        <wasteCenterAuthorization>
            <authorizationId>
                <authorizationIdFree>${authNumber}</authorizationIdFree>
            </authorizationId>
            <authorizationCode>${authCode}</authorizationCode>
        </wasteCenterAuthorization>`
    : '';

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
        
        <entityCenter>${nima ? `
            <centerID centerCode="${nima}" />` : ''}${cnae ? `
            <centerEconomicActivity>${cnae}</centerEconomicActivity>` : ''}${addressBlock}${contactBlock}${authBlock}
        </entityCenter>

        <${typeTag} ${typeAttr}="${typeValue}"/>${extraChild ? `\n        ${extraChild}` : ''}
    </${tagName}>`;
};

const generateOperatorBlock = (doc: any): string => {
  const compData = Array.isArray(doc.company) ? doc.company[0] : doc.company;
  const isDanger = doc.peligrosidad === 'peligroso' || String(doc.codigo_ler || '').includes('*');

  return generateEntityBlock(
    'DCSTransferOperatorData',
    {
      cif: doc.operador_cif || compData?.cif || doc.productor_cif,
      name: doc.operador_razon_social || compData?.razon_social || doc.productor_razon_social,
      nima: doc.operador_nima || compData?.nima || doc.productor_nima,
      address: doc.operador_direccion || compData?.domicilio_instalacion || doc.productor_direccion,
      cp: doc.operador_codigo_postal || compData?.codigo_postal_instalacion || doc.productor_codigo_postal,
      municipality: doc.operador_municipio || compData?.municipio_instalacion || doc.productor_municipio,
      province: doc.operador_provincia || compData?.provincia_instalacion || doc.productor_provincia,
      phone: doc.operador_telefono || compData?.telefono || doc.productor_telefono,
      email: doc.operador_email || compData?.email,
      cnae: compData?.cnae,
    },
    'wasteTransferOperatorType',
    'operatorTypeCode',
    'P01',
    isDanger ? 'P01' : 'P02'
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
      address: doc.productor_direccion,
      cp: doc.productor_codigo_postal,
      municipality: doc.productor_municipio,
      province: doc.productor_provincia,
      phone: doc.productor_telefono,
      email: doc.productor_email,
    },
    'wasteProducerType',
    'producerTypeCode',
    isDanger ? 'P01' : 'P02',
    isDanger ? 'P01' : 'P02'
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
  const tData: EntityData = {
    cif: doc.transportista_cif,
    name: doc.transportista_razon_social,
    nima: doc.transportista_nima,
    address: doc.transportista_direccion,
    cp: doc.transportista_codigo_postal,
    municipality: doc.transportista_municipio,
    province: doc.transportista_provincia,
    phone: doc.transportista_telefono,
    email: doc.transportista_email,
  };

  const clean = (val: any) => (val !== undefined && val !== null ? escapeXml(String(val)).trim() : '');
  const cif = clean(tData.cif);
  const name = clean(tData.name);
  const nima = clean(tData.nima);
  const provName = clean(tData.province);
  const provCode = provName ? getProvinceCodeByName(provName) : '';
  const muniName = clean(tData.municipality);
  const muniCode = provCode ? getMunicipalityCodeByProvince(provCode) : '';
  const addressText = clean(tData.address);
  const cp = clean(tData.cp);
  const phone = clean(tData.phone);
  const email = clean(tData.email);

  const hasAddress = Boolean(addressText || cp || muniName || provName);
  const addressBlock = hasAddress
    ? `
                <centerAddress>
                    <spanishAddress>
                        <vial vialCode="009" vialDescription="Calle"/>${addressText ? `\n                        <address>${addressText}</address>` : ''}${cp ? `\n                        <CP>${cp}</CP>` : ''}${muniName ? `\n                        <municipality${muniCode ? ` municipalityCode="${muniCode}"` : ''} municipalityName="${muniName}"/>` : ''}${provName ? `\n                        <province${provCode && provCode !== '00' ? ` provinceCode="${provCode}"` : ''} provinceName="${provName}"/>` : ''}
                    </spanishAddress>
                </centerAddress>`
    : '';

  const contactBlock =
    phone || email
      ? `
                <centerContact>${phone ? `\n                    <phone>${phone}</phone>` : ''}${email ? `\n                    <mail>${email}</mail>` : ''}
                </centerContact>`
      : '';

  const authBlock = nima
    ? `
                <wasteCenterAuthorization>
                    <authorizationId>
                         <authorizationIdFree>${nima}</authorizationIdFree>
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
            <entityCenter>${nima ? `
                <centerID centerCode="${nima}" />` : ''}${addressBlock}${contactBlock}${authBlock}
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

  const buildTables = (opCode: string) => `
        <residueTables ${residueTablesType}>
            <table2>${opCode}</table2>${hpBlock}
        </residueTables>`;

  const residueTypeAttr = isDangerous
    ? 'xsi:type="wassup:dangerousResidueType"'
    : 'xsi:type="wassup:noDangerousResidueType"';

  // Código NT: Solo incluir <DCSNT> cuando exista una NT real y el traslado requiera notificación (F07)
  const rawNt = clean(doc.numero_notificacion || doc.nt_codigo || doc.notificacion_previa_codigo || '');
  const dcsNtNode =
    doc.tipo_notificacion !== 'sin-notificacion' && /^NT[0-9]{23,24}$/.test(rawNt)
      ? `\n            <DCSNT>${rawNt}</DCSNT>`
      : '';

  const rawWeight = Number(doc.peso_destino_kg || doc.peso_origen_kg || doc.cantidad || 0);
  const formattedWeight = !isNaN(rawWeight) && rawWeight > 0 ? rawWeight.toFixed(3) : '';

  const otherData = `
        <DCSOtherResidueData>${dcsNtNode}${formattedWeight ? `\n            <DCSClearWeight>${formattedWeight}</DCSClearWeight>` : ''}
            <DCSTransportCharacteristics>Sin características especiales</DCSTransportCharacteristics>
        </DCSOtherResidueData>`;

  const transporterData = generateTransporterContent(doc);

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
        
        ${otherData}${transporterData}
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
  if (!/^(R0[1-9]|R1[0-3]|D0[1-9]|D1[0-5])$/.test(op)) {
    errors.push(`Operación de tratamiento inválida para tabla2 E3L (${op || 'vacía'}).`);
  }
  if (!doc?.cantidad || Number(doc.cantidad) <= 0) {
    errors.push('La cantidad neta del residuo (DCSClearWeight) debe ser mayor que 0.');
  }

  // En traslados con notificación previa, la NT es obligatoria según e3l-waste.xsd
  const rawNt = String(doc?.numero_notificacion || doc?.nt_codigo || doc?.notificacion_previa_codigo || '').trim();
  if (doc?.tipo_notificacion === 'con-notificacion-previa' && !/^NT[0-9]{23,24}$/.test(rawNt)) {
    errors.push('El traslado requiere Notificación Previa (NT), pero falta un código NT oficial válido (^NT[0-9]{23,24}$).');
  }

  if (!doc?.productor_nima) warnings.push('Falta NIMA del centro productor.');
  if (!doc?.gestor_nima) warnings.push('Falta NIMA de la instalación de destino.');
  if (!doc?.transportista_nima) warnings.push('Falta NIMA del transportista.');
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

    return `
<wasteDCS 
    ${xmlnsWassup}
    ${xmlnsCommon}
    ${xmlnsXsi}
    DCSCode="${clean(doc.numero_documento)}"
    DCSPhase="R"
    DCSYear="${date.getFullYear()}"
    DCSDate="${formattedDate}"
    DCSStartDate="${doc.fecha_recogida || formattedDate}"
    DCSRegional="S"
    DCSSendtoOriginOrDestinationAuthority="N">

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
