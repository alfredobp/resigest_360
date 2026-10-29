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

      expect(xml).toContain('DCSCode="DI-2025-0001"');
      expect(xml).toContain('DCSStartDate="2025-05-15"');
      expect(xml).toContain('<reasonName>Productor Químico S.A.</reasonName>');
      expect(xml).toContain('<nationalId>A87654321</nationalId>');
      expect(xml).toContain('<nationalId>B99887766</nationalId>');
      expect(xml).toContain('LERCode="150110"');
      expect(xml).toContain('<table5>HP4</table5>');
      expect(xml).toContain('<DCSNT>NT99999999999999999999999</DCSNT>');
      expect(xml).toContain('<DCSClearWeight>1.500</DCSClearWeight>');
    });

    it('debe generar XML con valores por defecto si faltan datos en el documento', () => {
      const minDoc = {
        numero_documento: 'DI-MIN-001',
        codigo_ler: '20 01 01',
        peligrosidad: 'no-peligroso',
        cantidad: 0.8,
      };

      const xml = siraService.generateDIXml(minDoc);

      expect(xml).toContain('DCSCode="DI-MIN-001"');
      expect(xml).toContain('LERCode="200101"');
      expect(xml).toContain('xsi:type="wassup:noDangerousResidueType"');
      expect(xml).toContain('<nationalId>A00000000</nationalId>'); // Dummy transportista CIF
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
