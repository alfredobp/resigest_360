'use client';

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Users,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Phone,
  X,
} from 'lucide-react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { toast } from '@/context/ToastContext';
import fleetService from '@/services/fleetService';
import {
  validateFleetDriver,
  validateFleetVehicle,
} from '@/lib/validations/fleetValidation';
import type {
  FleetDriver,
  FleetDriverFormData,
  FleetVehicle,
  FleetVehicleFormData,
  VehicleType,
} from '@/types/fleet';

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  tractora: 'Cabeza Tractora',
  remolque: 'Semirremolque',
  rigido: 'Camión Rígido',
  cisterna: 'Cisterna',
};

const INITIAL_VEHICLE_FORM: FleetVehicleFormData = {
  tipo: 'tractora',
  matricula: '',
  marca_modelo: '',
  tara_kg: undefined,
  mma_kg: undefined,
  adr_habilitado: false,
  adr_caducidad: '',
  itv_caducidad: '',
  seguro_caducidad: '',
  autorizacion_transporte: '',
  activo: true,
};

const INITIAL_DRIVER_FORM: FleetDriverFormData = {
  nombre_completo: '',
  dni: '',
  telefono: '',
  pin_acceso: '',
  adr_habilitado: false,
  adr_caducidad: '',
  activo: true,
};

function getExpiryStatus(dateStr?: string | null): 'expired' | 'soon' | 'ok' | null {
  if (!dateStr) return null;
  const diffDays = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 0) return 'expired';
  if (diffDays <= 30) return 'soon';
  return 'ok';
}

export default function FlotaPage() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);

  // Modal Vehículo
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<FleetVehicleFormData>(INITIAL_VEHICLE_FORM);
  const [vehicleErrors, setVehicleErrors] = useState<Record<string, string>>({});

  // Modal Conductor
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<FleetDriver | null>(null);
  const [driverForm, setDriverForm] = useState<FleetDriverFormData>(INITIAL_DRIVER_FORM);
  const [driverErrors, setDriverErrors] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);

  const loadFleet = async () => {
    try {
      setLoading(true);
      const [v, d] = await Promise.all([
        fleetService.getVehicles(),
        fleetService.getDrivers(),
      ]);
      setVehicles(v);
      setDrivers(d);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar la flota';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleet();
  }, []);

  const openNewVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm(INITIAL_VEHICLE_FORM);
    setVehicleErrors({});
    setVehicleModalOpen(true);
  };

  const openEditVehicle = (vehicle: FleetVehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      tipo: vehicle.tipo,
      matricula: vehicle.matricula,
      marca_modelo: vehicle.marca_modelo || '',
      tara_kg: vehicle.tara_kg ?? undefined,
      mma_kg: vehicle.mma_kg ?? undefined,
      adr_habilitado: vehicle.adr_habilitado,
      adr_caducidad: vehicle.adr_caducidad || '',
      itv_caducidad: vehicle.itv_caducidad || '',
      seguro_caducidad: vehicle.seguro_caducidad || '',
      autorizacion_transporte: vehicle.autorizacion_transporte || '',
      activo: vehicle.activo,
    });
    setVehicleErrors({});
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateFleetVehicle(vehicleForm);
    if (Object.keys(errs).length > 0) {
      setVehicleErrors(errs);
      return;
    }

    try {
      setSaving(true);
      const payload: FleetVehicleFormData = {
        ...vehicleForm,
        adr_caducidad: vehicleForm.adr_caducidad || null,
        itv_caducidad: vehicleForm.itv_caducidad || null,
        seguro_caducidad: vehicleForm.seguro_caducidad || null,
      };
      if (editingVehicle) {
        await fleetService.updateVehicle(editingVehicle.id, payload);
        toast.success('Vehículo actualizado correctamente.');
      } else {
        await fleetService.createVehicle(payload);
        toast.success('Vehículo añadido a la flota.');
      }
      setVehicleModalOpen(false);
      await loadFleet();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar vehículo';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm('¿Eliminar este vehículo de tu flota?')) return;
    try {
      await fleetService.deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success('Vehículo eliminado.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar vehículo');
    }
  };

  const openNewDriver = () => {
    setEditingDriver(null);
    setDriverForm(INITIAL_DRIVER_FORM);
    setDriverErrors({});
    setDriverModalOpen(true);
  };

  const openEditDriver = (driver: FleetDriver) => {
    setEditingDriver(driver);
    setDriverForm({
      nombre_completo: driver.nombre_completo,
      dni: driver.dni,
      telefono: driver.telefono || '',
      pin_acceso: driver.pin_acceso || '',
      adr_habilitado: driver.adr_habilitado,
      adr_caducidad: driver.adr_caducidad || '',
      activo: driver.activo,
    });
    setDriverErrors({});
    setDriverModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateFleetDriver(driverForm);
    if (Object.keys(errs).length > 0) {
      setDriverErrors(errs);
      return;
    }

    try {
      setSaving(true);
      const payload: FleetDriverFormData = {
        ...driverForm,
        adr_caducidad: driverForm.adr_caducidad || null,
      };
      if (editingDriver) {
        await fleetService.updateDriver(editingDriver.id, payload);
        toast.success('Conductor actualizado correctamente.');
      } else {
        await fleetService.createDriver(payload);
        toast.success('Conductor dado de alta.');
      }
      setDriverModalOpen(false);
      await loadFleet();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar conductor');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!confirm('¿Eliminar este conductor?')) return;
    try {
      await fleetService.deleteDriver(id);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      toast.success('Conductor eliminado.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar conductor');
    }
  };

  const renderExpiryBadge = (label: string, dateStr?: string | null) => {
    const status = getExpiryStatus(dateStr);
    if (!status) return null;
    if (status === 'expired') {
      return (
        <Badge variant="light" color="error">
          {label}: Caducado ({dateStr})
        </Badge>
      );
    }
    if (status === 'soon') {
      return (
        <Badge variant="light" color="warning">
          {label}: Vence {dateStr}
        </Badge>
      );
    }
    return (
      <Badge variant="light" color="success">
        {label}: {dateStr}
      </Badge>
    );
  };

  return (
    <>
      <PageBreadCrumb pageTitle="Mi Flota y Conductores" />

      <div data-tour="flota-header" className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Flota Propia y Conductores
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Autocompleta matrículas y conductores en tus DeCA y controla vencimientos de ITV, Seguro y ADR.
            </p>
          </div>

          <Button
            onClick={activeTab === 'vehicles' ? openNewVehicle : openNewDriver}
            className="bg-brand-500 hover:bg-brand-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {activeTab === 'vehicles' ? 'Nuevo Vehículo' : 'Nuevo Conductor'}
          </Button>
        </div>

        {/* Selector de pestañas */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('vehicles')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'vehicles'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            Vehículos ({vehicles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drivers')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'drivers'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Conductores ({drivers.length})
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Cargando flota y conductores...
          </div>
        ) : activeTab === 'vehicles' ? (
          vehicles.length === 0 ? (
            <ComponentCard title="Vehículos">
              <div className="text-center py-10 space-y-3">
                <Truck className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">
                  No tienes vehículos registrados en tu flota.
                </p>
                <Button onClick={openNewVehicle}>Añadir Primer Vehículo</Button>
              </div>
            </ComponentCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map((v) => (
                <ComponentCard key={v.id} title={v.matricula}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-brand-600 dark:text-brand-400">
                        {VEHICLE_TYPE_LABELS[v.tipo]}
                      </span>
                      {v.adr_habilitado && (
                        <Badge variant="light" color="warning">
                          ADR Habilitado
                        </Badge>
                      )}
                    </div>

                    {v.marca_modelo && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {v.marca_modelo}
                      </p>
                    )}

                    {(v.tara_kg || v.mma_kg) && (
                      <p className="text-xs text-gray-500">
                        Tara: {v.tara_kg ?? '-'} kg · MMA: {v.mma_kg ?? '-'} kg
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {renderExpiryBadge('ITV', v.itv_caducidad)}
                      {renderExpiryBadge('Seguro', v.seguro_caducidad)}
                      {v.adr_habilitado && renderExpiryBadge('ADR', v.adr_caducidad)}
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <Button variant="outline" size="sm" onClick={() => openEditVehicle(v)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </ComponentCard>
              ))}
            </div>
          )
        ) : drivers.length === 0 ? (
          <ComponentCard title="Conductores">
            <div className="text-center py-10 space-y-3">
              <Users className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500">
                No tienes conductores dados de alta.
              </p>
              <Button onClick={openNewDriver}>Añadir Primer Conductor</Button>
            </div>
          </ComponentCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drivers.map((d) => (
              <ComponentCard key={d.id} title={d.nombre_completo}>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p>
                      <span className="font-semibold">DNI/NIE:</span> {d.dni}
                    </p>
                    {d.telefono && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {d.telefono}
                      </p>
                    )}
                    {d.pin_acceso && (
                      <p className="text-xs text-gray-500">
                        PIN móvil configurado: ••••
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {d.adr_habilitado ? (
                      renderExpiryBadge('Carné ADR', d.adr_caducidad) || (
                        <Badge variant="light" color="success">
                          <ShieldCheck className="w-3 h-3 mr-1" /> ADR Activo
                        </Badge>
                      )
                    ) : (
                      <Badge variant="light" color="info">
                        Mercancía General
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="outline" size="sm" onClick={() => openEditDriver(d)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDriver(d.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </ComponentCard>
            ))}
          </div>
        )}
      </div>

      {/* Modal Vehículo */}
      <Modal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        className="max-w-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h3>
          <button
            type="button"
            onClick={() => setVehicleModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Vehículo *</Label>
              <select
                value={vehicleForm.tipo}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, tipo: e.target.value as VehicleType })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="tractora">Cabeza Tractora</option>
                <option value="remolque">Semirremolque</option>
                <option value="rigido">Camión Rígido</option>
                <option value="cisterna">Cisterna</option>
              </select>
            </div>
            <div>
              <Label>Matrícula *</Label>
              <Input
                value={vehicleForm.matricula}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, matricula: e.target.value })
                }
                placeholder="1234ABC"
                error={!!vehicleErrors.matricula}
                hint={vehicleErrors.matricula}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Marca y Modelo</Label>
              <Input
                value={vehicleForm.marca_modelo || ''}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, marca_modelo: e.target.value })
                }
                placeholder="Volvo FH 500"
              />
            </div>
            <div>
              <Label>Autorización de Transporte</Label>
              <Input
                value={vehicleForm.autorizacion_transporte || ''}
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    autorizacion_transporte: e.target.value,
                  })
                }
                placeholder="MDPE / OT..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>ITV Caducidad</Label>
              <Input
                type="date"
                value={vehicleForm.itv_caducidad || ''}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, itv_caducidad: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Seguro Caducidad</Label>
              <Input
                type="date"
                value={vehicleForm.seguro_caducidad || ''}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, seguro_caducidad: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              id="veh-adr"
              type="checkbox"
              checked={vehicleForm.adr_habilitado}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, adr_habilitado: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <label htmlFor="veh-adr" className="text-sm font-medium">
              Habilitado para Mercancías Peligrosas (ADR)
            </label>
          </div>

          {vehicleForm.adr_habilitado && (
            <div>
              <Label>Caducidad Certificado ADR *</Label>
              <Input
                type="date"
                value={vehicleForm.adr_caducidad || ''}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, adr_caducidad: e.target.value })
                }
                error={!!vehicleErrors.adr_caducidad}
                hint={vehicleErrors.adr_caducidad}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVehicleModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Vehículo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Conductor */}
      <Modal
        isOpen={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        className="max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {editingDriver ? 'Editar Conductor' : 'Nuevo Conductor'}
          </h3>
          <button
            type="button"
            onClick={() => setDriverModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveDriver} className="space-y-4">
          <div>
            <Label>Nombre Completo *</Label>
            <Input
              value={driverForm.nombre_completo}
              onChange={(e) =>
                setDriverForm({ ...driverForm, nombre_completo: e.target.value })
              }
              placeholder="Ej. Carlos Martínez Ruiz"
              error={!!driverErrors.nombre_completo}
              hint={driverErrors.nombre_completo}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>DNI / NIE *</Label>
              <Input
                value={driverForm.dni}
                onChange={(e) => setDriverForm({ ...driverForm, dni: e.target.value })}
                placeholder="12345678A"
                error={!!driverErrors.dni}
                hint={driverErrors.dni}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={driverForm.telefono || ''}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, telefono: e.target.value })
                }
                placeholder="600 123 456"
              />
            </div>
          </div>

          <div>
            <Label>PIN Acceso Vista Móvil (4-6 dígitos)</Label>
            <Input
              value={driverForm.pin_acceso || ''}
              onChange={(e) =>
                setDriverForm({ ...driverForm, pin_acceso: e.target.value })
              }
              placeholder="Ej. 1234 (opcional para firmar desde móvil)"
              error={!!driverErrors.pin_acceso}
              hint={driverErrors.pin_acceso}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              id="drv-adr"
              type="checkbox"
              checked={driverForm.adr_habilitado}
              onChange={(e) =>
                setDriverForm({ ...driverForm, adr_habilitado: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <label htmlFor="drv-adr" className="text-sm font-medium">
              Carné ADR en vigor
            </label>
          </div>

          {driverForm.adr_habilitado && (
            <div>
              <Label>Caducidad Carné ADR *</Label>
              <Input
                type="date"
                value={driverForm.adr_caducidad || ''}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, adr_caducidad: e.target.value })
                }
                error={!!driverErrors.adr_caducidad}
                hint={driverErrors.adr_caducidad}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDriverModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Conductor'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
