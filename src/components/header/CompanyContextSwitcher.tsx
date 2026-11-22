'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ChevronDown, Check, Briefcase, ShieldCheck, Clock } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { PROFILE_DEFINITIONS, normalizeOperationalProfile } from '@/lib/profiles/moduleCatalog';
import { toast } from '@/context/ToastContext';

export default function CompanyContextSwitcher() {
  const {
    accessibleCompanies,
    activeCompanyId,
    activeCompany,
    switchCompany,
    exitDelegationContext,
    isPlatformAdmin,
    isDelegated,
    membershipRole,
    canViewCommercial,
    activeDelegationExpiresAt,
  } = useTenant();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const shouldShowDropdown =
    isPlatformAdmin || (accessibleCompanies && accessibleCompanies.length > 1);

  if (!shouldShowDropdown) {
    if (!activeCompany) return null;

    const prof = normalizeOperationalProfile(
      activeCompany.perfil_operativo,
      activeCompany.tipo_empresa,
      activeCompany.roles
    );
    const def = PROFILE_DEFINITIONS[prof];

    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 text-xs">
        <Building2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
        <span className="font-semibold text-gray-800 dark:text-gray-200 max-w-[180px] truncate">
          {activeCompany.nombre_comercial || activeCompany.razon_social}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[10px] font-bold">
          {def.shortLabel}
        </span>
      </div>
    );
  }

  const handleSelect = async (companyId: number, label: string) => {
    setOpen(false);
    if (companyId === activeCompanyId) return;
    await switchCompany(companyId);
    toast.success(`Actuando ahora en nombre de: ${label}`);
    router.refresh();
  };

  const activeName =
    activeCompany?.nombre_comercial ||
    activeCompany?.razon_social ||
    (isPlatformAdmin ? 'Seleccionar empresa...' : 'Seleccionar empresa');

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition shadow-sm ${isDelegated
          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100/70'
          : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/70'
          }`}
        title={
          isPlatformAdmin
            ? 'Actuar en nombre de una empresa delegada'
            : 'Cambiar entre empresas autorizadas (Consultoría)'
        }
      >
        {isDelegated ? (
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}
        <span
          className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${isDelegated
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-emerald-700 dark:text-emerald-400'
            }`}
        >
          {isDelegated || isPlatformAdmin ? 'Actuar en nombre de:' : 'Empresa:'}
        </span>
        <span className="font-semibold max-w-[170px] truncate">{activeName}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-84 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50">
            <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isPlatformAdmin ? 'Actuar en nombre de...' : 'Empresas Autorizadas (Consultoría)'}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Aislamiento estricto por empresa activa y trazabilidad en auditoría.
              </p>
              {isDelegated && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[10px] text-amber-700 dark:text-amber-300">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 font-semibold">
                    Rol: {membershipRole}
                  </span>
                  {!canViewCommercial && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Comercial oculto
                    </span>
                  )}
                  {activeDelegationExpiresAt && (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      Hasta {new Date(activeDelegationExpiresAt).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {accessibleCompanies.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                Aún no tienes ninguna empresa delegada vigente.
              </div>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {accessibleCompanies.map((entry) => {
                  const { company, membershipRole: role, canViewCommercial: canComm, isOwner, expiresAt } = entry;
                  const isSelected = company.id === activeCompanyId;
                  const prof = normalizeOperationalProfile(
                    company.perfil_operativo,
                    company.tipo_empresa,
                    company.roles
                  );
                  const def = PROFILE_DEFINITIONS[prof];
                  const displayName = company.nombre_comercial || company.razon_social;

                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleSelect(company.id, displayName)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition ${isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate">{displayName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium">
                            {def.shortLabel}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isOwner ? 'Propia' : `Delegada (${role})`}
                          </span>
                          {!canComm && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400">
                              · Sin comercial
                            </span>
                          )}
                          {!isOwner && expiresAt && (
                            <span className="text-[10px] text-slate-400">
                              · Cad. {new Date(expiresAt).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {isPlatformAdmin && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  {activeCompany && (
                    <button
                      type="button"
                      onClick={async () => {
                        setOpen(false);
                        await exitDelegationContext();
                        toast.info('Has vuelto al modo Control de Plataforma.');
                        router.push('/platform-admin');
                      }}
                      className="block w-full text-center px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                    >
                      Salir de esta empresa (Solo Control Admin)
                    </button>
                  )}
                  <Link
                    href="/platform-admin"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center px-3 py-2 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                  >
                    Gestionar empresas y delegaciones →
                  </Link>
                </div>
            )}
              </div>
        </>
      )}
        </div>
      );
}
