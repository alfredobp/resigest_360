"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import Link from "next/link";

interface RecentActivityProps {
    activities: any[];
}

export default function RecentActivities({ activities }: RecentActivityProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
                Actividad Reciente
            </h3>

            <div className="space-y-4">
                {activities.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No hay actividad registrada recientemente.</p>
                ) : (
                    activities.map((item) => (
                        <div key={item.id} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                            <Link
                                href={`/residuos/documentos-identificacion/${item.id}`}
                                className="flex flex-col hover:opacity-70 transition-opacity"
                            >
                                <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    DI: {item.numero_documento}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.productor_razon_social} → {item.gestor_razon_social}
                                </span>
                            </Link>
                            <div className="flex flex-col items-end">
                                <Badge color={
                                    item.estado === 'completado' ? 'success' :
                                        item.estado === 'borrador' ? 'light' :
                                            item.estado === 'pendiente-firma' ? 'warning' : 'error'
                                }>
                                    {item.estado}
                                </Badge>
                                <span className="text-[10px] text-gray-400 mt-1">
                                    {new Date(item.fecha_documento).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
