'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import PageSkeleton from '@/components/common/PageSkeleton';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import fleetService from '@/services/fleetService';
import carrierService from '@/services/carrierService';
import DriverModal from '@/components/residuos/DriverModal';
import VehicleModal from '@/components/residuos/VehicleModal';
import {
  formatDriverQuickCopy,
  formatVehicleQuickCopy,
  getDriverComplianceAlerts,
  getExpiryStatus,
  getVehicleComplianceAlerts,
} from '@/lib/validations/fleetValidation';
import type {
  CarrierDriver,
  CarrierVehicle,
  ExpiryStatus,
} from '@/types/wasteManagement';
import {
  Truck,
  User,
  Plus,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

function ExpiryBadge({ label, date }: { label: string; date?: string | null }) {
  if (!date) return null;
  const status: ExpiryStatus = getExpiryStatus(date);
  const tone =
    status === 'caducado'
      ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900'
      : status === 'proximo'
      ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${tone}`}
      title={`${label}: ${date}`}
    >
      <span className="font-semibold">{label}:</span>
      <span className="font-mono">{date}</span>
    </span>
  );
}

function FlotaHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeCompanyId, canWrite } = useTenant();

  const initialTab = searchParams.get('tab') === 'vehiculos' ? 'vehiculos' : 'conductores';
  const initialQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<'conductores' | 'vehiculos'>(initialTab);
  const [filterMode, setFilterMode] = useState<'todos' | 'activos' | 'adr' | 'alertas'>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<CarrierDriver[]>([]);
  const [vehicles, setVehicles] = useState<CarrierVehicle[]>([]);

  // Modales
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<CarrierDriver | undefined>(undefined);
  const [driverToDelete, setDriverToDelete] = useState<CarrierDriver | null>(null);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<CarrierVehicle | undefined>(undefined);
  const [vehicleToDelete, setVehicleToDelete] = useState<CarrierVehicle | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'vehiculos' || tabParam === 'conductores') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const loadFleet = useCallback(async (syncLegacy = false) => {
    try {
      setLoading(true);
      setError(null);

      if (syncLegacy) {
        try {
          const carriers = await carrierService.getAll();
          await fleetService.syncLegacyFleetFromCarriers(carriers, activeCompanyId);
        } catch {
          // Si falla la sincronización legacy, continuamos con la lectura relacional
        }
      }

      const [driverList, vehicleList] = await Promise.all([
        fleetService.getDrivers({ includeInactive: true, companyId: activeCompanyId }),
        fleetService.getVehicles({ includeInactive: true, companyId: activeCompanyId }),
      ]);

      setDrivers(driverList);
      setVehicles(vehicleList);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la flota.');
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    loadFleet(true);
  }, [loadFleet]);

  const handleTabChange = (tab: 'conductores' | 'vehiculos') => {
    setActiveTab(tab);
    setFilterMode('todos');
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/residuos/flota?${params.toString()}`, { scroll: false });
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado al portapapeles.`);
    } catch {
      toast.error('No se pudo copiar al portapapeles.');
    }
  };

  const handleToggleDriver = async (driver: CarrierDriver) => {
    try {
      await fleetService.toggleDriverActive(driver.id, !driver.activo);
      toast.success(
        driver.activo ? `Conductor ${driver.nombre} desactivado.` : `Conductor ${driver.nombre} reactivado.`
      );
      await loadFleet(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cambiar el estado del conductor.');
    }
  };

  const handleToggleVehicle = async (vehicle: CarrierVehicle) => {
    try {
      await fleetService.toggleVehicleActive(vehicle.id, !vehicle.activo);
      toast.success(
        vehicle.activo ? `Vehículo ${vehicle.matricula} desactivado.` : `Vehículo ${vehicle.matricula} reactivado.`
      );
      await loadFleet(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cambiar el estado del vehículo.');
    }
  };

  const confirmDeleteDriver = async () => {
    if (!driverToDelete) return;
    try {
      await fleetService.deleteDriver(driverToDelete.id);
      setDrivers((prev) => prev.filter((d) => d.id !== driverToDelete.id));
      toast.success('Conductor eliminado correctamente.');
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el conductor.');
    } finally {
      setDriverToDelete(null);
    }
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      await fleetService.deleteVehicle(vehicleToDelete.id);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));
      toast.success('Vehículo eliminado correctamente.');
    } catch (err: any) {
      toast.error(err?.message || 'Error al eliminar el vehículo.');
    } finally {
      setVehicleToDelete(null);
    }
  };

  // KPIs y alertas
  const driverAlerts = useMemo(
    () => drivers.filter((d) => d.activo).flatMap((d) => getDriverComplianceAlerts(d)),
    [drivers]
  );
  const vehicleAlerts = useMemo(
    () => vehicles.filter((v) => v.activo).flatMap((v) => getVehicleComplianceAlerts(v)),
    [vehicles]
  );

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      if (filterMode === 'activos') return d.activo;
      if (filterMode === 'adr') return d.tiene_adr;
      if (filterMode === 'alertas') return getDriverComplianceAlerts(d).length > 0;
      return true;
    });
  }, [drivers, filterMode]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (filterMode === 'activos') return v.activo;
      if (filterMode === 'adr') return v.tiene_adr;
      if (filterMode === 'alertas') return getVehicleComplianceAlerts(v).length > 0;
      return true;
    });
  }, [vehicles, filterMode]);

  const driverColumns = useMemo<ColumnDef<CarrierDriver>[]>(
    () => [
      {
        id: 'conductor',
        header: 'Conductor',
        accessorFn: (row) => `${row.nombre} ${row.dni || ''} ${row.carnet_tipo || ''}`,
        sortable: true,
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{row.nombre}</span>
              {!row.activo && (
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  Inactivo
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
              <span>{row.dni || 'Sin DNI'}</span>
              {row.carnet_tipo && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-sans font-semibold text-slate-600 dark:text-slate-300">
                  Carnet {row.carnet_tipo}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'contacto',
        header: 'Contacto',
        accessorFn: (row) => `${row.telefono || ''} ${row.email || ''}`,
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5">
            <div className="text-slate-800 dark:text-slate-200">{row.telefono || '-'}</div>
            {row.email && <div className="text-slate-500 truncate max-w-[180px]">{row.email}</div>}
          </div>
        ),
      },
      {
        id: 'vehiculo',
        header: 'Vehículo Habitual',
        accessorFn: (row) => `${row.vehiculo_asignado || ''} ${row.remolque_asignado || ''}`,
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            {row.vehiculo_asignado ? (
              <>
                <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-bold">
                  {row.vehiculo_asignado}
                </span>
                {row.remolque_asignado && (
                  <div className="text-[11px] text-slate-500 mt-1">R: {row.remolque_asignado}</div>
                )}
              </>
            ) : (
              <span className="text-slate-400 font-sans">Sin asignar</span>
            )}
          </div>
        ),
      },
      {
        id: 'permisos',
        header: 'Permisos (ADR / CAP)',
        accessorFn: (row) => `${row.tiene_adr ? 'ADR' : ''} ${row.fecha_caducidad_adr || ''} ${row.fecha_caducidad_cap || ''}`,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            {row.tiene_adr ? (
              row.fecha_caducidad_adr ? (
                <ExpiryBadge label="ADR" date={row.fecha_caducidad_adr} />
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                  ADR
                </span>
              )
            ) : (
              <span className="text-[11px] text-slate-400">Sin ADR</span>
            )}
            <ExpiryBadge label="CAP" date={row.fecha_caducidad_cap} />
          </div>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right',
        cell: ({ row }) => (
          <div className="inline-flex items-center justify-end gap-1">
            <DataTableActionButton
              action="copy"
              iconOnly
              title="Copiar ficha completa"
              onClick={() => handleCopyText(formatDriverQuickCopy(row), `Ficha de ${row.nombre}`)}
            />
            {canWrite && (
              <>
                <DataTableActionButton
                  action="edit"
                  iconOnly
                  title="Editar conductor"
                  onClick={() => {
                    setSelectedDriver(row);
                    setDriverModalOpen(true);
                  }}
                />
                <DataTableActionButton
                  action="toggle"
                  iconOnly
                  title={row.activo ? 'Desactivar conductor' : 'Reactivar conductor'}
                  onClick={() => handleToggleDriver(row)}
                />
                <DataTableActionButton
                  action="delete"
                  iconOnly
                  title="Eliminar conductor"
                  onClick={() => setDriverToDelete(row)}
                />
              </>
            )}
          </div>
        ),
      },
    ],
    [canWrite]
  );

  const vehicleColumns = useMemo<ColumnDef<CarrierVehicle>[]>(
    () => [
      {
        id: 'vehiculo',
        header: 'Vehículo / Matrícula',
        accessorFn: (row) => `${row.matricula} ${row.tipo} ${row.marca_modelo || ''} ${row.remolque_habitual || ''}`,
        sortable: true,
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {row.matricula}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">
                {row.tipo}
              </span>
              {!row.activo && (
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-500">
                  Inactivo
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {row.marca_modelo && <span>{row.marca_modelo}</span>}
              {row.remolque_habitual && (
                <span className="ml-2 font-mono text-slate-600 dark:text-slate-400">
                  · Remolque: {row.remolque_habitual}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'capacidad',
        header: 'MMA / Tara',
        accessorFn: (row) => `${row.mma_kg || ''} ${row.tara_kg || ''} ${row.tarjeta_transporte || ''}`,
        cell: ({ row }) => (
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
            {row.mma_kg || row.tara_kg ? (
              <div className="font-mono">
                {row.mma_kg ? `MMA ${row.mma_kg.toLocaleString('es-ES')} kg` : ''}
                {row.mma_kg && row.tara_kg ? ' · ' : ''}
                {row.tara_kg ? `Tara ${row.tara_kg.toLocaleString('es-ES')} kg` : ''}
              </div>
            ) : (
              <span className="text-slate-400">-</span>
            )}
            {row.tarjeta_transporte && (
              <div className="text-[11px] font-mono text-slate-500">
                Tarjeta: {row.tarjeta_transporte}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'vencimientos',
        header: 'ITV / Seguro / ADR',
        accessorFn: (row) =>
          `${row.fecha_caducidad_itv || ''} ${row.fecha_caducidad_seguro || ''} ${row.tiene_adr ? 'ADR' : ''} ${row.fecha_caducidad_adr || ''}`,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            <ExpiryBadge label="ITV" date={row.fecha_caducidad_itv} />
            <ExpiryBadge label="Seguro" date={row.fecha_caducidad_seguro} />
            {row.tiene_adr && <ExpiryBadge label="ADR" date={row.fecha_caducidad_adr} />}
            {!row.fecha_caducidad_itv && !row.fecha_caducidad_seguro && !row.tiene_adr && (
              <span className="text-xs text-slate-400">Sin fechas registradas</span>
            )}
          </div>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right',
        cell: ({ row }) => (
          <div className="inline-flex items-center justify-end gap-1">
            <DataTableActionButton
              action="copy"
              iconOnly
              title="Copiar ficha completa"
              onClick={() => handleCopyText(formatVehicleQuickCopy(row), `Ficha de ${row.matricula}`)}
            />
            {canWrite && (
              <>
                <DataTableActionButton
                  action="edit"
                  iconOnly
                  title="Editar vehículo"
                  onClick={() => {
                    setSelectedVehicle(row);
                    setVehicleModalOpen(true);
                  }}
                />
                <DataTableActionButton
                  action="toggle"
                  iconOnly
                  title={row.activo ? 'Desactivar vehículo' : 'Reactivar vehículo'}
                  onClick={() => handleToggleVehicle(row)}
                />
                <DataTableActionButton
                  action="delete"
                  iconOnly
                  title="Eliminar vehículo"
                  onClick={() => setVehicleToDelete(row)}
                />
              </>
            )}
          </div>
        ),
      },
    ],
    [canWrite]
  );

  if (loading) {
    return (
      <PageSkeleton
        variant="table-with-stats"
        label="Cargando conductores y vehículos"
        className="max-w-6xl mx-auto pb-12"
      />
    );
  }

  const activeDriversCount = drivers.filter((d) => d.activo).length;
  const activeVehiclesCount = vehicles.filter((v) => v.activo).length;

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-5 pb-12">
        <PageBreadCrumb
          pageTitle="Mi Flota"
          title="Mi Flota: Conductores y Vehículos"
          subtitle="Registra tus conductores y vehículos para autorrellenar DeCA y DI al instante y vigilar caducidades de ITV, Seguro, ADR y CAP."
          className="mb-0"
          actions={
            canWrite ? (
              <>
                <Button
                  variant={activeTab === 'vehiculos' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedVehicle(undefined);
                    setVehicleModalOpen(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Vehículo
                </Button>
                <Button
                  variant={activeTab === 'conductores' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedDriver(undefined);
                    setDriverModalOpen(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Conductor
                </Button>
              </>
            ) : undefined
          }
        />

        {error && <Alert variant="error" title="Error" message={error} />}

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Conductores Activos</span>
              <User className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {activeDriversCount}
              <span className="text-xs font-normal text-slate-400 ml-1.5">de {drivers.length}</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Vehículos Activos</span>
              <Truck className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {activeVehiclesCount}
              <span className="text-xs font-normal text-slate-400 ml-1.5">de {vehicles.length}</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Alertas Conductores</span>
              {driverAlerts.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p
              className={`text-2xl font-extrabold mt-2 ${
                driverAlerts.some((a) => a.status === 'caducado')
                  ? 'text-red-600 dark:text-red-400'
                  : driverAlerts.length > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {driverAlerts.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">ADR / CAP vencidos o ≤30 días</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Alertas Vehículos</span>
              {vehicleAlerts.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p
              className={`text-2xl font-extrabold mt-2 ${
                vehicleAlerts.some((a) => a.status === 'caducado')
                  ? 'text-red-600 dark:text-red-400'
                  : vehicleAlerts.length > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {vehicleAlerts.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">ITV / Seguro / ADR ≤30 días</p>
          </div>
        </div>

        {/* Pestañas y Filtros Rápidos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => handleTabChange('conductores')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'conductores'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Conductores ({drivers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('vehiculos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'vehiculos'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Vehículos ({vehicles.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'activos', label: 'Activos' },
                { id: 'adr', label: 'Con ADR' },
                { id: 'alertas', label: 'Con alertas' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/40 dark:border-brand-700 dark:text-brand-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Conductores */}
        {activeTab === 'conductores' && (
          <DataTable
            data={filteredDrivers}
            columns={driverColumns}
            initialSearch={initialQuery}
            searchPlaceholder="Buscar conductor por nombre, DNI, teléfono o matrícula..."
            emptyState={
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No hay conductores registrados con este filtro
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Da de alta tus conductores habituales para autorrellenar DeCA y DI en un clic.
                </p>
                {canWrite && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSelectedDriver(undefined);
                      setDriverModalOpen(true);
                    }}
                  >
                    + Registrar Primer Conductor
                  </Button>
                )}
              </div>
            }
          />
        )}

        {/* Tabla Vehículos */}
        {activeTab === 'vehiculos' && (
          <DataTable
            data={filteredVehicles}
            columns={vehicleColumns}
            initialSearch={initialQuery}
            searchPlaceholder="Buscar vehículo por matrícula, remolque, marca o tarjeta..."
            emptyState={
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No hay vehículos registrados con este filtro
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Registra tus tractoras, rígidos y remolques para controlar ITV, seguro y ADR.
                </p>
                {canWrite && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSelectedVehicle(undefined);
                      setVehicleModalOpen(true);
                    }}
                  >
                    + Registrar Primer Vehículo
                  </Button>
                )}
              </div>
            }
          />
        )}

        <DriverModal
          isOpen={driverModalOpen}
          onClose={() => setDriverModalOpen(false)}
          driver={selectedDriver}
          vehicles={vehicles}
          companyId={activeCompanyId}
          onSuccess={() => loadFleet(false)}
        />

        <VehicleModal
          isOpen={vehicleModalOpen}
          onClose={() => setVehicleModalOpen(false)}
          vehicle={selectedVehicle}
          companyId={activeCompanyId}
          onSuccess={() => loadFleet(false)}
        />

        <ConfirmModal
          isOpen={driverToDelete !== null}
          onClose={() => setDriverToDelete(null)}
          onConfirm={confirmDeleteDriver}
          title="Eliminar conductor"
          message={`¿Seguro que deseas eliminar a ${driverToDelete?.nombre || 'este conductor'}? Esta acción no se puede deshacer.`}
        />

        <ConfirmModal
          isOpen={vehicleToDelete !== null}
          onClose={() => setVehicleToDelete(null)}
          onConfirm={confirmDeleteVehicle}
          title="Eliminar vehículo"
          message={`¿Seguro que deseas eliminar el vehículo ${vehicleToDelete?.matricula || ''}? Esta acción no se puede deshacer.`}
        />
      </div>
    </>
  );
}

export default function FlotaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      }
    >
      <FlotaHubContent />
    </Suspense>
  );
}
