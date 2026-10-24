'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import commercialOperationService, {
  calculateProfitability
} from '@/services/commercialOperationService';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import identificationDocumentService from '@/services/identificationDocumentService';
import {
  type CommercialOperationFormData,
  type Company,
  type ProductionCenter,
  type IdentificationDocument,
  TipoPrecioOperacion
} from '@/types/wasteManagement';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import LerSelector from '@/components/residuos/LerSelector';

export default function NuevaOperacionComercialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogos
  const [companies, setCompanies] = useState<Company[]>([]);
  const [centers, setCenters] = useState<ProductionCenter[]>([]);
  const [documents, setDocuments] = useState<IdentificationDocument[]>([]);

  // Form State
  const [formData, setFormData] = useState<CommercialOperationFormData>({
    fecha: new Date().toISOString().split('T')[0],
    estado: 'abierta',
    codigo_ler: '',
    descripcion_residuo: '',
    peligrosidad: 'no-peligroso',
    operacion_rd: 'R13',
    cantidad_estimada_t: 1.0,
    cantidad_real_t: 0,
    tipo_precio_compra: 'por_tonelada',
    precio_unitario_compra: 0,
    tipo_precio_venta: 'por_tonelada',
    precio_unitario_venta: 0,
    coste_transporte: 0,
    otros_costes: 0,
    descripcion_otros_costes: '',
    observaciones: ''
  });

  const loadCatalogs = async () => {
    try {
      const [comps, docs, myComp] = await Promise.all([
        companyService.getAllContacts(),
        identificationDocumentService.getAll(),
        companyService.getUserCompany()
      ]);

      const allComps = [...comps];
      if (myComp && !allComps.some(c => c.id === myComp.id)) {
        allComps.unshift(myComp);
      }
      setCompanies(allComps);
      setDocuments(docs);

      if (myComp) {
        const myCenters = await productionCenterService.getByCompanyId(myComp.id);
        setCenters(myCenters);
      }
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  // Cálculo en vivo de rentabilidad
  const simulation = useMemo(() => {
    return calculateProfitability(formData);
  }, [formData]);

  // Selección de código LER con ajuste de peligrosidad y descripción
  const handleLerChange = (code: string, wt?: any) => {
    const isPeligroso = code.includes('*') || wt?.peligroso || wt?.categoria === 'peligroso';
    setFormData(prev => ({
      ...prev,
      codigo_ler: code,
      descripcion_residuo: wt?.descripcion || prev.descripcion_residuo,
      peligrosidad: isPeligroso ? 'peligroso' : 'no-peligroso'
    }));
  };

  // Sincronización desde DI seleccionado
  const handleDISelect = (diIdStr: string) => {
    if (!diIdStr) {
      setFormData(prev => ({ ...prev, identification_document_id: undefined }));
      return;
    }
    const diId = Number(diIdStr);
    const selectedDI = documents.find(d => d.id === diId);
    if (!selectedDI) return;

    const ton = selectedDI.peso_destino_kg
      ? selectedDI.peso_destino_kg / 1000
      : selectedDI.peso_origen_kg
      ? selectedDI.peso_origen_kg / 1000
      : selectedDI.unidad === 'kg'
      ? selectedDI.cantidad / 1000
      : selectedDI.cantidad;

    setFormData(prev => ({
      ...prev,
      identification_document_id: selectedDI.id,
      codigo_ler: selectedDI.codigo_ler,
      descripcion_residuo: selectedDI.descripcion_residuo,
      peligrosidad: selectedDI.codigo_ler.includes('*') ? 'peligroso' : selectedDI.peligrosidad,
      operacion_rd: selectedDI.operacion_tratamiento || prev.operacion_rd,
      cantidad_estimada_t: Number(ton.toFixed(3)),
      cantidad_real_t: selectedDI.peso_destino_kg ? Number((selectedDI.peso_destino_kg / 1000).toFixed(3)) : prev.cantidad_real_t,
      origen_nombre_personalizado: selectedDI.productor_razon_social,
      origen_cif: selectedDI.productor_cif,
      origen_nima: selectedDI.productor_nima,
      destino_nombre_personalizado: selectedDI.gestor_razon_social,
      destino_cif: selectedDI.gestor_cif,
      destino_nima: selectedDI.gestor_nima,
      destino_autorizacion: selectedDI.gestor_numero_autorizacion,
      transportista_nombre_personalizado: selectedDI.transportista_razon_social,
      transportista_cif: selectedDI.transportista_cif,
      transportista_matricula: selectedDI.transportista_matricula,
      numero_albaran_gestor: selectedDI.numero_albaran_gestor
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.codigo_ler || !formData.descripcion_residuo) {
      setError('Por favor especifique el código LER y la descripción del residuo.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const created = await commercialOperationService.create(formData);
      router.push(`/residuos/operaciones/${created.id}`);
    } catch (err: any) {
      console.error(err);
      setError(`Error al crear la operación comercial: ${  err.message || ''}`);
      setLoading(false);
    }
  };

  const isRentable = simulation.margen_bruto_total >= 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Nueva Operación Comercial
            </h1>
            <p className="text-xs text-gray-500">
              Negociante y Agente • Conexión de trazabilidad de traslados con liquidación económica
            </p>
          </div>
        </div>

        <Button
          onClick={() => handleSubmit()}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {loading ? 'Guardando...' : 'Guardar Operación'}
        </Button>
      </div>

      {error && <Alert variant="error" title="Atención" message={error} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal: Formularios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bloque 1: Datos de Operación y Residuo */}
          <ComponentCard title="1. Datos de la Operación y Residuo">
            <div className="space-y-4">
              {/* Vínculo a DI opcional */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Vincular a Documento de Identificación (DI) existente (Opcional)
                </label>
                <select
                  value={formData.identification_document_id || ''}
                  onChange={(e) => handleDISelect(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                >
                  <option value="">-- No vincular / Crear operación manual directa --</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.numero_documento} | LER {d.codigo_ler} | {d.productor_razon_social} ➔ {d.gestor_razon_social} ({d.cantidad} {d.unidad})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Al seleccionar un DI se precargarán automáticamente el LER, productor, gestor, transportista y pesadas de báscula.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Operación *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as any }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  >
                    <option value="abierta">Abierta</option>
                    <option value="en_transito">En Tránsito</option>
                    <option value="borrador">Borrador</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Operación R/D Prevista
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. R13, R01, D10"
                    value={formData.operacion_rd || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, operacion_rd: e.target.value.toUpperCase() }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-mono bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* LER y Descripción */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Código LER *
                  </label>
                  <LerSelector
                    value={formData.codigo_ler}
                    onChange={(code, wt) => handleLerChange(code, wt)}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Descripción del Residuo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Denominación del residuo"
                    value={formData.descripcion_residuo}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion_residuo: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Cantidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad Estimada (Toneladas) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={formData.cantidad_estimada_t || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cantidad_estimada_t: Number(e.target.value) }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-bold bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad Real en Báscula (Toneladas)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.000 si aún no ha sido pesado"
                    value={formData.cantidad_real_t || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cantidad_real_t: Number(e.target.value) }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-mono bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Bloque 2: Trazabilidad Física */}
          <ComponentCard title="2. Trazabilidad Física del Traslado (Origen ➔ Logística ➔ Destino)">
            <div className="space-y-4">
              {/* Productor Origen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Productor Físico (Instalación de Origen)
                  </label>
                  <input
                    type="text"
                    placeholder="Razón Social del productor físico"
                    value={formData.origen_nombre_personalizado || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, origen_nombre_personalizado: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    NIMA de Origen
                  </label>
                  <input
                    type="text"
                    placeholder="NIMA origen"
                    value={formData.origen_nima || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, origen_nima: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-mono bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Gestor Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Gestor Destinatario (Planta de Tratamiento)
                  </label>
                  <input
                    type="text"
                    placeholder="Razón Social de la planta gestora"
                    value={formData.destino_nombre_personalizado || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, destino_nombre_personalizado: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nº de Autorización Ambiental del Gestor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. G-0001/ES"
                    value={formData.destino_autorizacion || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, destino_autorizacion: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-mono bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Transportista */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Empresa Transportista
                  </label>
                  <input
                    type="text"
                    placeholder="Transportista logístico"
                    value={formData.transportista_nombre_personalizado || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, transportista_nombre_personalizado: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Matrícula del Vehículo
                  </label>
                  <input
                    type="text"
                    placeholder="0000-XXX"
                    value={formData.transportista_matricula || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, transportista_matricula: e.target.value.toUpperCase() }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-mono bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Bloque 3: Liquidación Comercial (Compra y Venta) */}
          <ComponentCard title="3. Condiciones Económicas (Flujo Comercial)">
            <div className="space-y-4">
              {/* COMPRA */}
              <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                    Condiciones de Compra (Proveedor Comercial)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Proveedor Comercial
                    </label>
                    <input
                      type="text"
                      placeholder="Empresa a quien se compra"
                      value={formData.proveedor_razon_social || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, proveedor_razon_social: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Modalidad de Precio
                    </label>
                    <select
                      value={formData.tipo_precio_compra}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_precio_compra: e.target.value as any }))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                    >
                      <option value="por_tonelada">Precio por Tonelada (€/t)</option>
                      <option value="lote_fijo">Lote / Portes Fijo (€)</option>
                      <option value="por_kg">Precio por Kilo (€/kg)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio Unitario Compra (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio_unitario_compra || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, precio_unitario_compra: Number(e.target.value) }))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-bold text-red-600 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* VENTA */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Condiciones de Venta (Cliente Comercial)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cliente Comercial
                    </label>
                    <input
                      type="text"
                      placeholder="Empresa a quien se vende"
                      value={formData.cliente_razon_social || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_razon_social: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Modalidad de Precio
                    </label>
                    <select
                      value={formData.tipo_precio_venta}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_precio_venta: e.target.value as any }))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                    >
                      <option value="por_tonelada">Precio por Tonelada (€/t)</option>
                      <option value="lote_fijo">Lote / Importe Fijo (€)</option>
                      <option value="por_kg">Precio por Kilo (€/kg)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio Unitario Venta (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio_unitario_venta || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, precio_unitario_venta: Number(e.target.value) }))}
                      className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-bold text-emerald-600 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Flete y Otros Costes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Coste de Transporte / Flete (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.coste_transporte || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, coste_transporte: Number(e.target.value) }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Otros Costes Accesorios (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.otros_costes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, otros_costes: Number(e.target.value) }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Concepto de Otros Costes
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Canon de vertedero, análisis"
                    value={formData.descripcion_otros_costes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion_otros_costes: e.target.value }))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Observaciones Comerciales y Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Condiciones de pago, acuerdos especiales..."
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Columna Lateral: Tarjeta Fija de Rentabilidad en Vivo */}
        <div className="space-y-6">
          <div className="sticky top-6 space-y-4">
            <div className={`p-5 rounded-2xl shadow-sm border transition-all ${
              isRentable
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                : 'bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 dark:border-gray-700">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                  Rentabilidad en Vivo
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isRentable
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                }`}>
                  {isRentable ? 'Positivo' : 'Negativo'}
                </span>
              </div>

              <div className="py-4 text-center">
                <p className="text-xs text-gray-500 font-medium">Margen Bruto Total Resultante</p>
                <p className={`text-3xl font-extrabold mt-1 ${isRentable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
                  {simulation.margen_bruto_total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-bold">{simulation.margen_unitario_tonelada.toFixed(2)} €</span> por tonelada ({simulation.porcentaje_margen.toFixed(1)}% margen)
                </p>
              </div>

              {/* Cascada de Costes */}
              <div className="space-y-2 pt-2 border-t border-gray-200/60 dark:border-gray-700 text-xs">
                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>+ Ingreso Venta:</span>
                  <span>{simulation.ingreso_venta_total.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center text-red-600 dark:text-red-400 font-medium">
                  <span>- Coste Compra:</span>
                  <span>{simulation.coste_compra_total.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span>- Transporte (Flete):</span>
                  <span>{simulation.coste_transporte.toFixed(2)} €</span>
                </div>
                {simulation.otros_costes > 0 && (
                  <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                    <span>- Otros Costes:</span>
                    <span>{simulation.otros_costes.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600 font-bold text-gray-900 dark:text-white">
                  <span>Volumen Computado:</span>
                  <span>{simulation.toneladas.toFixed(3)} t</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 font-semibold"
            >
              {loading ? 'Guardando...' : 'Crear Operación'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
