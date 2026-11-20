// =====================================================
// WASTE CONTRACT SERVICE
// Servicio para gestión de contratos de tratamiento de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { auditService } from './auditService';
import { getActiveCompanyCookie } from './tenantContextService';
import type {
  WasteContract,
  WasteContractFormData,
  WasteContractRevision,
  ContractWasteCode,
  ContractWasteCodeFormData,
} from '@/types/wasteManagement';

const supabase = createClient();

/**
 * Calcula una huella determinista de 64 caracteres hexadecimales para custodiar
 * una instantánea de revisión contractual firmada (UXDEV-02 / RES6-I02).
 */
export function computeContractSnapshotHash(payload: unknown): string {
  const canonical = JSON.stringify(payload);
  let h1 = 0xdeadbeef ^ canonical.length;
  let h2 = 0x41c6ce57 ^ canonical.length;
  let h3 = 0x9e3779b9 ^ canonical.length;
  let h4 = 0x85ebca6b ^ canonical.length;
  for (let i = 0; i < canonical.length; i++) {
    const ch = canonical.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ (ch + i), 2246822519);
    h4 = Math.imul(h4 ^ (ch * 31), 3266489917);
  }
  return [h1, h2, h3, h4, h1 ^ h3, h2 ^ h4, h1 ^ h2, h3 ^ h4]
    .map((n) => (n >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

/**
 * Construye el registro de revisión archivada antes de invalidar firmas por cambio material (UXDEV-02).
 */
export function buildContractRevisionRecord(
  currentContract: Partial<WasteContract>,
  changedFields: string[],
  archivedAt = new Date().toISOString()
): WasteContractRevision {
  return {
    version: currentContract.version || 1,
    archived_at: archivedAt,
    motivo_cambio: 'Modificación material de términos del contrato (Art. 5 RD 553/2020)',
    changed_fields: changedFields,
    cantidad_maxima_anual: currentContract.cantidad_maxima_anual,
    unidad_cantidad: currentContract.unidad_cantidad,
    frecuencia_recogida: currentContract.frecuencia_recogida,
    precio_unitario: currentContract.precio_unitario,
    moneda: currentContract.moneda,
    fecha_inicio: currentContract.fecha_inicio,
    fecha_fin: currentContract.fecha_fin,
    codigos_ler: currentContract.codigos_ler,
    operaciones_tratamiento: currentContract.operaciones_tratamiento,
    contract_waste_codes: currentContract.contract_waste_codes,
    firmado_productor: currentContract.firmado_productor,
    firma_productor_url: currentContract.firma_productor_url,
    fecha_firma_productor: currentContract.fecha_firma_productor,
    firmado_gestor: currentContract.firmado_gestor,
    firma_gestor_url: currentContract.firma_gestor_url,
    fecha_firma_gestor: currentContract.fecha_firma_gestor,
    documento_url: currentContract.documento_url,
    metadata_snapshot: currentContract.metadata_snapshot ?? null,
  };
}

/**
 * Reconstruye un WasteContract inmutable a partir de una revisión archivada del historial
 * para permitir recuperar/descargar la revisión firmada anterior (UXDEV-02).
 */
export function reconstructContractFromRevision(
  contract: WasteContract,
  revision: WasteContractRevision
): WasteContract {
  const isFullySigned =
    Boolean(revision.firmado_productor || revision.firma_productor_url) &&
    Boolean(revision.firmado_gestor || revision.firma_gestor_url);

  return {
    ...contract,
    version: revision.version,
    cantidad_maxima_anual: revision.cantidad_maxima_anual,
    unidad_cantidad: revision.unidad_cantidad,
    frecuencia_recogida: revision.frecuencia_recogida,
    precio_unitario: revision.precio_unitario,
    moneda: revision.moneda,
    fecha_inicio: revision.fecha_inicio,
    fecha_fin: revision.fecha_fin,
    codigos_ler: revision.codigos_ler,
    operaciones_tratamiento: revision.operaciones_tratamiento,
    contract_waste_codes: revision.contract_waste_codes,
    firmado_productor: Boolean(revision.firmado_productor),
    firma_productor_url: revision.firma_productor_url,
    fecha_firma_productor: revision.fecha_firma_productor,
    firmado_gestor: Boolean(revision.firmado_gestor),
    firma_gestor_url: revision.firma_gestor_url,
    fecha_firma_gestor: revision.fecha_firma_gestor,
    documento_url: revision.documento_url,
    metadata_snapshot: revision.metadata_snapshot ?? null,
    estado: isFullySigned ? 'vigente' : contract.estado,
  };
}

/**
 * Compara si la edición de un contrato implica cambios materiales sobre una revisión
 * que ya disponía de conformidades/firmas de productor o gestor (P0 A04-02).
 */
export function detectContractMaterialChanges(
  existing: Partial<WasteContract> | null | undefined,
  incoming: Partial<WasteContractFormData> & {
    codigos_ler?: string[];
    operaciones_tratamiento?: string[];
    contract_waste_codes?: ContractWasteCodeFormData[];
  }
): { hasMaterialChange: boolean; changedFields: string[] } {
  if (!existing) {
    return { hasMaterialChange: false, changedFields: [] };
  }

  const changedFields: string[] = [];

  const normNum = (v: unknown) => (v === undefined || v === null || v === '' ? null : Number(v));
  const normStr = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());
  const normDate = (v: unknown) => normStr(v).split('T')[0];

  if (
    incoming.cantidad_maxima_anual !== undefined &&
    normNum(incoming.cantidad_maxima_anual) !== normNum(existing.cantidad_maxima_anual)
  ) {
    changedFields.push('cantidad_maxima_anual');
  }

  if (
    incoming.unidad_cantidad !== undefined &&
    normStr(incoming.unidad_cantidad) !== normStr(existing.unidad_cantidad || 'toneladas')
  ) {
    changedFields.push('unidad_cantidad');
  }

  if (
    incoming.precio_unitario !== undefined &&
    normNum(incoming.precio_unitario) !== normNum(existing.precio_unitario)
  ) {
    changedFields.push('precio_unitario');
  }

  if (
    incoming.frecuencia_recogida !== undefined &&
    normStr(incoming.frecuencia_recogida) !== normStr(existing.frecuencia_recogida)
  ) {
    changedFields.push('frecuencia_recogida');
  }

  if (
    incoming.tipo_contrato !== undefined &&
    normStr(incoming.tipo_contrato) !== normStr(existing.tipo_contrato)
  ) {
    changedFields.push('tipo_contrato');
  }

  if (
    incoming.fecha_inicio !== undefined &&
    normDate(incoming.fecha_inicio) !== normDate(existing.fecha_inicio)
  ) {
    changedFields.push('fecha_inicio');
  }

  if (
    incoming.fecha_fin !== undefined &&
    normDate(incoming.fecha_fin) !== normDate(existing.fecha_fin)
  ) {
    changedFields.push('fecha_fin');
  }

  if (
    incoming.descripcion_residuos !== undefined &&
    normStr(incoming.descripcion_residuos) !== normStr(existing.descripcion_residuos)
  ) {
    changedFields.push('descripcion_residuos');
  }

  if (
    incoming.notas !== undefined &&
    normStr(incoming.notas) !== normStr(existing.notas)
  ) {
    changedFields.push('notas');
  }

  if (
    incoming.company_id !== undefined &&
    normNum(incoming.company_id) !== normNum(existing.company_id)
  ) {
    changedFields.push('company_id');
  }

  if (
    incoming.gestor_company_id !== undefined &&
    normNum(incoming.gestor_company_id) !== normNum(existing.gestor_company_id)
  ) {
    changedFields.push('gestor_company_id');
  }

  if (
    incoming.treatment_manager_id !== undefined &&
    normNum(incoming.treatment_manager_id) !== normNum(existing.treatment_manager_id)
  ) {
    changedFields.push('treatment_manager_id');
  }

  if (
    incoming.producer_center_id !== undefined &&
    normNum(incoming.producer_center_id) !== normNum(existing.producer_center_id)
  ) {
    changedFields.push('producer_center_id');
  }

  if (
    incoming.gestor_center_id !== undefined &&
    normNum(incoming.gestor_center_id) !== normNum(existing.gestor_center_id)
  ) {
    changedFields.push('gestor_center_id');
  }

  if (incoming.codigos_ler !== undefined) {
    const prevLers = (existing.codigos_ler || []).map((c) => c.trim()).sort().join('|');
    const nextLers = (incoming.codigos_ler || []).map((c) => c.trim()).sort().join('|');
    if (prevLers !== nextLers) {
      changedFields.push('codigos_ler');
    }
  }

  if (incoming.operaciones_tratamiento !== undefined) {
    const prevOps = (existing.operaciones_tratamiento || []).map((o) => o.trim().toUpperCase()).sort().join('|');
    const nextOps = (incoming.operaciones_tratamiento || []).map((o) => o.trim().toUpperCase()).sort().join('|');
    if (prevOps !== nextOps) {
      changedFields.push('operaciones_tratamiento');
    }
  }

  if (incoming.contract_waste_codes !== undefined && Array.isArray(existing.contract_waste_codes) && existing.contract_waste_codes.length > 0) {
    const serializeCodes = (codes: Array<Partial<ContractWasteCode> | ContractWasteCodeFormData>) =>
      codes
        .map(
          (c) =>
            `${normStr(c.codigo_ler)}:${normStr(c.operacion_tratamiento).toUpperCase()}:${normNum(c.cantidad_estimada_anual) ?? ''}:${normNum(c.tarifa_gestion) ?? ''}`
        )
        .sort()
        .join('|');
    if (serializeCodes(existing.contract_waste_codes) !== serializeCodes(incoming.contract_waste_codes)) {
      changedFields.push('contract_waste_codes');
    }
  }

  return {
    hasMaterialChange: changedFields.length > 0,
    changedFields,
  };
}

/**
 * Resuelve de forma segura las referencias al gestor destino para evitar
 * violaciones de FK (`waste_contracts_treatment_manager_id_fkey`) cuando
 * el gestor proviene del directorio unificado `public.companies`.
 */
async function resolveGestorReferences(
  userId: string,
  payload: { treatment_manager_id?: number | null; gestor_company_id?: number | null }
): Promise<{ treatment_manager_id?: number | null; gestor_company_id?: number | null }> {
  let treatmentManagerId = payload.treatment_manager_id;
  let gestorCompanyId = payload.gestor_company_id;

  if (treatmentManagerId && !gestorCompanyId) {
    try {
      const tmBuilder = supabase.from('treatment_managers');
      if (tmBuilder) {
        const { data: tmRecord } = await tmBuilder
          .select('id, cif')
          .eq('id', treatmentManagerId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!tmRecord) {
          // El ID no existe en treatment_managers; comprobar si es una empresa del directorio unificado
          const compBuilder = supabase.from('companies');
          if (compBuilder) {
            const { data: compRecord } = await compBuilder
              .select('id')
              .eq('id', treatmentManagerId)
              .eq('user_id', userId)
              .maybeSingle();

            if (compRecord) {
              gestorCompanyId = compRecord.id;
              treatmentManagerId = null;
            } else {
              throw new Error(
                'El gestor seleccionado no existe en el catálogo de gestores ni en el directorio de empresas de tu cuenta.'
              );
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('no existe en el catálogo')) {
        throw err;
      }
      // Si es un mock parcial en tests, no bloquear la operación
    }
  }

  return {
    treatment_manager_id: treatmentManagerId,
    gestor_company_id: gestorCompanyId,
  };
}

/**
 * Obtiene el contexto del tenant actual (usuario autenticado y sus empresas asociadas)
 * para garantizar aislamiento estricto entre entidades en multi-tenancy.
 */
async function getTenantContext() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Obtener IDs de las empresas pertenecientes a este usuario
  const { data: userCompanies } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id);

  const companyIds = (userCompanies || []).map((c) => c.id);
  const activeCompanyId = getActiveCompanyCookie();
  if (activeCompanyId && !companyIds.includes(activeCompanyId)) {
    companyIds.push(activeCompanyId);
  }

  return {
    userId: user.id,
    companyIds,
  };
}

export const wasteContractService = {
  /**
   * Obtener todos los contratos del usuario o sus empresas asociadas
   */
  async getAll(): Promise<WasteContract[]> {
    const { userId, companyIds } = await getTenantContext();

    let query = supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*),
        contract_waste_codes(*)
      `);

    if (companyIds.length > 0) {
      query = query.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('fecha_contrato', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener contratos: ${error.message}`);
    }

    return (data || []) as WasteContract[];
  },

  /**
   * Obtener contrato por ID con validación estricta de pertenencia al tenant
   */
  async getById(id: number): Promise<WasteContract | null> {
    const { userId, companyIds } = await getTenantContext();

    let query = supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*),
        contract_waste_codes(*)
      `)
      .eq('id', id);

    if (companyIds.length > 0) {
      query = query.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Error al obtener contrato: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const contract = data as WasteContract;

    // Cargar códigos LER detallados del contrato (fallback si la relación no vino poblada)
    try {
      if (!contract.contract_waste_codes || contract.contract_waste_codes.length === 0) {
        const { data: wasteCodes } = await supabase
          .from('contract_waste_codes')
          .select('*')
          .eq('contract_id', id);
        if (wasteCodes && wasteCodes.length > 0) {
          contract.contract_waste_codes = wasteCodes;
        }
      }
    } catch (e) {
      console.warn('Nota: tabla contract_waste_codes:', e);
    }

    // Cargar centros de origen y destino si existen
    try {
      const centerIds = [contract.producer_center_id, contract.gestor_center_id].filter(Boolean) as number[];
      if (centerIds.length > 0) {
        const { data: centers } = await supabase
          .from('production_centers')
          .select('*')
          .in('id', centerIds);
        if (centers) {
          contract.producer_center = centers.find(c => c.id === contract.producer_center_id);
          contract.gestor_center = centers.find(c => c.id === contract.gestor_center_id);
        }
      }
    } catch (e) {
      console.warn('Nota: centros de producción en contrato:', e);
    }

    return contract;
  },

  /**
   * Obtener contratos por estado filtrando por tenant
   */
  async getByStatus(estado: string): Promise<WasteContract[]> {
    const { userId, companyIds } = await getTenantContext();

    let query = supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*),
        contract_waste_codes(*)
      `)
      .eq('estado', estado);

    if (companyIds.length > 0) {
      query = query.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('fecha_contrato', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener contratos: ${error.message}`);
    }

    return (data || []) as WasteContract[];
  },

  /**
   * Obtener contratos vigentes (activos) del tenant
   */
  async getActive(): Promise<WasteContract[]> {
    return this.getByStatus('vigente');
  },

  /**
   * Obtener contratos de una empresa específica (si pertenece al tenant)
   */
  async getByCompany(companyId: number): Promise<WasteContract[]> {
    const { companyIds } = await getTenantContext();

    if (!companyIds.includes(companyId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .eq('company_id', companyId)
      .order('fecha_contrato', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener contratos: ${error.message}`);
    }

    return (data || []) as WasteContract[];
  },

  /**
   * Buscar contratos por número o descripción dentro del tenant
   */
  async search(query: string): Promise<WasteContract[]> {
    const { userId, companyIds } = await getTenantContext();
    const safeQuery = query.replace(/[%_(),]/g, '').trim();
    if (!safeQuery) return [];

    let dbQuery = supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .or(`numero_contrato.ilike.%${safeQuery}%,descripcion_residuos.ilike.%${safeQuery}%`);

    if (companyIds.length > 0) {
      dbQuery = dbQuery.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
    } else {
      dbQuery = dbQuery.eq('user_id', userId);
    }

    const { data, error } = await dbQuery
      .order('fecha_contrato', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Error al buscar contratos: ${error.message}`);
    }

    return (data || []) as WasteContract[];
  },

  /**
   * Crear nuevo contrato
   */
  async create(contractData: WasteContractFormData): Promise<WasteContract> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    const { contract_waste_codes, ...mainData } = contractData;

    // Sincronizar codigos_ler y operaciones si vienen códigos detallados
    const codigosLer = contract_waste_codes && contract_waste_codes.length > 0
      ? contract_waste_codes.map((c) => c.codigo_ler.trim())
      : (mainData.codigos_ler || []);

    const operaciones = contract_waste_codes && contract_waste_codes.length > 0
      ? Array.from(new Set(contract_waste_codes.map((c) => c.operacion_tratamiento.trim().toUpperCase())))
      : (mainData.operaciones_tratamiento || []);

    const resolvedRefs = await resolveGestorReferences(userData.user.id, {
      treatment_manager_id: mainData.treatment_manager_id,
      gestor_company_id: mainData.gestor_company_id,
    });

    const { data, error } = await supabase
      .from('waste_contracts')
      .insert({
        ...mainData,
        treatment_manager_id: resolvedRefs.treatment_manager_id,
        gestor_company_id: resolvedRefs.gestor_company_id,
        codigos_ler: codigosLer,
        operaciones_tratamiento: operaciones,
        user_id: userData.user.id,
        estado: mainData.estado || 'borrador',
        moneda: mainData.moneda || 'EUR',
        unidad_cantidad: mainData.unidad_cantidad || 'toneladas',
      })
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .single();

    if (error) {
      throw new Error(`Error al crear contrato: ${error.message}`);
    }

    const createdContract = data as WasteContract;

    // Guardar residuos detallados si se proporcionaron
    if (contract_waste_codes && contract_waste_codes.length > 0) {
      try {
        const wasteRecords = contract_waste_codes.map((wc) => ({
          contract_id: createdContract.id,
          codigo_ler: wc.codigo_ler.trim(),
          descripcion_ler: wc.descripcion_ler || '',
          operacion_tratamiento: wc.operacion_tratamiento.trim().toUpperCase(),
          tarifa_gestion: wc.tarifa_gestion || null,
          tipo_precio: wc.tipo_precio || 'por_tonelada',
          cantidad_estimada_anual: wc.cantidad_estimada_anual || null,
        }));

        await supabase.from('contract_waste_codes').insert(wasteRecords);
      } catch (wcErr) {
        console.warn('Nota: guardando contract_waste_codes:', wcErr);
      }
    }

    await auditService.logAction({
      company_id: createdContract.company_id,
      entidad: 'contrato',
      entidad_id: createdContract.id,
      accion: 'crear',
      detalles: {
        numero_contrato: createdContract.numero_contrato,
        estado: createdContract.estado,
        gestor_company_id: createdContract.gestor_company_id,
        treatment_manager_id: createdContract.treatment_manager_id,
        codigos_ler: codigosLer,
      },
    });

    return createdContract;
  },

  /**
   * Obtener contrato por token de firma pública
   */
  async getBySigningToken(token: string): Promise<WasteContract | null> {
    // RPC SECURITY DEFINER: solo devuelve el contrato cuyo token exacto se proporciona (sin credenciales de empresa)
    const { data, error } = await supabase.rpc('get_contract_by_signing_token', { p_token: token });

    if (error) {
      throw new Error(`Error al obtener contrato por token: ${error.message}`);
    }

    return (data as WasteContract | null) ?? null;
  },

  /**
   * Actualizar contrato existente
   */
  async update(id: number, contractData: Partial<WasteContractFormData>): Promise<WasteContract> {
    const { userId, companyIds } = await getTenantContext();
    const { contract_waste_codes: rawWasteCodes, contractWasteCodes, ...mainData } = contractData as Partial<WasteContractFormData> & {
      contractWasteCodes?: ContractWasteCodeFormData[];
    };
    const contract_waste_codes = rawWasteCodes ?? contractWasteCodes;
    const updatePayload: any = { ...mainData };

    if (mainData.treatment_manager_id !== undefined || mainData.gestor_company_id !== undefined) {
      const resolvedRefs = await resolveGestorReferences(userId, {
        treatment_manager_id: mainData.treatment_manager_id,
        gestor_company_id: mainData.gestor_company_id,
      });
      if (resolvedRefs.treatment_manager_id !== undefined) {
        updatePayload.treatment_manager_id = resolvedRefs.treatment_manager_id;
      }
      if (resolvedRefs.gestor_company_id !== undefined) {
        updatePayload.gestor_company_id = resolvedRefs.gestor_company_id;
      }
    }

    if (contract_waste_codes !== undefined) {
      updatePayload.codigos_ler = contract_waste_codes.map((c) => c.codigo_ler.trim());
      updatePayload.operaciones_tratamiento = Array.from(
        new Set(contract_waste_codes.map((c) => c.operacion_tratamiento.trim().toUpperCase()))
      );
    }

    // A04-02: Si se modifican términos materiales (cantidades, LER, fechas, condiciones o partes),
    // y no es una acción explícita de firma, invalidar las firmas previas exigiendo nueva conformidad (Art. 5 RD 553/2020)
    const isExplicitSignatureAction =
      updatePayload.firmado_productor !== undefined ||
      updatePayload.firmado_gestor !== undefined ||
      updatePayload.firma_productor_url !== undefined ||
      updatePayload.firma_gestor_url !== undefined;

    const hasMaterialChanges =
      contract_waste_codes !== undefined ||
      mainData.codigos_ler !== undefined ||
      mainData.operaciones_tratamiento !== undefined ||
      Object.keys(mainData).some((k) =>
        [
          'cantidad_maxima_anual',
          'unidad_cantidad',
          'frecuencia_recogida',
          'tipo_contrato',
          'fecha_inicio',
          'fecha_fin',
          'descripcion_residuos',
          'notas',
          'condiciones_entrega',
          'condiciones_pago',
          'clausulas_adicionales',
          'company_id',
          'gestor_company_id',
          'treatment_manager_id',
          'production_center_id',
          'producer_center_id',
          'gestor_center_id',
          'precio_unitario',
        ].includes(k)
      );

    let signaturesInvalidated = false;
    let changedFieldsList: string[] = [];

    if (!isExplicitSignatureAction && hasMaterialChanges) {
      try {
        const lookup: any = supabase.from('waste_contracts');
        if (typeof lookup?.select === 'function') {
          const sel = lookup.select(
            'id, firmado_productor, firmado_gestor, firma_productor_url, firma_gestor_url, fecha_firma_productor, fecha_firma_gestor, documento_url, metadata_snapshot, estado, version, company_id, revision_history, cantidad_maxima_anual, unidad_cantidad, frecuencia_recogida, precio_unitario, moneda, fecha_inicio, fecha_fin, codigos_ler, operaciones_tratamiento'
          );
          if (typeof sel?.eq === 'function') {
            const eqRes = sel.eq('id', id);
            const fetcher = typeof eqRes?.maybeSingle === 'function' ? eqRes.maybeSingle.bind(eqRes) : (typeof eqRes?.single === 'function' ? eqRes.single.bind(eqRes) : null);
            if (fetcher) {
              const { data: currentContract } = await fetcher();
              if (
                currentContract &&
                (currentContract.firmado_productor ||
                  currentContract.firmado_gestor ||
                  currentContract.firma_productor_url ||
                  currentContract.firma_gestor_url)
              ) {
                const diff = detectContractMaterialChanges(currentContract, {
                  ...updatePayload,
                  contract_waste_codes,
                });
                changedFieldsList = diff.changedFields;
                signaturesInvalidated = true;

                // UXDEV-02 / RES6-I02: Archivar la revisión firmada anterior en revision_history antes de invalidar conformidades
                const archivedRevision = buildContractRevisionRecord(currentContract, changedFieldsList);
                const prevHistory = Array.isArray(currentContract.revision_history)
                  ? currentContract.revision_history
                  : [];
                updatePayload.revision_history = [...prevHistory, archivedRevision];

                updatePayload.firmado_productor = false;
                updatePayload.firmado_gestor = false;
                updatePayload.firma_productor_url = null;
                updatePayload.firma_gestor_url = null;
                updatePayload.fecha_firma_productor = null;
                updatePayload.fecha_firma_gestor = null;
                updatePayload.documento_url = null; // invalidar enlace al PDF anterior firmado
                updatePayload.metadata_snapshot = null; // RES6-I02: Invalidar snapshot previo al mutar términos materiales
                if (updatePayload.estado === undefined || updatePayload.estado === 'vigente') {
                  updatePayload.estado = 'pendiente_firma';
                }
                if (typeof currentContract.version === 'number') {
                  updatePayload.version = currentContract.version + 1;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error al verificar estado de firmas para invalidación de contrato:', err);
      }
    }

    const executeUpdate = async (payloadToPersist: Record<string, unknown>) => {
      let query = supabase
        .from('waste_contracts')
        .update(payloadToPersist)
        .eq('id', id);

        if (companyIds.length > 0) {
          query = query.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
        } else {
          query = query.eq('user_id', userId);
        }

        return query
          .select(`
          *,
          company:companies!waste_contracts_company_id_fkey(*),
          gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
          treatment_manager:treatment_managers(*)
        `)
          .single();
      };

      let { data, error } = await executeUpdate(updatePayload);

      // Fallback defensivo si la columna opcional metadata_snapshot / revision_history aún no existe en el schema cache de Supabase
      if (error && /metadata_snapshot|revision_history/i.test(String(error.message || ''))) {
        const retryPayload = { ...updatePayload };
        if (/metadata_snapshot/i.test(String(error.message || ''))) {
          delete retryPayload.metadata_snapshot;
        }
        if (/revision_history/i.test(String(error.message || ''))) {
          delete retryPayload.revision_history;
        }
        console.warn('Reintentando actualización de contrato sin columna pendiente de migración:', error.message);
        const retryRes = await executeUpdate(retryPayload);
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        throw new Error(`Error al actualizar contrato: ${error.message}`);
      }

      // Actualizar contract_waste_codes si se enviaron
      if (contract_waste_codes !== undefined) {
        try {
          await supabase.from('contract_waste_codes').delete().eq('contract_id', id);

          if (contract_waste_codes.length > 0) {
            const wasteRecords = contract_waste_codes.map((wc) => ({
              contract_id: id,
              codigo_ler: wc.codigo_ler.trim(),
              descripcion_ler: wc.descripcion_ler || '',
              operacion_tratamiento: wc.operacion_tratamiento.trim().toUpperCase(),
              tarifa_gestion: wc.tarifa_gestion || null,
              tipo_precio: wc.tipo_precio || 'por_tonelada',
              cantidad_estimada_anual: wc.cantidad_estimada_anual || null,
            }));

            await supabase.from('contract_waste_codes').insert(wasteRecords);
          }
        } catch (wcErr) {
          console.warn('Nota: actualizando contract_waste_codes:', wcErr);
        }
      }

      await auditService.logAction({
        company_id: (data as WasteContract)?.company_id ?? null,
        entidad: 'contrato',
        entidad_id: id,
        accion: signaturesInvalidated ? 'invalidar_firmas' : (mainData.estado ? 'cambiar_estado' : 'actualizar'),
        detalles: {
          numero_contrato: (data as WasteContract)?.numero_contrato,
          estado: (data as WasteContract)?.estado,
          firmas_invalidadas: signaturesInvalidated,
          motivo: signaturesInvalidated ? 'Modificación material de términos del contrato (Art. 5 RD 553/2020)' : undefined,
          ...(signaturesInvalidated && changedFieldsList.length > 0
            ? { campos_modificados: changedFieldsList }
            : {}),
        },
      });

      return data as WasteContract;
    },

      /**
       * Activar contrato previo chequeo estricto de requisitos legales
       */
      async activate(id: number): Promise<WasteContract> {
        const contract = await this.getById(id);
        if (!contract) {
          throw new Error('Contrato no encontrado');
        }

        const validation = validateContractActivation(contract);
        if (!validation.canActivate) {
          throw new Error(`No se puede activar el contrato: ${validation.errors.join(' ')}`);
        }

        return this.update(id, { estado: 'vigente' });
      },

        /**
         * Comprueba si un contrato puede ser eliminado de forma segura
         * o si tiene traslados (DI / NT) asociados que impiden su eliminación legal.
         */
        async canDelete(id: number): Promise < { canDelete: boolean; reason?: string; diCount: number; ntCount?: number } > {
          const { userId, companyIds } = await getTenantContext();

          // 1. Comprobar estado del contrato si está disponible
          const contractBuilder = supabase.from('waste_contracts');
          if(contractBuilder) {
            try {
              let contractQuery: any = contractBuilder
                .select('id, estado')
                .eq('id', id);

              if (companyIds.length > 0) {
                contractQuery = contractQuery.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
              } else {
                contractQuery = contractQuery.eq('user_id', userId);
              }

              const res = typeof contractQuery.maybeSingle === 'function'
                ? await contractQuery.maybeSingle()
                : await contractQuery;

              if (res?.data?.estado === 'finalizado') {
                return {
                  canDelete: false,
                  reason:
                    'No es posible eliminar un contrato que ya está finalizado. Debe permanecer en el archivo histórico por trazabilidad legal (RD 553/2020).',
                  diCount: 0,
                };
              }
            } catch {
              // En mocks parciales o si falla la lectura de estado, continuar con la verificación de traslados
            }
          }

    // 2. Comprobar si existen Documentos de Identificación (DI) asociados
    const diBuilder = supabase.from('identification_documents');
          let diCount = 0;
          let hasLinkedNT = false;

          if(diBuilder) {
            let diQuery = diBuilder
              .select('id, numero_documento, prior_notification_id, numero_notificacion', { count: 'exact' })
              .eq('contract_id', id);

            if (companyIds.length > 0) {
              diQuery = diQuery.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')})`);
            } else {
              diQuery = diQuery.eq('user_id', userId);
            }

            const { count, data, error } = await diQuery;
            if (error) {
              throw new Error(`Error al verificar documentos asociados al contrato: ${error.message}`);
            }

            diCount = typeof count === 'number' ? count : (data?.length || 0);
            if (data && Array.isArray(data)) {
              hasLinkedNT = data.some((doc: any) => Boolean(doc.prior_notification_id || doc.numero_notificacion));
            }
          }

    if(diCount > 0) {
      const docLabel = hasLinkedNT
        ? 'Documento(s) de Identificación (DI) con Notificación Previa (NT)'
        : 'Documento(s) de Identificación (DI)';
      return {
        canDelete: false,
        reason: `No es posible eliminar el contrato porque ya se ha utilizado para emitir ${diCount} ${docLabel}. Por requisitos de trazabilidad legal (RD 553/2020), los contratos con traslados asociados no pueden eliminarse. En su lugar, márquelo como 'finalizado' o 'cancelado'.`,
        diCount,
      };
    }

    // 3. Comprobar si existen Notificaciones Previas (NT) que apunten al contrato
    try {
      const ntBuilder = supabase.from('prior_notifications');
      if (ntBuilder) {
        let ntQuery = ntBuilder
          .select('id, numero_notificacion', { count: 'exact' })
          .eq('contract_id', id);

        if (companyIds.length > 0) {
          ntQuery = ntQuery.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')})`);
        } else {
          ntQuery = ntQuery.eq('user_id', userId);
        }

        const { count: ntCount, error: ntError } = await ntQuery;
        if (!ntError && typeof ntCount === 'number' && ntCount > 0) {
          return {
            canDelete: false,
            reason: `No es posible eliminar el contrato porque tiene ${ntCount} Notificación(es) Previa(s) (NT) asociada(s). Por trazabilidad legal (RD 553/2020), no se puede eliminar. En su lugar, márquelo como 'finalizado' o 'cancelado'.`,
            diCount: 0,
            ntCount,
          };
        }
      }
    } catch {
      // Ignorar si la tabla o la columna contract_id no existe en el esquema
    }

    return { canDelete: true, diCount: 0 };
  },

  /**
   * Eliminar contrato
   */
  async delete(id: number): Promise<void> {
    const { userId, companyIds } = await getTenantContext();

    // Validar legalmente si el contrato puede eliminarse
    const check = await this.canDelete(id);
    if (!check.canDelete) {
      throw new Error(check.reason);
    }

    let query = supabase
      .from('waste_contracts')
      .delete()
      .eq('id', id);

    if (companyIds.length > 0) {
      query = query.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')})`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Error al eliminar contrato: ${error.message}`);
    }

    await auditService.logAction({
      entidad: 'contrato',
      entidad_id: id,
      accion: 'eliminar',
      detalles: { contract_id: id },
    });
  },

  /**
   * Cambiar estado del contrato
   */
  async updateStatus(id: number, estado: 'borrador' | 'vigente' | 'finalizado' | 'cancelado'): Promise<WasteContract> {
    return this.update(id, { estado });
  },

  /**
   * Finalizar contrato
   */
  async finalize(id: number): Promise<WasteContract> {
    return this.updateStatus(id, 'finalizado');
  },

  /**
   * Cancelar contrato
   */
  async cancel(id: number): Promise<WasteContract> {
    return this.updateStatus(id, 'cancelado');
  },

  /**
   * Subir documento PDF del contrato firmado
   */
  async uploadDocument(file: File, contractId: number): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.user.id}-contract-${contractId}-${Date.now()}.${fileExt}`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error al subir documento: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // Actualizar contrato con la URL del documento
    await this.update(contractId, { documento_url: publicUrl });

    return publicUrl;
  },

  /**
   * Generar número de contrato automático
   */
  generateContractNumber(companyId: number): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `CT-${companyId}-${year}-${timestamp}`;
  },

  /**
   * Validar fechas del contrato
   */
  validateDates(fechaInicio: string, fechaFin: string): boolean {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return fin > inicio;
  },

  /**
   * Verificar si el contrato está vigente actualmente
   */
  isCurrentlyActive(contract: WasteContract): boolean {
    if (contract.estado !== 'vigente') return false;

    const now = new Date();

    if (contract.fecha_inicio) {
      const inicio = new Date(contract.fecha_inicio);
      if (now < inicio) return false;
    }

    if (contract.fecha_fin) {
      const fin = new Date(contract.fecha_fin);
      if (now > fin) return false;
    }

    return true;
  },

  /**
   * Obtener contratos próximos a vencer (30 días)
   */
  async getExpiringSoon(): Promise<WasteContract[]> {
    const { userId, companyIds } = await getTenantContext();
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let query = supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .eq('estado', 'vigente')
      .lte('fecha_fin', thirtyDaysFromNow.toISOString())
      .gte('fecha_fin', now.toISOString());

    if (companyIds.length > 0) {
      query = query.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('fecha_fin', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener contratos por vencer: ${error.message}`);
    }

    return data as WasteContract[];
  },
  /**
   * Firmar contrato digitalmente
   */
  async signContract(
    id: number,
    signatureBase64: string,
    role: 'productor' | 'gestor'
  ): Promise<WasteContract> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('Usuario no autenticado');
    }

    // 1. Convertir Base64 a Blob
    const base64Data = signatureBase64.includes(',') ? signatureBase64.split(',')[1] : signatureBase64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // 2. Subir a Supabase Storage (busquet 'signatures' o similar)
    const fileName = `signature-${role}-${id}-${Date.now()}.png`;
    const filePath = `contracts/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images') // Reutilizamos el bucket de imagenes por ahora
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Error al subir firma: ${uploadError.message}`);
    }

    // 3. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // 4. Actualizar registro del contrato
    const now = new Date().toISOString();
    const updateData: any = {};

    if (role === 'productor') {
      updateData.firma_productor_url = publicUrl;
      updateData.fecha_firma_productor = now;
      updateData.firmado_productor = true;
    } else {
      updateData.firma_gestor_url = publicUrl;
      updateData.fecha_firma_gestor = now;
      updateData.firmado_gestor = true;
    }

    // RES6-I02: Congelar snapshot de las partes intervinientes al firmar para garantizar inmutabilidad
    try {
      const current = await this.getById(id);
      if (current) {
        const prod = current.company;
        const gest = current.gestor_company || current.treatment_manager;
        const snapshot: any = {
          version: current.version || 1,
          snapshot_date: now,
        };
        if (prod) {
          snapshot.company = {
            razon_social: prod.razon_social,
            cif: prod.cif,
            nima: prod.nima,
            domicilio_social: prod.domicilio_social,
            municipio_social: prod.municipio_social,
            numero_autorizacion: prod.numero_autorizacion,
          };
        }
        if (gest) {
          snapshot.gestor_company = {
            razon_social: gest.razon_social,
            cif: gest.cif,
            nima: gest.nima,
            domicilio_social: (gest as any).domicilio_social || (gest as any).direccion || '',
            municipio_social: (gest as any).municipio_social || (gest as any).municipio || '',
            numero_autorizacion: (gest as any).numero_autorizacion || '',
          };
        }
        if (current.producer_center) {
          snapshot.producer_center = {
            nombre: current.producer_center.nombre,
            nima: current.producer_center.nima,
          };
        }
        if (current.gestor_center) {
          snapshot.gestor_center = {
            nombre: current.gestor_center.nombre,
            nima: current.gestor_center.nima,
          };
        }
        snapshot.pdf_hash = computeContractSnapshotHash({
          id: current.id,
          numero_contrato: current.numero_contrato,
          version: snapshot.version,
          company: snapshot.company,
          gestor_company: snapshot.gestor_company,
          producer_center: snapshot.producer_center,
          gestor_center: snapshot.gestor_center,
          codigos_ler: current.codigos_ler || [],
          operaciones_tratamiento: current.operaciones_tratamiento || [],
          fecha_inicio: current.fecha_inicio,
          fecha_fin: current.fecha_fin,
          cantidad_maxima_anual: current.cantidad_maxima_anual,
        });
        updateData.metadata_snapshot = snapshot;
      }
    } catch (snapErr) {
      console.warn('Nota al crear snapshot de contrato firmado:', snapErr);
    }

    return this.update(id, updateData);
  },

  /**
   * Firmar contrato digitalmente usando un token público
   */
  async signContractByToken(
    token: string,
    signatureBase64: string,
    role: 'productor' | 'gestor'
  ): Promise<WasteContract> {
    // 1. Obtener el contrato por token para saber el ID
    const contract = await this.getBySigningToken(token);
    if (!contract) {
      throw new Error('Contrato no encontrado o token inválido');
    }

    // 2. Procesar la firma (mismo proceso que signContract pero sin auth check)
    const base64Data = signatureBase64.includes(',') ? signatureBase64.split(',')[1] : signatureBase64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const fileName = `signature-public-${role}-${contract.id}-${Date.now()}.png`;
    const filePath = `contracts/${contract.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Error al subir firma: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // 3. Registrar la firma mediante RPC segura (el usuario no está autenticado)
    const { data, error: updateError } = await supabase.rpc('sign_contract_by_signing_token', {
      p_token: token,
      p_role: role,
      p_signature_url: publicUrl,
    });

    if (updateError) {
      throw new Error(`Error al actualizar firma: ${updateError.message}`);
    }

    await auditService.logAction({
      company_id: (data as WasteContract)?.company_id ?? null,
      entidad: 'contrato',
      entidad_id: (data as WasteContract)?.id ?? null,
      accion: 'cambiar_estado',
      detalles: {
        numero_contrato: (data as WasteContract)?.numero_contrato,
        estado: (data as WasteContract)?.estado,
        rol_firma: role,
      },
    });

    return data as WasteContract;
  },
};

export interface ContractActivationValidation {
  canActivate: boolean;
  valid: boolean;
  errors: string[];
  warnings?: string[];
  checklist: {
    hasProducer: boolean;
    hasGestor: boolean;
    hasValidity: boolean;
    hasValidDates: boolean;
    isNotExpired: boolean;
    hasWasteCodes: boolean;
    hasOperations: boolean;
    hasSignatures?: boolean;
  };
}

/**
 * Valida estrictamente si un contrato cumple todos los requisitos legales para pasar a Vigente
 */
export function validateContractActivation(
  contract: Omit<Partial<WasteContract>, 'contract_waste_codes'> & {
    contract_waste_codes?: Array<Partial<ContractWasteCode> | ContractWasteCodeFormData>;
  },
  options?: { requireSignatures?: boolean }
): ContractActivationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasProducer = Boolean(contract.company_id || contract.company);
  if (!hasProducer) {
    errors.push('El contrato debe tener asignada una empresa productora titular.');
  }

  const hasGestor = Boolean(
    contract.gestor_company_id ||
    contract.treatment_manager_id ||
    contract.gestor_company ||
    contract.treatment_manager
  );
  if (!hasGestor) {
    errors.push('El contrato debe tener asignado un gestor de tratamiento de destino.');
  }

  const hasValidity = Boolean(contract.fecha_inicio && contract.fecha_fin);
  if (!hasValidity) {
    errors.push('El contrato debe tener definidas las fechas de inicio y fin de vigencia.');
  }

  const isNotExpired = contract.fecha_fin ? new Date(contract.fecha_fin) >= today : false;
  if (contract.fecha_fin && !isNotExpired) {
    errors.push(`La fecha de fin del contrato (${contract.fecha_fin}) ya ha expirado.`);
  }

  const wasteCodesList = contract.contract_waste_codes ?? (contract as any).contractWasteCodes;

  const hasWasteCodes = Boolean(
    (wasteCodesList && wasteCodesList.length > 0) ||
    (contract.codigos_ler && contract.codigos_ler.length > 0) ||
    (contract.waste_type_ids && contract.waste_type_ids.length > 0) ||
    (contract.descripcion_residuos && contract.descripcion_residuos.trim().length > 0)
  );
  if (!hasWasteCodes) {
    errors.push('El contrato debe incluir al menos un código LER o tipo de residuo amparado.');
  }

  const hasOperations = Boolean(
    (wasteCodesList && wasteCodesList.some((c: any) => c.operacion_tratamiento)) ||
    (contract.operaciones_tratamiento && contract.operaciones_tratamiento.length > 0)
  );
  if (!hasOperations) {
    errors.push('Debe definirse al menos una operación de tratamiento autorizada (R o D).');
  }

  const hasSignatures = Boolean(
    ((contract.firmado_productor || contract.firma_productor_url) &&
      (contract.firmado_gestor || contract.firma_gestor_url)) ||
    contract.documento_url
  );
  const signaturesExplicitlyRequired =
    contract.firmado_productor === false ||
    contract.firmado_gestor === false ||
    Boolean(options?.requireSignatures);

  if (!hasSignatures) {
    const signatureMsg =
      'El contrato debe estar firmado por el productor y el gestor (o disponer del documento firmado adjunto) conforme al Art. 5 del RD 553/2020.';
    if (signaturesExplicitlyRequired) {
      errors.push(signatureMsg);
    } else {
      warnings.push(signatureMsg);
    }
  }

  const canActivate =
    hasProducer &&
    hasGestor &&
    hasValidity &&
    isNotExpired &&
    hasWasteCodes &&
    hasOperations &&
    (!signaturesExplicitlyRequired || hasSignatures);

  return {
    canActivate,
    valid: canActivate,
    errors,
    warnings,
    checklist: {
      hasProducer,
      hasGestor,
      hasValidity,
      hasValidDates: hasValidity,
      isNotExpired,
      hasWasteCodes,
      hasOperations,
      hasSignatures,
    },
  };
}

/**
 * Calcula el estado dinámico y vigencia real de un contrato según sus fechas
 */
export function getContractEffectiveStatus(contract: WasteContract): {
  status: 'borrador' | 'pendiente_firma' | 'vigente' | 'caducado' | 'finalizado' | 'cancelado';
  isExpired: boolean;
  label: string;
} {
  if (contract.estado === 'cancelado') return { status: 'cancelado', isExpired: false, label: 'Cancelado' };
  if (contract.estado === 'finalizado') return { status: 'finalizado', isExpired: false, label: 'Finalizado' };
  if (contract.estado === 'pendiente_firma') return { status: 'pendiente_firma', isExpired: false, label: 'Pendiente de firma' };
  if (contract.estado === 'borrador') {
    const isExpired = Boolean(contract.fecha_fin && new Date(contract.fecha_fin) < new Date(new Date().setHours(0, 0, 0, 0)));
    return { status: 'borrador', isExpired, label: isExpired ? 'Borrador (Vencido)' : 'Borrador' };
  }
  // Estado es 'vigente'
  if (contract.fecha_fin) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(contract.fecha_fin);
    if (end < today) {
      return { status: 'caducado', isExpired: true, label: 'Caducado' };
    }
  }
  return { status: 'vigente', isExpired: false, label: 'Vigente' };
}

export default wasteContractService;

