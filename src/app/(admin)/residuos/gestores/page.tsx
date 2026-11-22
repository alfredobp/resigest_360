'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import treatmentManagerService from '@/services/treatmentManagerService';
import type { TreatmentManager } from '@/types/wasteManagement';
import GestorModal from '@/components/residuos/GestorModal';

export default function GestoresPage() {
    const { activeCompanyId, canWrite } = useTenant();
    const [loading, setLoading] = useState(true);
    const [gestores, setGestores] = useState<TreatmentManager[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedGestor, setSelectedGestor] = useState<TreatmentManager | undefined>(undefined);
    const [gestorToDelete, setGestorToDelete] = useState<TreatmentManager | null>(null);

    useEffect(() => {
        loadData();
    }, [activeCompanyId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await treatmentManagerService.getAll();
            setGestores(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (gestor: TreatmentManager) => {
        setSelectedGestor(gestor);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setSelectedGestor(undefined);
        setShowModal(true);
    };

    const handleDelete = (gestor: TreatmentManager) => {
        setGestorToDelete(gestor);
    };

    const confirmDelete = async () => {
        if (gestorToDelete === null) return;

        try {
            await treatmentManagerService.delete(gestorToDelete.id, {
                source: gestorToDelete.source,
                companyId: gestorToDelete.company_id,
            });
            setGestores((prev) => prev.filter((g) => g.id !== gestorToDelete.id));
            toast.success('Gestor eliminado correctamente.');
        } catch (err: any) {
            toast.error(`Error al eliminar gestor: ${err.message}`);
        }
    };

    const columns = useMemo<ColumnDef<TreatmentManager>[]>(
        () => [
            {
                id: 'nombre',
                header: 'Gestor de Tratamiento',
                accessorFn: (row) => row.nombre || row.razon_social || '',
                sortable: true,
                cell: ({ row }) => (
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.nombre || row.razon_social}
                    </div>
                ),
            },
            {
                id: 'cif',
                header: 'CIF',
                accessorKey: 'cif',
                sortable: true,
                cell: ({ row }) => <span className="font-mono text-slate-700 dark:text-slate-300">{row.cif || '-'}</span>,
            },
            {
                id: 'nima_auth',
                header: 'NIMA / Autorización',
                accessorFn: (row) => `${row.nima || ''} ${row.numero_autorizacion || ''}`,
                cell: ({ row }) => (
                    <div className="font-mono text-xs">
                        <div className="text-slate-800 dark:text-slate-200">{row.nima || '-'}</div>
                        {row.numero_autorizacion && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.numero_autorizacion}</div>
                        )}
                    </div>
                ),
            },
            {
                id: 'ubicacion',
                header: 'Ubicación',
                accessorFn: (row) => [row.municipio, row.provincia].filter(Boolean).join(', '),
                cell: ({ row }) => (
                    <span className="text-slate-600 dark:text-slate-400">
                        {[row.municipio, row.provincia].filter(Boolean).join(', ') || '-'}
                    </span>
                ),
            },
            {
                id: 'acciones',
                header: 'Acciones',
                headerClassName: 'text-right',
                className: 'text-right',
                cell: ({ row }) => (
                    <div className="inline-flex items-center justify-end gap-1.5">
                        {canWrite ? (
                            <>
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
            <div className="max-w-6xl mx-auto space-y-6 animate-pulse" aria-busy="true" aria-label="Cargando gestores">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-7 w-60 rounded-lg bg-slate-200 dark:bg-slate-800" />
                        <div className="h-4 w-80 max-w-full rounded bg-slate-200/80 dark:bg-slate-800/80" />
                    </div>
                    <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
                    <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40" />
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4">
                                <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="h-4 w-24 rounded bg-slate-200/80 dark:bg-slate-800/80" />
                                <div className="h-4 w-36 rounded bg-slate-100 dark:bg-slate-800/60" />
                                <div className="h-7 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageBreadCrumb pageTitle="Gestores de Tratamiento" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Banner Directorio Unificado */}
                <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/60 dark:bg-brand-950/20 dark:border-brand-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                        <h4 className="font-semibold text-brand-900 dark:text-brand-300 text-sm flex items-center gap-1.5">
                            Nuevo Directorio Unificado de Empresas
                        </h4>
                        <p className="text-xs text-brand-700 dark:text-brand-400 mt-0.5">
                            Ahora puedes gestionar gestores, transportistas y productores bajo un mismo CIF sin duplicados.
                        </p>
                    </div>
                    <Link
                        href="/residuos/empresas?rol=gestor"
                        className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition shadow-sm whitespace-nowrap"
                    >
                        Ver en Directorio Unificado →
                    </Link>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">
                        Mis Gestores de Tratamiento
                    </h2>
                    {canWrite && (
                        <Button onClick={handleAddNew}>
                            + Nuevo Gestor
                        </Button>
                    )}
                </div>

                {error && (
                    <Alert variant="error" title="Error" message={error} />
                )}

                {/* Tabla de Gestores */}
                <DataTable
                    data={gestores}
                    columns={columns}
                    searchPlaceholder="Buscar gestor por nombre, CIF, NIMA o autorización..."
                    emptyState={
                        <div className="py-8 text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No tienes gestores registrados</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Registra tus gestores habituales para usarlos en contratos y documentos de identificación.
                            </p>
                            {canWrite && (
                                <Button size="sm" className="mt-3" onClick={handleAddNew}>
                                    + Añadir Primer Gestor
                                </Button>
                            )}
                        </div>
                    }
                />

                <GestorModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={loadData}
                    gestor={selectedGestor}
                />

                <ConfirmModal
                    isOpen={gestorToDelete !== null}
                    onClose={() => setGestorToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Eliminar gestor"
                    message="¿Estás seguro de que deseas eliminar este gestor? Esta acción no se puede deshacer."
                />
            </div>
        </>
    );
}
