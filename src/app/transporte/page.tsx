'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Truck,
  QrCode,
  FileText,
  MapPin,
  CheckCircle2,
  Clock,
  LogOut,
  Building2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { decaService } from '@/services/decaService';
import { identificationDocumentService } from '@/services/identificationDocumentService';
import { companyService } from '@/services/companyService';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/context/ToastContext';
import { getModuleLabel } from '@/lib/profiles/moduleCatalog';
import type { DecaDocument } from '@/types/deca';
import type { AppModule, IdentificationDocument } from '@/types/wasteManagement';

function DeniedQueryNotice() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const denied = searchParams.get('denied');
    if (denied) {
      const label = denied === 'restricted' ? 'solicitado' : getModuleLabel(denied as AppModule);
      toast.warning(`Módulo no disponible: "${label}" no está habilitado para el perfil Transportista.`);
      router.replace('/transporte');
    }
  }, [searchParams, router]);

  return null;
}

export default function TransporteMobileHomePage() {
  const router = useRouter();
  const { tenant, loading: tenantLoading, activeCompany, perfilOperativo, isPlatformAdmin, hasModule } = useTenant();

  const [decas, setDecas] = useState<DecaDocument[]>([]);
  const [dis, setDis] = useState<IdentificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (tenantLoading || !tenant) return;
    if (!tenant.hasCompletedOnboarding && !isPlatformAdmin) {
      router.replace('/onboarding');
      return;
    }
    if (!isPlatformAdmin && !hasModule('flota_transporte') && perfilOperativo !== 'transportista') {
      router.replace(tenant.homePath);
    }
  }, [tenantLoading, tenant, isPlatformAdmin, hasModule, perfilOperativo, router]);

  const loadTransportData = useCallback(async () => {
    try {
      setLoading(true);
      const [decaList, diList] = await Promise.all([
        decaService.getAll().catch(() => [] as DecaDocument[]),
        identificationDocumentService.getAll().catch(() => [] as IdentificationDocument[]),
      ]);
      setDecas(decaList);
      setDis(diList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tenantLoading && tenant) {
      loadTransportData();
    }
  }, [tenantLoading, tenant, loadTransportData]);

  const handleFinalizeDeca = async (id: number) => {
    try {
      setBusyId(id);
      await decaService.finalizeService(id);
      toast.success('Servicio marcado como finalizado.');
      await loadTransportData();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo finalizar el servicio.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSignOut = async () => {
    companyService.setActiveCompanyId(null);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/signin');
  };

  const showDemoBanner =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === 'true' &&
    tenant?.userEmail &&
    (tenant.userEmail.endsWith('.test') || tenant.userEmail === 'demo@resigest.com');

  // RES6-I09 / D04: Filtrar exclusivamente versiones vigentes del servicio
  const activeDecas = decas.filter((d) => d.is_vigente !== false && d.estado !== 'anulado' && d.estado !== 'finalizado' && d.estado !== 'sustituido');
  const finishedDecas = decas.filter((d) => d.is_vigente !== false && d.estado === 'finalizado');
  const disEnTransito = dis.filter((d) => d.estado_traslado === 'en_transito');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <Suspense fallback={null}>
        <DeniedQueryNotice />
      </Suspense>
      {/* Barra superior prueba si aplica */}
      {showDemoBanner && (
        <div className="bg-amber-100 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
          <span className="truncate font-medium">Prueba: {tenant?.userEmail}</span>
          <Link href="/accesos-prueba" className="font-bold underline shrink-0">
            Cambiar perfil
          </Link>
        </div>
      )}

      {/* Cabecera Móvil-First */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeCompany?.nombre_comercial || activeCompany?.razon_social || 'Portal Conductor'}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold">
                  Transportista
                </span>
                {activeCompany?.matricula && (
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {activeCompany.matricula}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadTransportData}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Actualizar servicios"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-6">
        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[11px] font-medium text-slate-500">DeCA Activos</p>
            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {activeDecas.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[11px] font-medium text-slate-500">DIs en Ruta</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {disEnTransito.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[11px] font-medium text-slate-500">Finalizados</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {finishedDecas.length}
            </p>
          </div>
        </div>

        {/* Servicios DeCA Activos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Servicios en Curso y Documentación (DeCA)
            </h2>
            <Link
              href="/residuos/deca"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Gestionar DeCA →
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
              Cargando servicios de transporte...
            </div>
          ) : activeDecas.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No tienes servicios DeCA activos ahora mismo.
              </p>
              <Link
                href="/residuos/deca"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                Crear o consultar histórico DeCA <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDecas.map((deca) => (
                <div
                  key={deca.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {deca.numero_deca}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${deca.estado === 'en_transito'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}
                        >
                          {deca.estado === 'en_transito' ? 'En tránsito' : 'Vigente'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Matrícula: <strong className="text-slate-700 dark:text-slate-200">{deca.matricula_tractora}</strong>
                        {deca.numero_di ? ` · DI ${deca.numero_di}` : ''}
                      </p>
                    </div>
                    {deca.es_residuo_peligroso && (
                      <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold">
                        PELIGROSO
                      </span>
                    )}
                  </div>

                  {/* Ruta Origen -> Destino */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Origen</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {deca.origen_direccion}, {deca.origen_municipio} ({deca.origen_provincia})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Destino</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {deca.destino_direccion}, {deca.destino_municipio} ({deca.destino_provincia})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span className="truncate pr-2">
                      {deca.codigo_ler ? `LER ${deca.codigo_ler} · ` : ''}
                      {deca.naturaleza_mercancia}
                    </span>
                    {deca.peso_kg ? (
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        {deca.peso_kg} kg
                      </span>
                    ) : null}
                  </div>

                  {/* Botones grandes táctiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/mobile/deca/${deca.token}`}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      <QrCode className="w-4 h-4" />
                      Mostrar QR / DeCA
                    </Link>

                    <button
                      type="button"
                      disabled={busyId === deca.id}
                      onClick={() => handleFinalizeDeca(deca.id)}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {busyId === deca.id ? 'Finalizando...' : 'Finalizar Entrega'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Documentos de Identificación asignados */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Documentos de Identificación (DI)
            </h2>
            <Link
              href="/residuos/documentos-identificacion"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          <div className="space-y-2">
            {dis.slice(0, 5).map((di) => (
              <Link
                key={di.id}
                href={`/residuos/documentos-identificacion/${di.id}`}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {di.numero_documento}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      {di.estado_traslado || di.estado}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    {di.productor_razon_social} → {di.gestor_razon_social}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* Accesos secundarios de transportista */}
        <section className="grid grid-cols-2 gap-2.5 pt-2">
          <Link
            href="/residuos/transportistas"
            className="flex items-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Mi Flota y Vehículos</span>
          </Link>
          <Link
            href="/residuos/mi-empresa"
            className="flex items-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Datos de Mi Empresa</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
