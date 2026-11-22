'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import PageSkeleton from '@/components/common/PageSkeleton';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import carrierService from '@/services/carrierService';
import type { Carrier } from '@/types/wasteManagement';
import CarrierModal from '@/components/residuos/CarrierModal';
import CarrierFleetModal from '@/components/residuos/CarrierFleetModal';

export default function TransportistasPage() {
    const { activeCompanyId, canWrite, hasModule } = useTenant();
    const [loading, setLoading] = useState(true);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedCarrier, setSelectedCarrier] = useState<Carrier | undefined>(undefined);
    const [carrierToDelete, setCarrierToDelete] = useState<Carrier | null>(null);
    const [showFleetModal, setShowFleetModal] = useState(false);
    const [fleetCarrier, setFleetCarrier] = useState<Carrier | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, [activeCompanyId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await carrierService.getAll();
            setCarriers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (carrier: Carrier) => {
        setSelectedCarrier(carrier);
        setShowModal(true);
    };

    const handleManageFleet = (carrier: Carrier) => {
        setFleetCarrier(carrier);
        setShowFleetModal(true);
    };

    const handleAddNew = () => {
        setSelectedCarrier(undefined);
        setShowModal(true);
    };

    const handleDelete = (carrier: Carrier) => {
        setCarrierToDelete(carrier);
    };

    const confirmDelete = async () => {
        if (carrierToDelete === null) return;

        try {
            await carrierService.delete(carrierToDelete.id, {
                source: carrierToDelete.source,
                companyId: carrierToDelete.company_id,
            });
            setCarriers((prev) => prev.filter((c) => c.id !== carrierToDelete.id));
            toast.success('Transportista eliminado correctamente.');
        } catch (err: any) {
            toast.error(`Error al eliminar transportista: ${err.message}`);
        }
    };

    const columns = useMemo<ColumnDef<Carrier>[]>(
        () => [
            {
                id: 'razon_social',
                header: 'Transportista',
                accessorKey: 'razon_social',
                sortable: true,
                cell: ({ row }) => (
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.razon_social}
                    </div>
                ),
            },
            {
                id: 'cif_nima',
                header: 'CIF / NIMA',
                accessorFn: (row) => `${row.cif || ''} ${row.nima || ''}`,
                cell: ({ row }) => (
                    <div className="font-mono text-xs">
                        <div className="text-slate-800 dark:text-slate-200">{row.cif || '-'}</div>
                        {row.nima && <div className="text-[11px] text-slate-500">NIMA: {row.nima}</div>}
                    </div>
                ),
            },
            {
                id: 'matricula_auth',
                header: 'Matrícula / Autorización',
                accessorFn: (row) => `${row.matricula || ''} ${row.numero_autorizacion || ''}`,
                cell: ({ row }) => (
                    <div className="font-mono text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{row.matricula || '-'}</div>
                        {row.numero_autorizacion && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.numero_autorizacion}</div>
                        )}
                    </div>
                ),
            },
            {
                id: 'flota',
                header: 'Flota Registrada',
                accessorFn: (row) => (row.flota_vehiculos || []).map(v => v.matricula).join(' '),
                cell: ({ row }) => {
                    const vehiclesCount = row.flota_vehiculos?.length || 0;
                    const driversCount = row.flota_conductores?.length || 0;
                    return (
                        <div>
                            <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                                {vehiclesCount} vehículo{vehiclesCount === 1 ? '' : 's'} · {driversCount} conductor{driversCount === 1 ? '' : 'es'}
                            </div>
                            {row.flota_vehiculos && row.flota_vehiculos.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {row.flota_vehiculos.slice(0, 3).map((v, i) => (
                                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10.5px] text-slate-700 dark:text-slate-300">
                                            {v.matricula}
                                        </span>
                                    ))}
                                    {row.flota_vehiculos.length > 3 && (
                                        <span className="text-[10px] text-slate-400 self-center">
                                            +{row.flota_vehiculos.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'acciones',
                header: 'Acciones',
                headerClassName: 'text-right',
                className: 'text-right',
                cell: ({ row }) => (
                    <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                        {canWrite ? (
                            <>
                                <DataTableActionButton action="fleet" onClick={() => handleManageFleet(row)} />
                                <DataTableActionButton action="edit" onClick={() => handleEdit(row)} />
                                <DataTableActionButton action="delete" onClick={() => handleDelete(row)} />
                            </>
                        ) : (
                            <span className="text-xs text-slate-400">Solo lectura</span>
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
                variant="table"
                label="Cargando transportistas"
                className="max-w-6xl mx-auto"
            />
        );
    }

    return (
        <>
            <PageBreadCrumb pageTitle="Transportistas" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Banner Directorio Unificado */}
                <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/60 dark:bg-brand-950/20 dark:border-brand-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                        <h4 className="font-semibold text-brand-900 dark:text-brand-300 text-sm flex items-center gap-1.5">
                            Nuevo Directorio Unificado de Empresas
                        </h4>
                        <p className="text-xs text-brand-700 dark:text-brand-400 mt-0.5">
                            Ahora puedes gestionar transportistas, gestores y productores bajo un mismo CIF sin duplicados.
                        </p>
                    </div>
                    {hasModule('empresas') && (
                        <Link
                            href="/residuos/empresas?rol=transportista"
                            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition shadow-sm whitespace-nowrap"
                        >
                            Ver en Directorio Unificado →
                        </Link>
                    )}
                </div>

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">
                        Mis Transportistas
                    </h2>
                    {canWrite && (
                        <Button onClick={handleAddNew}>
                            + Nuevo Transportista
                        </Button>
                    )}
                </div>

                {error && (
                    <Alert variant="error" title="Error" message={error} />
                )}

                {/* Tabla de Transportistas */}
                <DataTable
                    data={carriers}
                    columns={columns}
                    searchPlaceholder="Buscar transportista por nombre, CIF, matrícula o autorización..."
                    emptyState={
                        <div className="py-8 text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No tienes transportistas registrados</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Registra tus transportistas habituales para usarlos en tus documentos de identificación.
                            </p>
                            {canWrite && (
                                <Button size="sm" className="mt-3" onClick={handleAddNew}>
                                    + Añadir Primer Transportista
                                </Button>
                            )}
                        </div>
                    }
                />

                <CarrierModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={loadData}
                    carrier={selectedCarrier}
                />

                <CarrierFleetModal
                    isOpen={showFleetModal}
                    onClose={() => setShowFleetModal(false)}
                    onSuccess={loadData}
                    carrier={fleetCarrier}
                />

                <ConfirmModal
                    isOpen={carrierToDelete !== null}
                    onClose={() => setCarrierToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Eliminar transportista"
                    message="¿Estás seguro de que deseas eliminar este transportista? Esta acción no se puede deshacer."
                />
            </div>
        </>
    );
}
