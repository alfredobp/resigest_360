'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, type ColumnDef } from '@/components/ui/table';
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
                                <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
                                    Editar
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(row)}
                                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                >
                                    Eliminar
                                </Button>
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted">Cargando gestores...</p>
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
                            <Button size="sm" className="mt-3" onClick={handleAddNew}>
                                + Añadir Primer Gestor
                            </Button>
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
