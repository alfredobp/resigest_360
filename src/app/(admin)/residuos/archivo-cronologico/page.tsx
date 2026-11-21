'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getChronologicalEntries,
  getChronologicalStats,
  createChronologicalEntry,
  deleteChronologicalEntry,
  syncAllClosedDIs,
  exportChronologicalToCSV,
  exportChronologicalToExcelXML,
  getPendingDispatches,
  type PendingDispatch,
  type ChronologicalFilter
} from '@/services/chronologicalRegistryService';
import productionCenterService from '@/services/productionCenterService';
import companyService from '@/services/companyService';
import {
  type ChronologicalEntry,
  type ChronologicalStats,
  type ChronologicalEntryFormData,
  type TipoOperacionCronologica,
  type ProductionCenter
} from '@/types/wasteManagement';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { toast } from '@/context/ToastContext';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';
import { Modal, ConfirmModal } from '@/components/ui/modal';
import { DataTable, type ColumnDef } from '@/components/ui/table';
import LerSelector from '@/components/residuos/LerSelector';
import { useTenant } from '@/context/TenantContext';

const CURRENT_YEAR = new Date().getFullYear();

const TIPO_OP_LABELS: Record<TipoOperacionCronologica, { label: string; color: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'light' }> = {
  produccion_interna: { label: 'Producción Interna', color: 'info' },
  salida_traslado: { label: 'Salida Traslado', color: 'primary' },
  entrada_recepcion: { label: 'Entrada Recepción', color: 'success' },
  tratamiento_interno: { label: 'Tratamiento R/D', color: 'warning' },
  merma_ajuste: { label: 'Ajuste / Merma', color: 'light' },
};

function formatDateTime(fechaStr?: string | null, createdAtStr?: string | null): string {
  if (!fechaStr && !createdAtStr) return '-';

  let datePart = '';
  if (fechaStr && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr.trim())) {
    const [y, m, d] = fechaStr.trim().split('-').map(Number);
    datePart = new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } else if (fechaStr) {
    const d = new Date(fechaStr);
    datePart = isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
  }

  let timePart = '';
  const sourceForTime = fechaStr && fechaStr.includes('T') ? fechaStr : createdAtStr;
  if (sourceForTime) {
    const d = new Date(sourceForTime);
    if (!isNaN(d.getTime())) {
      timePart = d.toLocaleTimeString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  if (datePart && timePart) {
    return `${datePart}, ${timePart}`;
  }
  return datePart || timePart || '-';
}

export default function ArchivoCronologicoPage() {
  const { perfilOperativo } = useTenant();
  const [activeTab, setActiveTab] = useState<'consolidado' | 'pendientes'>('consolidado');
  const [entries, setEntries] = useState<ChronologicalEntry[]>([]);
  const [pendingDispatches, setPendingDispatches] = useState<PendingDispatch[]>([]);
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

  // Modal Nuevo Asiento
  const [modalOpen, setModalOpen] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [myCompany, setMyCompany] = useState<{ id: number; razon_social?: string; nombre_comercial?: string; cif?: string; tipo_empresa?: string } | null>(null);
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
    origen_tipo: 'propio',
    origen_razon_social: '',
    destino_tipo: 'tercero_gestor',
    destino_razon_social: '',
    operacion_rd: '',
    numero_documento_referencia: '',
    observaciones: ''
  });

  const openNewEntryModal = () => {
    const isGestorOrChat =
      perfilOperativo === 'chatarreria' ||
      perfilOperativo === 'gestor_rp' ||
      myCompany?.tipo_empresa === 'gestor';
    const initialTipo: TipoOperacionCronologica = isGestorOrChat ? 'entrada_recepcion' : 'produccion_interna';
    const ownName = myCompany?.razon_social || myCompany?.nombre_comercial || '';
    const ownCif = myCompany?.cif || '';

    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      tipo_operacion: initialTipo,
      codigo_ler: '',
      descripcion_residuo: '',
      peligrosidad: 'no-peligroso',
      cantidad_kg: 0,
      estado_fisico: 'solido',
      envase_tipo: 'GRG / Contenedor',
      envase_unidades: 1,
      origen_tipo: initialTipo === 'entrada_recepcion' ? 'tercero_productor' : 'propio',
      origen_razon_social: initialTipo === 'entrada_recepcion' ? '' : ownName,
      origen_nif: initialTipo === 'entrada_recepcion' ? '' : ownCif,
      destino_tipo: initialTipo === 'entrada_recepcion' ? 'propio' : 'tercero_gestor',
      destino_razon_social: initialTipo === 'entrada_recepcion' ? ownName : '',
      destino_nif: initialTipo === 'entrada_recepcion' ? ownCif : '',
      operacion_rd: initialTipo === 'entrada_recepcion' ? 'R13' : '',
      numero_documento_referencia: '',
      observaciones: ''
    });
    setModalOpen(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar centros de producción del usuario
      const userCompany = await companyService.getUserCompany();
      if (userCompany) {
        setMyCompany(userCompany);
        const centersData = await productionCenterService.getByCompanyId(userCompany.id);
        setCenters(centersData);
        if (!formData.origen_razon_social && formData.tipo_operacion !== 'entrada_recepcion') {
          setFormData(prev => ({
            ...prev,
            company_id: userCompany.id,
            origen_tipo: 'propio',
            origen_razon_social: userCompany.razon_social || userCompany.nombre_comercial || '',
            origen_nif: userCompany.cif || ''
          }));
        }
      }

      const filters: ChronologicalFilter = {
        año: selectedYear,
        production_center_id: selectedCenter !== 'todos' ? Number(selectedCenter) : 'todos',
        tipo_operacion: selectedTipo !== 'todas' ? (selectedTipo as TipoOperacionCronologica) : 'todas',
        peligrosidad: selectedPeligrosidad !== 'todas' ? (selectedPeligrosidad as any) : 'todas'
      };

      const [entriesData, statsData, pendingData] = await Promise.all([
        getChronologicalEntries(filters),
        getChronologicalStats(selectedYear, selectedCenter !== 'todos' ? Number(selectedCenter) : 'todos'),
        getPendingDispatches({
          año: selectedYear,
          production_center_id: selectedCenter !== 'todos' ? Number(selectedCenter) : 'todos'
        }).catch(() => [])
      ]);

      setEntries(entriesData);
      setStats(statsData);
      setPendingDispatches(pendingData);
    } catch (err: any) {
      console.error('Error al cargar datos del Archivo Cronológico:', err);
      if (err?.code === 'PGRST205' || err?.message?.includes('chronological_registry') || err?.message?.includes('schema cache')) {
        setError('La tabla "chronological_registry" no ha sido creada en la base de datos de Supabase. Por favor, ejecuta la migración SQL disponible en "src/SQL/migration-chronological-register.sql" en el SQL Editor de tu panel de Supabase.');
      } else {
        setError(err?.message || 'Error al cargar los asientos del Archivo Cronológico.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedCenter, selectedTipo, selectedPeligrosidad]);

  // Sincronizar con DIs
  const handleSyncDIs = async () => {
    try {
      setSyncing(true);
      setError(null);
      const res = await syncAllClosedDIs();
      const msg = `Sincronización finalizada con éxito. Se actualizaron ${res.totalSincronizados} asientos.`;
      setSuccess(msg);
      toast.success(msg);
      await loadData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      const msg = 'Error al sincronizar con los Documentos de Identificación.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  // Guardar nuevo asiento manual
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo_ler || !formData.descripcion_residuo || formData.cantidad_kg <= 0) {
      const msg = 'Por favor complete los campos obligatorios: Código LER, Descripción y Cantidad (kg).';
      setError(msg);
      toast.warning(msg);
      return;
    }

    try {
      setSavingEntry(true);
      await createChronologicalEntry(formData);
      const msg = 'Asiento cronológico registrado satisfactoriamente.';
      setSuccess(msg);
      toast.success(msg);
      setModalOpen(false);
      // Reset form sin retener proveedor previo (UX-18)
      setFormData(prev => ({
        ...prev,
        codigo_ler: '',
        descripcion_residuo: '',
        cantidad_kg: 0,
        numero_documento_referencia: '',
        observaciones: '',
        origen_razon_social: prev.tipo_operacion === 'entrada_recepcion' ? '' : prev.origen_razon_social,
        origen_nif: prev.tipo_operacion === 'entrada_recepcion' ? '' : prev.origen_nif,
        destino_razon_social: prev.tipo_operacion !== 'entrada_recepcion' ? '' : prev.destino_razon_social,
        destino_nif: prev.tipo_operacion !== 'entrada_recepcion' ? '' : prev.destino_nif,
      }));
      await loadData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      const msg = 'Error al guardar el asiento cronológico.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSavingEntry(false);
    }
  };

  // Eliminar asiento
  const handleDeleteEntry = (id: number) => {
    setEntryToDelete(id);
  };

  const confirmDeleteEntry = async () => {
    if (entryToDelete === null) return;
    try {
      await deleteChronologicalEntry(entryToDelete);
      const msg = 'Asiento eliminado correctamente.';
      setSuccess(msg);
      toast.success(msg);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Error al eliminar el asiento.';
      setError(msg);
      toast.error(msg);
    }
  };

  // Auto-ajuste de peligrosidad y descripción al seleccionar código LER
  const handleLerChange = (code: string, wt?: any) => {
    const isPeligroso = code.includes('*') || wt?.peligroso || wt?.categoria === 'peligroso';
    setFormData(prev => ({
      ...prev,
      codigo_ler: code,
      descripcion_residuo: wt?.descripcion || prev.descripcion_residuo,
      peligrosidad: isPeligroso ? 'peligroso' : 'no-peligroso'
    }));
  };

  // Columnas configuradas para DataTable
  const columns: ColumnDef<ChronologicalEntry>[] = React.useMemo(() => [
    {
      id: 'asiento',
      header: 'Asiento / Fecha',
      sortable: true,
      accessorFn: (row) => `${row.fecha || ''} ${row.numero_asiento || ''}`,
      className: 'whitespace-nowrap',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
            {row.numero_asiento}
          </div>
          <div className="text-gray-500 text-[11px] whitespace-nowrap">
            {formatDateTime(row.fecha, row.created_at)}
          </div>
        </div>
      ),
    },
    {
      id: 'operacion',
      header: 'Operación',
      sortable: true,
      accessorKey: 'tipo_operacion',
      cell: ({ row }) => {
        const opConfig = TIPO_OP_LABELS[row.tipo_operacion] || { label: row.tipo_operacion, color: 'light' as const };
        return (
          <Badge variant="light" color={opConfig.color} className="text-[10.5px]">
            {opConfig.label}
          </Badge>
        );
      },
    },
    {
      id: 'residuo',
      header: 'Residuo (LER)',
      sortable: true,
      accessorFn: (row) => `${row.codigo_ler} ${row.descripcion_residuo}`,
      className: 'max-w-[140px]',
      cell: ({ row }) => {
        const isPeligroso = row.peligrosidad === 'peligroso';
        return (
          <div>
            <div className="flex items-center gap-1">
              <span className={`font-mono font-bold ${isPeligroso ? 'text-amber-700 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {row.codigo_ler}
              </span>
              {isPeligroso && (
                <span className="text-[9.5px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-1 rounded font-semibold">
                  HP
                </span>
              )}
            </div>
            <div className="text-gray-500 text-[11px] truncate" title={row.descripcion_residuo}>
              {row.descripcion_residuo}
            </div>
          </div>
        );
      },
    },
    {
      id: 'cantidad',
      header: 'Cantidad',
      sortable: true,
      accessorKey: 'cantidad_kg',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-gray-900 dark:text-gray-100">
            {row.cantidad_kg.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
          </div>
          <div className="text-gray-500 text-[11px]">
            {((row.cantidad_kg || 0) / 1000).toFixed(3)} t
          </div>
        </div>
      ),
    },
    {
      id: 'origen',
      header: 'Origen',
      sortable: true,
      accessorKey: 'origen_razon_social',
      className: 'max-w-[115px]',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-200 truncate" title={row.origen_razon_social || '-'}>
            {row.origen_razon_social || '-'}
          </div>
          <div className="text-gray-400 text-[10px] truncate" title={`NIF: ${row.origen_nif || '-'}${row.origen_nima ? ` | NIMA: ${row.origen_nima}` : ''}`}>
            {row.origen_nif || '-'}
          </div>
        </div>
      ),
    },
    {
      id: 'destino',
      header: 'Destino',
      sortable: true,
      accessorKey: 'destino_razon_social',
      className: 'max-w-[115px]',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-200 truncate" title={row.destino_razon_social || '-'}>
            {row.destino_razon_social || '-'}
          </div>
          <div className="text-gray-400 text-[10px] truncate" title={row.destino_autorizacion ? `Aut: ${row.destino_autorizacion}` : `NIF: ${row.destino_nif || '-'}`}>
            {row.destino_autorizacion ? `Aut: ${row.destino_autorizacion}` : (row.destino_nif || '-')}
          </div>
        </div>
      ),
    },
    {
      id: 'tratamiento',
      header: 'R/D',
      sortable: true,
      accessorKey: 'operacion_rd',
      className: 'whitespace-nowrap',
      cell: ({ row }) => (
        <span className="font-mono font-medium text-primary">
          {row.operacion_rd || '-'}
        </span>
      ),
    },
    {
      id: 'referencia',
      header: 'Ref. Doc.',
      accessorKey: 'numero_documento_referencia',
      className: 'max-w-[110px]',
      cell: ({ row }) => row.identification_document_id ? (
        <Link
          href={`/residuos/documentos-identificacion/${row.identification_document_id}`}
          className="block truncate text-primary hover:underline font-mono text-[11px]"
          title={row.numero_documento_referencia || `DI #${row.identification_document_id}`}
        >
          {row.numero_documento_referencia || `DI #${row.identification_document_id}`} →
        </Link>
      ) : (
        <span className="block truncate text-gray-600 dark:text-gray-400 font-mono text-[11px]" title={row.numero_documento_referencia || 'Asiento Directo'}>
          {row.numero_documento_referencia || 'Asiento Directo'}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      headerClassName: 'text-center',
      className: 'text-center whitespace-nowrap',
      cell: ({ row }) => !row.identification_document_id ? (
        <button
          onClick={() => handleDeleteEntry(row.id)}
          title="Eliminar asiento manual"
          className="text-xs text-red-600 hover:underline font-medium"
        >
          Eliminar
        </button>
      ) : (
        <span className="text-[10px] text-gray-400" title="Asiento protegido vinculado a DI oficial">
          Sincronizado
        </span>
      ),
    },
  ], []);

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
            className="text-gray-700 hover:text-gray-900 font-medium"
          >
            {syncing ? 'Sincronizando DIs...' : 'Sincronizar DIs'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportChronologicalToExcelXML(entries)}
            disabled={entries.length === 0}
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 font-medium"
          >
            Excel (.xls)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportChronologicalToCSV(entries)}
            disabled={entries.length === 0}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 font-medium"
          >
            CSV Art. 64
          </Button>

          <Button
            size="sm"
            onClick={openNewEntryModal}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-sm transition-colors"
          >
            Nuevo Asiento Manual
          </Button>
        </div>
      </div>

      {/* Banner normativo para Negociante / Agente (UXDEV-06 / UX-24) */}
      {perfilOperativo === 'negociante' && (
        <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200">
          <strong>Registro Cronológico de Negociante / Agente (Art. 64 Ley 7/2022):</strong>{' '}
          Recoge únicamente la trazabilidad documental de residuos gestionados por su organización. Las operaciones de intermediación sin posesión física no generan stock propio de planta.
        </div>
      )}

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
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Asientos Registrados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_asientos}</p>
              <p className="text-xs text-gray-500 mt-1">
                Total computado: <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.total_t.toFixed(3)} t</span>
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Residuos Peligrosos">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Residuos Peligrosos</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {(stats.kg_peligrosos / 1000).toFixed(3)} <span className="text-sm font-normal text-gray-500">t</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.kg_peligrosos.toLocaleString('es-ES')} kg
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Residuos No Peligrosos">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">No Peligrosos</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {(stats.kg_no_peligrosos / 1000).toFixed(3)} <span className="text-sm font-normal text-gray-500">t</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.kg_no_peligrosos.toLocaleString('es-ES')} kg
              </p>
            </div>
          </ComponentCard>

          <ComponentCard title="Flujos de Movimiento">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Flujos Registrados</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="text-brand-600 dark:text-brand-400 font-semibold">
                  Salidas: {stats.por_operacion.salida_traslado.count}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Entradas: {stats.por_operacion.entrada_recepcion.count}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Producción interna: {stats.por_operacion.produccion_interna.count}
              </p>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* Barra de Filtros Principales */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Año */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ejercicio</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-2 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Centro de Producción</label>
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-2 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            >
              <option value="todos">Todos los centros</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Operación */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tipo Operación</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-2 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Peligrosidad</label>
            <select
              value={selectedPeligrosidad}
              onChange={(e) => setSelectedPeligrosidad(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-2 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            >
              <option value="todas">Todos</option>
              <option value="peligroso">Peligrosos (*)</option>
              <option value="no-peligroso">No Peligrosos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pestañas de Vista: Libro Oficial vs Traslados en Tránsito (UXDEV-06 / UX-09) */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 mb-2">
        <button
          type="button"
          onClick={() => setActiveTab('consolidado')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'consolidado'
              ? 'border-primary text-primary dark:text-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <span>Libro Cronológico Consolidado (Art. 64)</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">
            {entries.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'pendientes'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <span>Traslados en Curso / Pendientes de Justificante</span>
          {pendingDispatches.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
              {pendingDispatches.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'pendientes' ? (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3">
            <span className="text-amber-600 dark:text-amber-400 font-bold text-lg mt-0.5">ℹ</span>
            <div className="text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <p className="font-semibold text-sm">
                Explicación de inclusión / exclusión de traslados en curso (RD 553/2020)
              </p>
              <p>
                Los traslados aquí listados corresponden a residuos que ya han salido físicamente de su centro de producción pero cuyo gestor destinatario todavía no ha registrado la recepción formal ni la pesada en báscula.
              </p>
              <p className="font-medium">
                • <strong>Criterio de Memoria Anual:</strong> Estos residuos quedan provisionalmente excluidos del cómputo consolidado y de la Memoria Anual hasta que conste la confirmación y el justificante de destino (Art. 65 Ley 7/2022).
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 overflow-x-auto">
            {pendingDispatches.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No hay traslados en curso pendientes de justificante para los filtros seleccionados.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Fecha Salida</th>
                    <th className="px-4 py-3">Nº Documento (DI)</th>
                    <th className="px-4 py-3">Residuo (LER)</th>
                    <th className="px-4 py-3">Cantidad Estimada</th>
                    <th className="px-4 py-3">Gestor Destino</th>
                    <th className="px-4 py-3">Transportista</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pendingDispatches.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {d.fecha_inicio_traslado || d.fecha_documento}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-brand-600 dark:text-brand-400">
                        {d.numero_documento}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mr-1.5">{d.codigo_ler}</span>
                        <span className="text-gray-500 truncate block max-w-xs">{d.descripcion_residuo}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-gray-900 dark:text-white">{d.cantidad_kg.toLocaleString('es-ES')} kg</span>
                        <span className="text-[11px] text-gray-400 ml-1">({(d.cantidad_kg / 1000).toFixed(3)} t)</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{d.gestor_razon_social}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{d.gestor_cif}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {d.transportista_razon_social || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.estado_traslado === 'recepcionado'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                            {d.estado_traslado === 'recepcionado' ? 'RECEPCIONADO' : 'EN TRÁNSITO'}
                          </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/residuos/documentos-identificacion/${d.id}`}
                          className="inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Aportar Justificante →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Tabla de Registros con DataTable y Paginación */
        loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm text-gray-500">Cargando libro cronológico oficial...</p>
          </div>
        ) : (
          <DataTable
            data={entries}
            columns={columns}
            searchPlaceholder="Buscar por asiento, LER, empresa, documento..."
            defaultPageSize={25}
            pageSizeOptions={[10, 25, 50, 100]}
            initialSortBy="asiento"
            initialSortOrder="desc"
            emptyState={
              <div className="p-8 text-center space-y-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  No hay asientos cronológicos para los filtros seleccionados
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Puede sincronizar automáticamente las operaciones desde sus Documentos de Identificación cerrados o registrar un asiento manual.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={handleSyncDIs}>
                    Sincronizar DIs
                  </Button>
                  <Button size="sm" onClick={openNewEntryModal}>
                    Nuevo Asiento
                  </Button>
                </div>
              </div>
            }
          />
        )
      )}

      {/* Modal para Nuevo Asiento Manual */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        className="max-w-2xl p-6 sm:p-7 max-h-[88vh] overflow-y-auto"
        showCloseButton
      >
        <div className="space-y-5">
          {/* Header del Modal */}
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 pr-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Registrar Asiento Manual en Archivo Cronológico
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Conforme a los requisitos legales del Artículo 64 de la Ley 7/2022
            </p>
          </div>

          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fecha */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Fecha del Movimiento *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              {/* Tipo de Operación */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tipo de Operación *
                </label>
                <select
                  value={formData.tipo_operacion}
                  onChange={(e) => {
                    const nextTipo = e.target.value as TipoOperacionCronologica;
                    const ownName = myCompany?.razon_social || myCompany?.nombre_comercial || '';
                    const ownCif = myCompany?.cif || '';
                    setFormData(prev => {
                      if (nextTipo === 'entrada_recepcion') {
                        return {
                          ...prev,
                          tipo_operacion: nextTipo,
                          origen_tipo: 'tercero_productor',
                          origen_razon_social: prev.origen_razon_social === ownName ? (prev.destino_razon_social || '') : prev.origen_razon_social,
                          origen_nif: prev.origen_nif === ownCif ? (prev.destino_nif || '') : prev.origen_nif,
                          destino_tipo: 'propio',
                          destino_razon_social: ownName,
                          destino_nif: ownCif,
                        };
                      }
                      return {
                        ...prev,
                        tipo_operacion: nextTipo,
                        origen_tipo: 'propio',
                        origen_razon_social: ownName,
                        origen_nif: ownCif,
                        destino_tipo: 'tercero_gestor',
                        destino_razon_social: prev.destino_razon_social === ownName ? (prev.origen_razon_social || '') : prev.destino_razon_social,
                        destino_nif: prev.destino_nif === ownCif ? (prev.origen_nif || '') : prev.destino_nif,
                      };
                    });
                  }}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Instalación / Centro de Producción
              </label>
              <select
                value={formData.production_center_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, production_center_id: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Código LER *
                </label>
                <LerSelector
                  value={formData.codigo_ler}
                  onChange={(code, wt) => handleLerChange(code, wt)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Descripción del Residuo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Denominación técnica del residuo"
                  value={formData.descripcion_residuo}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion_residuo: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Cantidad y Peligrosidad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Cantidad (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={formData.cantidad_kg || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad_kg: Number(e.target.value) }))}
                  className="w-full text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Peligrosidad
                </label>
                <select
                  disabled={formData.codigo_ler.includes('*')}
                  value={formData.peligrosidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, peligrosidad: e.target.value as any }))}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-60"
                >
                  <option value="no-peligroso">No Peligroso</option>
                  <option value="peligroso">Peligroso</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Operación R/D
                </label>
                <input
                  type="text"
                  placeholder="Ej. R13, D15"
                  value={formData.operacion_rd || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, operacion_rd: e.target.value.toUpperCase() }))}
                  className="w-full text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Referencia y Gestor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Referencia / Albarán / Documento
                </label>
                <input
                  type="text"
                  placeholder="Nº DI, albarán o ticket interno"
                  value={formData.numero_documento_referencia || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_documento_referencia: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {formData.tipo_operacion === 'entrada_recepcion'
                    ? 'Productor / Origen Externo *'
                    : 'Gestor Destinatario (Tercero)'}
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.tipo_operacion === 'entrada_recepcion'
                      ? 'Razón Social del productor remitente'
                      : 'Razón Social del gestor destinatario'
                  }
                  value={
                    formData.tipo_operacion === 'entrada_recepcion'
                      ? (formData.origen_razon_social || '')
                      : (formData.destino_razon_social || '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const ownName = myCompany?.razon_social || myCompany?.nombre_comercial || '';
                    const ownCif = myCompany?.cif || '';
                    setFormData(prev =>
                      prev.tipo_operacion === 'entrada_recepcion'
                        ? {
                          ...prev,
                          origen_tipo: 'tercero_productor',
                          origen_razon_social: val,
                          destino_tipo: 'propio',
                          destino_razon_social: prev.destino_razon_social || ownName,
                          destino_nif: prev.destino_nif || ownCif,
                        }
                        : {
                          ...prev,
                          origen_tipo: 'propio',
                          origen_razon_social: prev.origen_razon_social || ownName,
                          origen_nif: prev.origen_nif || ownCif,
                          destino_tipo: 'tercero_gestor',
                          destino_razon_social: val,
                        }
                    );
                  }}
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Observaciones Técnicas
              </label>
              <textarea
                rows={2}
                placeholder="Detalles sobre el lote, merma, tratamiento o proceso..."
                value={formData.observaciones || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
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
                className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm"
              >
                {savingEntry ? 'Guardando Asiento...' : 'Registrar Asiento Oficial'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={entryToDelete !== null}
        onClose={() => setEntryToDelete(null)}
        onConfirm={confirmDeleteEntry}
        title="Anular o eliminar asiento"
        message="¿Confirma la anulación o eliminación de este asiento cronológico? Esta acción no se puede deshacer."
      />
    </div>
  );
}
