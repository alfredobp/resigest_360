// ==============================================================================
// RESIGEST 360 - SERVICIO DE ADMINISTRACIÓN DE PLATAFORMA (SUPERADMIN)
// ==============================================================================

import { createClient } from '@/lib/supabase/client';
import type { 
  PlatformOverviewStats, 
  PlatformCompanyRecord, 
  CompanyAuditDetail,
  Company,
  ProductionCenter,
  IdentificationDocument,
  WasteContract,
  CompanyRole
} from '@/types/wasteManagement';

const ADMIN_EMAILS = [
  'alfredobape@gmail.com',
  'demo@resigest.com',
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
  process.env.NOTIFICATION_ADMIN_EMAIL || ''
].filter(Boolean).map(e => e.toLowerCase().trim());

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

    // Fallback: consultas directas paralelas
    try {
      const [compRes, usersRes, disRes, contractsRes, centersRes] = await Promise.all([
        supabase.from('companies').select('id, is_my_company', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('identification_documents').select('id, cantidad, cantidad_estimada', { count: 'exact' }),
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
        const val = parseFloat(curr.cantidad ?? curr.cantidad_estimada);
        return isNaN(val) ? acc : acc + val;
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

    // 3. Cargar conteos agregados de centros, DIs y contratos
    const [centersRes, disRes, contractsRes] = await Promise.all([
      supabase.from('production_centers').select('id, company_id'),
      supabase.from('identification_documents').select('id, company_id, gestor_id'),
      supabase.from('waste_contracts').select('id, company_id, gestor_company_id')
    ]);

    const centersByCompany = new Map<number, number>();
    (centersRes.data || []).forEach(c => {
      if (c.company_id) {
        centersByCompany.set(c.company_id, (centersByCompany.get(c.company_id) || 0) + 1);
      }
    });

    const disByCompany = new Map<number, number>();
    (disRes.data || []).forEach(d => {
      if (d.company_id) {
        disByCompany.set(d.company_id, (disByCompany.get(d.company_id) || 0) + 1);
      }
      if (d.gestor_id && d.gestor_id !== d.company_id) {
        disByCompany.set(d.gestor_id, (disByCompany.get(d.gestor_id) || 0) + 1);
      }
    });

    const contractsByCompany = new Map<number, number>();
    (contractsRes.data || []).forEach(ct => {
      if (ct.company_id) {
        contractsByCompany.set(ct.company_id, (contractsByCompany.get(ct.company_id) || 0) + 1);
      }
      if (ct.gestor_company_id && ct.gestor_company_id !== ct.company_id) {
        contractsByCompany.set(ct.gestor_company_id, (contractsByCompany.get(ct.gestor_company_id) || 0) + 1);
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
        contracts_count: contractsByCompany.get(comp.id) || 0
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

    // 4. Obtener DIs donde interviene la empresa
    const { data: dis } = await supabase
      .from('identification_documents')
      .select('*')
      .or(`company_id.eq.${companyId},gestor_id.eq.${companyId}`)
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
      const val = parseFloat(curr.cantidad ?? curr.cantidad_estimada);
      return isNaN(val) ? acc : acc + val;
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

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(detail, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const sanitizedName = (detail.company.razon_social || 'empresa').toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadAnchor.setAttribute('download', `expediente-${sanitizedName}-${detail.company.cif || detail.company.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};

export default adminPlatformService;
