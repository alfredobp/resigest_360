"use client";

import React from "react";
import { Modal } from "../modal";
import SignaturePad from "./SignaturePad";

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signature: string) => void;
    title?: string;
    description?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
    isOpen,
    onClose,
    onSave,
    title = "Firma Digital",
    description = "Por favor, firme en el recuadro inferior para proceder.",
}) => {
    const handleSave = (signature: string) => {
        onSave(signature);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {description}
                </p>

                <SignaturePad onSave={handleSave} onClear={() => { }} />
            </div>
        </Modal>
    );
};

export default SignatureModal;
