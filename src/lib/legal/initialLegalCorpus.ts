import type { LegalScope } from '@/types/legalAssistant';
import type { AppModule } from '@/types/wasteManagement';

export interface SeedLegalChunk {
  id: string;
  documentCode: string;
  documentTitle: string;
  ambito: LegalScope;
  ccaa?: string | null;
  boeUrl?: string | null;
  appPath?: string | null;
  appPathLabel?: string | null;
  requiredModule?: AppModule;
  articleRef: string;
  sectionTitle: string;
  keywords: string[];
  content: string;
}

/**
 * Corpus normativo semilla (España / UE) para el piloto del asistente RAG.
 * Sirve tanto como fuente inicial para el script de ingesta en Supabase pgvector
 * (`scripts/ingest-legal-corpus.mjs`) como respaldo local si aún no se han
 * indexado vectores en la base de datos.
 */
export const INITIAL_LEGAL_CORPUS: SeedLegalChunk[] = [
  {
    id: 'ley7-2022-art20',
    documentCode: 'LEY_7_2022',
    documentTitle: 'Ley 7/2022, de 8 de abril, de residuos y suelos contaminados para una economía circular',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809#a20',
    articleRef: 'Art. 20 Ley 7/2022',
    sectionTitle: 'Obligaciones del productor inicial u otro poseedor relativas a la gestión de sus residuos',
    keywords: ['productor', 'obligaciones', 'tratamiento', 'gestor autorizado', 'responsabilidad', 'acreditación documental'],
    content:
      'El productor inicial u otro poseedor de residuos está obligado a asegurar el tratamiento adecuado de sus residuos, bien realizándolo por sí mismo si dispone de autorización, o encargándolo a un negociante registrado o a una entidad o empresa registrada que lleve a cabo operaciones de tratamiento. La entrega debe acreditarse documentalmente. La responsabilidad del productor inicial concluye cuando quede debidamente documentado el tratamiento completo a través de los correspondientes documentos de traslado de residuos y, cuando proceda, certificados o declaraciones responsables de la instalación de destino.',
  },
  {
    id: 'ley7-2022-art21',
    documentCode: 'LEY_7_2022',
    documentTitle: 'Ley 7/2022, de 8 de abril, de residuos y suelos contaminados para una economía circular',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809#a21',
    articleRef: 'Art. 21 Ley 7/2022',
    sectionTitle: 'Almacenamiento, mezcla, envasado y etiquetado de residuos en el lugar de producción',
    keywords: ['almacenamiento', 'almacenar', 'tiempo', 'plazo', '6 meses', '1 año', '2 años', 'peligrosos', 'no peligrosos', 'etiquetado', 'mezcla', 'envasado'],
    content:
      'La duración máxima del almacenamiento de residuos no peligrosos en el lugar de producción será inferior a dos años cuando se destinen a valorización y a un año cuando se destinen a eliminación. En el caso de los residuos peligrosos, en ambos supuestos, la duración máxima será de seis meses; en supuestos excepcionales, la autoridad competente de la Comunidad Autónoma podrá modificar este plazo por causas debidamente justificadas. Está prohibido mezclar o diluir residuos peligrosos con otras categorías de residuos peligrosos o con otros residuos, sustancias o materiales. Los recipientes con residuos peligrosos deben estar correctamente envasados y etiquetados indicando código LER, datos del productor, fecha de inicio de almacenamiento y pictogramas de peligro.',
  },
  {
    id: 'ley7-2022-art23',
    documentCode: 'LEY_7_2022',
    documentTitle: 'Ley 7/2022, de 8 de abril, de residuos y suelos contaminados para una economía circular',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809#a23',
    articleRef: 'Art. 23 Ley 7/2022',
    sectionTitle: 'Obligaciones de los gestores de residuos',
    keywords: ['gestor', 'tratamiento', 'almacenamiento', 'fianza', 'seguro', 'autorización', 'nima'],
    content:
      'Las entidades o empresas que realicen actividades de recogida y tratamiento de residuos deberán disponer de la autorización o comunicación previa correspondiente inscrita en el Registro de Producción y Gestión de Residuos (NIMA). Deben mantener los residuos almacenados en condiciones adecuadas de higiene y seguridad (máximo 6 meses para peligrosos y 1 o 2 años para no peligrosos según destino eliminación o valorización), constituir fianza y suscribir seguro de responsabilidad civil cuando sea exigible para residuos peligrosos o instalaciones de tratamiento.',
  },
  {
    id: 'ley7-2022-art35',
    documentCode: 'LEY_7_2022',
    documentTitle: 'Ley 7/2022, de 8 de abril, de residuos y suelos contaminados para una economía circular',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809#a35',
    articleRef: 'Art. 35 Ley 7/2022',
    sectionTitle: 'Comunicaciones previas al inicio de actividades de producción y gestión de residuos',
    keywords: ['comunicación previa', 'pequeño productor', '10 toneladas', '1000 toneladas', 'nima', 'transportista', 'negociante', 'agente'],
    content:
      'Deberán presentar comunicación previa ante la Comunidad Autónoma donde estén ubicadas: las instalaciones o actividades que generen residuos peligrosos (sin límite mínimo de cantidad) y las que generen más de 1.000 toneladas anuales de residuos no peligrosos. También requieren comunicación previa los transportistas de residuos con carácter profesional, los agentes y los negociantes. Estas inscripciones quedan reflejadas en el Registro de Producción y Gestión de Residuos.',
  },
  {
    id: 'ley7-2022-art64',
    documentCode: 'LEY_7_2022',
    documentTitle: 'Ley 7/2022, de 8 de abril, de residuos y suelos contaminados para una economía circular',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809#a64',
    articleRef: 'Art. 64 Ley 7/2022',
    sectionTitle: 'Archivo cronológico',
    keywords: ['archivo cronológico', 'libro registro', '5 años', 'conservación', 'formato electrónico', 'trazabilidad'],
    content:
      'Las personas físicas o jurídicas registradas dispondrán de un archivo electrónico donde se recojan por orden cronológico la cantidad, naturaleza y origen del residuo generado y la cantidad de productos, materiales o sustancias y residuos resultantes de la preparación para la reutilización, el reciclado, otras operaciones de valorización y eliminación; y cuando proceda, se inscribirá también el destino, la frecuencia de recogida, el medio de transporte y el método de tratamiento previsto. La información del archivo cronológico se guardará durante al menos cinco años y estará a disposición de las autoridades competentes a efectos de inspección y control.',
  },
  {
    id: 'ley7-2022-art65',
    documentCode: 'LEY_7_2022',
    documentTitle: 'Ley 7/2022, de 8 de abril, de residuos y suelos contaminados para una economía circular',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809#a65',
    articleRef: 'Art. 65 Ley 7/2022',
    sectionTitle: 'Memoria anual de gestión de residuos',
    keywords: ['memoria anual', '1 de marzo', 'plazo', 'gestor', 'productor', 'resumen', 'archivo cronológico', 'esir'],
    content:
      'Antes del 1 de marzo del año posterior respecto al cual se hayan recogido los datos, las personas físicas o jurídicas que hayan obtenido una autorización de tratamiento de residuos (y los productores de residuos peligrosos o gestores obligados según su régimen) enviarán una memoria resumen de la información contenida en el archivo cronológico a la Comunidad Autónoma en la que esté ubicada la instalación, y en el caso de residuos de competencia municipal también a las entidades locales. Las entidades deben conservar copia de la memoria anual a disposición de las autoridades.',
  },
  {
    id: 'rd553-2020-art3',
    documentCode: 'RD_553_2020',
    documentTitle: 'Real Decreto 553/2020, de 2 de junio, por el que se regula el traslado de residuos en el interior del territorio del Estado',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-6422#a3',
    articleRef: 'Art. 3 y Art. 5 RD 553/2020',
    sectionTitle: 'Requisitos previos al traslado y Contrato de Tratamiento (CT)',
    keywords: ['contrato de tratamiento', 'ct', 'traslado', 'operador del traslado', 'requisitos previos', 'especificaciones'],
    content:
      'Todo traslado de residuos debe ir precedido de un Contrato de Tratamiento (CT) suscrito entre el operador del traslado y el gestor de la instalación de destino. El contrato debe incluir al menos: identificación de las instalaciones de origen y destino (NIMA), cantidad estimada de residuos a trasladar, identificación de los residuos mediante código LER, periodicidad estimada de los traslados, operación de tratamiento (R o D), condiciones de aceptación y obligaciones de las partes en caso de rechazo del residuo.',
  },
  {
    id: 'rd553-2020-art6',
    documentCode: 'RD_553_2020',
    documentTitle: 'Real Decreto 553/2020, de 2 de junio, por el que se regula el traslado de residuos en el interior del territorio del Estado',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-6422#a6',
    articleRef: 'Art. 6 RD 553/2020',
    sectionTitle: 'Documento de Identificación (DI)',
    keywords: ['di', 'documento de identificación', 'traslado', 'transporte', 'acompañar', '3 años', 'esir', 'sira'],
    content:
      'Todos los traslados de residuos deberán ir acompañados desde el inicio hasta la entrega en destino de un Documento de Identificación (DI) cumplimentado por el operador del traslado. Cuando el traslado está sujeto a Notificación Previa (NT), el DI debe tramitarse obligatoriamente por vía electrónica a través de eSIR o la plataforma autonómica conectada (como SIRA en Andalucía, SDR en Cataluña, IKS-eeM en País Vasco, etc.). El operador y el gestor deben conservar los DI completos durante un mínimo de tres años (cinco años a efectos del archivo cronológico de la Ley 7/2022).',
  },
  {
    id: 'rd553-2020-art7',
    documentCode: 'RD_553_2020',
    documentTitle: 'Real Decreto 553/2020, de 2 de junio, por el que se regula el traslado de residuos en el interior del territorio del Estado',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-6422#a7',
    articleRef: 'Art. 7 RD 553/2020',
    sectionTitle: 'Aceptación o rechazo de residuos en destino y plazos del DI',
    keywords: ['aceptación', 'rechazo', '30 días', 'plazo di', 'discrepancia', 'peso', 'gestor destino'],
    content:
      'Una vez recibidos los residuos en la instalación de destino, el gestor dispone de un plazo máximo de treinta días naturales desde la recepción para efectuar las comprobaciones necesarias y remitir al operador del traslado el Documento de Identificación completado indicando la aceptación o el rechazo del residuo y la cantidad exacta pesada en destino. En caso de rechazo, el operador debe devolver el residuo al origen o enviarlo a otra instalación autorizada.',
  },
  {
    id: 'rd553-2020-art8',
    documentCode: 'RD_553_2020',
    documentTitle: 'Real Decreto 553/2020, de 2 de junio, por el que se regula el traslado de residuos en el interior del territorio del Estado',
    ambito: 'estatal',
    boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-6422#a8',
    articleRef: 'Art. 3.2 y Art. 8 RD 553/2020',
    sectionTitle: 'Notificación Previa de Traslado (NT): cuándo es obligatoria y plazos',
    keywords: ['nt', 'notificación previa', '10 días', '3 años', 'peligrosos', 'eliminación', 'valorización', 'domésticos', '200301'],
    content:
      'Están sometidos al requisito de Notificación Previa (NT): 1) Todos los traslados de residuos peligrosos; 2) Los traslados de residuos no peligrosos destinados a eliminación; 3) Los traslados de residuos destinados a instalaciones de incineración clasificadas como valorización (R1) y los residuos domésticos mezclados (LER 20 03 01) destinados a valorización. La NT debe presentarse ante la autoridad competente con al menos diez días naturales de antelación al inicio del traslado (o 2 días si ya existe NT general). Una NT general para traslados múltiples con las mismas características tiene una vigencia máxima de tres años.',
  },
  {
    id: 'ler-2014-955-ue',
    documentCode: 'DECISION_2014_955_UE',
    documentTitle: 'Decisión 2014/955/UE de la Comisión — Lista Europea de Residuos (LER)',
    ambito: 'ue',
    boeUrl: 'https://www.boe.es/buscar/doc.php?id=DOUE-L-2014-83641',
    articleRef: 'Anexo Decisión 2014/955/UE (LER)',
    sectionTitle: 'Clasificación de residuos mediante códigos LER y peligrosidad (HP)',
    keywords: ['ler', 'código ler', 'asterisco', 'peligroso', 'espejo', 'hp', 'clasificación', '6 dígitos'],
    content:
      'Todo residuo se clasifica mediante un código LER de seis dígitos agrupado en 20 capítulos según el proceso o actividad de origen. Los códigos marcados con un asterisco (*) corresponden a residuos peligrosos (RP). Existen entradas absolutas peligrosas, absolutas no peligrosas y entradas espejo (un código con asterisco y su par sin asterisco): en las entradas espejo debe evaluarse si el residuo presenta alguna característica de peligrosidad HP1 a HP15 conforme al Reglamento (UE) 1357/2014 antes de clasificarlo como no peligroso.',
  },
  // =========================================================================
  // GUÍA DE PLATAFORMA — RESIGEST 360 (Nivel 1)
  // =========================================================================
  {
    id: 'resigest-mi-empresa',
    documentCode: 'RESIGEST_GUIA',
    documentTitle: 'Guía de Plataforma ResiGest 360',
    ambito: 'plataforma',
    appPath: '/residuos/mi-empresa',
    appPathLabel: 'Ir a Mi Empresa',
    articleRef: 'Guía ResiGest · Mi Empresa',
    sectionTitle: 'Configurar datos fiscales, NIMA, centros de producción y perfil operativo',
    keywords: ['mi empresa', 'nima', 'cif', 'centro de produccion', 'perfil operativo', 'configurar', 'alta empresa', 'plataforma', 'resigest', 'consejos'],
    content:
      'En ResiGest 360, desde el módulo Mi Empresa (/residuos/mi-empresa) puedes configurar la razón social, CIF, NIMA, número de inscripción ambiental, domicilio social y de instalación, así como dar de alta y gestionar tus Centros de Producción (cada uno con su propio NIMA y provincia). También puedes ajustar preferencias de la interfaz (como mostrar u ocultar consejos) y revisar los módulos activos según tu perfil operativo.',
  },
  {
    id: 'resigest-contratos',
    documentCode: 'RESIGEST_GUIA',
    documentTitle: 'Guía de Plataforma ResiGest 360',
    ambito: 'plataforma',
    appPath: '/residuos/contratos',
    appPathLabel: 'Ir a Contratos',
    requiredModule: 'contratos',
    articleRef: 'Guía ResiGest · Contratos (CT)',
    sectionTitle: 'Crear, firmar digitalmente (AutoFirma / PAdES) y enviar Contratos de Tratamiento',
    keywords: ['contrato', 'contratos', 'firma digital', 'autofirma', 'pades', 'firmar contrato', 'pdf firmado', 'enlace firma', 'como crear contrato', 'plataforma', 'resigest'],
    content:
      'En el módulo Contratos de Tratamiento (/residuos/contratos) puedes crear nuevos CT vinculando el centro productor, el gestor de destino, los códigos LER y la operación de tratamiento (R/D). ResiGest 360 permite generar el PDF oficial del contrato, enviarlo para firma pública externa mediante enlace seguro y firmarlo con certificado digital cualificado (AutoFirma / PAdES) manteniendo trazabilidad criptográfica.',
  },
  {
    id: 'resigest-notificaciones-previas',
    documentCode: 'RESIGEST_GUIA',
    documentTitle: 'Guía de Plataforma ResiGest 360',
    ambito: 'plataforma',
    appPath: '/residuos/notificaciones-previas',
    appPathLabel: 'Ir a Notificaciones Previas',
    requiredModule: 'di',
    articleRef: 'Guía ResiGest · Notificaciones Previas (NT)',
    sectionTitle: 'Crear y tramitar Notificaciones Previas (NT) en ResiGest 360',
    keywords: ['notificacion previa', 'nt', 'tramitar nt', 'crear nt', 'enviar nt', 'sira', 'esir', 'plataforma', 'resigest'],
    content:
      'Desde Notificaciones Previas (/residuos/notificaciones-previas) puedes dar de alta NT individuales o generales asociadas a un Contrato de Tratamiento activo, controlar su fecha de vigencia (hasta 3 años en NT generales) y enviarlas telemáticamente a la plataforma oficial correspondiente (e-SIR o SIRA en Andalucía según la comunidad autónoma del origen y destino).',
  },
  {
    id: 'resigest-documentos-identificacion',
    documentCode: 'RESIGEST_GUIA',
    documentTitle: 'Guía de Plataforma ResiGest 360',
    ambito: 'plataforma',
    appPath: '/residuos/documentos-identificacion',
    appPathLabel: 'Ir a Documentos (DI)',
    requiredModule: 'di',
    articleRef: 'Guía ResiGest · Documentos de Identificación (DI)',
    sectionTitle: 'Emitir, firmar, justificar discrepancias y enviar DI a SIRA/e-SIR',
    keywords: ['di', 'documento de identificacion', 'traslado', 'emitir di', 'crear di', 'firmar di', 'discrepancia', 'peso', 'enviar di', 'sira', 'esir', 'plataforma', 'resigest'],
    content:
      'En Documentos de Identificación (/residuos/documentos-identificacion) puedes emitir nuevos DI a partir de un Contrato de Tratamiento (y su NT si aplica), asignar transportista/vehículo, generar el PDF oficial con código QR, recoger firmas en origen/destino, registrar y justificar discrepancias de peso si difiere la cantidad pesada en planta, y enviar el DI electrónicamente a SIRA o e-SIR.',
  },
  {
    id: 'resigest-deca',
    documentCode: 'RESIGEST_GUIA',
    documentTitle: 'Guía de Plataforma ResiGest 360',
    ambito: 'plataforma',
    appPath: '/residuos/deca',
    appPathLabel: 'Ir a Control DeCA',
    requiredModule: 'deca',
    articleRef: 'Guía ResiGest · Control DeCA y QR Conductor',
    sectionTitle: 'Documentación en cabina (DeCA), enlace QR y vista móvil del conductor',
    keywords: ['deca', 'qr', 'conductor', 'cabina', 'movil', 'inspeccion', 'carretera', 'compartir deca', 'plataforma', 'resigest'],
    content:
      'El módulo Control DeCA (/residuos/deca) permite llevar la documentación obligatoria de traslado accesible en carretera mediante un enlace y código QR seguro para el conductor. Ante una inspección en ruta, el conductor puede mostrar desde el móvil los DI activos, autorizaciones y datos del traslado sin necesidad de cargar papel.',
  },
  {
    id: 'resigest-archivo-memorias',
    documentCode: 'RESIGEST_GUIA',
    documentTitle: 'Guía de Plataforma ResiGest 360',
    ambito: 'plataforma',
    appPath: '/residuos/memorias-anuales',
    appPathLabel: 'Ir a Memorias Anuales',
    requiredModule: 'memorias_anuales',
    articleRef: 'Guía ResiGest · Archivo Cronológico y Memoria Anual',
    sectionTitle: 'Consultar el Archivo Cronológico y generar la Memoria Anual',
    keywords: ['archivo cronologico', 'memoria anual', 'exportar memoria', 'resumen anual', 'toneladas', 'excel', 'pdf', 'plataforma', 'resigest'],
    content:
      'ResiGest 360 alimenta automáticamente el Archivo Cronológico (/residuos/archivo-cronologico) con todos los DI aceptados y operaciones registradas. Desde Memorias Anuales (/residuos/memorias-anuales) puedes consolidar los totales anuales por código LER, centro y operación de tratamiento para preparar y presentar la memoria antes del 1 de marzo.',
  },
  {
    id: 'resigest-flota',
    documentCode: 'RESIGEST_GUIA',
    documentTitle: 'Guía de Plataforma ResiGest 360',
    ambito: 'plataforma',
    appPath: '/residuos/flota',
    appPathLabel: 'Ir a Flota y Transporte',
    requiredModule: 'flota_transporte',
    articleRef: 'Guía ResiGest · Flota, Vehículos y Conductores',
    sectionTitle: 'Gestionar vehículos, conductores y alertas de caducidad (ITV, Seguro, ADR, CAP)',
    keywords: ['flota', 'vehiculos', 'camiones', 'conductores', 'matricula', 'itv', 'seguro', 'adr', 'cap', 'alertas', 'caducidad', 'transportista', 'plataforma', 'resigest'],
    content:
      'Desde Flota y Transportistas (/residuos/flota) puedes registrar tus vehículos (matrícula, tipo, MMA, tara, tarjeta de transporte) y conductores, junto con las fechas de caducidad de ITV, Seguro, ADR y CAP. ResiGest 360 genera alertas automáticas de próximos vencimientos o documentación caducada para evitar incidencias en carretera.',
  },
  {
    id: 'resigest-integraciones',
    documentCode: 'RESIGEST_GUIA',
    documentTitle: 'Guía de Plataforma ResiGest 360',
    ambito: 'plataforma',
    appPath: '/residuos/integraciones',
    appPathLabel: 'Ir a Integraciones',
    requiredModule: 'sira_integraciones',
    articleRef: 'Guía ResiGest · Integraciones (e-SIR, SIRA y Holded)',
    sectionTitle: 'Conectar e-SIR, SIRA (Andalucía) y facturación con Holded',
    keywords: ['integraciones', 'holded', 'facturacion', 'sira', 'esir', 'api', 'conectar', 'auditoria', 'plataforma', 'resigest'],
    content:
      'En el módulo de Integraciones (/residuos/integraciones) puedes configurar las credenciales y el enrutamiento automático hacia plataformas ambientales oficiales (e-SIR estatal y SIRA en Andalucía), conectar tu cuenta de Holded para sincronizar contactos y facturación, y revisar el historial de auditoría de envíos.',
  },
];
