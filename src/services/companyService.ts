// =====================================================
// COMPANY SERVICE
// Servicio para gestión de empresas en el sistema de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { Company, CompanyFormData } from '@/types/wasteManagement';

const supabase = createClient();

export const companyService = {
  /**
   * Obtener la empresa del usuario actual
   * Un usuario solo puede tener una empresa activa
   */
  async getUserCompany(): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No hay empresa registrada
        return null;
      }
      throw new Error(`Error al obtener empresa: ${error.message}`);
    }

    return data as Company;
  },

  /**
   * Obtener empresa por ID
   */
  async getById(id: number): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener empresa: ${error.message}`);
    }

    return data as Company;
  },

  /**
   * Obtener todas las empresas del usuario (incluyendo inactivas)
   */
  async getAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener empresas: ${error.message}`);
    }

    return data as Company[];
  },

  /**
   * Obtener empresas por tipo (para seleccionar gestores, transportistas, etc.)
   */
  async getByType(tipo: string): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tipo_empresa', tipo)
      .eq('activo', true)
      .order('razon_social', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener empresas: ${error.message}`);
    }

    return data as Company[];
  },

  /**
   * Buscar empresas por texto (razón social, CIF, NIMA)
   */
  async search(query: string): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .or(`razon_social.ilike.%${query}%,cif.ilike.%${query}%,nima.ilike.%${query}%`)
      .eq('activo', true)
      .order('razon_social', { ascending: true })
      .limit(10);

    if (error) {
      throw new Error(`Error al buscar empresas: ${error.message}`);
    }

    return data as Company[];
  },

  /**
   * Crear nueva empresa
   */
  async create(companyData: CompanyFormData): Promise<Company> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        user_id: userData.user.id,
        activo: companyData.activo ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear empresa: ${error.message}`);
    }

    return data as Company;
  },

  /**
   * Actualizar empresa existente
   */
  async update(id: number, companyData: Partial<CompanyFormData>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar empresa: ${error.message}`);
    }

    return data as Company;
  },

  /**
   * Eliminar empresa (soft delete - marca como inactiva)
   */
  async softDelete(id: number): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al desactivar empresa: ${error.message}`);
    }
  },

  /**
   * Eliminar empresa permanentemente
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar empresa: ${error.message}`);
    }
  },

  /**
   * Subir logo de empresa a Supabase Storage
   */
  async uploadLogo(file: File, companyId: number): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.user.id}-company-${companyId}-${Date.now()}.${fileExt}`;
    const filePath = `company-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error al subir logo: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * Verificar si el usuario ya tiene una empresa registrada
   */
  async hasCompany(): Promise<boolean> {
    const company = await this.getUserCompany();
    return company !== null;
  },

  /**
   * Validar CIF (formato básico español)
   */
  validateCIF(cif: string): boolean {
    const cifRegex = /^[A-Z]\d{8}$/;
    return cifRegex.test(cif);
  },

  /**
   * Validar NIMA (12 caracteres alfanuméricos)
   */
  validateNIMA(nima: string): boolean {
    const nimaRegex = /^[A-Z0-9]{12}$/;
    return nimaRegex.test(nima);
  },
};

export default companyService;
