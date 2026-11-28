'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { priorNotificationService } from '@/services/priorNotificationService';
import { resolvePlatformForNT } from '@/services/siraService';
import companyService from '@/services/companyService';
import { useTenant } from '@/context/TenantContext';
import type { PriorNotification, Company } from '@/types/wasteManagement';
import { FileText, Plus } from 'lucide-react';

export default function NotificacionesPreviasPage() {
  const router = useRouter();
  const { activeCompanyId, canWrite } = useTenant();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<PriorNotification[]>([]);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [ntToSendSira, setNtToSendSira] = useState<PriorNotification | null>(null);
  const [ntToDelete, setNtToDelete] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const company = await companyService.getUserCompany();
      setMyCompany(company);

      const data = await priorNotificationService.getAll();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar Notificaciones Previas');
    } finally {
      setLoading(false);
    }
  };

  const confirmSendToSira = async (validateOnly = false) => {
    if (!ntToSendSira) return;

    try {
      setActionLoading(true);
      const result = await priorNotificationService.sendToSira(ntToSendSira.id, validateOnly);

      if (result.success) {
        const targetName = result.platformName || 'e-SIR / SIRA';
        toast.success(
          validateOnly
            ? `Notificación Previa validada con éxito (${targetName})`
            : `Notificación Previa presentada y aceptada por ${targetName}.\nID: ${result.siraId || 'OK'}`
        );
        setNtToSendSira(null);
        await loadData();
      }
    } catch (err: any) {
      toast.error(`Envío telemático: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (ntToDelete === null) return;

    try {
      setActionLoading(true);
      await priorNotificationService.delete(ntToDelete);
      setNotifications((prev) => prev.filter((n) => n.id !== ntToDelete));
      toast.success('Notificación Previa eliminada correctamente.');
      setNtToDelete(null);
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredNotifications = useMemo(
    () => notifications.filter((nt) => filterStatus === 'all' || nt.estado === filterStatus),
    [notifications, filterStatus]
  );

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aceptada':
        return <Badge variant="light" color="success">Aceptada (e-SIR / SIRA)</Badge>;
      case 'validada_sira':
      case 'validada':
        return <Badge variant="light" color="info">Pre-validada</Badge>;
      case 'enviada_sira':
        return <Badge variant="light" color="warning">Enviada (e-SIR / SIRA)</Badge>;
      case 'rechazada':
        return <Badge variant="light" color="error">Rechazada</Badge>;
      case 'caducada':
        return <Badge variant="light" color="light">Caducada</Badge>;
      default:
        return <Badge variant="light" color="primary">Borrador</Badge>;
    }
  };

  const hasCredentials = Boolean(myCompany?.sira_usuario && myCompany?.sira_password);

  const columns = useMemo<ColumnDef<PriorNotification>[]>(
    () => [
      {
        id: 'numero_notificacion',
        header: 'Nº NT',
        accessorFn: (row) => `${row.numero_notificacion || `NT-ID-${row.id}`} ${row.sira_id || ''}`,
        sortable: true,
        className: 'font-mono font-medium text-slate-900 dark:text-slate-100 max-w-[150px]',
        cell: ({ row: nt }) => (
          <div>
            <div className="truncate" title={nt.numero_notificacion || `NT-ID-${nt.id}`}>
              {nt.numero_notificacion || `NT-ID-${nt.id}`}
            </div>
            {nt.sira_id && (
              <span
                className={`block truncate text-[10.5px] font-sans font-semibold ${
                  nt.sira_id.includes('TEST') || nt.sira_id.includes('SIM')
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
                title={nt.sira_id}
              >
                {nt.sira_id.includes('TEST') || nt.sira_id.includes('SIM') ? 'Sim: ' : 'SIRA: '}
                {nt.sira_id}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'productor',
        header: 'Productor',
        accessorFn: (row) => `${row.productor_razon_social || ''} ${row.productor_cif || ''}`,
        sortable: true,
        className: 'max-w-[160px]',
        cell: ({ row: nt }) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate" title={nt.productor_razon_social}>
              {nt.productor_razon_social}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{nt.productor_cif}</div>
          </div>
        ),
      },
      {
        id: 'gestor',
        header: 'Gestor',
        accessorFn: (row) => `${row.gestor_razon_social || ''} ${row.gestor_cif || ''}`,
        sortable: true,
        className: 'max-w-[160px]',
        cell: ({ row: nt }) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate" title={nt.gestor_razon_social}>
              {nt.gestor_razon_social}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{nt.gestor_cif}</div>
          </div>
        ),
      },
      {
        id: 'residuo',
        header: 'Residuo (LER)',
        accessorFn: (row) => `${row.codigo_ler || ''} ${row.descripcion_residuo || ''}`,
        sortable: true,
        className: 'max-w-[160px]',
        cell: ({ row: nt }) => (
          <div>
            <div className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{nt.codigo_ler}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={nt.descripcion_residuo || 'S/D'}>
              {nt.descripcion_residuo || 'S/D'}
            </div>
          </div>
        ),
      },
      {
        id: 'cantidad',
        header: 'Cantidad',
        accessorKey: 'cantidad_estimada_kg',
        sortable: true,
        className: 'font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap',
        cell: ({ row: nt }) => `${Number(nt.cantidad_estimada_kg).toLocaleString('es-ES')} kg`,
      },
      {
        id: 'vigencia',
        header: 'Vigencia',
        accessorKey: 'fecha_fin',
        sortable: true,
        className: 'text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap',
        cell: ({ row: nt }) => (
          <div>
            {nt.fecha_inicio && <div>{nt.fecha_inicio}</div>}
            <div className="font-medium text-slate-800 dark:text-slate-200">{nt.fecha_fin}</div>
          </div>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'estado',
        sortable: true,
        className: 'whitespace-nowrap',
        cell: ({ row: nt }) => getStatusBadge(nt.estado),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right whitespace-nowrap',
        cell: ({ row: nt }) => {
          const isAccepted = nt.estado === 'aceptada';
          const platform = resolvePlatformForNT(nt);
          return (
            <div className="inline-flex items-center justify-end gap-1.5">
              <DataTableActionButton
                action="view"
                onClick={() => router.push(`/residuos/notificaciones-previas/${nt.id}`)}
              />

              {canWrite && !isAccepted && (
                <DataTableActionButton
                  action="send"
                  label={platform.shortLabel}
                  disabled={!hasCredentials || actionLoading || !platform.supported}
                  title={
                    hasCredentials
                      ? `Transmitir a ${platform.name}`
                      : `Configura credenciales para enviar a ${platform.name}`
                  }
                  onClick={() => setNtToSendSira(nt)}
                />
              )}

              {canWrite && !isAccepted && (
                <DataTableActionButton
                  action="delete"
                  disabled={actionLoading}
                  onClick={() => setNtToDelete(nt.id)}
                />
              )}
            </div>
          );
        },
      },
    ],
    [canWrite, hasCredentials, actionLoading, router]
  );

  if (loading) {
    return <PageSkeleton variant="table" label="Cargando notificaciones previas" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones Previas de Traslado (NT)"
        breadcrumbTitle="Notificaciones Previas (NT)"
        description="Obligación previa reglamentaria (RD 553/2020) conectada automáticamente con SIRA (Andalucía) y e-SIR (MITECO)."
        actions={
          canWrite && (
            <Button
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/residuos/notificaciones-previas/nueva')}
            >
              Nueva Notificación Previa
            </Button>
          )
        }
      />

      {!hasCredentials && (
        <Alert
          variant="warning"
          title="Credenciales telemáticas (e-SIR / SIRA) no detectadas"
          message="Para tramitar y enviar Notificaciones Previas telemáticamente a SIRA o e-SIR, configura tus credenciales WS en Mi Empresa."
        />
      )}

      {error && <Alert variant="error" title="Error" message={error} />}

      <DataTable
        data={filteredNotifications}
        columns={columns}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Buscar por Nº NT, LER, productor o gestor..."
        syncUrlParams
        toolbarActions={
          <select
            aria-label="Estado de notificación"
            className="h-9 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="validada_sira">Pre-validada</option>
            <option value="enviada_sira">Enviada SIRA</option>
            <option value="aceptada">Aceptada</option>
            <option value="rechazada">Rechazada</option>
            <option value="caducada">Caducada</option>
          </select>
        }
        emptyState={
          <div className="py-10 text-center">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              No se encontraron Notificaciones Previas
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Crea una nueva NT para tramitar traslados de residuos sometidos a notificación previa.
            </p>
            {canWrite && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  startIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => router.push('/residuos/notificaciones-previas/nueva')}
                >
                  Crear Primera Notificación
                </Button>
              </div>
            )}
          </div>
        }
      />

      {ntToSendSira && (() => {
        const platform = resolvePlatformForNT(ntToSendSira);
        return (
          <ConfirmModal
            isOpen={!!ntToSendSira}
            onClose={() => setNtToSendSira(null)}
            onConfirm={() => confirmSendToSira(false)}
            title={`Transmitir Notificación Previa a ${platform.shortLabel}`}
            message={`¿Deseas presentar telemáticamente la Notificación Previa ${ntToSendSira.numero_notificacion} ante ${platform.name}? La plataforma registrará la obligación ambiental en su base de datos oficial.`}
            confirmLabel={actionLoading ? 'Transmitiendo...' : 'Presentar Oficialmente'}
            cancelLabel="Cancelar"
            variant="primary"
          />
        );
      })()}

      {ntToDelete !== null && (
        <ConfirmModal
          isOpen={ntToDelete !== null}
          onClose={() => setNtToDelete(null)}
          onConfirm={confirmDelete}
          title="Eliminar Notificación Previa"
          message="¿Estás seguro de que deseas eliminar este borrador de Notificación Previa? Esta acción no se puede deshacer."
          confirmLabel={actionLoading ? 'Eliminando...' : 'Eliminar'}
          cancelLabel="Cancelar"
          variant="danger"
        />
      )}
    </div>
  );
}
