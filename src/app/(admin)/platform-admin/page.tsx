'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import PageSkeleton from '@/components/common/PageSkeleton';
import Input from '@/components/form/input/InputField';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import CompanyAuditModal from '@/components/admin/CompanyAuditModal';
import adminPlatformService from '@/services/adminPlatformService';
import { computeDelegationExpiryIso } from '@/services/delegationService';
import type {
  PlatformOverviewStats,
  PlatformCompanyRecord,
  CompanyAuditDetail,
  CompanyRole,
  AdminDelegationSummary,
  MembershipRole,
} from '@/types/wasteManagement';

const ROLE_BADGE_CONFIG: Record<CompanyRole, { label: string; color: 'primary' | 'success' | 'warning' | 'info' | 'light' | 'error' }> = {
  gestor: { label: 'Gestor', color: 'success' },
  transportista: { label: 'Transportista', color: 'info' },
  productor: { label: 'Productor', color: 'warning' },
  negociante: { label: 'Negociante', color: 'primary' },
  agente: { label: 'Agente', color: 'primary' },
  cliente: { label: 'Cliente', color: 'light' },
  proveedor: { label: 'Proveedor', color: 'light' },
};

export default function PlatformAdminPage() {
  const router = useRouter();
  const { switchCompany, refreshTenant, activeCompanyId } = useTenant();

  // Estados de carga y autorización
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos
  const [stats, setStats] = useState<PlatformOverviewStats | null>(null);
  const [companies, setCompanies] = useState<PlatformCompanyRecord[]>([]);
  const [delegationsMap, setDelegationsMap] = useState<Record<number, AdminDelegationSummary>>({});

  // Filtros de barra de herramientas (el buscador de texto lo gestiona DataTable)
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'my' | 'contacts'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'blocked'>('all');

  // Modal de bloqueo / activación de acceso
  const [blockingCompany, setBlockingCompany] = useState<PlatformCompanyRecord | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [submittingBlock, setSubmittingBlock] = useState(false);
  const [activatingCompany, setActivatingCompany] = useState<PlatformCompanyRecord | null>(null);

  // Modal de auditoría
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setSelectedCompanyId] = useState<number | null>(null);
  const [auditDetail, setAuditDetail] = useState<CompanyAuditDetail | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Modal rápido de delegación con motivo y caducidad
  const [delegatingCompany, setDelegatingCompany] = useState<PlatformCompanyRecord | null>(null);
  const [delegationRole, setDelegationRole] = useState<Exclude<MembershipRole, 'owner'>>('consultor_admin');
  const [delegationCommercial, setDelegationCommercial] = useState(false);
  const [delegationDays, setDelegationDays] = useState<number>(7);
  const [delegationReason, setDelegationReason] = useState('');
  const [submittingDelegation, setSubmittingDelegation] = useState(false);
  const [revokingCompany, setRevokingCompany] = useState<PlatformCompanyRecord | null>(null);

  // 1. Comprobar permisos administrativos
  useEffect(() => {
    async function verifyAdmin() {
      try {
        setCheckingAuth(true);
        const authorized = await adminPlatformService.checkIsAdmin();
        if (!authorized) {
          toast.error('Acceso restringido: Se requieren permisos de Administrador de Plataforma.');
          router.replace('/app');
          return;
        }
        setIsAdmin(true);
        loadPlatformData();
      } catch (err: any) {
        console.error('Error al validar sesión de administrador:', err);
        setError('No se pudo verificar el acceso administrativo.');
        router.replace('/app');
      } finally {
        setCheckingAuth(false);
      }
    }

    verifyAdmin();
  }, [router]);

  // 2. Cargar métricas, listado de empresas y delegaciones del administrador
  const loadPlatformData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, companiesData, delegationsData, trialConfig] = await Promise.all([
        adminPlatformService.getPlatformStats(),
        adminPlatformService.getAllPlatformCompanies(),
        adminPlatformService.getAdminDelegations().catch(() => ({} as Record<number, AdminDelegationSummary>)),
        adminPlatformService.getTrialDaysByRole().catch(() => ({ transportista: 15 })),
      ]);

      setStats(statsData);
      setCompanies(companiesData);
      setDelegationsMap(delegationsData);
      if (typeof trialConfig.transportista === 'number') {
        setTransportistaTrialDays(trialConfig.transportista);
      }
    } catch (err: any) {
      console.error('Error al cargar datos globales:', err);
      setError(err.message || 'Error al obtener la información de la plataforma.');
    } finally {
      setLoading(false);
    }
  };

  // Actuar directamente en nombre de una empresa ya delegada vigente
  const handleActOnBehalf = async (company: PlatformCompanyRecord) => {
    await switchCompany(company.id);
    toast.success(`Actuando ahora en nombre de: ${company.nombre_comercial || company.razon_social}`);
    router.push('/app');
  };

  // Abrir diálogo de activación de delegación con motivo y caducidad
  const handleOpenDelegateModal = (company: PlatformCompanyRecord) => {
    const existing = delegationsMap[company.id];
    setDelegatingCompany(company);
    setDelegationRole(
      existing && existing.role !== 'owner' ? existing.role : 'consultor_admin'
    );
    setDelegationCommercial(Boolean(existing?.can_view_commercial));
    setDelegationDays(7);
    setDelegationReason(existing?.delegation_reason || '');
  };

  const handleSubmitDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatingCompany) return;
    if (!delegationReason.trim()) {
      toast.warning('Debes indicar el motivo o referencia de autorización.');
      return;
    }

    try {
      setSubmittingDelegation(true);
      const expiresAt = computeDelegationExpiryIso(delegationDays);
      await adminPlatformService.delegateCompanyToSelf(delegatingCompany.id, {
        role: delegationRole,
        canViewCommercial: delegationCommercial,
        expiresAt,
        reason: delegationReason.trim(),
      });
      await switchCompany(delegatingCompany.id);
      toast.success(
        `Delegación activada. Actuando en nombre de ${delegatingCompany.nombre_comercial || delegatingCompany.razon_social}.`
      );
      setDelegatingCompany(null);
      router.push('/app');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo activar la delegación.');
    } finally {
      setSubmittingDelegation(false);
    }
  };

  const handleConfirmRevokeDelegation = async () => {
    if (!revokingCompany) return;
    try {
      await adminPlatformService.revokeAdminDelegation(revokingCompany.id);
      toast.success(`Delegación revocada para ${revokingCompany.razon_social}.`);
      setRevokingCompany(null);
      await Promise.all([loadPlatformData(), refreshTenant()]);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo revocar la delegación.');
    }
  };

  const handleSubmitBlockCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingCompany) return;
    if (!blockReason.trim()) {
      toast.warning('Debes indicar el motivo del bloqueo.');
      return;
    }

    try {
      setSubmittingBlock(true);
      await adminPlatformService.setCompanyAccessStatus(blockingCompany.id, false, blockReason.trim());
      toast.success(`Acceso bloqueado para ${blockingCompany.razon_social}.`);
      setBlockingCompany(null);
      setBlockReason('');
      await Promise.all([loadPlatformData(), refreshTenant()]);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo bloquear la empresa.');
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleConfirmActivateCompany = async () => {
    if (!activatingCompany) return;
    try {
      await adminPlatformService.setCompanyAccessStatus(activatingCompany.id, true, 'Reactivación desde Panel Admin');
      toast.success(`Acceso reactivado para ${activatingCompany.razon_social}.`);
      setActivatingCompany(null);
      await Promise.all([loadPlatformData(), refreshTenant()]);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo activar la empresa.');
    }
  };

  // 3. Abrir auditoría de una empresa
  const handleOpenAudit = async (companyId: number) => {
    try {
      setSelectedCompanyId(companyId);
      setIsModalOpen(true);
      setLoadingAudit(true);
      const detail = await adminPlatformService.getCompanyAuditDetail(companyId);
      setAuditDetail(detail);
    } catch (err: any) {
      toast.error(`Error al auditar empresa: ${err.message}`);
      setIsModalOpen(false);
    } finally {
      setLoadingAudit(false);
    }
  };

  // 4. Exportar a CSV
  const handleExportCSV = () => {
    if (filteredCompanies.length === 0) {
      toast.warning('No hay empresas disponibles para exportar con los filtros actuales.');
      return;
    }
    adminPlatformService.exportCompaniesCSV(filteredCompanies);
    toast.success(`Exportadas ${filteredCompanies.length} empresas a CSV.`);
  };

  // 5. Filtrado previo por tipo, estado y rol (búsqueda textual, ordenación y paginación en DataTable)
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      if (selectedType === 'my' && !c.is_my_company) return false;
      if (selectedType === 'contacts' && c.is_my_company) return false;

      if (selectedStatus === 'active' && c.activo === false) return false;
      if (selectedStatus === 'blocked' && c.activo !== false) return false;

      if (selectedRole !== 'all') {
        const roles = Array.isArray(c.roles) && c.roles.length > 0
          ? c.roles
          : (c.tipo_empresa ? [c.tipo_empresa] : ['productor']);
        if (!roles.includes(selectedRole as CompanyRole)) return false;
      }

      return true;
    });
}, [companies, selectedType, selectedStatus, selectedRole]);

const companyColumns = useMemo<ColumnDef<PlatformCompanyRecord>[]>(() => [
  {
    id: 'razon_social',
    accessorKey: 'razon_social',
    header: 'Empresa',
    sortable: true,
    cell: ({ row: c }) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[11px] text-primary shrink-0">
          {c.razon_social?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[190px]" title={c.razon_social}>
              {c.razon_social}
            </span>
            {c.is_my_company && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 shrink-0">
                Titular
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
            {c.municipio_social ? `${c.municipio_social} (${c.provincia_social || ''})` : 'Sin ubicación'}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'cif',
    accessorKey: 'cif',
    header: 'CIF / NIMA',
    sortable: true,
    className: 'font-mono text-[11px] whitespace-nowrap',
    cell: ({ row: c }) => (
      <div>
        <span className="font-bold text-slate-800 dark:text-slate-200 block">{c.cif}</span>
        {c.nima ? (
          <span className="text-slate-500 block">NIMA: {c.nima}</span>
        ) : (
          <span className="text-slate-400 block italic">Sin NIMA</span>
        )}
      </div>
    ),
  },
  {
    id: 'roles',
    header: 'Roles',
    sortable: false,
    cell: ({ row: c }) => {
      const roles: CompanyRole[] = Array.isArray(c.roles) && c.roles.length > 0
        ? c.roles
        : (c.tipo_empresa ? [c.tipo_empresa as CompanyRole] : ['productor']);
      return (
        <div className="flex flex-wrap gap-1 max-w-[140px]">
          {roles.map(r => (
            <Badge key={r} variant="light" color={ROLE_BADGE_CONFIG[r]?.color || 'primary'} size="sm">
              {ROLE_BADGE_CONFIG[r]?.label || r}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: 'user_email',
    accessorKey: 'user_email',
    header: 'Cuenta',
    sortable: true,
    cell: ({ row: c }) => (
      <div>
        <span className="font-medium text-slate-800 dark:text-slate-200 block truncate max-w-[140px]">
          {c.user_name || 'Usuario'}
        </span>
        <span className="text-slate-500 text-[11px] block truncate max-w-[140px]" title={c.user_email || ''}>
          {c.user_email || 'N/A'}
        </span>
      </div>
    ),
  },
  {
    id: 'centers_count',
    accessorKey: 'centers_count',
    header: 'Centros',
    sortable: true,
    headerClassName: 'text-right',
    className: 'text-right font-mono tabular-nums text-slate-800 dark:text-slate-200',
    cell: ({ row: c }) => c.centers_count || 0,
  },
  {
    id: 'dis_count',
    accessorKey: 'dis_count',
    header: 'DIs',
    sortable: true,
    headerClassName: 'text-right',
    className: 'text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white',
    cell: ({ row: c }) => c.dis_count || 0,
  },
  {
    id: 'contracts_count',
    accessorKey: 'contracts_count',
    header: 'Contratos',
    sortable: true,
    headerClassName: 'text-right',
    className: 'text-right font-mono tabular-nums text-slate-800 dark:text-slate-200',
    cell: ({ row: c }) => c.contracts_count || 0,
  },
  {
    id: 'total_toneladas',
    accessorKey: 'total_toneladas',
    header: 'Toneladas',
    sortable: true,
    headerClassName: 'text-right',
    className: 'text-right font-mono tabular-nums whitespace-nowrap text-amber-700 dark:text-amber-300 font-medium',
    cell: ({ row: c }) =>
      `${(c.total_toneladas || 0).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} t`,
  },
  {
    id: 'last_operation_at',
    accessorKey: 'last_operation_at',
    header: 'Últ. Operación',
    sortable: true,
    className: 'whitespace-nowrap text-slate-500 dark:text-slate-400',
    cell: ({ row: c }) =>
      c.last_operation_at ? new Date(c.last_operation_at).toLocaleDateString('es-ES') : '—',
  },
  {
    id: 'activo',
    accessorKey: 'activo',
    header: 'Estado',
    sortable: true,
    className: 'whitespace-nowrap',
    cell: ({ row: c }) => (
      <div className="flex flex-col gap-1 items-start">
        <Badge variant="light" color={c.activo !== false ? 'success' : 'error'} size="sm">
          {c.activo !== false ? 'Activa' : 'Bloqueada'}
        </Badge>
        {c.activo === false && c.blocked_reason && (
          <span className="text-[10px] text-red-500 max-w-[140px] truncate" title={c.blocked_reason}>
            {c.blocked_reason}
          </span>
        )}
        {c.is_my_company && delegationsMap[c.id] && (
          <Badge
            variant="light"
            color={delegationsMap[c.id].is_active ? 'primary' : 'warning'}
            size="sm"
          >
            {delegationsMap[c.id].is_active
              ? `Delegada (${delegationsMap[c.id].role})`
              : 'Delegación caducada'}
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    sortable: false,
    headerClassName: 'text-right',
    className: 'text-right whitespace-nowrap',
    cell: ({ row: c }) => (
      <div className="inline-flex items-center justify-end gap-1.5">
        {c.is_my_company && c.activo !== false && (
          delegationsMap[c.id]?.is_active ? (
            <>
              <DataTableActionButton
                action="act"
                label={activeCompanyId === c.id ? 'Activa' : 'Actuar'}
                onClick={() => handleActOnBehalf(c)}
              />
              <DataTableActionButton
                action="revoke"
                onClick={() => setRevokingCompany(c)}
              />
            </>
          ) : (
            <DataTableActionButton
              action="delegate"
              onClick={() => handleOpenDelegateModal(c)}
            />
          )
        )}
        {c.is_my_company && (
          c.activo !== false ? (
            <DataTableActionButton
              action="block"
              onClick={() => {
                setBlockingCompany(c);
                setBlockReason('');
              }}
            />
          ) : (
            <DataTableActionButton
              action="activate"
              onClick={() => setActivatingCompany(c)}
            />
          )
        )}
        {c.is_my_company && (
          <select
            aria-label={`Plan Premium de ${c.razon_social}`}
            value={c.plan_tier || 'basico'}
            onChange={async (e) => {
              const nextTier = e.target.value as 'basico' | 'trial' | 'premium';
              try {
                await adminPlatformService.setCompanyPremiumPlan(c.id, {
                  planTier: nextTier,
                  trialDays: transportistaTrialDays,
                });
                toast.success(`Plan actualizado a "${nextTier}" para ${c.razon_social}.`);
                await loadPlatformData();
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Error al actualizar plan');
              }
            }}
            className="text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="basico">Plan Básico</option>
            <option value="trial">Cortesía ({transportistaTrialDays}d)</option>
            <option value="premium">Premium</option>
          </select>
        )}
        <DataTableActionButton
          action="audit"
          onClick={() => handleOpenAudit(c.id)}
        />
      </div>
    ),
  },
], [delegationsMap, activeCompanyId]);

if (checkingAuth) {
  return (
    <PageSkeleton
      variant="table-with-stats"
      label="Verificando credenciales de Superadministrador"
      className="pb-12"
    />
  );
}

if (!isAdmin) {
  return null;
}

return (
  <div className="space-y-6 pb-12">
    {/* Cabecera Administrativa */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Supervisión Global de Plataforma
          </h1>
          <Badge variant="solid" color="primary">
            Modo Administrador
          </Badge>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Auditoría de empresas, cuentas de clientes, centros de producción y extracción de expedientes normativos.
        </p>
      </div>

      {/* Acciones Rápidas */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={loadPlatformData}
          disabled={loading}
          startIcon={
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        >
          Actualizar
        </Button>

        <Button
          size="sm"
          onClick={handleExportCSV}
          startIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Exportar a CSV
        </Button>
      </div>
    </div>

    {error && (
      <Alert variant="error" title="Error" message={error} />
    )}

    {/* Tarjetas de Métricas Globales */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Empresas</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.totalCompanies || companies.length)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {stats?.myCompanies || 0} cuentas titulares
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cuentas Usuario</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-primary">
            {loading ? '...' : (stats?.totalUsers || 0)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">Perfiles registrados</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">DIs Globales</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-success-600">
            {loading ? '...' : (stats?.totalDIs || 0)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">Docs. Identificación</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Toneladas Est.</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-warning-600">
            {loading ? '...' : (stats?.totalToneladas || 0)}
          </span>
          <span className="text-xs font-medium text-slate-400">t</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">Volumen declarado</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Contratos</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.totalContracts || 0)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">RD 553/2020</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-xs">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Centros Registrados</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.totalCenters || 0)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">Instalaciones</p>
      </div>
    </div>

      {/* DataTable Maestra de Empresas con Buscador, Filtros, Ordenación y Paginación */}
              {loading ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 py-20 text-center shadow-xs">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Cargando directorio de empresas de la plataforma...</p>
                </div>
              ) : (
                <DataTable<PlatformCompanyRecord>
                  data={filteredCompanies}
                  columns={companyColumns}
                  keyExtractor={(c) => c.id}
                  searchable={true}
                  searchPlaceholder="Buscar por CIF, Razón Social, Email, NIMA o Municipio..."
                  searchFilter={(c, term) => {
                    const q = term.toLowerCase().trim();
                    return Boolean(
                      (c.razon_social && c.razon_social.toLowerCase().includes(q)) ||
                      (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(q)) ||
                      (c.cif && c.cif.toLowerCase().includes(q)) ||
                      (c.nima && c.nima.toLowerCase().includes(q)) ||
                      (c.user_email && c.user_email.toLowerCase().includes(q)) ||
                      (c.municipio_social && c.municipio_social.toLowerCase().includes(q)) ||
                      (c.provincia_social && c.provincia_social.toLowerCase().includes(q))
                    );
                  }}
                  defaultPageSize={10}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialSortBy="dis_count"
                  initialSortOrder="desc"
                  emptyMessage="No se encontraron empresas con los criterios seleccionados."
                  toolbarActions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectedType('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedType === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('my')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedType === 'my'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Titulares
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('contacts')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedType === 'contacts'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Colaboradoras
                </button>
              </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'blocked')}
            className="h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
          <option value="all">Todos los Estados</option>
          <option value="active">Solo Activas</option>
          <option value="blocked">Solo Bloqueadas</option>
        </select>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Todos los Roles</option>
          <option value="gestor">Gestor de Residuos</option>
          <option value="transportista">Transportista</option>
          <option value="productor">Productor</option>
          <option value="negociante">Negociante</option>
          <option value="agente">Agente</option>
          <option value="cliente">Cliente</option>
          <option value="proveedor">Proveedor</option>
        </select>
      </div>
          }
        />
      )}

  {/* Modal de Auditoría */ }
  < CompanyAuditModal
isOpen = { isModalOpen }
onClose = {() => setIsModalOpen(false)}
auditDetail = { auditDetail }
loading = { loadingAudit }
  />

  {/* Modal Rápido de Delegación con Motivo y Caducidad */ }
{
  delegatingCompany && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Activar Delegación Temporal
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Empresa: <strong>{delegatingCompany.razon_social}</strong> ({delegatingCompany.cif}).
            Esta acción quedará registrada en auditoría y visible para el titular.
          </p>
        </div>

        <form onSubmit={handleSubmitDelegation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo / Referencia de autorización <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Ej. Contrato consultoría #2026-14 o Ticket soporte #402"
              value={delegationReason}
              onChange={(e) => setDelegationReason(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rol delegado
              </label>
              <select
                value={delegationRole}
                onChange={(e) => setDelegationRole(e.target.value as Exclude<MembershipRole, 'owner'>)}
                className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="consultor_admin">Consultor Admin</option>
                <option value="consultor_operador">Consultor Operador</option>
                <option value="lectura">Solo Lectura</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Caducidad
              </label>
              <select
                value={delegationDays}
                onChange={(e) => setDelegationDays(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value={1}>24 horas</option>
                <option value={7}>7 días</option>
                <option value={30}>30 días</option>
                <option value={365}>1 año</option>
              </select>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <input
              type="checkbox"
              checked={delegationCommercial}
              onChange={(e) => setDelegationCommercial(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            <span className="text-[11px] text-slate-700 dark:text-slate-300">
              Incluir acceso a <strong>Operaciones Comerciales</strong> (desactivado por defecto)
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDelegatingCompany(null)}
              disabled={submittingDelegation}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submittingDelegation}>
              {submittingDelegation ? 'Activando...' : 'Activar y Actuar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

{/* Modal de Confirmación de Revocación */ }
<ConfirmModal
  isOpen={Boolean(revokingCompany)}
  onClose={() => setRevokingCompany(null)}
  onConfirm={handleConfirmRevokeDelegation}
  title="Revocar delegación"
  message={`¿Seguro que deseas revocar tu delegación sobre ${revokingCompany?.razon_social || ''}?`}
  confirmLabel="Sí, revocar"
  variant="danger"
/>

{/* Modal de Bloqueo de Acceso de Empresa */ }
{
  blockingCompany && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-red-700 dark:text-red-400">
            Bloquear Acceso de Empresa
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Se suspenderá inmediatamente el acceso operativo de <strong>{blockingCompany.razon_social}</strong> ({blockingCompany.cif}) tanto en la interfaz como en las políticas RLS.
          </p>
        </div>
        <form onSubmit={handleSubmitBlockCompany} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo del bloqueo <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Ej. Suspensión temporal por impago o incidencia de seguridad"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBlockingCompany(null)}
              disabled={submittingBlock}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submittingBlock}>
              {submittingBlock ? 'Bloqueando...' : 'Confirmar bloqueo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

{/* Modal de Reactivación de Acceso */ }
<ConfirmModal
  isOpen={Boolean(activatingCompany)}
  onClose={() => setActivatingCompany(null)}
  onConfirm={handleConfirmActivateCompany}
  title="Reactivar acceso de empresa"
  message={`¿Confirmas reactivar el acceso operativo para ${activatingCompany?.razon_social || ''}?`}
  confirmLabel="Sí, activar"
  variant="primary"
/>
    </div >
  );
}
