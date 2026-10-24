// ==============================================================================
// RESIGEST 360 - SERVICIO DE DASHBOARD EJECUTIVO Y CONTROL POR EXCEPCIÓN
// ==============================================================================

import { createClient } from '@/lib/supabase/client';
import { getContractEffectiveStatus } from '@/services/wasteContractService';

export interface AlertException {
  id: string | number;
  tipo: 'transito' | 'discrepancia_peso' | 'rechazo' | 'contrato_caducado' | 'contrato_proximo' | 'autorizacion_vencida';
  gravedad: 'critico' | 'advertencia' | 'info';
  titulo: string;
  descripcion: string;
  referencia: string;
  enlace: string;
  fecha?: string;
}

export interface ExecutiveDashboardData {
  alertas: {
    totalCriticas: number;
    totalAdvertencias: number;
    lista: AlertException[];
    disEnTransitoCount: number;
    disDiscrepanciaCount: number;
    contratosCaducadosCount: number;
    contratosPorVencerCount: number;
    autorizacionesPorVencerCount: number;
  };
  residuos: {
    totalToneladas: number;
    toneladasPeligrosas: number;
    toneladasNoPeligrosas: number;
    totalDIs: number;
    disCompletados: number;
    topLER: Array<{
      codigo_ler: string;
      descripcion: string;
      toneladas: number;
      porcentaje: number;
      peligroso: boolean;
    }>;
  };
  comercial: {
    totalOperaciones: number;
    operacionesAbiertas: number;
    facturacionVenta: number;
    costesTotales: number;
    margenBrutoTotal: number;
    margenMedioTon: number;
    rentabilidadPorcentaje: number;
  };
}

export const dashboardService = {
  /**
   * Obtener visión ejecutiva global y excepciones en tiempo real
   */
  async getExecutiveOverview(): Promise<ExecutiveDashboardData> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();
    const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Cargar en paralelo DIs, Contratos, Autorizaciones y Operaciones Comerciales
    const [disRes, contractsRes, authsRes, opsRes] = await Promise.all([
      supabase.from('identification_documents').select('*').eq('user_id', user.id),
      supabase.from('waste_contracts').select('*').eq('user_id', user.id),
      supabase.from('environmental_authorizations').select('*').eq('user_id', user.id),
      supabase.from('commercial_operations').select('*').eq('user_id', user.id)
    ]);

    const dis = disRes.data || [];
    const contracts = contractsRes.data || [];
    const auths = authsRes.data || [];
    const ops = opsRes.data || [];

    // 1. ANALIZAR EXCEPCIONES Y ALERTAS
    const listaAlertas: AlertException[] = [];
    let disEnTransitoCount = 0;
    let disDiscrepanciaCount = 0;
    let contratosCaducadosCount = 0;
    let contratosPorVencerCount = 0;
    let autorizacionesPorVencerCount = 0;

    // Alertas de DIs
    dis.forEach(d => {
      const isTransito = d.estado_traslado === 'en_transito';
      if (isTransito) {
        disEnTransitoCount++;
        listaAlertas.push({
          id: `di-transito-${d.id}`,
          tipo: 'transito',
          gravedad: 'advertencia',
          titulo: `DI en tránsito: ${d.numero_documento}`,
          descripcion: `Traslado iniciado de ${d.codigo_ler} hacia ${d.gestor_razon_social}. Pendiente de recepción en destino.`,
          referencia: d.numero_documento,
          enlace: `/residuos/documentos-identificacion/${d.id}`,
          fecha: d.fecha_salida || d.fecha_documento
        });
      }

      const tieneDiscrepancia = (d.porcentaje_discrepancia && Math.abs(d.porcentaje_discrepancia) > 5) ||
        ['rechazado_parcial', 'rechazado_total'].includes(d.estado_traslado || '');

      if (tieneDiscrepancia) {
        disDiscrepanciaCount++;
        const isRechazo = ['rechazado_parcial', 'rechazado_total'].includes(d.estado_traslado || '');
        listaAlertas.push({
          id: `di-peso-${d.id}`,
          tipo: isRechazo ? 'rechazo' : 'discrepancia_peso',
          gravedad: isRechazo ? 'critico' : 'advertencia',
          titulo: isRechazo ? `Incidencia/Rechazo en destino: ${d.numero_documento}` : `Discrepancia de báscula >5%: ${d.numero_documento}`,
          descripcion: isRechazo
            ? `Rechazado por ${d.gestor_razon_social}. Motivo: ${d.motivo_incidencia || 'No conformidad técnica'}.`
            : `Diferencia de ${d.diferencia_peso_kg > 0 ? '+' : ''}${d.diferencia_peso_kg} kg (${d.porcentaje_discrepancia}%) entre origen y destino.`,
          referencia: d.numero_documento,
          enlace: `/residuos/documentos-identificacion/${d.id}`,
          fecha: d.fecha_llegada_destino || d.fecha_documento
        });
      }
    });

    // Alertas de Contratos
    contracts.forEach(c => {
      const statusInfo = getContractEffectiveStatus(c);
      if (statusInfo.status === 'caducado' || statusInfo.isExpired) {
        contratosCaducadosCount++;
        listaAlertas.push({
          id: `contract-cad-${c.id}`,
          tipo: 'contrato_caducado',
          gravedad: 'critico',
          titulo: `Contrato de tratamiento caducado: ${c.numero_contrato}`,
          descripcion: `Venció el ${c.fecha_fin}. Los traslados amparados bajo este contrato no son válidos normativamente.`,
          referencia: c.numero_contrato,
          enlace: `/residuos/contratos/${c.id}`,
          fecha: c.fecha_fin
        });
      } else if (c.estado === 'vigente' && c.fecha_fin) {
        const daysLeft = Math.ceil((new Date(c.fecha_fin).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= 60) {
          contratosPorVencerCount++;
          listaAlertas.push({
            id: `contract-exp-${c.id}`,
            tipo: 'contrato_proximo',
            gravedad: 'advertencia',
            titulo: `Contrato próximo a vencer (${daysLeft} días): ${c.numero_contrato}`,
            descripcion: `Vence el ${c.fecha_fin}. Se recomienda iniciar la renovación con el gestor destinatario.`,
            referencia: c.numero_contrato,
            enlace: `/residuos/contratos/${c.id}`,
            fecha: c.fecha_fin
          });
        }
      }
    });

    // Alertas de Autorizaciones Ambientales
    auths.forEach(a => {
      if (!a.es_indefinida && a.fecha_vencimiento) {
        if (a.fecha_vencimiento < todayStr) {
          autorizacionesPorVencerCount++;
          listaAlertas.push({
            id: `auth-venc-${a.id}`,
            tipo: 'autorizacion_vencida',
            gravedad: 'critico',
            titulo: `Autorización ambiental vencida: ${a.numero_autorizacion}`,
            descripcion: `${a.titulo} venció el ${a.fecha_vencimiento}. Requiere actualización legal inmediata.`,
            referencia: a.numero_autorizacion,
            enlace: `/residuos/empresas`,
            fecha: a.fecha_vencimiento
          });
        }
      }
    });

    // 2. MÉTRICAS DE RESIDUOS Y TOP LER
    let totalToneladas = 0;
    let toneladasPeligrosas = 0;
    let toneladasNoPeligrosas = 0;
    const lerMap = new Map<string, { codigo_ler: string; descripcion: string; toneladas: number; peligroso: boolean }>();

    dis.forEach(d => {
      const isCompletado = d.estado === 'completado' || ['aceptado', 'tratado'].includes(d.estado_traslado || '');
      if (isCompletado) {
        let ton = 0;
        if (d.peso_destino_kg && d.peso_destino_kg > 0) {
          ton = Number(d.peso_destino_kg) / 1000;
        } else if (d.peso_origen_kg && d.peso_origen_kg > 0) {
          ton = Number(d.peso_origen_kg) / 1000;
        } else if (d.unidad === 'kg') {
          ton = (d.cantidad || 0) / 1000;
        } else {
          ton = d.cantidad || 0;
        }

        totalToneladas += ton;
        const esPeligroso = d.peligrosidad === 'peligroso' || d.codigo_ler.includes('*');

        if (esPeligroso) {
          toneladasPeligrosas += ton;
        } else {
          toneladasNoPeligrosas += ton;
        }

        const lerKey = d.codigo_ler || 'Sin LER';
        if (!lerMap.has(lerKey)) {
          lerMap.set(lerKey, {
            codigo_ler: lerKey,
            descripcion: d.descripcion_residuo || '',
            toneladas: ton,
            peligroso: esPeligroso
          });
        } else {
          const item = lerMap.get(lerKey)!;
          item.toneladas += ton;
        }
      }
    });

    const topLER = Array.from(lerMap.values())
      .sort((a, b) => b.toneladas - a.toneladas)
      .slice(0, 5)
      .map(item => ({
        ...item,
        toneladas: Number(item.toneladas.toFixed(3)),
        porcentaje: totalToneladas > 0 ? Number(((item.toneladas / totalToneladas) * 100).toFixed(1)) : 0
      }));

    // 3. MÉTRICAS DE OPERACIONES COMERCIALES
    let facturacionVenta = 0;
    let costesTotales = 0;
    let margenBrutoTotal = 0;
    let operacionesAbiertas = 0;
    let totalTonComercial = 0;

    ops.forEach(op => {
      if (['abierta', 'en_transito'].includes(op.estado)) {
        operacionesAbiertas++;
      }
      facturacionVenta += Number(op.ingreso_venta_total) || 0;
      costesTotales += (Number(op.coste_compra_total) || 0) + (Number(op.coste_transporte) || 0) + (Number(op.otros_costes) || 0);
      margenBrutoTotal += Number(op.margen_bruto_total) || 0;
      const ton = Number(op.cantidad_real_t && op.cantidad_real_t > 0 ? op.cantidad_real_t : op.cantidad_estimada_t) || 0;
      totalTonComercial += ton;
    });

    const margenMedioTon = totalTonComercial > 0 ? margenBrutoTotal / totalTonComercial : 0;
    const rentabilidadPorcentaje = facturacionVenta > 0 ? (margenBrutoTotal / facturacionVenta) * 100 : 0;

    return {
      alertas: {
        totalCriticas: listaAlertas.filter(a => a.gravedad === 'critico').length,
        totalAdvertencias: listaAlertas.filter(a => a.gravedad === 'advertencia').length,
        lista: listaAlertas.slice(0, 8),
        disEnTransitoCount,
        disDiscrepanciaCount,
        contratosCaducadosCount,
        contratosPorVencerCount,
        autorizacionesPorVencerCount
      },
      residuos: {
        totalToneladas: Number(totalToneladas.toFixed(3)),
        toneladasPeligrosas: Number(toneladasPeligrosas.toFixed(3)),
        toneladasNoPeligrosas: Number(toneladasNoPeligrosas.toFixed(3)),
        totalDIs: dis.length,
        disCompletados: dis.filter(d => d.estado === 'completado').length,
        topLER
      },
      comercial: {
        totalOperaciones: ops.length,
        operacionesAbiertas,
        facturacionVenta: Number(facturacionVenta.toFixed(2)),
        costesTotales: Number(costesTotales.toFixed(2)),
        margenBrutoTotal: Number(margenBrutoTotal.toFixed(2)),
        margenMedioTon: Number(margenMedioTon.toFixed(2)),
        rentabilidadPorcentaje: Number(rentabilidadPorcentaje.toFixed(1))
      }
    };
  },

  /**
   * Obtener estadísticas básicas para compatibilidad
   */
  async getDashboardStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const [gestoresRes, carriersRes, diRes] = await Promise.all([
      supabase.from('treatment_managers').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('activo', true),
      supabase.from('carriers').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('activo', true),
      supabase.from('identification_documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    ]);

    const { data: diData } = await supabase
      .from('identification_documents')
      .select('cantidad, unidad, peso_destino_kg, peso_origen_kg')
      .eq('user_id', user.id);

    let totalWeightTonnes = 0;
    diData?.forEach(di => {
      let weight = 0;
      if (di.peso_destino_kg) weight = di.peso_destino_kg / 1000;
      else if (di.peso_origen_kg) weight = di.peso_origen_kg / 1000;
      else if (di.unidad === 'kg' || di.unidad === 'litros') weight = (di.cantidad || 0) / 1000;
      else weight = di.cantidad || 0;
      totalWeightTonnes += weight;
    });

    return {
      suppliers: (gestoresRes.count || 0) + (carriersRes.count || 0),
      gestores: gestoresRes.count || 0,
      carriers: carriersRes.count || 0,
      diTotal: diRes.count || 0,
      totalWasteTonnes: totalWeightTonnes.toFixed(2),
    };
  },

  /**
   * Obtener datos para el gráfico de producción mensual
   */
  async getMonthlyWasteData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const currentYear = new Date().getFullYear();
    const { data } = await supabase
      .from('identification_documents')
      .select('cantidad, unidad, peso_destino_kg, peso_origen_kg, fecha_documento')
      .eq('user_id', user.id)
      .gte('fecha_documento', `${currentYear}-01-01`)
      .order('fecha_documento', { ascending: true });

    const monthlyData: { [key: string]: number } = {};
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    data?.forEach(di => {
      const date = new Date(di.fecha_documento);
      const monthLabel = monthNames[date.getMonth()];

      let weight = 0;
      if (di.peso_destino_kg) weight = di.peso_destino_kg / 1000;
      else if (di.peso_origen_kg) weight = di.peso_origen_kg / 1000;
      else if (di.unidad === 'kg') weight = (di.cantidad || 0) / 1000;
      else weight = di.cantidad || 0;

      monthlyData[monthLabel] = (monthlyData[monthLabel] || 0) + weight;
    });

    return monthNames.map(name => ({
      name,
      value: parseFloat((monthlyData[name] || 0).toFixed(2))
    }));
  },

  /**
   * Obtener actividades recientes
   */
  async getRecentActivity() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: recentDIs } = await supabase
      .from('identification_documents')
      .select('id, numero_documento, fecha_documento, productor_razon_social, gestor_razon_social, estado, estado_traslado')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    return recentDIs || [];
  }
};

export default dashboardService;
