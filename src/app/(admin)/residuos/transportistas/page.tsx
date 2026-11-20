'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { toast } from '@/context/ToastContext';
import carrierService from '@/services/carrierService';
import type { Carrier } from '@/types/wasteManagement';
import CarrierModal from '@/components/residuos/CarrierModal';
import CarrierFleetModal from '@/components/residuos/CarrierFleetModal';

export default function TransportistasPage() {
    const [loading, setLoading] = useState(true);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedCarrier, setSelectedCarrier] = useState<Carrier | undefined>(undefined);
    const [carrierToDelete, setCarrierToDelete] = useState<number | null>(null);
    const [showFleetModal, setShowFleetModal] = useState(false);
    const [fleetCarrier, setFleetCarrier] = useState<Carrier | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, []);

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

    const handleDelete = (id: number) => {
        setCarrierToDelete(id);
    };

    const confirmDelete = async () => {
        if (carrierToDelete === null) return;

        try {
            await carrierService.delete(carrierToDelete);
            setCarriers((prev) => prev.filter((c) => c.id !== carrierToDelete));
            toast.success('Transportista eliminado correctamente.');
        } catch (err: any) {
            toast.error(`Error al eliminar transportista: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted">Cargando transportistas...</p>
                </div>
            </div>
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
                            <span>✨</span> Nuevo Directorio Unificado de Empresas
                        </h4>
                        <p className="text-xs text-brand-700 dark:text-brand-400 mt-0.5">
                            Ahora puedes gestionar transportistas, gestores y productores bajo un mismo CIF sin duplicados.
                        </p>
                    </div>
                    <Link
                        href="/residuos/empresas?rol=transportista"
                        className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition shadow-sm whitespace-nowrap"
                    >
                        Ver en Directorio Unificado →
                    </Link>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">
                        Mis Transportistas
                    </h2>
                    <Button onClick={handleAddNew}>
                        + Nuevo Transportista
                    </Button>
                </div>

                {error && (
                    <Alert variant="error" title="Error" message={error} />
                )}

                {/* Lista de Transportistas */}
                {carriers.length === 0 ? (
                    <ComponentCard title="Transportistas">
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-foreground">No tienes transportistas registrados</h3>
                            <p className="mt-2 text-sm text-muted">
                                Registra tus transportistas habituales para usarlos en tus documentos de identificación.
                            </p>
                            <Button className="mt-4" onClick={handleAddNew}>
                                Añadir Primer Transportista
                            </Button>
                        </div>
                    </ComponentCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {carriers.map((carrier) => (
                            <ComponentCard key={carrier.id} title={carrier.razon_social}>
                                <div className="space-y-4">
                                    <div className="space-y-1 text-sm text-muted">
                                        <p><span className="font-medium text-foreground">CIF:</span> {carrier.cif}</p>
                                        {carrier.matricula && <p><span className="font-medium text-foreground">Matrícula Principal:</span> <span className="font-mono font-bold text-foreground">{carrier.matricula}</span></p>}
                                        {carrier.nima && <p><span className="font-medium text-foreground">NIMA:</span> {carrier.nima}</p>}
                                        {carrier.numero_autorizacion && (
                                            <p><span className="font-medium text-foreground">Autorización:</span> {carrier.numero_autorizacion}</p>
                                        )}

                                        {/* Flota y Medios (UXDEV-08 / UX-10) */}
                                        <div className="pt-2 border-t border-dashed border-stroke/70">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-foreground">Flota registrada:</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                    {(carrier.flota_vehiculos?.length || 0)} vehículo{(carrier.flota_vehiculos?.length || 0) === 1 ? '' : 's'} · {(carrier.flota_conductores?.length || 0)} conductor{(carrier.flota_conductores?.length || 0) === 1 ? '' : 'es'}
                                                </span>
                                            </div>
                                            {carrier.flota_vehiculos && carrier.flota_vehiculos.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {carrier.flota_vehiculos.slice(0, 4).map((v, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                                            {v.matricula}
                                                        </span>
                                                    ))}
                                                    {carrier.flota_vehiculos.length > 4 && (
                                                        <span className="text-[10px] text-slate-400 self-center">
                                                            +{carrier.flota_vehiculos.length - 4} más
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-stroke">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleManageFleet(carrier)}
                                            className="text-xs text-blue-600 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                        >
                                            Gestionar Flota
                                        </Button>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(carrier)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(carrier.id)}
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </ComponentCard>
                        ))}
                    </div>
                )}

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
