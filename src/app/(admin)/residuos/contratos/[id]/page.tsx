'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';
import wasteContractService, { getContractEffectiveStatus, validateContractActivation } from '@/services/wasteContractService';
import type { WasteContract } from '@/types/wasteManagement';
import SignatureModal from '@/components/ui/signature/SignatureModal';
import { generateContractPDF } from '@/lib/pdfUtils';

const STATUS_COLORS = {
  borrador: 'info',
  vigente: 'success',
  caducado: 'warning',
  finalizado: 'light',
  cancelado: 'error',
} as const;

const STATUS_LABELS = {
  borrador: 'Borrador',
  vigente: 'Vigente',
  caducado: 'Caducado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [contract, setContract] = useState<WasteContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signingRole, setSigningRole] = useState<'productor' | 'gestor'>('productor');

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const data = await wasteContractService.getById(parseInt(id));
      setContract(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contract || !confirm('¿Estás seguro de que deseas eliminar este contrato?')) {
      return;
    }

    try {
      await wasteContractService.delete(contract.id);
      router.push('/residuos/contratos');
    } catch (err: any) {
      setError(`Error al eliminar: ${err.message}`);
    }
  };

  const handleChangeStatus = async (newStatus: 'borrador' | 'vigente' | 'finalizado' | 'cancelado') => {
    if (!contract) return;

    try {
      setError(null);
      if (newStatus === 'vigente') {
        await wasteContractService.activate(contract.id);
      } else {
        await wasteContractService.updateStatus(contract.id, newStatus);
      }
      await loadContract();
    } catch (err: any) {
      setError(`Error al cambiar estado: ${err.message}`);
    }
  };

  const handleOpenSignature = (role: 'productor' | 'gestor' = 'productor') => {
    setSigningRole(role);
    setIsSignatureModalOpen(true);
  };

  const handleSaveSignature = async (signatureBase64: string) => {
    if (!contract) return;
    try {
      setLoading(true);
      await wasteContractService.signContract(contract.id, signatureBase64, signingRole);
      toast.success('Firma registrada con éxito en el contrato.');
      await loadContract();
    } catch (err: any) {
      const msg = `Error al guardar firma: ${err.message}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contract) return;
    try {
      setDownloading(true);
      setError(null);
      setDownloadSuccess(null);
      let contractToPrint = contract;
      if (!contractToPrint.contract_waste_codes || contractToPrint.contract_waste_codes.length === 0) {
        const full = await wasteContractService.getById(contract.id);
        if (full) contractToPrint = full;
      }
      const doc = await generateContractPDF(contractToPrint);
      doc.save(`contrato_${contractToPrint.numero_contrato || contractToPrint.id}.pdf`);
      setDownloadSuccess('PDF descargado con éxito.');
      toast.success('PDF del contrato descargado con éxito.');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err: any) {
      const msg = `Error al descargar PDF: ${err.message || 'Error desconocido'}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!contract?.signing_token) {
      toast.warning('Este contrato no tiene un token de firma asignado.');
      return;
    }
    const baseUrl = window.location.origin;
    const publicUrl = `${baseUrl}/public/sign-contract/${contract.signing_token}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Enlace de firma pública copiado al portapapeles.');
    } catch {
      toast.error('No se pudo copiar el enlace al portapapeles.');
    }
  };

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
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <>
        <PageBreadCrumb pageTitle="Detalle del Contrato" />
        <div className="max-w-4xl mx-auto">
          <Alert variant="error" title="Error" message={error || 'Contrato no encontrado'} />
          <div className="mt-6">
            <Button onClick={() => router.push('/residuos/contratos')}>
              Volver a Contratos
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle={`Contrato ${contract.numero_contrato || `#${contract.id}`}`} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              {contract.numero_contrato || `Contrato #${contract.id}`}
            </h2>
            {(() => {
              const effective = getContractEffectiveStatus(contract);
              return (
                <Badge color={STATUS_COLORS[effective.status]} size="md">
                  {effective.label}
                </Badge>
              );
            })()}
          </div>
          <Button variant="outline" onClick={() => router.push('/residuos/contratos')}>
            ← Volver
          </Button>
        </div>

        {downloadSuccess && (
          <Alert variant="success" title="Éxito" message={downloadSuccess} />
        )}

        {/* Checklist de Activación si está en Borrador */}
        {contract.estado === 'borrador' && (() => {
          const activation = validateContractActivation(contract);
          return (
            <ComponentCard
              title="Checklist de Validación para Activación (RD 553/2020)"
              desc="Antes de activar este contrato y poder seleccionarlo en Documentos de Identificación (DI), debe cumplir los siguientes requisitos legales:"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${activation.checklist.hasProducer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'}`}>
                    <span className="font-bold text-sm shrink-0">{activation.checklist.hasProducer ? '✓' : '✕'}</span>
                    <div className="text-xs">
                      <p className="font-semibold">Empresa Productora</p>
                      <p className="opacity-80">{activation.checklist.hasProducer ? (contract.company?.razon_social || 'Asignada') : 'Falta productor'}</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${activation.checklist.hasGestor ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'}`}>
                    <span className="font-bold text-sm shrink-0">{activation.checklist.hasGestor ? '✓' : '✕'}</span>
                    <div className="text-xs">
                      <p className="font-semibold">Gestor de Tratamiento</p>
                      <p className="opacity-80">{activation.checklist.hasGestor ? (contract.treatment_manager?.razon_social || contract.gestor_company?.razon_social || 'Asignado') : 'Falta gestor'}</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${activation.checklist.hasValidDates ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'}`}>
                    <span className="font-bold text-sm shrink-0">{activation.checklist.hasValidDates ? '✓' : '✕'}</span>
                    <div className="text-xs">
                      <p className="font-semibold">Fechas de Vigencia</p>
                      <p className="opacity-80">{activation.checklist.hasValidDates ? 'Inicio y fin especificados' : 'Faltan fechas'}</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${activation.checklist.isNotExpired ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'}`}>
                    <span className="font-bold text-sm shrink-0">{activation.checklist.isNotExpired ? '✓' : '✕'}</span>
                    <div className="text-xs">
                      <p className="font-semibold">Vigencia Temporal</p>
                      <p className="opacity-80">{activation.checklist.isNotExpired ? 'No caducado' : 'Fecha fin superada'}</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${activation.checklist.hasWasteCodes ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'}`}>
                    <span className="font-bold text-sm shrink-0">{activation.checklist.hasWasteCodes ? '✓' : '✕'}</span>
                    <div className="text-xs">
                      <p className="font-semibold">Códigos LER Incluidos</p>
                      <p className="opacity-80">{activation.checklist.hasWasteCodes ? `${(contract.contract_waste_codes?.length || contract.codigos_ler?.length || 0)} residuo(s)` : 'Ningún LER'}</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${activation.checklist.hasOperations ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'}`}>
                    <span className="font-bold text-sm shrink-0">{activation.checklist.hasOperations ? '✓' : '✕'}</span>
                    <div className="text-xs">
                      <p className="font-semibold">Operación R/D Definida</p>
                      <p className="opacity-80">{activation.checklist.hasOperations ? 'Operación autorizada' : 'Falta operación R/D'}</p>
                    </div>
                  </div>
                </div>

                {!activation.valid && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                    <span>Para activar el contrato haga clic en <strong>Editar Contrato</strong> y complete los datos requeridos.</span>
                  </div>
                )}
              </div>
            </ComponentCard>
          );
        })()}

        {/* Información General */}
        <ComponentCard title="Información General">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Número de Contrato</label>
              <p className="text-foreground">{contract.numero_contrato || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Tipo de Contrato</label>
              <p className="text-foreground capitalize">{contract.tipo_contrato}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Fecha del Contrato</label>
              <p className="text-foreground">{formatDate(contract.fecha_contrato)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Estado</label>
              <Badge color={STATUS_COLORS[contract.estado]}>{STATUS_LABELS[contract.estado]}</Badge>
            </div>

            {contract.fecha_inicio && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Fecha de Inicio</label>
                <p className="text-foreground">{formatDate(contract.fecha_inicio)}</p>
              </div>
            )}

            {contract.fecha_fin && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Fecha de Fin</label>
                <p className="text-foreground">{formatDate(contract.fecha_fin)}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Partes del Contrato e Instalaciones */}
        <ComponentCard title="Partes del Contrato e Instalaciones">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Productor */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
              <div className="text-foreground font-semibold">
                <h4>Productor</h4>
              </div>
              {contract.company ? (
                <div className="space-y-1.5 text-sm">
                  <p>
                    <span className="text-muted">Razón Social:</span>{' '}
                    <span className="text-foreground font-medium">{contract.company.razon_social}</span>
                  </p>
                  <p>
                    <span className="text-muted">CIF:</span>{' '}
                    <span className="text-foreground font-mono">{contract.company.cif}</span>
                  </p>
                  {contract.company.nima && (
                    <p>
                      <span className="text-muted">NIMA:</span>{' '}
                      <span className="text-foreground font-mono">{contract.company.nima}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted text-sm">No disponible</p>
              )}

              {/* Centro de Producción de Origen */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  <span>Centro de Producción de Origen</span>
                </div>
                {contract.producer_center ? (
                  <div className="text-xs space-y-1 text-foreground">
                    <p className="font-medium">{contract.producer_center.nombre}</p>
                    {contract.producer_center.nima && (
                      <p className="text-muted">NIMA: <span className="font-mono text-foreground">{contract.producer_center.nima}</span></p>
                    )}
                    {contract.producer_center.direccion && (
                      <p className="text-muted">{contract.producer_center.direccion}, {contract.producer_center.municipio} ({contract.producer_center.provincia})</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">Centro general / Sede principal</p>
                )}
              </div>
            </div>

            {/* Gestor */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
              <div className="text-foreground font-semibold">
                <h4>Gestor de Tratamiento</h4>
              </div>
              {contract.treatment_manager ? (
                <div className="space-y-1.5 text-sm">
                  <p>
                    <span className="text-muted">Razón Social:</span>{' '}
                    <span className="text-foreground font-medium">{contract.treatment_manager.razon_social}</span>
                  </p>
                  <p>
                    <span className="text-muted">CIF:</span>{' '}
                    <span className="text-foreground font-mono">{contract.treatment_manager.cif}</span>
                  </p>
                  {contract.treatment_manager.nima && (
                    <p>
                      <span className="text-muted">NIMA:</span>{' '}
                      <span className="text-foreground font-mono">{contract.treatment_manager.nima}</span>
                    </p>
                  )}
                  {contract.treatment_manager.numero_autorizacion && (
                    <p>
                      <span className="text-muted">Autorización:</span>{' '}
                      <span className="text-foreground font-mono">{contract.treatment_manager.numero_autorizacion}</span>
                    </p>
                  )}
                </div>
              ) : contract.gestor_company ? (
                <div className="space-y-1.5 text-sm">
                  <p>
                    <span className="text-muted">Razón Social:</span>{' '}
                    <span className="text-foreground font-medium">{contract.gestor_company.razon_social}</span>
                  </p>
                  <p>
                    <span className="text-muted">CIF:</span>{' '}
                    <span className="text-foreground font-mono">{contract.gestor_company.cif}</span>
                  </p>
                  {contract.gestor_company.nima && (
                    <p>
                      <span className="text-muted">NIMA:</span>{' '}
                      <span className="text-foreground font-mono">{contract.gestor_company.nima}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted text-sm">No asignado</p>
              )}

              {/* Instalación de Destino */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  <span>Instalación de Tratamiento (Destino)</span>
                </div>
                {contract.gestor_center ? (
                  <div className="text-xs space-y-1 text-foreground">
                    <p className="font-medium">{contract.gestor_center.nombre}</p>
                    {contract.gestor_center.nima && (
                      <p className="text-muted">NIMA: <span className="font-mono text-foreground">{contract.gestor_center.nima}</span></p>
                    )}
                    {contract.gestor_center.direccion && (
                      <p className="text-muted">{contract.gestor_center.direccion}, {contract.gestor_center.municipio} ({contract.gestor_center.provincia})</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">Instalación principal del gestor</p>
                )}
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Residuos y Condiciones */}
        <ComponentCard title="Residuos Autorizados y Condiciones">
          <div className="space-y-6">
            {/* Tabla de residuos vinculados */}
            {contract.contract_waste_codes && contract.contract_waste_codes.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Código LER</th>
                      <th className="px-4 py-3 text-left">Descripción del Residuo</th>
                      <th className="px-4 py-3 text-center">Operación Tratamiento</th>
                      <th className="px-4 py-3 text-right">Cantidad Anual</th>
                      <th className="px-4 py-3 text-right">Tarifa / Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {contract.contract_waste_codes.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {item.codigo_ler}
                            {item.codigo_ler.includes('*') && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                                PELIGROSO
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {item.descripcion_ler || '-'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 text-xs font-bold font-mono rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            {item.operacion_tratamiento}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-foreground">
                          {item.cantidad_estimada_anual ? `${item.cantidad_estimada_anual} t` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-foreground">
                          {item.tarifa_gestion != null ? `${item.tarifa_gestion} €` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-muted">Códigos LER:</span>
                  {contract.codigos_ler && contract.codigos_ler.length > 0 ? (
                    contract.codigos_ler.map((ler) => (
                      <span key={ler} className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-800 text-foreground border border-gray-200 dark:border-gray-700">
                        {ler}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted">Ninguno especificado</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-muted">Operaciones:</span>
                  {contract.operaciones_tratamiento && contract.operaciones_tratamiento.length > 0 ? (
                    contract.operaciones_tratamiento.map((op) => (
                      <span key={op} className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        {op}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted">Ninguna especificada</span>
                  )}
                </div>
              </div>
            )}

            {contract.descripcion_residuos && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Descripción General de Residuos</label>
                <p className="text-foreground">{contract.descripcion_residuos}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contract.cantidad_maxima_anual && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Cantidad Máxima Anual Global</label>
                  <p className="text-foreground">
                    {contract.cantidad_maxima_anual} {contract.unidad_cantidad}
                  </p>
                </div>
              )}

              {contract.precio_unitario && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Precio Unitario Global</label>
                  <p className="text-foreground">
                    {contract.precio_unitario} {contract.moneda}
                  </p>
                </div>
              )}
            </div>

            {contract.notas && (
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Notas / Observaciones</label>
                <p className="text-foreground whitespace-pre-wrap">{contract.notas}</p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Firmas */}
        {(contract.firma_productor_url || contract.firma_gestor_url) && (
          <ComponentCard title="Firmas del Contrato">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {contract.firma_productor_url && (
                <div className="flex flex-col items-center p-4 border rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm font-medium text-muted mb-4">Firma del Productor</span>
                  <img
                    src={contract.firma_productor_url}
                    alt="Firma Productor"
                    className="max-h-32 object-contain bg-white rounded shadow-sm p-2"
                  />
                  <span className="text-[10px] text-gray-400 mt-4 italic">
                    Firmado el: {contract.fecha_firma_productor ? formatDate(contract.fecha_firma_productor) : '-'}
                  </span>
                </div>
              )}

              {contract.firma_gestor_url && (
                <div className="flex flex-col items-center p-4 border rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm font-medium text-muted mb-4">Firma del Gestor</span>
                  <img
                    src={contract.firma_gestor_url}
                    alt="Firma Gestor"
                    className="max-h-32 object-contain bg-white rounded shadow-sm p-2"
                  />
                  <span className="text-[10px] text-gray-400 mt-4 italic">
                    Firmado el: {contract.fecha_firma_gestor ? formatDate(contract.fecha_firma_gestor) : '-'}
                  </span>
                </div>
              )}
            </div>
          </ComponentCard>
        )}

        {/* Acciones */}
        <ComponentCard title="Acciones">
          <div className="flex flex-wrap gap-3">
            {contract.estado === 'borrador' && (() => {
              const activation = validateContractActivation(contract);
              return (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Button
                    onClick={() => handleChangeStatus('vigente')}
                    disabled={!activation.valid}
                  >
                    Activar Contrato
                  </Button>
                  {!activation.valid && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                      (Requiere completar los 6 puntos del checklist superior)
                    </span>
                  )}
                </div>
              );
            })()}

            {contract.estado === 'vigente' && (
              <>
                <Button variant="outline" onClick={() => handleChangeStatus('finalizado')}>
                  Finalizar Contrato
                </Button>
                <Button variant="outline" onClick={() => handleChangeStatus('cancelado')}>
                  Cancelar Contrato
                </Button>
              </>
            )}

            {(contract.estado === 'finalizado' || contract.estado === 'cancelado') && (
              <Button variant="outline" onClick={() => handleChangeStatus('borrador')}>
                Volver a Borrador
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.push(`/residuos/contratos/${contract.id}/editar`)}
            >
              Editar Contrato
            </Button>

            <Button
              variant="outline"
              onClick={handleDelete}
            >
              Eliminar Contrato
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? 'Generando PDF...' : 'Descargar PDF'}
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyPublicLink}
              className="text-primary hover:bg-primary/5"
            >
              Copiar Enlace Público
            </Button>

            {!contract.firma_productor_url && (
              <Button onClick={() => handleOpenSignature('productor')}>
                Firmar como Productor
              </Button>
            )}

            {!contract.firma_gestor_url && (
              <Button onClick={() => handleOpenSignature('gestor')}>
                Firmar como Gestor
              </Button>
            )}
          </div>
        </ComponentCard>

        {/* Fechas de Sistema */}
        <ComponentCard title="Información del Sistema">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Creado</label>
              <p className="text-foreground">{formatDate(contract.created_at)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Última Modificación</label>
              <p className="text-foreground">{formatDate(contract.updated_at)}</p>
            </div>
          </div>
        </ComponentCard>
      </div>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSaveSignature}
        title={`Firmar Contrato como ${signingRole === 'productor' ? 'Productor' : 'Gestor'}`}
        description="Al pulsar en 'Confirmar Firma' se guardará su firma digital en el documento."
      />
    </>
  );
}
