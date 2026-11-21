'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { toast } from '@/context/ToastContext';
import Input from '@/components/form/input/InputField';
import EmpresaModal from '@/components/residuos/EmpresaModal';
import AutorizacionModal from '@/components/residuos/AutorizacionModal';
import companyService from '@/services/companyService';
import authorizationService from '@/services/authorizationService';
import type { Company, CompanyRole, EnvironmentalAuthorization } from '@/types/wasteManagement';

const ROLE_BADGE_CONFIG: Record<CompanyRole, { label: string; color: 'primary' | 'success' | 'warning' | 'info' | 'light' | 'error' }> = {
  gestor: { label: 'Gestor', color: 'success' },
  transportista: { label: 'Transportista', color: 'info' },
  productor: { label: 'Productor', color: 'warning' },
  negociante: { label: 'Negociante', color: 'primary' },
  agente: { label: 'Agente', color: 'primary' },
  cliente: { label: 'Cliente', color: 'light' },
  proveedor: { label: 'Proveedor', color: 'light' },
};

function EmpresasContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('rol') || 'all';

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [authorizations, setAuthorizations] = useState<EnvironmentalAuthorization[]>([]);
  const [expandedAuthCompanyIds, setExpandedAuthCompanyIds] = useState<Record<number, boolean>>({});
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
  const [editingAuth, setEditingAuth] = useState<EnvironmentalAuthorization | null>(null);

  // Modal Confirmación Eliminar Empresa
  const [companyToDelete, setCompanyToDelete] = useState<{ id: number; razonSocial: string } | null>(null);

  // Modal Confirmación Eliminar Autorización
  const [authToDelete, setAuthToDelete] = useState<{ id: number; numero: string } | null>(null);

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
      const [companiesData, myCompany, authsData] = await Promise.all([
        companyService.getAllContacts(),
        companyService.getUserCompany().catch(() => null),
        authorizationService.getAll().catch((err) => {
          console.warn('Error al cargar autorizaciones:', err);
          return [] as EnvironmentalAuthorization[];
        }),
      ]);
      const directoryContacts = companiesData.filter(
        (c) => !c.is_my_company && (!myCompany || c.id !== myCompany.id)
      );
      setCompanies(directoryContacts);
      setAuthorizations(authsData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, razonSocial: string) => {
    setCompanyToDelete({ id, razonSocial });
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    const { id, razonSocial } = companyToDelete;

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

  const confirmDeleteAuth = async () => {
    if (!authToDelete) return;
    try {
      await authorizationService.delete(authToDelete.id);
      setAuthorizations(prev => prev.filter(a => a.id !== authToDelete.id));
      setSuccessMessage(`Autorización "${authToDelete.numero}" eliminada correctamente.`);
      toast.success(`Autorización "${authToDelete.numero}" eliminada correctamente.`);
      setAuthToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      toast.error(`Error al eliminar autorización: ${err.message}`);
    }
  };

  const getCompanyRoles = (company: Company): CompanyRole[] => {
    if (Array.isArray(company.roles) && company.roles.length > 0) {
      return company.roles;
    }
    return company.tipo_empresa ? [company.tipo_empresa as CompanyRole] : ['productor'];
  };

  const supportsAuthorizations = (company: Company): boolean => {
    const roles = getCompanyRoles(company);
    return roles.includes('gestor') || roles.includes('transportista');
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

    // Buscar también en autorizaciones de la empresa
    const companyAuths = authorizations.filter(a => a.company_id === c.id);
    const matchDetailedAuth = companyAuths.some(a =>
      a.numero_autorizacion?.toLowerCase().includes(q) ||
      a.titulo?.toLowerCase().includes(q) ||
      a.waste_codes?.some(wc => wc.codigo_ler.toLowerCase().includes(q) || wc.descripcion_ler?.toLowerCase().includes(q))
    );

    return matchName || matchTrade || matchCif || matchNima || matchAuth || matchDetailedAuth;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
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
        <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="space-y-3">
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
                Gestores ({companies.filter(c => getCompanyRoles(c).includes('gestor')).length})
              </Button>
              <Button
                variant={selectedRole === 'transportista' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('transportista')}
              >
                Transportistas ({companies.filter(c => getCompanyRoles(c).includes('transportista')).length})
              </Button>
              <Button
                variant={selectedRole === 'productor' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('productor')}
              >
                Productores ({companies.filter(c => getCompanyRoles(c).includes('productor')).length})
              </Button>
              <Button
                variant={selectedRole === 'cliente' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('cliente')}
              >
                Clientes ({companies.filter(c => getCompanyRoles(c).includes('cliente')).length})
              </Button>
              <Button
                variant={selectedRole === 'proveedor' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('proveedor')}
              >
                Proveedores ({companies.filter(c => getCompanyRoles(c).includes('proveedor')).length})
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
        </div>

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
              const companyAuths = authorizations.filter(a => a.company_id === company.id);
              const showAuthorizations = supportsAuthorizations(company) || companyAuths.length > 0;
              const isExpanded = Boolean(expandedAuthCompanyIds[company.id]);

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
                          <Badge color="primary">Empresa Titular</Badge>
                        )}
                      </div>

                      {/* Badges de Roles Múltiples */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {roles.map((roleKey) => {
                          const config = ROLE_BADGE_CONFIG[roleKey] || { label: roleKey, color: 'light' };
                          return (
                            <Badge key={roleKey} color={config.color}>
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

                      {/* Indicador / Desplegable de Autorizaciones Ambientales (solo Gestor / Transportista) */}
                      {showAuthorizations && (
                      <div className="pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedAuthCompanyIds(prev => ({
                                ...prev,
                                [company.id]: !prev[company.id]
                              }));
                            }}
                            className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60"
                          >
                            <span className="text-sm">📜</span>
                            <span className="font-semibold">
                              Autorizaciones Ambientales ({companyAuths.length})
                            </span>
                            {companyAuths.length > 0 ? (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-800/60">
                                {companyAuths.length === 1 ? '1 dada de alta' : `${companyAuths.length} dadas de alta`}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted italic">
                                (0 registradas)
                              </span>
                            )}
                            <span className="text-gray-400 text-xs ml-0.5">
                              {isExpanded ? '▲ Ocultar' : '▼ Ver detalle'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCompanyForAuth(company);
                              setEditingAuth(null);
                              setIsAuthModalOpen(true);
                            }}
                            className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium hover:underline inline-flex items-center gap-1"
                          >
                            <span>+</span> Nueva Autorización
                          </button>
                        </div>

                        {/* Detalle desplegable de autorizaciones */}
                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            {companyAuths.length === 0 ? (
                              <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-900/40 border border-dashed border-gray-200 dark:border-gray-800 text-center">
                                <p className="text-xs text-muted">
                                  Esta empresa no tiene autorizaciones ambientales dadas de alta en el sistema.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 text-xs"
                                  onClick={() => {
                                    setSelectedCompanyForAuth(company);
                                    setEditingAuth(null);
                                    setIsAuthModalOpen(true);
                                  }}
                                >
                                  + Dar de alta primera autorización
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {companyAuths.map((auth) => {
                                  const numLers = auth.waste_codes?.length || 0;
                                  const isExpired = !auth.es_indefinida && auth.fecha_vencimiento && new Date(auth.fecha_vencimiento) < new Date();
                                  const daysToExpire = !auth.es_indefinida && auth.fecha_vencimiento
                                    ? Math.ceil((new Date(auth.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                    : null;
                                  const isExpiringSoon = daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 60;

                                  return (
                                    <div
                                      key={auth.id}
                                      className="p-3 rounded-xl border border-gray-200/90 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/40 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs shadow-2xs"
                                    >
                                      <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-mono font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                            Nº {auth.numero_autorizacion}
                                          </span>
                                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[280px]">
                                            {auth.titulo}
                                          </span>
                                          {auth.es_indefinida ? (
                                            <Badge color="success" size="sm">Vigencia Indefinida</Badge>
                                          ) : isExpired ? (
                                            <Badge color="error" size="sm">Caducada ({auth.fecha_vencimiento})</Badge>
                                          ) : isExpiringSoon ? (
                                            <Badge color="warning" size="sm">Vence pronto ({auth.fecha_vencimiento})</Badge>
                                          ) : (
                                            <Badge color="primary" size="sm">Vence: {auth.fecha_vencimiento}</Badge>
                                          )}
                                          <span className="inline-flex items-center text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                                            🔖 {numLers} {numLers === 1 ? 'código LER autorizado' : 'códigos LER autorizados'}
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted text-[11px]">
                                          {auth.organismo_emisor && (
                                            <span><strong>Organismo:</strong> {auth.organismo_emisor}</span>
                                          )}
                                          {auth.fecha_emision && (
                                            <span><strong>Emisión:</strong> {auth.fecha_emision}</span>
                                          )}
                                          {auth.production_center && (
                                            <span><strong>Instalación:</strong> {auth.production_center.nombre}</span>
                                          )}
                                        </div>

                                        {/* Previsualización de Códigos LER autorizados */}
                                        {auth.waste_codes && auth.waste_codes.length > 0 && (
                                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            {auth.waste_codes.slice(0, 8).map((wc, idx) => (
                                              <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-mono text-[11px] text-gray-700 dark:text-gray-300"
                                                title={wc.descripcion_ler || undefined}
                                              >
                                                <span className={wc.codigo_ler.includes('*') ? 'text-red-600 font-bold' : ''}>
                                                  {wc.codigo_ler}
                                                </span>
                                                {wc.operaciones_tratamiento && wc.operaciones_tratamiento.length > 0 && (
                                                  <span className="text-brand-600 dark:text-brand-400 text-[10px] font-semibold">
                                                    ({wc.operaciones_tratamiento.join(',')})
                                                  </span>
                                                )}
                                              </span>
                                            ))}
                                            {auth.waste_codes.length > 8 && (
                                              <span className="text-[11px] text-muted italic">
                                                +{auth.waste_codes.length - 8} más...
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-start">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-[11px] py-1 px-2.5 h-auto"
                                          onClick={() => {
                                            setSelectedCompanyForAuth(company);
                                            setEditingAuth(auth);
                                            setIsAuthModalOpen(true);
                                          }}
                                        >
                                          Editar
                                        </Button>
                                        <button
                                          type="button"
                                          onClick={() => setAuthToDelete({ id: auth.id, numero: auth.numero_autorizacion })}
                                          className="text-[11px] text-red-600 hover:text-red-700 hover:underline px-2 py-0.5 text-center"
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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

                      {showAuthorizations && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (companyAuths.length > 0) {
                              setExpandedAuthCompanyIds(prev => ({
                                ...prev,
                                [company.id]: true
                              }));
                            } else {
                              setSelectedCompanyForAuth(company);
                              setEditingAuth(null);
                              setIsAuthModalOpen(true);
                            }
                          }}
                          className="border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-300"
                        >
                          Autorizaciones {companyAuths.length > 0 && `(${companyAuths.length})`}
                        </Button>
                      )}

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
              setEditingAuth(null);
            }}
            onSuccess={() => {
              loadData();
              setSuccessMessage('Autorización ambiental guardada correctamente.');
              toast.success('Autorización ambiental guardada correctamente.');
              setTimeout(() => setSuccessMessage(null), 4000);
            }}
            company={selectedCompanyForAuth}
            centers={selectedCompanyForAuth.production_centers || []}
            authorizationToEdit={editingAuth}
          />
        )}

        <ConfirmModal
          isOpen={Boolean(companyToDelete)}
          onClose={() => setCompanyToDelete(null)}
          onConfirm={confirmDeleteCompany}
          title="Eliminar empresa"
          message={`¿Estás seguro de que deseas eliminar la empresa "${companyToDelete?.razonSocial || ''}"? Esta acción no se puede deshacer.`}
        />

        <ConfirmModal
          isOpen={Boolean(authToDelete)}
          onClose={() => setAuthToDelete(null)}
          onConfirm={confirmDeleteAuth}
          title="Eliminar autorización ambiental"
          message={`¿Estás seguro de que deseas eliminar la autorización "${authToDelete?.numero || ''}"? Esta acción no se puede deshacer.`}
        />
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted">Cargando directorio de empresas...</p>
          </div>
        </div>
      }
    >
      <EmpresasContent />
    </Suspense>
  );
}
