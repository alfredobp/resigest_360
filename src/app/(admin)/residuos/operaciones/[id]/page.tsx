'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import commercialOperationService from '@/services/commercialOperationService';
import { generateCommercialOperationPDF } from '@/lib/pdfUtils';
import {
  type CommercialOperation,
  type EstadoOperacionComercial
} from '@/types/wasteManagement';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';

const ESTADO_CONFIG: Record<EstadoOperacionComercial, { label: string; color: 'light' | 'info' | 'warning' | 'success' | 'error' | 'primary' }> = {
  borrador: { label: 'Borrador', color: 'light' },
  abierta: { label: 'Abierta', color: 'primary' },
  en_transito: { label: 'En Tránsito', color: 'info' },
  completada: { label: 'Completada', color: 'warning' },
  liquidada: { label: 'Liquidada', color: 'success' },
  cancelada: { label: 'Cancelada', color: 'error' },
};

export default function DetalleOperacionComercialPage() {
  const router = useRouter();
  const params = useParams();
  const opId = parseInt(params.id as string);

  const [operation, setOperation] = useState<CommercialOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [syncingHolded, setSyncingHolded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (opId) {
      loadOperation();
    }
  }, [opId]);

  const handleSyncHolded = async () => {
    if (!operation) return;
    try {
      setSyncingHolded(true);
      setError(null);
      const res = await commercialOperationService.syncOperationToHolded(operation.id);
      setSuccess(res.message);
      toast.success(res.message);
      await loadOperation();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Error al sincronizar con Holded.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSyncingHolded(false);
    }
  };

  const loadOperation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commercialOperationService.getById(opId);
      if (!data) {
        setError('No se encontró la operación comercial solicitada.');
      } else {
        setOperation(data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar la operación comercial.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEstado = async (nuevoEstado: EstadoOperacionComercial) => {
    if (!operation) return;
    try {
      await commercialOperationService.update(operation.id, { estado: nuevoEstado });
      const msg = `Estado actualizado a ${nuevoEstado.toUpperCase()}.`;
      setSuccess(msg);
      toast.success(msg);
      await loadOperation();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      const msg = 'Error al actualizar el estado de la operación.';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDownloadPDF = async () => {
    if (!operation) return;
    try {
      setDownloadingPDF(true);
      const doc = await generateCommercialOperationPDF(operation);
      doc.save(`Liquidacion_${operation.numero_operacion}.pdf`);
      const msg = 'Documento de liquidación descargado correctamente.';
      setSuccess(msg);
      toast.success(msg);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error(err);
      const msg = 'Error al generar el PDF de liquidación.';
      setError(msg);
      toast.error(msg);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDelete = async () => {
    if (!operation) return;
    if (!confirm('¿Confirma la eliminación definitiva de esta operación comercial?')) return;
    try {
      await commercialOperationService.delete(operation.id);
      toast.success('Operación comercial eliminada correctamente.');
      router.push('/residuos/operaciones');
    } catch (err) {
      console.error(err);
      const msg = 'Error al eliminar la operación comercial.';
      setError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-gray-500">Cargando operación comercial...</p>
        </div>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="space-y-4">
        <Alert variant="error" title="No encontrada" message="La operación no existe o no tiene permisos para verla." />
        <Button onClick={() => router.push('/residuos/operaciones')}>
          Volver a Operaciones
        </Button>
      </div>
    );
  }

  const estConfig = ESTADO_CONFIG[operation.estado] || { label: operation.estado, color: 'light' };
  const ton = (operation.cantidad_real_t && operation.cantidad_real_t > 0 ? operation.cantidad_real_t : operation.cantidad_estimada_t) || 0;
  const esPositivo = (operation.margen_bruto_total || 0) >= 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/residuos/operaciones')}>
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                {operation.numero_operacion}
              </h1>
              <Badge variant="light" color={estConfig.color} size="sm">
                {estConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Fecha de Registro: {new Date(operation.fecha).toLocaleDateString('es-ES')} • Agente y Negociante
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400"
          >
            {downloadingPDF ? 'Generando PDF...' : 'Liquidación PDF'}
          </Button>

          {operation.estado === 'abierta' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangeEstado('en_transito')}
            >
              Iniciar Tránsito
            </Button>
          )}

          {operation.estado === 'en_transito' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangeEstado('completada')}
            >
              Marcar Completada
            </Button>
          )}

          {operation.estado === 'completada' && (
            <Button
              size="sm"
              onClick={() => handleChangeEstado('liquidada')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Liquidar Operación
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Eliminar
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" title="Error" message={error} />}
      {success && <Alert variant="success" title="Completado" message={success} />}

      {/* Tarjeta de Rentabilidad y Margen */}
      <div className={`p-6 rounded-2xl shadow-sm border ${
        esPositivo
          ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
          : 'bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/60 dark:border-gray-700">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Liquidación de Rentabilidad Económica
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              Volumen computado: <span className="font-bold">{ton.toFixed(3)} toneladas</span> {operation.cantidad_real_t ? '(verificado en báscula)' : '(peso estimado)'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-gray-500">Margen Bruto Total</span>
            <p className={`text-3xl font-extrabold ${esPositivo ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
              {(operation.margen_bruto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </p>
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {(operation.margen_unitario_tonelada || 0).toFixed(2)} €/t • {(operation.porcentaje_margen || 0).toFixed(1)}% margen
            </p>
          </div>
        </div>

        {/* Cascada de Desglose Financiero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 font-medium">+ Ingreso Venta</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {(operation.ingreso_venta_total || 0).toFixed(2)} €
            </p>
            <p className="text-[10.5px] text-gray-400">
              {(operation.precio_unitario_venta || 0).toFixed(2)} € / {operation.tipo_precio_venta === 'por_tonelada' ? 't' : operation.tipo_precio_venta}
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 font-medium">- Coste Compra</span>
            <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
              {(operation.coste_compra_total || 0).toFixed(2)} €
            </p>
            <p className="text-[10.5px] text-gray-400">
              {(operation.precio_unitario_compra || 0).toFixed(2)} € / {operation.tipo_precio_compra === 'por_tonelada' ? 't' : operation.tipo_precio_compra}
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 font-medium">- Porte Transporte</span>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">
              {(operation.coste_transporte || 0).toFixed(2)} €
            </p>
            <p className="text-[10.5px] text-gray-400">Flete logístico</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 font-medium">- Otros Costes</span>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">
              {(operation.otros_costes || 0).toFixed(2)} €
            </p>
            <p className="text-[10.5px] text-gray-400">{operation.descripcion_otros_costes || 'Tasas / Cánones'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloque: Trazabilidad Física y Residuo */}
        <ComponentCard title="Trazabilidad Física y Ambiental">
          <div className="space-y-4 text-xs">
            {/* Residuo */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-primary">{operation.codigo_ler}</span>
                {operation.peligrosidad === 'peligroso' && (
                  <Badge variant="light" color="warning" size="sm">Peligroso (HP)</Badge>
                )}
                {operation.operacion_rd && (
                  <Badge variant="light" color="info" size="sm">{operation.operacion_rd}</Badge>
                )}
              </div>
              <p className="font-medium text-gray-800 dark:text-gray-200">{operation.descripcion_residuo}</p>
            </div>

            {/* Partes físicas */}
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 font-medium">Productor (Origen Físico):</label>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {operation.origen_nombre_personalizado || operation.origen_productor?.razon_social || '-'}
                </p>
                <p className="text-gray-400 text-[11px]">
                  {operation.origen_nima ? `NIMA: ${operation.origen_nima}` : ''} {operation.origen_cif ? `| CIF: ${operation.origen_cif}` : ''}
                </p>
              </div>

              <div>
                <label className="text-gray-500 font-medium">Gestor (Destino de Tratamiento):</label>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {operation.destino_nombre_personalizado || operation.destino_gestor?.razon_social || '-'}
                </p>
                <p className="text-gray-400 text-[11px]">
                  {operation.destino_autorizacion ? `Autorización: ${operation.destino_autorizacion}` : ''}
                </p>
              </div>

              <div>
                <label className="text-gray-500 font-medium">Transportista:</label>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {operation.transportista_nombre_personalizado || operation.transportista?.razon_social || '-'}
                </p>
                <p className="text-gray-400 text-[11px]">
                  {operation.transportista_matricula ? `Matrícula: ${operation.transportista_matricula}` : ''}
                </p>
              </div>

              {/* DI Vinculado */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <label className="text-gray-500 font-medium">Documento de Identificación (DI):</label>
                {operation.identification_document_id ? (
                  <div className="mt-1">
                    <Link
                      href={`/residuos/documentos-identificacion/${operation.identification_document_id}`}
                      className="inline-flex items-center gap-1.5 text-primary font-mono font-semibold hover:underline"
                    >
                      DI #{operation.identification_document_id} {operation.numero_albaran_gestor ? `(Albarán: ${operation.numero_albaran_gestor})` : ''} ↗
                    </Link>
                  </div>
                ) : (
                  <p className="text-gray-400 mt-1">Sin DI oficial vinculado</p>
                )}
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Bloque: Condiciones Comerciales */}
        <ComponentCard title="Condiciones Comerciales y de Facturación">
          <div className="space-y-4 text-xs">
            {/* Proveedor Comercial */}
            <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 space-y-2">
              <span className="font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                Proveedor Comercial (Compra)
              </span>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {operation.proveedor_razon_social || operation.proveedor_comercial?.razon_social || '-'}
              </p>
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 pt-1">
                <span>Precio Unitario: {(operation.precio_unitario_compra || 0).toFixed(2)} €</span>
                <span className="font-bold text-red-600">Total: {(operation.coste_compra_total || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1 border-t border-red-100 dark:border-red-900/30">
                <span>Ref. Factura: {operation.factura_compra_ref || 'Pendiente'}</span>
                <span>Estado Pago: {operation.estado_pago_compra}</span>
              </div>
            </div>

            {/* Cliente Comercial */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Cliente Comercial (Venta)
              </span>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {operation.cliente_razon_social || operation.cliente_comercial?.razon_social || '-'}
              </p>
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 pt-1">
                <span>Precio Unitario: {(operation.precio_unitario_venta || 0).toFixed(2)} €</span>
                <span className="font-bold text-emerald-600">Total: {(operation.ingreso_venta_total || 0).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1 border-t border-emerald-100 dark:border-emerald-900/30">
                <span className="flex items-center gap-1.5">
                  Ref. Factura: {operation.factura_venta_ref ? (
                    <Badge variant="light" color="success" size="sm">
                      {operation.factura_venta_ref}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">Pendiente</span>
                  )}
                </span>
                <span>Estado Cobro: {operation.estado_cobro_venta}</span>
              </div>
              <div className="pt-2 flex justify-between items-center border-t border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  Holded ERP Invoicing
                </span>
                <Button
                  size="sm"
                  variant={operation.factura_venta_ref ? "outline" : "primary"}
                  disabled={syncingHolded}
                  onClick={() => handleSyncHolded()}
                >
                  {syncingHolded ? 'Sincronizando...' : operation.factura_venta_ref ? 'Re-sincronizar Holded' : 'Emitir Factura Holded'}
                </Button>
              </div>
            </div>

            {/* Observaciones */}
            {operation.observaciones && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-1">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Observaciones:</span>
                <p className="text-gray-600 dark:text-gray-400">{operation.observaciones}</p>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
