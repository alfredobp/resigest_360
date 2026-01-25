// =====================================================
// SIRA SERVICE (Integration with Junta de Andalucía)
// Servicio para comunicación SOAP con la plataforma SIRA
// =====================================================

import { IdentificationDocument } from '@/types/wasteManagement';

// ============================================================================
// FUNCIONES AUXILIARES PRIVADAS (Generación de bloques XML E3L v3.6)
// ============================================================================

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
 * Genera un bloque de entidad genérico
 */
const generateEntityBlock = (
  tagName: string,
  cif: string,
  name: string,
  nima: string,
  typeTag: string,
  typeAttr: string,
  typeValue: string,
  extraChild: string = ''
): string => {
  const clean = (val: any) => val ? escapeXml(String(val)).trim() : '';

  const addressBlock = `
        <centerAddress>
            <spanishAddress>
                <vial vialCode="CL" vialDescription="Calle"/>
                <address>Dirección Desconocida</address>
                <CP>00000</CP>
                <municipality municipalityCode="00000" municipalityName="Desconocido"/>
                <province provinceCode="00" provinceName="Desconocida"/>
            </spanishAddress>
        </centerAddress>`;

  const contactBlock = `
        <centerContact>
            <phone>999999999</phone>
            <mail>pendiente@ejemplo.com</mail>
        </centerContact>`;

  const authBlock = `
        <wasteCenterAuthorization>
            <authorizationId>
                <authorizationIdFree>${clean(nima || 'PENDIENTE')}</authorizationIdFree>
            </authorizationId>
            <authorizationCode>A01</authorizationCode>
        </wasteCenterAuthorization>`;

  const nameBlock = `
        <entityName>
            <reason>
                <reasonName>${clean(name)}</reasonName>
                <reasonAssociation associationCode="99" associationDescription="Otra"/>
            </reason>
        </entityName>`;

  return `
    <${tagName}>
        <entityId>
            <nationalId>${clean(cif)}</nationalId>
        </entityId>
        <entityFJ entityFJCode="J" />
        ${nameBlock}
        
        <entityCenter>
            <centerID centerCode="${clean(nima || '')}" />
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
  return generateEntityBlock(
    'DCSTransferOperatorData',
    doc.company?.cif || doc.productor_cif,
    doc.company?.razon_social || doc.productor_razon_social,
    doc.company?.nima || doc.productor_nima,
    'wasteTransferOperatorType',
    'operatorTypeCode',
    'P01'
  );
};

const generateProducerBlock = (doc: any): string => {
  return generateEntityBlock(
    'DCSProducerData',
    doc.productor_cif,
    doc.productor_razon_social,
    doc.productor_nima,
    'wasteProducerType',
    'producerTypeCode',
    'P01'
  );
};

const generateManagerBlock = (doc: any): string => {
  return generateEntityBlock(
    'DCSAdresseeData',
    doc.gestor_cif,
    doc.gestor_razon_social,
    doc.gestor_nima,
    'wasteManagerType',
    'managerTypeCode',
    'G01'
  );
};

const generateTransporterContent = (doc: any): string => {
  const cif = 'A00000000';
  const name = 'Transportista Genérico';
  const nima = 'NIMA-TRANS';

  return `
        <DCSTransporterData>
            <entityId>
                <nationalId>${cif}</nationalId>
            </entityId>
            <entityFJ entityFJCode="J" />
            <entityName>
                <reason>
                    <reasonName>${name}</reasonName>
                    <reasonAssociation associationCode="99" associationDescription="Otra"/>
                </reason>
            </entityName>
            <entityCenter>
                <centerID centerCode="${nima}" />
                <centerEconomicActivity>S/D</centerEconomicActivity>
                <centerAddress>
                    <spanishAddress>
                        <vial vialCode="CL" vialDescription="Calle"/>
                        <address>Dirección Transportista</address>
                        <CP>00000</CP>
                        <municipality municipalityCode="00000" municipalityName="Desconocido"/>
                        <province provinceCode="00" provinceName="Desconocida"/>
                    </spanishAddress>
                </centerAddress>
                <centerContact>
                    <phone>999999999</phone>
                    <mail>transporte@ejemplo.com</mail>
                </centerContact>
                <wasteCenterAuthorization>
                    <authorizationId>
                         <authorizationIdFree>${nima}</authorizationIdFree>
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
             <bagResidueId residueCode="999" residueDescription="${clean(doc.nombre_residuo || 'Residuo Genérico')}"/>
        </residueBag>`;

  // CORRECCIÓN FINAL v6: Añadir xsi:type a residueTables (Clase abstracta)
  const residueTablesType = isDangerous
    ? 'xsi:type="wassup:tablesDangerousType"'
    : 'xsi:type="wassup:tablesNoDangerousType"';

  const residueTables = `
        <residueTables ${residueTablesType}>
            <table2>R13</table2>
        </residueTables>`;

  const residueTypeAttr = isDangerous
    ? 'xsi:type="wassup:dangerousResidueType"'
    : 'xsi:type="wassup:dangerousResidueType"'; // Asumimos peligroso si no tenemos más info

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
    if (!province) return '41';
    const provinces: Record<string, string> = {
      'alava': '01', 'albacete': '02', 'alicante': '03', 'almeria': '04', 'avila': '05',
      'badajoz': '06', 'balears': '07', 'barcelona': '08', 'burgos': '09', 'caceres': '10',
      'cadiz': '11', 'castellon': '12', 'ciudad real': '13', 'cordoba': '14', 'coruña': '15',
      'cuenca': '16', 'girona': '17', 'granada': '18', 'guadalajara': '19', 'guipuzcoa': '20',
      'huelva': '21', 'huesca': '22', 'jaen': '23', 'leon': '24', 'lleida': '25',
      'rioja': '26', 'lugo': '27', 'madrid': '28', 'malaga': '29', 'murcia': '30',
      'navarra': '31', 'ourense': '32', 'asturias': '33', 'palencia': '34', 'las palmas': '35',
      'pontevedra': '36', 'salamanca': '37', 'santa cruz de tenerife': '38', 'cantabria': '39',
      'segovia': '40', 'sevilla': '41', 'soria': '42', 'tarragona': '43', 'teruel': '44',
      'toledo': '45', 'valencia': '46', 'valladolid': '47', 'vizcaya': '48', 'zamora': '49',
      'zaragoza': '50', 'ceuta': '51', 'melilla': '52'
    };
    const p = province.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return provinces[p] || '41';
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
