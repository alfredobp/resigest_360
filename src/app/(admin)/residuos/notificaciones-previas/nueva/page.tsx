'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import { toast } from '@/context/ToastContext';
import { priorNotificationService } from '@/services/priorNotificationService';
import companyService from '@/services/companyService';
import productionCenterService from '@/services/productionCenterService';
import treatmentManagerService from '@/services/treatmentManagerService';
import wasteTypeService from '@/services/wasteTypeService';
import type { PriorNotification, Company, ProductionCenter, TreatmentManager, WasteType } from '@/types/wasteManagement';
import { ArrowLeft, Save, Send } from 'lucide-react';

export default function NuevaNotificacionPreviaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [_myCompany, setMyCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [managers, setManagers] = useState<TreatmentManager[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<PriorNotification>>({
    tipo_notificacion: 'general',
    tipo_traslado: 'autonomico',
    fecha_notificacion: todayStr,
    fecha_inicio: todayStr,
    fecha_fin: nextYearStr,
    peligrosidad: 'no-peligroso',
    caracteristica_peligrosidad: 'HP4',
    operacion_tratamiento: 'R13',
    cantidad_estimada_kg: 1000,
    numero_traslados_previstos: 1,
    estado: 'borrador',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const company = await companyService.getUserCompany();
      if (!company) {
        toast.error('Debes registrar o configurar tu empresa primero.');
        router.push('/residuos/mi-empresa');
        return;
      }
      setMyCompany(company);

      const [centers, managersList, wastes] = await Promise.all([
        productionCenterService.getByCompanyId(company.id).catch(() => []),
        treatmentManagerService.getAll().catch(() => []),
        wasteTypeService.getAll().catch(() => []),
      ]);

      setProductionCenters(centers);
      setManagers(managersList);
      setWasteTypes(wastes);

      // Precargar datos del Operador con la empresa principal
      setFormData((prev) => ({
        ...prev,
        company_id: company.id,
        operador_razon_social: company.razon_social,
        operador_cif: company.cif,
        operador_nima: company.nima || '',
        operador_direccion: company.domicilio_social || '',
        operador_municipio: company.municipio_social || '',
        operador_codigo_postal: company.codigo_postal_social || company.codigo_postal_instalacion || '',
        operador_provincia: company.provincia_social || 'Cádiz',
        operador_telefono: company.telefono || '',
        operador_email: company.email || '',

        // Por defecto, productor es la misma empresa o su sede principal
        productor_razon_social: company.razon_social,
        productor_cif: company.cif,
        productor_nima: company.nima || '',
        productor_direccion: company.domicilio_social || '',
        productor_municipio: company.municipio_social || '',
        productor_codigo_postal: company.codigo_postal_social || company.codigo_postal_instalacion || '',
        productor_provincia: company.provincia_social || 'Cádiz',
      }));
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleCenterSelect = (centerId: string) => {
    if (!centerId) return;
    const center = productionCenters.find((c) => String(c.id) === centerId);
    if (!center) return;

    setFormData((prev) => ({
      ...prev,
      production_center_id: center.id,
      productor_nima: center.nima || prev.productor_nima,
      productor_direccion: center.direccion || prev.productor_direccion,
      productor_municipio: center.municipio || prev.productor_municipio,
      productor_codigo_postal: center.codigo_postal || prev.productor_codigo_postal,
      productor_provincia: center.provincia || prev.productor_provincia,
    }));
  };

  const handleManagerSelect = (managerId: string) => {
    if (!managerId) return;
    const manager = managers.find((m) => String(m.id) === managerId);
    if (!manager) return;

    setFormData((prev) => ({
      ...prev,
      gestor_razon_social: manager.nombre,
      gestor_cif: manager.cif || '',
      gestor_nima: manager.nima || '',
      gestor_numero_autorizacion: manager.numero_autorizacion || manager.nima || '',
      gestor_direccion: manager.direccion || '',
      gestor_municipio: manager.municipio || '',
      gestor_codigo_postal: manager.codigo_postal || '',
      gestor_provincia: manager.provincia || 'Cádiz',
    }));
  };

  const handleWasteSelect = (lerCode: string) => {
    if (!lerCode) return;
    const waste = wasteTypes.find((w) => w.codigo_ler === lerCode);
    const isDangerous = lerCode.includes('*') || waste?.categoria === 'peligroso';

    setFormData((prev) => ({
      ...prev,
      codigo_ler: lerCode,
      descripcion_residuo: waste?.descripcion || prev.descripcion_residuo || '',
      peligrosidad: isDangerous ? 'peligroso' : 'no-peligroso',
      caracteristica_peligrosidad: isDangerous ? 'HP4' : undefined,
    }));
  };

  const handleFillTestData = () => {
    const formattedCode = priorNotificationService.formatNTCode('', '1100000001');
    setFormData((prev) => ({
      ...prev,
      numero_notificacion: formattedCode,
      operador_razon_social: prev.operador_razon_social || 'EMPRESA OPERADORA PRUEBAS S.L.',
      operador_cif: prev.operador_cif || 'B11999999',
      operador_nima: '',
      operador_direccion: prev.operador_direccion || 'Polígono Industrial Zona Franca C/ Prueba 1',
      operador_municipio: prev.operador_municipio || 'Cádiz',
      operador_codigo_postal: prev.operador_codigo_postal || '11011',
      operador_provincia: prev.operador_provincia || 'Cádiz',
      productor_razon_social: prev.productor_razon_social || 'CENTRO PRODUCTOR PRUEBAS S.L.',
      productor_cif: prev.productor_cif || 'B11999999',
      productor_nima: '',
      productor_direccion: prev.productor_direccion || 'Avda. de la Innovación 10',
      productor_municipio: prev.productor_municipio || 'Jerez de la Frontera',
      productor_codigo_postal: prev.productor_codigo_postal || '11405',
      productor_provincia: prev.productor_provincia || 'Cádiz',
      gestor_razon_social: 'GESTOR MEDIOAMBIENTAL DEMO S.A.',
      gestor_cif: 'A41999999',
      gestor_nima: '',
      gestor_numero_autorizacion: 'G04',
      gestor_direccion: 'Parque Tecnológico Reciclaje Parcela 4',
      gestor_municipio: 'Los Barrios',
      gestor_codigo_postal: '11370',
      gestor_provincia: 'Cádiz',
      codigo_ler: prev.codigo_ler || '150102',
      descripcion_residuo: prev.descripcion_residuo || 'Envases de plástico de prueba',
      peligrosidad: 'no-peligroso',
      operacion_tratamiento: 'R13',
      cantidad_estimada_kg: 2500,
      numero_traslados_previstos: 5,
    }));
    toast.info('Datos de prueba cargados (sin necesidad de NIMA real).');
  };

  const handleSubmit = async (e?: React.FormEvent, andSendToSira = false) => {
    if (e) e.preventDefault();
    setError(null);

    const payloadToSave: Partial<PriorNotification> = {
      ...formData,
      numero_notificacion: priorNotificationService.formatNTCode(
        formData.numero_notificacion || '',
        formData.productor_nima || formData.operador_nima || '1100000001'
      ),
    };

    // Validación preliminar
    const validation = priorNotificationService.validateForE3L(payloadToSave);
    if (!validation.valid) {
      setError(`Errores de validación E3L:\n• ${validation.errors.join('\n• ')}`);
      toast.error('Por favor, completa los campos obligatorios para E3L.');
      return;
    }

    try {
      setSaving(true);
      const created = await priorNotificationService.create(payloadToSave);
      toast.success('Notificación Previa guardada correctamente.');

      if (andSendToSira) {
        toast.info('Transmitiendo Notificación a SIRA...');
        const result = await priorNotificationService.sendToSira(created.id, false);
        toast.success(`Notificación Previa presentada en SIRA con éxito (ID: ${result.siraId})`);
      }

      router.push(`/residuos/notificaciones-previas/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la Notificación Previa');
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted">Cargando datos de la Notificación Previa...</p>
      </div>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Nueva Notificación Previa (NT)" />

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Nueva Notificación Previa de Traslado (NT)
            </h2>
            <p className="text-sm text-muted">
              Genera y presenta el documento electrónico reglamentario E3L v3.3 ante la Junta de Andalucía.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleFillTestData}
              className="flex items-center gap-1.5"
            >
              🧪 Rellenar Datos de Prueba
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/residuos/notificaciones-previas')}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Atención" message={error} />
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* 1. Datos Generales de la NT */}
          <ComponentCard title="1. Datos Generales de la Notificación">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Régimen de Notificación *</label>
                <select
                  className="w-full h-11 px-3 py-2 border rounded-lg bg-background text-foreground border-border"
                  value={formData.tipo_notificacion}
                  onChange={(e) => setFormData({ ...formData, tipo_notificacion: e.target.value as any })}
                  required
                >
                  <option value="general">General (Múltiples traslados durante la vigencia)</option>
                  <option value="individual">Individual (Un único traslado)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ámbito de Traslado</label>
                <select
                  className="w-full h-11 px-3 py-2 border rounded-lg bg-background text-foreground border-border"
                  value={formData.tipo_traslado}
                  onChange={(e) => setFormData({ ...formData, tipo_traslado: e.target.value as any })}
                >
                  <option value="autonomico">Autonómico (Dentro de Andalucía)</option>
                  <option value="interautonomico">Interautonómico (Entre Comunidades Autónomas)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Código NT (Opcional si se auto-genera)</label>
                <Input
                  type="text"
                  placeholder="Ej. NT10110000000120260000001"
                  value={formData.numero_notificacion || ''}
                  onChange={(e) => setFormData({ ...formData, numero_notificacion: e.target.value })}
                />
                <p className="text-[11px] text-muted mt-1">Si se deja vacío, SIRA o ResiGest generarán el código oficial E3L.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha Notificación *</label>
                <Input
                  type="date"
                  value={formData.fecha_notificacion}
                  onChange={(e) => setFormData({ ...formData, fecha_notificacion: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha Inicio de Vigencia *</label>
                <Input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha Fin de Vigencia *</label>
                <Input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  required
                />
              </div>
            </div>
          </ComponentCard>

          {/* 2. Operador del Traslado */}
          <ComponentCard
            title="2. Operador del Traslado (Persona o Entidad que Organiza el Envío)"
            desc="Suele corresponderse con el productor o negociante autorizado."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Razón Social *</label>
                <Input
                  type="text"
                  value={formData.operador_razon_social || ''}
                  onChange={(e) => setFormData({ ...formData, operador_razon_social: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CIF / NIF *</label>
                <Input
                  type="text"
                  value={formData.operador_cif || ''}
                  onChange={(e) => setFormData({ ...formData, operador_cif: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">NIMA Operador</label>
                <Input
                  type="text"
                  value={formData.operador_nima || ''}
                  onChange={(e) => setFormData({ ...formData, operador_nima: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <Input
                  type="text"
                  value={formData.operador_direccion || ''}
                  onChange={(e) => setFormData({ ...formData, operador_direccion: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Municipio *</label>
                <Input
                  type="text"
                  value={formData.operador_municipio || ''}
                  onChange={(e) => setFormData({ ...formData, operador_municipio: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Provincia *</label>
                <Input
                  type="text"
                  value={formData.operador_provincia || ''}
                  onChange={(e) => setFormData({ ...formData, operador_provincia: e.target.value })}
                  required
                />
              </div>
            </div>
          </ComponentCard>

          {/* 3. Productor / Instalación de Origen */}
          <ComponentCard
            title="3. Productor o Instalación de Origen"
            desc="Instalación donde se genera el residuo y desde donde partirá el traslado."
          >
            {productionCenters.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Autocompletar desde Centro de Producción:
                </label>
                <select
                  className="w-full h-10 px-3 py-1.5 border rounded-lg bg-background text-foreground border-border text-sm"
                  onChange={(e) => handleCenterSelect(e.target.value)}
                  defaultValue=""
                >
                  <option value="">-- Seleccionar centro registrado --</option>
                  {productionCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (NIMA: {c.nima})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Razón Social Productor *</label>
                <Input
                  type="text"
                  value={formData.productor_razon_social || ''}
                  onChange={(e) => setFormData({ ...formData, productor_razon_social: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CIF / NIF *</label>
                <Input
                  type="text"
                  value={formData.productor_cif || ''}
                  onChange={(e) => setFormData({ ...formData, productor_cif: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">NIMA Productor (10 dígitos - Opcional en pruebas)</label>
                <Input
                  type="text"
                  placeholder="Ej. 1100000001 (opcional en pruebas)"
                  value={formData.productor_nima || ''}
                  onChange={(e) => setFormData({ ...formData, productor_nima: e.target.value })}
                />
                <p className="text-xs text-muted mt-1">
                  Si lo dejas vacío, se usará un código de prueba válido para el esquema XML E3L.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dirección Origen</label>
                <Input
                  type="text"
                  value={formData.productor_direccion || ''}
                  onChange={(e) => setFormData({ ...formData, productor_direccion: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Municipio Origen *</label>
                <Input
                  type="text"
                  value={formData.productor_municipio || ''}
                  onChange={(e) => setFormData({ ...formData, productor_municipio: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Provincia Origen *</label>
                <Input
                  type="text"
                  value={formData.productor_provincia || ''}
                  onChange={(e) => setFormData({ ...formData, productor_provincia: e.target.value })}
                  required
                />
              </div>
            </div>
          </ComponentCard>

          {/* 4. Gestor Destinatario */}
          <ComponentCard
            title="4. Destinatario / Gestor de Destino"
            desc="Instalación de tratamiento autorizada que recibirá y tratará el residuo."
          >
            {managers.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Autocompletar desde Gestores Autorizados:
                </label>
                <select
                  className="w-full h-10 px-3 py-1.5 border rounded-lg bg-background text-foreground border-border text-sm"
                  onChange={(e) => handleManagerSelect(e.target.value)}
                  defaultValue=""
                >
                  <option value="">-- Seleccionar gestor de la base de datos --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({m.cif})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Razón Social Gestor *</label>
                <Input
                  type="text"
                  value={formData.gestor_razon_social || ''}
                  onChange={(e) => setFormData({ ...formData, gestor_razon_social: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CIF / NIF *</label>
                <Input
                  type="text"
                  value={formData.gestor_cif || ''}
                  onChange={(e) => setFormData({ ...formData, gestor_cif: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">NIMA Gestor (10 dígitos - Opcional en pruebas)</label>
                <Input
                  type="text"
                  placeholder="Ej. 1100000002 (opcional en pruebas)"
                  value={formData.gestor_nima || ''}
                  onChange={(e) => setFormData({ ...formData, gestor_nima: e.target.value })}
                />
                <p className="text-xs text-muted mt-1">
                  Si lo dejas vacío, se usará un código de prueba válido para el esquema XML E3L.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nº Autorización Gestor</label>
                <Input
                  type="text"
                  placeholder="Ej. G-00001 o NIMA"
                  value={formData.gestor_numero_autorizacion || ''}
                  onChange={(e) => setFormData({ ...formData, gestor_numero_autorizacion: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Municipio Gestor *</label>
                <Input
                  type="text"
                  value={formData.gestor_municipio || ''}
                  onChange={(e) => setFormData({ ...formData, gestor_municipio: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Provincia Gestor *</label>
                <Input
                  type="text"
                  value={formData.gestor_provincia || ''}
                  onChange={(e) => setFormData({ ...formData, gestor_provincia: e.target.value })}
                  required
                />
              </div>
            </div>
          </ComponentCard>

          {/* 5. Residuos y Tratamiento */}
          <ComponentCard
            title="5. Residuos Transportados y Operación de Tratamiento"
            desc="Identificación del código LER, tratamiento reglamentario y cantidad estimada para el periodo."
          >
            {wasteTypes.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Autocompletar desde Catálogo de Residuos:
                </label>
                <select
                  className="w-full h-10 px-3 py-1.5 border rounded-lg bg-background text-foreground border-border text-sm"
                  onChange={(e) => handleWasteSelect(e.target.value)}
                  defaultValue=""
                >
                  <option value="">-- Seleccionar código LER --</option>
                  {wasteTypes.map((w) => (
                    <option key={w.id} value={w.codigo_ler}>
                      {w.codigo_ler} - {w.descripcion} ({w.categoria})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código LER (6 dígitos) *</label>
                <Input
                  type="text"
                  placeholder="Ej. 150110*"
                  value={formData.codigo_ler || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isDanger = val.includes('*');
                    setFormData({
                      ...formData,
                      codigo_ler: val,
                      peligrosidad: isDanger ? 'peligroso' : formData.peligrosidad,
                    });
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Peligrosidad *</label>
                <select
                  className="w-full h-11 px-3 py-2 border rounded-lg bg-background text-foreground border-border"
                  value={formData.peligrosidad}
                  onChange={(e) => setFormData({ ...formData, peligrosidad: e.target.value as any })}
                  required
                >
                  <option value="no-peligroso">No Peligroso</option>
                  <option value="peligroso">Peligroso (*)</option>
                </select>
              </div>

              {formData.peligrosidad === 'peligroso' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Característica HP (Tabla 5) *</label>
                  <select
                    className="w-full h-11 px-3 py-2 border rounded-lg bg-background text-foreground border-border"
                    value={formData.caracteristica_peligrosidad || 'HP4'}
                    onChange={(e) => setFormData({ ...formData, caracteristica_peligrosidad: e.target.value })}
                  >
                    <option value="HP1">HP1 - Explosivo</option>
                    <option value="HP2">HP2 - Comburente</option>
                    <option value="HP3">HP3 - Inflamable</option>
                    <option value="HP4">HP4 - Irritante / Lesiones oculares</option>
                    <option value="HP5">HP5 - Toxicidad específica en determinados órganos (STOT)</option>
                    <option value="HP6">HP6 - Toxicidad aguda</option>
                    <option value="HP7">HP7 - Carcinógeno</option>
                    <option value="HP8">HP8 - Corrosivo</option>
                    <option value="HP9">HP9 - Infeccioso</option>
                    <option value="HP10">HP10 - Tóxico para la reproducción</option>
                    <option value="HP11">HP11 - Mutágeno</option>
                    <option value="HP12">HP12 - Liberación de un gas de toxicidad aguda</option>
                    <option value="HP13">HP13 - Sensibilizante</option>
                    <option value="HP14">HP14 - Ecotóxico</option>
                    <option value="HP15">HP15 - Susceptible de manifestar una de las características anteriores</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Operación Tratamiento (Tabla 2) *</label>
                <select
                  className="w-full h-11 px-3 py-2 border rounded-lg bg-background text-foreground border-border"
                  value={formData.operacion_tratamiento || 'R13'}
                  onChange={(e) => setFormData({ ...formData, operacion_tratamiento: e.target.value })}
                  required
                >
                  <optgroup label="Valorización (R)">
                    <option value="R01">R01 - Utilización principal como combustible</option>
                    <option value="R02">R02 - Recuperación o regeneración de disolventes</option>
                    <option value="R03">R03 - Reciclado o recuperación de sustancias orgánicas</option>
                    <option value="R04">R04 - Reciclado o recuperación de metales</option>
                    <option value="R05">R05 - Reciclado o recuperación de otras materias inorgánicas</option>
                    <option value="R12">R12 - Intercambio de residuos para someterlos a operaciones R1-R11</option>
                    <option value="R13">R13 - Almacenamiento previo a valorización</option>
                  </optgroup>
                  <optgroup label="Eliminación (D)">
                    <option value="D01">D01 - Depósito sobre el suelo o en su interior</option>
                    <option value="D08">D08 - Tratamiento biológico</option>
                    <option value="D09">D09 - Tratamiento físico-químico</option>
                    <option value="D10">D10 - Incineración en tierra</option>
                    <option value="D13">D13 - Combinación o mezcla previa a eliminación</option>
                    <option value="D14">D14 - Reenvasado previo a operaciones D1-D13</option>
                    <option value="D15">D15 - Almacenamiento previo a eliminación</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cantidad Total Estimada (kg) *</label>
                <Input
                  type="number"
                  min="1"
                  step="0.001"
                  value={formData.cantidad_estimada_kg || ''}
                  onChange={(e) => setFormData({ ...formData, cantidad_estimada_kg: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nº Estimado de Traslados</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.numero_traslados_previstos || 1}
                  onChange={(e) => setFormData({ ...formData, numero_traslados_previstos: Number(e.target.value) })}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Descripción del Residuo *</label>
                <TextArea
                  rows={2}
                  placeholder="Detalla la denominación habitual del residuo..."
                  value={formData.descripcion_residuo || ''}
                  onChange={(val) => setFormData({ ...formData, descripcion_residuo: val })}
                  required
                />
              </div>
            </div>
          </ComponentCard>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/residuos/notificaciones-previas')}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="outline"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar como Borrador
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmit(undefined, true)}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {saving ? 'Procesando...' : 'Guardar y Presentar a SIRA'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

