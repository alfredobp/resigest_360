// =====================================================
// CARRIER SERVICE
// Servicio para gestión de transportistas internos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { Carrier, CarrierFormData } from '@/types/wasteManagement';
import { holdedService } from './holdedService';
import { companyService } from './companyService';

const supabase = createClient();

export const carrierService = {
    /**
     * Obtener todos los transportistas del usuario
     */
    async getAll(): Promise<Carrier[]> {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('carriers')
            .select('*')
            .eq('user_id', user.id)
            .eq('activo', true)
            .order('razon_social', { ascending: true });

        if (error) {
            throw new Error(`Error al obtener transportistas: ${error.message}`);
        }

        return data as Carrier[];
    },

    /**
     * Obtener transportista por ID
     */
    async getById(id: number): Promise<Carrier | null> {
        const { data, error } = await supabase
            .from('carriers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(`Error al obtener transportista: ${error.message}`);
        }

        return data as Carrier;
    },

    /**
     * Crear nuevo transportista
     */
    async create(carrierData: CarrierFormData): Promise<Carrier> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener la empresa para usar su API Key de Holded
        const company = await companyService.getUserCompany();
        const holdedApiKey = company?.holded_api_key;

        const { data, error } = await supabase
            .from('carriers')
            .insert({
                ...carrierData,
                user_id: userData.user.id,
                activo: carrierData.activo ?? true,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Error al crear transportista: ${error.message}`);
        }

        // Sincronización automática con Holded
        if (holdedApiKey) {
            try {
                console.log('🔄 Sincronizando transportista con Holded...');
                const holdedContact = await holdedService.createContact({
                    name: data.razon_social,
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
                    console.log('✅ Transportista sincronizado con Holded con éxito, ID:', holdedContact.id);
                    await supabase
                        .from('carriers')
                        .update({ holded_contact_id: holdedContact.id })
                        .eq('id', data.id);

                    data.holded_contact_id = holdedContact.id;
                }
            } catch (holdedError) {
                console.error('⚠️ No se pudo sincronizar con Holded:', holdedError);
            }
        }

        return data as Carrier;
    },

    /**
     * Actualizar transportista
     */
    async update(id: number, carrierData: Partial<CarrierFormData>): Promise<Carrier> {
        const currentData = await this.getById(id);
        const company = await companyService.getUserCompany();
        const holdedApiKey = company?.holded_api_key;

        const { data, error } = await supabase
            .from('carriers')
            .update(carrierData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Error al actualizar transportista: ${error.message}`);
        }

        // Sincronizar actualización con Holded
        if (holdedApiKey && currentData?.holded_contact_id) {
            try {
                console.log('🔄 Actualizando transportista en Holded...');
                await holdedService.updateContact(currentData.holded_contact_id, {
                    name: data.razon_social,
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
                console.log('✅ Transportista actualizado en Holded');
            } catch (holdedError) {
                console.error('⚠️ No se pudo actualizar en Holded:', holdedError);
            }
        }

        return data as Carrier;
    },

    /**
     * Eliminar transportista (soft delete)
     */
    async softDelete(id: number): Promise<void> {
        const { error } = await supabase
            .from('carriers')
            .update({ activo: false })
            .eq('id', id);

        if (error) {
            throw new Error(`Error al desactivar transportista: ${error.message}`);
        }
    },

    /**
     * Eliminar transportista permanentemente
     */
    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('carriers')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error al eliminar transportista: ${error.message}`);
        }
    },
};

export default carrierService;
