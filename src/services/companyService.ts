// =====================================================
// COMPANY SERVICE
// Servicio para gestión de empresas en el sistema de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import {
  getActiveCompanyCookie,
  sanitizeCompanySecrets,
  setActiveCompanyCookie,
} from '@/services/tenantContextService';
import { auditService } from './auditService';
import type { Company, CompanyFormData } from '@/types/wasteManagement';

const supabase = createClient();
const ACTIVE_COMPANY_STORAGE_KEY = 'resigest_active_company_id';

export const companyService = {
  /**
   * Lee o persiste el ID de empresa activa seleccionada por el usuario multiempresa.
   */
  getActiveCompanyId(): number | null {
    const fromCookie = getActiveCompanyCookie();
    if (fromCookie) return fromCookie;
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = Number(raw);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    } catch {
      return null;
    }
  },

  setActiveCompanyId(companyId: number | null): void {
    setActiveCompanyCookie(companyId);
    if (typeof window === 'undefined') return;
    try {
      if (companyId === null) {
        localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
      } else {
        localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, String(companyId));
      }
    } catch {
      // Ignorar errores de almacenamiento en entornos restringidos
    }
  },

  /**
   * Resuelve el contexto delegado (empresa activa, usuario target y datos de empresa activa)
   */
  async getDelegatedContext(userId: string): Promise<{
    activeId: number | null;
    targetUserId: string;
    activeCompany: Company | null;
  }> {
    const activeId = this.getActiveCompanyId();
    if (!activeId) {
      return { activeId: null, targetUserId: userId, activeCompany: null };
    }
    const activeCompany = await this.getUserCompany();
    const targetUserId = activeCompany?.user_id || userId;
    return { activeId, targetUserId, activeCompany };
  },

  /**
   * Lista todas las empresas marcadas como propias del tenant actual.
   */
  async getMyCompanies(): Promise<Company[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_my_company', true)
      .eq('activo', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener empresas propias: ${error.message}`);
    }

    return (data || []) as Company[];
  },

  /**
   * Obtener la empresa del usuario actual (empresa propia o activa seleccionada)
   */
  async getUserCompany(): Promise<Company | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const activeId = this.getActiveCompanyId();
    if (activeId) {
      const { data: activeComp, error: activeErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', activeId)
        .eq('user_id', user.id)
        .eq('activo', true)
        .maybeSingle();

      if (!activeErr && activeComp) {
        return activeComp as Company;
      }

      // Fallback para empresas clientes accesibles por membresía de consultoría (RLS has_company_access)
      const { data: memberComp, error: memberErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', activeId)
        .eq('activo', true)
        .maybeSingle();

      if (!memberErr && memberComp) {
        return sanitizeCompanySecrets(memberComp as Company, user.id);
      }
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
   * Obtener todos los contactos y empresas colaboradoras del usuario o de la empresa activa
   */
  async getAllContacts(): Promise<Company[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { activeId, targetUserId } = await this.getDelegatedContext(user.id);

    let query: any = supabase
      .from('companies')
      .select('*, production_centers(*)');

    if (activeId && targetUserId !== user.id) {
      query = query.or(`user_id.eq.${targetUserId},id.eq.${activeId}`);
    } else {
      query = query.eq('user_id', user.id);
    }

    query = query
      .eq('activo', true)
      .order('razon_social', { ascending: true });

    const { data, error } = await query;

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

    const { activeId, targetUserId } = await this.getDelegatedContext(user.id);

    let query: any = supabase
      .from('companies')
      .select('*');

    if (activeId && targetUserId !== user.id) {
      query = query.or(`user_id.eq.${targetUserId},id.eq.${activeId}`);
    } else {
      query = query.eq('user_id', user.id);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

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

    const { activeId, targetUserId } = await this.getDelegatedContext(user.id);

    let query: any = supabase
      .from('companies')
      .select('*, production_centers(*)');

    if (activeId && targetUserId !== user.id) {
      query = query.or(`user_id.eq.${targetUserId},id.eq.${activeId}`);
    } else {
      query = query.eq('user_id', user.id);
    }

    query = query
      .eq('activo', true)
      .order('razon_social', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener empresas por rol: ${error.message}`);
    }

    if (!data) return [];

    // Filtrar aquellas que desempeñan el rol (bien en roles array o en tipo_empresa legado)
    return (data as Company[]).filter((c) => {
      const hasInRoles = Array.isArray(c.roles) && c.roles.includes(role as any);
      const isTipo = c.tipo_empresa === role;
      const isTenant = c.user_id === targetUserId || c.user_id === user.id || (activeId ? c.id === activeId : false);
      return (hasInRoles || isTipo) && isTenant;
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
    const cleanQuery = query.replace(/[%_(),]/g, '').trim();
    if (!cleanQuery) return this.getAllContacts();

    const { activeId, targetUserId } = await this.getDelegatedContext(user?.id || '');

    let req = supabase
      .from('companies')
      .select('*, production_centers(*)')
      .or(`razon_social.ilike.%${cleanQuery}%,cif.ilike.%${cleanQuery}%,nima.ilike.%${cleanQuery}%,numero_autorizacion.ilike.%${cleanQuery}%`)
      .eq('activo', true)
      .order('razon_social', { ascending: true })
      .limit(30);

    if (user && targetUserId) {
      if (activeId && targetUserId !== user.id) {
        req = req.or(`user_id.eq.${targetUserId},id.eq.${activeId}`);
      } else {
        req = req.eq('user_id', user.id);
      }
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

    const { targetUserId, activeCompany } = await this.getDelegatedContext(userData.user.id);
    const normCif = companyData.cif.trim().toUpperCase();

    // Si se crea como empresa titular (is_my_company = true), asegurar unicidad global de titularidad
    if (companyData.is_my_company) {
      let ownerCheckQuery = supabase
        .from('companies')
        .select('id, user_id, razon_social')
        .eq('cif', normCif)
        .eq('is_my_company', true)
        .eq('activo', true);

      if (targetUserId) {
        ownerCheckQuery = ownerCheckQuery.neq('user_id', targetUserId);
      }

      const { data: existingOwner, error: ownerCheckError } = await ownerCheckQuery
        .limit(1)
        .maybeSingle();

      if (!ownerCheckError && existingOwner) {
        throw new Error(
          `Ya existe una empresa titular registrada con el CIF ${normCif}. Si perteneces a esta organización, solicita a su administrador una invitación de acceso a tu equipo.`
        );
      }
    }

    // Normalizar roles
    const roles = companyData.roles && companyData.roles.length > 0
      ? companyData.roles
      : (companyData.tipo_empresa ? [companyData.tipo_empresa] : ['productor']);

    const primaryType = roles[0] || companyData.tipo_empresa || 'productor';

    // Comprobar si ya existe una empresa con ese CIF para este usuario/ámbito tenant
    const { data: existing } = await supabase
      .from('companies')
      .select('id, roles')
      .eq('user_id', targetUserId)
      .eq('cif', normCif)
      .maybeSingle();

    if (existing?.id) {
      // Unificar roles si ya existía la empresa
      const existingRoles = Array.isArray(existing.roles) ? existing.roles : [];
      const mergedRoles = Array.from(new Set([...existingRoles, ...roles]));
      return this.update(existing.id, {
        ...companyData,
        cif: normCif,
        roles: mergedRoles as any,
      });
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        cif: normCif,
        user_id: targetUserId,
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

    const created = data as Company;

    await auditService.logAction({
      company_id: activeCompany?.id || created.id,
      entidad: 'empresa',
      entidad_id: created.id,
      accion: 'crear',
      detalles: {
        razon_social: created.razon_social,
        cif: created.cif,
        roles: created.roles,
        actor_id: userData.user.id,
        target_user_id: targetUserId,
        organization_id: activeCompany?.id || created.id,
      },
    });

    return created;
  },

  /**
   * Actualizar empresa existente
   */
  async update(id: number, companyData: Partial<CompanyFormData>): Promise<Company> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { activeId, targetUserId, activeCompany } = await this.getDelegatedContext(user.id);

    let updateQuery = supabase
      .from('companies')
      .update(companyData)
      .eq('id', id);

    if (activeId && targetUserId !== user.id) {
      updateQuery = updateQuery.or(`user_id.eq.${user.id},user_id.eq.${targetUserId}`);
    } else {
      updateQuery = updateQuery.eq('user_id', user.id);
    }

    const { data, error } = await updateQuery
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar empresa: ${error.message}`);
    }

    const updated = data as Company;

    await auditService.logAction({
      company_id: activeCompany?.id || updated.id,
      entidad: 'empresa',
      entidad_id: updated.id,
      accion: 'actualizar',
      detalles: {
        razon_social: updated.razon_social,
        cif: updated.cif,
        actor_id: user.id,
        target_user_id: targetUserId,
        organization_id: activeCompany?.id || updated.id,
      },
    });

    return updated;
  },

  /**
   * Eliminar empresa (soft delete - marca como inactiva)
   */
  async softDelete(id: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { activeId, targetUserId, activeCompany } = await this.getDelegatedContext(user.id);

    let delQuery = supabase
      .from('companies')
      .update({ activo: false })
      .eq('id', id);

    if (activeId && targetUserId !== user.id) {
      delQuery = delQuery.or(`user_id.eq.${user.id},user_id.eq.${targetUserId}`);
    } else {
      delQuery = delQuery.eq('user_id', user.id);
    }

    const { error } = await delQuery;

    if (error) {
      throw new Error(`Error al desactivar empresa: ${error.message}`);
    }

    await auditService.logAction({
      company_id: activeCompany?.id || id,
      entidad: 'empresa',
      entidad_id: id,
      accion: 'eliminar',
      detalles: {
        soft_delete: true,
        actor_id: user.id,
        target_user_id: targetUserId,
        organization_id: activeCompany?.id || id,
      },
    });
  },

  /**
   * Eliminar empresa permanentemente
   */
  async delete(id: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { activeId, targetUserId, activeCompany } = await this.getDelegatedContext(user.id);

    let delQuery = supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (activeId && targetUserId !== user.id) {
      delQuery = delQuery.or(`user_id.eq.${user.id},user_id.eq.${targetUserId}`);
    } else {
      delQuery = delQuery.eq('user_id', user.id);
    }

    const { error } = await delQuery;

    if (error) {
      throw new Error(`Error al eliminar empresa: ${error.message}`);
    }

    await auditService.logAction({
      company_id: activeCompany?.id || id,
      entidad: 'empresa',
      entidad_id: id,
      accion: 'eliminar',
      detalles: {
        soft_delete: false,
        actor_id: user.id,
        target_user_id: targetUserId,
        organization_id: activeCompany?.id || id,
      },
    });
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
   * Comprueba si un CIF está disponible para darse de alta como empresa titular (is_my_company).
   * Retorna available: false con un mensaje descriptivo si ya pertenece a otra cuenta titular.
   */
  async checkCifAvailability(cif: string): Promise<{ available: boolean; message?: string }> {
    const cleanCif = (cif || '').trim().toUpperCase();
    if (!cleanCif) {
      return { available: false, message: 'El CIF no puede estar vacío.' };
    }
    if (!this.validateCIF(cleanCif)) {
      return { available: false, message: 'El formato del CIF/NIF/NIE no es válido.' };
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;

      let query = supabase
        .from('companies')
        .select('id, user_id, razon_social')
        .eq('cif', cleanCif)
        .eq('is_my_company', true)
        .eq('activo', true);

      if (currentUserId) {
        query = query.neq('user_id', currentUserId);
      }

      const { data: existingOwner, error } = await query.limit(1).maybeSingle();

      if (error) {
        // En caso de degradación de red o fallo parcial en cliente, no bloquear prematuramente
        return { available: true };
      }

      if (existingOwner) {
        return {
          available: false,
          message: `Ya existe una empresa titular registrada con el CIF ${cleanCif}. Si perteneces a esta organización, solicita a su administrador una invitación de acceso a tu equipo.`,
        };
      }

      return { available: true };
    } catch {
      return { available: true };
    }
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
   * Validar NIMA oficial (10 dígitos numéricos: código provincial 01-52 + 8 dígitos)
   */
  validateNIMA(nima: string): boolean {
    if (!nima) return false;
    const clean = nima.trim();
    const nimaRegex = /^(0[1-9]|[1-4][0-9]|5[0-2])\d{8}$/;
    return nimaRegex.test(clean);
  },
};

export default companyService;
