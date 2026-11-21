'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Factory,
  Truck,
  UserPlus,
  Briefcase,
  DollarSign,
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import Logo from '@/components/common/Logo';

type DemoProfileKey =
  | 'productor'
  | 'gestor'
  | 'transportista'
  | 'nuevo'
  | 'consultor'
  | 'negociante';

interface DemoCardItem {
  key: DemoProfileKey;
  title: string;
  buttonLabel: string;
  company: string;
  email: string;
  badge: string;
  description: string;
  highlights: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  group: 'bloque1' | 'bloque2';
}

const DEMO_CARDS: DemoCardItem[] = [
  {
    key: 'productor',
    title: 'Productor de Residuos',
    buttonLabel: 'Entrar como productor',
    company: 'Industrias Metálicas del Sur S.L.',
    email: 'productor.prueba@resigest.test',
    badge: 'Perfil Productor',
    description:
      'Panel enfocado a generación de residuos, contratos vigentes, retiradas, DIs y archivo cronológico. Sin módulos de compraventa ni báscula.',
    highlights: ['4 DIs de ejemplo', '1 contrato vigente', 'Sin acceso a /residuos/operaciones'],
    icon: Building2,
    accentClass: 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20',
    group: 'bloque1',
  },
  {
    key: 'gestor',
    title: 'Gestor / Chatarrería',
    buttonLabel: 'Entrar como gestor',
    company: 'Chatarrería y Recuperaciones Toledo S.L.',
    email: 'gestor.prueba@resigest.test',
    badge: 'Chatarrería / Planta',
    description:
      'Panel operativo de planta con entradas, salidas, pesajes en báscula, existencias por LER, compraventa de chatarra y archivo cronológico.',
    highlights: ['Entradas vs Salidas', 'Existencias en planta', 'Báscula y liquidación'],
    icon: Factory,
    accentClass: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20',
    group: 'bloque1',
  },
  {
    key: 'transportista',
    title: 'Transportista',
    buttonLabel: 'Entrar como transportista',
    company: 'TransLogística Ambiental Express S.L.',
    email: 'transportista.prueba@resigest.test',
    badge: 'Perfil Transportista',
    description:
      'Panel de transporte con consulta de servicios asignados, DIs en tránsito, control DeCA/QR y acceso opcional a la Vista Conductor (Móvil).',
    highlights: ['Dashboard de transporte', '2 DeCA con QR móvil', 'Sin módulos administrativos'],
    icon: Truck,
    accentClass: 'border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20',
    group: 'bloque1',
  },
  {
    key: 'nuevo',
    title: 'Cliente Nuevo (Primer Acceso)',
    buttonLabel: 'Probar alta desde cero',
    company: 'Sin empresa configurada',
    email: 'nuevo.prueba@resigest.test',
    badge: 'Onboarding Inicial',
    description:
      'Simula qué ve y qué pasos sigue un cliente la primera vez que entra en ResiGest 360 para configurar su actividad y empresa.',
    highlights: ['Asistente /onboarding', 'Selección de módulos', 'Configuración inicial'],
    icon: UserPlus,
    accentClass: 'border-purple-200 bg-purple-50/60 dark:border-purple-900/50 dark:bg-purple-950/20',
    group: 'bloque1',
  },
  {
    key: 'consultor',
    title: 'Consultor Método Ambiental',
    buttonLabel: 'Entrar como consultor',
    company: 'Método Ambiental Consultoría S.L.',
    email: 'consultor.prueba@metodoambiental.test',
    badge: 'Multi-Empresa',
    description:
      'Vista de consultoría con selector en cabecera para cambiar entre empresas clientes autorizadas (Productor y Chatarrería) sin mezclar datos.',
    highlights: ['Selector de empresa activa', 'Acceso delegado RLS', 'Sin info comercial privada'],
    icon: Briefcase,
    accentClass: 'border-teal-200 bg-teal-50/60 dark:border-teal-900/50 dark:bg-teal-950/20',
    group: 'bloque2',
  },
  {
    key: 'negociante',
    title: 'Negociante (Comercial Aislado)',
    buttonLabel: 'Entrar como negociante',
    company: 'Iberia Waste Trading S.L.',
    email: 'negociante.prueba@resigest.test',
    badge: 'Trading Privado',
    description:
      'Operaciones comerciales de compraventa, costes logísticos y márgenes netos totalmente aislados del resto de empresas y consultores.',
    highlights: ['Márgenes y rentabilidad', 'Trazabilidad compra/venta', 'Aislamiento estricto RLS'],
    icon: DollarSign,
    accentClass: 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40',
    group: 'bloque2',
  },
];

export default function QuickTestAccessPage() {
  const [loadingKey, setLoadingKey] = useState<DemoProfileKey | 'fixture_onboarding' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === 'true';

  const handleLaunchCleanOnboardingFixture = async () => {
    setError(null);
    setLoadingKey('fixture_onboarding');
    try {
      const res = await fetch('/api/demo/onboarding-fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProfile: 'productor' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'No se pudo crear la cuenta vacía desechable de onboarding.');
        setLoadingKey(null);
        return;
      }

      window.location.assign(data.redirectTo || '/onboarding');
    } catch {
      setError('Error de red al conectar con /api/demo/onboarding-fixture.');
      setLoadingKey(null);
    }
  };

  const handleEnterAs = async (profileKey: DemoProfileKey) => {
    setError(null);
    setLoadingKey(profileKey);
    try {
      const res = await fetch('/api/demo/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'No se pudo iniciar sesión en el perfil de prueba.');
        setLoadingKey(null);
        return;
      }

      // Navegación completa para recargar TenantContext y cookies SSR limpiamente
      window.location.assign(data.redirectTo || '/app');
    } catch {
      setError('Error de red al conectar con /api/demo/signin.');
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/signin"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver al inicio de sesión normal
            </Link>
            <div className="flex items-center gap-3">
              <Logo width={180} height={60} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Accesos Directos de Prueba (Cuentas Reales Independientes)
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
              Cada botón inicia una sesión real en Supabase con un usuario estándar independiente (sin permisos de superadministrador)
              y con datos separados en base de datos para validar permisos, rutas, onboarding y dashboards adaptados.
            </p>
          </div>
        </div>

        {!demoEnabled && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30 p-5 flex items-start gap-3 text-sm text-red-800 dark:text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Acceso rápido de pruebas deshabilitado</p>
              <p className="mt-1">
                Activa <code className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/50">ENABLE_DEMO_ACCESS=true</code> y{' '}
                <code className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/50">NEXT_PUBLIC_ENABLE_DEMO_ACCESS=true</code> en tu entorno para utilizar el inicio en 1 clic.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30 p-4 flex items-start gap-3 text-sm text-red-800 dark:text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo acceder con la cuenta de prueba</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Bloque 1 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Perfiles Operativos y Primer Acceso
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_CARDS.filter((c) => c.group === 'bloque1').map((card) => {
              const Icon = card.icon;
              const isLoading = loadingKey === card.key;
              return (
                <div
                  key={card.key}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition hover:shadow-md ${card.accentClass}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-gray-900 shadow-sm text-gray-800 dark:text-gray-200">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{card.title}</h3>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {card.company}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700">
                        {card.badge}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {card.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {card.highlights.map((h) => (
                        <span
                          key={h}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white/70 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-800"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                      {card.email}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {card.key === 'nuevo' && (
                        <button
                          type="button"
                          disabled={!demoEnabled || loadingKey !== null}
                          onClick={handleLaunchCleanOnboardingFixture}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
                          title="Crea una cuenta completamente nueva y vacía sin alterar evidencias previas (UXDEV-16)"
                        >
                          {loadingKey === 'fixture_onboarding' ? 'Creando cuenta...' : 'Nueva cuenta vacía (UXDEV-16)'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!demoEnabled || loadingKey !== null}
                        onClick={() => handleEnterAs(card.key)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
                      >
                        {isLoading ? 'Accediendo...' : card.buttonLabel}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bloque 2 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Consultoría Método Ambiental y Negociante Aislado
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_CARDS.filter((c) => c.group === 'bloque2').map((card) => {
              const Icon = card.icon;
              const isLoading = loadingKey === card.key;
              return (
                <div
                  key={card.key}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition hover:shadow-md ${card.accentClass}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-gray-900 shadow-sm text-gray-800 dark:text-gray-200">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{card.title}</h3>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {card.company}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700">
                        {card.badge}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {card.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {card.highlights.map((h) => (
                        <span
                          key={h}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white/70 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-800"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                      {card.email}
                    </span>
                    <button
                      type="button"
                      disabled={!demoEnabled || loadingKey !== null}
                      onClick={() => handleEnterAs(card.key)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-brand-500 dark:hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
                    >
                      {isLoading ? 'Accediendo...' : card.buttonLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-xs text-gray-500 dark:text-gray-400">
          <strong>Requisito previo en Supabase:</strong> ejecuta las migraciones{' '}
          <code>20261110100000_company_profiles_and_modules.sql</code>,{' '}
          <code>20261110110000_consultancy_memberships_and_trader_isolation.sql</code> y el script{' '}
          <code>src/SQL/seed-test-profiles.sql</code> en el SQL Editor para crear/reiniciar las cuentas independientes y sus datos de ejemplo.
        </div>
      </div>
    </div>
  );
}
