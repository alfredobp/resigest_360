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
import { ConfirmModal } from '@/components/ui/modal';
import { toast } from '@/context/ToastContext';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import type { Company, CompanyFormData, ProductionCenter, ProductionCenterFormData } from '@/types/wasteManagement';

type ActiveTab = 'identidad' | 'sedes' | 'integraciones';

const TIPOS_EMPRESA: Array<{
  value: NonNullable<CompanyFormData['tipo_empresa']>;
  label: string;
  icon: string;
  description: string;
}> = [
  { value: 'productor', label: 'Productor', icon: '🏭', description: 'Genera residuos' },
  { value: 'gestor', label: 'Gestor', icon: '♻️', description: 'Planta / Valorización' },
  { value: 'transportista', label: 'Transportista', icon: '🚚', description: 'Recogida y porte' },
  { value: 'negociante', label: 'Negociante', icon: '💼', description: 'Cuenta propia' },
  { value: 'agente', label: 'Agente', icon: '🤝', description: 'Cuenta de terceros' },
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('identidad');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
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
          logo_url: data.logo_url || '',
          notas: data.notas || '',
          sira_usuario: data.sira_usuario || '',
          sira_password: data.sira_password || '',
          sira_activo: data.sira_activo || false,
          holded_api_key: data.holded_api_key || '',
        });

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

      await loadCompany();
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

  // Cálculos de estado para indicadores visuales
  const cifTrimmed = formData.cif.trim();
  const isCifValid = cifTrimmed !== '' && companyService.validateCIF(cifTrimmed);
  const nimaTrimmed = (formData.nima || '').trim();
  const isNimaValid = nimaTrimmed !== '' && companyService.validateNIMA(nimaTrimmed);
  const nimaProgressPct = Math.min(100, (nimaTrimmed.length / 10) * 100);
  const isFiscalComplete = Boolean(formData.razon_social.trim() && isCifValid && isNimaValid);

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

        {!company && (
          <div className="mb-6">
            <Alert
              variant="info"
              title="Importante"
              message="Debes registrar los datos de tu empresa antes de poder crear contratos de tratamiento de residuos."
            />
          </div>
        )}

        {/* Navegación por Pestañas (Opción B) */}
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-1.5 flex flex-wrap gap-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('identidad')}
            className={`flex-1 min-w-[180px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'identidad'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60'
            }`}
          >
            <span className="text-base">🏢</span>
            <span>1. Identidad Fiscal</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isFiscalComplete ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              title={isFiscalComplete ? 'Ficha fiscal completa' : 'Datos fiscales pendientes'}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sedes')}
            className={`flex-1 min-w-[180px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'sedes'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60'
            }`}
          >
            <span className="text-base">📍</span>
            <span>2. Domicilios y Sedes</span>
            {productionCenters.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'sedes'
                    ? 'bg-white/20 text-white'
                    : 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                }`}
              >
                {productionCenters.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('integraciones')}
            className={`flex-1 min-w-[180px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'integraciones'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60'
            }`}
          >
            <span className="text-base">🔌</span>
            <span>3. SIRA & Holded</span>
            {(formData.sira_activo || Boolean(formData.holded_api_key?.trim())) && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'integraciones'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                Activo
              </span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* =========================================================
              PESTAÑA 1: IDENTIDAD FISCAL Y CONTACTO
          ========================================================= */}
          {activeTab === 'identidad' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs overflow-hidden">
                {/* Cabecera de la tarjeta con estado fiscal */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200/60 dark:border-brand-800/50 flex items-center justify-center text-lg">
                      🏢
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Datos Básicos e Identidad Fiscal
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Información oficial para contratos de tratamiento y Documentos de Identificación (DI)
                      </p>
                    </div>
                  </div>

                  {isFiscalComplete ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 self-start sm:self-auto">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Ficha Fiscal Completa</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 self-start sm:self-auto">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>
                        {!isCifValid
                          ? 'CIF pendiente o inválido'
                          : !isNimaValid
                            ? 'NIMA pendiente de completar'
                            : 'Completa la Razón Social'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Bloque Superior: Logo + Razón Social + Nombre Comercial + Nº Inscripción */}
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-52 shrink-0">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                        Logo Corporativo
                      </label>
                      <ImageUpload
                        value={formData.logo_url}
                        onChange={handleLogoUpload}
                        folder="company-logos"
                      />
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Aparecerá en contratos y documentos DI.
                      </p>
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1.5">
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
                        <label className="block text-sm font-medium mb-1.5">Nombre Comercial</label>
                        <Input
                          name="nombre_comercial"
                          value={formData.nombre_comercial}
                          onChange={handleChange}
                          placeholder="Ej: EcoGest"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Número de Inscripción / RPGR
                        </label>
                        <Input
                          name="numero_inscripcion"
                          value={formData.numero_inscripcion}
                          onChange={handleChange}
                          placeholder="Número de inscripción en registro"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque Intermedio: CIF/NIF y NIMA con feedback enriquecido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                    {/* Tarjeta CIF / NIF */}
                    <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          CIF / NIF <span className="text-red-500">*</span>
                        </label>
                        {cifTrimmed !== '' && (
                          isCifValid ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CIF Válido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-500/15 text-red-600 dark:text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Formato incorrecto (Ej: B12345678)
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
                        className="bg-white dark:bg-gray-900 font-mono uppercase tracking-wider"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Identificador único para facturación y firma electrónica E3L.
                      </p>
                    </div>

                    {/* Tarjeta NIMA con barra de progreso */}
                    <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">NIMA</label>
                        {nimaTrimmed !== '' && (
                          isNimaValid ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> NIMA Válido ({nimaTrimmed.length} car.)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> NIMA incompleto ({nimaTrimmed.length}/10 car.)
                            </span>
                          )
                        )}
                      </div>
                      <Input
                        name="nima"
                        value={formData.nima}
                        onChange={handleChange}
                        placeholder="Ej: 4100012345 (10 dígitos)"
                        className="bg-white dark:bg-gray-900 font-mono tracking-wider"
                      />
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isNimaValid
                              ? 'bg-emerald-500'
                              : nimaTrimmed.length > 0
                                ? 'bg-amber-500'
                                : 'bg-transparent'
                          }`}
                          style={{ width: `${nimaProgressPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        2 dígitos de provincia INE + 8 dígitos correlativos requeridos por SIRA.
                      </p>
                    </div>
                  </div>

                  {/* Selector Visual de Tipo de Empresa */}
                  <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="block text-sm font-medium">
                        Tipo de Empresa / Rol Principal <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Selecciona la actividad principal de tu empresa
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {TIPOS_EMPRESA.map((tipo) => {
                        const isSelected = formData.tipo_empresa === tipo.value;
                        return (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, tipo_empresa: tipo.value }))
                            }
                            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-2 border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 dark:border-brand-400 shadow-xs'
                                : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:border-brand-400/50'
                            }`}
                          >
                            <span className="text-xl mb-1">{tipo.icon}</span>
                            <span
                              className={`text-xs sm:text-sm font-bold ${
                                isSelected
                                  ? 'text-brand-700 dark:text-brand-300'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {tipo.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                              {tipo.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos de Contacto y Observaciones */}
              <ComponentCard title="Datos de Contacto y Observaciones">
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

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-2">Notas / Observaciones</label>
                    <TextArea
                      value={formData.notas}
                      onChange={(value) => setFormData((prev) => ({ ...prev, notas: value }))}
                      rows={3}
                      placeholder="Información adicional sobre la empresa, horarios de recepción, etc."
                    />
                  </div>
                </div>
              </ComponentCard>
            </div>
          )}

          {/* =========================================================
              PESTAÑA 2: DOMICILIOS Y SEDES
          ========================================================= */}
          {activeTab === 'sedes' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-lg">
                      📍
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Domicilio Social y Ubicación de Instalación
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sede fiscal y dirección operativa principal de la empresa
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-gray-50 dark:bg-gray-800/60 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={sameInstallationAddress}
                      onChange={(e) => setSameInstallationAddress(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Instalación en el mismo Domicilio Social
                    </span>
                  </label>
                </div>

                <div className="p-6 space-y-6">
                  {/* Domicilio Social en Grid de 12 columnas */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-12">
                      <label className="block text-sm font-medium mb-1.5">
                        Dirección Fiscal (Calle, número, piso, polígono)
                      </label>
                      <Input
                        name="domicilio_social"
                        value={formData.domicilio_social}
                        onChange={handleChange}
                        placeholder="Calle, número, piso, puerta"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium mb-1.5">Código Postal</label>
                      <Input
                        name="codigo_postal_social"
                        value={formData.codigo_postal_social}
                        onChange={handleChange}
                        placeholder="Ej: 11510"
                        className="font-mono"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-sm font-medium mb-1.5">Municipio</label>
                      <Input
                        name="municipio_social"
                        value={formData.municipio_social}
                        onChange={handleChange}
                        placeholder="Ej: Puerto Real"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium">Provincia</label>
                        {detectedProvSocial && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            CP {cpPrefixSocial}
                          </span>
                        )}
                      </div>
                      <Input
                        name="provincia_social"
                        value={formData.provincia_social}
                        onChange={handleChange}
                        placeholder="Ej: Cádiz"
                      />
                    </div>
                  </div>

                  {/* Resumen o Campos de Domicilio de Instalación */}
                  {sameInstallationAddress ? (
                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        <span>
                          El <strong>Domicilio de Instalación</strong> utilizará automáticamente los mismos datos del Domicilio Social al guardar.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSameInstallationAddress(false)}
                        className="text-brand-600 dark:text-brand-400 font-semibold hover:underline self-start sm:self-auto shrink-0"
                      >
                        Especificar otra dirección
                      </button>
                    </div>
                  ) : (
                    <div className="pt-5 border-t border-gray-100 dark:border-gray-800 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Domicilio de la Instalación Principal
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-12">
                          <label className="block text-sm font-medium mb-1.5">
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
                          <label className="block text-sm font-medium mb-1.5">Código Postal</label>
                          <Input
                            name="codigo_postal_instalacion"
                            value={formData.codigo_postal_instalacion}
                            onChange={handleChange}
                            placeholder="Ej: 41001"
                            className="font-mono"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-sm font-medium mb-1.5">Municipio</label>
                          <Input
                            name="municipio_instalacion"
                            value={formData.municipio_instalacion}
                            onChange={handleChange}
                            placeholder="Ej: Sevilla"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-sm font-medium mb-1.5">Provincia</label>
                          <Input
                            name="provincia_instalacion"
                            value={formData.provincia_instalacion}
                            onChange={handleChange}
                            placeholder="Ej: Sevilla"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              PESTAÑA 3: INTEGRACIONES SIRA & HOLDED
          ========================================================= */}
          {activeTab === 'integraciones' && (
            <div className="space-y-6">
              {/* Configuración SIRA (Junta de Andalucía) */}
              <ComponentCard
                title="Configuración SIRA (Junta de Andalucía)"
                className="border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10"
              >
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-100/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs leading-relaxed space-y-2">
                    <div className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
                      ¿Qué es la conexión SIRA y cómo funciona?
                    </div>
                    <p>
                      <strong>SIRA</strong> (Sistema de Información de Residuos de Andalucía) es la plataforma oficial de la Junta de Andalucía para la tramitación de traslados de residuos.
                    </p>
                    <p>
                      Al activar la integración e introducir tus credenciales del Servicio Web (Usuario WS y Contraseña WS), <strong>Resigest 360</strong> enviará los Documentos de Identificación (DI) firmados directamente a la Consejería mediante protocolo cifrado E3L. Obtendrás el <strong>ID de Registro SIRA</strong> oficial en segundos sin necesidad de subidas manuales.
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Conexión con el Web Service
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configura las credenciales para el envío directo de DI a la plataforma SIRA.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted">
                        Desactivado
                      </span>
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
                      <span className="text-xs font-medium uppercase tracking-wider text-primary">
                        Activado
                      </span>
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
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    * Las credenciales se utilizan exclusivamente para la comunicación cifrada con los servidores de la Junta de Andalucía.
                  </p>
                </div>
              </ComponentCard>

              {/* Configuración Holded */}
              <ComponentCard
                title="Integración con Holded"
                className="border-orange-200 bg-orange-50/30 dark:border-orange-900/30"
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-orange-800 dark:text-orange-300">
                      Clave de API de Holded
                    </h4>
                    <p className="text-sm text-orange-600/70 dark:text-orange-400/70 mb-4">
                      Sincroniza tus contactos (gestores y transportistas) y automatiza la creación de facturas.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <Input
                      name="holded_api_key"
                      value={formData.holded_api_key}
                      onChange={handleChange}
                      placeholder="Introduce tu API Key de Holded"
                      className="bg-white dark:bg-dark"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    * Tu API Key se almacena de forma segura y se utiliza solo para las integraciones autorizadas.
                  </p>
                </div>
              </ComponentCard>
            </div>
          )}

          {/* Barra de Acciones del Formulario Principal */}
          <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Los cambios realizados en cualquiera de las 3 pestañas se guardan conjuntamente.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/residuos/contratos')}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : company ? 'Actualizar Empresa' : 'Crear Empresa'}
              </Button>
            </div>
          </div>
        </form>

        {/* Centros de Producción Adicionales (Visible en la Pestaña 2: Domicilios y Sedes) */}
        {activeTab === 'sedes' && company && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Centros de Producción</h2>
                <p className="text-xs text-muted mt-0.5">
                  Delegaciones, plantas o centros adicionales asociados al mismo CIF
                </p>
              </div>
              <Button
                onClick={() => setShowCenterForm(!showCenterForm)}
                variant={showCenterForm ? 'outline' : 'primary'}
              >
                {showCenterForm ? 'Cancelar' : 'Nuevo Centro'}
              </Button>
            </div>

            {showCenterForm && (
              <ComponentCard
                title="Agregar Nuevo Centro de Producción"
                className="mb-6 border-brand-500/20 bg-brand-50/10"
              >
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
                        className="font-mono"
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
                          const prefix = cp.trim().substring(0, 2);
                          setCenterFormData((prev) => ({
                            ...prev,
                            codigo_postal: cp,
                            provincia: PROVINCIAS_POR_CP[prefix] || prev.provincia,
                          }));
                        }}
                        placeholder="Ej: 41001"
                        className="font-mono"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-sm font-medium mb-1">Municipio *</label>
                      <Input
                        value={centerFormData.municipio}
                        onChange={(e) =>
                          setCenterFormData({ ...centerFormData, municipio: e.target.value })
                        }
                        placeholder="Ej: Sevilla"
                        required
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-sm font-medium mb-1">Provincia *</label>
                      <Input
                        value={centerFormData.provincia}
                        onChange={(e) =>
                          setCenterFormData({ ...centerFormData, provincia: e.target.value })
                        }
                        placeholder="Ej: Sevilla"
                        required
                      />
                    </div>
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
                    className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {center.nombre}
                          </h3>
                          <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60">
                            NIMA: {center.nima}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {center.direccion}
                          {(center.municipio || center.provincia) && (
                            <>, {[center.municipio, center.provincia].filter(Boolean).join(', ')}</>
                          )}
                        </p>
                        {center.descripcion && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
                            &ldquo;{center.descripcion}&rdquo;
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCenter(center.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 transition-colors shrink-0"
                        title="Eliminar centro"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 dark:bg-dark-2 rounded-2xl border border-dashed border-stroke dark:border-strokedark">
                <p className="text-muted">No hay otros centros de producción registrados.</p>
                <p className="text-sm text-muted mt-1">
                  Los centros añadidos aquí podrán seleccionarse en los contratos y documentos.
                </p>
              </div>
            )}
          </div>
        )}

        <ConfirmModal
          isOpen={centerToDelete !== null}
          onClose={() => setCenterToDelete(null)}
          onConfirm={confirmDeleteCenter}
          title="Eliminar centro de producción"
          message="¿Estás seguro de que deseas eliminar este centro de producción? Esta acción no se puede deshacer."
        />
      </div>
    </>
  );
}
