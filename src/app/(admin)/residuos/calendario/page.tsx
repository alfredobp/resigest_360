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
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Search,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import { useTenant } from '@/context/TenantContext';
import calendarService, {
  CALENDAR_CATEGORY_META,
  type CalendarEventCategory,
  type OperationalCalendarEvent,
} from '@/services/calendarService';

function formatLongDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getRelativeDayLabel(isoDate: string): {
  label: string;
  tone: 'today' | 'upcoming' | 'past';
} | null {
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return { label: 'Hoy', tone: 'today' };
  if (diffDays === 1) return { label: 'Mañana', tone: 'upcoming' };
  if (diffDays > 1) return { label: `En ${diffDays} días`, tone: 'upcoming' };
  if (diffDays === -1) return { label: 'Ayer', tone: 'past' };
  return { label: `Hace ${Math.abs(diffDays)} días`, tone: 'past' };
}

export default function CalendarioOperativoPage() {
  const { activeCompanyId, perfilOperativo } = useTenant();
  const isTransportista = perfilOperativo === 'transportista';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<OperationalCalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events
      .filter((ev) => {
        if (!selectedCategories.has(ev.category)) return false;
        if (!q) return true;
        const haystack = [
          ev.title,
          ev.description,
          ev.badgeLabel,
          ev.status ?? '',
          ...(ev.details?.map((d) => `${d.label} ${d.value}`) ?? []),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .map((ev) => ({
        id: ev.id,
        title: ev.title,
        start: ev.start,
        end: ev.end,
        allDay: ev.allDay,
        backgroundColor: ev.color,
        borderColor: ev.color,
        extendedProps: { raw: ev },
      }));
  }, [events, selectedCategories, searchQuery]);

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

  const allVisibleSelected = visibleCategories.every((cat) => selectedCategories.has(cat));

  const toggleAllCategories = () => {
    if (allVisibleSelected) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(visibleCategories));
    }
  };

  const handleEventClick = (info: EventClickArg) => {
    const raw = info.event.extendedProps?.raw as OperationalCalendarEvent | undefined;
    if (raw) {
      setSelectedEvent(raw);
    }
  };

  const relativeDay = selectedEvent ? getRelativeDayLabel(selectedEvent.start) : null;

  return (
      <div data-tour="calendario-header" className="space-y-5 pb-12">
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

            {/* Barra de búsqueda y filtros por categoría */ }
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nº DI, LER, matrícula, empresa..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredEvents.length}</strong> de {events.length} eventos
                  </span>
                  <button
                    type="button"
                    onClick={toggleAllCategories}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {allVisibleSelected ? 'Ocultar todos' : 'Mostrar todos'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {visibleCategories.map((cat) => {
                  const meta = CALENDAR_CATEGORY_META[cat];
                  const active = selectedCategories.has(cat);
                  const count = events.filter((e) => e.category === cat).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${active
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs dark:bg-white dark:text-slate-900 dark:border-white'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800'
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
            </div>

            {/* Calendario */ }
              <div className="operational-calendar bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-5 shadow-xs">
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
                    moreLinkText={(n) => `+${n} más`}
                    noEventsText="No hay eventos operativos en este periodo"
                  />
                )}
              </div>

              {/* Modal enriquecido de detalle del evento */}
              <Modal
                isOpen={Boolean(selectedEvent)}
                onClose={() => setSelectedEvent(null)}
                className="max-w-lg overflow-hidden p-0"
              >
                {selectedEvent && (
                          <div>
                            {/* Barra superior de acento según categoría */}
                            <div
                              className="h-1.5 w-full"
                              style={{ backgroundColor: selectedEvent.color }}
                            />

                            <div className="p-6 space-y-5">
                              {/* Cabecera (con pr-10 para no solaparse con el botón cerrar propio de Modal) */}
                              <div className="pr-10 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide text-white"
                                    style={{ backgroundColor: selectedEvent.color }}
                                  >
                                    {selectedEvent.badgeLabel}
                                  </span>
                                  {selectedEvent.status && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                      {selectedEvent.status}
                                    </span>
                                  )}
                                  {relativeDay && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${relativeDay.tone === 'today'
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                          : relativeDay.tone === 'upcoming'
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                    >
                                      <Clock className="w-3 h-3" />
                                      {relativeDay.label}
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                  {selectedEvent.title}
                                </h3>

                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 capitalize">
                                  <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                  <span>
                                    {formatLongDate(selectedEvent.start)}
                                    {selectedEvent.end
                                      ? ` → ${formatLongDate(selectedEvent.end)}`
                                      : ''}
                                  </span>
                                </p>
                              </div>

                            {/* Resumen */}
                            {selectedEvent.description && (
                              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200">
                                {selectedEvent.description}
                              </div>
                            )}

                              {/* Ficha técnica detallada */}
                              {selectedEvent.details && selectedEvent.details.length > 0 && (
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/50">
                                  {selectedEvent.details.map((item) => (
                                    <div key={item.label} className="min-w-0">
                                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {item.label}
                                      </dt>
                                      <dd className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 break-words">
                                        {item.value}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              )}

                              {/* Acciones */}
                              <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEvent(null)}
                                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                  Cerrar
                                </button>
                                <Link
                                  href={selectedEvent.href}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xs transition"
                                >
                                  Ver detalle completo
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
        )}
                        </Modal>
                      </div>
                      );
}
