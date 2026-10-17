'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';
import identificationDocumentService, { getTrackingStatusMeta } from '@/services/identificationDocumentService';
import siraService from '@/services/siraService';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import type { IdentificationDocument, Company, ProductionCenter, EstadoTraslado } from '@/types/wasteManagement';

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

export default function DocumentosIdentificacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<IdentificationDocument[]>([]);
  const [hasCompany, setHasCompany] = useState(false);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCenter, setFilterCenter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Verificar si el usuario tiene empresa registrada
      const company = await companyService.getUserCompany();
      setHasCompany(!!company);
      setMyCompany(company);

      if (company) {
        // Cargar centros de producción
        const centersData = await productionCenterService.getByCompanyId(company.id);
        setProductionCenters(centersData);

        // Cargar documentos
        const data = await identificationDocumentService.getAll();
        setDocuments(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      await identificationDocumentService.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success('Documento de identificación eliminado correctamente.');
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  const handleChangeStatus = async (id: number, newStatus: 'borrador' | 'pendiente-firma' | 'completado' | 'cancelado') => {
    try {
      setLoading(true);
      await identificationDocumentService.updateStatus(id, newStatus);
      await loadData();
      toast.success(`Estado actualizado a "${newStatus}" correctamente.`);
    } catch (err: any) {
      toast.error(`Error al cambiar estado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToSira = async (id: number) => {
    if (!confirm('¿Deseas enviar este documento a SIRA (Junta de Andalucía)?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await siraService.sendDI(id);

      if (result.success) {
        toast.success(`Documento enviado con éxito a SIRA.\nID de Registro: ${result.siraId}`);
        await loadData();
      }
    } catch (err: any) {
      toast.error(`Error al enviar a SIRA: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(d => {
    let matchStatus = true;
    if (filterStatus === 'all') {
      matchStatus = true;
    } else if (filterStatus === 'incidencias') {
      matchStatus = d.estado_traslado === 'rechazado_parcial' || d.estado_traslado === 'rechazado_total';
    } else if (filterStatus === 'borrador') {
      matchStatus = !d.estado_traslado || d.estado_traslado === 'borrador';
    } else {
      matchStatus = d.estado_traslado === filterStatus || d.estado === filterStatus;
    }

    const matchCenter = filterCenter === 'all' || d.production_center_id === parseInt(filterCenter);
    return matchStatus && matchCenter;
  });

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  if (!hasCompany) {
    return (
      <>
        <PageBreadCrumb pageTitle="Documentos de Identificación" />

        <div className="max-w-4xl mx-auto">
          <Alert
            variant="warning"
            title="Empresa no registrada"
            message="Antes de crear documentos de identificación, debes registrar los datos de tu empresa."
            showLink
            linkHref="/residuos/mi-empresa"
            linkText="Ir a Mi Empresa"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Documentos de Identificación" />

      <div className="space-y-6">
        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        {/* Acciones Principales */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Documentos de Identificación (DI)</h2>
            <p className="text-muted mt-1">
              Control oficial de traslados, pesajes en báscula, incidencias y tratamiento (RD 553/2020)
            </p>
          </div>
          <Button onClick={() => router.push('/residuos/documentos-identificacion/nuevo')}>
            + Nuevo Documento
          </Button>
        </div>

        {/* Filtros por Ciclo de Vida */}
        <ComponentCard title="Ciclo de Vida del Traslado (RD 553/2020)">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos ({documents.length})
            </Button>
            <Button
              variant={filterStatus === 'en_transito' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('en_transito')}
            >
              En Tránsito ({documents.filter(d => d.estado_traslado === 'en_transito').length})
            </Button>
            <Button
              variant={filterStatus === 'recepcionado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('recepcionado')}
            >
              En Báscula ({documents.filter(d => d.estado_traslado === 'recepcionado').length})
            </Button>
            <Button
              variant={filterStatus === 'aceptado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('aceptado')}
            >
              Aceptados ({documents.filter(d => d.estado_traslado === 'aceptado').length})
            </Button>
            <Button
              variant={filterStatus === 'incidencias' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('incidencias')}
            >
              Incidencias ({documents.filter(d => d.estado_traslado === 'rechazado_parcial' || d.estado_traslado === 'rechazado_total').length})
            </Button>
            <Button
              variant={filterStatus === 'tratado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('tratado')}
            >
              Tratados ({documents.filter(d => d.estado_traslado === 'tratado').length})
            </Button>
            <Button
              variant={filterStatus === 'borrador' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('borrador')}
            >
              Borradores ({documents.filter(d => !d.estado_traslado || d.estado_traslado === 'borrador').length})
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium">Filtrar por Centro:</label>
            <select
              value={filterCenter}
              onChange={(e) => setFilterCenter(e.target.value)}
              className="text-sm border border-stroke dark:border-strokedark bg-transparent rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todos los centros</option>
              {productionCenters.map(pc => (
                <option key={pc.id} value={pc.id}>{pc.nombre}</option>
              ))}
            </select>
          </div>
        </ComponentCard>

        {/* Lista de Documentos */}
        {filteredDocuments.length === 0 ? (
          <ComponentCard title="Documentos de Identificación">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-foreground">No hay documentos con este filtro</h3>
              <p className="mt-2 text-sm text-muted">
                Cambia el filtro de estado o crea un nuevo traslado
              </p>
            </div>
          </ComponentCard>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredDocuments.map((doc) => {
              const tracking = getTrackingStatusMeta(doc);
              const pesoOrigen = doc.peso_origen_kg || (doc.unidad === 'toneladas' ? doc.cantidad * 1000 : doc.cantidad) || 0;

              return (
                <ComponentCard key={doc.id} title="">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              DI {doc.numero_documento}
                            </h3>
                            <Badge color={tracking.badgeColor}>
                              {tracking.label}
                            </Badge>
                            {tracking.hasDiscrepancy && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                ⚠️ Discrepancia Báscula: {(doc.diferencia_peso_kg || 0) > 0 ? '+' : ''}{doc.diferencia_peso_kg} kg
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted">
                            <p>
                              <span className="font-medium text-foreground">Fecha:</span>{' '}
                              {formatDate(doc.fecha_documento)}
                            </p>

                            <p>
                              <span className="font-medium text-foreground">Residuo:</span>{' '}
                              <span className="font-mono font-bold text-foreground">{doc.codigo_ler}</span> ({doc.peligrosidad === 'peligroso' ? 'Peligroso' : 'No Peligroso'})
                            </p>

                            <p>
                              <span className="font-medium text-foreground">Gestor Destino:</span>{' '}
                              {doc.gestor_razon_social}
                            </p>

                            <p>
                              <span className="font-medium text-foreground">Pesada Origen:</span>{' '}
                              <span className="font-mono font-medium text-foreground">{pesoOrigen.toLocaleString('es-ES')} kg</span>
                            </p>

                            {doc.peso_destino_kg ? (
                              <p>
                                <span className="font-medium text-foreground">Pesada Destino (Báscula):</span>{' '}
                                <span className="font-mono font-bold text-foreground">{doc.peso_destino_kg.toLocaleString('es-ES')} kg</span>
                              </p>
                            ) : (
                              <p className="italic text-muted">
                                Pesada Destino: Pendiente en báscula
                              </p>
                            )}

                            {doc.production_center && (
                              <p>
                                <span className="font-medium text-foreground">Centro de Origen:</span>{' '}
                                <span className="text-primary font-medium">{doc.production_center.nombre}</span>
                              </p>
                            )}

                            {doc.transportista_matricula && (
                              <p>
                                <span className="font-medium text-foreground">Vehículo:</span>{' '}
                                <span className="font-mono text-foreground">{doc.transportista_matricula}</span>
                              </p>
                            )}
                          </div>

                          {doc.motivo_incidencia && (
                            <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300">
                              <span className="font-bold">Incidencia / Rechazo:</span> {doc.motivo_incidencia}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/residuos/documentos-identificacion/${doc.id}`)}
                      >
                        Ver Detalle y Trazabilidad
                      </Button>

                      {(!doc.estado_traslado || doc.estado_traslado === 'borrador') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendToSira(doc.id)}
                          disabled={!myCompany?.sira_usuario || !myCompany?.sira_password}
                          className={!myCompany?.sira_usuario || !myCompany?.sira_password ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Enviar a SIRA
                        </Button>
                      )}

                      {(!doc.estado_traslado || doc.estado_traslado === 'borrador') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-500"
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </ComponentCard>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
