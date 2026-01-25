'use client';

import { useState, useEffect } from 'react';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import treatmentManagerService from '@/services/treatmentManagerService';
import type { TreatmentManager } from '@/types/wasteManagement';
import GestorModal from '@/components/residuos/GestorModal';

export default function GestoresPage() {
    const [loading, setLoading] = useState(true);
    const [gestores, setGestores] = useState<TreatmentManager[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedGestor, setSelectedGestor] = useState<TreatmentManager | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, []);

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

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este gestor?')) {
            return;
        }

        try {
            await treatmentManagerService.delete(id);
            setGestores((prev) => prev.filter((g) => g.id !== id));
        } catch (err: any) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted">Cargando gestores...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageBreadCrumb pageTitle="Gestores de Tratamiento" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">
                        Mis Gestores de Tratamiento
                    </h2>
                    <Button onClick={handleAddNew}>
                        + Nuevo Gestor
                    </Button>
                </div>

                {error && (
                    <Alert variant="error" title="Error" message={error} />
                )}

                {/* Lista de Gestores */}
                {gestores.length === 0 ? (
                    <ComponentCard title="Gestores">
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-foreground">No tienes gestores registrados</h3>
                            <p className="mt-2 text-sm text-muted">
                                Registra tus gestores habituales para usarlos en contratos y documentos de identificación.
                            </p>
                            <Button className="mt-4" onClick={handleAddNew}>
                                Añadir Primer Gestor
                            </Button>
                        </div>
                    </ComponentCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gestores.map((gestor) => (
                            <ComponentCard key={gestor.id} title={gestor.nombre}>
                                <div className="space-y-4">
                                    <div className="space-y-1 text-sm text-muted">
                                        <p><span className="font-medium text-foreground">CIF:</span> {gestor.cif}</p>
                                        {gestor.nima && <p><span className="font-medium text-foreground">NIMA:</span> {gestor.nima}</p>}
                                        {gestor.numero_autorizacion && (
                                            <p><span className="font-medium text-foreground">Autorización:</span> {gestor.numero_autorizacion}</p>
                                        )}
                                        {(gestor.municipio || gestor.provincia) && (
                                            <p>
                                                <span className="font-medium text-foreground">Ubicación:</span>{' '}
                                                {[gestor.municipio, gestor.provincia].filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4 border-t border-stroke">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(gestor)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(gestor.id)}
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

                <GestorModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={loadData}
                    gestor={selectedGestor}
                />
            </div>
        </>
    );
}
