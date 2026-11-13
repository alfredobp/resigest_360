'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from './index';
import Button from '@/components/ui/button/Button';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const busy = isLoading || internalLoading;

  const variantConfig = {
    danger: {
      defaultTitle: 'Confirmar eliminación',
      defaultConfirmLabel: 'Sí, eliminar',
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 ring-8 ring-red-50/50 dark:ring-red-500/5',
      icon: <Trash2 className="w-6 h-6" />,
      buttonClass: '!bg-red-600 hover:!bg-red-700 !text-white shadow-sm disabled:!bg-red-400',
    },
    warning: {
      defaultTitle: 'Confirmar acción',
      defaultConfirmLabel: 'Confirmar',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 ring-8 ring-amber-50/50 dark:ring-amber-500/5',
      icon: <AlertTriangle className="w-6 h-6" />,
      buttonClass: '!bg-amber-600 hover:!bg-amber-700 !text-white shadow-sm disabled:!bg-amber-400',
    },
    primary: {
      defaultTitle: 'Confirmar operación',
      defaultConfirmLabel: 'Confirmar',
      iconBg: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 ring-8 ring-brand-50/50 dark:ring-brand-500/5',
      icon: <CheckCircle2 className="w-6 h-6" />,
      buttonClass: '',
    },
  }[variant];

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    if (!busy) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md p-6 sm:p-7"
      showCloseButton={!busy}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variantConfig.iconBg}`}>
          {variantConfig.icon}
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {title || variantConfig.defaultTitle}
        </h3>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {message}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={busy}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={busy}
            className={`flex-1 ${variantConfig.buttonClass}`}
          >
            {busy ? 'Procesando...' : (confirmLabel || variantConfig.defaultConfirmLabel)}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
