# ResiGest 360 - Plataforma Integral de Gestión y Trazabilidad de Residuos

<div align="center">
  <img src="./public/images/logo/logo.svg" alt="ResiGest 360 Logo" width="280"/>
  <p><strong>Software SaaS de Gestión Integral, Cumplimiento Normativo y Trazabilidad Medioambiental de Residuos</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.x-61dafb?style=flat&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
  [![Coverage](https://img.shields.io/badge/Coverage-≥80%25-brightgreen?style=flat&logo=jest)](https://jestjs.io/)
</div>

---

## 📋 Descripción General

**ResiGest 360** es una solución integral en la nube (SaaS) diseñada para digitalizar, agilizar y asegurar el cumplimiento normativo en toda la cadena de custodia de residuos en España (productores, transportistas, gestores de valorización/eliminación, negociantes y agentes).

La plataforma automatiza la creación documental oficial, el control de traslados con báscula, la sincronización telemática con administraciones públicas mediante el estándar **e3l** (**SIRA** de la Junta de Andalucía y **e-SIR** del Ministerio para la Transición Ecológica MITECO), la firma digital de contratos y la auditoría continua bajo el marco legal medioambiental vigente.

---

## ⚖️ Marco Legal y Cumplimiento Normativo

ResiGest 360 implementa de forma nativa los requerimientos estipulados en:

* **Ley 7/2022**, de 8 de abril, de residuos y suelos contaminados para una economía circular.
* **Real Decreto 553/2020**, de 2 de junio, por el que se regula el traslado de residuos en el territorio del Estado.
* **Catálogo Europeo de Residuos (LER)** y asignación de características de peligrosidad (códigos HP1 a HP15).
* **Estándar e3l (v3.x)** para el intercambio electrónico de datos medioambientales.
* **Trazabilidad telemática**: Integración con **SIRA** (Andalucía) y compatibilidad con plataformas ministeriales (**e-SIR**).

Para consultar la guía detallada de módulos y legislación, revise [`MANUAL_MODULOS_Y_LEGISLACION.md`](./MANUAL_MODULOS_Y_LEGISLACION.md).

---

## 🚀 Módulos y Funcionalidades Principales

### 1. Consola Global / Modo Admin (`/platform-admin`)
* Gestión multicliente / multi-empresa con aislamiento estricto de datos (Supabase RLS).
* Conmutación e impersonación segura de empresas para asistencia técnica y auditorías sin requerir contraseñas.
* Monitoreo y métricas globales de utilización.

### 2. Dashboard Analítico en Tiempo Real (`/app`)
* Indicadores clave (KPIs): Toneladas totales gestionadas (peligrosos vs. no peligrosos).
* Monitoreo en vivo de traslados (En Tránsito, En Báscula, Aceptados, Incidencias y Tratados).
* Detección y alertas automáticas de discrepancias de peso en báscula (>5% o >200 kg).
* Alertas de contratos próximos a vencer y avisos de auditoría telemática.

### 3. Mi Empresa y Centros de Producción (`/residuos/mi-empresa`)
* Configuración de razón social, CIF y **NIMA (Número de Identificación de Medio Ambiente)** oficial.
* Gestión de múltiples centros de producción o plantas secundarias con NIMA independiente.
* Credenciales de acceso a pasarelas telemáticas (SIRA/e-SIR) e integración con Holded ERP.

### 4. Directorio de Empresas y Contactos (`/residuos/empresas`)
* Directorio centralizado de clientes, productores, gestores destinatarios y transportistas autorizados.
* Validación de autorizaciones administrativas y NIMAs.

### 5. Catálogo Oficial LER (`/residuos/ler`)
* Buscador ágil de códigos LER (6 dígitos).
* Identificación de residuos peligrosos (asterisco `*`), descripción oficial y etiquetado legal.
* Catálogo de operaciones de tratamiento (Valorización R1-R13 y Eliminación D1-D15).

### 6. Contratos de Tratamiento con Firma Digital (`/residuos/contratos`)
* Creación y gestión de contratos entre productores y gestores.
* Generación de PDF oficial con código QR de verificación de autenticidad.
* Enlace público de firma electrónica remota con token seguro (`/public/sign-contract/[token]`).

### 7. Documentos de Identificación y Traslado (DI / DCS / NT) (`/residuos/documentos-identificacion`)
* Emisión y ciclo de vida de **Documentos de Identificación (DI)** y **Documentos de Control y Seguimiento (DCS)**.
* Tramitación de **Notificaciones Previas de Traslado (NT)**.
* Validación estricta de datos obligatorios y trazabilidad de estados.

### 8. Registro de Báscula y Operaciones (`/residuos/operaciones`)
* Control de pesaje de entrada (bruto), salida (tara) y neto.
* Verificación de tolerancias legales y registro de incidencias por discrepancia.

### 9. Integración e3l / SIRA & Archivo Cronológico
* Generación de esquemas XML conformes con e3l v3.x.
* Trazabilidad de envíos telemáticos y logs de sincronización.
* Generación del Archivo Cronológico y soporte para la Memoria Anual de Gestores.

### 10. Entorno de Pruebas / Modo Sandbox
* Selector interactivo de perfiles (Productor, Gestor, Transportista) para pruebas operativas inmediatas.

---

## 🛠️ Stack Tecnológico

* **Framework Fullstack:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, React Server Components).
* **Librería UI:** [React 19](https://react.dev/).
* **Lenguaje:** [TypeScript 5](https://www.typescriptlang.org/) con tipado estricto.
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) y soporte completo para Modo Oscuro.
* **Base de Datos y Autenticación:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth y Storage).
* **Generación Documental & QR:** `jspdf` y `qrcode`.
* **Visualización de Datos:** `apexcharts` / `react-apexcharts`.
* **Notificaciones y Correo:** `resend`.
* **Pruebas y Calidad:** [Jest](https://jestjs.io/) con cobertura mínima obligatoria ≥ 80%, [ESLint 9](https://eslint.org/) y [Husky](https://typicode.github.io/husky/).

---

## 📦 Instalación y Puesta en Marcha

### Prerrequisitos

* **Node.js** 20.x o superior (compatible con Node 24).
* Cuenta y proyecto configurado en **Supabase** (consultar [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) y [`STORAGE-SETUP.md`](./STORAGE-SETUP.md)).

### 1. Clonar el Repositorio

```bash
git clone https://github.com/alfredobp/resigest_360.git
cd resigest_360
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copie el archivo de ejemplo y defina sus credenciales:

```bash
cp .env.example .env.local
```

Parámetros requeridos en `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Correo (Resend)
RESEND_API_KEY=re_tu_api_key
RESEND_FROM_EMAIL=notificaciones@tudominio.com

# URL Base
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará accesible en [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pruebas y Aseguramiento de Calidad

El proyecto aplica políticas de calidad estrictas establecidas en [`AGENTS.md`](./AGENTS.md):

* **Cobertura Mínima**: Cada nuevo servicio o validador debe superar el **80% de cobertura** en Statements, Branches, Functions y Lines.
* **Aislamiento Multi-Tenancy**: Verificación de consultas con filtro de tenant.

### Comandos de Verificación

```bash
# Comprobación de tipos TypeScript
npm run typecheck

# Análisis estático de código
npm run lint

# Ejecución de suite de pruebas con cobertura
npm run test:coverage

# Pipeline de CI (requerido antes de commit/push)
npm run test:ci
```

---

## 📁 Estructura del Proyecto

```text
resigest_360/
├── public/                 # Recursos estáticos (imágenes, favicons, logos)
│   ├── favicon.ico         # Favicon multi-resolución
│   └── images/logo/        # Identidad visual corporativa de ResiGest 360
├── scripts/                # Scripts de utilidad y mantenimiento
├── src/
│   ├── app/                # Rutas y páginas de Next.js (App Router)
│   │   ├── (admin)/        # Vistas de gestión, residuos y configuración
│   │   ├── (auth)/         # Inicio de sesión y registro
│   │   ├── api/            # Endpoints API (generación e3l, firmas, webhooks)
│   │   ├── public/         # Vistas públicas (firma de contratos por token)
│   │   ├── favicon.ico     # Favicon raíz App Router
│   │   └── icon.svg        # Icono vectorial SVG
│   ├── components/         # Componentes reutilizables (UI, tablas, formularios)
│   ├── context/            # Contextos de React (Sidebar, Theme, Toast, Sandbox)
│   ├── lib/                # Utilidades, cliente Supabase y esquemas Zod
│   ├── services/           # Lógica de negocio y acceso a datos
│   │   └── __tests__/      # Suites de pruebas unitarias Jest
│   └── types/              # Tipos TypeScript (LER, DI, Contratos, etc.)
├── MANUAL_MODULOS_Y_LEGISLACION.md  # Manual exhaustivo de módulos y marco legal
└── README.md               # Esta documentación
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](./LICENSE).
