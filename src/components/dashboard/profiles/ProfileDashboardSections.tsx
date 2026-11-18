'use client';

import React from 'react';
import Link from 'next/link';
import ComponentCard from '@/components/common/ComponentCard';
import type { ExecutiveDashboardData } from '@/services/dashboardService';
import type { AppModule, OperationalProfile } from '@/types/wasteManagement';

export interface ProfileHeaderConfig {
  title: string;
  badge: string;
  subtitle: string;
}

export function getDashboardHeaderConfig(profile: OperationalProfile): ProfileHeaderConfig {
  switch (profile) {
    case 'productor':
      return {
        title: 'Panel de Productor de Residuos',
        badge: 'Productor',
        subtitle:
          'Control de residuos generados, contratos de tratamiento vigentes, retiradas (DI) y archivo cronológico obligatorio.',
      };
    case 'chatarreria':
      return {
        title: 'Panel Operativo de Chatarrería y Báscula',
        badge: 'Chatarrería / Metales',
        subtitle:
          'Control de entradas, salidas, existencias estimadas en planta, pesajes, compraventa y archivo cronológico.',
      };
    case 'baterias':
      return {
        title: 'Panel de Gestor de Baterías y RAEE',
        badge: 'Baterías / RAEE',
        subtitle:
          'Trazabilidad de residuos eléctricos y acumuladores, contratos, entregas, archivo cronológico y memorias anuales.',
      };
    case 'gestor_rp':
      return {
        title: 'Panel de Gestor de Residuos Peligrosos',
        badge: 'Planta Gestora',
        subtitle:
          'Supervisión de planta, recepciones y tratamientos R/D, autorizaciones ambientales, envíos SIRA y memorias anuales.',
      };
    case 'negociante':
      return {
        title: 'Centro de Control de Negociante',
        badge: 'Trading Aislado',
        subtitle:
          'Operaciones comerciales de compraventa, costes logísticos, márgenes netos y trazabilidad documental RD 553/2020.',
      };
    case 'transportista':
      return {
        title: 'Panel de Transportista',
        badge: 'Logística y DeCA',
        subtitle: 'Resumen de servicios de transporte, documentos en tránsito y control DeCA.',
      };
    default:
      return {
        title: 'Centro de Control Ejecutivo',
        badge: 'Control por Excepción',
        subtitle:
          'Supervisión normativa en tiempo real (Ley 7/2022 y RD 553/2020), balance de masas y rentabilidad de intermediación.',
      };
  }
}

interface ProfileKpisProps {
  profile: OperationalProfile;
  data: ExecutiveDashboardData;
  canViewCommercial: boolean;
}

export function ProfileKpiGrid({ profile, data, canViewCommercial }: ProfileKpisProps) {
  const { residuos, comercial, planta, alertas } = data;
  const plantaStats = planta || {
    entradasToneladas: 0,
    salidasToneladas: 0,
    existenciasToneladas: 0,
    totalAsientos: 0,
    totalContratos: 0,
    contratosVigentes: 0,
  };

  if (profile === 'productor') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComponentCard title="Residuos Generados">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Retirado / Gestionado
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {residuos.totalToneladas.toFixed(2)}
              </span>
              <span className="text-xs font-medium text-gray-500">toneladas</span>
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
            {typeof residuos.totalAsientosArchivo === 'number' && residuos.totalAsientosArchivo > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500">
                <span>Archivo Cronológico (Art. 64): </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {residuos.toneladasArchivoCronologico?.toFixed(2)} t ({residuos.totalAsientosArchivo} asientos)
                </span>
              </div>
            )}
          </div>
        </ComponentCard>

        <ComponentCard title="Retiradas y Traslados">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Documentos de Identificación
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {residuos.totalDIs}
              </span>
              <span className="text-xs font-medium text-gray-500">retiradas</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Completadas / En tránsito:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {residuos.disCompletados} / {alertas.disEnTransitoCount}
              </span>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Contratos de Tratamiento">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Contratos en Vigor
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {plantaStats.contratosVigentes}
              </span>
              <span className="text-xs font-medium text-gray-500">
                de {plantaStats.totalContratos} registrados
              </span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Próximos / Caducados:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {alertas.contratosPorVencerCount} / {alertas.contratosCaducadosCount}
              </span>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Archivo Cronológico">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Art. 64 Ley 7/2022
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {plantaStats.totalAsientos}
              </span>
              <span className="text-xs font-medium text-gray-500">asientos registrados</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Libro oficial:</span>
              <Link href="/residuos/archivo-cronologico" className="font-bold text-brand-600 hover:underline">
                Consultar libro →
              </Link>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  if (profile === 'chatarreria') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComponentCard title="Entradas en Planta">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Recepciones / Compras
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {plantaStats.entradasToneladas.toFixed(2)}
              </span>
              <span className="text-xs font-medium text-gray-500">toneladas</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Asientos en archivo:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{plantaStats.totalAsientos}</span>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Salidas Expedidas">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Expediciones a Acería / Gestor
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {plantaStats.salidasToneladas.toFixed(2)}
              </span>
              <span className="text-xs font-medium text-gray-500">toneladas</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">DIs completados:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {residuos.disCompletados} / {residuos.totalDIs}
              </span>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Existencias Estimadas">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Stock Neto en Patio
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {plantaStats.existenciasToneladas.toFixed(2)}
              </span>
              <span className="text-xs font-medium text-gray-500">toneladas</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Discrepancias báscula:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {alertas.disDiscrepanciaCount}
              </span>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Báscula y Liquidaciones">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {canViewCommercial ? 'Operaciones de Compra/Venta' : 'Pesajes y Trazabilidad'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {canViewCommercial
                  ? `${comercial.facturacionVenta.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
                  : residuos.totalDIs}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">
                {canViewCommercial ? 'Operaciones abiertas:' : 'DIs en tránsito:'}
              </span>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {canViewCommercial ? comercial.operacionesAbiertas : alertas.disEnTransitoCount}
              </span>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  if (profile === 'gestor_rp' || profile === 'baterias') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {typeof residuos.totalAsientosArchivo === 'number' && residuos.totalAsientosArchivo > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500">
                <span>Archivo Cronológico (Art. 64): </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {residuos.toneladasArchivoCronologico?.toFixed(2)} t ({residuos.totalAsientosArchivo} asientos)
                </span>
              </div>
            )}
          </div>
        </ComponentCard>

        <ComponentCard title="Movimiento en Planta">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Entradas / Salidas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {plantaStats.entradasToneladas.toFixed(2)} t
              </span>
              <span className="text-xs font-medium text-gray-500">
                / {plantaStats.salidasToneladas.toFixed(2)} t
              </span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Existencias estimadas:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{plantaStats.existenciasToneladas.toFixed(2)} t</span>
            </div>
          </div>
        </ComponentCard>

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

        <ComponentCard title="Contratos y Archivo">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Asientos / Contratos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {plantaStats.totalAsientos}
              </span>
              <span className="text-xs font-medium text-gray-500">asientos cronológicos</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px]">
              <span className="text-gray-500">Contratos vigentes:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{plantaStats.contratosVigentes}</span>
            </div>
          </div>
        </ComponentCard>
      </div>
    );
  }

  // Perfil Negociante o Completo
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {canViewCommercial && (
        <>
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
        </>
      )}
    </div>
  );
}

interface ShortcutItem {
  label: string;
  href: string;
  module?: AppModule;
}

const ALL_SHORTCUTS: ShortcutItem[] = [
  { label: 'Libro de Registro Cronológico', href: '/residuos/archivo-cronologico', module: 'archivo_cronologico' },
  { label: 'Documentos de Identificación (DI)', href: '/residuos/documentos-identificacion', module: 'di' },
  { label: 'Contratos de Tratamiento', href: '/residuos/contratos', module: 'contratos' },
  { label: 'Operaciones Comerciales y Báscula', href: '/residuos/operaciones', module: 'operaciones_comerciales' },
  { label: 'Memorias Anuales de Residuos', href: '/residuos/memorias-anuales', module: 'memorias_anuales' },
  { label: 'Control DeCA y Conductores', href: '/residuos/deca', module: 'deca' },
  { label: 'Empresas, Roles y Autorizaciones', href: '/residuos/empresas', module: 'empresas' },
  { label: 'Configuración de Mi Empresa', href: '/residuos/mi-empresa' },
];

export function ProfileShortcutsCard({
  hasModule,
}: {
  hasModule: (m: AppModule) => boolean;
}) {
  const visibleShortcuts = ALL_SHORTCUTS.filter((s) => !s.module || hasModule(s.module)).slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-3">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
        Accesos Directos a Módulos Activos
      </h3>

      {visibleShortcuts.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-semibold text-gray-800 dark:text-gray-200 group"
        >
          <span>{item.label}</span>
          <span className="text-gray-400 group-hover:text-brand-500 transition-colors">→</span>
        </Link>
      ))}
    </div>
  );
}

