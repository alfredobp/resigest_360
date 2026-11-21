'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import { toast } from '@/context/ToastContext';
import { priorNotificationService } from '@/services/priorNotificationService';
import { resolvePlatformForNT } from '@/services/siraService';
import companyService from '@/services/companyService';
import type { PriorNotification, Company } from '@/types/wasteManagement';
import { FileText, Send, Trash2, Eye, Plus } from 'lucide-react';

export default function NotificacionesPreviasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<PriorNotification[]>([]);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [ntToSendSira, setNtToSendSira] = useState<PriorNotification | null>(null);
  const [ntToDelete, setNtToDelete] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSendToSira = (nt: PriorNotification) => {
    setNtToSendSira(nt);
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

  const handleDelete = (id: number) => {
    setNtToDelete(id);
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

  const filteredNotifications = notifications.filter((nt) => {
    const matchesSearch =
      !searchTerm ||
      nt.numero_notificacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nt.codigo_ler?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nt.gestor_razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nt.productor_razon_social?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || nt.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <>
      <PageBreadCrumb pageTitle="Notificaciones Previas (NT)" />

      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Notificaciones Previas de Traslado (NT)
            </h2>
            <p className="text-sm text-muted">
              Obligación previa reglamentaria (RD 553/2020) conectada automáticamente con SIRA (Andalucía) y e-SIR (MITECO).
            </p>
          </div>
          <Button
            onClick={() => router.push('/residuos/notificaciones-previas/nueva')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Notificación Previa
          </Button>
        </div>

        {!hasCredentials && (
          <Alert
            variant="warning"
            title="Credenciales telemáticas (e-SIR / SIRA) no detectadas"
            message="Para tramitar y enviar Notificaciones Previas telemáticamente a SIRA o e-SIR, configura tus credenciales WS en Mi Empresa."
          />
        )}

        {error && <Alert variant="error" title="Error" message={error} />}

        {/* Filtros */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Buscar por NT, LER o Empresa</label>
              <Input
                type="text"
                placeholder="Ej. NT1011..., 150110, Gestión Ambiental..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                className="w-full h-11 px-3 py-2 border rounded-lg bg-background text-foreground border-border focus:ring-2 focus:ring-brand-500"
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
            </div>
          </div>
        </div>

        {/* Listado */}
        <ComponentCard title={`Notificaciones Registradas (${filteredNotifications.length})`}>
          {loading ? (
            <div className="py-12 text-center text-muted">Cargando Notificaciones Previas...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted mb-3 opacity-40" />
              <p className="text-foreground font-medium">No se encontraron Notificaciones Previas</p>
              <p className="text-sm text-muted mt-1">
                Crea una nueva NT para tramitar traslados de residuos sometidos a notificación previa.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/residuos/notificaciones-previas/nueva')}
              >
                Crear Primera Notificación
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[10.5px] uppercase font-medium text-muted">
                  <tr>
                    <th className="px-2.5 py-2.5">Nº NT</th>
                    <th className="px-2.5 py-2.5">Productor</th>
                    <th className="px-2.5 py-2.5">Gestor</th>
                    <th className="px-2.5 py-2.5">Residuo (LER)</th>
                    <th className="px-2.5 py-2.5">Cantidad</th>
                    <th className="px-2.5 py-2.5">Vigencia</th>
                    <th className="px-2.5 py-2.5">Estado</th>
                    <th className="px-2.5 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredNotifications.map((nt) => {
                    const isAccepted = nt.estado === 'aceptada';
                    return (
                      <tr key={nt.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-2.5 py-2.5 font-mono font-medium text-foreground max-w-[130px]">
                          <div className="truncate" title={nt.numero_notificacion || `NT-ID-${nt.id}`}>
                            {nt.numero_notificacion || `NT-ID-${nt.id}`}
                          </div>
                          {nt.sira_id && (
                            <span className={`block truncate text-[10.5px] font-sans font-semibold ${nt.sira_id.includes('TEST') || nt.sira_id.includes('SIM')
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-green-600 dark:text-green-400'
                              }`} title={nt.sira_id}>
                              {nt.sira_id.includes('TEST') || nt.sira_id.includes('SIM') ? 'Sim: ' : 'SIRA: '}
                              {nt.sira_id}
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-2.5 max-w-[130px]">
                          <div className="font-medium text-foreground truncate" title={nt.productor_razon_social}>{nt.productor_razon_social}</div>
                          <div className="text-[11px] text-muted">{nt.productor_cif}</div>
                        </td>
                        <td className="px-2.5 py-2.5 max-w-[130px]">
                          <div className="font-medium text-foreground truncate" title={nt.gestor_razon_social}>{nt.gestor_razon_social}</div>
                          <div className="text-[11px] text-muted">{nt.gestor_cif}</div>
                        </td>
                        <td className="px-2.5 py-2.5 max-w-[135px]">
                          <div className="font-mono text-foreground font-semibold">{nt.codigo_ler}</div>
                          <div className="text-[11px] text-muted truncate" title={nt.descripcion_residuo || 'S/D'}>{nt.descripcion_residuo || 'S/D'}</div>
                        </td>
                        <td className="px-2.5 py-2.5 font-medium text-foreground whitespace-nowrap">
                          {Number(nt.cantidad_estimada_kg).toLocaleString()} kg
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-muted whitespace-nowrap">
                          {nt.fecha_inicio && <div>{nt.fecha_inicio}</div>}
                          <div className="font-medium text-foreground">{nt.fecha_fin}</div>
                        </td>
                        <td className="px-2.5 py-2.5 whitespace-nowrap">
                          {getStatusBadge(nt.estado)}
                        </td>
                        <td className="px-2.5 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/residuos/notificaciones-previas/${nt.id}`)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {!isAccepted && (() => {
                              const platform = resolvePlatformForNT(nt);
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendToSira(nt)}
                                  disabled={!hasCredentials || actionLoading || !platform.supported}
                                  className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">{platform.shortLabel}</span>
                                </Button>
                              );
                            })()}

                            {!isAccepted && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(nt.id)}
                                disabled={actionLoading}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Modal Envío Telemático (e-SIR / SIRA) */}
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

      {/* Modal Eliminar */}
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
    </>
  );
}

