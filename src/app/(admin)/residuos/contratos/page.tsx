'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import NuevoContratoModal from '@/components/residuos/NuevoContratoModal';
import wasteContractService, { getContractEffectiveStatus } from '@/services/wasteContractService';
import companyService from '@/services/companyService';
import type { WasteContract, Company } from '@/types/wasteManagement';
import { generateContractPDF } from '@/lib/pdfUtils';

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
        className: 'text-right',
        cell: ({ row }) => (
          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/residuos/contratos/${row.id}`)}
            >
              Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadPDF(row)}
              disabled={downloadingId === row.id}
            >
              {downloadingId === row.id ? 'PDF...' : 'PDF'}
            </Button>
            {canWrite && (row.estado === 'borrador' || row.estado === 'pendiente_firma') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChangeStatus(row.id, 'vigente')}
              >
                Activar
              </Button>
            )}
            {canWrite && row.estado === 'vigente' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContractToFinalize(row.id)}
              >
                Finalizar
              </Button>
            )}
            {canWrite && !row.firmado_productor && !row.firmado_gestor && row.estado !== 'finalizado' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(row.id)}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Eliminar
              </Button>
            )}
          </div>
        ),
      },
    ],
    [myCompany, downloadingId, canWrite]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">Cargando contratos...</p>
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
      <PageBreadCrumb pageTitle="Contratos de Residuos" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">
            Contratos de Gestión de Residuos
          </h2>
          {canWrite && (
            <Button variant="outline" onClick={() => setShowNewContractModal(true)}>
              + Nuevo Contrato
            </Button>
          )}
        </div>

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
              onClick={() => setFilterStatus('all')}
            >
              Todos ({contracts.length})
            </Button>
            <Button
              variant={filterStatus === 'vigente' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('vigente')}
            >
              Vigentes ({contracts.filter(c => getContractEffectiveStatus(c).status === 'vigente').length})
            </Button>
            <Button
              variant={filterStatus === 'caducado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('caducado')}
            >
              Caducados ({contracts.filter(c => getContractEffectiveStatus(c).status === 'caducado').length})
            </Button>
            <Button
              variant={filterStatus === 'borrador' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('borrador')}
            >
              Borradores ({contracts.filter(c => c.estado === 'borrador').length})
            </Button>
            <Button
              variant={filterStatus === 'pendiente_firma' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pendiente_firma')}
            >
              Pend. Firma ({contracts.filter(c => c.estado === 'pendiente_firma').length})
            </Button>
            <Button
              variant={filterStatus === 'finalizado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('finalizado')}
            >
              Finalizados ({contracts.filter(c => c.estado === 'finalizado').length})
            </Button>
          </div>
        </div>

        {/* Tabla de Contratos */}
        <DataTable
          data={filteredContracts}
          columns={columns}
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
