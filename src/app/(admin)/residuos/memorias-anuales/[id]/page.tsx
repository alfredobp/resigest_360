'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  getMemoriaById, 
  updateEstado,
  deleteMemoria,
  generateExcelData
} from '@/services/memoriaAnualService';
import { MemoriaAnual, EstadoMemoria, ResumenLER } from '@/types/wasteManagement';
import ComponentCard from '@/components/common/ComponentCard';
import Alert from '@/components/ui/alert/Alert';
import  Badge  from '@/components/ui/badge/Badge';
import  Button from '@/components/ui/button/Button';
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Archive,
  FileCheck,
  Trash2,
  Edit,
  Send,
  Eye,
  BarChart3,
} from 'lucide-react';

export default function DetalleMemoriaPage() {
  const router = useRouter();
  const params = useParams();
  const memoriaId = parseInt(params.id as string);

  const [memoria, setMemoria] = useState<MemoriaAnual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingExcel, setProcessingExcel] = useState(false);

  useEffect(() => {
    if (memoriaId) {
      loadMemoria();
    }
  }, [memoriaId]);

  const loadMemoria = async () => {
    try {
      setLoading(true);
      const data = await getMemoriaById(memoriaId);
      setMemoria(data);
    } catch (err) {
      setError('Error al cargar la memoria anual');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEstado = async (nuevoEstado: EstadoMemoria) => {
    if (!memoria) return;

    try {
      await updateEstado(memoria.id, nuevoEstado);
      setSuccess('Estado actualizado correctamente');
      loadMemoria();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al actualizar el estado');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!memoria) return;

    if (!confirm('¿Estás seguro de que quieres eliminar esta memoria anual? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteMemoria(memoria.id);
      router.push('/residuos/memorias-anuales');
    } catch (err) {
      setError('Error al eliminar la memoria anual');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleGenerateExcel = async () => {
    if (!memoria) return;

    try {
      setProcessingExcel(true);
      const excelData = await generateExcelData(memoria.id);
      
      // Aquí se debería generar el archivo Excel real
      // Por ahora solo mostramos un mensaje de éxito
      setSuccess('Datos de Excel generados correctamente. La funcionalidad de exportación se implementará próximamente.');
      
      console.log('Excel Data:', excelData);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('Error al generar el Excel');
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingExcel(false);
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

  const getTipoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      productor: 'Memoria Anual de Productores',
      gestor: 'Memoria Anual de Gestores',
      gestor_raee: 'Memoria Anual de Gestores RAEE',
      negociante: 'Memoria Anual de Negociantes',
      transportista: 'Memoria Anual de Transportistas',
      agente: 'Memoria Anual de Agentes',
    };
    return labels[tipo] || tipo;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!memoria) {
    return (
      <div className="space-y-6">
        <Alert 
          variant="error" 
          title="Error" 
          message="No se encontró la memoria anual"
        />
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{memoria.numero_memoria}</h1>
            <p className="text-muted-foreground">{getTipoLabel(memoria.tipo_memoria)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getEstadoBadge(memoria.estado)}
        </div>
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

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <ComponentCard title="Movimientos">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Movimientos</p>
              <p className="text-2xl font-bold">{memoria.total_movimientos}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </ComponentCard>

        <ComponentCard title="Toneladas">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Toneladas</p>
              <p className="text-2xl font-bold">{memoria.total_toneladas.toFixed(2)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </ComponentCard>

        <ComponentCard title="Códigos LER">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Códigos LER</p>
              <p className="text-2xl font-bold">{memoria.resumen_ler?.length || 0}</p>
            </div>
            <FileCheck className="h-8 w-8 text-blue-500" />
          </div>
        </ComponentCard>

        <ComponentCard title="Año">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Año</p>
              <p className="text-2xl font-bold">{memoria.año}</p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </ComponentCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de la Empresa */}
          <ComponentCard>
            <h3 className="text-lg font-semibold mb-4">Datos de la Empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre de la Empresa</label>
                <p className="text-sm font-medium">{memoria.nombre_empresa}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">NIF</label>
                <p className="text-sm">{memoria.nif_empresa}</p>
              </div>
              {memoria.nima && (
                <div>
                  <label className="text-sm font-medium text-gray-500">NIMA</label>
                  <p className="text-sm">{memoria.nima}</p>
                </div>
              )}
              {memoria.nombre_centro && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre del Centro</label>
                  <p className="text-sm">{memoria.nombre_centro}</p>
                </div>
              )}
              {memoria.municipio_centro && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Municipio</label>
                  <p className="text-sm">{memoria.municipio_centro}</p>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Resumen por Código LER */}
          <ComponentCard>
            <h3 className="text-lg font-semibold mb-4">Resumen por Código LER</h3>
            {memoria.resumen_ler && memoria.resumen_ler.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Código LER
                      <ComponentCard title="Datos de la Empresa">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Movimientos
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Toneladas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {memoria.resumen_ler.map((item: ResumenLER, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{item.codigo_ler}</td>
                        <td className="px-4 py-3 text-sm">{item.descripcion}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.numero_movimientos}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.cantidad_total.toFixed(2)} t</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay datos disponibles</p>
            )}
          </ComponentCard>

          {/* Observaciones */}
          {memoria.observaciones && (
            <ComponentCard>
              <h3 className="text-lg font-semibold mb-4">Observaciones</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{memoria.observaciones}</p>
            </ComponentCard>
          )}
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Acciones */}
          <ComponentCard>
            <h3 className="text-lg font-semibold mb-4">Acciones</h3>
            <div className="space-y-2">
              {/* Generar/Descargar Excel */}
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleGenerateExcel}
                disabled={processingExcel}
              >
                {processingExcel ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {memoria.archivo_excel_url ? 'Descargar Excel' : 'Generar Excel'}
                  </>
                )}
              </Button>

              {/* Cambiar Estado */}
              {memoria.estado === 'borrador' && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => handleChangeEstado('revision')}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar a Revisión
                </Button>
              )}

              {memoria.estado === 'revision' && (
                <>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleChangeEstado('completada')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Completada
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handleChangeEstado('borrador')}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Volver a Borrador
                  </Button>
                </>
              )}

              {memoria.estado === 'completada' && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => handleChangeEstado('presentada')}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Marcar como Presentada
                </Button>
              )}

              {memoria.estado === 'presentada' && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => handleChangeEstado('archivada')}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archivar
                </Button>
              )}

              {/* Ver Documentos */}
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/residuos/documentos-identificacion')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Documentos de Identificación
              </Button>

              {/* Eliminar (solo en borrador) */}
              {memoria.estado === 'borrador' && (
                <Button
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  variant="ghost"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Memoria
                </Button>
              )}
            </div>
          </ComponentCard>

          {/* Información */}
          <ComponentCard>
            <h3 className="text-lg font-semibold mb-4">Información</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-gray-500">Período</label>
                <p>{formatDate(memoria.fecha_inicio)} - {formatDate(memoria.fecha_fin)}</p>
              </div>
              
              {memoria.fecha_presentacion && (
                <div>
                  <label className="font-medium text-gray-500">Fecha de Presentación</label>
                  <p>{formatDate(memoria.fecha_presentacion)}</p>
                </div>
              )}

              <div>
                <label className="font-medium text-gray-500">Documentos Incluidos</label>
                <p>{memoria.documentos_identificacion_ids.length} documentos</p>
              </div>

              <div>
                <label className="font-medium text-gray-500">Creada el</label>
                <p>{formatDate(memoria.created_at)}</p>
              </div>

              <div>
                <label className="font-medium text-gray-500">Última actualización</label>
                <p>{formatDate(memoria.updated_at)}</p>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
