'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import wasteContractService, { validateContractActivation } from '@/services/wasteContractService';
import { validateRequired, scrollToFirstError } from '@/lib/validations/formValidation';
import companyService from '@/services/companyService';
import wasteTypeService from '@/services/wasteTypeService';
import treatmentManagerService from '@/services/treatmentManagerService';
import productionCenterService from '@/services/productionCenterService';
import authorizationService, { type AuthorizedScopeResult } from '@/services/authorizationService';
import type {
  Company,
  WasteContractFormData,
  WasteType,
  TreatmentManager,
  ProductionCenter,
  ContractWasteCodeFormData,
} from '@/types/wasteManagement';
import DatePicker from '../form/date-picker';
import LerSelector from '@/components/residuos/LerSelector';

const TIPOS_CONTRATO = [
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'recogida', label: 'Recogida' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'valoracion', label: 'Valoración' },
  { value: 'eliminacion', label: 'Eliminación' },
];

interface NuevoContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  myCompany: Company;
}

export default function NuevoContratoModal({
  isOpen,
  onClose,
  onSuccess,
  myCompany,
}: NuevoContratoModalProps) {
  const [saving, setSaving] = useState(false);
  const [gestores, setGestores] = useState<Company[]>([]);
  const [internalGestores, setInternalGestores] = useState<TreatmentManager[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGestorForm, setShowGestorForm] = useState(false);
  const [, setWasteTypes] = useState<WasteType[]>([]);
  const [producerCenters, setProducerCenters] = useState<ProductionCenter[]>([]);
  const [gestorCenters, setGestorCenters] = useState<ProductionCenter[]>([]);
  const [destAuthScope, setDestAuthScope] = useState<AuthorizedScopeResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const [contractWasteCodes, setContractWasteCodes] = useState<ContractWasteCodeFormData[]>([
    { codigo_ler: '', descripcion_ler: '', operacion_tratamiento: 'R13' },
  ]);

  const [formData, setFormData] = useState<WasteContractFormData>({
    company_id: myCompany.id,
    gestor_company_id: undefined,
    producer_center_id: undefined,
    gestor_center_id: undefined,
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

  const [gestorData, setGestorData] = useState({
    razon_social: '',
    cif: '',
    nima: '',
    direccion: '',
    telefono: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadGestores();
      loadWasteTypes();
      loadProducerCenters();
      const numeroContrato = wasteContractService.generateContractNumber(myCompany.id);
      setFormData((prev) => ({ ...prev, numero_contrato: numeroContrato }));
    }
  }, [isOpen, myCompany.id]);

  const loadProducerCenters = async () => {
    try {
      const centers = await productionCenterService.getByCompanyId(myCompany.id);
      setProducerCenters(centers);
    } catch (e) {
      console.error('Error cargando centros del productor:', e);
    }
  };

  const loadWasteTypes = async () => {
    try {
      const data = await wasteTypeService.getAll();
      setWasteTypes(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadGestores = async () => {
    try {
      const [gestoresData, internalData] = await Promise.all([
        companyService.getByType('gestor'),
        treatmentManagerService.getAll(),
      ]);
      setGestores(gestoresData);
      setInternalGestores(internalData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (formData.gestor_company_id) {
      productionCenterService
        .getByCompanyId(formData.gestor_company_id)
        .then(setGestorCenters)
        .catch(console.error);
      authorizationService
        .getAuthorizedScope(formData.gestor_company_id, formData.gestor_center_id, formData.fecha_inicio)
        .then(setDestAuthScope)
        .catch(console.error);
    } else {
      setGestorCenters([]);
      setDestAuthScope(null);
    }
  }, [formData.gestor_company_id, formData.gestor_center_id, formData.fecha_inicio]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleGestorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGestorData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: 'fecha_contrato' | 'fecha_inicio' | 'fecha_fin') => (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const dateStr = dates[0].toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, [field]: dateStr }));
      clearFieldError(field);
    }
  };

  const handleSearchGestor = async () => {
    if (searchQuery.trim().length < 2) return;

    try {
      const results = await companyService.search(searchQuery);
      setGestores(results);
    } catch (err: any) {
      setError(`Error al buscar: ${err.message}`);
    }
  };

  const handleCreateGestor = async () => {
    if (!gestorData.razon_social || !gestorData.cif) {
      setError('La razón social y el CIF son obligatorios');
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
      setError(`Error al crear gestor: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errorsMap: Record<string, string> = {};
    const fechaErr = validateRequired(formData.fecha_contrato);
    if (fechaErr) errorsMap.fecha_contrato = fechaErr;

    const tipoErr = validateRequired(formData.tipo_contrato);
    if (tipoErr) errorsMap.tipo_contrato = tipoErr;

    if (formData.fecha_inicio && formData.fecha_fin) {
      if (!wasteContractService.validateDates(formData.fecha_inicio, formData.fecha_fin)) {
        errorsMap.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio.';
      }
    }

    contractWasteCodes.forEach((wc, idx) => {
      if (!wc.codigo_ler.trim()) {
        errorsMap[`ler_${idx}`] = 'El código LER es requerido';
      }
      if (!wc.operacion_tratamiento.trim()) {
        errorsMap[`op_${idx}`] = 'Operación requerida';
      }
    });

    if (Object.keys(errorsMap).length > 0) {
      setFieldErrors(errorsMap);
      setError('Por favor, completa los campos requeridos marcados en rojo.');
      scrollToFirstError(errorsMap);
      return;
    }

    // Filtrar residuos válidos
    const validWasteCodes = contractWasteCodes
      .filter((wc) => wc.codigo_ler.trim().length > 0)
      .map((wc) => ({
        ...wc,
        codigo_ler: wc.codigo_ler.trim(),
        operacion_tratamiento: wc.operacion_tratamiento.trim().toUpperCase(),
      }));

    // Validación estricta si se pretende crear en estado Vigente (Bloque 3)
    if (formData.estado === 'vigente') {
      const tempContract: any = {
        ...formData,
        contract_waste_codes: validWasteCodes,
        codigos_ler: validWasteCodes.map((c) => c.codigo_ler),
        operaciones_tratamiento: validWasteCodes.map((c) => c.operacion_tratamiento),
      };

      const validation = validateContractActivation(tempContract);
      if (!validation.canActivate) {
        setError(
          `No se puede activar el contrato directamente como Vigente: ${validation.errors.join(' ')}. Puedes guardarlo como "Borrador" mientras completas los requisitos.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      // Convertir cadenas vacías a undefined para campos de fecha y numéricos
      const cleanedData = {
        ...formData,
        fecha_inicio: formData.fecha_inicio || undefined,
        fecha_fin: formData.fecha_fin || undefined,
        cantidad_maxima_anual: formData.cantidad_maxima_anual || undefined,
        precio_unitario: formData.precio_unitario || undefined,
        contract_waste_codes: validWasteCodes,
      };

      await wasteContractService.create(cleanedData);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      company_id: myCompany.id,
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
    setError(null);
    setShowGestorForm(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-5xl max-h-[90vh] overflow-y-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Nuevo Contrato de Tratamiento</h2>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        {/* Datos del Contrato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Datos del Contrato</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_contrato">Número de Contrato</Label>
              <Input
                id="numero_contrato"
                name="numero_contrato"
                value={formData.numero_contrato}
                onChange={handleChange}
                placeholder="Se genera automáticamente"
              />
            </div>

            <div>
              <Label htmlFor="fecha_contrato" required>Fecha del Contrato</Label>
              <DatePicker
                id="fecha_contrato"
                mode="single"
                onChange={handleDateChange('fecha_contrato')}
                defaultDate={formData.fecha_contrato ? new Date(formData.fecha_contrato) : new Date()}
              />
              {fieldErrors.fecha_contrato && (
                <p className="mt-1 text-xs text-error-500 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 inline shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{fieldErrors.fecha_contrato}</span>
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
              <DatePicker
                id="fecha_inicio"
                mode="single"
                onChange={handleDateChange('fecha_inicio')}
                defaultDate={formData.fecha_inicio ? new Date(formData.fecha_inicio) : undefined}
              />
            </div>

            <div>
              <Label htmlFor="fecha_fin">Fecha de Fin</Label>
              <DatePicker
                id="fecha_fin"
                mode="single"
                onChange={handleDateChange('fecha_fin')}
                defaultDate={formData.fecha_fin ? new Date(formData.fecha_fin) : undefined}
              />
              {fieldErrors.fecha_fin && (
                <p className="mt-1 text-xs text-error-500 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 inline shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{fieldErrors.fecha_fin}</span>
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="tipo_contrato" required>Tipo de Contrato</Label>
              <select
                id="tipo_contrato"
                name="tipo_contrato"
                value={formData.tipo_contrato}
                onChange={handleChange}
                className={`h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:bg-dark dark:focus:border-primary ${
                  fieldErrors.tipo_contrato ? 'border-error-500' : 'border-stroke dark:border-strokedark'
                }`}
              >
                {TIPOS_CONTRATO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              {fieldErrors.tipo_contrato && (
                <p className="mt-1 text-xs text-error-500 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 inline shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{fieldErrors.tipo_contrato}</span>
                </p>
              )}
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
        </div>

        {/* Mi Empresa */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Productor / Mi Empresa</h3>
          <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Razón Social:</strong> {myCompany.razon_social}</p>
            <p><strong>CIF:</strong> {myCompany.cif}</p>
            {myCompany.nima && <p><strong>NIMA:</strong> {myCompany.nima}</p>}

            {producerCenters.length > 0 && (
              <div className="pt-2 border-t border-stroke dark:border-strokedark mt-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Instalación / Centro de Origen del Residuo
                </label>
                <select
                  name="producer_center_id"
                  value={formData.producer_center_id || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      producer_center_id: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-stroke bg-white dark:bg-dark px-3 text-sm shadow-xs focus:border-primary"
                >
                  <option value="">🏢 Sede / Instalación Principal</option>
                  {producerCenters.map((center) => (
                    <option key={center.id} value={center.id}>
                      📍 {center.nombre} ({center.municipio || 'S/D'}) - NIMA: {center.nima}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Gestor / Destinatario */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Gestor / Destinatario</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mis Gestores Internos</label>
              <select
                name="treatment_manager_id"
                value={formData.treatment_manager_id || ''}
                onChange={(e) => {
                  const id = e.target.value ? parseInt(e.target.value) : undefined;
                  setFormData(prev => ({ ...prev, treatment_manager_id: id, gestor_company_id: undefined, gestor_center_id: undefined }));
                }}
                className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
              >
                <option value="">Selecciona uno de tus gestores...</option>
                {internalGestores.map((gestor) => (
                  <option key={gestor.id} value={gestor.id}>
                    {gestor.nombre} ({gestor.razon_social})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gestores Públicos</label>
              <select
                name="gestor_company_id"
                value={formData.gestor_company_id || ''}
                onChange={(e) => {
                  const id = e.target.value ? parseInt(e.target.value) : undefined;
                  setFormData(prev => ({ ...prev, gestor_company_id: id, treatment_manager_id: undefined, gestor_center_id: undefined }));
                }}
                className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
              >
                <option value="">Selecciona un gestor público...</option>
                {gestores.map((gestor) => (
                  <option key={gestor.id} value={gestor.id}>
                    {gestor.razon_social} - {gestor.cif}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {gestorCenters.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Instalación / Centro de Destino del Gestor
              </label>
              <select
                name="gestor_center_id"
                value={formData.gestor_center_id || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gestor_center_id: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="h-10 w-full rounded-lg border border-stroke bg-white dark:bg-dark px-3 text-sm shadow-xs focus:border-primary"
              >
                <option value="">🏢 Sede / Planta Principal del Gestor</option>
                {gestorCenters.map((center) => (
                  <option key={center.id} value={center.id}>
                    📍 {center.nombre} ({center.municipio || 'S/D'}) - NIMA: {center.nima}
                  </option>
                ))}
              </select>
            </div>
          )}

          {destAuthScope && destAuthScope.authorizations && destAuthScope.authorizations.length > 0 && (
            <div className="p-3 bg-brand-50/70 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-xl">
              <p className="text-xs font-bold text-brand-950 dark:text-brand-200 flex items-center gap-1.5">
                <span>📜</span> Autorización Ambiental Vigente: {destAuthScope.authorizations[0].numero_autorizacion}
              </p>
              <p className="text-xs text-brand-700 dark:text-brand-400 mt-0.5">
                {destAuthScope.authorizations[0].titulo} — Vigencia: {destAuthScope.authorizations[0].es_indefinida ? 'Indefinida' : destAuthScope.authorizations[0].fecha_vencimiento}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 mt-4">
              O buscar otro Gestor Público
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por razón social, CIF o NIMA..."
                className="flex-1 px-3 py-2 border border-stroke rounded-md text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchGestor();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={handleSearchGestor}>
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
              size="sm"
              onClick={() => setShowGestorForm(!showGestorForm)}
            >
              {showGestorForm ? 'Cancelar' : '+ Crear Nuevo Gestor'}
            </Button>

            {showGestorForm && (
              <div className="mt-4 p-4 bg-muted/20 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Razón Social *</label>
                  <Input
                    name="razon_social"
                    value={gestorData.razon_social}
                    onChange={handleGestorChange}
                    placeholder="Nombre de la empresa gestora"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                <Button type="button" size="sm" onClick={handleCreateGestor}>
                  Crear Gestor
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Residuos Cubiertos por el Contrato (Matriz LER y Operaciones) */}
        <div className="space-y-4 border-t border-stroke dark:border-strokedark pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span>🎯</span> Residuos Cubiertos por el Contrato (Matriz LER y Operaciones)
              </h3>
              <p className="text-xs text-muted">
                Define los códigos LER autorizados, la operación de tratamiento (R o D) y las condiciones económicas.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setContractWasteCodes((prev) => [
                  ...prev,
                  { codigo_ler: '', descripcion_ler: '', operacion_tratamiento: 'R13' },
                ])
              }
            >
              + Añadir LER
            </Button>
          </div>

          <div className="space-y-3">
            {contractWasteCodes.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-muted/20 border border-stroke dark:border-strokedark rounded-xl flex flex-col md:flex-row gap-3 items-start md:items-center"
              >
                <div className="w-full md:w-64">
                  <Label className="text-xs mb-1" required>Código LER</Label>
                  <LerSelector
                    value={item.codigo_ler}
                    onChange={(val, wt) => {
                      setContractWasteCodes((prev) => {
                        const copy = [...prev];
                        copy[idx] = {
                          ...copy[idx],
                          codigo_ler: val,
                          descripcion_ler: wt?.descripcion || copy[idx].descripcion_ler,
                          operacion_tratamiento: wt?.operaciones_permitidas?.[0] || copy[idx].operacion_tratamiento || 'R13'
                        };
                        return copy;
                      });
                      clearFieldError(`ler_${idx}`);
                    }}
                    error={Boolean(fieldErrors[`ler_${idx}`])}
                    hint={fieldErrors[`ler_${idx}`]}
                    required
                  />
                </div>

                <div className="w-full md:flex-1">
                  <Label className="text-xs mb-1">Descripción</Label>
                  <input
                    type="text"
                    placeholder="Envases de papel y cartón"
                    value={item.descripcion_ler || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContractWasteCodes((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], descripcion_ler: val };
                        return copy;
                      });
                    }}
                    className="h-10 w-full px-3 text-sm rounded-lg border border-stroke bg-white dark:bg-dark shadow-xs focus:border-primary"
                  />
                </div>

                <div className="w-full md:w-32">
                  <Label className="text-xs mb-1" required>Operación R/D</Label>
                  <input
                    type="text"
                    placeholder="R13"
                    value={item.operacion_tratamiento}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setContractWasteCodes((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], operacion_tratamiento: val };
                        return copy;
                      });
                      clearFieldError(`op_${idx}`);
                    }}
                    className={`h-10 w-full px-3 text-sm rounded-lg border bg-white dark:bg-dark shadow-xs focus:border-primary ${
                      fieldErrors[`op_${idx}`] ? 'border-error-500' : 'border-stroke'
                    }`}
                  />
                  {fieldErrors[`op_${idx}`] && (
                    <p className="mt-1 text-xs text-error-500 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 inline shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{fieldErrors[`op_${idx}`]}</span>
                    </p>
                  )}
                </div>

                <div className="w-full md:w-28">
                  <label className="block text-xs font-medium mb-1">Tarifa (€/t)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.tarifa_gestion ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : undefined;
                      setContractWasteCodes((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], tarifa_gestion: val };
                        return copy;
                      });
                    }}
                    className="h-10 w-full px-3 text-sm rounded-lg border border-stroke bg-white dark:bg-dark shadow-xs focus:border-primary"
                  />
                </div>

                {contractWasteCodes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setContractWasteCodes((prev) => prev.filter((_, i) => i !== idx))}
                    className="mt-4 md:mt-5 p-2 text-red-500 hover:text-red-700 rounded-lg transition"
                    title="Eliminar este residuo"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium mb-2">Cantidad Máxima Anual (Total)</label>
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notas / Observaciones</label>
            <TextArea
              value={formData.notas}
              onChange={(value) => setFormData(prev => ({ ...prev, notas: value }))}
              rows={2}
              placeholder="Información adicional del contrato..."
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-stroke">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creando...' : 'Crear Contrato'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
