'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { type ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { PieChart } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { DiStatusDistribution } from '@/services/dashboardService';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

export interface TopLerItem {
  codigo_ler: string;
  descripcion: string;
  toneladas: number;
  porcentaje: number;
  peligroso: boolean;
}

interface WasteCompositionChartProps {
  topLER: TopLerItem[];
  totalToneladas: number;
  diStatus?: DiStatusDistribution | null;
  selectedYear: number;
  canViewChrono: boolean;
}

type CompositionTab = 'ler' | 'estados';

const SAFE_PALETTE = ['#059669', '#0ea5e9', '#14b8a6', '#6366f1', '#64748b'];
const HAZARDOUS_PALETTE = ['#d97706', '#ea580c', '#dc2626', '#f59e0b', '#b45309'];

export default function WasteCompositionChart({
  topLER,
  totalToneladas,
  diStatus,
  selectedYear,
  canViewChrono,
}: WasteCompositionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<CompositionTab>('ler');

  const lerColors = useMemo(() => {
    let safeIdx = 0;
    let hazIdx = 0;
    return topLER.map((item) => {
      if (item.peligroso) {
        const c = HAZARDOUS_PALETTE[hazIdx % HAZARDOUS_PALETTE.length];
        hazIdx++;
        return c;
      }
      const c = SAFE_PALETTE[safeIdx % SAFE_PALETTE.length];
      safeIdx++;
      return c;
    });
  }, [topLER]);

  const statusItems = useMemo(() => {
    const dist = diStatus ?? {
      completados: 0,
      enTransito: 0,
      borradores: 0,
      incidencias: 0,
      total: 0,
    };
    const items = [
      { key: 'completados', label: 'Completados / Tratados', value: dist.completados, color: '#059669' },
      { key: 'enTransito', label: 'En Tránsito', value: dist.enTransito, color: '#0ea5e9' },
      { key: 'borradores', label: 'Borradores / Activos', value: dist.borradores, color: '#94a3b8' },
      { key: 'incidencias', label: 'Incidencias / Rechazos', value: dist.incidencias, color: '#ef4444' },
    ];
    return { items, total: dist.total };
  }, [diStatus]);

  const { options, series, hasData } = useMemo(() => {
    const labelColor = isDark ? '#e2e8f0' : '#0f172a';
    const subLabelColor = isDark ? '#94a3b8' : '#64748b';
    const strokeColor = isDark ? '#111827' : '#ffffff';

    if (activeTab === 'estados') {
      const nonZero = statusItems.items.filter((i) => i.value > 0);
      const statusOptions: ApexOptions = {
        chart: {
          type: 'donut',
          fontFamily: 'Inter, -apple-system, sans-serif',
          background: 'transparent',
        },
        labels: nonZero.map((i) => i.label),
        colors: nonZero.map((i) => i.color),
        stroke: { show: true, width: 2, colors: [strokeColor] },
        legend: { show: false },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            donut: {
              size: '72%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '11px',
                  color: subLabelColor,
                  offsetY: -4,
                },
                value: {
                  show: true,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: labelColor,
                  offsetY: 2,
                  formatter: (val: string) => `${val}`,
                },
                total: {
                  show: true,
                  showAlways: true,
                  label: `DIs ${selectedYear}`,
                  fontSize: '11px',
                  color: subLabelColor,
                  formatter: () => `${statusItems.total}`,
                },
              },
            },
          },
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
          y: {
            formatter: (val: number) => `${val} ${val === 1 ? 'documento' : 'documentos'}`,
          },
        },
      };

      return {
        options: statusOptions,
        series: nonZero.map((i) => i.value),
        hasData: statusItems.total > 0,
      };
    }

    const lerSeries = topLER.map((item) => item.toneladas);
    const lerOptions: ApexOptions = {
      chart: {
        type: 'donut',
        fontFamily: 'Inter, -apple-system, sans-serif',
        background: 'transparent',
      },
      labels: topLER.map((item) => item.codigo_ler),
      colors: lerColors,
      stroke: { show: true, width: 2, colors: [strokeColor] },
      legend: { show: false },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '11px',
                color: subLabelColor,
                offsetY: -4,
              },
              value: {
                show: true,
                fontSize: '17px',
                fontWeight: 700,
                color: labelColor,
                offsetY: 2,
                formatter: (val: string) => `${Number(val).toFixed(2)} t`,
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Total',
                fontSize: '11px',
                color: subLabelColor,
                formatter: () =>
                  totalToneladas > 0 && totalToneladas < 1
                    ? `${(totalToneladas * 1000).toFixed(0)} kg`
                    : `${totalToneladas.toFixed(1)} t`,
              },
            },
          },
        },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: (val: number) => `${val.toLocaleString('es-ES', { maximumFractionDigits: 3 })} t`,
        },
      },
    };

    return {
      options: lerOptions,
      series: lerSeries,
      hasData: topLER.length > 0 && lerSeries.some((v) => v > 0),
    };
  }, [activeTab, isDark, lerColors, selectedYear, statusItems, topLER, totalToneladas]);

  return (
    <div className="rounded-[10px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 dark:border-slate-800 dark:bg-[#111827] sm:p-5 h-full flex flex-col justify-between">
      <div>
        {/* Cabecera + Pestañas */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <h3 className="text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {activeTab === 'ler' ? 'Top Residuos por LER' : 'Estado de Traslados'}
          </h3>
          <div className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800/80 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('ler')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                activeTab === 'ler'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Top LER
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('estados')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                activeTab === 'estados'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Estados DI
            </button>
          </div>
        </div>

        {/* Contenido: Donut + Leyenda */}
        {!hasData ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2.5">
              <PieChart className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {activeTab === 'ler'
                ? 'No hay residuos computados todavía.'
                : `No hay traslados registrados en ${selectedYear}.`}
            </p>
          </div>
        ) : (
          <div className="pt-2 space-y-3">
            <div className="flex justify-center">
              <ReactApexChart
                key={`${activeTab}-${selectedYear}-${theme}-${series.join(',')}`}
                options={options}
                series={series}
                type="donut"
                height={180}
                width={210}
              />
            </div>

            {activeTab === 'ler' ? (
              <div className="space-y-2.5">
                {topLER.map((item, idx) => (
                  <div key={item.codigo_ler} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: lerColors[idx] }}
                        />
                        <span
                          className={`font-mono font-bold truncate ${
                            item.peligroso
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.codigo_ler}
                        </span>
                        {item.peligroso && (
                          <span className="text-[9.5px] font-bold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shrink-0">
                            RP
                          </span>
                        )}
                      </div>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                        {item.toneladas} t{' '}
                        <span className="text-slate-400 font-normal">({item.porcentaje}%)</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate pl-3.5" title={item.descripcion}>
                      {item.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {statusItems.items.map((item) => {
                  const pct = statusItems.total > 0 ? Math.round((item.value / statusItems.total) * 100) : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                        </div>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                          {item.value}{' '}
                          <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enlace inferior contextual */}
      {activeTab === 'ler' && canViewChrono ? (
        <Link
          href="/residuos/archivo-cronologico"
          className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800"
        >
          <span>Ver Libro de Registro Cronológico</span>
          <span>→</span>
        </Link>
      ) : activeTab === 'estados' ? (
        <Link
          href="/residuos/documentos-identificacion"
          className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800"
        >
          <span>Gestionar Documentos de Identificación</span>
          <span>→</span>
        </Link>
      ) : null}
    </div>
  );
}
