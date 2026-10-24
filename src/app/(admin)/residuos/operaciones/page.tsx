'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import commercialOperationService, {
  type CommercialOperationFilter
} from '@/services/commercialOperationService';
import {
  type CommercialOperation,
  type CommercialOperationStats,
  type EstadoOperacionComercial
} from '@/types/wasteManagement';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';

const CURRENT_YEAR = new Date().getFullYear();

const ESTADO_CONFIG: Record<EstadoOperacionComercial, { label: string; color: 'light' | 'info' | 'warning' | 'success' | 'error' | 'primary' }> = {
  borrador: { label: 'Borrador', color: 'light' },
  abierta: { label: 'Abierta', color: 'primary' },
  en_transito: { label: 'En Tránsito', color: 'info' },
  completada: { label: 'Completada', color: 'warning' },
  liquidada: { label: 'Liquidada', color: 'success' },
  cancelada: { label: 'Cancelada', color: 'error' },
};

export default function OperacionesComercialesPage() {
  const router = useRouter();
  const [operations, setOperations] = useState<CommercialOperation[]>([]);
  const [stats, setStats] = useState<CommercialOperationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [selectedYear, setSelectedYear] = useState<number | undefined>(CURRENT_YEAR);
  const [selectedEstado, setSelectedEstado] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: CommercialOperationFilter = {
        año: selectedYear,
        estado: selectedEstado !== 'todas' ? (selectedEstado as EstadoOperacionComercial) : 'todas',
        search: searchTerm
      };

      const [opsData, statsData] = await Promise.all([
        commercialOperationService.getAll(filters),
        commercialOperationService.getStats(selectedYear)
      ]);

      setOperations(opsData);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar las operaciones comerciales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedEstado]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Confirma la eliminación de esta operación comercial?')) return;
    try {
      await commercialOperationService.delete(id);
      const msg = 'Operación comercial eliminada correctamente.';
      setSuccess(msg);
      toast.success(msg);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      const msg = 'Error al eliminar la operación comercial.';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Operaciones Comerciales
            </h1>
            <Badge variant="light" color="primary">
              Negociante y Agente
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión económica e intermediación de residuos. Desacoplamiento de flujos físicos y financieros con cálculo de margen en tiempo real.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => commercialOperationService.exportToExcelXML(operations)}
            disabled={operations.length === 0}
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 font-medium"
          >
            Excel (.xls)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => commercialOperationService.exportToCSV(operations)}
            disabled={operations.length === 0}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 font-medium"
          >
            CSV
          </Button>

          <Button
            size="sm"
            onClick={() => router.push('/residuos/operaciones/nueva')}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-sm transition-colors"
          >
            Nueva Operación
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {error && <Alert variant="error" title="Error" message={error} />}
      {success && <Alert variant="success" title="Completado" message={success} />}

      {/* Tarjetas de Métricas Financieras (KPIs) */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComponentCard title="Facturación de Venta">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ingresos Totales (Venta)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.facturacion_total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Volumen: <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.toneladas_totales.toFixed(3)} t</span>
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Costes Operativos">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Costes Totales</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {stats.costes_totales.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Compra + Fletes + Accesorios
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Margen Bruto Total">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Margen Bruto Neto</p>
              <p className={`text-2xl font-bold mt-1 ${stats.margen_bruto_total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                {stats.margen_bruto_total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Rentabilidad agregada del ejercicio
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Margen Unitario">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Margen Unitario Medio</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats.margen_medio_tonelada.toFixed(2)} <span className="text-sm font-normal text-gray-500">€/t</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total_operaciones} operaciones computadas
              </p>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* Pestañas de Estado con Contadores */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'todas', label: 'Todas las Operaciones', count: stats?.total_operaciones || 0 },
          { key: 'abierta', label: 'Abiertas', count: stats?.por_estado.abierta || 0 },
          { key: 'en_transito', label: 'En Tránsito', count: stats?.por_estado.en_transito || 0 },
          { key: 'completada', label: 'Completadas', count: stats?.por_estado.completada || 0 },
          { key: 'liquidada', label: 'Liquidadas', count: stats?.por_estado.liquidada || 0 },
          { key: 'borrador', label: 'Borradores', count: stats?.por_estado.borrador || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedEstado(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedEstado === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedEstado === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ejercicio</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-2"
            >
              <option value="">Todos los años</option>
              <option value={CURRENT_YEAR}>{CURRENT_YEAR}</option>
              <option value={CURRENT_YEAR - 1}>{CURRENT_YEAR - 1}</option>
              <option value={CURRENT_YEAR - 2}>{CURRENT_YEAR - 2}</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Búsqueda rápida</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nº Operación, LER, Cliente, Proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Tabla de Operaciones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm text-gray-500">Cargando operaciones comerciales...</p>
          </div>
        ) : operations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              No hay operaciones registradas con los filtros seleccionados
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Cree su primera operación para conectar los traslados físicos con la liquidación económica y márgenes de compra/venta.
            </p>
            <div className="pt-2">
              <Button size="sm" onClick={() => router.push('/residuos/operaciones/nueva')}>
                Nueva Operación
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                  <th className="py-3 px-3">Operación / Fecha</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Residuo (LER)</th>
                  <th className="py-3 px-3 text-right">Toneladas</th>
                  <th className="py-3 px-3">Flujo Comercial (Compra ➔ Venta)</th>
                  <th className="py-3 px-3 text-right">Margen Bruto</th>
                  <th className="py-3 px-3 text-right">Margen (€/t)</th>
                  <th className="py-3 px-3">Trazabilidad DI</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {operations.map((op) => {
                  const estConfig = ESTADO_CONFIG[op.estado] || { label: op.estado, color: 'light' };
                  const ton = (op.cantidad_real_t && op.cantidad_real_t > 0 ? op.cantidad_real_t : op.cantidad_estimada_t) || 0;
                  const esMargenPositivo = (op.margen_bruto_total || 0) >= 0;

                  return (
                    <tr key={op.id} className="hover:bg-gray-50/75 dark:hover:bg-gray-700/30 transition-colors">
                      {/* Referencia y Fecha */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/residuos/operaciones/${op.id}`}
                          className="font-bold text-primary hover:underline font-mono"
                        >
                          {op.numero_operacion}
                        </Link>
                        <div className="text-gray-500 text-[11px]">
                          {new Date(op.fecha).toLocaleDateString('es-ES')}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3">
                        <Badge variant="light" color={estConfig.color} size="sm">
                          {estConfig.label}
                        </Badge>
                      </td>

                      {/* Residuo */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-mono font-bold text-gray-800 dark:text-gray-200">
                          {op.codigo_ler}
                        </div>
                        <div className="text-gray-500 text-[11px] truncate" title={op.descripcion_residuo}>
                          {op.descripcion_residuo}
                        </div>
                      </td>

                      {/* Toneladas */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {ton.toFixed(3)} t
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {op.cantidad_real_t ? '✓ Báscula' : 'Estimado'}
                        </div>
                      </td>

                      {/* Flujo Comercial */}
                      <td className="py-3 px-3 max-w-[240px]">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-red-700 dark:text-red-400 truncate max-w-[100px]" title={op.proveedor_razon_social || op.proveedor_comercial?.razon_social || 'Proveedor'}>
                            {op.proveedor_razon_social || op.proveedor_comercial?.razon_social || 'Proveedor'}
                          </span>
                          <span className="text-gray-400 shrink-0">→</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[100px]" title={op.cliente_razon_social || op.cliente_comercial?.razon_social || 'Cliente'}>
                            {op.cliente_razon_social || op.cliente_comercial?.razon_social || 'Cliente'}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-gray-500">
                          Compra: {(op.coste_compra_total || 0).toFixed(2)}€ | Venta: {(op.ingreso_venta_total || 0).toFixed(2)}€
                        </div>
                      </td>

                      {/* Margen Bruto */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${esMargenPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                          {(op.margen_bruto_total || 0).toFixed(2)} €
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {(op.porcentaje_margen || 0).toFixed(1)}% margen
                        </div>
                      </td>

                      {/* Margen Unitario */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-medium text-gray-800 dark:text-gray-200">
                          {(op.margen_unitario_tonelada || 0).toFixed(2)} €/t
                        </div>
                      </td>

                      {/* Trazabilidad DI */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {op.identification_document_id ? (
                          <Link
                            href={`/residuos/documentos-identificacion/${op.identification_document_id}`}
                            className="text-brand-600 dark:text-brand-400 hover:underline font-mono text-[11px]"
                          >
                            DI #{op.identification_document_id} →
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Sin DI vinculado</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/residuos/operaciones/${op.id}`}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => handleDelete(op.id)}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
