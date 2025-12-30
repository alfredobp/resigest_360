'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import wasteContractService from '@/services/wasteContractService';
import companyService from '@/services/companyService';
import type { Company, WasteContractFormData } from '@/types/wasteManagement';

const TIPOS_CONTRATO = [
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'recogida', label: 'Recogida' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'valoracion', label: 'Valoración' },
  { value: 'eliminacion', label: 'Eliminación' },
];

export default function NuevoContratoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myCompany, setMyCompany] = useState<Company | null>(null);
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
    notas: '',
  });

  // Datos del gestor para crear uno nuevo
  const [gestorData, setGestorData] = useState({
    razon_social: '',
    cif: '',
    nima: '',
    direccion: '',
    telefono: '',
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
        setError('Debes registrar tu empresa antes de crear un contrato');
        router.push('/admin/residuos/mi-empresa');
        return;
      }
      
      setMyCompany(company);
      setFormData((prev) => ({ ...prev, company_id: company.id }));

      // Generar número de contrato automático
      const numeroContrato = wasteContractService.generateContractNumber(company.id);
      setFormData((prev) => ({ ...prev, numero_contrato: numeroContrato }));

      // Cargar lista de gestores disponibles
      const gestoresData = await companyService.getByType('gestor');
      setGestores(gestoresData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGestorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGestorData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchGestor = async () => {
    if (searchQuery.trim().length < 2) return;
    
    try {
      const results = await companyService.search(searchQuery);
      setGestores(results);
    } catch (err: any) {
      alert(`Error al buscar: ${err.message}`);
    }
  };

  const handleCreateGestor = async () => {
    if (!gestorData.razon_social || !gestorData.cif) {
      alert('La razón social y el CIF son obligatorios');
      return;
    }

    try {
      const newGestor = await companyService.create({
        razon_social: gestorData.razon_social,
        cif: gestorData.cif,
        nima: gestorData.nima,
        domicilio_social: gestorData.direccion,
        telefono: gestorData.telefono,
        tipo_empresa: 'gestor',
      });

      setGestores((prev) => [newGestor, ...prev]);
      setFormData((prev) => ({ ...prev, gestor_company_id: newGestor.id }));
      setShowGestorForm(false);
      setGestorData({ razon_social: '', cif: '', nima: '', direccion: '', telefono: '' });
    } catch (err: any) {
      alert(`Error al crear gestor: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.fecha_contrato) {
      setError('La fecha del contrato es obligatoria');
      return;
    }

    if (formData.fecha_inicio && formData.fecha_fin) {
      if (!wasteContractService.validateDates(formData.fecha_inicio, formData.fecha_fin)) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
    }

    try {
      setSaving(true);
      const newContract = await wasteContractService.create(formData);
      router.push(`/admin/residuos/contratos/${newContract.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Preparando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBreadCrumb
        pageTitle="Nuevo Contrato de Tratamiento"
      />

      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Datos del Contrato */}
          <ComponentCard title="Datos del Contrato">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Número de Contrato</label>
                <Input
                  name="numero_contrato"
                  value={formData.numero_contrato}
                  onChange={handleChange}
                  placeholder="Se genera automáticamente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha del Contrato *</label>
                <Input
                  name="fecha_contrato"
                  type="date"
                  value={formData.fecha_contrato}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Inicio</label>
                <Input
                  name="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Fin</label>
                <Input
                  name="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Contrato *</label>
                <select
                  name="tipo_contrato"
                  value={formData.tipo_contrato}
                  onChange={handleChange}
                  required
                  className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
                >
                  {TIPOS_CONTRATO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
                >
                  <option value="borrador">Borrador</option>
                  <option value="vigente">Vigente</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </ComponentCard>

          {/* Mi Empresa (Pre-rellenado) */}
          <ComponentCard title="Productor / Mi Empresa" className="mt-6">
            {myCompany && (
              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <p><strong>Razón Social:</strong> {myCompany.razon_social}</p>
                <p><strong>CIF:</strong> {myCompany.cif}</p>
                {myCompany.nima && <p><strong>NIMA:</strong> {myCompany.nima}</p>}
                {myCompany.domicilio_social && <p><strong>Domicilio:</strong> {myCompany.domicilio_social}</p>}
              </div>
            )}
            <p className="text-sm text-muted mt-3">
              Estos datos se rellenarán automáticamente en el contrato.{' '}
              <a href="/admin/residuos/mi-empresa" className="text-primary hover:underline">
                Editar mi empresa
              </a>
            </p>
          </ComponentCard>

          {/* Gestor / Destinatario */}
          <ComponentCard title="Gestor / Destinatario" className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seleccionar Gestor Existente
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por razón social, CIF o NIMA..."
                    className="flex-1 px-3 py-2 border border-stroke rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchGestor();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleSearchGestor}>
                    Buscar
                  </Button>
                </div>

                {gestores.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Gestor</label>
                    <select
                      name="gestor_company_id"
                      value={formData.gestor_company_id || ''}
                      onChange={handleChange}
                      className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
                    >
                      <option value="">Selecciona un gestor...</option>
                      {gestores.map((gestor) => (
                        <option key={gestor.id} value={gestor.id}>
                          {gestor.razon_social} - {gestor.cif}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="border-t border-stroke pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGestorForm(!showGestorForm)}
                >
                  {showGestorForm ? 'Cancelar' : '+ Crear Nuevo Gestor'}
                </Button>

                {showGestorForm && (
                  <div className="mt-4 p-4 bg-muted/20 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Razón Social *</label>
                      <Input
                        name="razon_social"
                        value={gestorData.razon_social}
                        onChange={handleGestorChange}
                        placeholder="Nombre de la empresa gestora"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">CIF *</label>
                        <Input
                          name="cif"
                          value={gestorData.cif}
                          onChange={handleGestorChange}
                          placeholder="B12345678"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">NIMA</label>
                        <Input
                          name="nima"
                          value={gestorData.nima}
                          onChange={handleGestorChange}
                          placeholder="1234567890AB"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Dirección</label>
                      <Input
                        name="direccion"
                        value={gestorData.direccion}
                        onChange={handleGestorChange}
                        placeholder="Dirección completa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Teléfono</label>
                      <Input
                        name="telefono"
                        value={gestorData.telefono}
                        onChange={handleGestorChange}
                        placeholder="954123456"
                      />
                    </div>
                    <Button type="button" onClick={handleCreateGestor}>
                      Crear Gestor
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ComponentCard>

          {/* Residuos y Condiciones */}
          <ComponentCard title="Residuos y Condiciones" className="mt-6">
            <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Descripción de Residuos</label>
              <TextArea
                value={formData.descripcion_residuos}
                onChange={(value) => setFormData(prev => ({ ...prev, descripcion_residuos: value }))}
                rows={3}
                placeholder="Describe los tipos de residuos cubiertos por el contrato..."
              />
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad Máxima Anual</label>
                  <Input
                    name="cantidad_maxima_anual"
                    type="number"
                    step={0.01}
                    value={formData.cantidad_maxima_anual || ''}
                    onChange={handleChange}
                    placeholder="Ej: 1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Unidad</label>
                  <select
                    name="unidad_cantidad"
                    value={formData.unidad_cantidad}
                    onChange={handleChange}
                    className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
                  >
                    <option value="toneladas">Toneladas</option>
                    <option value="kg">Kilogramos</option>
                    <option value="m3">Metros cúbicos</option>
                    <option value="litros">Litros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Precio Unitario</label>
                  <Input
                    name="precio_unitario"
                    type="number"
                    step={0.01}
                    value={formData.precio_unitario || ''}
                    onChange={handleChange}
                    placeholder="Ej: 150.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Moneda</label>
                  <select
                    name="moneda"
                    value={formData.moneda}
                    onChange={handleChange}
                    className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notas / Observaciones</label>
                <TextArea
                  value={formData.notas}
                  onChange={(value) => setFormData(prev => ({ ...prev, notas: value }))}
                  rows={4}
                  placeholder="Información adicional del contrato..."
                />
              </div>
            </div>
          </ComponentCard>

          {/* Botones de Acción */}
          <div className="mt-8 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/residuos/contratos')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creando...' : 'Crear Contrato'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
