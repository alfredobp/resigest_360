// ==============================================================================
// RESIGEST 360 - SERVICIO DE OPERACIONES COMERCIALES (NEGOCIANTE Y AGENTE)
// ==============================================================================

import { createClient } from '@/lib/supabase/client';
import {
  CommercialOperation,
  CommercialOperationFormData,
  CommercialOperationStats,
  EstadoOperacionComercial
} from '@/types/wasteManagement';

export interface CommercialOperationFilter {
  año?: number;
  estado?: EstadoOperacionComercial | 'todas';
  codigo_ler?: string;
  search?: string;
}

/**
 * Calcula con precisión los costes, ingresos y márgenes de una operación comercial
 */
export function calculateProfitability(data: Partial<CommercialOperationFormData>) {
  const toneladas = (data.cantidad_real_t && data.cantidad_real_t > 0)
    ? Number(data.cantidad_real_t)
    : Number(data.cantidad_estimada_t || 0);

  // Cálculo de coste de compra
  const precioCompra = Number(data.precio_unitario_compra || 0);
  let costeCompra = 0;
  if (data.tipo_precio_compra === 'por_tonelada') {
    costeCompra = precioCompra * toneladas;
  } else if (data.tipo_precio_compra === 'por_kg') {
    costeCompra = precioCompra * (toneladas * 1000);
  } else {
    // lote_fijo
    costeCompra = precioCompra;
  }

  // Cálculo de ingreso de venta
  const precioVenta = Number(data.precio_unitario_venta || 0);
  let ingresoVenta = 0;
  if (data.tipo_precio_venta === 'por_tonelada') {
    ingresoVenta = precioVenta * toneladas;
  } else if (data.tipo_precio_venta === 'por_kg') {
    ingresoVenta = precioVenta * (toneladas * 1000);
  } else {
    // lote_fijo
    ingresoVenta = precioVenta;
  }

  const costeTransporte = Number(data.coste_transporte || 0);
  const otrosCostes = Number(data.otros_costes || 0);

  const costeTotal = costeCompra + costeTransporte + otrosCostes;
  const margenBruto = ingresoVenta - costeTotal;
  const margenUnitario = toneladas > 0 ? margenBruto / toneladas : 0;
  const porcentajeMargen = ingresoVenta > 0 ? (margenBruto / ingresoVenta) * 100 : 0;

  return {
    toneladas: Number(toneladas.toFixed(3)),
    coste_compra_total: Number(costeCompra.toFixed(2)),
    ingreso_venta_total: Number(ingresoVenta.toFixed(2)),
    coste_transporte: Number(costeTransporte.toFixed(2)),
    otros_costes: Number(otrosCostes.toFixed(2)),
    margen_bruto_total: Number(margenBruto.toFixed(2)),
    margen_unitario_tonelada: Number(margenUnitario.toFixed(2)),
    porcentaje_margen: Number(porcentajeMargen.toFixed(2))
  };
}

export const commercialOperationService = {
  /**
   * Obtener todas las operaciones con filtros
   */
  async getAll(filters: CommercialOperationFilter = {}): Promise<CommercialOperation[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    let query = supabase
      .from('commercial_operations')
      .select(`
        *,
        origen_productor:companies!commercial_operations_origen_productor_id_fkey(*),
        origen_center:production_centers(*),
        destino_gestor:companies!commercial_operations_destino_gestor_id_fkey(*),
        transportista:companies!commercial_operations_transportista_id_fkey(*),
        proveedor_comercial:companies!commercial_operations_proveedor_comercial_id_fkey(*),
        cliente_comercial:companies!commercial_operations_cliente_comercial_id_fkey(*),
        identification_document:identification_documents(*)
      `)
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })
      .order('id', { ascending: false });

    if (filters.año) {
      query = query.gte('fecha', `${filters.año}-01-01`).lte('fecha', `${filters.año}-12-31`);
    }

    if (filters.estado && filters.estado !== 'todas') {
      query = query.eq('estado', filters.estado);
    }

    if (filters.codigo_ler) {
      query = query.ilike('codigo_ler', `%${filters.codigo_ler}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error al obtener operaciones comerciales:', error);
      throw error;
    }

    let results: CommercialOperation[] = data || [];

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        item =>
          item.numero_operacion.toLowerCase().includes(q) ||
          item.codigo_ler.toLowerCase().includes(q) ||
          item.descripcion_residuo.toLowerCase().includes(q) ||
          (item.proveedor_razon_social && item.proveedor_razon_social.toLowerCase().includes(q)) ||
          (item.cliente_razon_social && item.cliente_razon_social.toLowerCase().includes(q)) ||
          (item.origen_nombre_personalizado && item.origen_nombre_personalizado.toLowerCase().includes(q)) ||
          (item.destino_nombre_personalizado && item.destino_nombre_personalizado.toLowerCase().includes(q))
      );
    }

    return results;
  },

  /**
   * Obtener operación por ID
   */
  async getById(id: number): Promise<CommercialOperation | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('commercial_operations')
      .select(`
        *,
        origen_productor:companies!commercial_operations_origen_productor_id_fkey(*),
        origen_center:production_centers(*),
        destino_gestor:companies!commercial_operations_destino_gestor_id_fkey(*),
        transportista:companies!commercial_operations_transportista_id_fkey(*),
        proveedor_comercial:companies!commercial_operations_proveedor_comercial_id_fkey(*),
        cliente_comercial:companies!commercial_operations_cliente_comercial_id_fkey(*),
        identification_document:identification_documents(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener operación por ID:', error);
      return null;
    }

    return data as CommercialOperation;
  },

  /**
   * Crear nueva operación comercial
   */
  async create(data: CommercialOperationFormData): Promise<CommercialOperation> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    const year = new Date(data.fecha || new Date()).getFullYear();

    // Generar correlativo OP-YYYY-000001
    const { count } = await supabase
      .from('commercial_operations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const nextSeq = (count || 0) + 1;
    const numero_operacion = `OP-${year}-${String(nextSeq).padStart(6, '0')}`;

    // Calcular márgenes
    const profitability = calculateProfitability(data);

    const payload = {
      ...data,
      user_id: user.id,
      numero_operacion,
      estado: data.estado || 'abierta',
      peligrosidad: data.codigo_ler.includes('*') ? 'peligroso' : data.peligrosidad,
      coste_compra_total: profitability.coste_compra_total,
      ingreso_venta_total: profitability.ingreso_venta_total,
      coste_transporte: profitability.coste_transporte,
      otros_costes: profitability.otros_costes,
      margen_bruto_total: profitability.margen_bruto_total,
      margen_unitario_tonelada: profitability.margen_unitario_tonelada,
      porcentaje_margen: profitability.porcentaje_margen
    };

    const { data: created, error } = await supabase
      .from('commercial_operations')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error al crear operación comercial:', error);
      throw error;
    }

    return created as CommercialOperation;
  },

  /**
   * Actualizar operación comercial
   */
  async update(id: number, data: Partial<CommercialOperationFormData>): Promise<CommercialOperation> {
    const supabase = createClient();

    // Recalcular rentabilidad si cambian precios o cantidades
    const profitability = calculateProfitability(data);

    const payload: any = {
      ...data,
      coste_compra_total: profitability.coste_compra_total,
      ingreso_venta_total: profitability.ingreso_venta_total,
      coste_transporte: profitability.coste_transporte,
      otros_costes: profitability.otros_costes,
      margen_bruto_total: profitability.margen_bruto_total,
      margen_unitario_tonelada: profitability.margen_unitario_tonelada,
      porcentaje_margen: profitability.porcentaje_margen,
      updated_at: new Date().toISOString()
    };

    if (data.codigo_ler && data.codigo_ler.includes('*')) {
      payload.peligrosidad = 'peligroso';
    }

    const { data: updated, error } = await supabase
      .from('commercial_operations')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar operación comercial:', error);
      throw error;
    }

    return updated as CommercialOperation;
  },

  /**
   * Eliminar operación comercial
   */
  async delete(id: number): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('commercial_operations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar operación comercial:', error);
      throw error;
    }

    return true;
  },

  /**
   * Obtener métricas y KPIs agregados
   */
  async getStats(año?: number): Promise<CommercialOperationStats> {
    const ops = await this.getAll({ año });

    const stats: CommercialOperationStats = {
      total_operaciones: ops.length,
      toneladas_totales: 0,
      facturacion_total: 0,
      costes_totales: 0,
      margen_bruto_total: 0,
      margen_medio_tonelada: 0,
      por_estado: {
        borrador: 0,
        abierta: 0,
        en_transito: 0,
        completada: 0,
        liquidada: 0,
        cancelada: 0
      }
    };

    ops.forEach(op => {
      const ton = Number(op.cantidad_real_t && op.cantidad_real_t > 0 ? op.cantidad_real_t : op.cantidad_estimada_t) || 0;
      stats.toneladas_totales += ton;
      stats.facturacion_total += Number(op.ingreso_venta_total) || 0;
      stats.costes_totales += (Number(op.coste_compra_total) || 0) + (Number(op.coste_transporte) || 0) + (Number(op.otros_costes) || 0);
      stats.margen_bruto_total += Number(op.margen_bruto_total) || 0;

      if (stats.por_estado[op.estado] !== undefined) {
        stats.por_estado[op.estado]++;
      }
    });

    stats.margen_medio_tonelada = stats.toneladas_totales > 0
      ? Number((stats.margen_bruto_total / stats.toneladas_totales).toFixed(2))
      : 0;

    stats.facturacion_total = Number(stats.facturacion_total.toFixed(2));
    stats.costes_totales = Number(stats.costes_totales.toFixed(2));
    stats.margen_bruto_total = Number(stats.margen_bruto_total.toFixed(2));
    stats.toneladas_totales = Number(stats.toneladas_totales.toFixed(3));

    return stats;
  },

  /**
   * Exportar operaciones a CSV (delimitado por comas/punto y coma en español)
   */
  exportToCSV(ops: CommercialOperation[]): void {
    const headers = [
      'Nº Operación',
      'Fecha',
      'Estado',
      'Código LER',
      'Descripción Residuo',
      'Toneladas',
      'Productor Origen',
      'Gestor Destino',
      'Transportista',
      'Proveedor Compra',
      'Precio Compra (€/t)',
      'Coste Compra (€)',
      'Cliente Venta',
      'Precio Venta (€/t)',
      'Ingreso Venta (€)',
      'Porte Transporte (€)',
      'Margen Bruto (€)',
      'Margen (€/t)',
      'Ref DI'
    ];

    const rows = ops.map(op => {
      const ton = (op.cantidad_real_t && op.cantidad_real_t > 0 ? op.cantidad_real_t : op.cantidad_estimada_t) || 0;
      return [
        op.numero_operacion,
        op.fecha,
        op.estado,
        op.codigo_ler,
        `"${(op.descripcion_residuo || '').replace(/"/g, '""')}"`,
        ton.toFixed(3).replace('.', ','),
        `"${(op.origen_nombre_personalizado || op.origen_productor?.razon_social || '').replace(/"/g, '""')}"`,
        `"${(op.destino_nombre_personalizado || op.destino_gestor?.razon_social || '').replace(/"/g, '""')}"`,
        `"${(op.transportista_nombre_personalizado || op.transportista?.razon_social || '').replace(/"/g, '""')}"`,
        `"${(op.proveedor_razon_social || op.proveedor_comercial?.razon_social || '').replace(/"/g, '""')}"`,
        (op.precio_unitario_compra || 0).toFixed(2).replace('.', ','),
        (op.coste_compra_total || 0).toFixed(2).replace('.', ','),
        `"${(op.cliente_razon_social || op.cliente_comercial?.razon_social || '').replace(/"/g, '""')}"`,
        (op.precio_unitario_venta || 0).toFixed(2).replace('.', ','),
        (op.ingreso_venta_total || 0).toFixed(2).replace('.', ','),
        (op.coste_transporte || 0).toFixed(2).replace('.', ','),
        (op.margen_bruto_total || 0).toFixed(2).replace('.', ','),
        (op.margen_unitario_tonelada || 0).toFixed(2).replace('.', ','),
        op.identification_document_id ? `DI #${op.identification_document_id}` : ''
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `operaciones_comerciales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Exportar operaciones a Excel XML (.xls)
   */
  exportToExcelXML(ops: CommercialOperation[]): void {
    const xmlRows = ops.map(op => {
      const ton = (op.cantidad_real_t && op.cantidad_real_t > 0 ? op.cantidad_real_t : op.cantidad_estimada_t) || 0;
      return `
        <Row>
          <Cell><Data ss:Type="String">${op.numero_operacion}</Data></Cell>
          <Cell><Data ss:Type="String">${op.fecha}</Data></Cell>
          <Cell><Data ss:Type="String">${op.estado.toUpperCase()}</Data></Cell>
          <Cell><Data ss:Type="String">${op.codigo_ler}</Data></Cell>
          <Cell><Data ss:Type="String">${(op.descripcion_residuo || '').replace(/[<>&]/g, '')}</Data></Cell>
          <Cell><Data ss:Type="Number">${ton}</Data></Cell>
          <Cell><Data ss:Type="String">${(op.proveedor_razon_social || op.proveedor_comercial?.razon_social || '').replace(/[<>&]/g, '')}</Data></Cell>
          <Cell><Data ss:Type="Number">${op.coste_compra_total}</Data></Cell>
          <Cell><Data ss:Type="String">${(op.cliente_razon_social || op.cliente_comercial?.razon_social || '').replace(/[<>&]/g, '')}</Data></Cell>
          <Cell><Data ss:Type="Number">${op.ingreso_venta_total}</Data></Cell>
          <Cell><Data ss:Type="Number">${op.coste_transporte}</Data></Cell>
          <Cell><Data ss:Type="Number">${op.margen_bruto_total}</Data></Cell>
          <Cell><Data ss:Type="Number">${op.margen_unitario_tonelada}</Data></Cell>
        </Row>
      `;
    }).join('');

    const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1D4ED8" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Operaciones Comerciales">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Nº Operación</Data></Cell>
    <Cell><Data ss:Type="String">Fecha</Data></Cell>
    <Cell><Data ss:Type="String">Estado</Data></Cell>
    <Cell><Data ss:Type="String">Código LER</Data></Cell>
    <Cell><Data ss:Type="String">Descripción Residuo</Data></Cell>
    <Cell><Data ss:Type="String">Toneladas</Data></Cell>
    <Cell><Data ss:Type="String">Proveedor Compra</Data></Cell>
    <Cell><Data ss:Type="String">Coste Compra (€)</Data></Cell>
    <Cell><Data ss:Type="String">Cliente Venta</Data></Cell>
    <Cell><Data ss:Type="String">Ingreso Venta (€)</Data></Cell>
    <Cell><Data ss:Type="String">Porte Transporte (€)</Data></Cell>
    <Cell><Data ss:Type="String">Margen Bruto (€)</Data></Cell>
    <Cell><Data ss:Type="String">Margen (€/t)</Data></Cell>
   </Row>
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `operaciones_comerciales_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default commercialOperationService;
