// =====================================================
// COMPANY SERVICE
// Servicio para gestión de empresas en el sistema de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { Company, CompanyFormData } from '@/types/wasteManagement';

const supabase = createClient();

export const companyService = {
  /**
   * Obtener la empresa del usuario actual (empresa propia)
   */
  async getUserCompany(): Promise<Company | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Priorizar empresa marcada explícitamente como propia
    const { data: myComp, error: myCompErr } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_my_company', true)
      .eq('activo', true)
      .limit(1)
      .maybeSingle();

    if (!myCompErr && myComp) {
      return myComp as Company;
    }

    // Fallback: buscar la primera empresa creada de tipo productor o negociante
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener empresa: ${error.message}`);
    }

    return data as Company | null;
  },

  /**
   * Obtener empresa por ID
   */
  async getById(id: number): Promise<Company | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*, production_centers(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw new Error(`Error al obtener empresa: ${error.message}`);
    }

    return data as Company;
  },

  /**
   * Obtener todos los contactos y empresas colaboradoras del usuario
   */
  async getAllContacts(): Promise<Company[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*, production_centers(*)')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('razon_social', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener empresas: ${error.message}`);
    }

    return data as Company[];
  },

  /**
   * Obtener todas las empresas del usuario (incluyendo inactivas)
   */
  async getAll(): Promise<Company[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener empresas: ${error.message}`);
    }

    return data as Company[];
  },

  /**
   * Obtener empresas filtradas por rol específico (gestor, transportista, cliente, etc.)
   */
  async getByRole(role: string): Promise<Company[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Intentar consulta con soporte de array roles o tipo_empresa legado
    const { data, error } = await supabase
      .from('companies')
      .select('*, production_centers(*)')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('razon_social', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener empresas por rol: ${error.message}`);
    }

    if (!data) return [];

    // Filtrar aquellas que desempeñan el rol (bien en roles array o en tipo_empresa legado)
    return (data as Company[]).filter((c) => {
      const hasInRoles = Array.isArray(c.roles) && c.roles.includes(role as any);
      const isTipo = c.tipo_empresa === role;
      const isOwner = c.user_id === user.id;
      return (hasInRoles || isTipo) && isOwner;
    });
  },

  /**
   * Obtener empresas por tipo (para seleccionar gestores, transportistas, etc.)
   */
  async getByType(tipo: string): Promise<Company[]> {
    return this.getByRole(tipo);
  },

  /**
   * Buscar empresas por texto (razón social, CIF, NIMA, autorización)
   */
  async search(query: string): Promise<Company[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const cleanQuery = query.trim();
    if (!cleanQuery) return this.getAllContacts();

    let req = supabase
      .from('companies')
      .select('*, production_centers(*)')
      .or(`razon_social.ilike.%${cleanQuery}%,cif.ilike.%${cleanQuery}%,nima.ilike.%${cleanQuery}%,numero_autorizacion.ilike.%${cleanQuery}%`)
      .eq('activo', true)
      .order('razon_social', { ascending: true })
      .limit(30);

    if (user) {
      req = req.eq('user_id', user.id);
    }

    const { data, error } = await req;

    if (error) {
      throw new Error(`Error al buscar empresas: ${error.message}`);
    }

    return data as Company[];
  },

  /**
   * Crear nueva empresa o contacto
   */
  async create(companyData: CompanyFormData): Promise<Company> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    // Normalizar roles
    const roles = companyData.roles && companyData.roles.length > 0 
      ? companyData.roles 
      : (companyData.tipo_empresa ? [companyData.tipo_empresa] : ['productor']);

    const primaryType = roles[0] || companyData.tipo_empresa || 'productor';

    // Comprobar si ya existe una empresa con ese CIF para este usuario
    const { data: existing } = await supabase
      .from('companies')
      .select('id, roles')
      .eq('user_id', userData.user.id)
      .eq('cif', companyData.cif.trim())
      .maybeSingle();

    if (existing?.id) {
      // Unificar roles si ya existía la empresa
      const existingRoles = Array.isArray(existing.roles) ? existing.roles : [];
      const mergedRoles = Array.from(new Set([...existingRoles, ...roles]));
      return this.update(existing.id, {
        ...companyData,
        roles: mergedRoles as any,
      });
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        user_id: userData.user.id,
        tipo_empresa: primaryType,
        roles,
        is_my_company: companyData.is_my_company ?? false,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', id)
      .eq('user_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('companies')
      .update({ activo: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Error al desactivar empresa: ${error.message}`);
    }
  },

  /**
   * Eliminar empresa permanentemente
   */
  async delete(id: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

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
   * Validar CIF / NIF / NIE (formato oficial español)
   */
  validateCIF(cif: string): boolean {
    if (!cif) return false;
    const clean = cif.trim().toUpperCase();
    const nifRegex = /^[0-9]{8}[A-Z]$/;
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/;
    return nifRegex.test(clean) || nieRegex.test(clean) || cifRegex.test(clean);
  },

  /**
   * Validar NIMA (10 dígitos o 10-12 caracteres alfanuméricos)
   */
  validateNIMA(nima: string): boolean {
    if (!nima) return false;
    const clean = nima.trim().toUpperCase();
    const nimaRegex = /^[A-Z0-9]{10,12}$/;
    return nimaRegex.test(clean);
  },
};

export default companyService;
