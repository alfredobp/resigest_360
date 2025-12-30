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
import type { Company, CompanyFormData } from '@/types/wasteManagement';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        });
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
        breadcrumbItems={[
          { name: 'Gestión de Residuos', link: '/admin/residuos' },
          { name: 'Mi Empresa', link: '/admin/residuos/mi-empresa' },
        ]}
      />

      <div className="max-w-5xl mx-auto">
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
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

          {/* Logo y Notas */}
          <ComponentCard title="Logo y Observaciones" className="mt-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Logo de la Empresa
                </label>
                <ImageUpload
                  currentImageUrl={formData.logo_url}
                  onUploadComplete={handleLogoUpload}
                  folder="company-logos"
                />
                <p className="mt-2 text-sm text-muted">
                  El logo aparecerá en los contratos y documentos generados
                </p>
              </div>

              <TextArea
                label="Notas / Observaciones"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows={4}
                placeholder="Información adicional sobre la empresa..."
              />
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

        {!company && (
          <Alert variant="info" className="mt-6">
            <strong>Importante:</strong> Debes registrar los datos de tu empresa antes de poder
            crear contratos de tratamiento de residuos.
          </Alert>
        )}
      </div>
    </>
  );
}
