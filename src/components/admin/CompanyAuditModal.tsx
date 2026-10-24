'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import type { CompanyAuditDetail, CompanyRole } from '@/types/wasteManagement';
import adminPlatformService from '@/services/adminPlatformService';

interface CompanyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditDetail: CompanyAuditDetail | null;
  loading: boolean;
}

const ROLE_BADGE_CONFIG: Record<CompanyRole, { label: string; color: 'primary' | 'success' | 'warning' | 'info' | 'light' | 'error' }> = {
  gestor: { label: 'Gestor', color: 'success' },
  transportista: { label: 'Transportista', color: 'info' },
  productor: { label: 'Productor', color: 'warning' },
  negociante: { label: 'Negociante', color: 'primary' },
  agente: { label: 'Agente', color: 'primary' },
  cliente: { label: 'Cliente', color: 'light' },
  proveedor: { label: 'Proveedor', color: 'light' },
};

export default function CompanyAuditModal({
  isOpen,
  onClose,
  auditDetail,
  loading
}: CompanyAuditModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'centros' | 'dis' | 'contratos' | 'auth'>('info');

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    if (auditDetail) {
      adminPlatformService.exportCompanyDataJSON(auditDetail);
    }
  };

  const company = auditDetail?.company;
  const user = auditDetail?.userProfile;
  const roles: CompanyRole[] = Array.isArray(company?.roles) && company?.roles.length 
    ? company.roles 
    : (company?.tipo_empresa ? [company.tipo_empresa as CompanyRole] : ['productor']);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-6 sm:p-8">
      {loading || !auditDetail ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Cargando auditoría y registros de la empresa...
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          {/* Cabecera de Empresa */}
          <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {company?.razon_social}
                  </h2>
                  {company?.is_my_company && (
                    <Badge variant="light" color="primary">
                      Empresa Titular
                    </Badge>
                  )}
                  <Badge variant="light" color={company?.activo !== false ? 'success' : 'error'}>
                    {company?.activo !== false ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                {company?.nombre_comercial && (
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                    {company.nombre_comercial}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {roles.map(r => (
                    <Badge key={r} variant="solid" color={ROLE_BADGE_CONFIG[r]?.color || 'primary'} size="sm">
                      {ROLE_BADGE_CONFIG[r]?.label || r}
                    </Badge>
                  ))}
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                    CIF: <strong>{company?.cif}</strong>
                  </span>
                  {company?.nima && (
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                      NIMA: <strong>{company.nima}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Botón de Descarga de Datos */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadJSON}
                  startIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  }
                >
                  Descargar Datos (JSON)
                </Button>
              </div>
            </div>

            {/* Ficha rápida de la cuenta asociada */}
            <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Cuenta Propietaria:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'No asignado'}
                </span>
                <span className="text-gray-500">({user?.email || 'N/A'})</span>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                {user?.role && (
                  <span>Rol usuario: <strong className="uppercase text-primary">{user.role}</strong></span>
                )}
                {company?.created_at && (
                  <span>Fecha de alta: <strong>{new Date(company.created_at).toLocaleDateString('es-ES')}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Tarjetas de Métricas de la Empresa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Centros de Producción</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {auditDetail.stats.totalCenters}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">DIs Asociados</p>
              <p className="text-xl font-bold text-primary mt-1">
                {auditDetail.stats.totalDIs}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Contratos</p>
              <p className="text-xl font-bold text-success-600 mt-1">
                {auditDetail.stats.totalContracts}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Toneladas Est.</p>
              <p className="text-xl font-bold text-warning-600 mt-1">
                {auditDetail.stats.totalTonsEstimated} t
              </p>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6 text-sm">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'info'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Ficha Fiscal
            </button>
            <button
              onClick={() => setActiveTab('centros')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'centros'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Centros e Instalaciones ({auditDetail.productionCenters.length})
            </button>
            <button
              onClick={() => setActiveTab('dis')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'dis'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              DIs Recientes ({auditDetail.recentDIs.length})
            </button>
            <button
              onClick={() => setActiveTab('contratos')}
              className={`pb-3 font-medium transition-colors relative ${
                activeTab === 'contratos'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Contratos ({auditDetail.contracts.length})
            </button>
          </div>

          {/* Contenido Pestaña 1: Ficha Fiscal */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                  Datos de Contacto y Notificación
                </h4>
                <div>
                  <span className="text-gray-500 block text-xs">Persona de Contacto</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {company?.persona_contacto || 'No especificada'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Teléfono</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {company?.telefono || 'No especificado'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Email</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {company?.email || 'No especificado'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Nº Autorización Ambiental / Transportista</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {company?.numero_autorizacion || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                  Domicilio Social
                </h4>
                <div>
                  <span className="text-gray-500 block text-xs">Dirección</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {company?.domicilio_social || 'No especificada'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 block text-xs">Código Postal</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {company?.codigo_postal_social || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Municipio</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {company?.municipio_social || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Provincia</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {company?.provincia_social || 'N/A'}
                  </span>
                </div>
              </div>

              {company?.notas && (
                <div className="md:col-span-2 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                  <span className="text-gray-500 block text-xs">Notas internas</span>
                  <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">
                    {company.notas}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Contenido Pestaña 2: Centros e Instalaciones */}
          {activeTab === 'centros' && (
            <div className="space-y-3">
              {auditDetail.productionCenters.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Esta empresa no tiene centros de producción registrados.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  {auditDetail.productionCenters.map(center => (
                    <div key={center.id} className="p-4 bg-white dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-gray-900 dark:text-white">
                            {center.nombre}
                          </h5>
                          {center.tipo_instalacion && (
                            <Badge variant="light" color="info" size="sm">
                              {center.tipo_instalacion}
                            </Badge>
                          )}
                          <Badge variant="light" color={center.activo !== false ? 'success' : 'error'} size="sm">
                            {center.activo !== false ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {center.direccion}, {center.codigo_postal} {center.municipio} ({center.provincia})
                        </p>
                      </div>
                      <div className="text-xs font-mono text-gray-600 dark:text-gray-300 sm:text-right shrink-0">
                        NIMA: <strong>{center.nima || 'N/A'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contenido Pestaña 3: DIs Recientes */}
          {activeTab === 'dis' && (
            <div className="space-y-3">
              {auditDetail.recentDIs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No constan Documentos de Identificación registrados para esta empresa.
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Nº Documento</th>
                        <th className="px-4 py-3">Código LER</th>
                        <th className="px-4 py-3">Cantidad Est.</th>
                        <th className="px-4 py-3">Estado Traslado</th>
                        <th className="px-4 py-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {auditDetail.recentDIs.map(di => {
                        const diRecord = di as unknown as Record<string, unknown>;
                        const cantidad = diRecord.cantidad ?? diRecord.cantidad_estimada ?? 0;
                        const unidad = String(diRecord.unidad || diRecord.unidad_medida || 't');
                        const rawFecha = (diRecord.fecha_recogida || diRecord.fecha_traslado || diRecord.fecha_salida || di.created_at) as string | undefined;

                        return (
                          <tr key={di.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">
                              {di.numero_documento}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {di.codigo_ler}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {String(cantidad)} {unidad}
                            </td>
                            <td className="px-4 py-3">
                              <span className="capitalize">{di.estado_traslado || 'pendiente'}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {rawFecha ? new Date(rawFecha).toLocaleDateString('es-ES') : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contenido Pestaña 4: Contratos */}
          {activeTab === 'contratos' && (
            <div className="space-y-3">
              {auditDetail.contracts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No constan contratos de tratamiento registrados para esta empresa.
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Nº Contrato</th>
                        <th className="px-4 py-3">Gestor / Contraparte</th>
                        <th className="px-4 py-3">Fecha Inicio</th>
                        <th className="px-4 py-3">Vigencia</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {auditDetail.contracts.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">
                            {c.numero_contrato || `CTR-${c.id}`}
                          </td>
                          <td className="px-4 py-3">
                            {c.gestor_company?.razon_social || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {c.fecha_contrato ? new Date(c.fecha_contrato).toLocaleDateString('es-ES') : ''}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString('es-ES') : 'Indefinido'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              variant="light" 
                              color={c.estado === 'vigente' ? 'success' : c.estado === 'borrador' ? 'warning' : 'error'} 
                              size="sm"
                            >
                              {c.estado ? c.estado.toUpperCase() : 'N/A'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Pie de modal */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
