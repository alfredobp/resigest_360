'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Bell,
  BellOff,
  LogOut,
  MapPin,
  ArrowRight,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface DriverSummary {
  id: number;
  nombre: string;
  dni: string;
}

interface CompanyBrand {
  razon_social: string;
  logo_url: string | null;
}

interface DriverDecaItem {
  id: number;
  numero_deca: string;
  version: number;
  token: string;
  estado: string;
  fecha_transporte: string;
  matricula_tractora: string;
  matricula_remolque?: string | null;
  origen_municipio: string;
  origen_provincia: string;
  destino_municipio: string;
  destino_provincia: string;
  naturaleza_mercancia: string;
  peso_kg?: number | null;
  firma_conductor_url?: string | null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function DriverPortalPwaPage() {
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<DriverSummary | null>(null);
  const [company, setCompany] = useState<CompanyBrand | null>(null);
  const [vigentes, setVigentes] = useState<DriverDecaItem[]>([]);
  const [historial, setHistorial] = useState<DriverDecaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'vigentes' | 'historial'>('vigentes');

  // Login form
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // PWA & Push
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  const loadDriverDecas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mobile/conductor/decas', { cache: 'no-store' });
      if (res.status === 401) {
        setDriver(null);
        return;
      }
      if (!res.ok) return;
      const json = await res.json();
      setDriver(json.driver);
      setCompany(json.company || null);
      setVigentes(json.vigentes || []);
      setHistorial(json.historial || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDriverDecas();
  }, [loadDriverDecas]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setPushSubscribed(Boolean(sub)))
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/mobile/conductor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, pin }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoginError(json.error || 'No se pudo iniciar sesión.');
        return;
      }
      await loadDriverDecas();
    } catch {
      setLoginError('Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/mobile/conductor/login', { method: 'DELETE' });
    setDriver(null);
    setVigentes([]);
    setHistorial([]);
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleTogglePush = async () => {
    setPushMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();

      if (existing) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        await existing.unsubscribe();
        setPushSubscribed(false);
        setPushMsg('Notificaciones desactivadas en este dispositivo.');
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setPushMsg('Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY en el servidor.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushMsg('Permiso de notificaciones denegado en el navegador.');
        return;
      }

      const appServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });

      const subJson = subscription.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subJson),
      });

      if (!res.ok) {
        setPushMsg('No se pudo guardar la suscripción.');
        return;
      }

      setPushSubscribed(true);
      setPushMsg('¡Avisos activados! Recibirás notificaciones al asignarte un DeCA.');
    } catch {
      setPushMsg('Error al configurar notificaciones Push.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3" />
        <p className="text-sm text-slate-400">Cargando Portal de Conductores...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center p-5 max-w-md mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo/pwa-192.png"
              alt="ResiGest 360"
              className="w-12 h-12 rounded-2xl bg-white p-1 object-contain"
            />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                ResiGest 360
              </span>
              <h1 className="text-xl font-bold text-white">Portal del Conductor</h1>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Accede con el <strong>DNI</strong> y el <strong>PIN</strong> facilitado por tu empresa para consultar tus DeCAs asignados y recibir avisos en ruta.
          </p>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">DNI / NIE</label>
              <input
                type="text"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678A"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">PIN de acceso</label>
              <input
                type="password"
                inputMode="numeric"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition"
            >
              {submitting ? 'Accediendo...' : 'Entrar al Portal'}
            </button>
          </form>

          {installPrompt ? (
            <button
              type="button"
              onClick={handleInstallPwa}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-blue-400" />
              Instalar App en el móvil
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                En iPhone/Android puedes pulsar <strong>Compartir / Menú → Añadir a pantalla de inicio</strong> para instalarla con el icono oficial.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const displayedList = activeTab === 'vigentes' ? vigentes : historial;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-lg mx-auto space-y-4 pb-12">
      {/* Cabecera con logo de empresa */}
      <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={company?.logo_url || '/images/logo/pwa-192.png'}
            alt={company?.razon_social || 'ResiGest 360'}
            className="w-10 h-10 rounded-xl bg-white p-1 object-contain shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-blue-400 truncate">
              {company?.razon_social || 'ResiGest Conductores'}
            </p>
            <h1 className="text-sm font-bold text-white truncate">{driver.nombre}</h1>
            <p className="text-[11px] text-slate-400">{driver.dni}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Banner Push & Instalación */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {pushSubscribed ? (
              <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <BellOff className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-medium text-slate-200">
              {pushSubscribed
                ? 'Notificaciones Push activas'
                : 'Activa avisos para nuevos DeCAs'}
            </span>
          </div>

          {pushSupported && (
            <button
              type="button"
              onClick={handleTogglePush}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                pushSubscribed
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {pushSubscribed ? 'Desactivar' : 'Activar'}
            </button>
          )}
        </div>

        {pushMsg && <p className="text-[11px] text-blue-300">{pushMsg}</p>}

        {installPrompt && (
          <button
            type="button"
            onClick={handleInstallPwa}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Instalar App en Pantalla de Inicio
          </button>
        )}
      </div>

      {/* Pestañas Vigentes / Historial */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('vigentes')}
          className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
            activeTab === 'vigentes'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Vigentes / En Ruta ({vigentes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('historial')}
          className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
            activeTab === 'historial'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Historial 30d ({historial.length})
        </button>
      </div>

      {/* Listado de DeCAs */}
      {displayedList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <Truck className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-300">
            {activeTab === 'vigentes'
              ? 'No tienes portes vigentes asignados ahora mismo.'
              : 'No hay portes finalizados en los últimos 30 días.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedList.map((doc) => (
            <Link
              key={doc.id}
              href={`/mobile/deca/${doc.token}?from=conductor`}
              className="block bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-white">
                  {doc.numero_deca}
                </span>
                <div className="flex items-center gap-1.5">
                  {doc.firma_conductor_url && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Firmado
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold">
                    {doc.matricula_tractora}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">
                  {doc.origen_municipio} → {doc.destino_municipio}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span className="truncate pr-2">{doc.naturaleza_mercancia}</span>
                <span className="inline-flex items-center gap-1 text-blue-400 font-semibold shrink-0">
                  Abrir QR <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

