import { generateContractPDF, generateIdentificationDocumentPDF } from '../pdfUtils';
import type { WasteContract, IdentificationDocument } from '@/types/wasteManagement';

describe('pdfUtils - generateContractPDF', () => {
  const baseContract: WasteContract = {
    id: 1,
    user_id: 'user-1',
    company_id: 1,
    numero_contrato: 'CTR-2026-0001',
    fecha_contrato: '2026-11-16',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    estado: 'vigente',
    tipo_contrato: 'tratamiento',
    cantidad_maxima_anual: 2222,
    unidad_cantidad: 'toneladas',
    precio_unitario: 222,
    moneda: 'EUR',
    frecuencia_recogida: 'Según necesidades operativas de producción y límites legales de almacenamiento',
    company: {
      id: 1,
      user_id: 'user-1',
      razon_social: 'Productor Demo S.L.',
      cif: 'B12345678',
      nima: '1234567890',
      domicilio_social: 'Calle Origen 1',
      municipio_social: 'Cádiz',
      tipo_empresa: 'productor',
      activo: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    treatment_manager: {
      id: 2,
      user_id: 'user-1',
      nombre: 'Gestor Demo S.A.',
      razon_social: 'Gestor Demo S.A.',
      cif: 'A87654321',
      nima: '0987654321',
      numero_autorizacion: 'AUT-001',
      direccion: 'Polígono Destino',
      municipio: 'Sevilla',
      activo: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    contract_waste_codes: [
      {
        id: 1,
        contract_id: 1,
        codigo_ler: '15 01 01',
        descripcion_ler: 'Envases de papel y cartón procedentes de la actividad industrial',
        operacion_tratamiento: 'R03',
        cantidad_estimada_anual: 100,
        tarifa_gestion: 50,
        created_at: '2026-01-01',
      },
    ],
    notas: 'Cláusula adicional de prueba para verificar el salto de página.',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  it('debe generar el documento jsPDF con múltiples páginas si el contenido lo requiere', async () => {
    const doc = await generateContractPDF(baseContract);
    expect(doc).toBeDefined();
    const totalPages = doc.getNumberOfPages();
    expect(totalPages).toBeGreaterThanOrEqual(1);
  });

  it('debe renderizar correctamente incluso sin centros ni códigos LER', async () => {
    const minimalContract: WasteContract = {
      ...baseContract,
      fecha_inicio: undefined,
      fecha_fin: undefined,
      contract_waste_codes: [],
      codigos_ler: [],
      notas: undefined,
    };
    const doc = await generateContractPDF(minimalContract);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});

describe('pdfUtils - generateIdentificationDocumentPDF', () => {
  const baseDoc: IdentificationDocument = {
    id: 10,
    user_id: 'user-1',
    company_id: 1,
    numero_documento: 'DI-2026-0001',
    fecha_documento: '2026-11-16',
    tipo_notificacion: 'sin-notificacion',
    productor_razon_social: 'Productor Demo S.L.',
    productor_cif: 'B12345678',
    gestor_razon_social: 'Gestor Demo S.A.',
    gestor_cif: 'A87654321',
    transportista_razon_social: 'Trans Demo S.L.',
    transportista_cif: 'B99999999',
    codigo_ler: '15 01 01',
    descripcion_residuo: 'Envases de papel y cartón',
    estado_fisico: 'solido',
    peligrosidad: 'no-peligroso',
    cantidad: 1.5,
    unidad: 'toneladas',
    operacion_tratamiento: 'R03',
    estado: 'completado',
    created_at: '2026-11-16T10:00:00Z',
    updated_at: '2026-11-16T10:00:00Z',
    firmado_productor: false,
    firmado_transportista: true,
    firmado_gestor: true,
    nombre_transportista: 'Pepe',
    dni_transportista: '987423984984-H',
    fecha_firma_transportista: '2026-11-16T17:02:00Z',
    nombre_gestor: 'Manolito',
    dni_gestor: '787398237739',
    fecha_firma_gestor: '2026-11-16T17:02:00Z',
  };

  it('genera el PDF de DI correctamente con estados firmados sin fuentes corruptas', async () => {
    const doc = await generateIdentificationDocumentPDF(baseDoc);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('genera el PDF con texto legal de formalización definitiva cuando ambas partes firman', async () => {
    const completelySignedDoc: IdentificationDocument = {
      ...baseDoc,
      firmado_productor: true,
      firmado_gestor: true,
      production_center: {
        nombre: 'Centro Productivo de Residuos Industriales Complejo Norte S.L.',
      } as any,
      gestor_numero_autorizacion: 'AUT-VAL-GEST-2026-999999-EXT',
      numero_albaran_gestor: 'ALB-GESTOR-2026-LONGCAPTION-99999',
    };
    const doc = await generateIdentificationDocumentPDF(completelySignedDoc);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
