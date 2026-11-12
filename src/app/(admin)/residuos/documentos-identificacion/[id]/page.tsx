'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';
import { Modal, ConfirmModal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import identificationDocumentService, { getTrackingStatusMeta, normalizeOperationCode } from '@/services/identificationDocumentService';
import wasteContractService from '@/services/wasteContractService';
import authorizationService from '@/services/authorizationService';
import siraService from '@/services/siraService';
import companyService from '@/services/companyService';
import { generateIdentificationDocumentPDF } from '@/lib/pdfUtils';
import {
  CAUSAS_DISCREPANCIA,
  CAUSA_DISCREPANCIA_LABELS,
  MIN_JUSTIFICATION_LENGTH,
  isWeightDiscrepancy,
} from '@/lib/validations/discrepancyJustification';
import SignatureModal from '@/components/ui/signature/SignatureModal';
import type {
  IdentificationDocument,
  Company,
  WasteContract,
  RecordDeparturePayload,
  RecordReceptionPayload,
  CompleteTreatmentPayload,
  ResultadoRecepcion,
  SiraSubmission,
  CausaDiscrepancia,
} from '@/types/wasteManagement';

function toLocalDateTimeInput(value?: string | null): string {
  const date = value ? new Date(value) : new Date();
  if (isNaN(date.getTime())) return toLocalDateTimeInput();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estados de modales
  const [isDepartureModalOpen, setIsDepartureModalOpen] = useState(false);
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
  const [justifyForm, setJustifyForm] = useState<{ causa: CausaDiscrepancia | ''; texto: string }>({ causa: '', texto: '' });
  const [submittingAction, setSubmittingAction] = useState(false);
  const [modalActionError, setModalActionError] = useState<string | null>(null);
  const [activeContracts, setActiveContracts] = useState<WasteContract[]>([]);
  const [authorizedOpsForLer, setAuthorizedOpsForLer] = useState<string[] | null>(null);
  const [contractForm, setContractForm] = useState<{
    contract_id?: number;
    contrato_externo_referencia: string;
    supuesto_excepcion_contrato: string;
  }>({
    contract_id: undefined,
    contrato_externo_referencia: '',
    supuesto_excepcion_contrato: '',
  });

  // Estados de firma digital
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signingRole, setSigningRole] = useState<'productor' | 'gestor' | 'transportista'>('productor');
  const [signerInitialData, setSignerInitialData] = useState<{ nombre: string; dni: string }>({ nombre: '', dni: '' });

  // Formularios de modales
  const [departureForm, setDepartureForm] = useState<RecordDeparturePayload>({
    fecha_salida: toLocalDateTimeInput(),
    transportista_razon_social: '',
    transportista_cif: '',
    transportista_matricula: '',
    nombre_transportista: '',
    dni_transportista: '',
    peso_origen_kg: undefined,
    contract_id: undefined,
    contrato_externo_referencia: '',
    contrato_externo_evidencia_url: '',
    supuesto_excepcion_contrato: '',
  });

  const [receptionForm, setReceptionForm] = useState<RecordReceptionPayload>({
    fecha_llegada_destino: toLocalDateTimeInput(),
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
    fecha_tratamiento: toLocalDateTimeInput(),
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

      // Prellenar formularios con hora local
      const pesoOrigenDefault = docData.peso_origen_kg || (docData.unidad === 'toneladas' ? docData.cantidad * 1000 : docData.cantidad) || 0;
      setDepartureForm({
        fecha_salida: docData.fecha_salida ? toLocalDateTimeInput(docData.fecha_salida) : toLocalDateTimeInput(),
        transportista_razon_social: docData.transportista_razon_social || '',
        transportista_cif: docData.transportista_cif || '',
        transportista_matricula: docData.transportista_matricula || '',
        nombre_transportista: docData.nombre_transportista || '',
        dni_transportista: docData.dni_transportista || '',
        peso_origen_kg: pesoOrigenDefault,
        contract_id: docData.contract_id,
        contrato_externo_referencia: docData.contrato_externo_referencia || '',
        contrato_externo_evidencia_url: docData.contrato_externo_evidencia_url || '',
        supuesto_excepcion_contrato: docData.supuesto_excepcion_contrato || '',
      });

      setReceptionForm({
        fecha_llegada_destino: docData.fecha_llegada_destino ? toLocalDateTimeInput(docData.fecha_llegada_destino) : toLocalDateTimeInput(),
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
        operacion_tratamiento: normalizeOperationCode(docData.operacion_tratamiento_ejecutada || docData.operacion_tratamiento || 'R13'),
        fecha_tratamiento: docData.fecha_tratamiento ? toLocalDateTimeInput(docData.fecha_tratamiento) : toLocalDateTimeInput(),
        descripcion_tratamiento: docData.descripcion_tratamiento || '',
        notas: docData.notas || '',
      });

      setContractForm({
        contract_id: docData.contract_id || undefined,
        contrato_externo_referencia: docData.contrato_externo_referencia || '',
        supuesto_excepcion_contrato: docData.supuesto_excepcion_contrato || docData.contrato_externo_evidencia_url || '',
      });

      const compData = await companyService.getUserCompany();
      setMyCompany(compData);

      // Cargar contratos vigentes y alcance autorizado del gestor para validaciones en UI
      try {
        const [contractsList, allContacts] = await Promise.all([
          wasteContractService.getActive(),
          companyService.getAllContacts(),
        ]);
        setActiveContracts(contractsList);

        const normGestorCif = docData.gestor_cif?.trim().toUpperCase();
        const gestorComp = allContacts.find((c) => c.cif?.trim().toUpperCase() === normGestorCif);
        if (gestorComp) {
          const scope = await authorizationService.getAuthorizedScope(gestorComp.id, null, docData.fecha_documento);
          if (scope.hasAnyAuthorizationConfigured) {
            const ops = (scope.authorizedLers[docData.codigo_ler.trim()] || []).map((o) => normalizeOperationCode(o));
            setAuthorizedOpsForLer(ops);
          } else {
            setAuthorizedOpsForLer(null);
          }
        }
      } catch (valErr) {
        console.warn('Nota: cargando contratos y alcance autorizado:', valErr);
      }
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
      setModalActionError(null);
      setError(null);
      await identificationDocumentService.recordDeparture(document.id, departureForm);
      setIsDepartureModalOpen(false);
      setSuccess('Salida registrada. El traslado se encuentra En Tránsito.');
      toast.success('Salida registrada. El traslado se encuentra En Tránsito.');
      await loadData();
    } catch (err: any) {
      const msg = err.message || 'Error al registrar salida';
      setModalActionError(msg);
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
      setModalActionError(null);
      setError(null);
      const receptionPayload: RecordReceptionPayload = receptionForm.causa_discrepancia
        ? receptionForm
        : { ...receptionForm, causa_discrepancia: undefined, justificacion_discrepancia: undefined };
      await identificationDocumentService.recordReception(document.id, receptionPayload);
      setIsReceptionModalOpen(false);
      setSuccess('Recepción y pesaje en báscula registrados correctamente. Asiento sincronizado en el Archivo Cronológico.');
      toast.success('Recepción y pesaje en báscula registrados correctamente. Asiento sincronizado en el Archivo Cronológico.');
      await loadData();
    } catch (err: any) {
      const msg = `Error al registrar recepción: ${err.message}`;
      setModalActionError(msg);
      toast.error(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const openJustifyModal = () => {
    if (!document) return;
    setModalActionError(null);
    setJustifyForm({
      causa: (document.causa_discrepancia as CausaDiscrepancia) || '',
      texto: document.justificacion_discrepancia || '',
    });
    setIsJustifyModalOpen(true);
  };

  const handleJustifyDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    if (!justifyForm.causa) {
      setModalActionError('Seleccione la causa de la discrepancia.');
      return;
    }

    try {
      setSubmittingAction(true);
      setModalActionError(null);
      await identificationDocumentService.justifyDiscrepancy(document.id, {
        causa: justifyForm.causa,
        texto: justifyForm.texto,
      });
      setIsJustifyModalOpen(false);
      toast.success('Discrepancia de báscula justificada correctamente.');
      await loadData();
    } catch (err: any) {
      const msg = err.message || 'Error al justificar la discrepancia';
      setModalActionError(msg);
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
      setModalActionError(null);
      setError(null);
      await identificationDocumentService.completeTreatment(document.id, treatmentForm);
      setIsTreatmentModalOpen(false);
      setSuccess('Operación de tratamiento certificada. Traslado cerrado exitosamente y archivado.');
      toast.success('Operación de tratamiento certificada. Traslado cerrado exitosamente y archivado.');
      await loadData();
    } catch (err: any) {
      const msg = err.message || 'Error al certificar tratamiento';
      setModalActionError(msg);
      toast.error(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveContractCoverage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    const hasInternalContract = Boolean(contractForm.contract_id);
    const hasExternalRef = Boolean(contractForm.contrato_externo_referencia.trim());

    if (!hasInternalContract && !hasExternalRef) {
      setModalActionError('Debes seleccionar un contrato vigente en plataforma o indicar la referencia de un contrato externo acreditado (Art. 5 RD 553/2020).');
      return;
    }

    try {
      setSubmittingAction(true);
      setModalActionError(null);
      await identificationDocumentService.update(document.id, {
        contract_id: hasInternalContract ? contractForm.contract_id : (null as any),
        contrato_externo_referencia: hasInternalContract ? '' : contractForm.contrato_externo_referencia.trim(),
        supuesto_excepcion_contrato: hasInternalContract ? '' : contractForm.supuesto_excepcion_contrato.trim(),
      });
      setIsContractModalOpen(false);
      const msg = 'Cobertura contractual regularizada correctamente (Art. 5 RD 553/2020).';
      setSuccess(msg);
      toast.success(msg);
      await loadData();
    } catch (err: any) {
      const msg = err.message || 'Error al actualizar cobertura contractual';
      setModalActionError(msg);
      toast.error(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = () => {
    if (!document) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!document) return;

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

  const handleOpenSignatureModal = (role: 'productor' | 'gestor' | 'transportista') => {
    setSigningRole(role);
    let defaultName = '';
    let defaultDni = '';
    if (role === 'productor') {
      defaultName = document?.nombre_productor || myCompany?.razon_social || '';
      defaultDni = document?.dni_productor || myCompany?.cif || '';
    } else if (role === 'transportista') {
      defaultName = document?.nombre_transportista || '';
      defaultDni = document?.dni_transportista || '';
    } else if (role === 'gestor') {
      defaultName = document?.nombre_gestor || '';
      defaultDni = document?.dni_gestor || '';
    }
    setSignerInitialData({ nombre: defaultName, dni: defaultDni });
    setIsSignatureModalOpen(true);
  };

  const handleSaveSignature = async (signatureBase64: string, signerData?: { nombre?: string; dni?: string }) => {
    if (!document) return;
    try {
      setLoading(true);
      await identificationDocumentService.signDocument(
        document.id,
        signingRole,
        signatureBase64,
        signerData
      );
      toast.success(`Firma de ${signingRole} registrada con éxito en el documento.`);
      await loadData();
    } catch (err: any) {
      toast.error(`Error al registrar firma: ${err.message}`);
    } finally {
      setLoading(false);
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      const [y, m, day] = dateString.trim().split('-').map(Number);
      return new Date(y, m - 1, day).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return new Date(dateString).toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
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
  const pesoOrigenTracking = document.peso_origen_kg || (document.unidad === 'toneladas' ? document.cantidad * 1000 : document.cantidad) || 0;
  const receptionDiscrepancy = isWeightDiscrepancy(pesoOrigenTracking, receptionForm.peso_destino_kg);
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
            >
              <span>{downloading ? 'Generando...' : 'Descargar PDF Oficial'}</span>
            </Button>
            <Button variant="outline" onClick={() => router.push('/residuos/documentos-identificacion')}>
              ← Volver
            </Button>
          </div>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}
        {success && <Alert variant="success" title="Éxito" message={success} />}

        {/* Banner de Regularización de Cobertura Contractual (Art. 5 RD 553/2020) */}
        {!document.contract_id && !document.contrato_externo_referencia && (
          <div className="p-4 rounded-2xl border border-red-300 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
                <span>⚠️</span> Incidencia Normativa: Traslado sin contrato acreditado (Art. 5 RD 553/2020)
              </h4>
              <p className="text-xs text-red-700 dark:text-red-400">
                Este Documento de Identificación no tiene un Contrato de Tratamiento vinculado ni una referencia de contrato externo acreditada. Regularízalo vinculando un contrato vigente o acreditando su referencia externa.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setModalActionError(null);
                setIsContractModalOpen(true);
              }}
              className="shrink-0 !bg-red-600 hover:!bg-red-700 !text-white"
            >
              Regularizar Contrato →
            </Button>
          </div>
        )}

        {/* PIPELINE / STEPPER VISUAL RD 553/2020 */}
        <ComponentCard title="Ciclo de Vida del Traslado (RD 553/2020)">
          <div className="py-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Paso 1: Registrado / Salida */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${tracking.step >= 1 ? 'bg-primary/5 border-primary/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Paso 1</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{tracking.step > 1 ? '✓' : '●'}</span>
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
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{tracking.step > 2 ? '✓' : (tracking.step === 2 ? '●' : '○')}</span>
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
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{tracking.step > 3 ? '✓' : (tracking.step === 3 ? '●' : '○')}</span>
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
                    <span className="text-xs font-bold">{document.resultado_recepcion?.includes('rechazado') ? '✕' : (tracking.step >= 4 ? '✓' : '○')}</span>
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
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{tracking.step === 5 ? '✓' : '○'}</span>
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
            {tracking.hasDiscrepancy && !tracking.isDiscrepancyJustified && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold">Atención: Discrepancia de báscula detectada ({tracking.discrepancyMessage})</p>
                  <p className="opacity-90 mt-0.5">
                    Según el RD 553/2020, las discrepancias relevantes entre el peso declarado por el remitente y el pesado por el gestor deben quedar justificadas documentalmente en el DI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openJustifyModal}
                  className="shrink-0 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors"
                >
                  Justificar discrepancia
                </button>
              </div>
            )}

            {/* Discrepancia justificada (trazabilidad para inspección) */}
            {tracking.isDiscrepancyJustified && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">
                    ✓ Discrepancia justificada ({tracking.discrepancyMessage})
                  </p>
                  <p>
                    <span className="font-semibold">Causa:</span>{' '}
                    {document.causa_discrepancia ? CAUSA_DISCREPANCIA_LABELS[document.causa_discrepancia] : 'No tipificada'}
                  </p>
                  <p className="whitespace-pre-line">{document.justificacion_discrepancia}</p>
                  <p className="opacity-75">
                    Registrada{document.justificacion_discrepancia_by_nombre ? ` por ${document.justificacion_discrepancia_by_nombre}` : ''}
                    {document.justificacion_discrepancia_at ? ` el ${new Date(document.justificacion_discrepancia_at).toLocaleString('es-ES')}` : ''}
                  </p>
                </div>
                {document.estado_traslado !== 'tratado' && (
                  <button
                    type="button"
                    onClick={openJustifyModal}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-emerald-600/40 hover:bg-emerald-500/10 font-semibold transition-colors"
                  >
                    Editar
                  </button>
                )}
              </div>
            )}
          </div>
        </ComponentCard>

        {/* TARJETA DE ALERTA DE INCIDENCIA / RECHAZO */}
        {document.motivo_incidencia && (
          <ComponentCard title="Registro de Incidencia / Rechazo en Destino">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 space-y-2">
              <div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-muted text-xs font-semibold uppercase tracking-wider block">Operación Prevista</span>
                  <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 mt-1">
                    {document.operacion_tratamiento || 'R13'}
                  </span>
                </div>
                {document.operacion_tratamiento_ejecutada && (
                  <div>
                    <span className="text-muted text-xs font-semibold uppercase tracking-wider block">Operación Real Ejecutada</span>
                    <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 mt-1">
                      {document.operacion_tratamiento_ejecutada}
                    </span>
                  </div>
                )}
              </div>

              {document.tipo_envases && (
                <div>
                  <span className="text-muted text-xs font-semibold uppercase tracking-wider block">Envases</span>
                  <p className="text-foreground">{document.numero_envases || 1} ({document.tipo_envases})</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-muted text-xs font-semibold uppercase tracking-wider block mb-1">
                  Cobertura Contractual (Art. 5 RD 553/2020)
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {document.contract_id ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Contrato vinculado: {document.contract?.numero_contrato || `CT #${document.contract_id}`}
                    </span>
                  ) : document.contrato_externo_referencia ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Contrato externo acreditado: {document.contrato_externo_referencia}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                      ⚠️ Sin contrato vinculado ni referencia acreditada
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setModalActionError(null);
                      setIsContractModalOpen(true);
                    }}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {document.contract_id || document.contrato_externo_referencia ? 'Editar contrato vinculado' : 'Regularizar contrato'}
                  </button>
                </div>
              </div>
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
                    <Badge color="success">
                      {document.firma_productor_url ? '✓ Firmado en Salida' : '✓ Identificado (Sin firma gráfica)'}
                    </Badge>
                    {document.firma_productor_url && (
                      <div className="mt-2 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 flex justify-center">
                        <img
                          src={document.firma_productor_url}
                          alt="Firma Productor"
                          className="h-12 max-w-full object-contain filter dark:invert"
                        />
                      </div>
                    )}
                    {document.nombre_productor && (
                      <p className="text-[11px] text-foreground font-medium mt-1">
                        {document.nombre_productor} {document.dni_productor ? `(${document.dni_productor})` : ''}
                      </p>
                    )}
                    <p className="text-[10px] text-muted mt-1">{formatDateTime(document.fecha_firma_productor)}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge color="light">Pendiente de firma</Badge>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSignatureModal('productor')}
                        className="w-full text-xs"
                      >
                        ✍️ Firmar como Productor
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transportista */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${document.firmado_transportista ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'}`}>
              <div>
                <span className="font-semibold text-muted block mb-1">2. Transportista (En Carga)</span>
                {document.firmado_transportista ? (
                  <div className="space-y-1">
                    <Badge color="success">
                      {document.firma_transportista_url ? '✓ Conforme y Firmado en Carga' : '✓ Conforme en Carga (Sin trazo de firma)'}
                    </Badge>
                    {document.firma_transportista_url && (
                      <div className="mt-2 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 flex justify-center">
                        <img
                          src={document.firma_transportista_url}
                          alt="Firma Transportista"
                          className="h-12 max-w-full object-contain filter dark:invert"
                        />
                      </div>
                    )}
                    {document.nombre_transportista && (
                      <p className="text-[11px] text-foreground font-medium mt-1">
                        {document.nombre_transportista} {document.dni_transportista ? `(${document.dni_transportista})` : ''}
                      </p>
                    )}
                    <p className="text-[10px] text-muted mt-1">{formatDateTime(document.fecha_firma_transportista)}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge color="light">Pendiente en recogida</Badge>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSignatureModal('transportista')}
                        className="w-full text-xs"
                      >
                        ✍️ Firmar como Transportista
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gestor */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${document.firmado_gestor ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'}`}>
              <div>
                <span className="font-semibold text-muted block mb-1">3. Gestor Destinatario</span>
                {document.firmado_gestor ? (
                  <div className="space-y-1">
                    <Badge color="success">
                      {document.firma_gestor_url ? '✓ Recepcionado y Firmado' : '✓ Recepcionado y Pesado (Sin trazo de firma)'}
                    </Badge>
                    {document.firma_gestor_url && (
                      <div className="mt-2 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 flex justify-center">
                        <img
                          src={document.firma_gestor_url}
                          alt="Firma Gestor"
                          className="h-12 max-w-full object-contain filter dark:invert"
                        />
                      </div>
                    )}
                    {document.nombre_gestor && (
                      <p className="text-[11px] text-foreground font-medium mt-1">
                        {document.nombre_gestor} {document.dni_gestor ? `(${document.dni_gestor})` : ''}
                      </p>
                    )}
                    <p className="text-[10px] text-muted mt-1">{formatDateTime(document.fecha_firma_gestor)}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge color="light">Pendiente en báscula</Badge>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSignatureModal('gestor')}
                        className="w-full text-xs"
                      >
                        ✍️ Firmar como Gestor
                      </Button>
                    </div>
                  </div>
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
                <Button onClick={() => { setModalActionError(null); setIsDepartureModalOpen(true); }}>
                  <span>Iniciar Traslado (Salida)</span>
                </Button>
              )}

              {/* Acción 2: Registrar Recepción y Báscula */}
              {(document.estado_traslado === 'en_transito' || document.estado_traslado === 'recepcionado') && (
                <Button onClick={() => { setModalActionError(null); setIsReceptionModalOpen(true); }}>
                  <span>Registrar Recepción en Báscula</span>
                </Button>
              )}

              {/* Acción 3: Certificar Tratamiento y Cierre */}
              {(document.estado_traslado === 'aceptado' || document.estado_traslado === 'rechazado_parcial' || document.estado_traslado === 'tratado') && (
                <Button
                  variant={document.estado_traslado === 'tratado' ? 'outline' : 'primary'}
                  onClick={() => { setModalActionError(null); setIsTreatmentModalOpen(true); }}
                >
                  <span>{document.estado_traslado === 'tratado' ? 'Rectificar Tratamiento' : 'Certificar Tratamiento y Cierre'}</span>
                </Button>
              )}

              {/* Acción Regularizar / Vincular Contrato (Art. 5 RD 553/2020) */}
              <Button
                variant={!document.contract_id && !document.contrato_externo_referencia ? 'primary' : 'outline'}
                onClick={() => { setModalActionError(null); setIsContractModalOpen(true); }}
              >
                <span>
                  {!document.contract_id && !document.contrato_externo_referencia
                    ? 'Vincular / Regularizar Contrato (Art. 5)'
                    : 'Cambiar Contrato Vinculado'}
                </span>
              </Button>

              {/* Descargar PDF */}
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
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
                  Protocolo E3L v3.6 (namespaces <code>e3l://eterproject.org/3.0/*</code>) conforme al estándar SIRA / e-SIR.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const check = siraService.validateDIForE3L(document);
                    if (!check.valid) {
                      toast.warning(`XML incompleto para SIRA/e-SIR: ${check.errors[0]}`, 'Validación E3L v3.6');
                    }
                    const xml = (siraSubmissions.length > 0 && siraSubmissions[0].xml_enviado)
                      ? siraSubmissions[0].xml_enviado
                      : siraService.generateDIXml(document);
                    setSelectedXml(xml);
                    setIsXmlModalOpen(true);
                  }}
                >
                  <span>Ver XML e3l</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const check = siraService.validateDIForE3L(document);
                    if (!check.valid) {
                      toast.warning(`XML exportado con datos incompletos (${check.errors.length} errores de esquema): ${check.errors.join(' ')}`, 'Validación E3L v3.6');
                    }
                    const xml = (siraSubmissions.length > 0 && siraSubmissions[0].xml_enviado)
                      ? siraSubmissions[0].xml_enviado
                      : siraService.generateDIXml(document);
                    siraService.downloadXmlFile(xml, `DI_${document.numero_documento}_e3l.xml`);
                  }}
                >
                  <span>Descargar XML</span>
                </Button>

                <Button
                  size="sm"
                  variant={siraSubmissions.length > 0 && siraSubmissions[0].estado === 'aceptado' ? "outline" : "primary"}
                  disabled={sendingSira || !myCompany?.sira_usuario}
                  onClick={() => handleSendSira()}
                >
                  <span>{sendingSira ? 'Transmitiendo...' : (siraSubmissions.length > 0 && siraSubmissions[0].estado === 'aceptado' ? 'Re-enviar a SIRA' : 'Transmitir a SIRA')}</span>
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
      <Modal isOpen={isDepartureModalOpen} onClose={() => setIsDepartureModalOpen(false)} className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <form onSubmit={handleStartTransit} className="space-y-4">
          <div className="border-b pb-3 border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-foreground">Iniciar Traslado / Registro de Salida</h3>
          </div>
          <p className="text-xs text-muted">
            Registre la salida efectiva del centro productor acreditando contrato previo vigente (o contrato externo) y datos del transporte (arts. 5 y 6 RD 553/2020).
          </p>

          {modalActionError && (
            <Alert variant="error" title="Validación de Salida" message={modalActionError} />
          )}

          {/* Bloque de Acreditación Contractual (F03) */}
          <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-2.5">
            <p className="text-xs font-bold text-foreground">
              Cobertura Contractual (Art. 5 RD 553/2020) *
            </p>
            {document.contract_id ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ Vinculado al contrato #{document.contract?.numero_contrato || document.contract_id}
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    Seleccionar Contrato Vigente en Plataforma
                  </label>
                  <select
                    value={departureForm.contract_id || ''}
                    onChange={(e) =>
                      setDepartureForm({
                        ...departureForm,
                        contract_id: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-foreground"
                  >
                    <option value="">-- Ninguno seleccionado (o acreditar contrato externo abajo) --</option>
                    {activeContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.numero_contrato || `CT-${c.id}`} — {c.gestor_company?.razon_social || c.treatment_manager?.razon_social || 'Gestor'} ({(c.codigos_ler || []).join(', ') || 'Varios LER'})
                      </option>
                    ))}
                  </select>
                </div>

                {!departureForm.contract_id && (
                  <div className="grid grid-cols-1 gap-2 pt-1 border-t border-blue-500/15">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">
                        O Referencia de Contrato Externo Acreditado
                      </label>
                      <Input
                        type="text"
                        value={departureForm.contrato_externo_referencia || ''}
                        onChange={(e) => setDepartureForm({ ...departureForm, contrato_externo_referencia: e.target.value })}
                        placeholder="Ej: CT-EXT-2026-0041 (Contrato firmado fuera de plataforma)"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">
                        Justificante / URL o Supuesto Legal Aplicable
                      </label>
                      <Input
                        type="text"
                        value={departureForm.supuesto_excepcion_contrato || departureForm.contrato_externo_evidencia_url || ''}
                        onChange={(e) =>
                          setDepartureForm({
                            ...departureForm,
                            supuesto_excepcion_contrato: e.target.value,
                          })
                        }
                        placeholder="Ej: Contrato marco archivado en expediente físico / URL PDF"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

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
          <div className="border-b pb-3 border-gray-200 dark:border-gray-800">
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

            {/* Justificación de discrepancia de báscula (opcional en recepción) */}
            {receptionDiscrepancy && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-3">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Discrepancia de báscula superior al margen de tolerancia (5% o 200 kg)
                </p>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                  Puede justificarla ahora o más tarde desde el detalle del DI (RD 553/2020).
                </p>
                <div>
                  <label className="block text-xs text-muted mb-1">Causa de la discrepancia</label>
                  <select
                    value={receptionForm.causa_discrepancia || ''}
                    onChange={(e) => setReceptionForm({ ...receptionForm, causa_discrepancia: (e.target.value || undefined) as CausaDiscrepancia | undefined })}
                    className="w-full text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-foreground"
                  >
                    <option value="">— Justificar más tarde —</option>
                    {CAUSAS_DISCREPANCIA.map((c) => (
                      <option key={c} value={c}>{CAUSA_DISCREPANCIA_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                {receptionForm.causa_discrepancia && (
                  <div>
                    <label className="block text-xs text-muted mb-1">Justificación * (mín. {MIN_JUSTIFICATION_LENGTH} caracteres)</label>
                    <TextArea
                      value={receptionForm.justificacion_discrepancia || ''}
                      onChange={(val) => setReceptionForm({ ...receptionForm, justificacion_discrepancia: val })}
                      placeholder="Ej: El residuo se pesó en origen con humedad; tras el escurrido en planta se registra la merma..."
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}

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

      {/* MODAL: JUSTIFICAR DISCREPANCIA DE BÁSCULA */}
      <Modal isOpen={isJustifyModalOpen} onClose={() => setIsJustifyModalOpen(false)} className="max-w-lg p-6">
        <form onSubmit={handleJustifyDiscrepancy} className="space-y-4">
          <div className="border-b pb-3 border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-foreground">Justificar Discrepancia de Báscula</h3>
          </div>
          <p className="text-xs text-muted">
            {tracking.discrepancyMessage}. Documente la causa de la diferencia entre el peso declarado en origen y el neto verificado en destino (RD 553/2020).
            {document.estado_traslado === 'tratado' && ' El DI está cerrado: una vez guardada, la justificación no podrá modificarse.'}
          </p>

          {modalActionError && (
            <Alert variant="error" title="No se pudo guardar la justificación" message={modalActionError} />
          )}

          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-1">Causa *</label>
            <select
              value={justifyForm.causa}
              onChange={(e) => setJustifyForm({ ...justifyForm, causa: e.target.value as CausaDiscrepancia | '' })}
              className="w-full text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
              required
            >
              <option value="">Seleccione una causa…</option>
              {CAUSAS_DISCREPANCIA.map((c) => (
                <option key={c} value={c}>{CAUSA_DISCREPANCIA_LABELS[c]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-1">
              Justificación * <span className="normal-case font-normal">({justifyForm.texto.trim().length}/{MIN_JUSTIFICATION_LENGTH} mín.)</span>
            </label>
            <TextArea
              value={justifyForm.texto}
              onChange={(val) => setJustifyForm({ ...justifyForm, texto: val })}
              placeholder="Describa la causa técnica de la diferencia de peso..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setIsJustifyModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submittingAction || !justifyForm.causa || justifyForm.texto.trim().length < MIN_JUSTIFICATION_LENGTH}
            >
              {submittingAction ? 'Guardando...' : 'Guardar Justificación'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: CERTIFICAR TRATAMIENTO Y CIERRE */}
      <Modal isOpen={isTreatmentModalOpen} onClose={() => setIsTreatmentModalOpen(false)} className="max-w-lg p-6">
        <form onSubmit={handleCompleteTreatment} className="space-y-4">
          <div className="border-b pb-3 border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-foreground">Certificación de Tratamiento y Cierre de DI</h3>
          </div>
          <p className="text-xs text-muted">
            Certifique la operación realmente ejecutada (conservando por separado la operación prevista <strong>{document.operacion_tratamiento || 'R13'}</strong>). Solo se admiten operaciones amparadas por la autorización ambiental del gestor y compatibles con el régimen del DI.
          </p>

          {modalActionError && (
            <Alert variant="error" title="Operación No Autorizada / Cierre Denegado" message={modalActionError} />
          )}

          {authorizedOpsForLer && authorizedOpsForLer.length > 0 && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              Operaciones autorizadas en destino para LER <strong>{document.codigo_ler}</strong>:{' '}
              <span className="font-mono font-bold">{authorizedOpsForLer.join(', ')}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">Operación de Tratamiento Realizada *</label>
              <select
                value={treatmentForm.operacion_tratamiento}
                onChange={(e) => {
                  setModalActionError(null);
                  setTreatmentForm({ ...treatmentForm, operacion_tratamiento: e.target.value });
                }}
                className="w-full text-xs font-mono font-bold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10"
              >
                {OPERACIONES_TRATAMIENTO.filter(
                  (op) => !authorizedOpsForLer || authorizedOpsForLer.length === 0 || authorizedOpsForLer.includes(normalizeOperationCode(op.code))
                ).map(op => (
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
            <h3 className="text-lg font-bold text-foreground">Payload XML E3L (SIRA / e-SIR)</h3>
            {selectedXml && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => siraService.downloadXmlFile(selectedXml, `DI_${document.numero_documento}_e3l.xml`)}
              >
                <span>Descargar XML</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">
            Estructura XML generada conforme al estándar E3L v3.6 (namespaces <code>e3l://eterproject.org/3.0/*</code>).
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

      {/* MODAL 5: REGULARIZAR / VINCULAR COBERTURA CONTRACTUAL (ART. 5 RD 553/2020) */}
      <Modal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} className="max-w-lg p-6">
        <form onSubmit={handleSaveContractCoverage} className="space-y-4">
          <div className="border-b pb-3 border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-foreground">
              Cobertura Contractual del Traslado (Art. 5 RD 553/2020)
            </h3>
          </div>
          <p className="text-xs text-muted">
            Todo traslado de residuos requiere disponer con carácter previo de un Contrato de Tratamiento vigente con el gestor destinatario. Seleccione un contrato registrado en la plataforma o acredite la referencia de su contrato externo.
          </p>

          {modalActionError && (
            <Alert variant="error" title="Atención" message={modalActionError} />
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1.5">
                1. Seleccionar Contrato Vigente en Plataforma
              </label>
              <select
                value={contractForm.contract_id || ''}
                onChange={(e) => {
                  setModalActionError(null);
                  setContractForm({
                    ...contractForm,
                    contract_id: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  });
                }}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Ninguno seleccionado (acreditar contrato externo abajo) --</option>
                {activeContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero_contrato || `CT-${c.id}`} — {c.gestor_company?.razon_social || c.treatment_manager?.razon_social || 'Gestor'} ({(c.codigos_ler || []).join(', ') || 'Varios LER'})
                  </option>
                ))}
              </select>
            </div>

            {!contractForm.contract_id && (
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">
                    2. O Referencia de Contrato Externo Acreditado *
                  </label>
                  <Input
                    type="text"
                    value={contractForm.contrato_externo_referencia}
                    onChange={(e) => {
                      setModalActionError(null);
                      setContractForm({ ...contractForm, contrato_externo_referencia: e.target.value });
                    }}
                    placeholder="Ej: CT-EXT-2026-0041 (Contrato firmado fuera de plataforma)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">
                    Justificante / Observaciones o Supuesto Legal
                  </label>
                  <Input
                    type="text"
                    value={contractForm.supuesto_excepcion_contrato}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        supuesto_excepcion_contrato: e.target.value,
                      })
                    }
                    placeholder="Ej: Contrato marco archivado en expediente físico"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setIsContractModalOpen(false)} disabled={submittingAction}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submittingAction}>
              {submittingAction ? 'Guardando...' : 'Guardar Cobertura Contractual'}
            </Button>
          </div>
        </form>
      </Modal>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSaveSignature}
        withSignerInputs={true}
        initialName={signerInitialData.nombre}
        initialDni={signerInitialData.dni}
        title={`Firmar Documento de Identificación como ${
          signingRole === 'productor'
            ? 'Productor / Remitente'
            : signingRole === 'transportista'
            ? 'Transportista en Carga'
            : 'Gestor Destinatario'
        }`}
        description="Dibuje su firma en el recuadro para validar la conformidad y registrarla en el documento oficial."
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar documento"
        message="¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer."
      />
    </>
  );
}
