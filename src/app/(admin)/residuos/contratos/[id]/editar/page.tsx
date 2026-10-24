'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import { toast } from '@/context/ToastContext';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import LerSelector from '@/components/residuos/LerSelector';
import wasteContractService, { validateContractActivation } from '@/services/wasteContractService';
import companyService from '@/services/companyService';
import wasteTypeService from '@/services/wasteTypeService';
import treatmentManagerService from '@/services/treatmentManagerService';
import productionCenterService from '@/services/productionCenterService';
import authorizationService, { type AuthorizedScopeResult } from '@/services/authorizationService';
import type {
  WasteContract,
  Company,
  CompanyRole,
  CompanyFormData,
  WasteContractFormData,
  WasteType,
  TreatmentManager,
  ProductionCenter,
  ContractWasteCodeFormData,
} from '@/types/wasteManagement';

const TIPOS_CONTRATO = [
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'recogida', label: 'Recogida' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'valoracion', label: 'Valoración' },
  { value: 'eliminacion', label: 'Eliminación' },
];

const OPERACIONES_FRECUENTES = [
  { code: 'R01', desc: 'Utilización principal como combustible' },
  { code: 'R03', desc: 'Reciclado/recuperación de sustancias orgánicas' },
  { code: 'R04', desc: 'Reciclado/recuperación de metales' },
  { code: 'R05', desc: 'Reciclado/recuperación de otras materias inorgánicas' },
  { code: 'R12', desc: 'Intercambio de residuos' },
  { code: 'R13', desc: 'Almacenamiento en espera de valorización' },
  { code: 'D01', desc: 'Depósito sobre el suelo o en su interior (vertedero)' },
  { code: 'D08', desc: 'Tratamiento biológico no especificado en otros apartados' },
  { code: 'D09', desc: 'Tratamiento físico-químico no especificado' },
  { code: 'D14', desc: 'Reenvasado previo a eliminación' },
  { code: 'D15', desc: 'Almacenamiento en espera de eliminación' },
];

export default function EditarContratoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<WasteContract | null>(null);
  const [gestores, setGestores] = useState<Company[]>([]);
  const [, setInternalGestores] = useState<TreatmentManager[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [producerCenters, setProducerCenters] = useState<ProductionCenter[]>([]);
  const [gestorCenters, setGestorCenters] = useState<ProductionCenter[]>([]);
  const [destAuthScope, setDestAuthScope] = useState<AuthorizedScopeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGestorForm, setShowGestorForm] = useState(false);

  const [contractWasteCodes, setContractWasteCodes] = useState<ContractWasteCodeFormData[]>([
    { codigo_ler: '', descripcion_ler: '', operacion_tratamiento: 'R13' },
  ]);

  const [formData, setFormData] = useState<WasteContractFormData>({
    company_id: 0,
    gestor_company_id: undefined,
    treatment_manager_id: undefined,
    producer_center_id: undefined,
    gestor_center_id: undefined,
    environmental_authorization_id: undefined,
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

  // Cargar centros del productor cuando cambie formData.company_id
  useEffect(() => {
    if (formData.company_id) {
      productionCenterService.getByCompanyId(formData.company_id)
        .then(setProducerCenters)
        .catch((err) => console.error('Error al cargar centros del productor:', err));
    }
  }, [formData.company_id]);

  // Cargar centros del gestor y autorización cuando cambie el gestor
  useEffect(() => {
    const gestorId = formData.gestor_company_id;
    if (gestorId) {
      productionCenterService.getByCompanyId(gestorId)
        .then(setGestorCenters)
        .catch((err) => console.error('Error al cargar centros del gestor:', err));

      authorizationService.getAuthorizedScope(gestorId)
        .then((res) => {
          setDestAuthScope(res);
          if (res.authorizations.length > 0 && !formData.environmental_authorization_id) {
            setFormData(prev => ({
              ...prev,
              environmental_authorization_id: res.authorizations[0].id,
            }));
          }
        })
        .catch((err) => console.error('Error al comprobar autorizaciones del gestor:', err));
    } else {
      setGestorCenters([]);
      setDestAuthScope(null);
    }
  }, [formData.gestor_company_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const contractData = await wasteContractService.getById(parseInt(id));
      setContract(contractData);

      const [allCompanies, legacyGestores, wastes] = await Promise.all([
        companyService.getAll(),
        treatmentManagerService.getAll().catch(() => []),
        wasteTypeService.getAll().catch(() => []),
      ]);

      const gestorCompanies = allCompanies.filter(
        c => c.tipo_empresa === 'gestor' || (c.roles && c.roles.includes('gestor'))
      );
      setGestores(gestorCompanies);
      setInternalGestores(legacyGestores);
      setWasteTypes(wastes);

      if (contractData) {
        setFormData({
          company_id: contractData.company_id,
          gestor_company_id: contractData.gestor_company_id || undefined,
          treatment_manager_id: contractData.treatment_manager_id || undefined,
          producer_center_id: contractData.producer_center_id || undefined,
          gestor_center_id: contractData.gestor_center_id || undefined,
          environmental_authorization_id: contractData.environmental_authorization_id || undefined,
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

        if (contractData.contract_waste_codes && contractData.contract_waste_codes.length > 0) {
          setContractWasteCodes(contractData.contract_waste_codes.map(c => ({
            codigo_ler: c.codigo_ler,
            descripcion_ler: c.descripcion_ler || '',
            operacion_tratamiento: c.operacion_tratamiento,
            cantidad_estimada_anual: c.cantidad_estimada_anual || undefined,
            tarifa_gestion: c.tarifa_gestion || undefined,
            tipo_precio: c.tipo_precio || 'por_tonelada',
          })));
        } else if (contractData.codigos_ler && contractData.codigos_ler.length > 0) {
          setContractWasteCodes(contractData.codigos_ler.map((ler, i) => ({
            codigo_ler: ler,
            descripcion_ler: '',
            operacion_tratamiento: contractData.operaciones_tratamiento?.[i] || contractData.operaciones_tratamiento?.[0] || 'R13',
          })));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWasteCodeRow = () => {
    setContractWasteCodes(prev => [
      ...prev,
      { codigo_ler: '', descripcion_ler: '', operacion_tratamiento: 'R13' },
    ]);
  };

  const handleRemoveWasteCodeRow = (idx: number) => {
    setContractWasteCodes(prev => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy.length > 0 ? copy : [{ codigo_ler: '', descripcion_ler: '', operacion_tratamiento: 'R13' }];
    });
  };

  const handleWasteRowChange = (idx: number, field: keyof ContractWasteCodeFormData, val: any) => {
    setContractWasteCodes(prev => {
      const copy = [...prev];
      const updated = { ...copy[idx], [field]: val };

      if (field === 'codigo_ler' && val) {
        const found = wasteTypes.find(w => w.codigo_ler.trim() === val.trim());
        if (found && !updated.descripcion_ler) {
          updated.descripcion_ler = found.descripcion;
        }
      }
      copy[idx] = updated;
      return copy;
    });
  };

  const handleSaveNewGestor = async () => {
    if (!newGestor.razon_social || !newGestor.cif) {
      toast.warning('Razón social y CIF son obligatorios');
      return;
    }

    try {
      const gestorData: CompanyFormData = {
        ...newGestor,
        tipo_empresa: 'gestor',
        roles: ['gestor' as CompanyRole],
        activo: true,
      };

      const created = await companyService.create(gestorData);
      setFormData((prev) => ({ ...prev, gestor_company_id: created.id }));
      setShowGestorForm(false);
      setNewGestor({ razon_social: '', cif: '', nima: '', email: '', telefono: '' });
      toast.success('Gestor creado y asignado con éxito.');
      
      const allCompanies = await companyService.getAll();
      const gestorCompanies = allCompanies.filter(
        c => c.tipo_empresa === 'gestor' || (c.roles && c.roles.includes('gestor'))
      );
      setGestores(gestorCompanies);
    } catch (err: any) {
      toast.error(`Error al crear gestor: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fecha_contrato || !formData.tipo_contrato) {
      const msg = 'Fecha de contrato y tipo son obligatorios';
      setError(msg);
      toast.warning(msg);
      return;
    }

    const validWasteCodes = contractWasteCodes.filter(c => !!c.codigo_ler.trim());
    if (formData.estado === 'vigente' && validWasteCodes.length === 0) {
      const msg = 'Para guardar como vigente, debe especificar al menos un residuo LER y su operación de tratamiento.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const cleanedData = {
        ...formData,
        fecha_inicio: formData.fecha_inicio || undefined,
        fecha_fin: formData.fecha_fin || undefined,
        cantidad_maxima_anual: formData.cantidad_maxima_anual || undefined,
        precio_unitario: formData.precio_unitario || undefined,
        gestor_company_id: formData.gestor_company_id || undefined,
        treatment_manager_id: formData.treatment_manager_id || undefined,
        producer_center_id: formData.producer_center_id || undefined,
        gestor_center_id: formData.gestor_center_id || undefined,
        environmental_authorization_id: formData.environmental_authorization_id || undefined,
        codigos_ler: validWasteCodes.map(c => c.codigo_ler.trim()),
        operaciones_tratamiento: Array.from(new Set(validWasteCodes.map(c => c.operacion_tratamiento.trim()).filter(Boolean))),
        contractWasteCodes: validWasteCodes,
      };

      if (formData.estado === 'vigente') {
        const val = validateContractActivation({
          ...cleanedData,
          company: contract?.company,
          treatment_manager: contract?.treatment_manager,
          gestor_company: contract?.gestor_company,
        });
        if (!val.valid) {
          const msg = `No se puede guardar como vigente: ${val.errors.join('; ')}`;
          setError(msg);
          toast.error(msg);
          setSaving(false);
          return;
        }
      }

      await wasteContractService.update(parseInt(id), cleanedData);
      toast.success('Contrato actualizado con éxito.');
      router.push(`/residuos/contratos/${id}`);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error al guardar contrato: ${err.message}`);
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

          {/* Partes e Instalaciones */}
          <ComponentCard title="Partes del Contrato e Instalaciones">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origen (Productor) */}
              <div className="space-y-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="text-foreground font-semibold">
                  <h4>Origen: Empresa Productora</h4>
                </div>
                {contract?.company && (
                  <p className="text-sm font-medium text-foreground">
                    {contract.company.razon_social} ({contract.company.cif})
                  </p>
                )}

                <div>
                  <label htmlFor="producer_center_id" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Centro Productor de Origen
                  </label>
                  <Select
                    options={[
                      { value: '', label: '-- Centro general / Sede principal --' },
                      ...producerCenters.map(c => ({
                        value: c.id.toString(),
                        label: `${c.nombre} (${c.municipio || ''}${c.nima ? ` - NIMA: ${  c.nima}` : ''})`,
                      })),
                    ]}
                    defaultValue={formData.producer_center_id?.toString() || ''}
                    onChange={(val) => setFormData({ ...formData, producer_center_id: val ? parseInt(val) : undefined })}
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Instalación origen desde la que se generan los residuos objeto del contrato.
                  </p>
                </div>
              </div>

              {/* Destino (Gestor) */}
              <div className="space-y-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="text-foreground font-semibold">
                  <h4>Destino: Gestor de Tratamiento</h4>
                </div>

                {!showGestorForm ? (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="search_gestor" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                        Buscar Gestor
                      </label>
                      <Input
                        id="search_gestor"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre o CIF..."
                      />
                    </div>

                    <div>
                      <label htmlFor="gestor_company_id" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                        Seleccionar Gestor Autorizado
                      </label>
                      <Select
                        options={[
                          { value: '', label: '-- Seleccionar Gestor --' },
                          ...filteredGestores.map((g) => ({
                            value: g.id.toString(),
                            label: `${g.razon_social} (${g.cif})${g.nima ? ` - NIMA: ${  g.nima}` : ''}`,
                          })),
                        ]}
                        defaultValue={formData.gestor_company_id?.toString() || ''}
                        onChange={(value) => setFormData({ ...formData, gestor_company_id: parseInt(value) || undefined })}
                      />
                    </div>

                    {/* Instalación de Destino */}
                    <div>
                      <label htmlFor="gestor_center_id" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                        Instalación de Tratamiento (Destino)
                      </label>
                      <Select
                        options={[
                          { value: '', label: '-- Instalación general / Sede principal --' },
                          ...gestorCenters.map(c => ({
                            value: c.id.toString(),
                            label: `${c.nombre} (${c.municipio || ''}${c.nima ? ` - NIMA: ${  c.nima}` : ''})`,
                          })),
                        ]}
                        defaultValue={formData.gestor_center_id?.toString() || ''}
                        onChange={(val) => setFormData({ ...formData, gestor_center_id: val ? parseInt(val) : undefined })}
                      />
                    </div>

                    {destAuthScope && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="font-semibold">
                          <span>Autorizaciones del Gestor</span>
                        </div>
                        <p className="mt-1">
                          {destAuthScope.authorizations.length > 0
                            ? `Autorización: ${destAuthScope.authorizations[0].numero_autorizacion} (${destAuthScope.authorizations[0].es_indefinida ? 'Indefinida' : destAuthScope.authorizations[0].fecha_vencimiento || 'Vigente'})`
                            : 'Gestor sin autorización ambiental registrada'}
                        </p>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGestorForm(true)}
                    >
                      + Crear Nuevo Gestor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">Nuevo Gestor</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="text"
                        placeholder="Razón Social *"
                        value={newGestor.razon_social}
                        onChange={(e) => setNewGestor({ ...newGestor, razon_social: e.target.value })}
                      />
                      <Input
                        type="text"
                        placeholder="CIF *"
                        value={newGestor.cif}
                        onChange={(e) => setNewGestor({ ...newGestor, cif: e.target.value })}
                      />
                      <Input
                        type="text"
                        placeholder="NIMA"
                        value={newGestor.nima}
                        onChange={(e) => setNewGestor({ ...newGestor, nima: e.target.value })}
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={newGestor.email}
                        onChange={(e) => setNewGestor({ ...newGestor, email: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={handleSaveNewGestor}>Guardar</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowGestorForm(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ComponentCard>

          {/* Residuos Autorizados y Operaciones (Matriz LER + R/D) */}
          <ComponentCard
            title="Matriz de Residuos Autorizados y Condiciones Económicas"
            desc="Especifique cada código LER amparado por el contrato con su correspondiente operación de tratamiento (R/D) autorizada."
          >
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-muted uppercase">
                    <tr>
                      <th className="px-3 py-2.5 text-left w-72">Código LER *</th>
                      <th className="px-3 py-2.5 text-left">Denominación / Residuo</th>
                      <th className="px-3 py-2.5 text-left w-36">Operación *</th>
                      <th className="px-3 py-2.5 text-left w-32">Cant. Anual (t)</th>
                      <th className="px-3 py-2.5 text-left w-32">Precio (€/t)</th>
                      <th className="px-3 py-2.5 text-center w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {contractWasteCodes.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="p-2 min-w-[260px]">
                          <LerSelector
                            value={row.codigo_ler}
                            onChange={(code, wt) => {
                              handleWasteRowChange(idx, 'codigo_ler', code);
                              if (wt?.descripcion) {
                                handleWasteRowChange(idx, 'descripcion_ler', wt.descripcion);
                              }
                              if (wt?.operaciones_permitidas?.[0]) {
                                handleWasteRowChange(idx, 'operacion_tratamiento', wt.operaciones_permitidas[0]);
                              }
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.descripcion_ler}
                            onChange={(e) => handleWasteRowChange(idx, 'descripcion_ler', e.target.value)}
                            placeholder="Descripción del residuo"
                            className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.operacion_tratamiento}
                            onChange={(e) => handleWasteRowChange(idx, 'operacion_tratamiento', e.target.value)}
                            className="w-full text-xs font-mono font-bold rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {OPERACIONES_FRECUENTES.map(op => (
                              <option key={op.code} value={op.code}>{op.code} - {op.desc.slice(0, 24)}...</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            value={row.cantidad_estimada_anual || ''}
                            onChange={(e) => handleWasteRowChange(idx, 'cantidad_estimada_anual', parseFloat(e.target.value) || undefined)}
                            placeholder="0.00"
                            className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={row.tarifa_gestion || ''}
                            onChange={(e) => handleWasteRowChange(idx, 'tarifa_gestion', parseFloat(e.target.value) || undefined)}
                            placeholder="0.00"
                            className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveWasteCodeRow(idx)}
                            className="text-gray-400 hover:text-red-500 transition-colors px-2 py-1 text-xs font-bold"
                            title="Eliminar fila"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWasteCodeRow}
                  className="text-xs"
                >
                  Añadir Residuo / Operación LER
                </Button>
                <datalist id="waste-types-list">
                  {wasteTypes.map(w => (
                    <option key={w.id} value={w.codigo_ler}>{w.descripcion}</option>
                  ))}
                </datalist>
              </div>

              {/* Observaciones generales */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <label htmlFor="descripcion_residuos" className="block text-sm font-medium mb-2">
                  Descripción o Condiciones Especiales
                </label>
                <TextArea
                  value={formData.descripcion_residuos}
                  onChange={(value) => setFormData({ ...formData, descripcion_residuos: value })}
                  placeholder="Detalles sobre entregas, acondicionamiento de bultos, etc..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cantidad_maxima_anual" className="block text-sm font-medium mb-2">Cantidad Máxima Anual Global</label>
                  <Input
                    id="cantidad_maxima_anual"
                    type="number"
                    value={formData.cantidad_maxima_anual || ''}
                    onChange={(e) => setFormData({ ...formData, cantidad_maxima_anual: parseFloat(e.target.value) || undefined })}
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label htmlFor="precio_unitario" className="block text-sm font-medium mb-2">Precio Unitario Global (€)</label>
                  <Input
                    id="precio_unitario"
                    type="number"
                    step={0.01}
                    value={formData.precio_unitario || ''}
                    onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) || undefined })}
                    placeholder="50.00"
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
                rows={3}
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
