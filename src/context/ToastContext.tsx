'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_EVENT_NAME = 'resigest_toast_event';

// Global helper that can be called anywhere (inside or outside React components)
export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    dispatchToastEvent('success', message, title, duration);
  },
  error: (message: string, title?: string, duration?: number) => {
    dispatchToastEvent('error', message, title, duration || 6000);
  },
  warning: (message: string, title?: string, duration?: number) => {
    dispatchToastEvent('warning', message, title, duration);
  },
  info: (message: string, title?: string, duration?: number) => {
    dispatchToastEvent('info', message, title, duration);
  },
};

function dispatchToastEvent(type: ToastType, message: string, title?: string, duration?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT_NAME, {
        detail: { type, message, title, duration },
      })
    );
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration?: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const defaultDuration = duration || (type === 'error' ? 6000 : 4500);

      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration: defaultDuration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (defaultDuration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, defaultDuration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => addToast('success', message, title, duration),
    [addToast]
  );
  const error = useCallback(
    (message: string, title?: string, duration?: number) => addToast('error', message, title, duration || 6000),
    [addToast]
  );
  const warning = useCallback(
    (message: string, title?: string, duration?: number) => addToast('warning', message, title, duration),
    [addToast]
  );
  const info = useCallback(
    (message: string, title?: string, duration?: number) => addToast('info', message, title, duration),
    [addToast]
  );

  // Listen to custom events from global toast helper
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: ToastType;
        message: string;
        title?: string;
        duration?: number;
      }>;
      if (customEvent.detail) {
        const { type, message, title, duration } = customEvent.detail;
        addToast(type, message, title, duration);
      }
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToastEvent);

    // Intercept native window.alert to automatically convert any residual alert into a toast
    const originalAlert = window.alert;
    window.alert = (message?: any) => {
      const msg = String(message ?? '');
      const lower = msg.toLowerCase();
      if (lower.includes('error') || lower.includes('falló') || lower.includes('fallo') || lower.includes('no es posible')) {
        addToast('error', msg, 'Error');
      } else if (lower.includes('obligatorio') || lower.includes('requerido') || lower.includes('atención') || lower.includes('aviso')) {
        addToast('warning', msg, 'Aviso');
      } else if (lower.includes('éxito') || lower.includes('exito') || lower.includes('correctamente') || lower.includes('satisfactoriamente') || lower.includes('copiado')) {
        addToast('success', msg, 'Éxito');
      } else {
        addToast('info', msg, 'Notificación');
      }
    };

    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleToastEvent);
      window.alert = originalAlert;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// UI Component for Floating Toasts
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0 transition-all"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const config = {
    success: {
      border: 'border-emerald-500/30 dark:border-emerald-500/30',
      bg: 'bg-white/95 dark:bg-gray-900/95',
      badgeBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />,
      defaultTitle: 'Operación Exitosa',
      accentBar: 'bg-emerald-500',
    },
    error: {
      border: 'border-rose-500/30 dark:border-rose-500/30',
      bg: 'bg-white/95 dark:bg-gray-900/95',
      badgeBg: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
      icon: <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />,
      defaultTitle: 'Ha ocurrido un error',
      accentBar: 'bg-rose-500',
    },
    warning: {
      border: 'border-amber-500/30 dark:border-amber-500/30',
      bg: 'bg-white/95 dark:bg-gray-900/95',
      badgeBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
      icon: <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />,
      defaultTitle: 'Advertencia',
      accentBar: 'bg-amber-500',
    },
    info: {
      border: 'border-sky-500/30 dark:border-sky-500/30',
      bg: 'bg-white/95 dark:bg-gray-900/95',
      badgeBg: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
      icon: <Info className="w-5 h-5 shrink-0 text-sky-600 dark:text-sky-400" />,
      defaultTitle: 'Información',
      accentBar: 'bg-sky-500',
    },
  }[toast.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 ease-out transform translate-y-0 opacity-100 flex items-start p-4 gap-3.5 ${config.bg} ${config.border}`}
    >
      {/* Accent left line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentBar}`} />

      {/* Icon Badge */}
      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${config.badgeBg}`}>
        {config.icon}
      </div>

      {/* Message and Title */}
      <div className="flex-1 min-w-0 pr-2">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
          {toast.title || config.defaultTitle}
        </h5>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
