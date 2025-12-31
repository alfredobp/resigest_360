'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createMemoria, CreateMemoriaData } from '@/services/memoriaAnualService';
import { companyService } from '@/services/companyService';
import { Company, TipoMemoria } from '@/types/wasteManagement';
import ComponentCard from '@/components/common/ComponentCard';
import Alert  from '@/components/ui/alert/Alert';
import  Button  from '@/components/ui/button/Button';
import { AlertCircle, ArrowLeft, Save, FileText } from 'lucide-react';

export default function NuevaMemoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCompany, setUserCompany] = useState<Company | null>(null);

  // Formulario
  const [año, setAño] = useState<number>(new Date().getFullYear() - 1); // Año anterior por defecto
  const [tipoMemoria, setTipoMemoria] = useState<TipoMemoria>('productor');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    loadUserCompany();
  }, []);

  const loadUserCompany = async () => {
    try {
      const company = await companyService.getUserCompany();
      setUserCompany(company);
      
      // Establecer el tipo de memoria según el tipo de empresa
      if (company) {
        if (company.tipo_empresa === 'productor') {
          setTipoMemoria('productor');
        } else if (company.tipo_empresa === 'gestor') {
          setTipoMemoria('gestor');
        } else if (company.tipo_empresa === 'negociante') {
          setTipoMemoria('negociante');
        } else if (company.tipo_empresa === 'transportista') {
          setTipoMemoria('transportista');
        } else if (company.tipo_empresa === 'agente') {
          setTipoMemoria('agente');
        }
      }
    } catch (err) {
      setError('Error al cargar los datos de la empresa');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userCompany) {
      setError('Debes configurar una empresa primero');
      return;
    }

    // Validaciones
    if (!año) {
      setError('El año es obligatorio');
      return;
    }

    if (año > new Date().getFullYear()) {
      setError('No puedes generar memorias de años futuros');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data: CreateMemoriaData = {
        company_id: userCompany.id,
        tipo_memoria: tipoMemoria,
        año,
        nombre_empresa: userCompany.razon_social,
        nif_empresa: userCompany.cif,
        nombre_centro: userCompany.nombre_comercial,
        municipio_centro: userCompany.municipio_instalacion || userCompany.municipio_social,
        nima: userCompany.nima,
        observaciones,
      };

      const nuevaMemoria = await createMemoria(data);

      if (nuevaMemoria) {
        router.push(`/residuos/memorias-anuales/${nuevaMemoria.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la memoria anual');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAñosDisponibles = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 1; i >= currentYear - 10; i--) {
      years.push(i);
    }
    return years;
  };

  const getTiposDisponibles = (): { value: TipoMemoria; label: string }[] => {
    return [
      { value: 'productor', label: 'Memoria Anual de Productores' },
      { value: 'gestor', label: 'Memoria Anual de Gestores' },
      { value: 'gestor_raee', label: 'Memoria Anual de Gestores RAEE' },
      { value: 'negociante', label: 'Memoria Anual de Negociantes' },
      { value: 'transportista', label: 'Memoria Anual de Transportistas' },
      { value: 'agente', label: 'Memoria Anual de Agentes' },
    ];
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nueva Memoria Anual</h1>
            <p className="text-muted-foreground">
              Genera una memoria anual a partir de los documentos de identificación
            </p>
          </div>
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

      {/* Información importante */}
      <Alert
        variant="info"
        title="Información importante"
        message="La memoria anual se generará automáticamente a partir de todos los documentos de identificación completados durante el año seleccionado. Asegúrate de que todos los documentos de identificación del año estén completados y firmados."
      />

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <ComponentCard>
          <div className="space-y-6">
            {/* Datos de la Empresa */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Datos de la Empresa</h3>
              {userCompany ? (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Razón Social</label>
                    <p className="text-sm">{userCompany.razon_social}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">NIF</label>
                    <p className="text-sm">{userCompany.cif}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">NIMA</label>
                    <p className="text-sm">{userCompany.nima || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Municipio</label>
                    <p className="text-sm">
                      {userCompany.municipio_instalacion || userCompany.municipio_social || 'No especificado'}
                    </p>
                  </div>
                </div>
              ) : (
                <Alert 
                  variant="error" 
                  title="Error" 
                  message="No se encontró información de la empresa. Por favor, configura los datos de tu empresa primero."
                />
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Datos de la Memoria</h3>
              <div className="space-y-4">
                {/* Año */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Año <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={año}
                    onChange={(e) => setAño(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {getAñosDisponibles().map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecciona el año para el que quieres generar la memoria anual
                  </p>
                </div>

                {/* Tipo de Memoria */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo de Memoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipoMemoria}
                    onChange={(e) => setTipoMemoria(e.target.value as TipoMemoria)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {getTiposDisponibles().map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    El tipo de memoria determina el formato del informe generado
                  </p>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Añade cualquier observación o nota relevante para esta memoria anual..."
                  />
                </div>
              </div>
            </div>

            {/* Información sobre el proceso */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">¿Qué incluirá esta memoria?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✓ Todos los documentos de identificación completados del año {año}</p>
                <p>✓ Resumen de movimientos por código LER</p>
                <p>✓ Total de toneladas gestionadas</p>
                <p>✓ Datos de productores, gestores y transportistas involucrados</p>
                <p>✓ Información lista para exportar al formato Excel oficial</p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !userCompany}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Generar Memoria
                  </>
                )}
              </Button>
            </div>
          </div>
        </ComponentCard>
      </form>
    </div>
  );
}
