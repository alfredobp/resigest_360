'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import carrierService from '@/services/carrierService';
import type { Carrier, CarrierFormData } from '@/types/wasteManagement';

interface CarrierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    carrier?: Carrier; // Si existe, es modo edición
}

export default function CarrierModal({
    isOpen,
    onClose,
    onSuccess,
    carrier,
}: CarrierModalProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CarrierFormData>({
        razon_social: '',
        cif: '',
        nima: '',
        numero_autorizacion: '',
        matricula: '',
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
        if (isOpen && carrier) {
            setFormData({
                razon_social: carrier.razon_social,
                cif: carrier.cif,
                nima: carrier.nima || '',
                numero_autorizacion: carrier.numero_autorizacion || '',
                matricula: carrier.matricula || '',
                direccion: carrier.direccion || '',
                codigo_postal: carrier.codigo_postal || '',
                municipio: carrier.municipio || '',
                provincia: carrier.provincia || '',
                telefono: carrier.telefono || '',
                email: carrier.email || '',
                persona_contacto: carrier.persona_contacto || '',
                notas: carrier.notas || '',
                activo: carrier.activo,
            });
        } else if (isOpen) {
            setFormData({
                razon_social: '',
                cif: '',
                nima: '',
                numero_autorizacion: '',
                matricula: '',
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
    }, [isOpen, carrier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.razon_social || !formData.cif) {
            setError('La razón social y el CIF son obligatorios');
            return;
        }

        try {
            setSaving(true);
            if (carrier) {
                await carrierService.update(carrier.id, formData);
            } else {
                await carrierService.create(formData);
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
                {carrier ? 'Editar Transportista' : 'Nuevo Transportista'}
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
                            <label className="block text-sm font-medium mb-2">Razón Social *</label>
                            <Input
                                name="razon_social"
                                value={formData.razon_social}
                                onChange={handleChange}
                                placeholder="Nombre completo de la empresa"
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
                            <label className="block text-sm font-medium mb-2">Matrícula</label>
                            <Input
                                name="matricula"
                                value={formData.matricula}
                                onChange={handleChange}
                                placeholder="1234BBB"
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
                                placeholder="Ej: T-12345"
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
                                placeholder="Madrid"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Provincia</label>
                            <Input
                                name="provincia"
                                value={formData.provincia}
                                onChange={handleChange}
                                placeholder="Madrid"
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
                                placeholder="email@empresa.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Teléfono</label>
                            <Input
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="911234567"
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
                        {saving ? 'Guardando...' : carrier ? 'Actualizar Transportista' : 'Crear Transportista'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
