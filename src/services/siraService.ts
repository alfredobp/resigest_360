// =====================================================
// SIRA SERVICE (Integration with Junta de Andalucía)
// Servicio para comunicación SOAP con la plataforma SIRA
// =====================================================

import { IdentificationDocument } from '@/types/wasteManagement';

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
  extraChild: string = ''
): string => {
  const clean = (val: any) => val ? escapeXml(String(val)).trim() : '';

  // Datos de dirección (con fallbacks para validación)
  const provCode = getProvinceCodeByName(data.province || '');
  const muniName = clean(data.municipality || 'Desconocido');
  const addressText = clean(data.address || 'Dirección no registrada');
  const cp = clean(data.cp || '00000');

  const addressBlock = `
        <centerAddress>
            <spanishAddress>
                <vial vialCode="CL" vialDescription="Calle"/>
                <address>${addressText}</address>
                <CP>${cp}</CP>
                <municipality municipalityCode="00000" municipalityName="${muniName}"/>
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
                        <vial vialCode="CL" vialDescription="Calle"/>
                        <address>${addressText}</address>
                        <CP>${cp}</CP>
                        <municipality municipalityCode="00000" municipalityName="${muniName}"/>
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

const generateResidueBlock = (doc: any): string => {
  const clean = (val: any) => val ? escapeXml(String(val)).trim() : '';
  const isDangerous = doc.peligrosidad === 'peligroso';

  const residueBag = `
        <residueBag>
             <bagProcess internalIdProcessCode="99"/>
             <bagResidueId residueCode="999" residueDescription="${clean(doc.descripcion_residuo || doc.nombre_residuo || 'Residuo Genérico')}"/>
        </residueBag>`;

  // Operación: Default R13 o valor real
  const opTratamiento = clean(doc.operacion_tratamiento || 'R13');

  const residueTablesType = isDangerous
    ? 'xsi:type="wassup:tablesDangerousType"'
    : 'xsi:type="wassup:tablesNoDangerousType"';

  const residueTables = `
        <residueTables ${residueTablesType}>
            <table2>${opTratamiento}</table2>
        </residueTables>`;

  const residueTypeAttr = isDangerous
    ? 'xsi:type="wassup:dangerousResidueType"'
    : 'xsi:type="wassup:dangerousResidueType"'; // Default estricto

  const otherData = `
        <DCSOtherResidueData>
            <DCSNT>PENDIENTE-NT</DCSNT>
            <DCSClearWeight>${doc.cantidad}</DCSClearWeight>
            <DCSTransportCharacteristics>Sin características especiales</DCSTransportCharacteristics>
        </DCSOtherResidueData>`;

  const transporterData = generateTransporterContent(doc);

  return `
    <DCSResidueData>
        <DCSProducerResidueIdentification LERCode="${clean(doc.codigo_ler)}" ${residueTypeAttr}>
            ${residueBag}
            ${residueTables}
        </DCSProducerResidueIdentification>
        
        <DCSAdresseeResidueIdentification LERCode="${clean(doc.codigo_ler)}" ${residueTypeAttr}>
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
      if (!response.ok) throw new Error(result.error || 'Error al conectar con el servicio SIRA');
      return result;
    } catch (error: any) {
      console.error('SIRA Service Error:', error);
      throw error;
    }
  }
};

export default siraService;
