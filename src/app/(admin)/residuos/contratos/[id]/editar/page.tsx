'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import wasteContractService from '@/services/wasteContractService';
import companyService from '@/services/companyService';
import type { WasteContract, Company, WasteContractFormData } from '@/types/wasteManagement';

const TIPOS_CONTRATO = [
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'recogida', label: 'Recogida' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'valoracion', label: 'Valoración' },
  { value: 'eliminacion', label: 'Eliminación' },
];

export default function EditarContratoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<WasteContract | null>(null);
  const [gestores, setGestores] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGestorForm, setShowGestorForm] = useState(false);

  const [formData, setFormData] = useState<WasteContractFormData>({
    company_id: 0,
    gestor_company_id: undefined,
    numero_contrato: '',
    fecha_contrato: new Date().toISOString().split('T')[0],
    fecha_inicio: '',
    fecha_fin: '',
    tipo_contrato: 'tratamiento',
    descripcion_residuos: '',
    operaciones_tratamiento: [],
    cantidad_maxima_anual: undefined,
    unidad_cantidad: 'toneladas',
    precio_unitario: undefined,
    moneda: 'EUR',
    estado: 'borrador',
    documento_url: '',
    notas: '',
  });

  const [newGestor, setNewGestor] = useState({
    razon_social: '',
    cif: '',
    nima: '',
    email: '',
    telefono: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar contrato
      const contractData = await wasteContractService.getById(parseInt(id));
      setContract(contractData);

      // Llenar formulario con datos del contrato
      if (contractData) {
        setFormData({
          company_id: contractData.company_id,
          gestor_company_id: contractData.gestor_company_id,
          numero_contrato: contractData.numero_contrato || '',
          fecha_contrato: contractData.fecha_contrato,
          fecha_inicio: contractData.fecha_inicio || '',
          fecha_fin: contractData.fecha_fin || '',
          tipo_contrato: contractData.tipo_contrato,
          descripcion_residuos: contractData.descripcion_residuos || '',
          operaciones_tratamiento: contractData.operaciones_tratamiento || [],
          cantidad_maxima_anual: contractData.cantidad_maxima_anual,
          unidad_cantidad: contractData.unidad_cantidad || 'toneladas',
          precio_unitario: contractData.precio_unitario,
          moneda: contractData.moneda || 'EUR',
          estado: contractData.estado,
          documento_url: contractData.documento_url || '',
          notas: contractData.notas || '',
        });
      }

      // Cargar gestores
      const allCompanies = await companyService.getAll();
      setGestores(allCompanies.filter((c) => c.tipo_empresa === 'gestor'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewGestor = async () => {
    if (!newGestor.razon_social || !newGestor.cif) {
      alert('Razón social y CIF son obligatorios');
      return;
    }

    try {
      const gestorData = {
        ...newGestor,
        tipo_empresa: 'gestor' as const,
        activo: true,
      };

      const created = await companyService.create(gestorData);
      setFormData((prev) => ({ ...prev, gestor_company_id: created.id }));
      setShowGestorForm(false);
      setNewGestor({ razon_social: '', cif: '', nima: '', email: '', telefono: '' });
      
      // Recargar gestores
      const allCompanies = await companyService.getAll();
      setGestores(allCompanies.filter((c) => c.tipo_empresa === 'gestor'));
    } catch (err: any) {
      alert(`Error al crear gestor: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fecha_contrato || !formData.tipo_contrato) {
      setError('Fecha de contrato y tipo son obligatorios');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Convertir cadenas vacías a undefined para campos de fecha y numéricos
      const cleanedData = {
        ...formData,
        fecha_inicio: formData.fecha_inicio || undefined,
        fecha_fin: formData.fecha_fin || undefined,
        cantidad_maxima_anual: formData.cantidad_maxima_anual || undefined,
        precio_unitario: formData.precio_unitario || undefined,
        gestor_company_id: formData.gestor_company_id || undefined,
      };

      await wasteContractService.update(parseInt(id), cleanedData);
      router.push(`/residuos/contratos/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredGestores = gestores.filter((g) =>
    g.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.cif.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <>
        <PageBreadCrumb pageTitle="Editar Contrato" />
        <div className="max-w-4xl mx-auto">
          <Alert variant="error" title="Error" message={error} />
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
      <PageBreadCrumb pageTitle={`Editar Contrato ${contract?.numero_contrato || `#${id}`}`} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">
            Editar Contrato
          </h2>
          <Button variant="outline" onClick={() => router.push(`/residuos/contratos/${id}`)}>
            ← Cancelar
          </Button>
        </div>

        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <ComponentCard title="Información General">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="numero_contrato" className="block text-sm font-medium mb-2">Número de Contrato</label>
                <Input
                  id="numero_contrato"
                  type="text"
                  value={formData.numero_contrato}
                  onChange={(e) => setFormData({ ...formData, numero_contrato: e.target.value })}
                  placeholder="Ej: CONT-2024-001"
                />
              </div>

              <div>
                <label htmlFor="tipo_contrato" className="block text-sm font-medium mb-2">
                  Tipo de Contrato <span className="text-red-500">*</span>
                </label>
                <Select
                  options={TIPOS_CONTRATO}
                  defaultValue={formData.tipo_contrato}
                  onChange={(value) => setFormData({ ...formData, tipo_contrato: value as any })}
                  placeholder="Selecciona una opción"
                />
              </div>

              <div>
                <label htmlFor="fecha_contrato" className="block text-sm font-medium mb-2">Fecha del Contrato</label>
                <Input
                  id="fecha_contrato"
                  type="date"
                  value={formData.fecha_contrato}
                  onChange={(e) => setFormData({ ...formData, fecha_contrato: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="estado" className="block text-sm font-medium mb-2">
                  Estado <span className="text-red-500">*</span>
                </label>
                <Select
                  options={[
                    { value: 'borrador', label: 'Borrador' },
                    { value: 'vigente', label: 'Vigente' },
                    { value: 'finalizado', label: 'Finalizado' },
                    { value: 'cancelado', label: 'Cancelado' },
                  ]}
                  defaultValue={formData.estado}
                  onChange={(value) => setFormData({ ...formData, estado: value as any })}
                  placeholder="Selecciona una opción"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="fecha_inicio" className="block text-sm font-medium mb-2">Fecha de Inicio (Vigencia)</label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="fecha_fin" className="block text-sm font-medium mb-2">Fecha de Fin (Vigencia)</label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                />
              </div>
            </div>
          </ComponentCard>

          {/* Empresa Gestora */}
          <ComponentCard title="Empresa Gestora">
            {!showGestorForm ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="search_gestor" className="block text-sm font-medium mb-2">Buscar Gestor</label>
                    <Input
                      id="search_gestor"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por razón social o CIF..."
                    />
                  </div>

                  <div>
                    <label htmlFor="gestor_company_id" className="block text-sm font-medium mb-2">
                      Seleccionar Gestor
                    </label>
                    <Select
                      options={[
                        { value: '', label: '-- Seleccionar --' },
                        ...filteredGestores.map((g) => ({
                          value: g.id.toString(),
                          label: `${g.razon_social} (${g.cif})${g.nima ? ' - NIMA: ' + g.nima : ''}`,
                        })),
                      ]}
                      defaultValue={formData.gestor_company_id?.toString() || ''}
                      onChange={(value) => setFormData({ ...formData, gestor_company_id: parseInt(value) || undefined })}
                      placeholder="Selecciona una opción"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowGestorForm(true)}
                  >
                    + Crear Nuevo Gestor
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Nuevo Gestor</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new_razon_social" className="block text-sm font-medium mb-2">Razón Social</label>
                    <Input
                      id="new_razon_social"
                      type="text"
                      value={newGestor.razon_social}
                      onChange={(e) => setNewGestor({ ...newGestor, razon_social: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="new_cif" className="block text-sm font-medium mb-2">CIF</label>
                    <Input
                      id="new_cif"
                      type="text"
                      value={newGestor.cif}
                      onChange={(e) => setNewGestor({ ...newGestor, cif: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="new_nima" className="block text-sm font-medium mb-2">NIMA</label>
                    <Input
                      id="new_nima"
                      type="text"
                      value={newGestor.nima}
                      onChange={(e) => setNewGestor({ ...newGestor, nima: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="new_email" className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      id="new_email"
                      type="email"
                      value={newGestor.email}
                      onChange={(e) => setNewGestor({ ...newGestor, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="new_telefono" className="block text-sm font-medium mb-2">Teléfono</label>
                    <Input
                      id="new_telefono"
                      type="text"
                      value={newGestor.telefono}
                      onChange={(e) => setNewGestor({ ...newGestor, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleSaveNewGestor}>
                    Guardar Gestor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowGestorForm(false);
                      setNewGestor({ razon_social: '', cif: '', nima: '', email: '', telefono: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>

          {/* Residuos y Condiciones */}
          <ComponentCard title="Residuos y Condiciones">
            <div className="space-y-4">
              <div>
                <label htmlFor="descripcion_residuos" className="block text-sm font-medium mb-2">Descripción de Residuos</label>
                <TextArea
                  value={formData.descripcion_residuos}
                  onChange={(value) => setFormData({ ...formData, descripcion_residuos: value })}
                  placeholder="Describe los tipos de residuos cubiertos por este contrato..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cantidad_maxima_anual" className="block text-sm font-medium mb-2">Cantidad Máxima Anual</label>
                  <Input
                    id="cantidad_maxima_anual"
                    type="number"
                    value={formData.cantidad_maxima_anual || ''}
                    onChange={(e) => setFormData({ ...formData, cantidad_maxima_anual: parseFloat(e.target.value) || undefined })}
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label htmlFor="unidad_cantidad" className="block text-sm font-medium mb-2">
                    Unidad
                  </label>
                  <Select
                    options={[
                      { value: 'toneladas', label: 'Toneladas' },
                      { value: 'kg', label: 'Kilogramos' },
                      { value: 'm3', label: 'Metros cúbicos' },
                      { value: 'litros', label: 'Litros' },
                      { value: 'unidades', label: 'Unidades' },
                    ]}
                    defaultValue={formData.unidad_cantidad}
                    onChange={(value) => setFormData({ ...formData, unidad_cantidad: value })}
                    placeholder="Selecciona una opción"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="precio_unitario" className="block text-sm font-medium mb-2">Precio Unitario</label>
                  <Input
                    id="precio_unitario"
                    type="number"
                    step={0.01}
                    value={formData.precio_unitario || ''}
                    onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) || undefined })}
                    placeholder="50.00"
                  />
                </div>

                <div>
                  <label htmlFor="moneda" className="block text-sm font-medium mb-2">
                    Moneda
                  </label>
                  <Select
                    options={[
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'GBP', label: 'GBP (£)' },
                    ]}
                    defaultValue={formData.moneda}
                    onChange={(value) => setFormData({ ...formData, moneda: value })}
                    placeholder="Selecciona una opción"
                  />
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Notas */}
          <ComponentCard title="Notas y Observaciones">
            <div>
              <label htmlFor="notas" className="block text-sm font-medium mb-2">Notas</label>
              <TextArea
                value={formData.notas}
                onChange={(value) => setFormData({ ...formData, notas: value })}
                placeholder="Observaciones adicionales sobre el contrato..."
                rows={4}
              />
            </div>
          </ComponentCard>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/residuos/contratos/${id}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
