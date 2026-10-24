// =====================================================
// ENVIRONMENTAL AUTHORIZATION SERVICE
// Servicio para gestión de autorizaciones ambientales y matriz LER
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type {
  EnvironmentalAuthorization,
  EnvironmentalAuthorizationFormData,
} from '@/types/wasteManagement';

const supabase = createClient();

export interface AuthorizedScopeResult {
  hasAnyAuthorizationConfigured: boolean;
  isAuthorized: boolean;
  authorizations: EnvironmentalAuthorization[];
  authorizedLers: Record<string, string[]>; // Map LER -> [operaciones] (e.g. '15 01 01' -> ['R03', 'R13'])
  lerDescriptions: Record<string, string>;
}

export const authorizationService = {
  /**
   * Obtener todas las autorizaciones del usuario con sus códigos LER asociados
   */
  async getAll(): Promise<EnvironmentalAuthorization[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('environmental_authorizations')
      .select('*, company:companies(*), production_center:production_centers(*), waste_codes:authorization_waste_codes(*)')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener autorizaciones: ${error.message}`);
    }

    return (data || []) as EnvironmentalAuthorization[];
  },

  /**
   * Obtener autorizaciones por ID de empresa (gestor)
   */
  async getByCompany(companyId: number): Promise<EnvironmentalAuthorization[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('environmental_authorizations')
      .select('*, production_center:production_centers(*), waste_codes:authorization_waste_codes(*)')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener autorizaciones de la empresa: ${error.message}`);
    }

    return (data || []) as EnvironmentalAuthorization[];
  },

  /**
   * Obtener alcance autorizado para una empresa/instalación en una fecha específica
   */
  async getAuthorizedScope(
    companyId: number,
    centerId?: number | null,
    transferDateStr?: string
  ): Promise<AuthorizedScopeResult> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        hasAnyAuthorizationConfigured: false,
        isAuthorized: true,
        authorizations: [],
        authorizedLers: {},
        lerDescriptions: {},
      };
    }

    try {
      let query = supabase
        .from('environmental_authorizations')
        .select('*, waste_codes:authorization_waste_codes(*)')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .eq('activo', true);

      // Si se especifica centro, incluir autorizaciones de ese centro o generales de la empresa
      if (centerId) {
        query = query.or(`production_center_id.eq.${centerId},production_center_id.is.null`);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return {
          hasAnyAuthorizationConfigured: false,
          isAuthorized: true,
          authorizations: [],
          authorizedLers: {},
          lerDescriptions: {},
        };
      }

      const checkDate = transferDateStr ? new Date(transferDateStr) : new Date();

      // Filtrar autorizaciones vigentes
      const activeAuths = (data as EnvironmentalAuthorization[]).filter((auth) => {
        if (auth.es_indefinida) return true;
        if (!auth.fecha_vencimiento) return true;
        const vencimiento = new Date(auth.fecha_vencimiento);
        return vencimiento >= checkDate;
      });

      const authorizedLers: Record<string, string[]> = {};
      const lerDescriptions: Record<string, string> = {};

      for (const auth of activeAuths) {
        if (Array.isArray(auth.waste_codes)) {
          for (const item of auth.waste_codes) {
            const cleanLer = item.codigo_ler.trim();
            if (!authorizedLers[cleanLer]) {
              authorizedLers[cleanLer] = [];
            }
            if (Array.isArray(item.operaciones_tratamiento)) {
              for (const op of item.operaciones_tratamiento) {
                const normOp = op.trim().toUpperCase();
                if (!authorizedLers[cleanLer].includes(normOp)) {
                  authorizedLers[cleanLer].push(normOp);
                }
              }
            }
            if (item.descripcion_ler && !lerDescriptions[cleanLer]) {
              lerDescriptions[cleanLer] = item.descripcion_ler;
            }
          }
        }
      }

      return {
        hasAnyAuthorizationConfigured: data.length > 0,
        isAuthorized: activeAuths.length > 0,
        authorizations: activeAuths,
        authorizedLers,
        lerDescriptions,
      };
    } catch (err) {
      console.warn('Error al verificar alcance de autorización ambiental:', err);
      return {
        hasAnyAuthorizationConfigured: false,
        isAuthorized: true,
        authorizations: [],
        authorizedLers: {},
        lerDescriptions: {},
      };
    }
  },

  /**
   * Crear nueva autorización con sus códigos LER
   */
  async create(formData: EnvironmentalAuthorizationFormData): Promise<EnvironmentalAuthorization> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { waste_codes, ...authData } = formData;

    const { data, error } = await supabase
      .from('environmental_authorizations')
      .insert({
        ...authData,
        user_id: user.id,
        activo: formData.activo ?? true,
        es_indefinida: formData.es_indefinida ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al registrar autorización: ${error.message}`);
    }

    const createdAuth = data as EnvironmentalAuthorization;

    // Insertar códigos LER asociados
    if (waste_codes && waste_codes.length > 0) {
      const recordsToInsert = waste_codes.map((wc) => ({
        authorization_id: createdAuth.id,
        codigo_ler: wc.codigo_ler.trim(),
        descripcion_ler: wc.descripcion_ler || '',
        operaciones_tratamiento: wc.operaciones_tratamiento || [],
        capacidad_anual_toneladas: wc.capacidad_anual_toneladas || null,
      }));

      const { error: wasteErr } = await supabase
        .from('authorization_waste_codes')
        .insert(recordsToInsert);

      if (wasteErr) {
        console.error('Error al registrar códigos de residuo de la autorización:', wasteErr);
      }
    }

    return createdAuth;
  },

  /**
   * Actualizar autorización existente
   */
  async update(
    id: number,
    formData: EnvironmentalAuthorizationFormData
  ): Promise<EnvironmentalAuthorization> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { waste_codes, ...authData } = formData;

    const { data, error } = await supabase
      .from('environmental_authorizations')
      .update({
        ...authData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar autorización: ${error.message}`);
    }

    // Reemplazar códigos LER
    if (waste_codes !== undefined) {
      await supabase
        .from('authorization_waste_codes')
        .delete()
        .eq('authorization_id', id);

      if (waste_codes.length > 0) {
        const recordsToInsert = waste_codes.map((wc) => ({
          authorization_id: id,
          codigo_ler: wc.codigo_ler.trim(),
          descripcion_ler: wc.descripcion_ler || '',
          operaciones_tratamiento: wc.operaciones_tratamiento || [],
          capacidad_anual_toneladas: wc.capacidad_anual_toneladas || null,
        }));

        await supabase
          .from('authorization_waste_codes')
          .insert(recordsToInsert);
      }
    }

    return data as EnvironmentalAuthorization;
  },

  /**
   * Eliminar autorización (soft delete)
   */
  async delete(id: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('environmental_authorizations')
      .update({ activo: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Error al eliminar autorización: ${error.message}`);
    }
  },
};

export default authorizationService;
