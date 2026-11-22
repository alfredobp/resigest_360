// =====================================================
// FLEET VALIDATION & COMPLIANCE HELPERS
// Validaciones y cálculo de caducidades para Conductores y Vehículos
// =====================================================

import type {
  CarrierDriver,
  CarrierDriverFormData,
  CarrierVehicle,
  CarrierVehicleFormData,
  ExpiryStatus,
  FleetComplianceAlert,
} from '@/types/wasteManagement';

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const VEHICLE_TYPES = [
  'Tractora',
  'Rígido',
  'Remolque',
  'Portacontenedores',
  'Cisterna',
  'Pulpo',
  'Furgón',
] as const;

export const DRIVER_LICENSE_TYPES = [
  'C+E',
  'C',
  'C1+E',
  'C1',
  'B+E',
  'B',
] as const;

/**
 * Normaliza una matrícula (mayúsculas, trim y colapso de espacios).
 */
export function normalizePlate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().replace(/\s+/g, ' ').toUpperCase();
  return cleaned || undefined;
}

/**
 * Normaliza un DNI/NIE eliminando espacios y guiones en mayúsculas.
 */
export function normalizeDni(value?: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().replace(/[\s-]+/g, '').toUpperCase();
  return cleaned || undefined;
}

/**
 * Valida el formato y dígito de control de un DNI o NIE español.
 */
export function isValidSpanishDniNie(rawDni: string): boolean {
  const cleaned = normalizeDni(rawDni);
  if (!cleaned) return false;

  const dniMatch = /^(\d{8})([A-Z])$/.exec(cleaned);
  if (dniMatch) {
    const num = parseInt(dniMatch[1], 10);
    return DNI_LETTERS[num % 23] === dniMatch[2];
  }

  const nieMatch = /^([XYZ])(\d{7})([A-Z])$/.exec(cleaned);
  if (nieMatch) {
    const prefixMap: Record<string, string> = { X: '0', Y: '1', Z: '2' };
    const num = parseInt(`${prefixMap[nieMatch[1]]}${nieMatch[2]}`, 10);
    return DNI_LETTERS[num % 23] === nieMatch[3];
  }

  return false;
}

/**
 * Calcula los días restantes hasta una fecha ISO (YYYY-MM-DD).
 * Devuelve null si la fecha no está informada o no es válida.
 */
export function getDaysUntilDate(
  dateStr?: string | null,
  referenceDate: Date = new Date()
): number | null {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const diffMs = parsed.getTime() - refMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcula el estado semáforo de una fecha de caducidad (ITV, Seguro, ADR, CAP).
 */
export function getExpiryStatus(
  dateStr?: string | null,
  warningDays = 30,
  referenceDate: Date = new Date()
): ExpiryStatus {
  const days = getDaysUntilDate(dateStr, referenceDate);
  if (days === null) return 'no_aplica';
  if (days < 0) return 'caducado';
  if (days <= warningDays) return 'proximo';
  return 'vigente';
}

/**
 * Devuelve las alertas de cumplimiento (caducado o próximo a vencer) de un conductor.
 */
export function getDriverComplianceAlerts(
  driver: Pick<CarrierDriver, 'id' | 'nombre' | 'tiene_adr' | 'fecha_caducidad_adr' | 'fecha_caducidad_cap'>,
  warningDays = 30,
  referenceDate: Date = new Date()
): FleetComplianceAlert[] {
  const alerts: FleetComplianceAlert[] = [];

  if (driver.tiene_adr && driver.fecha_caducidad_adr) {
    const status = getExpiryStatus(driver.fecha_caducidad_adr, warningDays, referenceDate);
    if (status === 'caducado' || status === 'proximo') {
      const days = getDaysUntilDate(driver.fecha_caducidad_adr, referenceDate) ?? 0;
      alerts.push({
        entityType: 'driver',
        entityId: driver.id,
        entityLabel: driver.nombre,
        documentType: 'ADR',
        status,
        expiryDate: driver.fecha_caducidad_adr,
        daysRemaining: days,
        message:
          status === 'caducado'
            ? `ADR del conductor ${driver.nombre} caducado el ${driver.fecha_caducidad_adr}`
            : `ADR del conductor ${driver.nombre} caduca en ${days} día${days === 1 ? '' : 's'} (${driver.fecha_caducidad_adr})`,
      });
    }
  }

  if (driver.fecha_caducidad_cap) {
    const status = getExpiryStatus(driver.fecha_caducidad_cap, warningDays, referenceDate);
    if (status === 'caducado' || status === 'proximo') {
      const days = getDaysUntilDate(driver.fecha_caducidad_cap, referenceDate) ?? 0;
      alerts.push({
        entityType: 'driver',
        entityId: driver.id,
        entityLabel: driver.nombre,
        documentType: 'CAP',
        status,
        expiryDate: driver.fecha_caducidad_cap,
        daysRemaining: days,
        message:
          status === 'caducado'
            ? `CAP del conductor ${driver.nombre} caducado el ${driver.fecha_caducidad_cap}`
            : `CAP del conductor ${driver.nombre} caduca en ${days} día${days === 1 ? '' : 's'} (${driver.fecha_caducidad_cap})`,
      });
    }
  }

  return alerts;
}

/**
 * Devuelve las alertas de cumplimiento (ITV, Seguro, ADR) de un vehículo.
 */
export function getVehicleComplianceAlerts(
  vehicle: Pick<
    CarrierVehicle,
    'id' | 'matricula' | 'fecha_caducidad_itv' | 'fecha_caducidad_seguro' | 'tiene_adr' | 'fecha_caducidad_adr'
  >,
  warningDays = 30,
  referenceDate: Date = new Date()
): FleetComplianceAlert[] {
  const alerts: FleetComplianceAlert[] = [];

  const checks: Array<{ doc: 'ITV' | 'Seguro' | 'ADR'; date?: string | null; enabled: boolean }> = [
    { doc: 'ITV', date: vehicle.fecha_caducidad_itv, enabled: Boolean(vehicle.fecha_caducidad_itv) },
    { doc: 'Seguro', date: vehicle.fecha_caducidad_seguro, enabled: Boolean(vehicle.fecha_caducidad_seguro) },
    { doc: 'ADR', date: vehicle.fecha_caducidad_adr, enabled: Boolean(vehicle.tiene_adr && vehicle.fecha_caducidad_adr) },
  ];

  for (const check of checks) {
    if (!check.enabled || !check.date) continue;
    const status = getExpiryStatus(check.date, warningDays, referenceDate);
    if (status === 'caducado' || status === 'proximo') {
      const days = getDaysUntilDate(check.date, referenceDate) ?? 0;
      alerts.push({
        entityType: 'vehicle',
        entityId: vehicle.id,
        entityLabel: vehicle.matricula,
        documentType: check.doc,
        status,
        expiryDate: check.date,
        daysRemaining: days,
        message:
          status === 'caducado'
            ? `${check.doc} del vehículo ${vehicle.matricula} caducado el ${check.date}`
            : `${check.doc} del vehículo ${vehicle.matricula} caduca en ${days} día${days === 1 ? '' : 's'} (${check.date})`,
      });
    }
  }

  return alerts;
}

/**
 * Valida el formulario de alta/edición de un conductor.
 */
export function validateDriverForm(
  data: Partial<CarrierDriverFormData>
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.nombre || !data.nombre.trim()) {
    errors.nombre = 'El nombre completo del conductor es obligatorio.';
  }

  if (data.dni && data.dni.trim() && !isValidSpanishDniNie(data.dni)) {
    errors.dni = 'El formato o letra de control del DNI/NIE no es válido.';
  }

  if (data.email && data.email.trim() && !EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'El correo electrónico no tiene un formato válido.';
  }

  if (data.tiene_adr && !data.fecha_caducidad_adr) {
    errors.fecha_caducidad_adr = 'Indica la fecha de caducidad del certificado ADR.';
  }

  return errors;
}

/**
 * Valida el formulario de alta/edición de un vehículo.
 */
export function validateVehicleForm(
  data: Partial<CarrierVehicleFormData>
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.matricula || !data.matricula.trim()) {
    errors.matricula = 'La matrícula del vehículo es obligatoria.';
  }

  if (data.mma_kg !== undefined && data.mma_kg !== null && Number(data.mma_kg) < 0) {
    errors.mma_kg = 'La MMA no puede ser negativa.';
  }

  if (data.tara_kg !== undefined && data.tara_kg !== null && Number(data.tara_kg) < 0) {
    errors.tara_kg = 'La tara no puede ser negativa.';
  }

  if (
    data.mma_kg !== undefined &&
    data.mma_kg !== null &&
    data.tara_kg !== undefined &&
    data.tara_kg !== null &&
    Number(data.tara_kg) > Number(data.mma_kg)
  ) {
    errors.tara_kg = 'La tara no puede superar a la MMA del vehículo.';
  }

  if (data.tiene_adr && !data.fecha_caducidad_adr) {
    errors.fecha_caducidad_adr = 'Indica la fecha de caducidad del certificado ADR del vehículo.';
  }

  return errors;
}

/**
 * Formatea un resumen de ficha de conductor listo para copiar en 1 clic.
 */
export function formatDriverQuickCopy(driver: CarrierDriver): string {
  const parts = [`Conductor: ${driver.nombre}`];
  if (driver.dni) parts.push(`DNI/NIE: ${driver.dni}`);
  if (driver.telefono) parts.push(`Tel: ${driver.telefono}`);
  if (driver.email) parts.push(`Email: ${driver.email}`);
  if (driver.vehiculo_asignado) {
    const plate = driver.remolque_asignado
      ? `${driver.vehiculo_asignado} / Remolque: ${driver.remolque_asignado}`
      : driver.vehiculo_asignado;
    parts.push(`Vehículo: ${plate}`);
  }
  if (driver.carnet_tipo) parts.push(`Carnet: ${driver.carnet_tipo}`);
  if (driver.tiene_adr) {
    parts.push(`ADR: Sí${driver.fecha_caducidad_adr ? ` (hasta ${driver.fecha_caducidad_adr})` : ''}`);
  }
  if (driver.fecha_caducidad_cap) parts.push(`CAP: hasta ${driver.fecha_caducidad_cap}`);
  return parts.join(' | ');
}

/**
 * Formatea un resumen de ficha de vehículo listo para copiar en 1 clic.
 */
export function formatVehicleQuickCopy(vehicle: CarrierVehicle): string {
  const parts = [`Matrícula: ${vehicle.matricula} (${vehicle.tipo})`];
  if (vehicle.remolque_habitual) parts.push(`Remolque: ${vehicle.remolque_habitual}`);
  if (vehicle.marca_modelo) parts.push(`Modelo: ${vehicle.marca_modelo}`);
  if (vehicle.fecha_caducidad_itv) parts.push(`ITV: ${vehicle.fecha_caducidad_itv}`);
  if (vehicle.fecha_caducidad_seguro) parts.push(`Seguro: ${vehicle.fecha_caducidad_seguro}`);
  if (vehicle.tiene_adr) {
    parts.push(`ADR: Sí${vehicle.fecha_caducidad_adr ? ` (hasta ${vehicle.fecha_caducidad_adr})` : ''}`);
  }
  if (vehicle.tarjeta_transporte) parts.push(`Tarjeta Transporte: ${vehicle.tarjeta_transporte}`);
  return parts.join(' | ');
}
