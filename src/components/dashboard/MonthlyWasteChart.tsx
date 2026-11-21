"use client";
import { type ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface MonthlyWasteChartProps {
    data: Array<{ name: string; value: number }>;
}

export default function MonthlyWasteChart({ data }: MonthlyWasteChartProps) {
    const options: ApexOptions = {
        colors: ["#059669"], // Brand Emerald-600
        chart: {
            fontFamily: "Inter, -apple-system, sans-serif",
            type: "bar",
            height: 250,
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "42%",
                borderRadius: 4,
                borderRadiusApplication: "end",
            },
        },
        dataLabels: {
            enabled: false,
        },
        xaxis: {
            categories: data.map(d => d.name),
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            title: { text: "Toneladas (Tn)" },
        },
        grid: {
            yaxis: {
                lines: { show: true },
            },
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val} Tn`,
            },
        },
    };

    const series = [
        {
            name: "Residuos",
            data: data.map(d => d.value),
        },
    ];

    return (
        <div className="rounded-[10px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 dark:border-slate-800 dark:bg-[#111827] sm:p-5">
            <div className="mb-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <h3 className="text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Producción de Residuos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total mensual en toneladas</p>
            </div>

            <div className="max-w-full overflow-x-auto">
                <ReactApexChart options={options} series={series} type="bar" height={250} />
            </div>
        </div>
    );
}
