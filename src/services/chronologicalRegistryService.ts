// ==============================================================================
// RESIGEST 360 - SERVICIO DE ARCHIVO CRONOLÓGICO (ART. 64 LEY 7/2022)
// ==============================================================================

import { createClient } from '@/lib/supabase/client';
import { auditService } from './auditService';
import { applyTenantScope } from './tenantContextService';
import {
  type ChronologicalEntry,
  type ChronologicalEntryFormData,
  type ChronologicalStats,
  type TipoOperacionCronologica,
  type IdentificationDocument,
  type CommercialOperation
} from '@/types/wasteManagement';

export interface ChronologicalFilter {
  año?: number;
  production_center_id?: number | 'todos';
  tipo_operacion?: TipoOperacionCronologica | 'todas';
  codigo_ler?: string;
  peligrosidad?: 'no-peligroso' | 'peligroso' | 'todas';
  search?: string;
}

// =====================================================
// OBTENER ASIENTOS CRONOLÓGICOS CON FILTROS
// =====================================================
export async function getChronologicalEntries(
  filters: ChronologicalFilter = {}
): Promise<ChronologicalEntry[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  let query = applyTenantScope(
    supabase
      .from('chronological_registry')
      .select('*, production_center:production_centers(*)'),
    user.id
  )
    .order('fecha', { ascending: false })
    .order('id', { ascending: false });

  if (filters.año) {
    query = query.gte('fecha', `${filters.año}-01-01`).lte('fecha', `${filters.año}-12-31`);
  }

  if (filters.production_center_id && filters.production_center_id !== 'todos') {
    query = query.eq('production_center_id', filters.production_center_id);
  }

  if (filters.tipo_operacion && filters.tipo_operacion !== 'todas') {
    query = query.eq('tipo_operacion', filters.tipo_operacion);
  }

  if (filters.peligrosidad && filters.peligrosidad !== 'todas') {
    query = query.eq('peligrosidad', filters.peligrosidad);
  }

  if (filters.codigo_ler) {
    query = query.ilike('codigo_ler', `%${filters.codigo_ler}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error al obtener asientos cronológicos:', error);
    throw error;
  }

  let results: ChronologicalEntry[] = data || [];

  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      item =>
        item.numero_asiento.toLowerCase().includes(q) ||
        item.codigo_ler.toLowerCase().includes(q) ||
        item.descripcion_residuo.toLowerCase().includes(q) ||
        (item.origen_razon_social && item.origen_razon_social.toLowerCase().includes(q)) ||
        (item.destino_razon_social && item.destino_razon_social.toLowerCase().includes(q)) ||
        (item.numero_documento_referencia && item.numero_documento_referencia.toLowerCase().includes(q))
    );
  }

  return results;
}

// =====================================================
// OBTENER ESTADÍSTICAS Y MÉTRICAS AGREGADAS
// =====================================================
export async function getChronologicalStats(
  año?: number,
  productionCenterId?: number | 'todos'
): Promise<ChronologicalStats> {
  const entries = await getChronologicalEntries({
    año,
    production_center_id: productionCenterId
  });

  const stats: ChronologicalStats = {
    total_asientos: entries.length,
    total_kg: 0,
    total_t: 0,
    kg_peligrosos: 0,
    kg_no_peligrosos: 0,
    por_operacion: {
      produccion_interna: { count: 0, kg: 0, t: 0 },
      salida_traslado: { count: 0, kg: 0, t: 0 },
      entrada_recepcion: { count: 0, kg: 0, t: 0 },
      tratamiento_interno: { count: 0, kg: 0, t: 0 },
      merma_ajuste: { count: 0, kg: 0, t: 0 },
    },
    resumen_ler: []
  };

  const lerMap = new Map<string, {
    codigo_ler: string;
    descripcion: string;
    peligrosidad: string;
    cantidad_kg: number;
    cantidad_t: number;
    movimientos: number;
  }>();

  entries.forEach(entry => {
    const kg = Number(entry.cantidad_kg) || 0;
    const t = kg / 1000.0;

    stats.total_kg += kg;
    stats.total_t += t;

    if (entry.peligrosidad === 'peligroso') {
      stats.kg_peligrosos += kg;
    } else {
      stats.kg_no_peligrosos += kg;
    }

    if (stats.por_operacion[entry.tipo_operacion]) {
      stats.por_operacion[entry.tipo_operacion].count += 1;
      stats.por_operacion[entry.tipo_operacion].kg += kg;
      stats.por_operacion[entry.tipo_operacion].t += t;
    }

    const lerKey = entry.codigo_ler;
    if (!lerMap.has(lerKey)) {
      lerMap.set(lerKey, {
        codigo_ler: entry.codigo_ler,
        descripcion: entry.descripcion_residuo,
        peligrosidad: entry.peligrosidad,
        cantidad_kg: kg,
        cantidad_t: t,
        movimientos: 1
      });
    } else {
      const existing = lerMap.get(lerKey)!;
      existing.cantidad_kg += kg;
      existing.cantidad_t += t;
      existing.movimientos += 1;
    }
  });

  stats.resumen_ler = Array.from(lerMap.values()).sort((a, b) => b.cantidad_kg - a.cantidad_kg);

  return stats;
}

// =====================================================
// GENERADOR CORRELATIVO UNIFICADO DE ASIENTOS
// =====================================================
async function getNextChronologicalAsientoNumber(
  supabase: any,
  userId: string,
  year: number,
  fallbackSeq = 1
): Promise<string> {
  const { data: existingEntries, count } = await supabase
    .from('chronological_registry')
    .select('id, numero_asiento', { count: 'exact' })
    .eq('user_id', userId);

  let maxSeq = typeof count === 'number' ? count : 0;
  if (Array.isArray(existingEntries)) {
    for (const item of existingEntries) {
      const match = item.numero_asiento?.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const hasQueryStats = typeof count === 'number' || Array.isArray(existingEntries);
  const nextSeq = hasQueryStats ? maxSeq + 1 : Math.max(1, fallbackSeq);
  return `AS-${year}-${String(nextSeq).padStart(6, '0')}`;
}

// =====================================================
// CREAR ASIENTO MANUAL
// =====================================================
export async function createChronologicalEntry(
  data: ChronologicalEntryFormData
): Promise<ChronologicalEntry> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  const fechaObj = new Date(data.fecha || new Date());
  const year = isNaN(fechaObj.getFullYear()) ? new Date().getFullYear() : fechaObj.getFullYear();

  const numero_asiento = await getNextChronologicalAsientoNumber(supabase, user.id, year, 1);

  const payload = {
    ...data,
    user_id: user.id,
    numero_asiento,
    peligrosidad: data.codigo_ler.includes('*') ? 'peligroso' : data.peligrosidad
  };

  const { data: created, error } = await supabase
    .from('chronological_registry')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error al crear asiento cronológico:', error);
    throw error;
  }

  return created;
}

// =====================================================
// ELIMINAR ASIENTO MANUAL
// =====================================================
export async function deleteChronologicalEntry(id: number): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  let existing: {
    fecha?: string | null;
    numero_asiento?: string | null;
    codigo_ler?: string | null;
    company_id?: number | null;
  } | null = null;

  const lookupBuilder: any = supabase.from('chronological_registry');
  if (typeof lookupBuilder?.select === 'function') {
    const { data } = await lookupBuilder
      .select('fecha, numero_asiento, codigo_ler, company_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    existing = data || null;

    if (existing?.fecha) {
      const entryDate = new Date(existing.fecha);
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      if (!Number.isNaN(entryDate.getTime()) && entryDate >= fiveYearsAgo) {
        throw new Error(
          'No se puede eliminar un asiento del archivo cronológico con menos de 5 años de antigüedad (Art. 64 Ley 7/2022).'
        );
      }
    }
  }

  const { error } = await supabase
    .from('chronological_registry')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error al eliminar asiento cronológico:', error);
    throw error;
  }

  await auditService.logAction({
    company_id: existing?.company_id ?? null,
    entidad: 'archivo_cronologico',
    entidad_id: id,
    accion: 'eliminar',
    detalles: {
      numero_asiento: existing?.numero_asiento ?? null,
      codigo_ler: existing?.codigo_ler ?? null,
      fecha: existing?.fecha ?? null,
    },
  });

  return true;
}

// =====================================================
// SINCRONIZAR AUTOMÁTICAMENTE DESDE UN DI
// =====================================================
export async function syncEntryFromDI(di: IdentificationDocument): Promise<ChronologicalEntry | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Verificar si ya existe registro para este DI en la cuenta del usuario
  const { data: existing } = await supabase
    .from('chronological_registry')
    .select('id')
    .eq('identification_document_id', di.id)
    .eq('user_id', user.id)
    .maybeSingle();

  // Peso verificado con preferencia de báscula de destino y conversión homogénea según unidad
  const rawCantidad = Number(di.cantidad) || 0;
  const isTonnesOrM3 = !di.unidad || di.unidad === 'toneladas' || di.unidad === 'm3';
  const cantidadEnKg = isTonnesOrM3 ? rawCantidad * 1000 : rawCantidad;
  const cantidadKg = Number(di.peso_destino_kg) || Number(di.peso_origen_kg) || cantidadEnKg;

  // Detectar si la empresa actual actúa como Gestor Receptora o Productor
  let isGestor = false;
  if (di.company_id) {
    const { data: userComp } = await supabase
      .from('companies')
      .select('cif, tipo_empresa')
      .eq('id', di.company_id)
      .maybeSingle();

    if (userComp) {
      isGestor =
        userComp.tipo_empresa === 'gestor' ||
        (Boolean(userComp.cif) && Boolean(di.gestor_cif) && userComp.cif.trim().toUpperCase() === di.gestor_cif.trim().toUpperCase());
    }
  }

  // A04-09: Conservar fecha y hora exactas por tipo de evento (salida vs recepción en destino)
  const fechaSalida = di.fecha_salida || di.fecha_documento;
  const fechaRecepcion = di.fecha_llegada_destino || di.fecha_entrega || (di as any).fecha_recepcion || di.fecha_documento;
  const fechaAsiento = isGestor
    ? (fechaRecepcion || new Date().toISOString())
    : (fechaSalida || new Date().toISOString());

  const year = new Date(fechaAsiento).getFullYear();

  const payload: Partial<ChronologicalEntry> = {
    user_id: user.id,
    company_id: di.company_id,
    production_center_id: di.production_center_id,
    fecha: fechaAsiento,
    tipo_operacion: isGestor ? 'entrada_recepcion' : 'salida_traslado',
    codigo_ler: di.codigo_ler,
    descripcion_residuo: di.descripcion_residuo,
    peligrosidad: di.codigo_ler.includes('*') ? 'peligroso' : di.peligrosidad,
    estado_fisico: di.estado_fisico,
    cantidad_kg: Math.round(cantidadKg * 1000) / 1000,
    envase_tipo: di.tipo_envases,
    envase_unidades: di.numero_envases,
    origen_tipo: isGestor ? 'tercero_productor' : 'propio',
    origen_nif: di.productor_cif,
    origen_razon_social: di.productor_razon_social,
    origen_nima: di.productor_nima,
    origen_direccion: di.productor_direccion,
    origen_municipio: di.productor_municipio,
    origen_provincia: di.productor_provincia,
    transportista_nif: di.transportista_cif,
    transportista_razon_social: di.transportista_razon_social,
    transportista_nima: di.transportista_nima,
    transportista_matricula: di.transportista_matricula,
    destino_tipo: isGestor ? 'propio' : 'tercero_gestor',
    destino_nif: di.gestor_cif,
    destino_razon_social: di.gestor_razon_social,
    destino_nima: di.gestor_nima,
    destino_autorizacion: di.gestor_numero_autorizacion,
    destino_direccion: di.gestor_direccion,
    destino_municipio: di.gestor_municipio,
    destino_provincia: di.gestor_provincia,
    operacion_rd: di.operacion_tratamiento_ejecutada || di.operacion_tratamiento,
    identification_document_id: di.id,
    numero_documento_referencia: di.numero_albaran_gestor || di.numero_documento,
    observaciones: `Registro cronológico sincronizado desde DI ${di.numero_documento} (${isGestor ? 'Entrada / Recepción en planta' : 'Salida / Traslado'})${
      di.operacion_tratamiento_ejecutada &&
      di.operacion_tratamiento &&
      di.operacion_tratamiento_ejecutada !== di.operacion_tratamiento
        ? ` | Op. prevista: ${di.operacion_tratamiento}, Op. ejecutada: ${di.operacion_tratamiento_ejecutada}`
        : ''
    }`
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from('chronological_registry')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) console.error('Error al actualizar asiento desde DI:', error);
    return updated;
  }

  const numero_asiento = await getNextChronologicalAsientoNumber(
    supabase,
    user.id,
    year,
    Number(di.id) || 1
  );
  const { data: created, error } = await supabase
    .from('chronological_registry')
    .insert([{ ...payload, numero_asiento }])
    .select()
    .single();

  if (error) console.error('Error al crear asiento desde DI:', error);
  return created;
}

// =====================================================
// SINCRONIZAR DESDE OPERACIÓN COMERCIAL (NEGOCIANTE / AGENTE - ART. 64)
// =====================================================
export async function syncEntryFromCommercialOperation(
  op: CommercialOperation
): Promise<ChronologicalEntry | null> {
  if (!op || !op.numero_operacion || !op.codigo_ler) return null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from('chronological_registry')
    .select('id')
    .eq('numero_documento_referencia', op.numero_operacion)
    .eq('user_id', user.id)
    .maybeSingle();

  const toneladas =
    op.cantidad_real_t && Number(op.cantidad_real_t) > 0
      ? Number(op.cantidad_real_t)
      : Number(op.cantidad_estimada_t) || 0;
  const cantidadKg = Math.round(toneladas * 1000 * 1000) / 1000;
  const fechaAsiento = op.fecha || new Date().toISOString().split('T')[0];
  const parsedDate = new Date(fechaAsiento);
  const year = isNaN(parsedDate.getFullYear()) ? new Date().getFullYear() : parsedDate.getFullYear();

  const payload: Partial<ChronologicalEntry> = {
    user_id: user.id,
    company_id: op.company_id ?? null,
    production_center_id: op.origen_center_id ?? null,
    fecha: fechaAsiento,
    tipo_operacion: 'salida_traslado',
    codigo_ler: op.codigo_ler,
    descripcion_residuo: op.descripcion_residuo,
    peligrosidad: op.codigo_ler.includes('*') ? 'peligroso' : op.peligrosidad,
    cantidad_kg: cantidadKg,
    origen_tipo: 'tercero_productor',
    origen_nif: op.origen_cif || op.proveedor_cif || op.origen_productor?.cif || null,
    origen_razon_social:
      op.origen_nombre_personalizado ||
      op.origen_productor?.razon_social ||
      op.proveedor_razon_social ||
      null,
    origen_nima: op.origen_nima || op.origen_productor?.nima || null,
    transportista_nif: op.transportista_cif || op.transportista?.cif || null,
    transportista_razon_social:
      op.transportista_nombre_personalizado || op.transportista?.razon_social || null,
    transportista_matricula: op.transportista_matricula || op.transportista?.matricula || null,
    destino_tipo: 'tercero_gestor',
    destino_nif: op.destino_cif || op.cliente_cif || op.destino_gestor?.cif || null,
    destino_razon_social:
      op.destino_nombre_personalizado ||
      op.destino_gestor?.razon_social ||
      op.cliente_razon_social ||
      null,
    destino_nima: op.destino_nima || op.destino_gestor?.nima || null,
    destino_autorizacion:
      op.destino_autorizacion || op.destino_gestor?.numero_autorizacion || null,
    operacion_rd: op.operacion_rd || null,
    identification_document_id: op.identification_document_id ?? null,
    numero_documento_referencia: op.numero_operacion,
    observaciones: `Registro cronológico de Negociante/Agente sincronizado desde Operación Comercial ${op.numero_operacion} (${op.estado})`,
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from('chronological_registry')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) console.error('Error al actualizar asiento desde operación comercial:', error);
    return updated;
  }

  const numero_asiento = await getNextChronologicalAsientoNumber(
    supabase,
    user.id,
    year,
    Number(op.id) || 1
  );
  const { data: created, error } = await supabase
    .from('chronological_registry')
    .insert([{ ...payload, numero_asiento }])
    .select()
    .single();

  if (error) console.error('Error al crear asiento desde operación comercial:', error);
  return created;
}

// =====================================================
// SINCRONIZACIÓN MASIVA DE TODOS LOS DIS COMPLETADOS
// =====================================================
export async function syncAllClosedDIs(): Promise<{ totalSincronizados: number }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado');

  // Buscar todos los DIs en estados cerrados o completados
  const { data: dis, error } = await supabase
    .from('identification_documents')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  if (!dis || dis.length === 0) return { totalSincronizados: 0 };

  let totalSincronizados = 0;
  for (const di of dis) {
    const isCompleted =
      di.estado === 'completado' ||
      di.estado === 'aceptado' ||
      di.estado === 'tratado' ||
      ['aceptado', 'rechazado_parcial', 'tratado', 'entregado', 'aceptado_en_destino', 'tratado_cerrado'].includes(di.estado_traslado || '');

    if (isCompleted) {
      await syncEntryFromDI(di);
      totalSincronizados++;
    }
  }

  return { totalSincronizados };
}

// =====================================================
// EXPORTACIÓN A CSV (COMPATIBLE CON EXCEL EN ESPAÑOL Y ART. 64)
// =====================================================
export function exportChronologicalToCSV(entries: ChronologicalEntry[]): void {
  const headers = [
    'Nº Asiento',
    'Fecha',
    'Tipo Operación',
    'Código LER',
    'Descripción Residuo',
    'Peligrosidad',
    'Estado Físico',
    'Cantidad (kg)',
    'Cantidad (t)',
    'Tipo Envase',
    'Unidades Envase',
    'Origen NIF',
    'Origen Razón Social',
    'Origen NIMA',
    'Transportista NIF',
    'Transportista Razón Social',
    'Matrícula',
    'Destino NIF',
    'Destino Razón Social',
    'Destino NIMA',
    'Autorización Destino',
    'Operación R/D',
    'Ref. Documental (DI/Albarán)',
    'Observaciones'
  ];

  const rows = entries.map(e => [
    e.numero_asiento,
    e.fecha,
    e.tipo_operacion,
    e.codigo_ler,
    `"${(e.descripcion_residuo || '').replace(/"/g, '""')}"`,
    e.peligrosidad,
    e.estado_fisico || '',
    (e.cantidad_kg || 0).toFixed(2).replace('.', ','),
    ((e.cantidad_kg || 0) / 1000).toFixed(3).replace('.', ','),
    e.envase_tipo || '',
    e.envase_unidades || '',
    e.origen_nif || '',
    `"${(e.origen_razon_social || '').replace(/"/g, '""')}"`,
    e.origen_nima || '',
    e.transportista_nif || '',
    `"${(e.transportista_razon_social || '').replace(/"/g, '""')}"`,
    e.transportista_matricula || '',
    e.destino_nif || '',
    `"${(e.destino_razon_social || '').replace(/"/g, '""')}"`,
    e.destino_nima || '',
    e.destino_autorizacion || '',
    e.operacion_rd || '',
    e.numero_documento_referencia || '',
    `"${(e.observaciones || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = `\uFEFF${  [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `archivo_cronologico_art64_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

// =====================================================
// EXPORTACIÓN A EXCEL XML (.XLS) CON FORMATO ESTILIZADO
// =====================================================
export function exportChronologicalToExcelXML(entries: ChronologicalEntry[]): void {
  const xmlRows = entries.map(e => `
    <Row>
      <Cell><Data ss:Type="String">${e.numero_asiento}</Data></Cell>
      <Cell><Data ss:Type="String">${e.fecha}</Data></Cell>
      <Cell><Data ss:Type="String">${e.tipo_operacion}</Data></Cell>
      <Cell><Data ss:Type="String">${e.codigo_ler}</Data></Cell>
      <Cell><Data ss:Type="String">${(e.descripcion_residuo || '').replace(/[<>&]/g, '')}</Data></Cell>
      <Cell><Data ss:Type="String">${e.peligrosidad}</Data></Cell>
      <Cell><Data ss:Type="String">${e.estado_fisico || ''}</Data></Cell>
      <Cell><Data ss:Type="Number">${e.cantidad_kg}</Data></Cell>
      <Cell><Data ss:Type="Number">${((e.cantidad_kg || 0) / 1000).toFixed(3)}</Data></Cell>
      <Cell><Data ss:Type="String">${e.envase_tipo || ''}</Data></Cell>
      <Cell><Data ss:Type="Number">${e.envase_unidades || 0}</Data></Cell>
      <Cell><Data ss:Type="String">${e.origen_nif || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${(e.origen_razon_social || '').replace(/[<>&]/g, '')}</Data></Cell>
      <Cell><Data ss:Type="String">${e.origen_nima || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${e.transportista_nif || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${(e.transportista_razon_social || '').replace(/[<>&]/g, '')}</Data></Cell>
      <Cell><Data ss:Type="String">${e.transportista_matricula || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${e.destino_nif || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${(e.destino_razon_social || '').replace(/[<>&]/g, '')}</Data></Cell>
      <Cell><Data ss:Type="String">${e.destino_nima || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${e.destino_autorizacion || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${e.operacion_rd || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${e.numero_documento_referencia || ''}</Data></Cell>
      <Cell><Data ss:Type="String">${(e.observaciones || '').replace(/[<>&]/g, '')}</Data></Cell>
    </Row>
  `).join('');

  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Archivo Cronológico Art.64">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Nº Asiento</Data></Cell>
    <Cell><Data ss:Type="String">Fecha</Data></Cell>
    <Cell><Data ss:Type="String">Tipo Operación</Data></Cell>
    <Cell><Data ss:Type="String">Código LER</Data></Cell>
    <Cell><Data ss:Type="String">Descripción</Data></Cell>
    <Cell><Data ss:Type="String">Peligrosidad</Data></Cell>
    <Cell><Data ss:Type="String">Estado Físico</Data></Cell>
    <Cell><Data ss:Type="String">Cantidad (kg)</Data></Cell>
    <Cell><Data ss:Type="String">Cantidad (t)</Data></Cell>
    <Cell><Data ss:Type="String">Envase</Data></Cell>
    <Cell><Data ss:Type="String">Unidades</Data></Cell>
    <Cell><Data ss:Type="String">Origen NIF</Data></Cell>
    <Cell><Data ss:Type="String">Origen Razón Social</Data></Cell>
    <Cell><Data ss:Type="String">Origen NIMA</Data></Cell>
    <Cell><Data ss:Type="String">Transportista NIF</Data></Cell>
    <Cell><Data ss:Type="String">Transportista Razón Social</Data></Cell>
    <Cell><Data ss:Type="String">Matrícula</Data></Cell>
    <Cell><Data ss:Type="String">Destino NIF</Data></Cell>
    <Cell><Data ss:Type="String">Destino Razón Social</Data></Cell>
    <Cell><Data ss:Type="String">Destino NIMA</Data></Cell>
    <Cell><Data ss:Type="String">Autorización Destino</Data></Cell>
    <Cell><Data ss:Type="String">Operación R/D</Data></Cell>
    <Cell><Data ss:Type="String">Ref. DI / Albarán</Data></Cell>
    <Cell><Data ss:Type="String">Observaciones</Data></Cell>
   </Row>
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `archivo_cronologico_art64_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}
