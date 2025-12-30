// =====================================================
// WASTE CONTRACT SERVICE
// Servicio para gestión de contratos de tratamiento de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { WasteContract, WasteContractFormData } from '@/types/wasteManagement';

const supabase = createClient();

export const wasteContractService = {
  /**
   * Obtener todos los contratos del usuario
   */
  async getAll(): Promise<WasteContract[]> {
    const { data, error } = await supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*)
      `)
      .order('fecha_contrato', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener contratos: ${error.message}`);
    }

    return data as WasteContract[];
  },

  /**
   * Obtener contrato por ID
   */
  async getById(id: number): Promise<WasteContract | null> {
    const { data, error } = await supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener contrato: ${error.message}`);
    }

    return data as WasteContract;
  },

  /**
   * Obtener contratos por estado
   */
  async getByStatus(estado: string): Promise<WasteContract[]> {
    const { data, error } = await supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*)
      `)
      .eq('estado', estado)
      .order('fecha_contrato', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener contratos: ${error.message}`);
    }

    return data as WasteContract[];
  },

  /**
   * Obtener contratos vigentes (activos)
   */
  async getActive(): Promise<WasteContract[]> {
    return this.getByStatus('vigente');
  },

  /**
   * Obtener contratos de una empresa específica
   */
  async getByCompany(companyId: number): Promise<WasteContract[]> {
    const { data, error } = await supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*)
      `)
      .eq('company_id', companyId)
      .order('fecha_contrato', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener contratos: ${error.message}`);
    }

    return data as WasteContract[];
  },

  /**
   * Buscar contratos por número o descripción
   */
  async search(query: string): Promise<WasteContract[]> {
    const { data, error } = await supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*)
      `)
      .or(`numero_contrato.ilike.%${query}%,descripcion_residuos.ilike.%${query}%`)
      .order('fecha_contrato', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Error al buscar contratos: ${error.message}`);
    }

    return data as WasteContract[];
  },

  /**
   * Crear nuevo contrato
   */
  async create(contractData: WasteContractFormData): Promise<WasteContract> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('waste_contracts')
      .insert({
        ...contractData,
        user_id: userData.user.id,
        estado: contractData.estado || 'borrador',
        moneda: contractData.moneda || 'EUR',
        unidad_cantidad: contractData.unidad_cantidad || 'toneladas',
      })
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(`Error al crear contrato: ${error.message}`);
    }

    return data as WasteContract;
  },

  /**
   * Actualizar contrato existente
   */
  async update(id: number, contractData: Partial<WasteContractFormData>): Promise<WasteContract> {
    const { data, error } = await supabase
      .from('waste_contracts')
      .update(contractData)
      .eq('id', id)
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(`Error al actualizar contrato: ${error.message}`);
    }

    return data as WasteContract;
  },

  /**
   * Eliminar contrato
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('waste_contracts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar contrato: ${error.message}`);
    }
  },

  /**
   * Cambiar estado del contrato
   */
  async updateStatus(id: number, estado: 'borrador' | 'vigente' | 'finalizado' | 'cancelado'): Promise<WasteContract> {
    return this.update(id, { estado });
  },

  /**
   * Marcar contrato como vigente
   */
  async activate(id: number): Promise<WasteContract> {
    return this.updateStatus(id, 'vigente');
  },

  /**
   * Finalizar contrato
   */
  async finalize(id: number): Promise<WasteContract> {
    return this.updateStatus(id, 'finalizado');
  },

  /**
   * Cancelar contrato
   */
  async cancel(id: number): Promise<WasteContract> {
    return this.updateStatus(id, 'cancelado');
  },

  /**
   * Subir documento PDF del contrato firmado
   */
  async uploadDocument(file: File, contractId: number): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.user.id}-contract-${contractId}-${Date.now()}.${fileExt}`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error al subir documento: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Actualizar contrato con la URL del documento
    await this.update(contractId, { documento_url: publicUrl });

    return publicUrl;
  },

  /**
   * Generar número de contrato automático
   */
  generateContractNumber(companyId: number): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `CT-${companyId}-${year}-${timestamp}`;
  },

  /**
   * Validar fechas del contrato
   */
  validateDates(fechaInicio: string, fechaFin: string): boolean {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return fin > inicio;
  },

  /**
   * Verificar si el contrato está vigente actualmente
   */
  isCurrentlyActive(contract: WasteContract): boolean {
    if (contract.estado !== 'vigente') return false;
    
    const now = new Date();
    
    if (contract.fecha_inicio) {
      const inicio = new Date(contract.fecha_inicio);
      if (now < inicio) return false;
    }
    
    if (contract.fecha_fin) {
      const fin = new Date(contract.fecha_fin);
      if (now > fin) return false;
    }
    
    return true;
  },

  /**
   * Obtener contratos próximos a vencer (30 días)
   */
  async getExpiringSoon(): Promise<WasteContract[]> {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const { data, error } = await supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*)
      `)
      .eq('estado', 'vigente')
      .lte('fecha_fin', thirtyDaysFromNow.toISOString())
      .gte('fecha_fin', now.toISOString())
      .order('fecha_fin', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener contratos por vencer: ${error.message}`);
    }

    return data as WasteContract[];
  },
};

export default wasteContractService;
