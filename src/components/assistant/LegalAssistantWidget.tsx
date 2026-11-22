'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ExternalLink,
  Loader2,
  Scale,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import type { LegalAssistantResponse, LegalChatMessage } from '@/types/legalAssistant';
import LegalMarkdownContent from './LegalMarkdownContent';

interface SuggestedPrompt {
  label: string;
  question: string;
}

function getContextualPrompts(pathname: string): SuggestedPrompt[] {
  if (pathname.includes('traslados') || pathname.includes('notificaciones')) {
    return [
      {
        label: '¿Cuándo es obligatoria la NT?',
        question: '¿Cuándo es obligatoria la Notificación Previa (NT) y con cuántos días de antelación debo presentarla?',
      },
      {
        label: 'Plazo para aceptar un DI',
        question: '¿Qué plazo máximo tiene el gestor de destino para aceptar o rechazar un Documento de Identificación (DI)?',
      },
      {
        label: 'Vigencia de una NT general',
        question: '¿Cuál es la vigencia máxima de una Notificación Previa general para traslados múltiples?',
      },
    ];
  }

  if (pathname.includes('memorias') || pathname.includes('archivo')) {
    return [
      {
        label: 'Plazo Memoria Anual',
        question: '¿Cuál es la fecha límite para presentar la Memoria Anual de residuos según la Ley 7/2022?',
      },
      {
        label: 'Conservación archivo cronológico',
        question: '¿Durante cuántos años debo conservar el archivo cronológico de residuos?',
      },
    ];
  }

  if (pathname.includes('contratos')) {
    return [
      {
        label: 'Contenido mínimo del CT',
        question: '¿Qué contenido mínimo obligatorio debe incluir un Contrato de Tratamiento (CT) según el RD 553/2020?',
      },
      {
        label: 'Responsabilidad del productor',
        question: '¿Cuándo concluye la responsabilidad legal del productor inicial sobre sus residuos?',
      },
    ];
  }

  return [
    {
      label: 'Plazos de almacenamiento',
      question: '¿Cuánto tiempo máximo puedo almacenar residuos peligrosos y no peligrosos en mi instalación?',
    },
    {
      label: '¿Cuándo necesito NT?',
      question: '¿En qué casos es obligatoria la Notificación Previa (NT) de traslado de residuos?',
    },
    {
      label: 'Códigos LER con asterisco',
      question: '¿Qué significa el asterisco en un código LER y cómo se clasifican las entradas espejo?',
    },
    {
      label: 'Fecha límite Memoria Anual',
      question: '¿Antes de qué fecha debe enviarse la Memoria Anual de gestión de residuos?',
    },
  ];
}

export default function LegalAssistantWidget() {
  const pathname = usePathname();
  const { activeCompany, activeCompanyId, perfilOperativo } = useTenant();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<LegalChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const suggestions = useMemo(() => getContextualPrompts(pathname || ''), [pathname]);
  const region = activeCompany?.provincia_instalacion || activeCompany?.provincia_social || undefined;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages.length]);

  const sendQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || isSending) return;

    setErrorMessage(null);
    const userMsg: LegalChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };

    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/assistant/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          history: historyPayload,
          pathname,
          perfilOperativo,
          region,
          companyId: activeCompanyId,
        }),
      });

      const data = (await response.json()) as LegalAssistantResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo obtener respuesta del asistente legal.');
      }

      const assistantMsg: LegalChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        logId: data.logId,
        feedback: null,
        retrievalMode: data.retrievalMode,
        demoMode: data.demoMode,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con el asistente legal.';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleFeedback = async (messageId: string, logId: string | null | undefined, feedback: -1 | 1) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    );

    if (!logId) return;

    try {
      await fetch('/api/assistant/legal/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, feedback }),
      });
    } catch {
      // Best-effort
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendQuestion(input);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {isOpen ? (
        <section
          aria-label="Asistente Legal de Residuos"
          className="flex h-[560px] max-h-[calc(100vh-5rem)] w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 text-white dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold leading-tight">Asistente Legal IA</h2>
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    Piloto
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ley 7/2022 · RD 553/2020 · Lista LER
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setErrorMessage(null);
                  }}
                  title="Limpiar conversación"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Cerrar asistente"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 ? (
              <div className="space-y-3 py-2">
                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-xs text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <p className="font-semibold">¿Tienes una duda normativa sobre residuos?</p>
                  <p className="mt-1 text-emerald-900/80 dark:text-emerald-300/80">
                    Pregúntame sobre plazos de almacenamiento, DI, Notificación Previa (NT), contratos de tratamiento, códigos LER o memoria anual.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Consultas sugeridas para esta pantalla
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => void sendQuestion(item.question)}
                        disabled={isSending}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/40"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'whitespace-pre-wrap rounded-br-sm bg-emerald-600 text-white'
                        : 'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <LegalMarkdownContent content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1.5 w-[92%] space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <BookOpen className="h-3 w-3" />
                        <span>Fuentes normativas ({msg.sources.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.slice(0, 4).map((src) =>
                          src.boeUrl ? (
                            <a
                              key={src.chunkId}
                              href={src.boeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={src.sectionTitle}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500"
                            >
                              <span>{src.articleRef}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                            </a>
                          ) : (
                            <span
                              key={src.chunkId}
                              title={src.sectionTitle}
                              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            >
                              {src.articleRef}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {msg.role === 'assistant' && (
                    <div className="mt-1 flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => void handleFeedback(msg.id, msg.logId, 1)}
                        title="Respuesta útil"
                        className={`rounded p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          msg.feedback === 1 ? 'text-emerald-600 dark:text-emerald-400' : ''
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleFeedback(msg.id, msg.logId, -1)}
                        title="Respuesta mejorable"
                        className={`rounded p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          msg.feedback === -1 ? 'text-red-500 dark:text-red-400' : ''
                        }`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Consultando normativa vigente...</span>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input + Legal Disclaimer */}
          <div className="border-t border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendQuestion(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Escribe tu duda legal de residuos..."
                className="max-h-24 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={isSending || input.trim().length < 3}
                title="Enviar consulta"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
              Orientación informativa basada en normativa vigente. No sustituye asesoramiento jurídico vinculante.
            </p>
          </div>
        </section>
      ) : (
        /* Floating Toggle Button */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-label="Abrir asistente legal de residuos"
          className="group flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-lg ring-1 ring-slate-700/60 transition hover:bg-emerald-600 hover:ring-emerald-500 dark:bg-emerald-600 dark:ring-emerald-500/60 dark:hover:bg-emerald-500"
        >
          <Sparkles className="h-4 w-4 text-emerald-400 transition group-hover:text-white dark:text-white" />
          <span>Dudas legales</span>
        </button>
      )}
    </div>
  );
}
