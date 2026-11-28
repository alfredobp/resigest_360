// =====================================================
// QUICK SEARCH SERVICE
// Servicio para búsqueda rápida global en el Command Palette (⌘K)
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { getActiveCompanyCookie } from '@/services/tenantContextService';
import type { AppModule } from '@/types/wasteManagement';

export type SearchCategory =
  | 'contracts'
  | 'documents'
  | 'deca'
  | 'companies'
  | 'gestores'
  | 'carriers'
  | 'drivers'
  | 'vehicles';

export interface QuickSearchOptions {
  allowedModules?: AppModule[];
}

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
  const activeCompanyId = getActiveCompanyCookie();
  if (activeCompanyId && !companyIds.includes(activeCompanyId)) {
    companyIds.push(activeCompanyId);
  }

  return {
    userId: user.id,
    companyIds,
  };
}

export const quickSearchService = {
  /**
   * Búsqueda en tiempo real a través de registros clave del tenant
   */
  async searchRecords(
    rawQuery: string,
    limitPerCategory = 4,
    options?: QuickSearchOptions
  ): Promise<SearchRecordItem[]> {
    const query = rawQuery ? rawQuery.trim() : '';
    if (!query || query.length < 2) {
      return [];
    }

    const canQueryModule = (mod: AppModule): boolean => {
      if (!options?.allowedModules) return true;
      return options.allowedModules.includes(mod);
    };

    const { userId, companyIds } = await getTenantContext();
    const safeQuery = query.replace(/[%_(),]/g, '').trim();
    if (!safeQuery || safeQuery.length < 2) {
      return [];
    }

    const results: SearchRecordItem[] = [];

    // Búsqueda en paralelo en entidades clave según módulos habilitados
    const [
      contractsRes,
      docsRes,
      companiesRes,
      gestoresRes,
      carriersRes,
      driversRes,
      vehiclesRes,
      decaRes,
    ] = await Promise.allSettled([
      // 1. Contratos de tratamiento
      (async () => {
        if (!canQueryModule('contratos')) return [];
        let q = supabase
          .from('waste_contracts')
          .select('id, numero_contrato, estado')
          .ilike('numero_contrato', `%${safeQuery}%`)
          .limit(limitPerCategory);

        if (companyIds.length > 0) {
          q = q.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
        } else {
          q = q.eq('user_id', userId);
        }

        const { data, error } = await q;
        if (error || !data) return [];
        return data.map((c: { id: string | number; numero_contrato?: string; contract_number?: string; estado?: string; status?: string }) => ({
          id: `contract-${c.id}`,
          title: `Contrato: ${c.numero_contrato || c.contract_number || c.id}`,
          subtitle: `Estado: ${c.estado || c.status || 'Activo'}`,
          category: 'contracts' as const,
          href: `/residuos/contratos/${c.id}`,
          badge: 'Contrato',
        }));
      })(),

      // 2. Documentos de identificación (DI) — por código, LER, matrícula, contraparte y fecha (Hito C.3)
      (async () => {
        if (!canQueryModule('di')) return [];
        const { data, error } = await supabase
          .from('identification_documents')
          .select('id, numero_documento, codigo_ler, descripcion_residuo, estado, estado_traslado, transportista_matricula, productor_razon_social, gestor_razon_social, fecha_documento')
          .eq('user_id', userId)
          .or(
            `numero_documento.ilike.%${safeQuery}%,codigo_ler.ilike.%${safeQuery}%,descripcion_residuo.ilike.%${safeQuery}%,transportista_matricula.ilike.%${safeQuery}%,productor_razon_social.ilike.%${safeQuery}%,gestor_razon_social.ilike.%${safeQuery}%,transportista_razon_social.ilike.%${safeQuery}%`
          )
          .limit(limitPerCategory);

        if (error || !data) return [];
        return data.map((d: any) => {
          const statusText = d.estado_traslado || d.estado;
          const metaParts = [
            statusText ? `Estado: ${statusText}` : null,
            d.transportista_matricula ? `Matrícula: ${d.transportista_matricula}` : null,
            d.gestor_razon_social || d.productor_razon_social || null,
            d.fecha_documento || null,
          ].filter(Boolean);
          return {
            id: `doc-${d.id}`,
            title: `DI: ${d.numero_documento || d.tracking_number || d.document_number || d.id}`,
            subtitle: metaParts.length > 0 ? metaParts.join(' · ') : 'Documento de Identificación',
            category: 'documents' as const,
            href: `/residuos/documentos-identificacion/${d.id}`,
            badge: 'DI',
          };
        });
      })(),

      // 3. Empresas del directorio
      (async () => {
        if (!canQueryModule('empresas')) return [];
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
        if (!canQueryModule('gestores')) return [];
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
        if (!canQueryModule('flota_transporte')) return [];
        const { data, error } = await supabase
          .from('carriers')
          .select('id, razon_social, cif, numero_autorizacion')
          .eq('user_id', userId)
          .eq('activo', true)
          .or(`razon_social.ilike.%${safeQuery}%,cif.ilike.%${safeQuery}%,numero_autorizacion.ilike.%${safeQuery}%`)
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

      // 6. Conductores de flota
      (async () => {
        if (!canQueryModule('flota_transporte')) return [];
        const { data, error } = await supabase
          .from('carrier_drivers')
          .select('id, nombre, dni, telefono, vehiculo_asignado, remolque_asignado')
          .eq('user_id', userId)
          .eq('activo', true)
          .or(
            `nombre.ilike.%${safeQuery}%,dni.ilike.%${safeQuery}%,vehiculo_asignado.ilike.%${safeQuery}%,remolque_asignado.ilike.%${safeQuery}%`
          )
          .limit(limitPerCategory);

        if (error || !data) return [];
        return data.map(
          (d: {
            id: string | number;
            nombre: string;
            dni?: string | null;
            vehiculo_asignado?: string | null;
          }) => {
            const meta = [d.dni ? `DNI: ${d.dni}` : null, d.vehiculo_asignado ? `Vehículo: ${d.vehiculo_asignado}` : null]
              .filter(Boolean)
              .join(' · ');
            return {
              id: `driver-${d.id}`,
              title: d.nombre,
              subtitle: meta || 'Conductor de flota',
              category: 'drivers' as const,
              href: `/residuos/flota?tab=conductores&q=${encodeURIComponent(d.dni || d.nombre)}`,
              badge: 'Conductor',
            };
          }
        );
      })(),

      // 7. Vehículos de flota
      (async () => {
        if (!canQueryModule('flota_transporte')) return [];
        const { data, error } = await supabase
          .from('carrier_vehicles')
          .select('id, matricula, tipo, marca_modelo, remolque_habitual')
          .eq('user_id', userId)
          .eq('activo', true)
          .or(
            `matricula.ilike.%${safeQuery}%,remolque_habitual.ilike.%${safeQuery}%,marca_modelo.ilike.%${safeQuery}%,tarjeta_transporte.ilike.%${safeQuery}%`
          )
          .limit(limitPerCategory);

        if (error || !data) return [];
        return data.map(
          (v: {
            id: string | number;
            matricula: string;
            tipo?: string | null;
            marca_modelo?: string | null;
            remolque_habitual?: string | null;
          }) => {
            const meta = [
              v.tipo || 'Vehículo',
              v.marca_modelo || null,
              v.remolque_habitual ? `Remolque: ${v.remolque_habitual}` : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return {
              id: `vehicle-${v.id}`,
              title: v.matricula,
              subtitle: meta,
              category: 'vehicles' as const,
              href: `/residuos/flota?tab=vehiculos&q=${encodeURIComponent(v.matricula)}`,
              badge: 'Vehículo',
            };
          }
        );
      })(),

      // 8. Documentos de Control Administrativo (DeCA) — Todas las versiones por código, matrícula, contraparte y LER (Hito C.3)
      (async () => {
        if (!canQueryModule('deca')) return [];
        const { data, error } = await supabase
          .from('deca_documents')
          .select('id, numero_deca, version, is_vigente, estado, matricula_tractora, cargador_razon_social, transportista_razon_social, codigo_ler, fecha_transporte, token')
          .eq('user_id', userId)
          .or(
            `numero_deca.ilike.%${safeQuery}%,matricula_tractora.ilike.%${safeQuery}%,cargador_razon_social.ilike.%${safeQuery}%,transportista_razon_social.ilike.%${safeQuery}%,codigo_ler.ilike.%${safeQuery}%`
          )
          .limit(limitPerCategory);

        if (error || !data) return [];
        return data.map((d: any) => {
          const verTag = `v${d.version || 1}${d.is_vigente === false ? ' · Histórica' : ''}`;
          const metaParts = [
            d.matricula_tractora ? `Matrícula: ${d.matricula_tractora}` : null,
            d.cargador_razon_social || null,
            d.codigo_ler ? `LER ${d.codigo_ler}` : null,
            d.fecha_transporte || null,
          ].filter(Boolean);
          return {
            id: `deca-${d.id}`,
            title: `DeCA: ${d.numero_deca || d.id} (${verTag})`,
            subtitle: metaParts.length > 0 ? metaParts.join(' · ') : 'Control de Transporte DeCA',
            category: 'deca' as const,
            href: d.token ? `/mobile/deca/${d.token}` : '/residuos/deca',
            badge: d.is_vigente === false ? `DeCA v${d.version} (Hist.)` : `DeCA v${d.version || 1}`,
          };
        });
      })(),
    ]);

    // Combinar resultados exitosos
    if (contractsRes.status === 'fulfilled') results.push(...contractsRes.value);
    if (docsRes.status === 'fulfilled') results.push(...docsRes.value);
    if (decaRes.status === 'fulfilled') results.push(...decaRes.value);
    if (companiesRes.status === 'fulfilled') results.push(...companiesRes.value);
    if (gestoresRes.status === 'fulfilled') results.push(...gestoresRes.value);
    if (carriersRes.status === 'fulfilled') results.push(...carriersRes.value);
    if (driversRes.status === 'fulfilled') results.push(...driversRes.value);
    if (vehiclesRes.status === 'fulfilled') results.push(...vehiclesRes.value);

    return results;
  },
};
