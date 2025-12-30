'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import wasteContractService from '@/services/wasteContractService';
import companyService from '@/services/companyService';
import type { Company, WasteContractFormData } from '@/types/wasteManagement';
import DatePicker from '../form/date-picker';

const TIPOS_CONTRATO = [
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'recogida', label: 'Recogida' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'valoracion', label: 'Valoración' },
  { value: 'eliminacion', label: 'Eliminación' },
];

interface NuevoContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  myCompany: Company;
}

export default function NuevoContratoModal({
  isOpen,
  onClose,
  onSuccess,
  myCompany,
}: NuevoContratoModalProps) {
  const [saving, setSaving] = useState(false);
  const [gestores, setGestores] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGestorForm, setShowGestorForm] = useState(false);

  const [formData, setFormData] = useState<WasteContractFormData>({
    company_id: myCompany.id,
    gestor_company_id: undefined,
    numero_contrato: '',
    fecha_contrato: new Date().toISOString().split('T')[0],
    fecha_inicio: '',
    fecha_fin: '',
    tipo_contrato: 'tratamiento',
    descripcion_residuos: '',
    operaciones_tratamiento: [],
    cantidad_maxima_anual: undefined,
    unidad_cantidad: 'toneladas',
    precio_unitario: undefined,
    moneda: 'EUR',
    estado: 'borrador',
    notas: '',
  });

  const [gestorData, setGestorData] = useState({
    razon_social: '',
    cif: '',
    nima: '',
    direccion: '',
    telefono: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadGestores();
      const numeroContrato = wasteContractService.generateContractNumber(myCompany.id);
      setFormData((prev) => ({ ...prev, numero_contrato: numeroContrato }));
    }
  }, [isOpen, myCompany.id]);

  const loadGestores = async () => {
    try {
      const gestoresData = await companyService.getByType('gestor');
      setGestores(gestoresData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGestorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGestorData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: 'fecha_contrato' | 'fecha_inicio' | 'fecha_fin') => (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const dateStr = dates[0].toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, [field]: dateStr }));
    }
  };

  const handleSearchGestor = async () => {
    if (searchQuery.trim().length < 2) return;

    try {
      const results = await companyService.search(searchQuery);
      setGestores(results);
    } catch (err: any) {
      setError(`Error al buscar: ${err.message}`);
    }
  };

  const handleCreateGestor = async () => {
    if (!gestorData.razon_social || !gestorData.cif) {
      setError('La razón social y el CIF son obligatorios');
      return;
    }

    try {
      const newGestor = await companyService.create({
        razon_social: gestorData.razon_social,
        cif: gestorData.cif,
        nima: gestorData.nima,
        domicilio_social: gestorData.direccion,
        telefono: gestorData.telefono,
        tipo_empresa: 'gestor',
      });

      setGestores((prev) => [newGestor, ...prev]);
      setFormData((prev) => ({ ...prev, gestor_company_id: newGestor.id }));
      setShowGestorForm(false);
      setGestorData({ razon_social: '', cif: '', nima: '', direccion: '', telefono: '' });
    } catch (err: any) {
      setError(`Error al crear gestor: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fecha_contrato) {
      setError('La fecha del contrato es obligatoria');
      return;
    }

    if (formData.fecha_inicio && formData.fecha_fin) {
      if (!wasteContractService.validateDates(formData.fecha_inicio, formData.fecha_fin)) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
    }

    try {
      setSaving(true);
      
      // Convertir cadenas vacías a undefined para campos de fecha y numéricos
      const cleanedData = {
        ...formData,
        fecha_inicio: formData.fecha_inicio || undefined,
        fecha_fin: formData.fecha_fin || undefined,
        cantidad_maxima_anual: formData.cantidad_maxima_anual || undefined,
        precio_unitario: formData.precio_unitario || undefined,
      };
      
      await wasteContractService.create(cleanedData);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      company_id: myCompany.id,
      gestor_company_id: undefined,
      numero_contrato: '',
      fecha_contrato: new Date().toISOString().split('T')[0],
      fecha_inicio: '',
      fecha_fin: '',
      tipo_contrato: 'tratamiento',
      descripcion_residuos: '',
      operaciones_tratamiento: [],
      cantidad_maxima_anual: undefined,
      unidad_cantidad: 'toneladas',
      precio_unitario: undefined,
      moneda: 'EUR',
      estado: 'borrador',
      notas: '',
    });
    setError(null);
    setShowGestorForm(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-5xl max-h-[90vh] overflow-y-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Nuevo Contrato de Tratamiento</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error" title="Error" message={error} />
        )}

        {/* Datos del Contrato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Datos del Contrato</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número de Contrato</label>
              <Input
                name="numero_contrato"
                value={formData.numero_contrato}
                onChange={handleChange}
                placeholder="Se genera automáticamente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fecha del Contrato *</label>
              <DatePicker 
                id="fecha_contrato"
                mode="single"
                onChange={handleDateChange('fecha_contrato')}
                defaultDate={formData.fecha_contrato ? new Date(formData.fecha_contrato) : new Date()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fecha de Inicio</label>
               <DatePicker 
                id="fecha_inicio"
                mode="single"
                onChange={handleDateChange('fecha_inicio')}
                defaultDate={formData.fecha_inicio ? new Date(formData.fecha_inicio) : undefined}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fecha de Fin</label>
              <DatePicker 
                id="fecha_fin"
                mode="single"
                onChange={handleDateChange('fecha_fin')}
                defaultDate={formData.fecha_fin ? new Date(formData.fecha_fin) : undefined}
              />
             
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Contrato *</label>
              <select
                name="tipo_contrato"
                value={formData.tipo_contrato}
                onChange={handleChange}
                required
                className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
              >
                {TIPOS_CONTRATO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
              >
                <option value="borrador">Borrador</option>
                <option value="vigente">Vigente</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mi Empresa */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Productor / Mi Empresa</h3>
          <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Razón Social:</strong> {myCompany.razon_social}</p>
            <p><strong>CIF:</strong> {myCompany.cif}</p>
            {myCompany.nima && <p><strong>NIMA:</strong> {myCompany.nima}</p>}
          </div>
        </div>

        {/* Gestor / Destinatario */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Gestor / Destinatario</h3>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Buscar Gestor
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por razón social, CIF o NIMA..."
                className="flex-1 px-3 py-2 border border-stroke rounded-md text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchGestor();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={handleSearchGestor}>
                Buscar
              </Button>
            </div>

            {gestores.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Gestor</label>
                <select
                  name="gestor_company_id"
                  value={formData.gestor_company_id || ''}
                  onChange={handleChange}
                  className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
                >
                  <option value="">Selecciona un gestor...</option>
                  {gestores.map((gestor) => (
                    <option key={gestor.id} value={gestor.id}>
                      {gestor.razon_social} - {gestor.cif}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-stroke pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGestorForm(!showGestorForm)}
            >
              {showGestorForm ? 'Cancelar' : '+ Crear Nuevo Gestor'}
            </Button>

            {showGestorForm && (
              <div className="mt-4 p-4 bg-muted/20 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Razón Social *</label>
                  <Input
                    name="razon_social"
                    value={gestorData.razon_social}
                    onChange={handleGestorChange}
                    placeholder="Nombre de la empresa gestora"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">CIF *</label>
                    <Input
                      name="cif"
                      value={gestorData.cif}
                      onChange={handleGestorChange}
                      placeholder="B12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">NIMA</label>
                    <Input
                      name="nima"
                      value={gestorData.nima}
                      onChange={handleGestorChange}
                      placeholder="1234567890AB"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Dirección</label>
                  <Input
                    name="direccion"
                    value={gestorData.direccion}
                    onChange={handleGestorChange}
                    placeholder="Dirección completa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono</label>
                  <Input
                    name="telefono"
                    value={gestorData.telefono}
                    onChange={handleGestorChange}
                    placeholder="954123456"
                  />
                </div>
                <Button type="button" size="sm" onClick={handleCreateGestor}>
                  Crear Gestor
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Residuos y Condiciones */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Residuos y Condiciones</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Descripción de Residuos</label>
            <TextArea
              value={formData.descripcion_residuos}
              onChange={(value) => setFormData(prev => ({ ...prev, descripcion_residuos: value }))}
              rows={2}
              placeholder="Describe los tipos de residuos cubiertos por el contrato..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cantidad Máxima Anual</label>
              <Input
                name="cantidad_maxima_anual"
                type="number"
                step={0.01}
                value={formData.cantidad_maxima_anual || ''}
                onChange={handleChange}
                placeholder="Ej: 1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Unidad</label>
              <select
                name="unidad_cantidad"
                value={formData.unidad_cantidad}
                onChange={handleChange}
                className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
              >
                <option value="toneladas">Toneladas</option>
                <option value="kg">Kilogramos</option>
                <option value="m3">Metros cúbicos</option>
                <option value="litros">Litros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Precio Unitario</label>
              <Input
                name="precio_unitario"
                type="number"
                step={0.01}
                value={formData.precio_unitario || ''}
                onChange={handleChange}
                placeholder="Ej: 150.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Moneda</label>
              <select
                name="moneda"
                value={formData.moneda}
                onChange={handleChange}
                className="h-11 w-full appearance-none rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm shadow-xs placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-dark dark:focus:border-primary"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notas / Observaciones</label>
            <TextArea
              value={formData.notas}
              onChange={(value) => setFormData(prev => ({ ...prev, notas: value }))}
              rows={2}
              placeholder="Información adicional del contrato..."
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-stroke">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creando...' : 'Crear Contrato'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
