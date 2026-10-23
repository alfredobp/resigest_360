// ==============================================================================
// RESIGEST 360 - TIPOS Y MODELOS DeCA Y PERFILES SANDBOX
// Normativa: Ley 9/2025 (DT 8ª), Orden FOM/2861/2012, Resolución 5 junio 2026
// ==============================================================================

export type DecaEstado = 'borrador' | 'vigente' | 'en_transito' | 'finalizado' | 'anulado';

export interface DecaDocument {
  id: number;
  user_id: string;
  company_id?: number;
  identification_document_id?: number;

  // Identificación y Serie
  numero_deca: string;
  version: number;
  is_vigente: boolean;
  previous_version_id?: number;

  // Token para URL pública de inspección y QR
  token: string;
  pdf_url?: string;

  // 1. Cargador Contractual
  cargador_razon_social: string;
  cargador_nif: string;
  cargador_domicilio: string;
  cargador_codigo_postal?: string;
  cargador_municipio?: string;
  cargador_provincia?: string;

  // 2. Transportista Efectivo
  transportista_razon_social: string;
  transportista_nif: string;
  transportista_domicilio?: string;
  transportista_codigo_postal?: string;
  transportista_municipio?: string;
  transportista_provincia?: string;
  transportista_nima?: string;
  transportista_autorizacion?: string;

  // 3. Origen y Destino
  origen_direccion: string;
  origen_codigo_postal?: string;
  origen_municipio: string;
  origen_provincia: string;
  origen_nima?: string;

  destino_direccion: string;
  destino_codigo_postal?: string;
  destino_municipio: string;
  destino_provincia: string;
  destino_nima?: string;

  // 4. Mercancía
  naturaleza_mercancia: string;
  peso_kg?: number;
  magnitud_alternativa?: string;
  codigo_ler?: string;
  descripcion_ler?: string;
  numero_di?: string;
  numero_nt?: string;
  es_residuo_peligroso?: boolean;
  requiere_adr?: boolean;
  materia_adr?: string;

  // 5. Vehículo y Conductor
  matricula_tractora: string;
  matricula_remolque?: string;
  autorizacion_especial?: string;
  conductor_nombre?: string;
  conductor_dni?: string;
  conductor_telefono?: string;

  // 6. Fechas y Horas
  fecha_transporte: string; // YYYY-MM-DD
  hora_salida?: string;     // HH:mm
  hora_cierre?: string;     // HH:mm
  fecha_finalizacion?: string;

  // 7. Estado y Observaciones
  estado: DecaEstado;
  motivo_exclusion?: string;
  observaciones_reservas?: string;

  created_at: string;
  updated_at: string;
}

export type DecaFormData = Omit<DecaDocument, 'id' | 'user_id' | 'version' | 'is_vigente' | 'token' | 'created_at' | 'updated_at'>;

export interface DecaAuditLog {
  id: number;
  deca_id: number;
  user_id?: string;
  accion: 'creacion' | 'modificacion_version' | 'cambio_estado' | 'inspeccion_descarga' | 'finalizacion';
  version_resultante: number;
  detalles?: Record<string, any>;
  ip_origen?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Perfiles de usuario para simulación en Sandbox
 * (Provisional para pruebas, se ajustará en el alta al cliente)
 */
export type SandboxProfileType = 
  | 'all'             // Superadmin / Modo Completo
  | 'transportista'   // Transportistas de mercancías / residuos
  | 'chatarreria'     // Chatarrerías / Centros de valorización de metales
  | 'baterias'        // Gestores y logística de baterías / RAEE
  | 'gestor_rp'       // Gestor de residuos peligrosos (SIRA, Memorias, LER)
  | 'productor';      // Productor de residuos industriales / comerciales
