// ==============================================================================
// RESIGEST 360 - SERVICIO DeCA (DOCUMENTO ELECTRÓNICO DE CONTROL ADMINISTRATIVO)
// Normativa: Ley 9/2025, Orden FOM/2861/2012, Resolución 5 junio 2026
// ==============================================================================

import { createClient } from '@/lib/supabase/client';
import type { DecaDocument, DecaFormData, DecaAuditLog } from '@/types/deca';
import type { IdentificationDocument } from '@/types/wasteManagement';

const supabase = createClient();

/**
 * Genera un token criptográfico no adivinable para inspección y QR
 */
function generateSecureToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'dca_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export const decaService = {
  /**
   * Obtener todos los documentos DeCA de la empresa/usuario actual
   */
  async getAll(): Promise<DecaDocument[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('deca_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha_transporte', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      console.error('Error al obtener documentos DeCA:', error);
      return [];
    }

    return (data || []) as DecaDocument[];
  },

  /**
   * Obtener DeCA por su ID
   */
  async getById(id: number): Promise<DecaDocument | null> {
    const { data, error } = await supabase
      .from('deca_documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener DeCA por ID:', error);
      return null;
    }

    return data as DecaDocument | null;
  },

  /**
   * Obtener DeCA público por su Token (utilizado en la inspección y en el móvil del conductor)
   */
  async getByToken(token: string): Promise<DecaDocument | null> {
    if (!token) return null;

    const { data, error } = await supabase
      .from('deca_documents')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.error('[DeCA Service] Error en Supabase al consultar DeCA por token:', error.message, error);
      return null;
    }

    if (!data) {
      console.warn('[DeCA Service] No se encontró fila en deca_documents para el token:', token);
    }

    return data as DecaDocument | null;
  },

  /**
   * Generar el siguiente número correlativo de DeCA
   */
  async getNextNumero(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `DECA-${currentYear}-`;

    const { data } = await supabase
      .from('deca_documents')
      .select('numero_deca')
      .ilike('numero_deca', `${prefix}%`)
      .order('id', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return `${prefix}00001`;
    }

    const lastNumStr = data[0].numero_deca.replace(prefix, '');
    const nextSeq = (parseInt(lastNumStr, 10) || 0) + 1;
    return `${prefix}${String(nextSeq).padStart(5, '0')}`;
  },

  /**
   * Crear un nuevo DeCA autónomo
   */
  async create(formData: DecaFormData): Promise<DecaDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const numero_deca = formData.numero_deca || await this.getNextNumero();
    const token = generateSecureToken();

    const insertPayload = {
      ...formData,
      user_id: user.id,
      numero_deca,
      version: 1,
      is_vigente: true,
      token,
      estado: formData.estado || 'vigente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('deca_documents')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear documento DeCA: ${error.message}`);
    }

    // Registrar log de auditoría
    await this.logAudit(data.id, 'creacion', 1, {
      numero_deca,
      cargador: data.cargador_razon_social,
      transportista: data.transportista_razon_social,
    });

    return data as DecaDocument;
  },

  /**
   * Crear DeCA a partir de un Documento de Identificación (DI) de residuos
   * Precarga automáticamente todos los campos medioambientales y de transporte
   */
  async createFromIdentificationDocument(
    di: IdentificationDocument,
    cargadorData: {
      cargador_razon_social: string;
      cargador_nif: string;
      cargador_domicilio: string;
      cargador_codigo_postal?: string;
      cargador_municipio?: string;
      cargador_provincia?: string;
      observaciones_reservas?: string;
      matricula_tractora?: string;
      matricula_remolque?: string;
    }
  ): Promise<DecaDocument> {
    const pesoKg = di.unidad === 'toneladas' ? di.cantidad * 1000 : di.cantidad;

    const formData: DecaFormData = {
      identification_document_id: di.id,
      company_id: di.company_id,
      numero_deca: '', // Se calculará automáticamente
      
      // Cargador Contractual (definido por el usuario o empresa)
      cargador_razon_social: cargadorData.cargador_razon_social || di.productor_razon_social,
      cargador_nif: cargadorData.cargador_nif || di.productor_cif,
      cargador_domicilio: cargadorData.cargador_domicilio || di.productor_direccion || 'No especificado',
      cargador_codigo_postal: cargadorData.cargador_codigo_postal || di.productor_codigo_postal,
      cargador_municipio: cargadorData.cargador_municipio || di.productor_municipio || 'No especificado',
      cargador_provincia: cargadorData.cargador_provincia || di.productor_provincia || 'No especificado',

      // Transportista Efectivo (del DI)
      transportista_razon_social: di.transportista_razon_social || 'No especificado',
      transportista_nif: di.transportista_cif || 'No especificado',
      transportista_domicilio: di.transportista_direccion,
      transportista_codigo_postal: di.transportista_codigo_postal,
      transportista_municipio: di.transportista_municipio,
      transportista_provincia: di.transportista_provincia,
      transportista_nima: di.transportista_nima,

      // Origen (Productor / Centro de Producción)
      origen_direccion: di.productor_direccion || 'Instalación del Productor',
      origen_codigo_postal: di.productor_codigo_postal,
      origen_municipio: di.productor_municipio || 'No especificado',
      origen_provincia: di.productor_provincia || 'No especificado',
      origen_nima: di.productor_nima,

      // Destino (Instalación Gestora Receptora)
      destino_direccion: di.gestor_direccion || 'Instalación de Tratamiento de Destino',
      destino_codigo_postal: di.gestor_codigo_postal,
      destino_municipio: di.gestor_municipio || 'No especificado',
      destino_provincia: di.gestor_provincia || 'No especificado',
      destino_nima: di.gestor_nima,

      // Mercancía
      naturaleza_mercancia: `Residuo: ${di.descripcion_residuo || 'Residuo no especificado'} (LER ${di.codigo_ler})`,
      peso_kg: pesoKg,
      magnitud_alternativa: `${di.cantidad} ${di.unidad}`,
      codigo_ler: di.codigo_ler,
      descripcion_ler: di.descripcion_residuo,
      numero_di: di.numero_documento,
      es_residuo_peligroso: di.peligrosidad === 'peligroso' || di.codigo_ler?.includes('*'),

      // Vehículo
      matricula_tractora: cargadorData.matricula_tractora || di.transportista_matricula || 'PENDIENTE',
      matricula_remolque: cargadorData.matricula_remolque,

      // Fechas
      fecha_transporte: di.fecha_recogida || di.fecha_documento || new Date().toISOString().split('T')[0],
      estado: 'vigente',
      observaciones_reservas: cargadorData.observaciones_reservas,
    };

    return await this.create(formData);
  },

  /**
   * Crear una nueva versión inmutable de un DeCA existente (modificación trazable)
   */
  async createNewVersion(
    currentDeca: DecaDocument,
    updatedFields: Partial<DecaFormData>,
    motivoModificacion: string
  ): Promise<DecaDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // 1. Marcar versión anterior como no vigente
    await supabase
      .from('deca_documents')
      .update({ is_vigente: false, updated_at: new Date().toISOString() })
      .eq('id', currentDeca.id);

    // 2. Crear nueva fila con version + 1 y nuevo token criptográfico
    const nextVersion = currentDeca.version + 1;
    const newToken = generateSecureToken();

    const newDocPayload = {
      ...currentDeca,
      ...updatedFields,
      id: undefined, // nuevo id autonumérico
      version: nextVersion,
      is_vigente: true,
      previous_version_id: currentDeca.id,
      token: newToken,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    delete (newDocPayload as any).id;

    let { data, error } = await supabase
      .from('deca_documents')
      .insert(newDocPayload)
      .select()
      .single();

    // Fallback de resiliencia si la tabla aún tiene la restricción UNIQUE simple en numero_deca
    if (error && error.message.includes('deca_documents_numero_deca_key')) {
      const fallbackPayload = {
        ...newDocPayload,
        numero_deca: `${currentDeca.numero_deca}-v${nextVersion}`,
      };
      const retryResult = await supabase
        .from('deca_documents')
        .insert(fallbackPayload)
        .select()
        .single();
      
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      throw new Error(`Error al versionar DeCA: ${error.message}`);
    }

    // Registrar en auditoría
    await this.logAudit(data.id, 'modificacion_version', nextVersion, {
      motivo: motivoModificacion,
      version_anterior_id: currentDeca.id,
      token_anterior: currentDeca.token,
      nuevo_token: newToken,
    });

    return data as DecaDocument;
  },

  /**
   * Finalizar servicio de transporte (inicia el cómputo de 7 días naturales para el acceso público de inspección)
   */
  async finalizeService(id: number): Promise<DecaDocument> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('deca_documents')
      .update({
        estado: 'finalizado',
        fecha_finalizacion: now,
        hora_cierre: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al finalizar servicio DeCA: ${error.message}`);
    }

    await this.logAudit(id, 'finalizacion', data.version, { fecha_finalizacion: now });
    return data as DecaDocument;
  },

  /**
   * Registrar acción en la tabla de auditoría
   */
  async logAudit(
    decaId: number,
    accion: DecaAuditLog['accion'],
    versionResultante: number,
    detalles?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('deca_audit_logs').insert({
        deca_id: decaId,
        user_id: user?.id,
        accion,
        version_resultante: versionResultante,
        detalles: detalles || {},
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Advertencia al registrar auditoría DeCA:', err);
    }
  },

  /**
   * Verificar si un documento ha caducado para inspección pública (más de 7 días tras finalización)
   */
  isTokenExpired(deca: DecaDocument): boolean {
    if (!deca.fecha_finalizacion) return false;
    const finishDate = new Date(deca.fecha_finalizacion);
    const now = new Date();
    const diffDays = (now.getTime() - finishDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
  }
};
