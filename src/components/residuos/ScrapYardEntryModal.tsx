'use client';

// ==============================================================================
// RESIGEST 360 - ENTRADA DE BÁSCULA MULTIMATERIAL (UXDEV-09 / UX-14 A UX-18)
// Permite registrar múltiples materiales (líneas LER con kg y precio €/kg)
// en una única visita a planta, con ticket conjunto y asientos cronológicos enlazados.
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';
import { scrapYardService, calculateMultiMaterialTotals, generateScaleTicketNumber } from '@/services/scrapYardService';
import type { ScrapYardEntry, ScrapYardMaterialLine, ScrapYardEntryFormData } from '@/types/wasteManagement';
import { Scale, Plus, Trash2, Printer, CheckCircle2, RotateCcw } from 'lucide-react';
import companyService from '@/services/companyService';

interface ScrapYardEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (entry: ScrapYardEntry) => void;
}

const COMMON_METALS = [
  { code: '17 04 05', label: '17 04 05 - Hierro y acero' },
  { code: '17 04 01', label: '17 04 01 - Cobre, bronce, latón' },
  { code: '17 04 02', label: '17 04 02 - Aluminio' },
  { code: '17 04 03', label: '17 04 03 - Plomo' },
  { code: '17 04 04', label: '17 04 04 - Zinc' },
  { code: '17 04 07', label: '17 04 07 - Metales mezclados' },
  { code: '16 01 17', label: '16 01 17 - Metales férreos (VFU)' },
  { code: '16 01 18', label: '16 01 18 - Metales no férreos (VFU)' },
  { code: '19 12 02', label: '19 12 02 - Metales férreos (Tratamiento)' },
  { code: '19 12 03', label: '19 12 03 - Metales no férreos (Tratamiento)' },
];

export default function ScrapYardEntryModal({
  isOpen,
  onClose,
  onSuccess
}: ScrapYardEntryModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedEntry, setSavedEntry] = useState<ScrapYardEntry | null>(null);
  const [userCompany, setUserCompany] = useState<any>(null);

  // Form State
  const [ticketNumero, setTicketNumero] = useState('');
  const [fecha, setFecha] = useState('');
  const [proveedorTipo, setProveedorTipo] = useState<'particular' | 'empresa'>('particular');
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [proveedorNif, setProveedorNif] = useState('');
  const [proveedorDireccion, setProveedorDireccion] = useState('');
  const [proveedorMunicipio, setProveedorMunicipio] = useState('');
  const [proveedorProvincia, setProveedorProvincia] = useState('');
  const [vehiculoMatricula, setVehiculoMatricula] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Líneas de materiales (mínimo 1)
  const [lines, setLines] = useState<ScrapYardMaterialLine[]>([]);

  // Reiniciar formulario limpiando datos de proveedor para cada nueva entrega (UX-18)
  const resetForm = () => {
    setTicketNumero(generateScaleTicketNumber());
    setFecha(new Date().toISOString().split('T')[0]);
    setProveedorTipo('particular');
    setProveedorNombre('');
    setProveedorNif('');
    setProveedorDireccion('');
    setProveedorMunicipio('');
    setProveedorProvincia('');
    setVehiculoMatricula('');
    setObservaciones('');
    setSavedEntry(null);
    setError(null);
    // Arrancar con una línea inicial de hierro por defecto pero sin peso predeterminado (arranca vacío/0)
    setLines([
      {
        id: `mat-${Date.now()}-1`,
        codigo_ler: '17 04 05',
        descripcion_residuo: 'Hierro y acero',
        peligrosidad: 'no-peligroso',
        operacion_rd: 'R13',
        peso_kg: 0,
        precio_eur_kg: 0,
      }
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      companyService.getUserCompany().then(setUserCompany).catch(() => {});
    }
  }, [isOpen]);

  const totals = useMemo(() => {
    return calculateMultiMaterialTotals(lines);
  }, [lines]);

  const handleAddLine = () => {
    setLines(prev => [
      ...prev,
      {
        id: `mat-${Date.now()}-${prev.length + 1}`,
        codigo_ler: '17 04 01',
        descripcion_residuo: 'Cobre, bronce, latón',
        peligrosidad: 'no-peligroso',
        operacion_rd: 'R13',
        peso_kg: 0,
        precio_eur_kg: 0,
      }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof ScrapYardMaterialLine, value: any) => {
    setLines(prev => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      // Si cambia el LER, actualizar descripción y peligrosidad
      if (field === 'codigo_ler') {
        const found = COMMON_METALS.find(m => m.code === value);
        if (found) {
          target.descripcion_residuo = found.label.split(' - ')[1] || target.descripcion_residuo;
        }
        target.peligrosidad = String(value).includes('*') ? 'peligroso' : 'no-peligroso';
      }

      next[index] = target;
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (!proveedorNombre.trim()) {
        setError('Debe especificar el nombre o razón social del proveedor remitente.');
        return;
      }

      for (const [idx, l] of lines.entries()) {
        if (!l.codigo_ler.trim()) {
          setError(`Línea ${idx + 1}: Debe seleccionar el residuo / LER.`);
          return;
        }
        if (!l.peso_kg || l.peso_kg <= 0) {
          setError(`Línea ${idx + 1} (${l.descripcion_residuo || l.codigo_ler}): El peso neto debe ser mayor a 0 kg.`);
          return;
        }
      }

      setSaving(true);

      const payload: ScrapYardEntryFormData = {
        fecha,
        ticket_numero: ticketNumero,
        proveedor_tipo: proveedorTipo,
        proveedor_nombre: proveedorNombre.trim(),
        proveedor_nif: proveedorNif.trim(),
        proveedor_direccion: proveedorDireccion.trim() || undefined,
        proveedor_municipio: proveedorMunicipio.trim() || undefined,
        proveedor_provincia: proveedorProvincia.trim() || undefined,
        vehiculo_matricula: vehiculoMatricula.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        lineas: lines
      };

      const result = await scrapYardService.registerMultiMaterialEntry(payload);
      setSavedEntry(result);
      toast.success(`Entrada en báscula ${result.ticket_numero} guardada con éxito (${result.total_kg} kg).`);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar la entrada en báscula.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!savedEntry) return;
    const printHtml = scrapYardService.generateScaleTicketPrintHTML(savedEntry, userCompany);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Nueva Entrada (Báscula / Recepción)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Recepción multimaterial y compraventa en báscula de chatarrería (RD 553/2020 & Art. 64 Ley 7/2022).
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">Ticket Báscula</span>
            <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
              {ticketNumero}
            </span>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Atención requerida" message={error} />
        )}

        {/* Vista si ya fue guardada con éxito */}
        {savedEntry ? (
          <div className="space-y-6 py-4">
            <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  ¡Entrada Registrada en Báscula Correctamente!
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-md">
                  Se ha generado el ticket <strong>{savedEntry.ticket_numero}</strong> con {savedEntry.lineas.length} materiales ({savedEntry.total_kg} kg) y se han creado sus correspondientes asientos cronológicos de recepción enlazados.
                </p>
              </div>

              <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-left text-xs space-y-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Proveedor:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{savedEntry.proveedor_nombre} ({savedEntry.proveedor_nif || 'S/D'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Peso Total Neto:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{savedEntry.total_kg} kg ({(savedEntry.total_kg / 1000).toFixed(3)} t)</span>
                </div>
                {savedEntry.total_importe_eur > 0 && (
                  <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-1.5 font-semibold">
                    <span className="text-gray-600 dark:text-gray-300">Total Liquidación Compra:</span>
                    <span className="text-gray-900 dark:text-white">{savedEntry.total_importe_eur.toFixed(2)} €</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={handlePrint}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-medium flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ticket de Báscula
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nueva Entrega en Báscula
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Formulario de Nueva Entrada */
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {/* Bloque 1: Cabecera de la Entrega */}
            <div className="bg-gray-50/60 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200/80 dark:border-gray-700/60 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                1. Datos del Proveedor y Visita
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Tipo de Proveedor *</Label>
                  <select
                    value={proveedorTipo}
                    onChange={(e) => setProveedorTipo(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="particular">Particular (DNI)</option>
                    <option value="empresa">Empresa / Autónomo (CIF)</option>
                  </select>
                </div>

                <div>
                  <Label>Razón Social / Nombre y Apellidos *</Label>
                  <Input
                    placeholder={proveedorTipo === 'particular' ? 'Ej. Juan Pérez García' : 'Ej. Talleres Metálicos SL'}
                    value={proveedorNombre}
                    onChange={(e) => setProveedorNombre(e.target.value)}
                  />
                </div>

                <div>
                  <Label>DNI / NIE / CIF *</Label>
                  <Input
                    placeholder={proveedorTipo === 'particular' ? '12345678Z' : 'B12345678'}
                    value={proveedorNif}
                    onChange={(e) => setProveedorNif(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Fecha Recepción *</Label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label>Matrícula Vehículo (Opcional)</Label>
                  <Input
                    placeholder="Ej. 1234-XYZ"
                    value={vehiculoMatricula}
                    onChange={(e) => setVehiculoMatricula(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Población / Procedencia (Opcional)</Label>
                  <Input
                    placeholder="Ej. Toledo"
                    value={proveedorMunicipio}
                    onChange={(e) => setProveedorMunicipio(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Líneas de Materiales Multimaterial */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                    2. Materiales Pesados en Báscula (Multimaterial)
                  </span>
                  <p className="text-[11px] text-gray-500">
                    Registre cada fracción pesada con sus kg netos y precio opcional en €/kg.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLine}
                  className="text-xs flex items-center gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Añadir Material
                </Button>
              </div>

              <div className="space-y-2.5">
                {lines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Línea #{idx + 1}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Eliminar material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Selector LER */}
                      <div className="sm:col-span-5">
                        <Label>Residuo / Código LER *</Label>
                        <select
                          value={line.codigo_ler}
                          onChange={(e) => handleLineChange(idx, 'codigo_ler', e.target.value)}
                          className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {COMMON_METALS.map(m => (
                            <option key={m.code} value={m.code}>{m.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Peso en KG (vacío o 0 por defecto, sin forzar 1 t) */}
                      <div className="sm:col-span-3">
                        <Label>Peso Neto (kg) *</Label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={line.peso_kg || ''}
                            onChange={(e) => handleLineChange(idx, 'peso_kg', parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 p-2 pr-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="absolute right-2.5 top-2 text-xs font-semibold text-gray-400">kg</span>
                        </div>
                      </div>

                      {/* Precio Unitario €/kg (Opcional) */}
                      <div className="sm:col-span-2">
                        <Label>Precio (€/kg)</Label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.00"
                            value={line.precio_eur_kg || ''}
                            onChange={(e) => handleLineChange(idx, 'precio_eur_kg', parseFloat(e.target.value) || 0)}
                            className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 p-2 pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-gray-400">€/kg</span>
                        </div>
                      </div>

                      {/* Subtotal Línea */}
                      <div className="sm:col-span-2 text-right">
                        <span className="text-[10px] text-gray-400 block">Subtotal</span>
                        <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200">
                          {line.peso_kg && line.precio_eur_kg
                            ? `${(line.peso_kg * line.precio_eur_kg).toFixed(2)} €`
                            : '0,00 €'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloque 3: Resumen Conjunto del Ticket */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block font-medium">
                  Resumen Conjunto de Entrega
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {lines.length} material(es) · Generará {lines.length} asiento(s) cronológico(s) vinculado(s)
                </span>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-xs text-gray-500 block">Total Báscula:</span>
                  <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                    {totals.total_kg.toLocaleString('es-ES', { minimumFractionDigits: 1 })} kg
                  </span>
                </div>
                {totals.total_importe_eur > 0 && (
                  <div className="border-l border-gray-200 dark:border-gray-700 pl-6">
                    <span className="text-xs text-gray-500 block">Total Compra:</span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {totals.total_importe_eur.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
              >
                {saving ? 'Guardando Entrada...' : 'Confirmar y Generar Ticket'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

