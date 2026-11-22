'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSandbox } from '@/context/SandboxContext';
import { useTenant } from '@/context/TenantContext';
import { getDefaultModulesForProfile } from '@/lib/profiles/moduleCatalog';
import dashboardService, { type ExecutiveDashboardData } from '@/services/dashboardService';
import MonthlyWasteChart from '@/components/dashboard/MonthlyWasteChart';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import {
  getDashboardHeaderConfig,
  ProfileKpiGrid,
  ProfileShortcutsCard,
} from '@/components/dashboard/profiles/ProfileDashboardSections';
import ScrapYardEntryModal from '@/components/residuos/ScrapYardEntryModal';
import fleetService from '@/services/fleetService';
import {
  getDriverComplianceAlerts,
  getVehicleComplianceAlerts,
} from '@/lib/validations/fleetValidation';
import { AlertTriangle, Truck } from 'lucide-react';
import type { AppModule, FleetComplianceAlert, OperationalProfile } from '@/types/wasteManagement';

export default function ExecutiveDashboardPage() {
  const router = useRouter();
  const { profile: sandboxProfile } = useSandbox();
  const {
    tenant,
    loading: tenantLoading,
    activeCompanyId,
    perfilOperativo,
    isPlatformAdmin,
    hasModule,
    canViewCommercial,
  } = useTenant();

  // Si se selecciona un perfil en el Sandbox, usar la simulación; en otro caso usar el perfil persistido
  const effectiveProfile: OperationalProfile =
    sandboxProfile && sandboxProfile !== 'all'
      ? (sandboxProfile as OperationalProfile)
      : perfilOperativo;

  const effectiveHasModule = (mod: AppModule) => {
    if (sandboxProfile && sandboxProfile !== 'all') {
      return getDefaultModulesForProfile(effectiveProfile).includes(mod);
    }
    return hasModule(mod);
  };

  const effectiveCanViewCommercial =
    sandboxProfile && sandboxProfile !== 'all'
      ? (effectiveProfile === 'chatarreria' || effectiveProfile === 'negociante' || effectiveProfile === 'completo')
      : canViewCommercial;

  const canCreateDI =
    effectiveHasModule('di') && (isPlatformAdmin || effectiveProfile !== 'transportista');
  const canCreateOp = effectiveHasModule('operaciones_comerciales') && (isPlatformAdmin || effectiveCanViewCommercial);
  const canViewChrono = effectiveHasModule('archivo_cronologico');
  const canViewContracts = effectiveHasModule('contratos');

  const [loading, setLoading] = useState(true);
  const [executiveData, setExecutiveData] = useState<ExecutiveDashboardData | null>(null);
  const [monthlyData, setMonthlyData] = useState<Array<{ name: string; value: number }>>([]);
  const [recentDIs, setRecentDIs] = useState<any[]>([]);
  const [fleetAlerts, setFleetAlerts] = useState<FleetComplianceAlert[]>([]);
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const scopedCompanyId = isPlatformAdmin && !activeCompanyId ? null : activeCompanyId;
      const shouldLoadFleet = effectiveHasModule('flota_transporte');
      const [overview, monthly, recent, drivers, vehicles] = await Promise.all([
        dashboardService.getExecutiveOverview({
          companyId: scopedCompanyId,
          includeCommercial: canCreateOp,
        }),
        dashboardService.getMonthlyWasteData(scopedCompanyId),
        dashboardService.getRecentActivity(scopedCompanyId),
        shouldLoadFleet
          ? fleetService.getDrivers({ companyId: scopedCompanyId }).catch(() => [])
          : Promise.resolve([]),
        shouldLoadFleet
          ? fleetService.getVehicles({ companyId: scopedCompanyId }).catch(() => [])
          : Promise.resolve([]),
      ]);

      setExecutiveData(overview);
      setMonthlyData(monthly);
      setRecentDIs(recent);
      setFleetAlerts([
        ...vehicles.flatMap((v) => getVehicleComplianceAlerts(v)),
        ...drivers.flatMap((d) => getDriverComplianceAlerts(d)),
      ]);
    } catch (err) {
      console.error('Error al cargar datos del dashboard ejecutivo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantLoading) return;
    loadData();
  }, [tenantLoading, activeCompanyId, isPlatformAdmin, canCreateOp, tenant?.userId]);

  if (loading || tenantLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Cargando panel operativo">
        {/* Cabecera skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-96 max-w-full rounded bg-slate-200/80 dark:bg-slate-800/80" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        {/* KPIs skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
              <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-7 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-40 rounded bg-slate-100 dark:bg-slate-800/70" />
            </div>
          ))}
        </div>
        {/* Gráfico y Top LER skeleton */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 h-80 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5" />
          <div className="col-span-12 xl:col-span-4 h-80 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-full rounded bg-slate-200/80 dark:bg-slate-800/80" />
                <div className="h-1.5 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = executiveData || {
    conformidad: { estado: 'pendiente' as const, porcentaje: null, totalEvaluados: 0, totalConformes: 0, totalNoConformes: 0, fechaEvaluacion: new Date().toISOString() },
    alertas: { totalCriticas: 0, totalAdvertencias: 0, lista: [], disEnTransitoCount: 0, disDiscrepanciaCount: 0, disSinContratoCount: 0, disTratamientoNoAutorizadoCount: 0, contratosCaducadosCount: 0, contratosPorVencerCount: 0, autorizacionesPorVencerCount: 0 },
    residuos: { totalToneladas: 0, toneladasPeligrosas: 0, toneladasNoPeligrosas: 0, totalDIs: 0, disCompletados: 0, topLER: [] },
    comercial: { totalOperaciones: 0, operacionesAbiertas: 0, facturacionVenta: 0, costesTotales: 0, margenBrutoTotal: 0, margenMedioTon: 0, rentabilidadPorcentaje: 0 },
  };

  const { conformidad, alertas, residuos } = data;
  const headerConfig = getDashboardHeaderConfig(effectiveProfile);
  const hasAlerts = alertas.totalCriticas > 0 || alertas.totalAdvertencias > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera Ejecutiva Adaptada */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {headerConfig.title}
            </h1>
            <Badge variant="light" color="primary">
              {headerConfig.badge}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {headerConfig.subtitle}
          </p>
        </div>

        {/* Acciones Rápidas según perfil */}
        <div className="flex flex-wrap items-center gap-2">
          {effectiveProfile === 'transportista' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/residuos/flota')}
                className="bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-sm transition-colors"
              >
                Mi Flota (Conductores y Vehículos)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/transporte')}
                className="text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                Vista Conductor (Móvil)
              </Button>
            </>
          )}

          {effectiveProfile === 'negociante' && canCreateOp && (
            <Button
              size="sm"
              onClick={() => router.push('/residuos/operaciones/nueva')}
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-sm transition-colors"
            >
              Nueva Operación
            </Button>
          )}

          {canCreateDI && (
            <Button
              variant={effectiveProfile === 'negociante' ? 'outline' : 'primary'}
              size="sm"
              onClick={() =>
                router.push(
                  effectiveProfile === 'chatarreria'
                    ? '/residuos/documentos-identificacion/nuevo?perspectiva=productor'
                    : '/residuos/documentos-identificacion/nuevo'
                )
              }
              className={
                effectiveProfile === 'negociante'
                  ? 'text-gray-700 dark:text-gray-300 font-medium'
                  : 'bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-sm transition-colors'
              }
            >
              {effectiveProfile === 'productor'
                ? 'Nueva Retirada (DI)'
                : effectiveProfile === 'chatarreria'
                  ? 'Nueva Salida (Expedición)'
                  : 'Nuevo Traslado (DI)'}
            </Button>
          )}

          {effectiveProfile !== 'negociante' && canCreateOp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (effectiveProfile === 'chatarreria') {
                  setIsScrapModalOpen(true);
                } else {
                  router.push('/residuos/operaciones/nueva');
                }
              }}
              className="text-brand-600 dark:text-brand-400 font-medium hover:bg-brand-50 dark:hover:bg-brand-950/40"
            >
              {effectiveProfile === 'chatarreria' ? 'Nueva Entrada (Báscula / Recepción)' : 'Nueva Operación'}
            </Button>
          )}

          {canViewContracts && effectiveProfile === 'productor' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/residuos/contratos')}
              className="text-gray-700 dark:text-gray-300 font-medium"
            >
              Contratos
            </Button>
          )}

          {canViewChrono && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/residuos/archivo-cronologico')}
              className="text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              Archivo Cronológico
            </Button>
          )}
        </div>
      </div>

      {/* CENTRO DE ALERTAS Y CONTROL POR EXCEPCIÓN */}
      {fleetAlerts.length > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/25 rounded-[10px] p-4 border border-amber-200 dark:border-amber-900/60 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-bold tracking-tight text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Vencimientos de Flota: {fleetAlerts.filter((a) => a.status === 'caducado').length} caducados y{' '}
                {fleetAlerts.filter((a) => a.status === 'proximo').length} próximos a vencer (≤30 días)
              </span>
            </h2>
            <Link
              href="/residuos/flota"
              className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline whitespace-nowrap"
            >
              Gestionar en Mi Flota →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {fleetAlerts.slice(0, 6).map((alert, idx) => (
              <Link
                key={`${alert.entityType}-${alert.entityId ?? idx}-${alert.documentType}`}
                href={`/residuos/flota?tab=${alert.entityType === 'vehicle' ? 'vehiculos' : 'conductores'}&q=${encodeURIComponent(alert.entityLabel)}`}
                className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 bg-white dark:bg-[#111827] transition hover:-translate-y-[1px] ${alert.status === 'caducado'
                    ? 'border-red-200 dark:border-red-900/70 text-red-700 dark:text-red-300'
                    : 'border-amber-200 dark:border-amber-900/70 text-amber-800 dark:text-amber-300'
                  }`}
              >
                <span className="truncate font-medium">{alert.message}</span>
                <span className="text-[10px] font-bold uppercase shrink-0">
                  {alert.status === 'caducado' ? 'Caducado' : 'Próximo'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasAlerts ? (
        <div className="bg-[#fffbeb] dark:bg-amber-950/20 rounded-[10px] p-4 border border-[#fde68a] dark:border-amber-900/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h2 className="text-[13.5px] font-bold tracking-tight text-[#92400e] dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Control por Excepción: {alertas.totalCriticas} Excepciones Críticas y {alertas.totalAdvertencias} Advertencias activas
              </span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              RD 553/2020 &amp; Ley 7/2022 · Evaluado {new Date(conformidad.fechaEvaluacion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-0.5">
            {alertas.disEnTransitoCount > 0 && (
              <Link
                href="/residuos/documentos-identificacion?status=en_transito"
                className="px-3.5 py-2.5 bg-white dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:-translate-y-[1px] hover:border-amber-400 dark:hover:border-amber-600 transition-all"
              >
                <div>
                  <span className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 block">DIs en Tránsito</span>
                  <p className="text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400 leading-tight mt-0.5">{alertas.disEnTransitoCount}</p>
                </div>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Revisar →</span>
              </Link>
            )}

            {alertas.disDiscrepanciaCount > 0 && (
              <Link
                href="/residuos/documentos-identificacion?status=discrepancias"
                className="px-3.5 py-2.5 bg-white dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:-translate-y-[1px] hover:border-red-400 dark:hover:border-red-700 transition-all"
              >
                <div>
                  <span className="text-[11.5px] font-medium text-red-600 dark:text-red-400 block">Discrepancia Báscula &gt;5%</span>
                  <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400 leading-tight mt-0.5">{alertas.disDiscrepanciaCount}</p>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Auditar →</span>
              </Link>
            )}

            {alertas.contratosCaducadosCount > 0 && (
              <Link
                href="/residuos/contratos?status=caducado"
                className="px-3.5 py-2.5 bg-white dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:-translate-y-[1px] hover:border-red-400 dark:hover:border-red-700 transition-all"
              >
                <div>
                  <span className="text-[11.5px] font-medium text-red-600 dark:text-red-400 block">Contratos Caducados</span>
                  <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400 leading-tight mt-0.5">{alertas.contratosCaducadosCount}</p>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Renovar →</span>
              </Link>
            )}

            {alertas.disTratamientoNoAutorizadoCount > 0 && (
              <Link
                href="/residuos/documentos-identificacion?status=incidencias"
                className="px-3.5 py-2.5 bg-white dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:-translate-y-[1px] hover:border-red-400 dark:hover:border-red-700 transition-all"
              >
                <div>
                  <span className="text-[11.5px] font-medium text-red-600 dark:text-red-400 block">Tratamientos No Autorizados</span>
                  <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400 leading-tight mt-0.5">{alertas.disTratamientoNoAutorizadoCount}</p>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Auditar →</span>
              </Link>
            )}

            {alertas.disSinContratoCount > 0 && (
              <Link
                href="/residuos/documentos-identificacion?status=sin_contrato"
                className="px-3.5 py-2.5 bg-white dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:-translate-y-[1px] hover:border-red-400 dark:hover:border-red-700 transition-all"
              >
                <div>
                  <span className="text-[11.5px] font-medium text-red-600 dark:text-red-400 block">Traslados Sin Contrato</span>
                  <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400 leading-tight mt-0.5">{alertas.disSinContratoCount}</p>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Regularizar →</span>
              </Link>
            )}

            {alertas.contratosPorVencerCount > 0 && (
              <Link
                href="/residuos/contratos?status=vigente"
                className="px-3.5 py-2.5 bg-white dark:bg-[#111827] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:-translate-y-[1px] hover:border-amber-400 dark:hover:border-amber-600 transition-all"
              >
                <div>
                  <span className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 block">Vencimiento &lt;60 días</span>
                  <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400 leading-tight mt-0.5">{alertas.contratosPorVencerCount}</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Atender →</span>
              </Link>
            )}
          </div>

          {alertas.lista.length > 0 && (
            <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/50 space-y-1.5">
              {alertas.lista.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={item.enlace}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-3 py-2 rounded-lg bg-white/70 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition text-xs border border-amber-200/40 dark:border-gray-800"
                >
                  <div>
                    <span className={`font-bold mr-2 ${item.gravedad === 'critico' ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      [{item.gravedad === 'critico' ? 'CRÍTICO' : 'AVISO'}]
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.titulo}:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-300">{item.descripcion}</span>
                  </div>
                  <span className="text-brand-600 dark:text-brand-400 font-semibold shrink-0">Ver expediente →</span>
                </Link>
              ))}
            </div>
          )}

          {conformidad.porcentaje !== null && (
            <div className="flex items-center justify-between text-xs pt-1 text-amber-900 dark:text-amber-300">
              <span>Índice de conformidad comprobada: <strong>{conformidad.porcentaje}%</strong> ({conformidad.totalConformes}/{conformidad.totalEvaluados} registros conformes)</span>
              <span>Evaluado: {new Date(conformidad.fechaEvaluacion).toLocaleString('es-ES')}</span>
            </div>
          )}
        </div>
      ) : conformidad.estado === 'pendiente' ? (
        <div className="bg-slate-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-slate-200 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No existen traslados iniciados, contratos ni autorizaciones suficientes para evaluar el cumplimiento normativo.
          </span>
          <Badge variant="light" color="light" size="sm">
            Pendiente de verificar
          </Badge>
        </div>
      ) : (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
            Control evaluado sobre {conformidad.totalEvaluados} registro(s) sin incidencias ni alertas abiertas (evaluado {new Date(conformidad.fechaEvaluacion).toLocaleTimeString('es-ES')}).
          </span>
          <Badge variant="light" color="success" size="sm">
            Conformidad {conformidad.porcentaje ?? 100}%
          </Badge>
        </div>
      )}

      {/* 4 GRANDES BLOQUES DE KPIS ADAPTADOS AL PERFIL */}
      <ProfileKpiGrid
        profile={effectiveProfile}
        data={data}
        canViewCommercial={canCreateOp}
      />

      {/* FILA INTERMEDIA: GRÁFICO MENSUAL Y TOP 5 RESIDUOS LER */}
      <div className="grid grid-cols-12 gap-6">
        {/* Gráfico Mensual */}
        <div className="col-span-12 xl:col-span-8">
          <MonthlyWasteChart data={monthlyData} />
        </div>

        {/* Top 5 Residuos Gestionados por LER */}
        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-[10px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 dark:border-slate-800 dark:bg-[#111827] sm:p-5 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <h3 className="text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Top Residuos por Código LER
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Ejercicio actual</span>
              </div>

              <div className="space-y-3 pt-3">
                {residuos.topLER.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">
                    No hay suficientes datos de residuos computados en este ejercicio.
                  </p>
                ) : (
                  residuos.topLER.map((item) => (
                    <div key={item.codigo_ler} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-mono font-bold ${item.peligroso ? 'text-amber-700 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {item.codigo_ler}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.toneladas} t <span className="text-gray-400 font-normal">({item.porcentaje}%)</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate" title={item.descripcion}>
                        {item.descripcion}
                      </p>
                      {/* Barra de Progreso */}
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.peligroso ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(item.porcentaje, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {canViewChrono && (
              <Link
                href="/residuos/archivo-cronologico"
                className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                <span>Ver Libro de Registro Cronológico</span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* FILA INFERIOR: TRASLADOS RECIENTES Y ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <div className="rounded-[10px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 dark:border-slate-800 dark:bg-[#111827] sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Últimos Traslados y Documentos de Identificación
              </h3>
              <Link href="/residuos/documentos-identificacion" className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                Ver todos →
              </Link>
            </div>

            <div className="space-y-3">
              {recentDIs.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No hay traslados recientes registrados.</p>
              ) : (
                recentDIs.map((di) => (
                  <div key={di.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <Link href={`/residuos/documentos-identificacion/${di.id}`} className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                          {di.numero_documento}
                        </span>
                        {di.estado_traslado && (
                          <span className="text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 px-2 py-0.5 rounded-full font-semibold">
                            {di.estado_traslado}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {di.productor_razon_social} ➔ {di.gestor_razon_social}
                      </p>
                    </Link>

                    <div className="text-right">
                      <span className="text-[11px] text-gray-400">
                        {new Date(di.fecha_documento).toLocaleDateString('es-ES')}
                      </span>
                      <div>
                        <Link href={`/residuos/documentos-identificacion/${di.id}`} className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                          Detalle
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Acceso Rápido a Módulos Clave según perfil */}
        <div className="col-span-12 lg:col-span-4">
          <ProfileShortcutsCard hasModule={effectiveHasModule} />
        </div>
      </div>

      {/* Modal de Entrada de Báscula / Recepción Multimaterial (Chatarrería) */}
      <ScrapYardEntryModal
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
