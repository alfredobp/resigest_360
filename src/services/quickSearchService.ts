// =====================================================
// QUICK SEARCH SERVICE
// Servicio para búsqueda rápida global en el Command Palette (⌘K)
// =====================================================

import { createClient } from '@/lib/supabase/client';

export type SearchCategory = 'contracts' | 'documents' | 'companies' | 'gestores' | 'carriers';

export interface SearchRecordItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  href: string;
  badge?: string;
}

export interface TenantContext {
  userId: string;
  companyIds: number[];
}

const supabase = createClient();

/**
 * Obtiene el contexto del tenant actual (usuario autenticado y empresas asociadas)
 * para garantizar aislamiento estricto en multi-tenancy.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data: userCompanies } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id);

  const companyIds = (userCompanies || []).map((c: { id: number }) => c.id);

  return {
    userId: user.id,
    companyIds,
  };
}

export const quickSearchService = {
  /**
   * Búsqueda en tiempo real a través de registros clave del tenant
   */
  async searchRecords(rawQuery: string, limitPerCategory = 4): Promise<SearchRecordItem[]> {
    const query = rawQuery ? rawQuery.trim() : '';
    if (!query || query.length < 2) {
      return [];
    }

    const { userId, companyIds } = await getTenantContext();
    const safeQuery = query.replace(/[%_]/g, '');

    const results: SearchRecordItem[] = [];

    // Búsqueda en paralelo en entidades clave
    const [contractsRes, docsRes, companiesRes, gestoresRes, carriersRes] = await Promise.allSettled([
      // 1. Contratos de tratamiento
      (async () => {
        let q = supabase
          .from('waste_contracts')
          .select('id, contract_number, status')
          .ilike('contract_number', `%${safeQuery}%`)
          .limit(limitPerCategory);

        if (companyIds.length > 0) {
          q = q.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
        } else {
          q = q.eq('user_id', userId);
        }

        const { data, error } = await q;
        if (error || !data) return [];
        return data.map((c: { id: string | number; contract_number: string; status?: string }) => ({
          id: `contract-${c.id}`,
          title: `Contrato: ${c.contract_number || c.id}`,
          subtitle: `Estado: ${c.status || 'Activo'}`,
          category: 'contracts' as const,
          href: `/residuos/contratos/${c.id}`,
          badge: 'Contrato',
        }));
      })(),

      // 2. Documentos de identificación (DI)
      (async () => {
        const { data, error } = await supabase
          .from('identification_documents')
          .select('id, tracking_number, document_number, estado')
          .eq('user_id', userId)
          .or(`tracking_number.ilike.%${safeQuery}%,document_number.ilike.%${safeQuery}%`)
          .limit(limitPerCategory);

        if (error || !data) return [];
        return data.map((d: { id: string | number; tracking_number?: string; document_number?: string; estado?: string }) => ({
          id: `doc-${d.id}`,
          title: `DI: ${d.tracking_number || d.document_number || d.id}`,
          subtitle: d.estado ? `Estado: ${d.estado}` : 'Documento de Identificación',
          category: 'documents' as const,
          href: `/residuos/documentos-identificacion/${d.id}`,
          badge: 'DI',
        }));
      })(),

      // 3. Empresas del directorio
      (async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('id, razon_social, cif, nombre_comercial')
          .eq('user_id', userId)
          .eq('activo', true)
          .or(`razon_social.ilike.%${safeQuery}%,cif.ilike.%${safeQuery}%,nombre_comercial.ilike.%${safeQuery}%`)
          .limit(limitPerCategory);

        if (error || !data) return [];
        return data.map((comp: { id: string | number; razon_social: string; cif?: string }) => ({
          id: `comp-${comp.id}`,
          title: comp.razon_social,
          subtitle: comp.cif ? `CIF/NIF: ${comp.cif}` : 'Empresa',
          category: 'companies' as const,
          href: '/residuos/empresas',
          badge: 'Empresa',
        }));
      })(),

      // 4. Gestores de tratamiento
      (async () => {
        const { data, error } = await supabase
          .from('treatment_managers')
          .select('id, nombre, cif, numero_autorizacion')
          .eq('user_id', userId)
          .eq('activo', true)
          .or(`nombre.ilike.%${safeQuery}%,cif.ilike.%${safeQuery}%,numero_autorizacion.ilike.%${safeQuery}%`)
          .limit(limitPerCategory);

        if (error || !data) return [];
        return data.map((g: { id: string | number; nombre: string; numero_autorizacion?: string }) => ({
          id: `gestor-${g.id}`,
          title: g.nombre,
          subtitle: g.numero_autorizacion ? `Autorización: ${g.numero_autorizacion}` : 'Gestor de Residuos',
          category: 'gestores' as const,
          href: '/residuos/gestores',
          badge: 'Gestor',
        }));
      })(),

      // 5. Transportistas
      (async () => {
        const { data, error } = await supabase
          .from('carriers')
          .select('id, razon_social, nif, numero_autorizacion')
          .eq('user_id', userId)
          .eq('activo', true)
          .or(`razon_social.ilike.%${safeQuery}%,nif.ilike.%${safeQuery}%,numero_autorizacion.ilike.%${safeQuery}%`)
          .limit(limitPerCategory);

        if (error || !data) return [];
        return data.map((t: { id: string | number; razon_social: string; numero_autorizacion?: string }) => ({
          id: `carrier-${t.id}`,
          title: t.razon_social,
          subtitle: t.numero_autorizacion ? `Autorización: ${t.numero_autorizacion}` : 'Transportista',
          category: 'carriers' as const,
          href: '/residuos/transportistas',
          badge: 'Transportista',
        }));
      })(),
    ]);

    // Combinar resultados exitosos
    if (contractsRes.status === 'fulfilled') results.push(...contractsRes.value);
    if (docsRes.status === 'fulfilled') results.push(...docsRes.value);
    if (companiesRes.status === 'fulfilled') results.push(...companiesRes.value);
    if (gestoresRes.status === 'fulfilled') results.push(...gestoresRes.value);
    if (carriersRes.status === 'fulfilled') results.push(...carriersRes.value);

    return results;
  },
};
