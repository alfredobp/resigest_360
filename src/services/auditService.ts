import { createClient } from '@/lib/supabase/client';
import { type AuditLogAction, type AuditLogEntity, type AuditLogEntry } from '@/types/wasteManagement';

export const auditService = {
  /**
   * Registra una acción de auditoría en la base de datos de forma asíncrona y segura.
   * Si la tabla aún no existe o hay algún fallo, no interrumpe el flujo principal.
   */
  async logAction(entry: {
    company_id?: number | null;
    entidad: AuditLogEntity;
    entidad_id?: string | number | null;
    accion: AuditLogAction;
    detalles?: Record<string, any>;
    ip_address?: string;
  }): Promise<AuditLogEntry | null> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        user_id: user?.id || null,
        company_id: entry.company_id || null,
        entidad: entry.entidad,
        entidad_id: entry.entidad_id ? String(entry.entidad_id) : null,
        accion: entry.accion,
        detalles: entry.detalles || {},
        ip_address: entry.ip_address || null,
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn('auditService: no se pudo guardar el registro de auditoría:', error.message);
        return null;
      }

      return data as AuditLogEntry;
    } catch (err: any) {
      console.warn('auditService: excepción al registrar auditoría:', err.message);
      return null;
    }
  },

  /**
   * Obtiene los registros de auditoría más recientes con filtros opcionales.
   */
  async getRecentLogs(options?: {
    limit?: number;
    entidad?: AuditLogEntity;
    accion?: AuditLogAction;
    company_id?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth?.getUser?.() || { data: { user: null } };
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options?.limit || 50);

      if (authData?.user) {
        query = query.eq('user_id', authData.user.id);
      }
      if (options?.entidad) {
        query = query.eq('entidad', options.entidad);
      }
      if (options?.accion) {
        query = query.eq('accion', options.accion);
      }
      if (options?.company_id) {
        query = query.eq('company_id', options.company_id);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('auditService: error al consultar audit_logs:', error.message);
        return [];
      }

      return (data || []) as AuditLogEntry[];
    } catch (err) {
      console.warn('auditService: excepción al consultar audit_logs:', err);
      return [];
    }
  },

  /**
   * Obtiene los registros de auditoría vinculados a una entidad concreta (p.ej. un DI específico)
   */
  async getLogsForEntity(entidad: AuditLogEntity, entidad_id: string | number): Promise<AuditLogEntry[]> {
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth?.getUser?.() || { data: { user: null } };
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('entidad', entidad)
        .eq('entidad_id', String(entidad_id));

      if (authData?.user) {
        query = query.eq('user_id', authData.user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('auditService: error al obtener logs de entidad:', error.message);
        return [];
      }

      return (data || []) as AuditLogEntry[];
    } catch (err) {
      console.warn('auditService: excepción al obtener logs de entidad:', err);
      return [];
    }
  },

  /**
   * Exporta los logs de auditoría a CSV formal para inspecciones oficiales
   */
  exportLogsToCSV(logs: AuditLogEntry[]): void {
    const headers = [
      'ID',
      'Fecha UTC',
      'Entidad',
      'ID Entidad',
      'Acción Realizada',
      'Usuario ID',
      'Empresa ID',
      'Detalles JSON'
    ];

    const rows = logs.map(l => [
      l.id,
      l.created_at,
      l.entidad,
      l.entidad_id || '',
      l.accion,
      l.user_id || 'Sistema',
      l.company_id || '',
      JSON.stringify(l.detalles || {}).replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.map(val => `"${String(val)}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([`\uFEFF${  csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registro_auditoria_resigest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url);
    }
  }
};

export default auditService;
