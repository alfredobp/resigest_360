'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import siraService from '@/services/siraService';
import auditService from '@/services/auditService';
import companyService from '@/services/companyService';
import holdedService from '@/services/holdedService';
import {
  SiraSubmission,
  SiraSubmissionStatus,
  AuditLogEntry,
  Company
} from '@/types/wasteManagement';
import {
  Send,
  RefreshCw,
  FileDown,
  Code2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  FileText,
  CreditCard,
  Layers,
  Search,
  ExternalLink,
  Cpu,
  Clock,
  History,
  Check,
  Building2
} from 'lucide-react';

export default function IntegracionesAuditoriaPage() {
  const [activeTab, setActiveTab] = useState<'sira' | 'holded' | 'auditoria'>('sira');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);

  // SIRA Telematics State
  const [submissions, setSubmissions] = useState<SiraSubmission[]>([]);
  const [siraFilterStatus, setSiraFilterStatus] = useState<SiraSubmissionStatus | 'todos'>('todos');
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [selectedXml, setSelectedXml] = useState<string | null>(null);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);

  // Holded State
  const [holdedStatus, setHoldedStatus] = useState<'checking' | 'connected' | 'not_configured' | 'error'>('checking');
  const [holdedContactsCount, setHoldedContactsCount] = useState<number | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilterEntity, setAuditFilterEntity] = useState<string>('todos');
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<AuditLogEntry | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, [siraFilterStatus, auditFilterEntity]);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // 1. Cargar empresa
      const comp = await companyService.getUserCompany();
      setCompany(comp);

      // 2. Cargar envíos SIRA
      const subs = await siraService.getAllSubmissions({
        status: siraFilterStatus !== 'todos' ? siraFilterStatus : undefined,
        limit: 50
      });
      setSubmissions(subs);

      // 3. Probar conexión Holded si hay API Key
      if (comp?.holded_api_key) {
        try {
          const contacts = await holdedService.listContacts(comp.holded_api_key);
          if (Array.isArray(contacts)) {
            setHoldedStatus('connected');
            setHoldedContactsCount(contacts.length);
          } else {
            setHoldedStatus('error');
          }
        } catch {
          setHoldedStatus('error');
        }
      } else {
        setHoldedStatus('not_configured');
      }

      // 4. Cargar logs de auditoría
      const logs = await auditService.getRecentLogs({
        limit: 50,
        entidad: auditFilterEntity !== 'todos' ? (auditFilterEntity as any) : undefined
      });
      setAuditLogs(logs);

    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error al sincronizar datos de integraciones.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySira = async (sub: SiraSubmission) => {
    if (!sub.identification_document_id) return;
    try {
      setRetryingId(sub.id);
      const res = await siraService.sendDI(sub.identification_document_id);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `Documento aceptado por SIRA con código de acuse: ${res.siraId}`
        });
      } else {
        setNotification({ type: 'error', message: res.message || 'SIRA ha devuelto error en el envío.' });
      }
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', message: err.message || 'Fallo en la conexión SOAP con SIRA.' });
    } finally {
      setRetryingId(null);
    }
  };

  // KPIs
  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter(s => s.estado === 'aceptado').length;
  const failedSubmissions = submissions.filter(s => s.estado === 'rechazado' || s.estado === 'error').length;
  const siraRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 100;

  return (
    <>
      <PageBreadCrumb pageTitle="Integraciones y Auditoría Oficial" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner de Notificaciones */}
        {notification && (
          <Alert
            variant={notification.type === 'error' ? 'error' : notification.type === 'success' ? 'success' : 'info'}
            title={notification.type === 'error' ? 'Aviso' : 'Operación Realizada'}
            message={notification.message}
          />
        )}

        {/* TARJETAS KPI DE GOBIERNO E INTEGRACIONES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* KPI 1: SIRA Telematics */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Transmisiones SIRA / e3l</span>
              <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
                {acceptedSubmissions} <span className="text-sm font-normal text-muted">/ {totalSubmissions}</span>
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className={`text-xs font-semibold ${siraRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {siraRate}% efectividad
                </span>
                {failedSubmissions > 0 && (
                  <span className="text-[11px] text-red-500 font-medium">({failedSubmissions} pendientes/error)</span>
                )}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-primary">
              <Cpu className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 2: Holded ERP */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Conector Holded ERP</span>
              <div className="flex items-center gap-2 pt-1">
                {holdedStatus === 'connected' ? (
                  <Badge color="success" size="md">Conectado</Badge>
                ) : holdedStatus === 'not_configured' ? (
                  <Badge color="warning" size="md">Sin Configurar</Badge>
                ) : (
                  <Badge color="error" size="md">Error API</Badge>
                )}
              </div>
              <p className="text-[11px] text-muted pt-1">
                {holdedContactsCount !== null ? `${holdedContactsCount} contactos sincronizados` : 'Sincronización de facturación automática'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 3: Auditoría Legal */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Registro de Auditoría (Art. 64)</span>
              <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
                {auditLogs.length} <span className="text-sm font-normal text-muted">eventos</span>
              </p>
              <p className="text-[11px] text-muted pt-1">Trazabilidad inmutable de traslados y contratos</p>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
          <button
            onClick={() => setActiveTab('sira')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'sira'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Cola Telemática SIRA / e3l</span>
            {failedSubmissions > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold">
                {failedSubmissions}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('holded')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'holded'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Conector ERP Holded</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${
              activeTab === 'auditoria'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Pista de Auditoría Legal</span>
          </button>
        </div>

        {/* TAB 1: COLA SIRA */}
        {activeTab === 'sira' && (
          <ComponentCard title="Cola de Transmisiones SOAP / e3l (Plataforma SIRA - Junta de Andalucía)">
            <div className="space-y-4">
              {/* Filtros y Acciones */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">Filtrar Estado:</span>
                  <div className="flex gap-1.5">
                    {(['todos', 'aceptado', 'rechazado', 'error', 'enviado'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setSiraFilterStatus(st)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                          siraFilterStatus === st
                            ? 'bg-primary text-white font-bold'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {st.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadAllData()}
                  disabled={loading}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar Cola</span>
                </Button>
              </div>

              {/* Mensaje si no hay credenciales */}
              {!company?.sira_usuario && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold">Credenciales de SIRA pendientes de configuración</p>
                    <p className="opacity-90 mt-0.5">
                      Para transmitir directamente los DCS / Documentos de Identificación al servidor de la Junta, complete su usuario y clave en Mi Empresa.
                    </p>
                  </div>
                  <Link href="/residuos/empresas" className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 whitespace-nowrap">
                    Configurar Credenciales
                  </Link>
                </div>
              )}

              {/* Tabla de Envíos */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-muted uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Fecha y Hora</th>
                      <th className="px-4 py-3">DI / Traslado</th>
                      <th className="px-4 py-3">Residuo (LER)</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Acuse / Motivo Rechazo</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-foreground">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted">
                          No hay envíos telemáticos registrados con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-muted">
                            {new Date(sub.created_at).toLocaleString('es-ES', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold">
                            {sub.identification_document?.numero_documento ? (
                              <Link
                                href={`/residuos/documentos-identificacion/${sub.identification_document_id}`}
                                className="text-primary hover:underline font-mono"
                              >
                                {sub.identification_document.numero_documento}
                              </Link>
                            ) : (
                              <span className="font-mono">DI #{sub.identification_document_id}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                              {sub.identification_document?.codigo_ler || '-'}
                            </span>
                            <span className="block text-[11px] text-muted truncate max-w-xs">
                              {sub.identification_document?.descripcion_residuo || ''}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              color={
                                sub.estado === 'aceptado' ? 'success' :
                                sub.estado === 'rechazado' ? 'error' :
                                sub.estado === 'error' ? 'error' : 'info'
                              }
                              size="sm"
                            >
                              {sub.estado.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[11px] max-w-xs font-mono">
                            {sub.codigo_acuse ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                Acuse: {sub.codigo_acuse}
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">
                                {sub.mensaje_error || '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            {sub.xml_enviado && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedXml(sub.xml_enviado || '');
                                  setIsXmlModalOpen(true);
                                }}
                                className="text-primary hover:underline font-medium text-[11px]"
                              >
                                Ver XML
                              </button>
                            )}

                            <Button
                              size="sm"
                              variant={sub.estado === 'aceptado' ? 'outline' : 'primary'}
                              disabled={retryingId === sub.id}
                              onClick={() => handleRetrySira(sub)}
                              className="text-[11px]"
                            >
                              {retryingId === sub.id ? 'Reintentando...' : sub.estado === 'aceptado' ? 'Re-enviar' : 'Reintentar'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ComponentCard>
        )}

        {/* TAB 2: HOLDED ERP */}
        {activeTab === 'holded' && (
          <ComponentCard title="Conector y Sincronización con Holded ERP">
            <div className="space-y-6">
              {/* Estado de conexión */}
              <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">Estado del API Key de Holded:</span>
                    {holdedStatus === 'connected' ? (
                      <Badge color="success">✓ Conexión Activa y Verificada</Badge>
                    ) : holdedStatus === 'not_configured' ? (
                      <Badge color="warning">Sin Configurar</Badge>
                    ) : (
                      <Badge color="error">Error de Conexión</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {company?.holded_api_key
                      ? `API Key registrada: ••••••••••••${company.holded_api_key.slice(-4)}`
                      : 'No se ha configurado ninguna API Key para esta empresa.'}
                  </p>
                </div>

                <Link href="/residuos/empresas">
                  <Button variant="outline" size="sm">
                    Modificar Clave API Holded
                  </Button>
                </Link>
              </div>

              {/* Guía Operativa de Enlace Holded */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CreditCard className="w-4 h-4" />
                    <span>Facturación desde Operaciones Comerciales</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Las operaciones del Bloque 6 (Negociante y Agente) disponen del botón <strong>Emitir Factura Holded</strong>. 
                    Al pulsarlo, RESIGEST crea la factura oficial de venta en Holded, vincula el cliente automáticamente y guarda el número de factura en la ficha de la operación.
                  </p>
                  <div className="pt-2">
                    <Link href="/residuos/operaciones" className="text-emerald-700 dark:text-emerald-400 font-bold text-xs hover:underline inline-flex items-center gap-1">
                      Ir a Operaciones Comerciales <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-sm">
                    <Building2 className="w-4 h-4" />
                    <span>Sincronización de Contactos y Gestores</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Los gestores y transportistas dados de alta en el maestro único pueden sincronizarse con el directorio de contactos de Holded conservando su CIF, dirección fiscal y NIMA.
                  </p>
                  <div className="pt-2">
                    <Link href="/residuos/empresas" className="text-blue-700 dark:text-blue-400 font-bold text-xs hover:underline inline-flex items-center gap-1">
                      Gestionar Directorio de Empresas <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </ComponentCard>
        )}

        {/* TAB 3: PISTA DE AUDITORÍA LEGAL */}
        {activeTab === 'auditoria' && (
          <ComponentCard title="Pista de Auditoría Legal y Trazabilidad (Art. 64 Ley 7/2022)">
            <div className="space-y-4">
              {/* Filtros y Descarga */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">Filtrar por Entidad:</span>
                  <select
                    value={auditFilterEntity}
                    onChange={(e) => setAuditFilterEntity(e.target.value)}
                    className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="todos">Todas las Entidades</option>
                    <option value="di">Documentos de Identificación (DI)</option>
                    <option value="contrato">Contratos de Tratamiento</option>
                    <option value="operacion_comercial">Operaciones Comerciales</option>
                    <option value="integracion_sira">Integración SIRA</option>
                    <option value="empresa">Empresas e Instalaciones</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => auditService.exportLogsToCSV(auditLogs)}
                  disabled={auditLogs.length === 0}
                  className="flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Exportar Auditoría (CSV Oficial)</span>
                </Button>
              </div>

              {/* Tabla de Auditoría */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-muted uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Fecha / Hora</th>
                      <th className="px-4 py-3">Entidad</th>
                      <th className="px-4 py-3">ID Entidad</th>
                      <th className="px-4 py-3">Acción</th>
                      <th className="px-4 py-3">Detalle del Evento</th>
                      <th className="px-4 py-3 text-right">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-foreground">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted">
                          No hay registros de auditoría almacenados para el filtro actual.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-muted">
                            {new Date(log.created_at).toLocaleString('es-ES', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 font-semibold uppercase">
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px]">
                              {log.entidad}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-primary font-bold">
                            {log.entidad_id || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {log.accion}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] truncate max-w-xs text-muted">
                            {JSON.stringify(log.detalles || {})}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedAuditDetail(log)}
                              className="text-primary hover:underline font-medium text-[11px]"
                            >
                              Detalles JSON
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ComponentCard>
        )}
      </div>

      {/* MODAL 1: INSPECTOR XML E3L */}
      <Modal isOpen={isXmlModalOpen} onClose={() => setIsXmlModalOpen(false)} className="max-w-3xl p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Payload SOAP / XML e3l (SIRA)</h3>
            </div>
            {selectedXml && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => siraService.downloadXmlFile(selectedXml, `sira_telematics_${Date.now()}.xml`)}
                className="flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Descargar XML</span>
              </Button>
            )}
          </div>

          <pre className="p-4 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 whitespace-pre border border-gray-800 select-all">
            {selectedXml || 'No hay contenido XML'}
          </pre>

          <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
            <Button variant="outline" onClick={() => setIsXmlModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: DETALLES DE AUDITORÍA */}
      <Modal isOpen={!!selectedAuditDetail} onClose={() => setSelectedAuditDetail(null)} className="max-w-lg p-6">
        {selectedAuditDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-gray-200 dark:border-gray-800">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">
                Evento de Auditoría #{selectedAuditDetail.id}
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Fecha UTC:</span>
                <span className="font-mono">{selectedAuditDetail.created_at}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Entidad:</span>
                <span className="font-bold">{selectedAuditDetail.entidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">ID Entidad:</span>
                <span className="font-mono">{selectedAuditDetail.entidad_id || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Acción:</span>
                <span className="font-bold">{selectedAuditDetail.accion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Usuario ID:</span>
                <span className="font-mono">{selectedAuditDetail.user_id || 'Sistema'}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Payload / Detalles Técnicos:
              </span>
              <pre className="p-3 rounded-lg bg-gray-900 text-gray-200 font-mono text-[11px] overflow-x-auto max-h-48 whitespace-pre">
                {JSON.stringify(selectedAuditDetail.detalles || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" onClick={() => setSelectedAuditDetail(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
