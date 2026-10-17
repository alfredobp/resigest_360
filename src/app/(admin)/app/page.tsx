'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dashboardService, { ExecutiveDashboardData } from '@/services/dashboardService';
import MonthlyWasteChart from '@/components/dashboard/MonthlyWasteChart';
import ComponentCard from '@/components/common/ComponentCard';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';

export default function ExecutiveDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [executiveData, setExecutiveData] = useState<ExecutiveDashboardData | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ name: string; value: number }[]>([]);
  const [recentDIs, setRecentDIs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [overview, monthly, recent] = await Promise.all([
          dashboardService.getExecutiveOverview(),
          dashboardService.getMonthlyWasteData(),
          dashboardService.getRecentActivity()
        ]);

        setExecutiveData(overview);
        setMonthlyData(monthly);
        setRecentDIs(recent);
      } catch (err) {
        console.error('Error al cargar datos del dashboard ejecutivo:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500">Cargando Centro de Control Ejecutivo...</p>
        </div>
      </div>
    );
  }

  const { alertas, residuos, comercial } = executiveData || {
    alertas: { totalCriticas: 0, totalAdvertencias: 0, lista: [], disEnTransitoCount: 0, disDiscrepanciaCount: 0, contratosCaducadosCount: 0, contratosPorVencerCount: 0, autorizacionesPorVencerCount: 0 },
    residuos: { totalToneladas: 0, toneladasPeligrosas: 0, toneladasNoPeligrosas: 0, totalDIs: 0, disCompletados: 0, topLER: [] },
    comercial: { totalOperaciones: 0, operacionesAbiertas: 0, facturacionVenta: 0, costesTotales: 0, margenBrutoTotal: 0, margenMedioTon: 0, rentabilidadPorcentaje: 0 }
  };

  const hasAlerts = alertas.totalCriticas > 0 || alertas.totalAdvertencias > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera Ejecutiva */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Centro de Control Ejecutivo
            </h1>
            <Badge variant="light" color="primary">
              Control por Excepción
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Supervisión normativa en tiempo real (Ley 7/2022 y RD 553/2020), balance de masas y rentabilidad de intermediación.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => router.push('/residuos/documentos-identificacion/nuevo')}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-sm transition-colors"
          >
            Nuevo Traslado (DI)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/residuos/operaciones/nueva')}
            className="text-brand-600 dark:text-brand-400 font-medium hover:bg-brand-50 dark:hover:bg-brand-950/40"
          >
            Nueva Operación
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/residuos/archivo-cronologico')}
            className="text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            Archivo Cronológico
          </Button>
        </div>
      </div>

      {/* CENTRO DE ALERTAS Y CONTROL POR EXCEPCIÓN */}
      {hasAlerts ? (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300">
              Atención Requerida: {alertas.totalCriticas} Excepciones Críticas y {alertas.totalAdvertencias} Advertencias
            </h2>
            <span className="text-xs text-amber-800 dark:text-amber-400 font-medium">
              Normativa RD 553/2020 & Ley 7/2022
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            {alertas.disEnTransitoCount > 0 && (
              <Link
                href="/residuos/documentos-identificacion"
                className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">DIs en Tránsito</span>
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{alertas.disEnTransitoCount}</p>
                </div>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Revisar →</span>
              </Link>
            )}

            {alertas.disDiscrepanciaCount > 0 && (
              <Link
                href="/residuos/documentos-identificacion"
                className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-red-200 dark:border-red-900/60 flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">Discrepancias Báscula &gt;5%</span>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{alertas.disDiscrepanciaCount}</p>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Ver →</span>
              </Link>
            )}

            {alertas.contratosCaducadosCount > 0 && (
              <Link
                href="/residuos/contratos"
                className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-red-200 dark:border-red-900/60 flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">Contratos Caducados</span>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{alertas.contratosCaducadosCount}</p>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Renovar →</span>
              </Link>
            )}

            {alertas.contratosPorVencerCount > 0 && (
              <Link
                href="/residuos/contratos"
                className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Vencimiento &lt;60 días</span>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{alertas.contratosPorVencerCount}</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Atender →</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
            Todos los traslados, contratos y autorizaciones se encuentran en plena conformidad normativa. Sin excepciones activas.
          </span>
          <Badge variant="light" color="success" size="sm">
            Conformidad 100%
          </Badge>
        </div>
      )}

      {/* 4 GRANDES BLOQUES DE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Volumen de Residuos */}
        <ComponentCard title="Balance de Masas">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Residuos Gestionados</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {residuos.totalToneladas.toFixed(2)}
              </span>
              <span className="text-xs font-medium text-gray-500">toneladas netas</span>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Peligrosos:</span>
                <p className="font-bold text-gray-800 dark:text-gray-200">{residuos.toneladasPeligrosas.toFixed(2)} t</p>
              </div>
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">No Peligrosos:</span>
                <p className="font-bold text-gray-800 dark:text-gray-200">{residuos.toneladasNoPeligrosas.toFixed(2)} t</p>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* KPI 2: Trazabilidad y DIs */}
        <ComponentCard title="Trazabilidad RD 553/2020">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Documentos de Identificación</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {residuos.totalDIs}
              </span>
              <span className="text-xs font-medium text-gray-500">expedidos</span>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Completados / Tratados:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{residuos.disCompletados}</span>
            </div>
          </div>
        </ComponentCard>

        {/* KPI 3: Facturación de Intermediación */}
        <ComponentCard title="Facturación Comercial">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ingresos de Venta</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {comercial.facturacionVenta.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Costes Operativos:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {comercial.costesTotales.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </ComponentCard>

        {/* KPI 4: Margen Bruto y Rentabilidad */}
        <ComponentCard title="Rentabilidad Operativa">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Margen Bruto Total</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold ${comercial.margenBrutoTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                {comercial.margenBrutoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Margen Medio / Tonelada:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {comercial.margenMedioTon.toFixed(2)} €/t
              </span>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* FILA INTERMEDIA: GRÁFICO MENSUAL Y TOP 5 RESIDUOS LER */}
      <div className="grid grid-cols-12 gap-6">
        {/* Gráfico Mensual */}
        <div className="col-span-12 xl:col-span-8">
          <MonthlyWasteChart data={monthlyData} />
        </div>

        {/* Top 5 Residuos Gestionados por LER */}
        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Top Residuos por Código LER
                </h3>
                <span className="text-[11px] text-gray-400">Ejercicio actual</span>
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

            <Link
              href="/residuos/archivo-cronologico"
              className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800"
            >
              <span>Ver Libro de Registro Cronológico</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* FILA INFERIOR: TRASLADOS RECIENTES Y ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Últimos Traslados y Documentos de Identificación
              </h3>
              <Link href="/residuos/documentos-identificacion" className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
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

        {/* Acceso Rápido a Módulos Clave */}
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
              Accesos Directos a Módulos
            </h3>

            <Link
              href="/residuos/archivo-cronologico"
              className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-semibold text-gray-800 dark:text-gray-200 group"
            >
              <span>Libro de Registro Cronológico</span>
              <span className="text-gray-400 group-hover:text-brand-500 transition-colors">→</span>
            </Link>

            <Link
              href="/residuos/operaciones"
              className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-semibold text-gray-800 dark:text-gray-200 group"
            >
              <span>Operaciones Comerciales y Márgenes</span>
              <span className="text-gray-400 group-hover:text-brand-500 transition-colors">→</span>
            </Link>

            <Link
              href="/residuos/memorias-anuales"
              className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-semibold text-gray-800 dark:text-gray-200 group"
            >
              <span>Memorias Anuales de Residuos</span>
              <span className="text-gray-400 group-hover:text-brand-500 transition-colors">→</span>
            </Link>

            <Link
              href="/residuos/empresas"
              className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-semibold text-gray-800 dark:text-gray-200 group"
            >
              <span>Empresas, Roles y Autorizaciones</span>
              <span className="text-gray-400 group-hover:text-brand-500 transition-colors">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
