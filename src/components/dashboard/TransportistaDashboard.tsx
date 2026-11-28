'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  FileCheck2,
  AlertTriangle,
  QrCode,
  ShieldAlert,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import ComponentCard from '@/components/common/ComponentCard';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { decaService } from '@/services/decaService';
import fleetService from '@/services/fleetService';
import identificationDocumentService from '@/services/identificationDocumentService';
import type { DecaDocument } from '@/types/deca';
import type { FleetDriver, FleetExpiringAlert, FleetVehicle } from '@/types/fleet';
import type { IdentificationDocument } from '@/types/wasteManagement';

export default function TransportistaDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [decas, setDecas] = useState<DecaDocument[]>([]);
  const [dis, setDis] = useState<IdentificationDocument[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [fleetAlerts, setFleetAlerts] = useState<FleetExpiringAlert[]>([]);

  useEffect(() => {
    let active = true;
    async function loadTransporterOverview() {
      try {
        setLoading(true);
        const [decaList, diList, vehicleList, driverList, alerts] = await Promise.all([
          decaService.getAll().catch(() => []),
          identificationDocumentService.getAll().catch(() => []),
          fleetService.getVehicles().catch(() => []),
          fleetService.getDrivers().catch(() => []),
          fleetService.getExpiringAlerts(30).catch(() => []),
        ]);

        if (!active) return;
        setDecas(decaList);
        setDis(diList);
        setVehicles(vehicleList);
        setDrivers(driverList);
        setFleetAlerts(alerts);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTransporterOverview();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cargando Centro Operativo de Transporte...
          </p>
        </div>
      </div>
    );
  }

  const activeDecas = decas.filter(
    (d) => d.is_vigente && (d.estado === 'vigente' || d.estado === 'en_transito')
  );
  const pendingSignatureDIs = dis.filter(
    (d) => !d.firmado_transportista && d.estado_traslado !== 'tratado' && d.estado_traslado !== 'rechazado_total'
  );
  const inTransitDIs = dis.filter((d) => d.estado_traslado === 'en_transito');
  const totalTons = dis.reduce((acc, d) => {
    const qty = Number(d.cantidad) || 0;
    return acc + (d.unidad === 'kg' ? qty / 1000 : qty);
  }, 0);
  const hazardousTons = dis
    .filter((d) => d.peligrosidad === 'peligroso' || d.codigo_ler?.includes('*'))
    .reduce((acc, d) => {
      const qty = Number(d.cantidad) || 0;
      return acc + (d.unidad === 'kg' ? qty / 1000 : qty);
    }, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera Modo Transportista */}
      <div
        data-tour="dashboard-header"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Centro Operativo de Transporte
            </h1>
            <Badge variant="light" color="primary">
              Modo Transportista
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Control en tiempo real de portes DeCA, traslados DI pendientes de firma, flota y vencimientos ADR/ITV.
          </p>
        </div>

        {/* Acciones Rápidas específicas de Transportista */}
        <div data-tour="dashboard-quick-actions" className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => router.push('/residuos/deca')}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo DeCA
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/residuos/documentos-identificacion?pendienteFirma=1')}
            className="font-medium"
          >
            <FileCheck2 className="w-4 h-4 mr-1.5" />
            DIs Pendientes ({pendingSignatureDIs.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/residuos/flota')}
            className="font-medium"
          >
            <Truck className="w-4 h-4 mr-1.5" />
            Mi Flota
          </Button>
        </div>
      </div>

      {/* KPIs Logísticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              DeCAs Vigentes / En Ruta
            </span>
            <QrCode className="w-5 h-5 text-brand-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            {activeDecas.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {decas.filter((d) => d.estado === 'finalizado').length} finalizados históricos
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              DIs Pendientes de Firma
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            {pendingSignatureDIs.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {inTransitDIs.length} en tránsito actualmente
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Toneladas Transportadas
            </span>
            <Truck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            {totalTons.toFixed(1)} t
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {hazardousTons.toFixed(1)} t peligrosos (ADR/RP)
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Flota y Conductores
            </span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            {vehicles.filter((v) => v.activo).length} / {drivers.filter((d) => d.activo).length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Vehículos activos / Conductores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de Caducidad de Flota */}
        <ComponentCard title="Alertas de Flota y Documentación (30 días)">
          {fleetAlerts.length === 0 ? (
            <div className="flex items-center gap-3 py-6 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Toda tu flota y conductores tienen ITV, Seguro y ADR al día.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {fleetAlerts.slice(0, 6).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                    alert.severity === 'critico'
                      ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                      : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {alert.severity === 'critico' ? (
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {alert.entityName} — {alert.documentType}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Vence: {alert.expiryDate} (
                        {alert.daysRemaining <= 0
                          ? 'Caducado'
                          : `en ${alert.daysRemaining} días`}
                        )
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/residuos/flota"
                    className="text-xs font-semibold text-brand-600 hover:underline whitespace-nowrap"
                  >
                    Revisar →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>

        {/* Últimos DeCAs activos */}
        <ComponentCard title="Portes DeCA Recientes">
          {decas.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-gray-500">
                Aún no has emitido ningún Documento de Control (DeCA).
              </p>
              <Button size="sm" onClick={() => router.push('/residuos/deca')}>
                Crear Primer DeCA
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {decas.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {doc.numero_deca}
                      </span>
                      <Badge
                        variant="light"
                        color={doc.estado === 'finalizado' ? 'success' : 'primary'}
                      >
                        {doc.estado}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {doc.origen_municipio} → {doc.destino_municipio} · {doc.matricula_tractora}
                    </p>
                  </div>
                  <Link
                    href={`/mobile/deca/${doc.token}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 shrink-0 ml-3"
                  >
                    Vista Móvil
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
