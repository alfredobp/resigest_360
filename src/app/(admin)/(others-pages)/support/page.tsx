'use client';

import React, { useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { toast } from '@/context/ToastContext';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'support' | 'manual' | 'legal' | 'faq'>('support');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Formulario de ticket de soporte
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    company: '',
    modulo: 'Documentos de Identificación (DI)',
    priority: 'media',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [ticketGenerated, setTicketGenerated] = useState<string | null>(null);

  const officialEmail = 'soporte@resigest360.com';
  const urgentEmail = 'urgencias@resigest360.com';
  const dpoEmail = 'dpo@resigest360.com';
  const phoneSupport = '+34 900 836 360';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copiado al portapapeles: ${text}`, label);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.name || !ticketForm.email || !ticketForm.subject || !ticketForm.message) {
      toast.warning('Por favor, rellene todos los campos obligatorios.', 'Campos incompletos');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el ticket.');
      }

      setTicketGenerated(data.ticketId);
      toast.success(
        data.message || `Ticket de soporte ${data.ticketId} registrado con éxito.`,
        'Ticket Enviado'
      );
      setTicketForm({
        name: '',
        email: '',
        company: '',
        modulo: 'Documentos de Identificación (DI)',
        priority: 'media',
        subject: '',
        message: '',
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado al enviar el ticket.';
      toast.error(errorMsg, 'Error de Envío');
    } finally {
      setSubmitting(false);
    }
  };

  // Contenido del manual por módulos
  const manualSections = [
    {
      id: 'intro',
      title: '1. Introducción y Marco Normativo General',
      badge: 'Conceptos Clave',
      summary: 'Arquitectura de Resigest 360 y adecuación a la Ley 7/2022 de Residuos y Suelos Contaminados para una Economía Circular y Real Decreto 553/2020 de Traslados.',
      content: [
        'Resigest 360 es la plataforma integral SaaS para el control, trazabilidad, emisión de documentación y cumplimiento ambiental de productores, gestores y transportistas de residuos en el territorio español.',
        'La plataforma garantiza el cumplimiento del principio de trazabilidad documental exigido por el Artículo 64 de la Ley 7/2022, asegurando la concordancia entre los contratos de tratamiento, las notificaciones previas de traslado (NT), los documentos de identificación (DI) y los asientos registrales del archivo cronológico.',
        'Soporta el formato de intercambio de datos normalizado e3l v3.6, utilizado por el Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO) y las comunidades autónomas a través del sistema SIRA / e-SIR.'
      ],
      steps: [
        'Acceso seguro mediante autenticación cifrada y perfiles de rol (Administrador, Operador de Planta, Conductor / Transportista).',
        'Configuración del perfil de empresa con asignación obligatoria del NIMA autonómico.',
        'Generación de documentos con firma electrónica y custodia telemática durante 5 años.'
      ]
    },
    {
      id: 'mi-empresa',
      title: '2. Configuración de "Mi Empresa" y Centros Productores',
      badge: 'Paso 1 Obligatorio',
      summary: 'Registro de datos fiscales, NIMA, NIF, CNAE y geolocalización de las instalaciones o centros de producción.',
      content: [
        'En la sección "Mi Empresa", debe configurarse la ficha principal de la entidad titular de la actividad.',
        'El NIMA (Número de Identificación de Medio Ambiente) es un código alfanumérico único de 10 dígitos asignado por la comunidad autónoma correspondiente al centro emisor o receptor. Sin este identificador no podrán generarse traslados telemáticos e3l.',
        'La plataforma permite registrar múltiples Centros de Producción (sucursales, obras, plantas satélites), cada uno con su dirección física, código postal, municipio, provincia y coordenadas cartográficas (GIS).'
      ],
      steps: [
        'Paso 1: Diríjase a "Mi Empresa" en el menú lateral principal.',
        'Paso 2: Complete Razón Social, Nombre Comercial, CIF y NIMA social.',
        'Paso 3: En el bloque inferior "Centros de Producción", haga clic en "Añadir Centro" e introduzca el nombre de la instalación, dirección y NIMA específico del centro.',
        'Paso 4: Adjunte el logotipo oficial de su empresa en formato PNG/JPG para que aparezca automáticamente en la cabecera de los DIs y contratos impresos.'
      ]
    },
    {
      id: 'terceros',
      title: '3. Empresas, Gestores y Transportistas',
      badge: 'Directorio',
      summary: 'Gestión de la base de datos de colaboradores, clientes, gestores autorizados y transportistas con sus habilitaciones ambientales.',
      content: [
        'Resigest 360 centraliza el catálogo de terceros que intervienen en el flujo de residuos.',
        'Gestores Autorizados: Es obligatorio especificar el NIMA de la instalación destinataria y las operaciones de tratamiento para las que están legalmente autorizados (operaciones de valorización R1 a R13, o de eliminación D1 a D15 según los anexos II y III de la Ley 7/2022).',
        'Transportistas: Deben registrarse con su NIF, NIMA de transportista de residuos, y matrículas de vehículos habilitados para el transporte de residuos no peligrosos y/o peligrosos (ADR).'
      ],
      steps: [
        'Vaya a "Empresas y Contactos" o al subapartado específico ("Gestores" / "Transportistas").',
        'Verifique que el NIMA del gestor coincide con el registro oficial de su comunidad autónoma.',
        'Vincule el transportista a los contratos o documentos de identificación al momento de la salida de la mercancía.'
      ]
    },
    {
      id: 'contratos',
      title: '4. Contratos de Tratamiento de Residuos',
      badge: 'Obligación Previa',
      summary: 'Formalización del Contrato de Tratamiento previo conforme al Artículo 5 del RD 553/2020 de traslados de residuos.',
      content: [
        'Antes de realizar cualquier traslado de residuos a una planta de tratamiento, la legislación exige la existencia de un contrato de tratamiento previo formalizado entre el operador del traslado (productor o poseedor) y el gestor de la instalación de destino.',
        'El contrato debe especificar el código LER (Lista Europea de Residuos), la descripción, la periodicidad de recogida, las operaciones de tratamiento previstas (R/D) y las condiciones de aceptación.',
        'Resigest 360 incorpora un módulo de firma digital para que ambas partes puedan suscribir el contrato telemáticamente con plena validez legal.'
      ],
      steps: [
        'Acceda a "Contratos" y pulse "Nuevo Contrato de Tratamiento".',
        'Seleccione el Centro Productor de origen y la Instalación Gestora destinataria.',
        'Añada uno o varios códigos LER con su denominación oficial y tratamiento acordado.',
        'Firme electrónicamente el documento y envíelo para la firma del gestor o descárguelo en PDF sellado.'
      ]
    },
    {
      id: 'di',
      title: '5. Documentos de Identificación (DI / DCS) y Sistema SIRA',
      badge: 'Operativa Diaria',
      summary: 'Ciclo de vida completo del traslado de residuos: creación, salida, transporte, recepción, pesaje final y emisión de XML e3l v3.6.',
      content: [
        'El Documento de Identificación (DI) acompaña a los residuos durante su transporte desde el centro de origen hasta la planta de tratamiento final.',
        'Estados del DI en Resigest 360: Borrador -> Notificado / Listo -> En Tránsito (firmado por transportista al cargar) -> Recepcionado en Planta -> Aceptado / Rechazado.',
        'Múltiples residuos: Si la normativa autonómica lo admite, es posible agrupar diferentes códigos LER en un mismo traslado bajo un solo documento multiproducto.',
        'Integración telemática: Al completar el DI, la plataforma genera automáticamente el archivo XML normalizado conforme al esquema e3l v3.6 listo para su transmisión a SIRA (o la plataforma autonómica correspondiente).'
      ],
      steps: [
        'Acceda a "Documentos de Identificación" y pulse "Nuevo DI".',
        'Seleccione el Contrato marco de referencia para que los datos del gestor y código LER se completen automáticamente.',
        'Indique la fecha y hora prevista de salida, los bultos/envases y el peso estimado en báscula.',
        'Al momento de la carga, el transportista firma digitalmente en pantalla o mediante código de verificación.',
        'Cuando el gestor realiza el pesaje definitivo en báscula de destino, valida la aceptación y el DI queda automáticamente cerrado y firmado.'
      ]
    },
    {
      id: 'archivo-cronologico',
      title: '6. Archivo Cronológico Telemático',
      badge: 'Libro Oficial',
      summary: 'Libro de registro cronológico automático y asientos de regularización conforme al Artículo 64 de la Ley 7/2022.',
      content: [
        'Toda entidad o empresa que genere o gestione residuos está obligada a mantener un archivo cronológico en el que figuren, por orden de fecha, las cantidades, naturaleza, origen, destino, frecuencia de recogida, medio de transporte y método de tratamiento de los residuos generados o gestionados.',
        'Automatización total: Cada vez que un Documento de Identificación (DI) es cerrado con éxito, Resigest 360 crea automáticamente el asiento correspondiente en el Archivo Cronológico, evitando la doble introducción de datos.',
        'Regularizaciones y Mermas: Si se producen discrepancias por secado, evaporación, autoconsumo o recuento de inventario, se pueden registrar asientos de regularización manual justificando la causa técnica.'
      ],
      steps: [
        'Vaya a "Archivo Cronológico" para visualizar los asientos ordenados cronológicamente.',
        'Utilice los filtros avanzados por centro productor, rango de fechas, código LER o tipo de operación.',
        'Para inspecciones de medio ambiente o auditorías ISO 14001, pulse "Exportar Asientos (Excel / CSV / PDF)".',
        'Para registrar una merma o corrección, pulse "Nuevo Asiento de Regularización" e introduzca la justificación y variación de kilos.'
      ]
    },
    {
      id: 'memorias',
      title: '7. Memorias Anuales de Producción y Gestión',
      badge: 'Declaración Anual',
      summary: 'Consolidación de balances anuales de residuos para su presentación oficial ante las Consejerías de Medio Ambiente.',
      content: [
        'Antes del 31 de marzo de cada año natural, los gestores de residuos y determinados productores deben remitir a las autoridades competentes una memoria resumen de la información contenida en el archivo cronológico.',
        'Resigest 360 procesa todos los movimientos del año seleccionado y genera la memoria agregada por centro de producción, código LER y tipo de operación (R/D), calculando automáticamente las sumas totales en toneladas.',
        'El informe resultante cumple con la estructura requerida por el Ministerio y las consejerías autonómicas.'
      ],
      steps: [
        'Diríjase a "Memorias Anuales".',
        'Seleccione el ejercicio fiscal (por ejemplo, 2025 o 2026) y el centro de producción deseado.',
        'Revise las tablas de consolidación de entradas, salidas y existencias al cierre del ejercicio.',
        'Genere el informe final en PDF oficial o exporte el fichero de datos para la presentación telemática en la sede electrónica.'
      ]
    }
  ];

  // Preguntas Frecuentes (FAQ)
  const faqList = [
    {
      q: '¿Qué ocurre si el gestor rechaza un residuo en la báscula de destino?',
      a: 'Conforme al RD 553/2020, el gestor puede rechazar total o parcialmente un residuo si la caracterización física no coincide con lo declarado en el DI o en el contrato de tratamiento. En Resigest 360, el DI pasará al estado "Rechazado", lo que habilitará automáticamente la opción de generar un traslado de retorno al centro de origen o un traslado a un gestor alternativo autorizado, emitiendo la notificación correspondiente.'
    },
    {
      q: '¿Cómo obtengo mi NIMA si aún no dispongo de él?',
      a: 'El NIMA (Número de Identificación de Medio Ambiente) lo asigna el órgano ambiental de la comunidad autónoma donde radica la instalación tras la presentación de la Comunicación Previa de Producción o la solicitud de Autorización Ambiental. Si ya ha presentado la comunicación y desconoce su NIMA, puede consultarlo en el Registro telemático de su CCAA o contactar con nuestro soporte para ayudarle en la localización.'
    },
    {
      q: '¿Tienen validez legal las firmas electrónicas generadas en Resigest 360?',
      a: 'Sí. Las firmas electrónicas generadas a través de Resigest 360 cumplen con el Reglamento Europeo (UE) Nº 910/2014 (eIDAS) relativo a la identificación electrónica y los servicios de confianza para las transacciones electrónicas en el mercado interior. Cada documento sellado incorpora código seguro de verificación (CSV), trazabilidad de fecha/hora (timestamping) e IP de suscripción.'
    },
    {
      q: '¿Por cuánto tiempo se conservan mis documentos y el Archivo Cronológico?',
      a: 'La Ley 7/2022 estipula en su Artículo 64 que la información del archivo cronológico y los documentos de traslado deben guardarse al menos durante 5 años. Resigest 360 conserva todos los registros, PDFs y esquemas XML e3l de forma indefinida durante la vigencia de su suscripción, con copias de seguridad diarias redundantes en servidores ubicados dentro de la Unión Europea.'
    },
    {
      q: '¿Cómo se transmiten los DIs a la plataforma SIRA del Ministerio?',
      a: 'Resigest 360 dispone de un módulo de exportación directa que genera los ficheros normalizados e3l v3.6 conforme a las especificaciones técnicas del MITECO. En la sección "Integraciones", puede configurar sus credenciales web-service de SIRA o de su comunidad autónoma para la sincronización telemática automatizada sin salir del software.'
    },
    {
      q: '¿Puedo agrupar varios residuos (códigos LER) en un solo Documento de Identificación?',
      a: 'Sí. El sistema soporta la emisión de Documentos de Identificación multiresiduo (multi-LER), permitiendo añadir varios conceptos con sus respectivos bultos y pesos en una misma expedición, siempre que compartan el mismo transportista, origen y destino.'
    },
    {
      q: '¿Cómo puedo justificar mermas por evaporación o procesos de secado en mi planta?',
      a: 'En el módulo "Archivo Cronológico", acceda a la pestaña "Regularizaciones" y cree un nuevo asiento de ajuste seleccionando el residuo afectado, el importe en kilogramos (con signo negativo para mermas o positivo para ajustes de stock) y adjunte la memoria explicativa o informe de control de procesos.'
    }
  ];

  // Filtro de manual por búsqueda y módulo
  const filteredManual = manualSections.filter((sec) => {
    const matchesSearch =
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.content.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesModule = selectedModule === 'all' || sec.id === selectedModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Soporte y Manual de Usuario" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-brand-600 via-brand-500 to-emerald-600 p-6 text-white shadow-lg lg:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistemas Operativos (SIRA, e-SIR, MITECO) 100% Disponibles
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Centro de Soporte, Manual de Uso y Condiciones Legales
          </h1>
          <p className="mt-2 text-sm text-brand-50 sm:text-base leading-relaxed">
            Consulte la guía operativa oficial de Resigest 360, resuelva incidencias técnicas telemáticas con nuestro equipo especializado y revise el marco regulatorio legal y de protección de datos (RGPD).
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="rounded-lg bg-black/20 px-3 py-2 text-xs font-medium backdrop-blur-xs">
              <span>{officialEmail}</span>
            </div>
            <div className="rounded-lg bg-black/20 px-3 py-2 text-xs font-medium backdrop-blur-xs">
              <span>{phoneSupport} (Gratuito)</span>
            </div>
            <div className="rounded-lg bg-black/20 px-3 py-2 text-xs font-medium backdrop-blur-xs">
              <span>L - V: 08:00 - 19:00 CET | Guardia 24/7</span>
            </div>
          </div>
        </div>

        {/* Decoración geométrica de fondo */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-20 -mb-10 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />
      </div>

      {/* Selector de Pestañas Principales */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('support')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'support'
                ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span>Atención y Canales de Contacto</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'manual'
                ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span>Manual de Instrucciones del Usuario</span>
          </button>

          <button
            onClick={() => setActiveTab('legal')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'legal'
                ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span>Condiciones Legales y Normativa</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'faq'
                ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span>Preguntas Frecuentes (FAQ)</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: ATENCIÓN Y CONTACTO                                            */}
      {/* ========================================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Tarjetas rápidas de contacto */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Email principal */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Correo Principal</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Para consultas generales y ayuda de plataforma.</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 text-xs font-mono dark:bg-white/5">
                <span className="truncate text-gray-700 dark:text-gray-300">{officialEmail}</span>
                <button
                  onClick={() => copyToClipboard(officialEmail, 'Correo Principal')}
                  className="rounded-sm p-1 text-xs font-medium text-gray-500 hover:text-brand-600"
                  title="Copiar correo"
                >
                  Copiar
                </button>
              </div>
              <a
                href={`mailto:${officialEmail}?subject=Consulta%20Resigest%20360`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Escribir correo →
              </a>
            </div>

            {/* Email urgencias */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/10">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Urgencias e3l / SIRA</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Bloqueos de traslados y validación urgente.</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-white p-2 text-xs font-mono dark:bg-white/5">
                <span className="truncate text-gray-700 dark:text-gray-300">{urgentEmail}</span>
                <button
                  onClick={() => copyToClipboard(urgentEmail, 'Correo de Urgencias')}
                  className="rounded-sm p-1 text-xs font-medium text-amber-700 hover:text-amber-900"
                  title="Copiar correo"
                >
                  Copiar
                </button>
              </div>
              <span className="mt-3 inline-block text-[11px] font-medium text-amber-700 dark:text-amber-400">
                Tiempo de respuesta: &lt; 2 horas
              </span>
            </div>

            {/* Teléfono */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Atención Telefónica</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Línea gratuita nacional de soporte a clientes.</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 text-xs font-mono dark:bg-white/5">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{phoneSupport}</span>
                <button
                  onClick={() => copyToClipboard(phoneSupport, 'Teléfono de Soporte')}
                  className="rounded-sm p-1 text-xs font-medium text-gray-500 hover:text-brand-600"
                  title="Copiar teléfono"
                >
                  Copiar
                </button>
              </div>
              <span className="mt-3 inline-block text-[11px] text-gray-500 dark:text-gray-400">
                L - V: 08:00 - 19:00 h CET
              </span>
            </div>

            {/* DPO / Legal */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Legal & RGPD</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Derechos de privacidad y contratos marco.</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 text-xs font-mono dark:bg-white/5">
                <span className="truncate text-gray-700 dark:text-gray-300">{dpoEmail}</span>
                <button
                  onClick={() => copyToClipboard(dpoEmail, 'Correo Delegado de Protección de Datos')}
                  className="rounded-sm p-1 text-xs font-medium text-gray-500 hover:text-brand-600"
                  title="Copiar correo"
                >
                  Copiar
                </button>
              </div>
              <a
                href={`mailto:${dpoEmail}?subject=Consulta%20RGPD%20Resigest%20360`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:underline dark:text-purple-400"
              >
                Contactar DPO →
              </a>
            </div>
          </div>

          {/* Formulario de Registro de Ticket Directo */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ComponentCard
                title="Abrir Ticket de Soporte Técnico"
                desc="Envíe su consulta o incidencia directamente a nuestro equipo de ingenieros de medio ambiente y soporte de Resigest 360."
              >
                {ticketGenerated && (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <div className="font-semibold">
                      <span>Ticket Registrado: {ticketGenerated}</span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                      Hemos recibido su consulta. Se ha generado una copia y enviado notificación a su correo electrónico. Uno de nuestros agentes se pondrá en contacto a la mayor brevedad.
                    </p>
                  </div>
                )}

                <form onSubmit={handleTicketSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Nombre y Apellidos *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Alfredo Pérez"
                        value={ticketForm.name}
                        onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Correo Electrónico de Contacto *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="ejemplo@tuempresa.es"
                        value={ticketForm.email}
                        onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Empresa / NIF
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Residuos Ibérica S.L."
                        value={ticketForm.company}
                        onChange={(e) => setTicketForm({ ...ticketForm, company: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Módulo o Área
                      </label>
                      <select
                        value={ticketForm.modulo}
                        onChange={(e) => setTicketForm({ ...ticketForm, modulo: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      >
                        <option value="Documentos de Identificación (DI)">Documentos de Identificación (DI)</option>
                        <option value="Integración SIRA / e3l / CCAA">Integración SIRA / e3l / CCAA</option>
                        <option value="Contratos de Tratamiento">Contratos de Tratamiento</option>
                        <option value="Archivo Cronológico">Archivo Cronológico</option>
                        <option value="Memorias Anuales">Memorias Anuales</option>
                        <option value="Mi Empresa y Centros">Mi Empresa y Centros</option>
                        <option value="Operaciones Comerciales">Operaciones Comerciales</option>
                        <option value="Facturación y Tarifas">Facturación y Tarifas</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Prioridad
                      </label>
                      <select
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      >
                        <option value="baja">Baja - Duda o sugerencia</option>
                        <option value="media">Media - Comportamiento inesperado</option>
                        <option value="alta">Alta - Afecta a traslados en curso</option>
                        <option value="urgente">Urgente - Bloqueo total de expedición</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Asunto de la Incidencia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Breve resumen del problema (ej. Error al validar esquema e3l con gestor)"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Descripción Detallada *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Detalle los pasos para reproducir el error, código LER implicado, número de DI o mensaje de error arrojado por el sistema..."
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      * Al enviar este formulario acepta nuestras condiciones legales y de privacidad.
                    </p>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Enviando Ticket...' : 'Enviar Ticket a Soporte'}
                    </Button>
                  </div>
                </form>
              </ComponentCard>
            </div>

            {/* Columna lateral de información de servicio */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Niveles de Servicio (SLA)</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tiempos máximos de primera respuesta según severidad:
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs dark:border-gray-800">
                    <span className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-600" />
                      Urgente (Bloqueo)
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">&lt; 2 horas</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs dark:border-gray-800">
                    <span className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-600" />
                      Alta
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">&lt; 6 horas</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-xs dark:border-gray-800">
                    <span className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      Media
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">&lt; 12 horas</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-400">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      Baja / Consulta
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">&lt; 24 horas</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sede Central y Asistencia</h3>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong>Resigest 360 Soluciones Tecnológicas S.L.</strong><br />
                  Parque Tecnológico de Madrid, Calle Medio Ambiente 12, Planta 4<br />
                  28050 Madrid (España)<br />
                  CIF: B-89765432
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ¿Necesita una sesión de formación guiada para sus empleados o conductores? Contáctenos a través de{' '}
                    <a href={`mailto:${officialEmail}`} className="text-brand-600 underline dark:text-brand-400">
                      {officialEmail}
                    </a>{' '}
                    para agendar una sesión remota.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: MANUAL DE INSTRUCCIONES                                        */}
      {/* ========================================================================= */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Barra de búsqueda y filtros del manual */}
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar en el manual (ej. NIMA, e3l, contrato, LER, pesaje, firma...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Módulo:</span>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="all">Todos los módulos</option>
                <option value="intro">1. Introducción y Normativa</option>
                <option value="mi-empresa">2. Mi Empresa y Centros</option>
                <option value="terceros">3. Terceros y Gestores</option>
                <option value="contratos">4. Contratos de Tratamiento</option>
                <option value="di">5. Documentos de Identificación</option>
                <option value="archivo-cronologico">6. Archivo Cronológico</option>
                <option value="memorias">7. Memorias Anuales</option>
              </select>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300"
                title="Imprimir o guardar en PDF"
              >
                <span className="hidden sm:inline">Imprimir Manual</span>
              </button>
            </div>
          </div>

          {/* Listado de secciones del manual */}
          <div className="space-y-6">
            {filteredManual.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <p>No se han encontrado secciones del manual que coincidan con &quot;{searchQuery}&quot;.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedModule('all');
                  }}
                  className="mt-2 text-xs font-semibold text-brand-600 underline dark:text-brand-400"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              filteredManual.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                      {section.badge}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {section.summary}
                  </p>

                  <div className="mt-4 space-y-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {section.content.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>

                  {section.steps && section.steps.length > 0 && (
                    <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Procedimiento Paso a Paso:
                      </h4>
                      <ol className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-400 list-decimal list-inside">
                        {section.steps.map((st, sidx) => (
                          <li key={sidx} className="leading-normal">{st}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: CONDICIONES LEGALES Y NORMATIVA                                */}
      {/* ========================================================================= */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          {/* Card 1: Términos Generales SaaS */}
          <ComponentCard
            title="1. Términos y Condiciones Generales de Uso del Servicio (SaaS)"
            desc="Regulación contractual del uso de la plataforma Resigest 360 entre el cliente y Resigest 360 Soluciones Tecnológicas S.L."
          >
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                <strong>1.1. Objeto del Software:</strong> Resigest 360 es una solución de software como servicio (SaaS) destinada a la gestión, registro, archivo y transmisión telemática de datos medioambientales vinculados a la producción, posesión, transporte y gestión de residuos conforme al marco normativo vigente en el Reino de España y la Unión Europea.
              </p>
              <p>
                <strong>1.2. Licencia de Uso:</strong> Mediante la contratación del servicio, Resigest 360 otorga al cliente una licencia de acceso no exclusiva, intransferible y de ámbito territorial español para el número de centros de producción y usuarios contratados.
              </p>
              <p>
                <strong>1.3. Obligaciones del Usuario:</strong> El usuario se compromete a custodiar con la debida diligencia sus credenciales de acceso y certificados digitales. Queda terminantemente prohibida la manipulación fraudulenta de trazas, pesos o códigos de residuo con la finalidad de evadir obligaciones medioambientales o tributarias.
              </p>
              <p>
                <strong>1.4. Disponibilidad y Mantenimiento:</strong> Resigest 360 garantiza un nivel de disponibilidad mensual del 99,8% (SLA), excluyendo ventanas de mantenimiento preventivo notificadas con un mínimo de 48 horas de antelación en días no hábiles.
              </p>
            </div>
          </ComponentCard>

          {/* Card 2: Privacidad y RGPD */}
          <ComponentCard
            title="2. Política de Privacidad y Protección de Datos (RGPD y LOPDGDD)"
            desc="Tratamiento de datos personales de acuerdo con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD)."
          >
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                <strong>2.1. Responsable del Tratamiento:</strong> Resigest 360 Soluciones Tecnológicas S.L., con NIF B-89765432 y domicilio social en Parque Tecnológico de Madrid, Calle Medio Ambiente 12, 28050 Madrid. Correo de contacto del Delegado de Protección de Datos: <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">{dpoEmail}</code>.
              </p>
              <p>
                <strong>2.2. Finalidad y Legitimación:</strong> Los datos se tratan con la finalidad exclusiva de prestar los servicios contratados, posibilitar la firma electrónica de traslados, generar los libros de archivo cronológico y dar cumplimiento a las obligaciones legales impuestas por la Ley 7/2022 de Residuos. La base legitimadora es la ejecución del contrato (art. 6.1.b RGPD) y el cumplimiento de obligaciones legales de carácter medioambiental y tributario (art. 6.1.c RGPD).
              </p>
              <p>
                <strong>2.3. Plazos de Conservación:</strong> En aplicación directa del Artículo 64 de la Ley 7/2022, los datos vinculados al Archivo Cronológico Telemático y a los Documentos de Identificación se conservarán durante un período mínimo de 5 años. Los datos contables y mercantiles se conservarán durante un mínimo de 6 años de conformidad con el Código de Comercio.
              </p>
              <p>
                <strong>2.4. Ejercicio de Derechos:</strong> Los interesados podrán ejercitar sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición remitiendo una solicitud firmada a <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">{dpoEmail}</code>, indicando como referencia &quot;Derechos RGPD&quot;.
              </p>
            </div>
          </ComponentCard>

          {/* Card 3: Responsabilidad Ambiental */}
          <ComponentCard
            title="3. Responsabilidad Medioambiental y Validez de las Declaraciones"
            desc="Régimen de responsabilidad sobre los traslados y exactitud de la información técnica declarada."
          >
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                <strong>3.1. Condición Jurídica de las Partes:</strong> Resigest 360 actúa estrictamente como proveedor tecnológico de soporte informático y pasarela de intercambio de datos. En ningún caso Resigest 360 asume la condición de productor inicial, poseedor, transportista, negociante, agente o gestor final de residuos en los términos del Artículo 3 de la Ley 7/2022.
              </p>
              <p>
                <strong>3.2. Exactitud de las Declaraciones y Pesadas:</strong> La exactitud en la asignación de códigos LER, la calificación de peligrosidad (códigos HP), las pesadas de báscula y la tenencia de autorizaciones ambientales en vigor corresponde de forma exclusiva a los operadores jurídicos que emiten o firman los respectivos documentos.
              </p>
              <p>
                <strong>3.3. Validez de la Firma Electrónica:</strong> Los documentos firmados a través de la plataforma cuentan con valor probatorio en juicio conforme al Reglamento (UE) Nº 910/2014 (eIDAS) y a la Ley 6/2020 de servicios electrónicos de confianza.
              </p>
            </div>
          </ComponentCard>

          {/* Card 4: Seguridad y Cifrado */}
          <ComponentCard
            title="4. Medidas de Seguridad, Cifrado y Copias de Seguridad"
            desc="Garantías técnicas de confidencialidad, integridad y disponibilidad de la información."
          >
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                <strong>4.1. Cifrado en Tránsito y Reposo:</strong> Todas las comunicaciones se realizan mediante protocolos seguros HTTPS / TLS 1.3 con cifrado de 256 bits. Los ficheros y bases de datos se almacenan cifrados mediante el estándar AES-256.
              </p>
              <p>
                <strong>4.2. Ubicación de los Servidores:</strong> La infraestructura de Resigest 360 está alojada íntegramente en centros de datos ubicados dentro del territorio de la Unión Europea (Frankfurt / Madrid), cumpliendo con los estándares de certificación ISO/IEC 27001, SOC 2 y el Esquema Nacional de Seguridad (ENS).
              </p>
              <p>
                <strong>4.3. Respaldo Diario:</strong> Se ejecutan copias de seguridad incrementales horarias y copias completas diarias geo-redundantes con recuperación ante desastres en menos de 4 horas (RTO &lt; 4h, RPO &lt; 1h).
              </p>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: PREGUNTAS FRECUENTES (FAQ)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Respuestas rápidas a las consultas operativas, normativas y técnicas más habituales en la operativa diaria con Resigest 360.
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white transition-all dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-gray-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                  >
                    <span>
                      {item.q}
                    </span>
                    <span className="text-xs text-gray-400">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 p-5 pt-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/50 p-6 text-center dark:border-brand-900/30 dark:bg-brand-950/20">
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              ¿No ha encontrado respuesta a su duda?
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Nuestro equipo técnico está a su disposición para resolver cualquier incidencia sobre traslados o esquemas de residuos.
            </p>
            <button
              onClick={() => setActiveTab('support')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700"
            >
              Contactar con Soporte Técnico
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
