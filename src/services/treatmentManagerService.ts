// =====================================================
// TREATMENT MANAGER SERVICE
// Servicio para gestión de gestores de tratamiento internos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { TreatmentManager, TreatmentManagerFormData } from '@/types/wasteManagement';

import { holdedService } from './holdedService';
import { companyService } from './companyService';

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

        // Obtener la empresa para usar su API Key de Holded
        const company = await companyService.getUserCompany();
        const holdedApiKey = company?.holded_api_key;

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

        // Sincronización automática con Holded
        if (holdedApiKey) {
            try {
                console.log('🔄 Sincronizando gestor con Holded...');
                const holdedContact = await holdedService.createContact({
                    name: data.razon_social || data.nombre,
                    email: data.email,
                    type: 'supplier',
                    isSupplier: 1,
                    code: data.cif,
                    vatnumber: data.cif,
                    address: data.direccion,
                    city: data.municipio,
                    postalCode: data.codigo_postal,
                    province: data.provincia,
                    billAddress: {
                        address: data.direccion,
                        city: data.municipio,
                        postalCode: data.codigo_postal,
                        province: data.provincia,
                        country: 'España',
                        countryCode: 'ES'
                    },
                    phone: data.telefono
                }, holdedApiKey);

                if (holdedContact && holdedContact.id) {
                    console.log('✅ Gestor sincronizado con Holded con éxito, ID:', holdedContact.id);
                    // Guardar el ID de Holded localmente
                    await supabase
                        .from('treatment_managers')
                        .update({ holded_contact_id: holdedContact.id })
                        .eq('id', data.id);

                    data.holded_contact_id = holdedContact.id;
                }
            } catch (holdedError) {
                console.error('⚠️ No se pudo sincronizar con Holded:', holdedError);
            }
        }

        return data as TreatmentManager;
    },

    /**
     * Actualizar gestor existente
     */
    async update(id: number, managerData: Partial<TreatmentManagerFormData>): Promise<TreatmentManager> {
        // Obtener datos actuales para tener el holded_contact_id
        const currentData = await this.getById(id);
        const company = await companyService.getUserCompany();
        const holdedApiKey = company?.holded_api_key;

        const { data, error } = await supabase
            .from('treatment_managers')
            .update(managerData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Error al actualizar gestor: ${error.message}`);
        }

        // Sincronizar actualización con Holded
        if (holdedApiKey && currentData?.holded_contact_id) {
            try {
                console.log('🔄 Actualizando gestor en Holded...');
                await holdedService.updateContact(currentData.holded_contact_id, {
                    name: data.razon_social || data.nombre,
                    email: data.email,
                    type: 'supplier',
                    isSupplier: 1,
                    code: data.cif,
                    vatnumber: data.cif,
                    address: data.direccion,
                    city: data.municipio,
                    postalCode: data.codigo_postal,
                    province: data.provincia,
                    billAddress: {
                        address: data.direccion,
                        city: data.municipio,
                        postalCode: data.codigo_postal,
                        province: data.provincia,
                        country: 'España',
                        countryCode: 'ES'
                    },
                    phone: data.telefono
                }, holdedApiKey);
                console.log('✅ Gestor actualizado en Holded');
            } catch (holdedError) {
                console.error('⚠️ No se pudo actualizar en Holded:', holdedError);
            }
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
