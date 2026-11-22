'use client';

  import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { type ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { BarChart3, TrendingUp, Calendar, Layers, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { DashboardChartsData } from '@/services/dashboardService';
import type { OperationalProfile } from '@/types/wasteManagement';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

type ChartTabKey = 'residuos' | 'planta' | 'comercial';
type ChartStyle = 'bar' | 'area';

interface MonthlyWasteChartProps {
  chartsData: DashboardChartsData | null;
  profile: OperationalProfile;
  canViewCommercial: boolean;
  selectedYear: number;
  onYearChange: (year: number) => void;
  loading?: boolean;
}

      const PLANT_PROFILES: OperationalProfile[] = ['chatarreria', 'gestor_rp', 'baterias', 'completo'];

      function formatTonnes(val: number): string {
        if (val > 0 && val < 1) {
    return `${(val * 1000).toLocaleString('es-ES', { maximumFractionDigits: 0 })} kg`;
  }
  return `${val.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} t`;
}

function formatEuro(val: number): string {
  return `${val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
}

export default function MonthlyWasteChart({
  chartsData,
  profile,
  canViewCommercial,
  selectedYear,
  onYearChange,
  loading = false,
}: MonthlyWasteChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const showPlantTab = PLANT_PROFILES.includes(profile);
  const showCommercialTab = canViewCommercial;

  const defaultTab: ChartTabKey =
    profile === 'negociante' && showCommercialTab
      ? 'comercial'
      : profile === 'chatarreria' && showPlantTab
        ? 'planta'
        : 'residuos';

  const [userSelectedTab, setUserSelectedTab] = useState<ChartTabKey | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');

  const availableTabs: Array<{ key: ChartTabKey; label: string }> = [
    { key: 'residuos', label: 'Residuos (RP / RNP)' },
    ...(showPlantTab ? [{ key: 'planta' as const, label: 'Balance Planta' }] : []),
    ...(showCommercialTab ? [{ key: 'comercial' as const, label: 'Evolución Comercial' }] : []),
  ];

  const activeTab: ChartTabKey =
    userSelectedTab && availableTabs.some((t) => t.key === userSelectedTab)
      ? userSelectedTab
      : defaultTab;

  const monthlyWaste = chartsData?.monthlyWaste ?? [];
  const monthlyPlantFlow = chartsData?.monthlyPlantFlow ?? [];
  const monthlyCommercial = chartsData?.monthlyCommercial ?? [];
  const availableYears = chartsData?.availableYears ?? [selectedYear, selectedYear - 1, selectedYear - 2];

  const hasDataForActiveTab = useMemo(() => {
    if (activeTab === 'residuos') return monthlyWaste.some((m) => m.total > 0);
    if (activeTab === 'planta') return monthlyPlantFlow.some((m) => m.entradas > 0 || m.salidas > 0);
    return monthlyCommercial.some((m) => m.ingresos > 0 || m.costes > 0 || m.margen !== 0);
  }, [activeTab, monthlyWaste, monthlyPlantFlow, monthlyCommercial]);

  const tabStats = useMemo(() => {
    if (activeTab === 'planta') {
      const totalEntradas = monthlyPlantFlow.reduce((acc, m) => acc + m.entradas, 0);
      const totalSalidas = monthlyPlantFlow.reduce((acc, m) => acc + m.salidas, 0);
      const neto = totalEntradas - totalSalidas;
      const peak = monthlyPlantFlow.reduce<{ name: string; value: number } | null>(
        (best, m) => (m.entradas > 0 && (!best || m.entradas > best.value) ? { name: m.name, value: m.entradas } : best),
        null
      );
      return [
        { label: 'Entradas', value: formatTonnes(totalEntradas), accent: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Salidas', value: formatTonnes(totalSalidas), accent: 'text-sky-600 dark:text-sky-400' },
        { label: 'Saldo Neto', value: `${neto >= 0 ? '+' : ''}${formatTonnes(Math.abs(neto))}`, accent: 'text-slate-900 dark:text-white' },
        { label: 'Pico Entradas', value: peak ? `${peak.name} (${formatTonnes(peak.value)})` : '—', accent: 'text-slate-700 dark:text-slate-300' },
      ];
    }

    if (activeTab === 'comercial') {
      const ingresos = monthlyCommercial.reduce((acc, m) => acc + m.ingresos, 0);
      const costes = monthlyCommercial.reduce((acc, m) => acc + m.costes, 0);
      const margen = monthlyCommercial.reduce((acc, m) => acc + m.margen, 0);
      const rentabilidad = ingresos > 0 ? (margen / ingresos) * 100 : 0;
      return [
        { label: 'Facturación', value: formatEuro(ingresos), accent: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Costes', value: formatEuro(costes), accent: 'text-slate-600 dark:text-slate-300' },
        {
          label: 'Margen Bruto',
          value: formatEuro(margen),
          accent: margen >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400',
        },
        { label: 'Rentabilidad', value: `${rentabilidad.toFixed(1)}%`, accent: 'text-slate-900 dark:text-white' },
      ];
    }

    const summary = chartsData?.summary;
    return [
      {
        label: `Total ${selectedYear}`,
        value: formatTonnes(summary?.totalToneladas ?? 0),
        accent: 'text-slate-900 dark:text-white',
      },
      {
        label: 'Media / Mes Activo',
        value: formatTonnes(summary?.promedioMensual ?? 0),
        accent: 'text-slate-700 dark:text-slate-200',
      },
      {
        label: 'Mes Pico',
        value: summary?.mesPico ? `${summary.mesPico.name} (${formatTonnes(summary.mesPico.value)})` : '—',
        accent: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        label: '% Peligrosos (RP)',
        value: `${(summary?.porcentajePeligrosos ?? 0).toFixed(1)}%`,
        accent: (summary?.porcentajePeligrosos ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400',
      },
    ];
  }, [activeTab, chartsData?.summary, monthlyCommercial, monthlyPlantFlow, selectedYear]);

  const { options, series, apexType } = useMemo(() => {
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const categories =
      activeTab === 'residuos'
        ? monthlyWaste.map((d) => d.name)
        : activeTab === 'planta'
          ? monthlyPlantFlow.map((d) => d.name)
          : monthlyCommercial.map((d) => d.name);

    const baseChart: ApexOptions['chart'] = {
      fontFamily: 'Inter, -apple-system, sans-serif',
      height: 270,
      toolbar: { show: false },
      background: 'transparent',
      animations: {
        enabled: true,
        speed: 450,
      },
    };

    const baseGrid: ApexOptions['grid'] = {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 4, right: 8, bottom: 0, left: 4 },
    };

    const baseLegend: ApexOptions['legend'] = {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      fontWeight: 500,
      labels: { colors: textColor },
      markers: { size: 6, shape: 'circle', offsetX: -3 },
      itemMargin: { horizontal: 10, vertical: 2 },
    };

    const baseXAxis: ApexOptions['xaxis'] = {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: textColor, fontSize: '11.5px', fontWeight: 500 },
      },
    };

    if (activeTab === 'comercial') {
      const commercialSeries = [
        {
          name: 'Ingresos',
          type: 'column',
          data: monthlyCommercial.map((d) => d.ingresos),
        },
        {
          name: 'Costes',
          type: 'column',
          data: monthlyCommercial.map((d) => d.costes),
        },
        {
          name: 'Margen Bruto',
          type: 'line',
          data: monthlyCommercial.map((d) => d.margen),
        },
      ];

      const commercialOptions: ApexOptions = {
        chart: { ...baseChart, type: 'line', stacked: false },
        colors: ['#059669', '#94a3b8', '#7a5af8'],
        stroke: {
          width: [0, 0, 2.5],
          curve: 'smooth',
        },
        plotOptions: {
          bar: {
            columnWidth: '46%',
            borderRadius: 4,
            borderRadiusApplication: 'end',
          },
        },
          markers: {
            size: [0, 0, 4],
            strokeWidth: 2,
            hover: { size: 6 },
          },
            dataLabels: { enabled: false },
            xaxis: baseXAxis,
            yaxis: {
              labels: {
                style: { colors: textColor, fontSize: '11px' },
                formatter: (val: number) =>
                  Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}k €` : `${val.toFixed(0)} €`,
              },
            },
            grid: baseGrid,
            legend: baseLegend,
            theme: { mode: isDark ? 'dark' : 'light' },
            tooltip: {
              shared: true,
              intersect: false,
              theme: isDark ? 'dark' : 'light',
              y: {
                formatter: (val: number) =>
                  `${val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
              },
            },
          };

          return { options: commercialOptions, series: commercialSeries, apexType: 'line' as const };
        }

    if(activeTab === 'planta') {
      const plantSeries = [
        { name: 'Entradas', data: monthlyPlantFlow.map((d) => d.entradas) },
        { name: 'Salidas', data: monthlyPlantFlow.map((d) => d.salidas) },
      ];

  const plantOptions: ApexOptions = {
    chart: { ...baseChart, type: chartStyle, stacked: false },
    colors: ['#059669', '#0ea5e9'],
    stroke:
      chartStyle === 'area'
        ? { curve: 'smooth', width: 2.5 }
        : { show: true, width: 2, colors: ['transparent'] },
    fill:
      chartStyle === 'area'
        ? {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: isDark ? 0.35 : 0.3,
            opacityTo: 0.04,
            stops: [0, 95, 100],
          },
        }
        : { opacity: 1 },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '52%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    xaxis: baseXAxis,
    yaxis: {
      labels: {
        style: { colors: textColor, fontSize: '11px' },
        formatter: (val: number) => `${val.toLocaleString('es-ES', { maximumFractionDigits: 1 })} t`,
      },
    },
    grid: baseGrid,
    legend: baseLegend,
    theme: { mode: isDark ? 'dark' : 'light' },
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) =>
          `${val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`,
      },
    },
};

      return { options: plantOptions, series: plantSeries, apexType: chartStyle };
    }

// Default: Residuos (No Peligrosos vs Peligrosos)
const wasteSeries = [
  { name: 'No Peligrosos (RNP)', data: monthlyWaste.map((d) => d.noPeligrosos) },
  { name: 'Peligrosos (RP)', data: monthlyWaste.map((d) => d.peligrosos) },
];

      const wasteOptions: ApexOptions = {
        chart: {
        ...baseChart,
        type: chartStyle,
      stacked: chartStyle === 'bar',
      },
      colors: ['#059669', '#d97706'],
      stroke:
      chartStyle === 'area'
      ? {curve: 'smooth', width: 2.5 }
      : {show: false },
      fill:
      chartStyle === 'area'
      ? {
        type: 'gradient',
      gradient: {
        shadeIntensity: 1,
      opacityFrom: isDark ? 0.38 : 0.32,
      opacityTo: 0.04,
      stops: [0, 95, 100],
              },
            }
      : {opacity: 1 },
      plotOptions: {
        bar: {
        horizontal: false,
      columnWidth: '44%',
      borderRadius: 4,
      borderRadiusApplication: 'end',
        },
      },
      dataLabels: {enabled: false },
      xaxis: baseXAxis,
      yaxis: {
        labels: {
        style: {colors: textColor, fontSize: '11px' },
          formatter: (val: number) => `${val.toLocaleString('es-ES', { maximumFractionDigits: 1 })} t`,
        },
      },
      grid: baseGrid,
      legend: baseLegend,
      theme: {mode: isDark ? 'dark' : 'light' },
      tooltip: {
        shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      x: {
        formatter: (_val: number, opts?: {dataPointIndex ?: number}) => {
            const idx = opts?.dataPointIndex ?? -1;
      const point = monthlyWaste[idx];
      if (!point) return '';
      const diLabel = point.diCount === 1 ? '1 DI' : `${point.diCount} DIs`;
      return `${point.name} ${selectedYear} · ${diLabel}`;
          },
        },
      y: {
        formatter: (val: number) =>
      `${val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`,
        },
      },
    };

      return {options: wasteOptions, series: wasteSeries, apexType: chartStyle };
  }, [activeTab, chartStyle, isDark, monthlyCommercial, monthlyPlantFlow, monthlyWaste, selectedYear]);

      const headerCopy = {
        residuos: {
        title: 'Evolución Mensual de Residuos',
      subtitle: 'Toneladas gestionadas separadas por peligrosidad (RP / RNP)',
    },
      planta: {
        title: 'Balance Mensual de Planta',
      subtitle: 'Entradas recibidas frente a salidas expedidas (Archivo Cronológico)',
    },
      comercial: {
        title: 'Evolución Comercial y Márgenes',
      subtitle: 'Ingresos de venta, costes operativos y margen bruto mensual (€)',
    },
  }[activeTab];

      const variationPct = chartsData?.summary.variacionUltimoMesPct ?? null;

      return (
      <div className="rounded-[10px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 dark:border-slate-800 dark:bg-[#111827] sm:p-5 h-full flex flex-col justify-between relative">
        {/* Cabecera y Controles */}
        <div className="space-y-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {headerCopy.title}
                </h3>
                {activeTab === 'residuos' && variationPct !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold tabular-nums ${variationPct >= 0
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    title="Variación del último mes con actividad respecto al mes anterior"
                  >
                    {variationPct >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {variationPct >= 0 ? '+' : ''}
                    {variationPct}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{headerCopy.subtitle}</p>
            </div>

              {/* Controles derecha: Tipo de gráfico + Selector de año */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {activeTab !== 'comercial' && (
                  <div
                    className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5"
                    role="group"
                    aria-label="Tipo de gráfico"
                  >
                    <button
                      type="button"
                      onClick={() => setChartStyle('bar')}
                      title="Vista en barras"
                      className={`p-1.5 rounded-md transition-colors ${chartStyle === 'bar'
                          ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartStyle('area')}
                      title="Vista en área"
                      className={`p-1.5 rounded-md transition-colors ${chartStyle === 'area'
                          ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="relative inline-flex items-center">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <select
                    aria-label="Seleccionar ejercicio anual"
                    value={selectedYear}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    className="pl-7 pr-6 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pestañas de Vista (si hay más de una disponible) */}
            {availableTabs.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableTabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setUserSelectedTab(tab.key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${isActive
                          ? 'bg-brand-600 text-white dark:bg-brand-500 dark:text-slate-950'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Banda de mini-KPIs del gráfico */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-slate-100 dark:border-slate-800/70">
            {tabStats.map((stat) => (
              <div key={stat.label} className="px-2.5 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/50">
                <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 block truncate">
                  {stat.label}
                </span>
                <span className={`text-sm font-bold tabular-nums leading-tight mt-0.5 block truncate ${stat.accent}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Área del gráfico o Estado Vacío */}
          <div className="relative pt-3 flex-1 min-h-[270px]">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-[#111827]/70 backdrop-blur-[1px] rounded-lg">
                <div className="h-6 w-6 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
              </div>
            )}

            {!hasDataForActiveTab ? (
              <div className="h-[270px] flex flex-col items-center justify-center text-center px-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Sin registros en {selectedYear}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {activeTab === 'comercial'
                    ? 'No existen operaciones comerciales contabilizadas en este ejercicio.'
                    : activeTab === 'planta'
                      ? 'No hay asientos de entradas o salidas en el archivo cronológico de este ejercicio.'
                      : 'Todavía no se han registrado Documentos de Identificación en este ejercicio.'}
                </p>
                <Link
                  href={
                    activeTab === 'comercial'
                      ? '/residuos/operaciones/nueva'
                      : '/residuos/documentos-identificacion/nuevo'
                  }
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900/60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {activeTab === 'comercial' ? 'Registrar operación' : 'Crear nuevo traslado (DI)'}
                </Link>
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <ReactApexChart
                  key={`${activeTab}-${apexType}-${selectedYear}-${theme}`}
                  options={options}
                  series={series}
                  type={apexType}
                  height={270}
                />
              </div>
            )}
          </div>
        </div>
        );
}
