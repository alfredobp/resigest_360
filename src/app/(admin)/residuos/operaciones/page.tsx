'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import commercialOperationService, {
  type CommercialOperationFilter,
} from '@/services/commercialOperationService';
import {
  type CommercialOperation,
  type CommercialOperationStats,
  type EstadoOperacionComercial,
} from '@/types/wasteManagement';
import PageHeader from '@/components/common/PageHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs/Tabs';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import ScrapYardEntryModal from '@/components/residuos/ScrapYardEntryModal';
import {
  ArrowRight,
  Check,
  Plus,
  Scale,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const ESTADO_CONFIG: Record<
  EstadoOperacionComercial,
  { label: string; color: 'light' | 'info' | 'warning' | 'success' | 'error' | 'primary' }
> = {
  borrador: { label: 'Borrador', color: 'light' },
  abierta: { label: 'Abierta', color: 'primary' },
  en_transito: { label: 'En Tránsito', color: 'info' },
  completada: { label: 'Completada', color: 'warning' },
  liquidada: { label: 'Liquidada', color: 'success' },
  cancelada: { label: 'Cancelada', color: 'error' },
};

export default function OperacionesComercialesPage() {
  const router = useRouter();
  const {
    tenant,
    loading: tenantLoading,
    activeCompanyId,
    hasModule,
    canViewCommercial,
    isPlatformAdmin,
  } = useTenant();
  const [operations, setOperations] = useState<CommercialOperation[]>([]);
  const [stats, setStats] = useState<CommercialOperationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [opToDelete, setOpToDelete] = useState<number | null>(null);
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);

  const isAuthorized =
    isPlatformAdmin || (hasModule('operaciones_comerciales') && canViewCommercial);

  const [selectedYear, setSelectedYear] = useState<number | undefined>(CURRENT_YEAR);
  const [selectedEstado, setSelectedEstado] = useState<string>('todas');

  const loadData = async () => {
    if (!isAuthorized) return;
    try {
      setLoading(true);
      setError(null);

      const filters: CommercialOperationFilter = {
        año: selectedYear,
        estado: selectedEstado !== 'todas' ? (selectedEstado as EstadoOperacionComercial) : 'todas',
        company_id: activeCompanyId,
      };

      const [opsData, statsData] = await Promise.all([
        commercialOperationService.getAll(filters),
        commercialOperationService.getStats(selectedYear, activeCompanyId),
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
    if (tenantLoading) return;
    if (!isAuthorized && tenant) {
      router.replace(tenant.homePath);
      return;
    }
    loadData();
  }, [tenantLoading, isAuthorized, activeCompanyId, selectedYear, selectedEstado]);

  const confirmDelete = async () => {
    if (opToDelete === null) return;
    try {
      await commercialOperationService.delete(opToDelete);
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

  const columns = useMemo<ColumnDef<CommercialOperation>[]>(
    () => [
      {
        id: 'operacion',
        header: 'Operación / Fecha',
        accessorFn: (row) => `${row.numero_operacion} ${row.fecha}`,
        sortable: true,
        cell: ({ row: op }) => (
          <div>
            <Link
              href={`/residuos/operaciones/${op.id}`}
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline font-mono"
            >
              {op.numero_operacion}
            </Link>
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              {new Date(op.fecha).toLocaleDateString('es-ES')}
            </div>
          </div>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'estado',
        sortable: true,
        cell: ({ row: op }) => {
          const estConfig = ESTADO_CONFIG[op.estado] || { label: op.estado, color: 'light' as const };
          return (
            <Badge variant="light" color={estConfig.color} size="sm">
              {estConfig.label}
            </Badge>
          );
        },
      },
      {
        id: 'residuo',
        header: 'Residuo (LER)',
        accessorFn: (row) => `${row.codigo_ler || ''} ${row.descripcion_residuo || ''}`,
        sortable: true,
        className: 'max-w-[200px]',
        cell: ({ row: op }) => (
          <div>
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{op.codigo_ler}</div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate" title={op.descripcion_residuo}>
              {op.descripcion_residuo}
            </div>
          </div>
        ),
      },
      {
        id: 'toneladas',
        header: 'Toneladas',
        headerClassName: 'text-right',
        className: 'text-right whitespace-nowrap',
        accessorFn: (row) =>
          (row.cantidad_real_t && row.cantidad_real_t > 0 ? row.cantidad_real_t : row.cantidad_estimada_t) || 0,
        sortable: true,
        cell: ({ row: op }) => {
          const ton =
            (op.cantidad_real_t && op.cantidad_real_t > 0 ? op.cantidad_real_t : op.cantidad_estimada_t) || 0;
          return (
            <div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{ton.toFixed(3)} t</div>
              <div className="text-[10px] text-slate-400 inline-flex items-center gap-1 justify-end">
                {op.cantidad_real_t ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Báscula</span>
                  </>
                ) : (
                  'Estimado'
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'flujo',
        header: 'Flujo Comercial (Compra → Venta)',
        accessorFn: (row) =>
          `${row.proveedor_razon_social || row.proveedor_comercial?.razon_social || ''} ${row.cliente_razon_social || row.cliente_comercial?.razon_social || ''}`,
        className: 'max-w-[240px]',
        cell: ({ row: op }) => (
          <div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className="text-red-700 dark:text-red-400 truncate max-w-[100px]"
                title={op.proveedor_razon_social || op.proveedor_comercial?.razon_social || 'Proveedor'}
              >
                {op.proveedor_razon_social || op.proveedor_comercial?.razon_social || 'Proveedor'}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
              <span
                className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[100px]"
                title={op.cliente_razon_social || op.cliente_comercial?.razon_social || 'Cliente'}
              >
                {op.cliente_razon_social || op.cliente_comercial?.razon_social || 'Cliente'}
              </span>
            </div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
              Compra: {(op.coste_compra_total || 0).toFixed(2)}€ | Venta: {(op.ingreso_venta_total || 0).toFixed(2)}€
            </div>
          </div>
        ),
      },
      {
        id: 'margen_bruto',
        header: 'Margen Bruto',
        headerClassName: 'text-right',
        className: 'text-right whitespace-nowrap',
        accessorKey: 'margen_bruto_total',
        sortable: true,
        cell: ({ row: op }) => {
          const esMargenPositivo = (op.margen_bruto_total || 0) >= 0;
          return (
            <div>
              <div
                className={`font-mono font-bold ${
                  esMargenPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {(op.margen_bruto_total || 0).toFixed(2)} €
              </div>
              <div className="text-[10px] text-slate-400">{(op.porcentaje_margen || 0).toFixed(1)}% margen</div>
            </div>
          );
        },
      },
      {
        id: 'margen_unitario',
        header: 'Margen (€/t)',
        headerClassName: 'text-right',
        className: 'text-right whitespace-nowrap font-mono font-medium text-slate-800 dark:text-slate-200',
        accessorKey: 'margen_unitario_tonelada',
        sortable: true,
        cell: ({ row: op }) => `${(op.margen_unitario_tonelada || 0).toFixed(2)} €/t`,
      },
      {
        id: 'di',
        header: 'Trazabilidad DI',
        accessorKey: 'identification_document_id',
        className: 'whitespace-nowrap',
        cell: ({ row: op }) =>
          op.identification_document_id ? (
            <Link
              href={`/residuos/documentos-identificacion/${op.identification_document_id}`}
              className="text-brand-600 dark:text-brand-400 hover:underline font-mono text-[11px] inline-flex items-center gap-1"
            >
              <span>DI #{op.identification_document_id}</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          ) : (
            <span className="text-slate-400 text-[11px]">Sin DI vinculado</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right whitespace-nowrap',
        cell: ({ row: op }) => (
          <div className="inline-flex items-center justify-end gap-1.5">
            <DataTableActionButton
              action="view"
              onClick={() => router.push(`/residuos/operaciones/${op.id}`)}
            />
            <DataTableActionButton
              action="delete"
              onClick={() => setOpToDelete(op.id)}
            />
          </div>
        ),
      },
    ],
    [router]
  );

  if (loading && !stats) {
    return <PageSkeleton variant="table-with-stats" label="Cargando operaciones comerciales" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operaciones Comerciales"
        badge={
          <Badge variant="light" color="primary">
            Negociante y Agente
          </Badge>
        }
        description="Gestión económica e intermediación de residuos. Desacoplamiento de flujos físicos y financieros con cálculo de margen en tiempo real."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              startIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              onClick={() => commercialOperationService.exportToExcelXML(operations)}
              disabled={operations.length === 0}
            >
              Excel (.xls)
            </Button>

            <Button
              variant="outline"
              size="sm"
              startIcon={<FileText className="w-3.5 h-3.5" />}
              onClick={() => commercialOperationService.exportToCSV(operations)}
              disabled={operations.length === 0}
            >
              CSV
            </Button>

            <Button
              variant="soft"
              size="sm"
              startIcon={<Scale className="w-3.5 h-3.5" />}
              onClick={() => setIsScrapModalOpen(true)}
            >
              Nueva Entrada (Báscula)
            </Button>

            <Button
              size="sm"
              startIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => router.push('/residuos/operaciones/nueva')}
            >
              Nueva Operación
            </Button>
          </>
        }
      />

      {error && <Alert variant="error" title="Error" message={error} />}
      {success && <Alert variant="success" title="Completado" message={success} />}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComponentCard title="Facturación de Venta">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ingresos Totales (Venta)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.facturacion_total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Volumen:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {stats.toneladas_totales.toFixed(3)} t
                </span>
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Costes Operativos">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Costes Totales
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {stats.costes_totales.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </p>
              <p className="text-xs text-slate-500 mt-1">Compra + Fletes + Accesorios</p>
            </div>
          </ComponentCard>

          <ComponentCard title="Margen Bruto Total">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Margen Bruto Neto
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  stats.margen_bruto_total >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stats.margen_bruto_total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </p>
              <p className="text-xs text-slate-500 mt-1">Rentabilidad agregada del ejercicio</p>
            </div>
          </ComponentCard>

          <ComponentCard title="Margen Unitario">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Margen Unitario Medio
              </p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {stats.margen_medio_tonelada.toFixed(2)}{' '}
                <span className="text-sm font-normal text-slate-500">€/t</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{stats.total_operaciones} operaciones computadas</p>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* Pestañas de Estado con Contadores */}
      <Tabs
        variant="pills"
        activeTab={selectedEstado}
        onChange={setSelectedEstado}
        items={[
          {
            id: 'todas',
            label: 'Todas',
            badge: (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats?.total_operaciones || 0}
              </span>
            ),
          },
          {
            id: 'abierta',
            label: 'Abiertas',
            badge: (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats?.por_estado.abierta || 0}
              </span>
            ),
          },
          {
            id: 'en_transito',
            label: 'En Tránsito',
            badge: (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats?.por_estado.en_transito || 0}
              </span>
            ),
          },
          {
            id: 'completada',
            label: 'Completadas',
            badge: (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats?.por_estado.completada || 0}
              </span>
            ),
          },
          {
            id: 'liquidada',
            label: 'Liquidadas',
            badge: (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats?.por_estado.liquidada || 0}
              </span>
            ),
          },
          {
            id: 'borrador',
            label: 'Borradores',
            badge: (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats?.por_estado.borrador || 0}
              </span>
            ),
          },
        ]}
      />

      {loading ? (
        <PageSkeleton variant="table" rows={6} label="Cargando operaciones comerciales" />
      ) : (
        <DataTable
          data={operations}
          columns={columns}
          keyExtractor={(row) => row.id}
          searchPlaceholder="Buscar por Nº operación, LER, cliente o proveedor..."
          syncUrlParams
          toolbarActions={
            <select
              aria-label="Ejercicio"
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="">Todos los años</option>
              <option value={CURRENT_YEAR}>{CURRENT_YEAR}</option>
              <option value={CURRENT_YEAR - 1}>{CURRENT_YEAR - 1}</option>
              <option value={CURRENT_YEAR - 2}>{CURRENT_YEAR - 2}</option>
            </select>
          }
          emptyState={
            <div className="p-10 text-center space-y-3">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No hay operaciones registradas con los filtros seleccionados
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cree su primera operación para conectar los traslados físicos con la liquidación económica y márgenes de compra/venta.
              </p>
              <div className="pt-2">
                <Button
                  size="sm"
                  startIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => router.push('/residuos/operaciones/nueva')}
                >
                  Nueva Operación
                </Button>
              </div>
            </div>
          }
        />
      )}

      <ConfirmModal
        isOpen={opToDelete !== null}
        onClose={() => setOpToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar operación comercial"
        message="¿Confirma la eliminación de esta operación comercial? Esta acción no se puede deshacer."
      />

      <ScrapYardEntryModal
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
