'use client';

import React, { useState } from 'react';
import {
  Building2,
  Factory,
  Truck,
  BatteryCharging,
  ShieldAlert,
  DollarSign,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import {
  MODULE_LABELS,
  PROFILE_DEFINITIONS,
  getDefaultModulesForProfile,
} from '@/lib/profiles/moduleCatalog';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import { useTenant } from '@/context/TenantContext';
import { toast } from '@/context/ToastContext';
import type { OperationalProfile } from '@/types/wasteManagement';

const SELECTABLE_PROFILES: Array<{
  id: OperationalProfile;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'productor', icon: Building2 },
  { id: 'chatarreria', icon: Factory },
  { id: 'gestor_rp', icon: ShieldAlert },
  { id: 'baterias', icon: BatteryCharging },
  { id: 'transportista', icon: Truck },
  { id: 'negociante', icon: DollarSign },
];

export default function OnboardingPage() {
  const { refreshTenant, tenant } = useTenant();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProfile, setSelectedProfile] = useState<OperationalProfile>('productor');

  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [cif, setCif] = useState('');
  const [nima, setNima] = useState('');
  const [direccion, setDireccion] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [provincia, setProvincia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [matricula, setMatricula] = useState('');
  const [numeroAutorizacion, setNumeroAutorizacion] = useState('');
  const [createInitialCenter, setCreateInitialCenter] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileDef = PROFILE_DEFINITIONS[selectedProfile];
  const activeModules = getDefaultModulesForProfile(selectedProfile);

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!razonSocial.trim()) {
      setError('La razón social es obligatoria.');
      return;
    }
    if (!cif.trim() || !companyService.validateCIF(cif)) {
      setError('Introduce un CIF/NIF válido (ej. B12345678).');
      return;
    }
    if (selectedProfile === 'transportista' && !matricula.trim()) {
      setError('Indica al menos una matrícula principal de vehículo.');
      return;
    }
    setStep(3);
  };

  const handleFinish = async () => {
    try {
      setSaving(true);
      setError(null);

      const created = await companyService.create({
        razon_social: razonSocial.trim(),
        nombre_comercial: nombreComercial.trim() || razonSocial.trim(),
        cif: cif.trim().toUpperCase(),
        nima: nima.trim() || undefined,
        domicilio_social: direccion.trim() || undefined,
        municipio_social: municipio.trim() || undefined,
        provincia_social: provincia.trim() || undefined,
        telefono: telefono.trim() || undefined,
        matricula: matricula.trim().toUpperCase() || undefined,
        numero_autorizacion: numeroAutorizacion.trim() || undefined,
        tipo_empresa: profileDef.defaultCompanyType,
        roles: profileDef.defaultRoles,
        is_my_company: true,
        perfil_operativo: selectedProfile,
        modulos_activos: activeModules,
        onboarding_completado: true,
        activo: true,
      });

      if (
        createInitialCenter &&
        selectedProfile !== 'transportista' &&
        selectedProfile !== 'negociante'
      ) {
        try {
          await productionCenterService.create({
            company_id: created.id,
            nombre: `${nombreComercial.trim() || razonSocial.trim()} - Centro Principal`,
            direccion: direccion.trim() || 'Dirección principal',
            nima: nima.trim() || 'PENDIENTE',
            municipio: municipio.trim() || undefined,
            provincia: provincia.trim() || undefined,
            tipo_instalacion:
              selectedProfile === 'productor' ? 'produccion' : 'tratamiento',
            activo: true,
          });
        } catch {
          // No bloquear el alta si el centro requiere ajuste posterior
        }
      }

      companyService.setActiveCompanyId(created.id);
      await refreshTenant();
      toast.success('¡Empresa configurada correctamente!');
      window.location.assign(profileDef.homePath);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la configuración inicial.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Logo width={180} height={60} />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Paso {step} de 3 · {tenant?.userEmail || 'Nuevo cliente'}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-colors ${
                n <= step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </div>
          )}

          {/* PASO 1: ACTIVIDAD */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Bienvenido a ResiGest 360: ¿cuál es tu actividad principal?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Adaptaremos automáticamente tu panel de inicio, indicadores y módulos legales para que veas únicamente lo que necesitas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SELECTABLE_PROFILES.map(({ id, icon: Icon }) => {
                  const def = PROFILE_DEFINITIONS[id];
                  const isSelected = selectedProfile === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedProfile(id)}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isSelected
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {def.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                          {def.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  Continuar con datos de empresa
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: DATOS DE LA EMPRESA */}
          {step === 2 && (
            <form onSubmit={handleNextFromStep2} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Datos identificativos ({profileDef.shortLabel})
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Estos datos aparecerán en tus Documentos de Identificación, contratos y archivo cronológico.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Ej: Talleres Mecánicos del Sur S.L."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CIF / NIF *
                  </label>
                  <input
                    type="text"
                    value={cif}
                    onChange={(e) => setCif(e.target.value)}
                    placeholder="Ej: B12345678"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    NIMA (opcional)
                  </label>
                  <input
                    type="text"
                    value={nima}
                    onChange={(e) => setNima(e.target.value)}
                    placeholder="Ej: 4100012345"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    value={nombreComercial}
                    onChange={(e) => setNombreComercial(e.target.value)}
                    placeholder="Nombre corto"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Dirección de la instalación / sede
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle, Polígono, Número..."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Municipio
                  </label>
                  <input
                    type="text"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                  />
                </div>

                {selectedProfile === 'transportista' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Matrícula del Vehículo Principal *
                    </label>
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Ej: 4812-MTR"
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                      required
                    />
                  </div>
                )}

                {(selectedProfile === 'gestor_rp' ||
                  selectedProfile === 'chatarreria' ||
                  selectedProfile === 'baterias' ||
                  selectedProfile === 'transportista') && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Nº de Autorización / Inscripción Ambiental
                    </label>
                    <input
                      type="text"
                      value={numeroAutorizacion}
                      onChange={(e) => setNumeroAutorizacion(e.target.value)}
                      placeholder="Ej: G-AN-2025/0012"
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                )}

                {selectedProfile !== 'transportista' && selectedProfile !== 'negociante' && (
                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      id="createCenter"
                      type="checkbox"
                      checked={createInitialCenter}
                      onChange={(e) => setCreateInitialCenter(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="createCenter" className="text-xs text-gray-700 dark:text-gray-300">
                      Crear automáticamente un centro principal con estos datos para emitir DIs desde el primer momento
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  Revisar módulos y activar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* PASO 3: CONFIRMACIÓN */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Resumen de tu entorno adaptado
                </h2>
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 space-y-2 text-xs">
                <p>
                  <span className="text-gray-500">Empresa:</span>{' '}
                  <strong className="text-gray-900 dark:text-white">{razonSocial}</strong> ({cif.toUpperCase()})
                </p>
                <p>
                  <span className="text-gray-500">Perfil operativo:</span>{' '}
                  <strong className="text-brand-600 dark:text-brand-400">{profileDef.label}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Pantalla inicial:</span>{' '}
                  <code className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-900">{profileDef.homePath}</code>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Módulos que quedarán activos para esta empresa:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeModules.map((mod) => (
                    <div
                      key={mod}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-medium text-emerald-900 dark:text-emerald-200"
                    >
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{MODULE_LABELS[mod]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleFinish}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  {saving ? 'Guardando configuración...' : 'Finalizar y acceder a mi panel'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
