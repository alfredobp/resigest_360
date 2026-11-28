'use client';

import React, { useState } from 'react';
import { Truck, Factory, Briefcase, ShieldCheck, Users, Check, Sparkles, X } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bienvenido a ResiGest 360</span>
            </div>
            <h2
              id="onboarding-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Selecciona tu perfil operativo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Personalizaremos el recorrido guiado por la aplicación según tu rol. Podrás repetirlo cuando quieras desde tu menú de usuario.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void skipOnboarding()}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition"
            aria-label="Saltar configuración inicial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo: Roles Piloto */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Perfiles principales (Piloto)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2.5">
              {pilotRoles.map((item) => {
                const Icon = ROLE_ICONS[item.role] || Briefcase;
                const isSelected = selectedRole === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`relative flex flex-col items-start text-left p-4 rounded-xl border-2 transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Otros perfiles (Tour base / TODO piloto) */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Otros perfiles
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              {otherRoles.map((item) => {
                const Icon = ROLE_ICONS[item.role] || ShieldCheck;
                const isSelected = selectedRole === item.role;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
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
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
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
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void skipOnboarding()}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            Saltar por ahora
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleStart()}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition"
          >
            {submitting ? 'Iniciando tour...' : 'Comenzar tour guiado'}
          </button>
        </div>
      </div>
    </div>
  );
}
