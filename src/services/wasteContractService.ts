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
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
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
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
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
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
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
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
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
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
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
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .single();

    if (error) {
      throw new Error(`Error al crear contrato: ${error.message}`);
    }

    return data as WasteContract;
  },

  /**
   * Obtener contrato por token de firma pública
   */
  async getBySigningToken(token: string): Promise<WasteContract | null> {
    const { data, error } = await supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .eq('signing_token', token)
      .single();

    if (error) {
      throw new Error(`Error al obtener contrato por token: ${error.message}`);
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
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
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
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error al subir documento: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
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
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
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
  /**
   * Firmar contrato digitalmente
   */
  async signContract(
    id: number,
    signatureBase64: string,
    role: 'productor' | 'gestor'
  ): Promise<WasteContract> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    // 1. Convertir Base64 a Blob
    const base64Data = signatureBase64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // 2. Subir a Supabase Storage (busquet 'signatures' o similar)
    const fileName = `signature-${role}-${id}-${Date.now()}.png`;
    const filePath = `contracts/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images') // Reutilizamos el bucket de imagenes por ahora
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Error al subir firma: ${uploadError.message}`);
    }

    // 3. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // 4. Actualizar registro del contrato
    const now = new Date().toISOString();
    const updateData: any = {};

    if (role === 'productor') {
      updateData.firma_productor_url = publicUrl;
      updateData.fecha_firma_productor = now;
    } else {
      updateData.firma_gestor_url = publicUrl;
      updateData.fecha_firma_gestor = now;
    }

    return this.update(id, updateData);
  },

  /**
   * Firmar contrato digitalmente usando un token público
   */
  async signContractByToken(
    token: string,
    signatureBase64: string,
    role: 'productor' | 'gestor'
  ): Promise<WasteContract> {
    // 1. Obtener el contrato por token para saber el ID
    const contract = await this.getBySigningToken(token);
    if (!contract) {
      throw new Error('Contrato no encontrado o token inválido');
    }

    // 2. Procesar la firma (mismo proceso que signContract pero sin auth check)
    const base64Data = signatureBase64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const fileName = `signature-public-${role}-${contract.id}-${Date.now()}.png`;
    const filePath = `contracts/${contract.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Error al subir firma: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // 3. Actualizar registro del contrato usando el token (ya que el usuario no está autenticado)
    const now = new Date().toISOString();
    const updateData: any = {};

    if (role === 'productor') {
      updateData.firma_productor_url = publicUrl;
      updateData.fecha_firma_productor = now;
    } else {
      updateData.firma_gestor_url = publicUrl;
      updateData.fecha_firma_gestor = now;
    }

    const { data, error: updateError } = await supabase
      .from('waste_contracts')
      .update(updateData)
      .eq('signing_token', token)
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar firma: ${updateError.message}`);
    }

    return data as WasteContract;
  },
};

export default wasteContractService;
