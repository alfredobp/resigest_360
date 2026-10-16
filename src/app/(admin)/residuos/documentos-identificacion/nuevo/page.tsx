'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { siraValidationSchema } from '@/lib/validations/sira'; // IMPORT AÑADIDO
import { z } from 'zod'; // IMPORT AÑADIDO
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import identificationDocumentService from '@/services/identificationDocumentService';
import companyService from '@/services/companyService';
import wasteContractService from '@/services/wasteContractService';
import productionCenterService from '@/services/productionCenterService';
import wasteTypeService from '@/services/wasteTypeService';
import treatmentManagerService from '@/services/treatmentManagerService';
import carrierService from '@/services/carrierService';
import authorizationService, { type AuthorizedScopeResult } from '@/services/authorizationService';
import type { IdentificationDocument, Company, WasteContract, ProductionCenter, WasteType, TreatmentManager, Carrier } from '@/types/wasteManagement';
import DatePicker from '@/components/form/date-picker';

export default function NuevoDocumentoIdentificacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [contracts, setContracts] = useState<WasteContract[]>([]);
  const [gestores, setGestores] = useState<Company[]>([]);
  const [internalGestores, setInternalGestores] = useState<TreatmentManager[]>([]);
  const [transportistas, setTransportistas] = useState<Company[]>([]);
  const [internalCarriers, setInternalCarriers] = useState<Carrier[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [allContacts, setAllContacts] = useState<Company[]>([]);
  const [destAuthScope, setDestAuthScope] = useState<AuthorizedScopeResult | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('principal');

  const [formData, setFormData] = useState<Partial<IdentificationDocument>>({
    tipo_notificacion: 'sin-notificacion',
    fecha_documento: new Date().toISOString().split('T')[0],
    estado_fisico: 'solido',
    peligrosidad: 'no-peligroso',
    unidad: 'kg',
    estado: 'borrador',
    firmado_productor: false,
    firmado_gestor: false,
    firmado_transportista: false,
  });

  const isHazardousLocked = Boolean(
    formData.codigo_ler && (
      formData.codigo_ler.includes('*') ||
      wasteTypes.find(wt => wt.codigo_ler === formData.codigo_ler)?.categoria === 'peligroso'
    )
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar mi empresa
      const company = await companyService.getUserCompany();
      if (!company) {
        router.push('/residuos/mi-empresa');
        return;
      }

      setMyCompany(company);

      // Cargar centros de producción
      const centers = await productionCenterService.getByCompanyId(company.id);
      setProductionCenters(centers);

      // Pre-rellenar datos del productor usando la Sede / Instalación Principal por defecto
      const defaultDir = company.domicilio_instalacion || company.domicilio_social || '';
      const defaultMuni = company.municipio_instalacion || company.municipio_social || '';
      const defaultProv = company.provincia_instalacion || company.provincia_social || '';
      const defaultCP = company.codigo_postal_instalacion || company.codigo_postal_social || '';
      const defaultNima = company.nima || '';

      setFormData(prev => ({
        ...prev,
        company_id: company.id,
        productor_razon_social: company.razon_social,
        productor_cif: company.cif,
        productor_nima: defaultNima,
        productor_direccion: defaultDir,
        productor_municipio: defaultMuni,
        productor_provincia: defaultProv,
        productor_codigo_postal: defaultCP,
        numero_documento: identificationDocumentService.generateDocumentNumber(company.nima || company.cif),
      }));

      // Cargar contratos vigentes: filtrar solo aquellos con gestor y no caducados por fecha
      const contractsData = await wasteContractService.getActive();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const validContracts = contractsData.filter(c => {
        const hasGestor = Boolean(c.treatment_manager || c.gestor_company);
        const notExpired = !c.fecha_fin || new Date(c.fecha_fin) >= today;
        return hasGestor && notExpired;
      });
      setContracts(validContracts);

      // Cargar gestores, transportistas y contactos unificados
      const [gestoresData, internalData, transportistasData, internalCarriersData, contactsData] = await Promise.all([
        companyService.getByType('gestor'),
        treatmentManagerService.getAll(),
        companyService.getByType('transportista'),
        carrierService.getAll(),
        companyService.getAllContacts(),
      ]);
      setGestores(gestoresData);
      setInternalGestores(internalData);
      setTransportistas(transportistasData);
      setInternalCarriers(internalCarriersData);
      setAllContacts(contactsData);

      // Cargar tipos de residuos (LER)
      const wasteTypesData = await wasteTypeService.getAll();
      setWasteTypes(wasteTypesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkDestinationAuthorization = async (gestorCif?: string, transferDate?: string) => {
    if (!gestorCif || !gestorCif.trim()) {
      setDestAuthScope(null);
      return;
    }

    const normCif = gestorCif.trim().toUpperCase();
    const matchedComp = allContacts.find((c) => c.cif?.trim().toUpperCase() === normCif);

    if (matchedComp) {
      const scope = await authorizationService.getAuthorizedScope(
        matchedComp.id,
        null,
        transferDate || formData.fecha_documento
      );
      setDestAuthScope(scope);
    } else {
      setDestAuthScope(null);
    }
  };

  useEffect(() => {
    if (formData.gestor_cif && allContacts.length > 0) {
      checkDestinationAuthorization(formData.gestor_cif, formData.fecha_documento);
    }
  }, [formData.gestor_cif, formData.fecha_documento, allContacts]);

  const handleOriginChange = (value: string) => {
    setSelectedOrigin(value);
    if (value === 'principal' && myCompany) {
      setFormData(prev => ({
        ...prev,
        production_center_id: undefined,
        productor_nima: myCompany.nima || '',
        productor_direccion: myCompany.domicilio_instalacion || myCompany.domicilio_social || '',
        productor_municipio: myCompany.municipio_instalacion || myCompany.municipio_social || '',
        productor_provincia: myCompany.provincia_instalacion || myCompany.provincia_social || '',
        productor_codigo_postal: myCompany.codigo_postal_instalacion || myCompany.codigo_postal_social || '',
      }));
    } else {
      const center = productionCenters.find(c => c.id === parseInt(value));
      if (center) {
        setFormData(prev => ({
          ...prev,
          production_center_id: center.id,
          productor_nima: center.nima,
          productor_direccion: center.direccion,
          productor_municipio: center.municipio || '',
          productor_provincia: center.provincia || '',
          productor_codigo_postal: center.codigo_postal || '',
        }));
      }
    }
  };

  const handleContractChange = (contractId: string) => {
    const contract = contracts.find(c => c.id === parseInt(contractId));
    if (!contract) return;

    if (contract.treatment_manager) {
      setFormData(prev => ({
        ...prev,
        contract_id: contract.id,
        gestor_razon_social: contract.treatment_manager!.razon_social,
        gestor_cif: contract.treatment_manager!.cif,
        gestor_nima: contract.treatment_manager!.nima || '',
        gestor_numero_autorizacion: contract.treatment_manager!.numero_autorizacion || '',
        gestor_direccion: contract.treatment_manager!.direccion || '',
        gestor_codigo_postal: contract.treatment_manager!.codigo_postal || '',
        gestor_municipio: contract.treatment_manager!.municipio || '',
        gestor_provincia: contract.treatment_manager!.provincia || '',
        gestor_telefono: contract.treatment_manager!.telefono || '',
      }));
    } else if (contract.gestor_company) {
      setFormData(prev => ({
        ...prev,
        contract_id: contract.id,
        gestor_razon_social: contract.gestor_company!.razon_social,
        gestor_cif: contract.gestor_company!.cif,
        gestor_nima: contract.gestor_company!.nima || '',
        gestor_numero_autorizacion: '',
        gestor_direccion: contract.gestor_company!.domicilio_social || '',
        gestor_codigo_postal: contract.gestor_company!.codigo_postal_social || '',
        gestor_municipio: contract.gestor_company!.municipio_social || '',
        gestor_provincia: contract.gestor_company!.provincia_social || '',
        gestor_telefono: contract.gestor_company!.telefono || '',
      }));
    }
  };

  const handleGestorChange = (gestorId: string) => {
    const gestor = gestores.find(g => g.id === parseInt(gestorId));
    if (gestor) {
      setFormData(prev => ({
        ...prev,
        gestor_razon_social: gestor.razon_social,
        gestor_cif: gestor.cif,
        gestor_nima: gestor.nima || '',
        gestor_numero_autorizacion: gestor.numero_inscripcion || '',
        gestor_direccion: gestor.domicilio_social || '',
        gestor_codigo_postal: gestor.codigo_postal_social || '',
        gestor_municipio: gestor.municipio_social || '',
        gestor_provincia: gestor.provincia_social || '',
        gestor_telefono: gestor.telefono || '',
      }));
    }
  };

  const handleInternalGestorChange = (gestorId: string) => {
    const gestor = internalGestores.find(g => g.id === parseInt(gestorId));
    if (gestor) {
      setFormData(prev => ({
        ...prev,
        gestor_razon_social: gestor.razon_social,
        gestor_cif: gestor.cif,
        gestor_nima: gestor.nima || '',
        gestor_numero_autorizacion: gestor.numero_autorizacion || '',
        gestor_direccion: gestor.direccion || '',
        gestor_codigo_postal: gestor.codigo_postal || '',
        gestor_municipio: gestor.municipio || '',
        gestor_provincia: gestor.provincia || '',
        gestor_telefono: gestor.telefono || '',
      }));
    }
  };

  const handleTransportistaChange = (transportistaId: string) => {
    const transportista = transportistas.find(t => t.id === parseInt(transportistaId));
    if (transportista) {
      setFormData(prev => ({
        ...prev,
        transportista_razon_social: transportista.razon_social,
        transportista_cif: transportista.cif,
        transportista_telefono: transportista.telefono || '',
      }));
    }
  };

  const handleInternalCarrierChange = (carrierId: string) => {
    const carrier = internalCarriers.find(c => c.id === parseInt(carrierId));
    if (carrier) {
      setFormData(prev => ({
        ...prev,
        transportista_razon_social: carrier.razon_social,
        transportista_cif: carrier.cif,
        transportista_nima: carrier.nima || '',
        transportista_matricula: carrier.matricula || '',
        transportista_direccion: carrier.direccion || '',
        transportista_codigo_postal: carrier.codigo_postal || '',
        transportista_municipio: carrier.municipio || '',
        transportista_provincia: carrier.provincia || '',
        transportista_telefono: carrier.telefono || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // VALIDACIÓN CON ZOD para SIRA
    const validationResult = siraValidationSchema.safeParse(formData);

    if (!validationResult.success) {
      // Extraemos los errores
      const formattedErrors: Record<string, string> = {};
      let firstErrorMessage = '';

      validationResult.error.issues.forEach((err: z.ZodIssue) => {
        // Guardamos el primer mensaje para mostrarlo arriba, incluyendo qué campo es
        if (!firstErrorMessage) {
          const fieldName = err.path[0] || 'Desconocido';
          // Mapeo amigable de nombres técnicos a humanos si quieres, o directo
          firstErrorMessage = `${err.message} (Campo: ${String(fieldName)})`;
        }
        if (err.path[0]) {
          formattedErrors[err.path[0].toString()] = err.message;
        }
      });

      setValidationErrors(formattedErrors);
      setError(`Error de validación: ${firstErrorMessage}`);
      // Hacemos scroll arriba si hay error
      window.scrollTo(0, 0);
      return;
    }

    // Validación de Autorización Ambiental en Destino (Bloque 2)
    if (destAuthScope && destAuthScope.authorizations && destAuthScope.authorizations.length > 0 && formData.codigo_ler) {
      const allowedOps = destAuthScope.authorizedLers[formData.codigo_ler];
      if (!allowedOps) {
        setError(
          `Destino no autorizado: El gestor seleccionado (${formData.gestor_razon_social || 'destino'}) no cuenta con autorización ambiental para el código LER ${formData.codigo_ler}.`
        );
        window.scrollTo(0, 0);
        return;
      }

      if (formData.operacion_tratamiento) {
        const cleanOp = formData.operacion_tratamiento.toUpperCase().trim();
        if (!allowedOps.includes(cleanOp)) {
          setError(
            `Operación no autorizada: La operación "${formData.operacion_tratamiento}" no está permitida para el LER ${formData.codigo_ler} en la autorización ambiental del destino (Operaciones autorizadas: ${allowedOps.join(', ')}).`
          );
          window.scrollTo(0, 0);
          return;
        }
      }
    }

    // Datos validados y listos
    const dataToSubmit = validationResult.data;

    try {
      setSaving(true);
      const created = await identificationDocumentService.create(formData);
      router.push(`/residuos/documentos-identificacion/${created.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <PageBreadCrumb pageTitle="Nuevo Documento de Identificación" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">
            Nuevo Documento de Identificación (DI)
          </h2>
          <Button variant="outline" onClick={() => router.push('/residuos/documentos-identificacion')}>
            ← Cancelar
          </Button>
        </div>

        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Datos del Documento */}
          <ComponentCard title="Datos del Documento">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="numero_documento" className="block text-sm font-medium mb-2">Número de Documento</label>
                <Input
                  id="numero_documento"
                  type="text"
                  value={formData.numero_documento || ''}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="fecha_documento" className="block text-sm font-medium mb-2">Fecha del Documento</label>
                <Input
                  id="fecha_documento"
                  type="date"
                  value={formData.fecha_documento}
                  onChange={(e) => setFormData({ ...formData, fecha_documento: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="origin_selector" className="block text-sm font-medium mb-2">Origen del Residuo (Instalación / Centro) *</label>
                <Select
                  options={[
                    { value: 'principal', label: `🏢 Sede / Instalación Principal (${myCompany?.razon_social || 'Mi Empresa'})` },
                    ...productionCenters.map(pc => ({
                      value: pc.id.toString(),
                      label: `📍 ${pc.nombre} (${pc.nima})`,
                    })),
                  ]}
                  value={selectedOrigin}
                  onChange={handleOriginChange}
                  placeholder="Selecciona el origen del residuo"
                  error={!!validationErrors.production_center_id}
                  hint={validationErrors.production_center_id}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedOrigin === 'principal'
                    ? 'Origen: Sede/Instalación principal según ficha de Mi Empresa.'
                    : 'Origen: Centro de producción secundario seleccionado.'}
                </p>
              </div>

              <div>
                <label htmlFor="contract_id" className="block text-sm font-medium mb-2">Contrato de Referencia (Opcional)</label>
                <Select
                  options={[
                    { value: '', label: contracts.length > 0 ? '-- Seleccionar Contrato --' : '-- Sin contratos vigentes con gestor --' },
                    ...contracts.map(c => ({
                      value: c.id.toString(),
                      label: `${c.numero_contrato || `#${c.id}`} - ${c.treatment_manager?.razon_social || c.gestor_company?.razon_social || 'Gestor asignado'}`,
                    })),
                  ]}
                  value={formData.contract_id?.toString() || ''}
                  onChange={(value) => handleContractChange(value)}
                  placeholder="Selecciona un contrato"
                />
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Productor / Origen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Razón Social</label>
                <Input value={formData.productor_razon_social || ''} disabled className="bg-muted" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CIF</label>
                <Input value={formData.productor_cif || ''} disabled className="bg-muted" />
              </div>

              <div>
                <label htmlFor="productor_nima" className="block text-sm font-medium mb-2">NIMA *</label>
                <Input
                  id="productor_nima"
                  value={formData.productor_nima || ''}
                  onChange={(e) => setFormData({ ...formData, productor_nima: e.target.value })}
                  error={!!validationErrors.productor_nima}
                  hint={validationErrors.productor_nima}
                />
              </div>

              <div>
                <label htmlFor="productor_direccion" className="block text-sm font-medium mb-2">Dirección *</label>
                <Input
                  id="productor_direccion"
                  value={formData.productor_direccion || ''}
                  onChange={(e) => setFormData({ ...formData, productor_direccion: e.target.value })}
                  placeholder="Calle, número..."
                  error={!!validationErrors.productor_direccion}
                  hint={validationErrors.productor_direccion}
                />
              </div>

              <div>
                <label htmlFor="productor_municipio" className="block text-sm font-medium mb-2">Municipio *</label>
                <Input
                  id="productor_municipio"
                  value={formData.productor_municipio || ''}
                  onChange={(e) => setFormData({ ...formData, productor_municipio: e.target.value })}
                  error={!!validationErrors.productor_municipio}
                  hint={validationErrors.productor_municipio}
                />
              </div>

              <div>
                <label htmlFor="productor_provincia" className="block text-sm font-medium mb-2">Provincia *</label>
                <Input
                  id="productor_provincia"
                  value={formData.productor_provincia || ''}
                  onChange={(e) => setFormData({ ...formData, productor_provincia: e.target.value })}
                  error={!!validationErrors.productor_provincia}
                  hint={validationErrors.productor_provincia}
                />
              </div>

              <div>
                <label htmlFor="productor_codigo_postal" className="block text-sm font-medium mb-2">Código Postal</label>
                <Input
                  id="productor_codigo_postal"
                  value={formData.productor_codigo_postal || ''}
                  onChange={(e) => setFormData({ ...formData, productor_codigo_postal: e.target.value })}
                />
              </div>
            </div>
          </ComponentCard>

          {/* Gestor/Destinatario */}
          <ComponentCard title="Gestor / Destinatario">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="internal_gestor_select" className="block text-sm font-medium mb-2">Mis Gestores Internos</label>
                  <Select
                    options={[
                      { value: '', label: '-- Seleccionar --' },
                      ...internalGestores.map(g => ({
                        value: g.id.toString(),
                        label: `${g.nombre} (${g.razon_social})`,
                      })),
                    ]}
                    defaultValue=""
                    onChange={(value) => handleInternalGestorChange(value)}
                    placeholder="Selecciona uno de tus gestores"
                  />
                </div>
                <div>
                  <label htmlFor="gestor_select" className="block text-sm font-medium mb-2">Gestores Públicos</label>
                  <Select
                    options={[
                      { value: '', label: '-- Seleccionar --' },
                      ...gestores.map(g => ({
                        value: g.id.toString(),
                        label: `${g.razon_social} - ${g.cif}`,
                      })),
                    ]}
                    defaultValue=""
                    onChange={(value) => handleGestorChange(value)}
                    placeholder="Selecciona un gestor público"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gestor_razon_social" className="block text-sm font-medium mb-2">Razón Social *</label>
                  <Input
                    id="gestor_razon_social"
                    type="text"
                    value={formData.gestor_razon_social || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_razon_social: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gestor_cif" className="block text-sm font-medium mb-2">CIF *</label>
                  <Input
                    id="gestor_cif"
                    type="text"
                    value={formData.gestor_cif || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_cif: e.target.value })}
                    required
                    error={!!validationErrors.gestor_cif}
                    hint={validationErrors.gestor_cif}
                  />
                </div>

                <div>
                  <label htmlFor="gestor_nima" className="block text-sm font-medium mb-2">NIMA</label>
                  <Input
                    id="gestor_nima"
                    type="text"
                    value={formData.gestor_nima || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_nima: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="gestor_numero_autorizacion" className="block text-sm font-medium mb-2">Nº Autorización</label>
                  <Input
                    id="gestor_numero_autorizacion"
                    type="text"
                    value={formData.gestor_numero_autorizacion || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_numero_autorizacion: e.target.value })}
                  />
                </div>

                {/* Campos de Dirección del Gestor (Requeridos SIRA) */}
                <div>
                  <label htmlFor="gestor_direccion" className="block text-sm font-medium mb-2">Dirección *</label>
                  <Input
                    id="gestor_direccion"
                    value={formData.gestor_direccion || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_direccion: e.target.value })}
                    error={!!validationErrors.gestor_direccion}
                    hint={validationErrors.gestor_direccion}
                  />
                </div>

                <div>
                  <label htmlFor="gestor_municipio" className="block text-sm font-medium mb-2">Municipio *</label>
                  <Input
                    id="gestor_municipio"
                    value={formData.gestor_municipio || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_municipio: e.target.value })}
                    error={!!validationErrors.gestor_municipio}
                    hint={validationErrors.gestor_municipio}
                  />
                </div>

                <div>
                  <label htmlFor="gestor_provincia" className="block text-sm font-medium mb-2">Provincia *</label>
                  <Input
                    id="gestor_provincia"
                    value={formData.gestor_provincia || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_provincia: e.target.value })}
                    error={!!validationErrors.gestor_provincia}
                    hint={validationErrors.gestor_provincia}
                  />
                </div>

                <div>
                  <label htmlFor="gestor_codigo_postal" className="block text-sm font-medium mb-2">CP</label>
                  <Input
                    id="gestor_codigo_postal"
                    value={formData.gestor_codigo_postal || ''}
                    onChange={(e) => setFormData({ ...formData, gestor_codigo_postal: e.target.value })}
                  />
                </div>

                {/* Banner de Autorización Ambiental Consultable (Bloque 2) */}
                {destAuthScope && destAuthScope.authorizations && destAuthScope.authorizations.length > 0 && (
                  <div className="md:col-span-2 p-3.5 bg-brand-50/80 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl space-y-2 mt-2">
                    {destAuthScope.authorizations.map((auth) => (
                      <div key={auth.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <p className="text-xs font-bold text-brand-950 dark:text-brand-200 flex items-center gap-1.5">
                            <span>📜</span> Autorización Ambiental: {auth.numero_autorizacion} — {auth.titulo}
                          </p>
                          <p className="text-xs text-brand-700 dark:text-brand-400 mt-0.5">
                            Emisor: {auth.organismo_emisor || 'Comunidad Autónoma'} | Vigencia:{' '}
                            <strong>{auth.es_indefinida ? 'Vigencia Indefinida' : (auth.fecha_vencimiento ? `Hasta ${auth.fecha_vencimiento}` : 'Vigente')}</strong>
                          </p>
                        </div>
                        {auth.archivo_url && (
                          <a
                            href={auth.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-brand-500 text-white hover:bg-brand-600 transition shrink-0"
                          >
                            Ver Documento ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ComponentCard>

          {/* Transportista (Opcional) */}
          <ComponentCard title="Transportista (Opcional)">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="internal_carrier_select" className="block text-sm font-medium mb-2">Mis Transportistas Internos</label>
                  <Select
                    options={[
                      { value: '', label: '-- Seleccionar --' },
                      ...internalCarriers.map(c => ({
                        value: c.id.toString(),
                        label: `${c.razon_social} - ${c.cif}${c.matricula ? ` (${c.matricula})` : ''}`,
                      })),
                    ]}
                    defaultValue=""
                    onChange={(value) => handleInternalCarrierChange(value)}
                    placeholder="Selecciona uno de tus transportistas"
                  />
                </div>
                <div>
                  <label htmlFor="transportista_select" className="block text-sm font-medium mb-2">Transportistas Públicos</label>
                  <Select
                    options={[
                      { value: '', label: '-- Seleccionar --' },
                      ...transportistas.map(t => ({
                        value: t.id.toString(),
                        label: `${t.razon_social} - ${t.cif}`,
                      })),
                    ]}
                    defaultValue=""
                    onChange={(value) => handleTransportistaChange(value)}
                    placeholder="Selecciona un transportista público"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="transportista_razon_social" className="block text-sm font-medium mb-2">Razón Social</label>
                  <Input
                    id="transportista_razon_social"
                    type="text"
                    value={formData.transportista_razon_social || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_razon_social: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="transportista_cif" className="block text-sm font-medium mb-2">CIF</label>
                  <Input
                    id="transportista_cif"
                    type="text"
                    value={formData.transportista_cif || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_cif: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="transportista_matricula" className="block text-sm font-medium mb-2">Matrícula</label>
                  <Input
                    id="transportista_matricula"
                    type="text"
                    value={formData.transportista_matricula || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_matricula: e.target.value })}
                  />
                </div>
              </div>

              {/* Datos adicionales de dirección requeridos por SIRA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 bg-muted/10 p-4 border rounded-md">
                <div className="md:col-span-2 flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase text-primary/80 tracking-wider">Datos para SIRA (Requeridos)</span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>

                <div>
                  <label htmlFor="transportista_nima" className="block text-sm font-medium mb-2">NIMA Transportista *</label>
                  <Input
                    id="transportista_nima"
                    type="text"
                    value={formData.transportista_nima || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_nima: e.target.value })}
                    placeholder="NIMA..."
                    error={!!validationErrors.transportista_nima}
                    hint={validationErrors.transportista_nima}
                  />
                </div>

                <div>
                  <label htmlFor="transportista_direccion" className="block text-sm font-medium mb-2">Dirección</label>
                  <Input
                    id="transportista_direccion"
                    type="text"
                    value={formData.transportista_direccion || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_direccion: e.target.value })}
                    placeholder="Calle y número"
                    error={!!validationErrors.transportista_direccion}
                    hint={validationErrors.transportista_direccion}
                  />
                </div>

                <div>
                  <label htmlFor="transportista_municipio" className="block text-sm font-medium mb-2">Municipio</label>
                  <Input
                    id="transportista_municipio"
                    type="text"
                    value={formData.transportista_municipio || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_municipio: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="transportista_provincia" className="block text-sm font-medium mb-2">Provincia</label>
                  <Input
                    id="transportista_provincia"
                    type="text"
                    value={formData.transportista_provincia || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_provincia: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="transportista_codigo_postal" className="block text-sm font-medium mb-2">CP</label>
                  <Input
                    id="transportista_codigo_postal"
                    type="text"
                    value={formData.transportista_codigo_postal || ''}
                    onChange={(e) => setFormData({ ...formData, transportista_codigo_postal: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Datos del Residuo */}
          <ComponentCard title="Datos del Residuo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="codigo_ler" className="block text-sm font-medium mb-2">Código LER *</label>
                <Select
                  options={[
                    { value: '', label: '-- Seleccionar Código LER --' },
                    ...wasteTypes.map(wt => ({
                      value: wt.id.toString(),
                      label: `${wt.codigo_ler} - ${wt.descripcion.substring(0, 60)}${wt.descripcion.length > 60 ? '...' : ''}`,
                    })),
                  ]}
                  value={wasteTypes.find(wt => wt.codigo_ler === formData.codigo_ler)?.id.toString() || ''}
                  onChange={(value) => {
                    const wt = wasteTypes.find(w => w.id === parseInt(value));
                    if (wt) {
                      const isDangerous = wt.codigo_ler.includes('*') || wt.categoria === 'peligroso';
                      setFormData({
                        ...formData,
                        waste_type_id: wt.id,
                        codigo_ler: wt.codigo_ler,
                        descripcion_residuo: wt.descripcion,
                        peligrosidad: isDangerous ? 'peligroso' : (wt.categoria || 'no-peligroso'),
                        estado_fisico: wt.estado,
                        operacion_tratamiento: wt.operaciones_permitidas?.[0] || '',
                      });
                    }
                  }}
                  placeholder="Selecciona según la lista europea"
                  error={!!validationErrors.codigo_ler}
                  hint={validationErrors.codigo_ler}
                />
                {destAuthScope && destAuthScope.authorizations && destAuthScope.authorizations.length > 0 && formData.codigo_ler && (
                  destAuthScope.authorizedLers[formData.codigo_ler] ? (
                    <p className="mt-1.5 text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
                      <span>✅</span> LER Autorizado en destino (Operaciones:{' '}
                      <strong>{destAuthScope.authorizedLers[formData.codigo_ler].join(', ')}</strong>)
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                      <span>🚫</span> <strong>No Autorizado en Destino:</strong> Este residuo no figura en las autorizaciones ambientales del gestor seleccionado.
                    </p>
                  )
                )}
              </div>

              <div>
                <label htmlFor="peligrosidad" className="block text-sm font-medium mb-2">Peligrosidad *</label>
                <Select
                  options={[
                    { value: 'no-peligroso', label: 'No Peligroso' },
                    { value: 'peligroso', label: 'Peligroso' },
                  ]}
                  value={formData.peligrosidad || 'no-peligroso'}
                  disabled={isHazardousLocked}
                  onChange={(value) => setFormData({ ...formData, peligrosidad: value as any })}
                  placeholder="Selecciona una opción"
                  error={!!validationErrors.peligrosidad}
                  hint={validationErrors.peligrosidad}
                />
                {isHazardousLocked && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <span>⚠️</span> Clasificado obligatoriamente como <strong>Peligroso</strong> según LER con asterisco (*) (RD 553/2020).
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="descripcion_residuo" className="block text-sm font-medium mb-2">Descripción del Residuo *</label>
                <TextArea
                  value={formData.descripcion_residuo || ''}
                  onChange={(value) => setFormData({ ...formData, descripcion_residuo: value })}
                  rows={2}
                  placeholder="Describe el tipo de residuo..."
                />
              </div>

              <div>
                <label htmlFor="estado_fisico" className="block text-sm font-medium mb-2">Estado Físico *</label>
                <Select
                  options={[
                    { value: 'solido', label: 'Sólido' },
                    { value: 'liquido', label: 'Líquido' },
                    { value: 'pastoso', label: 'Pastoso' },
                    { value: 'gaseoso', label: 'Gaseoso' },
                  ]}
                  value={formData.estado_fisico || 'solido'}
                  onChange={(value) => setFormData({ ...formData, estado_fisico: value as any })}
                  placeholder="Selecciona una opción"
                />
              </div>

              <div>
                <label htmlFor="operacion_tratamiento" className="block text-sm font-medium mb-2">Operación de Tratamiento</label>
                <Input
                  id="operacion_tratamiento"
                  type="text"
                  value={formData.operacion_tratamiento || ''}
                  onChange={(e) => setFormData({ ...formData, operacion_tratamiento: e.target.value })}
                  placeholder="Ej: R05, D01"
                />
                {destAuthScope && destAuthScope.authorizations && destAuthScope.authorizations.length > 0 && formData.codigo_ler && destAuthScope.authorizedLers[formData.codigo_ler] && (
                  formData.operacion_tratamiento && !destAuthScope.authorizedLers[formData.codigo_ler].includes(formData.operacion_tratamiento.toUpperCase().trim()) ? (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                      <span>⚠️</span> Operación no autorizada (Permitidas: {destAuthScope.authorizedLers[formData.codigo_ler].join(', ')}).
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">
                      Operaciones autorizadas en destino: <strong>{destAuthScope.authorizedLers[formData.codigo_ler].join(', ')}</strong>
                    </p>
                  )
                )}
              </div>
            </div>
          </ComponentCard>

          {/* Cantidad y Envases */}
          <ComponentCard title="Cantidad y Envases">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cantidad" className="block text-sm font-medium mb-2">Cantidad *</label>
                <Input
                  id="cantidad"
                  type="number"
                  step={0.001}
                  value={formData.cantidad || ''}
                  onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) })}
                  required
                  error={!!validationErrors.cantidad}
                  hint={validationErrors.cantidad}
                />
              </div>

              <div>
                <label htmlFor="unidad" className="block text-sm font-medium mb-2">Unidad *</label>
                <Select
                  options={[
                    { value: 'kg', label: 'Kilogramos (kg)' },
                    { value: 'toneladas', label: 'Toneladas' },
                    { value: 'litros', label: 'Litros' },
                    { value: 'm3', label: 'Metros cúbicos (m³)' },
                    { value: 'unidades', label: 'Unidades' },
                  ]}
                  value={formData.unidad || 'kg'}
                  onChange={(value) => setFormData({ ...formData, unidad: value as any })}
                  placeholder="Selecciona una opción"
                  error={!!validationErrors.unidad}
                  hint={validationErrors.unidad}
                />
              </div>

              <div>
                <label htmlFor="numero_envases" className="block text-sm font-medium mb-2">Número de Envases</label>
                <Input
                  id="numero_envases"
                  type="number"
                  value={formData.numero_envases || ''}
                  onChange={(e) => setFormData({ ...formData, numero_envases: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label htmlFor="tipo_envases" className="block text-sm font-medium mb-2">Tipo de Envases</label>
                <Input
                  id="tipo_envases"
                  type="text"
                  value={formData.tipo_envases || ''}
                  onChange={(e) => setFormData({ ...formData, tipo_envases: e.target.value })}
                  placeholder="Ej: Contenedor 1000L, Big Bag, Bidón"
                />
              </div>
            </div>
          </ComponentCard>

          {/* Fechas y Otros Datos */}
          <ComponentCard title="Fechas y Logística">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fecha_recogida" className="block text-sm font-medium mb-2">Fecha de RecogidaEstimada</label>
                <DatePicker
                  id="fecha_recogida"
                  defaultDate={formData.fecha_recogida || ''}
                  onChange={([date]) => setFormData({ ...formData, fecha_recogida: date ? date.toISOString().split('T')[0] : '' })}
                />
              </div>

              <div>
                <label htmlFor="fecha_entrega" className="block text-sm font-medium mb-2">Fecha de Entrega Estimada</label>
                <DatePicker
                  id="fecha_entrega"
                  defaultDate={formData.fecha_entrega || ''}
                  onChange={([date]) => setFormData({ ...formData, fecha_entrega: date ? date.toISOString().split('T')[0] : '' })}
                />
              </div>
            </div>
          </ComponentCard>

          {/* Notas */}
          <ComponentCard title="Notas y Observaciones">
            <div>
              <label htmlFor="notas" className="block text-sm font-medium mb-2">Notas</label>
              <TextArea
                value={formData.notas || ''}
                onChange={(value) => setFormData({ ...formData, notas: value })}
                rows={3}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </ComponentCard>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/residuos/documentos-identificacion')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Documento'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
