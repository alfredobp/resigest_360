'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';
import CompanyAuditModal from '@/components/admin/CompanyAuditModal';
import adminPlatformService from '@/services/adminPlatformService';
import type { 
  PlatformOverviewStats, 
  PlatformCompanyRecord, 
  CompanyAuditDetail,
  CompanyRole 
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

  // Estados de carga y autorización
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos
  const [stats, setStats] = useState<PlatformOverviewStats | null>(null);
  const [companies, setCompanies] = useState<PlatformCompanyRecord[]>([]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'my' | 'contacts'>('all');

  // Modal de auditoría
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setSelectedCompanyId] = useState<number | null>(null);
  const [auditDetail, setAuditDetail] = useState<CompanyAuditDetail | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

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

  // 2. Cargar métricas y listado de empresas
  const loadPlatformData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, companiesData] = await Promise.all([
        adminPlatformService.getPlatformStats(),
        adminPlatformService.getAllPlatformCompanies()
      ]);

      setStats(statsData);
      setCompanies(companiesData);
    } catch (err: any) {
      console.error('Error al cargar datos globales:', err);
      setError(err.message || 'Error al obtener la información de la plataforma.');
    } finally {
      setLoading(false);
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

  // 5. Filtrado en memoria
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      // Filtro por tipo
      if (selectedType === 'my' && !c.is_my_company) return false;
      if (selectedType === 'contacts' && c.is_my_company) return false;

      // Filtro por rol
      if (selectedRole !== 'all') {
        const roles = Array.isArray(c.roles) && c.roles.length > 0 
          ? c.roles 
          : (c.tipo_empresa ? [c.tipo_empresa] : ['productor']);
        if (!roles.includes(selectedRole as CompanyRole)) return false;
      }

      // Filtro por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = (c.razon_social && c.razon_social.toLowerCase().includes(q)) ||
          (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(q)) ||
          (c.cif && c.cif.toLowerCase().includes(q)) ||
          (c.nima && c.nima.toLowerCase().includes(q)) ||
          (c.user_email && c.user_email.toLowerCase().includes(q)) ||
          (c.municipio_social && c.municipio_social.toLowerCase().includes(q)) ||
          (c.provincia_social && c.provincia_social.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [companies, selectedType, selectedRole, searchQuery]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-gray-500">Verificando credenciales de Superadministrador...</p>
        </div>
      </div>
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Supervisión Global de Plataforma
            </h1>
            <Badge variant="solid" color="primary">
              Modo Administrador
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Empresas</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : (stats?.totalCompanies || companies.length)}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {stats?.myCompanies || 0} cuentas titulares
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cuentas Usuario</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-primary">
              {loading ? '...' : (stats?.totalUsers || 0)}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Perfiles registrados</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">DIs Globales</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-success-600">
              {loading ? '...' : (stats?.totalDIs || 0)}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Docs. Identificación</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Toneladas Est.</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-warning-600">
              {loading ? '...' : (stats?.totalToneladas || 0)}
            </span>
            <span className="text-xs font-medium text-gray-400">t</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Volumen declarado</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Contratos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : (stats?.totalContracts || 0)}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">RD 553/2020</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Centros Registrados</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : (stats?.totalCenters || 0)}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Instalaciones</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar por CIF, Razón Social, Email de cuenta, NIMA o Municipio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por tipo de empresa */}
            <div className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setSelectedType('my')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedType === 'my'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                Titulares
              </button>
              <button
                onClick={() => setSelectedType('contacts')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedType === 'contacts'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                Colaboradoras
              </button>
            </div>

            {/* Filtro por Rol */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        </div>
      </div>

      {/* Tabla Maestra de Empresas de la Plataforma */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Cargando directorio de empresas de la plataforma...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            No se encontraron empresas con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Empresa</th>
                  <th className="px-4 py-3.5">Identificación Fiscal</th>
                  <th className="px-4 py-3.5">Roles Activos</th>
                  <th className="px-4 py-3.5">Cuenta Propietaria</th>
                  <th className="px-4 py-3.5 text-center">Métricas</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-normal">
                {filteredCompanies.map((c) => {
                  const roles: CompanyRole[] = Array.isArray(c.roles) && c.roles.length > 0 
                    ? c.roles 
                    : (c.tipo_empresa ? [c.tipo_empresa as CompanyRole] : ['productor']);

                  return (
                    <tr 
                      key={c.id} 
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Empresa */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                            {c.razon_social?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {c.razon_social}
                              </span>
                              {c.is_my_company && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                                  Titular
                                </span>
                              )}
                            </div>
                            {c.nombre_comercial && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {c.nombre_comercial}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-400">
                              {c.municipio_social ? `${c.municipio_social} (${c.provincia_social || ''})` : 'Ubicación no especificada'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CIF & NIMA */}
                      <td className="px-4 py-4 font-mono text-[11px]">
                        <span className="font-bold text-gray-800 dark:text-gray-200 block">
                          {c.cif}
                        </span>
                        {c.nima ? (
                          <span className="text-gray-500 block">NIMA: {c.nima}</span>
                        ) : (
                          <span className="text-gray-400 block italic">Sin NIMA</span>
                        )}
                      </td>

                      {/* Roles */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {roles.map(r => (
                            <Badge key={r} variant="light" color={ROLE_BADGE_CONFIG[r]?.color || 'primary'} size="sm">
                              {ROLE_BADGE_CONFIG[r]?.label || r}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      {/* Cuenta Propietaria */}
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-800 dark:text-gray-200 block truncate max-w-[160px]">
                          {c.user_name || 'Usuario'}
                        </span>
                        <span className="text-gray-500 text-[11px] block truncate max-w-[160px]">
                          {c.user_email || 'N/A'}
                        </span>
                      </td>

                      {/* Métricas Agregadas */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span title="Centros registrados" className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                            🏭 {c.centers_count || 0}
                          </span>
                          <span title="Documentos de identificación" className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                            📄 {c.dis_count || 0}
                          </span>
                          <span title="Contratos de tratamiento" className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                            📝 {c.contracts_count || 0}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-4">
                        <Badge variant="light" color={c.activo !== false ? 'success' : 'error'} size="sm">
                          {c.activo !== false ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAudit(c.id)}
                          className="text-xs"
                        >
                          Auditar y Obtener Datos
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Auditoría */}
      <CompanyAuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        auditDetail={auditDetail}
        loading={loadingAudit}
      />
    </div>
  );
}
