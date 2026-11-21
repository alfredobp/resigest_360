'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Copy } from 'lucide-react';
import { siraValidationSchema } from '@/lib/validations/sira'; // IMPORT AÑADIDO
import { type z } from 'zod'; // IMPORT AÑADIDO
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Input from '@/components/form/input/InputField';
import ProvinceMunicipalityFields from '@/components/form/ProvinceMunicipalityFields';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import identificationDocumentService from '@/services/identificationDocumentService';
import documentSequenceService from '@/services/documentSequenceService';
import companyService from '@/services/companyService';
import wasteContractService from '@/services/wasteContractService';
import productionCenterService from '@/services/productionCenterService';
import wasteTypeService from '@/services/wasteTypeService';
import treatmentManagerService from '@/services/treatmentManagerService';
import carrierService from '@/services/carrierService';
import authorizationService, { type AuthorizedScopeResult } from '@/services/authorizationService';
import { priorNotificationService } from '@/services/priorNotificationService';
import type { IdentificationDocument, Company, WasteContract, ProductionCenter, WasteType, TreatmentManager, Carrier, PriorNotification } from '@/types/wasteManagement';
import DatePicker from '@/components/form/date-picker';
import LerSelector from '@/components/residuos/LerSelector';
import { getProvinceByPostalCode } from '@/lib/validations/spainLocations';
import { PHYSICAL_CONTAINER_CATALOG } from '@/lib/validations/normativeCompliance';

function NuevoDocumentoIdentificacionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forcedPerspectiva = searchParams.get('perspectiva') || searchParams.get('sentido');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [productionCenters, setProductionCenters] = useState<ProductionCenter[]>([]);
  const [contracts, setContracts] = useState<WasteContract[]>([]);
  const [internalGestores, setInternalGestores] = useState<TreatmentManager[]>([]);
  const [internalCarriers, setInternalCarriers] = useState<Carrier[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [allContacts, setAllContacts] = useState<Company[]>([]);
  const [priorNotifications, setPriorNotifications] = useState<PriorNotification[]>([]);
  const [destAuthScope, setDestAuthScope] = useState<AuthorizedScopeResult | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('principal');
  const [expeditionRole, setExpeditionRole] = useState<'productor' | 'gestor'>('productor');
  const [selectedClientContact, setSelectedClientContact] = useState<string>('');
  const [duplicateSourceInfo, setDuplicateSourceInfo] = useState<{ id: number; numero_documento: string } | null>(null);

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

      // Determinar perspectiva inicial de expedición según el tipo de empresa y parámetros de navegación
      const isCompanyGestor = company.tipo_empresa === 'gestor' || company.roles?.includes('gestor');
      const initialRole = (forcedPerspectiva === 'productor' || forcedPerspectiva === 'salida')
        ? 'productor'
        : (isCompanyGestor ? 'gestor' : 'productor');
      setExpeditionRole(initialRole);

      // Cargar centros de producción
      const centers = await productionCenterService.getByCompanyId(company.id);
      setProductionCenters(centers);

      // Pre-rellenar según el rol inicial
      const defaultDir = company.domicilio_instalacion || company.domicilio_social || '';
      const defaultMuni = company.municipio_instalacion || company.municipio_social || '';
      const defaultProv = company.provincia_instalacion || company.provincia_social || '';
      const defaultCP = company.codigo_postal_instalacion || company.codigo_postal_social || '';
      const defaultNima = company.nima || '';

      const previewDiNumber = await documentSequenceService
        .previewNextCode(company.id, 'di', { nima: defaultNima })
        .catch(() => identificationDocumentService.generateDocumentNumber(defaultNima));

      if (initialRole === 'gestor') {
        // En modo gestor, mi empresa es el destinatario receptor
        setFormData(prev => ({
          ...prev,
          company_id: company.id,
          gestor_razon_social: company.razon_social,
          gestor_cif: company.cif,
          gestor_nima: defaultNima,
          gestor_numero_autorizacion: company.numero_autorizacion || company.numero_inscripcion || '',
          gestor_direccion: defaultDir,
          gestor_municipio: defaultMuni,
          gestor_provincia: defaultProv,
          gestor_codigo_postal: defaultCP,
          gestor_telefono: company.telefono || '',
          numero_documento: previewDiNumber,
        }));
      } else {
        // En modo productor, mi empresa es el generador del residuo
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
          numero_documento: previewDiNumber,
        }));
      }

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

      // Cargar gestores, transportistas, contactos unificados y notificaciones previas
      const [internalData, internalCarriersData, contactsData, ntsData] = await Promise.all([
        treatmentManagerService.getAll(),
        carrierService.getAll(),
        companyService.getAllContacts(),
        priorNotificationService.getAll().catch(() => []),
      ]);
      setInternalGestores(internalData);
      setInternalCarriers(internalCarriersData);
      setAllContacts(contactsData);
      const acceptedNts = (ntsData || []).filter((n) => n.estado === 'aceptada');
      setPriorNotifications(acceptedNts);

      // Si viene un parámetro ntId en la URL, pre-cargar dicha Notificación Previa solo si está aceptada
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryNtId = urlParams.get('ntId');
          if (queryNtId && acceptedNts.length > 0) {
            const matchedNt = acceptedNts.find(n => String(n.id) === queryNtId);
            if (matchedNt) {
              setFormData(prev => ({
                ...prev,
                tipo_notificacion: 'con-notificacion-previa',
                prior_notification_id: matchedNt.id,
                numero_notificacion: matchedNt.numero_notificacion,
                codigo_ler: matchedNt.codigo_ler || prev.codigo_ler,
                descripcion_residuo: matchedNt.descripcion_residuo || prev.descripcion_residuo,
                peligrosidad: matchedNt.peligrosidad || prev.peligrosidad,
                operacion_tratamiento_ejecutada: matchedNt.operacion_tratamiento || prev.operacion_tratamiento_ejecutada,
                operacion_tratamiento: matchedNt.operacion_tratamiento || prev.operacion_tratamiento,
                gestor_razon_social: matchedNt.gestor_razon_social || prev.gestor_razon_social,
                gestor_cif: matchedNt.gestor_cif || prev.gestor_cif,
                gestor_nima: matchedNt.gestor_nima || prev.gestor_nima,
              }));
            }
          }

          // UXDEV-07 / UX-06: Duplicar retirada anterior si viene duplicate_from o duplicateFrom
          const queryDuplicateId = urlParams.get('duplicate_from') || urlParams.get('duplicateFrom');
          if (queryDuplicateId) {
            try {
              const srcDoc = await identificationDocumentService.getById(parseInt(queryDuplicateId, 10));
              if (srcDoc) {
                setDuplicateSourceInfo({
                  id: srcDoc.id,
                  numero_documento: srcDoc.numero_documento,
                });

                setFormData(prev => ({
                  ...prev,
                  contract_id: srcDoc.contract_id || undefined,
                  production_center_id: srcDoc.production_center_id || undefined,
                  // Productor
                  productor_razon_social: srcDoc.productor_razon_social || prev.productor_razon_social,
                  productor_cif: srcDoc.productor_cif || prev.productor_cif,
                  productor_nima: srcDoc.productor_nima || prev.productor_nima,
                  productor_direccion: srcDoc.productor_direccion || prev.productor_direccion,
                  productor_municipio: srcDoc.productor_municipio || prev.productor_municipio,
                  productor_provincia: srcDoc.productor_provincia || prev.productor_provincia,
                  productor_codigo_postal: srcDoc.productor_codigo_postal || prev.productor_codigo_postal,
                  productor_telefono: srcDoc.productor_telefono || prev.productor_telefono,
                  // Gestor
                  gestor_razon_social: srcDoc.gestor_razon_social || prev.gestor_razon_social,
                  gestor_cif: srcDoc.gestor_cif || prev.gestor_cif,
                  gestor_nima: srcDoc.gestor_nima || prev.gestor_nima,
                  gestor_numero_autorizacion: srcDoc.gestor_numero_autorizacion || prev.gestor_numero_autorizacion,
                  gestor_direccion: srcDoc.gestor_direccion || prev.gestor_direccion,
                  gestor_municipio: srcDoc.gestor_municipio || prev.gestor_municipio,
                  gestor_provincia: srcDoc.gestor_provincia || prev.gestor_provincia,
                  gestor_codigo_postal: srcDoc.gestor_codigo_postal || prev.gestor_codigo_postal,
                  gestor_telefono: srcDoc.gestor_telefono || prev.gestor_telefono,
                  // Transportista
                  transportista_razon_social: srcDoc.transportista_razon_social || prev.transportista_razon_social,
                  transportista_cif: srcDoc.transportista_cif || prev.transportista_cif,
                  transportista_nima: srcDoc.transportista_nima || prev.transportista_nima,
                  transportista_direccion: srcDoc.transportista_direccion || prev.transportista_direccion,
                  transportista_municipio: srcDoc.transportista_municipio || prev.transportista_municipio,
                  transportista_provincia: srcDoc.transportista_provincia || prev.transportista_provincia,
                  transportista_codigo_postal: srcDoc.transportista_codigo_postal || prev.transportista_codigo_postal,
                  transportista_matricula: srcDoc.transportista_matricula || prev.transportista_matricula,
                  transportista_telefono: srcDoc.transportista_telefono || prev.transportista_telefono,
                  // Residuo
                  codigo_ler: srcDoc.codigo_ler || prev.codigo_ler,
                  descripcion_residuo: srcDoc.descripcion_residuo || prev.descripcion_residuo,
                  peligrosidad: srcDoc.peligrosidad || prev.peligrosidad,
                  waste_type_id: srcDoc.waste_type_id || prev.waste_type_id,
                  tipo_envases: srcDoc.tipo_envases || prev.tipo_envases,
                  numero_envases: srcDoc.numero_envases || prev.numero_envases,
                  operacion_tratamiento: srcDoc.operacion_tratamiento || prev.operacion_tratamiento,
                  operacion_tratamiento_ejecutada: srcDoc.operacion_tratamiento_ejecutada || prev.operacion_tratamiento_ejecutada,
                  // Notificación previa
                  tipo_notificacion: srcDoc.tipo_notificacion || prev.tipo_notificacion,
                  prior_notification_id: srcDoc.prior_notification_id || prev.prior_notification_id,
                  numero_notificacion: srcDoc.numero_notificacion || prev.numero_notificacion,
                  // Cantidad previa conservada para confirmación rápida
                  cantidad: srcDoc.cantidad,
                  // Resetear estados, pesajes de destino y firmas
                  estado: 'borrador',
                  estado_traslado: 'borrador',
                  firmado_productor: false,
                  firmado_gestor: false,
                  firmado_transportista: false,
                  firma_productor_url: undefined,
                  firma_gestor_url: undefined,
                  firma_transportista_url: undefined,
                  peso_destino_kg: undefined,
                  numero_albaran_gestor: undefined,
                  archivo_justificante_url: undefined,
                  fecha_documento: new Date().toISOString().split('T')[0],
                  fecha_inicio_traslado: new Date().toISOString().split('T')[0],
                  numero_documento: previewDiNumber,
                }));

                if (srcDoc.production_center_id) {
                  setSelectedOrigin(String(srcDoc.production_center_id));
                }
              }
            } catch (e) {
              console.warn('No se pudo precargar la retirada anterior:', e);
            }
          }
        }

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

    const handleRoleSwitch = (newRole: 'productor' | 'gestor') => {
      const isGestorAllowed = Boolean(myCompany?.tipo_empresa === 'gestor' || myCompany?.roles?.includes('gestor'));
      if (newRole === 'gestor' && !isGestorAllowed) return;
      setExpeditionRole(newRole);
      if (!myCompany) return;

      const defaultDir = myCompany.domicilio_instalacion || myCompany.domicilio_social || '';
      const defaultMuni = myCompany.municipio_instalacion || myCompany.municipio_social || '';
      const defaultProv = myCompany.provincia_instalacion || myCompany.provincia_social || '';
      const defaultCP = myCompany.codigo_postal_instalacion || myCompany.codigo_postal_social || '';
      const defaultNima = myCompany.nima || '';

      if (newRole === 'gestor') {
        // Mi empresa pasa a ser el gestor destinatario
        setFormData(prev => ({
          ...prev,
          gestor_razon_social: myCompany.razon_social,
          gestor_cif: myCompany.cif,
          gestor_nima: defaultNima,
          gestor_numero_autorizacion: myCompany.numero_autorizacion || myCompany.numero_inscripcion || '',
          gestor_direccion: defaultDir,
          gestor_municipio: defaultMuni,
          gestor_provincia: defaultProv,
          gestor_codigo_postal: defaultCP,
          gestor_telefono: myCompany.telefono || '',
          // Limpiar productor para que se introduzca el cliente
          productor_razon_social: '',
          productor_cif: '',
          productor_nima: '',
          productor_direccion: '',
          productor_municipio: '',
          productor_provincia: '',
          productor_codigo_postal: '',
        }));
        checkDestinationAuthorization(myCompany.cif, formData.fecha_documento);
      } else {
        // Mi empresa pasa a ser el productor
        setFormData(prev => ({
          ...prev,
          productor_razon_social: myCompany.razon_social,
          productor_cif: myCompany.cif,
          productor_nima: defaultNima,
          productor_direccion: defaultDir,
          productor_municipio: defaultMuni,
          productor_provincia: defaultProv,
          productor_codigo_postal: defaultCP,
          // Limpiar gestor
          gestor_razon_social: '',
          gestor_cif: '',
          gestor_nima: '',
          gestor_numero_autorizacion: '',
          gestor_direccion: '',
          gestor_municipio: '',
          gestor_provincia: '',
          gestor_codigo_postal: '',
        }));
      }
    };

    const handleClientProducerChange = (contactId: string) => {
      setSelectedClientContact(contactId);
      const contact = allContacts.find(c => c.id === parseInt(contactId));
      if (contact) {
        setFormData(prev => ({
          ...prev,
          productor_razon_social: contact.razon_social,
          productor_cif: contact.cif,
          productor_nima: contact.nima || '',
          productor_direccion: contact.domicilio_instalacion || contact.domicilio_social || '',
          productor_municipio: contact.municipio_instalacion || contact.municipio_social || '',
          productor_provincia: contact.provincia_instalacion || contact.provincia_social || '',
          productor_codigo_postal: contact.codigo_postal_instalacion || contact.codigo_postal_social || '',
        }));
      }
    };

    const handleContractChange = (contractId: string) => {
      const contract = contracts.find(c => c.id === parseInt(contractId));
      if (!contract) return;

      if (contract.treatment_manager) {
        const tm = contract.treatment_manager;
        const tmCp = tm.codigo_postal || '';
        const tmProv = tm.provincia || (tmCp ? getProvinceByPostalCode(tmCp) : '') || '';
        setFormData(prev => ({
          ...prev,
          contract_id: contract.id,
          gestor_razon_social: tm.razon_social,
          gestor_cif: tm.cif,
          gestor_nima: tm.nima || '',
          gestor_numero_autorizacion: tm.numero_autorizacion || '',
          gestor_direccion: tm.direccion || '',
          gestor_codigo_postal: tmCp,
          gestor_municipio: tm.municipio || '',
          gestor_provincia: tmProv,
          gestor_telefono: tm.telefono || '',
        }));
      } else if (contract.gestor_company) {
        const gc = contract.gestor_company;
        const authNum =
          contract.environmental_authorization?.numero_autorizacion ||
          gc.numero_autorizacion ||
          (gc as any).numero_autorizacion_gestor ||
          '';

        const gcCp = gc.codigo_postal_instalacion || gc.codigo_postal_social || (gc as any).codigo_postal || '';
        const gcMuni = gc.municipio_instalacion || gc.municipio_social || (gc as any).municipio || '';
        const gcProv = gc.provincia_instalacion || gc.provincia_social || (gc as any).provincia || (gcCp ? getProvinceByPostalCode(gcCp) : '') || '';
        const gcDir = gc.domicilio_instalacion || gc.domicilio_social || (gc as any).direccion || '';

        setFormData(prev => ({
          ...prev,
          contract_id: contract.id,
          gestor_razon_social: gc.razon_social,
          gestor_cif: gc.cif,
          gestor_nima: gc.nima || '',
          gestor_numero_autorizacion: authNum,
          gestor_direccion: gcDir,
          gestor_codigo_postal: gcCp,
          gestor_municipio: gcMuni,
          gestor_provincia: gcProv,
          gestor_telefono: gc.telefono || '',
        }));

        // Si no viene en el contrato pero hay gestor_company_id, consultar autorizaciones asociadas
        if (!authNum && (contract.gestor_company_id || contract.gestor_company.id)) {
          const targetCompanyId = contract.gestor_company_id || contract.gestor_company.id;
          authorizationService.getByCompany(targetCompanyId).then((auths: any[]) => {
            if (auths && auths.length > 0 && auths[0].numero_autorizacion) {
              setFormData(p => ({
                ...p,
                gestor_numero_autorizacion: auths[0].numero_autorizacion,
              }));
            }
          }).catch(() => { });
        }
      }
    };

    const handleInternalGestorChange = (gestorId: string) => {
      const gestor = internalGestores.find(g => g.id === parseInt(gestorId));
      if (gestor) {
        const gCp = gestor.codigo_postal || '';
        const gProv = gestor.provincia || (gCp ? getProvinceByPostalCode(gCp) : '') || '';
        setFormData(prev => ({
          ...prev,
          gestor_razon_social: gestor.razon_social,
          gestor_cif: gestor.cif,
          gestor_nima: gestor.nima || '',
          gestor_numero_autorizacion: gestor.numero_autorizacion || '',
          gestor_direccion: gestor.direccion || '',
          gestor_codigo_postal: gCp,
          gestor_municipio: gestor.municipio || '',
          gestor_provincia: gProv,
          gestor_telefono: gestor.telefono || '',
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

    const handleSelectNt = (ntIdStr: string) => {
      if (!ntIdStr) {
        setFormData((prev) => ({ ...prev, prior_notification_id: undefined, numero_notificacion: '' }));
        return;
      }
      const nt = priorNotifications.find((n) => String(n.id) === ntIdStr);
      if (!nt) return;
      setFormData((prev) => ({
        ...prev,
        prior_notification_id: nt.id,
        numero_notificacion: nt.numero_notificacion,
        tipo_notificacion: 'con-notificacion-previa',
        codigo_ler: nt.codigo_ler || prev.codigo_ler,
        descripcion_residuo: nt.descripcion_residuo || prev.descripcion_residuo,
        peligrosidad: nt.peligrosidad || prev.peligrosidad,
        operacion_tratamiento_ejecutada: nt.operacion_tratamiento || prev.operacion_tratamiento_ejecutada,
        operacion_tratamiento: nt.operacion_tratamiento || prev.operacion_tratamiento,
        gestor_razon_social: nt.gestor_razon_social || prev.gestor_razon_social,
        gestor_cif: nt.gestor_cif || prev.gestor_cif,
        gestor_nima: nt.gestor_nima || prev.gestor_nima,
      }));
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

          {duplicateSourceInfo && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-300">
                  <Copy className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Repitiendo retirada basada en {duplicateSourceInfo.numero_documento}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Se han precargado los datos de contrato, centro, gestor, transportista y residuo LER. Revise la cantidad y confirme la fecha.
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold rounded-full">
                Borrador Nuevo
              </span>
            </div>
          )}

          {error && (
            <Alert variant="error" title="Error" message={error} />
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Modalidad de Expedición */}
            {myCompany?.tipo_empresa === 'gestor' || myCompany?.roles?.includes('gestor') ? (
              <ComponentCard
                title="Perspectiva de Expedición (RD 553/2020)"
                desc="Selecciona si emites el traslado como Productor (envío de tus residuos) o como Gestor Receptor (recepción o gestión para un cliente)."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('productor')}
                    className={`p-4 rounded-xl border text-left transition-all ${expeditionRole === 'productor'
                      ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 ring-2 ring-brand-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                  >
                    <div className="mb-1">
                      <span className="font-semibold text-sm text-foreground">Como Productor / Poseedor</span>
                    </div>
                    <p className="text-xs text-muted">
                      Mi empresa ({myCompany?.razon_social || 'Mi Empresa'}) genera el residuo y lo transfiere a un gestor de destino.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('gestor')}
                    className={`p-4 rounded-xl border text-left transition-all ${expeditionRole === 'gestor'
                      ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 ring-2 ring-brand-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                  >
                    <div className="mb-1">
                      <span className="font-semibold text-sm text-foreground">Como Gestor Receptor</span>
                    </div>
                    <p className="text-xs text-muted">
                      Mi empresa ({myCompany?.razon_social || 'Mi Empresa'}) es la instalación autorizada que recepcionará el residuo de un cliente.
                    </p>
                  </button>
                </div>
              </ComponentCard>
            ) : (
              <div className="p-3.5 bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 rounded-xl flex items-center justify-between text-xs text-brand-900 dark:text-brand-300">
                <span>
                  Expedición desde centro de origen como <strong>Productor / Poseedor</strong> ({myCompany?.razon_social || 'Mi Empresa'}).
                </span>
                <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900/60 rounded text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                  Rol: Productor
                </span>
              </div>
            )}

            {/* Datos del Documento */}
            <ComponentCard title="Datos del Documento">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="numero_documento" className="block text-sm font-medium mb-2">Número de Documento</label>
                  <label htmlFor="numero_documento" className="block text-sm font-medium mb-2">Número de Documento (Automático E3L)</label>
                  <Input
                    id="numero_documento"
                    type="text"
                    value={formData.numero_documento || ''}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    required
                    disabled
                    placeholder="Se asignará automáticamente al guardar"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Código oficial consecutivo E3L 3.3 por empresa y año (no editable).
                  </p>
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

                {/* Régimen de Notificación Previa y Selector NT */}
                <div className="md:col-span-2 p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-foreground">
                      Régimen de Notificación Previa (RD 553/2020)
                    </label>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipo_notificacion"
                          checked={formData.tipo_notificacion === 'sin-notificacion'}
                          onChange={() => setFormData({ ...formData, tipo_notificacion: 'sin-notificacion', prior_notification_id: undefined })}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <span>Sin Notificación Previa</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipo_notificacion"
                          checked={formData.tipo_notificacion === 'con-notificacion-previa'}
                          onChange={() => setFormData({ ...formData, tipo_notificacion: 'con-notificacion-previa' })}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <span>Con Notificación Previa (NT)</span>
                      </label>
                    </div>
                  </div>

                  {formData.tipo_notificacion === 'con-notificacion-previa' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div>
                        <label className="block text-xs font-medium text-muted uppercase mb-1">
                          Vincular Notificación Previa (NT) Existente:
                        </label>
                        <select
                          className="w-full h-10 px-3 py-1.5 border rounded-lg bg-background text-foreground border-border text-sm"
                          value={formData.prior_notification_id || ''}
                          onChange={(e) => handleSelectNt(e.target.value)}
                        >
                          <option value="">-- Seleccionar de mis Notificaciones Previas --</option>
                          {priorNotifications.map((nt) => (
                            <option key={nt.id} value={nt.id}>
                              {nt.numero_notificacion || `NT-${nt.id}`} - LER: {nt.codigo_ler} ({nt.gestor_razon_social})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted uppercase mb-1">
                          Código Oficial NT (DCSNT para SIRA) *
                        </label>
                        <Input
                          type="text"
                          placeholder="Ej. NT10110000000120260000001"
                          value={formData.numero_notificacion || ''}
                          onChange={(e) => setFormData({ ...formData, numero_notificacion: e.target.value })}
                          required={formData.tipo_notificacion === 'con-notificacion-previa'}
                        />
                        <p className="text-[11px] text-muted mt-1">
                          Este código será comunicado en la etiqueta oficial &lt;DCSNT&gt; ante la Junta de Andalucía.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {expeditionRole === 'productor' ? (
                  <div>
                    <label htmlFor="origin_selector" className="block text-sm font-medium mb-2">Origen del Residuo (Instalación / Centro) *</label>
                    <Select
                      options={[
                        { value: 'principal', label: `Sede / Instalación Principal (${myCompany?.razon_social || 'Mi Empresa'})` },
                        ...productionCenters.map(pc => ({
                          value: pc.id.toString(),
                          label: `${pc.nombre} (${pc.nima})`,
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
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2">Destino de Recepción</label>
                    <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-xs text-foreground">
                      Recepciona: <span className="font-semibold">{myCompany?.razon_social}</span> (NIMA: {myCompany?.nima || 'S/D'})
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="contract_id" className="block text-sm font-medium mb-2">
                    Contrato de Referencia <span className="text-xs text-muted font-normal">(Opcional en borrador; requerido al iniciar traslado)</span>
                  </label>
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

                  {contracts.length === 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                        <span>Cobertura Contractual Requerida (Art. 5 RD 553/2020)</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        No dispone de contratos vigentes registrados con gestores de destino. Puede preparar este borrador de traslado, pero no podrá iniciar la expedición oficial hasta formalizar un contrato de tratamiento.
                      </p>
                      <div>
                        <Link href="/residuos/contratos" className="text-xs font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline">
                          + Dar de alta un Contrato de Tratamiento →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* Productor / Origen */}
            <ComponentCard title="Productor / Origen">
              <div className="space-y-4">
                {expeditionRole === 'gestor' && allContacts.length > 0 && (
                  <div className="p-3 bg-brand-50/30 dark:bg-brand-950/20 rounded-xl border border-brand-200 dark:border-brand-900/40">
                    <label htmlFor="client_contact_select" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Cargar datos desde Contactos / Clientes
                    </label>
                    <Select
                      options={[
                        { value: '', label: '-- Seleccionar contacto para autorrellenar --' },
                        ...allContacts.map(c => ({
                          value: c.id.toString(),
                          label: `${c.razon_social} (${c.cif})`,
                        })),
                      ]}
                      value={selectedClientContact}
                      onChange={(val) => handleClientProducerChange(val)}
                      placeholder="Seleccionar contacto guardado"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="productor_razon_social" className="block text-sm font-medium mb-2">Razón Social *</label>
                    <Input
                      id="productor_razon_social"
                      value={formData.productor_razon_social || ''}
                      onChange={(e) => setFormData({ ...formData, productor_razon_social: e.target.value })}
                      disabled={expeditionRole === 'productor'}
                      error={!!validationErrors.productor_razon_social}
                      hint={validationErrors.productor_razon_social}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="productor_cif" className="block text-sm font-medium mb-2">CIF *</label>
                    <Input
                      id="productor_cif"
                      value={formData.productor_cif || ''}
                      onChange={(e) => setFormData({ ...formData, productor_cif: e.target.value })}
                      disabled={expeditionRole === 'productor'}
                      error={!!validationErrors.productor_cif}
                      hint={validationErrors.productor_cif}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="productor_nima" className="block text-sm font-medium mb-2">NIMA *</label>
                    <Input
                      id="productor_nima"
                      value={formData.productor_nima || ''}
                      onChange={(e) => setFormData({ ...formData, productor_nima: e.target.value })}
                      disabled={expeditionRole === 'productor'}
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
                      disabled={expeditionRole === 'productor'}
                      placeholder="Calle, número..."
                      error={!!validationErrors.productor_direccion}
                      hint={validationErrors.productor_direccion}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3">
                        <label htmlFor="productor_codigo_postal" className="block text-sm font-medium mb-2">Código Postal</label>
                        <Input
                          id="productor_codigo_postal"
                          value={formData.productor_codigo_postal || ''}
                          onChange={(e) => {
                            const cp = e.target.value;
                            const detectedProv = getProvinceByPostalCode(cp);
                            setFormData((prev) => ({
                              ...prev,
                              productor_codigo_postal: cp,
                              productor_provincia: detectedProv || prev.productor_provincia,
                            }));
                          }}
                          disabled={expeditionRole === 'productor'}
                          placeholder="Ej. 11510"
                        />
                      </div>

                      <ProvinceMunicipalityFields
                        unstyledWrapper
                        provinciaWrapperClassName="md:col-span-4"
                        municipioWrapperClassName="md:col-span-5"
                        order="provincia-first"
                        provinciaRequired
                        municipioRequired
                        provincia={formData.productor_provincia || ''}
                        municipio={formData.productor_municipio || ''}
                        provinciaId="productor_provincia"
                        municipioId="productor_municipio"
                        provinciaName="productor_provincia"
                        municipioName="productor_municipio"
                        provinciaError={!!validationErrors.productor_provincia}
                        municipioError={!!validationErrors.productor_municipio}
                        provinciaHint={validationErrors.productor_provincia}
                        municipioHint={validationErrors.productor_municipio}
                        disabled={expeditionRole === 'productor'}
                        onChange={({ provincia, municipio }) =>
                          setFormData((prev) => ({
                            ...prev,
                            productor_provincia: provincia,
                            productor_municipio: municipio,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* Gestor/Destinatario */}
            <ComponentCard title="Gestor / Destinatario">
              <div className="space-y-4">
                {expeditionRole === 'gestor' ? (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                    ✓ El gestor destinatario receptor es <span className="font-semibold">{myCompany?.razon_social}</span>. Los datos se han completado con la ficha de tu empresa.
                  </div>
                ) : (
                  <div>
                    <label htmlFor="internal_gestor_select" className="block text-sm font-medium mb-2">Mis Gestores</label>
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
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="gestor_razon_social" className="block text-sm font-medium mb-2">Razón Social *</label>
                    <Input
                      id="gestor_razon_social"
                      type="text"
                      value={formData.gestor_razon_social || ''}
                      onChange={(e) => setFormData({ ...formData, gestor_razon_social: e.target.value })}
                      disabled={expeditionRole === 'gestor'}
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
                      disabled={expeditionRole === 'gestor'}
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
                      disabled={expeditionRole === 'gestor'}
                    />
                  </div>

                  <div>
                    <label htmlFor="gestor_numero_autorizacion" className="block text-sm font-medium mb-2">Nº Autorización</label>
                    <Input
                      id="gestor_numero_autorizacion"
                      type="text"
                      value={formData.gestor_numero_autorizacion || ''}
                      onChange={(e) => setFormData({ ...formData, gestor_numero_autorizacion: e.target.value })}
                      disabled={expeditionRole === 'gestor'}
                    />
                  </div>

                  {/* Campos de Dirección del Gestor (Requeridos SIRA) */}
                  <div>
                    <label htmlFor="gestor_direccion" className="block text-sm font-medium mb-2">Dirección *</label>
                    <Input
                      id="gestor_direccion"
                      value={formData.gestor_direccion || ''}
                      onChange={(e) => setFormData({ ...formData, gestor_direccion: e.target.value })}
                      disabled={expeditionRole === 'gestor'}
                      error={!!validationErrors.gestor_direccion}
                      hint={validationErrors.gestor_direccion}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3">
                        <label htmlFor="gestor_codigo_postal" className="block text-sm font-medium mb-2">CP</label>
                        <Input
                          id="gestor_codigo_postal"
                          value={formData.gestor_codigo_postal || ''}
                          onChange={(e) => {
                            const cp = e.target.value;
                            const detectedProv = getProvinceByPostalCode(cp);
                            setFormData((prev) => ({
                              ...prev,
                              gestor_codigo_postal: cp,
                              gestor_provincia: detectedProv || prev.gestor_provincia,
                            }));
                          }}
                          disabled={expeditionRole === 'gestor'}
                          placeholder="28001"
                        />
                      </div>

                      <ProvinceMunicipalityFields
                        unstyledWrapper
                        provinciaWrapperClassName="md:col-span-4"
                        municipioWrapperClassName="md:col-span-5"
                        order="provincia-first"
                        provinciaRequired
                        municipioRequired
                        provincia={formData.gestor_provincia || ''}
                        municipio={formData.gestor_municipio || ''}
                        provinciaId="gestor_provincia"
                        municipioId="gestor_municipio"
                        provinciaName="gestor_provincia"
                        municipioName="gestor_municipio"
                        provinciaError={!!validationErrors.gestor_provincia}
                        municipioError={!!validationErrors.gestor_municipio}
                        provinciaHint={validationErrors.gestor_provincia}
                        municipioHint={validationErrors.gestor_municipio}
                        disabled={expeditionRole === 'gestor'}
                        onChange={({ provincia, municipio }) =>
                          setFormData((prev) => ({
                            ...prev,
                            gestor_provincia: provincia,
                            gestor_municipio: municipio,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Banner de Autorización Ambiental Consultable (Bloque 2) */}
                  {destAuthScope && destAuthScope.authorizations && destAuthScope.authorizations.length > 0 && (
                    <div className="md:col-span-2 p-3.5 bg-brand-50/80 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl space-y-2 mt-2">
                      {destAuthScope.authorizations.map((auth) => (
                        <div key={auth.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <p className="text-xs font-bold text-brand-950 dark:text-brand-200 flex items-center gap-1.5">
                              Autorización Ambiental: {auth.numero_autorizacion} — {auth.titulo}
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
                <div>
                  <label htmlFor="internal_carrier_select" className="block text-sm font-medium mb-2">Mis Transportistas</label>
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
                    <div className="h-px flex-1 bg-border" />
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

                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3">
                        <label htmlFor="transportista_codigo_postal" className="block text-sm font-medium mb-2">CP</label>
                        <Input
                          id="transportista_codigo_postal"
                          type="text"
                          value={formData.transportista_codigo_postal || ''}
                          onChange={(e) => {
                            const cp = e.target.value;
                            const detectedProv = getProvinceByPostalCode(cp);
                            setFormData((prev) => ({
                              ...prev,
                              transportista_codigo_postal: cp,
                              transportista_provincia: detectedProv || prev.transportista_provincia,
                            }));
                          }}
                          placeholder="28001"
                        />
                      </div>

                      <ProvinceMunicipalityFields
                        unstyledWrapper
                        provinciaWrapperClassName="md:col-span-4"
                        municipioWrapperClassName="md:col-span-5"
                        order="provincia-first"
                        provincia={formData.transportista_provincia || ''}
                        municipio={formData.transportista_municipio || ''}
                        provinciaId="transportista_provincia"
                        municipioId="transportista_municipio"
                        provinciaName="transportista_provincia"
                        municipioName="transportista_municipio"
                        onChange={({ provincia, municipio }) =>
                          setFormData((prev) => ({
                            ...prev,
                            transportista_provincia: provincia,
                            transportista_municipio: municipio,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* Datos del Residuo */}
            <ComponentCard title="Datos del Residuo">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="codigo_ler" className="block text-sm font-medium mb-2">Código LER *</label>
                  <LerSelector
                    value={formData.codigo_ler}
                    onChange={(value, wt) => {
                      if (wt) {
                        const isDangerous = wt.codigo_ler.includes('*') || wt.categoria === 'peligroso';
                        setFormData({
                          ...formData,
                          waste_type_id: wt.id,
                          codigo_ler: wt.codigo_ler,
                          descripcion_residuo: wt.descripcion,
                          peligrosidad: isDangerous ? 'peligroso' : (wt.categoria || 'no-peligroso'),
                          estado_fisico: wt.estado,
                          operacion_tratamiento: wt.operaciones_permitidas?.[0] || formData.operacion_tratamiento || '',
                        });
                      } else {
                        setFormData({
                          ...formData,
                          codigo_ler: value,
                        });
                      }
                    }}
                    error={!!validationErrors.codigo_ler}
                    hint={validationErrors.codigo_ler}
                    required
                  />
                  {destAuthScope && destAuthScope.authorizations && destAuthScope.authorizations.length > 0 && formData.codigo_ler && (
                    destAuthScope.authorizedLers[formData.codigo_ler] ? (
                      <p className="mt-1.5 text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
                        LER Autorizado en destino (Operaciones:{' '}
                        <strong>{destAuthScope.authorizedLers[formData.codigo_ler].join(', ')}</strong>)
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                        <strong>No Autorizado en Destino:</strong> Este residuo no figura en las autorizaciones ambientales del gestor seleccionado.
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
                      Clasificado obligatoriamente como <strong>Peligroso</strong> según LER con asterisco (*) (RD 553/2020).
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
                        Operación no autorizada (Permitidas: {destAuthScope.authorizedLers[formData.codigo_ler].join(', ')}).
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
                  <label htmlFor="tipo_envases" className="block text-sm font-medium mb-2">Tipo de Envase / Contenedor</label>
                  <Select
                    options={PHYSICAL_CONTAINER_CATALOG.map((item) => ({
                      value: item.label,
                      label: item.label,
                    }))}
                    value={
                      PHYSICAL_CONTAINER_CATALOG.some((c) => c.label === formData.tipo_envases)
                        ? (formData.tipo_envases || '')
                        : formData.tipo_envases
                          ? 'Otro (especificar)'
                          : ''
                    }
                    onChange={(value) => {
                      if (value === 'Otro (especificar)') {
                        setFormData({ ...formData, tipo_envases: 'Otro: ' });
                      } else {
                        setFormData({ ...formData, tipo_envases: value });
                      }
                    }}
                    placeholder="Selecciona tipo físico de contenedor..."
                  />
                  {formData.tipo_envases?.startsWith('Otro') && (
                    <div className="mt-2">
                      <Input
                        id="tipo_envases_otro"
                        type="text"
                        value={formData.tipo_envases.replace(/^Otro:\s*/i, '')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tipo_envases: `Otro: ${e.target.value}`,
                          })
                        }
                        placeholder="Especifique el tipo de contenedor o envase (obligatorio) *"
                        required
                      />
                    </div>
                  )}
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

  export default function NuevoDocumentoIdentificacionPage() {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted">Cargando...</p>
          </div>
        }
      >
        <NuevoDocumentoIdentificacionContent />
      </Suspense>
    );
  }
