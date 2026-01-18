'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import identificationDocumentService from '@/services/identificationDocumentService';
import companyService from '@/services/companyService';
import wasteContractService from '@/services/wasteContractService';
import productionCenterService from '@/services/productionCenterService';
import wasteTypeService from '@/services/wasteTypeService';
import type { IdentificationDocument, Company, WasteContract, ProductionCenter, WasteType, IdentificationDocumentItem } from '@/types/wasteManagement';
import DatePicker from '@/components/form/date-picker';
import { Plus, Trash2 } from 'lucide-react';

export default function NuevoDocumentoIdentificacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [contracts, setContracts] = useState<WasteContract[]>([]);
  const [gestores, setGestores] = useState<Company[]>([]);
  const [transportistas, setTransportistas] = useState<Company[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);

  const [formData, setFormData] = useState<Partial<IdentificationDocument>>({
    tipo_notificacion: 'sin-notificacion',
    fecha_documento: new Date().toISOString().split('T')[0],
    estado_fisico: 'solido',
    peligrosidad: 'no-peligroso',
    unidad: 'kg',
    estado: 'borrador',
    firmado_productor: false,
    firmado_gestor: false,
    firmado_transportista: false,
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<Partial<IdentificationDocumentItem>>({
    unidad: 'kg',
    estado_fisico: 'solido',
    peligrosidad: 'no-peligroso',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar mi empresa
      const company = await companyService.getUserCompany();
      if (!company) {
        router.push('/residuos/mi-empresa');
        return;
      }

      setMyCompany(company);

      // Cargar centros de producción
      const centers = await productionCenterService.getByCompanyId(company.id);
      setProductionCenters(centers);

      // Pre-rellenar datos del productor
      setFormData(prev => ({
        ...prev,
        company_id: company.id,
        productor_razon_social: company.razon_social,
        productor_cif: company.cif,
        numero_documento: identificationDocumentService.generateDocumentNumber(company.nima || company.cif),
      }));

      // Cargar contratos vigentes
      const contractsData = await wasteContractService.getActive();
      setContracts(contractsData);

      // Cargar gestores y transportistas
      const gestoresData = await companyService.getByType('gestor');
      const transportistasData = await companyService.getByType('transportista');
      setGestores(gestoresData);
      setTransportistas(transportistasData);

      // Cargar tipos de residuos (LER)
      const wasteTypesData = await wasteTypeService.getAll();
      setWasteTypes(wasteTypesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContractChange = (contractId: string) => {
    const contract = contracts.find(c => c.id === parseInt(contractId));
    if (contract && contract.gestor_company) {
      setFormData(prev => ({
        ...prev,
        contract_id: contract.id,
        gestor_razon_social: contract.gestor_company!.razon_social,
        gestor_cif: contract.gestor_company!.cif,
        gestor_nima: contract.gestor_company!.nima || '',
        gestor_numero_autorizacion: '',
        gestor_direccion: contract.gestor_company!.domicilio_social || '',
        gestor_codigo_postal: contract.gestor_company!.codigo_postal_social || '',
        gestor_municipio: contract.gestor_company!.municipio_social || '',
        gestor_provincia: contract.gestor_company!.provincia_social || '',
        gestor_telefono: contract.gestor_company!.telefono || '',
      }));
    }
  };

  const handleGestorChange = (gestorId: string) => {
    const gestor = gestores.find(g => g.id === parseInt(gestorId));
    if (gestor) {
      setFormData(prev => ({
        ...prev,
        gestor_razon_social: gestor.razon_social,
        gestor_cif: gestor.cif,
        gestor_nima: gestor.nima || '',
        gestor_numero_autorizacion: gestor.numero_inscripcion || '',
        gestor_direccion: gestor.domicilio_social || '',
        gestor_codigo_postal: gestor.codigo_postal_social || '',
        gestor_municipio: gestor.municipio_social || '',
        gestor_provincia: gestor.provincia_social || '',
        gestor_telefono: gestor.telefono || '',
      }));
    }
  };

  const handleTransportistaChange = (transportistaId: string) => {
    const transportista = transportistas.find(t => t.id === parseInt(transportistaId));
    if (transportista) {
      setFormData(prev => ({
        ...prev,
        transportista_razon_social: transportista.razon_social,
        transportista_cif: transportista.cif,
        transportista_telefono: transportista.telefono || '',
      }));
    }
  };

  const addResidue = () => {
    if (!currentItem.codigo_ler || !currentItem.cantidad) {
      alert('Completa el código LER y la cantidad');
      return;
    }

    const newItem: IdentificationDocumentItem = {
      codigo_ler: currentItem.codigo_ler!,
      descripcion_residuo: currentItem.descripcion_residuo || '',
      cantidad: currentItem.cantidad!,
      unidad: currentItem.unidad as any || 'kg',
      peligrosidad: currentItem.peligrosidad as any || 'no-peligroso',
      estado_fisico: currentItem.estado_fisico as any || 'solido',
      operacion_tratamiento: currentItem.operacion_tratamiento,
      waste_type_id: currentItem.waste_type_id,
      numero_envases: currentItem.numero_envases,
      tipo_envases: currentItem.tipo_envases,
    };

    setFormData(prev => {
      const currentItems = prev.items || [];
      const newItems = [...currentItems, newItem];

      return {
        ...prev,
        items: newItems,
        // Poblar campos principales con el primer item por compatibilidad
        ...(currentItems.length === 0 ? {
          codigo_ler: newItem.codigo_ler,
          descripcion_residuo: newItem.descripcion_residuo,
          cantidad: newItem.cantidad,
          unidad: newItem.unidad,
          peligrosidad: newItem.peligrosidad,
          estado_fisico: newItem.estado_fisico,
          waste_type_id: newItem.waste_type_id,
          operacion_tratamiento: newItem.operacion_tratamiento,
        } : {})
      };
    });

    setCurrentItem({
      unidad: 'kg',
      estado_fisico: 'solido',
      peligrosidad: 'no-peligroso',
    });
  };

  const removeResidue = (index: number) => {
    setFormData(prev => {
      const newItems = prev.items?.filter((_, i) => i !== index) || [];
      return {
        ...prev,
        items: newItems,
        // Si borramos el primero, actualizar los campos principales con el nuevo primero si existe
        ...(index === 0 ? {
          codigo_ler: newItems[0]?.codigo_ler || '',
          descripcion_residuo: newItems[0]?.descripcion_residuo || '',
          cantidad: newItems[0]?.cantidad || 0,
          unidad: newItems[0]?.unidad || 'kg',
          peligrosidad: newItems[0]?.peligrosidad || 'no-peligroso',
          estado_fisico: newItems[0]?.estado_fisico || 'solido',
          waste_type_id: newItems[0]?.waste_type_id,
          operacion_tratamiento: newItems[0]?.operacion_tratamiento,
        } : {})
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.production_center_id) {
      setError('Debes seleccionar un centro de producción');
      return;
    }
    if (!formData.gestor_razon_social || !formData.gestor_cif) {
      setError('Los datos del gestor son obligatorios');
      return;
    }

    if (!formData.items || formData.items.length === 0) {
      setError('Debes añadir al menos un residuo al documento');
      return;
    }

    try {
      setSaving(true);
      const created = await identificationDocumentService.create(formData);
      router.push(`/residuos/documentos-identificacion/${created.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Nuevo Documento de Identificación" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">
            Nuevo Documento de Identificación (DI)
          </h2>
          <Button variant="outline" onClick={() => router.push('/residuos/documentos-identificacion')}>
            ← Cancelar
          </Button>
        </div>

        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Documento */}
          <ComponentCard title="Datos del Documento">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="numero_documento" className="block text-sm font-medium mb-2">Número de Documento</label>
                <Input
                  id="numero_documento"
                  type="text"
                  value={formData.numero_documento || ''}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="fecha_documento" className="block text-sm font-medium mb-2">Fecha del Documento</label>
                <Input
                  id="fecha_documento"
                  type="date"
                  value={formData.fecha_documento}
                  onChange={(e) => setFormData({ ...formData, fecha_documento: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="production_center_id" className="block text-sm font-medium mb-2">Centro de Producción *</label>
                <Select
                  options={[
                    { value: '', label: '-- Seleccionar Centro --' },
                    ...productionCenters.map(pc => ({
                      value: pc.id.toString(),
                      label: `${pc.nombre} (${pc.nima})`,
                    })),
                  ]}
                  defaultValue={formData.production_center_id?.toString() || ''}
                  onChange={(value) => {
                    const center = productionCenters.find(c => c.id === parseInt(value));
                    if (center) {
                      setFormData({
                        ...formData,
                        production_center_id: center.id,
                        productor_nima: center.nima,
                        productor_direccion: center.direccion,
                        // El resto de campos se pueden mantener de la empresa o dejar vacíos
                      });
                    } else {
                      setFormData({ ...formData, production_center_id: undefined });
                    }
                  }}
                  placeholder="Selecciona el origen del residuo"
                />
              </div>

              <div>
                <label htmlFor="contract_id" className="block text-sm font-medium mb-2">Contrato de Referencia (Opcional)</label>
                <Select
                  options={[
                    { value: '', label: '-- Seleccionar --' },
                    ...contracts.map(c => ({
                      value: c.id.toString(),
                      label: `${c.numero_contrato || `#${c.id}`} - ${c.gestor_company?.razon_social || 'Sin gestor'}`,
                    })),
                  ]}
                  defaultValue={formData.contract_id?.toString() || ''}
                  onChange={(value) => handleContractChange(value)}
                  placeholder="Selecciona un contrato"
                />
              </div>
            </div>
          </ComponentCard>

          {/* Productor (Pre-rellenado) */}
          <ComponentCard title="Productor / Origen">
            <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Razón Social:</strong> {formData.productor_razon_social}</p>
              <p><strong>CIF:</strong> {formData.productor_cif}</p>
              {formData.productor_nima && <p><strong>NIMA:</strong> {formData.productor_nima}</p>}
              {formData.productor_direccion && <p><strong>Dirección:</strong> {formData.productor_direccion}</p>}
            </div>
          </ComponentCard>

          {/* Gestor/Destinatario */}
          <ComponentCard title="Gestor / Destinatario">
            <div className="space-y-4">
              <div>
                <label htmlFor="gestor_select" className="block text-sm font-medium mb-2">Seleccionar Gestor</label>
                <Select
                  options={[
                    { value: '', label: '-- Seleccionar --' },
                    ...gestores.map(g => ({
                      value: g.id.toString(),
                      label: `${g.razon_social} - ${g.cif}`,
                    })),
                  ]}
                  defaultValue=""
                  onChange={(value) => handleGestorChange(value)}
                  placeholder="Selecciona un gestor"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gestor_razon_social" className="block text-sm font-medium mb-2">Razón Social *</label>
                  <Input
                    id="gestor_razon_social"
                    type="text"
                    value={formData.gestor_razon_social || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_razon_social: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gestor_cif" className="block text-sm font-medium mb-2">CIF *</label>
                  <Input
                    id="gestor_cif"
                    type="text"
                    value={formData.gestor_cif || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_cif: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gestor_nima" className="block text-sm font-medium mb-2">NIMA</label>
                  <Input
                    id="gestor_nima"
                    type="text"
                    value={formData.gestor_nima || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_nima: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="gestor_numero_autorizacion" className="block text-sm font-medium mb-2">Nº Autorización</label>
                  <Input
                    id="gestor_numero_autorizacion"
                    type="text"
                    value={formData.gestor_numero_autorizacion || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_numero_autorizacion: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Transportista (Opcional) */}
          <ComponentCard title="Transportista (Opcional)">
            <div className="space-y-4">
              <div>
                <label htmlFor="transportista_select" className="block text-sm font-medium mb-2">Seleccionar Transportista</label>
                <Select
                  options={[
                    { value: '', label: '-- Seleccionar --' },
                    ...transportistas.map(t => ({
                      value: t.id.toString(),
                      label: `${t.razon_social} - ${t.cif}`,
                    })),
                  ]}
                  defaultValue=""
                  onChange={(value) => handleTransportistaChange(value)}
                  placeholder="Selecciona un transportista"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="transportista_razon_social" className="block text-sm font-medium mb-2">Razón Social</label>
                  <Input
                    id="transportista_razon_social"
                    type="text"
                    value={formData.transportista_razon_social || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_razon_social: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="transportista_cif" className="block text-sm font-medium mb-2">CIF</label>
                  <Input
                    id="transportista_cif"
                    type="text"
                    value={formData.transportista_cif || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_cif: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="transportista_matricula" className="block text-sm font-medium mb-2">Matrícula</label>
                  <Input
                    id="transportista_matricula"
                    type="text"
                    value={formData.transportista_matricula || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_matricula: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Sección de Residuos (Múltiples) */}
          <ComponentCard title="Residuos en este Documento">
            <div className="space-y-6">
              {/* Selector de nuevo residuo */}
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-muted-foreground/30">
                <h4 className="text-sm font-semibold mb-4 text-primary">Añadir Residuo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Código LER *</label>
                    <Select
                      options={[
                        { value: '', label: '-- Seleccionar LER --' },
                        ...wasteTypes.map(wt => ({
                          value: wt.id.toString(),
                          label: `${wt.codigo_ler} - ${wt.descripcion.substring(0, 40)}...`,
                        })),
                      ]}
                      defaultValue={wasteTypes.find(wt => wt.codigo_ler === currentItem.codigo_ler)?.id.toString() || ''}
                      onChange={(value) => {
                        const wt = wasteTypes.find(w => w.id === parseInt(value));
                        if (wt) {
                          setCurrentItem({
                            ...currentItem,
                            waste_type_id: wt.id,
                            codigo_ler: wt.codigo_ler,
                            descripcion_residuo: wt.descripcion,
                            peligrosidad: wt.categoria,
                            estado_fisico: wt.estado,
                            operacion_tratamiento: wt.operaciones_permitidas?.[0] || '',
                          });
                        }
                      }}
                      placeholder="Busca el residuo..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Cantidad *</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step={0.001}
                        value={currentItem.cantidad || ''}
                        onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseFloat(e.target.value) })}
                        placeholder="0.000"
                        className="flex-1"
                      />
                      <select
                        value={currentItem.unidad || 'kg'}
                        onChange={(e) => setCurrentItem({ ...currentItem, unidad: e.target.value as any })}
                        className="w-24 h-11 text-sm rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="kg">kg</option>
                        <option value="toneladas">t</option>
                        <option value="litros">L</option>
                        <option value="m3">m³</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addResidue}
                      className="w-full"
                      variant="primary"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Añadir a la Lista
                    </Button>
                  </div>
                </div>

                {currentItem.codigo_ler && (
                  <div className="mt-3 text-xs text-muted-foreground p-2 bg-white/50 dark:bg-black/20 rounded border border-muted/20">
                    <p><strong>Descripción:</strong> {currentItem.descripcion_residuo}</p>
                    <div className="flex gap-4 mt-1">
                      <span><strong>Peligrosidad:</strong> {currentItem.peligrosidad}</span>
                      <span><strong>Estado:</strong> {currentItem.estado_fisico}</span>
                      <span><strong>Op. Tratamiento:</strong> {currentItem.operacion_tratamiento}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de residuos añadidos */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Residuo (LER)</th>
                      <th className="px-4 py-3 text-right">Cantidad</th>
                      <th className="px-4 py-3">Peligrosidad</th>
                      <th className="px-4 py-3">Op. Tratamiento</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/20">
                    {formData.items && formData.items.length > 0 ? (
                      formData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{item.codigo_ler}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{item.descripcion_residuo}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {item.cantidad} {item.unidad}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${item.peligrosidad === 'peligroso'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              }`}>
                              {item.peligrosidad}
                            </span>
                          </td>
                          <td className="px-4 py-3">{item.operacion_tratamiento || '-'}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeResidue(index)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar residuo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                          No has añadido ningún residuo todavía. Utiliza el formulario superior.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ComponentCard>

          {/* Fechas y Otros Datos */}
          <ComponentCard title="Fechas y Logística">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fecha_recogida" className="block text-sm font-medium mb-2">Fecha de RecogidaEstimada</label>
                <DatePicker
                  id="fecha_recogida"
                  defaultDate={formData.fecha_recogida || ''}
                  onChange={([date]) => setFormData({ ...formData, fecha_recogida: date ? date.toISOString().split('T')[0] : '' })}
                />
              </div>

              <div>
                <label htmlFor="fecha_entrega" className="block text-sm font-medium mb-2">Fecha de Entrega Estimada</label>
                <DatePicker
                  id="fecha_entrega"
                  defaultDate={formData.fecha_entrega || ''}
                  onChange={([date]) => setFormData({ ...formData, fecha_entrega: date ? date.toISOString().split('T')[0] : '' })}
                />
              </div>
            </div>
          </ComponentCard>

          {/* Notas */}
          <ComponentCard title="Notas y Observaciones">
            <div>
              <label htmlFor="notas" className="block text-sm font-medium mb-2">Notas</label>
              <TextArea
                value={formData.notas || ''}
                onChange={(value) => setFormData({ ...formData, notas: value })}
                rows={3}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </ComponentCard>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/residuos/documentos-identificacion')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Documento'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
