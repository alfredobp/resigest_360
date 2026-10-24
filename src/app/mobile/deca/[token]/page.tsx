'use client';

// ==============================================================================
// RESIGEST 360 - VISTA MÓVIL DEL CONDUCTOR (DeCA)
// Permite al transportista mostrar el QR de alta resolución a los agentes en carretera
// o descargar el PDF oficial digital nativo en el dispositivo.
// ==============================================================================

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { decaService } from '@/services/decaService';
import type { DecaDocument } from '@/types/deca';
import { Download, Share2, CheckCircle2, AlertTriangle, Truck, MapPin, Package, ArrowRight } from 'lucide-react';

export default function DecaDriverMobilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [deca, setDeca] = useState<DecaDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

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

  const isExpired = decaService.isTokenExpired(deca);
  const pdfDownloadUrl = `/api/deca/${token}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Cabecera */}
      <header className="mb-4">
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
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isExpired
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isExpired ? 'Finalizado (>7d)' : `v${deca.version} Vigente`}
            </span>
          </div>
        </div>

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
      </header>

      {/* Tarjeta Central: Código QR de Gran Contraste para la Inspección */}
      <main className="space-y-4 my-auto">
        <div className="bg-white rounded-3xl p-5 shadow-2xl text-center border-4 border-blue-500">
          <div className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Código QR Oficial para Inspección
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
            Muestre este código al agente de la <strong>Guardia Civil</strong> o inspectores de transporte. La lectura
            descarga directamente el PDF reglamentario.
          </p>
        </div>

        {/* Tarjeta de Datos de la Expedición */}
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
        </div>
      </main>

      {/* Botones de Acción */}
      <footer className="mt-4 space-y-2.5">
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
      </footer>
    </div>
  );
}
