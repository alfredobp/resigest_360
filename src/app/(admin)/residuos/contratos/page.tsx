'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import NuevoContratoModal from '@/components/residuos/NuevoContratoModal';
import wasteContractService, { getContractEffectiveStatus } from '@/services/wasteContractService';
import companyService from '@/services/companyService';
import type { WasteContract, Company } from '@/types/wasteManagement';
import { generateContractPDF } from '@/lib/pdfUtils';
import { FileDown, CheckCircle2, Archive, Trash2 } from 'lucide-react';

const STATUS_COLORS = {
  borrador: 'info',
  pendiente_firma: 'warning',
  vigente: 'success',
  caducado: 'warning',
  finalizado: 'light',
  cancelado: 'error',
} as const;

export default function ContratosPage() {
  const router = useRouter();
  const { canWrite, activeCompanyId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [contracts, setContracts] = useState<WasteContract[]>([]);
  const [hasCompany, setHasCompany] = useState(false);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<number | null>(null);
  const [contractToFinalize, setContractToFinalize] = useState<number | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    contract: WasteContract;
    top: number;
    right: number;
  } | null>(null);

  const handleFilterStatusChange = (status: string) => {
    setFilterStatus(status);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (status === 'all') params.delete('status');
      else params.set('status', status);
      const qs = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    }
  };

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

  const handleDownloadPDF = async (contract: WasteContract) => {
    try {
      setDownloadingId(contract.id);
      setError(null);
      setSuccessMessage(null);
      const fullContract = await wasteContractService.getById(contract.id);
      const contractToPrint = fullContract || contract;
      const doc = await generateContractPDF(contractToPrint);
      doc.save(`contrato_${contractToPrint.numero_contrato || contractToPrint.id}.pdf`);
      setSuccessMessage(`PDF del contrato ${contractToPrint.numero_contrato || `#${contractToPrint.id}`} generado y descargado correctamente.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error al descargar PDF:', err);
      setError(`Hubo un error al generar el PDF: ${err.message || 'Error desconocido'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const statusParam = new URLSearchParams(window.location.search).get('status');
      if (statusParam) {
        setFilterStatus(statusParam);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Verificar si el usuario tiene empresa registrada
      const company = await companyService.getUserCompany();
      setHasCompany(!!company);
      setMyCompany(company);

      if (company) {
        // Cargar contratos
        const data = await wasteContractService.getAll();
        setContracts(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setContractToDelete(id);
  };

  const confirmDelete = async () => {
    if (contractToDelete === null) return;

    try {
      await wasteContractService.delete(contractToDelete);
      setContracts((prev) => prev.filter((c) => c.id !== contractToDelete));
      toast.success('Contrato de tratamiento eliminado correctamente.');
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    } finally {
      setContractToDelete(null);
    }
  };

  const handleChangeStatus = async (id: number, newStatus: 'borrador' | 'vigente' | 'finalizado' | 'cancelado') => {
    if (newStatus === 'vigente') {
      const contract = contracts.find(c => c.id === id);
      if (contract) {
        const hasProducer = Boolean(contract.company_id || contract.company);
        const hasGestor = Boolean(contract.treatment_manager || contract.gestor_company || contract.gestor_company_id);
        if (!hasProducer || !hasGestor) {
          toast.warning('No es posible activar el contrato: Debe tener asignado obligatoriamente tanto el Productor como el Gestor.');
          return;
        }
        if (!contract.fecha_fin) {
          toast.warning('No es posible activar el contrato: Debe especificarse una fecha de finalización.');
          return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(contract.fecha_fin) < today) {
          toast.warning(`No es posible activar el contrato: La fecha de finalización (${new Date(contract.fecha_fin).toLocaleDateString('es-ES')}) ya ha vencido. Actualice las fechas antes de activarlo.`);
          return;
        }
      }
    }

    try {
      if (newStatus === 'vigente') {
        await wasteContractService.activate(id);
      } else {
        await wasteContractService.updateStatus(id, newStatus);
      }
      toast.success(`Estado del contrato actualizado a "${newStatus}" correctamente.`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error al cambiar estado: ${err.message}`);
    }
  };

  const filteredContracts = contracts.filter(c => {
    const effective = getContractEffectiveStatus(c);
    if (filterStatus === 'all') return true;
    if (filterStatus === 'caducado') return effective.status === 'caducado';
    if (filterStatus === 'vigente') return effective.status === 'vigente';
    return c.estado === filterStatus;
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
    }
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const columns = useMemo<ColumnDef<WasteContract>[]>(
    () => [
      {
        id: 'numero_contrato',
        header: 'Nº Contrato',
        accessorFn: (row) => row.numero_contrato || `Contrato #${row.id}`,
        sortable: true,
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => router.push(`/residuos/contratos/${row.id}`)}
              className="font-mono font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 text-left"
            >
              {row.numero_contrato || `Contrato #${row.id}`}
            </button>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.tipo_contrato}</div>
          </div>
        ),
      },
      {
        id: 'partes',
        header: 'Productor / Gestor',
        accessorFn: (row) =>
          `${row.company?.razon_social || myCompany?.razon_social || ''} ${row.treatment_manager?.razon_social || row.gestor_company?.razon_social || ''}`,
        cell: ({ row }) => {
          const productorName = row.company?.razon_social || myCompany?.razon_social;
          const gestorName = row.treatment_manager?.razon_social || row.gestor_company?.razon_social;
          return (
            <div className="min-w-[200px]">
              <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[260px]">
                {productorName || 'No disponible'}
              </div>
              {gestorName ? (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                  ➔ {gestorName}
                </div>
              ) : (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Sin gestor asignado
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'vigencia',
        header: 'Vigencia',
        accessorFn: (row) => row.fecha_fin || row.fecha_contrato || '',
        sortable: true,
        cell: ({ row }) => {
          const effective = getContractEffectiveStatus(row);
          return (
            <div className="whitespace-nowrap">
              {row.fecha_inicio && row.fecha_fin ? (
                <div className={`font-mono text-xs ${effective.isExpired ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                  {formatDate(row.fecha_inicio)} – {formatDate(row.fecha_fin)}
                </div>
              ) : (
                <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {formatDate(row.fecha_contrato)}
                </div>
              )}
              {row.descripcion_residuos && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[210px]" title={row.descripcion_residuos}>
                  {row.descripcion_residuos}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorFn: (row) => getContractEffectiveStatus(row).label,
        sortable: true,
        cell: ({ row }) => {
          const effective = getContractEffectiveStatus(row);
          return (
            <Badge color={STATUS_COLORS[effective.status]} size="sm">
              {effective.label}
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
          const isDownloadingThis = downloadingId === row.id;
          return (
            <div className="inline-flex items-center justify-end gap-1">
              <DataTableActionButton
                action="view"
                onClick={() => router.push(`/residuos/contratos/${row.id}`)}
              />
              <DataTableActionButton
                action="more"
                loading={isDownloadingThis}
                aria-label={`Más acciones para contrato ${row.numero_contrato || row.id}`}
                aria-haspopup="menu"
                aria-expanded={actionMenu?.contract.id === row.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (actionMenu?.contract.id === row.id) {
                    setActionMenu(null);
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const menuHeight = 176;
                  const top =
                    rect.bottom + menuHeight > window.innerHeight
                      ? Math.max(8, rect.top - menuHeight)
                      : rect.bottom + 4;
                  const right = Math.max(8, window.innerWidth - rect.right);
                  setActionMenu({ contract: row, top, right });
                }}
              />
            </div>
          );
        },
      },
    ],
    [myCompany, downloadingId, canWrite, actionMenu?.contract.id]
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Cargando contratos">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-80 rounded bg-slate-200/80 dark:bg-slate-800/80" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4">
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-48 rounded bg-slate-200/80 dark:bg-slate-800/80" />
                <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasCompany) {
    return (
      <>
        <PageBreadCrumb pageTitle="Contratos de Residuos" />
        <div className="max-w-6xl mx-auto">
          <Alert variant="error" title="Configuración Pendiente" message="Necesitas configurar tu empresa antes de gestionar contratos." />
          <div className="mt-4">
            <Button onClick={() => router.push('/residuos/mi-empresa')}>
              Configurar Empresa
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-5">
        <PageBreadCrumb
          pageTitle="Contratos de Residuos"
          title="Contratos de Gestión de Residuos"
          className="mb-0"
          actions={
            canWrite ? (
              <Button variant="outline" size="sm" onClick={() => setShowNewContractModal(true)}>
                + Nuevo Contrato
              </Button>
            ) : undefined
          }
        />

        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        {successMessage && (
          <Alert variant="success" title="Éxito" message={successMessage} />
        )}

        {/* Filtros */}
        <div className="rounded-[10px] border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('all')}
            >
              Todos ({contracts.length})
            </Button>
            <Button
              variant={filterStatus === 'vigente' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('vigente')}
            >
              Vigentes ({contracts.filter(c => getContractEffectiveStatus(c).status === 'vigente').length})
            </Button>
            <Button
              variant={filterStatus === 'caducado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('caducado')}
            >
              Caducados ({contracts.filter(c => getContractEffectiveStatus(c).status === 'caducado').length})
            </Button>
            <Button
              variant={filterStatus === 'borrador' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('borrador')}
            >
              Borradores ({contracts.filter(c => c.estado === 'borrador').length})
            </Button>
            <Button
              variant={filterStatus === 'pendiente_firma' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('pendiente_firma')}
            >
              Pend. Firma ({contracts.filter(c => c.estado === 'pendiente_firma').length})
            </Button>
            <Button
              variant={filterStatus === 'finalizado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('finalizado')}
            >
              Finalizados ({contracts.filter(c => c.estado === 'finalizado').length})
            </Button>
          </div>
        </div>

        {/* Tabla de Contratos */}
        <DataTable
          data={filteredContracts}
          columns={columns}
          syncUrlParams
          searchPlaceholder="Buscar por nº contrato, productor, gestor o residuo..."
          emptyMessage={
            canWrite
              ? 'No hay contratos registrados. Comienza creando tu primer contrato de tratamiento.'
              : 'No hay contratos registrados para esta empresa.'
          }
          emptyState={
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No hay contratos</p>
              <p className="mt-1 text-xs text-slate-500">
                {canWrite
                  ? 'Comienza creando tu primer contrato de tratamiento'
                  : 'No hay contratos registrados para esta empresa'}
              </p>
              {canWrite && (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowNewContractModal(true)}
                >
                  + Crear Primer Contrato
                </Button>
              )}
            </div>
          }
        />

        {/* Modal de Nuevo Contrato */}
        {myCompany && (
          <NuevoContratoModal
            isOpen={showNewContractModal}
            onClose={() => setShowNewContractModal(false)}
            onSuccess={loadData}
            myCompany={myCompany}
          />
        )}

        {actionMenu && (() => {
          const contract = actionMenu.contract;
          const canActivate = canWrite && (contract.estado === 'borrador' || contract.estado === 'pendiente_firma');
          const canFinalize = canWrite && contract.estado === 'vigente';
          const canDelete = canWrite && !contract.firmado_productor && !contract.firmado_gestor && contract.estado !== 'finalizado';

          return (
            <div
              role="menu"
              style={{ top: actionMenu.top, right: actionMenu.right }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-50 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1.5 text-xs"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionMenu(null);
                  handleDownloadPDF(contract);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Descargar PDF</span>
              </button>

              {canActivate && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionMenu(null);
                    handleChangeStatus(contract.id, 'vigente');
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Activar contrato</span>
                </button>
              )}

              {canFinalize && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionMenu(null);
                    setContractToFinalize(contract.id);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Finalizar contrato</span>
                </button>
              )}

              {canDelete && (
                <>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActionMenu(null);
                      handleDelete(contract.id);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar contrato</span>
                  </button>
                </>
              )}
            </div>
          );
        })()}

        <ConfirmModal
          isOpen={contractToFinalize !== null}
          onClose={() => setContractToFinalize(null)}
          onConfirm={async () => {
            if (contractToFinalize !== null) {
              await handleChangeStatus(contractToFinalize, 'finalizado');
            }
          }}
          variant="warning"
          title="Finalizar contrato"
          confirmLabel="Sí, finalizar"
          message="¿Estás seguro de que deseas finalizar este contrato? Una vez finalizado no podrá utilizarse para nuevos traslados de residuos."
        />

        <ConfirmModal
          isOpen={contractToDelete !== null}
          onClose={() => setContractToDelete(null)}
          onConfirm={confirmDelete}
          title="Eliminar contrato"
          message="¿Estás seguro de que deseas eliminar este contrato? Esta acción solo es posible si el contrato no se ha utilizado para emitir Documentos de Identificación (DI) o Notificaciones Previas (NT)."
        />
      </div>
    </>
  );
}
