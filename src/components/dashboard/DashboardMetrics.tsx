"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { BoxIconLine, GroupIcon, TaskIcon, CalenderIcon } from "@/icons";
import Link from "next/link";
import { Truck } from "lucide-react";

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
                <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl dark:bg-blue-900/20">
                    <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Gestores Finales</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {stats.gestores}
                        </h4>
                    </div>
                    <span className="text-xs text-blue-600 font-medium dark:text-blue-400">Ver Lista →</span>
                </div>
            </Link>

            {/* Transportistas */}
            <Link href="/residuos/transportistas" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-xl dark:bg-indigo-900/20">
                    <Truck className="text-indigo-600 size-6 dark:text-indigo-400" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Transportistas</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {stats.carriers}
                        </h4>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium dark:text-indigo-400">Ver Lista →</span>
                </div>
            </Link>

            {/* DIs Emitidos */}
            <Link href="/residuos/documentos-identificacion" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-xl dark:bg-orange-900/20">
                    <TaskIcon className="text-orange-600 size-6 dark:text-orange-400" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">DI Emitidos</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {stats.diTotal}
                        </h4>
                    </div>
                    <Badge color="success">Registrados</Badge>
                </div>
            </Link>

            {/* Residuos Totales */}
            <Link href="/residuos/documentos-identificacion" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-xl dark:bg-green-900/20">
                    <BoxIconLine className="text-green-600 size-6 dark:text-green-400" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Residuos (Tn)</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {stats.totalWasteTonnes}
                        </h4>
                    </div>
                    <span className="text-xs text-gray-400">Toneladas</span>
                </div>
            </Link>

            {/* Contratos */}
            <Link href="/residuos/contratos" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-xl dark:bg-purple-900/20">
                    <CalenderIcon className="text-purple-600 size-6 dark:text-purple-400" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Contratos</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            Gestión
                        </h4>
                    </div>
                    <span className="text-xs text-purple-600 font-medium dark:text-purple-400">Ver Lista →</span>
                </div>
            </Link>
        </div>
    );
};
