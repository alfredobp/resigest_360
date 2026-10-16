'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import companyService from '@/services/companyService';
import type { Company, CompanyFormData, CompanyRole } from '@/types/wasteManagement';

interface EmpresaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company?: Company | null;
  defaultRole?: CompanyRole;
}

const AVAILABLE_ROLES: { id: CompanyRole; label: string; icon: string; description: string }[] = [
  { id: 'gestor', label: 'Gestor Autorizado', icon: '♻️', description: 'Instalación o entidad que recibe y valoriza/elimina residuos' },
  { id: 'transportista', label: 'Transportista', icon: '🚚', description: 'Empresa o transportista autorizado con vehículos de recogida' },
  { id: 'productor', label: 'Productor', icon: '🏭', description: 'Centro o entidad que genera residuos en su actividad' },
  { id: 'negociante', label: 'Negociante', icon: '💼', description: 'Compra y venta de residuos por cuenta propia' },
  { id: 'agente', label: 'Agente', icon: '🤝', description: 'Organiza traslados o valorización por cuenta de terceros' },
  { id: 'cliente', label: 'Cliente', icon: '👤', description: 'Cliente comercial para facturación o venta' },
  { id: 'proveedor', label: 'Proveedor', icon: '📦', description: 'Proveedor comercial de compras o servicios' },
];

export default function EmpresaModal({
  isOpen,
  onClose,
  onSuccess,
  company,
  defaultRole,
}: EmpresaModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CompanyFormData>({
    razon_social: '',
    nombre_comercial: '',
    cif: '',
    nima: '',
    numero_autorizacion: '',
    numero_inscripcion: '',
    matricula: '',
    domicilio_social: '',
    codigo_postal_social: '',
    municipio_social: '',
    provincia_social: '',
    telefono: '',
    email: '',
    persona_contacto: '',
    roles: defaultRole ? [defaultRole] : ['gestor'],
    notas: '',
    activo: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (company) {
        const existingRoles: CompanyRole[] = (
          Array.isArray(company.roles) && company.roles.length > 0
            ? (company.roles as CompanyRole[])
            : (company.tipo_empresa ? [company.tipo_empresa as CompanyRole] : ['gestor' as CompanyRole])
        );

        setFormData({
          razon_social: company.razon_social,
          nombre_comercial: company.nombre_comercial || '',
          cif: company.cif,
          nima: company.nima || '',
          numero_autorizacion: company.numero_autorizacion || '',
          numero_inscripcion: company.numero_inscripcion || '',
          matricula: company.matricula || '',
          domicilio_social: company.domicilio_social || '',
          codigo_postal_social: company.codigo_postal_social || '',
          municipio_social: company.municipio_social || '',
          provincia_social: company.provincia_social || '',
          telefono: company.telefono || '',
          email: company.email || '',
          persona_contacto: company.persona_contacto || '',
          roles: existingRoles,
          notas: company.notas || '',
          activo: company.activo ?? true,
        });
      } else {
        setFormData({
          razon_social: '',
          nombre_comercial: '',
          cif: '',
          nima: '',
          numero_autorizacion: '',
          numero_inscripcion: '',
          matricula: '',
          domicilio_social: '',
          codigo_postal_social: '',
          municipio_social: '',
          provincia_social: '',
          telefono: '',
          email: '',
          persona_contacto: '',
          roles: defaultRole ? [defaultRole] : ['gestor'],
          notas: '',
          activo: true,
        });
      }
      setError(null);
    }
  }, [isOpen, company, defaultRole]);

  const toggleRole = (roleId: CompanyRole) => {
    const currentRoles = formData.roles || [];
    if (currentRoles.includes(roleId)) {
      if (currentRoles.length === 1) {
        setError('La empresa debe tener asignado al menos un rol.');
        return;
      }
      setError(null);
      setFormData({ ...formData, roles: currentRoles.filter(r => r !== roleId) });
    } else {
      setError(null);
      setFormData({ ...formData, roles: [...currentRoles, roleId] });
    }
  };

  const isRoleActive = (roleId: CompanyRole) => {
    return (formData.roles || []).includes(roleId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.razon_social.trim()) {
      setError('La Razón Social es obligatoria.');
      return;
    }

    if (!formData.cif.trim()) {
      setError('El CIF / NIF es obligatorio.');
      return;
    }

    if (!companyService.validateCIF(formData.cif)) {
      setError('El formato del CIF/NIF/NIE no es válido (ej: B12345678 o 12345678Z).');
      return;
    }

    if (formData.nima && !companyService.validateNIMA(formData.nima)) {
      setError('El formato del NIMA debe tener entre 10 y 12 caracteres alfanuméricos.');
      return;
    }

    if (!formData.roles || formData.roles.length === 0) {
      setError('Debes seleccionar al menos un rol para la empresa.');
      return;
    }

    try {
      setSaving(true);
      if (company) {
        await companyService.update(company.id, formData);
      } else {
        await companyService.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la empresa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl p-6 sm:p-8"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {company ? 'Editar Empresa / Contacto' : 'Nueva Empresa / Contacto'}
          </h3>
          <p className="text-sm text-muted mt-1">
            Una sola ficha fiscal por CIF con asignación de múltiples roles operativos.
          </p>
        </div>

        {error && (
          <Alert variant="error" title="Atención" message={error} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Roles Múltiples */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Roles y Capacidades de la Empresa *
            </label>
            <p className="text-xs text-muted mb-2">
              Selecciona todos los roles que desempeña esta empresa colaboradora:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_ROLES.map((r) => {
                const active = isRoleActive(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRole(r.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      active
                        ? 'border-brand-500 bg-brand-50/70 text-brand-900 font-medium dark:bg-brand-900/30 dark:border-brand-400 dark:text-brand-200 ring-2 ring-brand-500/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-base">{r.icon}</span>
                    <span className="text-xs sm:text-sm">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Datos Identificativos */}
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Identidad Fiscal
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Razón Social *</label>
                <Input
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  placeholder="Ej: Reciclajes del Sur S.L."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre Comercial</label>
                <Input
                  value={formData.nombre_comercial || ''}
                  onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                  placeholder="Ej: ReciSur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CIF / NIF *</label>
                <Input
                  value={formData.cif}
                  onChange={(e) => setFormData({ ...formData, cif: e.target.value.toUpperCase() })}
                  placeholder="B12345678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">NIMA</label>
                <Input
                  value={formData.nima || ''}
                  onChange={(e) => setFormData({ ...formData, nima: e.target.value })}
                  placeholder="Número de Identificación Medioambiental"
                />
              </div>
            </div>
          </div>

          {/* Campos Operativos Específicos según Roles */}
          {(isRoleActive('gestor') || isRoleActive('transportista') || isRoleActive('negociante')) && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Autorizaciones y Operativa
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(isRoleActive('gestor') || isRoleActive('negociante') || isRoleActive('agente')) && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Nº Autorización Ambiental</label>
                    <Input
                      value={formData.numero_autorizacion || ''}
                      onChange={(e) => setFormData({ ...formData, numero_autorizacion: e.target.value })}
                      placeholder="Ej: G-12345/CM"
                    />
                  </div>
                )}

                {isRoleActive('transportista') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Matrícula Habitual / Cabeza Tractora</label>
                    <Input
                      value={formData.matricula || ''}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                      placeholder="Ej: 1234-XYZ"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Domicilio */}
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Domicilio Social / Sede
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <Input
                  value={formData.domicilio_social || ''}
                  onChange={(e) => setFormData({ ...formData, domicilio_social: e.target.value })}
                  placeholder="Calle, número, polígono..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Código Postal</label>
                <Input
                  value={formData.codigo_postal_social || ''}
                  onChange={(e) => setFormData({ ...formData, codigo_postal_social: e.target.value })}
                  placeholder="28001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Municipio</label>
                <Input
                  value={formData.municipio_social || ''}
                  onChange={(e) => setFormData({ ...formData, municipio_social: e.target.value })}
                  placeholder="Madrid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Provincia</label>
                <Input
                  value={formData.provincia_social || ''}
                  onChange={(e) => setFormData({ ...formData, provincia_social: e.target.value })}
                  placeholder="Madrid"
                />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Datos de Contacto
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Persona de Contacto</label>
                <Input
                  value={formData.persona_contacto || ''}
                  onChange={(e) => setFormData({ ...formData, persona_contacto: e.target.value })}
                  placeholder="Nombre y apellidos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <Input
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notas Internas</label>
              <TextArea
                value={formData.notas || ''}
                onChange={(value) => setFormData({ ...formData, notas: value })}
                rows={2}
                placeholder="Observaciones operativas, horarios de báscula, etc."
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : (company ? 'Actualizar Empresa' : 'Crear Empresa')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
