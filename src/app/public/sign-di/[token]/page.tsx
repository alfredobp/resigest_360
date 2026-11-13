'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import identificationDocumentService from '@/services/identificationDocumentService';
import type { IdentificationDocument } from '@/types/wasteManagement';
import SignaturePad from '@/components/ui/signature/SignaturePad';
import Alert from '@/components/ui/alert/Alert';
import ComponentCard from '@/components/common/ComponentCard';
import Input from '@/components/form/input/InputField';
import Badge from '@/components/ui/badge/Badge';

type SigningRole = 'productor' | 'transportista' | 'gestor';

const ROLE_META: Record<
  SigningRole,
  { label: string; subtitle: string; icon: string }
> = {
  productor: {
    label: '1. Productor / Remitente',
    subtitle: 'Conformidad de entrega en origen',
    icon: '🏭',
  },
  transportista: {
    label: '2. Transportista (En Carga)',
    subtitle: 'Conformidad de recogida y porte',
    icon: '🚚',
  },
  gestor: {
    label: '3. Gestor Destinatario',
    subtitle: 'Conformidad de recepción en planta',
    icon: '♻️',
  },
};

function PublicDISignatureContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params?.token as string;
  const roleParam = searchParams?.get('role') as SigningRole | null;

  const isValidRoleParam =
    roleParam === 'productor' || roleParam === 'transportista' || roleParam === 'gestor';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [di, setDi] = useState<IdentificationDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SigningRole>(
    isValidRoleParam ? roleParam : 'transportista'
  );
  const [signerName, setSignerName] = useState('');
  const [signerDni, setSignerDni] = useState('');

  useEffect(() => {
    if (isValidRoleParam && roleParam) {
      setSelectedRole(roleParam);
    }
  }, [isValidRoleParam, roleParam]);

  useEffect(() => {
    if (token) {
      loadDocument();
    }
  }, [token]);

  useEffect(() => {
    if (!di) return;
    if (selectedRole === 'productor') {
      setSignerName(di.nombre_productor || di.productor_razon_social || '');
      setSignerDni(di.dni_productor || di.productor_cif || '');
    } else if (selectedRole === 'transportista') {
      setSignerName(di.nombre_transportista || di.transportista_razon_social || '');
      setSignerDni(di.dni_transportista || di.transportista_cif || '');
    } else {
      setSignerName(di.nombre_gestor || di.gestor_razon_social || '');
      setSignerDni(di.dni_gestor || di.gestor_cif || '');
    }
  }, [di, selectedRole]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await identificationDocumentService.getBySigningToken(token);
      if (!data) {
        setError('El enlace de firma es inválido, ha expirado o el Documento de Identificación ya no está disponible.');
        return;
      }
      setDi(data);
    } catch {
      setError('El enlace de firma es inválido o el Documento de Identificación ya no está disponible.');
    } finally {
      setLoading(false);
    }
  };

  const isRoleAlreadySigned = (doc: IdentificationDocument, role: SigningRole): boolean => {
    if (role === 'productor') return Boolean(doc.firmado_productor && doc.firma_productor_url);
    if (role === 'transportista') return Boolean(doc.firmado_transportista && doc.firma_transportista_url);
    return Boolean(doc.firmado_gestor && doc.firma_gestor_url);
  };

  const handleSaveSignature = async (signatureBase64: string) => {
    if (!token || !di) return;

    if (!signerName.trim()) {
      setError('Por favor, indique el nombre y apellidos de la persona que firma.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await identificationDocumentService.signDocumentByToken(
        token,
        selectedRole,
        signatureBase64,
        {
          nombre: signerName.trim(),
          dni: signerDni.trim(),
        }
      );
      setDi(updated);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la firma en el documento.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !di) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-500">Cargando Documento de Identificación (DI)...</p>
        </div>
      </div>
    );
  }

  if (error && !di) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <Alert variant="error" title="Enlace No Disponible" message={error} />
        </div>
      </div>
    );
  }

  if (success && di) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            ¡Firma Registrada con Éxito!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Se ha incorporado la firma de <strong>{ROLE_META[selectedRole].label}</strong> al Documento de Identificación{' '}
            <span className="font-mono font-semibold">{di.numero_documento}</span>.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Firmante: {signerName} {signerDni ? `(${signerDni})` : ''}
          </p>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <p className="text-xs text-gray-400 italic">
              RESIGEST 360 — Trazabilidad RD 553/2020. Puede cerrar esta ventana.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!di) return null;

  const alreadySigned = isRoleAlreadySigned(di, selectedRole);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-3">
            RD 553/2020 — Traslado de Residuos
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Firma de Documento de Identificación (DI)
          </h1>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
            Revise los datos del traslado y firme electrónicamente en calidad de{' '}
            <strong>{ROLE_META[selectedRole].label}</strong>.
          </p>
        </div>

        {error && <Alert variant="error" title="Atención" message={error} />}

        {/* Resumen del DI */}
        <ComponentCard title={`Documento DI ${di.numero_documento}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Código LER y Residuo</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                <span className="font-mono">{di.codigo_ler}</span> — {di.descripcion_residuo}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cantidad / Peso Declarado</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {di.cantidad} {di.unidad}
                {di.peso_destino_kg ? ` (Báscula destino: ${di.peso_destino_kg} kg)` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">1. Productor / Origen</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {di.productor_razon_social}{' '}
                <span className="text-xs font-mono text-gray-500">({di.productor_cif})</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">2. Transportista</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {di.transportista_razon_social || 'No especificado'}
                {di.transportista_matricula ? ` — Matrícula: ${di.transportista_matricula}` : ''}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500">3. Gestor Destinatario</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {di.gestor_razon_social}{' '}
                <span className="text-xs font-mono text-gray-500">({di.gestor_cif})</span>
              </p>
            </div>
          </div>
        </ComponentCard>

        {/* Selección de Rol Firmante */}
        <ComponentCard title="Parte Firmante del Traslado">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['productor', 'transportista', 'gestor'] as SigningRole[]).map((roleKey) => {
              const meta = ROLE_META[roleKey];
              const signed = isRoleAlreadySigned(di, roleKey);
              const active = selectedRole === roleKey;
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSelectedRole(roleKey);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    active
                      ? 'border-2 border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 dark:border-brand-400'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:border-brand-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{meta.icon}</span>
                      {signed ? (
                        <Badge color="success" size="sm">✓ Firmado</Badge>
                      ) : (
                        <Badge color="light" size="sm">Pendiente</Badge>
                      )}
                    </div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                      {meta.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {meta.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ComponentCard>

        {/* Área de Identificación y Lienzo de Firma */}
        {alreadySigned ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
            <Badge color="success" size="md">
              ✓ {ROLE_META[selectedRole].label} ya ha firmado este Documento de Identificación
            </Badge>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Por motivos de integridad documental (RD 553/2020), una firma ya estampada no puede sobrescribirse desde el enlace público.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Datos del Firmante ({ROLE_META[selectedRole].label})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Indique el nombre completo y DNI/NIE de la persona que suscribe la conformidad.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Nombre y Apellidos / Responsable *
                </label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Ej: Juan Pérez García"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  DNI / NIE / NIF
                </label>
                <Input
                  value={signerDni}
                  onChange={(e) => setSignerDni(e.target.value.toUpperCase())}
                  placeholder="Ej: 12345678Z"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Dibuje su firma en el recuadro inferior *
                </span>
                <span className="text-xs text-gray-400">
                  {saving ? 'Guardando firma...' : 'Trazabilidad segura'}
                </span>
              </div>
              <div className="p-2 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                <SignaturePad onSave={handleSaveSignature} height={240} />
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Al firmar este documento, declara la conformidad en relación con el Documento de Identificación{' '}
              <strong>{di.numero_documento}</strong> conforme al Real Decreto 553/2020.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicDISignaturePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cargando documento para firma...
            </p>
          </div>
        </div>
      }
    >
      <PublicDISignatureContent />
    </Suspense>
  );
}
