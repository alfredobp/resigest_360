'use client';

import React, { useState } from 'react';
import {
  Truck,
  Factory,
  Briefcase,
  ShieldCheck,
  Users,
  Check,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { ONBOARDING_ROLE_OPTIONS } from '@/config/onboardingTours';
import type { CompanyRole } from '@/types/wasteManagement';

const ROLE_ICONS: Partial<Record<CompanyRole, React.ComponentType<{ className?: string }>>> = {
  transportista: Truck,
  productor: Factory,
  negociante: Briefcase,
  gestor: ShieldCheck,
  agente: Users,
};

export default function ProfileSelectionModal() {
  const { showProfileModal, activeRole, selectRoleAndStartTour, skipOnboarding } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<CompanyRole>(activeRole ?? 'transportista');
  const [submitting, setSubmitting] = useState(false);

  if (!showProfileModal) return null;

  const pilotRoles = ONBOARDING_ROLE_OPTIONS.filter((r) => r.isPilot);
  const otherRoles = ONBOARDING_ROLE_OPTIONS.filter((r) => !r.isPilot);

  const handleStart = async () => {
    setSubmitting(true);
    try {
      await selectRoleAndStartTour(selectedRole);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/65 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xl overflow-hidden">
        {/* Cabecera con acento sutil de marca */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-brand-50/70 via-white to-white dark:from-brand-950/30 dark:via-gray-900 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-100/80 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bienvenido a ResiGest 360</span>
            </div>
            <h2
              id="onboarding-modal-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
            >
              Selecciona tu perfil operativo
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl leading-relaxed">
              Adaptaremos el recorrido guiado a tu operativa diaria (MI Empresa, DI, NT y SIRA). Podrás repetir el tour cuando quieras desde tu menú de usuario.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void skipOnboarding()}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition shrink-0"
            aria-label="Saltar configuración inicial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-6 max-h-[68vh] overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Perfiles principales
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60">
                Tour Piloto Completo
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {pilotRoles.map((item) => {
                const Icon = ROLE_ICONS[item.role] || Briefcase;
                const isSelected = selectedRole === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`group relative flex flex-col items-start text-left p-4 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/25 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-gray-50/60 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div
                        className={`p-2.5 rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/40'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Otros perfiles */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Otros perfiles (tour base)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
              {otherRoles.map((item) => {
                const Icon = ROLE_ICONS[item.role] || ShieldCheck;
                const isSelected = selectedRole === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/25 ring-2 ring-brand-500/20'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie con acciones */}
        <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void skipOnboarding()}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-200/50 dark:hover:text-white dark:hover:bg-gray-800 transition"
          >
            Saltar por ahora
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleStart()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition"
          >
            <span>{submitting ? 'Iniciando tour...' : 'Comenzar tour guiado'}</span>
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
