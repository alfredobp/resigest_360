"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../modal";
import SignaturePad from "./SignaturePad";
import Input from "@/components/form/input/InputField";

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signature: string, signerData?: { nombre?: string; dni?: string }) => void;
    title?: string;
    description?: string;
    withSignerInputs?: boolean;
    initialName?: string;
    initialDni?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
    isOpen,
    onClose,
    onSave,
    title = "Firma Digital",
    description = "Por favor, firme en el recuadro inferior para proceder.",
    withSignerInputs = false,
    initialName = "",
    initialDni = "",
}) => {
    const [nombre, setNombre] = useState(initialName);
    const [dni, setDni] = useState(initialDni);

    useEffect(() => {
        if (isOpen) {
            setNombre(initialName);
            setDni(initialDni);
        }
    }, [isOpen, initialName, initialDni]);

    const handleSave = (signature: string) => {
        onSave(signature, withSignerInputs ? { nombre, dni } : undefined);
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-muted uppercase mb-1">
                                Nombre y Apellidos
                            </label>
                            <Input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted uppercase mb-1">
                                DNI / NIF
                            </label>
                            <Input
                                type="text"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                placeholder="Ej: 12345678Z"
                            />
                        </div>
                    </div>
                )}

                <SignaturePad onSave={handleSave} onClear={() => { }} />
            </div>
        </Modal>
    );
};

export default SignatureModal;

