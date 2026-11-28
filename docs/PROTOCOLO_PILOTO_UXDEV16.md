# Protocolo de Validación Piloto con Clientes Reales (`UXDEV-16` / `UX-25`)

Este protocolo acompaña a la fixture desechable de onboarding (`POST /api/demo/onboarding-fixture`, accesible desde `/accesos-prueba` -> **"Nueva cuenta vacía (UXDEV-16)"**) para ejecutar las pruebas sin guía con usuarios reales del perfil piloto (**Productor**) antes de abrir la suscripción comercial.

---

## 1. Preparación de Cada Sesión (Sin Contaminar Evidencias)
1. Abrir `/accesos-prueba` en un navegador limpio y pulsar **"Nueva cuenta vacía (UXDEV-16)"**.
2. Verificar que se genera una cuenta única `onboarding-fixture-<timestamp>-<rand>@resigest.test` y redirige automáticamente a `/onboarding` sin empresa ni datos previos.
3. No reiniciar ni reutilizar cuentas de sesiones anteriores para conservar íntegras todas las evidencias.

---

## 2. Guion de Tareas Sin Guía (Muestra orientativa: 5 personas del perfil Productor)
1. **T1 · Onboarding desde cero (`/onboarding`)**: Configurar la empresa productora (CIF, razón social, NIMA y centro de producción).
2. **T2 · Alta de colaboradores y contrato**: Registrar gestor de destino, transportista y formalizar contrato de tratamiento vigente.
3. **T3 · Retirada 1 (DI inicial)**: Crear primer Documento de Identificación buscando el LER (ej. `170405`), generar borrador PDF e iniciar traslado.
4. **T4 · Retirada 2 (Repetición habitual)**: Usar la acción **"Repetir"** sobre la Retirada 1, ajustar fecha y cantidad, y emitir el segundo traslado.
5. **T5 · Cierre documental y verificación**: Aportar justificante externo de destino (peso final y documento) y comprobar el asiento consolidado y pendientes en el **Archivo Cronológico**.

---

## 3. Plantilla de Registro de Métricas por Participante

| Participante | Perfil / Empresa | T1 Onboarding (min) | T3 Retirada 1 (min) | T4 Retirada 2 (min) | Tiempo método convencional (min) | Errores | Dudas | Veces que pidió ayuda | Completó sin guía (Sí/No) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| P01 | Productor | | | | | | | | |
| P02 | Productor | | | | | | | | |
| P03 | Productor | | | | | | | | |
| P04 | Productor | | | | | | | | |
| P05 | Productor | | | | | | | | |

---

## 4. Criterios de Salida del Piloto Comercial
- Alta inicial completada en cuenta vacía desechable sin alterar evidencias previas.
- Reducción medible de tiempo/fricción entre **Retirada 1** y **Retirada 2**, contrastada con el método convencional antes de publicar cualquier cifra de ahorro o ROI.
- Verificación en servidor de políticas RLS, copias de seguridad/restauración y custodia documental en Storage completada junto con la validación funcional de Daniel.

