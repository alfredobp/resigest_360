// =====================================================
// MEMORIA ANUAL SERVICE
// Servicio para gestionar las memorias anuales de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import {
  type MemoriaAnual,
  type EstadoMemoria,
  type TipoMemoria,
  type ResumenLER,
  type EntradaMemoriaProductor,
  type EntradaMemoriaGestorEntrada,
  type EntradaMemoriaGestorSalida,
  type EntradaMemoriaNegocianteTransportistaAgente,
  type IdentificationDocument
} from '@/types/wasteManagement';

// =====================================================
// CREAR MEMORIA ANUAL
// =====================================================

export interface CreateMemoriaData {
  company_id: number;
  tipo_memoria: TipoMemoria;
  año: number;
  nombre_empresa: string;
  nif_empresa: string;
  nombre_centro?: string;
  municipio_centro?: string;
  nima?: string;
  production_center_id: number;
  observaciones?: string;
}

export async function createMemoria(data: CreateMemoriaData): Promise<MemoriaAnual | null> {
  const supabase = createClient();

  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  // Generar número de memoria
  const numero_memoria = await generateNumeroMemoria(data.tipo_memoria, data.año);

  // Calcular fechas
  const fecha_inicio = `${data.año}-01-01`;
  const fecha_fin = `${data.año}-12-31`;

  // Obtener documentos de identificación del año y centro
  const documentos = await getDocumentosIdentificacionByYear(
    user.id,
    data.company_id,
    data.año,
    data.production_center_id
  );
  const documentos_ids = documentos.map(d => d.id);

  // Calcular totales con precisión basada en báscula
  const total_movimientos = documentos.length;
  const total_toneladas = Number(documentos.reduce((sum, doc) => sum + getEffectiveWeightTonnes(doc), 0).toFixed(3));

  // Calcular resumen por LER
  const resumen_ler = calculateResumenLER(documentos);

  const memoria: Partial<MemoriaAnual> = {
    user_id: user.id,
    company_id: data.company_id,
    tipo_memoria: data.tipo_memoria,
    año: data.año,
    production_center_id: data.production_center_id,
    numero_memoria,
    nombre_empresa: data.nombre_empresa,
    nif_empresa: data.nif_empresa,
    nombre_centro: data.nombre_centro,
    municipio_centro: data.municipio_centro,
    nima: data.nima,
    total_movimientos,
    total_toneladas,
    fecha_inicio,
    fecha_fin,
    resumen_ler,
    documentos_identificacion_ids: documentos_ids,
    estado: 'borrador',
    observaciones: data.observaciones,
  };

  const tipoPrefix = {
    'productor': 'PROD',
    'gestor': 'GEST',
    'gestor_raee': 'RAEE',
    'negociante': 'NEG',
    'transportista': 'TRANS',
    'agente': 'AGEN',
  }[data.tipo_memoria] || 'MEM';

  let currentCandidate = numero_memoria;
  let attempts = 0;
  let newMemoria: MemoriaAnual | null = null;

  while (attempts < 10) {
    attempts++;
    memoria.numero_memoria = currentCandidate;

    const { data: inserted, error } = await supabase
      .from('memorias_anuales')
      .insert([memoria])
      .select()
      .single();

    if (!error && inserted) {
      newMemoria = inserted;
      break;
    }

    if (error) {
      // Si el error es por colisión de número de memoria único (23505)
      const isNumeroMemoriaConflict =
        error.code === '23505' &&
        (error.message?.includes('memorias_anuales_numero_memoria_key') ||
         error.details?.includes('numero_memoria') ||
         error.message?.includes('numero_memoria'));

      if (isNumeroMemoriaConflict) {
        console.warn(`Colisión detectada en ${currentCandidate}, buscando siguiente número disponible...`);
        const match = currentCandidate.match(/-(\d+)$/);
        const nextNum = match ? parseInt(match[1], 10) + 1 : attempts + 1;
        currentCandidate = `MA-${data.año}-${tipoPrefix}-${String(nextNum).padStart(3, '0')}`;
        continue;
      }

      // Si el error es por duplicidad de centro y año para el mismo tipo
      if (
        error.code === '23505' &&
        (error.message?.includes('memorias_anuales_unique_center_year') ||
         error.message?.includes('unique_year') ||
         error.message?.includes('production_center_id'))
      ) {
        throw new Error(
          `Ya existe una memoria anual de tipo "${data.tipo_memoria}" para este centro de producción en el ejercicio ${data.año}.`
        );
      }

      console.error('Error al crear memoria anual:', error);
      throw error;
    }
  }

  if (!newMemoria) {
    throw new Error('No se pudo generar un número de memoria único tras varios intentos.');
  }

  return newMemoria;
}

// =====================================================
// OBTENER TODAS LAS MEMORIAS
// =====================================================

export async function getAllMemorias(): Promise<MemoriaAnual[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const { data, error } = await supabase
    .from('memorias_anuales')
    .select('*, production_center:production_centers(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener memorias:', error);
    throw error;
  }

  return data || [];
}

// =====================================================
// OBTENER MEMORIA POR ID
// =====================================================

export async function getMemoriaById(id: number): Promise<MemoriaAnual | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('memorias_anuales')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener memoria:', error);
    return null;
  }

  return data;
}

// =====================================================
// ACTUALIZAR MEMORIA
// =====================================================

export async function updateMemoria(
  id: number,
  updates: Partial<MemoriaAnual>
): Promise<MemoriaAnual | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('memorias_anuales')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar memoria:', error);
    throw error;
  }

  return data;
}

// =====================================================
// ACTUALIZAR ESTADO
// =====================================================

export async function updateEstado(
  id: number,
  estado: EstadoMemoria
): Promise<MemoriaAnual | null> {
  const updates: Partial<MemoriaAnual> = { estado };

  // Si se marca como presentada, guardar la fecha
  if (estado === 'presentada') {
    updates.fecha_presentacion = new Date().toISOString();
  }

  return updateMemoria(id, updates);
}

// =====================================================
// ELIMINAR MEMORIA
// =====================================================

export async function deleteMemoria(id: number): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('memorias_anuales')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar memoria:', error);
    throw error;
  }

  return true;
}

// =====================================================
// GENERAR DATOS PARA EXCEL
// =====================================================

export async function generateExcelData(
  memoriaId: number
): Promise<any> {
  const memoria = await getMemoriaById(memoriaId);
  if (!memoria) throw new Error('Memoria no encontrada');

  const supabase = createClient();

  // Obtener todos los documentos de identificación incluidos
  const { data: documentos, error } = await supabase
    .from('identification_documents')
    .select('*')
    .in('id', memoria.documentos_identificacion_ids);

  if (error) throw error;
  if (!documentos) return null;

  // Generar datos según el tipo de memoria
  switch (memoria.tipo_memoria) {
    case 'productor':
      return generateDataProductor(memoria, documentos);
    case 'gestor':
      return generateDataGestor(memoria, documentos);
    case 'negociante':
    case 'transportista':
    case 'agente':
      return generateDataNegocianteTransportistaAgente(memoria, documentos);
    default:
      throw new Error('Tipo de memoria no soportado');
  }
}

// =====================================================
// =====================================================
// UTILIDAD DE CÁLCULO DE PESO EN TONELADAS
// =====================================================

export function getEffectiveWeightTonnes(doc: IdentificationDocument): number {
  if (doc.peso_destino_kg && doc.peso_destino_kg > 0) {
    return Number((Number(doc.peso_destino_kg) / 1000).toFixed(3));
  }
  if (doc.peso_origen_kg && doc.peso_origen_kg > 0) {
    return Number((Number(doc.peso_origen_kg) / 1000).toFixed(3));
  }
  if (doc.unidad === 'kg') {
    return Number(((Number(doc.cantidad) || 0) / 1000).toFixed(3));
  }
  return Number((Number(doc.cantidad) || 0).toFixed(3));
}

// =====================================================
// GENERAR DATOS PARA MEMORIA DE PRODUCTOR
// =====================================================

function generateDataProductor(
  memoria: MemoriaAnual,
  documentos: IdentificationDocument[]
): EntradaMemoriaProductor[] {
  return documentos.map(doc => ({
    denominacion_proceso: 'Producción de residuos',
    codigo_ler: doc.codigo_ler || '',
    descripcion_residuo: doc.descripcion_residuo || '',
    cantidad_toneladas: getEffectiveWeightTonnes(doc),

    // Destino (Gestor)
    nima_destino: doc.gestor_nima,
    nif_destino: doc.gestor_cif || '',
    razon_social_destino: doc.gestor_razon_social || '',
    nombre_centro_destino: doc.gestor_direccion || '',
    tipo_inscripcion_destino: 'G01',
    codigo_operacion_rd: doc.operacion_tratamiento || '',
    codigo_operacion_rd_4cifras: doc.operacion_tratamiento?.substring(0, 4),
    provincia_destino: doc.gestor_provincia,
    codigo_provincia_destino: undefined,
    municipio_destino: doc.gestor_municipio,
    pais_destino: 'España',
    codigo_pais_destino: '108',
    codigo_di: doc.numero_documento,
  }));
}

// =====================================================
// GENERAR DATOS PARA MEMORIA DE GESTOR
// =====================================================

function generateDataGestor(
  memoria: MemoriaAnual,
  documentos: IdentificationDocument[]
): {
  entradas: EntradaMemoriaGestorEntrada[];
  salidas: EntradaMemoriaGestorSalida[];
} {
  const entradas: EntradaMemoriaGestorEntrada[] = documentos.map(doc => ({
    codigo_operacion_rd: doc.operacion_tratamiento || '',
    codigo_operacion_rd_4cifras: doc.operacion_tratamiento?.substring(0, 4),
    codigo_proceso_interno: undefined,
    denominacion_proceso_interno: undefined,

    // Residuo recepcionado
    codigo_ler: doc.codigo_ler || '',
    descripcion_residuo: doc.descripcion_residuo || '',
    cantidad_toneladas: getEffectiveWeightTonnes(doc),

    // Origen (Productor)
    nima_origen: doc.productor_nima,
    nif_origen: doc.productor_cif || '',
    razon_social_origen: doc.productor_razon_social || '',
    nombre_centro_origen: doc.productor_direccion || '',
    tipo_inscripcion_origen: 'P01', // Productor
    provincia_origen: doc.productor_provincia,
    codigo_provincia_origen: undefined,
    municipio_origen: doc.productor_municipio,
    pais_origen: 'España',
    codigo_pais_origen: '108',
    codigo_di: doc.numero_documento,

    // SRAP
    srap: false,
  }));

  // Salidas hacia gestor final (en caso de rechazos o transferencias)
  const salidas: EntradaMemoriaGestorSalida[] = [];

  return { entradas, salidas };
}

// =====================================================
// GENERAR DATOS PARA NEGOCIANTE/TRANSPORTISTA/AGENTE
// =====================================================

function generateDataNegocianteTransportistaAgente(
  memoria: MemoriaAnual,
  documentos: IdentificationDocument[]
): EntradaMemoriaNegocianteTransportistaAgente[] {
  return documentos.map(doc => ({
    // Residuo
    codigo_ler: doc.codigo_ler || '',
    descripcion_residuo: doc.descripcion_residuo || '',
    cantidad_toneladas: getEffectiveWeightTonnes(doc),

    // Procedencia (Productor)
    nima_origen: doc.productor_nima,
    nif_origen: doc.productor_cif || '',
    razon_social_origen: doc.productor_razon_social || '',
    nombre_centro_origen: doc.productor_direccion || '',
    tipo_inscripcion_origen: 'P01',
    provincia_origen: doc.productor_provincia,
    codigo_provincia_origen: undefined,
    municipio_origen: doc.productor_municipio,
    pais_origen: 'España',
    codigo_pais_origen: '108',

    // Destino (Gestor)
    nima_destino: doc.gestor_nima,
    nif_destino: doc.gestor_cif || '',
    razon_social_destino: doc.gestor_razon_social || '',
    nombre_centro_destino: doc.gestor_direccion || '',
    tipo_inscripcion_destino: 'G01',
    codigo_operacion_rd_destino: doc.operacion_tratamiento || '',
    codigo_operacion_rd_4cifras_destino: doc.operacion_tratamiento?.substring(0, 4),
    provincia_destino: doc.gestor_provincia,
    codigo_provincia_destino: undefined,
    municipio_destino: doc.gestor_municipio,
    pais_destino: 'España',
    codigo_pais_destino: '108',
    codigo_di: doc.numero_documento,
  }));
}

// =====================================================
// OBTENER ESTADÍSTICAS
// =====================================================

export async function getStats(año?: number): Promise<{
  total: number;
  por_estado: Record<EstadoMemoria, number>;
  por_tipo: Record<TipoMemoria, number>;
  total_toneladas: number;
}> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  let query = supabase
    .from('memorias_anuales')
    .select('*')
    .eq('user_id', user.id);

  if (año) {
    query = query.eq('año', año);
  }

  const { data: memorias, error } = await query;

  if (error) throw error;
  if (!memorias) {return {
    total: 0,
    por_estado: {} as any,
    por_tipo: {} as any,
    total_toneladas: 0
  };}

  const stats = {
    total: memorias.length,
    por_estado: {} as Record<EstadoMemoria, number>,
    por_tipo: {} as Record<TipoMemoria, number>,
    total_toneladas: 0,
  };

  memorias.forEach(memoria => {
    // Contar por estado
    stats.por_estado[memoria.estado as EstadoMemoria] = (stats.por_estado[memoria.estado as EstadoMemoria] || 0) + 1;

    // Contar por tipo
    stats.por_tipo[memoria.tipo_memoria as TipoMemoria] = (stats.por_tipo[memoria.tipo_memoria as TipoMemoria] || 0) + 1;

    // Sumar toneladas
    stats.total_toneladas += memoria.total_toneladas || 0;
  });

  return stats;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

async function generateNumeroMemoria(tipo: TipoMemoria, año: number): Promise<string> {
  const supabase = createClient();

  const tipoPrefix = {
    'productor': 'PROD',
    'gestor': 'GEST',
    'gestor_raee': 'RAEE',
    'negociante': 'NEG',
    'transportista': 'TRANS',
    'agente': 'AGEN',
  }[tipo] || 'MEM';

  const prefix = `MA-${año}-${tipoPrefix}-`;

  // Obtener todas las memorias existentes con este prefijo para calcular el máximo correlativo
  const { data } = await supabase
    .from('memorias_anuales')
    .select('numero_memoria')
    .ilike('numero_memoria', `${prefix}%`);

  let maxNumber = 0;
  if (data && data.length > 0) {
    for (const item of data) {
      const match = item.numero_memoria?.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }

  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

async function getDocumentosIdentificacionByYear(
  userId: string,
  companyId: number,
  año: number,
  productionCenterId?: number
): Promise<IdentificationDocument[]> {
  const supabase = createClient();

  const fecha_inicio = `${año}-01-01`;
  const fecha_fin = `${año}-12-31`;

  let query = supabase
    .from('identification_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .gte('fecha_documento', fecha_inicio)
    .lte('fecha_documento', fecha_fin);

  if (productionCenterId && productionCenterId > 0) {
    query = query.eq('production_center_id', productionCenterId);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  const docs = data || [];
  // Filtrar documentos que tengan estado completado, aceptado, tratado o traslado aceptado/cerrado
  return docs.filter(doc => 
    doc.estado === 'completado' ||
    doc.estado === 'aceptado' ||
    doc.estado === 'tratado' ||
    ['aceptado', 'rechazado_parcial', 'tratado', 'entregado', 'aceptado_en_destino', 'tratado_cerrado'].includes(doc.estado_traslado || '')
  );
}

function calculateResumenLER(documentos: IdentificationDocument[]): ResumenLER[] {
  const resumenMap = new Map<string, ResumenLER>();

  documentos.forEach(doc => {
    const codigo_ler = doc.codigo_ler || '';
    const descripcion = doc.descripcion_residuo || '';
    const cantidadTon = getEffectiveWeightTonnes(doc);

    if (resumenMap.has(codigo_ler)) {
      const existing = resumenMap.get(codigo_ler)!;
      existing.cantidad_total = Number((existing.cantidad_total + cantidadTon).toFixed(3));
      existing.numero_movimientos += 1;
    } else {
      resumenMap.set(codigo_ler, {
        codigo_ler,
        descripcion,
        cantidad_total: cantidadTon,
        numero_movimientos: 1,
      });
    }
  });

  return Array.from(resumenMap.values());
}

// =====================================================
// EXPORTACIÓN A EXCEL XML (.XLS) PARA MEMORIA ANUAL
// =====================================================

export function exportMemoriaToExcelXML(memoria: MemoriaAnual, excelData: any): void {
  let xmlRows = '';

  if (memoria.tipo_memoria === 'productor' && Array.isArray(excelData)) {
    xmlRows = (excelData as EntradaMemoriaProductor[]).map(e => `
      <Row>
        <Cell><Data ss:Type="String">${e.denominacion_proceso || 'Producción de residuos'}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_ler}</Data></Cell>
        <Cell><Data ss:Type="String">${(e.descripcion_residuo || '').replace(/[<>&]/g, '')}</Data></Cell>
        <Cell><Data ss:Type="Number">${e.cantidad_toneladas}</Data></Cell>
        <Cell><Data ss:Type="String">${e.nif_destino}</Data></Cell>
        <Cell><Data ss:Type="String">${(e.razon_social_destino || '').replace(/[<>&]/g, '')}</Data></Cell>
        <Cell><Data ss:Type="String">${e.nima_destino || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_operacion_rd}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_di || ''}</Data></Cell>
      </Row>
    `).join('');
  } else if (memoria.tipo_memoria === 'gestor' && excelData?.entradas) {
    xmlRows = (excelData.entradas as EntradaMemoriaGestorEntrada[]).map(e => `
      <Row>
        <Cell><Data ss:Type="String">Recepción</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_ler}</Data></Cell>
        <Cell><Data ss:Type="String">${(e.descripcion_residuo || '').replace(/[<>&]/g, '')}</Data></Cell>
        <Cell><Data ss:Type="Number">${e.cantidad_toneladas}</Data></Cell>
        <Cell><Data ss:Type="String">${e.nif_origen}</Data></Cell>
        <Cell><Data ss:Type="String">${(e.razon_social_origen || '').replace(/[<>&]/g, '')}</Data></Cell>
        <Cell><Data ss:Type="String">${e.nima_origen || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_operacion_rd}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_di || ''}</Data></Cell>
      </Row>
    `).join('');
  } else if (Array.isArray(excelData)) {
    xmlRows = excelData.map((e: any) => `
      <Row>
        <Cell><Data ss:Type="String">${e.codigo_ler || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${(e.descripcion_residuo || '').replace(/[<>&]/g, '')}</Data></Cell>
        <Cell><Data ss:Type="Number">${e.cantidad_toneladas || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${e.nif_origen || e.nif_destino || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${(e.razon_social_origen || e.razon_social_destino || '').replace(/[<>&]/g, '')}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_di || ''}</Data></Cell>
      </Row>
    `).join('');
  }

  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#047857" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Memoria Anual ${memoria.año}">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Tipo Operación / Proceso</Data></Cell>
    <Cell><Data ss:Type="String">Código LER</Data></Cell>
    <Cell><Data ss:Type="String">Descripción Residuo</Data></Cell>
    <Cell><Data ss:Type="String">Cantidad (Toneladas)</Data></Cell>
    <Cell><Data ss:Type="String">NIF Contraparte</Data></Cell>
    <Cell><Data ss:Type="String">Razón Social</Data></Cell>
    <Cell><Data ss:Type="String">NIMA</Data></Cell>
    <Cell><Data ss:Type="String">Operación R/D</Data></Cell>
    <Cell><Data ss:Type="String">Código DI</Data></Cell>
   </Row>
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${memoria.numero_memoria}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =====================================================
// EXPORTACIÓN A CSV PARA MEMORIA ANUAL
// =====================================================

export function exportMemoriaToCSV(memoria: MemoriaAnual, excelData: any): void {
  const headers = [
    'Proceso/Tipo',
    'Código LER',
    'Descripción Residuo',
    'Cantidad (t)',
    'NIF Contraparte',
    'Razón Social',
    'NIMA',
    'Operación R/D',
    'Código DI'
  ];

  let rows: string[][] = [];

  if (memoria.tipo_memoria === 'productor' && Array.isArray(excelData)) {
    rows = (excelData as EntradaMemoriaProductor[]).map(e => [
      e.denominacion_proceso || 'Producción de residuos',
      e.codigo_ler,
      `"${(e.descripcion_residuo || '').replace(/"/g, '""')}"`,
      e.cantidad_toneladas.toFixed(3).replace('.', ','),
      e.nif_destino,
      `"${(e.razon_social_destino || '').replace(/"/g, '""')}"`,
      e.nima_destino || '',
      e.codigo_operacion_rd,
      e.codigo_di || ''
    ]);
  } else if (memoria.tipo_memoria === 'gestor' && excelData?.entradas) {
    rows = (excelData.entradas as EntradaMemoriaGestorEntrada[]).map(e => [
      'Recepción Gestor',
      e.codigo_ler,
      `"${(e.descripcion_residuo || '').replace(/"/g, '""')}"`,
      e.cantidad_toneladas.toFixed(3).replace('.', ','),
      e.nif_origen,
      `"${(e.razon_social_origen || '').replace(/"/g, '""')}"`,
      e.nima_origen || '',
      e.codigo_operacion_rd,
      e.codigo_di || ''
    ]);
  }

  const csvContent = `\uFEFF${  [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${memoria.numero_memoria}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

