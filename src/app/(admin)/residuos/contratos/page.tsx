'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import NuevoContratoModal from '@/components/residuos/NuevoContratoModal';
import wasteContractService from '@/services/wasteContractService';
import companyService from '@/services/companyService';
import type { WasteContract, Company } from '@/types/wasteManagement';

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

export default function ContratosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<WasteContract[]>([]);
  const [hasCompany, setHasCompany] = useState(false);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewContractModal, setShowNewContractModal] = useState(false);

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

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contrato?')) {
      return;
    }

    try {
      await wasteContractService.delete(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleChangeStatus = async (id: number, newStatus: 'borrador' | 'vigente' | 'finalizado' | 'cancelado') => {
    try {
      await wasteContractService.updateStatus(id, newStatus);
      await loadData();
    } catch (err: any) {
      alert(`Error al cambiar estado: ${err.message}`);
    }
  };

  const filteredContracts = filterStatus === 'all' 
    ? contracts 
    : contracts.filter(c => c.estado === filterStatus);

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
          <p className="text-muted">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  if (!hasCompany) {
    return (
      <>
        <PageBreadCrumb
          pageTitle="Contratos de Tratamiento"
        />

        <div className="max-w-4xl mx-auto">
          <Alert 
            variant="warning" 
            title="Empresa no registrada"
            message="Antes de crear contratos, debes registrar los datos de tu empresa."
            showLink
            linkHref="/admin/residuos/mi-empresa"
            linkText="Ir a Mi Empresa"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb
        pageTitle="Contratos de Tratamiento"
      />

      <div className="space-y-6">
        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        {/* Acciones Principales */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Contratos de Tratamiento</h2>
            <p className="text-muted mt-1">
              Gestiona los contratos de tratamiento de residuos con gestores
            </p>
          </div>
          <Button onClick={() => setShowNewContractModal(true)}>
            + Nuevo Contrato
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
              Todos ({contracts.length})
            </Button>
            <Button
              variant={filterStatus === 'vigente' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('vigente')}
            >
              Vigentes ({contracts.filter(c => c.estado === 'vigente').length})
            </Button>
            <Button
              variant={filterStatus === 'borrador' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('borrador')}
            >
              Borradores ({contracts.filter(c => c.estado === 'borrador').length})
            </Button>
            <Button
              variant={filterStatus === 'finalizado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('finalizado')}
            >
              Finalizados ({contracts.filter(c => c.estado === 'finalizado').length})
            </Button>
          </div>
        </ComponentCard>

        {/* Lista de Contratos */}
        {filteredContracts.length === 0 ? (
          <ComponentCard title="Contratos">
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
              <h3 className="mt-4 text-lg font-medium text-foreground">No hay contratos</h3>
              <p className="mt-2 text-sm text-muted">
                Comienza creando tu primer contrato de tratamiento
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowNewContractModal(true)}
              >
                Crear Primer Contrato
              </Button>
            </div>
          </ComponentCard>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredContracts.map((contract) => (
              <ComponentCard key={contract.id} title="">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {contract.numero_contrato || `Contrato #${contract.id}`}
                          </h3>
                          <Badge color={STATUS_COLORS[contract.estado]}>
                            {STATUS_LABELS[contract.estado]}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-muted">
                          {contract.gestor_company && (
                            <p>
                              <span className="font-medium text-foreground">Gestor:</span>{' '}
                              {contract.gestor_company.razon_social}
                            </p>
                          )}
                          
                          <p>
                            <span className="font-medium text-foreground">Tipo:</span>{' '}
                            {contract.tipo_contrato}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">Fecha contrato:</span>{' '}
                            {formatDate(contract.fecha_contrato)}
                          </p>

                          {contract.fecha_inicio && contract.fecha_fin && (
                            <p>
                              <span className="font-medium text-foreground">Vigencia:</span>{' '}
                              {formatDate(contract.fecha_inicio)} - {formatDate(contract.fecha_fin)}
                            </p>
                          )}

                          {contract.descripcion_residuos && (
                            <p>
                              <span className="font-medium text-foreground">Residuos:</span>{' '}
                              {contract.descripcion_residuos}
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
                      onClick={() => router.push(`/admin/residuos/contratos/${contract.id}`)}
                    >
                      Ver Detalles
                    </Button>

                    {contract.estado === 'borrador' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(contract.id, 'vigente')}
                      >
                        Activar
                      </Button>
                    )}

                    {contract.estado === 'vigente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(contract.id, 'finalizado')}
                      >
                        Finalizar
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(contract.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </ComponentCard>
            ))}
          </div>
        )}

        {/* Modal de Nuevo Contrato */}
        {myCompany && (
          <NuevoContratoModal
            isOpen={showNewContractModal}
            onClose={() => setShowNewContractModal(false)}
            onSuccess={loadData}
            myCompany={myCompany}
          />
        )}
      </div>
    </>
  );
}
