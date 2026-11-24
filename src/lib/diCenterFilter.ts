import type { IdentificationDocument, ProductionCenter } from '@/types/wasteManagement';

export interface CenterFilterOption {
  value: string;
  label: string;
  count: number;
}

export const CENTER_FILTER_ALL = 'all';
export const CENTER_FILTER_NONE = 'none';

/**
 * Comprueba si un Documento de Identificación (DI) coincide con el filtro de centro seleccionado.
 * - 'all': cualquier documento.
 * - 'none': documentos sin centro adicional asignado (sede principal).
 * - '<id>': documentos cuyo `production_center_id` coincide con ese ID numérico.
 */
export function matchesCenterFilter(
  doc: Pick<IdentificationDocument, 'production_center_id'>,
  filterCenter: string
): boolean {
  if (!filterCenter || filterCenter === CENTER_FILTER_ALL) {
    return true;
  }
  if (filterCenter === CENTER_FILTER_NONE) {
    return doc.production_center_id === null || doc.production_center_id === undefined;
  }
  const targetId = Number(filterCenter);
  if (!Number.isFinite(targetId)) {
    return false;
  }
  return Number(doc.production_center_id) === targetId;
}

/**
 * Construye las opciones del selector de centros combinando:
 * 1. Los centros de producción registrados de la empresa activa.
 * 2. Cualquier centro referenciado en los documentos cargados (p. ej. centros de productores externos).
 * 3. Una opción para documentos sin centro adicional (sede principal) si existen.
 */
export function buildCenterFilterOptions(
  documents: Array<Pick<IdentificationDocument, 'production_center_id' | 'production_center'>>,
  companyCenters: Array<Pick<ProductionCenter, 'id' | 'nombre'>>
): CenterFilterOption[] {
  const centerMap = new Map<number, { nombre: string; count: number }>();
  let unassignedCount = 0;

  for (const pc of companyCenters) {
    if (pc && typeof pc.id === 'number') {
      centerMap.set(pc.id, {
        nombre: pc.nombre?.trim() || `Centro #${pc.id}`,
        count: 0,
      });
    }
  }

  for (const doc of documents) {
    if (doc.production_center_id === null || doc.production_center_id === undefined) {
      unassignedCount += 1;
      continue;
    }
    const id = Number(doc.production_center_id);
    if (!Number.isFinite(id)) {
      unassignedCount += 1;
      continue;
    }
    const existing = centerMap.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      const anyDoc = doc as any;
      const fallbackExternalName =
        anyDoc.productor_razon_social && anyDoc.productor_municipio
          ? `${anyDoc.productor_razon_social} (${anyDoc.productor_municipio})`
          : anyDoc.productor_razon_social
            ? `Centro origen (${anyDoc.productor_razon_social})`
            : `Centro #${id}`;
      centerMap.set(id, {
        nombre: doc.production_center?.nombre?.trim() || fallbackExternalName,
        count: 1,
      });
    }
  }

  const options: CenterFilterOption[] = Array.from(centerMap.entries())
    .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, 'es'))
    .map(([id, info]) => ({
      value: String(id),
      label: info.nombre,
      count: info.count,
    }));

  if (unassignedCount > 0) {
    options.push({
      value: CENTER_FILTER_NONE,
      label: 'Sede principal / Sin centro asignado',
      count: unassignedCount,
    });
  }

  return options;
}
