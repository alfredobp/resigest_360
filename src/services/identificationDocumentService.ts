// =====================================================
// IDENTIFICATION DOCUMENT SERVICE
// Servicio para gestión de Documentos de Identificación (DI)
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { IdentificationDocument } from '@/types/wasteManagement';

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
   * Obtener estadísticas de documentos
   */
  async getStats(): Promise<{
    total: number;
    borradores: number;
    pendientes: number;
    completados: number;
    cancelados: number;
  }> {
    const documents = await this.getAll();
    
    return {
      total: documents.length,
      borradores: documents.filter(d => d.estado === 'borrador').length,
      pendientes: documents.filter(d => d.estado === 'pendiente-firma').length,
      completados: documents.filter(d => d.estado === 'completado').length,
      cancelados: documents.filter(d => d.estado === 'cancelado').length,
    };
  },
};

export default identificationDocumentService;
