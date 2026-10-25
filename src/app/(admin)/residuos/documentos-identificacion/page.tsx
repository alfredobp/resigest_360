'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import TextArea from '@/components/form/input/TextArea';
import { toast } from '@/context/ToastContext';
import identificationDocumentService, { getTrackingStatusMeta } from '@/services/identificationDocumentService';
import siraService from '@/services/siraService';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import { decaService } from '@/services/decaService';
import { validateRequired, validateCIF, scrollToFirstError } from '@/lib/validations/formValidation';
import { Truck, X } from 'lucide-react';
import type { IdentificationDocument, Company, ProductionCenter } from '@/types/wasteManagement';

export default function DocumentosIdentificacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<IdentificationDocument[]>([]);
  const [hasCompany, setHasCompany] = useState(false);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCenter, setFilterCenter] = useState<string>('all');

  // Modal DeCA rápido
  const [decaModalDoc, setDecaModalDoc] = useState<IdentificationDocument | null>(null);
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
        // Cargar centros de producción
        const centersData = await productionCenterService.getByCompanyId(company.id);
        setProductionCenters(centersData);

        // Cargar documentos
        const data = await identificationDocumentService.getAll();
        setDocuments(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecaModal = (doc: IdentificationDocument) => {
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

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      await identificationDocumentService.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success('Documento de identificación eliminado correctamente.');
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  const handleSendToSira = async (id: number) => {
    if (!confirm('¿Deseas enviar este documento a SIRA (Junta de Andalucía)?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await siraService.sendDI(id);

      if (result.success) {
        toast.success(`Documento enviado con éxito a SIRA.\nID de Registro: ${result.siraId}`);
        await loadData();
      }
    } catch (err: any) {
      toast.error(`Error al enviar a SIRA: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(d => {
    let matchStatus = true;
    if (filterStatus === 'all') {
      matchStatus = true;
    } else if (filterStatus === 'incidencias') {
      matchStatus = d.estado_traslado === 'rechazado_parcial' || d.estado_traslado === 'rechazado_total';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">Cargando documentos...</p>
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
            <h2 className="text-2xl font-bold text-foreground">Documentos de Identificación (DI)</h2>
            <p className="text-muted mt-1">
              Control oficial de traslados, pesajes en báscula, incidencias y tratamiento (RD 553/2020)
            </p>
          </div>
          <Button onClick={() => router.push('/residuos/documentos-identificacion/nuevo')}>
            + Nuevo Documento
          </Button>
        </div>

        {/* Filtros por Ciclo de Vida */}
        <ComponentCard title="Ciclo de Vida del Traslado (RD 553/2020)">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos ({documents.length})
            </Button>
            <Button
              variant={filterStatus === 'en_transito' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('en_transito')}
            >
              En Tránsito ({documents.filter(d => d.estado_traslado === 'en_transito').length})
            </Button>
            <Button
              variant={filterStatus === 'recepcionado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('recepcionado')}
            >
              En Báscula ({documents.filter(d => d.estado_traslado === 'recepcionado').length})
            </Button>
            <Button
              variant={filterStatus === 'aceptado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('aceptado')}
            >
              Aceptados ({documents.filter(d => d.estado_traslado === 'aceptado').length})
            </Button>
            <Button
              variant={filterStatus === 'incidencias' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('incidencias')}
            >
              Incidencias ({documents.filter(d => d.estado_traslado === 'rechazado_parcial' || d.estado_traslado === 'rechazado_total').length})
            </Button>
            <Button
              variant={filterStatus === 'tratado' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('tratado')}
            >
              Tratados ({documents.filter(d => d.estado_traslado === 'tratado').length})
            </Button>
            <Button
              variant={filterStatus === 'borrador' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('borrador')}
            >
              Borradores ({documents.filter(d => !d.estado_traslado || d.estado_traslado === 'borrador').length})
            </Button>
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

        {/* Lista de Documentos */}
        {filteredDocuments.length === 0 ? (
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
                                ⚠️ Discrepancia Báscula: {(doc.diferencia_peso_kg || 0) > 0 ? '+' : ''}{doc.diferencia_peso_kg} kg
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

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDecaModal(doc)}
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        ⚡ Generar DeCA
                      </Button>

                      {(!doc.estado_traslado || doc.estado_traslado === 'borrador') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendToSira(doc.id)}
                          disabled={!myCompany?.sira_usuario || !myCompany?.sira_password}
                          className={!myCompany?.sira_usuario || !myCompany?.sira_password ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          Enviar a SIRA
                        </Button>
                      )}

                      {(!doc.estado_traslado || doc.estado_traslado === 'borrador') && (
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
                ✅ <strong>Datos precargados del DI:</strong> Transportista ({decaModalDoc.transportista_razon_social || 'N/A'}), Origen ({decaModalDoc.productor_municipio}), Destino ({decaModalDoc.gestor_municipio}), Residuo y Peso ({decaModalDoc.cantidad} {decaModalDoc.unidad}).
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
    </>
  );
}
