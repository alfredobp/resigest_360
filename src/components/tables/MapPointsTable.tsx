"use client";
import React, { useEffect, useState } from 'react';
import { projectService, Project, MapCollection, MapPoint, SpatialData } from '@/services/projectService';
import { PencilIcon, TrashBinIcon } from '@/icons';
import ImageUpload from '@/components/common/ImageUpload';
import PolygonDrawer from '@/components/common/PolygonDrawer';

type ViewMode = 'projects' | 'collections' | 'spatial_data';

export default function MapPointsTable() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<MapCollection | null>(null);
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [newProject, setNewProject] = useState<Omit<Project, 'id' | 'created_at'>>({
    name: '',
    description: '',
    show: true,
    photo: ''
  });
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editProjectForm, setEditProjectForm] = useState<Partial<Project>>({});
  
  // Collections state
  const [collections, setCollections] = useState<MapCollection[]>([]);
  const [showAddCollectionForm, setShowAddCollectionForm] = useState(false);
  const [newCollection, setNewCollection] = useState<Omit<MapCollection, 'id' | 'created_at'>>({
    project_id: 0,
    name: '',
    description: '',
    photo: ''
  });
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [editCollectionForm, setEditCollectionForm] = useState<Partial<MapCollection>>({});
  
  // Spatial Data state
  const [spatialData, setSpatialData] = useState<SpatialData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [geometryType, setGeometryType] = useState<'point' | 'polygon'>('point');
  const [showPolygonDrawer, setShowPolygonDrawer] = useState(false);
  const [newSpatialData, setNewSpatialData] = useState<Omit<SpatialData, 'id' | 'created_at'>>({
    collection_id: 0,
    name: '',
    description: '',
    category: '',
    geometry_type: 'point',
    geometry: {
      type: 'Point',
      coordinates: [-3.7038, 40.4168]
    },
    latitude: 40.4168,
    longitude: -3.7038,
    address: '',
    photo: '',
    image: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SpatialData>>({});
  
  // Alias for backwards compatibility
  const points = spatialData;
  const setPoints = setSpatialData;
  const newPoint = newSpatialData;
  const setNewPoint = setNewSpatialData;
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await projectService.getProjects();
    setProjects(data);
    setLoading(false);
  };

  const loadCollections = async (projectId: number) => {
    setLoading(true);
    const data = await projectService.getCollections(projectId);
    setCollections(data);
    setLoading(false);
  };

  const loadPoints = async (collectionId: number) => {
    setLoading(true);
    const data = await projectService.getPoints(collectionId);
    setPoints(data);
    setLoading(false);
  };

  // Projects handlers
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    loadCollections(project.id);
    setViewMode('collections');
  };

  const handleBackToProjects = () => {
    setViewMode('projects');
    setSelectedProject(null);
    setCollections([]);
    setShowAddCollectionForm(false);
    setEditingCollectionId(null);
  };

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.description) {
      alert('Nombre y descripción son obligatorios');
      return;
    }
    
    const added = await projectService.createProject(newProject);
    if (added) {
      setProjects([added, ...projects]);
      setShowAddProjectForm(false);
      setNewProject({ name: '', description: '', show: true, photo: '' });
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectForm(project);
  };

  const handleSaveProject = async (id: number) => {
    const updated = await projectService.updateProject(id, editProjectForm);
    if (updated) {
      setProjects(projects.map(p => p.id === id ? updated : p));
      setEditingProjectId(null);
      setEditProjectForm({});
    }
  };

  const handleCancelProjectEdit = () => {
    setEditingProjectId(null);
    setEditProjectForm({});
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este proyecto? Se eliminarán todas sus colecciones y puntos.')) {
      const success = await projectService.deleteProject(id);
      if (success) {
        setProjects(projects.filter(p => p.id !== id));
      }
    }
  };

  // Collections handlers
  const handleSelectCollection = (collection: MapCollection) => {
    setSelectedCollection(collection);
    setNewPoint(prev => ({ ...prev, collection_id: collection.id }));
    loadPoints(collection.id);
    setViewMode('spatial_data');
  };

  const handleBackToCollections = () => {
    setViewMode('collections');
    setSelectedCollection(null);
    setPoints([]);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAddCollection = async () => {
    if (!newCollection.name || !newCollection.description) {
      alert('Nombre y descripción son obligatorios');
      return;
    }

    if (!selectedProject?.id) {
      alert('Error: No hay proyecto seleccionado');
      return;
    }
    
    const collectionToCreate = {
      ...newCollection,
      project_id: selectedProject.id
    };

    const added = await projectService.createCollection(collectionToCreate);
    if (added) {
      setCollections([added, ...collections]);
      setShowAddCollectionForm(false);
      setNewCollection({ 
        project_id: selectedProject.id,
        name: '', 
        description: '' 
      });
    }
  };

  const handleEditCollection = (collection: MapCollection) => {
    setEditingCollectionId(collection.id);
    setEditCollectionForm(collection);
  };

  const handleSaveCollection = async (id: number) => {
    const updated = await projectService.updateCollection(id, editCollectionForm);
    if (updated) {
      setCollections(collections.map(c => c.id === id ? updated : c));
      setEditingCollectionId(null);
      setEditCollectionForm({});
    }
  };

  const handleCancelCollectionEdit = () => {
    setEditingCollectionId(null);
    setEditCollectionForm({});
  };

  const handleDeleteCollection = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta colección? Se eliminarán todos sus puntos.')) {
      const success = await projectService.deleteCollection(id);
      if (success) {
        setCollections(collections.filter(c => c.id !== id));
      }
    }
  };

  // Points handlers
  const handleEdit = (point: MapPoint) => {
    setEditingId(point.id);
    setEditForm(point);
  };

  const handleSave = async (id: number) => {
    const updated = await projectService.updatePoint(id, editForm);
    if (updated) {
      setPoints(points.map(p => p.id === id ? updated : p));
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este punto?')) {
      const success = await projectService.deletePoint(id);
      if (success) {
        setPoints(points.filter(p => p.id !== id));
      }
    }
  };

  const handleAdd = async () => {
    if (!newPoint.name || !newPoint.description) {
      alert('Nombre y descripción son obligatorios');
      return;
    }
    
    // Validate geometry based on type
    if (geometryType === 'polygon') {
      if (!newPoint.geometry || newPoint.geometry.type !== 'Polygon') {
        alert('Por favor, define el polígono usando el botón "Guardar Polígono"');
        return;
      }
    }
    
    // Prepare spatial data based on geometry type
    const spatialDataToAdd = {
      ...newPoint,
      collection_id: selectedCollection?.id || 0,
      geometry_type: geometryType
    };
    
    // Set geometry based on type
    if (geometryType === 'point') {
      spatialDataToAdd.geometry = {
        type: 'Point',
        coordinates: [newPoint.longitude || 0, newPoint.latitude || 0]
      };
      spatialDataToAdd.latitude = newPoint.latitude;
      spatialDataToAdd.longitude = newPoint.longitude;
    } else if (geometryType === 'polygon') {
      // Geometry already set by PolygonDrawer
      spatialDataToAdd.geometry = newPoint.geometry;
      spatialDataToAdd.latitude = newPoint.latitude;
      spatialDataToAdd.longitude = newPoint.longitude;
    }
    
    console.log('Guardando spatial data:', spatialDataToAdd);
    
    const added = await projectService.addPoint(spatialDataToAdd);
    if (added) {
      console.log('Dato espacial guardado:', added);
      setPoints([added, ...points]);
      setShowAddForm(false);
      setGeometryType('point');
      setNewPoint({
        collection_id: selectedCollection?.id || 0,
        name: '',
        description: '',
        category: '',
        geometry_type: 'point',
        geometry: {
          type: 'Point',
          coordinates: [-3.7038, 40.4168]
        },
        latitude: 40.4168,
        longitude: -3.7038,
        address: '',
        photo: '',
        image: ''
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-300 rounded-full border-t-brand-500 animate-spin"></div>
      </div>
    );
  }

  // PROJECTS VIEW
  if (viewMode === 'projects') {
    return (
      <div>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Proyectos</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gestiona tus proyectos con colecciones de puntos de interés
          </p>
        </div>

        {/* Add Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddProjectForm(!showAddProjectForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Proyecto
          </button>
        </div>

        {/* Add Project Form */}
        {showAddProjectForm && (
          <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Nuevo Proyecto</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  placeholder="Ej: Infraestructuras Madrid"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Descripción *</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  placeholder="Describe tu proyecto"
                />
              </div>
              <ImageUpload
                value={newProject.photo}
                onChange={(url) => setNewProject({...newProject, photo: url})}
                label="Fotografía del Proyecto"
                folder="projects"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mostrar-checkbox"
                  checked={newProject.show}
                  onChange={(e) => setNewProject({...newProject, show: e.target.checked})}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="mostrar-checkbox" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mostrar en mapa general
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddProject}
                className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600"
              >
                Crear
              </button>
              <button
                onClick={() => setShowAddProjectForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No hay proyectos. Crea uno nuevo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 hover:shadow-md"
              >
                {editingProjectId === project.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editProjectForm.name || ''}
                      onChange={(e) => setEditProjectForm({...editProjectForm, name: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      placeholder="Nombre"
                    />
                    <textarea
                      value={editProjectForm.description || ''}
                      onChange={(e) => setEditProjectForm({...editProjectForm, description: e.target.value})}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      placeholder="Descripción"
                    />
                    <ImageUpload
                      value={editProjectForm.photo || ''}
                      onChange={(url) => setEditProjectForm({...editProjectForm, photo: url})}
                      label="Fotografía"
                      folder="projects"
                      preview={true}
                    />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-mostrar-${project.id}`}
                        checked={editProjectForm.show ?? false}
                        onChange={(e) => setEditProjectForm({...editProjectForm, show: e.target.checked})}
                        className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                      />
                      <label htmlFor={`edit-mostrar-${project.id}`} className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                        Mostrar en mapa
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveProject(project.id)}
                        className="px-3 py-1 text-xs font-medium text-white transition-colors rounded bg-brand-500 hover:bg-brand-600"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={handleCancelProjectEdit}
                        className="px-3 py-1 text-xs font-medium text-gray-700 transition-colors bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {project.collections_count || 0} colecciones
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectProject(project)}
                          className="px-3 py-1 text-xs font-medium text-white transition-colors rounded bg-brand-500 hover:bg-brand-600"
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => handleEditProject(project)}
                          className="p-1.5 text-gray-600 transition-colors rounded hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1.5 text-red-600 transition-colors rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Eliminar"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Total: {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
        </div>
      </div>
    );
  }

  // COLLECTIONS VIEW
  if (viewMode === 'collections') {
    return (
      <div>
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToProjects}
            className="inline-flex items-center gap-2 mb-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Proyectos
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedProject?.name}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {selectedProject?.description}
          </p>
        </div>

        {/* Add Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddCollectionForm(!showAddCollectionForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Colección
          </button>
        </div>

        {/* Add Collection Form */}
        {showAddCollectionForm && (
          <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Nueva Colección</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
                <input
                  type="text"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  placeholder="Ej: Monumentos de Madrid"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Descripción *</label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  placeholder="Describe tu colección de puntos de interés"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddCollection}
                className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600"
              >
                Crear
              </button>
              <button
                onClick={() => setShowAddCollectionForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Collections Grid */}
        {collections.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No hay colecciones. Crea una nueva.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 hover:shadow-md"
              >
                {editingCollectionId === collection.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editCollectionForm.name || ''}
                      onChange={(e) => setEditCollectionForm({...editCollectionForm, name: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                    <textarea
                      value={editCollectionForm.description || ''}
                      onChange={(e) => setEditCollectionForm({...editCollectionForm, description: e.target.value})}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveCollection(collection.id)}
                        className="px-3 py-1 text-xs font-medium text-white transition-colors rounded bg-brand-500 hover:bg-brand-600"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={handleCancelCollectionEdit}
                        className="px-3 py-1 text-xs font-medium text-gray-700 transition-colors bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {collection.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {collection.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {collection.spatial_data_count || 0} datos
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectCollection(collection)}
                          className="px-3 py-1 text-xs font-medium text-white transition-colors rounded bg-brand-500 hover:bg-brand-600"
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => handleEditCollection(collection)}
                          className="p-1.5 text-gray-600 transition-colors rounded hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection.id)}
                          className="p-1.5 text-red-600 transition-colors rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Eliminar"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Total: {collections.length} colección{collections.length !== 1 ? 'es' : ''}
        </div>
      </div>
    );
  }

  // POINTS VIEW
  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={handleBackToCollections}
          className="inline-flex items-center gap-2 mb-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Colecciones
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedCollection?.name}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {selectedCollection?.description}
        </p>
      </div>

      {/* Add Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Dato Espacial
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Nuevo Dato Espacial</h3>
          
          {/* Geometry Type Selector */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Geometría *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="point"
                  checked={geometryType === 'point'}
                  onChange={(e) => setGeometryType(e.target.value as 'point' | 'polygon')}
                  className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">📍 Punto</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="polygon"
                  checked={geometryType === 'polygon'}
                  onChange={(e) => setGeometryType(e.target.value as 'point' | 'polygon')}
                  className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">⬟ Polígono</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
              <input
                type="text"
                value={newPoint.name}
                onChange={(e) => setNewPoint({...newPoint, name: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
              <input
                type="text"
                value={newPoint.category}
                onChange={(e) => setNewPoint({...newPoint, category: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Descripción *</label>
              <textarea
                value={newPoint.description}
                onChange={(e) => setNewPoint({...newPoint, description: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Conditional: Point coordinates or Polygon drawer */}
            {geometryType === 'point' ? (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Latitud *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newPoint.latitude}
                    onChange={(e) => setNewPoint({...newPoint, latitude: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Longitud *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newPoint.longitude}
                    onChange={(e) => setNewPoint({...newPoint, longitude: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Coordenadas del Polígono *</label>
                <PolygonDrawer
                  onSave={(coordinates) => {
                    console.log('Polígono guardado con coordenadas:', coordinates);
                    setNewPoint({
                      ...newPoint,
                      geometry_type: 'polygon',
                      geometry: {
                        type: 'Polygon',
                        coordinates: [coordinates]
                      },
                      latitude: coordinates[0][1], // First point lat
                      longitude: coordinates[0][0] // First point lng
                    });
                  }}
                />
                {newPoint.geometry?.type === 'Polygon' && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded dark:bg-green-900/20 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      ✓ Polígono definido con {(newPoint.geometry.coordinates as number[][][])[0]?.length - 1 || 0} puntos
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
              <input
                type="text"
                value={newPoint.address}
                onChange={(e) => setNewPoint({...newPoint, address: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                value={newPoint.image}
                onChange={(url) => setNewPoint({...newPoint, image: url})}
                label="Imagen para Popup del Mapa"
                folder="points"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 dark:text-gray-300">Tipo</th>
              <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 dark:text-gray-300">Nombre</th>
              <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 dark:text-gray-300">Descripción</th>
              <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 dark:text-gray-300">Categoría</th>
              <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 dark:text-gray-300">Coordenadas</th>
              <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 dark:text-gray-300">Dirección</th>
              <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700 dark:text-gray-300">Imagen</th>
              <th className="px-4 py-3 text-sm font-semibold text-right text-gray-700 dark:text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {points.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No hay datos espaciales registrados. Agrega uno nuevo.
                </td>
              </tr>
            ) : (
              points.map((point) => (
                <tr key={point.id} className="border-b border-gray-200 dark:border-gray-800">
                  <td className="px-4 py-3 text-sm text-center">
                    {point.geometry_type === 'polygon' ? '⬟' : '📍'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                    {editingId === point.id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700"
                      />
                    ) : (
                      point.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {editingId === point.id ? (
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700"
                      />
                    ) : (
                      <span className="line-clamp-2">{point.description}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === point.id ? (
                      <input
                        type="text"
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700"
                      />
                    ) : (
                      point.category && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                          {point.category}
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {editingId === point.id ? (
                      point.geometry_type === 'point' ? (
                        <div className="space-y-1">
                          <input
                            type="number"
                            step="0.000001"
                            value={editForm.latitude || 0}
                            onChange={(e) => setEditForm({...editForm, latitude: parseFloat(e.target.value)})}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700"
                            placeholder="Lat"
                          />
                          <input
                            type="number"
                            step="0.000001"
                            value={editForm.longitude || 0}
                            onChange={(e) => setEditForm({...editForm, longitude: parseFloat(e.target.value)})}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700"
                            placeholder="Lng"
                          />
                        </div>
                      ) : (
                        <div className="text-xs">
                          <PolygonDrawer
                            initialCoordinates={(point.geometry?.coordinates as number[][][])?.[0] || []}
                            onSave={(coordinates) => {
                              setEditForm({
                                ...editForm,
                                geometry: {
                                  type: 'Polygon',
                                  coordinates: [coordinates]
                                },
                                latitude: coordinates[0][1],
                                longitude: coordinates[0][0]
                              });
                            }}
                          />
                        </div>
                      )
                    ) : (
                      point.geometry_type === 'polygon' ? (
                        <div className="text-xs">
                          {((point.geometry?.coordinates as number[][][])?.[0]?.length || 0)} puntos
                        </div>
                      ) : (
                        <>
                          <div>Lat: {point.latitude?.toFixed(6) || 'N/A'}</div>
                          <div>Lng: {point.longitude?.toFixed(6) || 'N/A'}</div>
                        </>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {editingId === point.id ? (
                      <input
                        type="text"
                        value={editForm.address || ''}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700"
                      />
                    ) : (
                      <span className="line-clamp-2">{point.address}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {editingId === point.id ? (
                      <div className="w-40">
                        <ImageUpload
                          value={editForm.image || ''}
                          onChange={(url) => setEditForm({...editForm, image: url})}
                          label=""
                          folder="points"
                          preview={true}
                        />
                      </div>
                    ) : (
                      point.image ? (
                        <img src={point.image} alt={point.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <span className="text-gray-400">Sin imagen</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {editingId === point.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSave(point.id)}
                          className="px-3 py-1 text-xs font-medium text-white transition-colors rounded bg-brand-500 hover:bg-brand-600"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 text-xs font-medium text-gray-700 transition-colors bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(point)}
                          className="p-2 text-gray-600 transition-colors rounded hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(point.id)}
                          className="p-2 text-red-600 transition-colors rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Eliminar"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Total: {points.length} punto{points.length !== 1 ? 's' : ''} de interés
      </div>
    </div>
  );
}
