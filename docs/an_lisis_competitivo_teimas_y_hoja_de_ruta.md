# Contexto Estratégico: Benchmarking TEIMAS vs. Nuestra Plataforma

> **Instrucciones para el Agente (Antigravity):** Usa este documento como base de conocimiento de mercado, producto y arquitectura técnica para auditar nuestro repositorio actual, comparar nuestras capacidades frente a TEIMAS y proponer prioridades de desarrollo, mejoras de arquitectura y ventajas competitivas ejecutables.

---

## 1. Radiografía del Competidor Principal: TEIMAS

### 1.1. Perfil Corporativo y Negocio
* **Razón social:** Teimas Global, S.L. (antes Teimas Desenvolvemento, S.L.). Fundada en 2008 en Santiago de Compostela (España).
* **Facturación estimada:** 3,5 M€ – 6 M€ anuales (crecimiento orgánico / *bootstrapped*, sin rondas de VC agresivas, apoyado en I+D+i pública como CDTI/IGAPE).
* **Equipo:** ~55 – 75 empleados (ingeniería, producto y consultoría ambiental).
* **Modelo de ingresos:**
  * **~70-75% Licencias SaaS recurrentes:** Suscripción escalonada por centros (NIMA), usuarios, volumen de documentos y módulos.
  * **~20-25% Implantación y consultoría:** *Setup* inicial, migración de históricos, integraciones ERP a medida y formación (*Teixo Academy*).
  * **<5% Ecosistema:** Directorio B2B (`gestoresderesiduos.org`) y eventos (*TEIMAS Conecta*) que actúan como motor principal de captación orgánica (SEO/Inbound).
* **Precios de referencia (sin tarifas públicas, venta consultiva):**
  * **Gestores (*Teixo*):** Suscripción mensual/anual + cuota de implantación (homologado en Kit Digital). Estiman un ahorro de 8 € – 13 € por documento tramitado.
  * **Grandes Productores (*Zero*):** Ticket *Enterprise* de **15.000 € a >60.000 €/año** según plantas, países y gestores integrados.

### 1.2. Cartera de Productos de TEIMAS
1. **Teixo (Gestores, Negociantes y Transportistas):**
   * ERP vertical implantado en >1.000 centros en España.
   * Tramitación telemática con **e-SIR** (MITECO) y plataformas autonómicas (SIRA, SDR, etc.).
   * Control de planta: básculas, stock trazable, rutas, apps móviles (*Teixo Logística*, *Teixo Firma* con Docuten), facturación electrónica y Archivo Cronológico / Memoria Anual.
   * **Teixo S:** Conector API para empresas que ya tienen un ERP grande (SAP, Navision, Odoo) y solo necesitan el motor de cumplimiento ambiental.
2. **Zero (Grandes Productores / Corporaciones):**
   * Plataforma *Enterprise* multi-país (incluye SILiAmb en Portugal) y multi-idioma para consolidar datos de decenas de gestores en un *Single Source of Truth*.
   * Cálculo de huella de carbono (Alcance 3), control de cargos/abonos de residuos y reporte ESG (CSRD / CSDDD).

---

## 2. Matriz Comparativa: TEIMAS vs. Nuestra Propuesta

| Dimensión | TEIMAS (Incumbente) | Nuestra Plataforma (Retador Ágil) | Ventaja Competitiva Nuestra |
| :--- | :--- | :--- | :--- |
| **Segmento Objetivo** | Grandes corporaciones (IBEX 35) y plantas de gestión medianas/grandes. | Pymes productoras, pequeños/medianos gestores, transportistas y verticales específicos (RCD, talleres, agro, clínicas). | Atacamos el mercado desatendido (*bottom-up*) donde TEIMAS es demasiado caro y complejo. |
| **Modelo Comercial y Onboarding** | Venta consultiva lenta, presupuesto a medida, implantación de semanas/meses. | *Self-service*, precios transparentes por tramos, alta y primer documento procesado en < 5 minutos. | Cero fricción de entrada y ciclo de venta 10x más rápido. |
| **Entrada de Datos (Ingesta)** | Formularios manuales en ERP o integraciones XML/API rígidas. | **Pipeline OCR / Extracción Inteligente** de PDFs, DIs, tickets de báscula y fotos de móvil. | Reconstrucción automática del Archivo Cronológico subiendo una carpeta de PDFs históricos. |
| **Integración ERP (Odoo)** | Conector *Enterprise* pesado y costoso (*Teixo S*). | **Módulo nativo ligero en Odoo** + API REST/JSON-RPC plug & play. | Canal de prescripción B2B2B a través de partners implantadores de Odoo en España. |
| **Experiencia de Usuario (UX)** | ERP denso con curva de aprendizaje elevada y estética tradicional. | Interfaz moderna, rápida, *mobile-first* para campo/transporte y revisión *Human-in-the-Loop*. | Adopción inmediata sin necesidad de cursos de formación extensos. |
| **Foso Regulatorio (e-SIR / CCAA)** | **Muy alto:** 18 años manteniendo conectores con las 17 CCAA. | **En construcción:** Foco inicial en estándar **E3L 3.x**, Archivo Cronológico, Memoria Anual y CCAA prioritarias bajo demanda. | Evitamos sobre-ingeniería inicial; cumplimos la operativa real antes de construir 17 conectores. |

---

## 3. Arquitectura Técnica Recomendada para Diferenciarnos

### 3.1. Pipeline de Extracción Documental (Híbrido: Determinista + IA Opcional)
Para maximizar precisión y mantener costes cercanos a 0 €:
1. **Capa 0 (Códigos QR / Barras):** Lectura instantánea (`zxing-wasm` / `jsQR`) en DIs oficiales (ej. SIRA Andalucía, e-SIR) para extraer CSV y número de expediente sin margen de error.
2. **Capa 1 (PDF Nativo Vectorial):** Extracción directa de texto y coordenadas `(x, y)` con `pdfjs-dist` o `PyMuPDF` (<50 ms, coste 0 €).
3. **Capa 2 (OCR Local para Escaneados/Fotos):** Preprocesado con `Sharp`/`OpenCV` (escala de grises, binarización, enderezado) + **PaddleOCR** (open-source en servidor propio).
4. **Capa 3 (Extracción Semántica / Fallback Multimodal):** Uso de modelos multimodales rápidos con *Structured Outputs* (JSON Schema estricto) para tickets térmicos arrugados o albaranes no estructurados.
5. **Capa 4 (Motor de Validación Normativa E3L):**
   * Validación de **Código LER** (6 dígitos + detección de peligrosidad `*`) contra catálogo MITECO.
   * Validación matemática de **NIF/CIF**, formato de **NIMA** (10 dígitos + código INE provincia), operaciones **R01–R13 / D01–D15**, códigos **HP1–HP15** y matrículas.
   * Semáforo UX (*Human-in-the-Loop*): Verde (validado), Ámbar (revisar), Rojo (incoherencia legal).

### 3.2. Integración Nativa con Odoo (Estrategia *Thin Client*)
* **Módulo instalable ligero (`resigest_connector`):**
  * Extiende `product.template` (checkbox `is_waste`, `ler_code`, `is_hazardous`, `treatment_operation`, `hp_codes`).
  * Extiende `res.partner` (`nima_code`, `waste_manager_auth`).
  * Extiende `stock.picking` (botón *"Tramitar DI / Enviar a Plataforma"* que envía el payload a nuestra API y guarda el `waste_di_number` y el PDF adjunto en Odoo).
  * Extiende `account.move` (botón para leer facturas PDF de gestores mediante nuestro OCR y autogenerar el asiento/líneas contables en Odoo).

---

## 4. Debilidades de TEIMAS que Debemos Explotar (Conclusiones)

1. **Parálisis por complejidad en la pyme:** Un pequeño gestor, transportista o fábrica pyme no quiere un ERP gigante; quiere cumplir con la Ley 7/2022, tener su Archivo Cronológico al día y emitir DIs sin errores en XML.
2. **Fricción con documentos de terceros:** Los productores reciben PDFs y tickets en formatos heterogéneos de decenas de gestores. Quien automatice la lectura y validación de esos PDFs gana el escritorio del responsable de medio ambiente.
3. **Opacidad comercial:** Publicar precios claros y ofrecer una prueba gratuita donde el usuario sube 10 PDFs y ve su Archivo Cronológico generado al instante es un diferencial comercial directo frente a TEIMAS.
4. **Ecosistema Odoo desatendido:** Miles de pymes industriales españolas usan Odoo sin vertical ambiental. Convertirse en el estándar de facto para Odoo en gestión de residuos crea un canal de adquisición recurrente y barato.

---

## 5. Prompt / Checklist de Auditoría para Antigravity

> **Tarea para el agente:** Analiza el código base de nuestro proyecto actual comparándolo con este documento y genera un informe accionable respondiendo a:
> 1. **Gaps funcionales:** ¿Qué campos del estándar **E3L 3.x** (LER, NIMA productor/transportista/gestor, operaciones R/D, códigos HP, fechas traslado/aceptación, pesos normalizados) faltan actualmente en nuestro modelo de datos?
> 2. **Pipeline OCR / Ingesta:** ¿Cómo está implementado hoy nuestro procesamiento de documentos? ¿Qué mejoras debemos aplicar para soportar el flujo híbrido (QR -> PDF nativo -> OCR/LLM -> Validación normativa con semáforo)?
> 3. **Preparación para Odoo / API:** ¿Está nuestra API REST estructurada para recibir albaranes (`pickings`) y devolver DIs/facturas estructuradas de forma idempotente y segura (API Keys por tenant)?
> 4. **Priorización MVP (Próximos 30 días):** Ordena por impacto/esfuerzo las 5 tareas técnicas más críticas para lograr una demo comercial superior a TEIMAS en rapidez y automatización.