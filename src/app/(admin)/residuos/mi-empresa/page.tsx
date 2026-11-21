'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Input from '@/components/form/input/InputField';
import ProvinceMunicipalityFields from '@/components/form/ProvinceMunicipalityFields';
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import ImageUpload from '@/components/common/ImageUpload';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { toast } from '@/context/ToastContext';
import AutorizacionModal from '@/components/residuos/AutorizacionModal';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import authorizationService from '@/services/authorizationService';
import { useTenant } from '@/context/TenantContext';
import {
  ALL_MODULES,
  MODULE_LABELS,
  PROFILE_DEFINITIONS,
  getDefaultModulesForProfile,
  getEffectiveModules,
  normalizeOperationalProfile,
} from '@/lib/profiles/moduleCatalog';
import { getProvinceByPostalCode } from '@/lib/validations/spainLocations';
import type {
  AppModule,
  Company,
  CompanyFormData,
  EnvironmentalAuthorization,
  OperationalProfile,
  ProductionCenter,
  ProductionCenterFormData,
} from '@/types/wasteManagement';

type ActiveTab = 'identidad' | 'sedes' | 'integraciones' | 'autorizaciones';

const TIPOS_EMPRESA: Array<{
  value: NonNullable<CompanyFormData['tipo_empresa']>;
  label: string;
  description: string;
}> = [
  { value: 'productor', label: 'Productor', description: 'Genera residuos' },
  { value: 'gestor', label: 'Gestor', description: 'Planta / Valorización' },
  { value: 'transportista', label: 'Transportista', description: 'Recogida y porte' },
  { value: 'negociante', label: 'Negociante', description: 'Cuenta propia' },
  { value: 'agente', label: 'Agente', description: 'Cuenta de terceros' },
];

const PROVINCIAS_POR_CP: Record<string, string> = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
  '06': 'Badajoz', '07': 'Illes Balears', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
  '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
  '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
  '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
  '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
  '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria',
  '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel',
  '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora',
  '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla',
};

export default function MiEmpresaPage() {
  const router = useRouter();
  const { refreshTenant, canManageCompany, canWrite, isPlatformAdmin, membershipRole } = useTenant();
  const [activeTab, setActiveTab] = useState<ActiveTab>('identidad');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [authorizations, setAuthorizations] = useState<EnvironmentalAuthorization[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<EnvironmentalAuthorization | null>(null);
  const [authToDelete, setAuthToDelete] = useState<{ id: number; numero: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sameInstallationAddress, setSameInstallationAddress] = useState(true);

  // Estado para el nuevo centro de producción
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<number | null>(null);
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
    perfil_operativo: 'productor',
    modulos_activos: getDefaultModulesForProfile('productor'),
    is_my_company: true,
    onboarding_completado: true,
    logo_url: '',
    notas: '',
    sira_usuario: '',
    sira_password: '',
    sira_activo: false,
    holded_api_key: '',
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
        const hasDifferentInstallAddress = Boolean(
          data.domicilio_instalacion &&
          (
            data.domicilio_instalacion !== (data.domicilio_social || '') ||
            (data.codigo_postal_instalacion || '') !== (data.codigo_postal_social || '') ||
            (data.municipio_instalacion || '') !== (data.municipio_social || '') ||
            (data.provincia_instalacion || '') !== (data.provincia_social || '')
          )
        );
        setSameInstallationAddress(!hasDifferentInstallAddress);

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
          perfil_operativo: normalizeOperationalProfile(
            data.perfil_operativo,
            data.tipo_empresa,
            data.roles
          ),
          modulos_activos: getEffectiveModules(data),
          is_my_company: true,
          onboarding_completado: true,
          logo_url: data.logo_url || '',
          notas: data.notas || '',
          sira_usuario: data.sira_usuario || '',
          sira_password: data.sira_password || '',
          sira_activo: data.sira_activo || false,
          holded_api_key: data.holded_api_key || '',
        });

        const [centers, auths] = await Promise.all([
          productionCenterService.getByCompanyId(data.id),
          authorizationService.getByCompany(data.id).catch(() => [] as EnvironmentalAuthorization[]),
        ]);
        setProductionCenters(centers);
        setAuthorizations(auths);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (newProfile: OperationalProfile) => {
    if (!canManageCompany) return;
    const def = PROFILE_DEFINITIONS[newProfile];
    setFormData((prev) => ({
      ...prev,
      perfil_operativo: newProfile,
      tipo_empresa: def.defaultCompanyType,
      roles: def.defaultRoles,
      modulos_activos: getDefaultModulesForProfile(newProfile),
    }));
  };

  const handleCompanyTypeChange = (newType: NonNullable<CompanyFormData['tipo_empresa']>) => {
    if (!canManageCompany) return;
    // Si el perfil operativo actual ya coincide con este tipo de empresa, solo actualizamos el tipo
    const currentProfileDef = formData.perfil_operativo ? PROFILE_DEFINITIONS[formData.perfil_operativo] : null;
    if (currentProfileDef && currentProfileDef.defaultCompanyType === newType) {
      setFormData((prev) => ({ ...prev, tipo_empresa: newType }));
      return;
    }

    const matchingProfile = normalizeOperationalProfile(undefined, newType);
    handleProfileChange(matchingProfile);
  };

  const handleToggleModule = (mod: AppModule) => {
    if (!isPlatformAdmin) return;
    setFormData((prev) => {
      const current = prev.modulos_activos || [];
      const next = current.includes(mod)
        ? current.filter((m) => m !== mod)
        : [...current, mod];
      return { ...prev, modulos_activos: next };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: name === 'cif' ? value.toUpperCase() : value };

      // Autodetección de provincia según los 2 primeros dígitos del Código Postal
      if (name === 'codigo_postal_social' && value.trim().length >= 2) {
        const prefix = value.trim().substring(0, 2);
        if (PROVINCIAS_POR_CP[prefix]) {
          updated.provincia_social = PROVINCIAS_POR_CP[prefix];
        }
      }
      if (name === 'codigo_postal_instalacion' && value.trim().length >= 2) {
        const prefix = value.trim().substring(0, 2);
        if (PROVINCIAS_POR_CP[prefix]) {
          updated.provincia_instalacion = PROVINCIAS_POR_CP[prefix];
        }
      }

      return updated;
    });
  };

  const handleLogoUpload = async (url: string) => {
    setFormData((prev) => ({ ...prev, logo_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCompany) {
      toast.warning('Tu rol actual no tiene permisos para modificar los datos fiscales de la empresa.');
      return;
    }
    setError(null);
    setSuccess(null);

    if (!formData.razon_social.trim()) {
      const msg = 'La razón social es obligatoria';
      setError(msg);
      setActiveTab('identidad');
      toast.warning(msg);
      return;
    }

    if (!formData.cif.trim()) {
      const msg = 'El CIF es obligatorio';
      setError(msg);
      setActiveTab('identidad');
      toast.warning(msg);
      return;
    }

    if (!companyService.validateCIF(formData.cif.trim())) {
      const msg = 'El formato del CIF/NIF introducido no es válido';
      setError(msg);
      setActiveTab('identidad');
      toast.warning(msg);
      return;
    }

    if (formData.nima && formData.nima.trim() !== '' && !companyService.validateNIMA(formData.nima.trim())) {
      const msg = 'El código NIMA debe contener exactamente 10 dígitos numéricos';
      setError(msg);
      setActiveTab('identidad');
      toast.warning(msg);
      return;
    }

    const payload: CompanyFormData = sameInstallationAddress
      ? {
        ...formData,
        domicilio_instalacion: formData.domicilio_social,
        codigo_postal_instalacion: formData.codigo_postal_social,
        municipio_instalacion: formData.municipio_social,
        provincia_instalacion: formData.provincia_social,
      }
      : formData;

    try {
      setSaving(true);

      if (company) {
        await companyService.update(company.id, payload);
        const msg = 'Empresa actualizada correctamente';
        setSuccess(msg);
        toast.success(msg);
      } else {
        const newCompany = await companyService.create(payload);
        setCompany(newCompany);
        const msg = 'Empresa creada correctamente';
        setSuccess(msg);
        toast.success(msg);
      }

      // Recargar datos y contexto global del tenant
      await loadCompany();
      await refreshTenant();
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error al guardar datos de la empresa: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    if (centerFormData.nima && centerFormData.nima.trim() !== '' && !companyService.validateNIMA(centerFormData.nima.trim())) {
      const msg = 'El código NIMA del centro de producción debe tener 10 dígitos numéricos';
      setError(msg);
      toast.warning(msg);
      return;
    }

    try {
      setSaving(true);
      await productionCenterService.create({
        ...centerFormData,
        company_id: company.id,
      });

      const msg = 'Centro de producción añadido correctamente';
      setSuccess(msg);
      toast.success(msg);
      setCenterFormData({
        nombre: '',
        direccion: '',
        nima: '',
        municipio: '',
        provincia: '',
        codigo_postal: '',
        descripcion: '',
      });
      setShowCenterForm(false);

      const centers = await productionCenterService.getByCompanyId(company.id);
      setProductionCenters(centers);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error al añadir centro de producción: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCenter = (id: number) => {
    setCenterToDelete(id);
  };

  const confirmDeleteCenter = async () => {
    if (centerToDelete === null) return;

    try {
      await productionCenterService.delete(centerToDelete);
      const msg = 'Centro de producción eliminado correctamente';
      setSuccess(msg);
      toast.success(msg);
      setProductionCenters((prev) => prev.filter((c) => c.id !== centerToDelete));
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error al eliminar centro de producción: ${err.message}`);
    }
  };

  const confirmDeleteAuth = async () => {
    if (!authToDelete) return;
    try {
      await authorizationService.delete(authToDelete.id);
      setAuthorizations((prev) => prev.filter((a) => a.id !== authToDelete.id));
      const msg = `Autorización "${authToDelete.numero}" eliminada correctamente.`;
      setSuccess(msg);
      toast.success(msg);
      setAuthToDelete(null);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error al eliminar autorización: ${err.message}`);
    }
  };

  const reloadAuthorizations = async () => {
    if (!company) return;
    try {
      const auths = await authorizationService.getByCompany(company.id);
      setAuthorizations(auths);
    } catch {
      // mantener estado actual si falla
    }
  };

  const isGestorOrTransportista = Boolean(
    formData.tipo_empresa === 'gestor' ||
    formData.tipo_empresa === 'transportista' ||
    formData.roles?.includes('gestor') ||
    formData.roles?.includes('transportista') ||
    company?.roles?.includes('gestor') ||
    company?.roles?.includes('transportista')
  );
  const showAuthorizationsTab = Boolean(company && (isGestorOrTransportista || authorizations.length > 0));

  const cifTrimmed = formData.cif.trim();
  const isCifValid = cifTrimmed !== '' && companyService.validateCIF(cifTrimmed);
  const nimaTrimmed = (formData.nima || '').trim();
  const isNimaValid = nimaTrimmed !== '' && companyService.validateNIMA(nimaTrimmed);
  const nimaProgressPct = Math.min(100, (nimaTrimmed.length / 10) * 100);

  const cpPrefixSocial = (formData.codigo_postal_social || '').trim().substring(0, 2);
  const detectedProvSocial = PROVINCIAS_POR_CP[cpPrefixSocial];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">Cargando datos de la empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Mi Empresa" />

      <div className="max-w-5xl mx-auto pb-12">
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

        {!canManageCompany && (
          <div className="mb-6">
            <Alert
              variant="warning"
              title="Vista de consulta de ficha de empresa"
              message={`Estás accediendo con rol "${membershipRole}". Solo el titular o consultor administrador puede modificar la identidad fiscal, el perfil operativo o las credenciales de integración.`}
            />
          </div>
        )}

        {!company && canManageCompany && (
          <div className="mb-6">
            <Alert
              variant="info"
              title="Importante"
              message="Debes registrar los datos de tu empresa antes de poder crear contratos de tratamiento de residuos."
            />
          </div>
        )}

        {/* Navegación por Pestañas sobria */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('identidad')}
            className={`pb-3.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'identidad'
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Datos Fiscales y Contacto
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sedes')}
            className={`pb-3.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sedes'
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span>Domicilios y Centros</span>
            {productionCenters.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {productionCenters.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('integraciones')}
            className={`pb-3.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'integraciones'
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span>Integraciones (SIRA y Holded)</span>
            {(formData.sira_activo || Boolean(formData.holded_api_key?.trim())) && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Activo
              </span>
            )}
          </button>

          {showAuthorizationsTab && (
            <button
              type="button"
              onClick={() => setActiveTab('autorizaciones')}
              className={`pb-3.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'autorizaciones'
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>Autorizaciones Ambientales</span>
              {authorizations.length > 0 && (
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {authorizations.length}
                </span>
              )}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* =========================================================
              PESTAÑA 1: DATOS FISCALES Y CONTACTO
          ========================================================= */}
          {activeTab === 'identidad' && (
            <div className="space-y-6">
              <ComponentCard title="Datos Básicos de la Empresa">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Razón Social <span className="text-red-500">*</span>
                      </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Número de Inscripción / RPGR
                      </label>
                      <Input
                        name="numero_inscripcion"
                        value={formData.numero_inscripcion}
                        onChange={handleChange}
                        placeholder="Número de inscripción en registro"
                      />
                    </div>

                    {/* CIF / NIF */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">
                          CIF / NIF <span className="text-red-500">*</span>
                        </label>
                        {cifTrimmed !== '' && (
                          isCifValid ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              CIF válido
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-red-500">
                              Formato incorrecto (Ej: B12345678)
                            </span>
                          )
                        )}
                      </div>
                      <Input
                        name="cif"
                        value={formData.cif}
                        onChange={handleChange}
                        required
                        placeholder="Ej: B12345678"
                        className="font-mono uppercase"
                      />
                    </div>

                    {/* NIMA */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">NIMA</label>
                        {nimaTrimmed !== '' && (
                          isNimaValid ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              NIMA válido ({nimaTrimmed.length} car.)
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              Incompleto ({nimaTrimmed.length}/10 car.)
                            </span>
                          )
                        )}
                      </div>
                      <Input
                        name="nima"
                        value={formData.nima}
                        onChange={handleChange}
                        placeholder="Ej: 4100012345 (10 dígitos)"
                        className="font-mono"
                      />
{nimaTrimmed !== '' && (
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isNimaValid ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${nimaProgressPct}%` }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        2 dígitos de provincia INE + 8 dígitos correlativos requeridos por SIRA.
                      </p>
                    </div>
                  </div>

                  {/* Selector de Tipo de Empresa sin iconos */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label className="block text-sm font-medium mb-2.5">
                      Tipo de Empresa <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {TIPOS_EMPRESA.map((tipo) => {
                        const isSelected = formData.tipo_empresa === tipo.value;
                        return (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => handleCompanyTypeChange(tipo.value)}
                            className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30 dark:border-brand-400'
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <span
                              className={`text-sm font-semibold ${
                                isSelected
                                  ? 'text-brand-700 dark:text-brand-300'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {tipo.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {tipo.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ComponentCard>

              {/* Datos de Contacto */}
              <ComponentCard title="Datos de Contacto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Persona de Contacto</label>
                    <Input
                      name="persona_contacto"
                      value={formData.persona_contacto}
                      onChange={handleChange}
                      placeholder="Nombre y apellidos del responsable"
                    />
                  </div>

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
                </div>
              </ComponentCard>

              {/* Logo y Observaciones */}
              <ComponentCard title="Logo y Observaciones">
                <div className="space-y-6">
                  <div>
                    <ImageUpload
                      label="Logo de la Empresa"
                      value={formData.logo_url}
                      onChange={handleLogoUpload}
                      folder="company-logos"
                    />
                    <p className="mt-1.5 text-xs text-muted">
                      El logo aparecerá en los contratos y documentos generados.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notas / Observaciones</label>
                    <TextArea
                      value={formData.notas}
                      onChange={(value) => setFormData((prev) => ({ ...prev, notas: value }))}
                      rows={4}
                      placeholder="Información adicional sobre la empresa..."
                    />
                  </div>
                </div>
              </ComponentCard>

              {/* Perfil Operativo y Módulos Activos */}
              <ComponentCard title="Perfil Operativo y Módulos del Sistema">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Perfil Operativo / Actividad de la Empresa</label>
                    <select
                      name="perfil_operativo"
                      value={formData.perfil_operativo || 'productor'}
                      disabled={!canManageCompany}
                      onChange={(e) => handleProfileChange(e.target.value as OperationalProfile)}
                      className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {(Object.keys(PROFILE_DEFINITIONS) as OperationalProfile[]).map((key) => (
                        <option key={key} value={key}>
                          {PROFILE_DEFINITIONS[key].label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Cambiar de perfil ajusta los módulos activos por defecto recomendados para tu actividad.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="block text-sm font-medium">Módulos Activos en el Menú y Panel</label>
                      {!isPlatformAdmin && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Asignados automáticamente según el perfil operativo
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {ALL_MODULES.map((mod) => {
                        const checked = (formData.modulos_activos || []).includes(mod);
                        return (
                          <label
                            key={mod}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition ${
                              isPlatformAdmin ? 'cursor-pointer' : 'cursor-default opacity-85'
                            } ${checked
                                ? 'border-brand-400 bg-brand-50/60 dark:bg-brand-950/30 text-brand-900 dark:text-brand-200 font-semibold'
                                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!isPlatformAdmin}
                              onChange={() => handleToggleModule(mod)}
                              className="rounded border-gray-300 disabled:opacity-60"
                            />
                            <span>{MODULE_LABELS[mod]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ComponentCard>
            </div>
          )}

          {/* =========================================================
              PESTAÑA 2: DOMICILIOS Y CENTROS
          ========================================================= */}
          {activeTab === 'sedes' && (
            <div className="space-y-6">
              <ComponentCard title="Domicilio Social e Instalación">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Dirección fiscal de la empresa y ubicación de la instalación principal.
                    </p>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sameInstallationAddress}
                        onChange={(e) => setSameInstallationAddress(e.target.checked)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        La instalación principal coincide con el Domicilio Social
                      </span>
                    </label>
                  </div>

                  {/* Domicilio Social en 12 columnas */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-12">
                      <label className="block text-sm font-medium mb-2">Dirección Fiscal</label>
                      <Input
                        name="domicilio_social"
                        value={formData.domicilio_social}
                        onChange={handleChange}
                        placeholder="Calle, número, piso, puerta"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium mb-2">Código Postal</label>
                      <Input
                        name="codigo_postal_social"
                        value={formData.codigo_postal_social}
                        onChange={handleChange}
                        placeholder="Ej: 11510"
                      />
                    </div>

                    <ProvinceMunicipalityFields
                      unstyledWrapper
                      provinciaWrapperClassName="sm:col-span-4"
                      municipioWrapperClassName="sm:col-span-5"
                      order="provincia-first"
                      provincia={formData.provincia_social || ''}
                      municipio={formData.municipio_social || ''}
                      provinciaBadge={
                        detectedProvSocial && (
                          <span className="text-xs text-gray-400">CP {cpPrefixSocial}</span>
                        )
                      }
                      onChange={({ provincia, municipio }) =>
                        setFormData((prev) => ({
                          ...prev,
                          provincia_social: provincia,
                          municipio_social: municipio,
                        }))
                      }
                    />
                  </div>

                  {/* Domicilio de Instalación */}
                  {!sameInstallationAddress && (
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Domicilio de la Instalación
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-12">
                          <label className="block text-sm font-medium mb-2">
                            Dirección de Instalación
                          </label>
                          <Input
                            name="domicilio_instalacion"
                            value={formData.domicilio_instalacion}
                            onChange={handleChange}
                            placeholder="Polígono industrial, parcela, nave..."
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium mb-2">Código Postal</label>
                          <Input
                            name="codigo_postal_instalacion"
                            value={formData.codigo_postal_instalacion}
                            onChange={handleChange}
                            placeholder="Ej: 41001"
                          />
                        </div>

                        <ProvinceMunicipalityFields
                          unstyledWrapper
                          provinciaWrapperClassName="sm:col-span-4"
                          municipioWrapperClassName="sm:col-span-5"
                          order="provincia-first"
                          provincia={formData.provincia_instalacion || ''}
                          municipio={formData.municipio_instalacion || ''}
                          onChange={({ provincia, municipio }) =>
                            setFormData((prev) => ({
                              ...prev,
                              provincia_instalacion: provincia,
                              municipio_instalacion: municipio,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </ComponentCard>
            </div>
          )}

          {/* =========================================================
              PESTAÑA 3: INTEGRACIONES SIRA & HOLDED
          ========================================================= */}
          {activeTab === 'integraciones' && (
            <div className="space-y-6">
              {/* Configuración SIRA (Junta de Andalucía) */}
              <ComponentCard title="Configuración SIRA (Junta de Andalucía)">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 leading-relaxed space-y-1.5">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Conexión con el Sistema de Información de Residuos de Andalucía (SIRA)
                    </div>
                    <p>
                      Al activar la integración e introducir tus credenciales del Servicio Web (Usuario WS y Contraseña WS), ResiGest 360 enviará los Documentos de Identificación (DI) directamente mediante protocolo E3L.
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Conexión con el Web Service
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Habilita el envío directo de DI a la plataforma SIRA.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">Desactivado</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.sira_activo}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, sira_activo: e.target.checked }))
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
                      </label>
                      <span className="text-xs font-medium text-foreground">Activado</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Usuario WS (CIF o NIMA)
                      </label>
                      <Input
                        name="sira_usuario"
                        value={formData.sira_usuario}
                        onChange={handleChange}
                        placeholder="Usuario asignado en SIRA"
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
                      />
                    </div>
                  </div>
                </div>
              </ComponentCard>

              {/* Configuración Holded */}
              <ComponentCard title="Integración con Holded">
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sincroniza tus contactos (gestores y transportistas) y automatiza la creación de facturas.
                  </p>

                  <div>
                    <label className="block text-sm font-medium mb-2">API Key de Holded</label>
                    <Input
                      name="holded_api_key"
                      value={formData.holded_api_key}
                      onChange={handleChange}
                      placeholder="Introduce tu API Key de Holded"
                    />
                  </div>
                </div>
              </ComponentCard>
            </div>
          )}

{/* Barra de Acciones del Formulario Principal */}
          {activeTab !== 'autorizaciones' && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {canManageCompany
                ? 'Los cambios realizados en cualquiera de las pestañas de ficha se guardan conjuntamente.'
                : 'Modo de consulta: no tienes permisos para modificar los datos fiscales de esta empresa.'}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/residuos/contratos')}
                disabled={saving}
              >
                Volver
              </Button>
              {canManageCompany && (
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : company ? 'Actualizar Empresa' : 'Crear Empresa'}
                </Button>
              )}
            </div>
          </div>
          )}
        </form>

        {/* =========================================================
            PESTAÑA 4: AUTORIZACIONES AMBIENTALES (Solo Gestor / Transportista)
        ========================================================= */}
        {activeTab === 'autorizaciones' && company && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Autorizaciones Ambientales</h2>
                <p className="text-xs text-muted mt-0.5">
                  Resoluciones administrativas, códigos LER autorizados y operaciones de tratamiento/transporte de tu empresa.
                </p>
              </div>
              {canWrite && (
                <Button
                  onClick={() => {
                    setEditingAuth(null);
                    setIsAuthModalOpen(true);
                  }}
                >
                  + Nueva Autorización
                </Button>
              )}
            </div>

            {authorizations.length === 0 ? (
              <ComponentCard title="Sin autorizaciones registradas">
                <div className="text-center py-8">
                  <p className="text-sm text-muted">
                    Todavía no has dado de alta ninguna autorización ambiental para tu empresa.
                  </p>
                  {canWrite && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setEditingAuth(null);
                        setIsAuthModalOpen(true);
                      }}
                    >
                      + Dar de alta primera autorización
                    </Button>
                  )}
                </div>
              </ComponentCard>
            ) : (
              <div className="space-y-3">
                {authorizations.map((auth) => {
                  const numLers = auth.waste_codes?.length || 0;
                  const isExpired = !auth.es_indefinida && auth.fecha_vencimiento && new Date(auth.fecha_vencimiento) < new Date();
                  const daysToExpire = !auth.es_indefinida && auth.fecha_vencimiento
                    ? Math.ceil((new Date(auth.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isExpiringSoon = daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 60;

                  return (
                    <div
                      key={auth.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                            Nº {auth.numero_autorizacion}
                          </span>
                          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                            {auth.titulo}
                          </span>
                          {auth.es_indefinida ? (
                            <Badge color="success" size="sm">Vigencia Indefinida</Badge>
                          ) : isExpired ? (
                            <Badge color="error" size="sm">Caducada ({auth.fecha_vencimiento})</Badge>
                          ) : isExpiringSoon ? (
                            <Badge color="warning" size="sm">Vence pronto ({auth.fecha_vencimiento})</Badge>
                          ) : (
                            <Badge color="primary" size="sm">Vence: {auth.fecha_vencimiento}</Badge>
                          )}
                          <span className="inline-flex items-center text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                            {numLers} {numLers === 1 ? 'código LER autorizado' : 'códigos LER autorizados'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted text-[11px]">
                          {auth.organismo_emisor && (
                            <span><strong>Organismo:</strong> {auth.organismo_emisor}</span>
                          )}
                          {auth.fecha_emision && (
                            <span><strong>Emisión:</strong> {auth.fecha_emision}</span>
                          )}
                          {auth.production_center && (
                            <span><strong>Instalación:</strong> {auth.production_center.nombre}</span>
                          )}
                        </div>

                        {auth.waste_codes && auth.waste_codes.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {auth.waste_codes.slice(0, 12).map((wc, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-[11px] text-gray-700 dark:text-gray-300"
                                title={wc.descripcion_ler || undefined}
                              >
                                <span className={wc.codigo_ler.includes('*') ? 'text-red-600 font-bold' : ''}>
                                  {wc.codigo_ler}
                                </span>
                                {wc.operaciones_tratamiento && wc.operaciones_tratamiento.length > 0 && (
                                  <span className="text-brand-600 dark:text-brand-400 text-[10px] font-semibold">
                                    ({wc.operaciones_tratamiento.join(',')})
                                  </span>
                                )}
                              </span>
                            ))}
                            {auth.waste_codes.length > 12 && (
                              <span className="text-[11px] text-muted italic">
                                +{auth.waste_codes.length - 12} más...
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {canWrite && (
                        <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-start">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] py-1 px-2.5 h-auto"
                            onClick={() => {
                              setEditingAuth(auth);
                              setIsAuthModalOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                          <button
                            type="button"
                            onClick={() => setAuthToDelete({ id: auth.id, numero: auth.numero_autorizacion })}
                            className="text-[11px] text-red-600 hover:text-red-700 hover:underline px-2 py-0.5 text-center"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Centros de Producción Adicionales (Visible en la Pestaña 2: Domicilios y Centros) */}
        {activeTab === 'sedes' && company && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Centros de Producción</h2>
                <p className="text-xs text-muted mt-0.5">
                  Delegaciones, plantas o centros adicionales asociados al mismo CIF
                </p>
              </div>
              {canWrite && (
                <Button
                  onClick={() => setShowCenterForm(!showCenterForm)}
                  variant={showCenterForm ? 'outline' : 'primary'}
                >
                  {showCenterForm ? 'Cancelar' : 'Nuevo Centro'}
                </Button>
              )}
            </div>

            {showCenterForm && (
              <ComponentCard title="Agregar Nuevo Centro de Producción" className="mb-6">
                <form onSubmit={handleAddCenter} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8">
                      <label className="block text-sm font-medium mb-1">Nombre del Centro *</label>
                      <Input
                        value={centerFormData.nombre}
                        onChange={(e) =>
                          setCenterFormData({ ...centerFormData, nombre: e.target.value })
                        }
                        placeholder="Ej: Planta de Tratamiento Norte"
                        required
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-sm font-medium mb-1">NIMA *</label>
                      <Input
                        value={centerFormData.nima}
                        onChange={(e) =>
                          setCenterFormData({ ...centerFormData, nima: e.target.value })
                        }
                        placeholder="10 dígitos"
                        required
                      />
                    </div>
                    <div className="sm:col-span-12">
                      <label className="block text-sm font-medium mb-1">Dirección *</label>
                      <Input
                        value={centerFormData.direccion}
                        onChange={(e) =>
                          setCenterFormData({ ...centerFormData, direccion: e.target.value })
                        }
                        placeholder="Calle, número..."
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium mb-1">Código Postal</label>
                      <Input
                        value={centerFormData.codigo_postal}
                        onChange={(e) => {
                          const cp = e.target.value;
                          const detectedProv = getProvinceByPostalCode(cp);
                          setCenterFormData((prev) => ({
                            ...prev,
                            codigo_postal: cp,
                            provincia: detectedProv || prev.provincia,
                          }));
                        }}
                        placeholder="Ej: 41001"
                      />
                    </div>
                    <ProvinceMunicipalityFields
                      unstyledWrapper
                      provinciaRequired
                      municipioRequired
                      provinciaWrapperClassName="sm:col-span-4"
                      municipioWrapperClassName="sm:col-span-5"
                      order="provincia-first"
                      provincia={centerFormData.provincia || ''}
                      municipio={centerFormData.municipio || ''}
                      onChange={({ provincia, municipio }) =>
                        setCenterFormData((prev) => ({
                          ...prev,
                          provincia,
                          municipio,
                        }))
                      }
                    />
                    <div className="sm:col-span-12">
                      <label className="block text-sm font-medium mb-1">Descripción</label>
                      <TextArea
                        value={centerFormData.descripcion || ''}
                        onChange={(val) =>
                          setCenterFormData({ ...centerFormData, descripcion: val })
                        }
                        placeholder="Breve descripción del centro y sus actividades..."
                        rows={2}
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
                  <div
                    key={center.id}
                    className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                            {center.nombre}
                          </h3>
                          <span className="px-2 py-0.5 text-xs font-mono rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            NIMA: {center.nima}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                          {center.direccion}
                          {(center.municipio || center.provincia) && (
                            <>, {[center.municipio, center.provincia].filter(Boolean).join(', ')}</>
                          )}
                        </p>
                        {center.descripcion && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {center.descripcion}
                          </p>
                        )}
                      </div>
{canWrite && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCenter(center.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 transition-colors shrink-0"
                          title="Eliminar centro"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 dark:bg-dark-2 rounded-xl border border-dashed border-stroke dark:border-strokedark">
                <p className="text-muted text-sm">No hay otros centros de producción registrados.</p>
                <p className="text-xs text-muted mt-1">
                  Los centros añadidos aquí podrán seleccionarse en los contratos y documentos.
                </p>
              </div>
            )}
          </div>
        )}

        {company && (
          <AutorizacionModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => {
              reloadAuthorizations();
              const msg = 'Autorización ambiental guardada correctamente.';
              setSuccess(msg);
              toast.success(msg);
            }}
            company={company}
            centers={productionCenters}
            authorizationToEdit={editingAuth}
          />
        )}

        <ConfirmModal
          isOpen={centerToDelete !== null}
          onClose={() => setCenterToDelete(null)}
          onConfirm={confirmDeleteCenter}
          title="Eliminar centro de producción"
          message="¿Estás seguro de que deseas eliminar este centro de producción? Esta acción no se puede deshacer."
        />

        <ConfirmModal
          isOpen={Boolean(authToDelete)}
          onClose={() => setAuthToDelete(null)}
          onConfirm={confirmDeleteAuth}
          title="Eliminar autorización ambiental"
          message={`¿Estás seguro de que deseas eliminar la autorización "${authToDelete?.numero || ''}"? Esta acción no se puede deshacer.`}
        />
      </div>
    </>
  );
}
