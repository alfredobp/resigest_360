'use client';

// ==============================================================================
// RESIGEST 360 - SELECTOR DE PERFILES SANDBOX (PROVISIONAL)
// Permite alternar en tiempo real entre los 5 perfiles solicitados por Daniel Cantero.
// ==============================================================================

import React, { useState } from 'react';
import { useSandbox } from '@/context/SandboxContext';
import type { SandboxProfileType } from '@/types/deca';
import { Sparkles, Truck, Factory, BatteryCharging, ShieldAlert, Building2, ChevronDown, Check, Info } from 'lucide-react';

const PROFILES: { id: SandboxProfileType; label: string; icon: any; desc: string }[] = [
  {
    id: 'all',
    label: 'Modo Completo (Admin)',
    icon: Sparkles,
    desc: 'Todos los módulos habilitados sin restricciones',
  },
  {
    id: 'transportista',
    label: 'Transportista',
    icon: Truck,
    desc: 'Flota, vehículos, DeCA, DIs en tránsito y vista conductor',
  },
  {
    id: 'chatarreria',
    label: 'Chatarrería / Metales',
    icon: Factory,
    desc: 'Báscula de pesaje, compras/ventas, DIs, DeCA y archivo',
  },
  {
    id: 'baterias',
    label: 'Baterías y RAEE',
    icon: BatteryCharging,
    desc: 'Trazabilidad química, contratos, ADR, DIs y DeCA',
  },
  {
    id: 'gestor_rp',
    label: 'Gestor Residuos Peligrosos',
    icon: ShieldAlert,
    desc: 'Planta de tratamiento, SIRA Junta, Memorias y DeCA',
  },
  {
    id: 'productor',
    label: 'Productor de Residuos',
    icon: Building2,
    desc: 'Centros de origen, contratos, solicitudes de retirada y DIs',
  },
];

export default function SandboxProfileSwitcher() {
  const { profile, setProfile } = useSandbox();
  const [open, setOpen] = useState(false);

  const activeProfile = PROFILES.find((p) => p.id === profile) || PROFILES[0];
  const ActiveIcon = activeProfile.icon;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100/70 transition shadow-sm"
        title="Cambiar perfil simulado en Sandbox"
      >
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Sandbox:</span>
        <div className="flex items-center gap-1.5 font-semibold">
          <ActiveIcon className="w-3.5 h-3.5" />
          <span>{activeProfile.label}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-blue-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Simulación de Perfil
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  Provisional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Adapta el menú de RESIGEST para verificar la experiencia reducida de cada tipo de cliente.
              </p>
            </div>

            <div className="space-y-1">
              {PROFILES.map((p) => {
                const Icon = p.icon;
                const isSelected = p.id === profile;

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProfile(p.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{p.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        {p.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-2 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Info className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Se configurará definitivamente en el alta del cliente.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
