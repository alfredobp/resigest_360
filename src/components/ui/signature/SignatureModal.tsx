"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../modal";
import SignaturePad from "./SignaturePad";
import Input from "@/components/form/input/InputField";

export interface SignerModalData {
    nombre?: string;
    dni?: string;
    representacion?: string;
}

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signature: string, signerData?: SignerModalData) => void | Promise<void>;
    title?: string;
    description?: string;
    withSignerInputs?: boolean;
    withRepresentationInput?: boolean;
    requireSignerInputs?: boolean;
    initialName?: string;
    initialDni?: string;
    initialRepresentacion?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
    isOpen,
    onClose,
    onSave,
    title = "Firma Gráfica",
    description = "Por favor, firme en el recuadro inferior para proceder.",
    withSignerInputs = false,
    withRepresentationInput = false,
    requireSignerInputs = false,
    initialName = "",
    initialDni = "",
    initialRepresentacion = "",
}) => {
    const [nombre, setNombre] = useState(initialName);
    const [dni, setDni] = useState(initialDni);
    const [representacion, setRepresentacion] = useState(initialRepresentacion);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setNombre(initialName);
            setDni(initialDni);
            setRepresentacion(initialRepresentacion);
            setValidationError(null);
        }
    }, [isOpen, initialName, initialDni, initialRepresentacion]);

    const handleSave = async (signature: string) => {
        if (withSignerInputs && requireSignerInputs) {
            if (!nombre.trim() || !dni.trim()) {
                setValidationError("Debe indicar el nombre completo y el DNI/NIF de la persona firmante antes de confirmar.");
                return;
            }
            if (withRepresentationInput && !representacion.trim()) {
                setValidationError("Debe indicar el cargo o calidad de representación de la persona firmante.");
                return;
            }
        }
        setValidationError(null);
        await onSave(
            signature,
            withSignerInputs
                ? {
                    nombre: nombre.trim(),
                    dni: dni.trim().toUpperCase(),
                    ...(withRepresentationInput ? { representacion: representacion.trim() } : {}),
                }
                : undefined
        );
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {description}
                </p>

                {withSignerInputs && (
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                                    Nombre y Apellidos {requireSignerInputs && <span className="text-red-500">*</span>}
                                </label>
                                <Input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej: Juan Pérez García"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                                    DNI / NIF {requireSignerInputs && <span className="text-red-500">*</span>}
                                </label>
                                <Input
                                    type="text"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                    placeholder="Ej: 12345678Z"
                                />
                            </div>
                        </div>
                        {withRepresentationInput && (
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                                    Cargo / Calidad de Representación {requireSignerInputs && <span className="text-red-500">*</span>}
                                </label>
                                <Input
                                    type="text"
                                    value={representacion}
                                    onChange={(e) => setRepresentacion(e.target.value)}
                                    placeholder="Ej: Administrador / Apoderado / Responsable de Planta"
                                />
                            </div>
                        )}
                        {validationError && (
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                {validationError}
                            </p>
                        )}
                    </div>
                )}

                <SignaturePad onSave={handleSave} onClear={() => { }} />
            </div>
        </Modal>
    );
};

export default SignatureModal;

