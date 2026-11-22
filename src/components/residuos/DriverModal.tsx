'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { toast } from '@/context/ToastContext';
import fleetService from '@/services/fleetService';
import {
  DRIVER_LICENSE_TYPES,
  validateDriverForm,
} from '@/lib/validations/fleetValidation';
import type {
  CarrierDriver,
  CarrierDriverFormData,
  CarrierVehicle,
} from '@/types/wasteManagement';
import { User, X, CheckCircle2 } from 'lucide-react';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: CarrierDriver;
  vehicles: CarrierVehicle[];
  companyId?: number | null;
  carrierId?: number | null;
  onSuccess: () => void;
}

const INITIAL_FORM: CarrierDriverFormData = {
  nombre: '',
  dni: '',
  telefono: '',
  email: '',
  vehicle_id: null,
  vehiculo_asignado: '',
  remolque_asignado: '',
  carnet_tipo: 'C+E',
  tiene_adr: false,
  fecha_caducidad_adr: '',
  fecha_caducidad_cap: '',
  notas: '',
  activo: true,
};

export default function DriverModal({
  isOpen,
  onClose,
  driver,
  vehicles,
  companyId,
  carrierId,
  onSuccess,
}: DriverModalProps) {
  const [formData, setFormData] = useState<CarrierDriverFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (driver) {
      setFormData({
        company_id: driver.company_id ?? companyId ?? null,
        carrier_id: driver.carrier_id ?? carrierId ?? null,
        vehicle_id: driver.vehicle_id ?? null,
        nombre: driver.nombre || '',
        dni: driver.dni || '',
        telefono: driver.telefono || '',
        email: driver.email || '',
        vehiculo_asignado: driver.vehiculo_asignado || '',
        remolque_asignado: driver.remolque_asignado || '',
        carnet_tipo: driver.carnet_tipo || 'C+E',
        tiene_adr: Boolean(driver.tiene_adr),
        fecha_caducidad_adr: driver.fecha_caducidad_adr || '',
        fecha_caducidad_cap: driver.fecha_caducidad_cap || '',
        notas: driver.notas || '',
        activo: driver.activo ?? true,
      });
    } else {
      setFormData({
        ...INITIAL_FORM,
        company_id: companyId ?? null,
        carrier_id: carrierId ?? null,
      });
    }
  }, [isOpen, driver, companyId, carrierId]);

  const handleSelectFleetVehicle = (selectedId: string) => {
    if (!selectedId) {
      setFormData((prev) => ({
        ...prev,
        vehicle_id: null,
      }));
      return;
    }

    const found = vehicles.find((v) => String(v.id) === selectedId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        vehicle_id: found.id,
        vehiculo_asignado: found.matricula,
        remolque_asignado: found.remolque_habitual || prev.remolque_asignado || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const validationErrors = validateDriverForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Revisa los campos marcados antes de guardar.');
      return;
    }

    try {
      setSaving(true);
      if (driver) {
        await fleetService.updateDriver(driver.id, formData);
        toast.success(`Conductor ${formData.nombre} actualizado.`);
      } else {
        await fleetService.createDriver(formData);
        toast.success(`Conductor ${formData.nombre} dado de alta.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar el conductor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl max-h-[90vh] overflow-y-auto p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {driver ? 'Editar Conductor' : 'Nuevo Conductor'}
              </h3>
              <p className="text-xs text-slate-500">
                Ficha operativa y normativa reutilizable en DeCA, DI y búsqueda rápida.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bloque 1: Datos personales */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Datos Personales y Contacto
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="driver_nombre" required>Nombre Completo</Label>
              <Input
                id="driver_nombre"
                type="text"
                placeholder="Ej. Carlos García López"
                value={formData.nombre}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }));
                  if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' }));
                }}
                error={Boolean(errors.nombre)}
                hint={errors.nombre}
              />
            </div>

            <div>
              <Label htmlFor="driver_dni">DNI / NIE</Label>
              <Input
                id="driver_dni"
                type="text"
                placeholder="12345678Z"
                value={formData.dni || ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dni: e.target.value.toUpperCase() }));
                  if (errors.dni) setErrors((prev) => ({ ...prev, dni: '' }));
                }}
                error={Boolean(errors.dni)}
                hint={errors.dni}
                className="font-mono uppercase"
              />
            </div>

            <div>
              <Label htmlFor="driver_telefono">Teléfono</Label>
              <Input
                id="driver_telefono"
                type="tel"
                placeholder="+34 600 000 000"
                value={formData.telefono || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, telefono: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="driver_email">Correo Electrónico</Label>
              <Input
                id="driver_email"
                type="email"
                placeholder="conductor@empresa.es"
                value={formData.email || ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                error={Boolean(errors.email)}
                hint={errors.email}
              />
            </div>
          </div>
        </div>

        {/* Bloque 2: Vehículo habitual */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            2. Vehículo Habitual Asignado
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="driver_vehicle_select">Seleccionar de Mi Flota</Label>
              <select
                id="driver_vehicle_select"
                value={formData.vehicle_id ? String(formData.vehicle_id) : ''}
                onChange={(e) => handleSelectFleetVehicle(e.target.value)}
                className="w-full h-11 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Matrícula manual / sin asignar --</option>
                {vehicles
                  .filter((v) => v.activo)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.matricula} ({v.tipo})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="driver_vehiculo_asignado">Matrícula Tractora</Label>
              <Input
                id="driver_vehiculo_asignado"
                type="text"
                placeholder="1234-BBB"
                value={formData.vehiculo_asignado || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vehiculo_asignado: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono uppercase"
              />
            </div>

            <div>
              <Label htmlFor="driver_remolque_asignado">Matrícula Remolque</Label>
              <Input
                id="driver_remolque_asignado"
                type="text"
                placeholder="R-1234-BBB"
                value={formData.remolque_asignado || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    remolque_asignado: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Bloque 3: Permisos y cualificaciones */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            3. Carnet, CAP y Certificación ADR
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="driver_carnet_tipo">Tipo de Carnet</Label>
              <select
                id="driver_carnet_tipo"
                value={formData.carnet_tipo || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, carnet_tipo: e.target.value }))}
                className="w-full h-11 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Sin especificar --</option>
                {DRIVER_LICENSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="driver_fecha_cap">Caducidad CAP</Label>
              <Input
                id="driver_fecha_cap"
                type="date"
                value={formData.fecha_caducidad_cap || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fecha_caducidad_cap: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col justify-end pb-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(formData.tiene_adr)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      tiene_adr: checked,
                      fecha_caducidad_adr: checked ? prev.fecha_caducidad_adr : '',
                    }));
                    if (!checked && errors.fecha_caducidad_adr) {
                      setErrors((prev) => ({ ...prev, fecha_caducidad_adr: '' }));
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Habilitado ADR (Mercancías Peligrosas)</span>
              </label>
            </div>
          </div>

          {formData.tiene_adr && (
            <div className="sm:max-w-xs">
              <Label htmlFor="driver_fecha_adr" required>Caducidad Certificado ADR</Label>
              <Input
                id="driver_fecha_adr"
                type="date"
                value={formData.fecha_caducidad_adr || ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, fecha_caducidad_adr: e.target.value }));
                  if (errors.fecha_caducidad_adr) {
                    setErrors((prev) => ({ ...prev, fecha_caducidad_adr: '' }));
                  }
                }}
                error={Boolean(errors.fecha_caducidad_adr)}
                hint={errors.fecha_caducidad_adr}
              />
            </div>
          )}
        </div>

        {/* Bloque 4: Notas y estado */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <Label htmlFor="driver_notas">Observaciones / Notas internas</Label>
            <textarea
              id="driver_notas"
              rows={2}
              placeholder="Rutas habituales, tarjeta tacógrafo, restricciones horarias..."
              value={formData.notas || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.activo ?? true}
              onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Conductor activo (disponible en selectores rápidos de DeCA y DI)</span>
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stroke dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={saving} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Guardando...' : driver ? 'Guardar Cambios' : 'Registrar Conductor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
