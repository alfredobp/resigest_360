'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import identificationDocumentService, { getTrackingStatusMeta } from '@/services/identificationDocumentService';
import siraService from '@/services/siraService';
import companyService from '@/services/companyService';
import { generateIdentificationDocumentPDF } from '@/lib/pdfUtils';
import type {
  IdentificationDocument,
  Company,
  RecordDeparturePayload,
  RecordReceptionPayload,
  CompleteTreatmentPayload,
  ResultadoRecepcion,
  TipoIncidencia,
  SiraSubmission,
} from '@/types/wasteManagement';
import {
  Truck,
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileDown,
  Building2,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Code2,
  Send,
  RefreshCw,
} from 'lucide-react';

const OPERACIONES_TRATAMIENTO = [
  { code: 'R01', desc: 'Utilización principal como combustible' },
  { code: 'R03', desc: 'Reciclado/recuperación de sustancias orgánicas' },
  { code: 'R04', desc: 'Reciclado/recuperación de metales' },
  { code: 'R05', desc: 'Reciclado/recuperación de otras materias inorgánicas' },
  { code: 'R12', desc: 'Intercambio de residuos' },
  { code: 'R13', desc: 'Almacenamiento en espera de valorización' },
  { code: 'D01', desc: 'Depósito sobre el suelo o en su interior (vertedero)' },
  { code: 'D08', desc: 'Tratamiento biológico no especificado' },
  { code: 'D09', desc: 'Tratamiento físico-químico no especificado' },
  { code: 'D14', desc: 'Reenvasado previo a eliminación' },
  { code: 'D15', desc: 'Almacenamiento en espera de eliminación' },
];

export default function DetalleDocumentoIdentificacionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<IdentificationDocument | null>(null);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sendingSira, setSendingSira] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [siraSubmissions, setSiraSubmissions] = useState<SiraSubmission[]>([]);
  const [selectedXml, setSelectedXml] = useState<string | null>(null);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);

  // Estados de modales
  const [isDepartureModalOpen, setIsDepartureModalOpen] = useState(false);
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Formularios de modales
  const [departureForm, setDepartureForm] = useState<RecordDeparturePayload>({
    fecha_salida: new Date().toISOString().slice(0, 16),
    transportista_razon_social: '',
    transportista_cif: '',
    transportista_matricula: '',
    nombre_transportista: '',
    dni_transportista: '',
    peso_origen_kg: undefined,
  });

  const [receptionForm, setReceptionForm] = useState<RecordReceptionPayload>({
    fecha_llegada_destino: new Date().toISOString().slice(0, 16),
    peso_destino_kg: 0,
    numero_albaran_gestor: '',
    ticket_pesada_url: '',
    resultado_recepcion: 'aceptado',
    tipo_incidencia: 'discrepancia_peso',
    motivo_incidencia: '',
    cantidad_rechazada_kg: undefined,
    nombre_gestor: '',
    dni_gestor: '',
  });

  const [treatmentForm, setTreatmentForm] = useState<CompleteTreatmentPayload>({
    operacion_tratamiento: 'R13',
    fecha_tratamiento: new Date().toISOString().slice(0, 16),
    descripcion_tratamiento: '',
    notas: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const docData = await identificationDocumentService.getById(parseInt(id));
      setDocument(docData);

      // Cargar transmisiones telemáticas SIRA
      try {
        const subs = await siraService.getSubmissionsForDI(parseInt(id));
        setSiraSubmissions(subs);
      } catch (sErr) {
        console.warn('Error loading SIRA submissions:', sErr);
      }

      // Prellenar formularios
      const pesoOrigenDefault = docData.peso_origen_kg || (docData.unidad === 'toneladas' ? docData.cantidad * 1000 : docData.cantidad) || 0;
      setDepartureForm({
        fecha_salida: docData.fecha_salida ? docData.fecha_salida.slice(0, 16) : new Date().toISOString().slice(0, 16),
        transportista_razon_social: docData.transportista_razon_social || '',
        transportista_cif: docData.transportista_cif || '',
        transportista_matricula: docData.transportista_matricula || '',
        nombre_transportista: docData.nombre_transportista || '',
        dni_transportista: docData.dni_transportista || '',
        peso_origen_kg: pesoOrigenDefault,
      });

      setReceptionForm({
        fecha_llegada_destino: docData.fecha_llegada_destino ? docData.fecha_llegada_destino.slice(0, 16) : new Date().toISOString().slice(0, 16),
        peso_destino_kg: docData.peso_destino_kg || pesoOrigenDefault,
        numero_albaran_gestor: docData.numero_albaran_gestor || '',
        ticket_pesada_url: docData.ticket_pesada_url || '',
        resultado_recepcion: (docData.resultado_recepcion as ResultadoRecepcion) || 'aceptado',
        tipo_incidencia: docData.tipo_incidencia || 'discrepancia_peso',
        motivo_incidencia: docData.motivo_incidencia || '',
        cantidad_rechazada_kg: docData.cantidad_rechazada_kg || undefined,
        nombre_gestor: docData.nombre_gestor || '',
        dni_gestor: docData.dni_gestor || '',
      });

      setTreatmentForm({
        operacion_tratamiento: docData.operacion_tratamiento || 'R13',
        fecha_tratamiento: docData.fecha_tratamiento ? docData.fecha_tratamiento.slice(0, 16) : new Date().toISOString().slice(0, 16),
        descripcion_tratamiento: docData.descripcion_tratamiento || '',
        notas: docData.notas || '',
      });

      const compData = await companyService.getUserCompany();
      setMyCompany(compData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!document) return;
    try {
      setDownloading(true);
      setError(null);
      const doc = await generateIdentificationDocumentPDF(document);
      doc.save(`DI_${document.numero_documento}.pdf`);
      setSuccess('PDF oficial generado y descargado correctamente.');
      toast.success('PDF oficial generado y descargado correctamente.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      const msg = `Error al generar PDF: ${err.message || 'Error desconocido'}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleStartTransit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    try {
      setSubmittingAction(true);
      setError(null);
      await identificationDocumentService.recordDeparture(document.id, departureForm);
      setIsDepartureModalOpen(false);
      setSuccess('Salida registrada. El traslado se encuentra En Tránsito.');
      toast.success('Salida registrada. El traslado se encuentra En Tránsito.');
      await loadData();
    } catch (err: any) {
      const msg = `Error al registrar salida: ${err.message}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRecordReception = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    if (!receptionForm.peso_destino_kg || receptionForm.peso_destino_kg <= 0) {
      toast.warning('Debe introducir un peso neto verificado en báscula de destino mayor a 0 kg.');
      return;
    }

    try {
      setSubmittingAction(true);
      setError(null);
      await identificationDocumentService.recordReception(document.id, receptionForm);
      setIsReceptionModalOpen(false);
      setSuccess('Recepción y pesaje en báscula registrados correctamente.');
      toast.success('Recepción y pesaje en báscula registrados correctamente.');
      await loadData();
    } catch (err: any) {
      const msg = `Error al registrar recepción: ${err.message}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCompleteTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    try {
      setSubmittingAction(true);
      setError(null);
      await identificationDocumentService.completeTreatment(document.id, treatmentForm);
      setIsTreatmentModalOpen(false);
      setSuccess('Operación de tratamiento certificada. Traslado cerrado exitosamente.');
      toast.success('Operación de tratamiento certificada. Traslado cerrado exitosamente.');
      await loadData();
    } catch (err: any) {
      const msg = `Error al certificar tratamiento: ${err.message}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!document || !confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      await identificationDocumentService.delete(document.id);
      toast.success('Documento eliminado correctamente.');
      router.push('/residuos/documentos-identificacion');
    } catch (err: any) {
      const msg = `Error al eliminar: ${err.message}`;
      setError(msg);
      toast.error(msg);
    }
  };

  const handleSendSira = async () => {
    if (!document) return;

    try {
      setSendingSira(true);
      setError(null);
      setSuccess(null);

      const result = await siraService.sendDI(document.id);
      if (result.success) {
        setSuccess(result.message);
        toast.success(result.message);
        await loadData();
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err: any) {
      const msg = err.message || 'Error al conectar con SIRA';
      setError(msg);
      toast.error(msg);
    } finally {
      setSendingSira(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <>
        <PageBreadCrumb pageTitle="Detalle del Documento" />
        <div className="max-w-4xl mx-auto">
          <Alert variant="error" title="Error" message={error || 'Documento no encontrado'} />
          <div className="mt-6">
            <Button onClick={() => router.push('/residuos/documentos-identificacion')}>
              Volver a Documentos
            </Button>
          </div>
        </div>
      </>
    );
  }

  const tracking = getTrackingStatusMeta(document);
  const pesoOrigenCalc = document.peso_origen_kg || (document.unidad === 'toneladas' ? document.cantidad * 1000 : document.cantidad) || 0;

  return (
    <>
      <PageBreadCrumb pageTitle={`DI ${document.numero_documento}`} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header con Estados y Botón Volver */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                DI {document.numero_documento}
              </h2>
              <Badge color={tracking.badgeColor} size="md">
                {tracking.label}
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Régimen de traslados RD 553/2020 — {document.tipo_notificacion === 'con-notificacion-previa' ? 'Con Notificación Previa' : 'Sin Notificación'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4" />
              <span>{downloading ? 'Generando...' : 'Descargar PDF Oficial'}</span>
            </Button>
            <Button variant="outline" onClick={() => router.push('/residuos/documentos-identificacion')}>
              ← Volver
            </Button>
          </div>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}
        {success && <Alert variant="success" title="Éxito" message={success} />}

        {/* PIPELINE / STEPPER VISUAL RD 553/2020 */}
        <ComponentCard title="Ciclo de Vida del Traslado (RD 553/2020)">
          <div className="py-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Paso 1: Registrado / Salida */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${tracking.step >= 1 ? 'bg-primary/5 border-primary/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Paso 1</span>
                    {tracking.step > 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground">Registrado / Origen</p>
                  <p className="text-[11px] text-muted mt-1">{formatDate(document.fecha_documento)}</p>
                </div>
              </div>

              {/* Paso 2: En Tránsito */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${tracking.step >= 2 ? 'bg-primary/5 border-primary/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Paso 2</span>
                    {tracking.step > 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : tracking.step === 2 ? (
                      <Truck className="w-4 h-4 text-blue-600 animate-pulse" />
                    ) : (
                      <Truck className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground">En Tránsito</p>
                  <p className="text-[11px] text-muted mt-1">{document.fecha_salida ? formatDateTime(document.fecha_salida) : 'Pendiente salida'}</p>
                </div>
              </div>

              {/* Paso 3: Recepcionado en Báscula */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${tracking.step >= 3 ? 'bg-primary/5 border-primary/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Paso 3</span>
                    {tracking.step > 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : tracking.step === 3 ? (
                      <Scale className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Scale className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground">Pesaje en Báscula</p>
                  <p className="text-[11px] text-muted mt-1">{document.peso_destino_kg ? `${document.peso_destino_kg} kg` : 'Pendiente pesaje'}</p>
                </div>
              </div>

              {/* Paso 4: Dictamen / Aceptación */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${tracking.step >= 4 ? (document.resultado_recepcion?.includes('rechazado') ? 'bg-red-500/10 border-red-500/30' : 'bg-primary/5 border-primary/30') : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Paso 4</span>
                    {document.resultado_recepcion?.includes('rechazado') ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : tracking.step >= 4 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground">Dictamen Gestor</p>
                  <p className="text-[11px] text-muted mt-1">{document.resultado_recepcion ? document.resultado_recepcion.replace('_', ' ').toUpperCase() : 'Pendiente'}</p>
                </div>
              </div>

              {/* Paso 5: Tratamiento y Cierre */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${tracking.step === 5 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Paso 5</span>
                    {tracking.step === 5 ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground">Tratado y Cerrado</p>
                  <p className="text-[11px] text-muted mt-1">{document.fecha_tratamiento ? formatDate(document.fecha_tratamiento) : 'Pendiente operación'}</p>
                </div>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* TARJETA DE CONTROL DE BÁSCULA Y PESAJE */}
        <ComponentCard
          title="Control de Báscula y Pesaje de Destino"
          desc="Comparativa entre el peso estimado en origen y el peso neto verificado en báscula receptora según el art. 6 del RD 553/2020."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Peso Origen */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                  1. Peso Declarado en Origen
                </span>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {pesoOrigenCalc.toLocaleString('es-ES')} <span className="text-sm font-normal text-muted">kg</span>
                </p>
                <p className="text-[11px] text-muted mt-1">
                  Cantidad declarada: {document.cantidad} {document.unidad}
                </p>
              </div>

              {/* Peso Destino */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                  2. Peso Neto en Báscula Destino
                </span>
                {document.peso_destino_kg ? (
                  <div>
                    <p className="text-2xl font-bold font-mono text-foreground">
                      {document.peso_destino_kg.toLocaleString('es-ES')} <span className="text-sm font-normal text-muted">kg</span>
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      {document.numero_albaran_gestor ? `Albarán gestor: ${document.numero_albaran_gestor}` : 'Registrado en planta'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-muted italic">Pendiente de pesaje</p>
                    <p className="text-[11px] text-muted mt-1">Requiere pesada en báscula del gestor</p>
                  </div>
                )}
              </div>

              {/* Discrepancia */}
              <div className={`p-4 rounded-xl border ${tracking.hasDiscrepancy ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300' : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                  3. Diferencia y Tolerancia
                </span>
                {document.peso_destino_kg ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-bold font-mono ${tracking.hasDiscrepancy ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {(document.diferencia_peso_kg || 0) > 0 ? '+' : ''}{(document.diferencia_peso_kg || 0).toLocaleString('es-ES')} <span className="text-sm font-normal">kg</span>
                      </p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30">
                        {(document.porcentaje_discrepancia || 0) > 0 ? '+' : ''}{document.porcentaje_discrepancia || 0}%
                      </span>
                    </div>
                    <p className="text-[11px] mt-1">
                      {tracking.hasDiscrepancy ? '⚠️ Desviación superior al margen habitual (5%)' : '✓ Dentro de márgenes de tolerancia'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted italic">Se calculará al recibir pesada</p>
                )}
              </div>
            </div>

            {/* Aviso de Discrepancia Normativa */}
            {tracking.hasDiscrepancy && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Atención: Discrepancia de báscula detectada ({tracking.discrepancyMessage})</p>
                  <p className="opacity-90 mt-0.5">
                    Según el RD 553/2020, las discrepancias relevantes entre el peso declarado por el remitente y el pesado por el gestor deben quedar justificadas documentalmente en el DI.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* TARJETA DE ALERTA DE INCIDENCIA / RECHAZO */}
        {document.motivo_incidencia && (
          <ComponentCard title="Registro de Incidencia / Rechazo en Destino">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h4 className="font-bold text-sm uppercase tracking-wide">
                  {document.resultado_recepcion === 'rechazado_total' ? 'Rechazo Total del Traslado' : 'Rechazo Parcial o Incidencia Notificada'}
                </h4>
              </div>
              <p className="text-xs font-semibold">Tipo: {document.tipo_incidencia || 'No tipificada'}</p>
              <p className="text-xs bg-white/60 dark:bg-black/30 p-3 rounded-lg font-mono">
                {document.motivo_incidencia}
              </p>
              {document.cantidad_rechazada_kg && (
                <p className="text-xs font-semibold">
                  Cantidad rechazada devuelta a origen: <span className="font-mono">{document.cantidad_rechazada_kg} kg</span>
                </p>
              )}
            </div>
          </ComponentCard>
        )}

        {/* Partes del Traslado (Productor, Gestor, Transportista) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Productor */}
          <ComponentCard title="Productor / Origen">
            <div className="space-y-2 text-xs">
              <p>
                <span className="text-muted">Razón Social:</span>{' '}
                <span className="text-foreground font-semibold block">{document.productor_razon_social}</span>
              </p>
              <p>
                <span className="text-muted">CIF:</span>{' '}
                <span className="text-foreground font-mono">{document.productor_cif}</span>
              </p>
              {document.production_center && (
                <p>
                  <span className="text-muted">Centro:</span>{' '}
                  <span className="text-primary font-semibold">{document.production_center.nombre}</span>
                </p>
              )}
              {document.productor_nima && (
                <p>
                  <span className="text-muted">NIMA:</span>{' '}
                  <span className="text-foreground font-mono">{document.productor_nima}</span>
                </p>
              )}
              {document.productor_direccion && (
                <p className="text-muted pt-1 border-t border-gray-100 dark:border-gray-800">
                  {document.productor_direccion}, {document.productor_municipio} ({document.productor_provincia})
                </p>
              )}
            </div>
          </ComponentCard>

          {/* Transportista */}
          <ComponentCard title="Transportista">
            <div className="space-y-2 text-xs">
              <p>
                <span className="text-muted">Razón Social:</span>{' '}
                <span className="text-foreground font-semibold block">
                  {document.transportista_razon_social || 'Transporte propio / S/D'}
                </span>
              </p>
              {document.transportista_cif && (
                <p>
                  <span className="text-muted">CIF:</span>{' '}
                  <span className="text-foreground font-mono">{document.transportista_cif}</span>
                </p>
              )}
              {document.transportista_matricula && (
                <p>
                  <span className="text-muted">Matrícula:</span>{' '}
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-gray-100 dark:bg-gray-800 text-foreground border border-gray-300 dark:border-gray-700">
                    {document.transportista_matricula}
                  </span>
                </p>
              )}
              {document.fecha_salida && (
                <p className="pt-1 border-t border-gray-100 dark:border-gray-800 text-muted">
                  Salida: <span className="text-foreground font-medium">{formatDateTime(document.fecha_salida)}</span>
                </p>
              )}
            </div>
          </ComponentCard>

          {/* Gestor */}
          <ComponentCard title="Gestor / Destino">
            <div className="space-y-2 text-xs">
              <p>
                <span className="text-muted">Razón Social:</span>{' '}
                <span className="text-foreground font-semibold block">{document.gestor_razon_social}</span>
              </p>
              <p>
                <span className="text-muted">CIF:</span>{' '}
                <span className="text-foreground font-mono">{document.gestor_cif}</span>
              </p>
              {document.gestor_nima && (
                <p>
                  <span className="text-muted">NIMA:</span>{' '}
                  <span className="text-foreground font-mono">{document.gestor_nima}</span>
                </p>
              )}
              {document.gestor_numero_autorizacion && (
                <p>
                  <span className="text-muted">Autorización:</span>{' '}
                  <span className="text-foreground font-mono font-medium">{document.gestor_numero_autorizacion}</span>
                </p>
              )}
              {document.gestor_direccion && (
                <p className="text-muted pt-1 border-t border-gray-100 dark:border-gray-800">
                  {document.gestor_direccion}, {document.gestor_municipio} ({document.gestor_provincia})
                </p>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Caracterización del Residuo */}
        <ComponentCard title="Caracterización del Residuo y Tratamiento">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Código LER</label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-foreground">{document.codigo_ler}</span>
                {document.codigo_ler.includes('*') || document.peligrosidad === 'peligroso' ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    PELIGROSO (*)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    No Peligroso
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground mt-2">{document.descripcion_residuo}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted text-xs font-semibold uppercase tracking-wider block">Estado Físico</span>
                <p className="text-foreground capitalize">{document.estado_fisico || 'Sólido'}</p>
              </div>

              <div>
                <span className="text-muted text-xs font-semibold uppercase tracking-wider block">Operación de Tratamiento Prevista/Ejecutada</span>
                <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 mt-1">
                  {document.operacion_tratamiento || 'R13'}
                </span>
              </div>

              {document.tipo_envases && (
                <div>
                  <span className="text-muted text-xs font-semibold uppercase tracking-wider block">Envases</span>
                  <p className="text-foreground">{document.numero_envases || 1} ({document.tipo_envases})</p>
                </div>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Firmas de las Partes */}
        <ComponentCard title="Firmas y Conformidades de las Partes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Productor */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${document.firmado_productor ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'}`}>
              <div>
                <span className="font-semibold text-muted block mb-1">1. Productor / Remitente</span>
                {document.firmado_productor ? (
                  <div className="space-y-1">
                    <Badge color="success">✓ Firmado en Salida</Badge>
                    <p className="text-[11px] text-muted mt-2">{formatDateTime(document.fecha_firma_productor)}</p>
                  </div>
                ) : (
                  <Badge color="light">Pendiente de firma</Badge>
                )}
              </div>
            </div>

            {/* Transportista */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${document.firmado_transportista ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'}`}>
              <div>
                <span className="font-semibold text-muted block mb-1">2. Transportista (En Carga)</span>
                {document.firmado_transportista ? (
                  <div className="space-y-1">
                    <Badge color="success">✓ Conforme en Carga</Badge>
                    <p className="text-[11px] text-muted mt-2">{formatDateTime(document.fecha_firma_transportista)}</p>
                    {document.nombre_transportista && (
                      <p className="text-[11px] text-foreground font-medium">{document.nombre_transportista}</p>
                    )}
                  </div>
                ) : (
                  <Badge color="light">Pendiente en recogida</Badge>
                )}
              </div>
            </div>

            {/* Gestor */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${document.firmado_gestor ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'}`}>
              <div>
                <span className="font-semibold text-muted block mb-1">3. Gestor Destinatario</span>
                {document.firmado_gestor ? (
                  <div className="space-y-1">
                    <Badge color="success">✓ Recepcionado y Pesado</Badge>
                    <p className="text-[11px] text-muted mt-2">{formatDateTime(document.fecha_firma_gestor)}</p>
                    {document.nombre_gestor && (
                      <p className="text-[11px] text-foreground font-medium">{document.nombre_gestor}</p>
                    )}
                  </div>
                ) : (
                  <Badge color="light">Pendiente en báscula</Badge>
                )}
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* PANEL DE ACCIONES OPERATIVAS RD 553/2020 */}
        <ComponentCard title="Acciones y Operativa del Traslado">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Acción 1: Iniciar Salida */}
              {(!document.estado_traslado || document.estado_traslado === 'borrador') && (
                <Button onClick={() => setIsDepartureModalOpen(true)} className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>Iniciar Traslado (Firma Salida)</span>
                </Button>
              )}

              {/* Acción 2: Registrar Recepción y Báscula */}
              {(document.estado_traslado === 'en_transito' || document.estado_traslado === 'recepcionado') && (
                <Button onClick={() => setIsReceptionModalOpen(true)} className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Registrar Recepción en Báscula</span>
                </Button>
              )}

              {/* Acción 3: Certificar Tratamiento y Cierre */}
              {(document.estado_traslado === 'aceptado' || document.estado_traslado === 'rechazado_parcial') && (
                <Button onClick={() => setIsTreatmentModalOpen(true)} className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certificar Tratamiento y Cierre</span>
                </Button>
              )}

              {/* Descargar PDF */}
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                <span>{downloading ? 'Generando PDF...' : 'Descargar PDF Oficial (RD 553/2020)'}</span>
              </Button>

              {/* Enviar a SIRA */}
              <Button
                variant="primary"
                disabled={sendingSira || !myCompany?.sira_usuario || !myCompany?.sira_password}
                onClick={handleSendSira}
              >
                {sendingSira ? 'Enviando a SIRA...' : 'Enviar a SIRA'}
              </Button>

              {/* Eliminar (solo en borrador) */}
              {(!document.estado_traslado || document.estado_traslado === 'borrador') && (
                <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                  Eliminar DI
                </Button>
              )}
            </div>

            {!myCompany?.sira_usuario && (
              <p className="text-xs text-error-500 italic">
                * Para remitir telemáticamente a la administración configure sus credenciales de SIRA en &apos;Mi Empresa&apos;.
              </p>
            )}
          </div>
        </ComponentCard>

        {/* PANEL TELEMÁTICO SIRA / E3L */}
        <ComponentCard title="Integración Telemática Oficial (SIRA / e3l - Junta de Andalucía)">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Estado Telemático:</span>
                  {siraSubmissions.length > 0 ? (
                    siraSubmissions[0].estado === 'aceptado' ? (
                      <Badge color="success" size="md">✓ Aceptado en SIRA</Badge>
                    ) : siraSubmissions[0].estado === 'rechazado' ? (
                      <Badge color="error" size="md">✗ Rechazado por SIRA</Badge>
                    ) : (
                      <Badge color="info" size="md">Enviado / En Proceso</Badge>
                    )
                  ) : document.notas?.includes('[SIRA]') ? (
                    <Badge color="success" size="md">✓ Notificado en SIRA</Badge>
                  ) : (
                    <Badge color="light" size="md">Pendiente de Remisión</Badge>
                  )}
                </div>
                {siraSubmissions.length > 0 && siraSubmissions[0].codigo_acuse && (
                  <p className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    Código Acuse Oficial: {siraSubmissions[0].codigo_acuse}
                  </p>
                )}
                {siraSubmissions.length > 0 && siraSubmissions[0].mensaje_error && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Motivo: {siraSubmissions[0].mensaje_error}
                  </p>
                )}
                <p className="text-[11px] text-muted">
                  Protocolo E3L 3.3 conforme al Estándar Nacional de Residuos (e-SIR / SIRA).
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const xml = (siraSubmissions.length > 0 && siraSubmissions[0].xml_enviado)
                      ? siraSubmissions[0].xml_enviado
                      : siraService.generateDIXml(document);
                    setSelectedXml(xml);
                    setIsXmlModalOpen(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Ver XML e3l</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const xml = (siraSubmissions.length > 0 && siraSubmissions[0].xml_enviado)
                      ? siraSubmissions[0].xml_enviado
                      : siraService.generateDIXml(document);
                    siraService.downloadXmlFile(xml, `DI_${document.numero_documento}_e3l.xml`);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Descargar XML</span>
                </Button>

                <Button
                  size="sm"
                  variant={siraSubmissions.length > 0 && siraSubmissions[0].estado === 'aceptado' ? "outline" : "primary"}
                  disabled={sendingSira || !myCompany?.sira_usuario}
                  onClick={() => handleSendSira()}
                  className="flex items-center gap-1.5"
                >
                  {sendingSira ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitiendo...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{siraSubmissions.length > 0 && siraSubmissions[0].estado === 'aceptado' ? 'Re-enviar a SIRA' : 'Transmitir a SIRA'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Historial de Envíos si hay registros */}
            {siraSubmissions.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Histórico de Transmisiones Telemáticas ({siraSubmissions.length})
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-muted uppercase font-semibold">
                      <tr>
                        <th className="px-3 py-2">Fecha / Hora</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Acuse / Mensaje</th>
                        <th className="px-3 py-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-foreground">
                      {siraSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                          <td className="px-3 py-2 whitespace-nowrap text-muted">
                            {formatDateTime(sub.created_at)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.estado === 'aceptado'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : sub.estado === 'rechazado'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}>
                              {sub.estado.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] truncate max-w-xs">
                            {sub.codigo_acuse ? `Acuse: ${sub.codigo_acuse}` : sub.mensaje_error || '-'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {sub.xml_enviado && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedXml(sub.xml_enviado || '');
                                  setIsXmlModalOpen(true);
                                }}
                                className="text-primary hover:underline text-[11px] font-medium"
                              >
                                Ver Payload
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* MODAL 1: INICIAR TRASLADO / SALIDA */}
      <Modal isOpen={isDepartureModalOpen} onClose={() => setIsDepartureModalOpen(false)} className="max-w-lg p-6">
        <form onSubmit={handleStartTransit} className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-gray-200 dark:border-gray-800">
            <Truck className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Iniciar Traslado / Registro de Salida</h3>
          </div>
          <p className="text-xs text-muted">
            Registre la salida efectiva del centro productor con los datos del transportista y matrícula (art. 6 RD 553/2020).
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">Fecha y Hora de Salida *</label>
              <Input
                type="datetime-local"
                value={departureForm.fecha_salida}
                onChange={(e) => setDepartureForm({ ...departureForm, fecha_salida: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">Peso Estimado en Origen (kg)</label>
              <Input
                type="number"
                step="any"
                value={departureForm.peso_origen_kg || ''}
                onChange={(e) => setDepartureForm({ ...departureForm, peso_origen_kg: parseFloat(e.target.value) || undefined })}
                placeholder="Ej: 1500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Empresa Transportista</label>
                <Input
                  type="text"
                  value={departureForm.transportista_razon_social || ''}
                  onChange={(e) => setDepartureForm({ ...departureForm, transportista_razon_social: e.target.value })}
                  placeholder="Transportes S.L."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Matrícula Vehículo *</label>
                <Input
                  type="text"
                  value={departureForm.transportista_matricula || ''}
                  onChange={(e) => setDepartureForm({ ...departureForm, transportista_matricula: e.target.value })}
                  placeholder="1234-BBB"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Nombre Conductor</label>
                <Input
                  type="text"
                  value={departureForm.nombre_transportista || ''}
                  onChange={(e) => setDepartureForm({ ...departureForm, nombre_transportista: e.target.value })}
                  placeholder="Nombre y Apellidos"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">DNI/NIF Conductor</label>
                <Input
                  type="text"
                  value={departureForm.dni_transportista || ''}
                  onChange={(e) => setDepartureForm({ ...departureForm, dni_transportista: e.target.value })}
                  placeholder="12345678X"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setIsDepartureModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submittingAction}>
              {submittingAction ? 'Guardando...' : 'Confirmar Salida'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RECEPCIÓN EN BÁSCULA Y DICTAMEN GESTOR */}
      <Modal isOpen={isReceptionModalOpen} onClose={() => setIsReceptionModalOpen(false)} className="max-w-xl p-6">
        <form onSubmit={handleRecordReception} className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-gray-200 dark:border-gray-800">
            <Scale className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-foreground">Recepción en Báscula y Dictamen de Destino</h3>
          </div>
          <p className="text-xs text-muted">
            Introduzca los datos de pesaje neto y veredicto de conformidad según el pesaje de entrada en planta.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Peso Neto Báscula (kg) *</label>
                <Input
                  type="number"
                  step="any"
                  value={receptionForm.peso_destino_kg || ''}
                  onChange={(e) => setReceptionForm({ ...receptionForm, peso_destino_kg: parseFloat(e.target.value) || 0 })}
                  placeholder="Ej: 1480"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Nº Albarán / Ticket Gestor</label>
                <Input
                  type="text"
                  value={receptionForm.numero_albaran_gestor || ''}
                  onChange={(e) => setReceptionForm({ ...receptionForm, numero_albaran_gestor: e.target.value })}
                  placeholder="ALB-2026-99"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Fecha y Hora Recepción *</label>
                <Input
                  type="datetime-local"
                  value={receptionForm.fecha_llegada_destino}
                  onChange={(e) => setReceptionForm({ ...receptionForm, fecha_llegada_destino: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Dictamen de Recepción *</label>
                <select
                  value={receptionForm.resultado_recepcion}
                  onChange={(e) => setReceptionForm({ ...receptionForm, resultado_recepcion: e.target.value as ResultadoRecepcion })}
                  className="w-full text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
                >
                  <option value="aceptado">✅ Aceptado Conforme</option>
                  <option value="rechazado_parcial">⚠️ Aceptado Parcial (Rechazo de parte)</option>
                  <option value="rechazado_total">❌ Rechazo Total (Devolución a origen)</option>
                </select>
              </div>
            </div>

            {/* Campos condicionales si hay rechazo o incidencia */}
            {receptionForm.resultado_recepcion !== 'aceptado' && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 space-y-3">
                <p className="text-xs font-bold text-red-700 dark:text-red-300">Detalles del Rechazo / Incidencia</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Tipo de Incidencia</label>
                    <select
                      value={receptionForm.tipo_incidencia}
                      onChange={(e) => setReceptionForm({ ...receptionForm, tipo_incidencia: e.target.value })}
                      className="w-full text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-foreground"
                    >
                      <option value="discrepancia_peso">Discrepancia grave de peso</option>
                      <option value="residuo_no_conforme">Residuo no conforme con autorización</option>
                      <option value="etiquetado_incorrecto">Etiquetado o envasado incorrecto</option>
                      <option value="envase_deteriorado">Envase deteriorado o fuga</option>
                      <option value="otro">Otro motivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Cantidad Rechazada (kg)</label>
                    <Input
                      type="number"
                      step="any"
                      value={receptionForm.cantidad_rechazada_kg || ''}
                      onChange={(e) => setReceptionForm({ ...receptionForm, cantidad_rechazada_kg: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">Motivo / Justificación *</label>
                  <TextArea
                    value={receptionForm.motivo_incidencia || ''}
                    onChange={(val) => setReceptionForm({ ...receptionForm, motivo_incidencia: val })}
                    placeholder="Detalle la causa técnica del rechazo..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Nombre Receptor Gestor</label>
                <Input
                  type="text"
                  value={receptionForm.nombre_gestor || ''}
                  onChange={(e) => setReceptionForm({ ...receptionForm, nombre_gestor: e.target.value })}
                  placeholder="Operador báscula"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">DNI/NIF Receptor</label>
                <Input
                  type="text"
                  value={receptionForm.dni_gestor || ''}
                  onChange={(e) => setReceptionForm({ ...receptionForm, dni_gestor: e.target.value })}
                  placeholder="87654321Z"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setIsReceptionModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submittingAction}>
              {submittingAction ? 'Guardando...' : 'Confirmar Recepción'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: CERTIFICAR TRATAMIENTO Y CIERRE */}
      <Modal isOpen={isTreatmentModalOpen} onClose={() => setIsTreatmentModalOpen(false)} className="max-w-lg p-6">
        <form onSubmit={handleCompleteTreatment} className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-gray-200 dark:border-gray-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-foreground">Certificación de Tratamiento y Cierre de DI</h3>
          </div>
          <p className="text-xs text-muted">
            Certifique la ejecución de la operación de valorización o eliminación (código R o D) para cerrar el ciclo del traslado.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">Operación de Tratamiento Realizada *</label>
              <select
                value={treatmentForm.operacion_tratamiento}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, operacion_tratamiento: e.target.value })}
                className="w-full text-xs font-mono font-bold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
              >
                {OPERACIONES_TRATAMIENTO.map(op => (
                  <option key={op.code} value={op.code}>{op.code} - {op.desc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">Fecha de Tratamiento *</label>
              <Input
                type="datetime-local"
                value={treatmentForm.fecha_tratamiento}
                onChange={(e) => setTreatmentForm({ ...treatmentForm, fecha_tratamiento: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">Descripción del Proceso / Notas de Cierre</label>
              <TextArea
                value={treatmentForm.descripcion_tratamiento || ''}
                onChange={(val) => setTreatmentForm({ ...treatmentForm, descripcion_tratamiento: val })}
                placeholder="Detalle sobre el proceso de reciclaje, valorización o inertización realizado..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setIsTreatmentModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submittingAction}>
              {submittingAction ? 'Guardando...' : 'Cerrar Traslado y Certificar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: INSPECTOR XML E3L */}
      <Modal isOpen={isXmlModalOpen} onClose={() => setIsXmlModalOpen(false)} className="max-w-3xl p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Payload XML E3L (SIRA / e-SIR)</h3>
            </div>
            {selectedXml && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => siraService.downloadXmlFile(selectedXml, `DI_${document.numero_documento}_e3l.xml`)}
                className="flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Descargar XML</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">
            Estructura SOAP/XML remitida conforme al estándar oficial e3l v3.3 de la Junta de Andalucía y MITERD.
          </p>

          <pre className="p-4 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 whitespace-pre border border-gray-800 select-all">
            {selectedXml || 'No hay contenido XML disponible'}
          </pre>

          <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
            <Button variant="outline" onClick={() => setIsXmlModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
