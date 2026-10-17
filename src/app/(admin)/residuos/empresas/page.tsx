'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';
import Input from '@/components/form/input/InputField';
import EmpresaModal from '@/components/residuos/EmpresaModal';
import AutorizacionModal from '@/components/residuos/AutorizacionModal';
import companyService from '@/services/companyService';
import type { Company, CompanyRole } from '@/types/wasteManagement';

const ROLE_BADGE_CONFIG: Record<CompanyRole, { label: string; color: 'primary' | 'success' | 'warning' | 'info' | 'light' | 'error'; icon: string }> = {
  gestor: { label: 'Gestor', color: 'success', icon: '♻️' },
  transportista: { label: 'Transportista', color: 'info', icon: '🚚' },
  productor: { label: 'Productor', color: 'warning', icon: '🏭' },
  negociante: { label: 'Negociante', color: 'primary', icon: '💼' },
  agente: { label: 'Agente', color: 'primary', icon: '🤝' },
  cliente: { label: 'Cliente', color: 'light', icon: '👤' },
  proveedor: { label: 'Proveedor', color: 'light', icon: '📦' },
};

function EmpresasContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('rol') || 'all';

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal Empresa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Modal Autorizaciones
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCompanyForAuth, setSelectedCompanyForAuth] = useState<Company | null>(null);

  useEffect(() => {
    const rolParam = searchParams.get('rol');
    if (rolParam) {
      setSelectedRole(rolParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAllContacts();
      setCompanies(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, razonSocial: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la empresa "${razonSocial}"?`)) {
      return;
    }

    try {
      await companyService.delete(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
      setSuccessMessage(`Empresa "${razonSocial}" eliminada correctamente.`);
      toast.success(`Empresa "${razonSocial}" eliminada correctamente.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      toast.error(`Error al eliminar empresa: ${err.message}`);
    }
  };

  const getCompanyRoles = (company: Company): CompanyRole[] => {
    if (Array.isArray(company.roles) && company.roles.length > 0) {
      return company.roles;
    }
    return company.tipo_empresa ? [company.tipo_empresa as CompanyRole] : ['productor'];
  };

  // Filtrado combinado por texto y rol
  const filteredCompanies = companies.filter((c) => {
    const roles = getCompanyRoles(c);
    const matchesRole = selectedRole === 'all' || roles.includes(selectedRole as CompanyRole);

    if (!matchesRole) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const matchName = c.razon_social?.toLowerCase().includes(q);
    const matchTrade = c.nombre_comercial?.toLowerCase().includes(q);
    const matchCif = c.cif?.toLowerCase().includes(q);
    const matchNima = c.nima?.toLowerCase().includes(q);
    const matchAuth = c.numero_autorizacion?.toLowerCase().includes(q);

    return matchName || matchTrade || matchCif || matchNima || matchAuth;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Cargando directorio de empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Empresas y Contactos" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Directorio de Empresas y Contactos
            </h2>
            <p className="text-sm text-muted mt-0.5">
              Gestión unificada de gestores, transportistas, productores, clientes y proveedores sin duplicidades de CIF.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingCompany(null);
              setIsModalOpen(true);
            }}
          >
            + Nueva Empresa / Contacto
          </Button>
        </div>

        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        {successMessage && (
          <Alert variant="success" title="Operación completada" message={successMessage} />
        )}

        {/* Filtros por Rol y Buscador */}
        <ComponentCard title="Filtros y Búsqueda">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRole === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('all')}
              >
                Todas ({companies.length})
              </Button>
              <Button
                variant={selectedRole === 'gestor' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('gestor')}
              >
                ♻️ Gestores ({companies.filter(c => getCompanyRoles(c).includes('gestor')).length})
              </Button>
              <Button
                variant={selectedRole === 'transportista' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('transportista')}
              >
                🚚 Transportistas ({companies.filter(c => getCompanyRoles(c).includes('transportista')).length})
              </Button>
              <Button
                variant={selectedRole === 'productor' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('productor')}
              >
                🏭 Productores ({companies.filter(c => getCompanyRoles(c).includes('productor')).length})
              </Button>
              <Button
                variant={selectedRole === 'cliente' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('cliente')}
              >
                👤 Clientes ({companies.filter(c => getCompanyRoles(c).includes('cliente')).length})
              </Button>
              <Button
                variant={selectedRole === 'proveedor' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('proveedor')}
              >
                📦 Proveedores ({companies.filter(c => getCompanyRoles(c).includes('proveedor')).length})
              </Button>
            </div>

            <div>
              <Input
                type="text"
                placeholder="Buscar por Razón Social, CIF/NIF, NIMA o Nº de Autorización..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </ComponentCard>

        {/* Lista de Empresas */}
        {filteredCompanies.length === 0 ? (
          <ComponentCard title="Directorio">
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="text-lg font-medium text-foreground">No se encontraron empresas</h3>
              <p className="mt-2 text-sm text-muted">
                {searchQuery
                  ? 'No hay registros que coincidan con los criterios de búsqueda.'
                  : 'Comienza registrando tu primer contacto o gestor en el sistema.'}
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingCompany(null);
                  setIsModalOpen(true);
                }}
              >
                Crear Empresa
              </Button>
            </div>
          </ComponentCard>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCompanies.map((company) => {
              const roles = getCompanyRoles(company);

              return (
                <ComponentCard key={company.id} title="">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {company.razon_social}
                        </h3>
                        {company.nombre_comercial && (
                          <span className="text-xs text-muted font-normal">
                            ({company.nombre_comercial})
                          </span>
                        )}
                        {company.is_my_company && (
                          <Badge color="primary">🏢 Empresa Titular</Badge>
                        )}
                      </div>

                      {/* Badges de Roles Múltiples */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {roles.map((roleKey) => {
                          const config = ROLE_BADGE_CONFIG[roleKey] || { label: roleKey, color: 'light', icon: '🏷️' };
                          return (
                            <Badge key={roleKey} color={config.color}>
                              <span className="mr-1">{config.icon}</span>
                              {config.label}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1 gap-x-4 text-xs sm:text-sm text-muted pt-2">
                        <p>
                          <span className="font-medium text-foreground">CIF / NIF:</span>{' '}
                          <span className="font-mono">{company.cif}</span>
                        </p>

                        {company.nima && (
                          <p>
                            <span className="font-medium text-foreground">NIMA:</span>{' '}
                            <span className="font-mono">{company.nima}</span>
                          </p>
                        )}

                        {company.numero_autorizacion && (
                          <p>
                            <span className="font-medium text-foreground">Nº Autorización:</span>{' '}
                            <span className="font-mono">{company.numero_autorizacion}</span>
                          </p>
                        )}

                        {company.matricula && (
                          <p>
                            <span className="font-medium text-foreground">Matrícula:</span>{' '}
                            <span className="font-mono">{company.matricula}</span>
                          </p>
                        )}

                        {(company.municipio_social || company.provincia_social) && (
                          <p>
                            <span className="font-medium text-foreground">Ubicación:</span>{' '}
                            {[company.municipio_social, company.provincia_social].filter(Boolean).join(', ')}
                          </p>
                        )}

                        {company.telefono && (
                          <p>
                            <span className="font-medium text-foreground">Teléfono:</span>{' '}
                            {company.telefono}
                          </p>
                        )}

                        {company.email && (
                          <p>
                            <span className="font-medium text-foreground">Email:</span>{' '}
                            {company.email}
                          </p>
                        )}

                        {company.persona_contacto && (
                          <p>
                            <span className="font-medium text-foreground">Contacto:</span>{' '}
                            {company.persona_contacto}
                          </p>
                        )}
                      </div>

                      {company.notas && (
                        <p className="text-xs text-muted/80 italic pt-1 border-t border-gray-100 dark:border-gray-800">
                          {company.notas}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex md:flex-col gap-2 min-w-[120px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCompany(company);
                          setIsModalOpen(true);
                        }}
                      >
                        Editar Ficha
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCompanyForAuth(company);
                          setIsAuthModalOpen(true);
                        }}
                        className="border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-300"
                      >
                        📜 Autorizaciones
                      </Button>

                      {!company.is_my_company && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(company.id, company.razon_social)}
                          className="text-red-600 hover:bg-red-50"
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

        {/* Modal de Empresa */}
        <EmpresaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
          company={editingCompany}
          defaultRole={selectedRole !== 'all' ? (selectedRole as CompanyRole) : 'gestor'}
        />

        {/* Modal de Autorizaciones Ambientales */}
        {selectedCompanyForAuth && (
          <AutorizacionModal
            isOpen={isAuthModalOpen}
            onClose={() => {
              setIsAuthModalOpen(false);
              setSelectedCompanyForAuth(null);
            }}
            onSuccess={() => {
              loadData();
              setSuccessMessage('Autorización ambiental guardada correctamente.');
              toast.success('Autorización ambiental guardada correctamente.');
              setTimeout(() => setSuccessMessage(null), 4000);
            }}
            company={selectedCompanyForAuth}
            centers={selectedCompanyForAuth.production_centers || []}
          />
        )}
      </div>
    </>
  );
}

export default function EmpresasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Cargando directorio de empresas...</p>
          </div>
        </div>
      }
    >
      <EmpresasContent />
    </Suspense>
  );
}
