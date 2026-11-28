'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Clock, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { ConfirmModal } from '@/components/ui/modal';
import { toast } from '@/context/ToastContext';
import delegationService, {
  DELEGATION_TERMS_VERSION,
  PILOT_DELEGATE_EMAIL,
  computeDelegationExpiryIso,
  isDelegationActive,
} from '@/services/delegationService';
import type { CompanyDelegationRecord, MembershipRole } from '@/types/wasteManagement';

interface CompanyDelegationPanelProps {
  companyId: number;
  companyName: string;
  canManageDelegations: boolean;
  onChanged?: () => void;
}

const ROLE_OPTIONS: Array<{
  value: Exclude<MembershipRole, 'owner'>;
  label: string;
  description: string;
}> = [
  {
    value: 'consultor_admin',
    label: 'Consultor Administrador',
    description: 'Puede gestionar ficha, centros, contratos, DI, archivo cronológico y memorias.',
  },
  {
    value: 'consultor_operador',
    label: 'Consultor Operador',
    description: 'Puede operar traslados (DI), contratos y registros sin modificar la identidad fiscal.',
  },
  {
    value: 'lectura',
    label: 'Solo Lectura / Auditoría',
    description: 'Puede consultar y revisar expedientes sin crear ni modificar registros.',
  },
];

const EXPIRY_PRESETS = [
  { id: '1d', label: '24 horas', days: 1 },
  { id: '7d', label: '7 días', days: 7 },
  { id: '30d', label: '30 días', days: 30 },
  { id: '365d', label: '1 año', days: 365 },
  { id: 'custom', label: 'Fecha personalizada', days: 0 },
] as const;

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function CompanyDelegationPanel({
  companyId,
  companyName,
  canManageDelegations,
  onChanged,
}: CompanyDelegationPanelProps) {
  const [delegations, setDelegations] = useState<CompanyDelegationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario de concesión
  const [role, setRole] = useState<Exclude<MembershipRole, 'owner'>>('consultor_admin');
  const [canViewCommercial, setCanViewCommercial] = useState(false);
  const [expiryPreset, setExpiryPreset] = useState<(typeof EXPIRY_PRESETS)[number]['id']>('30d');
  const [customDate, setCustomDate] = useState<string>(() =>
    toDateInputValue(computeDelegationExpiryIso(30))
  );
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Modal de revocación
  const [toRevoke, setToRevoke] = useState<CompanyDelegationRecord | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadDelegations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await delegationService.getCompanyDelegations(companyId);
      setDelegations(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las delegaciones.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadDelegations();
  }, [loadDelegations]);

  const resolvedExpiresAt = useMemo(() => {
    if (expiryPreset === 'custom') {
      if (!customDate) return '';
      return new Date(`${customDate}T23:59:59`).toISOString();
    }
    const preset = EXPIRY_PRESETS.find((p) => p.id === expiryPreset);
    return computeDelegationExpiryIso(preset?.days || 30);
  }, [expiryPreset, customDate]);

  const activeDelegations = useMemo(
    () => delegations.filter((d) => isDelegationActive(d.expires_at)),
    [delegations]
  );

  const handleGrantDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageDelegations) return;

    if (!termsAccepted) {
      toast.warning('Debes aceptar las condiciones legales de delegación para continuar.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await delegationService.grantPilotDelegation(
        {
          companyId,
          role,
          canViewCommercial,
          expiresAt: resolvedExpiresAt,
          termsAccepted: true,
          termsVersion: DELEGATION_TERMS_VERSION,
          reason: 'Autorización expresa del titular desde Mi Empresa',
        },
        { requireTermsAcceptance: true, requireReason: false }
      );
      toast.success('Delegación autorizada correctamente y registrada en auditoría.');
      setTermsAccepted(false);
      await loadDelegations();
      onChanged?.();
    } catch (err: any) {
      const msg = err.message || 'No se pudo autorizar la delegación.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!toRevoke) return;
    try {
      setRevoking(true);
      await delegationService.revokeDelegation(companyId, toRevoke.user_id);
      toast.success('Delegación revocada con efecto inmediato.');
      setToRevoke(null);
      await loadDelegations();
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo revocar la delegación.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error" title="Error en delegación" message={error} />}

      <ComponentCard
        title="Delegación de Gestión y Soporte (Fase Piloto)"
        desc="Autoriza de forma expresa, temporal y revocable al administrador oficial de ResiGest 360 para actuar en nombre de tu empresa."
      >
        {/* Delegado oficial fijo de fase piloto */}
        <div className="mb-6 rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/60 dark:bg-brand-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Delegado Oficial Piloto: Administración ResiGest 360
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                En fase piloto la delegación se concede únicamente a la cuenta oficial de administración (
                <span className="font-mono font-medium">{PILOT_DELEGATE_EMAIL}</span>). Las credenciales
                privadas (SIRA / Holded) permanecen siempre enmascaradas y cada acción queda registrada en
                auditoría.
              </p>
            </div>
          </div>
          <Badge variant="light" color={activeDelegations.length > 0 ? 'success' : 'light'} size="sm">
            {activeDelegations.length > 0 ? 'Delegación activa' : 'Sin delegación'}
          </Badge>
        </div>

        {canManageDelegations ? (
          <form onSubmit={handleGrantDelegation} className="space-y-5">
            {/* 1. Rol de delegación */}
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                1. Nivel de permisos delegado
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ROLE_OPTIONS.map((opt) => {
                  const selected = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {opt.label}
                        </span>
                        {selected && <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Acceso comercial */}
            <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canViewCommercial}
                  onChange={(e) => setCanViewCommercial(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block">
                    Incluir acceso a Operaciones Comerciales y precios (opcional)
                  </span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 block mt-0.5">
                    Desactivado por defecto para proteger el secreto empresarial (precios, márgenes y
                    compraventa). Actívalo solo si necesitas soporte en el módulo comercial.
                  </span>
                </div>
              </label>
            </div>

            {/* 3. Fecha de caducidad */}
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                2. Fecha de caducidad automática <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {EXPIRY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setExpiryPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      expiryPreset === preset.id
                        ? 'border-brand-500 bg-brand-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {expiryPreset === 'custom' ? (
                <div className="max-w-xs">
                  <input
                    type="date"
                    value={customDate}
                    min={toDateInputValue(computeDelegationExpiryIso(1))}
                    onChange={(e) => setCustomDate(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-white"
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  El acceso caducará automáticamente el{' '}
                  <strong>
                    {resolvedExpiresAt
                      ? new Date(resolvedExpiresAt).toLocaleString('es-ES')
                      : '—'}
                  </strong>
                  .
                </p>
              )}
            </div>

            {/* 4. Condiciones legales */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Condiciones de Acceso Delegado (RGPD Art. 28 · Versión {DELEGATION_TERMS_VERSION})</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
                Al autorizar esta delegación, <strong>{companyName}</strong> faculta al administrador oficial de
                ResiGest 360 para acceder y operar bajo el rol seleccionado dentro del periodo de vigencia
                indicado, exclusivamente para tareas de consultoría ambiental, configuración o soporte técnico.
                Todas las operaciones quedan registradas en el historial de auditoría con identificación del
                usuario actuante. Puedes revocar esta autorización en cualquier momento con efecto inmediato.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  He leído y acepto expresamente las condiciones de acceso delegado y tratamiento de datos.
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving || !termsAccepted}>
                {saving ? 'Autorizando...' : 'Autorizar delegación'}
              </Button>
            </div>
          </form>
        ) : (
          <Alert
            variant="info"
            title="Solo el titular puede gestionar delegaciones"
            message="Estás operando con acceso delegado. Únicamente la cuenta titular de la empresa puede conceder o modificar autorizaciones."
          />
        )}
      </ComponentCard>

      {/* Historial / Estado de delegaciones */}
      <ComponentCard
        title="Delegaciones Registradas"
        desc="Control en tiempo real de quién tiene acceso delegado a tu empresa."
      >
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500">Cargando delegaciones...</div>
        ) : delegations.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No hay ninguna delegación registrada para esta empresa.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase">
                <tr>
                  <th className="py-2.5 pr-4">Delegado</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Comercial</th>
                  <th className="py-2.5 px-3">Caducidad</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 pl-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {delegations.map((del) => {
                  const active = isDelegationActive(del.expires_at);
                  return (
                    <tr key={del.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {del.delegate_name}
                        </p>
                        <p className="text-[11px] text-gray-500">{del.delegate_email}</p>
                        {del.delegation_reason && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Motivo: {del.delegation_reason}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-700 dark:text-gray-300">
                        {del.role}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="light"
                          color={del.can_view_commercial ? 'warning' : 'light'}
                          size="sm"
                        >
                          {del.can_view_commercial ? 'Permitido' : 'Oculto'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {del.expires_at
                          ? new Date(del.expires_at).toLocaleString('es-ES')
                          : 'Sin caducidad'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="light" color={active ? 'success' : 'error'} size="sm">
                          {active ? 'Vigente' : 'Caducada'}
                        </Badge>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        {canManageDelegations && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setToRevoke(del)}
                            startIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                          >
                            Revocar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>

      <ConfirmModal
        isOpen={Boolean(toRevoke)}
        onClose={() => setToRevoke(null)}
        onConfirm={handleConfirmRevoke}
        title="Revocar delegación de acceso"
        message={`¿Seguro que deseas revocar el acceso delegado de ${toRevoke?.delegate_email || 'este usuario'}? Perderá el acceso a ${companyName} de forma inmediata.`}
        confirmLabel="Sí, revocar ahora"
        isLoading={revoking}
        variant="danger"
      />
    </div>
  );
}
