'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventClickArg } from '@fullcalendar/core';
import { Calendar as CalendarIcon, ExternalLink, X } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import { useTenant } from '@/context/TenantContext';
import calendarService, {
  CALENDAR_CATEGORY_META,
  type CalendarEventCategory,
  type OperationalCalendarEvent,
} from '@/services/calendarService';

export default function CalendarioOperativoPage() {
  const { activeCompanyId, perfilOperativo } = useTenant();
  const isTransportista = perfilOperativo === 'transportista';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<OperationalCalendarEvent[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<CalendarEventCategory>>(
    () =>
      new Set<CalendarEventCategory>([
        'di',
        'nt',
        'contrato',
        'autorizacion',
        'deca',
        'flota_itv_seguro',
        'flota_adr_cap',
      ])
  );
  const [selectedEvent, setSelectedEvent] = useState<OperationalCalendarEvent | null>(null);

  useEffect(() => {
    let active = true;
    async function loadEvents() {
      try {
        setLoading(true);
        const data = await calendarService.getOperationalEvents({
          companyId: activeCompanyId,
          isTransportista,
        });
        if (active) setEvents(data);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadEvents();
    return () => {
      active = false;
    };
  }, [activeCompanyId, isTransportista]);

  const visibleCategories = useMemo(
    () =>
      (Object.keys(CALENDAR_CATEGORY_META) as CalendarEventCategory[]).filter(
        (cat) => !CALENDAR_CATEGORY_META[cat].transportistaOnly || isTransportista
      ),
    [isTransportista]
  );

  const filteredEvents = useMemo(
    () =>
      events
        .filter((ev) => selectedCategories.has(ev.category))
        .map((ev) => ({
          id: ev.id,
          title: ev.title,
          start: ev.start,
          end: ev.end,
          allDay: ev.allDay,
          backgroundColor: ev.color,
          borderColor: ev.color,
          extendedProps: { raw: ev },
        })),
    [events, selectedCategories]
  );

  const toggleCategory = (cat: CalendarEventCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleEventClick = (info: EventClickArg) => {
    const raw = info.event.extendedProps?.raw as OperationalCalendarEvent | undefined;
    if (raw) {
      setSelectedEvent(raw);
    }
  };

  return (
    <div data-tour="calendario-header" className="space-y-6 pb-12">
      <PageHeader
        title="Calendario Operativo"
        breadcrumbTitle="Calendario"
        badge={
          <Badge variant="light" color="info">
            <CalendarIcon className="w-3.5 h-3.5 mr-1 inline" />
            Vista Unificada
          </Badge>
        }
        description={
          isTransportista
            ? 'Planificación de traslados DI, NTs, portes DeCA, caducidades de contratos, ITV, seguros y ADR/CAP.'
            : 'Planificación de traslados DI, notificaciones previas (NT) y vencimientos de contratos y autorizaciones.'
        }
      />

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5">
        {visibleCategories.map((cat) => {
          const meta = CALENDAR_CATEGORY_META[cat];
          const active = selectedCategories.has(cat);
          const count = events.filter((e) => e.category === cat).length;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              <span>{meta.label}</span>
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Calendario */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Cargando eventos del calendario...
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Agenda',
            }}
            events={filteredEvents}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
          />
        )}
      </div>

      {/* Modal de detalle del evento */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        className="max-w-md p-6"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold text-white mb-1.5"
                  style={{ backgroundColor: selectedEvent.color }}
                >
                  {selectedEvent.badgeLabel}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>
                <strong>Fecha:</strong>{' '}
                {new Date(selectedEvent.start).toLocaleDateString('es-ES')}
                {selectedEvent.end
                  ? ` → ${new Date(selectedEvent.end).toLocaleDateString('es-ES')}`
                  : ''}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 pt-1">
                {selectedEvent.description}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cerrar
              </button>
              <Link
                href={selectedEvent.href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white"
              >
                Ver detalle
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
