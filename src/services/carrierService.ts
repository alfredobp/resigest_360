// =====================================================
// CARRIER SERVICE
// Servicio para gestión de transportistas internos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { Carrier, CarrierFormData, FleetVehicle, FleetDriver } from '@/types/wasteManagement';
import { holdedService } from './holdedService';
import { companyService } from './companyService';

const supabase = createClient();

/**
 * Utilidades para parsear y persistir la flota de medios y conductores (UXDEV-08)
 */
export function parseFleetFromNotes(notas?: string): { userNotes: string; vehicles: FleetVehicle[]; drivers: FleetDriver[] } {
    if (!notas) return { userNotes: '', vehicles: [], drivers: [] };
    const trimmed = notas.trim();
    if (trimmed.startsWith('{') && trimmed.includes('"_fleet"')) {
        try {
            const parsed = JSON.parse(trimmed);
            return {
                userNotes: parsed.notes || '',
                vehicles: Array.isArray(parsed._fleet?.vehicles) ? parsed._fleet.vehicles : [],
                drivers: Array.isArray(parsed._fleet?.drivers) ? parsed._fleet.drivers : [],
            };
        } catch {
            // Fallback a texto plano si falla el parseo
        }
    }
    return { userNotes: notas, vehicles: [], drivers: [] };
}

export function serializeFleetToNotes(userNotes: string = '', vehicles: FleetVehicle[] = [], drivers: FleetDriver[] = []): string {
    const hasVehicles = Array.isArray(vehicles) && vehicles.length > 0;
    const hasDrivers = Array.isArray(drivers) && drivers.length > 0;
    if (!hasVehicles && !hasDrivers) {
        return userNotes || '';
    }
    return JSON.stringify({
        notes: userNotes || '',
        _fleet: {
            vehicles: vehicles || [],
            drivers: drivers || [],
        },
    });
}

function enrichCarrierWithFleet(c: any): Carrier {
    const { userNotes, vehicles, drivers } = parseFleetFromNotes(c.notas);
    const vehicleList: FleetVehicle[] = [...vehicles];

    // Si tiene matrícula principal en la ficha y no está en la lista de vehículos, incluirla como predeterminada
    if (c.matricula && !vehicleList.some((v) => v.matricula.replace(/\s+/g, '').toUpperCase() === c.matricula.replace(/\s+/g, '').toUpperCase())) {
        vehicleList.unshift({
            id: 'veh-main',
            matricula: c.matricula,
            tipo: 'Principal',
            activo: true,
        });
    }

    const driverList: FleetDriver[] = [...drivers];
    if (c.persona_contacto && !driverList.some((d) => d.nombre.trim().toLowerCase() === c.persona_contacto.trim().toLowerCase())) {
        driverList.unshift({
            id: 'drv-main',
            nombre: c.persona_contacto,
            telefono: c.telefono,
            activo: true,
        });
    }

    return {
        ...c,
        notas: userNotes,
        flota_vehiculos: vehicleList,
        flota_conductores: driverList,
    };
}

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
            console.error('Error al obtener transportistas de carriers:', error);
        }

        const list: Carrier[] = ((data as Carrier[]) || []).map((c) => ({
            ...c,
            source: 'carriers' as const,
        }));

        // Integrar empresas con rol 'transportista' del Directorio Unificado
        try {
            const { data: unifiedCompanies } = await supabase
                .from('companies')
                .select('*')
                .eq('user_id', user.id)
                .eq('activo', true);

            if (unifiedCompanies && unifiedCompanies.length > 0) {
                const existingCifs = new Set(list.map((c) => c.cif?.toUpperCase().trim()).filter(Boolean));
                const existingIds = new Set(list.map((c) => c.id));
                let maxId = list.reduce((max, c) => Math.max(max, c.id || 0), 0);

                for (const comp of unifiedCompanies) {
                    const roles: string[] = Array.isArray(comp.roles) ? comp.roles : (comp.tipo_empresa ? [comp.tipo_empresa] : []);
                    const isCarrier = roles.includes('transportista') || comp.tipo_empresa === 'transportista';

                    if (isCarrier) {
                        const normCif = comp.cif?.toUpperCase().trim();
                        if (!normCif || !existingCifs.has(normCif)) {
                            const safeId = existingIds.has(comp.id) ? ++maxId : comp.id;
                            existingIds.add(safeId);
                            maxId = Math.max(maxId, safeId);
                            list.push({
                                id: safeId,
                                user_id: comp.user_id,
                                razon_social: comp.razon_social,
                                cif: comp.cif,
                                nima: comp.nima,
                                numero_autorizacion: comp.numero_autorizacion,
                                matricula: comp.matricula,
                                direccion: comp.domicilio_social || comp.direccion,
                                codigo_postal: comp.codigo_postal_social || comp.codigo_postal,
                                municipio: comp.municipio_social || comp.municipio,
                                provincia: comp.provincia_social || comp.provincia,
                                telefono: comp.telefono,
                                email: comp.email,
                                persona_contacto: comp.persona_contacto,
                                notas: comp.notas,
                                activo: comp.activo ?? true,
                                created_at: comp.created_at,
                                updated_at: comp.updated_at,
                                holded_contact_id: comp.holded_contact_id,
                                source: 'companies' as const,
                                company_id: comp.id,
                            });
                            if (normCif) existingCifs.add(normCif);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Nota: compatibilidad con tabla companies unificada:', e);
        }

        return list.map(enrichCarrierWithFleet);
    },

    /**
     * Obtener transportista por ID
     */
    async getById(id: number): Promise<Carrier | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabase
            .from('carriers')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) {
            throw new Error(`Error al obtener transportista: ${error.message}`);
        }

        return enrichCarrierWithFleet(data);
    },

    /**
     * Crear nuevo transportista
     */
    async create(carrierData: CarrierFormData): Promise<Carrier> {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            throw new Error('Usuario no autenticado');
        }

        const { flota_vehiculos, flota_conductores, ...restCarrierData } = carrierData;
        const serializedNotes = serializeFleetToNotes(
            restCarrierData.notas || '',
            flota_vehiculos || [],
            flota_conductores || []
        );

        // Obtener la empresa para usar su API Key de Holded
        const company = await companyService.getUserCompany();
        const holdedApiKey = company?.holded_api_key;

        const { data, error } = await supabase
            .from('carriers')
            .insert({
                ...restCarrierData,
                notas: serializedNotes,
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
                console.info('🔄 Sincronizando transportista con Holded...');
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
                    console.info('✅ Transportista sincronizado con Holded con éxito, ID:', holdedContact.id);
                    await supabase
                        .from('carriers')
                        .update({ holded_contact_id: holdedContact.id })
                        .eq('id', data.id)
                        .eq('user_id', userData.user.id);

                    data.holded_contact_id = holdedContact.id;
                }
            } catch (holdedError) {
                console.error('⚠️ No se pudo sincronizar con Holded:', holdedError);
            }
        }

        return enrichCarrierWithFleet(data);
    },

    /**
     * Actualizar transportista
     */
    async update(
        id: number,
        carrierData: Partial<CarrierFormData>,
        options?: { source?: 'carriers' | 'treatment_managers' | 'companies'; companyId?: number }
    ): Promise<Carrier> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        // Si el transportista procede del Directorio Unificado (companies), actualizar en companies
        if (options?.source === 'companies') {
            const targetCompanyId = options.companyId ?? id;
            const currentComp = await companyService.getById(targetCompanyId).catch(() => null);
            const currentEnriched = currentComp ? enrichCarrierWithFleet(currentComp as unknown as Carrier) : null;
            const { flota_vehiculos, flota_conductores, ...restCarrierData } = carrierData;

            const fieldMap: Array<[keyof typeof restCarrierData, string]> = [
                ['razon_social', 'razon_social'],
                ['cif', 'cif'],
                ['nima', 'nima'],
                ['numero_autorizacion', 'numero_autorizacion'],
                ['matricula', 'matricula'],
                ['direccion', 'domicilio_social'],
                ['codigo_postal', 'codigo_postal_social'],
                ['municipio', 'municipio_social'],
                ['provincia', 'provincia_social'],
                ['telefono', 'telefono'],
                ['email', 'email'],
                ['persona_contacto', 'persona_contacto'],
            ];

            const companyPayload: Record<string, any> = {};
            for (const [srcKey, dstKey] of fieldMap) {
                if (restCarrierData[srcKey] !== undefined) {
                    companyPayload[dstKey] = restCarrierData[srcKey];
                }
            }

            if (flota_vehiculos !== undefined || flota_conductores !== undefined || restCarrierData.notas !== undefined) {
                const currentVehicles = flota_vehiculos ?? currentEnriched?.flota_vehiculos ?? [];
                const currentDrivers = flota_conductores ?? currentEnriched?.flota_conductores ?? [];
                const baseNotes = restCarrierData.notas ?? currentEnriched?.notas ?? '';
                companyPayload.notas = serializeFleetToNotes(baseNotes, currentVehicles, currentDrivers);
            }

            const updatedComp = await companyService.update(targetCompanyId, companyPayload);
            return enrichCarrierWithFleet({
                id,
                user_id: updatedComp.user_id,
                razon_social: updatedComp.razon_social,
                cif: updatedComp.cif,
                nima: updatedComp.nima,
                numero_autorizacion: updatedComp.numero_autorizacion,
                matricula: updatedComp.matricula,
                direccion: updatedComp.domicilio_social,
                codigo_postal: updatedComp.codigo_postal_social,
                municipio: updatedComp.municipio_social,
                provincia: updatedComp.provincia_social,
                telefono: updatedComp.telefono,
                email: updatedComp.email,
                persona_contacto: updatedComp.persona_contacto,
                notas: updatedComp.notas,
                activo: updatedComp.activo ?? true,
                created_at: updatedComp.created_at,
                updated_at: updatedComp.updated_at,
                source: 'companies',
                company_id: updatedComp.id,
            });
        }

        const currentData = await this.getById(id);
        const company = await companyService.getUserCompany();
        const holdedApiKey = company?.holded_api_key;

        const { flota_vehiculos, flota_conductores, ...restCarrierData } = carrierData;
        const updatePayload: any = { ...restCarrierData };

        if (flota_vehiculos !== undefined || flota_conductores !== undefined || restCarrierData.notas !== undefined) {
            const currentVehicles = flota_vehiculos !== undefined ? flota_vehiculos : (currentData?.flota_vehiculos || []);
            const currentDrivers = flota_conductores !== undefined ? flota_conductores : (currentData?.flota_conductores || []);
            const baseNotes = restCarrierData.notas !== undefined ? restCarrierData.notas : (currentData?.notas || '');
            updatePayload.notas = serializeFleetToNotes(baseNotes, currentVehicles, currentDrivers);
        }

        const { data, error } = await supabase
            .from('carriers')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            throw new Error(`Error al actualizar transportista: ${error.message}`);
        }

        // Sincronizar actualización con Holded
        if (holdedApiKey && currentData?.holded_contact_id) {
            try {
                console.info('🔄 Actualizando transportista en Holded...');
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
                console.info('✅ Transportista actualizado en Holded');
            } catch (holdedError) {
                console.error('⚠️ No se pudo actualizar en Holded:', holdedError);
            }
        }

        return enrichCarrierWithFleet(data);
    },

    /**
     * Gestión de Flota: Añadir vehículo hijo a empresa transportista (UXDEV-08)
     */
    async addVehicle(carrierId: number, vehicle: Omit<FleetVehicle, 'id'>): Promise<Carrier> {
        const carrier = await this.getById(carrierId);
        if (!carrier) throw new Error('Transportista no encontrado');

        const newVehicle: FleetVehicle = {
            ...vehicle,
            id: `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            activo: vehicle.activo ?? true,
        };

        const existing = carrier.flota_vehiculos || [];
        const updatedVehicles = [...existing, newVehicle];

        return await this.update(carrierId, {
            flota_vehiculos: updatedVehicles,
        });
    },

    /**
     * Gestión de Flota: Eliminar vehículo hijo (UXDEV-08)
     */
    async removeVehicle(carrierId: number, vehicleIdOrMatricula: string): Promise<Carrier> {
        const carrier = await this.getById(carrierId);
        if (!carrier) throw new Error('Transportista no encontrado');

        const cleanTarget = vehicleIdOrMatricula.replace(/\s+/g, '').toUpperCase();
        const updatedVehicles = (carrier.flota_vehiculos || []).filter(
            (v) => v.id !== vehicleIdOrMatricula && v.matricula.replace(/\s+/g, '').toUpperCase() !== cleanTarget
        );

        return await this.update(carrierId, {
            flota_vehiculos: updatedVehicles,
        });
    },

    /**
     * Gestión de Flota: Añadir conductor hijo a empresa transportista (UXDEV-08)
     */
    async addDriver(carrierId: number, driver: Omit<FleetDriver, 'id'>): Promise<Carrier> {
        const carrier = await this.getById(carrierId);
        if (!carrier) throw new Error('Transportista no encontrado');

        const newDriver: FleetDriver = {
            ...driver,
            id: `drv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            activo: driver.activo ?? true,
        };

        const existing = carrier.flota_conductores || [];
        const updatedDrivers = [...existing, newDriver];

        return await this.update(carrierId, {
            flota_conductores: updatedDrivers,
        });
    },

    /**
     * Gestión de Flota: Eliminar conductor hijo (UXDEV-08)
     */
    async removeDriver(carrierId: number, driverIdOrDni: string): Promise<Carrier> {
        const carrier = await this.getById(carrierId);
        if (!carrier) throw new Error('Transportista no encontrado');

        const updatedDrivers = (carrier.flota_conductores || []).filter(
            (d) => d.id !== driverIdOrDni && d.dni !== driverIdOrDni
        );

        return await this.update(carrierId, {
            flota_conductores: updatedDrivers,
        });
    },

    /**
     * Eliminar transportista (soft delete)
     */
    async softDelete(id: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        const { error } = await supabase
            .from('carriers')
            .update({ activo: false })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            throw new Error(`Error al desactivar transportista: ${error.message}`);
        }
    },

    /**
     * Eliminar transportista permanentemente
     */
    async delete(
        id: number,
        options?: { source?: 'carriers' | 'treatment_managers' | 'companies'; companyId?: number }
    ): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuario no autenticado');
        }

        if (options?.source === 'companies') {
            await companyService.delete(options.companyId ?? id);
            return;
        }

        const { error } = await supabase
            .from('carriers')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            throw new Error(`Error al eliminar transportista: ${error.message}`);
        }
    },
};

export default carrierService;
