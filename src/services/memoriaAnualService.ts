// =====================================================
// MEMORIA ANUAL SERVICE
// Servicio para gestionar las memorias anuales de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { auditService } from './auditService';
import { applyTenantScope, getActiveCompanyCookie } from './tenantContextService';
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
  production_center_id?: number | null;
  observaciones?: string;
}

export async function createMemoria(data: CreateMemoriaData): Promise<MemoriaAnual | null> {
  const supabase = createClient();

  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  // Generar número de memoria
  const numero_memoria = await generateNumeroMemoria(data.tipo_memoria, data.año, user.id);

  // Calcular fechas
  const fecha_inicio = `${data.año}-01-01`;
  const fecha_fin = `${data.año}-12-31`;

  // Obtener documentos de identificación del año y centro
  const documentos = await getDocumentosIdentificacionByYear(
    user.id,
    data.company_id,
    data.año,
    data.production_center_id,
    data.tipo_memoria,
    data.nif_empresa
  );
  const documentos_ids = documentos.filter(d => d.id > 0).map(d => d.id);

  // Calcular totales con precisión basada en báscula
  const total_movimientos = documentos.length;
  const total_toneladas = Number(documentos.reduce((sum, doc) => sum + getEffectiveWeightTonnes(doc), 0).toFixed(3));

  // Calcular resumen por LER
  const resumen_ler = calculateResumenLER(documentos);

  const resolvedCompanyId = data.company_id ?? getActiveCompanyCookie() ?? undefined;
  const normalizedCenterId =
    typeof data.production_center_id === 'number' && data.production_center_id > 0
      ? data.production_center_id
      : undefined;
  const memoria: Partial<MemoriaAnual> = {
    user_id: user.id,
    company_id: resolvedCompanyId,
    tipo_memoria: data.tipo_memoria,
    año: data.año,
    production_center_id: normalizedCenterId,
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

  await auditService.logAction({
    company_id: newMemoria.company_id ?? data.company_id ?? null,
    entidad: 'memoria_anual',
    entidad_id: newMemoria.id,
    accion: 'crear',
    detalles: {
      numero_memoria: newMemoria.numero_memoria,
      tipo_memoria: newMemoria.tipo_memoria,
      año: newMemoria.año,
    },
  });

  return newMemoria;
}

// =====================================================
// OBTENER TODAS LAS MEMORIAS
// =====================================================

export async function getAllMemorias(): Promise<MemoriaAnual[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const baseQuery = supabase
    .from('memorias_anuales')
    .select('*, production_center:production_centers(*)');

  const { data, error } = await applyTenantScope(baseQuery, user.id)
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const baseQuery = supabase
    .from('memorias_anuales')
    .select('*')
    .eq('id', id);

  const { data, error } = await applyTenantScope(baseQuery, user.id)
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const updateQuery = supabase
    .from('memorias_anuales')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  const { data, error } = await applyTenantScope(updateQuery, user.id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar memoria:', error);
    throw error;
  }

  await auditService.logAction({
    company_id: data?.company_id ?? null,
    entidad: 'memoria_anual',
    entidad_id: id,
    accion: 'actualizar',
    detalles: {
      estado: updates.estado,
      campos_actualizados: Object.keys(updates),
    },
  });

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const deleteQuery = supabase
    .from('memorias_anuales')
    .delete()
    .eq('id', id);

  const { error } = await applyTenantScope(deleteQuery, user.id);

  if (error) {
    console.error('Error al eliminar memoria:', error);
    throw error;
  }

  await auditService.logAction({
    entidad: 'memoria_anual',
    entidad_id: id,
    accion: 'eliminar',
  });

  return true;
}

// =====================================================
// RECALCULAR MEMORIA EN BORRADOR (A04-07)
// =====================================================

export async function recalculateDraftMemoria(id: number): Promise<MemoriaAnual> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const memoria = await getMemoriaById(id);
  if (!memoria) throw new Error('Memoria no encontrada');

  if (memoria.estado !== 'borrador') {
    throw new Error('Solo se pueden recalcular memorias anuales en estado borrador.');
  }

  // Obtener documentos de identificación actualizados del año y centro
  const documentos = await getDocumentosIdentificacionByYear(
    user.id,
    memoria.company_id,
    memoria.año,
    memoria.production_center_id,
    memoria.tipo_memoria,
    memoria.nif_empresa
  );
  const documentos_ids = documentos.filter(d => d.id > 0).map(d => d.id);

  // Calcular totales con precisión basada en báscula
  const total_movimientos = documentos.length;
  const total_toneladas = Number(documentos.reduce((sum, doc) => sum + getEffectiveWeightTonnes(doc), 0).toFixed(3));
  const resumen_ler = calculateResumenLER(documentos);

  const updates: Partial<MemoriaAnual> = {
    total_movimientos,
    total_toneladas,
    resumen_ler,
    documentos_identificacion_ids: documentos_ids,
    updated_at: new Date().toISOString(),
  };

  const recalcQuery = supabase
    .from('memorias_anuales')
    .update(updates)
    .eq('id', id);

  const { data: updated, error } = await applyTenantScope(recalcQuery, user.id)
    .select()
    .single();

  if (error || !updated) {
    console.error('Error al recalcular memoria anual:', error);
    throw error || new Error('No se pudo actualizar la memoria anual.');
  }

  await auditService.logAction({
    company_id: updated.company_id ?? memoria.company_id ?? null,
    entidad: 'memoria_anual',
    entidad_id: id,
    accion: 'recalcular_borrador',
    detalles: {
      numero_memoria: updated.numero_memoria,
      total_movimientos_anterior: memoria.total_movimientos,
      total_movimientos_nuevo: total_movimientos,
      total_toneladas_anterior: memoria.total_toneladas,
      total_toneladas_nuevo: total_toneladas,
    },
  });

  return updated;
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

  const ids = Array.isArray(memoria.documentos_identificacion_ids)
    ? memoria.documentos_identificacion_ids.filter((id: any) => id != null)
    : [];

  let documentos: any[] = [];

  if (ids.length > 0) {
    // Obtener todos los documentos de identificación incluidos
    const { data, error } = await supabase
      .from('identification_documents')
      .select('*')
      .eq('user_id', memoria.user_id)
      .in('id', ids);

    if (error) throw error;
    if (data === null) return null;
    documentos = data;
  } else {
    // RES6-I04: Si no hay IDs guardados (array vacío), reconciliar con los DIs del año y centro
    documentos = await getDocumentosIdentificacionByYear(
      memoria.user_id,
      memoria.company_id,
      memoria.año,
      memoria.production_center_id,
      memoria.tipo_memoria,
      memoria.nif_empresa
    );
  }

  // Generar datos según el tipo de memoria
  switch (memoria.tipo_memoria) {
    case 'productor':
      return generateDataProductor(memoria, documentos);
    case 'gestor':
    case 'gestor_raee': {
      let registrosSalida: any[] = [];
      try {
        const regTable: any = supabase.from('chronological_registry');
        if (regTable && typeof regTable.select === 'function') {
          const year = memoria.año || new Date().getFullYear();
          const { data: regData } = await regTable
            .select('*')
            .eq('user_id', memoria.user_id)
            .eq('tipo_operacion', 'salida_traslado')
            .gte('fecha', `${year}-01-01`)
            .lte('fecha', `${year}-12-31`);
          if (Array.isArray(regData)) {
            const docIds = new Set(documentos.filter((d) => d.id > 0).map((d) => d.id));
            const docRefs = new Set(documentos.map((d) => d.numero_documento).filter(Boolean));
            registrosSalida = regData.filter((reg: any) => {
              if (reg.company_id && memoria.company_id && reg.company_id !== memoria.company_id) {
                return false;
              }
              if (reg.identification_document_id && docIds.has(reg.identification_document_id)) {
                return false;
              }
              if (reg.numero_documento_referencia && docRefs.has(reg.numero_documento_referencia)) {
                return false;
              }
              return true;
            });
          }
        }
      } catch {
        // Fallback silencioso si la tabla o consulta no está disponible en entorno actual
      }
      return generateDataGestor(memoria, documentos, registrosSalida);
    }
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
    const isTotalRejection =
      doc.estado_traslado === 'rechazado_total' || doc.resultado_recepcion === 'rechazado_total';
    if (isTotalRejection) {
      return 0;
    }

      let grossKg = 0;
      if (doc.peso_destino_kg && Number(doc.peso_destino_kg) > 0) {
        grossKg = Number(doc.peso_destino_kg);
      } else if (doc.peso_origen_kg && Number(doc.peso_origen_kg) > 0) {
        grossKg = Number(doc.peso_origen_kg);
      } else if (doc.unidad === 'kg' || doc.unidad === 'litros' || doc.unidad === 'unidades') {
        grossKg = Number(doc.cantidad) || 0;
      } else {
        grossKg = (Number(doc.cantidad) || 0) * 1000;
      }

      const isPartialRejection =
        doc.estado_traslado === 'rechazado_parcial' || doc.resultado_recepcion === 'rechazado_parcial';
      const rejectedKg =
        isPartialRejection && doc.cantidad_rechazada_kg && Number(doc.cantidad_rechazada_kg) > 0
          ? Number(doc.cantidad_rechazada_kg)
          : 0;

      const netAcceptedKg = Math.max(0, grossKg - rejectedKg);
      return Number((netAcceptedKg / 1000).toFixed(3));
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
        codigo_operacion_rd: doc.operacion_tratamiento_ejecutada || doc.operacion_tratamiento || '',
        codigo_operacion_rd_4cifras: (doc.operacion_tratamiento_ejecutada || doc.operacion_tratamiento)?.substring(0, 4),
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
      documentos: IdentificationDocument[],
      registrosSalida: any[] = []
    ): {
      entradas: EntradaMemoriaGestorEntrada[];
      salidas: EntradaMemoriaGestorSalida[];
    } {
      const entradas: EntradaMemoriaGestorEntrada[] = documentos.map(doc => ({
        codigo_operacion_rd: doc.operacion_tratamiento_ejecutada || doc.operacion_tratamiento || '',
        codigo_operacion_rd_4cifras: (doc.operacion_tratamiento_ejecutada || doc.operacion_tratamiento)?.substring(0, 4),
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

      // Salidas hacia gestor final o devoluciones por rechazo desde DIs rechazados y Archivo Cronológico
      const salidasDesdeDIs: EntradaMemoriaGestorSalida[] = documentos
        .filter(
          doc =>
            doc.estado_traslado === 'rechazado_total' ||
            doc.estado_traslado === 'rechazado_parcial' ||
            doc.resultado_recepcion === 'rechazado_total' ||
            doc.resultado_recepcion === 'rechazado_parcial'
        )
        .map(doc => ({
          codigo_ler: doc.codigo_ler || '',
          descripcion_residuo: doc.descripcion_residuo || '',
          cantidad_toneladas:
            doc.estado_traslado === 'rechazado_parcial' && doc.cantidad_rechazada_kg && doc.cantidad_rechazada_kg > 0
              ? Number((Number(doc.cantidad_rechazada_kg) / 1000).toFixed(3))
              : getEffectiveWeightTonnes(doc),
          nima_destino: doc.gestor_nima || doc.productor_nima,
          nif_destino: doc.gestor_cif || doc.productor_cif || '',
          razon_social_destino: doc.gestor_razon_social || doc.productor_razon_social || '',
          nombre_centro_destino: doc.gestor_direccion || doc.productor_direccion || '',
          tipo_inscripcion_destino: 'G01',
          provincia_destino: doc.gestor_provincia || doc.productor_provincia,
          municipio_destino: doc.gestor_municipio || doc.productor_municipio,
          pais_destino: 'España',
          codigo_pais_destino: '108',
          codigo_di: doc.numero_documento,
          codigo_operacion_rd: doc.operacion_tratamiento || '',
          codigo_operacion_rd_4cifras: doc.operacion_tratamiento?.substring(0, 4),
        }));

      const salidasDesdeCronologico: EntradaMemoriaGestorSalida[] = (registrosSalida || []).map(reg => ({
        codigo_ler: reg.codigo_ler || '',
        descripcion_residuo: reg.descripcion_residuo || '',
        cantidad_toneladas: Number(((Number(reg.cantidad_kg) || 0) / 1000).toFixed(3)),
        nima_destino: reg.destino_nima || undefined,
        nif_destino: reg.destino_nif || '',
        razon_social_destino: reg.destino_razon_social || '',
        nombre_centro_destino: reg.destino_direccion || reg.destino_razon_social || '',
        tipo_inscripcion_destino: 'G01',
        provincia_destino: reg.destino_provincia || undefined,
        municipio_destino: reg.destino_municipio || undefined,
        pais_destino: 'España',
        codigo_pais_destino: '108',
        codigo_di: reg.numero_documento_referencia || reg.numero_asiento,
        codigo_operacion_rd: reg.operacion_rd || '',
        codigo_operacion_rd_4cifras: reg.operacion_rd ? String(reg.operacion_rd).substring(0, 4) : undefined,
      }));

      const salidas: EntradaMemoriaGestorSalida[] = [...salidasDesdeDIs, ...salidasDesdeCronologico];

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

      const baseStatsQuery = supabase
        .from('memorias_anuales')
        .select('*');

      let query = applyTenantScope(baseStatsQuery, user.id);

      if (año) {
        query = query.eq('año', año);
      }

      const { data: memorias, error } = await query;

      if (error) throw error;
      if (!memorias) {
        return {
          total: 0,
          por_estado: {} as any,
          por_tipo: {} as any,
          total_toneladas: 0
        };
      }

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
        const effectiveTonnes =
          Array.isArray(memoria.resumen_ler) && memoria.resumen_ler.length > 0
            ? (memoria.resumen_ler as ResumenLER[]).reduce(
              (sum: number, item: ResumenLER) => sum + (Number(item.cantidad_total) || 0),
              0
            )
            : Number(memoria.total_toneladas) || 0;
        stats.total_toneladas += effectiveTonnes;
      });

      return stats;
    }

    // =====================================================
    // FUNCIONES AUXILIARES
    // =====================================================

    async function generateNumeroMemoria(tipo: TipoMemoria, año: number, userId: string): Promise<string> {
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
        .eq('user_id', userId)
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
      productionCenterId?: number | null,
      tipoMemoria?: TipoMemoria,
      nifEmpresa?: string
    ): Promise<IdentificationDocument[]> {
      const supabase = createClient();

      const fecha_inicio = `${año}-01-01`;
      const fecha_fin = `${año}-12-31`;
      const isGestorMemoria = tipoMemoria === 'gestor' || tipoMemoria === 'gestor_raee';
      const isOperatorOrCarrierMemoria =
        tipoMemoria === 'negociante' || tipoMemoria === 'agente' || tipoMemoria === 'transportista';

      let query: any = supabase
        .from('identification_documents')
        .select('*')
        .eq('user_id', userId);

      if (isGestorMemoria && typeof query.or === 'function' && nifEmpresa?.trim()) {
        const cleanNif = nifEmpresa.trim().toUpperCase();
        query = query.or(
          `company_id.eq.${companyId},gestor_company_id.eq.${companyId},gestor_cif.ilike.${cleanNif}`
        );
      } else if (isOperatorOrCarrierMemoria && typeof query.or === 'function' && nifEmpresa?.trim()) {
        const cleanNif = nifEmpresa.trim().toUpperCase();
        query = query.or(
          `company_id.eq.${companyId},operador_cif.ilike.${cleanNif},transportista_cif.ilike.${cleanNif}`
        );
      } else {
        query = query.eq('company_id', companyId);
      }

      if (typeof query.gte === 'function') {
        query = query.gte('fecha_documento', fecha_inicio);
      }
      if (typeof query.lte === 'function') {
        query = query.lte('fecha_documento', fecha_fin);
      }

      // Nota: NO filtrar production_center_id con .eq() en SQL porque en PostgreSQL
      // descartaría los DIs emitidos desde sede (production_center_id IS NULL).
      // El filtrado por centro (incluyendo los de sede con production_center_id null)
      // se aplica justo debajo sobre el conjunto recuperado del tenant/empresa.

      const { data, error } = await query;
      if (error) throw error;

      const rawDocs: any[] = data || [];

      // RES6-I04 / D06: Conciliación exacta de movimientos entre archivo cronológico y memoria anual:
      // 1. Considerar fecha de recepción, salida o documento dentro del año de ejercicio.
      // 2. Si se especifica centro, incluir los del centro y los emitidos desde sede (production_center_id null).
      // 3. Incluir documentos en estado aceptado, completado o tratado.
      const docs: IdentificationDocument[] = rawDocs.filter((doc: any) => {
        const docDateStr = doc.fecha_recepcion || doc.fecha_llegada_destino || doc.fecha_salida || doc.fecha_documento;
        if (docDateStr) {
          const docDate = new Date(docDateStr);
          if (!isNaN(docDate.getTime()) && docDate.getFullYear() !== año) {
            return false;
          }
        }

        if (!isGestorMemoria && productionCenterId && productionCenterId > 0) {
          if (doc.production_center_id && doc.production_center_id !== productionCenterId) {
            return false;
          }
        }

        const isEligible =
          doc.estado === 'completado' ||
          doc.estado === 'aceptado' ||
          doc.estado === 'tratado' ||
          ['aceptado', 'rechazado_parcial', 'tratado', 'entregado', 'aceptado_en_destino', 'tratado_cerrado'].includes(doc.estado_traslado || '');

        return isEligible;
      });

      // A04-07: Para memorias de Gestor, incorporar también asientos del Archivo Cronológico (entrada_recepcion / salida_traslado)
      // que no estén ya representados por un DI incluido, evitando duplicidades.
      if (isGestorMemoria) {
        try {
          const regBuilder: any = supabase.from('chronological_registry');
          if (regBuilder && typeof regBuilder.select === 'function') {
            const regQuery = regBuilder
              .select('*')
              .eq('user_id', userId)
              .gte('fecha', fecha_inicio)
              .lte('fecha', `${fecha_fin}T23:59:59`);
            const { data: regEntries } = await regQuery;
            if (Array.isArray(regEntries)) {
              const existingDocIds = new Set(docs.map(d => d.id));
              const existingDocNums = new Set(docs.map(d => d.numero_documento).filter(Boolean));
              for (const reg of regEntries) {
                if (reg.tipo_operacion !== 'entrada_recepcion' && reg.tipo_operacion !== 'salida_traslado') {
                  continue;
                }
                if (reg.identification_document_id && existingDocIds.has(reg.identification_document_id)) {
                  continue;
                }
                if (reg.numero_documento_referencia && existingDocNums.has(reg.numero_documento_referencia)) {
                  continue;
                }
                if (reg.company_id && companyId && reg.company_id !== companyId) {
                  continue;
                }
                docs.push({
                  id: -(Number(reg.id) || 1),
                  user_id: userId,
                  company_id: companyId,
                  numero_documento: reg.numero_documento_referencia || reg.numero_asiento,
                  fecha_documento: String(reg.fecha || fecha_inicio).split('T')[0],
                  tipo_notificacion: 'sin-notificacion',
                  productor_razon_social: reg.origen_razon_social || '',
                  productor_cif: reg.origen_nif || '',
                  productor_nima: reg.origen_nima || undefined,
                  gestor_razon_social: reg.destino_razon_social || '',
                  gestor_cif: reg.destino_nif || nifEmpresa || '',
                  gestor_nima: reg.destino_nima || undefined,
                  codigo_ler: reg.codigo_ler || '',
                  descripcion_residuo: reg.descripcion_residuo || '',
                  peligrosidad: reg.peligrosidad || 'no-peligroso',
                  estado_fisico: reg.estado_fisico || 'solido',
                  cantidad: Number(reg.cantidad_kg) || 0,
                  unidad: 'kg',
                  peso_destino_kg: Number(reg.cantidad_kg) || 0,
                  operacion_tratamiento: reg.operacion_rd || 'R13',
                  estado: 'completado',
                  estado_traslado: 'tratado',
                  firmado_productor: true,
                  firmado_gestor: true,
                  firmado_transportista: true,
                  created_at: reg.created_at || new Date().toISOString(),
                  updated_at: reg.updated_at || new Date().toISOString(),
                });
              }
            }
          }
        } catch {
          // Fallback silencioso si chronological_registry no está mockeado
        }
      }

      // A7-09: Para memorias de Negociante / Agente sin posesión física, incorporar también operaciones
      // comerciales completadas o liquidadas del ejercicio que no tengan ya un DI incluido en `docs`.
      if (tipoMemoria === 'negociante' || tipoMemoria === 'agente') {
        try {
          const opsBuilder: any = supabase.from('commercial_operations');
          if (opsBuilder && typeof opsBuilder.select === 'function') {
            const opsQuery = opsBuilder
              .select('*')
              .eq('user_id', userId)
              .eq('company_id', companyId)
              .gte('fecha_operacion', fecha_inicio)
              .lte('fecha_operacion', fecha_fin);
            const { data: opsData } = await opsQuery;
            if (Array.isArray(opsData)) {
              const existingDocIds = new Set(docs.map(d => d.id));
              const existingDocNums = new Set(docs.map(d => d.numero_documento).filter(Boolean));
              for (const op of opsData) {
                if (!['completada', 'liquidada', 'en_transito'].includes(op.estado || '')) {
                  continue;
                }
                if (op.identification_document_id && existingDocIds.has(op.identification_document_id)) {
                  continue;
                }
                const lines = Array.isArray(op.lineas_materiales) && op.lineas_materiales.length > 0
                  ? op.lineas_materiales
                  : null;
                if (lines) {
                  lines.forEach((line: any, idx: number) => {
                    const refNum = line.di_referencia || `${op.numero_operacion}-L${idx + 1}`;
                    if (existingDocNums.has(refNum)) return;
                    const qtyT = Number(line.cantidad_t) || 0;
                    docs.push({
                      id: -((Number(op.id) || 1) * 100 + idx + 1),
                      user_id: userId,
                      company_id: companyId,
                      numero_documento: refNum,
                      fecha_documento: String(op.fecha_operacion || fecha_inicio).split('T')[0],
                      tipo_notificacion: 'sin-notificacion',
                      productor_razon_social: op.productor_razon_social || '',
                      productor_cif: op.productor_cif || '',
                      productor_nima: op.productor_nima || undefined,
                      gestor_razon_social: op.gestor_destino_razon_social || '',
                      gestor_cif: op.gestor_destino_cif || '',
                      gestor_nima: op.gestor_destino_nima || undefined,
                      codigo_ler: line.codigo_ler || op.codigo_ler || '',
                      descripcion_residuo: line.descripcion_residuo || op.descripcion_residuo || '',
                      peligrosidad: line.peligrosidad || op.peligrosidad || 'no-peligroso',
                      estado_fisico: 'solido',
                      cantidad: Math.round(qtyT * 1000),
                      unidad: 'kg',
                      peso_destino_kg: Math.round(qtyT * 1000),
                      operacion_tratamiento: line.operacion_tratamiento || op.operacion_tratamiento || 'R12',
                      estado: 'completado',
                      estado_traslado: 'tratado',
                      firmado_productor: true,
                      firmado_gestor: true,
                      firmado_transportista: true,
                      created_at: op.created_at || new Date().toISOString(),
                      updated_at: op.updated_at || new Date().toISOString(),
                    });
                  });
                } else {
                  const refNum = op.numero_operacion || `OP-${op.id}`;
                  if (existingDocNums.has(refNum)) continue;
                  const qtyT = Number(op.cantidad_real_t) > 0 ? Number(op.cantidad_real_t) : Number(op.cantidad_acordada_t) || 0;
                  docs.push({
                    id: -(Number(op.id) || 1) * 100,
                    user_id: userId,
                    company_id: companyId,
                    numero_documento: refNum,
                    fecha_documento: String(op.fecha_operacion || fecha_inicio).split('T')[0],
                    tipo_notificacion: 'sin-notificacion',
                    productor_razon_social: op.productor_razon_social || '',
                    productor_cif: op.productor_cif || '',
                    productor_nima: op.productor_nima || undefined,
                    gestor_razon_social: op.gestor_destino_razon_social || '',
                    gestor_cif: op.gestor_destino_cif || '',
                    gestor_nima: op.gestor_destino_nima || undefined,
                    codigo_ler: op.codigo_ler || '',
                    descripcion_residuo: op.descripcion_residuo || '',
                    peligrosidad: op.peligrosidad || 'no-peligroso',
                    estado_fisico: 'solido',
                    cantidad: Math.round(qtyT * 1000),
                    unidad: 'kg',
                    peso_destino_kg: Math.round(qtyT * 1000),
                    operacion_tratamiento: op.operacion_tratamiento || 'R12',
                    estado: 'completado',
                    estado_traslado: 'tratado',
                    firmado_productor: true,
                    firmado_gestor: true,
                    firmado_transportista: true,
                    created_at: op.created_at || new Date().toISOString(),
                    updated_at: op.updated_at || new Date().toISOString(),
                  });
                }
              }
            }
          }
        } catch {
          // Fallback silencioso si commercial_operations no está mockeado
        }
      }

      return docs;
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
      } else if ((memoria.tipo_memoria === 'gestor' || memoria.tipo_memoria === 'gestor_raee') && excelData?.entradas) {
        const entradasXml = (excelData.entradas as EntradaMemoriaGestorEntrada[]).map(e => `
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
        const salidasXml = ((excelData.salidas || []) as EntradaMemoriaGestorSalida[]).map(e => `
      <Row>
        <Cell><Data ss:Type="String">Salida</Data></Cell>
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
        xmlRows = `${entradasXml}${salidasXml}`;
      } else if (Array.isArray(excelData)) {
        xmlRows = excelData.map((e: any) => `
      <Row>
        <Cell><Data ss:Type="String">${memoria.tipo_memoria}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_ler || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${(e.descripcion_residuo || '').replace(/[<>&]/g, '')}</Data></Cell>
        <Cell><Data ss:Type="Number">${e.cantidad_toneladas || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${e.nif_origen || e.nif_destino || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${(e.razon_social_origen || e.razon_social_destino || '').replace(/[<>&]/g, '')}</Data></Cell>
        <Cell><Data ss:Type="String">${e.nima_origen || e.nima_destino || ''}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_operacion_rd_destino || e.codigo_operacion_rd || ''}</Data></Cell>
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
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
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
      } else if ((memoria.tipo_memoria === 'gestor' || memoria.tipo_memoria === 'gestor_raee') && excelData?.entradas) {
        const entradaRows = (excelData.entradas as EntradaMemoriaGestorEntrada[]).map(e => [
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
        const salidaRows = ((excelData.salidas || []) as EntradaMemoriaGestorSalida[]).map(e => [
          'Salida Gestor',
          e.codigo_ler,
          `"${(e.descripcion_residuo || '').replace(/"/g, '""')}"`,
          e.cantidad_toneladas.toFixed(3).replace('.', ','),
          e.nif_destino,
          `"${(e.razon_social_destino || '').replace(/"/g, '""')}"`,
          e.nima_destino || '',
          e.codigo_operacion_rd,
          e.codigo_di || ''
        ]);
        rows = [...entradaRows, ...salidaRows];
      } else if (Array.isArray(excelData)) {
        rows = excelData.map((e: any) => [
          memoria.tipo_memoria,
          e.codigo_ler || '',
          `"${(e.descripcion_residuo || '').replace(/"/g, '""')}"`,
          Number(e.cantidad_toneladas || 0).toFixed(3).replace('.', ','),
          e.nif_origen || e.nif_destino || '',
          `"${(e.razon_social_origen || e.razon_social_destino || '').replace(/"/g, '""')}"`,
          e.nima_origen || e.nima_destino || '',
          e.codigo_operacion_rd_destino || e.codigo_operacion_rd || '',
          e.codigo_di || ''
        ]);
      }

      const csvContent = `\uFEFF${[headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n')}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${memoria.numero_memoria}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url);
      }
    }

