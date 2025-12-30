'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import wasteContractService from '@/services/wasteContractService';
import type { WasteContract } from '@/types/wasteManagement';

const STATUS_COLORS = {
  borrador: 'info',
  vigente: 'success',
  finalizado: 'light',
  cancelado: 'error',
} as const;

const STATUS_LABELS = {
  borrador: 'Borrador',
  vigente: 'Vigente',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<WasteContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const data = await wasteContractService.getById(parseInt(id));
      setContract(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contract || !confirm('¿Estás seguro de que deseas eliminar este contrato?')) {
      return;
    }

    try {
      await wasteContractService.delete(contract.id);
      router.push('/residuos/contratos');
    } catch (err: any) {
      setError(`Error al eliminar: ${err.message}`);
    }
  };

  const handleChangeStatus = async (newStatus: 'borrador' | 'vigente' | 'finalizado' | 'cancelado') => {
    if (!contract) return;

    try {
      await wasteContractService.updateStatus(contract.id, newStatus);
      await loadContract();
    } catch (err: any) {
      setError(`Error al cambiar estado: ${err.message}`);
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

  if (error || !contract) {
    return (
      <>
        <PageBreadCrumb pageTitle="Detalle del Contrato" />
        <div className="max-w-4xl mx-auto">
          <Alert variant="error" title="Error" message={error || 'Contrato no encontrado'} />
          <div className="mt-6">
            <Button onClick={() => router.push('/residuos/contratos')}>
              Volver a Contratos
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle={`Contrato ${contract.numero_contrato || `#${contract.id}`}`} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              {contract.numero_contrato || `Contrato #${contract.id}`}
            </h2>
            <Badge color={STATUS_COLORS[contract.estado]} size="md">
              {STATUS_LABELS[contract.estado]}
            </Badge>
          </div>
          <Button variant="outline" onClick={() => router.push('/residuos/contratos')}>
            ← Volver
          </Button>
        </div>

        {/* Información General */}
        <ComponentCard title="Información General">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Número de Contrato</label>
              <p className="text-foreground">{contract.numero_contrato || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Tipo de Contrato</label>
              <p className="text-foreground capitalize">{contract.tipo_contrato}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Fecha del Contrato</label>
              <p className="text-foreground">{formatDate(contract.fecha_contrato)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Estado</label>
              <Badge color={STATUS_COLORS[contract.estado]}>{STATUS_LABELS[contract.estado]}</Badge>
            </div>

            {contract.fecha_inicio && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Fecha de Inicio</label>
                <p className="text-foreground">{formatDate(contract.fecha_inicio)}</p>
              </div>
            )}

            {contract.fecha_fin && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Fecha de Fin</label>
                <p className="text-foreground">{formatDate(contract.fecha_fin)}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Partes del Contrato */}
        <ComponentCard title="Partes del Contrato">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Productor */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Productor</h4>
              {contract.company ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted">Razón Social:</span>{' '}
                    <span className="text-foreground">{contract.company.razon_social}</span>
                  </p>
                  <p>
                    <span className="text-muted">CIF:</span>{' '}
                    <span className="text-foreground">{contract.company.cif}</span>
                  </p>
                  {contract.company.nima && (
                    <p>
                      <span className="text-muted">NIMA:</span>{' '}
                      <span className="text-foreground">{contract.company.nima}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted text-sm">No disponible</p>
              )}
            </div>

            {/* Gestor */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Gestor</h4>
              {contract.gestor_company ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted">Razón Social:</span>{' '}
                    <span className="text-foreground">{contract.gestor_company.razon_social}</span>
                  </p>
                  <p>
                    <span className="text-muted">CIF:</span>{' '}
                    <span className="text-foreground">{contract.gestor_company.cif}</span>
                  </p>
                  {contract.gestor_company.nima && (
                    <p>
                      <span className="text-muted">NIMA:</span>{' '}
                      <span className="text-foreground">{contract.gestor_company.nima}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted text-sm">No asignado</p>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Residuos y Condiciones */}
        <ComponentCard title="Residuos y Condiciones">
          <div className="space-y-4">
            {contract.descripcion_residuos && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Descripción de Residuos</label>
                <p className="text-foreground">{contract.descripcion_residuos}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contract.cantidad_maxima_anual && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Cantidad Máxima Anual</label>
                  <p className="text-foreground">
                    {contract.cantidad_maxima_anual} {contract.unidad_cantidad}
                  </p>
                </div>
              )}

              {contract.precio_unitario && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Precio Unitario</label>
                  <p className="text-foreground">
                    {contract.precio_unitario} {contract.moneda}
                  </p>
                </div>
              )}
            </div>

            {contract.notas && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Notas / Observaciones</label>
                <p className="text-foreground whitespace-pre-wrap">{contract.notas}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Acciones */}
        <ComponentCard title="Acciones">
          <div className="flex flex-wrap gap-3">
            {contract.estado === 'borrador' && (
              <Button onClick={() => handleChangeStatus('vigente')}>
                Activar Contrato
              </Button>
            )}

            {contract.estado === 'vigente' && (
              <>
                <Button variant="outline" onClick={() => handleChangeStatus('finalizado')}>
                  Finalizar Contrato
                </Button>
                <Button variant="outline" onClick={() => handleChangeStatus('cancelado')}>
                  Cancelar Contrato
                </Button>
              </>
            )}

            {(contract.estado === 'finalizado' || contract.estado === 'cancelado') && (
              <Button variant="outline" onClick={() => handleChangeStatus('borrador')}>
                Volver a Borrador
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.push(`/residuos/contratos/${contract.id}/editar`)}
            >
              Editar Contrato
            </Button>

            <Button variant="outline" onClick={handleDelete}>
              Eliminar Contrato
            </Button>
          </div>
        </ComponentCard>

        {/* Fechas de Sistema */}
        <ComponentCard title="Información del Sistema">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Creado</label>
              <p className="text-foreground">{formatDate(contract.created_at)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Última Modificación</label>
              <p className="text-foreground">{formatDate(contract.updated_at)}</p>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
