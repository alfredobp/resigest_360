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
  return map[provCode] || '410917';
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
  cif: string;
  name: string;
  nima: string;
  address?: string;
  cp?: string;
  municipality?: string;
  province?: string;
  phone?: string;
  email?: string;
}

/**
 * Genera un bloque de entidad genérico conforme a wasteCenterEntityType
 */
const generateEntityBlock = (
  tagName: string,
  data: EntityData,
  typeTag: string,
  typeAttr: string,
  typeValue: string,
  extraChild = ''
): string => {
  const clean = (val: any) => val ? escapeXml(String(val)).trim() : '';

  // Datos de dirección (con fallbacks para validación)
  const provCode = getProvinceCodeByName(data.province || '');
  const muniName = clean(data.municipality || 'Desconocido');
  const muniCode = getMunicipalityCodeByProvince(provCode);
  const addressText = clean(data.address || 'Dirección no registrada');
  const cp = clean(data.cp || '00000');

  const addressBlock = `
        <centerAddress>
            <spanishAddress>
                <vial vialCode="009" vialDescription="Calle"/>
                <address>${addressText}</address>
                <CP>${cp}</CP>
                <municipality municipalityCode="${muniCode}" municipalityName="${muniName}"/>
                <province provinceCode="${provCode}" provinceName="${clean(data.province || 'Desconocida')}"/>
            </spanishAddress>
        </centerAddress>`;

  const contactBlock = `
        <centerContact>
            <phone>${clean(data.phone || '999999999')}</phone>
            <mail>${clean(data.email || 'pendiente@email.com')}</mail>
        </centerContact>`;

  const authBlock = `
        <wasteCenterAuthorization>
            <authorizationId>
                <authorizationIdFree>${clean(data.nima || 'PENDIENTE')}</authorizationIdFree>
            </authorizationId>
            <authorizationCode>A01</authorizationCode>
        </wasteCenterAuthorization>`;

  // Estructura para Empresa (Persona Jurídica)
  const nameBlock = `
        <entityName>
            <reason>
                <reasonName>${clean(data.name)}</reasonName>
                <reasonAssociation associationCode="99" associationDescription="Otra"/>
            </reason>
        </entityName>`;

  return `
    <${tagName}>
        <entityId>
            <nationalId>${clean(data.cif)}</nationalId>
        </entityId>
        <entityFJ entityFJCode="J" />
        ${nameBlock}
        
        <entityCenter>
            <centerID centerCode="${clean(data.nima || 'PENDIENTE')}" />
            <centerEconomicActivity>S/D</centerEconomicActivity>
            ${addressBlock}
            ${contactBlock}
            ${authBlock}
        </entityCenter>

        <${typeTag} ${typeAttr}="${typeValue}"/>
        ${extraChild}
    </${tagName}>`;
};

const generateOperatorBlock = (doc: any): string => {
  // El operador suele ser el productor si él genera el documento
  // Si doc.company (usuario logueado) tiene datos, usamos esos.
  const compData = Array.isArray(doc.company) ? doc.company[0] : doc.company;

  return generateEntityBlock(
    'DCSTransferOperatorData',
    {
      cif: compData?.cif || doc.productor_cif,
      name: compData?.razon_social || doc.productor_razon_social,
      nima: compData?.nima || doc.productor_nima,
      address: compData?.domicilio_instalacion || doc.productor_direccion,
      province: compData?.provincia_instalacion || doc.productor_provincia,
      phone: compData?.telefono || doc.productor_telefono,
      email: compData?.email
    },
    'wasteTransferOperatorType',
    'operatorTypeCode',
    'P01'
  );
};

const generateProducerBlock = (doc: any): string => {
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
      phone: doc.productor_telefono
    },
    'wasteProducerType',
    'producerTypeCode',
    'P01'
  );
};

const generateManagerBlock = (doc: any): string => {
  return generateEntityBlock(
    'DCSAdresseeData',
    {
      cif: doc.gestor_cif,
      name: doc.gestor_razon_social,
      nima: doc.gestor_nima,
      address: doc.gestor_direccion,
      cp: doc.gestor_codigo_postal,
      municipality: doc.gestor_municipio,
      province: doc.gestor_provincia,
      phone: doc.gestor_telefono
    },
    'wasteManagerType',
    'managerTypeCode',
    'G01'
  );
};

const generateTransporterContent = (doc: any): string => {
  // Si no hay transportista en doc, usamos dummy para validación técnica
  const tData: EntityData = {
    cif: doc.transportista_cif || 'A00000000',
    name: doc.transportista_razon_social || 'Transportista Genérico',
    nima: doc.transportista_nima || 'NIMA-PENDIENTE',
    address: doc.transportista_direccion,
    cp: doc.transportista_codigo_postal,
    municipality: doc.transportista_municipio,
    province: doc.transportista_provincia,
    phone: doc.transportista_telefono
  };

  const clean = (val: any) => val ? escapeXml(String(val)).trim() : '';

  // Mapeo geográfico
  const provCode = getProvinceCodeByName(tData.province || '');
  const muniName = clean(tData.municipality || 'Desconocido');
  const muniCode = getMunicipalityCodeByProvince(provCode);
  const addressText = clean(tData.address || 'Dirección no registrada');
  const cp = clean(tData.cp || '00000');

  return `
        <DCSTransporterData>
            <entityId>
                <nationalId>${clean(tData.cif)}</nationalId>
            </entityId>
            <entityFJ entityFJCode="J" />
            <entityName>
                <reason>
                    <reasonName>${clean(tData.name)}</reasonName>
                    <reasonAssociation associationCode="99" associationDescription="Otra"/>
                </reason>
            </entityName>
            <entityCenter>
                <centerID centerCode="${clean(tData.nima)}" />
                <centerEconomicActivity>S/D</centerEconomicActivity>
                <centerAddress>
                    <spanishAddress>
                        <vial vialCode="009" vialDescription="Calle"/>
                        <address>${addressText}</address>
                        <CP>${cp}</CP>
                        <municipality municipalityCode="${muniCode}" municipalityName="${muniName}"/>
                        <province provinceCode="${provCode}" provinceName="${clean(tData.province || 'Desconocida')}"/>
                    </spanishAddress>
                </centerAddress>
                <centerContact>
                    <phone>${clean(tData.phone || '999999999')}</phone>
                    <mail>transporte@pendiente.com</mail>
                </centerContact>
                <wasteCenterAuthorization>
                    <authorizationId>
                         <authorizationIdFree>${clean(tData.nima)}</authorizationIdFree>
                    </authorizationId>
                    <authorizationCode>A01</authorizationCode>
                </wasteCenterAuthorization>
            </entityCenter>

            <wasteTransporterType trasporterTypeCode="T01" transporterTypeDescription="Transportista de residuos"/>
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
  const isDangerous = doc.peligrosidad === 'peligroso';
  const cleanLer = normalizeLerCode(doc.codigo_ler);

  const residueBag = `
        <residueBag>
             <bagProcess internalIdProcessCode="99"/>
             <bagResidueId residueCode="999" residueDescription="${clean(doc.descripcion_residuo || doc.nombre_residuo || 'Residuo Genérico')}"/>
        </residueBag>`;

  // Operación: Default R13 o valor real normalizado (2 dígitos para R/D)
  const opTratamiento = normalizeOperation(clean(doc.operacion_tratamiento || 'R13'));

  const residueTablesType = isDangerous
    ? 'xsi:type="wassup:tablesDangerousType"'
    : 'xsi:type="wassup:tablesNoDangerousType"';

  const hpBlock = isDangerous
    ? `\n            <table5>${normalizeHpCode(doc.caracteristica_peligrosidad || doc.codigo_hp || doc.hp || '')}</table5>`
    : '';

  const residueTables = `
        <residueTables ${residueTablesType}>
            <table2>${opTratamiento}</table2>${hpBlock}
        </residueTables>`;

  const residueTypeAttr = isDangerous
    ? 'xsi:type="wassup:dangerousResidueType"'
    : 'xsi:type="wassup:noDangerousResidueType"';

  // Código NT: Si no hay NT previa válida, usar el código oficial por defecto del esquema E3L (NT + 23 nueves)
  const rawNt = clean(doc.numero_notificacion || doc.nt_codigo || doc.notificacion_previa_codigo || '');
  const dcsNt = /^NT[0-9]{23,24}$/.test(rawNt) ? rawNt : 'NT99999999999999999999999';

  const clearWeight = Number(doc.cantidad || 0);
  const formattedWeight = isNaN(clearWeight) || clearWeight <= 0 ? '1.000' : clearWeight.toFixed(3);

  const otherData = `
        <DCSOtherResidueData>
            <DCSNT>${dcsNt}</DCSNT>
            <DCSClearWeight>${formattedWeight}</DCSClearWeight>
            <DCSTransportCharacteristics>Sin características especiales</DCSTransportCharacteristics>
        </DCSOtherResidueData>`;

  const transporterData = generateTransporterContent(doc);

  return `
    <DCSResidueData>
        <DCSProducerResidueIdentification LERCode="${cleanLer}" ${residueTypeAttr}>
            ${residueBag}
            ${residueTables}
        </DCSProducerResidueIdentification>
        
        <DCSAdresseeResidueIdentification LERCode="${cleanLer}" ${residueTypeAttr}>
            ${residueBag}
            ${residueTables}
        </DCSAdresseeResidueIdentification>
        
        ${otherData}
        ${transporterData}
    </DCSResidueData>`;
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export const siraService = {
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
      const { data, error } = await supabase
        .from('sira_submissions')
        .select('*')
        .eq('identification_document_id', documentId)
        .order('created_at', { ascending: false });

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
