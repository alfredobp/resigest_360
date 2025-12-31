'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllMemorias, 
  deleteMemoria, 
  updateEstado,
  getStats 
} from '@/services/memoriaAnualService';
import { MemoriaAnual, EstadoMemoria, TipoMemoria } from '@/types/wasteManagement';
import ComponentCard from '@/components/common/ComponentCard';
import Alert from '@/components/ui/alert/Alert';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Archive,
  FileCheck,
  BarChart3,
} from 'lucide-react';

export default function MemoriasAnualesPage() {
  const router = useRouter();
  const [memorias, setMemorias] = useState<MemoriaAnual[]>([]);
  const [filteredMemorias, setFilteredMemorias] = useState<MemoriaAnual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');
  const [filtroAño, setFiltroAño] = useState<string>('todos');

  // Estadísticas
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadMemorias();
    loadStats();
  }, []);

  useEffect(() => {
    filterMemorias();
  }, [memorias, filtroEstado, filtroTipo, filtroAño]);

  const loadMemorias = async () => {
    try {
      setLoading(true);
      const data = await getAllMemorias();
      setMemorias(data);
    } catch (err) {
      setError('Error al cargar las memorias anuales');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const filterMemorias = () => {
    let filtered = [...memorias];

    if (filtroEstado !== 'todas') {
      filtered = filtered.filter(m => m.estado === filtroEstado);
    }

    if (filtroTipo !== 'todas') {
      filtered = filtered.filter(m => m.tipo_memoria === filtroTipo);
    }

    if (filtroAño !== 'todos') {
      filtered = filtered.filter(m => m.año === parseInt(filtroAño));
    }

    setFilteredMemorias(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta memoria anual?')) {
      return;
    }

    try {
      await deleteMemoria(id);
      setSuccess('Memoria anual eliminada correctamente');
      loadMemorias();
      loadStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al eliminar la memoria anual');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleChangeEstado = async (id: number, nuevoEstado: EstadoMemoria) => {
    try {
      await updateEstado(id, nuevoEstado);
      setSuccess('Estado actualizado correctamente');
      loadMemorias();
      loadStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al actualizar el estado');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getEstadoBadge = (estado: EstadoMemoria) => {
    const configs: Record<EstadoMemoria, any> = {
      borrador: { color: 'light' as const, icon: Clock, label: 'Borrador' },
      revision: { color: 'warning' as const, icon: AlertCircle, label: 'En Revisión' },
      completada: { color: 'primary' as const, icon: CheckCircle, label: 'Completada' },
      presentada: { color: 'success' as const, icon: FileCheck, label: 'Presentada' },
      archivada: { color: 'dark' as const, icon: Archive, label: 'Archivada' },
    };

    const config = configs[estado];
    const Icon = config.icon;

    return (
      <Badge variant="light" color={config.color}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTipoLabel = (tipo: TipoMemoria): string => {
    const labels: Record<TipoMemoria, string> = {
      productor: 'Productor',
      gestor: 'Gestor',
      gestor_raee: 'Gestor RAEE',
      negociante: 'Negociante',
      transportista: 'Transportista',
      agente: 'Agente',
    };
    return labels[tipo];
  };

  const getAñosUnicos = (): number[] => {
    const años = new Set(memorias.map(m => m.año));
    return Array.from(años).sort((a, b) => b - a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memorias Anuales</h1>
          <p className="text-muted-foreground">
            Gestiona las memorias anuales de residuos generadas desde los documentos de identificación
          </p>
        </div>
        <Button onClick={() => router.push('/residuos/memorias-anuales/nueva')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Memoria
        </Button>
      </div>

      {/* Alertas */}
      {error && (
        <Alert 
          variant="error" 
          title="Error" 
          message={error}
        />
      )}

      {success && (
        <Alert 
          variant="success" 
          title="Éxito" 
          message={success}
        />
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <ComponentCard title='Total Memorias'>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Memorias</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </ComponentCard>

          <ComponentCard title='Completadas'>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">{stats.por_estado?.completada || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </ComponentCard>

          <ComponentCard title='Presentadas'>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Presentadas</p>
                <p className="text-2xl font-bold">{stats.por_estado?.presentada || 0}</p>
              </div>
              <FileCheck className="h-8 w-8 text-blue-500" />
            </div>
          </ComponentCard>

          <ComponentCard title='Total Toneladas'>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Toneladas</p>
                <p className="text-2xl font-bold">{stats.total_toneladas.toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </ComponentCard>
        </div>
      )}

      {/* Filtros */}
      <ComponentCard title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro Estado */}
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todas">Todas</option>
              <option value="borrador">Borrador</option>
              <option value="revision">En Revisión</option>
              <option value="completada">Completada</option>
              <option value="presentada">Presentada</option>
              <option value="archivada">Archivada</option>
            </select>
          </div>

          {/* Filtro Tipo */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Memoria</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todas">Todas</option>
              <option value="productor">Productor</option>
              <option value="gestor">Gestor</option>
              <option value="gestor_raee">Gestor RAEE</option>
              <option value="negociante">Negociante</option>
              <option value="transportista">Transportista</option>
              <option value="agente">Agente</option>
            </select>
          </div>

          {/* Filtro Año */}
          <div>
            <label className="block text-sm font-medium mb-2">Año</label>
            <select
              value={filtroAño}
              onChange={(e) => setFiltroAño(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todos">Todos</option>
              {getAñosUnicos().map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
          </div>
        </div>
      </ComponentCard>

      {/* Lista de Memorias */}
      <ComponentCard title="Listado de Memorias Anuales">
        {filteredMemorias.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No hay memorias anuales</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comienza creando una nueva memoria anual
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/residuos/memorias-anuales/nueva')}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Memoria
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Movimientos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toneladas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMemorias.map((memoria) => (
                  <tr key={memoria.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {memoria.numero_memoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {memoria.año}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTipoLabel(memoria.tipo_memoria)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {memoria.nombre_empresa}
                      </div>
                      <div className="text-sm text-gray-500">{memoria.nif_empresa}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {memoria.total_movimientos}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {memoria.total_toneladas.toFixed(2)} t
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(memoria.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/residuos/memorias-anuales/${memoria.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {memoria.archivo_excel_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(memoria.archivo_excel_url, '_blank')}
                            title="Descargar Excel"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}

                        {memoria.estado === 'borrador' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(memoria.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
