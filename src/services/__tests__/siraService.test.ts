const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Setup DOM mocks for XML download
if (typeof URL.createObjectURL === 'undefined') {
  (URL as any).createObjectURL = jest.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  (URL as any).revokeObjectURL = jest.fn();
}

if (typeof document === 'undefined') {
  (global as any).document = {
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
    createElement: jest.fn(() => ({
      setAttribute: jest.fn(),
      click: jest.fn(),
    })),
  };
}

// Global fetch mock
const originalFetch = global.fetch;

import { siraService } from '../siraService';

describe('siraService - Integración SIRA / E3L v3.6 (Junta de Andalucía)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe('Funciones Auxiliares: escapeXml y getProvinceCode', () => {
    it('escapeXml debe escapar caracteres especiales de XML', () => {
      expect(siraService.escapeXml('')).toBe('');
      expect(siraService.escapeXml('<tag attr="val & \'quote\'">Content</tag>')).toBe(
        '&lt;tag attr=&quot;val &amp; &apos;quote&apos;&quot;&gt;Content&lt;/tag&gt;'
      );
    });

    it('getProvinceCode debe mapear nombres de provincia a códigos INE de 2 dígitos', () => {
      expect(siraService.getProvinceCode('Sevilla')).toBe('41');
      expect(siraService.getProvinceCode('Málaga')).toBe('29');
      expect(siraService.getProvinceCode('Madrid')).toBe('28');
      expect(siraService.getProvinceCode('Cádiz')).toBe('11');
      expect(siraService.getProvinceCode('')).toBe('00');
      expect(siraService.getProvinceCode('Provincia Desconocida')).toBe('00');
    });

    it('formatNima debe normalizar NIMAs al formato XSD de 10 dígitos (provincia + 8 dígitos)', () => {
      expect(siraService.formatNima('1100000014', '11')).toBe('1100000014');
      // Si tiene 10 dígitos pero el prefijo provincial es 00 (inválido en XSD)
      expect(siraService.formatNima('0000000014', '11')).toBe('1100000014');
      // Si tiene caracteres no numéricos o longitud corta
      expect(siraService.formatNima('14', '11')).toBe('1100000014');
      expect(siraService.formatNima('', '41')).toBe('4100000001');
    });

    it('formatDCSCode debe generar un código de 26 caracteres conforme al patrón E3L DCS', () => {
      const dcs = siraService.formatDCSCode('PRUEBA-123', '1100000014', 121);
      expect(dcs).toHaveLength(26);
      expect(dcs).toMatch(/^DCS101100000014\d{4}0000121$/);

      // Si ya cumple el formato de 26 caracteres no lo altera
      const validCode = 'DCS10110000001420260000121';
      expect(siraService.formatDCSCode(validCode, '1100000014')).toBe(validCode);
    });

    it('getMunicipalityCode debe retornar códigos oficiales INE válidos del esquema', () => {
      expect(siraService.getMunicipalityCode('11', 'Puerto Real')).toBe('110282');
      expect(siraService.getMunicipalityCode('11', 'Jerez de la Frontera')).toBe('110200');
      expect(siraService.getMunicipalityCode('29', 'Málaga')).toBe('290672');
      expect(siraService.getMunicipalityCode('14', 'Córdoba')).toBe('140214');
      expect(siraService.getMunicipalityCode('41', 'Sevilla')).toBe('410917');
      expect(siraService.getMunicipalityCode('28', 'Madrid')).toBe('280796');
      expect(siraService.getMunicipalityCode('11')).toBe('110012');
    });
  });

  describe('generateDIXml', () => {
    it('debe generar XML estructurado E3L para un DI peligroso con todos los bloques', () => {
      const mockDoc = {
        numero_documento: 'DI-2025-0001',
        fecha_recogida: '2025-05-15',
        operador_cif: 'B12345678',
        operador_razon_social: 'Operador Logístico S.L.',
        operador_nima: 'NIMA-OP-01',
        operador_direccion: 'Calle Industria 1',
        operador_codigo_postal: '41001',
        operador_municipio: 'Sevilla',
        operador_provincia: 'Sevilla',
        operador_telefono: '954000000',
        productor_cif: 'A87654321',
        productor_razon_social: 'Productor Químico S.A.',
        productor_nima: 'NIMA-PROD-01',
        productor_direccion: 'Avenida Fábrica 2',
        productor_codigo_postal: '41002',
        productor_municipio: 'Sevilla',
        productor_provincia: 'Sevilla',
        productor_telefono: '954111111',
        gestor_cif: 'B99887766',
        gestor_razon_social: 'EcoTratamiento S.L.',
        gestor_nima: 'NIMA-GEST-01',
        gestor_numero_autorizacion: 'AUT-AND-999',
        gestor_direccion: 'Polígono Verde 3',
        gestor_codigo_postal: '41003',
        gestor_municipio: 'Sevilla',
        gestor_provincia: 'Sevilla',
        gestor_telefono: '954222222',
        transportista_cif: 'B55443322',
        transportista_razon_social: 'TransEcológica S.L.',
        transportista_nima: 'NIMA-TRANS-01',
        transportista_direccion: 'Autovía 4',
        transportista_codigo_postal: '41004',
        transportista_municipio: 'Sevilla',
        transportista_provincia: 'Sevilla',
        transportista_telefono: '954333333',
        codigo_ler: '15 01 10*',
        descripcion_residuo: 'Envases contaminados con disolventes',
        peligrosidad: 'peligroso',
        operacion_tratamiento: 'R13',
        cantidad: 1.5,
      };

      const xml = siraService.generateDIXml(mockDoc);

      expect(xml).toMatch(/DCSCode="DCS\d{23}"/);
      expect(xml).toContain('DCSStartDate="2025-05-15"');
      expect(xml).toContain('<reasonName>Productor Químico S.A.</reasonName>');
      expect(xml).toContain('<nationalId>A87654321</nationalId>');
      expect(xml).toContain('<nationalId>B99887766</nationalId>');
      expect(xml).toContain('LERCode="150110"');
      expect(xml).toContain('<table5>HP4</table5>');
      expect(xml).not.toContain('<DCSNT>');
      expect(xml).toContain('<DCSClearWeight>1.500</DCSClearWeight>');
    });

    it('debe incluir DCSNT únicamente cuando existe notificación previa y código NT real', () => {
      const mockDocWithNt = {
        numero_documento: 'DI-2026-0099',
        fecha_documento: '2026-11-10',
        tipo_notificacion: 'con-notificacion-previa',
        numero_notificacion: 'NT00000000000000000000001',
        codigo_ler: '17 04 05',
        peligrosidad: 'no-peligroso',
        operacion_tratamiento: 'R13',
        operacion_tratamiento_ejecutada: 'R04',
        cantidad: 2,
      };

      const xml = siraService.generateDIXml(mockDocWithNt);
      expect(xml).toContain('<DCSNT>NT00000000000000000000001</DCSNT>');
      expect(xml).toContain('<table2>R04</table2>');
    });

    it('debe generar XML sin datos ficticios de relleno cuando faltan campos opcionales', () => {
      const minDoc = {
        numero_documento: 'DI-MIN-001',
        codigo_ler: '20 01 01',
        peligrosidad: 'no-peligroso',
        cantidad: 0.8,
      };

      const xml = siraService.generateDIXml(minDoc);

      expect(xml).toMatch(/DCSCode="DCS\d{23}"/);
      expect(xml).toContain('LERCode="200101"');
      expect(xml).toContain('xsi:type="wassup:noDangerousResidueType"');
      expect(xml).toContain('producerTypeCode="P03"');
      expect(xml).not.toContain('A00000000');
      expect(xml).not.toContain('<phone>999999999</phone>');
      expect(xml).not.toContain('pendiente@email.com');
      expect(xml).not.toContain('NIMA-PENDIENTE');
      // RES6-I12: No forzar código postal inventado 41001 ni 11001 si no viene provisto
      expect(xml).not.toContain('<CP>11001</CP>');
      expect(xml).not.toContain('<CP>41001</CP>');
    });

    it('debe soportar subcódigos de 4 dígitos y marcar DCSRegional="N" en traslados interautonómicos', () => {
      const xml = siraService.generateDIXml({
        numero_documento: 'DI-INTER-001',
        productor_provincia: 'Sevilla',
        gestor_provincia: 'Madrid',
        codigo_ler: '15 01 01',
        peligrosidad: 'no-peligroso',
        operacion_tratamiento: 'R1201',
        cantidad: 2,
      });

      expect(xml).toContain('DCSPhase="R"');
      expect(xml).toContain('DCSRegional="N"');
      expect(xml).toContain('DCSSendtoOriginOrDestinationAuthority="S"');
      expect(xml).toContain('<table2>R12</table2>');
      expect(xml).toContain('<process operationIdProcessCode="R1201"/>');
    });

    it('debe emitir DCSPhase="D" y <DCSAcceptanceData> al aceptar o rechazar en destino', () => {
      const acceptedXml = siraService.generateDIXml({
        numero_documento: 'DI-DEST-001',
        fecha_documento: '2026-11-10',
        fecha_recogida: '2026-11-11',
        fecha_recepcion: '2026-11-12',
        estado_traslado: 'aceptado',
        resultado_recepcion: 'aceptado',
        peso_destino_kg: 1850,
        codigo_ler: '17 04 05',
        peligrosidad: 'no-peligroso',
        operacion_tratamiento: 'R1201',
      });

      expect(acceptedXml).toContain('DCSPhase="D"');
      expect(acceptedXml).toContain('<DCSAcceptanceData>');
      expect(acceptedXml).toContain('<DCSRealQuantity>1850.000</DCSRealQuantity>');
      expect(acceptedXml).toContain('<DCSAcceptance>03</DCSAcceptance>');
      expect(acceptedXml).toContain('<DCSAcceptanceDate>2026-11-12</DCSAcceptanceDate>');
      expect(acceptedXml).toContain('<DCSDeliveryDate>2026-11-11</DCSDeliveryDate>');
      expect(acceptedXml).not.toContain('<DCSRefusedAction>');

      const rejectedXml = siraService.generateDIXml({
        numero_documento: 'DI-DEST-002',
        fecha_documento: '2026-11-10',
        fecha_recepcion: '2026-11-13',
        estado_traslado: 'rechazado_total',
        resultado_recepcion: 'rechazado_total',
        accion_rechazo: 'reenvio',
        peso_destino_kg: 500,
        codigo_ler: '15 01 10*',
        peligrosidad: 'peligroso',
        operacion_tratamiento: 'R13',
      });

      expect(rejectedXml).toContain('DCSPhase="D"');
      expect(rejectedXml).toContain('<DCSAcceptance>04</DCSAcceptance>');
      expect(rejectedXml).toContain('<DCSRefusedAction>Redelivery</DCSRefusedAction>');
      expect(rejectedXml).toContain('<DCSRefusedActionDate>2026-11-13</DCSRefusedActionDate>');
    });

    it('descuenta cantidad_rechazada_kg de <DCSRealQuantity> en rechazos parciales', () => {
      const partialXml = siraService.generateDIXml({
        numero_documento: 'DI-DEST-003',
        fecha_documento: '2026-11-10',
        fecha_recepcion: '2026-11-14',
        estado_traslado: 'rechazado_parcial',
        resultado_recepcion: 'rechazado_parcial',
        peso_destino_kg: 1000,
        cantidad_rechazada_kg: 250,
        codigo_ler: '15 01 01',
        peligrosidad: 'no-peligroso',
        operacion_tratamiento: 'R1201',
      });

      expect(partialXml).toContain('DCSPhase="D"');
      expect(partialXml).toContain('<DCSRealQuantity>750.000</DCSRealQuantity>');
      expect(partialXml).toContain('<DCSAcceptance>03</DCSAcceptance>');
      expect(partialXml).toContain('DCSEndDate="2026-11-14"');
      expect(partialXml).toContain('DCSDate="2026-11-10"');
      expect(partialXml).toContain('DCSYear="2026"');
    });

    it('cumple OTI SIRA: incluye <CA>, <country>, <authorizationId> obligatorio, omite <centerContact> sin teléfono y soporta fase C', () => {
      const xml = siraService.generateDIXml({
        numero_documento: 'DI-OTI-001',
        fecha_documento: '2026-08-15',
        dcs_phase: 'C',
        cantidad_devuelta_kg: 300,
        fecha_confirmacion_devolucion: '2026-08-20',
        productor_cif: 'B12345678',
        productor_razon_social: 'Prod OTI',
        productor_nima: '4100000001',
        productor_provincia: 'Sevilla',
        productor_municipio: 'Sevilla',
        productor_codigo_postal: '41001',
        productor_email: 'solo-email@sin-telefono.es',
        gestor_cif: 'B87654321',
        gestor_razon_social: 'Gestor OTI',
        gestor_nima: '2800000002',
        gestor_numero_autorizacion: '13G01000000000123',
        gestor_provincia: 'Madrid',
        gestor_municipio: 'Madrid',
        gestor_codigo_postal: '28001',
        gestor_telefono: '+34 91 123 45 67 89 00',
        gestor_email: 'gestor@oti.es',
        transportista_cif: 'B55443322',
        transportista_razon_social: 'Trans OTI',
        transportista_nima: '4100000003',
        transportista_direccion: 'Avda Transporte 1',
        transportista_provincia: 'Sevilla',
        transportista_municipio: 'Sevilla',
        transportista_codigo_postal: '41002',
        codigo_ler: '15 01 01',
        peligrosidad: 'no-peligroso',
        operacion_tratamiento: 'R13',
        cantidad: 500,
      });

      expect(xml).toContain('<CA CACode="01"/>');
      expect(xml).toContain('<CA CACode="13"/>');
      expect(xml).toContain('<country countryCode="724"/>');
      expect(xml).toContain('<authorizationIdNumber>13G01000000000123</authorizationIdNumber>');
      expect(xml).toContain('<authorizationIdEffects>No disponible</authorizationIdEffects>');
      expect(xml).toContain('<phone></phone>');
      expect(xml).toContain('<mail>solo-email@sin-telefono.es</mail>');
      expect(xml).toContain('<phone>3491123456789</phone>');
      expect(xml).toContain('<mail>gestor@oti.es</mail>');
      expect(xml).toContain('DCSPhase="C"');
      expect(xml).toContain('<DCSReturnedConfirmationData>');
      expect(xml).toContain('<DCSReturnedQuantity>300.000</DCSReturnedQuantity>');
      expect(xml).toContain('<DCSReturnedConfirmationDate>2026-08-20</DCSReturnedConfirmationDate>');
    });
  });

  describe('parseSiraResponse y getSiraEndpointUrl (Contrato OTI)', () => {
    const prevWsUrl = process.env.SIRA_WS_URL;
    const prevSiraEnv = process.env.SIRA_ENV;

    afterEach(() => {
      if (prevWsUrl !== undefined) process.env.SIRA_WS_URL = prevWsUrl;
      else delete process.env.SIRA_WS_URL;
      if (prevSiraEnv !== undefined) process.env.SIRA_ENV = prevSiraEnv;
      else delete process.env.SIRA_ENV;
    });

    it('resuelve URL por defecto, por SIRA_ENV=esir y por SIRA_WS_URL', () => {
      delete process.env.SIRA_WS_URL;
      delete process.env.SIRA_ENV;
      expect(siraService.getSiraEndpointUrl()).toContain('juntadeandalucia.es');

      process.env.SIRA_ENV = 'esir';
      expect(siraService.getSiraEndpointUrl()).toContain('esir.miteco.gob.es');

      process.env.SIRA_WS_URL = 'https://custom-sira.test/ws';
      expect(siraService.getSiraEndpointUrl()).toBe('https://custom-sira.test/ws');
    });

    it('parsea correctamente <resultOK code="03"> oficial del Contrato OTI', () => {
      const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:esir="e3l://esir2014">
        <soapenv:Body>
          <esir:sendWasteDCSResponse>
            <return xmlns="http://ws.apache.org/ns/synapse">
              <result>
                <resultOK code="03" description="El mensaje se ha enviado correctamente">
                  <detailValue>El mensaje se ha enviado correctamente para ser procesado</detailValue>
                </resultOK>
              </result>
            </return>
          </esir:sendWasteDCSResponse>
        </soapenv:Body>
      </soapenv:Envelope>`;

      const parsed = siraService.parseSiraResponse(xml);
      expect(parsed.ok).toBe(true);
      expect(parsed.hasResultOK).toBe(true);
      expect(parsed.code).toBe('03');
      expect(parsed.siraId).toBe('SIRA-OK-03');
      expect(parsed.detailValue).toBe('El mensaje se ha enviado correctamente para ser procesado');
    });

    it('parsea <resultWarning>, <ns2:Fault> y respuestas vacías', () => {
      const warnXml = `<result><resultWarning code="02" description="Aviso menor"/></result>`;
      const parsedWarn = siraService.parseSiraResponse(warnXml);
      expect(parsedWarn.ok).toBe(true);
      expect(parsedWarn.hasResultWarning).toBe(true);
      expect(parsedWarn.warnings).toEqual(['02: Aviso menor']);

      const faultXml = `<S:Envelope><S:Body><ns2:Fault><faultstring>Error</faultstring></ns2:Fault></S:Body></S:Envelope>`;
      const parsedFault = siraService.parseSiraResponse(faultXml);
      expect(parsedFault.ok).toBe(false);
      expect(parsedFault.hasFault).toBe(true);

      expect(siraService.parseSiraResponse('').ok).toBe(false);
    });

    it('expone helpers getCACodeByProvince y buildAuthorizationIdXml', () => {
      expect(siraService.getCACodeByProvince('41')).toBe('01');
      expect(siraService.getCACodeByProvince('28')).toBe('13');
      expect(siraService.getCACodeByProvince('99')).toBe('01');
      expect(siraService.buildAuthorizationIdXml('AN-123')).toContain('<authorizationIdFree>AN-123</authorizationIdFree>');
      expect(siraService.buildAuthorizationIdXml('')).toContain('<authorizationIdEffects>No disponible</authorizationIdEffects>');
    });
  });

  describe('validateDIForE3L', () => {
    it('debe validar correctamente un DI completo sin notificación previa', () => {
      const res = siraService.validateDIForE3L({
        numero_documento: 'DI-115',
        productor_cif: 'B00000000',
        productor_nima: '1400000001',
        productor_municipio: 'Córdoba',
        gestor_cif: 'B11111111',
        gestor_nima: '1400000002',
        gestor_municipio: 'Lucena',
        transportista_cif: 'B22222222',
        transportista_razon_social: 'Transportes Demo',
        transportista_nima: '1400000003',
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R13',
        cantidad: 1.5,
        tipo_notificacion: 'sin-notificacion',
      });

      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.warnings).toHaveLength(0);
    });

    it('debe detectar errores obligatorios, NT faltante y advertencias E3L', () => {
      const res = siraService.validateDIForE3L({
        codigo_ler: 'BAD',
        operacion_tratamiento: 'ZZ',
        cantidad: 0,
        tipo_notificacion: 'con-notificacion-previa',
        numero_notificacion: 'NT123',
      });

      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThanOrEqual(6);
      expect(res.warnings.length).toBeGreaterThanOrEqual(4);
    });

    it('debe aceptar R14/R15/R1201 y exigir NT en residuos peligrosos (*), LER 20 03 01 y R01', () => {
      const baseDoc = {
        numero_documento: 'DI-300',
        productor_cif: 'B00000000',
        gestor_cif: 'B11111111',
        transportista_cif: 'B22222222',
        transportista_razon_social: 'Trans Test',
        codigo_ler: '17 04 05',
        operacion_tratamiento: 'R14',
        cantidad: 1,
        tipo_notificacion: 'sin-notificacion',
      };

      expect(siraService.validateDIForE3L(baseDoc).valid).toBe(true);
      expect(siraService.validateDIForE3L({ ...baseDoc, operacion_tratamiento: 'R1201' }).valid).toBe(true);

      const errDangerous = siraService.validateDIForE3L({ ...baseDoc, codigo_ler: '15 01 10*' });
      expect(errDangerous.valid).toBe(false);
      expect(errDangerous.errors.some((e) => e.includes('art. 3.2 del RD 553/2020'))).toBe(true);

      const err200301 = siraService.validateDIForE3L({ ...baseDoc, codigo_ler: '20 03 01' });
      expect(err200301.valid).toBe(false);

      const errR01 = siraService.validateDIForE3L({ ...baseDoc, operacion_tratamiento: 'R01' });
      expect(errR01.valid).toBe(false);
    });
  });

  describe('sendDI & retrySubmission', () => {
    it('debe enviar DI a la API interna y retornar resultado con éxito', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Transmisión SIRA procesada correctamente',
          siraId: 'SIRA-2025-9988',
        }),
      } as any);

      const res = await siraService.sendDI(123);

      expect(res.success).toBe(true);
      expect(res.siraId).toBe('SIRA-2025-9988');
      expect(global.fetch).toHaveBeenCalledWith('/api/residuos/sira/enviar-di', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: 123 }),
      });
    });

    it('debe lanzar error si el endpoint responde con estado no-ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Error de autenticación con el WSDL de SIRA',
        }),
      } as any);

      await expect(siraService.sendDI(456)).rejects.toThrow(
        'Error de autenticación con el WSDL de SIRA'
      );
    });

    it('retrySubmission debe delegar en sendDI', async () => {
      jest.spyOn(siraService, 'sendDI').mockResolvedValue({
        success: true,
        message: 'Reintento exitoso',
        siraId: 'SIRA-RETRY-1',
      });

      const res = await siraService.retrySubmission(789);
      expect(res.siraId).toBe('SIRA-RETRY-1');
      expect(siraService.sendDI).toHaveBeenCalledWith(789);
    });
  });

  describe('getSubmissionsForDI & getAllSubmissions', () => {
    it('getSubmissionsForDI debe consultar envíos ordenados por fecha', async () => {
      const mockSubmissions = [
        { id: 1, identification_document_id: 10, estado: 'completado', sira_id: 'S-01' },
      ];

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockSubmissions, error: null }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await siraService.getSubmissionsForDI(10);
      expect(res).toEqual(mockSubmissions);
      expect(chain.eq).toHaveBeenCalledWith('identification_document_id', 10);
    });

    it('getSubmissionsForDI debe retornar array vacío si ocurre error en la consulta', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('Query error') }),
      };
      mockSupabase.from.mockReturnValue(chain);

      const res = await siraService.getSubmissionsForDI(99);
      expect(res).toEqual([]);
    });

    it('getAllSubmissions debe consultar transmisiones con limit y status', async () => {
      const mockAll = [
        { id: 1, estado: 'pendiente' },
        { id: 2, estado: 'pendiente' },
      ];

      const chain: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      chain.then = (resolve: any) => Promise.resolve({ data: mockAll, error: null }).then(resolve);

      mockSupabase.from.mockReturnValue(chain);

      const res = await siraService.getAllSubmissions({ limit: 10, status: 'pendiente' });

      expect(chain.limit).toHaveBeenCalledWith(10);
      expect(chain.eq).toHaveBeenCalledWith('estado', 'pendiente');
      expect(res).toEqual(mockAll);
    });

    it('getAllSubmissions debe retornar array vacío si falla', async () => {
      const chain: any = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };
      chain.then = (resolve: any) => Promise.resolve({ data: null, error: new Error('Error general') }).then(resolve);
      mockSupabase.from.mockReturnValue(chain);

      const res = await siraService.getAllSubmissions();
      expect(res).toEqual([]);
    });
  });

  describe('extractSiraError', () => {
    it('debe extraer el error de resultWrong con atributos code y description', () => {
      const xml = `<?xml version='1.0' encoding='UTF-8'?>
        <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
          <SOAP-ENV:Body>
            <ns3:sendWasteDCSResponse xmlns:ns3="e3l://esir2014">
              <return>
                <result>
                  <resultWrong>
                    <resultErrorList>
                      <resultWrong code="JA000018" description="Error al autenticarse a través de SOAP"/>
                    </resultErrorList>
                  </resultWrong>
                </result>
              </return>
            </ns3:sendWasteDCSResponse>
          </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>`;

      const result = siraService.extractSiraError(xml);
      expect(result).toBe('JA000018: Error al autenticarse a través de SOAP');
    });

    it('debe extraer múltiples errores de resultWrong si están presentes', () => {
      const xml = `<resultErrorList>
        <resultWrong code="JA000018" description="Error al autenticarse"/>
        <resultWrong code="JA000026" description="Mensaje inválido"/>
      </resultErrorList>`;

      const result = siraService.extractSiraError(xml);
      expect(result).toBe('JA000018: Error al autenticarse | JA000026: Mensaje inválido');
    });

    it('debe extraer el error si solo tiene atributo description sin code', () => {
      const xml = `<resultWrong description="Operación no permitida"/>`;
      const result = siraService.extractSiraError(xml);
      expect(result).toBe('Operación no permitida');
    });

    it('debe extraer descripción genérica si está en otro nodo con atributo description', () => {
      const xml = `<customError description="Fallo en pasarela intermedia"/>`;
      const result = siraService.extractSiraError(xml);
      expect(result).toBe('Fallo en pasarela intermedia');
    });

    it('debe extraer error de elemento <description>', () => {
      const xml = `<response><description>Error de formato</description></response>`;
      const result = siraService.extractSiraError(xml);
      expect(result).toBe('Error de formato');
    });

    it('debe extraer error de <faultstring>', () => {
      const xml = `<SOAP-ENV:Fault><faultstring>Internal Service Error</faultstring></SOAP-ENV:Fault>`;
      const result = siraService.extractSiraError(xml);
      expect(result).toBe('Internal Service Error');
    });

    it('debe extraer primera línea de <message> si está presente', () => {
      const xml = `<SOAP-ENV:Fault><message>cvc-enumeration-valid: Value 'R1' is not valid.\nSecond line</message></SOAP-ENV:Fault>`;
      const result = siraService.extractSiraError(xml);
      expect(result).toBe("cvc-enumeration-valid: Value 'R1' is not valid.");
    });

    it('debe devolver fallback para XMLs sin errores reconocibles o respuestas vacías', () => {
      expect(siraService.extractSiraError('')).toBe('Respuesta vacía o inválida del servidor SIRA.');
      expect(siraService.extractSiraError(null as any)).toBe('Respuesta vacía o inválida del servidor SIRA.');
      expect(siraService.extractSiraError('<otherTag>Contenido</otherTag>')).toBe('Error en la validación de SIRA. Ver logs XML.');
    });
  });

  describe('generateE3LMessage', () => {
    it('debe envolver el documento en el esquema E3L 3.6 completo con cabecera y cuerpo', () => {
      const mockDoc = {
        id: 1,
        numero_documento: 'DI-2026-00001',
        tipo_notificacion: 'con-notificacion-previa',
        numero_notificacion: 'NT-2026-0001',
        codigo_ler: '15 01 01',
        descripcion_residuo: 'Envases de papel y cartón',
        cantidad: 1500,
        unidad: 'kg',
        operacion_tratamiento: 'R03',
        productor_razon_social: 'Productor Test SL',
        productor_cif: 'B12345678',
        productor_nima: '1234567890',
        gestor_razon_social: 'Gestor Test SL',
        gestor_cif: 'A87654321',
        gestor_nima: '0987654321',
        transportista_razon_social: 'Trans Test SL',
        transportista_cif: 'B99887766',
        transportista_nima: '1122334455',
        fecha_documento: '2026-11-13',
      } as any;

      const xml = siraService.generateE3LMessage(mockDoc);

      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<e3l');
      expect(xml).toContain('version="3.6"');
      expect(xml).toContain('<header>');
      expect(xml).toContain('<sender>');
      expect(xml).toContain('<recipient>');
      expect(xml).toContain('<waste>');
      expect(xml).toContain('<wasteDCS');
      expect(xml).toContain('</waste>');
      expect(xml).toContain('</e3l>');
    });

    it('debe convertir toneladas o m3 a kg en DCSClearWeight cuando no hay peso de báscula', () => {
      const mockDocTonnes = {
        id: 2,
        numero_documento: 'DI-2026-00002',
        codigo_ler: '15 01 01',
        descripcion_residuo: 'Envases',
        cantidad: 2.5,
        unidad: 'toneladas',
        operacion_tratamiento: 'R03',
      } as any;

      const xml = siraService.generateE3LMessage(mockDocTonnes);
      expect(xml).toContain('<DCSClearWeight>2500.000</DCSClearWeight>');
    });
  });

  describe('downloadXmlFile', () => {
    it('debe crear enlace y disparar descarga del archivo XML', () => {
      expect(() =>
        siraService.downloadXmlFile('<wasteDCS>Test XML</wasteDCS>', 'documento.xml')
      ).not.toThrow();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });
  });
});
