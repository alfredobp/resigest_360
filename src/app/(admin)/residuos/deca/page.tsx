'use client';

// ==============================================================================
// RESIGEST 360 - GESTIÓN DE DOCUMENTOS ELECTRÓNICOS DE CONTROL ADMINISTRATIVO (DeCA)
// Normativa: Ley 9/2025, Orden FOM/2861/2012 y Resolución de 5 de junio de 2026.
// ==============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { decaService } from '@/services/decaService';
import identificationDocumentService from '@/services/identificationDocumentService';
import { useTenant } from '@/context/TenantContext';
import { evaluateCompanyPremiumFeature } from '@/lib/auth/premiumAccess';
import PremiumStatusTag from '@/components/common/PremiumStatusTag';
import { companyService } from '@/services/companyService';
import { carrierService } from '@/services/carrierService';
import fleetService from '@/services/fleetService';
import {
  getDriverComplianceAlerts,
  getVehicleComplianceAlerts,
} from '@/lib/validations/fleetValidation';
import {
  buildDecaMailtoUrl,
  buildDecaShareMessage,
  buildDecaWhatsAppUrl,
} from '@/lib/decaShare';
import type { DecaDocument, DecaFormData } from '@/types/deca';
import type { Company, Carrier, CarrierDriver, CarrierVehicle, IdentificationDocument } from '@/types/wasteManagement';
import { toast } from '@/context/ToastContext';
import PageHeader from '@/components/common/PageHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { DataTable, DataTableActionButton, type ColumnDef } from '@/components/ui/table';
import { Modal, ConfirmModal } from '@/components/ui/modal';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import ProvinceMunicipalityFields from '@/components/form/ProvinceMunicipalityFields';
import TextArea from '@/components/form/input/TextArea';
import {
  validateRequired,
  validateCIF,
  validatePositiveNumber,
  scrollToFirstError,
} from '@/lib/validations/formValidation';
import {
  Truck,
  Plus,
  QrCode,
  Download,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
  History,
  FileText,
  Copy,
  Check,
  Calendar,
  X,
  AlertTriangle,
  Share2,
  Mail,
  MessageCircle
} from 'lucide-react';

export default function DecaManagementPage() {
  const { activeCompany, activeCompanyId, perfilOperativo } = useTenant();
  const isTransportista = perfilOperativo === 'transportista';
  const premiumEval = evaluateCompanyPremiumFeature(activeCompany, 'transporte_pwa_evidencias');
  const [documents, setDocuments] = useState<DecaDocument[]>([]);
  const [availableDIs, setAvailableDIs] = useState<IdentificationDocument[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [availableCarriers, setAvailableCarriers] = useState<Carrier[]>([]);
  const [fleetDrivers, setFleetDrivers] = useState<CarrierDriver[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<CarrierVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modales
  const [qrModalDoc, setQrModalDoc] = useState<DecaDocument | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createSubmitError, setCreateSubmitError] = useState<string | null>(null);
  const [versionModalDoc, setVersionModalDoc] = useState<DecaDocument | null>(null);
  const [versionErrors, setVersionErrors] = useState<Record<string, string>>({});
  const [motivoVersion, setMotivoVersion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docToFinalize, setDocToFinalize] = useState<number | null>(null);

  // Formulario de creación
  const initialFormData: Partial<DecaFormData> = {
    cargador_razon_social: '',
    cargador_nif: '',
    cargador_domicilio: '',
    cargador_municipio: '',
    cargador_provincia: '',
    transportista_razon_social: '',
    transportista_nif: '',
    transportista_autorizacion: '',
    origen_direccion: '',
    origen_municipio: '',
    origen_provincia: '',
    destino_direccion: '',
    destino_municipio: '',
    destino_provincia: '',
    naturaleza_mercancia: '',
    peso_kg: 0,
    matricula_tractora: '',
    matricula_remolque: '',
    conductor_nombre: '',
    fecha_transporte: new Date().toISOString().split('T')[0],
    estado: 'vigente',
  };
  const [formData, setFormData] = useState<Partial<DecaFormData>>(initialFormData);

  const clearCreateError = (field: string) => {
    if (createErrors[field]) {
      setCreateErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const clearVersionError = (field: string) => {
    if (versionErrors[field]) {
      setVersionErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const [data, comps, carriers, drivers, vehicles, dis] = await Promise.all([
        decaService.getAll().catch(() => [] as DecaDocument[]),
        companyService.getAll().catch(() => [] as Company[]),
        carrierService.getAll().catch(() => [] as Carrier[]),
        fleetService.getDrivers().catch(() => [] as CarrierDriver[]),
        fleetService.getVehicles().catch(() => [] as CarrierVehicle[]),
        isTransportista
          ? identificationDocumentService.getAll().catch(() => [] as IdentificationDocument[])
          : Promise.resolve([] as IdentificationDocument[]),
      ]);
      setDocuments(data);
      setAvailableCompanies(comps);
      setAvailableCarriers(carriers);
      setFleetDrivers(drivers);
      setFleetVehicles(vehicles);
      setAvailableDIs(dis);
    } catch (err: any) {
      console.error('Error al cargar documentos DeCA:', err);
      toast.error(`Error al cargar documentos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeCompanyId]);

  const handleOpenQrModal = async (doc: DecaDocument) => {
    setQrModalDoc(doc);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inspectionUrl = `${origin}/api/deca/${doc.token}`;
    try {
      const qr = await QRCode.toDataURL(inspectionUrl, {
        margin: 1,
        width: 280,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setQrDataUrl(qr);
    } catch (err) {
      console.warn('Error al generar QR:', err);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleFinalize = (id: number) => {
    setDocToFinalize(id);
  };

  const confirmFinalize = async () => {
    if (docToFinalize === null) return;
    try {
      await decaService.finalizeService(docToFinalize);
      toast.success('Servicio de transporte finalizado con éxito.');
      await loadDocuments();
    } catch (err: any) {
      toast.error(`Error al finalizar servicio: ${err.message}`);
    }
  };

  const openCreateModal = () => {
    // Autocompletar datos propios de la empresa transportista activa (UXDEV-11 / UX-11)
    const normCif = activeCompany?.cif?.toUpperCase().trim();
    const currentCarrier = availableCarriers.find(
      (c) => c.cif?.toUpperCase().trim() === normCif
    );

    const defaultTractora =
      fleetVehicles[0]?.matricula ||
      activeCompany?.matricula ||
      currentCarrier?.matricula ||
      currentCarrier?.flota_vehiculos?.[0]?.matricula ||
      '';

    const defaultRemolque =
      fleetVehicles[0]?.remolque_habitual ||
      currentCarrier?.flota_vehiculos?.[0]?.remolque ||
      '';

    const defaultConductor =
      fleetDrivers[0]?.nombre ||
      currentCarrier?.flota_conductores?.[0]?.nombre ||
      activeCompany?.persona_contacto ||
      '';

    const prefilledData: Partial<DecaFormData> = {
      ...initialFormData,
      company_id: activeCompany?.id ?? activeCompanyId ?? undefined,
      transportista_razon_social: activeCompany?.razon_social || activeCompany?.nombre_comercial || currentCarrier?.razon_social || '',
      transportista_nif: activeCompany?.cif || currentCarrier?.cif || '',
      transportista_autorizacion: activeCompany?.numero_autorizacion || activeCompany?.numero_inscripcion || currentCarrier?.numero_autorizacion || '',
      transportista_nima: activeCompany?.nima || currentCarrier?.nima || '',
      transportista_domicilio: activeCompany?.domicilio_social || activeCompany?.domicilio_instalacion || currentCarrier?.direccion || '',
      transportista_municipio: activeCompany?.municipio_social || activeCompany?.municipio_instalacion || currentCarrier?.municipio || '',
      transportista_provincia: activeCompany?.provincia_social || activeCompany?.provincia_instalacion || currentCarrier?.provincia || '',
      transportista_codigo_postal: activeCompany?.codigo_postal_social || activeCompany?.codigo_postal_instalacion || currentCarrier?.codigo_postal || '',
      matricula_tractora: defaultTractora,
      matricula_remolque: defaultRemolque,
      conductor_nombre: defaultConductor,
      fecha_transporte: new Date().toISOString().split('T')[0],
      estado: 'vigente',
    };

    setFormData(prefilledData);
    setCreateErrors({});
    setCreateSubmitError(null);
    setCreateModalOpen(true);
  };

  const handleSelectFleetDriver = (driverId: string) => {
    const drv = fleetDrivers.find((d) => String(d.id) === driverId);
    if (!drv) return;
    const linkedVehicle = drv.vehicle_id
      ? fleetVehicles.find((v) => v.id === drv.vehicle_id)
      : fleetVehicles.find(
          (v) =>
            drv.vehiculo_asignado &&
            v.matricula.replace(/\s+/g, '').toUpperCase() ===
              drv.vehiculo_asignado.replace(/\s+/g, '').toUpperCase()
        );

    setFormData((prev) => ({
      ...prev,
      conductor_nombre: drv.nombre,
      matricula_tractora: drv.vehiculo_asignado || linkedVehicle?.matricula || prev.matricula_tractora || '',
      matricula_remolque: drv.remolque_asignado || linkedVehicle?.remolque_habitual || prev.matricula_remolque || '',
    }));
    clearCreateError('matricula_tractora');
    clearVersionError('matricula_tractora');
  };

  const handleSelectFleetVehicle = (vehicleId: string) => {
    const veh = fleetVehicles.find((v) => String(v.id) === vehicleId);
    if (!veh) return;
    setFormData((prev) => ({
      ...prev,
      matricula_tractora: veh.matricula,
      matricula_remolque: veh.remolque_habitual || prev.matricula_remolque || '',
    }));
    clearCreateError('matricula_tractora');
    clearVersionError('matricula_tractora');
  };

  const matchedFleetDriver = fleetDrivers.find(
    (d) =>
      formData.conductor_nombre &&
      d.nombre.trim().toLowerCase() === formData.conductor_nombre.trim().toLowerCase()
  );
  const matchedFleetVehicle = fleetVehicles.find(
    (v) =>
      formData.matricula_tractora &&
      v.matricula.replace(/\s+/g, '').toUpperCase() ===
        formData.matricula_tractora.replace(/\s+/g, '').toUpperCase()
  );
  const activeFleetComplianceAlerts = [
    ...(matchedFleetDriver ? getDriverComplianceAlerts(matchedFleetDriver) : []),
    ...(matchedFleetVehicle ? getVehicleComplianceAlerts(matchedFleetVehicle) : []),
  ];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setCreateSubmitError(null);
    const errors: Record<string, string> = {};

    const cargadorRazonError = validateRequired(formData.cargador_razon_social, 'Razón social del cargador');
    if (cargadorRazonError) errors.cargador_razon_social = cargadorRazonError;

    const cargadorNifError = validateCIF(formData.cargador_nif || '', true);
    if (cargadorNifError) errors.cargador_nif = cargadorNifError;

    const cargadorDomError = validateRequired(formData.cargador_domicilio, 'Domicilio del cargador');
    if (cargadorDomError) errors.cargador_domicilio = cargadorDomError;

    const transportistaRazonError = validateRequired(formData.transportista_razon_social, 'Razón social del transportista');
    if (transportistaRazonError) errors.transportista_razon_social = transportistaRazonError;

    const transportistaNifError = validateCIF(formData.transportista_nif || '', true);
    if (transportistaNifError) errors.transportista_nif = transportistaNifError;

    const matriculaError = validateRequired(formData.matricula_tractora, 'Matrícula tractora');
    if (matriculaError) errors.matricula_tractora = matriculaError;

    const origenDirError = validateRequired(formData.origen_direccion, 'Dirección de origen');
    if (origenDirError) errors.origen_direccion = origenDirError;

    const origenMunError = validateRequired(formData.origen_municipio, 'Municipio de origen');
    if (origenMunError) errors.origen_municipio = origenMunError;

    const origenProvError = validateRequired(formData.origen_provincia, 'Provincia de origen');
    if (origenProvError) errors.origen_provincia = origenProvError;

    const destinoDirError = validateRequired(formData.destino_direccion, 'Dirección de destino');
    if (destinoDirError) errors.destino_direccion = destinoDirError;

    const destinoMunError = validateRequired(formData.destino_municipio, 'Municipio de destino');
    if (destinoMunError) errors.destino_municipio = destinoMunError;

    const destinoProvError = validateRequired(formData.destino_provincia, 'Provincia de destino');
    if (destinoProvError) errors.destino_provincia = destinoProvError;

    const mercanciaError = validateRequired(formData.naturaleza_mercancia, 'Naturaleza de la mercancía');
    if (mercanciaError) errors.naturaleza_mercancia = mercanciaError;

    const pesoError = validatePositiveNumber(formData.peso_kg, 'Peso en kg');
    if (pesoError) errors.peso_kg = pesoError;

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      scrollToFirstError(errors, 'deca_create_');
      toast.error('Por favor, completa los campos obligatorios señalados en rojo.');
      return;
    }

    try {
      setIsSubmitting(true);
      setCreateSubmitError(null);
      const newDoc = await decaService.create(formData as DecaFormData);
      setCreateModalOpen(false);
      toast.success(`Documento DeCA ${newDoc.numero_deca} emitido con éxito.`);
      if (newDoc.conductor_dni) {
        fetch('/api/push/notify-deca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decaId: newDoc.id }),
        }).catch(() => undefined);
      }
      await loadDocuments();
      // Abrir automáticamente el modal de QR e inspección para verificar y descargar el PDF
      await handleOpenQrModal(newDoc);
    } catch (err: any) {
      const errorMsg = err?.message || 'Error inesperado al emitir el documento DeCA.';
      setCreateSubmitError(errorMsg);
      toast.error(`Error al crear DeCA: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionModalDoc) return;

    const errors: Record<string, string> = {};
    const motivoError = validateRequired(motivoVersion, 'Motivo de la modificación');
    if (motivoError) errors.motivo = motivoError;

    const matriculaError = validateRequired(formData.matricula_tractora, 'Matrícula tractora');
    if (matriculaError) errors.matricula_tractora = matriculaError;

    const pesoError = validatePositiveNumber(formData.peso_kg, 'Peso declarado');
    if (pesoError) errors.peso_kg = pesoError;

    if (Object.keys(errors).length > 0) {
      setVersionErrors(errors);
      scrollToFirstError(errors, 'deca_version_');
      toast.error('Por favor, completa los campos obligatorios señalados en rojo.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await decaService.createNewVersion(versionModalDoc, formData, motivoVersion);
      setVersionModalDoc(null);
      setMotivoVersion('');
      setVersionErrors({});
      toast.success(`Nueva versión v${updated.version} de ${updated.numero_deca} emitida.`);
      if (updated.conductor_dni) {
        fetch('/api/push/notify-deca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decaId: updated.id }),
        }).catch(() => undefined);
      }
      await loadDocuments();
      await handleOpenQrModal(updated);
    } catch (err: any) {
      toast.error(`Error al generar nueva versión: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openVersionModal = (doc: DecaDocument) => {
    setVersionModalDoc(doc);
    setFormData({ ...doc });
    setMotivoVersion('');
    setVersionErrors({});
  };

  // Filtrado por estado (el buscador de texto lo gestiona DataTable)
  const filteredDocs = useMemo(
    () => documents.filter((doc) => statusFilter === 'all' || doc.estado === statusFilter),
    [documents, statusFilter]
  );

  const isLatestInFamily = (doc: DecaDocument) => {
    const baseNum = (doc.numero_deca || '').replace(/-v\d+$/, '').trim();
    return !documents.some(
      (d) =>
        (d.numero_deca || '').replace(/-v\d+$/, '').trim() === baseNum &&
        (d.version > doc.version || (d.version === doc.version && d.id > doc.id))
    );
  };

  const decaColumns = useMemo<ColumnDef<DecaDocument>[]>(
    () => [
      {
        id: 'numero_deca',
        header: 'Nº DeCA',
        accessorKey: 'numero_deca',
        sortable: true,
        cell: ({ row: doc }) => (
          <div>
            <div
              className="font-mono font-bold text-slate-900 dark:text-white truncate max-w-[140px]"
              title={doc.numero_deca}
            >
              {doc.numero_deca}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10.5px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 px-1.5 py-0.5 rounded">
                v{doc.version}
              </span>
              {!doc.is_vigente && (
                <span className="text-[10px] text-slate-400 uppercase tracking-tight">Histórica</span>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'fecha_transporte',
        header: 'Fecha',
        accessorKey: 'fecha_transporte',
        sortable: true,
        className: 'whitespace-nowrap',
        cell: ({ row: doc }) => (
          <div>
            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {new Date(doc.fecha_transporte).toLocaleDateString('es-ES')}
            </div>
            {doc.hora_salida && <div className="text-slate-400 text-[11px]">{doc.hora_salida}</div>}
          </div>
        ),
      },
      {
        id: 'matricula',
        header: 'Matrícula',
        accessorFn: (row) => `${row.matricula_tractora || ''} ${row.matricula_remolque || ''} ${row.conductor_nombre || ''}`,
        sortable: true,
        cell: ({ row: doc }) => (
          <div>
            <div className="font-mono font-semibold text-slate-900 dark:text-white">{doc.matricula_tractora}</div>
            {doc.matricula_remolque && (
              <div className="text-[10.5px] font-mono text-slate-400">R: {doc.matricula_remolque}</div>
            )}
            <div className="text-[11px] text-slate-500 truncate max-w-[110px]" title={doc.conductor_nombre || 'No asignado'}>
              {doc.conductor_nombre || 'No asignado'}
            </div>
          </div>
        ),
      },
      {
        id: 'cargador',
        header: 'Cargador',
        accessorFn: (row) => `${row.cargador_razon_social || ''} ${row.cargador_nif || ''}`,
        sortable: true,
        cell: ({ row: doc }) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-white truncate max-w-[140px]" title={doc.cargador_razon_social}>
              {doc.cargador_razon_social}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{doc.cargador_nif}</div>
          </div>
        ),
      },
      {
        id: 'transportista',
        header: 'Transportista',
        accessorFn: (row) => `${row.transportista_razon_social || ''} ${row.transportista_nif || ''}`,
        sortable: true,
        cell: ({ row: doc }) => (
          <div>
            <div className="text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={doc.transportista_razon_social}>
              {doc.transportista_razon_social}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{doc.transportista_nif}</div>
          </div>
        ),
      },
      {
        id: 'mercancia',
        header: 'Mercancía / DI',
        accessorFn: (row) => `${row.naturaleza_mercancia || ''} ${row.codigo_ler || ''} ${row.numero_di || ''}`,
        cell: ({ row: doc }) => (
          <div>
            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate max-w-[140px]" title={doc.naturaleza_mercancia}>
              {doc.naturaleza_mercancia}
            </div>
            <div className="text-[11px] text-slate-400">
              {doc.peso_kg ? `${doc.peso_kg.toLocaleString('es-ES')} kg` : doc.magnitud_alternativa}
            </div>
            {doc.numero_di && (
              <span className="block truncate max-w-[140px] text-[10px] text-emerald-600 dark:text-emerald-400 font-mono" title={`DI: ${doc.numero_di}`}>
                DI: {doc.numero_di}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'estado',
        header: 'Estado',
        accessorKey: 'estado',
        sortable: true,
        className: 'whitespace-nowrap',
        cell: ({ row: doc }) => {
          const statusBadge = !isLatestInFamily(doc) || doc.is_vigente === false || doc.estado === 'sustituido'
            ? <Badge variant="light" color="light" size="sm">Sustituida</Badge>
            : doc.estado === 'vigente'
            ? <Badge variant="light" color="success" size="sm">Vigente</Badge>
            : doc.estado === 'finalizado'
            ? <Badge variant="light" color="light" size="sm">Finalizado</Badge>
            : <Badge variant="light" color="warning" size="sm">{doc.estado}</Badge>;

          return (
            <div className="space-y-1">
              {statusBadge}
              {(premiumEval.active && (doc.firma_conductor_url || doc.ticket_bascula_url || doc.incidencia_movil)) && (
                <div className="flex flex-wrap gap-1">
                  {doc.firma_conductor_url && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                      Firmado
                    </span>
                  )}
                  {doc.ticket_bascula_url && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-medium">
                      Ticket
                    </span>
                  )}
                  {doc.incidencia_movil && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                      Incidencia
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'acciones',
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right whitespace-nowrap',
        cell: ({ row: doc }) => {
          const canModifyOrFinalize =
            isLatestInFamily(doc) &&
            doc.is_vigente !== false &&
            doc.estado !== 'finalizado' &&
            doc.estado !== 'sustituido' &&
            doc.estado !== 'anulado';

          return (
            <div className="inline-flex items-center justify-end gap-1">
              <DataTableActionButton
                action="qr"
                iconOnly
                title="Ver QR y Enlaces Oficiales"
                onClick={() => handleOpenQrModal(doc)}
              />
              <DataTableActionButton
                action="download"
                iconOnly
                title="Descargar PDF DeCA Oficial"
                onClick={() => window.open(`/api/deca/${doc.token}`, '_blank', 'noopener,noreferrer')}
              />
              {canModifyOrFinalize && (
                <DataTableActionButton
                  action="version"
                  iconOnly
                  title="Modificar (Crear Nueva Versión)"
                  onClick={() => openVersionModal(doc)}
                />
              )}
              {canModifyOrFinalize && doc.estado === 'vigente' && (
                <DataTableActionButton
                  action="activate"
                  iconOnly
                  title="Finalizar Servicio de Transporte"
                  onClick={() => handleFinalize(doc.id)}
                />
              )}
              {premiumEval.active && canModifyOrFinalize && doc.conductor_dni && (
                <button
                  type="button"
                  title="Enviar notificación Push al conductor"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/push/notify-deca', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ decaId: doc.id, force: true }),
                      });
                      const json = await res.json();
                      if (res.ok && json.sent > 0) {
                        toast.success(`Notificación enviada (${json.sent} dispositivo/s).`);
                      } else {
                        toast.info('El conductor aún no tiene avisos Push activos en su PWA.');
                      }
                    } catch {
                      toast.error('No se pudo enviar la notificación Push.');
                    }
                  }}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  Avisar
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [documents]
  );

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (loading && documents.length === 0) {
    return <PageSkeleton variant="table-with-stats" label="Cargando documentos DeCA" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documento Electrónico de Control (DeCA)"
        breadcrumbTitle="Documentos de Control (DeCA)"
        badge={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="light" color="info">
              Transporte por Carretera
            </Badge>
            {isTransportista && (
              <PremiumStatusTag company={activeCompany} feature="transporte_pwa_evidencias" />
            )}
          </div>
        }
        description="Emisión, versionado inmutable, código QR y enlace directo para inspección en carretera (Orden FOM/2861/2012 y Ley 9/2025)."
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadDocuments()}
              title="Refrescar lista"
              aria-label="Refrescar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              startIcon={<Plus className="w-4 h-4" />}
              onClick={openCreateModal}
            >
              Nuevo DeCA Autónomo
            </Button>
          </>
        }
      />

      {/* Tarjetas de Métricas Rápidas */}
      {(() => {
        const { activeDecas, finishedDecas, allLatest } = decaService.filterVigenteServices(documents);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[10px] p-4 flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{allLatest.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total DeCAs Emitidos</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[10px] p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {activeDecas.length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Servicios Vigentes / En Ruta</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[10px] p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {finishedDecas.length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Servicios Finalizados</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[10px] p-4 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {allLatest.filter((d) => Boolean(d.identification_document_id)).length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Vinculados a DIs de Residuos</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabla de Documentos DeCA */}
      <DataTable
        data={filteredDocs}
        columns={decaColumns}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Buscar por Nº DeCA, matrícula, cargador, transportista o LER..."
        syncUrlParams
        toolbarActions={
          <select
            aria-label="Estado DeCA"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs px-3 rounded-md border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          >
            <option value="all">Todos los estados</option>
            <option value="vigente">Vigentes</option>
            <option value="finalizado">Finalizados</option>
            <option value="borrador">Borradores</option>
          </select>
        }
        emptyState={
          <div className="text-center py-10 text-slate-400">
            <Truck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No se encontraron documentos DeCA con los filtros seleccionados.
            </p>
          </div>
        }
      />

      {/* MODAL: Visualización de QR y Enlaces de Inspección / Móvil Conductor */}
      <Modal
        isOpen={Boolean(qrModalDoc)}
        onClose={() => setQrModalDoc(null)}
        className="max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5"
      >
        {qrModalDoc && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">QR e Inspección Oficial</h3>
                  <p className="text-xs text-slate-500 font-mono">{qrModalDoc.numero_deca} (v{qrModalDoc.version})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrModalDoc(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Central */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR DeCA"
                  className="w-56 h-56 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white p-2"
                />
              )}
              <span className="text-[11px] text-slate-500 mt-2">
                Escaneo directo para agentes: descarga el PDF oficial sin login.
              </span>
            </div>

            {/* Compartir rápido con el conductor (WhatsApp, Email, Nativo, Copiar mensaje) */}
            {(() => {
              const qrDriver = fleetDrivers.find(
                (d) =>
                  qrModalDoc.conductor_nombre &&
                  d.nombre.trim().toLowerCase() === qrModalDoc.conductor_nombre.trim().toLowerCase()
              );
              const waUrl = buildDecaWhatsAppUrl(qrModalDoc, originUrl, qrDriver?.telefono);
              const mailtoUrl = buildDecaMailtoUrl(qrModalDoc, originUrl, qrDriver?.email);
              const fullMessage = buildDecaShareMessage(qrModalDoc, originUrl);
              const canNativeShare =
                typeof navigator !== 'undefined' && typeof navigator.share === 'function';

              const handleNativeShare = async () => {
                try {
                  await navigator.share({
                    title: `DeCA ${qrModalDoc.numero_deca} (v${qrModalDoc.version})`,
                    text: fullMessage,
                    url: `${originUrl}/mobile/deca/${qrModalDoc.token}`,
                  });
                } catch {
                  // Usuario canceló la hoja nativa
                }
              };

              return (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      Compartir rápido con el conductor
                    </span>
                    {qrDriver?.telefono && (
                      <span className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300">
                        {qrDriver.telefono}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                    <a
                      href={mailtoUrl}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(fullMessage, 'message')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                    >
                      {copiedLink === 'message' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copiar mensaje
                    </button>
                    {canNativeShare && (
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Más apps...
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Enlaces de Acción */}
            <div className="space-y-2.5">
              <div>
                <Label htmlFor="deca_qr_inspection_link">Enlace para la Inspección en Carretera (Descarga Directa)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="deca_qr_inspection_link"
                    type="text"
                    readOnly
                    value={`${originUrl}/api/deca/${qrModalDoc.token}`}
                    className="flex-1 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(`${originUrl}/api/deca/${qrModalDoc.token}`, 'inspection')}
                    className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl transition text-slate-700 dark:text-slate-200 shrink-0"
                    title="Copiar enlace"
                  >
                    {copiedLink === 'inspection' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="deca_qr_driver_link">Enlace Móvil para el Conductor</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="deca_qr_driver_link"
                    type="text"
                    readOnly
                    value={`${originUrl}/mobile/deca/${qrModalDoc.token}`}
                    className="flex-1 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(`${originUrl}/mobile/deca/${qrModalDoc.token}`, 'driver')}
                    className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl transition text-slate-700 dark:text-slate-200 shrink-0"
                    title="Copiar enlace"
                  >
                    {copiedLink === 'driver' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/mobile/deca/${qrModalDoc.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shrink-0"
                    title="Abrir vista móvil"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {premiumEval.active &&
              (qrModalDoc.firma_conductor_url ||
                qrModalDoc.ticket_bascula_url ||
                qrModalDoc.incidencia_movil) && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Evidencias del Conductor (Móvil)
                </div>

                {qrModalDoc.firma_conductor_url && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Firma del Conductor
                      </span>
                      {qrModalDoc.fecha_firma_conductor && (
                        <span>
                          {new Date(qrModalDoc.fecha_firma_conductor).toLocaleString('es-ES')}
                        </span>
                      )}
                    </div>
                    <img
                      src={qrModalDoc.firma_conductor_url}
                      alt="Firma del conductor"
                      className="h-20 bg-white rounded-xl border border-slate-200 p-1 object-contain"
                    />
                  </div>
                )}

                {qrModalDoc.ticket_bascula_url && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        Ticket de Báscula / Albarán
                      </span>
                      <a
                        href={qrModalDoc.ticket_bascula_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Abrir imagen →
                      </a>
                    </div>
                    <img
                      src={qrModalDoc.ticket_bascula_url}
                      alt="Ticket de báscula"
                      className="max-h-36 w-full rounded-xl border border-slate-200 object-contain bg-white"
                    />
                  </div>
                )}

                {qrModalDoc.incidencia_movil && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                    <strong>Nota / Incidencia:</strong> {qrModalDoc.incidencia_movil}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <a
                href={`/api/deca/${qrModalDoc.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition"
              >
                <Download className="w-4 h-4" />
                Descargar PDF Oficial Ahora
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Crear DeCA Autónomo */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        {createModalOpen && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Emitir DeCA Autónomo</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} noValidate className="space-y-4">
              {createSubmitError && (
                <div role="alert" className="p-3 bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 rounded-xl text-xs text-error-700 dark:text-error-300 font-medium">
                  <strong>No se pudo emitir el DeCA:</strong> {createSubmitError}
                </div>
              )}

              {Object.keys(createErrors).length > 0 && (
                <div className="p-3 bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 rounded-xl text-xs text-error-700 dark:text-error-300">
                  Por favor, completa los campos requeridos señalados en rojo antes de emitir el DeCA.
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                <strong>Requisito legal:</strong> El documento debe emitirse y ponerse a disposición del transportista
                antes de iniciar el servicio en carretera.
              </div>

              {isTransportista && availableDIs.length > 0 && (
                <div className="border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/20 p-3 rounded-xl">
                  <Label htmlFor="deca_import_di">Importar datos desde un DI existente (Opcional)</Label>
                  <select
                    id="deca_import_di"
                    defaultValue=""
                    onChange={(e) => {
                      const di = availableDIs.find((item) => String(item.id) === e.target.value);
                      if (!di) return;
                      const pesoKg = di.unidad === 'toneladas' ? di.cantidad * 1000 : di.cantidad;
                      setFormData((prev) => ({
                        ...prev,
                        identification_document_id: di.id,
                        numero_di: di.numero_documento,
                        cargador_razon_social: di.productor_razon_social || prev.cargador_razon_social,
                        cargador_nif: di.productor_cif || prev.cargador_nif,
                        cargador_domicilio: di.productor_direccion || prev.cargador_domicilio,
                        cargador_municipio: di.productor_municipio || prev.cargador_municipio,
                        cargador_provincia: di.productor_provincia || prev.cargador_provincia,
                        transportista_razon_social: di.transportista_razon_social || prev.transportista_razon_social,
                        transportista_nif: di.transportista_cif || prev.transportista_nif,
                        matricula_tractora: di.transportista_matricula || prev.matricula_tractora,
                        origen_direccion: di.productor_direccion || prev.origen_direccion,
                        origen_municipio: di.productor_municipio || prev.origen_municipio,
                        origen_provincia: di.productor_provincia || prev.origen_provincia,
                        destino_direccion: di.gestor_direccion || prev.destino_direccion,
                        destino_municipio: di.gestor_municipio || prev.destino_municipio,
                        destino_provincia: di.gestor_provincia || prev.destino_provincia,
                        naturaleza_mercancia: `${di.descripcion_residuo || 'Residuo'} (LER ${di.codigo_ler})`,
                        codigo_ler: di.codigo_ler,
                        peso_kg: pesoKg,
                        es_residuo_peligroso: di.peligrosidad === 'peligroso' || di.codigo_ler?.includes('*'),
                        fecha_transporte: di.fecha_recogida || di.fecha_documento || prev.fecha_transporte,
                      }));
                      toast.success(`Datos importados desde el DI ${di.numero_documento}`);
                    }}
                    className="mt-1 w-full rounded-lg border border-brand-300 dark:border-brand-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs"
                  >
                    <option value="">-- Seleccionar DI para autorrellenar --</option>
                    {availableDIs.slice(0, 30).map((di) => (
                      <option key={di.id} value={String(di.id)}>
                        {di.numero_documento} · {di.productor_razon_social} → {di.gestor_razon_social} ({di.codigo_ler})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cargador Contractual (UXDEV-11 / UX-11: Selector de cliente y autocompletado rápido) */}
              <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    1. Cargador Contractual (Quien contrata el porte)
                  </h4>
                  {availableCompanies.length > 0 && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      Precarga con un clic
                    </span>
                  )}
                </div>

                {/* Selector rápido de Cliente / Cargador Habitual */}
                {availableCompanies.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Label htmlFor="deca_selector_cliente">Seleccionar Cliente / Cargador Habitual (Autorrellenado)</Label>
                    <select
                      id="deca_selector_cliente"
                      className="mt-1 w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        const comp = availableCompanies.find((c) => c.id === selectedId);
                        if (comp) {
                          setFormData((prev) => ({
                            ...prev,
                            cargador_razon_social: comp.razon_social || comp.nombre_comercial || '',
                            cargador_nif: comp.cif || '',
                            cargador_domicilio: comp.domicilio_social || comp.domicilio_instalacion || '',
                            cargador_municipio: comp.municipio_social || comp.municipio_instalacion || '',
                            cargador_provincia: comp.provincia_social || comp.provincia_instalacion || '',
                            cargador_codigo_postal: comp.codigo_postal_social || comp.codigo_postal_instalacion || '',
                            origen_direccion: prev.origen_direccion || comp.domicilio_instalacion || comp.domicilio_social || '',
                            origen_municipio: prev.origen_municipio || comp.municipio_instalacion || comp.municipio_social || '',
                            origen_provincia: prev.origen_provincia || comp.provincia_instalacion || comp.provincia_social || '',
                          }));
                          clearCreateError('cargador_razon_social');
                          clearCreateError('cargador_nif');
                          clearCreateError('cargador_domicilio');
                          clearCreateError('origen_direccion');
                          clearCreateError('origen_municipio');
                          clearCreateError('origen_provincia');
                        }
                      }}
                    >
                      <option value="">-- Elige un cliente para precargar automáticamente --</option>
                      {availableCompanies
                        .filter((c) => c.cif?.toUpperCase() !== activeCompany?.cif?.toUpperCase())
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.razon_social || c.nombre_comercial} ({c.cif})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="deca_create_cargador_razon_social" required>Razón Social</Label>
                    <Input
                      id="deca_create_cargador_razon_social"
                      type="text"
                      value={formData.cargador_razon_social || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, cargador_razon_social: e.target.value });
                        clearCreateError('cargador_razon_social');
                      }}
                      error={Boolean(createErrors.cargador_razon_social)}
                      hint={createErrors.cargador_razon_social}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deca_create_cargador_nif" required>NIF / CIF</Label>
                    <Input
                      id="deca_create_cargador_nif"
                      type="text"
                      value={formData.cargador_nif || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, cargador_nif: e.target.value.toUpperCase() });
                        clearCreateError('cargador_nif');
                      }}
                      error={Boolean(createErrors.cargador_nif)}
                      hint={createErrors.cargador_nif}
                      className="font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="deca_create_cargador_domicilio" required>Domicilio</Label>
                    <Input
                      id="deca_create_cargador_domicilio"
                      type="text"
                      value={formData.cargador_domicilio || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, cargador_domicilio: e.target.value });
                        clearCreateError('cargador_domicilio');
                      }}
                      error={Boolean(createErrors.cargador_domicilio)}
                      hint={createErrors.cargador_domicilio}
                    />
                  </div>
                </div>
              </div>

              {/* Datalists para medios y conductores de la flota */}
              <datalist id="deca_vehiculos_datalist">
                {fleetVehicles.map((v) => (
                  <option key={`fv-${v.id}`} value={v.matricula}>
                    {v.matricula} ({v.tipo}){v.remolque_habitual ? ` · R: ${v.remolque_habitual}` : ''}
                  </option>
                ))}
                {availableCarriers.flatMap((c) => c.flota_vehiculos || []).map((v, i) => (
                  <option key={`v-${v.matricula}-${i}`} value={v.matricula}>
                    {v.matricula} {v.tipo ? `(${v.tipo})` : ''}
                  </option>
                ))}
              </datalist>
              <datalist id="deca_conductores_datalist">
                {fleetDrivers.map((d) => (
                  <option key={`fd-${d.id}`} value={d.nombre}>
                    {d.nombre} {d.dni ? `(${d.dni})` : ''} {d.vehiculo_asignado ? `· ${d.vehiculo_asignado}` : ''}
                  </option>
                ))}
                {availableCarriers.flatMap((c) => c.flota_conductores || []).map((d, i) => (
                  <option key={`d-${d.nombre}-${i}`} value={d.nombre}>
                    {d.nombre} {d.dni ? `(${d.dni})` : ''}
                  </option>
                ))}
              </datalist>

              {/* Transportista Efectivo */}
              <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    2. Transportista Efectivo y Vehículo
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Datos propios precargados
                  </span>
                </div>

                {(fleetDrivers.length > 0 || fleetVehicles.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60">
                    {fleetDrivers.length > 0 && (
                      <div>
                        <label htmlFor="deca_quick_driver" className="block text-[11px] font-semibold text-sky-900 dark:text-sky-200 mb-1">
                          Recuperar Conductor de Mi Flota
                        </label>
                        <select
                          id="deca_quick_driver"
                          value={matchedFleetDriver ? String(matchedFleetDriver.id) : ''}
                          onChange={(e) => handleSelectFleetDriver(e.target.value)}
                          className="w-full text-xs rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 px-2.5 py-2 text-slate-800 dark:text-slate-200"
                        >
                          <option value="">-- Seleccionar conductor --</option>
                          {fleetDrivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre}{d.vehiculo_asignado ? ` (${d.vehiculo_asignado})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {fleetVehicles.length > 0 && (
                      <div>
                        <label htmlFor="deca_quick_vehicle" className="block text-[11px] font-semibold text-sky-900 dark:text-sky-200 mb-1">
                          Recuperar Vehículo de Mi Flota
                        </label>
                        <select
                          id="deca_quick_vehicle"
                          value={matchedFleetVehicle ? String(matchedFleetVehicle.id) : ''}
                          onChange={(e) => handleSelectFleetVehicle(e.target.value)}
                          className="w-full text-xs rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 px-2.5 py-2 text-slate-800 dark:text-slate-200"
                        >
                          <option value="">-- Seleccionar vehículo --</option>
                          {fleetVehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.matricula} ({v.tipo}){v.remolque_habitual ? ` · R: ${v.remolque_habitual}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {activeFleetComplianceAlerts.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Aviso de documentación de flota:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      {activeFleetComplianceAlerts.map((a, idx) => (
                        <li key={idx} className={a.status === 'caducado' ? 'text-red-700 dark:text-red-300 font-semibold' : ''}>
                          {a.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="deca_create_transportista_razon_social" required>Transportista</Label>
                    <Input
                      id="deca_create_transportista_razon_social"
                      type="text"
                      value={formData.transportista_razon_social || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, transportista_razon_social: e.target.value });
                        clearCreateError('transportista_razon_social');
                      }}
                      error={Boolean(createErrors.transportista_razon_social)}
                      hint={createErrors.transportista_razon_social}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deca_create_transportista_nif" required>NIF Transportista</Label>
                    <Input
                      id="deca_create_transportista_nif"
                      type="text"
                      value={formData.transportista_nif || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, transportista_nif: e.target.value.toUpperCase() });
                        clearCreateError('transportista_nif');
                      }}
                      error={Boolean(createErrors.transportista_nif)}
                      hint={createErrors.transportista_nif}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deca_create_transportista_autorizacion">Nº Autorización</Label>
                    <Input
                      id="deca_create_transportista_autorizacion"
                      type="text"
                      value={formData.transportista_autorizacion || ''}
                      onChange={(e) => setFormData({ ...formData, transportista_autorizacion: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="deca_create_matricula_tractora" required>Matrícula Tractora</Label>
                    <Input
                      id="deca_create_matricula_tractora"
                      type="text"
                      placeholder="1234-BBB"
                      list="deca_vehiculos_datalist"
                      value={formData.matricula_tractora || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, matricula_tractora: e.target.value.toUpperCase() });
                        clearCreateError('matricula_tractora');
                      }}
                      error={Boolean(createErrors.matricula_tractora)}
                      hint={createErrors.matricula_tractora}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deca_create_matricula_remolque">Matrícula Remolque</Label>
                    <Input
                      id="deca_create_matricula_remolque"
                      type="text"
                      placeholder="R-1234-BBB"
                      value={formData.matricula_remolque || ''}
                      onChange={(e) => setFormData({ ...formData, matricula_remolque: e.target.value.toUpperCase() })}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deca_create_conductor_nombre">Nombre Conductor</Label>
                    <Input
                      id="deca_create_conductor_nombre"
                      type="text"
                      list="deca_conductores_datalist"
                      value={formData.conductor_nombre || ''}
                      onChange={(e) => setFormData({ ...formData, conductor_nombre: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Origen y Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Origen (Carga) *</h4>
                  <div>
                    <Label htmlFor="deca_create_origen_direccion" required>Dirección</Label>
                    <Input
                      id="deca_create_origen_direccion"
                      type="text"
                      placeholder="Dirección completa"
                      value={formData.origen_direccion || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, origen_direccion: e.target.value });
                        clearCreateError('origen_direccion');
                      }}
                      error={Boolean(createErrors.origen_direccion)}
                      hint={createErrors.origen_direccion}
                    />
                  </div>
                  <div className="pt-1">
                    <ProvinceMunicipalityFields
                      provinciaRequired
                      municipioRequired
                      provinciaId="deca_create_origen_provincia"
                      municipioId="deca_create_origen_municipio"
                      provinciaName="origen_provincia"
                      municipioName="origen_municipio"
                      provinciaError={Boolean(createErrors.origen_provincia)}
                      municipioError={Boolean(createErrors.origen_municipio)}
                      provinciaHint={createErrors.origen_provincia}
                      municipioHint={createErrors.origen_municipio}
                      provincia={formData.origen_provincia || ''}
                      municipio={formData.origen_municipio || ''}
                      wrapperClassName="grid grid-cols-2 gap-2"
                      onChange={({ provincia, municipio }) => {
                        setFormData({
                          ...formData,
                          origen_provincia: provincia,
                          origen_municipio: municipio,
                        });
                        clearCreateError('origen_provincia');
                        clearCreateError('origen_municipio');
                      }}
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Destino (Entrega) *</h4>
                  <div>
                    <Label htmlFor="deca_create_destino_direccion" required>Dirección</Label>
                    <Input
                      id="deca_create_destino_direccion"
                      type="text"
                      placeholder="Dirección completa"
                      value={formData.destino_direccion || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, destino_direccion: e.target.value });
                        clearCreateError('destino_direccion');
                      }}
                      error={Boolean(createErrors.destino_direccion)}
                      hint={createErrors.destino_direccion}
                    />
                  </div>
                  <div className="pt-1">
                    <ProvinceMunicipalityFields
                      provinciaRequired
                      municipioRequired
                      provinciaId="deca_create_destino_provincia"
                      municipioId="deca_create_destino_municipio"
                      provinciaName="destino_provincia"
                      municipioName="destino_municipio"
                      provinciaError={Boolean(createErrors.destino_provincia)}
                      municipioError={Boolean(createErrors.destino_municipio)}
                      provinciaHint={createErrors.destino_provincia}
                      municipioHint={createErrors.destino_municipio}
                      provincia={formData.destino_provincia || ''}
                      municipio={formData.destino_municipio || ''}
                      wrapperClassName="grid grid-cols-2 gap-2"
                      onChange={({ provincia, municipio }) => {
                        setFormData({
                          ...formData,
                          destino_provincia: provincia,
                          destino_municipio: municipio,
                        });
                        clearCreateError('destino_provincia');
                        clearCreateError('destino_municipio');
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Mercancía y Peso */}
              <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  3. Mercancía y Cantidad
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Label htmlFor="deca_create_naturaleza_mercancia" required>Naturaleza de la Mercancía</Label>
                    <Input
                      id="deca_create_naturaleza_mercancia"
                      type="text"
                      placeholder="Ej. Chatarra férrica cizallada / Baterías plomo"
                      value={formData.naturaleza_mercancia || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, naturaleza_mercancia: e.target.value });
                        clearCreateError('naturaleza_mercancia');
                      }}
                      error={Boolean(createErrors.naturaleza_mercancia)}
                      hint={createErrors.naturaleza_mercancia}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deca_create_peso_kg" required>Peso (kg)</Label>
                    <Input
                      id="deca_create_peso_kg"
                      type="number"
                      value={formData.peso_kg || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, peso_kg: parseFloat(e.target.value) || 0 });
                        clearCreateError('peso_kg');
                      }}
                      error={Boolean(createErrors.peso_kg)}
                      hint={createErrors.peso_kg}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Emitiendo...' : 'Emitir y Generar QR'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* MODAL: Crear Nueva Versión Inmutable */}
      <Modal
        isOpen={Boolean(versionModalDoc)}
        onClose={() => setVersionModalDoc(null)}
        className="max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        {versionModalDoc && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Crear Nueva Versión del DeCA</h3>
                <p className="text-xs text-slate-500">
                  Emitirá la versión v{versionModalDoc.version + 1} con nuevo token, preservando la trazabilidad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVersionModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVersionSubmit} noValidate className="space-y-3">
              {Object.keys(versionErrors).length > 0 && (
                <div className="p-3 bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 rounded-xl text-xs text-error-700 dark:text-error-300">
                  Por favor, completa los campos requeridos señalados en rojo antes de guardar la versión.
                </div>
              )}

              <div>
                <Label htmlFor="deca_version_motivo" required>Motivo obligatorio de la modificación (Auditoría)</Label>
                <TextArea
                  id="deca_version_motivo"
                  rows={2}
                  placeholder="Ej. Cambio de tractora por avería mecánica en ruta / Ajuste de peso en báscula"
                  value={motivoVersion}
                  onChange={(val) => {
                    setMotivoVersion(val);
                    clearVersionError('motivo');
                  }}
                  error={Boolean(versionErrors.motivo)}
                  hint={versionErrors.motivo}
                />
              </div>

              {(fleetDrivers.length > 0 || fleetVehicles.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60">
                  {fleetDrivers.length > 0 && (
                    <div>
                      <label htmlFor="deca_version_quick_driver" className="block text-[11px] font-semibold text-sky-900 dark:text-sky-200 mb-1">
                        Cambiar Conductor (Mi Flota)
                      </label>
                      <select
                        id="deca_version_quick_driver"
                        value={matchedFleetDriver ? String(matchedFleetDriver.id) : ''}
                        onChange={(e) => handleSelectFleetDriver(e.target.value)}
                        className="w-full text-xs rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 px-2.5 py-2 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">-- Seleccionar conductor --</option>
                        {fleetDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.nombre}{d.vehiculo_asignado ? ` (${d.vehiculo_asignado})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {fleetVehicles.length > 0 && (
                    <div>
                      <label htmlFor="deca_version_quick_vehicle" className="block text-[11px] font-semibold text-sky-900 dark:text-sky-200 mb-1">
                        Cambiar Vehículo (Mi Flota)
                      </label>
                      <select
                        id="deca_version_quick_vehicle"
                        value={matchedFleetVehicle ? String(matchedFleetVehicle.id) : ''}
                        onChange={(e) => handleSelectFleetVehicle(e.target.value)}
                        className="w-full text-xs rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 px-2.5 py-2 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">-- Seleccionar vehículo --</option>
                        {fleetVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.matricula} ({v.tipo})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {activeFleetComplianceAlerts.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Aviso de documentación de flota:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {activeFleetComplianceAlerts.map((a, idx) => (
                      <li key={idx} className={a.status === 'caducado' ? 'text-red-700 dark:text-red-300 font-semibold' : ''}>
                        {a.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="deca_version_matricula_tractora" required>Matrícula Tractora</Label>
                  <Input
                    id="deca_version_matricula_tractora"
                    type="text"
                    value={formData.matricula_tractora || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, matricula_tractora: e.target.value.toUpperCase() });
                      clearVersionError('matricula_tractora');
                    }}
                    error={Boolean(versionErrors.matricula_tractora)}
                    hint={versionErrors.matricula_tractora}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="deca_version_matricula_remolque">Matrícula Remolque</Label>
                  <Input
                    id="deca_version_matricula_remolque"
                    type="text"
                    value={formData.matricula_remolque || ''}
                    onChange={(e) => setFormData({ ...formData, matricula_remolque: e.target.value.toUpperCase() })}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="deca_version_conductor_nombre">Nombre Conductor</Label>
                  <Input
                    id="deca_version_conductor_nombre"
                    type="text"
                    value={formData.conductor_nombre || ''}
                    onChange={(e) => setFormData({ ...formData, conductor_nombre: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="deca_version_peso_kg" required>Peso Declarado (kg)</Label>
                  <Input
                    id="deca_version_peso_kg"
                    type="number"
                    value={formData.peso_kg || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, peso_kg: parseFloat(e.target.value) || 0 });
                      clearVersionError('peso_kg');
                    }}
                    error={Boolean(versionErrors.peso_kg)}
                    hint={versionErrors.peso_kg}
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deca_version_observaciones">Observaciones / Reservas</Label>
                <TextArea
                  id="deca_version_observaciones"
                  rows={2}
                  value={formData.observaciones_reservas || ''}
                  onChange={(val) => setFormData({ ...formData, observaciones_reservas: val })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVersionModalDoc(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando versión...' : `Guardar Versión v${versionModalDoc.version + 1}`}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={docToFinalize !== null}
        onClose={() => setDocToFinalize(null)}
        onConfirm={confirmFinalize}
        variant="warning"
        title="Finalizar servicio de transporte"
        confirmLabel="Finalizar servicio"
        message="¿Deseas finalizar este servicio de transporte? Se registrará la fecha y hora de cierre y comenzará el plazo legal de 7 días naturales para el acceso público de inspección."
      />
    </div>
  );
}
