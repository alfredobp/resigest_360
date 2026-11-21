'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { Modal, ConfirmModal } from '@/components/ui/modal';
import { DataTable, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
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
  const { activeCompanyId, canWrite } = useTenant();
  const initialRole = searchParams.get('rol') || 'all';

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [authorizations, setAuthorizations] = useState<EnvironmentalAuthorization[]>([]);
  const [viewingAuthsCompany, setViewingAuthsCompany] = useState<Company | null>(null);
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
  }, [activeCompanyId]);

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

  // Filtrado por rol (la búsqueda textual la gestiona DataTable incluyendo LER/autorizaciones)
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const roles = getCompanyRoles(c);
      return selectedRole === 'all' || roles.includes(selectedRole as CompanyRole);
    });
  }, [companies, selectedRole]);

  const columns = useMemo<ColumnDef<Company>[]>(
    () => [
      {
        id: 'razon_social',
        header: 'Empresa',
        accessorKey: 'razon_social',
        sortable: true,
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
              <span>{row.razon_social}</span>
              {row.is_my_company && <Badge color="primary" size="sm">Titular</Badge>}
            </div>
            {row.nombre_comercial && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.nombre_comercial}</div>
            )}
          </div>
        ),
      },
      {
        id: 'roles',
        header: 'Roles',
        accessorFn: (row) => getCompanyRoles(row).join(' '),
        cell: ({ row }) => {
          const roles = getCompanyRoles(row);
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map((roleKey) => {
                const config = ROLE_BADGE_CONFIG[roleKey] || { label: roleKey, color: 'light' };
                return (
                  <Badge key={roleKey} color={config.color} size="sm">
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          );
        },
      },
      {
        id: 'cif_nima',
        header: 'CIF / NIMA',
        accessorFn: (row) => `${row.cif || ''} ${row.nima || ''} ${row.matricula || ''}`,
        sortable: true,
        cell: ({ row }) => (
          <div className="font-mono text-xs whitespace-nowrap">
            <div className="text-slate-800 dark:text-slate-200">{row.cif || '-'}</div>
            {row.nima && <div className="text-[11px] text-slate-500">NIMA: {row.nima}</div>}
            {row.matricula && <div className="text-[11px] text-slate-500">Mat: {row.matricula}</div>}
          </div>
        ),
      },
      {
        id: 'contacto',
        header: 'Ubicación / Contacto',
        accessorFn: (row) =>
          [row.municipio_social, row.provincia_social, row.email, row.telefono, row.persona_contacto].filter(Boolean).join(' '),
        cell: ({ row }) => {
          const loc = [row.municipio_social, row.provincia_social].filter(Boolean).join(', ');
          return (
            <div className="text-xs">
              <div className="text-slate-700 dark:text-slate-300">{loc || '-'}</div>
              {(row.email || row.telefono) && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                  {row.email || row.telefono}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'autorizaciones',
        header: 'Autorizaciones',
        cell: ({ row }) => {
          const companyAuths = authorizations.filter((a) => a.company_id === row.id);
          const showAuthorizations = supportsAuthorizations(row) || companyAuths.length > 0;
          if (!showAuthorizations) {
            return <span className="text-xs text-slate-400">—</span>;
          }
          return (
            <button
              type="button"
              onClick={() => setViewingAuthsCompany(row)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline"
            >
              <Badge color={companyAuths.length > 0 ? 'success' : 'light'} size="sm">
                {companyAuths.length} {companyAuths.length === 1 ? 'autorización' : 'autorizaciones'}
              </Badge>
            </button>
          );
        },
      },
      {
        id: 'acciones',
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right',
        cell: ({ row }) => {
          const companyAuths = authorizations.filter((a) => a.company_id === row.id);
          const showAuthorizations = supportsAuthorizations(row) || companyAuths.length > 0;
          return (
            <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCompany(row);
                  setIsModalOpen(true);
                }}
              >
                Editar
              </Button>
              {showAuthorizations && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingAuthsCompany(row)}
                  className="border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-300"
                >
                  Autorizaciones
                </Button>
              )}
              {canWrite && !row.is_my_company && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(row.id, row.razon_social)}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Eliminar
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [authorizations, canWrite]
  );

  const searchCompaniesFilter = (c: Company, term: string) => {
    const q = term.toLowerCase().trim();
    if (!q) return true;
    const companyAuths = authorizations.filter((a) => a.company_id === c.id);
    return Boolean(
      c.razon_social?.toLowerCase().includes(q) ||
        c.nombre_comercial?.toLowerCase().includes(q) ||
        c.cif?.toLowerCase().includes(q) ||
        c.nima?.toLowerCase().includes(q) ||
        c.numero_autorizacion?.toLowerCase().includes(q) ||
        companyAuths.some(
          (a) =>
            a.numero_autorizacion?.toLowerCase().includes(q) ||
            a.titulo?.toLowerCase().includes(q) ||
            a.waste_codes?.some(
              (wc) =>
                wc.codigo_ler.toLowerCase().includes(q) ||
                wc.descripcion_ler?.toLowerCase().includes(q)
            )
        )
    );
  };

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
          {canWrite && (
            <Button
              onClick={() => {
                setEditingCompany(null);
                setIsModalOpen(true);
              }}
            >
              + Nueva Empresa / Contacto
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        {successMessage && (
          <Alert variant="success" title="Operación completada" message={successMessage} />
        )}

        {/* Filtros por Rol */}
        <div className="rounded-[10px] border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex flex-wrap gap-1.5">
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
            <Button
              variant={selectedRole === 'negociante' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedRole('negociante')}
            >
              Negociantes ({companies.filter(c => getCompanyRoles(c).includes('negociante')).length})
            </Button>
            <Button
              variant={selectedRole === 'agente' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedRole('agente')}
            >
              Agentes ({companies.filter(c => getCompanyRoles(c).includes('agente')).length})
            </Button>
          </div>
        </div>

        {/* Tabla de Empresas */}
        <DataTable
          data={filteredCompanies}
          columns={columns}
          searchFilter={searchCompaniesFilter}
          searchPlaceholder="Buscar por Razón Social, CIF/NIF, NIMA, Nº Autorización o código LER..."
          emptyState={
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No se encontraron empresas</p>
              <p className="mt-1 text-xs text-slate-500">
                Comienza registrando tu primer contacto o gestor en el sistema.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => {
                  setEditingCompany(null);
                  setIsModalOpen(true);
                }}
              >
                + Crear Empresa
              </Button>
            </div>
          }
        />

        {/* Modal Detalle de Autorizaciones Ambientales de la Empresa */}
        {viewingAuthsCompany && (
          <Modal
            isOpen={Boolean(viewingAuthsCompany)}
            onClose={() => setViewingAuthsCompany(null)}
            className="max-w-3xl p-6"
          >
            {(() => {
              const companyAuths = authorizations.filter((a) => a.company_id === viewingAuthsCompany.id);
              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Autorizaciones Ambientales · {viewingAuthsCompany.razon_social}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        CIF: {viewingAuthsCompany.cif} {viewingAuthsCompany.nima ? `· NIMA: ${viewingAuthsCompany.nima}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedCompanyForAuth(viewingAuthsCompany);
                        setEditingAuth(null);
                        setIsAuthModalOpen(true);
                      }}
                    >
                      + Nueva Autorización
                    </Button>
                  </div>

                  {companyAuths.length === 0 ? (
                    <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-500">
                        Esta empresa no tiene autorizaciones ambientales dadas de alta en el sistema.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                      {companyAuths.map((auth) => {
                        const numLers = auth.waste_codes?.length || 0;
                        const isExpired = !auth.es_indefinida && auth.fecha_vencimiento && new Date(auth.fecha_vencimiento) < new Date();
                        const daysToExpire =
                          !auth.es_indefinida && auth.fecha_vencimiento
                            ? Math.ceil((new Date(auth.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            : null;
                        const isExpiringSoon = daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 60;

                        return (
                          <div
                            key={auth.id}
                            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  Nº {auth.numero_autorizacion}
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[260px]">
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
                                <Badge color="light" size="sm">
                                  {numLers} {numLers === 1 ? 'LER' : 'LERs'}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                                {auth.organismo_emisor && <span><strong>Organismo:</strong> {auth.organismo_emisor}</span>}
                                {auth.fecha_emision && <span><strong>Emisión:</strong> {auth.fecha_emision}</span>}
                                {auth.production_center && <span><strong>Instalación:</strong> {auth.production_center.nombre}</span>}
                              </div>

                              {auth.waste_codes && auth.waste_codes.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {auth.waste_codes.slice(0, 10).map((wc, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300"
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
                                  {auth.waste_codes.length > 10 && (
                                    <span className="text-[11px] text-slate-500 italic">+{auth.waste_codes.length - 10} más...</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex sm:flex-col gap-1.5 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCompanyForAuth(viewingAuthsCompany);
                                  setEditingAuth(auth);
                                  setIsAuthModalOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                              <button
                                type="button"
                                onClick={() => setAuthToDelete({ id: auth.id, numero: auth.numero_autorizacion })}
                                className="text-[11px] text-red-600 hover:underline px-2 py-0.5 text-center"
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
              );
            })()}
          </Modal>
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
