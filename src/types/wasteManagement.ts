// =====================================================
// WASTE MANAGEMENT TYPES
// Tipos TypeScript para el sistema de gestión de residuos
// =====================================================

// =====================================================
// COMPANY (Empresa)
// =====================================================

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
  
  // Clasificación
  tipo_empresa: 'productor' | 'gestor' | 'transportista' | 'negociante' | 'agente';
  
  // Logo
  logo_url?: string;
  
  // Metadata
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  razon_social: string;
  nombre_comercial?: string;
  cif: string;
  nima?: string;
  numero_inscripcion?: string;
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
  tipo_empresa: 'productor' | 'gestor' | 'transportista' | 'negociante' | 'agente';
  logo_url?: string;
  notas?: string;
  activo?: boolean;
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

export interface WasteContract {
  id: number;
  user_id: string;
  
  // Referencias a empresas
  company_id: number;
  gestor_company_id?: number;
  
  // Datos del contrato
  numero_contrato?: string;
  fecha_contrato: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  
  // Tipo
  tipo_contrato: 'tratamiento' | 'recogida' | 'transporte' | 'valoracion' | 'eliminacion';
  
  // Residuos
  waste_type_ids?: number[];
  descripcion_residuos?: string;
  
  // Operaciones
  operaciones_tratamiento?: string[];
  
  // Condiciones
  cantidad_maxima_anual?: number;
  unidad_cantidad?: string;
  precio_unitario?: number;
  moneda?: string;
  
  // Estado
  estado: 'borrador' | 'vigente' | 'finalizado' | 'cancelado';
  
  // Documentación
  documento_url?: string;
  
  // Metadata
  notas?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones (populated)
  company?: Company;
  gestor_company?: Company;
  waste_types?: WasteType[];
}

export interface WasteContractFormData {
  company_id: number;
  gestor_company_id?: number;
  numero_contrato?: string;
  fecha_contrato: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_contrato: 'tratamiento' | 'recogida' | 'transporte' | 'valoracion' | 'eliminacion';
  waste_type_ids?: number[];
  descripcion_residuos?: string;
  operaciones_tratamiento?: string[];
  cantidad_maxima_anual?: number;
  unidad_cantidad?: string;
  precio_unitario?: number;
  moneda?: string;
  estado?: 'borrador' | 'vigente' | 'finalizado' | 'cancelado';
  documento_url?: string;
  notas?: string;
}

// =====================================================
// IDENTIFICATION DOCUMENT (Documento de Identificación)
// =====================================================

export interface IdentificationDocument {
  id: number;
  user_id: string;
  contract_id?: number;
  company_id: number;
  
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
  transportista_matricula?: string;
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
  
  // Firmas
  firmado_productor: boolean;
  firmado_gestor: boolean;
  firmado_transportista: boolean;
  fecha_firma_productor?: string;
  fecha_firma_gestor?: string;
  fecha_firma_transportista?: string;
  
  // Documentación
  documento_url?: string;
  
  // Estado
  estado: 'borrador' | 'pendiente-firma' | 'completado' | 'cancelado';
  
  // Metadata
  notas?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  company?: Company;
  contract?: WasteContract;
  waste_type?: WasteType;
}

// =====================================================
// ANNUAL REPORT (Memoria Anual)
// =====================================================

export interface AnnualReport {
  id: number;
  user_id: string;
  company_id: number;
  
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
