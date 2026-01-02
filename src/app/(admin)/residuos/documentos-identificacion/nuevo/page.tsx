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
import type { IdentificationDocument, Company, WasteContract } from '@/types/wasteManagement';
import DatePicker from '@/components/form/date-picker';

export default function NuevoDocumentoIdentificacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [contracts, setContracts] = useState<WasteContract[]>([]);
  const [gestores, setGestores] = useState<Company[]>([]);
  const [transportistas, setTransportistas] = useState<Company[]>([]);

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

      // Pre-rellenar datos del productor
      setFormData(prev => ({
        ...prev,
        company_id: company.id,
        productor_razon_social: company.razon_social,
        productor_cif: company.cif,
        productor_nima: company.nima || '',
        productor_direccion: company.domicilio_social || '',
        productor_codigo_postal: company.codigo_postal_social || '',
        productor_municipio: company.municipio_social || '',
        productor_provincia: company.provincia_social || '',
        productor_telefono: company.telefono || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.gestor_razon_social || !formData.gestor_cif) {
      setError('Los datos del gestor son obligatorios');
      return;
    }

    if (!formData.codigo_ler || !formData.descripcion_residuo) {
      setError('Los datos del residuo son obligatorios');
      return;
    }

    if (!formData.cantidad || formData.cantidad <= 0) {
      setError('La cantidad debe ser mayor que 0');
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

          {/* Datos del Residuo */}
          <ComponentCard title="Datos del Residuo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="codigo_ler" className="block text-sm font-medium mb-2">Código LER *</label>
                <Input
                  id="codigo_ler"
                  type="text"
                  value={formData.codigo_ler || ''}
                  onChange={(e) => setFormData({ ...formData, codigo_ler: e.target.value })}
                  placeholder="Ej: 160106"
                  required
                />
              </div>

              <div>
                <label htmlFor="peligrosidad" className="block text-sm font-medium mb-2">Peligrosidad *</label>
                <Select
                  options={[
                    { value: 'no-peligroso', label: 'No Peligroso' },
                    { value: 'peligroso', label: 'Peligroso' },
                  ]}
                  defaultValue={formData.peligrosidad}
                  onChange={(value) => setFormData({ ...formData, peligrosidad: value as any })}
                  placeholder="Selecciona una opción"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="descripcion_residuo" className="block text-sm font-medium mb-2">Descripción del Residuo *</label>
                <TextArea
                  value={formData.descripcion_residuo || ''}
                  onChange={(value) => setFormData({ ...formData, descripcion_residuo: value })}
                  rows={2}
                  placeholder="Describe el tipo de residuo..."
                />
              </div>

              <div>
                <label htmlFor="estado_fisico" className="block text-sm font-medium mb-2">Estado Físico *</label>
                <Select
                  options={[
                    { value: 'solido', label: 'Sólido' },
                    { value: 'liquido', label: 'Líquido' },
                    { value: 'pastoso', label: 'Pastoso' },
                    { value: 'gaseoso', label: 'Gaseoso' },
                  ]}
                  defaultValue={formData.estado_fisico}
                  onChange={(value) => setFormData({ ...formData, estado_fisico: value as any })}
                  placeholder="Selecciona una opción"
                />
              </div>

              <div>
                <label htmlFor="operacion_tratamiento" className="block text-sm font-medium mb-2">Operación de Tratamiento</label>
                <Input
                  id="operacion_tratamiento"
                  type="text"
                  value={formData.operacion_tratamiento || ''}
                  onChange={(e) => setFormData({ ...formData, operacion_tratamiento: e.target.value })}
                  placeholder="Ej: R05, D01"
                />
              </div>
            </div>
          </ComponentCard>

          {/* Cantidad y Envases */}
          <ComponentCard title="Cantidad y Envases">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cantidad" className="block text-sm font-medium mb-2">Cantidad *</label>
                <Input
                  id="cantidad"
                  type="number"
                  step={0.001}
                  value={formData.cantidad || ''}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label htmlFor="unidad" className="block text-sm font-medium mb-2">Unidad *</label>
                <Select
                  options={[
                    { value: 'kg', label: 'Kilogramos (kg)' },
                    { value: 'toneladas', label: 'Toneladas' },
                    { value: 'litros', label: 'Litros' },
                    { value: 'm3', label: 'Metros cúbicos (m³)' },
                    { value: 'unidades', label: 'Unidades' },
                  ]}
                  defaultValue={formData.unidad}
                  onChange={(value) => setFormData({ ...formData, unidad: value as any })}
                  placeholder="Selecciona una opción"
                />
              </div>

              <div>
                <label htmlFor="numero_envases" className="block text-sm font-medium mb-2">Número de Envases</label>
                <Input
                  id="numero_envases"
                  type="number"
                  value={formData.numero_envases || ''}
                  onChange={(e) => setFormData({ ...formData, numero_envases: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label htmlFor="tipo_envases" className="block text-sm font-medium mb-2">Tipo de Envases</label>
                <Input
                  id="tipo_envases"
                  type="text"
                  value={formData.tipo_envases || ''}
                  onChange={(e) => setFormData({ ...formData, tipo_envases: e.target.value })}
                  placeholder="Ej: Contenedor 1000L, Big Bag, Bidón"
                />
              </div>

              <div>
                <label htmlFor="fecha_recogida" className="block text-sm font-medium mb-2">Fecha de Recogida</label>
                <DatePicker
                  id="fecha_recogida"
               
                  defaultDate={formData.fecha_recogida || ''}
                  onChange={(e) => setFormData({ ...formData, fecha_recogida: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="fecha_entrega" className="block text-sm font-medium mb-2">Fecha de Entrega</label>
                <DatePicker
                  id="fecha_entrega"
                  
                  defaultDate={formData.fecha_entrega || ''}
                  onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
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
