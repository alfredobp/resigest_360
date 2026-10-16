'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Alert from '@/components/ui/alert/Alert';
import authorizationService from '@/services/authorizationService';
import type {
  Company,
  ProductionCenter,
  EnvironmentalAuthorization,
  AuthorizationWasteCodeFormData,
} from '@/types/wasteManagement';

interface AutorizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company: Company;
  centers?: ProductionCenter[];
  authorizationToEdit?: EnvironmentalAuthorization | null;
}

export default function AutorizacionModal({
  isOpen,
  onClose,
  onSuccess,
  company,
  centers = [],
  authorizationToEdit = null,
}: AutorizacionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos principales
  const [numeroAutorizacion, setNumeroAutorizacion] = useState('');
  const [titulo, setTitulo] = useState('');
  const [organismoEmisor, setOrganismoEmisor] = useState('');
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [esIndefinida, setEsIndefinida] = useState(false);
  const [archivoUrl, setArchivoUrl] = useState('');
  const [notas, setNotas] = useState('');

  // Matriz de alcance LER
  const [wasteCodes, setWasteCodes] = useState<AuthorizationWasteCodeFormData[]>([
    { codigo_ler: '', descripcion_ler: '', operaciones_tratamiento: ['R13'] },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (authorizationToEdit) {
        setNumeroAutorizacion(authorizationToEdit.numero_autorizacion || '');
        setTitulo(authorizationToEdit.titulo || '');
        setOrganismoEmisor(authorizationToEdit.organismo_emisor || '');
        setSelectedCenterId(authorizationToEdit.production_center_id || null);
        setFechaEmision(authorizationToEdit.fecha_emision || '');
        setFechaVencimiento(authorizationToEdit.fecha_vencimiento || '');
        setEsIndefinida(authorizationToEdit.es_indefinida || false);
        setArchivoUrl(authorizationToEdit.archivo_url || '');
        setNotas(authorizationToEdit.notas || '');

        if (authorizationToEdit.waste_codes && authorizationToEdit.waste_codes.length > 0) {
          setWasteCodes(
            authorizationToEdit.waste_codes.map((wc) => ({
              codigo_ler: wc.codigo_ler,
              descripcion_ler: wc.descripcion_ler || '',
              operaciones_tratamiento: wc.operaciones_tratamiento || [],
              capacidad_anual_toneladas: wc.capacidad_anual_toneladas,
            }))
          );
        } else {
          setWasteCodes([{ codigo_ler: '', descripcion_ler: '', operaciones_tratamiento: ['R13'] }]);
        }
      } else {
        setNumeroAutorizacion('');
        setTitulo(`Autorización Ambiental - ${company.razon_social}`);
        setOrganismoEmisor('');
        setSelectedCenterId(null);
        setFechaEmision(new Date().toISOString().split('T')[0]);
        setFechaVencimiento('');
        setEsIndefinida(true);
        setArchivoUrl('');
        setNotas('');
        setWasteCodes([{ codigo_ler: '', descripcion_ler: '', operaciones_tratamiento: ['R13'] }]);
      }
      setError(null);
    }
  }, [isOpen, authorizationToEdit, company]);

  const handleAddWasteCode = () => {
    setWasteCodes((prev) => [
      ...prev,
      { codigo_ler: '', descripcion_ler: '', operaciones_tratamiento: ['R13'] },
    ]);
  };

  const handleRemoveWasteCode = (index: number) => {
    setWasteCodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWasteCodeChange = (
    index: number,
    field: keyof AuthorizationWasteCodeFormData,
    value: any
  ) => {
    setWasteCodes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!numeroAutorizacion.trim()) {
      setError('El número de autorización ambiental es obligatorio.');
      return;
    }

    if (!titulo.trim()) {
      setError('El título o denominación de la autorización es obligatorio.');
      return;
    }

    // Filtrar LERs válidos
    const validWasteCodes = wasteCodes
      .filter((wc) => wc.codigo_ler.trim().length > 0)
      .map((wc) => ({
        ...wc,
        codigo_ler: wc.codigo_ler.trim(),
        operaciones_tratamiento: wc.operaciones_tratamiento.filter(Boolean),
      }));

    if (validWasteCodes.length === 0) {
      setError('Debes incluir al menos un código LER autorizado con su operación de tratamiento.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        company_id: company.id,
        production_center_id: selectedCenterId,
        numero_autorizacion: numeroAutorizacion.trim(),
        titulo: titulo.trim(),
        organismo_emisor: organismoEmisor.trim() || undefined,
        fecha_emision: fechaEmision || undefined,
        fecha_vencimiento: esIndefinida ? undefined : (fechaVencimiento || undefined),
        es_indefinida: esIndefinida,
        archivo_url: archivoUrl.trim() || undefined,
        notas: notas.trim() || undefined,
        waste_codes: validWasteCodes,
      };

      if (authorizationToEdit) {
        await authorizationService.update(authorizationToEdit.id, payload);
      } else {
        await authorizationService.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la autorización ambiental');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/40">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📜</span>
              {authorizationToEdit ? 'Editar Autorización Ambiental' : 'Nueva Autorización Ambiental'}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Empresa gestora: <strong className="text-foreground">{company.razon_social}</strong> ({company.cif})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <Alert variant="error" title="Error de Validación" message={error} />}

          {/* Datos Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nº de Autorización Ambiental *</Label>
              <Input
                value={numeroAutorizacion}
                onChange={(e) => setNumeroAutorizacion(e.target.value)}
                placeholder="Ej: 123/G-01/VAL ó AAI/2024/008"
                required
              />
            </div>

            <div>
              <Label>Instalación / Centro Específico</Label>
              <select
                className="w-full h-11 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:outline-hidden"
                value={selectedCenterId || ''}
                onChange={(e) => setSelectedCenterId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">🏢 Todas las instalaciones (Autorización general)</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    📍 {c.nombre} ({c.municipio || 'S/D'}) - NIMA: {c.nima}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Denominación / Título de la Autorización *</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Autorización de Gestor de Residuos No Peligrosos y Valorización R13"
                required
              />
            </div>

            <div>
              <Label>Organismo Emisor / Comunidad Autónoma</Label>
              <Input
                value={organismoEmisor}
                onChange={(e) => setOrganismoEmisor(e.target.value)}
                placeholder="Ej: Conselleria de Medi Ambient - GVA"
              />
            </div>

            <div>
              <Label>Enlace o Archivo del Documento (PDF)</Label>
              <Input
                value={archivoUrl}
                onChange={(e) => setArchivoUrl(e.target.value)}
                placeholder="URL de descarga o almacenamiento del PDF"
              />
            </div>

            {/* Vigencia */}
            <div>
              <Label>Fecha de Emisión</Label>
              <Input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>Fecha de Vencimiento</Label>
                <label className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esIndefinida}
                    onChange={(e) => setEsIndefinida(e.target.checked)}
                    className="rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span>Vigencia Indefinida</span>
                </label>
              </div>
              <Input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                disabled={esIndefinida}
                className={esIndefinida ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}
              />
            </div>
          </div>

          {/* Matriz LER y Operaciones de Tratamiento */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span> Matriz de Residuos y Operaciones Autorizadas
                </h4>
                <p className="text-xs text-muted">
                  Define los códigos LER y las operaciones autorizadas (R o D) en destino para validar los traslados y contratos.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleAddWasteCode}>
                + Añadir LER
              </Button>
            </div>

            <div className="space-y-3">
              {wasteCodes.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col md:flex-row items-start md:items-center gap-3"
                >
                  <div className="w-full md:w-36">
                    <Label className="text-xs mb-1">Código LER *</Label>
                    <Input
                      placeholder="15 01 01"
                      value={item.codigo_ler}
                      onChange={(e) => handleWasteCodeChange(idx, 'codigo_ler', e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-full md:flex-1">
                    <Label className="text-xs mb-1">Descripción del Residuo</Label>
                    <Input
                      placeholder="Envases de papel y cartón"
                      value={item.descripcion_ler || ''}
                      onChange={(e) => handleWasteCodeChange(idx, 'descripcion_ler', e.target.value)}
                    />
                  </div>

                  <div className="w-full md:w-56">
                    <Label className="text-xs mb-1">Operaciones R/D (separadas por coma)</Label>
                    <Input
                      placeholder="R03, R13, D10"
                      value={item.operaciones_tratamiento.join(', ')}
                      onChange={(e) =>
                        handleWasteCodeChange(
                          idx,
                          'operaciones_tratamiento',
                          e.target.value.split(',').map((op) => op.trim().toUpperCase())
                        )
                      }
                      required
                    />
                  </div>

                  {wasteCodes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWasteCode(idx)}
                      className="mt-4 md:mt-5 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      title="Eliminar este residuo"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label>Observaciones o Limitaciones Técnicas</Label>
            <textarea
              className="w-full p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:outline-hidden"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Límite de acopio máximo simultáneo de 500 toneladas; autorización condicionada a informe favorable anual."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : authorizationToEdit ? 'Actualizar Autorización' : 'Guardar Autorización'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
