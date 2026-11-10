'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import { useSandbox } from '@/context/SandboxContext';

export default function SandboxRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/app';
  const { profile, profileLabel, isPathVisible, setProfile } = useSandbox();

  // Siempre permitir el acceso al propio dashboard o a rutas visibles para el rol activo
  const isDashboard = pathname === '/app';
  const allowed = profile === 'all' || isDashboard || isPathVisible(pathname);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Módulo restringido en el perfil simulado
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            El perfil activo de simulación (<strong>{profileLabel}</strong>) no tiene habilitado el acceso a{' '}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs dark:bg-gray-900">{pathname}</code>.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Volver al Panel Principal
            </Link>
            <button
              type="button"
              onClick={() => setProfile('all')}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <RotateCcw className="h-4 w-4" />
              Volver a Administrador Total
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {profile !== 'all' && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <div>
            <strong>Simulación Sandbox activa:</strong> Estás navegando con permisos limitados de{' '}
            <span className="font-semibold underline">{profileLabel}</span>.
          </div>
          <button
            type="button"
            onClick={() => setProfile('all')}
            className="inline-flex items-center gap-1 self-start rounded-md border border-amber-300 bg-white px-2.5 py-1 font-semibold text-amber-800 hover:bg-amber-100 sm:self-auto dark:border-amber-700 dark:bg-gray-900 dark:text-amber-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar vista completa
          </button>
        </div>
      )}
      {children}
    </>
  );
}

