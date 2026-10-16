// =====================================================
// IDENTIFICATION DOCUMENT SERVICE
// Servicio para gestión de Documentos de Identificación (DI)
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { syncEntryFromDI } from '@/services/chronologicalRegistryService';
import type {
  IdentificationDocument,
  EstadoTraslado,
  RecordDeparturePayload,
  RecordReceptionPayload,
  RecordIncidentPayload,
  CompleteTreatmentPayload,
} from '@/types/wasteManagement';

const supabase = createClient();

export const identificationDocumentService = {
  /**
   * Generar número de documento de identificación
   * Formato: NIMA + AÑO + CORRELATIVO
   */
  generateDocumentNumber(nima: string): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
    return `${nima}${year}${random}`;
  },

  /**
   * Obtener todos los documentos del usuario
   */
  async getAll(): Promise<IdentificationDocument[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('identification_documents')
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        production_center:production_centers(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .eq('user_id', user.id)
      .order('fecha_documento', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener documentos: ${error.message}`);
    }

    return data as IdentificationDocument[];
  },

  /**
   * Obtener documento por ID
   */
  async getById(id: number): Promise<IdentificationDocument> {
    const { data, error } = await supabase
      .from('identification_documents')
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        production_center:production_centers(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener documento: ${error.message}`);
    }

    return data as IdentificationDocument;
  },

  /**
   * Obtener documentos por contrato
   */
  async getByContract(contractId: number): Promise<IdentificationDocument[]> {
    const { data, error } = await supabase
      .from('identification_documents')
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .eq('contract_id', contractId)
      .order('fecha_documento', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener documentos: ${error.message}`);
    }

    return data as IdentificationDocument[];
  },

  /**
   * Crear nuevo documento
   */
  async create(documentData: Partial<IdentificationDocument>): Promise<IdentificationDocument> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('identification_documents')
      .insert({
        ...documentData,
        user_id: user.id,
      })
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        production_center:production_centers(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .single();

    if (error) {
      throw new Error(`Error al crear documento: ${error.message}`);
    }

    return data as IdentificationDocument;
  },

  /**
   * Actualizar documento
   */
  async update(id: number, documentData: Partial<IdentificationDocument>): Promise<IdentificationDocument> {
    const { data, error } = await supabase
      .from('identification_documents')
      .update(documentData)
      .eq('id', id)
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .single();

    if (error) {
      throw new Error(`Error al actualizar documento: ${error.message}`);
    }

    return data as IdentificationDocument;
  },

  /**
   * Eliminar documento
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('identification_documents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar documento: ${error.message}`);
    }
  },

  /**
   * Actualizar estado del documento
   */
  async updateStatus(
    id: number,
    estado: 'borrador' | 'pendiente-firma' | 'completado' | 'cancelado'
  ): Promise<IdentificationDocument> {
    return this.update(id, { estado });
  },

  /**
   * Firmar documento (productor, gestor o transportista)
   */
  async signDocument(
    id: number,
    role: 'productor' | 'gestor' | 'transportista'
  ): Promise<IdentificationDocument> {
    const today = new Date().toISOString().split('T')[0];

    const updateData: Partial<IdentificationDocument> = {};

    if (role === 'productor') {
      updateData.firmado_productor = true;
      updateData.fecha_firma_productor = today;
    } else if (role === 'gestor') {
      updateData.firmado_gestor = true;
      updateData.fecha_firma_gestor = today;
    } else if (role === 'transportista') {
      updateData.firmado_transportista = true;
      updateData.fecha_firma_transportista = today;
    }

    return this.update(id, updateData);
  },

  /**
   * 1. Iniciar Traslado / Registrar Salida (Transportista)
   */
  async recordDeparture(id: number, payload: RecordDeparturePayload): Promise<IdentificationDocument> {
    const now = new Date().toISOString();
    return this.update(id, {
      ...payload,
      estado_traslado: 'en_transito',
      firmado_transportista: true,
      fecha_firma_transportista: payload.fecha_salida || now,
    });
  },

  /**
   * 2. Registrar Recepción y Pesada en Báscula de Destino (Gestor)
   */
  async recordReception(id: number, payload: RecordReceptionPayload): Promise<IdentificationDocument> {
    const doc = await this.getById(id);
    const now = new Date().toISOString();

    const pesoOrigen = doc.peso_origen_kg || (doc.unidad === 'toneladas' ? doc.cantidad * 1000 : doc.cantidad) || 0;
    const pesoDestino = payload.peso_destino_kg;
    const diferencia = pesoDestino - pesoOrigen;
    const porcentaje = pesoOrigen > 0 ? (diferencia / pesoOrigen) * 100 : 0;

    let nuevoEstadoTraslado: EstadoTraslado = 'recepcionado';
    if (payload.resultado_recepcion === 'aceptado') {
      nuevoEstadoTraslado = 'aceptado';
    } else if (payload.resultado_recepcion === 'rechazado_parcial') {
      nuevoEstadoTraslado = 'rechazado_parcial';
    } else if (payload.resultado_recepcion === 'rechazado_total') {
      nuevoEstadoTraslado = 'rechazado_total';
    }

    const updated = await this.update(id, {
      ...payload,
      peso_origen_kg: pesoOrigen,
      diferencia_peso_kg: parseFloat(diferencia.toFixed(3)),
      porcentaje_discrepancia: parseFloat(porcentaje.toFixed(2)),
      estado_traslado: nuevoEstadoTraslado,
      firmado_gestor: true,
      fecha_firma_gestor: payload.fecha_llegada_destino || now,
    });

    if (nuevoEstadoTraslado === 'aceptado') {
      try {
        await syncEntryFromDI(updated);
      } catch (e) {
        console.warn('Advertencia: no se pudo sincronizar automáticamente con el archivo cronológico:', e);
      }
    }

    return updated;
  },

  /**
   * 3. Registrar Incidencia o Rechazo
   */
  async recordIncident(id: number, payload: RecordIncidentPayload): Promise<IdentificationDocument> {
    return this.update(id, {
      tipo_incidencia: payload.tipo_incidencia,
      motivo_incidencia: payload.motivo_incidencia,
      resultado_recepcion: payload.resultado_recepcion,
      cantidad_rechazada_kg: payload.cantidad_rechazada_kg,
      estado_traslado: payload.resultado_recepcion,
    });
  },

  /**
   * 4. Certificar Tratamiento y Cierre (RD 553/2020)
   */
  async completeTreatment(id: number, payload: CompleteTreatmentPayload): Promise<IdentificationDocument> {
    const now = new Date().toISOString();
    const updated = await this.update(id, {
      operacion_tratamiento: payload.operacion_tratamiento,
      descripcion_tratamiento: payload.descripcion_tratamiento,
      fecha_tratamiento: payload.fecha_tratamiento || now,
      estado_traslado: 'tratado',
      estado: 'completado',
      notas: payload.notas,
    });

    try {
      await syncEntryFromDI(updated);
    } catch (e) {
      console.warn('Advertencia: no se pudo sincronizar automáticamente con el archivo cronológico:', e);
    }

    return updated;
  },

  /**
   * Obtener estadísticas de documentos
   */
  async getStats(): Promise<{
    total: number;
    borradores: number;
    enTransito: number;
    recepcionados: number;
    aceptados: number;
    incidencias: number;
    tratados: number;
  }> {
    const documents = await this.getAll();

    return {
      total: documents.length,
      borradores: documents.filter(d => !d.estado_traslado || d.estado_traslado === 'borrador').length,
      enTransito: documents.filter(d => d.estado_traslado === 'en_transito').length,
      recepcionados: documents.filter(d => d.estado_traslado === 'recepcionado').length,
      aceptados: documents.filter(d => d.estado_traslado === 'aceptado').length,
      incidencias: documents.filter(d => d.estado_traslado === 'rechazado_parcial' || d.estado_traslado === 'rechazado_total').length,
      tratados: documents.filter(d => d.estado_traslado === 'tratado').length,
    };
  },
};

/**
 * Helper con metadatos de presentación del ciclo de vida del traslado
 */
export function getTrackingStatusMeta(doc: IdentificationDocument): {
  key: EstadoTraslado;
  label: string;
  badgeColor: 'light' | 'info' | 'warning' | 'success' | 'error';
  step: number;
  hasDiscrepancy: boolean;
  discrepancyMessage?: string;
} {
  const estado: EstadoTraslado = doc.estado_traslado || 'borrador';

  const pesoOrigen = doc.peso_origen_kg || (doc.unidad === 'toneladas' ? doc.cantidad * 1000 : doc.cantidad) || 0;
  const pesoDestino = doc.peso_destino_kg;
  let hasDiscrepancy = false;
  let discrepancyMessage = undefined;

  if (pesoDestino !== undefined && pesoDestino !== null && pesoOrigen > 0) {
    const diff = Math.abs(pesoDestino - pesoOrigen);
    const pct = Math.abs((diff / pesoOrigen) * 100);
    if (pct > 5 || diff > 200) {
      hasDiscrepancy = true;
      discrepancyMessage = `Discrepancia de peso: ${(doc.diferencia_peso_kg || 0) > 0 ? '+' : ''}${doc.diferencia_peso_kg || 0} kg (${doc.porcentaje_discrepancia || 0}%)`;
    }
  }

  switch (estado) {
    case 'en_transito':
      return { key: estado, label: 'En Tránsito', badgeColor: 'info', step: 2, hasDiscrepancy, discrepancyMessage };
    case 'recepcionado':
      return { key: estado, label: 'Recepcionado en Báscula', badgeColor: 'warning', step: 3, hasDiscrepancy, discrepancyMessage };
    case 'aceptado':
      return { key: estado, label: 'Aceptado por Gestor', badgeColor: 'success', step: 4, hasDiscrepancy, discrepancyMessage };
    case 'rechazado_parcial':
      return { key: estado, label: 'Aceptado Parcial / Rechazo', badgeColor: 'warning', step: 4, hasDiscrepancy, discrepancyMessage };
    case 'rechazado_total':
      return { key: estado, label: 'Rechazo Total en Destino', badgeColor: 'error', step: 4, hasDiscrepancy, discrepancyMessage };
    case 'tratado':
      return { key: estado, label: 'Tratado y Cerrado', badgeColor: 'success', step: 5, hasDiscrepancy, discrepancyMessage };
    case 'borrador':
    default:
      return { key: 'borrador', label: 'Borrador / Registrado', badgeColor: 'light', step: 1, hasDiscrepancy, discrepancyMessage };
  }
}

export default identificationDocumentService;
