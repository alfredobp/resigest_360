import { createClient } from '@/lib/supabase/client';
import { normalizeDni, normalizePlate } from '@/lib/validations/fleetValidation';
import type {
  FleetDriver,
  FleetDriverFormData,
  FleetExpiringAlert,
  FleetVehicle,
  FleetVehicleFormData,
} from '@/types/fleet';

const supabase = createClient();

function computeDaysRemaining(dateStr: string, now: Date): number {
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function collectExpiryAlert(
  alerts: FleetExpiringAlert[],
  params: {
    entityType: 'vehicle' | 'driver';
    entityId: number;
    entityName: string;
    documentType: FleetExpiringAlert['documentType'];
    expiryDate?: string | null;
    daysThreshold: number;
    now: Date;
  }
): void {
  if (!params.expiryDate) return;
  const daysRemaining = computeDaysRemaining(params.expiryDate, params.now);
  if (daysRemaining > params.daysThreshold) return;

  alerts.push({
    id: `${params.entityType}-${params.entityId}-${params.documentType}`,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    documentType: params.documentType,
    expiryDate: params.expiryDate,
    daysRemaining,
    severity: daysRemaining <= 0 ? 'critico' : 'advertencia',
  });
}

/**
 * Servicio multi-tenant para gestión de vehículos y conductores propios (Modo Transportista).
 */
export const fleetService = {
  async getVehicles(): Promise<FleetVehicle[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('user_id', user.id)
      .order('matricula', { ascending: true });

    if (error) {
      throw new Error(`Error al cargar vehículos: ${error.message}`);
    }

    return (data || []) as FleetVehicle[];
  },

  async createVehicle(formData: FleetVehicleFormData): Promise<FleetVehicle> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const payload = {
      ...formData,
      matricula: normalizePlate(formData.matricula),
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fleet_vehicles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear vehículo: ${error.message}`);
    }

    return data as FleetVehicle;
  },

  async updateVehicle(
    id: number,
    formData: Partial<FleetVehicleFormData>
  ): Promise<FleetVehicle> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const payload = {
      ...formData,
      ...(formData.matricula ? { matricula: normalizePlate(formData.matricula) } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fleet_vehicles')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar vehículo: ${error.message}`);
    }

    return data as FleetVehicle;
  },

  async deleteVehicle(id: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('fleet_vehicles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Error al eliminar vehículo: ${error.message}`);
    }
  },

  async getDrivers(): Promise<FleetDriver[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('fleet_drivers')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre_completo', { ascending: true });

    if (error) {
      throw new Error(`Error al cargar conductores: ${error.message}`);
    }

    return (data || []) as FleetDriver[];
  },

  async createDriver(formData: FleetDriverFormData): Promise<FleetDriver> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const payload = {
      ...formData,
      dni: normalizeDni(formData.dni),
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fleet_drivers')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear conductor: ${error.message}`);
    }

    return data as FleetDriver;
  },

  async updateDriver(
    id: number,
    formData: Partial<FleetDriverFormData>
  ): Promise<FleetDriver> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const payload = {
      ...formData,
      ...(formData.dni ? { dni: normalizeDni(formData.dni) } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fleet_drivers')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar conductor: ${error.message}`);
    }

    return data as FleetDriver;
  },

  async deleteDriver(id: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('fleet_drivers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Error al eliminar conductor: ${error.message}`);
    }
  },

  /**
   * Obtiene alertas de caducidad de ITV, Seguro y ADR en un horizonte de N días.
   */
  async getExpiringAlerts(daysThreshold = 30): Promise<FleetExpiringAlert[]> {
    const [vehicles, drivers] = await Promise.all([
      this.getVehicles(),
      this.getDrivers(),
    ]);

    const now = new Date();
    const alerts: FleetExpiringAlert[] = [];

    for (const vehicle of vehicles) {
      if (!vehicle.activo) continue;
      collectExpiryAlert(alerts, {
        entityType: 'vehicle',
        entityId: vehicle.id,
        entityName: vehicle.matricula,
        documentType: 'ITV',
        expiryDate: vehicle.itv_caducidad,
        daysThreshold,
        now,
      });
      collectExpiryAlert(alerts, {
        entityType: 'vehicle',
        entityId: vehicle.id,
        entityName: vehicle.matricula,
        documentType: 'Seguro',
        expiryDate: vehicle.seguro_caducidad,
        daysThreshold,
        now,
      });
      if (vehicle.adr_habilitado) {
        collectExpiryAlert(alerts, {
          entityType: 'vehicle',
          entityId: vehicle.id,
          entityName: vehicle.matricula,
          documentType: 'ADR Vehículo',
          expiryDate: vehicle.adr_caducidad,
          daysThreshold,
          now,
        });
      }
    }

    for (const driver of drivers) {
      if (!driver.activo || !driver.adr_habilitado) continue;
      collectExpiryAlert(alerts, {
        entityType: 'driver',
        entityId: driver.id,
        entityName: driver.nombre_completo,
        documentType: 'ADR Conductor',
        expiryDate: driver.adr_caducidad,
        daysThreshold,
        now,
      });
    }

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  },
};

export default fleetService;
