'use client';

// ==============================================================================
// RESIGEST 360 - GESTIÓN DE FLOTA Y MEDIOS DE TRANSPORTE (UXDEV-08 / UX-10)
// Permite asociar múltiples vehículos y conductores hijos a una empresa transportista
// sin duplicar fichas ni CIFs maestros.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { toast } from '@/context/ToastContext';
import carrierService from '@/services/carrierService';
import type { Carrier, FleetVehicle, FleetDriver } from '@/types/wasteManagement';
import { Truck, User, Plus, Trash2, CheckCircle2, X } from 'lucide-react';

interface CarrierFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrier?: Carrier;
  onSuccess: () => void;
}

export default function CarrierFleetModal({
  isOpen,
  onClose,
  carrier,
  onSuccess,
}: CarrierFleetModalProps) {
  const [activeTab, setActiveTab] = useState<'vehiculos' | 'conductores'>('vehiculos');
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [saving, setSaving] = useState(false);

  // Nuevo vehículo
  const [newMatricula, setNewMatricula] = useState('');
  const [newTipo, setNewTipo] = useState('Tractora');
  const [newRemolque, setNewRemolque] = useState('');

  // Nuevo conductor
  const [newConductorNombre, setNewConductorNombre] = useState('');
  const [newConductorDni, setNewConductorDni] = useState('');
  const [newConductorTelefono, setNewConductorTelefono] = useState('');
  const [newConductorVehiculo, setNewConductorVehiculo] = useState('');

  useEffect(() => {
    if (isOpen && carrier) {
      setVehicles(carrier.flota_vehiculos || []);
      setDrivers(carrier.flota_conductores || []);
      setNewMatricula('');
      setNewRemolque('');
      setNewConductorNombre('');
      setNewConductorDni('');
      setNewConductorTelefono('');
      setNewConductorVehiculo('');
    }
  }, [isOpen, carrier]);

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMatricula = newMatricula.trim().toUpperCase();
    if (!cleanMatricula) {
      toast.error('Debes indicar la matrícula del vehículo.');
      return;
    }

    if (vehicles.some((v) => v.matricula.replace(/\s+/g, '').toUpperCase() === cleanMatricula.replace(/\s+/g, ''))) {
      toast.warning('Esta matrícula ya se encuentra registrada en la flota.');
      return;
    }

    const newVeh: FleetVehicle = {
      id: `veh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      matricula: cleanMatricula,
      tipo: newTipo,
      remolque: newRemolque.trim().toUpperCase() || undefined,
      activo: true,
    };

    setVehicles((prev) => [...prev, newVeh]);
    setNewMatricula('');
    setNewRemolque('');
    toast.success(`Vehículo ${cleanMatricula} añadido.`);
  };

  const handleRemoveVehicle = (idOrMatricula: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== idOrMatricula && v.matricula !== idOrMatricula));
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newConductorNombre.trim();
    if (!cleanName) {
      toast.error('Debes indicar el nombre del conductor.');
      return;
    }

    const newDrv: FleetDriver = {
      id: `drv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: cleanName,
      dni: newConductorDni.trim().toUpperCase() || undefined,
      telefono: newConductorTelefono.trim() || undefined,
      vehiculo_asignado: newConductorVehiculo.trim().toUpperCase() || undefined,
      activo: true,
    };

    setDrivers((prev) => [...prev, newDrv]);
    setNewConductorNombre('');
    setNewConductorDni('');
    setNewConductorTelefono('');
    setNewConductorVehiculo('');
    toast.success(`Conductor ${cleanName} añadido.`);
  };

  const handleRemoveDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSaveAll = async () => {
    if (!carrier) return;
    try {
      setSaving(true);
      await carrierService.update(
        carrier.id,
        {
          flota_vehiculos: vehicles,
          flota_conductores: drivers,
        },
        {
          source: carrier.source,
          companyId: carrier.company_id,
        }
      );
      toast.success('Flota de medios y conductores actualizada correctamente.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar la flota.');
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
      <div className="space-y-5">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Gestión de Flota y Medios
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Empresa: <strong className="text-slate-700 dark:text-slate-300">{carrier?.razon_social}</strong> (CIF: {carrier?.cif})
            </p>
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

        {/* Pestañas Vehículos vs Conductores */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('vehiculos')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'vehiculos'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Vehículos de Flota ({vehicles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('conductores')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'conductores'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Conductores ({drivers.length})</span>
          </button>
        </div>

        {/* Pestaña: Vehículos */}
        {activeTab === 'vehiculos' && (
          <div className="space-y-4">
            {/* Formulario rápido para añadir vehículo */}
            <form onSubmit={handleAddVehicle} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                + Añadir Nuevo Vehículo a la Empresa
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="flota_matricula" required>Matrícula Tractora</Label>
                  <Input
                    id="flota_matricula"
                    type="text"
                    placeholder="1234-BBB"
                    value={newMatricula}
                    onChange={(e) => setNewMatricula(e.target.value.toUpperCase())}
                    className="font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="flota_tipo">Tipo de Vehículo</Label>
                  <select
                    id="flota_tipo"
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tractora">Tractora</option>
                    <option value="Rígido">Camión Rígido</option>
                    <option value="Portacontenedores">Portacontenedores</option>
                    <option value="Furgón">Furgón / Furgoneta</option>
                    <option value="Cisterna">Cisterna</option>
                    <option value="Pulpo">Camión Pulpo</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="flota_remolque">Matrícula Remolque</Label>
                  <Input
                    id="flota_remolque"
                    type="text"
                    placeholder="R-1234-BBB (opcional)"
                    value={newRemolque}
                    onChange={(e) => setNewRemolque(e.target.value.toUpperCase())}
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" className="flex items-center gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Vehículo
                </Button>
              </div>
            </form>

            {/* Listado de vehículos registrados */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Vehículos Registrados ({vehicles.length})
              </h4>
              {vehicles.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No hay vehículos registrados para este transportista.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {vehicles.map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            {v.matricula}
                          </span>
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                            {v.tipo || 'Tractora'}
                          </span>
                          {v.remolque && (
                            <span className="ml-2 text-[11px] font-mono text-slate-500">
                              Remolque: {v.remolque}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVehicle(v.id || v.matricula)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                        title="Eliminar vehículo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestaña: Conductores */}
        {activeTab === 'conductores' && (
          <div className="space-y-4">
            {/* Formulario rápido para añadir conductor */}
            <form onSubmit={handleAddDriver} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                + Añadir Nuevo Conductor a la Empresa
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="flota_conductor_nombre" required>Nombre Completo</Label>
                  <Input
                    id="flota_conductor_nombre"
                    type="text"
                    placeholder="Nombre y Apellidos"
                    value={newConductorNombre}
                    onChange={(e) => setNewConductorNombre(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="flota_conductor_dni">DNI / NIE</Label>
                  <Input
                    id="flota_conductor_dni"
                    type="text"
                    placeholder="12345678Z (opcional)"
                    value={newConductorDni}
                    onChange={(e) => setNewConductorDni(e.target.value.toUpperCase())}
                    className="font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="flota_conductor_telefono">Teléfono de Contacto</Label>
                  <Input
                    id="flota_conductor_telefono"
                    type="tel"
                    placeholder="+34 600 000 000 (opcional)"
                    value={newConductorTelefono}
                    onChange={(e) => setNewConductorTelefono(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="flota_conductor_vehiculo">Vehículo Asignado Habitual</Label>
                  <select
                    id="flota_conductor_vehiculo"
                    value={newConductorVehiculo}
                    onChange={(e) => setNewConductorVehiculo(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Sin vehículo asignado fijo --</option>
                    {vehicles.map((v) => (
                      <option key={v.id || v.matricula} value={v.matricula}>
                        {v.matricula} ({v.tipo || 'Tractora'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" className="flex items-center gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Conductor
                </Button>
              </div>
            </form>

            {/* Listado de conductores registrados */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Conductores Registrados ({drivers.length})
              </h4>
              {drivers.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No hay conductores registrados para este transportista.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {drivers.map((d, idx) => (
                    <div
                      key={d.id || idx}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {d.nombre}
                          </span>
                          {d.dni && (
                            <span className="ml-2 font-mono text-[11px] text-slate-500">
                              ({d.dni})
                            </span>
                          )}
                          {d.telefono && (
                            <span className="ml-2 text-[11px] text-slate-400">
                              · {d.telefono}
                            </span>
                          )}
                          {d.vehiculo_asignado && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[10px] text-blue-700 dark:text-blue-300 font-mono">
                              {d.vehiculo_asignado}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDriver(d.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                        title="Eliminar conductor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer de acción */}
        <div className="flex items-center justify-between pt-4 border-t border-stroke dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios de Flota'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

