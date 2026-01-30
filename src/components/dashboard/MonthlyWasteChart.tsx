"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { useState } from "react";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface MonthlyWasteChartProps {
    data: { name: string; value: number }[];
}

export default function MonthlyWasteChart({ data }: MonthlyWasteChartProps) {
    const options: ApexOptions = {
        colors: ["#10B981"], // Emerald-500
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "bar",
            height: 250,
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "45%",
                borderRadius: 6,
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Producción de Residuos
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total mensual en toneladas</p>
                </div>
                <MoreDotIcon className="text-gray-400 cursor-pointer" />
            </div>

            <div className="max-w-full overflow-x-auto">
                <ReactApexChart options={options} series={series} type="bar" height={250} />
            </div>
        </div>
    );
}
