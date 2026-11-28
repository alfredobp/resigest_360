// ==============================================================================
// RESIGEST 360 - SERVICIO DE ADMINISTRACIÓN DE PLATAFORMA (SUPERADMIN)
// ==============================================================================

import { createClient } from '@/lib/supabase/client';
import {
  delegationService,
  isDelegationActive,
  validateDelegationPayload,
} from './delegationService';
import type {
  PlatformOverviewStats,
  PlatformCompanyRecord,
  CompanyAuditDetail,
  Company,
  ProductionCenter,
  IdentificationDocument,
  WasteContract,
  CompanyRole,
  AdminDelegationSummary,
  MembershipRole,
} from '@/types/wasteManagement';

const ADMIN_EMAILS = [
  'alfredobape@gmail.com',
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
  process.env.NOTIFICATION_ADMIN_EMAIL || ''
].filter(Boolean).map(e => e.toLowerCase().trim());

/**
 * Convierte la cantidad declarada en un DI a toneladas según su unidad ('kg' -> /1000, 'toneladas'/'t' -> *1).
 */
function toMetricTons(rawQty: unknown, unit?: string | null): number {
  const val = parseFloat(String(rawQty ?? ''));
  if (Number.isNaN(val) || !Number.isFinite(val)) return 0;
  const normalizedUnit = (unit || 'kg').toLowerCase().trim();
  if (normalizedUnit === 't' || normalizedUnit === 'tm' || normalizedUnit === 'toneladas' || normalizedUnit === 'tonelada') {
    return val;
  }
  if (normalizedUnit === 'kg' || normalizedUnit === 'kilogramos' || normalizedUnit === 'kilos') {
    return val / 1000;
  }
  return 0;
}

export const adminPlatformService = {
  /**
   * Verificar si el usuario actual tiene permisos de Administrador de Plataforma
   */
  async checkIsAdmin(userEmail?: string, userId?: string): Promise<boolean> {
    const supabase = createClient();
    let email = userEmail;
    let uid = userId;

    if (!email || !uid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      email = user.email || '';
      uid = user.id;
    }

    const cleanEmail = (email || '').toLowerCase().trim();

    // 1. Verificación directa por lista de correos administradores
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      return true;
    }

    // 2. Verificación en base de datos en tabla profiles
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();

      if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
        return true;
      }
    } catch (err) {
      console.warn('Error al verificar rol en profiles:', err);
    }

    return false;
  },

  /**
   * Obtener estadísticas globales y KPIs de la plataforma
   */
  async getPlatformStats(): Promise<PlatformOverviewStats> {
    const supabase = createClient();

    // Intentar primero a través de la función RPC optimizada
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_platform_stats');
      if (!rpcError && rpcData) {
        return rpcData as PlatformOverviewStats;
      }
    } catch {
      // Continuar al fallback si el RPC no está creado aún
    }

    // Fallback: consultas directas paralelas usando columnas reales del esquema
    try {
      const [compRes, usersRes, disRes, contractsRes, centersRes] = await Promise.all([
        supabase.from('companies').select('id, is_my_company', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('identification_documents').select('id, cantidad, unidad', { count: 'exact' }),
        supabase.from('waste_contracts').select('id', { count: 'exact' }),
        supabase.from('production_centers').select('id', { count: 'exact' })
      ]);

      const companies = compRes.data || [];
      const totalCompanies = compRes.count ?? companies.length;
      const myCompanies = companies.filter(c => c.is_my_company).length;
      const totalUsers = usersRes.count ?? (usersRes.data || []).length;
      const totalDIs = disRes.count ?? (disRes.data || []).length;
      const totalContracts = contractsRes.count ?? (contractsRes.data || []).length;
      const totalCenters = centersRes.count ?? (centersRes.data || []).length;

      const totalToneladas = (disRes.data || []).reduce((acc, curr: any) => {
        const rawQty = curr.cantidad ?? curr.cantidad_estimada;
        const unit = curr.unidad ?? (curr.cantidad_estimada !== undefined && curr.cantidad === undefined ? 'toneladas' : 'toneladas');
        return acc + toMetricTons(rawQty, curr.unidad ? curr.unidad : unit);
      }, 0);

      return {
        totalCompanies,
        myCompanies,
        totalUsers,
        totalDIs,
        totalContracts,
        totalCenters,
        totalToneladas: Math.round(totalToneladas * 100) / 100
      };
    } catch (err) {
      console.error('Error al obtener estadísticas de plataforma:', err);
      return {
        totalCompanies: 0,
        myCompanies: 0,
        totalUsers: 0,
        totalDIs: 0,
        totalContracts: 0,
        totalCenters: 0,
        totalToneladas: 0
      };
    }
  },

  /**
   * Obtener listado maestro de todas las empresas de la plataforma con agregados
   */
  async getAllPlatformCompanies(params?: {
    search?: string;
    role?: string;
    type?: 'all' | 'my' | 'contacts';
  }): Promise<PlatformCompanyRecord[]> {
    const supabase = createClient();

    // 1. Cargar todas las empresas
    let query = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.type === 'my') {
      query = query.eq('is_my_company', true);
    } else if (params?.type === 'contacts') {
      query = query.eq('is_my_company', false);
    }

    const { data: rawCompanies, error: compError } = await query;
    if (compError) {
      throw new Error(`Error al cargar empresas de la plataforma: ${compError.message}`);
    }

    const companies = (rawCompanies || []) as Company[];

    // 2. Cargar perfiles de usuarios de la plataforma para mapear cuentas propietarias
    const userIds = Array.from(new Set(companies.map(c => c.user_id).filter(Boolean)));
    const profilesMap = new Map<string, { email: string; name: string; created_at: string }>();

    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, created_at')
          .in('id', userIds);

        (profiles || []).forEach(p => {
          const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email;
          profilesMap.set(p.id, {
            email: p.email || '',
            name: fullName,
            created_at: p.created_at || ''
          });
        });
      } catch (profErr) {
        console.warn('No se pudieron cargar todos los perfiles:', profErr);
      }
    }

    // 3. Cargar conteos agregados y métricas de operación (usando columnas reales del esquema)
    const [centersRes, disRes, contractsRes] = await Promise.all([
      supabase.from('production_centers').select('id, company_id'),
      supabase
        .from('identification_documents')
        .select('id, company_id, gestor_company_id, transportista_company_id, cantidad, unidad, created_at, fecha_documento'),
      supabase.from('waste_contracts').select('id, company_id, gestor_company_id, created_at')
    ]);

    const centersByCompany = new Map<number, number>();
    (centersRes.data || []).forEach(c => {
      if (c.company_id) {
        centersByCompany.set(c.company_id, (centersByCompany.get(c.company_id) || 0) + 1);
      }
    });

    const disByCompany = new Map<number, number>();
    const tonsByCompany = new Map<number, number>();
    const lastOpByCompany = new Map<number, string>();

    const updateLastOp = (companyId: number, dateStr?: string | null) => {
      if (!dateStr) return;
      const current = lastOpByCompany.get(companyId);
      if (!current || dateStr > current) {
        lastOpByCompany.set(companyId, dateStr);
      }
    };

    (disRes.data || []).forEach((d: any) => {
      const validTons = toMetricTons(d.cantidad ?? d.cantidad_estimada, d.unidad);
      const opDate = d.fecha_documento || d.created_at || null;
      const participantIds = new Set<number>();
      if (d.company_id) participantIds.add(Number(d.company_id));
      if (d.gestor_company_id) participantIds.add(Number(d.gestor_company_id));
      if (d.gestor_id) participantIds.add(Number(d.gestor_id));
      if (d.transportista_company_id) participantIds.add(Number(d.transportista_company_id));

      participantIds.forEach((cid) => {
        disByCompany.set(cid, (disByCompany.get(cid) || 0) + 1);
        tonsByCompany.set(cid, (tonsByCompany.get(cid) || 0) + validTons);
        updateLastOp(cid, opDate);
      });
    });

    const contractsByCompany = new Map<number, number>();
    (contractsRes.data || []).forEach((ct: any) => {
      if (ct.company_id) {
        contractsByCompany.set(ct.company_id, (contractsByCompany.get(ct.company_id) || 0) + 1);
        updateLastOp(ct.company_id, ct.created_at);
      }
      if (ct.gestor_company_id && ct.gestor_company_id !== ct.company_id) {
        contractsByCompany.set(ct.gestor_company_id, (contractsByCompany.get(ct.gestor_company_id) || 0) + 1);
        updateLastOp(ct.gestor_company_id, ct.created_at);
      }
    });

    // 4. Mapear datos finales
    let records: PlatformCompanyRecord[] = companies.map(comp => {
      const prof = comp.user_id ? profilesMap.get(comp.user_id) : undefined;
      return {
        ...comp,
        user_email: prof?.email || 'Desconocido',
        user_name: prof?.name || 'Usuario',
        user_created_at: prof?.created_at,
        centers_count: centersByCompany.get(comp.id) || 0,
        dis_count: disByCompany.get(comp.id) || 0,
        contracts_count: contractsByCompany.get(comp.id) || 0,
        total_toneladas: Math.round((tonsByCompany.get(comp.id) || 0) * 100) / 100,
        last_operation_at: lastOpByCompany.get(comp.id) || null,
      };
    });

    // 5. Filtrar por búsqueda si aplica
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      records = records.filter(c =>
        (c.razon_social && c.razon_social.toLowerCase().includes(q)) ||
        (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(q)) ||
        (c.cif && c.cif.toLowerCase().includes(q)) ||
        (c.nima && c.nima.toLowerCase().includes(q)) ||
        (c.user_email && c.user_email.toLowerCase().includes(q)) ||
        (c.municipio_social && c.municipio_social.toLowerCase().includes(q)) ||
        (c.provincia_social && c.provincia_social.toLowerCase().includes(q))
      );
    }

    // 6. Filtrar por rol si aplica
    if (params?.role && params.role !== 'all') {
      records = records.filter(c => {
        const roles = Array.isArray(c.roles) && c.roles.length > 0
          ? c.roles
          : (c.tipo_empresa ? [c.tipo_empresa] : ['productor']);
        return roles.includes(params.role as CompanyRole);
      });
    }

    return records;
  },

  /**
   * Obtener detalle completo de auditoría y datos de una empresa específica
   */
  async getCompanyAuditDetail(companyId: number): Promise<CompanyAuditDetail> {
    const supabase = createClient();

    // 1. Obtener datos de la empresa
    const { data: company, error: compErr } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (compErr || !company) {
      throw new Error(`Empresa no encontrada: ${compErr?.message || 'ID inválido'}`);
    }

    // 2. Obtener perfil del usuario titular
    let userProfile = null;
    if (company.user_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', company.user_id)
        .maybeSingle();
      userProfile = prof || null;
    }

    // 3. Obtener centros de producción / instalaciones
    const { data: centers } = await supabase
      .from('production_centers')
      .select('*')
      .eq('company_id', companyId)
      .order('nombre', { ascending: true });

    // 4. Obtener DIs donde interviene la empresa (productor, gestor o transportista)
    const { data: dis } = await supabase
      .from('identification_documents')
      .select('*')
      .or(`company_id.eq.${companyId},gestor_company_id.eq.${companyId},transportista_company_id.eq.${companyId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    // 5. Obtener contratos donde interviene la empresa
    const { data: contracts } = await supabase
      .from('waste_contracts')
      .select('*')
      .or(`company_id.eq.${companyId},gestor_company_id.eq.${companyId}`)
      .order('created_at', { ascending: false });

    // 6. Obtener autorizaciones ambientales si la tabla existe
    let authorizations: any[] = [];
    try {
      const { data: auths } = await supabase
        .from('environmental_authorizations')
        .select('*')
        .eq('company_id', companyId);
      authorizations = auths || [];
    } catch {
      // Silenciar si no existe la tabla
    }

    const totalTons = (dis || []).reduce((acc, curr: any) => {
      const rawQty = curr.cantidad ?? curr.cantidad_estimada;
      const unit = curr.unidad ?? 'toneladas';
      return acc + toMetricTons(rawQty, unit);
    }, 0);

    return {
      company: company as Company,
      userProfile,
      productionCenters: (centers || []) as ProductionCenter[],
      recentDIs: (dis || []) as IdentificationDocument[],
      contracts: (contracts || []) as WasteContract[],
      authorizations,
      stats: {
        totalDIs: (dis || []).length,
        totalContracts: (contracts || []).length,
        totalCenters: (centers || []).length,
        totalTonsEstimated: Math.round(totalTons * 100) / 100
      }
    };
  },

  /**
   * Exportar todo el directorio de empresas de la plataforma a archivo CSV
   */
  exportCompaniesCSV(companies: PlatformCompanyRecord[]): void {
    if (!companies || companies.length === 0) return;

    const headers = [
      'ID',
      'Razón Social',
      'Nombre Comercial',
      'CIF',
      'NIMA',
      'Nº Autorización',
      'Roles',
      'Empresa Titular',
      'Email Cuenta',
      'Teléfono',
      'Email Contacto',
      'Municipio',
      'Provincia',
      'Centros Registrados',
      'DIs Registrados',
      'Contratos Registrados',
      'Estado',
      'Fecha Creación'
    ];

    const rows = companies.map(c => [
      c.id,
      `"${(c.razon_social || '').replace(/"/g, '""')}"`,
      `"${(c.nombre_comercial || '').replace(/"/g, '""')}"`,
      `"${c.cif || ''}"`,
      `"${c.nima || ''}"`,
      `"${c.numero_autorizacion || ''}"`,
      `"${(Array.isArray(c.roles) ? c.roles.join(', ') : c.tipo_empresa || '')}"`,
      c.is_my_company ? 'Sí' : 'No',
      `"${c.user_email || ''}"`,
      `"${c.telefono || ''}"`,
      `"${c.email || ''}"`,
      `"${c.municipio_social || ''}"`,
      `"${c.provincia_social || ''}"`,
      c.centers_count || 0,
      c.dis_count || 0,
      c.contracts_count || 0,
      c.activo !== false ? 'Activo' : 'Inactivo',
      c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES') : ''
    ]);

    const csvContent = `\uFEFF${[headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `empresas-plataforma-resigest360-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Exportar el expediente y datos completos de una empresa a JSON estructurado
   */
  exportCompanyDataJSON(detail: CompanyAuditDetail): void {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(detail, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const sanitizedName = (detail.company.razon_social || 'empresa').toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadAnchor.setAttribute('download', `expediente-${sanitizedName}-${detail.company.cif || detail.company.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  /**
   * Obtiene el mapa de delegaciones activas o caducadas del administrador actual.
   */
  async getAdminDelegations(): Promise<Record<number, AdminDelegationSummary>> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {};
    }

    const authorized = await this.checkIsAdmin(user.email || '', user.id);
    if (!authorized) {
      throw new Error('Acceso denegado: Se requieren permisos de Administrador de Plataforma.');
    }

    const { data, error } = await supabase
      .from('company_memberships')
      .select(
        'company_id, role, can_view_commercial, expires_at, delegation_reason, terms_accepted_at, created_at, updated_at'
      )
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Error al cargar delegaciones del administrador: ${error.message}`);
    }

    const map: Record<number, AdminDelegationSummary> = {};
    (data || []).forEach((row: any) => {
      if (!row?.company_id) return;
      map[row.company_id] = {
        company_id: row.company_id,
        role: (row.role as MembershipRole) || 'consultor_admin',
        can_view_commercial: Boolean(row.can_view_commercial),
        expires_at: row.expires_at ?? null,
        delegation_reason: row.delegation_reason ?? null,
        terms_accepted_at: row.terms_accepted_at ?? null,
        is_active: isDelegationActive(row.expires_at ?? null),
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    return map;
  },

  /**
   * Activa o actualiza la delegación explícita del administrador sobre una empresa titular
   * exigiendo motivo/referencia y fecha de caducidad futura.
   */
  async delegateCompanyToSelf(
    companyId: number,
    options: {
      role?: Exclude<MembershipRole, 'owner'>;
      canViewCommercial?: boolean;
      expiresAt: string;
      reason: string;
    }
  ): Promise<AdminDelegationSummary> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const authorized = await this.checkIsAdmin(user.email || '', user.id);
    if (!authorized) {
      throw new Error('Acceso denegado: Se requieren permisos de Administrador de Plataforma.');
    }

    const role = options.role || 'consultor_admin';
    const canViewCommercial = Boolean(options.canViewCommercial);

    validateDelegationPayload(
      {
        companyId,
        role,
        canViewCommercial,
        expiresAt: options.expiresAt,
        reason: options.reason,
        termsAccepted: false,
      },
      { requireTermsAcceptance: false, requireReason: true }
    );

    const record = await delegationService.grantPilotDelegation(
      {
        companyId,
        role,
        canViewCommercial,
        expiresAt: options.expiresAt,
        reason: options.reason.trim(),
        termsAccepted: false,
        delegateEmail: user.email || undefined,
      },
      { requireTermsAcceptance: false, requireReason: true }
    );

    return {
      company_id: record.company_id,
      role: record.role,
      can_view_commercial: Boolean(record.can_view_commercial),
      expires_at: record.expires_at ?? null,
      delegation_reason: record.delegation_reason ?? options.reason.trim(),
      terms_accepted_at: record.terms_accepted_at ?? null,
      is_active: isDelegationActive(record.expires_at ?? null),
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  },

  /**
   * Revoca la delegación activa del administrador sobre una empresa.
   */
  async revokeAdminDelegation(companyId: number): Promise<void> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const authorized = await this.checkIsAdmin(user.email || '', user.id);
    if (!authorized) {
      throw new Error('Acceso denegado: Se requieren permisos de Administrador de Plataforma.');
    }

    await delegationService.revokeDelegation(companyId, user.id);
  },

  /**
   * Bloquea o reactiva el acceso operativo de una empresa en la plataforma (vía RPC auditada).
   */
  async setCompanyAccessStatus(
    companyId: number,
    active: boolean,
    reason?: string
  ): Promise<{ id: number; activo: boolean; blocked_at: string | null; blocked_reason: string | null }> {
    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw new Error('Identificador de empresa inválido.');
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const authorized = await this.checkIsAdmin(user.email || '', user.id);
    if (!authorized) {
      throw new Error('Acceso denegado: Se requieren permisos de Administrador de Plataforma.');
    }

    if (!active && !reason?.trim()) {
      throw new Error('Debes indicar un motivo para bloquear el acceso de la empresa.');
    }

    const { data, error } = await supabase.rpc('set_company_access_status', {
      p_company_id: companyId,
      p_active: active,
      p_reason: reason?.trim() || null,
    });

    if (error || !data) {
      throw new Error(
        `No se pudo ${active ? 'activar' : 'bloquear'} la empresa: ${error?.message || 'Error desconocido'}`
      );
    }

    return data as {
      id: number;
      activo: boolean;
      blocked_at: string | null;
      blocked_reason: string | null;
    };
  }
};

export default adminPlatformService;
