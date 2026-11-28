export type VehicleType = 'tractora' | 'remolque' | 'rigido' | 'cisterna';

export interface FleetVehicle {
  id: number;
  user_id: string;
  tipo: VehicleType;
  matricula: string;
  marca_modelo?: string | null;
  tara_kg?: number | null;
  mma_kg?: number | null;
  adr_habilitado: boolean;
  adr_caducidad?: string | null;
  itv_caducidad?: string | null;
  seguro_caducidad?: string | null;
  autorizacion_transporte?: string | null;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export type FleetVehicleFormData = Omit<
  FleetVehicle,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

export interface FleetDriver {
  id: number;
  user_id: string;
  nombre_completo: string;
  dni: string;
  telefono?: string | null;
  pin_acceso?: string | null;
  adr_habilitado: boolean;
  adr_caducidad?: string | null;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export type FleetDriverFormData = Omit<
  FleetDriver,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

export interface FleetExpiringAlert {
  id: string;
  entityType: 'vehicle' | 'driver';
  entityId: number;
  entityName: string;
  documentType: 'ITV' | 'Seguro' | 'ADR Vehículo' | 'ADR Conductor';
  expiryDate: string;
  daysRemaining: number;
  severity: 'critico' | 'advertencia';
}
