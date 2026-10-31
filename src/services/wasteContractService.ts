// =====================================================
// WASTE CONTRACT SERVICE
// Servicio para gestión de contratos de tratamiento de residuos
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type {
  WasteContract,
  WasteContractFormData,
  ContractWasteCode,
  ContractWasteCodeFormData,
} from '@/types/wasteManagement';

const supabase = createClient();

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

    let dbQuery = supabase
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .or(`numero_contrato.ilike.%${query}%,descripcion_residuos.ilike.%${query}%`);

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

    const { data, error } = await supabase
      .from('waste_contracts')
      .insert({
        ...mainData,
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

    if (contract_waste_codes !== undefined) {
      updatePayload.codigos_ler = contract_waste_codes.map((c) => c.codigo_ler.trim());
      updatePayload.operaciones_tratamiento = Array.from(
        new Set(contract_waste_codes.map((c) => c.operacion_tratamiento.trim().toUpperCase()))
      );
    }

    let query = supabase
      .from('waste_contracts')
      .update(updatePayload)
      .eq('id', id);

    if (companyIds.length > 0) {
      query = query.or(`user_id.eq.${userId},company_id.in.(${companyIds.join(',')}),gestor_company_id.in.(${companyIds.join(',')})`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*)
      `)
      .single();

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
   * Eliminar contrato
   */
  async delete(id: number): Promise<void> {
    const { userId, companyIds } = await getTenantContext();

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
    } else {
      updateData.firma_gestor_url = publicUrl;
      updateData.fecha_firma_gestor = now;
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

    return data as WasteContract;
  },
};

export interface ContractActivationValidation {
  canActivate: boolean;
  valid: boolean;
  errors: string[];
  checklist: {
    hasProducer: boolean;
    hasGestor: boolean;
    hasValidity: boolean;
    hasValidDates: boolean;
    isNotExpired: boolean;
    hasWasteCodes: boolean;
    hasOperations: boolean;
  };
}

/**
 * Valida estrictamente si un contrato cumple todos los requisitos legales para pasar a Vigente
 */
export function validateContractActivation(
  contract: Omit<Partial<WasteContract>, 'contract_waste_codes'> & {
    contract_waste_codes?: Array<Partial<ContractWasteCode> | ContractWasteCodeFormData>;
  }
): ContractActivationValidation {
  const errors: string[] = [];
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

  const canActivate =
    hasProducer &&
    hasGestor &&
    hasValidity &&
    isNotExpired &&
    hasWasteCodes &&
    hasOperations;

  return {
    canActivate,
    valid: canActivate,
    errors,
    checklist: {
      hasProducer,
      hasGestor,
      hasValidity,
      hasValidDates: hasValidity,
      isNotExpired,
      hasWasteCodes,
      hasOperations,
    },
  };
}

/**
 * Calcula el estado dinámico y vigencia real de un contrato según sus fechas
 */
export function getContractEffectiveStatus(contract: WasteContract): {
  status: 'borrador' | 'vigente' | 'caducado' | 'finalizado' | 'cancelado';
  isExpired: boolean;
  label: string;
} {
  if (contract.estado === 'cancelado') return { status: 'cancelado', isExpired: false, label: 'Cancelado' };
  if (contract.estado === 'finalizado') return { status: 'finalizado', isExpired: false, label: 'Finalizado' };
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

