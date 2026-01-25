'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';
import ImageUpload from '@/components/common/ImageUpload';
import Alert from '@/components/ui/alert/Alert';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import type { Company, CompanyFormData, ProductionCenter, ProductionCenterFormData } from '@/types/wasteManagement';
import { Trash2, Plus, MapPin } from 'lucide-react';

const TIPOS_EMPRESA = [
  { value: 'productor', label: 'Productor' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'transportista', label: 'Transportista' },
  { value: 'negociante', label: 'Negociante' },
  { value: 'agente', label: 'Agente' },
];

export default function MiEmpresaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estado para el nuevo centro de producción
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [centerFormData, setCenterFormData] = useState<ProductionCenterFormData>({
    nombre: '',
    direccion: '',
    nima: '',
    municipio: '',
    provincia: '',
    codigo_postal: '',
    descripcion: '',
  });

  const [formData, setFormData] = useState<CompanyFormData>({
    razon_social: '',
    nombre_comercial: '',
    cif: '',
    nima: '',
    numero_inscripcion: '',
    domicilio_social: '',
    codigo_postal_social: '',
    municipio_social: '',
    provincia_social: '',
    domicilio_instalacion: '',
    codigo_postal_instalacion: '',
    municipio_instalacion: '',
    provincia_instalacion: '',
    telefono: '',
    email: '',
    persona_contacto: '',
    tipo_empresa: 'productor',
    logo_url: '',
    notas: '',
    sira_usuario: '',
    sira_password: '',
    sira_activo: false,
  });

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await companyService.getUserCompany();
      if (data) {
        setCompany(data);
        setFormData({
          razon_social: data.razon_social,
          nombre_comercial: data.nombre_comercial || '',
          cif: data.cif,
          nima: data.nima || '',
          numero_inscripcion: data.numero_inscripcion || '',
          domicilio_social: data.domicilio_social || '',
          codigo_postal_social: data.codigo_postal_social || '',
          municipio_social: data.municipio_social || '',
          provincia_social: data.provincia_social || '',
          domicilio_instalacion: data.domicilio_instalacion || '',
          codigo_postal_instalacion: data.codigo_postal_instalacion || '',
          municipio_instalacion: data.municipio_instalacion || '',
          provincia_instalacion: data.provincia_instalacion || '',
          telefono: data.telefono || '',
          email: data.email || '',
          persona_contacto: data.persona_contacto || '',
          tipo_empresa: data.tipo_empresa,
          logo_url: data.logo_url || '',
          notas: data.notas || '',
          sira_usuario: data.sira_usuario || '',
          sira_password: data.sira_password || '',
          sira_activo: data.sira_activo || false,
        });

        // Cargar centros de producción
        const centers = await productionCenterService.getByCompanyId(data.id);
        setProductionCenters(centers);
      }
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

  const handleLogoUpload = async (url: string) => {
    setFormData((prev) => ({ ...prev, logo_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!formData.razon_social.trim()) {
      setError('La razón social es obligatoria');
      return;
    }

    if (!formData.cif.trim()) {
      setError('El CIF es obligatorio');
      return;
    }

    try {
      setSaving(true);

      if (company) {
        // Actualizar empresa existente
        await companyService.update(company.id, formData);
        setSuccess('Empresa actualizada correctamente');
      } else {
        // Crear nueva empresa
        const newCompany = await companyService.create(formData);
        setCompany(newCompany);
        setSuccess('Empresa creada correctamente');
      }

      // Recargar datos
      await loadCompany();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      setSaving(true);
      await productionCenterService.create({
        ...centerFormData,
        company_id: company.id,
      });

      setSuccess('Centro de producción añadido correctamente');
      setCenterFormData({ nombre: '', direccion: '', nima: '', municipio: '', provincia: '', codigo_postal: '', descripcion: '' });
      setShowCenterForm(false);

      // Recargar centros
      const centers = await productionCenterService.getByCompanyId(company.id);
      setProductionCenters(centers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCenter = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este centro de producción?')) return;

    try {
      await productionCenterService.delete(id);
      setSuccess('Centro de producción eliminado');
      setProductionCenters(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Cargando datos de la empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBreadCrumb
        pageTitle="Mi Empresa"
      />

      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert variant="success" title="Éxito" message={success} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Datos Básicos */}
          <ComponentCard title="Datos Básicos de la Empresa">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Razón Social *</label>
                <Input
                  name="razon_social"
                  value={formData.razon_social}
                  onChange={handleChange}
                  required
                  placeholder="Ej: EMPRESA GESTORA DE RESIDUOS S.L."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nombre Comercial</label>
                <Input
                  name="nombre_comercial"
                  value={formData.nombre_comercial}
                  onChange={handleChange}
                  placeholder="Ej: EcoGest"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CIF *</label>
                <Input
                  name="cif"
                  value={formData.cif}
                  onChange={handleChange}
                  required
                  placeholder="Ej: B12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">NIMA</label>
                <Input
                  name="nima"
                  value={formData.nima}
                  onChange={handleChange}
                  placeholder="Ej: 1234567890AB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Número de Inscripción</label>
                <Input
                  name="numero_inscripcion"
                  value={formData.numero_inscripcion}
                  onChange={handleChange}
                  placeholder="Número de inscripción en registro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Empresa *</label>
                <select
                  name="tipo_empresa"
                  value={formData.tipo_empresa}
                  onChange={handleChange}
                  required
                  className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
                >
                  {TIPOS_EMPRESA.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ComponentCard>

          {/* Domicilio Social */}
          <ComponentCard title="Domicilio Social" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Dirección</label>
                <Input
                  name="domicilio_social"
                  value={formData.domicilio_social}
                  onChange={handleChange}
                  placeholder="Calle, número, piso, puerta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Código Postal</label>
                <Input
                  name="codigo_postal_social"
                  value={formData.codigo_postal_social}
                  onChange={handleChange}
                  placeholder="Ej: 41001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Municipio</label>
                <Input
                  name="municipio_social"
                  value={formData.municipio_social}
                  onChange={handleChange}
                  placeholder="Ej: Sevilla"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Provincia</label>
                <Input
                  name="provincia_social"
                  value={formData.provincia_social}
                  onChange={handleChange}
                  placeholder="Ej: Sevilla"
                />
              </div>
            </div>
          </ComponentCard>

          {/* Domicilio de Instalación */}
          <ComponentCard title="Domicilio de Instalación" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Dirección</label>
                <Input
                  name="domicilio_instalacion"
                  value={formData.domicilio_instalacion}
                  onChange={handleChange}
                  placeholder="Calle, número, piso, puerta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Código Postal</label>
                <Input
                  name="codigo_postal_instalacion"
                  value={formData.codigo_postal_instalacion}
                  onChange={handleChange}
                  placeholder="Ej: 41001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Municipio</label>
                <Input
                  name="municipio_instalacion"
                  value={formData.municipio_instalacion}
                  onChange={handleChange}
                  placeholder="Ej: Sevilla"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Provincia</label>
                <Input
                  name="provincia_instalacion"
                  value={formData.provincia_instalacion}
                  onChange={handleChange}
                  placeholder="Ej: Sevilla"
                />
              </div>
            </div>
          </ComponentCard>

          {/* Datos de Contacto */}
          <ComponentCard title="Datos de Contacto" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <Input
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 954123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ej: contacto@empresa.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Persona de Contacto</label>
                <Input
                  name="persona_contacto"
                  value={formData.persona_contacto}
                  onChange={handleChange}
                  placeholder="Nombre y apellidos del responsable"
                />
              </div>
            </div>
          </ComponentCard>

          {/* Configuración SIRA (Junta de Andalucía) */}
          <ComponentCard title="Configuración SIRA (Junta de Andalucía)" className="mt-6 border-blue-200 bg-blue-50/30 dark:border-blue-900/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300">Conexión con el Web Service</h4>
                  <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                    Configura las credenciales para el envío directo de DI a la plataforma SIRA.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted">Desactivado</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.sira_activo}
                      onChange={(e) => setFormData(prev => ({ ...prev, sira_activo: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-xs font-medium uppercase tracking-wider text-primary">Activado</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Usuario WS (CIF o NIMA)</label>
                  <Input
                    name="sira_usuario"
                    value={formData.sira_usuario}
                    onChange={handleChange}
                    placeholder="Usuario asignado en SIRA"
                    className="bg-white dark:bg-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña WS</label>
                  <Input
                    name="sira_password"
                    type="password"
                    value={formData.sira_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="bg-white dark:bg-dark"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                * Las credenciales se utilizan exclusivamente para la comunicación cifrada con los servidores de la Junta de Andalucía.
              </p>
            </div>
          </ComponentCard>

          {/* Logo y Notas */}
          <ComponentCard title="Logo y Observaciones" className="mt-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Logo de la Empresa
                </label>
                <ImageUpload
                  value={formData.logo_url}
                  onChange={handleLogoUpload}
                  folder="company-logos"
                />
                <p className="mt-2 text-sm text-muted">
                  El logo aparecerá en los contratos y documentos generados
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notas / Observaciones</label>
                <TextArea
                  value={formData.notas}
                  onChange={(value) => setFormData(prev => ({ ...prev, notas: value }))}
                  rows={4}
                  placeholder="Información adicional sobre la empresa..."
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
              {saving ? 'Guardando...' : company ? 'Actualizar Empresa' : 'Crear Empresa'}
            </Button>
          </div>
        </form>

        {/* Centros de Producción */}
        {company && (
          <div className="mt-8 mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Centros de Producción</h2>
              <Button
                onClick={() => setShowCenterForm(!showCenterForm)}
                variant={showCenterForm ? "outline" : "primary"}
                className="flex items-center gap-2"
              >
                {showCenterForm ? 'Cancelar' : (
                  <>
                    <Plus className="w-5 h-5" />
                    Nuevo Centro
                  </>
                )}
              </Button>
            </div>

            {showCenterForm && (
              <ComponentCard title="Agregar Nuevo Centro de Producción" className="mb-6 border-primary/20 bg-primary/5">
                <form onSubmit={handleAddCenter} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Nombre del Centro *</label>
                      <Input
                        value={centerFormData.nombre}
                        onChange={(e) => setCenterFormData({ ...centerFormData, nombre: e.target.value })}
                        placeholder="Ej: Planta de Tratamiento Norte"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">NIMA *</label>
                      <Input
                        value={centerFormData.nima}
                        onChange={(e) => setCenterFormData({ ...centerFormData, nima: e.target.value })}
                        placeholder="Número de Identificación Medioambiental"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Dirección *</label>
                      <Input
                        value={centerFormData.direccion}
                        onChange={(e) => setCenterFormData({ ...centerFormData, direccion: e.target.value })}
                        placeholder="Calle, número..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Municipio *</label>
                      <Input
                        value={centerFormData.municipio}
                        onChange={(e) => setCenterFormData({ ...centerFormData, municipio: e.target.value })}
                        placeholder="Ej: Sevilla"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Provincia *</label>
                      <Input
                        value={centerFormData.provincia}
                        onChange={(e) => setCenterFormData({ ...centerFormData, provincia: e.target.value })}
                        placeholder="Ej: Sevilla"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Código Postal</label>
                      <Input
                        value={centerFormData.codigo_postal}
                        onChange={(e) => setCenterFormData({ ...centerFormData, codigo_postal: e.target.value })}
                        placeholder="Ej: 41001"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Descripción</label>
                      <TextArea
                        value={centerFormData.descripcion || ''}
                        onChange={(val) => setCenterFormData({ ...centerFormData, descripcion: val })}
                        placeholder="Breve descripción del centro y sus actividades..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Añadiendo...' : 'Añadir Centro'}
                    </Button>
                  </div>
                </form>
              </ComponentCard>
            )}

            {productionCenters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productionCenters.map((center) => (
                  <div key={center.id} className="bg-white dark:bg-dark-1 rounded-xl p-6 border border-stroke dark:border-strokedark shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground">{center.nombre}</h3>
                          <p className="text-sm text-primary font-medium mt-1">NIMA: {center.nima}</p>
                          <p className="text-sm text-muted mt-2">
                            {center.direccion}
                            {(center.municipio || center.provincia) && (
                              <>, {[center.municipio, center.provincia].filter(Boolean).join(', ')}</>
                            )}
                          </p>
                          {center.descripcion && (
                            <p className="text-sm text-muted mt-3 italic">"{center.descripcion}"</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCenter(center.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar centro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-dark-2 rounded-xl border border-dashed border-stroke dark:border-strokedark">
                <p className="text-muted">No hay otros centros de producción registrados.</p>
                <p className="text-sm text-muted mt-2">Los centros añadidos aquí podrán seleccionarse en los contratos y documentos.</p>
              </div>
            )}
          </div>
        )}

        {!company && (
          <div className="mt-6">
            <Alert
              variant="info"
              title="Importante"
              message="Debes registrar los datos de tu empresa antes de poder crear contratos de tratamiento de residuos."
            />
          </div>
        )}
      </div>
    </>
  );
}
