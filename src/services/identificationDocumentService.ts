// =====================================================
// IDENTIFICATION DOCUMENT SERVICE
// Servicio para gestión de Documentos de Identificación (DI)
// =====================================================

import { createClient } from '@/lib/supabase/client';
import { syncEntryFromDI } from '@/services/chronologicalRegistryService';
import { auditService } from '@/services/auditService';
import { authorizationService } from '@/services/authorizationService';
import type {
  IdentificationDocument,
  EstadoTraslado,
  RecordDeparturePayload,
  RecordReceptionPayload,
  RecordIncidentPayload,
  CompleteTreatmentPayload,
  JustifyDiscrepancyPayload,
  WasteContract,
} from '@/types/wasteManagement';
import { isWeightDiscrepancy, parseDiscrepancyJustification } from '@/lib/validations/discrepancyJustification';

const supabase = createClient();

/**
 * Normaliza códigos de operación R/D para comparaciones consistentes (ej: 'R4' -> 'R04', 'D1' -> 'D01').
 */
export function normalizeOperationCode(op?: string | null): string {
  if (!op) return '';
  const cleaned = op.trim().toUpperCase();
  const match = cleaned.match(/^([RD])(\d{1,2})$/);
  if (!match) return cleaned;
  return `${match[1]}${match[2].padStart(2, '0')}`;
}

/**
 * Convierte un valor datetime-local ('YYYY-MM-DDTHH:mm') o ISO a ISO UTC conservando el instante local.
 */
export function normalizeLocalDateTimeToIso(value?: string | null): string {
  if (!value) return new Date().toISOString();
  const trimmed = value.trim();
  // Si ya incluye zona horaria ('Z' o '+HH:MM' / '-HH:MM'), respetar tal cual
  if (/(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

/**
 * Carga el contrato vinculado (si existe) y el alcance de autorización ambiental del gestor destinatario.
 */
async function resolveDestinationValidationContext(
  doc: IdentificationDocument,
  userId: string,
  overrideContractId?: number,
  referenceDate?: string
): Promise<{
  contract: WasteContract | null;
  gestorCompanyId: number | null;
  hasAuthConfigured: boolean;
  isAuthValid: boolean;
  authorizedOpsForLer: string[];
}> {
  let contract: WasteContract | null = doc.contract || null;
  const effectiveContractId = overrideContractId || doc.contract_id;

  if (!contract && effectiveContractId) {
    try {
      const wcBuilder = supabase.from('waste_contracts');
      if (wcBuilder) {
        const { data } = await wcBuilder
          .select('*, contract_waste_codes(*)')
          .eq('id', effectiveContractId)
          .maybeSingle();
        if (data) contract = data as WasteContract;
      }
    } catch {
      // Ignorar si no es accesible en mock
    }
  } else if (contract && (!contract.contract_waste_codes || contract.contract_waste_codes.length === 0)) {
    try {
      const cwcBuilder = supabase.from('contract_waste_codes');
      if (cwcBuilder) {
        const { data: wasteCodes } = await cwcBuilder
          .select('*')
          .eq('contract_id', contract.id);
        if (wasteCodes) contract.contract_waste_codes = wasteCodes;
      }
    } catch {
      // Ignorar si mock parcial
    }
  }

  let gestorCompanyId: number | null = contract?.gestor_company_id || null;
  if (!gestorCompanyId && doc.gestor_cif) {
    try {
      const compBuilder = supabase.from('companies');
      if (compBuilder) {
        const { data: comps } = await compBuilder
          .select('id, cif')
          .eq('user_id', userId);
        const normGestorCif = doc.gestor_cif.trim().toUpperCase();
        const found = (comps || []).find(
          (c: any) => c.cif && String(c.cif).trim().toUpperCase() === normGestorCif
        );
        if (found) gestorCompanyId = found.id;
      }
    } catch {
      // Ignorar en mock parcial
    }
  }

  let hasAuthConfigured = false;
  let isAuthValid = true;
  let authorizedOpsForLer: string[] = [];

  if (gestorCompanyId) {
    const scope = await authorizationService.getAuthorizedScope(
      gestorCompanyId,
      contract?.gestor_center_id || null,
      referenceDate || doc.fecha_documento
    );
    hasAuthConfigured = scope.hasAnyAuthorizationConfigured;
    isAuthValid = scope.isAuthorized;
    const cleanLer = (doc.codigo_ler || '').trim();
    const rawOps = scope.authorizedLers[cleanLer] || [];
    authorizedOpsForLer = rawOps.map((op) => normalizeOperationCode(op));
  }

  return {
    contract,
    gestorCompanyId,
    hasAuthConfigured,
    isAuthValid,
    authorizedOpsForLer,
  };
}

/**
 * Valida la justificación de discrepancia y construye los campos a persistir (con autoría y fecha).
 */
async function buildJustificationFields(input: JustifyDiscrepancyPayload): Promise<Partial<IdentificationDocument>> {
  const { causa, texto } = parseDiscrepancyJustification(input);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  const metadata = (user.user_metadata || {}) as { full_name?: string; name?: string };
  return {
    causa_discrepancia: causa,
    justificacion_discrepancia: texto,
    justificacion_discrepancia_at: new Date().toISOString(),
    justificacion_discrepancia_by: user.id,
    justificacion_discrepancia_by_nombre: metadata.full_name || metadata.name || user.email || null,
  };
}

export const identificationDocumentService = {
  /**
   * Generar número de documento de identificación
   * Formato: NIMA + AÑO + CORRELATIVO
   */
  generateDocumentNumber(nima: string): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
    return `${nima}${year}${random}`;
  },

  /**
   * Obtener todos los documentos del usuario
   */
  async getAll(): Promise<IdentificationDocument[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('identification_documents')
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        production_center:production_centers(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .eq('user_id', user.id)
      .order('fecha_documento', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener documentos: ${error.message}`);
    }

    return data as IdentificationDocument[];
  },

  /**
   * Obtener documento por ID
   */
  async getById(id: number): Promise<IdentificationDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('identification_documents')
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        production_center:production_centers(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw new Error(`Error al obtener documento: ${error.message}`);
    }

    return data as IdentificationDocument;
  },

  /**
   * Obtener documentos por contrato
   */
  async getByContract(contractId: number): Promise<IdentificationDocument[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('identification_documents')
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .eq('contract_id', contractId)
      .eq('user_id', user.id)
      .order('fecha_documento', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener documentos: ${error.message}`);
    }

    return data as IdentificationDocument[];
  },

  /**
   * Crear nuevo documento
   */
  async create(documentData: Partial<IdentificationDocument>): Promise<IdentificationDocument> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('identification_documents')
      .insert({
        ...documentData,
        user_id: user.id,
      })
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        production_center:production_centers(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .single();

    if (error) {
      throw new Error(`Error al crear documento: ${error.message}`);
    }

    const created = data as IdentificationDocument;
    await auditService.logAction({
      company_id: created.company_id,
      entidad: 'di',
      entidad_id: created.id,
      accion: 'crear',
      detalles: {
        numero_documento: created.numero_documento,
        codigo_ler: created.codigo_ler,
        operacion_prevista: created.operacion_tratamiento,
        contract_id: created.contract_id || null,
      },
    });

    return created;
  },

  /**
   * Actualizar documento
   */
  async update(id: number, documentData: Partial<IdentificationDocument>): Promise<IdentificationDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('identification_documents')
      .update(documentData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        company:companies!identification_documents_company_id_fkey(*),
        contract:waste_contracts(*),
        waste_type:waste_types(*)
      `)
      .single();

    if (error) {
      throw new Error(`Error al actualizar documento: ${error.message}`);
    }

    return data as IdentificationDocument;
  },

  /**
   * Eliminar documento
   */
  async delete(id: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('identification_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Error al eliminar documento: ${error.message}`);
    }

    await auditService.logAction({
      entidad: 'di',
      entidad_id: id,
      accion: 'eliminar',
      detalles: { identification_document_id: id },
    });
  },

  /**
   * Actualizar estado del documento
   */
  async updateStatus(
    id: number,
    estado: 'borrador' | 'pendiente-firma' | 'completado' | 'cancelado'
  ): Promise<IdentificationDocument> {
    return this.update(id, { estado });
  },

  /**
   * Subir firma en base64 a Supabase Storage y retornar su URL pública
   */
  async uploadSignatureImage(id: number, role: string, signatureBase64: string): Promise<string> {
    const base64Data = signatureBase64.includes(',') ? signatureBase64.split(',')[1] : signatureBase64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const fileName = `signature-${role}-${id}-${Date.now()}.png`;
    const filePath = `identification_documents/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Error al subir firma: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * Firmar documento digitalmente (productor, gestor o transportista)
   */
  async signDocument(
    id: number,
    role: 'productor' | 'gestor' | 'transportista',
    signatureBase64?: string,
    signerInfo?: { nombre?: string; dni?: string }
  ): Promise<IdentificationDocument> {
    const now = new Date().toISOString();
    let signatureUrl: string | undefined;

    if (signatureBase64) {
      signatureUrl = await this.uploadSignatureImage(id, role, signatureBase64);
    }

    const updateData: Partial<IdentificationDocument> = {};

    if (role === 'productor') {
      updateData.firmado_productor = true;
      updateData.fecha_firma_productor = now;
      if (signatureUrl) updateData.firma_productor_url = signatureUrl;
      if (signerInfo?.nombre) updateData.nombre_productor = signerInfo.nombre;
      if (signerInfo?.dni) updateData.dni_productor = signerInfo.dni;
    } else if (role === 'gestor') {
      updateData.firmado_gestor = true;
      updateData.fecha_firma_gestor = now;
      if (signatureUrl) updateData.firma_gestor_url = signatureUrl;
      if (signerInfo?.nombre) updateData.nombre_gestor = signerInfo.nombre;
      if (signerInfo?.dni) updateData.dni_gestor = signerInfo.dni;
    } else if (role === 'transportista') {
      updateData.firmado_transportista = true;
      updateData.fecha_firma_transportista = now;
      if (signatureUrl) updateData.firma_transportista_url = signatureUrl;
      if (signerInfo?.nombre) updateData.nombre_transportista = signerInfo.nombre;
      if (signerInfo?.dni) updateData.dni_transportista = signerInfo.dni;
    }

    const updated = await this.update(id, updateData);
    await auditService.logAction({
      company_id: updated.company_id,
      entidad: 'di',
      entidad_id: id,
      accion: 'actualizar',
      detalles: { role, firmado: true, con_trazo: Boolean(signatureUrl) },
    });
    return updated;
  },

  /**
   * Obtener Documento de Identificación por token de firma pública (RPC SECURITY DEFINER)
   */
  async getBySigningToken(token: string): Promise<IdentificationDocument | null> {
    const { data, error } = await supabase.rpc('get_di_by_signing_token', { p_token: token });

    if (error) {
      throw new Error(`Error al obtener DI por token: ${error.message}`);
    }

    return (data as IdentificationDocument | null) ?? null;
  },

  /**
   * Firmar Documento de Identificación mediante token público sin sesión autenticada
   */
  async signDocumentByToken(
    token: string,
    role: 'productor' | 'transportista' | 'gestor',
    signatureBase64: string,
    signerInfo?: { nombre?: string; dni?: string }
  ): Promise<IdentificationDocument> {
    const doc = await this.getBySigningToken(token);
    if (!doc) {
      throw new Error('Documento de Identificación no encontrado o token inválido');
    }

    const publicUrl = await this.uploadSignatureImage(doc.id, `public-${role}`, signatureBase64);

    const { data, error: updateError } = await supabase.rpc('sign_di_by_signing_token', {
      p_token: token,
      p_role: role,
      p_signature_url: publicUrl,
      p_signer_name: signerInfo?.nombre?.trim() || null,
      p_signer_dni: signerInfo?.dni?.trim() || null,
    });

    if (updateError) {
      throw new Error(`Error al registrar firma pública del DI: ${updateError.message}`);
    }

    await auditService.logAction({
      company_id: (data as IdentificationDocument)?.company_id ?? doc.company_id ?? null,
      entidad: 'di',
      entidad_id: doc.id,
      accion: 'actualizar',
      detalles: {
        numero_documento: doc.numero_documento,
        rol_firma: role,
        via: 'enlace_publico',
        firmante_nombre: signerInfo?.nombre || undefined,
      },
    });

    return data as IdentificationDocument;
  },

  /**
   * 1. Iniciar Traslado / Registrar Salida (Transportista)
   * Exige contrato vigente compatible o acreditación externa antes de pasar a 'en_transito' (F03).
   */
  async recordDeparture(id: number, payload: RecordDeparturePayload): Promise<IdentificationDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    const doc = await this.getById(id);

    const effectiveContractId = payload.contract_id || doc.contract_id;
    const extRef = (payload.contrato_externo_referencia || doc.contrato_externo_referencia || '').trim();
    const extEvidence = (payload.contrato_externo_evidencia_url || doc.contrato_externo_evidencia_url || '').trim();
    const exceptionReason = (payload.supuesto_excepcion_contrato || doc.supuesto_excepcion_contrato || '').trim();

    // Validación de contrato o acreditación externa (art. 5 RD 553/2020)
    const { contract, hasAuthConfigured, isAuthValid, authorizedOpsForLer } =
      await resolveDestinationValidationContext(
        doc,
        user?.id || doc.user_id,
        effectiveContractId,
        payload.fecha_salida || doc.fecha_documento
      );

    if (effectiveContractId) {
      if (!contract) {
        throw new Error('No se puede iniciar el traslado: el contrato vinculado no existe o no es accesible.');
      }
      if (contract.estado !== 'vigente') {
        throw new Error(`No se puede iniciar el traslado: el contrato ${contract.numero_contrato || contract.id} está en estado '${contract.estado}' y debe estar vigente.`);
      }
      const depDate = new Date(payload.fecha_salida || doc.fecha_documento || new Date());
      if (contract.fecha_fin && new Date(contract.fecha_fin) < new Date(depDate.toISOString().split('T')[0])) {
        throw new Error(`No se puede iniciar el traslado: el contrato ${contract.numero_contrato || contract.id} venció el ${contract.fecha_fin}.`);
      }
      if (
        contract.codigos_ler &&
        contract.codigos_ler.length > 0 &&
        doc.codigo_ler &&
        !contract.codigos_ler.some((ler) => ler.trim() === doc.codigo_ler.trim())
      ) {
        throw new Error(`No se puede iniciar el traslado: el LER ${doc.codigo_ler} no está incluido en el contrato ${contract.numero_contrato || contract.id}.`);
      }
    } else if (!extRef || (!extEvidence && !exceptionReason)) {
      throw new Error(
        'No se puede iniciar el traslado: debe vincular un contrato de tratamiento vigente o acreditar un contrato externo (referencia y justificante/supuesto legal según art. 5 RD 553/2020).'
      );
    }

    // Validar operación prevista contra régimen de notificación y autorización ambiental
    const plannedOp = normalizeOperationCode(doc.operacion_tratamiento);
    if (plannedOp && plannedOp.startsWith('D') && doc.tipo_notificacion === 'sin-notificacion') {
      throw new Error(
        `No se puede iniciar el traslado: la operación prevista ${plannedOp} (eliminación) exige Notificación Previa (art. 3.2 RD 553/2020).`
      );
    }
    if (hasAuthConfigured) {
      if (!isAuthValid) {
        throw new Error('No se puede iniciar el traslado: la autorización ambiental del gestor destinatario ha caducado.');
      }
      if (doc.codigo_ler && authorizedOpsForLer.length === 0) {
        throw new Error(`No se puede iniciar el traslado: el gestor destino no tiene autorizado el LER ${doc.codigo_ler}.`);
      }
      if (plannedOp && authorizedOpsForLer.length > 0 && !authorizedOpsForLer.includes(plannedOp)) {
        throw new Error(
          `No se puede iniciar el traslado: la operación prevista ${plannedOp} no está autorizada para el LER ${doc.codigo_ler} (autorizadas: ${authorizedOpsForLer.join(', ')}).`
        );
      }
    }

    const { signatureBase64, ...rest } = payload;
    let firma_transportista_url = payload.firma_transportista_url;

    if (signatureBase64) {
      firma_transportista_url = await this.uploadSignatureImage(id, 'transportista', signatureBase64);
    }

    const fechaSalidaIso = normalizeLocalDateTimeToIso(payload.fecha_salida);

    const updated = await this.update(id, {
      ...rest,
      fecha_salida: fechaSalidaIso,
      firma_transportista_url,
      estado_traslado: 'en_transito',
      firmado_transportista: true,
      fecha_firma_transportista: fechaSalidaIso,
    });

    await auditService.logAction({
      company_id: updated.company_id,
      entidad: 'di',
      entidad_id: id,
      accion: 'cambiar_estado',
      detalles: {
        estado_traslado: 'en_transito',
        contract_id: updated.contract_id || null,
        contrato_externo_referencia: updated.contrato_externo_referencia || null,
        fecha_salida: fechaSalidaIso,
      },
    });

    return updated;
  },

  /**
   * 2. Registrar Recepción y Pesada en Báscula de Destino (Gestor)
   */
  async recordReception(id: number, payload: RecordReceptionPayload): Promise<IdentificationDocument> {
    const doc = await this.getById(id);
    const { signatureBase64, causa_discrepancia, justificacion_discrepancia, ...rest } = payload;
    let firma_gestor_url = payload.firma_gestor_url;

    if (signatureBase64) {
      firma_gestor_url = await this.uploadSignatureImage(id, 'gestor', signatureBase64);
    }

    const pesoOrigen = doc.peso_origen_kg || (doc.unidad === 'toneladas' ? doc.cantidad * 1000 : doc.cantidad) || 0;
    const pesoDestino = payload.peso_destino_kg;
    const diferencia = pesoDestino - pesoOrigen;
    const porcentaje = pesoOrigen > 0 ? (diferencia / pesoOrigen) * 100 : 0;

    let nuevoEstadoTraslado: EstadoTraslado = 'recepcionado';
    if (payload.resultado_recepcion === 'aceptado') {
      nuevoEstadoTraslado = 'aceptado';
    } else if (payload.resultado_recepcion === 'rechazado_parcial') {
      nuevoEstadoTraslado = 'rechazado_parcial';
    } else if (payload.resultado_recepcion === 'rechazado_total') {
      nuevoEstadoTraslado = 'rechazado_total';
    }

    const fechaLlegadaIso = normalizeLocalDateTimeToIso(payload.fecha_llegada_destino);

    // Justificación de discrepancia aportada en la propia recepción (solo si se superan los umbrales)
    let justificationFields: Partial<IdentificationDocument> = {};
    if (isWeightDiscrepancy(pesoOrigen, pesoDestino) && (causa_discrepancia || justificacion_discrepancia?.trim())) {
      justificationFields = await buildJustificationFields({
        causa: causa_discrepancia as JustifyDiscrepancyPayload['causa'],
        texto: justificacion_discrepancia || '',
      });
    }

    const updated = await this.update(id, {
      ...rest,
      fecha_llegada_destino: fechaLlegadaIso,
      firma_gestor_url,
      peso_origen_kg: pesoOrigen,
      diferencia_peso_kg: parseFloat(diferencia.toFixed(3)),
      porcentaje_discrepancia: parseFloat(porcentaje.toFixed(2)),
      estado_traslado: nuevoEstadoTraslado,
      firmado_gestor: true,
      fecha_firma_gestor: fechaLlegadaIso,
      ...justificationFields,
    });

    if (nuevoEstadoTraslado === 'aceptado') {
      try {
        await syncEntryFromDI(updated);
      } catch (e) {
        console.warn('Advertencia: no se pudo sincronizar automáticamente con el archivo cronológico:', e);
      }
    }

    await auditService.logAction({
      company_id: updated.company_id,
      entidad: 'di',
      entidad_id: id,
      accion: 'recepcionar_pesada',
      detalles: {
        estado_traslado: nuevoEstadoTraslado,
        peso_origen_kg: pesoOrigen,
        peso_destino_kg: pesoDestino,
        diferencia_peso_kg: updated.diferencia_peso_kg,
        porcentaje_discrepancia: updated.porcentaje_discrepancia,
        fecha_llegada_destino: fechaLlegadaIso,
      },
    });

    return updated;
  },

  /**
   * 3. Registrar Incidencia o Rechazo
   */
  async recordIncident(id: number, payload: RecordIncidentPayload): Promise<IdentificationDocument> {
    const updated = await this.update(id, {
      tipo_incidencia: payload.tipo_incidencia,
      motivo_incidencia: payload.motivo_incidencia,
      resultado_recepcion: payload.resultado_recepcion,
      cantidad_rechazada_kg: payload.cantidad_rechazada_kg,
      estado_traslado: payload.resultado_recepcion,
    });

    await auditService.logAction({
      company_id: updated.company_id,
      entidad: 'di',
      entidad_id: id,
      accion: 'registrar_incidencia',
      detalles: { ...payload },
    });

    return updated;
  },

  /**
   * 4. Certificar Tratamiento y Cierre (RD 553/2020)
   * Valida autorización, contrato y régimen de notificación antes de escribir (F02),
   * y conserva por separado operación prevista y ejecutada.
   */
  async completeTreatment(id: number, payload: CompleteTreatmentPayload): Promise<IdentificationDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    const doc = await this.getById(id);
    const executedOp = normalizeOperationCode(payload.operacion_tratamiento);

    if (!executedOp || !/^[RD]\d{2}$/.test(executedOp)) {
      throw new Error(`Operación de tratamiento inválida: '${payload.operacion_tratamiento}'. Debe indicar un código R01–R13 o D01–D15.`);
    }

    // Idempotencia ante reintentos: si ya está cerrado con la misma operación, devolver sin duplicar
    if (doc.estado_traslado === 'tratado' && doc.estado === 'completado') {
      const currentExec = normalizeOperationCode(doc.operacion_tratamiento_ejecutada || doc.operacion_tratamiento);
      if (currentExec === executedOp) {
        return doc;
      }
      throw new Error(`El DI ya fue cerrado anteriormente con la operación ${currentExec} y no puede sobrescribirse.`);
    }

    // Validar compatibilidad con régimen de notificación previa (art. 3.2 RD 553/2020)
    if (executedOp.startsWith('D') && doc.tipo_notificacion === 'sin-notificacion') {
      throw new Error(
        `Operación ${executedOp} denegada: las operaciones de eliminación requieren Notificación Previa y este DI figura como 'Sin Notificación' (art. 3.2 RD 553/2020).`
      );
    }

    // Validar contrato y autorización ambiental del gestor destino para el LER y operación
    const { contract, hasAuthConfigured, isAuthValid, authorizedOpsForLer } =
      await resolveDestinationValidationContext(
        doc,
        user?.id || doc.user_id,
        doc.contract_id,
        payload.fecha_tratamiento || doc.fecha_documento
      );

    if (contract) {
      const contractOps = (contract.contract_waste_codes || [])
        .filter((wc) => wc.codigo_ler?.trim() === doc.codigo_ler?.trim())
        .map((wc) => normalizeOperationCode(wc.operacion_tratamiento));
      const fallbackOps = (contract.operaciones_tratamiento || []).map((op) => normalizeOperationCode(op));
      const allowedContractOps = contractOps.length > 0 ? contractOps : fallbackOps;

      if (allowedContractOps.length > 0 && !allowedContractOps.includes(executedOp)) {
        throw new Error(
          `Operación ${executedOp} denegada: no está amparada por el contrato ${contract.numero_contrato || contract.id} para el LER ${doc.codigo_ler} (amparadas: ${allowedContractOps.join(', ')}).`
        );
      }
    }

    if (hasAuthConfigured) {
      if (!isAuthValid) {
        throw new Error('Operación denegada: la autorización ambiental del gestor destinatario ha caducado.');
      }
      if (authorizedOpsForLer.length === 0) {
        throw new Error(`Operación ${executedOp} denegada: el LER ${doc.codigo_ler} no figura autorizado en el destino.`);
      }
      if (!authorizedOpsForLer.includes(executedOp)) {
        throw new Error(
          `Operación ${executedOp} denegada: la autorización del gestor para el LER ${doc.codigo_ler} solo contempla ${authorizedOpsForLer.join(', ')}.`
        );
      }
    }

    const fechaTratamientoIso = normalizeLocalDateTimeToIso(payload.fecha_tratamiento);

    // Conservar operacion_tratamiento (prevista) intacta; guardar ejecutada por separado
    const updated = await this.update(id, {
      operacion_tratamiento: doc.operacion_tratamiento || executedOp,
      operacion_tratamiento_ejecutada: executedOp,
      descripcion_tratamiento: payload.descripcion_tratamiento,
      fecha_tratamiento: fechaTratamientoIso,
      estado_traslado: 'tratado',
      estado: 'completado',
      notas: payload.notas,
    });

    try {
      await syncEntryFromDI(updated);
    } catch (e) {
      console.warn('Advertencia: no se pudo sincronizar automáticamente con el archivo cronológico:', e);
    }

    await auditService.logAction({
      company_id: updated.company_id,
      entidad: 'di',
      entidad_id: id,
      accion: 'cambiar_estado',
      detalles: {
        estado_traslado: 'tratado',
        operacion_prevista: updated.operacion_tratamiento,
        operacion_ejecutada: executedOp,
        fecha_tratamiento: fechaTratamientoIso,
      },
    });

    return updated;
  },

  /**
   * 5. Justificar documentalmente una discrepancia de báscula (RD 553/2020).
   * Editable mientras el DI no esté cerrado; en estado 'tratado' solo puede añadirse si no existía.
   */
  async justifyDiscrepancy(id: number, payload: JustifyDiscrepancyPayload): Promise<IdentificationDocument> {
    // getById filtra por user_id del tenant autenticado
    const doc = await this.getById(id);
    const meta = getTrackingStatusMeta(doc);

    if (!meta.hasDiscrepancy) {
      throw new Error('El DI no presenta una discrepancia de báscula que requiera justificación.');
    }
    if (doc.estado_traslado === 'tratado' && doc.justificacion_discrepancia?.trim()) {
      throw new Error('El DI está cerrado y la justificación ya registrada no puede modificarse.');
    }

    const fields = await buildJustificationFields(payload);
    const updated = await this.update(id, fields);

    await auditService.logAction({
      company_id: updated.company_id,
      entidad: 'di',
      entidad_id: id,
      accion: 'justificar_discrepancia',
      detalles: {
        causa_discrepancia: fields.causa_discrepancia,
        justificacion_discrepancia: fields.justificacion_discrepancia,
        diferencia_peso_kg: doc.diferencia_peso_kg,
        porcentaje_discrepancia: doc.porcentaje_discrepancia,
        es_modificacion: !!doc.justificacion_discrepancia,
      },
    });

    return updated;
  },

  /**
   * Obtener estadísticas de documentos
   */
  async getStats(): Promise<{
    total: number;
    borradores: number;
    enTransito: number;
    recepcionados: number;
    aceptados: number;
    incidencias: number;
    tratados: number;
  }> {
    const documents = await this.getAll();

    return {
      total: documents.length,
      borradores: documents.filter(d => !d.estado_traslado || d.estado_traslado === 'borrador').length,
      enTransito: documents.filter(d => d.estado_traslado === 'en_transito').length,
      recepcionados: documents.filter(d => d.estado_traslado === 'recepcionado').length,
      aceptados: documents.filter(d => d.estado_traslado === 'aceptado').length,
      incidencias: documents.filter(d => d.estado_traslado === 'rechazado_parcial' || d.estado_traslado === 'rechazado_total').length,
      tratados: documents.filter(d => d.estado_traslado === 'tratado').length,
    };
  },
};

/**
 * Helper con metadatos de presentación del ciclo de vida del traslado
 */
export function getTrackingStatusMeta(doc: IdentificationDocument): {
  key: EstadoTraslado;
  label: string;
  badgeColor: 'light' | 'info' | 'warning' | 'success' | 'error';
  step: number;
  hasDiscrepancy: boolean;
  discrepancyMessage?: string;
  isDiscrepancyJustified: boolean;
} {
  const estado: EstadoTraslado = doc.estado_traslado || 'borrador';

  const pesoOrigen = doc.peso_origen_kg || (doc.unidad === 'toneladas' ? doc.cantidad * 1000 : doc.cantidad) || 0;
  const hasDiscrepancy = isWeightDiscrepancy(pesoOrigen, doc.peso_destino_kg);
  const discrepancyMessage = hasDiscrepancy
    ? `Discrepancia de peso: ${(doc.diferencia_peso_kg || 0) > 0 ? '+' : ''}${doc.diferencia_peso_kg || 0} kg (${doc.porcentaje_discrepancia || 0}%)`
    : undefined;
  const isDiscrepancyJustified = hasDiscrepancy && !!doc.justificacion_discrepancia?.trim();
  const common = { hasDiscrepancy, discrepancyMessage, isDiscrepancyJustified };

  switch (estado) {
    case 'en_transito':
      return { key: estado, label: 'En Tránsito', badgeColor: 'info', step: 2, ...common };
    case 'recepcionado':
      return { key: estado, label: 'Recepcionado en Báscula', badgeColor: 'warning', step: 3, ...common };
    case 'aceptado':
      return { key: estado, label: 'Aceptado por Gestor', badgeColor: 'success', step: 4, ...common };
    case 'rechazado_parcial':
      return { key: estado, label: 'Aceptado Parcial / Rechazo', badgeColor: 'warning', step: 4, ...common };
    case 'rechazado_total':
      return { key: estado, label: 'Rechazo Total en Destino', badgeColor: 'error', step: 4, ...common };
    case 'tratado':
      return { key: estado, label: 'Tratado y Cerrado', badgeColor: 'success', step: 5, ...common };
    case 'borrador':
    default:
      return { key: 'borrador', label: 'Borrador / Registrado', badgeColor: 'light', step: 1, ...common };
  }
}

export default identificationDocumentService;
