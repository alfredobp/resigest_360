'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { Modal, ConfirmModal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import TextArea from '@/components/form/input/TextArea';
import { toast } from '@/context/ToastContext';
import { useTenant } from '@/context/TenantContext';
import identificationDocumentService, { getTrackingStatusMeta, normalizeOperationCode } from '@/services/identificationDocumentService';
import dashboardService from '@/services/dashboardService';
import siraService from '@/services/siraService';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import { decaService } from '@/services/decaService';
import { validateRequired, validateCIF, scrollToFirstError } from '@/lib/validations/formValidation';
import { Truck, X, AlertTriangle, FilePlus, Table as TableIcon, LayoutGrid, Copy, MoreHorizontal, Send, Trash2, Loader2 } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/ui/table';
import type { IdentificationDocument, Company, ProductionCenter } from '@/types/wasteManagement';
import type { DecaDocument } from '@/types/deca';

export default function DocumentosIdentificacionPage() {
  const router = useRouter();
  const { canWrite, perfilOperativo, isPlatformAdmin } = useTenant();
  const canCreateOrDeleteDi = canWrite && (isPlatformAdmin || perfilOperativo !== 'transportista');
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<IdentificationDocument[]>([]);
  const [hasCompany, setHasCompany] = useState(false);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCenter, setFilterCenter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [unauthorizedTreatmentReasons, setUnauthorizedTreatmentReasons] = useState<Record<number, string>>({});

  // Modal DeCA rápido
  const [decaModalDoc, setDecaModalDoc] = useState<IdentificationDocument | null>(null);
  const [existingDecaAlert, setExistingDecaAlert] = useState<{ doc: IdentificationDocument; existingDecas: DecaDocument[] } | null>(null);
  const [decaSubmitting, setDecaSubmitting] = useState(false);
  const [decaFieldErrors, setDecaFieldErrors] = useState<Record<string, string>>({});
  const [cargadorRazonSocial, setCargadorRazonSocial] = useState('');
  const [cargadorNif, setCargadorNif] = useState('');
  const [cargadorDomicilio, setCargadorDomicilio] = useState('');
  const [cargadorMunicipio, setCargadorMunicipio] = useState('');
  const [cargadorProvincia, setCargadorProvincia] = useState('');
  const [matriculaTractora, setMatriculaTractora] = useState('');
  const [matriculaRemolque, setMatriculaRemolque] = useState('');
  const [observacionesDeCA, setObservacionesDeCA] = useState('');
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [docToSendSira, setDocToSendSira] = useState<number | null>(null);
  const [sendingSiraId, setSendingSiraId] = useState<number | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    doc: IdentificationDocument;
    top: number;
    right: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const statusParam = new URLSearchParams(window.location.search).get('status');
      if (statusParam) {
        setFilterStatus(statusParam);
      }
    }
  }, []);

  const handleFilterStatusChange = (status: string) => {
    setFilterStatus(status);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (status === 'all') params.delete('status');
      else params.set('status', status);
      const qs = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    }
  };

  useEffect(() => {
    if (!actionMenu) return;
    const close = () => setActionMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActionMenu(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [actionMenu]);

  const clearDecaFieldError = (field: string) => {
    if (decaFieldErrors[field]) {
      setDecaFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Verificar si el usuario tiene empresa registrada
      const company = await companyService.getUserCompany();
      setHasCompany(!!company);
      setMyCompany(company);

      if (company) {
        const [centersData, data, overview] = await Promise.all([
          productionCenterService.getByCompanyId(company.id),
          identificationDocumentService.getAll(),
          dashboardService
            .getExecutiveOverview({ companyId: company.id, includeCommercial: false })
            .catch(() => null),
        ]);
        setProductionCenters(centersData);
        setDocuments(data);
        setUnauthorizedTreatmentReasons(overview?.alertas.tratamientoNoAutorizadoByDiId || {});
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDecaModalDirectly = (doc: IdentificationDocument) => {
    setDecaModalDoc(doc);
    setDecaFieldErrors({});
    // Por defecto, sugerir como cargador contractual la empresa propia del usuario o el productor
    setCargadorRazonSocial(myCompany?.razon_social || doc.productor_razon_social);
    setCargadorNif(myCompany?.cif || doc.productor_cif);
    setCargadorDomicilio(myCompany?.domicilio_social || doc.productor_direccion || '');
    setCargadorMunicipio(myCompany?.municipio_social || doc.productor_municipio || '');
    setCargadorProvincia(myCompany?.provincia_social || doc.productor_provincia || '');
    setMatriculaTractora(doc.transportista_matricula || myCompany?.matricula || '');
    setMatriculaRemolque('');
    setObservacionesDeCA(`Generado automáticamente desde DI ${doc.numero_documento}`);
  };

  const handleOpenDecaModal = async (doc: IdentificationDocument) => {
    try {
      const existing = await decaService.getByIdentificationDocument(doc.id);
      if (existing && existing.length > 0) {
        setExistingDecaAlert({ doc, existingDecas: existing });
        return;
      }
    } catch (err) {
      console.warn('Error al verificar DeCA existente para DI:', err);
    }
    openDecaModalDirectly(doc);
  };

  const handleGenerateDecaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decaModalDoc) return;

    const errorsMap: Record<string, string> = {};
    const razonErr = validateRequired(cargadorRazonSocial);
    if (razonErr) errorsMap.cargador_razon_social = razonErr;

    const nifErr = validateCIF(cargadorNif, true);
    if (nifErr) errorsMap.cargador_nif = nifErr;

    const domErr = validateRequired(cargadorDomicilio);
    if (domErr) errorsMap.cargador_domicilio = domErr;

    const matErr = validateRequired(matriculaTractora);
    if (matErr) errorsMap.matricula_tractora = matErr;

    if (Object.keys(errorsMap).length > 0) {
      setDecaFieldErrors(errorsMap);
      toast.error('Por favor, completa los campos requeridos marcados en rojo.');
      scrollToFirstError(errorsMap, 'deca_');
      return;
    }

    try {
      setDecaSubmitting(true);
      const newDeca = await decaService.createFromIdentificationDocument(decaModalDoc, {
        cargador_razon_social: cargadorRazonSocial,
        cargador_nif: cargadorNif,
        cargador_domicilio: cargadorDomicilio,
        cargador_municipio: cargadorMunicipio,
        cargador_provincia: cargadorProvincia,
        matricula_tractora: matriculaTractora,
        matricula_remolque: matriculaRemolque,
        observaciones_reservas: observacionesDeCA,
      });

      toast.success(`¡Documento DeCA ${newDeca.numero_deca} generado con éxito!`);
      setDecaModalDoc(null);
      router.push('/residuos/deca');
    } catch (err: any) {
      toast.error(`Error al emitir DeCA: ${err.message}`);
    } finally {
      setDecaSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setDocToDelete(id);
  };

  const confirmDelete = async () => {
    if (docToDelete === null) return;

    try {
      await identificationDocumentService.delete(docToDelete);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete));
      toast.success('Documento de identificación eliminado correctamente.');
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  const handleSendToSira = (id: number) => {
    setDocToSendSira(id);
  };

  const confirmSendToSira = async () => {
    if (docToSendSira === null) return;
    const targetId = docToSendSira;

    try {
      setSendingSiraId(targetId);
      const result = await siraService.sendDI(targetId);

      if (result.success) {
        toast.success(`Documento enviado con éxito a ${result.platformName || 'e-SIR / SIRA'}.\nID de Registro: ${result.siraId}`);
        await loadData();
      }
    } catch (err: any) {
      toast.error(`Error en el envío telemático: ${err.message}`);
    } finally {
      setSendingSiraId(null);
    }
  };

  const isExecutedOrActive = (d: IdentificationDocument): boolean =>
    d.estado === 'completado' ||
    ['en_transito', 'recepcionado', 'aceptado', 'rechazado_parcial', 'rechazado_total', 'tratado'].includes(
      d.estado_traslado || ''
    );

  const hasNoContract = (d: IdentificationDocument): boolean =>
    isExecutedOrActive(d) && !d.contract_id && !d.contrato_externo_referencia;

  const getUnauthorizedTreatmentReason = (d: IdentificationDocument): string | null => {
    if (unauthorizedTreatmentReasons[d.id]) {
      return unauthorizedTreatmentReasons[d.id];
    }
    if (!isExecutedOrActive(d)) return null;
    const effectiveOp = normalizeOperationCode(d.operacion_tratamiento_ejecutada || d.operacion_tratamiento);
    if (effectiveOp.startsWith('D') && d.tipo_notificacion === 'sin-notificacion') {
      return `La operación ${effectiveOp} es de eliminación y requiere Notificación Previa (el DI consta como 'Sin Notificación').`;
    }
    return null;
  };

  const hasIncident = (d: IdentificationDocument): boolean => {
    const tracking = getTrackingStatusMeta(d);
    return (
      d.estado_traslado === 'rechazado_parcial' ||
      d.estado_traslado === 'rechazado_total' ||
      (tracking.hasDiscrepancy && !tracking.isDiscrepancyJustified) ||
      hasNoContract(d) ||
      Boolean(getUnauthorizedTreatmentReason(d))
    );
  };

  const filteredDocuments = documents.filter(d => {
    let matchStatus = true;
    if (filterStatus === 'all') {
      matchStatus = true;
    } else if (filterStatus === 'sin_contrato') {
      matchStatus = hasNoContract(d);
    } else if (filterStatus === 'tratamiento_no_autorizado') {
      matchStatus = Boolean(getUnauthorizedTreatmentReason(d));
    } else if (filterStatus === 'discrepancias') {
      matchStatus = getTrackingStatusMeta(d).hasDiscrepancy;
    } else if (filterStatus === 'incidencias') {
      matchStatus = hasIncident(d);
    } else if (filterStatus === 'borrador') {
      matchStatus = !d.estado_traslado || d.estado_traslado === 'borrador';
    } else {
      matchStatus = d.estado_traslado === filterStatus || d.estado === filterStatus;
    }

    const matchCenter = filterCenter === 'all' || d.production_center_id === parseInt(filterCenter);
    return matchStatus && matchCenter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const diColumns: ColumnDef<IdentificationDocument>[] = useMemo(() => [
    {
      id: 'numero_documento',
      header: 'Nº DI / Estado',
      sortable: true,
      accessorFn: (doc) => `${doc.numero_documento || ''} ${doc.estado_traslado || ''}`,
      className: 'max-w-[185px]',
      cell: ({ row }) => {
        const tracking = getTrackingStatusMeta(row);
        const missingContract = hasNoContract(row);
        const unauthorizedReason = getUnauthorizedTreatmentReason(row);

        return (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.push(`/residuos/documentos-identificacion/${row.id}`)}
              className="font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 font-mono text-[11.5px] truncate block max-w-full text-left transition-colors"
              title={`Ver DI ${row.numero_documento}`}
            >
              DI {row.numero_documento}
            </button>
            <div>
              <Badge color={tracking.badgeColor} size="sm">
                {tracking.label}
              </Badge>
            </div>
            {tracking.hasDiscrepancy && (
              <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                Discrepancia: {(row.diferencia_peso_kg || 0) > 0 ? '+' : ''}{row.diferencia_peso_kg} kg
              </div>
            )}
            {missingContract && (
              <div className="text-[10px] font-bold text-red-600 dark:text-red-400">
                Sin contrato acreditado
              </div>
            )}
            {unauthorizedReason && (
              <div className="text-[10px] font-bold text-red-600 dark:text-red-400" title={unauthorizedReason}>
                Tratamiento no autorizado
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'fecha',
      header: 'Fecha',
      sortable: true,
      accessorKey: 'fecha_documento',
      className: 'whitespace-nowrap',
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 text-[11.5px]" title={formatDate(row.fecha_documento)}>
          {row.fecha_documento
            ? new Date(row.fecha_documento).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            : '-'}
        </span>
      ),
    },
    {
      id: 'residuo',
      header: 'Residuo (LER)',
      sortable: true,
      accessorFn: (doc) => `${doc.codigo_ler || ''} ${doc.descripcion_residuo || ''}`,
      className: 'max-w-[155px]',
      cell: ({ row }) => {
        const isPeligroso = row.peligrosidad === 'peligroso';
        return (
          <div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`font-mono font-bold text-[11.5px] ${isPeligroso ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {row.codigo_ler}
              </span>
              <span className={`text-[9.5px] px-1 rounded font-semibold ${isPeligroso ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                {isPeligroso ? 'Peligroso' : 'No Pelig.'}
              </span>
            </div>
            {row.descripcion_residuo && (
              <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5" title={row.descripcion_residuo}>
                {row.descripcion_residuo}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'centro',
      header: 'Centro Origen',
      sortable: true,
      accessorFn: (doc) => doc.production_center?.nombre || '',
      className: 'max-w-[115px]',
      cell: ({ row }) => (
        <span className="text-[11.5px] text-slate-800 dark:text-slate-200 truncate block" title={row.production_center?.nombre || '-'}>
          {row.production_center?.nombre || '-'}
        </span>
      ),
    },
    {
      id: 'gestor',
      header: 'Gestor Destino',
      sortable: true,
      accessorKey: 'gestor_razon_social',
      className: 'max-w-[135px]',
      cell: ({ row }) => (
        <div className="truncate" title={row.gestor_razon_social}>
          <span className="text-[11.5px] font-medium text-slate-900 dark:text-slate-100 block truncate">
            {row.gestor_razon_social}
          </span>
          {row.gestor_cif && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              NIF: {row.gestor_cif}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'pesada',
      header: 'Pesada',
      sortable: true,
      accessorFn: (doc) => doc.peso_origen_kg || doc.cantidad || 0,
      className: 'whitespace-nowrap',
      cell: ({ row }) => {
        const pesoOrigen = row.peso_origen_kg || (row.unidad === 'toneladas' ? row.cantidad * 1000 : row.cantidad) || 0;
        return (
          <div className="text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Orig: </span>
              <strong className="font-mono text-slate-900 dark:text-slate-100">{pesoOrigen.toLocaleString('es-ES')} kg</strong>
            </div>
            <div className="mt-0.5">
              <span className="text-slate-500 dark:text-slate-400">Básc: </span>
              {row.peso_destino_kg ? (
                <strong className="font-mono text-slate-900 dark:text-slate-100">{row.peso_destino_kg.toLocaleString('es-ES')} kg</strong>
              ) : (
                <span className="italic text-slate-400 dark:text-slate-500">Pendiente</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      cell: ({ row }) => {
        const hasSecondaryActions = canCreateOrDeleteDi || canWrite;
        const isSendingThis = sendingSiraId === row.id;

        return (
          <div className="inline-flex items-center gap-1 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/residuos/documentos-identificacion/${row.id}`)}
              className="text-[11px] py-1 px-2.5 h-auto"
            >
              Ver
            </Button>

            {hasSecondaryActions && (
              <button
                type="button"
                disabled={isSendingThis}
                aria-label={`Más acciones para DI ${row.numero_documento}`}
                aria-haspopup="menu"
                aria-expanded={actionMenu?.doc.id === row.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (actionMenu?.doc.id === row.id) {
                    setActionMenu(null);
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const menuHeight = 176;
                  const top =
                    rect.bottom + menuHeight > window.innerHeight
                      ? Math.max(8, rect.top - menuHeight)
                      : rect.bottom + 4;
                  const right = Math.max(8, window.innerWidth - rect.right);
                  setActionMenu({ doc: row, top, right });
                }}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isSendingThis ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                ) : (
                  <MoreHorizontal className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        );
      },
    },
  ], [canWrite, canCreateOrDeleteDi, myCompany, router, sendingSiraId, actionMenu?.doc.id, unauthorizedTreatmentReasons]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Cargando documentos de identificación">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-72 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-96 max-w-full rounded bg-slate-200/80 dark:bg-slate-800/80" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-24 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4" />
        <div className="rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4">
                <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-28 rounded bg-slate-200/80 dark:bg-slate-800/80" />
                <div className="h-4 w-44 rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-7 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasCompany) {
    return (
      <>
        <PageBreadCrumb pageTitle="Documentos de Identificación" />

        <div className="max-w-4xl mx-auto">
          <Alert
            variant="warning"
            title="Empresa no registrada"
            message="Antes de crear documentos de identificación, debes registrar los datos de tu empresa."
            showLink
            linkHref="/residuos/mi-empresa"
            linkText="Ir a Mi Empresa"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Documentos de Identificación" />

      <div className="space-y-6">
        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        {/* Acciones Principales */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Documentos de Identificación (DI)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Control oficial de traslados, pesajes en báscula, incidencias y tratamiento (RD 553/2020)
            </p>
          </div>
          {canCreateOrDeleteDi && (
            <Button onClick={() => router.push('/residuos/documentos-identificacion/nuevo')}>
              + Nuevo Documento
            </Button>
          )}
        </div>

        {/* Filtros por Ciclo de Vida */}
        <ComponentCard title="Ciclo de Vida del Traslado (RD 553/2020)">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('all')}
            >
              Todos ({documents.length})
            </Button>
            <Button
              variant={filterStatus === 'en_transito' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('en_transito')}
            >
              En Tránsito ({documents.filter(d => d.estado_traslado === 'en_transito').length})
            </Button>
            <Button
              variant={filterStatus === 'recepcionado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('recepcionado')}
            >
              En Báscula ({documents.filter(d => d.estado_traslado === 'recepcionado').length})
            </Button>
            <Button
              variant={filterStatus === 'aceptado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('aceptado')}
            >
              Aceptados ({documents.filter(d => d.estado_traslado === 'aceptado').length})
            </Button>
            <Button
              variant={filterStatus === 'incidencias' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('incidencias')}
            >
              Incidencias ({documents.filter(hasIncident).length})
            </Button>
            <Button
              variant={filterStatus === 'tratado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('tratado')}
            >
              Tratados ({documents.filter(d => d.estado_traslado === 'tratado').length})
            </Button>
            <Button
              variant={filterStatus === 'borrador' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterStatusChange('borrador')}
            >
              Borradores ({documents.filter(d => !d.estado_traslado || d.estado_traslado === 'borrador').length})
            </Button>
            {documents.some(d => getTrackingStatusMeta(d).hasDiscrepancy) && (
              <Button
                variant={filterStatus === 'discrepancias' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterStatusChange('discrepancias')}
                className={filterStatus === 'discrepancias' ? '!bg-amber-600' : 'text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-900'}
              >
                Discrepancia Báscula ({documents.filter(d => getTrackingStatusMeta(d).hasDiscrepancy).length})
              </Button>
            )}
            {documents.some(hasNoContract) && (
              <Button
                variant={filterStatus === 'sin_contrato' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterStatusChange('sin_contrato')}
                className={filterStatus === 'sin_contrato' ? '!bg-red-600' : 'text-red-600 border-red-200 dark:text-red-400 dark:border-red-900'}
              >
                Sin Contrato ({documents.filter(hasNoContract).length})
              </Button>
            )}
            {documents.some(d => Boolean(getUnauthorizedTreatmentReason(d))) && (
              <Button
                variant={filterStatus === 'tratamiento_no_autorizado' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterStatusChange('tratamiento_no_autorizado')}
                className={filterStatus === 'tratamiento_no_autorizado' ? '!bg-red-600' : 'text-red-600 border-red-200 dark:text-red-400 dark:border-red-900'}
              >
                Tratamiento No Autorizado ({documents.filter(d => Boolean(getUnauthorizedTreatmentReason(d))).length})
              </Button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium">Filtrar por Centro:</label>
            <select
              value={filterCenter}
              onChange={(e) => setFilterCenter(e.target.value)}
              className="text-sm border border-stroke dark:border-strokedark bg-transparent rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Todos los centros</option>
              {productionCenters.map(pc => (
                <option key={pc.id} value={pc.id}>{pc.nombre}</option>
              ))}
            </select>
          </div>
        </ComponentCard>

        {/* Cabecera de Lista y Selector de Vista */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="text-sm font-semibold text-foreground">
            {filteredDocuments.length} documento{filteredDocuments.length === 1 ? '' : 's'}{' '}
            {filterStatus !== 'all' || filterCenter !== 'all'
              ? filteredDocuments.length === 1
                ? 'filtrado'
                : 'filtrados'
              : 'en total'}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Vista Tabla
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Vista Tarjetas
            </button>
          </div>
        </div>

        {/* Visualización según vista seleccionada */}
        {viewMode === 'table' ? (
          <DataTable
            data={filteredDocuments}
            columns={diColumns}
            syncUrlParams
            searchPlaceholder="Buscar por DI, LER, centro, gestor..."
            defaultPageSize={25}
            pageSizeOptions={[10, 25, 50, 100]}
            initialSortBy="fecha"
            initialSortOrder="desc"
            emptyState={
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-foreground">No hay documentos con este filtro</h3>
                <p className="mt-2 text-sm text-muted">
                  Cambia el filtro de estado o crea un nuevo traslado
                </p>
              </div>
            }
          />
        ) : filteredDocuments.length === 0 ? (
          <ComponentCard title="Documentos de Identificación">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-foreground">No hay documentos con este filtro</h3>
              <p className="mt-2 text-sm text-muted">
                Cambia el filtro de estado o crea un nuevo traslado
              </p>
            </div>
          </ComponentCard>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredDocuments.map((doc) => {
              const tracking = getTrackingStatusMeta(doc);
              const pesoOrigen = doc.peso_origen_kg || (doc.unidad === 'toneladas' ? doc.cantidad * 1000 : doc.cantidad) || 0;

              return (
                <ComponentCard key={doc.id} title="">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              DI {doc.numero_documento}
                            </h3>
                            <Badge color={tracking.badgeColor}>
                              {tracking.label}
                            </Badge>
                            {tracking.hasDiscrepancy && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                Discrepancia Báscula: {(doc.diferencia_peso_kg || 0) > 0 ? '+' : ''}{doc.diferencia_peso_kg} kg
                              </span>
                            )}
                            {hasNoContract(doc) && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
                                Sin contrato acreditado (Art. 5)
                              </span>
                            )}
                            {getUnauthorizedTreatmentReason(doc) && (
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30"
                                title={getUnauthorizedTreatmentReason(doc) || undefined}
                              >
                                Tratamiento no autorizado
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted">
                            <p>
                              <span className="font-medium text-foreground">Fecha:</span>{' '}
                              {formatDate(doc.fecha_documento)}
                            </p>

                            <p>
                              <span className="font-medium text-foreground">Residuo:</span>{' '}
                              <span className="font-mono font-bold text-foreground">{doc.codigo_ler}</span> ({doc.peligrosidad === 'peligroso' ? 'Peligroso' : 'No Peligroso'})
                            </p>

                            <p>
                              <span className="font-medium text-foreground">Gestor Destino:</span>{' '}
                              {doc.gestor_razon_social}
                            </p>

                            <p>
                              <span className="font-medium text-foreground">Pesada Origen:</span>{' '}
                              <span className="font-mono font-medium text-foreground">{pesoOrigen.toLocaleString('es-ES')} kg</span>
                            </p>

                            {doc.peso_destino_kg ? (
                              <p>
                                <span className="font-medium text-foreground">Pesada Destino (Báscula):</span>{' '}
                                <span className="font-mono font-bold text-foreground">{doc.peso_destino_kg.toLocaleString('es-ES')} kg</span>
                              </p>
                            ) : (
                              <p className="italic text-muted">
                                Pesada Destino: Pendiente en báscula
                              </p>
                            )}

                            {doc.production_center && (
                              <p>
                                <span className="font-medium text-foreground">Centro de Origen:</span>{' '}
                                <span className="text-primary font-medium">{doc.production_center.nombre}</span>
                              </p>
                            )}

                            {doc.transportista_matricula && (
                              <p>
                                <span className="font-medium text-foreground">Vehículo:</span>{' '}
                                <span className="font-mono text-foreground">{doc.transportista_matricula}</span>
                              </p>
                            )}
                          </div>

                          {doc.motivo_incidencia && (
                            <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300">
                              <span className="font-bold">Incidencia / Rechazo:</span> {doc.motivo_incidencia}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/residuos/documentos-identificacion/${doc.id}`)}
                      >
                        Ver Detalle y Trazabilidad
                      </Button>

                      {canCreateOrDeleteDi && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/residuos/documentos-identificacion/nuevo?duplicate_from=${doc.id}`)}
                          className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Repetir Retirada
                        </Button>
                      )}

                      {canWrite && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDecaModal(doc)}
                          className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center gap-1.5"
                        >
                          <FilePlus className="w-3.5 h-3.5" />
                          Generar DeCA
                        </Button>
                      )}

                      {canCreateOrDeleteDi && (!doc.estado_traslado || doc.estado_traslado === 'borrador') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendToSira(doc.id)}
                          disabled={!myCompany?.sira_usuario || !myCompany?.sira_password || !siraService.resolvePlatformForDI(doc).supported}
                          className={!myCompany?.sira_usuario || !myCompany?.sira_password || !siraService.resolvePlatformForDI(doc).supported ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Enviar a {siraService.resolvePlatformForDI(doc).shortLabel}
                        </Button>
                      )}

                      {canCreateOrDeleteDi && (!doc.estado_traslado || doc.estado_traslado === 'borrador') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-500"
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </ComponentCard>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Advertencia de DeCA ya existente para el DI (N06) */}
      <Modal
        isOpen={Boolean(existingDecaAlert)}
        onClose={() => setExistingDecaAlert(null)}
        className="max-w-md p-6"
      >
        {existingDecaAlert && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>DeCA Ya Emitido para este DI</span>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <p>
                El Documento de Identificación <strong>{existingDecaAlert.doc.numero_documento}</strong> ya tiene
                asociado al menos un documento electrónico de control (DeCA):
              </p>
              <div className="bg-white/80 dark:bg-black/30 p-2.5 rounded-lg border border-amber-200/50 space-y-1 font-mono text-xs">
                {existingDecaAlert.existingDecas.map((d) => (
                  <div key={d.id} className="flex justify-between items-center">
                    <span className="font-bold">{d.numero_deca} (v{d.version})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${d.is_vigente ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600'}`}>
                      {d.is_vigente ? 'Vigente' : 'Sustituido'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Para evitar duplicidades en carretera o inconsistencias en inspección, elija si desea consultar el documento existente o emitir una nueva expedición de transporte independiente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setExistingDecaAlert(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExistingDecaAlert(null);
                  router.push('/residuos/deca');
                }}
              >
                <span>Ver DeCA Existente</span>
              </Button>
              <Button
                onClick={() => {
                  const targetDoc = existingDecaAlert.doc;
                  setExistingDecaAlert(null);
                  openDecaModalDirectly(targetDoc);
                }}
              >
                <span>Emitir Nueva Expedición</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Emisión rápida de DeCA desde DI */}
      <Modal
        isOpen={Boolean(decaModalDoc)}
        onClose={() => setDecaModalDoc(null)}
        className="max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        {decaModalDoc && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Generar DeCA desde DI</h3>
                  <p className="text-xs text-slate-500 font-mono">DI: {decaModalDoc.numero_documento} | LER {decaModalDoc.codigo_ler}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecaModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateDecaSubmit} noValidate className="space-y-4">
              {Object.keys(decaFieldErrors).length > 0 && (
                <div className="p-3 bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 rounded-xl text-xs text-error-700 dark:text-error-300">
                  Por favor, corrige los campos destacados en rojo antes de emitir el DeCA.
                </div>
              )}

              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <strong>Datos precargados del DI:</strong> Transportista ({decaModalDoc.transportista_razon_social || 'N/A'}), Origen ({decaModalDoc.productor_municipio}), Destino ({decaModalDoc.gestor_municipio}), Residuo y Peso ({decaModalDoc.cantidad} {decaModalDoc.unidad}).
              </div>

              {/* Cargador Contractual */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                    Cargador Contractual (Quien encarga y paga el transporte)
                  </span>
                  <span className="text-[10px] text-slate-400">Orden FOM/2861/2012</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="deca_cargador_razon_social" required>Razón Social</Label>
                    <Input
                      id="deca_cargador_razon_social"
                      type="text"
                      value={cargadorRazonSocial}
                      onChange={(e) => {
                        setCargadorRazonSocial(e.target.value);
                        clearDecaFieldError('cargador_razon_social');
                      }}
                      error={Boolean(decaFieldErrors.cargador_razon_social)}
                      hint={decaFieldErrors.cargador_razon_social}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deca_cargador_nif" required>NIF / CIF</Label>
                    <Input
                      id="deca_cargador_nif"
                      type="text"
                      value={cargadorNif}
                      onChange={(e) => {
                        setCargadorNif(e.target.value.toUpperCase());
                        clearDecaFieldError('cargador_nif');
                      }}
                      error={Boolean(decaFieldErrors.cargador_nif)}
                      hint={decaFieldErrors.cargador_nif}
                      className="font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="deca_cargador_domicilio" required>Domicilio</Label>
                    <Input
                      id="deca_cargador_domicilio"
                      type="text"
                      value={cargadorDomicilio}
                      onChange={(e) => {
                        setCargadorDomicilio(e.target.value);
                        clearDecaFieldError('cargador_domicilio');
                      }}
                      error={Boolean(decaFieldErrors.cargador_domicilio)}
                      hint={decaFieldErrors.cargador_domicilio}
                    />
                  </div>
                </div>
              </div>

              {/* Matrículas */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase block">
                  Vehículo Asignado
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="deca_matricula_tractora" required>Matrícula Tractora</Label>
                    <Input
                      id="deca_matricula_tractora"
                      type="text"
                      placeholder="1234-BBB"
                      value={matriculaTractora}
                      onChange={(e) => {
                        setMatriculaTractora(e.target.value.toUpperCase());
                        clearDecaFieldError('matricula_tractora');
                      }}
                      error={Boolean(decaFieldErrors.matricula_tractora)}
                      hint={decaFieldErrors.matricula_tractora}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deca_matricula_remolque">Matrícula Remolque/Semi</Label>
                    <Input
                      id="deca_matricula_remolque"
                      type="text"
                      placeholder="R-1234-BBB (Opcional)"
                      value={matriculaRemolque}
                      onChange={(e) => setMatriculaRemolque(e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <Label htmlFor="deca_observaciones">Observaciones o reservas</Label>
                <TextArea
                  id="deca_observaciones"
                  rows={2}
                  value={observacionesDeCA}
                  onChange={(val) => setObservacionesDeCA(val)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDecaModalDoc(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={decaSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-xl text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {decaSubmitting ? 'Generando...' : 'Emitir DeCA y Generar QR'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {actionMenu && (() => {
        const doc = actionMenu.doc;
        const isDraft = !doc.estado_traslado || doc.estado_traslado === 'borrador';
        const platform = siraService.resolvePlatformForDI(doc);
        const canSendPlatform = Boolean(myCompany?.sira_usuario && myCompany?.sira_password && platform.supported);

        return (
          <div
            role="menu"
            style={{ top: actionMenu.top, right: actionMenu.right }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1.5 text-xs"
          >
            {canCreateOrDeleteDi && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionMenu(null);
                  router.push(`/residuos/documentos-identificacion/nuevo?duplicate_from=${doc.id}`);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Repetir retirada</span>
              </button>
            )}

            {canWrite && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionMenu(null);
                  handleOpenDecaModal(doc);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Generar DeCA</span>
              </button>
            )}

            {canCreateOrDeleteDi && isDraft && (
              <button
                type="button"
                role="menuitem"
                disabled={!canSendPlatform}
                title={canSendPlatform ? `Enviar a ${platform.name}` : `Configura credenciales para enviar a ${platform.name}`}
                onClick={() => {
                  setActionMenu(null);
                  handleSendToSira(doc.id);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Enviar a {platform.shortLabel}</span>
              </button>
            )}

            {canCreateOrDeleteDi && isDraft && (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionMenu(null);
                    handleDelete(doc.id);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar borrador</span>
                </button>
              </>
            )}
          </div>
        );
      })()}

      <ConfirmModal
        isOpen={docToDelete !== null}
        onClose={() => setDocToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar documento"
        message="¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer."
      />

      {(() => {
        const selectedDoc = documents.find((d) => d.id === docToSendSira);
        const platform = selectedDoc ? siraService.resolvePlatformForDI(selectedDoc) : null;
        return (
          <ConfirmModal
            isOpen={docToSendSira !== null}
            onClose={() => setDocToSendSira(null)}
            onConfirm={confirmSendToSira}
            variant="primary"
            title={`Enviar documento a ${platform?.shortLabel || 'e-SIR / SIRA'}`}
            confirmLabel={`Enviar a ${platform?.shortLabel || 'e-SIR / SIRA'}`}
            message={`¿Deseas enviar este documento telemáticamente a ${platform?.name || 'la plataforma oficial (SIRA / e-SIR)'}?`}
          />
        );
      })()}
    </>
  );
}
