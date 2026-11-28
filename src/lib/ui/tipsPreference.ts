export interface CompanyUiTipsSource {
  mostrar_ayudas_ui?: boolean | null;
}

/**
 * Determina si la empresa tiene activado el modo con tips y ayudas visuales.
 * Por defecto devuelve `false` (modo simplificado).
 */
export function isUiTipsEnabled(company?: CompanyUiTipsSource | null): boolean {
  return Boolean(company?.mostrar_ayudas_ui);
}

/**
 * Decide si debe renderizarse una ayuda, subtítulo o coletilla en la interfaz.
 * Permite forzar su visibilidad con `alwaysShow = true` cuando sea información esencial.
 */
export function shouldRenderUiHint(
  showUiTips: boolean,
  alwaysShow = false
): boolean {
  return alwaysShow || showUiTips;
}
