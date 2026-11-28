import type { CompanyRole } from '@/types/wasteManagement';

/**
 * Resuelve el rol operativo efectivo priorizando el rol elegido en Onboarding
 * y usando como fallback el tipo_empresa configurado en Mi Empresa.
 */
export function getEffectiveRole(
  activeRole?: CompanyRole | null,
  companyType?: CompanyRole | string | null
): CompanyRole | null {
  if (activeRole) {
    return activeRole;
  }

  if (
    companyType === 'productor' ||
    companyType === 'gestor' ||
    companyType === 'transportista' ||
    companyType === 'negociante' ||
    companyType === 'agente' ||
    companyType === 'cliente' ||
    companyType === 'proveedor'
  ) {
    return companyType;
  }

  return null;
}

/**
 * Indica si la interfaz debe operar en modo Transportista aislado.
 */
export function isTransportistaMode(
  activeRole?: CompanyRole | null,
  companyType?: CompanyRole | string | null
): boolean {
  return getEffectiveRole(activeRole, companyType) === 'transportista';
}
