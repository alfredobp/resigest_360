# RESIGEST 360 | Informe Técnico, Funcional y de Integración
**Documento para:** Daniel Cantero Sánchez (Método Ambiental Consultores, S.L.)  
**Elaborado por:** Alfredo (Equipo de Desarrollo RESIGEST 360)  
**Fecha:** 23 de octubre de 2026  
**Versión:** 1.0  
**Objetivo:** Facilitar el acceso y prueba del entorno Sandbox, responder a las cuestiones técnicas del pliego DeCA, detallar la integración SIRA (Junta de Andalucía) y fijar las bases para la reunión de coordinación.

---

## 1. Acceso al Entorno Sandbox y Simulación de Perfiles

El entorno de pruebas (**Sandbox**) ya se encuentra desplegado y accesible para su revisión exhaustiva:

- **URL de Acceso:** `https://resigest.com/signin` (o `http://localhost:3000/signin` en entorno local)
- **Usuario Sandbox / Demo:** `demo@resigest.com` / `alfredobape@gmail.com`
- **Contraseña:** `Resigest2026*`

### Conmutador Rápido de Perfiles (Sandbox Switcher)
Atendiendo a tu indicación de simplificar la navegación para que cada tipo de empresa vea únicamente lo que necesita, hemos incorporado un **Selector de Perfil Sandbox** directamente en la cabecera superior y barra lateral:

> **Nota de alcance:** Este conmutador interactivo es **provisional para la fase de pruebas y evaluación en el Sandbox**. En el despliegue final a producción, la visibilidad de los módulos se asociará de forma fija y automática al tipo de empresa y permisos configurados durante el **proceso de alta del cliente**.

Permite alternar con un solo clic entre las siguientes vistas:

| Perfil en Sandbox | Módulos Visibles en la Interfaz | Funciones Ocultadas / Simplificadas |
| :--- | :--- | :--- |
| **Transportista** | Dashboard, Mi Empresa, Transportistas/Vehículos, **Control DeCA**, Documentos de Identificación (en tránsito) y Soporte. | Oculta contratos de gestor, catálogo de tratamientos, memorias anuales y liquidaciones comerciales. |
| **Chatarrería / Metales** | Dashboard, Mi Empresa, Directorio Empresas, **Operaciones Comerciales (Báscula, entradas/salidas de chatarra)**, Documentos de Identificación, **DeCA**, Archivo Cronológico y Soporte. | Simplifica memorias complejas de residuos peligrosos; prioriza pesadas y control de transporte. |
| **Baterías y RAEE** | Dashboard, Mi Empresa, Directorio Empresas, Contratos de Tratamiento, Documentos de Identificación (con clasificación LER 16 06 y ADR), **DeCA**, Archivo Cronológico y Soporte. | Enfocado a la cadena de custodia química y transporte seguro con exigencias ADR. |
| **Gestor Residuos Peligrosos** | Suite Completa Medioambiental: Centros, Contratos, Gestores, DIs, **DeCA**, Archivo Cronológico, **Memorias Anuales**, **Integración SIRA (SOAP)** y Soporte. | Visibilidad total de los requisitos administrativos exigidos por la Consejería de Medio Ambiente. |
| **Productor de Residuos** | Dashboard, Mi Empresa, Centros de Producción, Contratos en vigor con gestores, DIs de salida, **DeCA** y Archivo Cronológico. | Interfaz limpia para consultar recogidas, certificados de tratamiento y documentos de control. |

---

## 2. Estado de la Integración con SIRA (Junta de Andalucía)

En RESIGEST 360 ya disponemos del motor de comunicación con **SIRA**:

1. **Protocolo y Estándar:** Implementado mediante protocolo SOAP basado en el estándar nacional **E3L v3.6** (formato oficial de intercambio electrónico de información ambiental de residuos).
2. **Servicio Implementado (`src/services/siraService.ts`):**
   - Generación de bloques XML validados contra los esquemas XSD oficiales (`e3l-waste.xsd`, `e3l-wasteSupport.xsd` y `e3l-common.xsd`).
   - Normalización de NIMA de centros de producción, transportistas y gestores.
   - Generación de Notificaciones de Traslado (NT) y Documentos de Identificación (DI).
3. **Canal de Conexión Externa:**
   - Estamos a la espera de que la Junta de Andalucía nos proporcione los puntos de conexión específicos (endpoints WSDL) y certificados de pruebas para el entorno de formación.
   - En cuanto la Junta confirme el procedimiento de acreditación como software tercero, el motor de RESIGEST podrá remitir DIs de forma masiva y desatendida sin necesidad de que el cliente final introduzca credenciales en la web de SIRA de manera manual.

---

## 3. Módulo DeCA (Documento Electrónico de Control Administrativo)

Siguiendo la especificación que nos remitiste y el marco de la **Ley 9/2025 de Movilidad Sostenible (Disposición Transitoria 8ª)**, la **Orden FOM/2861/2012** y la **Resolución de 5 de junio de 2026**, hemos desarrollado e integrado el módulo DeCA con las siguientes características:

### 3.1. Reutilización de Datos desde el Documento de Identificación (DI)
El usuario no tiene que rellenar los datos dos veces:
- Desde la pantalla de Documentos de Identificación (`/residuos/documentos-identificacion`), cada traslado dispone del botón **`⚡ Generar DeCA`**.
- Al pulsarlo, el sistema precarga automáticamente el transportista efectivo, origen, destino, naturaleza de la mercancía, código LER, número de DI, pesos declarados y matrículas.
- El usuario solo debe confirmar o ajustar la identidad del **Cargador Contractual** (quien contrata el porte, que puede ser el productor, el gestor o un tercero) y cualquier reserva u observación.

### 3.2. Descarga Directa para Inspección en Carretera (Sin Login ni Clics)
Conforme al Art. 4.2 de la Resolución de 5 de junio de 2026:
- Cada documento dispone de un **token criptográfico aleatorio único** (`dca_...`).
- Al escanear el código QR con el móvil de los agentes de la **Guardia Civil de Tráfico** o inspectores de transporte, la URL `https://[dominio]/api/deca/[token]` entrega de forma inmediata el **PDF digital nativo** (`Content-Type: application/pdf`, `Content-Disposition: inline`).
- **No solicita inicio de sesión, no muestra pantallas intermedias ni requiere clics adicionales**.
- **Regla de los 7 días naturales:** Transcurridos 7 días desde la finalización del transporte, el endpoint público de inspección queda desactivado conforme a la norma, manteniéndose el PDF custodiado en el archivo histórico privado de la empresa.

### 3.3. Vista Móvil para el Conductor
En la ruta `/mobile/deca/[token]`, el conductor dispone de una interfaz optimizada para teléfonos móviles que puede mostrar en los controles:
- Código QR oficial de alto contraste en gran tamaño.
- Resumen de expedición: Matrículas (tractora y remolque), pesos, origen y destino.
- Botón táctil para descargar o compartir el documento por WhatsApp o correo.

### 3.4. Versionado Inmutable y Auditoría
Cualquier modificación en el servicio (por ejemplo, cambio de tractora en ruta o ajuste de peso en báscula) no sobrescribe el PDF anterior:
- Crea una nueva versión (**v2, v3...**) con un **nuevo PDF, nuevo QR y nuevo token**, manteniendo la versión anterior archivada como histórica.
- Registra el motivo obligatorio en la tabla `deca_audit_logs`.

---

## 4. Respuestas a las 10 Cuestiones Técnicas del Pliego

A continuación damos respuesta detallada a las 10 preguntas formuladas en el pliego de especificación:

### 1. ¿Qué tecnología utiliza el backend?
**Respuesta:**  
Next.js (v16 App Router) con TypeScript y entorno Node.js/Edge Runtime, conectado a **Supabase** (PostgreSQL 16) con Row Level Security (RLS) para aislamiento estricto de datos, Supabase Storage para custodia de archivos binarios, funciones RPC y Resend para notificaciones por correo.

### 2. ¿Cómo genera hoy los PDF y dónde los almacena?
**Respuesta:**  
Se generan digitalmente con **jsPDF** en formato nativo vectorial con soporte para tipografías vectoriales, metadatos y generación de códigos QR de alta definición mediante la librería `qrcode`. Se almacenan en el bucket privado de Supabase Storage y se sirven bajo demanda con un peso inferior a 350 KB (muy por debajo del límite de 5 MB de la norma).

### 3. ¿Puede crear un endpoint HTTPS de descarga directa por documento?
**Respuesta:**  
**Sí, ya está implementado y probado.** El endpoint es:  
`GET /api/deca/[token]`  
Sirve directamente los bytes del PDF con cabecera `Content-Type: application/pdf` e `inline`, cumpliendo al 100% con la exigencia de las autoridades de tráfico para inspecciones sin login ni pantallas intermedias.

### 4. ¿Tiene control de versiones y auditoría?
**Respuesta:**  
**Sí.** El módulo cuenta con versionado inmutable (`version` entero correlativo, `is_vigente` booleano y `previous_version_id`) y una tabla relacional de auditoría (`deca_audit_logs`) que almacena marca temporal, usuario, acción (`creacion`, `modificacion_version`, `inspeccion_descarga`, `finalizacion`), IP y motivo de cada cambio.

### 5. ¿Cómo separa los datos de cada empresa?
**Respuesta:**  
Mediante arquitectura **multitenant** estricta basada en **Row Level Security (RLS)** de PostgreSQL. Cada fila contiene `user_id` y `company_id`. Las políticas de la base de datos impiden que ningún usuario o empresa pueda consultar, modificar o descargar documentos de otra organización, salvo los accesos regulados por token de inspección.

### 6. ¿Existe un módulo de vehículos, rutas y conductores?
**Respuesta:**  
Existe el maestro de empresas transportistas (`/residuos/transportistas`), con sus NIMA, números de autorización y matrículas asociadas. En el DeCA se ha modelado explícitamente la distinción entre **matrícula de tractora**, **matrícula de remolque/semirremolque**, **nombre del conductor**, **DNI** y **autorización especial de circulación**.

### 7. ¿Cómo están modelados los datos del DI y la NT?
**Respuesta:**  
En la tabla `identification_documents` con 45 atributos normalizados: productor/poseedor (CIF, NIMA, dirección), gestor receptor (NIMA, código de autorización ambiental R/D), transportista (NIMA, matrícula), residuo (código LER de 6 dígitos, peligrosidad, estado físico, envases), cantidades estimadas en origen y pesadas de destino con detección automática de discrepancias en báscula.

### 8. ¿Qué funcionalidades hay disponibles desde móvil?
**Respuesta:**  
Toda la suite web de RESIGEST 360 es responsive (Tailwind CSS adaptado a smartphones y tablets). Adicionalmente, se ha creado la vista web móvil específica `/mobile/deca/[token]` para uso directo del conductor en cabina sin requerir instalación de aplicación nativa.

### 9. ¿Puede asociar varios envíos a un servicio sin confundir los cargadores contractuales?
**Respuesta:**  
**Sí.** Siguiendo la regla de oro indicada en tu documento (*"no agrupar por defecto rutas con cargadores contractuales distintos"*), cada DeCA se asocia a su cargador contractual individualizado. En traslados con varios residuos del mismo cargador, se consolidan en las líneas de mercancía del mismo documento.

### 10. ¿Cómo comprobará la entrega del documento vigente al conductor?
**Respuesta:**  
El sistema genera el documento antes de la salida del transporte y ofrece tres vías de entrega inmediata:
1. Envío instantáneo del enlace móvil por WhatsApp/SMS o correo al conductor.
2. Código QR generado en pantalla para que el conductor lo escanee con su propio móvil antes de iniciar la marcha.
3. Descarga e impresión en formato PDF físico para llevar a bordo si el transportista no dispone de dispositivo digital.  
En el sistema queda constancia de la fecha y hora de emisión previa a la salida.

---

## 5. Próximos Pasos para la Videollamada (Martes / Miércoles)

Para la reunión técnica proponemos la siguiente agenda:
1. **Validación del DeCA en Vivo:** Probar la emisión desde un DI y escanear el QR desde el teléfono móvil para comprobar la descarga inmediata del PDF.
2. **Revisión de Perfiles en el Sandbox:** Analizar si la simplificación de menús para chatarrerías, transportistas y productores se ajusta a lo que esperan vuestros clientes.
3. **Puesta al Día de SIRA:** Revisar la respuesta que remita la Junta de Andalucía sobre el acceso al entorno de pruebas de la Consejería y fijar el calendario de homologación.

Quedo a tu total disposición para cualquier prueba previa que necesites en el sandbox.

Un cordial saludo,  
**Alfredo**  
*Equipo de Desarrollo RESIGEST 360*
