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
  Download,
  LayoutDashboard,
  Share2,
} from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import { decaService, filterVigenteServices } from '@/services/decaService';
import { buildDecaShareMessage, buildDecaWhatsAppUrl } from '@/lib/decaShare';
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
  const [activeTab, setActiveTab] = useState<'activos' | 'finalizados'>('activos');

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

  const handleGenerateDecaFromDI = async (di: IdentificationDocument) => {
    try {
      setBusyId(di.id);
      const created = await decaService.createFromIdentificationDocument(di, {
        cargador_razon_social: di.productor_razon_social,
        cargador_nif: di.productor_cif,
        cargador_domicilio: di.productor_direccion || 'Instalación del Productor',
        cargador_codigo_postal: di.productor_codigo_postal,
        cargador_municipio: di.productor_municipio,
        cargador_provincia: di.productor_provincia,
        matricula_tractora: di.transportista_matricula || activeCompany?.matricula || 'PENDIENTE',
      });
      toast.success(`DeCA ${created.numero_deca} generado desde ${di.numero_documento}.`);
      await loadTransportData();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo generar el DeCA desde el DI.');
    } finally {
      setBusyId(null);
    }
  };

  const handleShareDeca = async (deca: DecaDocument) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const message = buildDecaShareMessage(deca, origin);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `DeCA ${deca.numero_deca}`,
          text: message,
          url: `${origin}/mobile/deca/${deca.token}`,
        });
        return;
      } catch {
        // Fallback si el usuario cancela o falla
      }
    }
    window.open(buildDecaWhatsAppUrl(deca, origin), '_blank', 'noopener,noreferrer');
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

  // RES6-I09 / UXDEV-04 / UX-12: Resuelve versiones garantizando que si v2 está finalizada o activa, v1 nunca aparece como activa
  const { activeDecas, finishedDecas } = filterVigenteServices(decas);
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
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Ir al Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
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
        {/* Resumen rápido con accesos por pestaña */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('activos')}
            className={`rounded-2xl border p-3 text-center transition cursor-pointer ${activeTab === 'activos'
                ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-950/40 dark:border-blue-700'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
          >
            <p className="text-[11px] font-medium text-slate-500">DeCA Activos</p>
            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {activeDecas.length}
            </p>
          </button>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-center">
            <p className="text-[11px] font-medium text-slate-500">DIs en Ruta</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {disEnTransito.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('finalizados')}
            className={`rounded-2xl border p-3 text-center transition cursor-pointer ${activeTab === 'finalizados'
                ? 'bg-emerald-50/70 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-700'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
          >
            <p className="text-[11px] font-medium text-slate-500">Finalizados</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {finishedDecas.length}
            </p>
          </button>
        </div>

        {/* Servicios DeCA: Selector de Pestañas Hoy/Activos vs Finalizados (UXDEV-15 / UX-13) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Servicios de Transporte (DeCA)
            </h2>
            <Link
              href="/residuos/deca"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Gestionar DeCA →
            </Link>
          </div>

          {/* Selector de Pestañas Táctil */}
          <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('activos')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'activos'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En Ruta / Hoy</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                {activeDecas.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finalizados')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'finalizados'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finalizados / Histórico</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                {finishedDecas.length}
              </span>
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
              Cargando servicios de transporte...
            </div>
          ) : activeTab === 'activos' ? (
            /* Pestaña: Activos en ruta */
            activeDecas.length === 0 ? (
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <Link
                        href={`/mobile/deca/${deca.token}`}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                      >
                        <QrCode className="w-4 h-4" />
                        Mostrar QR / DeCA
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleShareDeca(deca)}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        Compartir
                      </button>

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
            )
          ) : (
            /* Pestaña: Finalizados / Histórico (UXDEV-15 / UX-13) */
            finishedDecas.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No tienes servicios finalizados en el histórico reciente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {finishedDecas.map((deca) => (
                  <div
                    key={deca.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-950 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {deca.numero_deca}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Finalizado {deca.version > 1 ? `· v${deca.version}` : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Matrícula: <strong className="text-slate-700 dark:text-slate-200">{deca.matricula_tractora}</strong>
                          {deca.conductor_nombre ? ` · Conductor: ${deca.conductor_nombre}` : ''}
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

                    {deca.fecha_finalizacion && (
                      <p className="text-[11px] text-slate-500">
                        Cerrado el {new Date(deca.fecha_finalizacion).toLocaleDateString('es-ES')} {deca.hora_cierre ? `a las ${deca.hora_cierre}` : ''}
                      </p>
                    )}

                    {/* Botones de acción móvil: Ver QR y Descargar PDF custodiado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <Link
                        href={`/mobile/deca/${deca.token}`}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition"
                      >
                        <QrCode className="w-4 h-4" />
                        Ver DeCA / QR
                      </Link>

                      <a
                        href={`/api/deca/${deca.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                      >
                        <Download className="w-4 h-4" />
                        Descargar PDF Oficial
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )
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

                    <div className="space-y-2.5">
                      {dis.slice(0, 5).map((di) => {
                        const linkedDeca = decas.find(
                          (d) =>
                            d.is_vigente !== false &&
                            (d.identification_document_id === di.id ||
                              (d.numero_di && d.numero_di === di.numero_documento))
                        );
                        return (
                <div
                  key={di.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <Link
                          href={`/residuos/documentos-identificacion/${di.id}`}
                          className="font-mono text-xs font-bold text-slate-900 dark:text-white hover:underline"
                        >
                          {di.numero_documento}
                        </Link>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {di.estado_traslado || di.estado}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {di.productor_razon_social} → {di.gestor_razon_social}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        LER {di.codigo_ler} · {di.peso_origen_kg || di.cantidad} {di.peso_origen_kg ? 'kg' : di.unidad}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={`/residuos/documentos-identificacion/${di.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
                    >
                      <span>Ver Ficha DI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {linkedDeca ? (
                      <Link
                        href={`/mobile/deca/${linkedDeca.token}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ver DeCA ({linkedDeca.numero_deca})</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === di.id}
                        onClick={() => handleGenerateDecaFromDI(di)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{busyId === di.id ? 'Generando DeCA...' : 'Generar DeCA desde DI'}</span>
                      </button>
                    )}
                  </div>
                </div>
                    );
            })}
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
