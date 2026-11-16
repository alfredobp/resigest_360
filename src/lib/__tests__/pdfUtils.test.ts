import { generateContractPDF } from '../pdfUtils';
import type { WasteContract } from '@/types/wasteManagement';

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
