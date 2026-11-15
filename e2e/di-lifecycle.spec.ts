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

  test('Ciclo E2E Traslado: Inspección de DI, Salida en tránsito, Báscula de destino, Certificación y Archivo Cronológico', async ({ page }) => {
    // 1. Iniciar sesión rápida con el perfil Gestor (Chatarrería y Recuperaciones Toledo)
    await page.goto('/accesos-prueba');
    const enterGestorButton = page.locator('button:has-text("Entrar como gestor")');
    await expect(enterGestorButton).toBeVisible();
    await enterGestorButton.click();

    await expect(page.locator('a[href="/app"]').first()).toBeVisible({ timeout: 25000 });
    await page.waitForLoadState('domcontentloaded');

    // 2. Navegar al módulo de Documentos de Identificación (DI)
    const diLink = page.locator('a[href="/residuos/documentos-identificacion"]').first();
    await expect(diLink).toBeVisible();
    await diLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Documentos de Identificación (DI)')).toBeVisible({ timeout: 15000 });

    // 3. Abrir el detalle del primer DI visible
    const verDetalleBtn = page.locator('button:has-text("Ver Detalle y Trazabilidad")').first();
    await expect(verDetalleBtn).toBeVisible({ timeout: 15000 });
    await verDetalleBtn.click();
    await page.waitForLoadState('domcontentloaded');

    // 4. Verificar que carga la vista de Detalle y Stepper RD 553/2020
    await expect(page.locator('text=Ciclo de Vida del Traslado (RD 553/2020)')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '10-di-detalle-inicial.png'), fullPage: true });

    // 5. Comprobar acciones operativas disponibles según el estado actual
    const iniciarSalidaBtn = page.locator('button:has-text("Iniciar Traslado (Salida)")');
    const registrarRecepcionBtn = page.locator('button:has-text("Registrar Recepción en Báscula")');
    const certificarTratamientoBtn = page.locator('button:has-text("Certificar Tratamiento y Cierre")');

    // Caso A: Si está en borrador, iniciar salida
    if (await iniciarSalidaBtn.isVisible()) {
      await iniciarSalidaBtn.click();
      await expect(page.locator('h3:has-text("Iniciar Traslado / Registro de Salida")')).toBeVisible();

      // Completar datos mínimos de salida si no están
      const matriculaInput = page.locator('input[placeholder="1234-BBB"]');
      if (await matriculaInput.isVisible()) {
        const val = await matriculaInput.inputValue();
        if (!val) await matriculaInput.fill('4567-XYZ');
      }

      // Si requiere contrato externo o cobertura
      const contratoExternoInput = page.locator('input[placeholder*="CT-EXT"]');
      if (await contratoExternoInput.isVisible()) {
        const val = await contratoExternoInput.inputValue();
        if (!val) await contratoExternoInput.fill('CT-E2E-2026-AUT');
      }

      await page.screenshot({ path: path.join(screenshotsDir, '11-di-modal-salida.png') });
      await page.locator('button:has-text("Confirmar Salida")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: path.join(screenshotsDir, '12-di-en-transito.png'), fullPage: true });
    }

    // Caso B: Si está en tránsito, registrar recepción en báscula
    if (await registrarRecepcionBtn.isVisible()) {
      await registrarRecepcionBtn.click();
      await expect(page.locator('h3:has-text("Recepción en Báscula y Dictamen de Destino")')).toBeVisible();

      // Rellenar pesaje verificado en báscula
      const pesoBasculaInput = page.locator('input[placeholder="Ej: 1480"]');
      await expect(pesoBasculaInput).toBeVisible();
      await pesoBasculaInput.fill('1520');

      const albaranInput = page.locator('input[placeholder="ALB-2026-99"]');
      if (await albaranInput.isVisible()) {
        await albaranInput.fill('ALB-E2E-REC-01');
      }

      await page.screenshot({ path: path.join(screenshotsDir, '13-di-modal-recepcion-bascula.png') });
      await page.locator('button:has-text("Confirmar Recepción")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: path.join(screenshotsDir, '14-di-recepcionado.png'), fullPage: true });
    }

    // Caso C: Certificar operación de tratamiento y cierre
    if (await certificarTratamientoBtn.isVisible()) {
      await certificarTratamientoBtn.click();
      await expect(page.locator('h3:has-text("Certificación de Tratamiento y Cierre de DI")')).toBeVisible();

      await page.screenshot({ path: path.join(screenshotsDir, '15-di-modal-certificar-tratamiento.png') });
      await page.locator('button:has-text("Cerrar Traslado y Certificar")').click();
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: path.join(screenshotsDir, '16-di-cerrado-y-tratado.png'), fullPage: true });
    }

    // 6. Verificar reflejo en el Archivo Cronológico oficial
    const archivoLink = page.locator('a[href="/residuos/archivo-cronologico"]').first();
    await expect(archivoLink).toBeVisible();
    await archivoLink.click();
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Archivo Cronológico').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '17-archivo-cronologico-verificado.png'), fullPage: true });
  });
});

