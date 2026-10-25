'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import treatmentManagerService from '@/services/treatmentManagerService';
import {
    validateRequired,
    validateCIF,
    validateNIMA,
    validateEmail,
} from '@/lib/validations/formValidation';
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (field: string) => {
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const { [field]: _, ...rest } = prev;
            return rest;
        });
    };

    const validateField = (field: string) => {
        let err: string | null = null;
        if (field === 'nombre') {
            err = validateRequired(formData.nombre);
        } else if (field === 'razon_social') {
            err = validateRequired(formData.razon_social);
        } else if (field === 'cif') {
            err = validateCIF(formData.cif, true);
        } else if (field === 'nima' && formData.nima) {
            err = validateNIMA(formData.nima, false);
        } else if (field === 'email' && formData.email) {
            err = validateEmail(formData.email, false);
        }

        setFieldErrors((prev) => {
            if (err) {
                return { ...prev, [field]: err };
            }
            const { [field]: _, ...rest } = prev;
            return rest;
        });
    };

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
            setFieldErrors({});
            setError(null);
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
                telefono: carrierOrGestorPhone(gestor),
                email: gestor.email || '',
                persona_contacto: gestor.persona_contacto || '',
                notas: gestor.notas || '',
                activo: gestor.activo,
            });
        } else if (isOpen) {
            setFieldErrors({});
            setError(null);
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

    function carrierOrGestorPhone(g: TreatmentManager): string {
        return g.telefono || '';
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const errorsMap: Record<string, string> = {};
        const nombreErr = validateRequired(formData.nombre);
        if (nombreErr) errorsMap.nombre = nombreErr;

        const razonErr = validateRequired(formData.razon_social);
        if (razonErr) errorsMap.razon_social = razonErr;

        const cifErr = validateCIF(formData.cif, true);
        if (cifErr) errorsMap.cif = cifErr;

        if (formData.nima) {
            const nimaErr = validateNIMA(formData.nima, false);
            if (nimaErr) errorsMap.nima = nimaErr;
        }

        if (formData.email) {
            const emailErr = validateEmail(formData.email, false);
            if (emailErr) errorsMap.email = emailErr;
        }

        if (Object.keys(errorsMap).length > 0) {
            setFieldErrors(errorsMap);
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

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {error && (
                    <Alert variant="error" title="Error" message={error} />
                )}

                {/* Datos Básicos */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Datos de la Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="gestor_nombre" required>
                                Nombre / Centro
                            </Label>
                            <Input
                                id="gestor_nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                onBlur={() => validateField('nombre')}
                                placeholder="Ej: Planta de Reciclaje Sevilla"
                                error={Boolean(fieldErrors.nombre)}
                                hint={fieldErrors.nombre}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="gestor_razon_social" required>
                                Razón Social
                            </Label>
                            <Input
                                id="gestor_razon_social"
                                name="razon_social"
                                value={formData.razon_social}
                                onChange={handleChange}
                                onBlur={() => validateField('razon_social')}
                                placeholder="Nombre legal de la empresa"
                                error={Boolean(fieldErrors.razon_social)}
                                hint={fieldErrors.razon_social}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="gestor_cif" required>
                                CIF / NIF
                            </Label>
                            <Input
                                id="gestor_cif"
                                name="cif"
                                value={formData.cif}
                                onChange={handleChange}
                                onBlur={() => validateField('cif')}
                                placeholder="B12345678"
                                error={Boolean(fieldErrors.cif)}
                                hint={fieldErrors.cif}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="gestor_nima">NIMA</Label>
                            <Input
                                id="gestor_nima"
                                name="nima"
                                value={formData.nima}
                                onChange={handleChange}
                                onBlur={() => validateField('nima')}
                                error={Boolean(fieldErrors.nima)}
                                hint={fieldErrors.nima}
                                placeholder="Número de Identificación Medioambiental"
                            />
                        </div>

                        <div>
                            <Label htmlFor="gestor_numero_autorizacion">Nº Autorización</Label>
                            <Input
                                id="gestor_numero_autorizacion"
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
                            <Label htmlFor="gestor_direccion">Dirección</Label>
                            <Input
                                id="gestor_direccion"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                placeholder="Calle, número, etc."
                            />
                        </div>

                        <div>
                            <Label htmlFor="gestor_codigo_postal">Código Postal</Label>
                            <Input
                                id="gestor_codigo_postal"
                                name="codigo_postal"
                                value={formData.codigo_postal}
                                onChange={handleChange}
                                placeholder="28001"
                            />
                        </div>

                        <div>
                            <Label htmlFor="gestor_municipio">Municipio</Label>
                            <Input
                                id="gestor_municipio"
                                name="municipio"
                                value={formData.municipio}
                                onChange={handleChange}
                                placeholder="Sevilla"
                            />
                        </div>

                        <div>
                            <Label htmlFor="gestor_provincia">Provincia</Label>
                            <Input
                                id="gestor_provincia"
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
                            <Label htmlFor="gestor_persona_contacto">Persona de Contacto</Label>
                            <Input
                                id="gestor_persona_contacto"
                                name="persona_contacto"
                                value={formData.persona_contacto}
                                onChange={handleChange}
                                placeholder="Nombre y apellidos"
                            />
                        </div>

                        <div>
                            <Label htmlFor="gestor_email">Email</Label>
                            <Input
                                id="gestor_email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={() => validateField('email')}
                                error={Boolean(fieldErrors.email)}
                                hint={fieldErrors.email}
                                placeholder="email@gestor.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="gestor_telefono">Teléfono</Label>
                            <Input
                                id="gestor_telefono"
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
                    <Label htmlFor="gestor_notas">Notas / Observaciones</Label>
                    <TextArea
                        id="gestor_notas"
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
