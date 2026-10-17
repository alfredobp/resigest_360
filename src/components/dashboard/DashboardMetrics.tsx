"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import Link from "next/link";

interface DashboardMetricsProps {
    stats: {
        suppliers: number;
        gestores: number;
        carriers: number;
        diTotal: number;
        totalWasteTonnes: string;
    };
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
            {/* Gestores Finales */}
            <Link href="/residuos/gestores" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Gestores Finales</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {stats.gestores}
                        </h4>
                    </div>
                    <span className="text-xs text-brand-600 font-semibold dark:text-brand-400">Ver Lista →</span>
                </div>
            </Link>

            {/* Transportistas */}
            <Link href="/residuos/transportistas" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Transportistas</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {stats.carriers}
                        </h4>
                    </div>
                    <span className="text-xs text-brand-600 font-semibold dark:text-brand-400">Ver Lista →</span>
                </div>
            </Link>

            {/* DIs Emitidos */}
            <Link href="/residuos/documentos-identificacion" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">DI Emitidos</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {stats.diTotal}
                        </h4>
                    </div>
                    <Badge color="success">Registrados</Badge>
                </div>
            </Link>

            {/* Residuos Totales */}
            <Link href="/residuos/documentos-identificacion" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Residuos (Tn)</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {stats.totalWasteTonnes}
                        </h4>
                    </div>
                    <span className="text-xs text-gray-400">Toneladas</span>
                </div>
            </Link>

            {/* Contratos */}
            <Link href="/residuos/contratos" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Contratos</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            Gestión
                        </h4>
                    </div>
                    <span className="text-xs text-brand-600 font-semibold dark:text-brand-400">Ver Lista →</span>
                </div>
            </Link>
        </div>
    );
};
