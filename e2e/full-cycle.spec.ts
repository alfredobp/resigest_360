import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('ResiGest 360 - Suite E2E de Ciclo Completo', () => {
  const screenshotsDir = path.join(process.cwd(), 'e2e-screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Ciclo E2E: Login demo, Navegación de módulos, Alta de Empresa y Verificación en tabla', async ({ page }) => {
    // 1. Acceder a la página de accesos de prueba
    await page.goto('/accesos-prueba');
    await expect(page).toHaveTitle(/Resigest/i);
    await page.screenshot({ path: path.join(screenshotsDir, '00-accesos-prueba.png'), fullPage: true });

    // 2. Iniciar sesión rápida con el perfil Gestor
    const enterGestorButton = page.locator('button:has-text("Entrar como gestor")');
    await expect(enterGestorButton).toBeVisible();
    await enterGestorButton.click();

    // 3. Esperar a entrar en el panel principal (/app)
    await expect(page.locator('a[href="/app"]').first()).toBeVisible({ timeout: 25000 });
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: path.join(screenshotsDir, '01-dashboard.png'), fullPage: true });

    // 4. Navegar a Empresas y Contactos
    const empresasLink = page.locator('a[href="/residuos/empresas"]').first();
    await expect(empresasLink).toBeVisible();
    await empresasLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Directorio de Empresas y Contactos')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '02-empresas-list.png'), fullPage: true });

    // 5. Abrir el modal de alta de nueva empresa
    const nuevaEmpresaBtn = page.locator('button:has-text("Nueva Empresa")');
    await expect(nuevaEmpresaBtn).toBeVisible();
    await nuevaEmpresaBtn.click();

    // 6. Rellenar el formulario del modal
    await expect(page.locator('#empresa_razon_social')).toBeVisible();
    const uniqueSuffix = Date.now().toString().slice(-4);
    const empresaName = `ReciTrat E2E ${uniqueSuffix} S.L.`;
    const comercialName = `ReciTrat E2E ${uniqueSuffix}`;

    // Seleccionar rol Gestor Autorizado
    const gestorRoleBtn = page.locator('button:has-text("Gestor Autorizado")');
    if (await gestorRoleBtn.isVisible()) {
      await gestorRoleBtn.click();
    }

    await page.fill('#empresa_razon_social', empresaName);
    await page.fill('#empresa_nombre_comercial', comercialName);
    await page.fill('#empresa_cif', 'B98765432');
    await page.fill('#empresa_nima', '2800012345');
    await page.fill('input[placeholder="Calle, número, polígono..."]', 'Avenida del Reciclaje 10, Nave 3');
    await page.fill('input[placeholder="28001"]', '28001');
    await page.fill('#empresa_email', `e2e.${uniqueSuffix}@recitrat-test.es`);

    await page.screenshot({ path: path.join(screenshotsDir, '03-modal-alta-empresa.png') });

    // 7. Guardar la nueva empresa
    const submitBtn = page.locator('button:has-text("Crear Empresa")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 8. Esperar a que el modal se cierre y verificar que aparece en el listado
    await expect(page.locator('#empresa_razon_social')).toBeHidden({ timeout: 10000 });
    await expect(page.locator(`text=${empresaName}`).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '04-empresa-creada-en-lista.png'), fullPage: true });

    // 9. Comprobar módulo de Documentos de Identificación (DI)
    const diLink = page.locator('a[href="/residuos/documentos-identificacion"]').first();
    await expect(diLink).toBeVisible();
    await diLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Documentos de Identificación').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '05-documentos-identificacion.png'), fullPage: true });

    // 10. Comprobar módulo de Archivo Cronológico
    const archivoLink = page.locator('a[href="/residuos/archivo-cronologico"]').first();
    await expect(archivoLink).toBeVisible();
    await archivoLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Archivo Cronológico').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '06-archivo-cronologico.png'), fullPage: true });

    // 11. Comprobar módulo de Notificaciones Previas (NT)
    const ntLink = page.locator('a[href="/residuos/notificaciones-previas"]').first();
    await expect(ntLink).toBeVisible();
    await ntLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Notificaciones Previas').first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '07-notificaciones-previas.png'), fullPage: true });
  });
});
