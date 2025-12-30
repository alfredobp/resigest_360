"use client";
import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { projectService, Project, MapCollection, MapPoint, SpatialData } from '@/services/projectService';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  type: 'raster' | 'vector' | 'collection';
  sourceUrl?: string;
  collection_id?: number;
  color?: string;
}

interface ProjectTreeNode {
  project: Project;
  collections: CollectionTreeNode[];
  expanded: boolean;
  visible: boolean;
}

interface CollectionTreeNode {
  collection: MapCollection;
  points: SpatialData[];
  expanded: boolean;
  visible: boolean;
}

interface MapProps {
  collections?: MapCollection[];
  initialCenter?: [number, number];
  initialZoom?: number;
  baseLayer?: string;
  publicMode?: boolean;
}

const Map: React.FC<MapProps> = ({ 
  collections: propsCollections,
  initialCenter = [-3.7038, 40.4168],
  initialZoom = 12,
  baseLayer = 'osm',
  publicMode = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<{ [key: string]: Marker[] }>({});
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [projectTree, setProjectTree] = useState<ProjectTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const measurePoints = useRef<[number, number][]>([]);
  const measureMarkers = useRef<Marker[]>([]);
  const measureLine = useRef<string | null>(null);
  const [editingEntity, setEditingEntity] = useState<{
    type: 'point' | 'polygon';
    data: SpatialData;
    projectId: number;
    collectionId: number;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const polygonEditMarkers = useRef<Marker[]>([]);
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'osm',
      name: 'OpenStreetMap',
      visible: true,
      type: 'raster',
      sourceUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    {
      id: 'satellite',
      name: 'Satélite',
      visible: false,
      type: 'raster',
      sourceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    },
    {
      id: 'ign-base',
      name: 'IGN Base',
      visible: false,
      type: 'raster',
      sourceUrl: 'https://www.ign.es/wmts/mapa-raster?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=MTN&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg'
    },
    {
      id: 'ign-orto',
      name: 'IGN Ortofoto',
      visible: false,
      type: 'raster',
      sourceUrl: 'https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg'
    },
    {
      id: 'catastro',
      name: 'Catastro',
      visible: false,
      type: 'raster',
      sourceUrl: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=Catastro&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=TRUE'
    }
  ]);

  // Load project tree from Supabase (only if not in public mode)
  useEffect(() => {
    if (publicMode || propsCollections) {
      setLoading(false);
      return;
    }

    const loadProjectTree = async () => {
      setLoading(true);
      const allProjects = await projectService.getProjects();
      // Filter only projects with show=true for map display
      const projects = allProjects.filter(p => p.show);
      
      const tree: ProjectTreeNode[] = await Promise.all(
        projects.map(async (project) => {
          const collections = await projectService.getCollections(project.id);
          return {
            project,
            collections: collections.map(collection => ({
              collection,
              points: [],
              expanded: false,
              visible: false
            })),
            expanded: false,
            visible: false
          };
        })
      );
      
      setProjectTree(tree);
      setLoading(false);
    };

    loadProjectTree();
  }, [publicMode, propsCollections]);

  // Load propsCollections for public mode
  useEffect(() => {
    if (!publicMode || !propsCollections) return;

    // Convert prop collections to project tree format for rendering
    const mockProject: Project = {
      id: 0,
      name: 'Public Map',
      description: '',
      user_id: '',
      show: true,
      photo: undefined,
      created_at: '',
    };

    const tree: ProjectTreeNode[] = [{
      project: mockProject,
      collections: propsCollections.map(collection => ({
        collection,
        points: collection.spatial_data || [],
        expanded: false,
        visible: true // Auto-show all collections in public mode
      })),
      expanded: true,
      visible: true
    }];

    setProjectTree(tree);
  }, [publicMode, propsCollections]);

  // Load points for a specific collection
  const loadCollectionPoints = async (projectId: number, collectionId: number) => {
    const points = await projectService.getPoints(collectionId);
    
    setProjectTree(prev => prev.map(projectNode => {
      if (projectNode.project.id === projectId) {
        return {
          ...projectNode,
          collections: projectNode.collections.map(collectionNode => {
            if (collectionNode.collection.id === collectionId) {
              return {
                ...collectionNode,
                points
              };
            }
            return collectionNode;
          })
        };
      }
      return projectNode;
    }));
  };

  // Add/remove markers and polygons based on visible collections in tree
  useEffect(() => {
    if (!map.current) return;

    // Clear all markers first
    Object.values(markers.current).forEach(markerArray => {
      markerArray.forEach(marker => marker.remove());
    });
    markers.current = {};

    // Remove all polygon layers and sources
    projectTree.forEach((projectNode) => {
      projectNode.collections.forEach((collectionNode) => {
        const layerId = `polygon-layer-${collectionNode.collection.id}`;
        const outlineLayerId = `polygon-outline-${collectionNode.collection.id}`;
        const sourceId = `polygon-source-${collectionNode.collection.id}`;
        
        if (map.current?.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current?.getLayer(outlineLayerId)) {
          map.current.removeLayer(outlineLayerId);
        }
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      });
    });

    // Generate colors for collections
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // Add markers and polygons for each visible collection
    projectTree.forEach((projectNode, projectIndex) => {
      if (!projectNode.visible) return;

      projectNode.collections.forEach((collectionNode, collectionIndex) => {
        if (!collectionNode.visible || !collectionNode.points.length) return;

        const collectionId = collectionNode.collection.id;
        const markerColor = colors[(projectIndex * 10 + collectionIndex) % colors.length];

        markers.current[collectionId] = [];

        // Separate points and polygons - usar geometry.type real, no geometry_type corrupto
        const pointData = collectionNode.points.filter(p => 
          p.geometry?.type === 'Point' || (!p.geometry?.type && p.geometry_type === 'point')
        );
        const polygonData = collectionNode.points.filter(p => 
          p.geometry?.type === 'Polygon' || (!p.geometry?.type && p.geometry_type === 'polygon')
        );

        console.log('Collection data:', {
          collectionName: collectionNode.collection.name,
          totalPoints: collectionNode.points.length,
          pointCount: pointData.length,
          polygonCount: polygonData.length,
          allPoints: collectionNode.points.map(p => ({ name: p.name, type: p.geometry_type, geometry: p.geometry }))
        });

        // Render points as markers
        pointData.forEach((point) => {
          if (!map.current) return;

          // Create popup content
          const popupContent = `
            <div class="p-3 min-w-[200px]">
              ${point.image ? `
                <img src="${point.image}" alt="${point.name}" class="w-full h-32 object-cover rounded-lg mb-3" />
              ` : ''}
              <h3 class="font-semibold text-base text-gray-900 mb-2">${point.name}</h3>
              <div class="space-y-2 text-sm">
                <p class="text-gray-600">${point.description}</p>
                ${point.category ? `
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                      ${point.category}
                    </span>
                  </div>
                ` : ''}
                ${point.address ? `
                  <p class="text-xs text-gray-500">
                    📍 ${point.address}
                  </p>
                ` : ''}
              </div>
            </div>
          `;

          const popup = new Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: true,
            className: 'map-popup'
          }).setHTML(popupContent);

          // Create custom marker element with dynamic color
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.cursor = 'pointer';
          el.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${markerColor}"/>
            </svg>
          `;

          const marker = new Marker({ 
            element: el,
            draggable: !publicMode 
          })
            .setLngLat([point.longitude || 0, point.latitude || 0])
            .setPopup(popup)
            .addTo(map.current);

          // Agregar evento de click para editar
          if (!publicMode) {
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              // Detectar el tipo real basándose en la geometría, no en geometry_type que puede estar corrupto
              const actualType = point.geometry?.type === 'Polygon' ? 'polygon' : 'point';
              setEditingEntity({
                type: actualType,
                data: point,
                projectId: projectNode.project.id,
                collectionId: collectionId
              });
              setIsEditMode(true);
            });

            marker.on('dragend', async () => {
              const lngLat = marker.getLngLat();
              await projectService.updatePoint(point.id, {
                ...point,
                longitude: lngLat.lng,
                latitude: lngLat.lat
              });
              // Recargar puntos
              loadCollectionPoints(projectNode.project.id, collectionId);
            });
          }

          markers.current[collectionId].push(marker);
        });

        // Render polygons as layers
        if (polygonData.length > 0 && map.current) {
          console.log('Rendering polygons:', polygonData);
          
          const sourceId = `polygon-source-${collectionId}`;
          const layerId = `polygon-layer-${collectionId}`;
          const outlineLayerId = `polygon-outline-${collectionId}`;

          // Convert polygons to GeoJSON features
          const features = polygonData.map(poly => {
            console.log('Processing polygon:', {
              name: poly.name,
              geometry: poly.geometry,
              coordinates: poly.geometry?.coordinates
            });
            
            return {
              type: 'Feature' as const,
              geometry: {
                type: 'Polygon' as const,
                coordinates: (poly.geometry?.coordinates as number[][][]) || []
              },
              properties: {
                name: poly.name,
                description: poly.description,
                category: poly.category || '',
                address: poly.address || '',
                image: poly.image || ''
              }
            };
          });

          const geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
            type: 'FeatureCollection',
            features
          };

          console.log('GeoJSON for polygons:', JSON.stringify(geojson, null, 2));

          // Add source
          map.current.addSource(sourceId, {
            type: 'geojson',
            data: geojson
          });

          // Add fill layer
          map.current.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': markerColor,
              'fill-opacity': 0.3
            }
          });

          // Add outline layer
          map.current.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': markerColor,
              'line-width': 2
            }
          });

          // Add click handler for polygons
          map.current.on('click', layerId, (e) => {
            if (!e.features || !e.features[0] || !map.current) return;

            const feature = e.features[0];
            const props = feature.properties || {};

            // Modo edición en lugar de popup
            if (!publicMode) {
              const poly = polygonData.find(p => p.name === props.name);
              if (poly) {
                setEditingEntity({
                  type: 'polygon',
                  data: poly,
                  projectId: projectNode.project.id,
                  collectionId: collectionId
                });
                setIsEditMode(true);
                return;
              }
            }

            const popupContent = `
              <div class="p-3 min-w-[200px]">
                ${props.image ? `
                  <img src="${props.image}" alt="${props.name}" class="w-full h-32 object-cover rounded-lg mb-3" />
                ` : ''}
                <h3 class="font-semibold text-base text-gray-900 mb-2">${props.name}</h3>
                <div class="space-y-2 text-sm">
                  <p class="text-gray-600">${props.description}</p>
                  ${props.category ? `
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700">
                        ${props.category}
                      </span>
                    </div>
                  ` : ''}
                  ${props.address ? `
                    <p class="text-xs text-gray-500">
                      📍 ${props.address}
                    </p>
                  ` : ''}
                </div>
              </div>
            `;

            new Popup({
              closeButton: true,
              closeOnClick: true,
              className: 'map-popup'
            })
              .setLngLat(e.lngLat)
              .setHTML(popupContent)
              .addTo(map.current);
          });

          // Change cursor on hover
          map.current.on('mouseenter', layerId, () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current.on('mouseleave', layerId, () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
          });
        }
      });
    });
  }, [projectTree]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new MapLibreMap({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: []
      },
      center: initialCenter,
      zoom: initialZoom
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    
    // Add fullscreen control
    if (!publicMode) {
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
      map.current.addControl(new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'top-right');
    }

    // Wait for map to load
    map.current.on('load', () => {
      // Add initial layers
      layers.forEach((layer) => {
        if (map.current && layer.sourceUrl) {
          addLayer(layer);
        }
      });
    });

    return () => {
      // Clean up markers
      Object.values(markers.current).forEach(markerArray => {
        markerArray.forEach(marker => marker.remove());
      });
      markers.current = {};
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const addLayer = (layer: Layer) => {
    if (!map.current || !layer.sourceUrl) return;

    // Add source
    if (!map.current.getSource(layer.id)) {
      let sourceConfig: any = {
        type: 'raster',
        tiles: [layer.sourceUrl],
        tileSize: 256
      };

      // Attribution based on layer
      if (layer.name === 'OpenStreetMap') {
        sourceConfig.attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      } else if (layer.id.includes('ign')) {
        sourceConfig.attribution = '© <a href="https://www.ign.es/">Instituto Geográfico Nacional</a>';
      } else if (layer.id === 'catastro') {
        sourceConfig.attribution = '© <a href="https://www.catastro.meh.es/">Catastro</a>';
      } else if (layer.id === 'satellite') {
        sourceConfig.attribution = '© Esri';
      }

      map.current.addSource(layer.id, sourceConfig);
    }

    // Add layer
    if (!map.current.getLayer(layer.id)) {
      map.current.addLayer({
        id: layer.id,
        type: 'raster',
        source: layer.id,
        layout: {
          visibility: layer.visible ? 'visible' : 'none'
        }
      });
    }
  };

  const toggleProject = (projectId: number) => {
    setProjectTree(prev => prev.map(projectNode => {
      if (projectNode.project.id === projectId) {
        const newVisible = !projectNode.visible;
        return {
          ...projectNode,
          visible: newVisible,
          collections: projectNode.collections.map(c => ({
            ...c,
            visible: newVisible ? c.visible : false
          }))
        };
      }
      return projectNode;
    }));
  };

  const toggleCollection = (projectId: number, collectionId: number) => {
    setProjectTree(prev => prev.map(projectNode => {
      if (projectNode.project.id === projectId) {
        return {
          ...projectNode,
          collections: projectNode.collections.map(collectionNode => {
            if (collectionNode.collection.id === collectionId) {
              const newVisible = !collectionNode.visible;
              
              // Load points if making visible and not loaded yet
              if (newVisible && collectionNode.points.length === 0) {
                loadCollectionPoints(projectId, collectionId);
              }
              
              return {
                ...collectionNode,
                visible: newVisible
              };
            }
            return collectionNode;
          })
        };
      }
      return projectNode;
    }));
  };

  const toggleProjectExpanded = (projectId: number) => {
    setProjectTree(prev => prev.map(projectNode => {
      if (projectNode.project.id === projectId) {
        return {
          ...projectNode,
          expanded: !projectNode.expanded
        };
      }
      return projectNode;
    }));
  };

  const toggleCollectionExpanded = (projectId: number, collectionId: number) => {
    setProjectTree(prev => prev.map(projectNode => {
      if (projectNode.project.id === projectId) {
        return {
          ...projectNode,
          collections: projectNode.collections.map(collectionNode => {
            if (collectionNode.collection.id === collectionId) {
              // Load points if expanding and not loaded yet
              if (!collectionNode.expanded && collectionNode.points.length === 0) {
                loadCollectionPoints(projectId, collectionId);
              }
              
              return {
                ...collectionNode,
                expanded: !collectionNode.expanded
              };
            }
            return collectionNode;
          })
        };
      }
      return projectNode;
    }));
  };

  const toggleLayer = (layerId: string) => {
    if (!map.current) return;

    const updatedLayers = layers.map((layer) => {
      if (layer.id === layerId) {
        const newVisibility = !layer.visible;
        
        // For raster layers, update map layer visibility
        if (layer.type === 'raster' && map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(
            layerId,
            'visibility',
            newVisibility ? 'visible' : 'none'
          );
        }
        
        return { ...layer, visible: newVisibility };
      }
      return layer;
    });

    setLayers(updatedLayers);
  };

  // Función para calcular distancia entre dos puntos
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const [lng1, lat1] = point1;
    const [lng2, lat2] = point2;
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const updateMeasureLine = () => {
    if (!map.current || measurePoints.current.length < 2) return;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: measurePoints.current
      }
    };

    if (map.current.getSource('measure-line')) {
      (map.current.getSource('measure-line') as any).setData(geojson);
    } else {
      map.current.addSource('measure-line', {
        type: 'geojson',
        data: geojson
      });

      map.current.addLayer({
        id: 'measure-line',
        type: 'line',
        source: 'measure-line',
        paint: {
          'line-color': '#ff0000',
          'line-width': 3,
          'line-dasharray': [2, 2]
        }
      });
    }

    // Calcular distancia total
    let totalDistance = 0;
    for (let i = 1; i < measurePoints.current.length; i++) {
      totalDistance += calculateDistance(
        measurePoints.current[i - 1],
        measurePoints.current[i]
      );
    }

    // Actualizar el último marcador con la distancia
    const lastMarker = measureMarkers.current[measureMarkers.current.length - 1];
    if (lastMarker) {
      const el = lastMarker.getElement();
      const distanceText = totalDistance >= 1000
        ? `${(totalDistance / 1000).toFixed(2)} km`
        : `${totalDistance.toFixed(0)} m`;
      el.innerHTML = `<div style="background: white; padding: 4px 8px; border-radius: 4px; border: 2px solid #ff0000; font-size: 12px; font-weight: bold; white-space: nowrap;">${distanceText}</div>`;
    }
  };

  const toggleMeasure = () => {
    if (!map.current) return;

    if (isMeasuring) {
      // Limpiar medición
      measureMarkers.current.forEach(marker => marker.remove());
      measureMarkers.current = [];
      measurePoints.current = [];
      
      if (map.current.getLayer('measure-line')) {
        map.current.removeLayer('measure-line');
      }
      if (map.current.getSource('measure-line')) {
        map.current.removeSource('measure-line');
      }
      
      map.current.getCanvas().style.cursor = '';
    }

    setIsMeasuring(!isMeasuring);
  };

  // Función para guardar cambios de la entidad editada
  const saveEditedEntity = async () => {
    if (!editingEntity) return;

    try {
      // Asegurar que TANTO geometry_type COMO geometry.type se actualicen correctamente
      const dataToSave = {
        ...editingEntity.data,
        geometry_type: editingEntity.type === 'polygon' ? 'polygon' : 'point',
        geometry: {
          ...editingEntity.data.geometry,
          type: editingEntity.type === 'polygon' ? 'Polygon' : 'Point'
        }
      };
      
      console.log('Saving entity:', dataToSave);
      await projectService.updatePoint(editingEntity.data.id, dataToSave);
      // Recargar puntos
      await loadCollectionPoints(editingEntity.projectId, editingEntity.collectionId);
      setEditingEntity(null);
      setIsEditMode(false);
      cleanupPolygonEdit();
    } catch (error) {
      console.error('Error saving entity:', error);
      alert('Error al guardar los cambios');
    }
  };

  const cancelEdit = () => {
    setEditingEntity(null);
    setIsEditMode(false);
    cleanupPolygonEdit();
  };

  const cleanupPolygonEdit = () => {
    polygonEditMarkers.current.forEach(marker => marker.remove());
    polygonEditMarkers.current = [];
    // Eliminar ambas capas antes de eliminar el source
    if (map.current?.getLayer('polygon-edit-outline')) {
      map.current.removeLayer('polygon-edit-outline');
    }
    if (map.current?.getLayer('polygon-edit-line')) {
      map.current.removeLayer('polygon-edit-line');
    }
    if (map.current?.getSource('polygon-edit-line')) {
      map.current.removeSource('polygon-edit-line');
    }
  };

  // Renderizar marcadores editables para polígonos
  useEffect(() => {
    if (!map.current || !editingEntity || editingEntity.type !== 'polygon') return;

    cleanupPolygonEdit();

    // Cast coordinates to polygon type for TypeScript
    const coords = (editingEntity.data.geometry?.coordinates?.[0] || []) as number[][];
    if (coords.length === 0) return;

    // Crear marcadores editables para cada punto del polígono (excepto el último que es copia del primero)
    const numMarkers = coords.length > 0 && 
                       coords[0][0] === coords[coords.length - 1][0] && 
                       coords[0][1] === coords[coords.length - 1][1]
                       ? coords.length - 1  // Excluir el último punto si es copia del primero
                       : coords.length;

    for (let index = 0; index < numMarkers; index++) {
      const coord = coords[index];
      const el = document.createElement('div');
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.background = '#3b82f6';
      el.style.border = '3px solid white';
      el.style.cursor = 'move';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new Marker({ element: el, draggable: true })
        .setLngLat([coord[0], coord[1]])
        .addTo(map.current!);

      marker.on('drag', () => {
        updatePolygonEditLine();
      });

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        const newCoords = [...coords];
        newCoords[index] = [lngLat.lng, lngLat.lat];
        // Cerrar el polígono: actualizar el último punto si es copia del primero
        if (index === 0 && coords.length > 1 && 
            coords[0][0] === coords[coords.length - 1][0] && 
            coords[0][1] === coords[coords.length - 1][1]) {
          newCoords[newCoords.length - 1] = [lngLat.lng, lngLat.lat];
        }
        setEditingEntity(prev => prev ? {
          ...prev,
          data: {
            ...prev.data,
            geometry_type: 'polygon',  // Preservar el tipo
            geometry: {
              type: 'Polygon',
              coordinates: [newCoords]
            }
          }
        } : null);
      });

      polygonEditMarkers.current.push(marker);
    }

    updatePolygonEditLine();
  }, [editingEntity]);

  const updatePolygonEditLine = () => {
    if (!map.current || !editingEntity || editingEntity.type !== 'polygon') return;

    const coords = polygonEditMarkers.current.map(m => {
      const lngLat = m.getLngLat();
      return [lngLat.lng, lngLat.lat];
    });

    // Cerrar el polígono: asegurar que el último punto sea igual al primero
    if (coords.length > 0) {
      const firstPoint = coords[0];
      const lastPoint = coords[coords.length - 1];
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        coords.push([firstPoint[0], firstPoint[1]]);
      }
    }

    const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    };

    if (map.current.getSource('polygon-edit-line')) {
      (map.current.getSource('polygon-edit-line') as any).setData(geojson);
    } else {
      map.current.addSource('polygon-edit-line', {
        type: 'geojson',
        data: geojson
      });

      map.current.addLayer({
        id: 'polygon-edit-line',
        type: 'fill',
        source: 'polygon-edit-line',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.2
        }
      });

      map.current.addLayer({
        id: 'polygon-edit-outline',
        type: 'line',
        source: 'polygon-edit-line',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-dasharray': [2, 2]
        }
      });
    }
  };

  // Manejador de clicks en el mapa para medir
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: any) => {
      if (!isMeasuring) return;

      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      measurePoints.current.push(coords);

      // Crear marcador
      const el = document.createElement('div');
      el.style.width = '10px';
      el.style.height = '10px';
      el.style.borderRadius = '50%';
      el.style.background = '#ff0000';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';

      const marker = new Marker({ element: el })
        .setLngLat(coords)
        .addTo(map.current!);

      measureMarkers.current.push(marker);
      updateMeasureLine();
    };

    if (isMeasuring) {
      map.current.getCanvas().style.cursor = 'crosshair';
      map.current.on('click', handleMapClick);
    }

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [isMeasuring]);

  return (
    <div className="relative w-full h-full">
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 rounded-full border-t-brand-500 animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Cargando puntos...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Points Counter */}
      {/* Points Counter */}
      {!publicMode && !loading && (() => {
        const totalPoints = projectTree.reduce((total, projectNode) => {
          return total + projectNode.collections.reduce((colTotal, collectionNode) => {
            return colTotal + (collectionNode.visible ? collectionNode.points.length : 0);
          }, 0);
        }, 0);
        return totalPoints > 0 ? (
          <div className="absolute z-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg bottom-14 left-4 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
            📍 {totalPoints} puntos de interés
          </div>
        ) : null;
      })()}

      {/* Layer Control Button */}
      {!publicMode && (
        <>
          <button
            onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
            className="absolute z-10 flex items-center justify-center w-10 h-10 transition-colors bg-white border border-gray-200 rounded-lg shadow-lg top-4 left-4 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            aria-label="Toggle Layers"
          >
            <svg
              className="w-5 h-5 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>

          {/* Measure Button */}
          <button
            onClick={toggleMeasure}
            className={`absolute z-10 flex items-center justify-center w-10 h-10 transition-colors border border-gray-200 rounded-lg shadow-lg top-16 left-4 ${
              isMeasuring 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
            }`}
            aria-label="Measure Distance"
            title={isMeasuring ? 'Finalizar medición' : 'Medir distancia'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </button>
        </>
      )}

      {/* Layer Panel */}
      {!publicMode && isLayerPanelOpen && !isEditMode && (
        <div className="absolute z-10 w-64 bg-white border border-gray-200 rounded-lg shadow-xl top-4 left-16 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              Capas del Mapa
            </h3>
            <button
              onClick={() => setIsLayerPanelOpen(false)}
              className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {/* Base Layers Section */}
            <div className="p-3 space-y-2">
              <div className="mb-2 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Capas Base
              </div>
              {layers.filter(l => l.type === 'raster').map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between p-2 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      layer.visible 
                        ? 'bg-brand-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {layer.name}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => toggleLayer(layer.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              ))}
            </div>

            {/* Project Tree Section */}
            {projectTree.length > 0 && (
              <div className="p-3 pt-0 space-y-1 border-t border-gray-200 dark:border-gray-700">
                <div className="mt-3 mb-2 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                  Proyectos
                </div>
                {projectTree.map((projectNode) => {
                  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
                  const projectIndex = projectTree.indexOf(projectNode);
                  
                  return (
                    <div key={projectNode.project.id} className="space-y-1">
                      {/* Project Level */}
                      <div className="flex items-center p-2 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <button
                          onClick={() => toggleProjectExpanded(projectNode.project.id)}
                          className="mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${projectNode.expanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <label className="flex items-center flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={projectNode.visible}
                            onChange={() => toggleProject(projectNode.project.id)}
                            className="w-4 h-4 mr-2 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {projectNode.project.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({projectNode.collections.length})
                          </span>
                        </label>
                      </div>

                      {/* Collections Level */}
                      {projectNode.expanded && (
                        <div className="ml-6 space-y-1">
                          {projectNode.collections.map((collectionNode) => {
                            const collectionIndex = projectNode.collections.indexOf(collectionNode);
                            const markerColor = colors[(projectIndex * 10 + collectionIndex) % colors.length];
                            
                            return (
                              <div key={collectionNode.collection.id} className="space-y-1">
                                {/* Collection Level */}
                                <div className="flex items-center p-2 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <button
                                    onClick={() => toggleCollectionExpanded(projectNode.project.id, collectionNode.collection.id)}
                                    className="mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    <svg
                                      className={`w-4 h-4 transition-transform ${collectionNode.expanded ? 'rotate-90' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                  <label className="flex items-center flex-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={collectionNode.visible}
                                      onChange={() => toggleCollection(projectNode.project.id, collectionNode.collection.id)}
                                      className="w-4 h-4 mr-2 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                                      disabled={!projectNode.visible}
                                    />
                                    <div
                                      className="w-3 h-3 mr-2 rounded-full"
                                      style={{ backgroundColor: collectionNode.visible ? markerColor : '#9ca3af' }}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-200">
                                      {collectionNode.collection.name}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                      ({collectionNode.points.length})
                                    </span>
                                  </label>
                                </div>

                                {/* Points Level */}
                                {collectionNode.expanded && collectionNode.points.length > 0 && (
                                  <div className="ml-6 space-y-0.5">
                                    {collectionNode.points.map((point) => (
                                      <div
                                        key={point.id}
                                        className="flex items-center p-1.5 pl-8 text-xs text-gray-600 transition-colors rounded hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                                      >
                                        <svg className="w-3 h-3 mr-2" fill={markerColor} viewBox="0 0 24 24">
                                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                        </svg>
                                        <span className="truncate">{point.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {projectTree.length === 0 && !loading && (
              <div className="p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay proyectos disponibles
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Panel */}
      {!publicMode && isEditMode && editingEntity && (
        <div className="absolute z-10 w-80 bg-white border border-gray-200 rounded-lg shadow-xl top-4 right-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              Editar {editingEntity.type === 'point' ? 'Punto' : 'Polígono'}
            </h3>
            <button
              onClick={cancelEdit}
              className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {/* Nombre */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                type="text"
                value={editingEntity.data.name}
                onChange={(e) => setEditingEntity({
                  ...editingEntity,
                  data: { ...editingEntity.data, name: e.target.value }
                })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <textarea
                value={editingEntity.data.description || ''}
                onChange={(e) => setEditingEntity({
                  ...editingEntity,
                  data: { ...editingEntity.data, description: e.target.value }
                })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Categoría
              </label>
              <input
                type="text"
                value={editingEntity.data.category || ''}
                onChange={(e) => setEditingEntity({
                  ...editingEntity,
                  data: { ...editingEntity.data, category: e.target.value }
                })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                Dirección
              </label>
              <input
                type="text"
                value={editingEntity.data.address || ''}
                onChange={(e) => setEditingEntity({
                  ...editingEntity,
                  data: { ...editingEntity.data, address: e.target.value }
                })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Coordenadas (solo para puntos) */}
            {editingEntity.type === 'point' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingEntity.data.latitude || 0}
                    onChange={(e) => setEditingEntity({
                      ...editingEntity,
                      data: { ...editingEntity.data, latitude: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingEntity.data.longitude || 0}
                    onChange={(e) => setEditingEntity({
                      ...editingEntity,
                      data: { ...editingEntity.data, longitude: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Instrucciones para polígonos */}
            {editingEntity.type === 'polygon' && (
              <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 Arrastra los puntos azules en el mapa para modificar el polígono
                </p>
              </div>
            )}

            {/* Instrucciones para puntos */}
            {editingEntity.type === 'point' && (
              <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 Arrastra el marcador en el mapa para cambiar su posición
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={saveEditedEntity}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
              >
                Guardar Cambios
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
