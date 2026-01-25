// =====================================================
// TREATMENT MANAGER SERVICE
// Servicio para gestión de gestores de tratamiento internos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { TreatmentManager, TreatmentManagerFormData } from '@/types/wasteManagement';

const supabase = createClient();

export const treatmentManagerService = {
    /**
     * Obtener todos los gestores del usuario
     */
    async getAll(): Promise<TreatmentManager[]> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('treatment_managers')
            .select('*')
            .eq('user_id', user.id)
            .eq('activo', true)
            .order('nombre', { ascending: true });

        if (error) {
            throw new Error(`Error al obtener gestores: ${error.message}`);
        }

        return data as TreatmentManager[];
    },

    /**
     * Obtener gestor por ID
     */
    async getById(id: number): Promise<TreatmentManager | null> {
        const { data, error } = await supabase
            .from('treatment_managers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(`Error al obtener gestor: ${error.message}`);
        }

        return data as TreatmentManager;
    },

    /**
     * Crear nuevo gestor
     */
    async create(managerData: TreatmentManagerFormData): Promise<TreatmentManager> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('treatment_managers')
            .insert({
                ...managerData,
                user_id: userData.user.id,
                activo: managerData.activo ?? true,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Error al crear gestor: ${error.message}`);
        }

        return data as TreatmentManager;
    },

    /**
     * Actualizar gestor existente
     */
    async update(id: number, managerData: Partial<TreatmentManagerFormData>): Promise<TreatmentManager> {
        const { data, error } = await supabase
            .from('treatment_managers')
            .update(managerData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Error al actualizar gestor: ${error.message}`);
        }

        return data as TreatmentManager;
    },

    /**
     * Eliminar gestor (soft delete)
     */
    async softDelete(id: number): Promise<void> {
        const { error } = await supabase
            .from('treatment_managers')
            .update({ activo: false })
            .eq('id', id);

        if (error) {
            throw new Error(`Error al desactivar gestor: ${error.message}`);
        }
    },

    /**
     * Eliminar gestor permanentemente
     */
    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('treatment_managers')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error al eliminar gestor: ${error.message}`);
        }
    },
};

export default treatmentManagerService;
