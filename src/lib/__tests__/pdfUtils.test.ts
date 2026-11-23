import {
  generateContractPDF,
  generateIdentificationDocumentPDF,
  generateMemoriaAnualPDF,
  generateCommercialOperationPDF,
  generateDecaPDF,
} from '../pdfUtils';
import { resolveStatusBadgeTone } from '../pdf/pdfTheme';
import {
  formatSafeDate,
  formatSafeDateTime,
  toPdfInfoDateString,
  loadImageAsBase64,
  fitText,
} from '../pdf/pdfComponents';
import jsPDF from 'jspdf';
import type {
  WasteContract,
  WasteContractRevision,
  IdentificationDocument,
  MemoriaAnual,
  CommercialOperation,
} from '@/types/wasteManagement';
import type { DecaDocument } from '@/types/deca';

describe('pdfTheme & pdfComponents helpers', () => {
  it('resuelve correctamente todos los tonos semánticos de badges', () => {
    expect(resolveStatusBadgeTone('vigente')).toBe('success');
    expect(resolveStatusBadgeTone('aceptado')).toBe('success');
    expect(resolveStatusBadgeTone('rechazado')).toBe('danger');
    expect(resolveStatusBadgeTone('peligroso')).toBe('danger');
    expect(resolveStatusBadgeTone('borrador')).toBe('warning');
    expect(resolveStatusBadgeTone('pendiente_firma')).toBe('warning');
    expect(resolveStatusBadgeTone('en_transito')).toBe('info');
    expect(resolveStatusBadgeTone('otro_estado')).toBe('neutral');
    expect(resolveStatusBadgeTone(undefined)).toBe('neutral');
  });

  it('formatea fechas, horas y trunca texto de forma segura', () => {
    expect(formatSafeDate(undefined)).toBe('No especificada');
    expect(formatSafeDate('invalid-date')).toBe('Fecha no disponible');
    expect(formatSafeDate('2026-11-16')).toContain('2026');
    expect(formatSafeDate('2026-11-16T10:30:00Z')).toContain('2026');

    expect(formatSafeDateTime(undefined)).toBe('');
    expect(formatSafeDateTime('invalid-date')).toBe('');
    expect(formatSafeDateTime('2026-11-16')).toContain('2026');
    expect(formatSafeDateTime('2026-11-16T10:30:00Z')).toContain('2026');

    expect(toPdfInfoDateString('2026-11-16T10:30:00Z')).toBe("D:20261116103000+00'00'");
    expect(toPdfInfoDateString('invalid')).toBe("D:20260101000000+00'00'");

    const doc = new jsPDF();
    expect(fitText(doc, '', 30)).toBe('-');
    expect(fitText(doc, 'Corto', 50)).toBe('Corto');
    const longFitted = fitText(doc, 'Texto extremadamente largo para comprobar truncado limpio en mm', 20);
    expect(longFitted.endsWith('...')).toBe(true);
  });

  it('loadImageAsBase64 devuelve dataURL directamente y maneja entornos con y sin FileReader', async () => {
    expect(await loadImageAsBase64('')).toBeNull();
    expect(await loadImageAsBase64(null)).toBeNull();
    expect(await loadImageAsBase64('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(await loadImageAsBase64('https://example.com/sig.png')).toBeNull();

    const originalFetch = global.fetch;
    const originalFileReader = global.FileReader;
    try {
      class MockFileReader {
        result: string | ArrayBuffer | null = 'data:image/png;base64,MOCKED';
        onloadend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        readAsDataURL() {
          this.onloadend?.();
        }
      }
      global.FileReader = MockFileReader as unknown as typeof FileReader;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({}),
      }) as unknown as typeof fetch;
      expect(await loadImageAsBase64('https://example.com/ok.png')).toBe('data:image/png;base64,MOCKED');

      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
      expect(await loadImageAsBase64('https://example.com/404.png')).toBeNull();

      global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
      expect(await loadImageAsBase64('https://example.com/err.png')).toBeNull();
    } finally {
      global.fetch = originalFetch;
      global.FileReader = originalFileReader;
    }
  });
});

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
    descripcion_residuos: 'Separación en origen en contenedores homologados y etiquetados.',
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
    producer_center: {
      id: 10,
      company_id: 1,
      user_id: 'user-1',
      nombre: 'Planta Norte',
      direccion: 'Pol. Industrial Norte 1',
      nima: '1234567890',
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
    gestor_center: {
      id: 20,
      company_id: 2,
      user_id: 'user-1',
      nombre: 'Instalación Sevilla Sur',
      direccion: 'Pol. Sur 8',
      nima: '0987654321',
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
      {
        id: 2,
        contract_id: 1,
        codigo_ler: '13 02 08*',
        descripcion_ler: 'Otros aceites de motor, de transmisión mecánica y lubricantes',
        operacion_tratamiento: 'R09',
        cantidad_estimada_anual: 15,
        tarifa_gestion: 185,
        created_at: '2026-01-01',
      },
    ],
    notas: 'Cláusula adicional de prueba para verificar el salto de página.',
    firmado_productor: true,
    fecha_firma_productor: '2026-11-16T10:00:00Z',
    firmado_gestor: true,
    fecha_firma_gestor: '2026-11-16T11:00:00Z',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  it('genera el contrato completo con tabla LER, peligrosos, notas y firmas', async () => {
    const doc = await generateContractPDF(baseContract);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const out = doc.output();
    expect(out).toContain('CTR-2026-0001');
  });

  it('renderiza correctamente con muchos códigos LER forzando salto de página y repetición de cabecera', async () => {
    const manyCodes = Array.from({ length: 28 }, (_, idx) => ({
      id: idx + 1,
      contract_id: 1,
      codigo_ler: idx % 3 === 0 ? `13 02 0${idx % 9}*` : `15 01 0${idx % 9}`,
      descripcion_ler: `Residuo industrial de prueba número ${idx + 1} con descripción extensa para validar wrapping multilínea`,
      operacion_tratamiento: 'R03',
      cantidad_estimada_anual: 10 + idx,
      tarifa_gestion: 40 + idx,
      created_at: '2026-01-01',
    }));

    const doc = await generateContractPDF({ ...baseContract, contract_waste_codes: manyCodes });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('renderiza correctamente con codigos_ler simples y sin empresas/centros', async () => {
    const simpleContract: WasteContract = {
      ...baseContract,
      company: undefined,
      producer_center: undefined,
      treatment_manager: undefined,
      gestor_company: undefined,
      gestor_center: undefined,
      fecha_inicio: undefined,
      fecha_fin: undefined,
      contract_waste_codes: [],
      codigos_ler: ['15 01 01', '13 02 08*'],
      operaciones_tratamiento: ['R03', 'R09'],
      notas: undefined,
    };
    const doc = await generateContractPDF(simpleContract);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('renderiza correctamente sin centros ni códigos LER', async () => {
    const minimalContract: WasteContract = {
      ...baseContract,
      fecha_inicio: undefined,
      fecha_fin: undefined,
      contract_waste_codes: [],
      codigos_ler: [],
      notas: undefined,
      descripcion_residuos: undefined,
      precio_unitario: undefined,
      cantidad_maxima_anual: undefined,
    };
    const doc = await generateContractPDF(minimalContract);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('prioriza metadata_snapshot y reconstruye archivedRevision (RES6-I02)', async () => {
    const contractWithSnapshot: WasteContract = {
      ...baseContract,
      company: { ...baseContract.company!, razon_social: 'Nombre Modificado Posterior', nima: '' },
      metadata_snapshot: {
        version: 1,
        snapshot_date: '2026-11-20T12:00:00Z',
        company: {
          razon_social: 'Productor Original Congelado S.L.',
          cif: 'B12345678',
          nima: '1234567890',
          domicilio_social: 'Calle Inmutable 1',
        },
        gestor_company: {
          razon_social: 'Gestor Original Congelado S.A.',
          cif: 'A87654321',
          nima: '0987654321',
          numero_autorizacion: 'AUT-CONGELADA-01',
        },
      },
    };

    const archived: WasteContractRevision = {
      version: 1,
      archived_at: '2026-11-21T00:00:00Z',
      changed_fields: ['cantidad_maxima_anual'],
      cantidad_maxima_anual: 100,
      firmado_productor: true,
      fecha_firma_productor: '2026-11-20T12:00:00Z',
      firmado_gestor: true,
      fecha_firma_gestor: '2026-11-20T12:05:00Z',
      metadata_snapshot: contractWithSnapshot.metadata_snapshot,
    };

    const doc = await generateContractPDF(contractWithSnapshot, archived);
    const out = doc.output();
    expect(out).toContain('Productor Original Congelado S.L.');
    expect(out).not.toContain('Nombre Modificado Posterior');
  });

  it('indica en borrador texto provisional y marca de agua BORRADOR (RES6-I07)', async () => {
    const draftContract: WasteContract = {
      ...baseContract,
      estado: 'borrador',
      firmado_productor: false,
      firmado_gestor: false,
      firma_productor_url: undefined,
      firma_gestor_url: undefined,
      fecha_firma_productor: undefined,
      fecha_firma_gestor: undefined,
    };
    const doc = await generateContractPDF(draftContract);
    expect(doc.output()).toContain('BORRADOR');
  });
});

describe('pdfUtils - generateIdentificationDocumentPDF', () => {
  const baseDoc: IdentificationDocument = {
    id: 10,
    user_id: 'user-1',
    company_id: 1,
    contract_id: 5,
    numero_documento: 'DI-2026-0001',
    fecha_documento: '2026-11-16',
    tipo_notificacion: 'con-notificacion-previa',
    numero_notificacion: 'NT2026410089',
    operador_tipo: 'negociante',
    operador_razon_social: 'Negociante Ambiental S.L.',
    operador_cif: 'B77889900',
    operador_nima: '4100011223',
    productor_razon_social: 'Productor Demo S.L.',
    productor_cif: 'B12345678',
    productor_nima: '1100045821',
    productor_direccion: 'Pol. Tres Caminos 14',
    productor_municipio: 'Puerto Real',
    productor_provincia: 'Cádiz',
    gestor_razon_social: 'Gestor Demo S.A.',
    gestor_cif: 'A87654321',
    gestor_nima: '4100098123',
    gestor_numero_autorizacion: 'AUT-VAL-GEST-2026-999999-EXT',
    gestor_direccion: 'Pol. La Isla 8',
    gestor_municipio: 'Dos Hermanas',
    gestor_provincia: 'Sevilla',
    transportista_razon_social: 'Trans Demo S.L.',
    transportista_cif: 'B99999999',
    transportista_nima: '410003321',
    transportista_matricula: '4829 LMK',
    fecha_salida: '2026-11-16T08:30:00Z',
    codigo_ler: '13 02 08*',
    descripcion_residuo: 'Aceites de motor usados',
    estado_fisico: 'liquido',
    peligrosidad: 'peligroso',
    cantidad: 1.5,
    unidad: 'toneladas',
    numero_envases: 4,
    tipo_envases: 'GRG',
    operacion_tratamiento: 'R09',
    operacion_tratamiento_ejecutada: 'R09',
    peso_origen_kg: 1500,
    peso_destino_kg: 1460,
    diferencia_peso_kg: -40,
    porcentaje_discrepancia: -2.67,
    numero_albaran_gestor: 'ALB-2026-999',
    fecha_llegada_destino: '2026-11-16T11:45:00Z',
    resultado_recepcion: 'aceptado',
    estado: 'completado',
    estado_traslado: 'aceptado',
    created_at: '2026-11-16T10:00:00Z',
    updated_at: '2026-11-16T12:00:00Z',
    firmado_productor: true,
    nombre_productor: 'Carlos Ruiz',
    dni_productor: '31445566-K',
    fecha_firma_productor: '2026-11-16T08:25:00Z',
    firmado_transportista: true,
    nombre_transportista: 'Pepe',
    dni_transportista: '987423984984-H',
    fecha_firma_transportista: '2026-11-16T08:30:00Z',
    firmado_gestor: true,
    nombre_gestor: 'Manolito',
    dni_gestor: '787398237739',
    fecha_firma_gestor: '2026-11-16T11:50:00Z',
  };

  it('genera el PDF de DI completo con operador, NT, residuo peligroso, pesaje y firmas', async () => {
    const doc = await generateIdentificationDocumentPDF({
      ...baseDoc,
      production_center: { nombre: 'Centro Productivo Norte Complejo Industrial' } as IdentificationDocument['production_center'],
    });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.output()).toContain('DI-2026-0001');
  });

  it('renderiza incidencias y justificación de discrepancia de báscula', async () => {
    const docWithAlerts: IdentificationDocument = {
      ...baseDoc,
      tipo_notificacion: 'sin-notificacion',
      numero_notificacion: undefined,
      operador_razon_social: undefined,
      codigo_ler: '15 01 01',
      peligrosidad: 'no-peligroso',
      motivo_incidencia: 'Presencia de impropios plásticos superiores al 5%.',
      tipo_incidencia: 'impropios',
      causa_discrepancia: 'merma_humedad',
      justificacion_discrepancia: 'Pérdida por escurrido durante el transporte de 3 horas.',
      justificacion_discrepancia_by_nombre: 'Laura Gómez',
      justificacion_discrepancia_at: '2026-11-16T12:15:00Z',
      firmado_productor: false,
    };
    const doc = await generateIdentificationDocumentPDF(docWithAlerts);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('incluye marca de agua BORRADOR y texto legal provisional cuando el DI está en borrador (UXDEV-12)', async () => {
    const draftDoc: IdentificationDocument = {
      ...baseDoc,
      estado: 'borrador',
      estado_traslado: 'borrador',
      firmado_productor: false,
      firmado_transportista: false,
      firmado_gestor: false,
      peso_origen_kg: undefined,
      peso_destino_kg: undefined,
      diferencia_peso_kg: undefined,
    };
    const doc = await generateIdentificationDocumentPDF(draftDoc);
    expect(doc.output()).toContain('BORRADOR');
  });

  it('renderiza DI mínimo sin campos opcionales y con firmas dataURL embebidas', async () => {
    const minimalSigned: IdentificationDocument = {
      id: 11,
      user_id: 'user-1',
      company_id: 1,
      numero_documento: '',
      fecha_documento: '',
      tipo_notificacion: 'sin-notificacion',
      productor_razon_social: '',
      productor_cif: '',
      gestor_razon_social: '',
      gestor_cif: '',
      codigo_ler: '',
      descripcion_residuo: '',
      estado_fisico: 'solido',
      peligrosidad: 'no-peligroso',
      cantidad: 500,
      unidad: 'kg',
      estado: 'pendiente-firma',
      estado_traslado: 'en_transito',
      diferencia_peso_kg: 15,
      porcentaje_discrepancia: 3,
      justificacion_discrepancia: 'Ajuste de báscula sin causa tipificada',
      causa_discrepancia: null,
      firmado_productor: true,
      firma_productor_url: 'data:image/png;base64,invalid_but_handled',
      firmado_transportista: true,
      firma_transportista_url: 'data:image/png;base64,invalid_but_handled',
      firmado_gestor: true,
      firma_gestor_url: 'data:image/png;base64,invalid_but_handled',
      created_at: '',
      updated_at: '',
    };
    const doc = await generateIdentificationDocumentPDF(minimalSigned);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('INC01/INC03/INC08/INC13: nunca declara PAdES sin firma criptográfica, elimina borrador si aceptado, no inventa contrato Asociado y conserva identificadores completos', async () => {
    const auditDi: IdentificationDocument = {
      ...baseDoc,
      contract_id: undefined,
      contrato_externo_referencia: undefined,
      numero_documento: 'DI-2026-4100000004-000162',
      numero_albaran_gestor: 'REC162-ALBARAN-COMPLETO',
      productor_razon_social: 'Productor Industrial de Prueba Sexta Auditoría Sociedad Limitada',
      estado: 'borrador', // campo legacy desactualizado
      estado_traslado: 'aceptado',
      firmado_productor: true,
      firma_productor_url: undefined,
      firmado_transportista: true,
      firma_transportista_url: undefined,
      firmado_gestor: true,
      firma_gestor_url: undefined,
    };
    const doc = await generateIdentificationDocumentPDF(auditDi);
    const out = doc.output();

    // INC01: Nunca declarar PAdES sin firma criptográfica
    expect(out).not.toContain('Firmado digitalmente (PAdES)');
    expect(out).toContain('Conformidad interna en carga');
    // INC03: Aceptado no puede llevar marca BORRADOR - NO OFICIAL
    expect(out).not.toContain('BORRADOR - NO OFICIAL');
    // INC13: Sin contrato nunca dice "Asociado"
    expect(out).toContain('Sin contrato');
    // INC08: Identificadores completos sin truncado con elipsis
    expect(out).toContain('DI-2026-4100000004-000162');
    expect(out).toContain('REC162-ALBARAN-CO');
    expect(out).toContain('MPLETO');
    expect(out).not.toContain('REC162...');
    // INC05: Metadatos /CreationDate y /ModDate presentes en /Info
    expect(out).toContain('/CreationDate');
    expect(out).toContain('/ModDate (D:20261116120000+00\'00\')');
  });
});

describe('pdfUtils - generateMemoriaAnualPDF', () => {
  const baseMemoria: MemoriaAnual = {
    id: 1,
    user_id: 'user-1',
    company_id: 1,
    año: 2026,
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    documentos_identificacion_ids: [10],
    tipo_memoria: 'productor',
    numero_memoria: 'MEM-2026-0001',
    nombre_empresa: 'Productor Demo S.L.',
    nif_empresa: 'B12345678',
    nombre_centro: 'Planta Cádiz',
    nima: '1100045821',
    municipio_centro: 'Puerto Real',
    estado: 'presentada',
    total_movimientos: 12,
    total_toneladas: 45.75,
    resumen_ler: [
      { codigo_ler: '15 01 01', descripcion: 'Envases de papel y cartón', numero_movimientos: 8, cantidad_total: 30.5 },
      { codigo_ler: '13 02 08*', descripcion: 'Aceites lubricantes usados', numero_movimientos: 4, cantidad_total: 15.25 },
    ],
    created_at: '2026-12-31T10:00:00Z',
    updated_at: '2026-12-31T10:00:00Z',
  };

  it('genera el PDF de Memoria Anual con tabla LER y fila de totales (y desglose por destino R/D INC16)', async () => {
    const doc = await generateMemoriaAnualPDF(baseMemoria, {
      movimientos: [
        {
          numero_di: 'DI-2026-0001',
          codigo_ler: '15 01 01',
          operacion_tratamiento: 'R03',
          gestor_nombre: 'Gestor Demo S.A.',
          gestor_nima: '4100098123',
          cantidad_toneladas: 1.25,
        },
      ],
    });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const out = doc.output();
    expect(out).toContain('MEM-2026-0001');
    expect(out).toContain('DECLARACIÓN PRESENTADA');
    expect(out).toContain('4100098123');
  });

  it('genera Memoria Anual vacía en borrador y con campos opcionales ausentes', async () => {
    const doc = await generateMemoriaAnualPDF({
      ...baseMemoria,
      numero_memoria: '',
      nombre_empresa: '',
      nif_empresa: '',
      nombre_centro: '',
      nima: '',
      municipio_centro: '',
      estado: 'borrador',
      resumen_ler: undefined as unknown as MemoriaAnual['resumen_ler'],
      total_movimientos: 0,
      total_toneladas: 0,
      created_at: '',
      updated_at: '',
    });
    expect(doc.output()).toContain('BORRADOR');
  });

  it('genera Memoria Anual con ítem sin descripción ni cantidad', async () => {
    const doc = await generateMemoriaAnualPDF({
      ...baseMemoria,
      estado: undefined as unknown as MemoriaAnual['estado'],
      resumen_ler: [{ codigo_ler: '20 03 01', descripcion: '', numero_movimientos: 1, cantidad_total: 0 }],
    });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});

describe('pdfUtils - generateCommercialOperationPDF', () => {
  const baseOp: CommercialOperation = {
    id: 7,
    user_id: 'user-1',
    company_id: 1,
    numero_operacion: 'OP-2026-0007',
    fecha: '2026-11-16',
    estado: 'liquidada',
    codigo_ler: '17 04 05',
    descripcion_residuo: 'Hierro y acero',
    peligrosidad: 'no-peligroso',
    cantidad_estimada_t: 20,
    cantidad_real_t: 19.8,
    origen_nombre_personalizado: 'Metalúrgica Origen S.L.',
    destino_nombre_personalizado: 'Acería Destino S.A.',
    transportista_nombre_personalizado: 'Transportes Sur S.L.',
    transportista_matricula: '1234 BCD',
    identification_document_id: 10,
    cliente_razon_social: 'Acería Destino S.A.',
    proveedor_razon_social: 'Metalúrgica Origen S.L.',
    tipo_precio_compra: 'por_tonelada',
    precio_unitario_compra: 120,
    coste_compra_total: 2376,
    estado_pago_compra: 'pagado',
    tipo_precio_venta: 'por_tonelada',
    precio_unitario_venta: 180,
    ingreso_venta_total: 3564,
    estado_cobro_venta: 'cobrado',
    coste_transporte: 350,
    otros_costes: 75,
    descripcion_otros_costes: 'Tasa de báscula',
    margen_bruto_total: 763,
    margen_unitario_tonelada: 38.54,
    porcentaje_margen: 21.4,
    observaciones: 'Liquidación definitiva conforme a pesaje en báscula calibrada.',
    created_at: '2026-11-16T10:00:00Z',
    updated_at: '2026-11-16T14:00:00Z',
  };

  it('genera liquidación cerrada con tabla financiera y observaciones', async () => {
    const doc = await generateCommercialOperationPDF(baseOp);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.output()).toContain('OP-2026-0007');
  });

  it('genera liquidación provisional/borrador con aviso NO ES FACTURA y margen negativo', async () => {
    const doc = await generateCommercialOperationPDF({
      ...baseOp,
      estado: 'borrador',
      cantidad_real_t: undefined,
      identification_document_id: undefined,
      otros_costes: 0,
      margen_bruto_total: -150,
      observaciones: undefined,
    });
    const out = doc.output();
    expect(out).toContain('PROVISIONAL');
    expect(out).toContain('NO ES FACTURA');
  });
});

describe('pdfUtils - generateDecaPDF', () => {
  const baseDeca: DecaDocument = {
    id: 5,
    token: 'dummy-token',
    user_id: 'user-1',
    company_id: 1,
    numero_deca: 'DECA-2026-00001',
    version: 2,
    is_vigente: true,
    estado: 'vigente',
    fecha_transporte: '2026-11-20',
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T12:00:00Z',
    cargador_razon_social: 'Productor Test S.L.',
    cargador_nif: 'B12345678',
    cargador_domicilio: 'Calle Origen 1',
    cargador_codigo_postal: '41001',
    cargador_municipio: 'Sevilla',
    cargador_provincia: 'Sevilla',
    transportista_razon_social: 'Transportes Rápidos S.L.',
    transportista_nif: 'B99887766',
    transportista_autorizacion: 'MDPE-1234',
    transportista_domicilio: 'Av. Transporte 5',
    transportista_municipio: 'Sevilla',
    origen_direccion: 'Calle Origen 1',
    origen_municipio: 'Sevilla',
    origen_provincia: 'Sevilla',
    origen_nima: '4100012345',
    destino_direccion: 'Polígono Destino',
    destino_municipio: 'Málaga',
    destino_provincia: 'Málaga',
    destino_nima: '2900054321',
    naturaleza_mercancia: 'Residuos de papel y cartón',
    peso_kg: 8000,
    codigo_ler: '15 01 01',
    descripcion_ler: 'Papel y cartón',
    numero_di: 'DI-2026-0001',
    numero_nt: 'NT-2026-001',
    matricula_tractora: '4829 LMK',
    matricula_remolque: 'R-9921 BBC',
    conductor_nombre: 'Juan Pérez',
    conductor_dni: '28112233-A',
    hora_salida: '08:00',
    hora_cierre: '12:30',
    observaciones_reservas: 'Carga precintada sin incidencias.',
  };

  it('genera el PDF del DeCA vigente con QR e inmutabilidad de metadatos (RES6-I08 / INC05 / INC12)', async () => {
    const doc = await generateDecaPDF(baseDeca, 'https://resigest.com/inspect/dummy-token', {
      firstVersionCreatedAt: '2026-11-20T09:00:00Z',
    });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const out = doc.output();
    expect(out).toContain('DECA-2026-00001');
    expect(out).toContain('/CreationDate');
    expect(out).toContain('/ModDate (D:20261120120000+00\'00\')');
    // INC12: v1 conserva su hora original (10:00 Madrid) y v2 muestra la suya (11:00 Madrid)
    expect(out).toContain('v1: 20/11/2026, 10:00 | v2: 20/11/2026, 11:00');
  });

  it('genera DeCA histórico v1 con campos opcionales vacíos', async () => {
    const doc = await generateDecaPDF(
      {
        ...baseDeca,
        numero_deca: '',
        version: 1,
        is_vigente: false,
        estado: undefined as unknown as DecaDocument['estado'],
        created_at: '',
        updated_at: '',
        cargador_razon_social: '',
        cargador_nif: '',
        cargador_domicilio: '',
        cargador_codigo_postal: '',
        cargador_municipio: '',
        cargador_provincia: '',
        transportista_razon_social: '',
        transportista_nif: '',
        transportista_autorizacion: '',
        transportista_domicilio: '',
        transportista_municipio: '',
        origen_direccion: '',
        origen_municipio: '',
        origen_provincia: '',
        origen_nima: undefined,
        destino_direccion: '',
        destino_municipio: '',
        destino_provincia: '',
        destino_nima: undefined,
        naturaleza_mercancia: '',
        peso_kg: undefined,
        codigo_ler: undefined,
        numero_di: undefined,
        numero_nt: undefined,
        matricula_tractora: '',
        matricula_remolque: '',
        conductor_nombre: '',
        conductor_dni: '',
        hora_salida: '',
        hora_cierre: '',
        observaciones_reservas: undefined,
      },
      'https://resigest.com/inspect/v1'
    );
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
