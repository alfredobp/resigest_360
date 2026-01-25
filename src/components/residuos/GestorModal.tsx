'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import treatmentManagerService from '@/services/treatmentManagerService';
import type { TreatmentManager, TreatmentManagerFormData } from '@/types/wasteManagement';

interface GestorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    gestor?: TreatmentManager; // Si existe, es modo edición
}

export default function GestorModal({
    isOpen,
    onClose,
    onSuccess,
    gestor,
}: GestorModalProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<TreatmentManagerFormData>({
        nombre: '',
        razon_social: '',
        cif: '',
        nima: '',
        numero_autorizacion: '',
        direccion: '',
        codigo_postal: '',
        municipio: '',
        provincia: '',
        telefono: '',
        email: '',
        persona_contacto: '',
        notas: '',
        activo: true,
    });

    useEffect(() => {
        if (isOpen && gestor) {
            setFormData({
                nombre: gestor.nombre || '',
                razon_social: gestor.razon_social,
                cif: gestor.cif,
                nima: gestor.nima || '',
                numero_autorizacion: gestor.numero_autorizacion || '',
                direccion: gestor.direccion || '',
                codigo_postal: gestor.codigo_postal || '',
                municipio: gestor.municipio || '',
                provincia: gestor.provincia || '',
                telefono: gestor.telefono || '',
                email: gestor.email || '',
                persona_contacto: gestor.persona_contacto || '',
                notas: gestor.notas || '',
                activo: gestor.activo,
            });
        } else if (isOpen) {
            setFormData({
                nombre: '',
                razon_social: '',
                cif: '',
                nima: '',
                numero_autorizacion: '',
                direccion: '',
                codigo_postal: '',
                municipio: '',
                provincia: '',
                telefono: '',
                email: '',
                persona_contacto: '',
                notas: '',
                activo: true,
            });
        }
    }, [isOpen, gestor]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validaciones básicas
        if (!formData.nombre || !formData.razon_social || !formData.cif) {
            setError('El nombre descriptivo, la razón social y el CIF son obligatorios');
            return;
        }

        try {
            setSaving(true);
            if (gestor) {
                await treatmentManagerService.update(gestor.id, formData);
            } else {
                await treatmentManagerService.create(formData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                {gestor ? 'Editar Gestor de Tratamiento' : 'Nuevo Gestor de Tratamiento'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert variant="error" title="Error" message={error} />
                )}

                {/* Datos Básicos */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Datos de la Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Nombre / Centro *</label>
                            <Input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Planta de Reciclaje Sevilla"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Razón Social *</label>
                            <Input
                                name="razon_social"
                                value={formData.razon_social}
                                onChange={handleChange}
                                placeholder="Nombre legal de la empresa"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">CIF/NIF *</label>
                            <Input
                                name="cif"
                                value={formData.cif}
                                onChange={handleChange}
                                placeholder="B12345678"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">NIMA</label>
                            <Input
                                name="nima"
                                value={formData.nima}
                                onChange={handleChange}
                                placeholder="Número de Identificación Medioambiental"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Nº Autorización</label>
                            <Input
                                name="numero_autorizacion"
                                value={formData.numero_autorizacion}
                                onChange={handleChange}
                                placeholder="Ej: GRU-123"
                            />
                        </div>
                    </div>
                </div>

                {/* Ubicación */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Ubicación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Dirección</label>
                            <Input
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                placeholder="Calle, número, etc."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Código Postal</label>
                            <Input
                                name="codigo_postal"
                                value={formData.codigo_postal}
                                onChange={handleChange}
                                placeholder="28001"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Municipio</label>
                            <Input
                                name="municipio"
                                value={formData.municipio}
                                onChange={handleChange}
                                placeholder="Sevilla"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Provincia</label>
                            <Input
                                name="provincia"
                                value={formData.provincia}
                                onChange={handleChange}
                                placeholder="Sevilla"
                            />
                        </div>
                    </div>
                </div>

                {/* Contacto */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Persona de Contacto</label>
                            <Input
                                name="persona_contacto"
                                value={formData.persona_contacto}
                                onChange={handleChange}
                                placeholder="Nombre y apellidos"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <Input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@gestor.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Teléfono</label>
                            <Input
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="954123456"
                            />
                        </div>
                    </div>
                </div>

                {/* Otros */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium mb-2">Notas / Observaciones</label>
                    <TextArea
                        value={formData.notas || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, notas: value }))}
                        rows={2}
                        placeholder="Información adicional..."
                    />
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-end gap-3 pt-4 border-t border-stroke">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Guardando...' : gestor ? 'Actualizar Gestor' : 'Crear Gestor'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
