'use client';

// ==============================================================================
// RESIGEST 360 - GESTIÓN DE DOCUMENTOS ELECTRÓNICOS DE CONTROL ADMINISTRATIVO (DeCA)
// Normativa: Ley 9/2025, Orden FOM/2861/2012 y Resolución de 5 de junio de 2026.
// ==============================================================================

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { decaService } from '@/services/decaService';
import type { DecaDocument, DecaFormData } from '@/types/deca';
import { toast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/modal';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
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
  Search,
  RefreshCw,
  ExternalLink,
  History,
  FileText,
  Copy,
  Check,
  Calendar,
  X
} from 'lucide-react';

export default function DecaManagementPage() {
  const [documents, setDocuments] = useState<DecaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modales
  const [qrModalDoc, setQrModalDoc] = useState<DecaDocument | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [versionModalDoc, setVersionModalDoc] = useState<DecaDocument | null>(null);
  const [versionErrors, setVersionErrors] = useState<Record<string, string>>({});
  const [motivoVersion, setMotivoVersion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const data = await decaService.getAll();
      setDocuments(data);
    } catch (err: any) {
      console.error('Error al cargar documentos DeCA:', err);
      toast.error(`Error al cargar documentos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

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

  const handleFinalize = async (id: number) => {
    if (confirm('¿Deseas finalizar este servicio de transporte? Se registrará la fecha y hora de cierre y comenzará el plazo legal de 7 días naturales para el acceso público de inspección.')) {
      try {
        await decaService.finalizeService(id);
        toast.success('Servicio de transporte finalizado con éxito.');
        await loadDocuments();
      } catch (err: any) {
        toast.error(`Error al finalizar servicio: ${err.message}`);
      }
    }
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setCreateErrors({});
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const newDoc = await decaService.create(formData as DecaFormData);
      setCreateModalOpen(false);
      toast.success(`Documento DeCA ${newDoc.numero_deca} emitido con éxito.`);
      await loadDocuments();
    } catch (err: any) {
      toast.error(`Error al crear DeCA: ${err.message}`);
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
      await loadDocuments();
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

  // Filtrado
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.numero_deca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.matricula_tractora.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.cargador_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.transportista_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.codigo_ler && doc.codigo_ler.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || doc.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1">
            <Truck className="w-4 h-4" />
            <span>Módulo de Transporte de Mercancías por Carretera</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Documento Electrónico de Control (DeCA)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Emisión, versionado inmutable, código QR y enlace directo para inspección en carretera según la
            <strong> Orden FOM/2861/2012</strong>, la <strong>Ley 9/2025 de Movilidad Sostenible</strong> y la
            <strong> Resolución de 5 de junio de 2026</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDocuments()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-blue-600/30 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo DeCA Autónomo
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{documents.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total DeCAs Emitidos</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {documents.filter((d) => d.estado === 'vigente' && d.is_vigente).length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Servicios Vigentes / En Ruta</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {documents.filter((d) => d.estado === 'finalizado').length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Servicios Finalizados</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {documents.filter((d) => Boolean(d.identification_document_id)).length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Vinculados a DIs de Residuos</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nº DeCA, matrícula, cargador o LER..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="vigente">Vigentes</option>
            <option value="finalizado">Finalizados</option>
            <option value="borrador">Borradores</option>
          </select>
        </div>
      </div>

      {/* Tabla de Documentos DeCA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Nº DeCA / Versión</th>
                <th className="py-3.5 px-4">Fecha Transporte</th>
                <th className="py-3.5 px-4">Matrícula / Conductor</th>
                <th className="py-3.5 px-4">Cargador Contractual</th>
                <th className="py-3.5 px-4">Transportista</th>
                <th className="py-3.5 px-4">Mercancía / DI</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2 align-middle" />
                    Cargando documentos de control...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Truck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    No se encontraron documentos DeCA con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{doc.numero_deca}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                          v{doc.version}
                        </span>
                        {!doc.is_vigente && (
                          <span className="text-[10px] text-slate-400 uppercase tracking-tight">Histórica</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(doc.fecha_transporte).toLocaleDateString('es-ES')}
                      </div>
                      {doc.hora_salida && <div className="text-slate-400 text-[11px]">{doc.hora_salida}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">
                        {doc.matricula_tractora}
                      </div>
                      {doc.matricula_remolque && (
                        <div className="text-[11px] font-mono text-slate-400">R: {doc.matricula_remolque}</div>
                      )}
                      <div className="text-xs text-slate-500 truncate max-w-[120px]">
                        {doc.conductor_nombre || 'No asignado'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">
                        {doc.cargador_razon_social}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{doc.cargador_nif}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {doc.transportista_razon_social}
                      </div>
                      <div className="text-xs text-slate-400">{doc.transportista_nif}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate max-w-[150px]">
                        {doc.naturaleza_mercancia}
                      </div>
                      <div className="text-xs text-slate-400">
                        {doc.peso_kg ? `${doc.peso_kg.toLocaleString('es-ES')} kg` : doc.magnitud_alternativa}
                      </div>
                      {doc.numero_di && (
                        <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          DI: {doc.numero_di}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          doc.estado === 'vigente'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : doc.estado === 'finalizado'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {doc.estado.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenQrModal(doc)}
                          className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
                          title="Ver QR y Enlaces Oficiales"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <a
                          href={`/api/deca/${doc.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Descargar PDF DeCA Oficial"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => openVersionModal(doc)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Modificar (Crear Nueva Versión)"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {doc.estado === 'vigente' && (
                          <button
                            onClick={() => handleFinalize(doc.id)}
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg transition"
                            title="Finalizar Servicio de Transporte"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              {Object.keys(createErrors).length > 0 && (
                <div className="p-3 bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 rounded-xl text-xs text-error-700 dark:text-error-300">
                  Por favor, completa los campos requeridos señalados en rojo antes de emitir el DeCA.
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                <strong>Requisito legal:</strong> El documento debe emitirse y ponerse a disposición del transportista
                antes de iniciar el servicio en carretera.
              </div>

              {/* Cargador Contractual */}
              <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  1. Cargador Contractual (Quien contrata el porte)
                </h4>
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

              {/* Transportista Efectivo */}
              <div className="border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  2. Transportista Efectivo y Vehículo
                </h4>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="deca_create_origen_municipio" required>Municipio</Label>
                      <Input
                        id="deca_create_origen_municipio"
                        type="text"
                        placeholder="Municipio"
                        value={formData.origen_municipio || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, origen_municipio: e.target.value });
                          clearCreateError('origen_municipio');
                        }}
                        error={Boolean(createErrors.origen_municipio)}
                        hint={createErrors.origen_municipio}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deca_create_origen_provincia" required>Provincia</Label>
                      <Input
                        id="deca_create_origen_provincia"
                        type="text"
                        placeholder="Provincia"
                        value={formData.origen_provincia || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, origen_provincia: e.target.value });
                          clearCreateError('origen_provincia');
                        }}
                        error={Boolean(createErrors.origen_provincia)}
                        hint={createErrors.origen_provincia}
                      />
                    </div>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="deca_create_destino_municipio" required>Municipio</Label>
                      <Input
                        id="deca_create_destino_municipio"
                        type="text"
                        placeholder="Municipio"
                        value={formData.destino_municipio || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, destino_municipio: e.target.value });
                          clearCreateError('destino_municipio');
                        }}
                        error={Boolean(createErrors.destino_municipio)}
                        hint={createErrors.destino_municipio}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deca_create_destino_provincia" required>Provincia</Label>
                      <Input
                        id="deca_create_destino_provincia"
                        type="text"
                        placeholder="Provincia"
                        value={formData.destino_provincia || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, destino_provincia: e.target.value });
                          clearCreateError('destino_provincia');
                        }}
                        error={Boolean(createErrors.destino_provincia)}
                        hint={createErrors.destino_provincia}
                      />
                    </div>
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
    </div>
  );
}
