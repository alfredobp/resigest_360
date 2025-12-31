'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import identificationDocumentService from '@/services/identificationDocumentService';
import companyService from '@/services/companyService';
import type { IdentificationDocument, Company } from '@/types/wasteManagement';

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
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleChangeStatus = async (
    id: number,
    newStatus: 'borrador' | 'pendiente-firma' | 'completado' | 'cancelado'
  ) => {
    try {
      await identificationDocumentService.updateStatus(id, newStatus);
      await loadData();
    } catch (err: any) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  const filteredDocuments = filterStatus === 'all' 
    ? documents 
    : documents.filter(d => d.estado === filterStatus);

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
              Gestiona los documentos de identificación de residuos
            </p>
          </div>
          <Button onClick={() => router.push('/residuos/documentos-identificacion/nuevo')}>
            + Nuevo Documento
          </Button>
        </div>

        {/* Filtros */}
        <ComponentCard title="Filtros">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos ({documents.length})
            </Button>
            <Button
              variant={filterStatus === 'borrador' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('borrador')}
            >
              Borradores ({documents.filter(d => d.estado === 'borrador').length})
            </Button>
            <Button
              variant={filterStatus === 'pendiente-firma' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pendiente-firma')}
            >
              Pendientes ({documents.filter(d => d.estado === 'pendiente-firma').length})
            </Button>
            <Button
              variant={filterStatus === 'completado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('completado')}
            >
              Completados ({documents.filter(d => d.estado === 'completado').length})
            </Button>
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
              <h3 className="mt-4 text-lg font-medium text-foreground">No hay documentos</h3>
              <p className="mt-2 text-sm text-muted">
                Comienza creando tu primer documento de identificación
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push('/residuos/documentos-identificacion/nuevo')}
              >
                Crear Primer Documento
              </Button>
            </div>
          </ComponentCard>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredDocuments.map((doc) => (
              <ComponentCard key={doc.id} title="">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            DI {doc.numero_documento}
                          </h3>
                          <Badge color={STATUS_COLORS[doc.estado]}>
                            {STATUS_LABELS[doc.estado]}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-muted">
                          <p>
                            <span className="font-medium text-foreground">Fecha:</span>{' '}
                            {formatDate(doc.fecha_documento)}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">Residuo:</span>{' '}
                            {doc.codigo_ler} - {doc.descripcion_residuo}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">Cantidad:</span>{' '}
                            {doc.cantidad} {doc.unidad}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">Gestor:</span>{' '}
                            {doc.gestor_razon_social}
                          </p>

                          {doc.fecha_recogida && (
                            <p>
                              <span className="font-medium text-foreground">Recogida:</span>{' '}
                              {formatDate(doc.fecha_recogida)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/residuos/documentos-identificacion/${doc.id}`)}
                    >
                      Ver Detalles
                    </Button>

                    {doc.estado === 'borrador' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(doc.id, 'pendiente-firma')}
                      >
                        Enviar a Firma
                      </Button>
                    )}

                    {doc.estado === 'pendiente-firma' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(doc.id, 'completado')}
                      >
                        Marcar Completado
                      </Button>
                    )}

                    {doc.estado === 'borrador' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </ComponentCard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
