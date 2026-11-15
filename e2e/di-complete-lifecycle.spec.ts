import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('ResiGest 360 - Ciclo de Vida Completo de Traslado (DI RD 553/2020)', () => {
  const screenshotsDir = path.join(process.cwd(), 'e2e-screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Ciclo E2E completo: Alta de nuevo DI -> Salida -> Báscula -> Certificación -> Archivo Cronológico', async ({ page }) => {
    // 1. Iniciar sesión rápida con perfil Gestor (Chatarrería y Recuperaciones Toledo)
    await page.goto('/accesos-prueba');
    const enterGestorButton = page.locator('button:has-text("Entrar como gestor")');
    await expect(enterGestorButton).toBeVisible();
    await enterGestorButton.click();

    await expect(page.locator('a[href="/app"]').first()).toBeVisible({ timeout: 25000 });
    await page.waitForLoadState('domcontentloaded');

    // 2. Navegar directamente al formulario de nuevo DI
    await page.goto('/residuos/documentos-identificacion/nuevo');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Perspectiva de Expedición (RD 553/2020)')).toBeVisible({ timeout: 15000 });

    const uniqueSuffix = Date.now().toString().slice(-4);
    const diNumero = `DI-E2E-${uniqueSuffix}`;

    // 3. Cumplimentar datos del documento
    await page.fill('#numero_documento', diNumero);

    // Cumplimentar datos del Productor / Origen
    await page.fill('#productor_razon_social', `Fundiciones y Metales E2E ${uniqueSuffix} S.L.`);
    await page.fill('#productor_cif', 'B12345678');
    await page.fill('#productor_nima', '2800012345');
    await page.fill('#productor_direccion', 'Polígono Industrial Metales, Nave 8');
    await page.fill('#productor_municipio', 'Toledo');
    await page.fill('#productor_provincia', 'Toledo');

    // Seleccionar LER 17 04 05 (Hierro y Acero) abriendo el popover
    const lerTrigger = page.locator('div[role="combobox"]').filter({ hasText: /Buscar por código LER/i });
    await expect(lerTrigger).toBeVisible();
    await lerTrigger.click();

    const searchInput = page.locator('input[placeholder*="Buscar por código"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('17 04 05');

    // Esperar y hacer clic en el resultado del popover
    const lerOption = page.locator('button:has-text("17 04 05")').first();
    await expect(lerOption).toBeVisible({ timeout: 5000 });
    await lerOption.click();

    // Rellenar operación de tratamiento y cantidad
    await page.fill('#operacion_tratamiento', 'R13');
    await page.fill('#cantidad', '2500');

    await page.screenshot({ path: path.join(screenshotsDir, '20-formulario-nuevo-di.png'), fullPage: true });

    // 4. Crear el documento
    const crearBtn = page.locator('button:has-text("Crear Documento")');
    await expect(crearBtn).toBeEnabled();
    await crearBtn.click();

    // 5. Esperar a que redirija a la página de detalle del DI
    await page.waitForURL(/\/residuos\/documentos-identificacion\/\d+/, { timeout: 20000 });
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(`text=${diNumero}`).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '21-di-creado-borrador.png'), fullPage: true });

    // 6. Iniciar Traslado (Salida)
    const iniciarSalidaBtn = page.locator('button:has-text("Iniciar Traslado (Salida)")');
    await expect(iniciarSalidaBtn).toBeVisible();
    await iniciarSalidaBtn.click();

    await expect(page.locator('h3:has-text("Iniciar Traslado / Registro de Salida")')).toBeVisible();

    // Rellenar matrícula y referencia de contrato externo
    const matriculaInput = page.locator('input[placeholder="1234-BBB"]');
    await expect(matriculaInput).toBeVisible();
    await matriculaInput.fill('7890-XYZ');

    const contratoExternoInput = page.locator('input[placeholder*="CT-EXT"]');
    if (await contratoExternoInput.isVisible()) {
      await contratoExternoInput.fill(`CT-E2E-EXT-${uniqueSuffix}`);
    }

    const justificanteInput = page.locator('input[placeholder*="Contrato marco"]');
    if (await justificanteInput.isVisible()) {
      await justificanteInput.fill('Contrato marco acreditado según Art. 5 RD 553/2020');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '22-modal-salida.png') });
    await page.locator('button:has-text("Confirmar Salida")').click();
    await page.waitForLoadState('domcontentloaded');

    // 7. Verificar que el DI pasa a En Tránsito
    await expect(page.locator('text=En Tránsito').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, '23-di-en-transito.png'), fullPage: true });

    // 8. Registrar Recepción en Báscula
    const registrarRecepcionBtn = page.locator('button:has-text("Registrar Recepción en Báscula")');
    await expect(registrarRecepcionBtn).toBeVisible();
    await registrarRecepcionBtn.click();

    await expect(page.locator('h3:has-text("Recepción en Báscula y Dictamen de Destino")')).toBeVisible();

    const pesoBasculaInput = page.locator('input[placeholder="Ej: 1480"]');
    await expect(pesoBasculaInput).toBeVisible();
    await pesoBasculaInput.fill('2480');

    const albaranInput = page.locator('input[placeholder="ALB-2026-99"]');
    if (await albaranInput.isVisible()) {
      await albaranInput.fill(`ALB-REC-${uniqueSuffix}`);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '24-modal-recepcion.png') });
    await page.locator('button:has-text("Confirmar Recepción")').click();
    await page.waitForLoadState('domcontentloaded');

    // 9. Verificar estado Aceptado / En Báscula
    await expect(page.locator('button:has-text("Certificar Tratamiento y Cierre")')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, '25-di-aceptado.png'), fullPage: true });

    // 10. Certificar Tratamiento y Cierre
    const certificarBtn = page.locator('button:has-text("Certificar Tratamiento y Cierre")');
    await certificarBtn.click();

    await expect(page.locator('h3:has-text("Certificación de Tratamiento y Cierre de DI")')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '26-modal-certificacion.png') });

    await page.locator('button:has-text("Cerrar Traslado y Certificar")').click();
    await page.waitForLoadState('domcontentloaded');

    // 11. Verificar que el DI está Tratado y Cerrado (Paso 5)
    await expect(page.locator('text=Tratado y Cerrado').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotsDir, '27-di-tratado-final.png'), fullPage: true });

    // 12. Comprobar que se ha registrado en el Archivo Cronológico (Art. 64 Ley 7/2022)
    const archivoLink = page.locator('a[href="/residuos/archivo-cronologico"]').first();
    await expect(archivoLink).toBeVisible();
    await archivoLink.click();
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Archivo Cronológico').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '28-archivo-cronologico-final.png'), fullPage: true });
  });
});

