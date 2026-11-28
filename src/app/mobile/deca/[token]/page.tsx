'use client';

// ==============================================================================
// RESIGEST 360 - VISTA MÓVIL DEL CONDUCTOR (DeCA)
// Permite al transportista mostrar el QR de alta resolución a los agentes en carretera
// o descargar el PDF oficial digital nativo en el dispositivo.
// ==============================================================================

import React, { useEffect, useRef, useState, use } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { decaService } from '@/services/decaService';
import type { DecaDocument } from '@/types/deca';
import type { DecaMobileConfig } from '@/types/wasteManagement';
import {
  Download,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Truck,
  MapPin,
  Package,
  ArrowRight,
  ArrowLeft,
  Navigation,
  PenTool,
  Camera,
  Flag,
} from 'lucide-react';

export default function DecaDriverMobilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [deca, setDeca] = useState<DecaDocument | null>(null);
  const [latestVigenteDeca, setLatestVigenteDeca] = useState<DecaDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  // Acciones móviles del conductor
  const [driverDniOrPin, setDriverDniOrPin] = useState('');
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [driverConfig, setDriverConfig] = useState<DecaMobileConfig>({
    permitir_firma_movil: false,
    permitir_subida_ticket: false,
    permitir_finalizar_movil: false,
    requerir_dni_conductor: true,
  });
  const [incidentNote, setIncidentNote] = useState('');
  const [ticketDataUrl, setTicketDataUrl] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [canReturnToPortal, setCanReturnToPortal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromPortal = new URLSearchParams(window.location.search).get('from') === 'conductor';
    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
    if (fromPortal || isStandalone) {
      setCanReturnToPortal(true);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await decaService.getByToken(token);
        if (!data) {
          setError('Documento DeCA no encontrado o identificador no válido.');
          return;
        }

        setDeca(data);

        fetch(`/api/deca/${token}/driver-action`)
          .then((r) => (r.ok ? r.json() : null))
          .then((cfg) => {
            if (cfg) {
              setPremiumEnabled(Boolean(cfg.premiumEnabled));
              if (cfg.config) setDriverConfig(cfg.config);
            }
          })
          .catch(() => undefined);

        const expiredPayload = Boolean((data as any).expired) || decaService.isTokenExpired(data);
        if (expiredPayload) {
          return;
        }

        // Si la versión no está vigente, buscar la versión vigente activa
        if (data.is_vigente === false) {
          try {
            const active = await decaService.getLatestActiveVersion(data);
            if (active && active.id !== data.id) {
              setLatestVigenteDeca(active);
            }
          } catch (e) {
            console.warn('Error al consultar versión vigente DeCA:', e);
          }
        }

        // Generar QR para la inspección
        const origin = window.location.origin;
        const inspectionUrl = `${origin}/api/deca/${token}`;
        const qr = await QRCode.toDataURL(inspectionUrl, {
          margin: 1,
          width: 320,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(qr);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el documento');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadData();
    }
  }, [token]);

  const handleConfirmReceipt = async () => {
    if (!deca || confirmingReceipt) return;
    try {
      setConfirmingReceipt(true);
      const updated = await decaService.confirmDriverReceipt(deca);
      setDeca(updated);
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingRef.current = true;
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const sendDriverAction = async (payload: Record<string, unknown>) => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/deca/${token}/driver-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverDniOrPin, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionMsg({ type: 'err', text: json.error || 'Error al procesar acción' });
        return;
      }
      setActionMsg({ type: 'ok', text: json.message || 'Acción completada' });
      const refreshed = await decaService.getByToken(token);
      if (refreshed) setDeca(refreshed);
    } catch {
      setActionMsg({ type: 'err', text: 'Error de conexión con el servidor' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTicketFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTicketDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inspectionUrl = `${origin}/api/deca/${token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `DeCA ${deca?.numero_deca || ''} - RESIGEST`,
          text: `Documento Electrónico de Control Administrativo (DeCA): ${deca?.matricula_tractora || ''}`,
          url: inspectionUrl,
        });
      } catch {
        // Ignorar cancelaciones
      }
    } else {
      await navigator.clipboard.writeText(inspectionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
        <p className="text-slate-300 font-medium text-lg">Cargando Documento de Control (DeCA)...</p>
        <p className="text-slate-500 text-sm mt-1">Preparando código QR oficial para inspección</p>
      </div>
    );
  }

  if (error || !deca) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-2">No se pudo cargar el documento</h1>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium transition"
          >
            Ir a Inicio
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = Boolean((deca as any).expired) || decaService.isTokenExpired(deca);
  const pdfDownloadUrl = `/api/deca/${token}`;

  if (isExpired) {
    const finDate = deca.fecha_finalizacion
      ? new Date(deca.fecha_finalizacion).toLocaleDateString('es-ES')
      : null;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Acceso de Inspección Caducado</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Este documento DeCA fue finalizado{finDate ? ` el ${finDate}` : ''} y ha superado el plazo reglamentario de 7 días naturales para acceso público en carretera.
          </p>
          <p className="text-xs text-slate-400">
            Para consultar el histórico oficial, acceda con su cuenta en RESIGEST 360.
          </p>
          <Link
            href="/"
            className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium transition mt-2"
          >
            Ir a Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Cabecera */}
      <header className="mb-4">
        {canReturnToPortal && (
          <div className="mb-3">
            <Link
              href="/mobile/conductor"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a Mis DeCAs
            </Link>
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">RESIGEST 360</span>
              <h1 className="text-lg font-bold text-white leading-tight">Control de Transporte</h1>
            </div>
          </div>
          {/* INC11: Separar explícitamente estado de versión documental y estado operativo del servicio */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${!deca.is_vigente
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
            >
              {!deca.is_vigente ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {!deca.is_vigente
                ? `v${deca.version} · Histórica (Sustituida)`
                : `v${deca.version} · Última versión`}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${deca.estado === 'finalizado'
                ? 'bg-slate-700/80 text-slate-200 border border-slate-500/50'
                : deca.estado === 'anulado'
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
            >
            {deca.estado === 'finalizado'
              ? `Servicio finalizado${deca.fecha_finalizacion
                ? ` (${new Date(deca.fecha_finalizacion).toLocaleString('es-ES', {
                  timeZone: 'Europe/Madrid',
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })})`
                : ''
              }`
                : deca.estado === 'anulado'
                  ? 'Servicio anulado'
                  : 'Servicio en curso'}
          </span>
        </div>
    </div>

        {/* Banner destacado si la versión ha sido sustituida */ }
  {
    !deca.is_vigente && (
      <div className="mb-3 p-3.5 bg-rose-950/80 border-2 border-rose-500 rounded-2xl text-rose-200 shadow-xl shadow-rose-950/40">
        <div className="flex items-center gap-2 font-bold text-rose-300 text-xs sm:text-sm mb-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>VERSIÓN SUSTITUIDA (HISTÓRICA v{deca.version})</span>
        </div>
        <p className="text-xs text-rose-200/90 leading-relaxed mb-2.5">
          Este documento de control ha sido sustituido por una revisión posterior. No debe presentarse en carretera como vigente.
        </p>
        {latestVigenteDeca && (
          <Link
            href={`/mobile/deca/${latestVigenteDeca.token}`}
            className="inline-flex items-center justify-center gap-2 w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-2 px-3 rounded-xl transition shadow-md shadow-rose-900/50"
          >
            <span>Abrir Revisión Vigente Actual (v{latestVigenteDeca.version})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    )
  }

  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
    <div>
      <div className="text-xs text-slate-400">Nº DeCA Oficial</div>
      <div className="text-base font-mono font-bold text-white">{deca.numero_deca}</div>
    </div>
    <div className="text-right">
      <div className="text-xs text-slate-400">Fecha Servicio</div>
      <div className="text-sm font-semibold text-slate-200">
        {new Date(deca.fecha_transporte).toLocaleDateString('es-ES')}
      </div>
    </div>
  </div>
      </header >

    {/* Tarjeta Central: Código QR de Gran Contraste para la Inspección */ }
    < main className = "space-y-4 my-auto" >
      <div className={`bg-white rounded-3xl p-5 shadow-2xl text-center border-4 ${!deca.is_vigente ? 'border-amber-500' : 'border-blue-500'}`}>
        <div className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${!deca.is_vigente ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          {!deca.is_vigente ? `QR Versión Histórica (v${deca.version})` : 'Código QR Oficial para Inspección'}
        </div>

        {qrDataUrl && (
          <div className="flex justify-center my-2">
            <img
              src={qrDataUrl}
              alt="Código QR DeCA"
              className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl"
            />
          </div>
        )}

        <p className="text-slate-600 text-xs mt-2 px-2">
          {!deca.is_vigente
            ? 'Atención: Este código corresponde a una versión histórica sustituida. Para controles en carretera presente la versión vigente.'
            : 'Muestre este código al agente de la Guardia Civil o inspectores de transporte. La lectura descarga directamente el PDF reglamentario.'}
        </p>
      </div>

  {/* Tarjeta de Datos de la Expedición */ }
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
    {/* Matrícula y Conductor */}
    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
      <div>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" /> Matrícula
        </span>
        <p className="text-base font-mono font-bold text-white mt-0.5">{deca.matricula_tractora}</p>
        {deca.matricula_remolque && (
          <p className="text-xs font-mono text-slate-400">Rem: {deca.matricula_remolque}</p>
        )}
      </div>
      <div>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Package className="w-3.5 h-3.5" /> Peso Declarado
        </span>
        <p className="text-base font-bold text-white mt-0.5">
          {deca.peso_kg ? `${deca.peso_kg.toLocaleString('es-ES')} kg` : deca.magnitud_alternativa || '-'}
        </p>
        {deca.codigo_ler && <p className="text-xs text-blue-400">LER: {deca.codigo_ler}</p>}
      </div>
    </div>

    {/* Ruta: Origen -> Destino */}
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 bg-slate-800 rounded-full mt-0.5 text-blue-400">
          <MapPin className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-slate-400">Origen (Carga)</span>
          <p className="text-xs text-slate-200 truncate">{deca.origen_direccion}</p>
          <p className="text-xs font-medium text-white">{deca.origen_municipio} ({deca.origen_provincia})</p>
        </div>
      </div>

      <div className="flex items-center justify-center -my-1">
        <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" />
      </div>

      <div className="flex items-start gap-2.5">
        <div className="p-1.5 bg-slate-800 rounded-full mt-0.5 text-emerald-400">
          <MapPin className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-slate-400">Destino (Entrega)</span>
          <p className="text-xs text-slate-200 truncate">{deca.destino_direccion}</p>
          <p className="text-xs font-medium text-white">{deca.destino_municipio} ({deca.destino_provincia})</p>
        </div>
      </div>
    </div>

    {/* Mercancía */}
    <div className="pt-2 border-t border-slate-800 text-xs">
      <span className="text-slate-400">Naturaleza de la Mercancía:</span>
      <p className="text-slate-200 font-medium line-clamp-2 mt-0.5">{deca.naturaleza_mercancia}</p>
    </div>

    {/* Hito C.2 / L13: Confirmación expresa de recepción de la versión vigente por el conductor */}
    {deca.is_vigente !== false && (
      <div className="pt-2.5 border-t border-slate-800">
        {(() => {
          const confirmation = decaService.getDriverReceiptConfirmation(deca);
          if (confirmation.confirmed) {
            return (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Versión v{deca.version} confirmada por conductor</span>
                  <span className="block text-[11px] text-emerald-300/80">
                    {confirmation.conductorNombre} ·{' '}
                    {confirmation.timestamp
                      ? new Date(confirmation.timestamp).toLocaleString('es-ES', {
                          timeZone: 'Europe/Madrid',
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <button
              type="button"
              disabled={confirmingReceipt}
              onClick={handleConfirmReceipt}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {confirmingReceipt
                  ? 'Confirmando recepción...'
                  : `Confirmar Recepción de Versión Vigente (v${deca.version})`}
              </span>
            </button>
          );
        })()}
      </div>
    )}
  </div>

  {/* Panel Operativo del Conductor (Firma, Ticket y Finalización - Solo Plan Premium) */}
  {premiumEnabled &&
    deca.estado !== 'finalizado' &&
    deca.is_vigente !== false &&
    (driverConfig.permitir_firma_movil ||
      driverConfig.permitir_subida_ticket ||
      driverConfig.permitir_finalizar_movil) && (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
        Operativa del Conductor
      </h2>

      {driverConfig.requerir_dni_conductor && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Tu DNI de conductor (requerido para firmar o finalizar)
          </label>
          <input
            type="text"
            value={driverDniOrPin}
            onChange={(e) => setDriverDniOrPin(e.target.value)}
            placeholder="Ej. 12345678A"
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </div>
      )}

      {actionMsg && (
        <div
          className={`p-2.5 rounded-xl text-xs ${
            actionMsg.type === 'ok'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {(driverConfig.permitir_firma_movil || driverConfig.permitir_subida_ticket) && (
        <div className="grid grid-cols-2 gap-2">
          {driverConfig.permitir_firma_movil && (
            <button
              type="button"
              onClick={() => setShowSignPad((v) => !v)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5" />
              {deca.firma_conductor_url ? 'Firmado ✓' : 'Firmar Porte'}
            </button>
          )}

          {driverConfig.permitir_subida_ticket && (
            <label className="bg-slate-800 hover:bg-slate-700 text-slate-100 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
              <Camera className="w-3.5 h-3.5" />
              {ticketDataUrl || deca.ticket_bascula_url ? 'Ticket Adjunto ✓' : 'Subir Ticket'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleTicketFile}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {driverConfig.permitir_firma_movil && showSignPad && (
        <div className="space-y-2 pt-1">
          <canvas
            ref={canvasRef}
            width={340}
            height={140}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="w-full h-32 bg-white rounded-xl touch-none border border-slate-600"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-lg text-xs"
            >
              Limpiar
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                const dataUrl = canvasRef.current?.toDataURL('image/png');
                if (dataUrl) sendDriverAction({ action: 'sign', signatureDataUrl: dataUrl });
              }}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold"
            >
              Guardar Firma
            </button>
          </div>
        </div>
      )}

      {driverConfig.permitir_subida_ticket && (ticketDataUrl || incidentNote) && (
        <div className="space-y-2 pt-1">
          <input
            type="text"
            value={incidentNote}
            onChange={(e) => setIncidentNote(e.target.value)}
            placeholder="Observación o incidencia en báscula (opcional)"
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
          />
          <button
            type="button"
            disabled={actionLoading}
            onClick={() =>
              sendDriverAction({
                action: 'report_ticket',
                ticketDataUrl: ticketDataUrl || undefined,
                incidentNote: incidentNote || undefined,
              })
            }
            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-xs font-semibold"
          >
            Enviar Ticket / Nota
          </button>
        </div>
      )}

      {driverConfig.permitir_finalizar_movil && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={() => {
            if (confirm('¿Confirmar entrega y finalizar este servicio de transporte?')) {
              sendDriverAction({ action: 'finalize' });
            }
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
        >
          <Flag className="w-4 h-4" />
          Confirmar Entrega / Finalizar Servicio
        </button>
      )}
    </div>
  )}
      </main >

    {/* Botones de Acción */ }
    < footer className = "mt-4 space-y-2.5" >
        <a
          href={pdfDownloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-[0.98]"
        >
          <Download className="w-5 h-5" />
          Descargar PDF DeCA Oficial
        </a>

        <div className="flex gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
              `${deca.origen_direccion}, ${deca.origen_municipio}`
            )}&destination=${encodeURIComponent(
              `${deca.destino_direccion}, ${deca.destino_municipio}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-2.5 px-3 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs transition"
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            Abrir Ruta Maps
          </a>
          <button
            onClick={handleShare}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-2.5 px-3 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs transition"
          >
            <Share2 className="w-4 h-4" />
            {copied ? '¡Enlace copiado!' : 'Compartir enlace'}
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-500 pt-1">
          Documento válido para inspección según Orden FOM/2861/2012 y Ley 9/2025.
        </p>
      </footer >
    </div >
  );
}
