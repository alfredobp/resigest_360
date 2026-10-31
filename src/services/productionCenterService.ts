// =====================================================
// PRODUCTION CENTER SERVICE
// Servicio para gestión de centros de producción
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { ProductionCenter, ProductionCenterFormData } from '@/types/wasteManagement';

const supabase = createClient();

export const productionCenterService = {
    /**
     * Obtener todos los centros de producción de una empresa
     */
    async getByCompanyId(companyId: number): Promise<ProductionCenter[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('production_centers')
            .select('*')
            .eq('company_id', companyId)
            .eq('user_id', user.id)
            .eq('activo', true)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Error al obtener centros de producción: ${error.message}`);
        }

        return data as ProductionCenter[];
    },

    /**
     * Obtener centro de producción por ID
     */
    async getById(id: number): Promise<ProductionCenter | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('production_centers')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) {
            throw new Error(`Error al obtener centro de producción: ${error.message}`);
        }

        return data as ProductionCenter;
    },

    /**
     * Crear nuevo centro de producción
     */
    async create(formData: ProductionCenterFormData): Promise<ProductionCenter> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            throw new Error('Usuario no autenticado');
        }

        if (!formData.company_id) {
            throw new Error('El ID de la empresa es obligatorio');
        }

        const { data, error } = await supabase
            .from('production_centers')
            .insert({
                ...formData,
                user_id: userData.user.id,
                activo: formData.activo ?? true,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Error al crear centro de producción: ${error.message}`);
        }

        return data as ProductionCenter;
    },

    /**
     * Actualizar centro de producción existente
     */
    async update(id: number, formData: Partial<ProductionCenterFormData>): Promise<ProductionCenter> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('production_centers')
            .update(formData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            throw new Error(`Error al actualizar centro de producción: ${error.message}`);
        }

        return data as ProductionCenter;
    },

    /**
     * Eliminar centro de producción (soft delete)
     */
    async softDelete(id: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { error } = await supabase
            .from('production_centers')
            .update({ activo: false })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            throw new Error(`Error al desactivar centro de producción: ${error.message}`);
        }
    },

    /**
     * Eliminar centro de producción permanentemente
     */
    async delete(id: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { error } = await supabase
            .from('production_centers')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            throw new Error(`Error al eliminar centro de producción: ${error.message}`);
        }
    },
};

export default productionCenterService;
