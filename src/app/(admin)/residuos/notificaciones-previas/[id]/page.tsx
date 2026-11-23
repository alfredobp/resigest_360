'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import { priorNotificationService } from '@/services/priorNotificationService';
import { resolvePlatformForNT } from '@/services/siraService';
import identificationDocumentService from '@/services/identificationDocumentService';
import type { PriorNotification, IdentificationDocument } from '@/types/wasteManagement';
import { ArrowLeft, Send, FileCode, Plus, Trash2, ShieldCheck, Download } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetalleNotificacionPreviaPage({ params }: PageProps) {
  const router = useRouter();
  const { canWrite } = useTenant();
  const { id } = use(params);
  const notificationId = Number(id);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<PriorNotification | null>(null);
  const [linkedDIs, setLinkedDIs] = useState<IdentificationDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showXml, setShowXml] = useState(false);
  const [xmlContent, setXmlContent] = useState('');

  const [showSendModal, setShowSendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [notificationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const nt = await priorNotificationService.getById(notificationId);
      setNotification(nt);

      // Generar XML para vista previa
      try {
        const xml = priorNotificationService.generateNTXml(nt);
        setXmlContent(xml);
      } catch (xmlErr) {
        console.warn('Error generando XML previo:', xmlErr);
      }

      // Obtener DIs vinculados
      try {
        const allDIs = await identificationDocumentService.getAll();
        const related = allDIs.filter(
          (d) =>
            d.prior_notification_id === notificationId ||
            (d.numero_notificacion && d.numero_notificacion === nt.numero_notificacion)
        );
        setLinkedDIs(related);
      } catch (diErr) {
        console.warn('Error obteniendo DIs vinculados:', diErr);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar la Notificación Previa');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToSira = async (validateOnly = false) => {
    if (!notification) return;

    try {
      setActionLoading(true);
      const res = await priorNotificationService.sendToSira(notification.id, validateOnly);

      if (res.success) {
        toast.success(
          validateOnly
            ? 'Notificación Previa pre-validada con éxito en SIRA'
            : `Notificación Previa presentada oficialmente en SIRA (ID: ${res.siraId || 'OK'})`
        );
        setShowSendModal(false);
        await loadData();
      }
    } catch (err: any) {
      toast.error(`SIRA: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!notification) return;

    try {
      setActionLoading(true);
      await priorNotificationService.delete(notification.id);
      toast.success('Notificación Previa eliminada.');
      router.push('/residuos/notificaciones-previas');
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadXml = () => {
    if (!xmlContent) return;
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${notification?.numero_notificacion || `NT_${notificationId}`}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aceptada':
        return <Badge variant="light" color="success">Aceptada en SIRA</Badge>;
      case 'validada_sira':
      case 'validada':
        return <Badge variant="light" color="info">Pre-validada</Badge>;
      case 'enviada_sira':
        return <Badge variant="light" color="warning">Enviada SIRA</Badge>;
      case 'rechazada':
        return <Badge variant="light" color="error">Rechazada</Badge>;
      case 'caducada':
        return <Badge variant="light" color="light">Caducada</Badge>;
      default:
        return <Badge variant="light" color="primary">Borrador</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted">Cargando Notificación Previa...</p>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Alert variant="error" title="Error" message={error || 'Notificación no encontrada'} />
        <Button variant="outline" onClick={() => router.push('/residuos/notificaciones-previas')}>
          ← Volver al listado
        </Button>
      </div>
    );
  }

  const isAccepted = notification.estado === 'aceptada';

  return (
    <>
      <PageBreadCrumb pageTitle={`Notificación Previa ${notification.numero_notificacion || notificationId}`} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Cabecera de estado y acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-6 rounded-2xl border border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-mono text-foreground">
                {notification.numero_notificacion || `NT-ID-${notification.id}`}
              </h2>
              {getStatusBadge(notification.estado)}
            </div>
            <p className="text-sm text-muted">
              Régimen: <span className="font-semibold text-foreground capitalize">{notification.tipo_notificacion}</span> | Vigencia: {notification.fecha_inicio} a {notification.fecha_fin}
            </p>
            {notification.sira_id && (
              <div className="flex items-center gap-2 mt-1">
                {notification.sira_id.includes('TEST') || notification.sira_id.includes('SIM') ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    Simulación / Ensayo Técnico: {notification.sira_id}
                  </span>
                ) : (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Identificador Oficial ({resolvePlatformForNT(notification).shortLabel}): {notification.sira_id}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/residuos/notificaciones-previas')}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>

              { canWrite && !isAccepted && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendToSira(true)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    Pre-validar
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setShowSendModal(true)}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    Presentar a {resolvePlatformForNT(notification).shortLabel}
                  </Button>

                  {(notification.estado === 'borrador' || notification.estado === 'rechazada') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={actionLoading}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowXml(!showXml)}
              className="flex items-center gap-1.5"
            >
              <FileCode className="w-4 h-4" />
              {showXml ? 'Ocultar XML' : 'Ver XML E3L'}
            </Button>
          </div>
        </div>

        {/* XML Viewer si está activo */}
        {showXml && (
          <ComponentCard title="E3L v3.3 wasteNT XML">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted">Esquema oficial de la Junta de Andalucía (RD 553/2020)</span>
              <Button size="sm" variant="outline" onClick={handleDownloadXml} className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Descargar XML
              </Button>
            </div>
            <pre className="p-4 bg-muted/30 border border-border rounded-lg text-xs font-mono overflow-x-auto max-h-96">
              {xmlContent}
            </pre>
          </ComponentCard>
        )}

        {/* Intervinientes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Operador */}
          <ComponentCard title="Operador del Traslado">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">{notification.operador_razon_social}</p>
              <p className="text-xs text-muted">CIF: <span className="font-mono text-foreground">{notification.operador_cif}</span></p>
              <p className="text-xs text-muted">NIMA: <span className="font-mono text-foreground">{notification.operador_nima || 'S/D'}</span></p>
              <p className="text-xs text-muted">Ubicación: {notification.operador_municipio} ({notification.operador_provincia})</p>
            </div>
          </ComponentCard>

          {/* Productor */}
          <ComponentCard title="Productor / Origen">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">{notification.productor_razon_social}</p>
              <p className="text-xs text-muted">CIF: <span className="font-mono text-foreground">{notification.productor_cif}</span></p>
              <p className="text-xs text-muted">NIMA Centro: <span className="font-mono text-foreground">{notification.productor_nima}</span></p>
              <p className="text-xs text-muted">Dirección: {notification.productor_direccion || 'S/D'}</p>
              <p className="text-xs text-muted">Ubicación: {notification.productor_municipio} ({notification.productor_provincia})</p>
            </div>
          </ComponentCard>

          {/* Gestor */}
          <ComponentCard title="Gestor / Destinatario">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">{notification.gestor_razon_social}</p>
              <p className="text-xs text-muted">CIF: <span className="font-mono text-foreground">{notification.gestor_cif}</span></p>
              <p className="text-xs text-muted">NIMA Gestor: <span className="font-mono text-foreground">{notification.gestor_nima}</span></p>
              <p className="text-xs text-muted">Autorización: <span className="font-mono text-foreground">{notification.gestor_numero_autorizacion || notification.gestor_nima}</span></p>
              <p className="text-xs text-muted">Ubicación: {notification.gestor_municipio} ({notification.gestor_provincia})</p>
            </div>
          </ComponentCard>
        </div>

        {/* Residuos y Tratamiento */}
        <ComponentCard title="Características del Residuo y Tratamiento">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="p-4 rounded-xl border border-border bg-muted/10">
              <span className="text-xs text-muted block mb-1">Código LER</span>
              <span className="font-mono font-bold text-lg text-foreground">{notification.codigo_ler}</span>
              <span className="block text-xs mt-1 text-muted capitalize">Peligrosidad: {notification.peligrosidad}</span>
              {notification.peligrosidad === 'peligroso' && notification.caracteristica_peligrosidad && (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {notification.caracteristica_peligrosidad}
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/10">
              <span className="text-xs text-muted block mb-1">Operación Tratamiento</span>
              <span className="font-mono font-bold text-lg text-foreground">{notification.operacion_tratamiento}</span>
              <span className="block text-xs mt-1 text-muted">
                {notification.operacion_tratamiento.startsWith('R') ? 'Operación de Valorización' : 'Operación de Eliminación'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/10">
              <span className="text-xs text-muted block mb-1">Cantidad Total Estimada</span>
              <span className="font-bold text-lg text-foreground">
                {Number(notification.cantidad_estimada_kg).toLocaleString()} kg
              </span>
              <span className="block text-xs mt-1 text-muted">
                {notification.numero_traslados_previstos || 1} traslados previstos
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/10">
              <span className="text-xs text-muted block mb-1">Periodo de Vigencia</span>
              <span className="font-medium text-foreground text-sm block">Desde: {notification.fecha_inicio}</span>
              <span className="font-medium text-foreground text-sm block">Hasta: {notification.fecha_fin}</span>
            </div>

            <div className="md:col-span-4 p-4 rounded-xl border border-border bg-muted/10">
              <span className="text-xs text-muted block mb-1">Descripción del Residuo:</span>
              <p className="text-foreground">{notification.descripcion_residuo}</p>
            </div>
          </div>
        </ComponentCard>

        {/* DIs Vinculados */}
        <ComponentCard
          title={`Documentos de Identificación (DI) Vinculados (${linkedDIs.length})`}
          desc="Traslados amparados bajo esta Notificación Previa reglamentaria."
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-muted">
              Cada DI amparado bajo esta NT incluye automáticamente su código en la etiqueta &lt;DCSNT&gt;.
            </p>
            {notification.estado === 'aceptada' && (
              <Button
                size="sm"
                onClick={() => router.push(`/residuos/documentos-identificacion/nuevo?ntId=${notification.id}`)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Crear DI con esta NT
              </Button>
            )}
          </div>

          {linkedDIs.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted">
              Aún no hay ningún Documento de Identificación (DI) emitido bajo esta Notificación Previa.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase font-medium text-muted">
                  <tr>
                    <th className="px-4 py-2">Nº Documento</th>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Cantidad (kg)</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {linkedDIs.map((di) => {
                    // INC18: Mostrar siempre el estado operativo real del DI (estado_traslado || estado)
                    const effectiveStatus = (di.estado_traslado || di.estado || 'borrador').toLowerCase();
                    const statusLabelMap: Record<string, string> = {
                      borrador: 'Borrador',
                      en_transito: 'En Tránsito',
                      recepcionado: 'Recepcionado',
                      aceptado: 'Aceptado',
                      tratado: 'Tratado',
                      rechazado_parcial: 'Rechazo Parcial',
                      rechazado_total: 'Rechazado',
                      completado: 'Completado',
                      'pendiente-firma': 'Pendiente Firma',
                      cancelado: 'Cancelado',
                    };
                    const badgeColor =
                      effectiveStatus === 'aceptado' || effectiveStatus === 'tratado' || effectiveStatus === 'completado'
                        ? 'success'
                        : effectiveStatus === 'en_transito' || effectiveStatus === 'recepcionado'
                          ? 'info'
                          : effectiveStatus === 'rechazado_parcial' || effectiveStatus === 'rechazado_total' || effectiveStatus === 'cancelado'
                            ? 'error'
                            : 'warning';

                    return (
                    <tr key={di.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-mono font-medium text-foreground">{di.numero_documento}</td>
                      <td className="px-4 py-2 text-muted">{di.fecha_documento}</td>
                      <td className="px-4 py-2 text-foreground font-medium">{Number(di.cantidad).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <Badge variant="light" color={badgeColor}>
                          {statusLabelMap[effectiveStatus] || effectiveStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/residuos/documentos-identificacion/${di.id}`)}
                        >
                          Ver DI
                        </Button>
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

      {/* ConfirmModal Presentar Telemáticamente (e-SIR / SIRA) */}
      <ConfirmModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onConfirm={() => handleSendToSira(false)}
        title={`Presentar Notificación Previa a ${resolvePlatformForNT(notification).shortLabel}`}
        message={`¿Deseas presentar telemáticamente la Notificación Previa ${notification.numero_notificacion} ante ${resolvePlatformForNT(notification).name}? La NT quedará registrada oficialmente y habilitará el envío de sus DIs correspondientes.`}
        confirmLabel={actionLoading ? 'Transmitiendo...' : 'Presentar Oficialmente'}
        cancelLabel="Cancelar"
        variant="primary"
      />

      {/* ConfirmModal Eliminar */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Eliminar Notificación Previa"
        message="¿Estás seguro de que deseas eliminar este borrador de Notificación Previa? Esta acción no se puede deshacer."
        confirmLabel={actionLoading ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
      />
    </>
  );
}

