// =====================================================
// MEMORIA ANUAL SERVICE
// Servicio para gestionar las memorias anuales de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { 
  MemoriaAnual, 
  EstadoMemoria, 
  TipoMemoria,
  ResumenLER,
  EntradaMemoriaProductor,
  EntradaMemoriaGestorEntrada,
  EntradaMemoriaGestorSalida,
  EntradaMemoriaNegocianteTransportistaAgente,
  IdentificationDocument
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

  // Obtener documentos de identificación del año
  const documentos = await getDocumentosIdentificacionByYear(user.id, data.company_id, data.año);
  const documentos_ids = documentos.map(d => d.id);

  // Calcular totales
  const total_movimientos = documentos.length;
  const total_toneladas = documentos.reduce((sum, doc) => sum + (doc.cantidad_total || 0), 0);

  // Calcular resumen por LER
  const resumen_ler = calculateResumenLER(documentos);

  const memoria: Partial<MemoriaAnual> = {
    user_id: user.id,
    company_id: data.company_id,
    tipo_memoria: data.tipo_memoria,
    año: data.año,
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

  const { data: newMemoria, error } = await supabase
    .from('memorias_anuales')
    .insert([memoria])
    .select()
    .single();

  if (error) {
    console.error('Error al crear memoria anual:', error);
    throw error;
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
    .select('*')
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
// GENERAR DATOS PARA MEMORIA DE PRODUCTOR
// =====================================================

function generateDataProductor(
  memoria: MemoriaAnual,
  documentos: IdentificationDocument[]
): EntradaMemoriaProductor[] {
  return documentos.map(doc => ({
    denominacion_proceso: doc.productor_actividad || 'Producción de residuos',
    codigo_ler: doc.residuo_codigo_ler || '',
    descripcion_residuo: doc.residuo_descripcion || '',
    cantidad_toneladas: doc.cantidad_total || 0,
    
    // Destino (Gestor)
    nima_destino: doc.gestor_nima,
    nif_destino: doc.gestor_nif || '',
    razon_social_destino: doc.gestor_razon_social || '',
    nombre_centro_destino: doc.gestor_direccion || '',
    tipo_inscripcion_destino: 'G01', // Gestor de residuos
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
    codigo_ler: doc.residuo_codigo_ler || '',
    descripcion_residuo: doc.residuo_descripcion || '',
    cantidad_toneladas: doc.cantidad_total || 0,
    
    // Origen (Productor)
    nima_origen: doc.productor_nima,
    nif_origen: doc.productor_nif || '',
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

  // Las salidas se generarían si hay datos de destino final
  // En este caso, asumimos que el gestor es el destino final
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
    codigo_ler: doc.residuo_codigo_ler || '',
    descripcion_residuo: doc.residuo_descripcion || '',
    cantidad_toneladas: doc.cantidad_total || 0,
    
    // Procedencia (Productor)
    nima_origen: doc.productor_nima,
    nif_origen: doc.productor_nif || '',
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
    nif_destino: doc.gestor_nif || '',
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
  if (!memorias) return {
    total: 0,
    por_estado: {} as any,
    por_tipo: {} as any,
    total_toneladas: 0
  };

  const stats = {
    total: memorias.length,
    por_estado: {} as Record<EstadoMemoria, number>,
    por_tipo: {} as Record<TipoMemoria, number>,
    total_toneladas: 0,
  };

  memorias.forEach(memoria => {
    // Contar por estado
    stats.por_estado[memoria.estado] = (stats.por_estado[memoria.estado] || 0) + 1;
    
    // Contar por tipo
    stats.por_tipo[memoria.tipo_memoria] = (stats.por_tipo[memoria.tipo_memoria] || 0) + 1;
    
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  // Obtener el último número para este tipo y año
  const { data, error } = await supabase
    .from('memorias_anuales')
    .select('numero_memoria')
    .eq('user_id', user.id)
    .eq('tipo_memoria', tipo)
    .eq('año', año)
    .order('created_at', { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].numero_memoria;
    const match = lastNumber.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const tipoPrefix = {
    'productor': 'PROD',
    'gestor': 'GEST',
    'gestor_raee': 'RAEE',
    'negociante': 'NEG',
    'transportista': 'TRANS',
    'agente': 'AGEN',
  }[tipo];

  return `MA-${año}-${tipoPrefix}-${String(nextNumber).padStart(3, '0')}`;
}

async function getDocumentosIdentificacionByYear(
  userId: string,
  companyId: number,
  año: number
): Promise<IdentificationDocument[]> {
  const supabase = createClient();

  const fecha_inicio = `${año}-01-01`;
  const fecha_fin = `${año}-12-31`;

  const { data, error } = await supabase
    .from('identification_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .gte('fecha_documento', fecha_inicio)
    .lte('fecha_documento', fecha_fin)
    .eq('estado', 'completado');

  if (error) throw error;
  return data || [];
}

function calculateResumenLER(documentos: IdentificationDocument[]): ResumenLER[] {
  const resumenMap = new Map<string, ResumenLER>();

  documentos.forEach(doc => {
    const codigo_ler = doc.residuo_codigo_ler || '';
    const descripcion = doc.residuo_descripcion || '';
    const cantidad = doc.cantidad_total || 0;

    if (resumenMap.has(codigo_ler)) {
      const existing = resumenMap.get(codigo_ler)!;
      existing.cantidad_total += cantidad;
      existing.numero_movimientos += 1;
    } else {
      resumenMap.set(codigo_ler, {
        codigo_ler,
        descripcion,
        cantidad_total: cantidad,
        numero_movimientos: 1,
      });
    }
  });

  return Array.from(resumenMap.values());
}
