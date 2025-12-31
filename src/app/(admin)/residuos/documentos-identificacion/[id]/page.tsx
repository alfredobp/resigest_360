'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import identificationDocumentService from '@/services/identificationDocumentService';
import type { IdentificationDocument } from '@/types/wasteManagement';

const STATUS_COLORS = {
  borrador: 'info',
  'pendiente-firma': 'warning',
  completado: 'success',
  cancelado: 'error',
} as const;

const STATUS_LABELS = {
  borrador: 'Borrador',
  'pendiente-firma': 'Pendiente Firma',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export default function DetalleDocumentoIdentificacionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<IdentificationDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const data = await identificationDocumentService.getById(parseInt(id));
      setDocument(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document || !confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      await identificationDocumentService.delete(document.id);
      router.push('/residuos/documentos-identificacion');
    } catch (err: any) {
      setError(`Error al eliminar: ${err.message}`);
    }
  };

  const handleChangeStatus = async (newStatus: 'borrador' | 'pendiente-firma' | 'completado' | 'cancelado') => {
    if (!document) return;

    try {
      await identificationDocumentService.updateStatus(document.id, newStatus);
      await loadDocument();
    } catch (err: any) {
      setError(`Error al cambiar estado: ${err.message}`);
    }
  };

  const handleSign = async (role: 'productor' | 'gestor' | 'transportista') => {
    if (!document) return;

    try {
      await identificationDocumentService.signDocument(document.id, role);
      await loadDocument();
    } catch (err: any) {
      setError(`Error al firmar: ${err.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <>
        <PageBreadCrumb pageTitle="Detalle del Documento" />
        <div className="max-w-4xl mx-auto">
          <Alert variant="error" title="Error" message={error || 'Documento no encontrado'} />
          <div className="mt-6">
            <Button onClick={() => router.push('/residuos/documentos-identificacion')}>
              Volver a Documentos
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle={`DI ${document.numero_documento}`} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              DI {document.numero_documento}
            </h2>
            <Badge color={STATUS_COLORS[document.estado]} size="md">
              {STATUS_LABELS[document.estado]}
            </Badge>
          </div>
          <Button variant="outline" onClick={() => router.push('/residuos/documentos-identificacion')}>
            ← Volver
          </Button>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        {/* Información General */}
        <ComponentCard title="Información General">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Número de Documento</label>
              <p className="text-foreground">{document.numero_documento}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Fecha del Documento</label>
              <p className="text-foreground">{formatDate(document.fecha_documento)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Tipo de Notificación</label>
              <p className="text-foreground capitalize">{document.tipo_notificacion.replace('-', ' ')}</p>
            </div>

            {document.fecha_recogida && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Fecha de Recogida</label>
                <p className="text-foreground">{formatDate(document.fecha_recogida)}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Productor */}
        <ComponentCard title="Productor / Origen">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Razón Social</label>
              <p className="text-foreground">{document.productor_razon_social}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">CIF</label>
              <p className="text-foreground">{document.productor_cif}</p>
            </div>

            {document.productor_nima && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">NIMA</label>
                <p className="text-foreground">{document.productor_nima}</p>
              </div>
            )}

            {document.productor_direccion && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted mb-1">Dirección</label>
                <p className="text-foreground">{document.productor_direccion}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Gestor */}
        <ComponentCard title="Gestor / Destinatario">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Razón Social</label>
              <p className="text-foreground">{document.gestor_razon_social}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">CIF</label>
              <p className="text-foreground">{document.gestor_cif}</p>
            </div>

            {document.gestor_nima && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">NIMA</label>
                <p className="text-foreground">{document.gestor_nima}</p>
              </div>
            )}

            {document.gestor_numero_autorizacion && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Nº Autorización</label>
                <p className="text-foreground">{document.gestor_numero_autorizacion}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Transportista */}
        {document.transportista_razon_social && (
          <ComponentCard title="Transportista">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Razón Social</label>
                <p className="text-foreground">{document.transportista_razon_social}</p>
              </div>

              {document.transportista_cif && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">CIF</label>
                  <p className="text-foreground">{document.transportista_cif}</p>
                </div>
              )}

              {document.transportista_matricula && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Matrícula</label>
                  <p className="text-foreground">{document.transportista_matricula}</p>
                </div>
              )}
            </div>
          </ComponentCard>
        )}

        {/* Residuo */}
        <ComponentCard title="Datos del Residuo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Código LER</label>
              <p className="text-foreground font-mono text-lg">{document.codigo_ler}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Peligrosidad</label>
              <Badge color={document.peligrosidad === 'peligroso' ? 'error' : 'success'}>
                {document.peligrosidad === 'peligroso' ? 'Peligroso' : 'No Peligroso'}
              </Badge>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted mb-1">Descripción</label>
              <p className="text-foreground">{document.descripcion_residuo}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Estado Físico</label>
              <p className="text-foreground capitalize">{document.estado_fisico}</p>
            </div>

            {document.operacion_tratamiento && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Operación de Tratamiento</label>
                <p className="text-foreground">{document.operacion_tratamiento}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Cantidad */}
        <ComponentCard title="Cantidad y Envases">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Cantidad</label>
              <p className="text-foreground text-2xl font-bold">
                {document.cantidad} {document.unidad}
              </p>
            </div>

            {document.numero_envases && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Número de Envases</label>
                <p className="text-foreground">{document.numero_envases}</p>
              </div>
            )}

            {document.tipo_envases && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted mb-1">Tipo de Envases</label>
                <p className="text-foreground">{document.tipo_envases}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Firmas */}
        <ComponentCard title="Firmas">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm font-medium text-muted mb-2">Productor</p>
              {document.firmado_productor ? (
                <div>
                  <Badge color="success" size="lg">Firmado</Badge>
                  {document.fecha_firma_productor && (
                    <p className="text-xs text-muted mt-2">{formatDate(document.fecha_firma_productor)}</p>
                  )}
                </div>
              ) : (
                <div>
                  <Badge color="light" size="lg">Pendiente</Badge>
                  {document.estado !== 'completado' && document.estado !== 'cancelado' && (
                    <Button size="sm" className="mt-2" onClick={() => handleSign('productor')}>
                      Firmar
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm font-medium text-muted mb-2">Gestor</p>
              {document.firmado_gestor ? (
                <div>
                  <Badge color="success" size="lg">Firmado</Badge>
                  {document.fecha_firma_gestor && (
                    <p className="text-xs text-muted mt-2">{formatDate(document.fecha_firma_gestor)}</p>
                  )}
                </div>
              ) : (
                <div>
                  <Badge color="light" size="lg">Pendiente</Badge>
                  {document.estado !== 'completado' && document.estado !== 'cancelado' && (
                    <Button size="sm" className="mt-2" onClick={() => handleSign('gestor')}>
                      Firmar
                    </Button>
                  )}
                </div>
              )}
            </div>

            {document.transportista_razon_social && (
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm font-medium text-muted mb-2">Transportista</p>
                {document.firmado_transportista ? (
                  <div>
                    <Badge color="success" size="lg">Firmado</Badge>
                    {document.fecha_firma_transportista && (
                      <p className="text-xs text-muted mt-2">{formatDate(document.fecha_firma_transportista)}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Badge color="light" size="lg">Pendiente</Badge>
                    {document.estado !== 'completado' && document.estado !== 'cancelado' && (
                      <Button size="sm" className="mt-2" onClick={() => handleSign('transportista')}>
                        Firmar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Acciones */}
        <ComponentCard title="Acciones">
          <div className="flex flex-wrap gap-3">
            {document.estado === 'borrador' && (
              <Button onClick={() => handleChangeStatus('pendiente-firma')}>
                Enviar a Firma
              </Button>
            )}

            {document.estado === 'pendiente-firma' && (
              <>
                <Button onClick={() => handleChangeStatus('completado')}>
                  Marcar como Completado
                </Button>
                <Button variant="outline" onClick={() => handleChangeStatus('borrador')}>
                  Volver a Borrador
                </Button>
              </>
            )}

            {(document.estado === 'completado' || document.estado === 'cancelado') && (
              <Button variant="outline" onClick={() => handleChangeStatus('borrador')}>
                Reabrir Documento
              </Button>
            )}

            {document.estado === 'borrador' && (
              <Button variant="outline" onClick={handleDelete}>
                Eliminar Documento
              </Button>
            )}
          </div>
        </ComponentCard>

        {/* Fechas de Sistema */}
        <ComponentCard title="Información del Sistema">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Creado</label>
              <p className="text-foreground">{formatDate(document.created_at)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Última Modificación</label>
              <p className="text-foreground">{formatDate(document.updated_at)}</p>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
