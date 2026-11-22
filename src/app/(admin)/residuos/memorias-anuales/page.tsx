'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllMemorias,
  deleteMemoria,
  getStats,
  updateEstado,
  recalculateDraftMemoria,
  generateExcelData,
  exportMemoriaToExcelXML,
  exportMemoriaToCSV,
} from '@/services/memoriaAnualService';
import { generateMemoriaAnualPDF } from '@/lib/pdfUtils';
import productionCenterService from '@/services/productionCenterService';
import companyService from '@/services/companyService';
import {
  type MemoriaAnual,
  type EstadoMemoria,
  type TipoMemoria,
  type ProductionCenter,
} from '@/types/wasteManagement';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import {
  Plus,
  FileDown,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  CheckCircle2,
  Send,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';

const ESTADO_CONFIG: Record<
  EstadoMemoria,
  { color: 'light' | 'warning' | 'primary' | 'success' | 'dark'; label: string }
> = {
  borrador: { color: 'light', label: 'Borrador' },
  revision: { color: 'warning', label: 'En Revisión' },
  completada: { color: 'primary', label: 'Completada' },
  presentada: { color: 'success', label: 'Presentada' },
  archivada: { color: 'dark', label: 'Archivada' },
};

const TIPO_LABELS: Record<TipoMemoria, string> = {
  productor: 'Productor',
  gestor: 'Gestor',
  gestor_raee: 'Gestor RAEE',
  negociante: 'Negociante',
  transportista: 'Transportista',
  agente: 'Agente',
};

export default function MemoriasAnualesPage() {
  const router = useRouter();
  const { canWrite, activeCompanyId } = useTenant();
  const [memorias, setMemorias] = useState<MemoriaAnual[]>([]);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');
  const [filtroAño, setFiltroAño] = useState<string>('todos');
  const [filtroCentro, setFiltroCentro] = useState<string>('todos');

  // Estadísticas y modales
  const [stats, setStats] = useState<any>(null);
  const [memoriaToDelete, setMemoriaToDelete] = useState<number | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    memoria: MemoriaAnual;
    top: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    if (!actionMenu) return;
    const close = () => setActionMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActionMenu(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [actionMenu]);

  useEffect(() => {
    loadMemorias();
    loadStats();
  }, [activeCompanyId]);

  const loadMemorias = async () => {
    try {
      setLoading(true);
      const data = await getAllMemorias();
      setMemorias(data);

      const company = await companyService.getUserCompany();
      if (company) {
        const centersData = await productionCenterService.getByCompanyId(company.id);
        setProductionCenters(centersData);
      }
    } catch (err) {
      setError('Error al cargar las memorias anuales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const filteredMemorias = useMemo(() => {
    return memorias.filter((m) => {
      if (filtroEstado !== 'todas' && m.estado !== filtroEstado) return false;
      if (filtroTipo !== 'todas' && m.tipo_memoria !== filtroTipo) return false;
      if (filtroAño !== 'todos' && m.año !== parseInt(filtroAño, 10)) return false;
      if (filtroCentro !== 'todos' && m.production_center_id !== parseInt(filtroCentro, 10)) return false;
      return true;
    });
  }, [memorias, filtroEstado, filtroTipo, filtroAño, filtroCentro]);

  const añosUnicos = useMemo(() => {
    const años = new Set(memorias.map((m) => m.año));
    return Array.from(años).sort((a, b) => b - a);
  }, [memorias]);

  const handleDownloadPDF = async (memoria: MemoriaAnual) => {
    try {
      setProcessingId(memoria.id);
      const pdfDoc = await generateMemoriaAnualPDF(memoria);
      pdfDoc.save(`${memoria.numero_memoria}.pdf`);
      toast.success(`PDF de ${memoria.numero_memoria} descargado correctamente.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error al generar el PDF');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportExcel = async (memoria: MemoriaAnual) => {
    try {
      setProcessingId(memoria.id);
      const excelData = await generateExcelData(memoria.id);
      exportMemoriaToExcelXML(memoria, excelData);
      toast.success(`Excel de ${memoria.numero_memoria} generado y descargado.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error al exportar Excel');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCSV = async (memoria: MemoriaAnual) => {
    try {
      setProcessingId(memoria.id);
      const excelData = await generateExcelData(memoria.id);
      exportMemoriaToCSV(memoria, excelData);
      toast.success(`CSV de ${memoria.numero_memoria} exportado correctamente.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error al exportar CSV');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRecalculate = async (memoria: MemoriaAnual) => {
    try {
      setProcessingId(memoria.id);
      const updated = await recalculateDraftMemoria(memoria.id);
      toast.success(
        `Memoria recalculada: ${updated.total_movimientos} movimientos (${updated.total_toneladas.toFixed(3)} t).`
      );
      await Promise.all([loadMemorias(), loadStats()]);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error al recalcular el borrador');
    } finally {
      setProcessingId(null);
    }
  };

  const handleChangeEstado = async (memoria: MemoriaAnual, nuevoEstado: EstadoMemoria) => {
    try {
      setProcessingId(memoria.id);
      await updateEstado(memoria.id, nuevoEstado);
      toast.success(
        `Estado de ${memoria.numero_memoria} actualizado a "${ESTADO_CONFIG[nuevoEstado].label}".`
      );
      await Promise.all([loadMemorias(), loadStats()]);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error al actualizar el estado');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDelete = async () => {
    if (memoriaToDelete === null) return;
    try {
      await deleteMemoria(memoriaToDelete);
      const msg = 'Memoria anual eliminada correctamente';
      setSuccess(msg);
      toast.success(msg);
      await Promise.all([loadMemorias(), loadStats()]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const msg = err?.message || 'Error al eliminar la memoria anual';
      setError(msg);
      toast.error(msg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const getTotalToneladas = (memoria: MemoriaAnual): number => {
    if (memoria.resumen_ler && memoria.resumen_ler.length > 0) {
      return memoria.resumen_ler.reduce((sum, item) => sum + (Number(item.cantidad_total) || 0), 0);
    }
    return Number(memoria.total_toneladas) || 0;
  };

  const columns = useMemo<ColumnDef<MemoriaAnual>[]>(
    () => [
      {
        id: 'numero_memoria',
        header: 'Número',
        accessorKey: 'numero_memoria',
        sortable: true,
        className: 'whitespace-nowrap font-mono font-semibold text-slate-900 dark:text-slate-100',
        cell: ({ row }) => row.numero_memoria,
      },
      {
        id: 'año',
        header: 'Año',
        accessorKey: 'año',
        sortable: true,
        className: 'whitespace-nowrap font-mono text-slate-600 dark:text-slate-300',
        cell: ({ row }) => row.año,
      },
      {
        id: 'tipo_memoria',
        header: 'Tipo',
        accessorFn: (row) => TIPO_LABELS[row.tipo_memoria] || row.tipo_memoria,
        sortable: true,
        className: 'whitespace-nowrap text-slate-600 dark:text-slate-300',
        cell: ({ row }) => TIPO_LABELS[row.tipo_memoria] || row.tipo_memoria,
      },
      {
        id: 'empresa',
        header: 'Empresa',
        accessorFn: (row) =>
          `${row.nombre_empresa || ''} ${row.production_center?.nombre || ''} ${row.nif_empresa || ''}`,
        sortable: true,
        className: 'max-w-[220px]',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate" title={row.nombre_empresa}>
              {row.nombre_empresa}
            </div>
            <div
              className="text-xs text-brand-600 dark:text-brand-400 font-medium truncate"
              title={row.production_center?.nombre || 'General'}
            >
              {row.production_center?.nombre || 'General'}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {row.nif_empresa}
            </div>
          </div>
        ),
      },
      {
        id: 'total_movimientos',
        header: 'Mov.',
        accessorKey: 'total_movimientos',
        sortable: true,
        className: 'whitespace-nowrap font-mono text-slate-700 dark:text-slate-300',
        cell: ({ row }) => row.total_movimientos,
      },
      {
        id: 'toneladas',
        header: 'Toneladas',
        accessorFn: (row) => getTotalToneladas(row),
        sortable: true,
        className: 'whitespace-nowrap font-mono text-slate-700 dark:text-slate-300',
        cell: ({ row }) => `${getTotalToneladas(row).toFixed(3)} t`,
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'estado',
        sortable: true,
        className: 'whitespace-nowrap',
        cell: ({ row }) => {
          const config = ESTADO_CONFIG[row.estado] || { color: 'light' as const, label: row.estado };
          return (
            <Badge variant="light" color={config.color}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: 'acciones',
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right whitespace-nowrap',
        cell: ({ row }) => {
          const isProcessingThis = processingId === row.id;
          return (
            <div className="inline-flex items-center justify-end gap-1">
              <DataTableActionButton
                action="view"
                onClick={() => router.push(`/residuos/memorias-anuales/${row.id}`)}
              />
              <DataTableActionButton
                action="more"
                loading={isProcessingThis}
                aria-label={`Más acciones para memoria ${row.numero_memoria}`}
                aria-haspopup="menu"
                aria-expanded={actionMenu?.memoria.id === row.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (actionMenu?.memoria.id === row.id) {
                    setActionMenu(null);
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const menuHeight = 260;
                  const top =
                    rect.bottom + menuHeight > window.innerHeight
                      ? Math.max(8, rect.top - menuHeight)
                      : rect.bottom + 4;
                  const right = Math.max(8, window.innerWidth - rect.right);
                  setActionMenu({ memoria: row, top, right });
                }}
              />
            </div>
          );
        },
      },
    ],
    [processingId, actionMenu?.memoria.id, router]
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Cargando memorias anuales">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-96 max-w-full rounded bg-slate-200/80 dark:bg-slate-800/80" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4" />
          ))}
        </div>
        <div className="rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 px-4 flex items-center justify-between gap-4">
                <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-48 rounded bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-7 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Memorias Anuales" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Memorias Anuales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona las memorias anuales de residuos generadas desde los documentos de identificación
          </p>
        </div>
        {canWrite && (
          <Button
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => router.push('/residuos/memorias-anuales/nueva')}
          >
            Nueva Memoria
          </Button>
        )}
      </div>

      {/* Alertas */}
      {error && <Alert variant="error" title="Error" message={error} />}
      {success && <Alert variant="success" title="Éxito" message={success} />}

      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <ComponentCard title="Total Memorias">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </ComponentCard>

          <ComponentCard title="Completadas">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.por_estado?.completada || 0}
            </p>
          </ComponentCard>

          <ComponentCard title="Presentadas">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {stats.por_estado?.presentada || 0}
            </p>
          </ComponentCard>

          <ComponentCard title="Total Toneladas">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.total_toneladas.toFixed(3)} t
            </p>
          </ComponentCard>
        </div>
      )}

      {/* Filtros */}
      <ComponentCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="todas">Todas</option>
              <option value="borrador">Borrador</option>
              <option value="revision">En Revisión</option>
              <option value="completada">Completada</option>
              <option value="presentada">Presentada</option>
              <option value="archivada">Archivada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Tipo de Memoria
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="todas">Todas</option>
              <option value="productor">Productor</option>
              <option value="gestor">Gestor</option>
              <option value="gestor_raee">Gestor RAEE</option>
              <option value="negociante">Negociante</option>
              <option value="transportista">Transportista</option>
              <option value="agente">Agente</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Año
            </label>
            <select
              value={filtroAño}
              onChange={(e) => setFiltroAño(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="todos">Todos</option>
              {añosUnicos.map((año) => (
                <option key={año} value={año}>
                  {año}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Centro de Producción
            </label>
            <select
              value={filtroCentro}
              onChange={(e) => setFiltroCentro(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="todos">Todos los centros</option>
              {productionCenters.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ComponentCard>

      {/* Listado en DataTable */}
      <DataTable
        data={filteredMemorias}
        columns={columns}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Buscar por número, empresa, NIF, centro o año..."
        syncUrlParams
        emptyState={
          <div className="text-center py-10">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
              No hay memorias anuales
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Comienza creando una nueva memoria anual o ajusta los filtros activos.
            </p>
            {canWrite && (
              <div className="mt-5">
                <Button
                  startIcon={<Plus className="w-4 h-4" />}
                  onClick={() => router.push('/residuos/memorias-anuales/nueva')}
                >
                  Nueva Memoria
                </Button>
              </div>
            )}
          </div>
        }
      />

      {/* Menú contextual de acciones */}
      {actionMenu && (() => {
        const m = actionMenu.memoria;
        const isDraft = m.estado === 'borrador';
        const isReview = m.estado === 'revision';
        const isCompleted = m.estado === 'completada';
        const isPresented = m.estado === 'presentada';

        return (
          <div
            role="menu"
            style={{ top: actionMenu.top, right: actionMenu.right }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1.5 text-xs"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActionMenu(null);
                handleDownloadPDF(m);
              }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActionMenu(null);
                handleExportExcel(m);
              }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Excel (.xls)</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActionMenu(null);
                handleExportCSV(m);
              }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Exportar CSV</span>
            </button>

            {canWrite && (isDraft || isReview || isCompleted || isPresented) && (
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            )}

            {canWrite && isDraft && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionMenu(null);
                    handleRecalculate(m);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Recalcular borrador</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionMenu(null);
                    handleChangeEstado(m, 'revision');
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Enviar a revisión</span>
                </button>
              </>
            )}

            {canWrite && isReview && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionMenu(null);
                    handleChangeEstado(m, 'completada');
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Marcar como completada</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionMenu(null);
                    handleChangeEstado(m, 'borrador');
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Volver a borrador</span>
                </button>
              </>
            )}

            {canWrite && isCompleted && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionMenu(null);
                  handleChangeEstado(m, 'presentada');
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Marcar como presentada</span>
              </button>
            )}

            {canWrite && isPresented && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionMenu(null);
                  handleChangeEstado(m, 'archivada');
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Archivar memoria</span>
              </button>
            )}

            {canWrite && isDraft && (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionMenu(null);
                    setMemoriaToDelete(m.id);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar borrador</span>
                </button>
              </>
            )}
          </div>
        );
      })()}

      <ConfirmModal
        isOpen={memoriaToDelete !== null}
        onClose={() => setMemoriaToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar memoria anual"
        message="¿Estás seguro de que quieres eliminar esta memoria anual? Esta acción no se puede deshacer."
      />
    </div>
  );
}
