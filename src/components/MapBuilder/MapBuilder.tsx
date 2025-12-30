"use client";
import React, { useEffect, useState } from 'react';
import { publishedMapService, PublishedMap } from '@/services/publishedMapService';
import { projectService, Project, MapCollection } from '@/services/projectService';
import { useRouter } from 'next/navigation';

export default function MapBuilder() {
  const router = useRouter();
  const [maps, setMaps] = useState<PublishedMap[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<MapCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMap, setEditingMap] = useState<PublishedMap | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    center_lat: 40.4168,
    center_lng: -3.7038,
    zoom: 12,
    base_layer: 'osm',
    collection_ids: [] as number[],
    is_published: false,
    allow_layer_toggle: true,
    show_legend: true,
    show_search: false,
    custom_style: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [mapsData, projectsData] = await Promise.all([
      publishedMapService.getUserMaps(),
      projectService.getProjects()
    ]);
    setMaps(mapsData);
    setProjects(projectsData);

    // Cargar todas las colecciones
    const allCollections: MapCollection[] = [];
    for (const project of projectsData) {
      const cols = await projectService.getCollections(project.id);
      allCollections.push(...cols);
    }
    setCollections(allCollections);
    setLoading(false);
  };

  const handleCreate = async () => {
    const created = await publishedMapService.createMap(formData);
    if (created) {
      setMaps([created, ...maps]);
      setShowCreateForm(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!editingMap) return;
    const updated = await publishedMapService.updateMap(editingMap.id, formData);
    if (updated) {
      setMaps(maps.map(m => m.id === updated.id ? updated : m));
      setEditingMap(null);
      resetForm();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este mapa?')) return;
    const success = await publishedMapService.deleteMap(id);
    if (success) {
      setMaps(maps.filter(m => m.id !== id));
    }
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    const success = await publishedMapService.togglePublish(id, !currentStatus);
    if (success) {
      setMaps(maps.map(m => m.id === id ? { ...m, is_published: !currentStatus } : m));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      center_lat: 40.4168,
      center_lng: -3.7038,
      zoom: 12,
      base_layer: 'osm',
      collection_ids: [],
      is_published: false,
      allow_layer_toggle: true,
      show_legend: true,
      show_search: false,
      custom_style: {}
    });
    setShowCreateForm(false);
    setEditingMap(null);
  };

  const startEdit = (map: PublishedMap) => {
    setEditingMap(map);
    setFormData({
      name: map.name,
      description: map.description,
      center_lat: map.center_lat,
      center_lng: map.center_lng,
      zoom: map.zoom,
      base_layer: map.base_layer,
      collection_ids: map.collection_ids,
      is_published: map.is_published,
      allow_layer_toggle: map.allow_layer_toggle,
      show_legend: map.show_legend,
      show_search: map.show_search,
      custom_style: map.custom_style
    });
    setShowCreateForm(true);
  };

  const toggleCollection = (collectionId: number) => {
    setFormData(prev => ({
      ...prev,
      collection_ids: prev.collection_ids.includes(collectionId)
        ? prev.collection_ids.filter(id => id !== collectionId)
        : [...prev.collection_ids, collectionId]
    }));
  };

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/map/${slug}`;
    navigator.clipboard.writeText(url);
    alert('¡Link copiado al portapapeles!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-300 rounded-full border-t-brand-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Creador de Mapas</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Crea mapas personalizados y compártelos públicamente
        </p>
      </div>

      {/* Create Button */}
      <button
        onClick={() => setShowCreateForm(true)}
        className="mb-6 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
      >
        + Crear Nuevo Mapa
      </button>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            {editingMap ? 'Editar Mapa' : 'Nuevo Mapa'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Mapa *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Capa Base
              </label>
              <select
                value={formData.base_layer}
                onChange={(e) => setFormData({ ...formData, base_layer: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              >
                <option value="osm">OpenStreetMap</option>
                <option value="satellite">Satélite</option>
                <option value="ign-base">IGN Base</option>
                <option value="ign-orto">IGN Ortofoto</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Centro - Latitud
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.center_lat}
                onChange={(e) => setFormData({ ...formData, center_lat: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Centro - Longitud
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.center_lng}
                onChange={(e) => setFormData({ ...formData, center_lng: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Zoom Inicial
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.zoom}
                onChange={(e) => setFormData({ ...formData, zoom: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Opciones */}
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Opciones de Visualización
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allow_layer_toggle}
                    onChange={(e) => setFormData({ ...formData, allow_layer_toggle: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Permitir activar/desactivar capas</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.show_legend}
                    onChange={(e) => setFormData({ ...formData, show_legend: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar leyenda</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.show_search}
                    onChange={(e) => setFormData({ ...formData, show_search: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar búsqueda</span>
                </label>
              </div>
            </div>

            {/* Seleccionar Colecciones */}
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleccionar Capas (Colecciones)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg dark:border-gray-700 p-3">
                {projects.map(project => (
                  <div key={project.id} className="mb-3">
                    <div className="font-medium text-sm text-gray-800 dark:text-white mb-1">
                      {project.name}
                    </div>
                    {collections
                      .filter(c => c.project_id === project.id)
                      .map(collection => (
                        <label key={collection.id} className="flex items-center gap-2 ml-4 py-1">
                          <input
                            type="checkbox"
                            checked={formData.collection_ids.includes(collection.id)}
                            onChange={() => toggleCollection(collection.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {collection.name} ({collection.spatial_data_count || 0} datos)
                          </span>
                        </label>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={editingMap ? handleUpdate : handleCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
            >
              {editingMap ? 'Actualizar' : 'Crear Mapa'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Maps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {maps.map(map => (
          <div key={map.id} className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{map.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                map.is_published
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {map.is_published ? 'Publicado' : 'Borrador'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {map.description || 'Sin descripción'}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span>{map.collection_ids.length} capas</span>
              <span>•</span>
              <span>{map.view_count} vistas</span>
            </div>

            {map.is_published && (
              <div className="mb-3">
                <button
                  onClick={() => copyShareLink(map.slug)}
                  className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  📋 Copiar link: /map/{map.slug}
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => startEdit(map)}
                className="flex-1 px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                Editar
              </button>
              <button
                onClick={() => handleTogglePublish(map.id, map.is_published)}
                className={`flex-1 px-3 py-1 text-xs font-medium text-white rounded ${
                  map.is_published
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {map.is_published ? 'Ocultar' : 'Publicar'}
              </button>
              <button
                onClick={() => handleDelete(map.id)}
                className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {maps.length === 0 && !showCreateForm && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No tienes mapas creados. ¡Crea tu primer mapa!
        </div>
      )}
    </div>
  );
}
