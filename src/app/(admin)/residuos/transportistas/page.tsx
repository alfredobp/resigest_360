'use client';

import { useState, useEffect } from 'react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import carrierService from '@/services/carrierService';
import type { Carrier } from '@/types/wasteManagement';
import CarrierModal from '@/components/residuos/CarrierModal';

export default function TransportistasPage() {
    const [loading, setLoading] = useState(true);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedCarrier, setSelectedCarrier] = useState<Carrier | undefined>(undefined);

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

    const handleAddNew = () => {
        setSelectedCarrier(undefined);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este transportista?')) {
            return;
        }

        try {
            await carrierService.delete(id);
            setCarriers((prev) => prev.filter((c) => c.id !== id));
        } catch (err: any) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted">Cargando transportistas...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageBreadCrumb pageTitle="Transportistas" />

            <div className="max-w-6xl mx-auto space-y-6">
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
                                        {carrier.matricula && <p><span className="font-medium text-foreground">Matrícula:</span> {carrier.matricula}</p>}
                                        {carrier.nima && <p><span className="font-medium text-foreground">NIMA:</span> {carrier.nima}</p>}
                                        {carrier.numero_autorizacion && (
                                            <p><span className="font-medium text-foreground">Autorización:</span> {carrier.numero_autorizacion}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4 border-t border-stroke">
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
            </div>
        </>
    );
}
