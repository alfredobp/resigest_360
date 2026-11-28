import type { FleetDriverFormData, FleetVehicleFormData } from '@/types/fleet';

const PLATE_REGEX = /^[A-Z0-9-]{4,12}$/;
const DNI_NIE_REGEX = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])$/;
const PIN_REGEX = /^[0-9]{4,6}$/;

/**
 * Normaliza una matrícula eliminando espacios y convirtiendo a mayúsculas.
 */
export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Normaliza un DNI/NIE eliminando espacios y guiones en mayúsculas.
 */
export function normalizeDni(dni: string): string {
  return dni.trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Valida los datos de un vehículo de flota.
 */
export function validateFleetVehicle(
  data: Partial<FleetVehicleFormData>
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.tipo) {
    errors.tipo = 'Selecciona el tipo de vehículo.';
  }

  const plate = normalizePlate(data.matricula || '');
  if (!plate) {
    errors.matricula = 'La matrícula es obligatoria.';
  } else if (!PLATE_REGEX.test(plate)) {
    errors.matricula = 'Formato de matrícula no válido (4-12 caracteres alfanuméricos).';
  }

  if (data.tara_kg !== undefined && data.tara_kg !== null && data.tara_kg < 0) {
    errors.tara_kg = 'La tara no puede ser negativa.';
  }

  if (data.mma_kg !== undefined && data.mma_kg !== null && data.mma_kg <= 0) {
    errors.mma_kg = 'La MMA debe ser mayor que 0.';
  }

  if (
    data.tara_kg !== undefined &&
    data.tara_kg !== null &&
    data.mma_kg !== undefined &&
    data.mma_kg !== null &&
    data.tara_kg > data.mma_kg
  ) {
    errors.tara_kg = 'La tara no puede superar a la MMA.';
  }

  if (data.adr_habilitado && !data.adr_caducidad) {
    errors.adr_caducidad = 'Indica la fecha de caducidad del certificado ADR.';
  }

  return errors;
}

/**
 * Valida los datos de un conductor de flota.
 */
export function validateFleetDriver(
  data: Partial<FleetDriverFormData>
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.nombre_completo?.trim()) {
    errors.nombre_completo = 'El nombre completo es obligatorio.';
  }

  const dni = normalizeDni(data.dni || '');
  if (!dni) {
    errors.dni = 'El DNI/NIE es obligatorio.';
  } else if (!DNI_NIE_REGEX.test(dni)) {
    errors.dni = 'Formato de DNI/NIE no válido (ej. 12345678A o X1234567A).';
  }

  if (data.pin_acceso && !PIN_REGEX.test(data.pin_acceso.trim())) {
    errors.pin_acceso = 'El PIN de acceso móvil debe tener entre 4 y 6 dígitos numéricos.';
  }

  if (data.adr_habilitado && !data.adr_caducidad) {
    errors.adr_caducidad = 'Indica la fecha de caducidad del carné ADR.';
  }

  return errors;
}
