# Auditoría Final de Preproducción e Instrucciones de Despliegue — ResiGest 360

**Estado del código auditado:** Rama `main`, commit `e483c9f` (tras Bloques 1–8)  
**Última actualización:** 2026-11-14  
**Modelo de permisos confirmado:** Propietario (`owner`) opera todos los flujos de escritura/envío SIRA; el Consultor/Administrador (`lectura` / `platform-admin`) tiene **acceso estrictamente de solo lectura**.

---

## 1. Resumen de lo Realizado (Bloques 1–8)

Durante el proceso de preparación a preproducción se ejecutaron y validaron 8 bloques de estabilización, seguridad, cumplimiento normativo y cobertura de pruebas sobre `main`:

| Bloque / Commit | Foco Principal | Resumen de Cambios Aplicados |
| :--- | :--- | :--- |
| **Bloque 1** (`965ee96`) | Seguridad inicial DeCA y rutas | Migración `supabase/migrations/20261114103000_fix_deca_rls_security.sql`, mejoras en `/api/deca/[token]`, `decaService`, `priorNotificationService`, `wasteContractService`, `adminPlatformService`, `middleware.ts` y navegación (`AppSidebar.tsx`). |
| **Bloques 2–5** (`f9d7ee8`, `fe07741`, `8d07d84`, `9528a22`) | Normativa RD 553/2020, Ley 7/2022 y UI | Cláusulas obligatorias RD 553/2020 en contratos y PDF (`pdfUtils.ts`), salidas en Memorias Anuales (`memoriaAnualService.ts`), sincronización de operaciones comerciales con Archivo Cronológico (`chronologicalRegistryService.ts`), validaciones SIRA/NT, contexto multi-empresa (`TenantContext.tsx`) y limpieza de hooks/componentes UI. |
| **Bloque 6** (`bc7f741`) | Migración SQL consolidada y controles críticos | - Migración `supabase/migrations/20261114120000_preproduction_security_and_schema_alignment.sql` (RLS por tenant en `sira_submissions` y `audit_logs`, columnas `frecuencia_recogida` / `firmado_productor` / `firmado_gestor` en `waste_contracts`, actualización de RPC `sign_contract_by_signing_token`, RLS consultoría y bloqueo de borrado < 5 años en `chronological_registry`).<br>- Modo **fail-closed** en `SIRA_ALLOW_TEST_CENSUS` (`/api/residuos/sira/enviar-di` y `enviar-nt`).<br>- Propagación de `required` nativo en `InputField.tsx`, `TextArea.tsx` y `Select.tsx`.<br>- Activación obligatoria con doble firma (`wasteContractService.activate`) y renderizado real de firmas en PDF.<br>- Bloqueo legal de 5 años en `chronologicalRegistryService.deleteChronologicalEntry` + registro en `audit_logs`. |
| **Bloque 7** (`4412582`) | Multi-tenancy lectura, enmascaramiento de secretos y XML E3L completo | - `applyTenantScope` y `getActiveCompanyCookie` en `tenantContextService.ts` aplicados en lecturas principales de DIs, NTs, Memorias, Archivo Cronológico, Contratos, Autorizaciones, DeCA y Búsqueda Rápida.<br>- `sanitizeCompanySecrets` para enmascarar `sira_password` (`'••••••••'`) y `holded_api_key` (`'••••XXXX'`) ante usuarios no propietarios o rol `'lectura'`.<br>- XML E3L v3.6 completo: `<process operationIdProcessCode="..."/>` de 5 caracteres (`R1201`), `DCSPhase` dinámico (`'R'` origen / `'D'` destino) y `<DCSAcceptanceData>` en recepción. |
| **Bloque 8** (`e483c9f`) | Validación SIRA en ruta, rechazo parcial, reglas NT y UX | - Pre-validación `siraService.validateDIForE3L(doc)` en `POST /api/residuos/sira/enviar-di` (HTTP `400` antes de generar SOAP).<br>- Descuento automático de `cantidad_rechazada_kg` en `<DCSRealQuantity>` cuando `estado_traslado === 'rechazado_parcial'` o `resultado_recepcion === 'rechazado_parcial'`.<br>- `validateNTDateRules` en `priorNotificationService.ts` (`create`, `update` y `validateNTForE3L`): mínimo **10 días** de antelación (Art. 8.2 RD 553/2020) y máximo **3 años** de vigencia (Art. 8.3).<br>- Visualización inline de errores sin desmontar vistas en DIs (`[id]/page.tsx`), Contratos (`[id]/page.tsx`) y Archivo Cronológico (mensaje legal de 5 años).<br>- Redacción sin PII en RPC `get_deca_by_token` tras 7 días para respuesta **`410 Gone`** en `/api/deca/[token]`. |

---

## 2. Resultados de Verificación Técnica y CI/CD (`HEAD` `e483c9f`)

Todos los controles obligatorios de calidad definidos en `AGENTS.md` se ejecutaron sobre el commit `e483c9f` y finalizaron con código de salida `0`:

| Chequeo | Comando | Resultado | Métricas Verificadas |
| :--- | :--- | :--- | :--- |
| **TypeScript** | `npm run typecheck` | **PASS** | `tsc --noEmit` sin errores. |
| **ESLint** | `npm run lint` | **PASS** | `eslint .` sin errores ni advertencias. |
| **Tests + Cobertura** | `npm run test:ci` | **PASS** | **37/37 suites**, **760/760 tests** en 12.376 s.<br>Cobertura global: **96.80% Stmts \| 86.57% Branch \| 99.08% Funcs \| 97.33% Lines** (> 80% en todos los umbrales de `jest.config.js`). |
| **Build Producción** | `npm run build` | **PASS** | Next.js 16.0.10 (Turbopack): **53/53 rutas** estáticas y dinámicas compiladas sin errores. |

---

## 3. Auditoría Final de Preproducción

### 3.1 Evaluación por Ejes

1. **Seguridad, APIs y Multi-Tenancy (Consultor/Admin Solo Lectura)**
   - Envío a SIRA bloqueado ante falta de credenciales o fallo de validación E3L (`400`), sin tolerar errores de censo en `NODE_ENV=production`.
   - Enmascaramiento activo de `sira_password` y `holded_api_key` mediante `sanitizeCompanySecrets` para sesiones delegadas o rol `'lectura'`.
   - Respuesta `410 Gone` sin exposición de datos personales/vehículo en `/api/deca/[token]` pasados 7 días desde la finalización del transporte.
   - *Observaciones menores no bloqueantes (futuro)*: si activas consultores `'lectura'` intensivos, convendrá extender `applyTenantScope` a subconsultas secundarias (`getByContract`, `getSubmissionsForDI`, `getLogsForEntity`) y añadir comprobación explícita de rol distinto de `'lectura'` en escrituras `POST /api/holded`.

2. **Esquema SQL y RLS**
   - Migración consolidada lista en `supabase/migrations/20261114120000_preproduction_security_and_schema_alignment.sql` con políticas RLS de tenant, columnas de contratos, soporte `'notificacion_previa'` en `audit_logs`, bloqueo de borrado < 5 años en `chronological_registry` y RPC `get_deca_by_token` redactada.

3. **Frontend, Formularios, Memory Leaks y UX**
   - Atributo HTML `required` propagado en `InputField`, `TextArea` y `Select`.
   - Errores en acciones sobre Contratos, DIs y Archivo Cronológico visibles inline sin perder la ficha en pantalla.
   - Sin fugas de memoria en `setInterval`, `addEventListener` ni `URL.createObjectURL`.
   - *Observación menor no bloqueante*: en `/mobile/deca/[token]`, si se accede directamente a la vista React móvil con un token caducado > 7 días, la comprobación `!deca.is_vigente` se evalúa antes que `isExpired` (el endpoint QR oficial `/api/deca/[token]` sí devuelve directamente la pantalla HTML `410 Gone`).

4. **Cumplimiento Normativo**
   - **Ley 7/2022 Art. 64**: Bloqueo de eliminación de asientos cronológicos con menos de 5 años en servicio y en RLS de Supabase, con traza en `audit_logs`.
   - **RD 553/2020 Art. 5**: Contratos requieren firma productor + gestor para pasar a `vigente`.
   - **RD 553/2020 Art. 8**: Validación de 10 días de antelación y vigencia máxima de 3 años en Notificaciones Previas (`create`, `update` y `validateNTForE3L`).
   - **SIRA / E3L v3.6**: Pre-validación en ruta, `DCSPhase` `'R'`/`'D'`, `<process>` de 5 dígitos y `<DCSAcceptanceData>` con peso neto tras rechazo parcial.
   - **LIVA Art. 84.Uno.2º.c**: Selector de IVA (`21%`, `10%`, `0% ISP`) e integración con Holded en Operaciones Comerciales.

### 3.2 Matriz de Casos de Uso (UC-1 a UC-9)

| Caso de Uso | Estado | Situación Verificada en `e483c9f` |
| :--- | :--- | :--- |
| **UC-1: Empresas, Centros, Autorizaciones, Gestores y Transportistas** | **LISTO** | Maestros operativos con enmascaramiento de secretos y alcance de empresa activa. |
| **UC-2: Contratos de Tratamiento (Art. 5 RD 553/2020)** | **LISTO** | Firma electrónica pública por token, bloqueo de activación sin doble firma, PDF y errores inline. |
| **UC-3: Notificaciones Previas (Art. 8 RD 553/2020)** | **LISTO** | Reglas de 10 días y 3 años forzadas en `create`/`update`/`validateNTForE3L` y soporte R/D de 5 dígitos. |
| **UC-4: Documentos de Identificación (Art. 6 RD 553/2020)** | **LISTO** | Ciclo completo multi-residuo, firma en ruta, recepción/rechazo y errores inline. |
| **UC-5: Envío Telemático SIRA / E3L v3.6** | **LISTO** | Validación previa HTTP `400`, modo fail-closed en producción, `DCSPhase`, rechazo parcial y logs en `sira_submissions`. |
| **UC-6: DeCA / Carta de Porte Electrónica QR** | **LISTO** | Versionado inmutable, auditoría `deca_audit_logs` y caducidad `410 Gone` a los 7 días. |
| **UC-7: Archivo Cronológico (Art. 64 Ley 7/2022)** | **LISTO** | Sincronización de DIs, numeración correlativa y custodia obligatoria de 5 años en servicio + BD. |
| **UC-8: Memorias Anuales (Art. 65 Anexo XV Ley 7/2022)** | **LISTO** | Agregación anual por centro/empresa, exportación PDF/Excel y RLS multi-empresa. |
| **UC-9: Operaciones Comerciales, LIVA ISP y Holded** | **LISTO** | Gestión de hitos, liquidación de pesaje, IVA 0% ISP y sincronización con Holded. |

---

## 4. Instrucciones de Despliegue y Configuración en Producción

Ejecuta estos pasos en orden antes de abrir el entorno a usuarios reales:

### Paso 1 — Aplicar la Migración SQL en Supabase

1. Accede al panel de tu proyecto en **Supabase** -> **SQL Editor**.
2. Asegúrate de que las migraciones previas de `supabase/migrations/` ya estén aplicadas en la instancia.
3. Copia y ejecuta íntegramente el archivo:
   `supabase/migrations/20261114120000_preproduction_security_and_schema_alignment.sql`
4. Verifica que la ejecución termine con `COMMIT` sin errores (`0` fallos).

---

### Paso 2 — Configurar Variables de Entorno en Producción (Vercel / Servidor)

Configura estas variables en el entorno `Production` de tu proveedor de hosting:

```env
# --- Seguridad SIRA (OBLIGATORIO en producción) ---
# Mantener en false o sin definir para no aceptar errores de censo como válidos:
SIRA_ALLOW_TEST_CENSUS=false

# --- Desactivación de accesos Demo (cuando no quieras botones de prueba) ---
ENABLE_DEMO_ACCESS=false
NEXT_PUBLIC_ENABLE_DEMO_ACCESS=false

# --- Administrador global de plataforma (/platform-admin) ---
# Opcional: correo del usuario con acceso administrativo por variable de entorno
NEXT_PUBLIC_ADMIN_EMAIL=tu-correo-admin@dominio.com
```

> **Nota:** Si modificas variables `NEXT_PUBLIC_*`, realiza un **Redeploy** completo del build de producción para que Next.js las incruste en el cliente.

---

### Paso 3 — Activar el Envío Real a SIRA en Producción

El código apunta al servicio web oficial de la Junta de Andalucía (`https://www.juntadeandalucia.es/medioambiente/sira_servicios/SIRA_Empresas_Obligaciones`). Con `NODE_ENV=production` y `SIRA_ALLOW_TEST_CENSUS=false`, el sistema solo marcará un DI o NT como aceptado cuando la Junta devuelva un `<IdSira>` válido sin `<soapenv:Fault>` ni `<resultWrong>`.

Para habilitarlo en la empresa emisora:

1. Inicia sesión con la cuenta **propietaria (`owner`)** de la empresa.
2. Ve en el menú lateral a **`/residuos/mi-empresa`**.
3. Abre la pestaña **`3. SIRA & Holded`**.
4. Activa el interruptor a **`Activado`** (`sira_activo = true`).
5. Rellena los campos oficiales asignados por la Junta de Andalucía:
   - **`Usuario WS (CIF o NIMA)`** (`sira_usuario`)
   - **`Contraseña WS`** (`sira_password`)
6. Pulsa el botón **`Actualizar Empresa`** al pie del formulario.

*Comprobación:* En `/residuos/notificaciones-previas/[id]` puedes usar la validación previa contra SIRA antes de emitir traslados reales, y en `/residuos/documentos-identificacion/[id]` el envío telemático registrará la petición y respuesta XML en `sira_submissions`.

---

### Paso 4 — Configurar el Usuario Administrador / Consultor (Cuando lo necesites)

El sistema contempla dos formas de otorgar permisos de consulta sin capacidad de alterar envíos o datos del propietario:

#### Opción A — Administrador global de plataforma (`/platform-admin`)
Para que un usuario concreto pueda acceder al panel global de supervisión `/platform-admin`:

1. Obtén el `id` (UUID) del usuario en **Supabase** -> **Authentication** -> **Users**.
2. Ejecuta en el **SQL Editor** de Supabase:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = '<UUID_DEL_USUARIO>';
   ```
   *(Alternativamente, puedes añadir su correo a `NEXT_PUBLIC_ADMIN_EMAIL` en las variables de entorno y redesplegar).*

#### Opción B — Consultor de solo lectura asignado a una empresa concreta (`lectura`)
Para dar acceso en modo **solo consulta** a una empresa específica mediante `company_memberships`:

1. Obtén `company_id` (de `public.companies`) y `user_id` (UUID de `auth.users`).
2. Ejecuta en el **SQL Editor** de Supabase:
   ```sql
   INSERT INTO public.company_memberships (company_id, user_id, role, can_view_commercial)
   VALUES (<ID_EMPRESA>, '<UUID_DEL_USUARIO>', 'lectura', false)
   ON CONFLICT (company_id, user_id)
   DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
   ```
   - El parámetro `can_view_commercial` (`false` / `true`) controla si el consultor puede ver o no los importes y operaciones comerciales.
   - Con `role = 'lectura'`, las políticas RLS (`has_company_write_access`) impiden cualquier `INSERT`/`UPDATE`/`DELETE` sobre los datos de la empresa y `sanitizeCompanySecrets` oculta `sira_password` y `holded_api_key`.

---

### Paso 5 — Smoke Test Post-Despliegue

1. **Autenticación y Demo:** Verificar en `/signin` que no aparecen botones de acceso demo (si `NEXT_PUBLIC_ENABLE_DEMO_ACCESS=false`) y que `/accesos-prueba` no permite acceso libre.
2. **SIRA Real:** Enviar o validar una Notificación Previa / DI de prueba controlada desde la empresa configurada en el Paso 3 y verificar el registro en `sira_submissions` y `audit_logs`.
3. **Contrato y Firma:** Verificar creación de contrato, firma por enlace público y activación a `vigente` tras ambas firmas.
4. **Archivo Cronológico:** Confirmar que intentar eliminar un asiento reciente (< 5 años) muestra el bloqueo legal normativo sin borrar el registro.
5. **QR DeCA:** Escanear o abrir `/api/deca/<token>` de un transporte vigente (vista oficial) y confirmar que un token con `fecha_finalizacion > 7 días` responde `410 Gone`.
