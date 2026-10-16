// =====================================================
// WASTE MANAGEMENT TYPES
// Tipos TypeScript para el sistema de gestión de residuos
// =====================================================

// =====================================================
// TREATMENT MANAGER (Gestor de Tratamiento)
// =====================================================

export interface TreatmentManager {
  id: number;
  user_id: string;

  // Datos básicos
  nombre: string;
  razon_social: string;
  cif: string;
  nima?: string;
  numero_autorizacion?: string;

  // Domicilio
  direccion?: string;
  codigo_postal?: string;
  municipio?: string;
  provincia?: string;

  // Contacto
  telefono?: string;
  email?: string;
  persona_contacto?: string;

  // Metadata
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;

  // Integración Holded
  holded_contact_id?: string;
}

export interface TreatmentManagerFormData {
  nombre: string;
  razon_social: string;
  cif: string;
  nima?: string;
  numero_autorizacion?: string;
  direccion?: string;
  codigo_postal?: string;
  municipio?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  persona_contacto?: string;
  notas?: string;
  activo?: boolean;
  holded_contact_id?: string;
}

export interface Carrier {
  id: number;
  user_id: string;

  // Datos básicos
  razon_social: string;
  cif: string;
  nima?: string;
  numero_autorizacion?: string;

  // Vehículo
  matricula?: string;

  // Domicilio
  direccion?: string;
  codigo_postal?: string;
  municipio?: string;
  provincia?: string;

  // Contacto
  telefono?: string;
  email?: string;
  persona_contacto?: string;

  // Metadata
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;

  // Integración Holded
  holded_contact_id?: string;
}

export interface CarrierFormData {
  razon_social: string;
  cif: string;
  nima?: string;
  numero_autorizacion?: string;
  matricula?: string;
  direccion?: string;
  codigo_postal?: string;
  municipio?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  persona_contacto?: string;
  notas?: string;
  activo?: boolean;
  holded_contact_id?: string;
}

// =====================================================
// COMPANY (Empresa) 
// =====================================================

export type CompanyRole = 'productor' | 'gestor' | 'transportista' | 'negociante' | 'agente' | 'cliente' | 'proveedor';
export type FacilityType = 'produccion' | 'tratamiento' | 'almacen' | 'sede_logistica';

export interface Company {
  id: number;
  user_id: string;

  // Datos básicos
  razon_social: string;
  nombre_comercial?: string;
  cif: string;

  // Números de registro
  nima?: string;
  numero_inscripcion?: string;
  numero_autorizacion?: string;
  matricula?: string;

  // Domicilio social
  domicilio_social?: string;
  codigo_postal_social?: string;
  municipio_social?: string;
  provincia_social?: string;

  // Domicilio instalación
  domicilio_instalacion?: string;
  codigo_postal_instalacion?: string;
  municipio_instalacion?: string;
  provincia_instalacion?: string;

  // Contacto
  telefono?: string;
  email?: string;
  persona_contacto?: string;

  // Clasificación y Roles Múltiples
  tipo_empresa: 'productor' | 'gestor' | 'transportista' | 'negociante' | 'agente';
  roles?: CompanyRole[];
  is_my_company?: boolean;

  // Logo
  logo_url?: string;

  // Metadata
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;

  // Integración SIRA
  sira_usuario?: string;
  sira_password?: string;
  sira_activo?: boolean;

  // Integración Holded
  holded_api_key?: string;

  // Relaciones
  production_centers?: ProductionCenter[];
}

export interface ProductionCenter {
  id: number;
  company_id: number;
  user_id: string;

  nombre: string;
  direccion: string;
  nima: string;
  municipio?: string;
  provincia?: string;
  codigo_postal?: string;
  descripcion?: string;
  tipo_instalacion?: FacilityType;

  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductionCenterFormData {
  company_id?: number;
  nombre: string;
  direccion: string;
  nima: string;
  municipio?: string;
  provincia?: string;
  codigo_postal?: string;
  descripcion?: string;
  tipo_instalacion?: FacilityType;
  activo?: boolean;
}

export interface CompanyFormData {
  razon_social: string;
  nombre_comercial?: string;
  cif: string;
  nima?: string;
  numero_inscripcion?: string;
  numero_autorizacion?: string;
  matricula?: string;
  domicilio_social?: string;
  codigo_postal_social?: string;
  municipio_social?: string;
  provincia_social?: string;
  domicilio_instalacion?: string;
  codigo_postal_instalacion?: string;
  municipio_instalacion?: string;
  provincia_instalacion?: string;
  telefono?: string;
  email?: string;
  persona_contacto?: string;
  tipo_empresa?: 'productor' | 'gestor' | 'transportista' | 'negociante' | 'agente';
  roles?: CompanyRole[];
  is_my_company?: boolean;
  logo_url?: string;
  notas?: string;
  activo?: boolean;

  // Integración SIRA
  sira_usuario?: string;
  sira_password?: string;
  sira_activo?: boolean;

  // Integración Holded
  holded_api_key?: string;
}

// =====================================================
// WASTE TYPE (Tipo de Residuo)
// =====================================================

export interface WasteType {
  id: number;
  codigo_ler: string;
  descripcion: string;
  categoria: 'no-peligroso' | 'peligroso';
  estado: 'solido' | 'liquido' | 'pastoso' | 'gaseoso';
  operaciones_permitidas: string[];
  activo: boolean;
  notas?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// WASTE CONTRACT (Contrato de Tratamiento)
// =====================================================

export interface ContractWasteCode {
  id: number;
  contract_id: number;
  codigo_ler: string;
  descripcion_ler?: string;
  operacion_tratamiento: string; // Ej: 'R03', 'R13', 'D10'
  tarifa_gestion?: number;
  tipo_precio?: string;
  cantidad_estimada_anual?: number;
  created_at: string;
}

export interface ContractWasteCodeFormData {
  codigo_ler: string;
  descripcion_ler?: string;
  operacion_tratamiento: string;
  tarifa_gestion?: number;
  tipo_precio?: string;
  cantidad_estimada_anual?: number;
}

export interface WasteContract {
  id: number;
  user_id: string;

  // Referencias a empresas e instalaciones
  company_id: number;
  gestor_company_id?: number;
  treatment_manager_id?: number;
  producer_center_id?: number | null;
  gestor_center_id?: number | null;
  environmental_authorization_id?: number | null;

  // Datos del contrato
  numero_contrato?: string;
  fecha_contrato: string;
  fecha_inicio?: string;
  fecha_fin?: string;

  // Tipo
  tipo_contrato: 'tratamiento' | 'recogida' | 'transporte' | 'valoracion' | 'eliminacion';

  // Residuos y Operaciones
  codigos_ler?: string[];
  waste_type_ids?: number[];
  descripcion_residuos?: string;
  operaciones_tratamiento?: string[];

  // Condiciones
  cantidad_maxima_anual?: number;
  unidad_cantidad?: string;
  precio_unitario?: number;
  moneda?: string;

  // Estado
  estado: 'borrador' | 'vigente' | 'finalizado' | 'cancelado';

  // Documentación y Firmas
  documento_url?: string;
  firma_productor_url?: string;
  fecha_firma_productor?: string;
  firma_gestor_url?: string;
  fecha_firma_gestor?: string;

  // Metadata
  signing_token?: string;
  notas?: string;
  created_at: string;
  updated_at: string;

  // Relaciones (populated)
  company?: Company;
  gestor_company?: Company;
  treatment_manager?: TreatmentManager;
  producer_center?: ProductionCenter;
  gestor_center?: ProductionCenter;
  environmental_authorization?: EnvironmentalAuthorization;
  waste_types?: WasteType[];
  contract_waste_codes?: ContractWasteCode[];
}

export interface WasteContractFormData {
  company_id: number;
  gestor_company_id?: number;
  treatment_manager_id?: number;
  producer_center_id?: number | null;
  gestor_center_id?: number | null;
  environmental_authorization_id?: number | null;
  numero_contrato?: string;
  fecha_contrato: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_contrato: 'tratamiento' | 'recogida' | 'transporte' | 'valoracion' | 'eliminacion';
  codigos_ler?: string[];
  waste_type_ids?: number[];
  descripcion_residuos?: string;
  operaciones_tratamiento?: string[];
  cantidad_maxima_anual?: number;
  unidad_cantidad?: string;
  precio_unitario?: number;
  moneda?: string;
  estado?: 'borrador' | 'vigente' | 'finalizado' | 'cancelado';
  documento_url?: string;
  firma_productor_url?: string;
  fecha_firma_productor?: string;
  firma_gestor_url?: string;
  fecha_firma_gestor?: string;
  notas?: string;
  contract_waste_codes?: ContractWasteCodeFormData[];
}

// =====================================================
// IDENTIFICATION DOCUMENT (Documento de Identificación)
// =====================================================

export interface IdentificationDocument {
  id: number;
  user_id: string;
  contract_id?: number;
  company_id: number;
  production_center_id?: number;

  numero_documento: string;
  fecha_documento: string;
  tipo_notificacion: 'sin-notificacion' | 'con-notificacion-previa';

  // Productor
  productor_razon_social: string;
  productor_cif: string;
  productor_nima?: string;
  productor_direccion?: string;
  productor_codigo_postal?: string;
  productor_municipio?: string;
  productor_provincia?: string;
  productor_telefono?: string;

  // Gestor
  gestor_razon_social: string;
  gestor_cif: string;
  gestor_nima?: string;
  gestor_numero_autorizacion?: string;
  gestor_direccion?: string;
  gestor_codigo_postal?: string;
  gestor_municipio?: string;
  gestor_provincia?: string;
  gestor_telefono?: string;

  // Transportista
  transportista_razon_social?: string;
  transportista_cif?: string;
  transportista_nima?: string;
  transportista_matricula?: string;
  transportista_direccion?: string;
  transportista_codigo_postal?: string;
  transportista_municipio?: string;
  transportista_provincia?: string;
  transportista_telefono?: string;

  // Residuo
  waste_type_id?: number;
  codigo_ler: string;
  descripcion_residuo: string;
  estado_fisico: 'solido' | 'liquido' | 'pastoso' | 'gaseoso';
  peligrosidad: 'no-peligroso' | 'peligroso';

  // Cantidad
  cantidad: number;
  unidad: 'kg' | 'toneladas' | 'litros' | 'm3' | 'unidades';
  numero_envases?: number;
  tipo_envases?: string;

  // Tratamiento
  operacion_tratamiento?: string;
  descripcion_tratamiento?: string;

  // Fechas
  fecha_recogida?: string;
  fecha_entrega?: string;

  // Ciclo de Vida y Trazabilidad del Traslado (RD 553/2020)
  estado_traslado?: EstadoTraslado;
  peso_origen_kg?: number;
  peso_destino_kg?: number;
  diferencia_peso_kg?: number;
  porcentaje_discrepancia?: number;
  numero_albaran_gestor?: string;
  ticket_pesada_url?: string;
  fecha_salida?: string;
  fecha_llegada_destino?: string;
  fecha_tratamiento?: string;
  resultado_recepcion?: ResultadoRecepcion;
  tipo_incidencia?: TipoIncidencia | string;
  motivo_incidencia?: string;
  cantidad_rechazada_kg?: number;

  // Firmas y Datos de Intervinientes
  firmado_productor: boolean;
  firmado_gestor: boolean;
  firmado_transportista: boolean;
  fecha_firma_productor?: string;
  fecha_firma_gestor?: string;
  fecha_firma_transportista?: string;
  firma_productor_url?: string;
  nombre_productor?: string;
  dni_productor?: string;
  firma_gestor_url?: string;
  nombre_gestor?: string;
  dni_gestor?: string;
  firma_transportista_url?: string;
  nombre_transportista?: string;
  dni_transportista?: string;

  // Documentación
  documento_url?: string;

  // Estado administrativo general
  estado: 'borrador' | 'pendiente-firma' | 'completado' | 'cancelado';

  // Metadata
  notas?: string;
  created_at: string;
  updated_at: string;

  // Relaciones
  company?: Company;
  production_center?: ProductionCenter;
  contract?: WasteContract;
  waste_type?: WasteType;
}

export type EstadoTraslado =
  | 'borrador'
  | 'en_transito'
  | 'recepcionado'
  | 'aceptado'
  | 'rechazado_parcial'
  | 'rechazado_total'
  | 'tratado';

export type ResultadoRecepcion = 'aceptado' | 'rechazado_parcial' | 'rechazado_total';

export type TipoIncidencia =
  | 'discrepancia_peso'
  | 'residuo_no_conforme'
  | 'etiquetado_incorrecto'
  | 'envase_deteriorado'
  | 'otro';

export interface RecordDeparturePayload {
  fecha_salida: string;
  transportista_razon_social?: string;
  transportista_cif?: string;
  transportista_nima?: string;
  transportista_matricula?: string;
  nombre_transportista?: string;
  dni_transportista?: string;
  firma_transportista_url?: string;
  peso_origen_kg?: number;
}

export interface RecordReceptionPayload {
  fecha_llegada_destino: string;
  peso_destino_kg: number;
  numero_albaran_gestor?: string;
  ticket_pesada_url?: string;
  resultado_recepcion: ResultadoRecepcion;
  tipo_incidencia?: TipoIncidencia | string;
  motivo_incidencia?: string;
  cantidad_rechazada_kg?: number;
  nombre_gestor?: string;
  dni_gestor?: string;
  firma_gestor_url?: string;
}

export interface RecordIncidentPayload {
  tipo_incidencia: TipoIncidencia | string;
  motivo_incidencia: string;
  resultado_recepcion: 'rechazado_parcial' | 'rechazado_total';
  cantidad_rechazada_kg?: number;
}

export interface CompleteTreatmentPayload {
  operacion_tratamiento: string;
  fecha_tratamiento?: string;
  descripcion_tratamiento?: string;
  notas?: string;
}

// =====================================================
// ANNUAL REPORT (Memoria Anual)
// =====================================================

export interface AnnualReport {
  id: number;
  user_id: string;
  company_id: number;
  production_center_id?: number;

  anio: number;
  tipo_memoria: 'productor' | 'gestor' | 'negociante' | 'agente' | 'transportista';

  fecha_inicio: string;
  fecha_fin: string;

  estado: 'borrador' | 'generado' | 'presentado' | 'validado';

  total_residuos_generados?: number;
  total_residuos_gestionados?: number;
  unidad?: string;

  documento_excel_url?: string;
  documento_pdf_url?: string;

  fecha_presentacion?: string;
  numero_registro_sira?: string;
  sira_presentado: boolean;

  notas?: string;
  created_at: string;
  updated_at: string;

  // Relaciones
  company?: Company;
  production_center?: ProductionCenter;
  lines?: AnnualReportLine[];
}

export interface AnnualReportLine {
  id: number;
  annual_report_id: number;

  identification_document_ids?: number[];

  codigo_ler: string;
  descripcion_residuo: string;

  origen_razon_social?: string;
  origen_nima?: string;
  destino_razon_social?: string;
  destino_nima?: string;

  cantidad_total: number;
  unidad: string;
  numero_operaciones?: number;

  operacion_tratamiento?: string;

  created_at: string;
  updated_at: string;
}

// =====================================================
// MEMORIA ANUAL (Annual Memory/Report)
// =====================================================

export type TipoMemoria =
  | 'productor'           // Memoria Anual de Productores
  | 'gestor'              // Memoria Anual de Gestores
  | 'gestor_raee'         // Memoria Anual de Gestores RAEE
  | 'negociante'          // Memoria Anual de Negociantes
  | 'transportista'       // Memoria Anual de Transportistas
  | 'agente';             // Memoria Anual de Agentes

export type EstadoMemoria =
  | 'borrador'            // En proceso de generación/revisión
  | 'revision'            // Pendiente de revisión
  | 'completada'          // Completada y revisada
  | 'presentada'          // Presentada ante la autoridad
  | 'archivada';          // Archivada

export interface MemoriaAnual {
  id: number;
  user_id: string;
  company_id: number;
  production_center_id?: number;

  // Datos básicos
  tipo_memoria: TipoMemoria;
  año: number;
  numero_memoria: string;        // MA-2024-PROD-001

  // Datos de la empresa en el momento de la memoria
  nombre_empresa: string;
  nif_empresa: string;
  nombre_centro?: string;
  municipio_centro?: string;
  nima?: string;

  // Datos calculados desde los DI
  total_movimientos: number;      // Total de movimientos registrados
  total_toneladas: number;        // Total de toneladas gestionadas
  fecha_inicio: string;           // 01/01/año
  fecha_fin: string;              // 31/12/año

  // Resumen por código LER
  resumen_ler?: ResumenLER[];

  // Documentos de identificación incluidos
  documentos_identificacion_ids: number[];

  // Estado y control
  estado: EstadoMemoria;
  fecha_presentacion?: string;
  observaciones?: string;

  // Archivos
  archivo_excel_url?: string;      // URL del Excel generado
  archivo_pdf_url?: string;        // URL del PDF si se genera

  // Metadata
  created_at: string;
  updated_at: string;

  // Relaciones
  production_center?: ProductionCenter;
}

export interface ResumenLER {
  codigo_ler: string;
  descripcion: string;
  cantidad_total: number;
  numero_movimientos: number;
}

// =====================================================
// ENTRADA MEMORIA - Para diferentes tipos de memoria
// =====================================================

// Memoria Anual de Productores
export interface EntradaMemoriaProductor {
  denominacion_proceso: string;
  codigo_ler: string;
  descripcion_residuo: string;
  cantidad_toneladas: number;

  // Destino del residuo
  nima_destino?: string;
  nif_destino: string;
  razon_social_destino: string;
  nombre_centro_destino: string;
  tipo_inscripcion_destino?: string;
  codigo_operacion_rd: string;
  codigo_operacion_rd_4cifras?: string;
  provincia_destino?: string;
  codigo_provincia_destino?: string;
  municipio_destino?: string;
  pais_destino: string;
  codigo_pais_destino: string;
  codigo_di?: string;
}

// Memoria Anual de Gestores - ENTRADAS
export interface EntradaMemoriaGestorEntrada {
  codigo_operacion_rd: string;
  codigo_operacion_rd_4cifras?: string;
  codigo_proceso_interno?: string;
  denominacion_proceso_interno?: string;

  // Identificación del residuo recepcionado
  codigo_ler: string;
  descripcion_residuo: string;
  cantidad_toneladas: number;

  // Instalación de origen
  nima_origen?: string;
  nif_origen: string;
  razon_social_origen: string;
  nombre_centro_origen: string;
  tipo_inscripcion_origen?: string;
  provincia_origen?: string;
  codigo_provincia_origen?: string;
  municipio_origen?: string;
  pais_origen: string;
  codigo_pais_origen: string;
  codigo_di?: string;

  // Organización de la gestión
  srap?: boolean;
  nif_srap?: string;
  nombre_srap?: string;
  nima_srap?: string;
}

// Memoria Anual de Gestores - SALIDAS
export interface EntradaMemoriaGestorSalida {
  // Identificación del residuo
  codigo_ler: string;
  descripcion_residuo: string;
  cantidad_toneladas: number;

  // Destino del residuo
  nima_destino?: string;
  nif_destino: string;
  razon_social_destino: string;
  nombre_centro_destino: string;
  tipo_inscripcion_destino?: string;
  provincia_destino?: string;
  codigo_provincia_destino?: string;
  municipio_destino?: string;
  pais_destino: string;
  codigo_pais_destino: string;
  codigo_di?: string;
  codigo_operacion_rd: string;
  codigo_operacion_rd_4cifras?: string;

  // Organización de la gestión
  srap?: boolean;
  nif_srap?: string;
  nombre_srap?: string;
  nima_srap?: string;
}

// Memoria Anual de Negociantes, Transportistas, Agentes
export interface EntradaMemoriaNegocianteTransportistaAgente {
  // Identificación del residuo
  codigo_ler: string;
  descripcion_residuo: string;
  cantidad_toneladas: number;

  // Procedencia
  nima_origen?: string;
  nif_origen: string;
  razon_social_origen: string;
  nombre_centro_origen: string;
  tipo_inscripcion_origen?: string;
  provincia_origen?: string;
  codigo_provincia_origen?: string;
  municipio_origen?: string;
  pais_origen: string;
  codigo_pais_origen: string;

  // Destino
  nima_destino?: string;
  nif_destino: string;
  razon_social_destino: string;
  nombre_centro_destino: string;
  tipo_inscripcion_destino?: string;
  codigo_operacion_rd_destino: string;
  codigo_operacion_rd_4cifras_destino?: string;
  provincia_destino?: string;
  codigo_provincia_destino?: string;
  municipio_destino?: string;
  pais_destino: string;
  codigo_pais_destino: string;
  codigo_di?: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type TipoEmpresa = 'productor' | 'gestor' | 'transportista' | 'negociante' | 'agente';
export type TipoContrato = 'tratamiento' | 'recogida' | 'transporte' | 'valoracion' | 'eliminacion';
export type EstadoContrato = 'borrador' | 'vigente' | 'finalizado' | 'cancelado';
export type CategoriaResiduo = 'no-peligroso' | 'peligroso';
export type EstadoFisico = 'solido' | 'liquido' | 'pastoso' | 'gaseoso';
export type UnidadMedida = 'kg' | 'toneladas' | 'litros' | 'm3' | 'unidades';

// =====================================================
// ENVIRONMENTAL AUTHORIZATIONS & SCOPE MATRIX
// =====================================================

export interface AuthorizationWasteCode {
  id: number;
  authorization_id: number;
  codigo_ler: string;
  descripcion_ler?: string;
  operaciones_tratamiento: string[]; // Ej: ['R01', 'R13']
  capacidad_anual_toneladas?: number;
  created_at: string;
}

export interface AuthorizationWasteCodeFormData {
  codigo_ler: string;
  descripcion_ler?: string;
  operaciones_tratamiento: string[];
  capacidad_anual_toneladas?: number;
}

export interface EnvironmentalAuthorization {
  id: number;
  user_id: string;
  company_id: number;
  production_center_id?: number | null;
  numero_autorizacion: string;
  titulo: string;
  organismo_emisor?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  es_indefinida: boolean;
  archivo_url?: string;
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  company?: Company;
  production_center?: ProductionCenter;
  waste_codes?: AuthorizationWasteCode[];
}

export interface EnvironmentalAuthorizationFormData {
  company_id: number;
  production_center_id?: number | null;
  numero_autorizacion: string;
  titulo: string;
  organismo_emisor?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  es_indefinida?: boolean;
  archivo_url?: string;
  notas?: string;
  activo?: boolean;
  waste_codes?: AuthorizationWasteCodeFormData[];
}

// =====================================================
// ARCHIVO CRONOLÓGICO (ART. 64 LEY 7/2022)
// =====================================================

export type TipoOperacionCronologica =
  | 'produccion_interna'
  | 'salida_traslado'
  | 'entrada_recepcion'
  | 'tratamiento_interno'
  | 'merma_ajuste';

export interface ChronologicalEntry {
  id: number;
  user_id: string;
  company_id?: number | null;
  production_center_id?: number | null;
  numero_asiento: string;
  fecha: string;
  tipo_operacion: TipoOperacionCronologica;
  codigo_ler: string;
  descripcion_residuo: string;
  peligrosidad: 'no-peligroso' | 'peligroso';
  codigo_hp?: string[] | null;
  estado_fisico?: 'solido' | 'liquido' | 'pastoso' | 'gaseoso' | null;
  cantidad_kg: number;
  cantidad_t?: number;
  envase_tipo?: string | null;
  envase_unidades?: number | null;

  // Procedencia / Origen
  origen_tipo?: string;
  origen_nif?: string | null;
  origen_razon_social?: string | null;
  origen_nima?: string | null;
  origen_direccion?: string | null;
  origen_municipio?: string | null;
  origen_provincia?: string | null;

  // Transportista
  transportista_nif?: string | null;
  transportista_razon_social?: string | null;
  transportista_nima?: string | null;
  transportista_matricula?: string | null;

  // Destino
  destino_tipo?: string;
  destino_nif?: string | null;
  destino_razon_social?: string | null;
  destino_nima?: string | null;
  destino_autorizacion?: string | null;
  destino_direccion?: string | null;
  destino_municipio?: string | null;
  destino_provincia?: string | null;

  // Tratamiento
  operacion_rd?: string | null;
  operacion_rd_descripcion?: string | null;

  // Vínculos
  identification_document_id?: number | null;
  numero_documento_referencia?: string | null;
  observaciones?: string | null;

  created_at: string;
  updated_at: string;

  // Relaciones opcionales expandidas
  production_center?: ProductionCenter;
}

export interface ChronologicalEntryFormData {
  company_id?: number | null;
  production_center_id?: number | null;
  fecha: string;
  tipo_operacion: TipoOperacionCronologica;
  codigo_ler: string;
  descripcion_residuo: string;
  peligrosidad: 'no-peligroso' | 'peligroso';
  codigo_hp?: string[];
  estado_fisico?: 'solido' | 'liquido' | 'pastoso' | 'gaseoso';
  cantidad_kg: number;
  envase_tipo?: string;
  envase_unidades?: number;

  origen_tipo?: string;
  origen_nif?: string;
  origen_razon_social?: string;
  origen_nima?: string;
  origen_direccion?: string;
  origen_municipio?: string;
  origen_provincia?: string;

  transportista_nif?: string;
  transportista_razon_social?: string;
  transportista_nima?: string;
  transportista_matricula?: string;

  destino_tipo?: string;
  destino_nif?: string;
  destino_razon_social?: string;
  destino_nima?: string;
  destino_autorizacion?: string;
  destino_direccion?: string;
  destino_municipio?: string;
  destino_provincia?: string;

  operacion_rd?: string;
  operacion_rd_descripcion?: string;

  identification_document_id?: number | null;
  numero_documento_referencia?: string;
  observaciones?: string;
}

export interface ChronologicalStats {
  total_asientos: number;
  total_kg: number;
  total_t: number;
  kg_peligrosos: number;
  kg_no_peligrosos: number;
  por_operacion: Record<TipoOperacionCronologica, { count: number; kg: number; t: number }>;
  resumen_ler: {
    codigo_ler: string;
    descripcion: string;
    peligrosidad: string;
    cantidad_kg: number;
    cantidad_t: number;
    movimientos: number;
  }[];
}

// =====================================================
// OPERACIONES COMERCIALES (NEGOCIANTE Y AGENTE)
// =====================================================

export type EstadoOperacionComercial =
  | 'borrador'
  | 'abierta'
  | 'en_transito'
  | 'completada'
  | 'liquidada'
  | 'cancelada';

export type TipoPrecioOperacion = 'por_tonelada' | 'lote_fijo' | 'por_kg';

export interface CommercialOperation {
  id: number;
  user_id: string;
  company_id?: number | null;
  numero_operacion: string;
  fecha: string;
  estado: EstadoOperacionComercial;

  // Flujo Físico
  origen_productor_id?: number | null;
  origen_center_id?: number | null;
  origen_nombre_personalizado?: string | null;
  origen_nima?: string | null;
  origen_cif?: string | null;

  destino_gestor_id?: number | null;
  destino_nombre_personalizado?: string | null;
  destino_nima?: string | null;
  destino_cif?: string | null;
  destino_autorizacion?: string | null;

  transportista_id?: number | null;
  transportista_nombre_personalizado?: string | null;
  transportista_cif?: string | null;
  transportista_matricula?: string | null;

  // Residuo
  codigo_ler: string;
  descripcion_residuo: string;
  peligrosidad: 'no-peligroso' | 'peligroso';
  operacion_rd?: string | null;

  cantidad_estimada_t: number;
  cantidad_real_t?: number | null;

  identification_document_id?: number | null;
  numero_albaran_gestor?: string | null;

  // Flujo Comercial Compra
  proveedor_comercial_id?: number | null;
  proveedor_razon_social?: string | null;
  proveedor_cif?: string | null;
  tipo_precio_compra: TipoPrecioOperacion;
  precio_unitario_compra: number;
  coste_compra_total: number;
  factura_compra_ref?: string | null;
  estado_pago_compra: 'pendiente' | 'pagado' | 'no_aplica';

  // Flujo Comercial Venta
  cliente_comercial_id?: number | null;
  cliente_razon_social?: string | null;
  cliente_cif?: string | null;
  tipo_precio_venta: TipoPrecioOperacion;
  precio_unitario_venta: number;
  ingreso_venta_total: number;
  factura_venta_ref?: string | null;
  estado_cobro_venta: 'pendiente' | 'cobrado' | 'no_aplica';

  // Logística y Costes
  coste_transporte: number;
  otros_costes: number;
  descripcion_otros_costes?: string | null;

  // Rentabilidad
  margen_bruto_total: number;
  margen_unitario_tonelada: number;
  porcentaje_margen: number;

  observaciones?: string | null;
  created_at: string;
  updated_at: string;

  // Relaciones expandidas opcionales
  origen_productor?: Company;
  origen_center?: ProductionCenter;
  destino_gestor?: Company;
  transportista?: Company;
  proveedor_comercial?: Company;
  cliente_comercial?: Company;
  identification_document?: IdentificationDocument;
}

export interface CommercialOperationFormData {
  company_id?: number | null;
  fecha: string;
  estado?: EstadoOperacionComercial;

  // Flujo Físico
  origen_productor_id?: number | null;
  origen_center_id?: number | null;
  origen_nombre_personalizado?: string;
  origen_nima?: string;
  origen_cif?: string;

  destino_gestor_id?: number | null;
  destino_nombre_personalizado?: string;
  destino_nima?: string;
  destino_cif?: string;
  destino_autorizacion?: string;

  transportista_id?: number | null;
  transportista_nombre_personalizado?: string;
  transportista_cif?: string;
  transportista_matricula?: string;

  codigo_ler: string;
  descripcion_residuo: string;
  peligrosidad: 'no-peligroso' | 'peligroso';
  operacion_rd?: string;

  cantidad_estimada_t: number;
  cantidad_real_t?: number;

  identification_document_id?: number | null;
  numero_albaran_gestor?: string;

  // Flujo Comercial Compra
  proveedor_comercial_id?: number | null;
  proveedor_razon_social?: string;
  proveedor_cif?: string;
  tipo_precio_compra: TipoPrecioOperacion;
  precio_unitario_compra: number;
  coste_compra_total?: number;
  factura_compra_ref?: string;
  estado_pago_compra?: 'pendiente' | 'pagado' | 'no_aplica';

  // Flujo Comercial Venta
  cliente_comercial_id?: number | null;
  cliente_razon_social?: string;
  cliente_cif?: string;
  tipo_precio_venta: TipoPrecioOperacion;
  precio_unitario_venta: number;
  ingreso_venta_total?: number;
  factura_venta_ref?: string;
  estado_cobro_venta?: 'pendiente' | 'cobrado' | 'no_aplica';

  coste_transporte?: number;
  otros_costes?: number;
  descripcion_otros_costes?: string;

  observaciones?: string;
}

export interface CommercialOperationStats {
  total_operaciones: number;
  toneladas_totales: number;
  facturacion_total: number;
  costes_totales: number;
  margen_bruto_total: number;
  margen_medio_tonelada: number;
  por_estado: Record<EstadoOperacionComercial, number>;
}



