'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  getChronologicalEntries,
  getChronologicalStats,
  createChronologicalEntry,
  deleteChronologicalEntry,
  syncAllClosedDIs,
  exportChronologicalToCSV,
  exportChronologicalToExcelXML,
  ChronologicalFilter
} from '@/services/chronologicalRegistryService';
import productionCenterService from '@/services/productionCenterService';
import companyService from '@/services/companyService';
import {
  ChronologicalEntry,
  ChronologicalStats,
  ChronologicalEntryFormData,
  TipoOperacionCronologica,
  ProductionCenter
} from '@/types/wasteManagement';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import InputField from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import {
  BookOpen,
  Calendar,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Building2,
  Trash2,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  X
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const TIPO_OP_LABELS: Record<TipoOperacionCronologica, { label: string; color: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'light' }> = {
  produccion_interna: { label: 'Producción Interna', color: 'info' },
  salida_traslado: { label: 'Salida Traslado', color: 'primary' },
  entrada_recepcion: { label: 'Entrada Recepción', color: 'success' },
  tratamiento_interno: { label: 'Tratamiento R/D', color: 'warning' },
  merma_ajuste: { label: 'Ajuste / Merma', color: 'light' },
};

export default function ArchivoCronologicoPage() {
  const [entries, setEntries] = useState<ChronologicalEntry[]>([]);
  const [stats, setStats] = useState<ChronologicalStats | null>(null);
  const [centers, setCenters] = useState<ProductionCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [selectedYear, setSelectedYear] = useState<number | undefined>(CURRENT_YEAR);
  const [selectedCenter, setSelectedCenter] = useState<string>('todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('todas');
  const [selectedPeligrosidad, setSelectedPeligrosidad] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal Nuevo Asiento
  const [modalOpen, setModalOpen] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [formData, setFormData] = useState<ChronologicalEntryFormData>({
    fecha: new Date().toISOString().split('T')[0],
    tipo_operacion: 'produccion_interna',
    codigo_ler: '',
    descripcion_residuo: '',
    peligrosidad: 'no-peligroso',
    cantidad_kg: 0,
    estado_fisico: 'solido',
    envase_tipo: 'GRG / Contenedor',
    envase_unidades: 1,
    origen_razon_social: '',
    destino_razon_social: '',
    operacion_rd: '',
    numero_documento_referencia: '',
    observaciones: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar centros de producción del usuario
      const userCompany = await companyService.getUserCompany();
      if (userCompany) {
        const centersData = await productionCenterService.getByCompanyId(userCompany.id);
        setCenters(centersData);
        if (!formData.origen_razon_social) {
          setFormData(prev => ({
            ...prev,
            company_id: userCompany.id,
            origen_razon_social: userCompany.razon_social || userCompany.nombre_comercial || '',
            origen_nif: userCompany.cif || ''
          }));
        }
      }

      const filters: ChronologicalFilter = {
        año: selectedYear,
        production_center_id: selectedCenter !== 'todos' ? Number(selectedCenter) : 'todos',
        tipo_operacion: selectedTipo !== 'todas' ? (selectedTipo as TipoOperacionCronologica) : 'todas',
        peligrosidad: selectedPeligrosidad !== 'todas' ? (selectedPeligrosidad as any) : 'todas',
        search: searchTerm
      };

      const [entriesData, statsData] = await Promise.all([
        getChronologicalEntries(filters),
        getChronologicalStats(selectedYear, selectedCenter !== 'todos' ? Number(selectedCenter) : 'todos')
      ]);

      setEntries(entriesData);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar los asientos del Archivo Cronológico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedCenter, selectedTipo, selectedPeligrosidad]);

  // Manejar búsqueda con debounce manual
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Sincronizar con DIs
  const handleSyncDIs = async () => {
    try {
      setSyncing(true);
      setError(null);
      const res = await syncAllClosedDIs();
      setSuccess(`Sincronización finalizada con éxito. Se actualizaron ${res.totalSincronizados} asientos.`);
      await loadData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Error al sincronizar con los Documentos de Identificación.');
    } finally {
      setSyncing(false);
    }
  };

  // Guardar nuevo asiento manual
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo_ler || !formData.descripcion_residuo || formData.cantidad_kg <= 0) {
      setError('Por favor complete los campos obligatorios: Código LER, Descripción y Cantidad (kg).');
      return;
    }

    try {
      setSavingEntry(true);
      await createChronologicalEntry(formData);
      setSuccess('Asiento cronológico registrado satisfactoriamente.');
      setModalOpen(false);
      // Reset form
      setFormData(prev => ({
        ...prev,
        codigo_ler: '',
        descripcion_residuo: '',
        cantidad_kg: 0,
        numero_documento_referencia: '',
        observaciones: ''
      }));
      await loadData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Error al guardar el asiento cronológico.');
    } finally {
      setSavingEntry(false);
    }
  };

  // Eliminar asiento
  const handleDeleteEntry = async (id: number) => {
    if (!confirm('¿Confirma la anulación o eliminación de este asiento cronológico?')) return;
    try {
      await deleteChronologicalEntry(id);
      setSuccess('Asiento eliminado correctamente.');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Error al eliminar el asiento.');
    }
  };

  // Auto-ajuste de peligrosidad en formulario
  const handleLerChange = (code: string) => {
    const isPeligroso = code.includes('*');
    setFormData(prev => ({
      ...prev,
      codigo_ler: code,
      peligrosidad: isPeligroso ? 'peligroso' : prev.peligrosidad
    }));
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Archivo Cronológico de Residuos
            </h1>
            <Badge variant="light" color="success">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Art. 64 Ley 7/2022
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registro cronológico obligatorio de operaciones de producción y gestión de residuos. Custodia legal obligatoria de 5 años.
          </p>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncDIs}
            disabled={syncing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-primary' : ''}`} />
            Sincronizar DIs
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportChronologicalToExcelXML(entries)}
            disabled={entries.length === 0}
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400"
          >
            <Download className="h-4 w-4 mr-1 text-emerald-600" />
            Excel (.xls)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportChronologicalToCSV(entries)}
            disabled={entries.length === 0}
            className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400"
          >
            <Download className="h-4 w-4 mr-1 text-blue-600" />
            CSV Art. 64
          </Button>

          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4" />
            Nuevo Asiento Manual
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="error" title="Atención" message={error} />
      )}
      {success && (
        <Alert variant="success" title="Operación completada" message={success} />
      )}

      {/* Tarjetas de Métricas y KPIs */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComponentCard title="Total Asientos">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Asientos Registrados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_asientos}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total computado: <span className="font-semibold">{stats.total_t.toFixed(3)} t</span>
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Residuos Peligrosos">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Residuos Peligrosos</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {(stats.kg_peligrosos / 1000).toFixed(3)} <span className="text-sm font-normal text-gray-500">t</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {stats.kg_peligrosos.toLocaleString('es-ES')} kg
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Residuos No Peligrosos">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">No Peligrosos</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {(stats.kg_no_peligrosos / 1000).toFixed(3)} <span className="text-sm font-normal text-gray-500">t</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {stats.kg_no_peligrosos.toLocaleString('es-ES')} kg
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                <Scale className="h-6 w-6" />
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Flujos de Movimiento">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Flujos Registrados</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="flex items-center text-blue-600 font-medium">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                    Salidas: {stats.por_operacion.salida_traslado.count}
                  </span>
                  <span className="flex items-center text-emerald-600 font-medium">
                    <ArrowDownLeft className="h-3.5 w-3.5 mr-0.5" />
                    Entradas: {stats.por_operacion.entrada_recepcion.count}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Producción interna: {stats.por_operacion.produccion_interna.count}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                <Layers className="h-6 w-6" />
              </div>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Año */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ejercicio</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos los años</option>
              <option value={CURRENT_YEAR}>{CURRENT_YEAR}</option>
              <option value={CURRENT_YEAR - 1}>{CURRENT_YEAR - 1}</option>
              <option value={CURRENT_YEAR - 2}>{CURRENT_YEAR - 2}</option>
              <option value={CURRENT_YEAR - 3}>{CURRENT_YEAR - 3}</option>
              <option value={CURRENT_YEAR - 4}>{CURRENT_YEAR - 4}</option>
            </select>
          </div>

          {/* Centro de Producción */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Centro de Producción</label>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos los centros</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Operación */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Operación</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 focus:ring-1 focus:ring-primary"
            >
              <option value="todas">Todas las operaciones</option>
              <option value="salida_traslado">Salida Traslado (DI)</option>
              <option value="produccion_interna">Producción Interna</option>
              <option value="entrada_recepcion">Entrada Recepción</option>
              <option value="tratamiento_interno">Tratamiento Interno R/D</option>
              <option value="merma_ajuste">Merma o Ajuste</option>
            </select>
          </div>

          {/* Peligrosidad */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Peligrosidad</label>
            <select
              value={selectedPeligrosidad}
              onChange={(e) => setSelectedPeligrosidad(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 focus:ring-1 focus:ring-primary"
            >
              <option value="todas">Todos</option>
              <option value="peligroso">Peligrosos (*)</option>
              <option value="no-peligroso">No Peligrosos</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Búsqueda rápida</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nº Asiento, LER, DI, Razón Social..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-8 pr-2.5 py-1.5 focus:ring-1 focus:ring-primary"
              />
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-gray-400" />
            </div>
          </div>
        </form>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Cargando libro cronológico oficial...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              No hay asientos cronológicos para los filtros seleccionados
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Puede sincronizar automáticamente las operaciones desde sus Documentos de Identificación cerrados o registrar un asiento manual.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={handleSyncDIs}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Sincronizar DIs
              </Button>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nuevo Asiento
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                  <th className="py-3 px-3">Asiento / Fecha</th>
                  <th className="py-3 px-3">Operación</th>
                  <th className="py-3 px-3">Residuo (LER)</th>
                  <th className="py-3 px-3 text-right">Cantidad</th>
                  <th className="py-3 px-3">Origen / Productor</th>
                  <th className="py-3 px-3">Destino / Gestor</th>
                  <th className="py-3 px-3">Trat. (R/D)</th>
                  <th className="py-3 px-3">Ref. Documental</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {entries.map((entry) => {
                  const opConfig = TIPO_OP_LABELS[entry.tipo_operacion] || { label: entry.tipo_operacion, color: 'light' };
                  const isPeligroso = entry.peligrosidad === 'peligroso';

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/75 dark:hover:bg-gray-700/30 transition-colors">
                      {/* Asiento y Fecha */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                          {entry.numero_asiento}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {new Date(entry.fecha).toLocaleDateString('es-ES')}
                        </div>
                      </td>

                      {/* Tipo de Operación */}
                      <td className="py-2.5 px-3">
                        <Badge variant="light" color={opConfig.color} className="text-[10.5px]">
                          {opConfig.label}
                        </Badge>
                      </td>

                      {/* Residuo y LER */}
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold ${isPeligroso ? 'text-amber-700 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {entry.codigo_ler}
                          </span>
                          {isPeligroso && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-1 rounded font-semibold">
                              HP
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-[11px] truncate" title={entry.descripcion_residuo}>
                          {entry.descripcion_residuo}
                        </div>
                      </td>

                      {/* Cantidad */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                          {entry.cantidad_kg.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {((entry.cantidad_kg || 0) / 1000).toFixed(3)} t
                        </div>
                      </td>

                      {/* Origen */}
                      <td className="py-2.5 px-3 max-w-[160px]">
                        <div className="font-medium text-gray-800 dark:text-gray-200 truncate" title={entry.origen_razon_social || '-'}>
                          {entry.origen_razon_social || '-'}
                        </div>
                        <div className="text-gray-400 text-[10.5px] truncate">
                          NIF: {entry.origen_nif || '-'} {entry.origen_nima ? `| NIMA: ${entry.origen_nima}` : ''}
                        </div>
                      </td>

                      {/* Destino */}
                      <td className="py-2.5 px-3 max-w-[160px]">
                        <div className="font-medium text-gray-800 dark:text-gray-200 truncate" title={entry.destino_razon_social || '-'}>
                          {entry.destino_razon_social || '-'}
                        </div>
                        <div className="text-gray-400 text-[10.5px] truncate">
                          {entry.destino_autorizacion ? `Aut: ${entry.destino_autorizacion}` : `NIF: ${entry.destino_nif || '-'}`}
                        </div>
                      </td>

                      {/* Operación R/D */}
                      <td className="py-2.5 px-3 font-mono font-medium text-primary">
                        {entry.operacion_rd || '-'}
                      </td>

                      {/* Referencia Documental */}
                      <td className="py-2.5 px-3">
                        {entry.identification_document_id ? (
                          <Link
                            href={`/residuos/documentos-identificacion/${entry.identification_document_id}`}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                          >
                            {entry.numero_documento_referencia || `DI #${entry.identification_document_id}`}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400 font-mono text-[11px]">
                            {entry.numero_documento_referencia || 'Asiento Directo'}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-3 text-center">
                        {!entry.identification_document_id ? (
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            title="Eliminar asiento manual"
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400" title="Asiento protegido vinculado a DI oficial">
                            Sincronizado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Nuevo Asiento Manual */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Registrar Asiento Manual en Archivo Cronológico
                </h3>
                <p className="text-xs text-gray-500">
                  Conforme a los requisitos del Artículo 64 de la Ley 7/2022
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Fecha del Movimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>

                {/* Tipo de Operación */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Operación *
                  </label>
                  <select
                    value={formData.tipo_operacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo_operacion: e.target.value as any }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  >
                    <option value="produccion_interna">Producción Interna (Generación en Planta)</option>
                    <option value="salida_traslado">Salida a Traslado (Hacia Gestor)</option>
                    <option value="entrada_recepcion">Entrada por Recepción (Desde Productor)</option>
                    <option value="tratamiento_interno">Tratamiento Interno R/D</option>
                    <option value="merma_ajuste">Merma o Regularización de Stock</option>
                  </select>
                </div>
              </div>

              {/* Centro de Producción */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Instalación / Centro de Producción
                </label>
                <select
                  value={formData.production_center_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, production_center_id: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                >
                  <option value="">Centro Principal / Sede</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.nima ? `(NIMA: ${c.nima})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* LER y Descripción */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Código LER *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 17 02 04*"
                    value={formData.codigo_ler}
                    onChange={(e) => handleLerChange(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-mono bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Descripción del Residuo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Denominación técnica del residuo"
                    value={formData.descripcion_residuo}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion_residuo: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Cantidad y Peligrosidad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.cantidad_kg || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cantidad_kg: Number(e.target.value) }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-bold bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Peligrosidad
                  </label>
                  <select
                    disabled={formData.codigo_ler.includes('*')}
                    value={formData.peligrosidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, peligrosidad: e.target.value as any }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 disabled:opacity-60"
                  >
                    <option value="no-peligroso">No Peligroso</option>
                    <option value="peligroso">Peligroso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Operación R/D
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. R13, D15"
                    value={formData.operacion_rd || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, operacion_rd: e.target.value.toUpperCase() }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 font-mono bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Referencia y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Referencia / Albarán / Parte
                  </label>
                  <input
                    type="text"
                    placeholder="Nº DI, albarán o ticket interno"
                    value={formData.numero_documento_referencia || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_documento_referencia: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Gestor Destinatario / Origen
                  </label>
                  <input
                    type="text"
                    placeholder="Razón Social del tercero"
                    value={formData.destino_razon_social || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, destino_razon_social: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Observaciones Técnicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el lote, merma, tratamiento o proceso..."
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={savingEntry}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={savingEntry}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {savingEntry ? 'Guardando Asiento...' : 'Registrar Asiento Oficial'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
