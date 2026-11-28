'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { toast } from '@/context/ToastContext';
import fleetService from '@/services/fleetService';
import {
  VEHICLE_TYPES,
  validateVehicleForm,
} from '@/lib/validations/fleetValidation';
import type {
  CarrierVehicle,
  CarrierVehicleFormData,
} from '@/types/wasteManagement';
import { Truck, X, CheckCircle2 } from 'lucide-react';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: CarrierVehicle;
  companyId?: number | null;
  carrierId?: number | null;
  onSuccess: () => void;
}

const INITIAL_FORM: CarrierVehicleFormData = {
  matricula: '',
  tipo: 'Tractora',
  remolque_habitual: '',
  marca_modelo: '',
  mma_kg: null,
  tara_kg: null,
  fecha_caducidad_itv: '',
  fecha_caducidad_seguro: '',
  tiene_adr: false,
  fecha_caducidad_adr: '',
  tarjeta_transporte: '',
  autorizacion_especial: '',
  notas: '',
  activo: true,
};

export default function VehicleModal({
  isOpen,
  onClose,
  vehicle,
  companyId,
  carrierId,
  onSuccess,
}: VehicleModalProps) {
  const [formData, setFormData] = useState<CarrierVehicleFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (vehicle) {
      setFormData({
        company_id: vehicle.company_id ?? companyId ?? null,
        carrier_id: vehicle.carrier_id ?? carrierId ?? null,
        matricula: vehicle.matricula || '',
        tipo: vehicle.tipo || 'Tractora',
        remolque_habitual: vehicle.remolque_habitual || '',
        marca_modelo: vehicle.marca_modelo || '',
        mma_kg: vehicle.mma_kg ?? null,
        tara_kg: vehicle.tara_kg ?? null,
        fecha_caducidad_itv: vehicle.fecha_caducidad_itv || '',
        fecha_caducidad_seguro: vehicle.fecha_caducidad_seguro || '',
        tiene_adr: Boolean(vehicle.tiene_adr),
        fecha_caducidad_adr: vehicle.fecha_caducidad_adr || '',
        tarjeta_transporte: vehicle.tarjeta_transporte || '',
        autorizacion_especial: vehicle.autorizacion_especial || '',
        notas: vehicle.notas || '',
        activo: vehicle.activo ?? true,
      });
    } else {
      setFormData({
        ...INITIAL_FORM,
        company_id: companyId ?? null,
        carrier_id: carrierId ?? null,
      });
    }
  }, [isOpen, vehicle, companyId, carrierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const validationErrors = validateVehicleForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Revisa los campos marcados antes de guardar.');
      return;
    }

    try {
      setSaving(true);
      if (vehicle) {
        await fleetService.updateVehicle(vehicle.id, formData);
        toast.success(`Vehículo ${formData.matricula} actualizado.`);
      } else {
        await fleetService.createVehicle(formData);
        toast.success(`Vehículo ${formData.matricula} registrado.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar el vehículo.');
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
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
              </h3>
              <p className="text-xs text-slate-500">
                Control de matrícula, remolque habitual, ITV, seguro y certificado ADR.
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

        {/* Bloque 1: Identificación */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Identificación y Características
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vehicle_matricula" required>Matrícula</Label>
              <Input
                id="vehicle_matricula"
                type="text"
                placeholder="1234-BBB"
                value={formData.matricula}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, matricula: e.target.value.toUpperCase() }));
                  if (errors.matricula) setErrors((prev) => ({ ...prev, matricula: '' }));
                }}
                error={Boolean(errors.matricula)}
                hint={errors.matricula}
                className="font-mono uppercase"
              />
            </div>

            <div>
              <Label htmlFor="vehicle_tipo">Tipo de Vehículo</Label>
              <select
                id="vehicle_tipo"
                value={formData.tipo || 'Tractora'}
                onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
                className="w-full h-11 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="vehicle_remolque">Remolque Habitual</Label>
              <Input
                id="vehicle_remolque"
                type="text"
                placeholder="R-1234-BBB (opcional)"
                value={formData.remolque_habitual || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    remolque_habitual: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono uppercase"
              />
            </div>

            <div>
              <Label htmlFor="vehicle_marca_modelo">Marca / Modelo</Label>
              <Input
                id="vehicle_marca_modelo"
                type="text"
                placeholder="Ej. Volvo FH 500"
                value={formData.marca_modelo || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, marca_modelo: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="vehicle_mma">MMA (kg)</Label>
              <Input
                id="vehicle_mma"
                type="number"
                placeholder="40000"
                value={formData.mma_kg ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  setFormData((prev) => ({ ...prev, mma_kg: val }));
                  if (errors.mma_kg) setErrors((prev) => ({ ...prev, mma_kg: '' }));
                }}
                error={Boolean(errors.mma_kg)}
                hint={errors.mma_kg}
              />
            </div>

            <div>
              <Label htmlFor="vehicle_tara">Tara (kg)</Label>
              <Input
                id="vehicle_tara"
                type="number"
                placeholder="14500"
                value={formData.tara_kg ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  setFormData((prev) => ({ ...prev, tara_kg: val }));
                  if (errors.tara_kg) setErrors((prev) => ({ ...prev, tara_kg: '' }));
                }}
                error={Boolean(errors.tara_kg)}
                hint={errors.tara_kg}
              />
            </div>
          </div>
        </div>

        {/* Bloque 2: Vencimientos normativos */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            2. ITV, Seguro y Documentación Normativa
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vehicle_itv">Fecha Caducidad ITV</Label>
              <Input
                id="vehicle_itv"
                type="date"
                value={formData.fecha_caducidad_itv || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fecha_caducidad_itv: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="vehicle_seguro">Fecha Caducidad Seguro</Label>
              <Input
                id="vehicle_seguro"
                type="date"
                value={formData.fecha_caducidad_seguro || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fecha_caducidad_seguro: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="vehicle_tarjeta">Tarjeta de Transporte</Label>
              <Input
                id="vehicle_tarjeta"
                type="text"
                placeholder="Ej. MDP-123456"
                value={formData.tarjeta_transporte || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tarjeta_transporte: e.target.value }))
                }
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="vehicle_autorizacion">Autorización Especial</Label>
              <Input
                id="vehicle_autorizacion"
                type="text"
                placeholder="Ej. SANDACH / RP / Cisterna"
                value={formData.autorizacion_especial || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, autorizacion_especial: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end pt-1">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-200 pb-2">
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
              <span>Certificado ADR de Vehículo</span>
            </label>

            {formData.tiene_adr && (
              <div>
                <Label htmlFor="vehicle_adr_fecha" required>Caducidad ADR Vehículo</Label>
                <Input
                  id="vehicle_adr_fecha"
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
        </div>

        {/* Bloque 3: Notas y estado */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <Label htmlFor="vehicle_notas">Observaciones / Mantenimiento</Label>
            <textarea
              id="vehicle_notas"
              rows={2}
              placeholder="Compañía aseguradora, nº póliza, próxima revisión tacógrafo..."
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
            <span>Vehículo activo (disponible en selectores rápidos de DeCA y DI)</span>
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stroke dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={saving} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Guardando...' : vehicle ? 'Guardar Cambios' : 'Registrar Vehículo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
