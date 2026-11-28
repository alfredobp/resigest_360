// =====================================================
// FLEET SERVICE
// Servicio relacional multi-tenant para Conductores y Vehículos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { applyTenantScope, getActiveCompanyCookie } from '@/services/tenantContextService';
import { normalizeDni, normalizePlate } from '@/lib/validations/fleetValidation';
import type {
  Carrier,
  CarrierDriver,
  CarrierDriverFormData,
  CarrierVehicle,
  CarrierVehicleFormData,
} from '@/types/wasteManagement';

const supabase = createClient();

export interface FleetQueryOptions {
  includeInactive?: boolean;
  carrierId?: number | null;
  companyId?: number | null;
}

async function requireAuthenticatedUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  return user;
}

function cleanOptionalString(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function cleanOptionalDate(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export const fleetService = {
  // =====================================================
  // CONDUCTORES (carrier_drivers)
  // =====================================================

  async getDrivers(options: FleetQueryOptions = {}): Promise<CarrierDriver[]> {
    const user = await requireAuthenticatedUser();
    const scopedCompanyId =
      options.companyId !== undefined ? options.companyId : getActiveCompanyCookie();

    let query = supabase
      .from('carrier_drivers')
      .select('*')
      .order('nombre', { ascending: true });

    query = applyTenantScope(query, user.id, scopedCompanyId);

    if (!options.includeInactive) {
      query = query.eq('activo', true);
    }

    if (options.carrierId) {
      query = query.eq('carrier_id', options.carrierId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Error al obtener conductores: ${error.message}`);
    }

    return (data as CarrierDriver[]) || [];
  },

  async getDriverById(id: number): Promise<CarrierDriver | null> {
    const user = await requireAuthenticatedUser();
    const scopedCompanyId = getActiveCompanyCookie();

    let query = supabase
      .from('carrier_drivers')
      .select('*')
      .eq('id', id);

    query = applyTenantScope(query, user.id, scopedCompanyId);

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new Error(`Error al obtener conductor: ${error.message}`);
    }

    return (data as CarrierDriver) || null;
  },

  async createDriver(driverData: CarrierDriverFormData): Promise<CarrierDriver> {
    const user = await requireAuthenticatedUser();
    const activeCompanyId =
      driverData.company_id !== undefined ? driverData.company_id : getActiveCompanyCookie();

    const payload = {
      user_id: user.id,
      company_id: activeCompanyId || null,
      carrier_id: driverData.carrier_id || null,
      vehicle_id: driverData.vehicle_id || null,
      nombre: driverData.nombre.trim(),
      dni: normalizeDni(driverData.dni) || null,
      telefono: cleanOptionalString(driverData.telefono),
      email: cleanOptionalString(driverData.email),
      vehiculo_asignado: normalizePlate(driverData.vehiculo_asignado) || null,
      remolque_asignado: normalizePlate(driverData.remolque_asignado) || null,
      carnet_tipo: cleanOptionalString(driverData.carnet_tipo),
      tiene_adr: Boolean(driverData.tiene_adr),
      fecha_caducidad_adr: driverData.tiene_adr
        ? cleanOptionalDate(driverData.fecha_caducidad_adr)
        : null,
      fecha_caducidad_cap: cleanOptionalDate(driverData.fecha_caducidad_cap),
      notas: cleanOptionalString(driverData.notas),
      activo: driverData.activo ?? true,
    };

    const { data, error } = await supabase
      .from('carrier_drivers')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear conductor: ${error.message}`);
    }

    return data as CarrierDriver;
  },

  async updateDriver(
    id: number,
    driverData: Partial<CarrierDriverFormData>
  ): Promise<CarrierDriver> {
    const user = await requireAuthenticatedUser();
    const scopedCompanyId = getActiveCompanyCookie();

    const updatePayload: Record<string, unknown> = {};
    if (driverData.nombre !== undefined) updatePayload.nombre = driverData.nombre.trim();
    if (driverData.dni !== undefined) updatePayload.dni = normalizeDni(driverData.dni) || null;
    if (driverData.telefono !== undefined) updatePayload.telefono = cleanOptionalString(driverData.telefono);
    if (driverData.email !== undefined) updatePayload.email = cleanOptionalString(driverData.email);
    if (driverData.vehicle_id !== undefined) updatePayload.vehicle_id = driverData.vehicle_id || null;
    if (driverData.carrier_id !== undefined) updatePayload.carrier_id = driverData.carrier_id || null;
    if (driverData.vehiculo_asignado !== undefined) {
      updatePayload.vehiculo_asignado = normalizePlate(driverData.vehiculo_asignado) || null;
    }
    if (driverData.remolque_asignado !== undefined) {
      updatePayload.remolque_asignado = normalizePlate(driverData.remolque_asignado) || null;
    }
    if (driverData.carnet_tipo !== undefined) {
      updatePayload.carnet_tipo = cleanOptionalString(driverData.carnet_tipo);
    }
    if (driverData.tiene_adr !== undefined) {
      updatePayload.tiene_adr = Boolean(driverData.tiene_adr);
      if (!driverData.tiene_adr) {
        updatePayload.fecha_caducidad_adr = null;
      }
    }
    if (driverData.fecha_caducidad_adr !== undefined) {
      updatePayload.fecha_caducidad_adr =
        driverData.tiene_adr === false ? null : cleanOptionalDate(driverData.fecha_caducidad_adr);
    }
    if (driverData.fecha_caducidad_cap !== undefined) {
      updatePayload.fecha_caducidad_cap = cleanOptionalDate(driverData.fecha_caducidad_cap);
    }
    if (driverData.notas !== undefined) updatePayload.notas = cleanOptionalString(driverData.notas);
    if (driverData.activo !== undefined) updatePayload.activo = Boolean(driverData.activo);

    let query = supabase
      .from('carrier_drivers')
      .update(updatePayload)
      .eq('id', id);

    query = applyTenantScope(query, user.id, scopedCompanyId);

    const { data, error } = await query.select().single();
    if (error) {
      throw new Error(`Error al actualizar conductor: ${error.message}`);
    }

    return data as CarrierDriver;
  },

  async toggleDriverActive(id: number, activo: boolean): Promise<CarrierDriver> {
    return this.updateDriver(id, { activo });
  },

  async deleteDriver(id: number): Promise<void> {
    const user = await requireAuthenticatedUser();
    const scopedCompanyId = getActiveCompanyCookie();

    let query = supabase.from('carrier_drivers').delete().eq('id', id);
    query = applyTenantScope(query, user.id, scopedCompanyId);

    const { error } = await query;
    if (error) {
      throw new Error(`Error al eliminar conductor: ${error.message}`);
    }
  },

  // =====================================================
  // VEHÍCULOS (carrier_vehicles)
  // =====================================================

  async getVehicles(options: FleetQueryOptions = {}): Promise<CarrierVehicle[]> {
    const user = await requireAuthenticatedUser();
    const scopedCompanyId =
      options.companyId !== undefined ? options.companyId : getActiveCompanyCookie();

    let query = supabase
      .from('carrier_vehicles')
      .select('*')
      .order('matricula', { ascending: true });

    query = applyTenantScope(query, user.id, scopedCompanyId);

    if (!options.includeInactive) {
      query = query.eq('activo', true);
    }

    if (options.carrierId) {
      query = query.eq('carrier_id', options.carrierId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Error al obtener vehículos: ${error.message}`);
    }

    return (data as CarrierVehicle[]) || [];
  },

  async getVehicleById(id: number): Promise<CarrierVehicle | null> {
    const user = await requireAuthenticatedUser();
    const scopedCompanyId = getActiveCompanyCookie();

    let query = supabase
      .from('carrier_vehicles')
      .select('*')
      .eq('id', id);

    query = applyTenantScope(query, user.id, scopedCompanyId);

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new Error(`Error al obtener vehículo: ${error.message}`);
    }

    return (data as CarrierVehicle) || null;
  },

  async createVehicle(vehicleData: CarrierVehicleFormData): Promise<CarrierVehicle> {
    const user = await requireAuthenticatedUser();
    const activeCompanyId =
      vehicleData.company_id !== undefined ? vehicleData.company_id : getActiveCompanyCookie();

    const normalizedPlate = normalizePlate(vehicleData.matricula);
    if (!normalizedPlate) {
      throw new Error('La matrícula del vehículo es obligatoria');
    }

    const payload = {
      user_id: user.id,
      company_id: activeCompanyId || null,
      carrier_id: vehicleData.carrier_id || null,
      matricula: normalizedPlate,
      tipo: cleanOptionalString(vehicleData.tipo) || 'Tractora',
      remolque_habitual: normalizePlate(vehicleData.remolque_habitual) || null,
      marca_modelo: cleanOptionalString(vehicleData.marca_modelo),
      mma_kg: vehicleData.mma_kg !== undefined && vehicleData.mma_kg !== null ? Number(vehicleData.mma_kg) : null,
      tara_kg: vehicleData.tara_kg !== undefined && vehicleData.tara_kg !== null ? Number(vehicleData.tara_kg) : null,
      fecha_caducidad_itv: cleanOptionalDate(vehicleData.fecha_caducidad_itv),
      fecha_caducidad_seguro: cleanOptionalDate(vehicleData.fecha_caducidad_seguro),
      tiene_adr: Boolean(vehicleData.tiene_adr),
      fecha_caducidad_adr: vehicleData.tiene_adr
        ? cleanOptionalDate(vehicleData.fecha_caducidad_adr)
        : null,
      tarjeta_transporte: cleanOptionalString(vehicleData.tarjeta_transporte),
      autorizacion_especial: cleanOptionalString(vehicleData.autorizacion_especial),
      notas: cleanOptionalString(vehicleData.notas),
      activo: vehicleData.activo ?? true,
    };

    const { data, error } = await supabase
      .from('carrier_vehicles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('uq_carrier_vehicles_company_norm_plate')) {
        throw new Error(
          `Ya existe un vehículo activo con la matrícula ${normalizedPlate} en tu flota. Edita o selecciona la ficha existente en lugar de duplicarla.`
        );
      }
      throw new Error(`Error al crear vehículo: ${error.message}`);
    }

    return data as CarrierVehicle;
  },

  async updateVehicle(
    id: number,
    vehicleData: Partial<CarrierVehicleFormData>
  ): Promise<CarrierVehicle> {
    const user = await requireAuthenticatedUser();
    const scopedCompanyId = getActiveCompanyCookie();

    const updatePayload: Record<string, unknown> = {};
    if (vehicleData.matricula !== undefined) {
      const normalized = normalizePlate(vehicleData.matricula);
      if (!normalized) throw new Error('La matrícula del vehículo es obligatoria');
      updatePayload.matricula = normalized;
    }
    if (vehicleData.tipo !== undefined) {
      updatePayload.tipo = cleanOptionalString(vehicleData.tipo) || 'Tractora';
    }
    if (vehicleData.remolque_habitual !== undefined) {
      updatePayload.remolque_habitual = normalizePlate(vehicleData.remolque_habitual) || null;
    }
    if (vehicleData.marca_modelo !== undefined) {
      updatePayload.marca_modelo = cleanOptionalString(vehicleData.marca_modelo);
    }
    if (vehicleData.mma_kg !== undefined) {
      updatePayload.mma_kg = vehicleData.mma_kg === null ? null : Number(vehicleData.mma_kg);
    }
    if (vehicleData.tara_kg !== undefined) {
      updatePayload.tara_kg = vehicleData.tara_kg === null ? null : Number(vehicleData.tara_kg);
    }
    if (vehicleData.fecha_caducidad_itv !== undefined) {
      updatePayload.fecha_caducidad_itv = cleanOptionalDate(vehicleData.fecha_caducidad_itv);
    }
    if (vehicleData.fecha_caducidad_seguro !== undefined) {
      updatePayload.fecha_caducidad_seguro = cleanOptionalDate(vehicleData.fecha_caducidad_seguro);
    }
    if (vehicleData.tiene_adr !== undefined) {
      updatePayload.tiene_adr = Boolean(vehicleData.tiene_adr);
      if (!vehicleData.tiene_adr) {
        updatePayload.fecha_caducidad_adr = null;
      }
    }
    if (vehicleData.fecha_caducidad_adr !== undefined) {
      updatePayload.fecha_caducidad_adr =
        vehicleData.tiene_adr === false ? null : cleanOptionalDate(vehicleData.fecha_caducidad_adr);
    }
    if (vehicleData.tarjeta_transporte !== undefined) {
      updatePayload.tarjeta_transporte = cleanOptionalString(vehicleData.tarjeta_transporte);
    }
    if (vehicleData.autorizacion_especial !== undefined) {
      updatePayload.autorizacion_especial = cleanOptionalString(vehicleData.autorizacion_especial);
    }
    if (vehicleData.notas !== undefined) {
      updatePayload.notas = cleanOptionalString(vehicleData.notas);
    }
    if (vehicleData.activo !== undefined) {
      updatePayload.activo = Boolean(vehicleData.activo);
    }

    let query = supabase
      .from('carrier_vehicles')
      .update(updatePayload)
      .eq('id', id);

    query = applyTenantScope(query, user.id, scopedCompanyId);

    const { data, error } = await query.select().single();
    if (error) {
      if (error.code === '23505' || error.message?.includes('uq_carrier_vehicles_company_norm_plate')) {
        throw new Error(
          'Ya existe un vehículo activo con esa matrícula en tu flota. Edita la ficha existente en lugar de duplicarla.'
        );
      }
      throw new Error(`Error al actualizar vehículo: ${error.message}`);
    }

    return data as CarrierVehicle;
  },

  async toggleVehicleActive(id: number, activo: boolean): Promise<CarrierVehicle> {
    return this.updateVehicle(id, { activo });
  },

  async deleteVehicle(id: number): Promise<void> {
    const user = await requireAuthenticatedUser();
    const scopedCompanyId = getActiveCompanyCookie();

    let query = supabase.from('carrier_vehicles').delete().eq('id', id);
    query = applyTenantScope(query, user.id, scopedCompanyId);

    const { error } = await query;
    if (error) {
      throw new Error(`Error al eliminar vehículo: ${error.message}`);
    }
  },

  // =====================================================
  // MIGRACIÓN IDEMPOTENTE DESDE JSON LEGACY (_fleet)
  // =====================================================

  async syncLegacyFleetFromCarriers(
    carriers: Carrier[],
    companyId?: number | null
  ): Promise<{ importedVehicles: number; importedDrivers: number }> {
    if (!Array.isArray(carriers) || carriers.length === 0) {
      return { importedVehicles: 0, importedDrivers: 0 };
    }

    const [existingVehicles, existingDrivers] = await Promise.all([
      this.getVehicles({ includeInactive: true, companyId }),
      this.getDrivers({ includeInactive: true, companyId }),
    ]);

    const existingPlates = new Set(
      existingVehicles.map((v) => v.matricula.replace(/\s+/g, '').toUpperCase())
    );
    const existingDriverKeys = new Set(
      existingDrivers.map((d) =>
        d.dni
          ? `dni:${d.dni.replace(/[\s-]+/g, '').toUpperCase()}`
          : `name:${d.nombre.trim().toLowerCase()}`
      )
    );

    let importedVehicles = 0;
    let importedDrivers = 0;

    for (const carrier of carriers) {
      const targetCarrierId = carrier.source === 'carriers' ? carrier.id : null;
      const targetCompanyId = companyId ?? carrier.company_id ?? getActiveCompanyCookie() ?? null;

      for (const veh of carrier.flota_vehiculos || []) {
        const cleanPlate = normalizePlate(veh.matricula);
        if (!cleanPlate) continue;
        const plateKey = cleanPlate.replace(/\s+/g, '');
        if (existingPlates.has(plateKey)) continue;

        try {
          await this.createVehicle({
            company_id: targetCompanyId,
            carrier_id: targetCarrierId,
            matricula: cleanPlate,
            tipo: veh.tipo || 'Tractora',
            remolque_habitual: veh.remolque,
            autorizacion_especial: veh.autorizacion_especial,
            activo: veh.activo ?? true,
          });
          existingPlates.add(plateKey);
          importedVehicles += 1;
        } catch {
          // Continuar si un registro puntual falla
        }
      }

      for (const drv of carrier.flota_conductores || []) {
        const cleanName = drv.nombre?.trim();
        if (!cleanName) continue;
        const cleanDni = normalizeDni(drv.dni);
        const key = cleanDni ? `dni:${cleanDni}` : `name:${cleanName.toLowerCase()}`;
        if (existingDriverKeys.has(key)) continue;

        try {
          await this.createDriver({
            company_id: targetCompanyId,
            carrier_id: targetCarrierId,
            nombre: cleanName,
            dni: cleanDni,
            telefono: drv.telefono,
            email: drv.email,
            vehiculo_asignado: drv.vehiculo_asignado,
            remolque_asignado: drv.remolque_asignado,
            carnet_tipo: drv.carnet_tipo,
            tiene_adr: Boolean(drv.tiene_adr),
            fecha_caducidad_adr: drv.fecha_caducidad_adr,
            fecha_caducidad_cap: drv.fecha_caducidad_cap,
            notas: drv.notas,
            activo: drv.activo ?? true,
          });
          existingDriverKeys.add(key);
          importedDrivers += 1;
        } catch {
          // Continuar si un registro puntual falla
        }
      }
    }

    return { importedVehicles, importedDrivers };
  },
};

export default fleetService;
