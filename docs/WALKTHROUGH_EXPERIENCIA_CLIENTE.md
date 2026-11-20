# Walkthrough: Fase 1 de Experiencia de Cliente (Piloto Productor e Integridad)

Se ha completado con éxito la ejecución de la **Fase 1** del informe de auditoría de experiencia de cliente (`RESIGEST_360_Experiencia_Cliente_2026-11-20`), permitiendo transformar a ResiGest 360 en una solución comercialmente viable y lista para cobro en el perfil de Productor.

---

## 🚀 Cambios Implementados por Componente

### 1. Búsqueda y Normalización de Códigos LER (`UXDEV-13` / `UX-04`)
- **Fichero**: [LerSelector.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/components/residuos/LerSelector.tsx)
- Se incorporó la función de normalización `cleanLer` que elimina espacios, puntos y guiones antes de cotejar la consulta del usuario.
- Búsquedas como `170405`, `17.04.05` y `17 04 05` devuelven el mismo resultado oficial sin alterar el asterisco ni la peligrosidad del catálogo (`17 04 05*`).

### 2. Perspectiva de Expedición y Bloqueo de Roles Indebidos (`UXDEV-03` / `UX-02`, `UX-03`, `UX-05`)
- **Fichero**: [nuevo/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/documentos-identificacion/nuevo/page.tsx)
- Para empresas registradas como productoras (`tipo_empresa === 'productor'` sin rol gestor), se bloquea la opción "Como Gestor Destinatario" y se fija inmutablemente la expedición desde centro de origen como Productor/Poseedor.
- En `handleContractChange`, `handleGestorChange` y `handleTransportistaChange` se autocompletan exhaustivamente domicilio, municipio, provincia y código postal comprobando tanto datos de instalación como sociales, con fallback a `getProvinceByPostalCode`.

### 3. Duplicación Ágil de Retiradas Habituales (`UXDEV-07` / `UX-06`)
- **Ficheros**:
  - [nuevo/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/documentos-identificacion/nuevo/page.tsx)
  - [page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/documentos-identificacion/page.tsx)
  - [[id]/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/documentos-identificacion/[id]/page.tsx)
- Se añadió el botón **"Repetir"** en la tabla del listado de DIs, en las tarjetas móviles y en el detalle del documento.
- Al pulsar "Repetir", se abre `/nuevo?duplicate_from=<id>`, precargando contrato, centro productor, gestor destinatario, transportista y residuo LER.
- Se restablecen a cero los campos volátiles: genera nuevo número oficial correlativo, estado fijado en `borrador`, firmas reseteadas (`false`/`null`) y pesajes/albaranes de báscula en blanco. Muestra un banner informativo verde destacando el origen de la retirada clonada.

### 4. Aporte de Justificante Externo sin Suplantar al Gestor (`UXDEV-03` / `UX-07`)
- **Fichero**: [[id]/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/documentos-identificacion/[id]/page.tsx)
- Se renombró la acción operativa para el Productor a **"Aportar Justificante de Destino (Gestor Externo)"**.
- El modal elimina las opciones de dictamen de planta o firma interna de gestor, limitándose a solicitar peso final recepcionado, albarán externo y URL/archivo del justificante.
- Al confirmarse, el traslado pasa a estado `aceptado` y se sincroniza automáticamente con el Archivo Cronológico.

### 5. Distinción Borrador vs Oficial en PDF e Interfaz (`UXDEV-12` / `UX-08`, `UXDEV-05`)
- **Ficheros**:
  - [pdfUtils.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/lib/pdfUtils.ts)
  - [[id]/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/documentos-identificacion/[id]/page.tsx)
- Si el documento está en borrador (`estado_traslado === 'borrador'` o previo a salida):
  - El botón de descarga se rotula claramente como **"Descargar Borrador (PDF)"**.
  - El PDF estampa una marca de agua diagonal `"BORRADOR - NO OFICIAL"` y un pie legal explícito indicando que no es vinculante para transporte.
- Cuando el documento inicia traslado o se completa, el botón pasa a **"Descargar Documento Oficial (PDF)"**.
- Se incorporaron metadatos forenses deterministas `/CreationDate` y `/ModDate` en `generateIdentificationDocumentPDF` (requisito de inmutabilidad `UXDEV-05`).

### 6. Archivo Cronológico: Pestaña "En Tránsito / Pendientes" (`UXDEV-06` / `UX-09`)
- **Ficheros**:
  - [chronologicalRegistryService.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/chronologicalRegistryService.ts)
  - [archivo-cronologico/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/archivo-cronologico/page.tsx)
- Se creó la función `getPendingDispatches` para consultar las salidas en estado `en_transito` y `recepcionado`.
- En la interfaz del Archivo Cronológico se implementó un selector de pestañas:
  1. **Libro Cronológico Consolidado (Art. 64)**: Asientos definitivos confirmados.
  2. **Traslados en Curso / Pendientes de Justificante**: Muestra las salidas físicas en tránsito, indicando que están excluidas de la Memoria Anual hasta la recepción en destino y ofreciendo un acceso directo ("Aportar Justificante →") para completarlas.

### 7. Formato de Unidades en Dashboard Productor (`UX-01` / `UXDEV-14`)
- **Fichero**: [ProfileDashboardSections.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/components/dashboard/profiles/ProfileDashboardSections.tsx)
- Si el total retirado es inferior a 1 tonelada (ej. 8 kg = 0,008 t), se muestra prioritariamente en kilogramos con su equivalente en toneladas con 3 decimales (`8 kg (0,008 t)`), eliminando el redondeo engañoso a 0,01 t.

---

## 🧪 Verificación y Pruebas Realizadas

### 1. Test de Integración del Recorrido Completo del Productor
Se creó la suite [producerAuditJourney.test.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/__tests__/producerAuditJourney.test.ts) que valida los 4 recorridos de auditoría (A1, A2, A3 y A4):
- Generación de DI y marca de agua BORRADOR en PDF.
- Clonado de retirada habitual con reset de firmas y estados.
- Aporte de justificante externo con procedencia de Productor.
- Inclusión de salidas en tránsito en la consulta de pendientes del Archivo Cronológico.

```bash
PASS src/services/__tests__/producerAuditJourney.test.ts
  Recorrido de Auditoría del Productor (Piloto Comercial)
    A1: Creación de Retirada y Validación de Integridad
      √ genera número de documento único y normaliza la salida como borrador (3 ms)
      √ genera PDF con marca de agua BORRADOR y metadatos deterministas cuando está en borrador (19 ms)
    A2: Duplicación Rápida de Retirada Habitual (UXDEV-07)
      √ al duplicar una retirada previa, preserva participantes y residuo pero resetea firmas y estado (1 ms)
    A3: Aporte de Justificante Externo y Cierre sin Suplantar Gestor (UXDEV-03)
      √ registra el justificante y peso final con procedencia de Productor (2 ms)
    A4: Trazabilidad y Archivo Cronológico (UXDEV-06 / UX-09)
      √ los DIs en tránsito se visualizan en pendientes con su peso estimado de salida (1 ms)
```

### 2. Verificaciones Obligatorias de Repositorio (AGENTS.md)
```bash
npm run typecheck   # --> PASS (0 errores TypeScript)
npm run lint        # --> PASS (0 advertencias/errores ESLint)
npm run test:ci     # --> PASS (43 Test Suites, 901 tests pasados, cobertura > 80% en todas las métricas)
```

---

# Walkthrough: Fase 2 de Experiencia de Cliente (Transportista, Flota y Portal Conductor)

Se ha completado con éxito la ejecución de la **Fase 2** del informe de auditoría de experiencia de cliente (`RESIGEST_360_Experiencia_Cliente_2026-11-20`), abordando las observaciones `UXDEV-04`, `UXDEV-08`, `UXDEV-11` y `UXDEV-15` (`UX-10`, `UX-11`, `UX-12`, `UX-13`).

---

## 🚀 Cambios Implementados en Fase 2

### 1. Gestión de Flota de Vehículos y Conductores Hijos de Empresa (`UXDEV-08` / `UX-10`)
- **Ficheros**:
  - [wasteManagement.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/types/wasteManagement.ts): Nuevas interfaces `FleetVehicle` y `FleetDriver`. Se añaden `flota_vehiculos` y `flota_conductores` a `Carrier` y `CarrierFormData`.
  - [carrierService.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/carrierService.ts): Métodos `addVehicle`, `removeVehicle`, `addDriver`, `removeDriver` y helpers de parseo/serialización `parseFleetFromNotes` y `serializeFleetToNotes`.
  - [CarrierFleetModal.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/components/residuos/CarrierFleetModal.tsx): Nuevo modal interactivo para añadir, visualizar y dar de baja camiones (tractora, rígido, portacontenedores, pulpo, cisterna, remolque) y conductores bajo un mismo CIF sin duplicar empresas maestras.
  - [transportistas/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/transportistas/page.tsx): Resumen de flota registrada en cada ficha de transportista y botón **"Gestionar Flota"**.
  - [CarrierModal.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/components/residuos/CarrierModal.tsx): Aviso explicativo en la matrícula principal para gestionar múltiples vehículos desde Flota.

### 2. Precarga Automática de Datos Propios y Selector de Cliente en DeCA (`UXDEV-11` / `UX-11`)
- **Fichero**: [deca/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/deca/page.tsx)
- Se conecta `useTenant` para precargar de inicio los datos de la propia empresa transportista activa:
  - `transportista_razon_social`, `transportista_nif`, `transportista_autorizacion`, `transportista_nima`, direcciones, matrícula tractora habitual y conductor predeterminado (reducción drástica de 14 escrituras manuales repetitivas).
- Se incorpora el selector rápido **"Seleccionar Cliente / Cargador Habitual (Autorrellenado)"**: con 1 clic se cargan razón social, CIF, domicilio, municipio, provincia y código postal de origen.
- Se implementan `datalist` conectados a la flota para sugerir matrículas tractoras registradas y nombres de conductores con autocompletado en [InputField.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/components/form/input/InputField.tsx).

### 3. Coherencia Estricta de Versiones DeCA (`UXDEV-04` / `UX-12`)
- **Ficheros**:
  - [decaService.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/decaService.ts)
  - [transporte/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/transporte/page.tsx)
  - [deca/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/deca/page.tsx)
- Se implementa `filterVigenteServices` que agrupa por identificador base de familia (`DECA-2026-XXXXX`):
  - Solo la versión con mayor número de revisión representa el servicio activo.
  - Si `v2` está finalizada o en tránsito, `v1` **nunca** aparece como servicio activo en carretera para el conductor.
  - En la tabla de administración DeCA, las versiones sustituidas se rotulan inmutablemente como **`SUSTITUIDA`** y se ocultan los botones de modificación y finalización, evitando que un conductor o administrativo finalice o altere una versión obsoleta.

### 4. Portal Conductor con Pestañas Hoy y Finalizados con PDF Custodiado (`UXDEV-15` / `UX-13`)
- **Fichero**: [transporte/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/transporte/page.tsx)
- Selector de pestañas táctil:
  1. **"En Ruta / Hoy"**: Tarjetas de servicios en curso con botón "Mostrar QR / DeCA" y "Finalizar Entrega".
  2. **"Finalizados / Histórico"**: Al finalizar un porte, la tarjeta permanece accesible en esta pestaña con distintivo verde `FINALIZADO`, hora de cierre y botones táctiles:
     - **"Ver DeCA / QR"** (`/mobile/deca/[token]`).
     - **"Descargar PDF Oficial"** (`/api/deca/[token]` con atributo de descarga directa).
- Las tarjetas resumen de métricas superiores permiten alternar de pestaña al pulsar sobre ellas.

---

## 🧪 Verificación y Pruebas Realizadas en Fase 2

### 1. Test de Integración del Recorrido Transportista
Se creó la suite [carrierAuditJourney.test.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/__tests__/carrierAuditJourney.test.ts) que valida los 4 escenarios de Fase 2:
- 3 camiones y conductores bajo un mismo CIF sin duplicados de empresa (`UXDEV-08`).
- Precarga automática de datos de la empresa transportista y cliente (`UXDEV-11`).
- Coherencia de versiones DeCA (v1 nunca activa si v2 está finalizada) (`UXDEV-04`).
- Disponibilidad del historial y PDF custodiado en el portal conductor (`UXDEV-15`).

```bash
PASS src/services/__tests__/carrierAuditJourney.test.ts
  Auditoría Experiencia Cliente - Perfil Transportista y Portal Conductor
    UXDEV-08 / UX-10: Flota de vehículos y conductores bajo un mismo CIF sin duplicados
      √ debe permitir gestionar 3 camiones y conductores reasignables bajo una única empresa transportista (3 ms)
    UXDEV-11 / UX-11: Precarga automática de datos propios y cliente en DeCA
      √ debe preparar los datos de emisión del servicio sin reescribir manualmente datos del transportista (1 ms)
    UXDEV-04 / UX-12: Coherencia de versiones DeCA (v1 nunca activa si v2 está finalizada)
      √ debe archivar v1 y mostrar exclusivamente v2 como servicio finalizado en portal conductor (1 ms)
    UXDEV-15 / UX-13: Portal Conductor e Histórico de Servicios
      √ debe mantener accesibles los servicios terminados en la pestaña Finalizados con QR y enlace PDF (1 ms)
```

### 2. Suites Unitarias de Carrier y DeCA Actualizadas
- [carrierService.test.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/__tests__/carrierService.test.ts): 100% de cobertura en gestión de flota, parseo de notas, serialización y validación de entidades.
- [decaService.test.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/__tests__/decaService.test.ts): resolución de versiones y clasificación de servicios vigentes.

### 3. Verificaciones de Calidad Globales del Proyecto (AGENTS.md)
```bash
npm run typecheck   # --> PASS (0 errores TypeScript)
npm run lint        # --> PASS (0 errores / advertencias ESLint)
npm run test:ci     # --> PASS (44 Test Suites, 913 tests pasados limpios, cobertura global > 96% statements y > 84% branches)
```

---

# Walkthrough: Fase 3 de Experiencia de Cliente (Chatarrería y Entradas de Múltiples Materiales)

Se ha completado con éxito la ejecución de la **Fase 3** del informe de auditoría de experiencia de cliente (`RESIGEST_360_Experiencia_Cliente_2026-11-20`), abordando las observaciones `UXDEV-09`, `UXDEV-10` y `UXDEV-14` (`UX-14`, `UX-15`, `UX-16`, `UX-17`, `UX-18`, `UX-19`, `UX-20`, `UX-21`).

---

## 🚀 Cambios Implementados en Fase 3

### 1. Desvinculación de Intermediación y Acción "Nueva Entrada (Báscula / Recepción)" (`UXDEV-09` / `UX-14`)
- **Ficheros**:
  - [ProfileDashboardSections.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/components/dashboard/profiles/ProfileDashboardSections.tsx)
  - [app/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/app/page.tsx)
  - [operaciones/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/operaciones/page.tsx)
- Se sustituyó el botón "Nuevo Pesaje / Compraventa" que abría el formulario de intermediación comercial de Agente/Negociante (con compra, venta y flete) por la acción operativa **"Nueva Entrada (Báscula / Recepción)"**.
- Abre directamente el flujo ágil de báscula multimaterial concebido para la recepción física en patio.

### 2. Entrada Multimaterial y Generación de Ticket Conjunto (`UXDEV-09` / `UX-15`, `UX-16`, `UX-17`)
- **Ficheros**:
  - [wasteManagement.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/types/wasteManagement.ts): Modeladas `ScrapYardMaterialLine`, `ScrapYardEntryFormData` y `ScrapYardEntry`.
  - [scrapYardService.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/scrapYardService.ts): Implementado el servicio especializado de báscula multimaterial (`calculateMultiMaterialTotals`, `generateScaleTicketNumber`, `registerMultiMaterialEntry`, `generateScaleTicketPrintHTML`).
  - [ScrapYardEntryModal.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/components/residuos/ScrapYardEntryModal.tsx): Nuevo modal interactivo de báscula:
    - Cabecera única con proveedor (particular con DNI o empresa con CIF), fecha y número correlativo de ticket (`TB-2026-XXXX`).
    - Líneas de materiales dinámicas repetibles: cada una con código LER (`17 04 05`, `17 04 01`, etc.), peso neto en kg (arrancando en blanco/0, sin predeterminar 1 t) y precio unitario opcional en `€/kg`.
    - Resumen y liquidación económica calculada en vivo: **11 kg Fe a 0,10 €/kg y 22 kg Cu a 5,00 €/kg = 33 kg y 111,10 €**.
    - Al confirmar, genera **dos asientos cronológicos enlazados al mismo ticket** sin duplicar cabeceras y muestra el botón para **imprimir directamente el Ticket de Báscula / Justificante Oficial**.

### 3. Contexto Fijo de Recepción y No Retención de Proveedor (`UXDEV-14` / `UX-18`)
- **Fichero**: [archivo-cronologico/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/archivo-cronologico/page.tsx)
- Se implementó `openNewEntryModal`:
  - Para chatarrerías y gestores de planta, el modal manual de asiento arranca fijado en `entrada_recepcion` (Recepción en Planta).
  - Al abrir o guardar una nueva entrega, se limpian explícitamente los campos del proveedor, impidiendo que una entrega herede inadvertidamente al proveedor o cliente anterior sin decisión expresa del operario de báscula.

### 4. Desglose de Existencias por LER y Unidades en kg (`UXDEV-14` / `UX-16`, `UX-19`)
- **Ficheros**:
  - [dashboardService.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/dashboardService.ts)
  - [ProfileDashboardSections.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/components/dashboard/profiles/ProfileDashboardSections.tsx)
- Se calculan las existencias por residuo LER (`existenciasPorLer`) en la planta.
- En la tarjeta **"Stock Neto en Patio"** se visualizan las existencias en kg si son inferiores a 1 t y se añade el desglose de los principales materiales en patio (ej. `17 04 05: 11 kg · 17 04 01: 22 kg`), permitiendo al responsable de patio conocer con precisión cuánto hierro y cobre tiene disponible.

### 5. Nueva Salida (Expedición a Acería/Fundición) y Prerrequisitos Documentales (`UXDEV-10` / `UX-20`, `UX-21`)
- **Ficheros**:
  - [app/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/app/page.tsx): Botón explícito **"Nueva Salida (Expedición)"** que redirige a `/residuos/documentos-identificacion/nuevo?perspectiva=productor`.
  - [documentos-identificacion/nuevo/page.tsx](file:///c:/Users/Usuario/Documents/resigest_360/src/app/(admin)/residuos/documentos-identificacion/nuevo/page.tsx):
    - La perspectiva inicial se fija inmutablemente en Productor/Remitente: la chatarrería expedidora es el origen del traslado hacia el gestor final (acería o fundición).
    - Si no hay contratos de tratamiento vigentes con gestores de destino (`contracts.length === 0`), se muestra una advertencia normativa destacada (Art. 5 RD 553/2020) con enlace directo para formalizar el contrato antes de la salida.
  - Se garantiza que eliminar un borrador de DI **nunca** descuenta existencias físicas en el archivo cronológico ni altera liquidaciones de compras.

---

## 🧪 Verificación y Pruebas Realizadas en Fase 3

### 1. Test Unitario de Báscula Multimaterial
- [scrapYardService.test.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/__tests__/scrapYardService.test.ts):
  - **17 tests unitarios pasados**.
  - **100% de cobertura en Statements, 95.18% en Branches, 100% en Functions y 100% en Lines**.
  - Valida el cálculo de 11 kg Fe a 0,10 €/kg + 22 kg Cu a 5,00 €/kg = 33 kg y 111,10 €, entregas a coste cero, generación de tickets correlativos, asientos cronológicos enlazados y generación de HTML de ticket imprimible.

### 2. Test de Integración del Recorrido de Chatarrería
- [scrapYardAuditJourney.test.ts](file:///c:/Users/Usuario/Documents/resigest_360/src/services/__tests__/scrapYardAuditJourney.test.ts):
  - Valida el flujo completo de entrega multimaterial conjunta con ticket único.
  - Verifica la creación de 2 asientos cronológicos vinculados a dicho ticket.
  - Verifica la integridad del stock físico al eliminar borradores de salida de DI.

### 3. Verificaciones de Calidad Globales del Repositorio (AGENTS.md)
```bash
npm run typecheck   # --> PASS (0 errores TypeScript)
npm run lint        # --> PASS (0 errores / advertencias ESLint)
npm run test:ci     # --> PASS (46 Test Suites, 933 tests pasados limpios, cobertura global > 96% statements y > 84% branches)
```
