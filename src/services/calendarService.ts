import identificationDocumentService from '@/services/identificationDocumentService';
import { priorNotificationService } from '@/services/priorNotificationService';
import wasteContractService from '@/services/wasteContractService';
import authorizationService from '@/services/authorizationService';
import { decaService } from '@/services/decaService';
import fleetService from '@/services/fleetService';
import type { DecaDocument } from '@/types/deca';
import type {
  CarrierDriver,
  CarrierVehicle,
  EnvironmentalAuthorization,
  IdentificationDocument,
  PriorNotification,
  WasteContract,
} from '@/types/wasteManagement';

export type CalendarEventCategory =
  | 'di'
  | 'nt'
  | 'contrato'
  | 'autorizacion'
  | 'deca'
  | 'flota_itv_seguro'
  | 'flota_adr_cap';

export interface OperationalCalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  category: CalendarEventCategory;
  color: string;
  description: string;
  href: string;
  badgeLabel: string;
}

export const CALENDAR_CATEGORY_META: Record<
  CalendarEventCategory,
  { label: string; color: string; transportistaOnly?: boolean }
> = {
  di: { label: 'Traslados (DI)', color: '#2563eb' },
  nt: { label: 'Notificaciones (NT)', color: '#7c3aed' },
  contrato: { label: 'Caducidad Contratos', color: '#dc2626' },
  autorizacion: { label: 'Autorizaciones', color: '#ea580c' },
  deca: { label: 'Portes DeCA', color: '#059669', transportistaOnly: true },
  flota_itv_seguro: { label: 'ITV / Seguros Flota', color: '#d97706', transportistaOnly: true },
  flota_adr_cap: { label: 'Caducidad ADR / CAP', color: '#be123c', transportistaOnly: true },
};

function toIsoDate(value?: string | null): string | null {
  if (!value) return null;
  const datePart = value.split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
}

export interface BuildCalendarEventsInput {
  isTransportista: boolean;
  dis: IdentificationDocument[];
  nts: PriorNotification[];
  contracts: WasteContract[];
  authorizations: EnvironmentalAuthorization[];
  decas?: DecaDocument[];
  vehicles?: CarrierVehicle[];
  drivers?: CarrierDriver[];
}

/**
 * Construye los eventos normalizados para el calendario operativo.
 */
export function buildCalendarEvents(
  input: BuildCalendarEventsInput
): OperationalCalendarEvent[] {
  const events: OperationalCalendarEvent[] = [];

  for (const di of input.dis) {
    const start = toIsoDate(di.fecha_recogida || di.fecha_documento);
    if (!start) continue;
    events.push({
      id: `di-${di.id}`,
      title: `DI ${di.numero_documento} · ${di.codigo_ler}`,
      start,
      allDay: true,
      category: 'di',
      color: CALENDAR_CATEGORY_META.di.color,
      description: `${di.productor_razon_social} → ${di.gestor_razon_social} (${di.cantidad} ${di.unidad})`,
      href: `/residuos/documentos-identificacion/${di.id}`,
      badgeLabel: 'DI',
    });
  }

  for (const nt of input.nts) {
    const start = toIsoDate(nt.fecha_inicio || nt.fecha_notificacion);
    if (!start) continue;
    const end = toIsoDate(nt.fecha_fin);
    events.push({
      id: `nt-${nt.id}`,
      title: `NT ${nt.numero_notificacion || nt.id} · ${nt.codigo_ler || ''}`.trim(),
      start,
      ...(end && end > start ? { end } : {}),
      allDay: true,
      category: 'nt',
      color: CALENDAR_CATEGORY_META.nt.color,
      description: `Notificación Previa (${nt.estado})`,
      href: '/residuos/notificaciones-previas',
      badgeLabel: 'NT',
    });
  }

  for (const contract of input.contracts) {
    const expiry = toIsoDate(contract.fecha_fin);
    if (!expiry) continue;
    events.push({
      id: `contrato-${contract.id}`,
      title: `Caduca Contrato ${contract.numero_contrato}`,
      start: expiry,
      allDay: true,
      category: 'contrato',
      color: CALENDAR_CATEGORY_META.contrato.color,
      description: `Vencimiento de contrato de tratamiento (${contract.estado})`,
      href: `/residuos/contratos/${contract.id}`,
      badgeLabel: 'Contrato',
    });
  }

  for (const auth of input.authorizations) {
    const expiry = toIsoDate(auth.fecha_vencimiento);
    if (!expiry) continue;
    events.push({
      id: `auth-${auth.id}`,
      title: `Caduca Autorización ${auth.numero_autorizacion}`,
      start: expiry,
      allDay: true,
      category: 'autorizacion',
      color: CALENDAR_CATEGORY_META.autorizacion.color,
      description: auth.organismo_emisor || 'Autorización ambiental vigente',
      href: '/residuos/mi-empresa',
      badgeLabel: 'Autorización',
    });
  }

  if (input.isTransportista) {
    for (const deca of input.decas || []) {
      if (deca.is_vigente === false) continue;
      const start = toIsoDate(deca.fecha_transporte);
      if (!start) continue;
      events.push({
        id: `deca-${deca.id}`,
        title: `DeCA ${deca.numero_deca} · ${deca.matricula_tractora}`,
        start,
        allDay: true,
        category: 'deca',
        color: CALENDAR_CATEGORY_META.deca.color,
        description: `${deca.origen_municipio} → ${deca.destino_municipio} (${deca.estado})`,
        href: '/residuos/deca',
        badgeLabel: 'DeCA',
      });
    }

    for (const v of input.vehicles || []) {
      if (!v.activo) continue;
      const itv = toIsoDate(v.fecha_caducidad_itv);
      if (itv) {
        events.push({
          id: `veh-itv-${v.id}`,
          title: `Caduca ITV ${v.matricula}`,
          start: itv,
          allDay: true,
          category: 'flota_itv_seguro',
          color: CALENDAR_CATEGORY_META.flota_itv_seguro.color,
          description: `Vencimiento ITV vehículo ${v.matricula} (${v.tipo})`,
          href: '/residuos/flota?tab=vehiculos',
          badgeLabel: 'ITV',
        });
      }
      const seguro = toIsoDate(v.fecha_caducidad_seguro);
      if (seguro) {
        events.push({
          id: `veh-seguro-${v.id}`,
          title: `Caduca Seguro ${v.matricula}`,
          start: seguro,
          allDay: true,
          category: 'flota_itv_seguro',
          color: CALENDAR_CATEGORY_META.flota_itv_seguro.color,
          description: `Vencimiento seguro vehículo ${v.matricula}`,
          href: '/residuos/flota?tab=vehiculos',
          badgeLabel: 'Seguro',
        });
      }
      const adrVeh = toIsoDate(v.fecha_caducidad_adr);
      if (v.tiene_adr && adrVeh) {
        events.push({
          id: `veh-adr-${v.id}`,
          title: `Caduca ADR Vehículo ${v.matricula}`,
          start: adrVeh,
          allDay: true,
          category: 'flota_adr_cap',
          color: CALENDAR_CATEGORY_META.flota_adr_cap.color,
          description: `Certificado ADR del vehículo ${v.matricula}`,
          href: '/residuos/flota?tab=vehiculos',
          badgeLabel: 'ADR',
        });
      }
    }

    for (const d of input.drivers || []) {
      if (!d.activo) continue;
      const adrDrv = toIsoDate(d.fecha_caducidad_adr);
      if (d.tiene_adr && adrDrv) {
        events.push({
          id: `drv-adr-${d.id}`,
          title: `Caduca ADR ${d.nombre}`,
          start: adrDrv,
          allDay: true,
          category: 'flota_adr_cap',
          color: CALENDAR_CATEGORY_META.flota_adr_cap.color,
          description: `Carné ADR del conductor ${d.nombre}`,
          href: '/residuos/flota?tab=conductores',
          badgeLabel: 'ADR Conductor',
        });
      }
      const cap = toIsoDate(d.fecha_caducidad_cap);
      if (cap) {
        events.push({
          id: `drv-cap-${d.id}`,
          title: `Caduca CAP ${d.nombre}`,
          start: cap,
          allDay: true,
          category: 'flota_adr_cap',
          color: CALENDAR_CATEGORY_META.flota_adr_cap.color,
          description: `Certificado CAP del conductor ${d.nombre}`,
          href: '/residuos/flota?tab=conductores',
          badgeLabel: 'CAP',
        });
      }
    }
  }

  return events;
}

export const calendarService = {
  /**
   * Carga todos los eventos operativos del tenant activo para el calendario.
   */
  async getOperationalEvents(options: {
    companyId?: number | null;
    isTransportista: boolean;
  }): Promise<OperationalCalendarEvent[]> {
    const [dis, nts, contracts, authorizations, decas, vehicles, drivers] =
      await Promise.all([
        identificationDocumentService.getAll().catch(() => [] as IdentificationDocument[]),
        priorNotificationService.getAll().catch(() => [] as PriorNotification[]),
        wasteContractService.getAll().catch(() => [] as WasteContract[]),
        options.companyId
          ? authorizationService.getByCompany(options.companyId).catch(() => [] as EnvironmentalAuthorization[])
          : Promise.resolve([] as EnvironmentalAuthorization[]),
        options.isTransportista
          ? decaService.getAll().catch(() => [] as DecaDocument[])
          : Promise.resolve([] as DecaDocument[]),
        options.isTransportista
          ? fleetService.getVehicles().catch(() => [] as CarrierVehicle[])
          : Promise.resolve([] as CarrierVehicle[]),
        options.isTransportista
          ? fleetService.getDrivers().catch(() => [] as CarrierDriver[])
          : Promise.resolve([] as CarrierDriver[]),
      ]);

    return buildCalendarEvents({
      isTransportista: options.isTransportista,
      dis,
      nts,
      contracts,
      authorizations,
      decas,
      vehicles,
      drivers,
    });
  },
};

export default calendarService;
