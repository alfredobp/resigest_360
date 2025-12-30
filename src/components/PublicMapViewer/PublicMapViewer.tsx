"use client";
import React, { useEffect, useState } from 'react';
import { publishedMapService, PublishedMap } from '@/services/publishedMapService';
import { MapCollection, SpatialData } from '@/services/projectService';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

interface PublicMapViewerProps {
  slug: string;
}

export default function PublicMapViewer({ slug }: PublicMapViewerProps) {
  const [map, setMap] = useState<PublishedMap | null>(null);
  const [collections, setCollections] = useState<MapCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCollectionIds, setVisibleCollectionIds] = useState<number[]>([]);

  useEffect(() => {
    loadMapData();
  }, [slug]);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const mapData = await publishedMapService.getMapBySlug(slug);
      
      if (!mapData) {
        setError('Mapa no encontrado o no disponible públicamente');
        setLoading(false);
        return;
      }

      setMap(mapData);

      // Cargar colecciones con datos espaciales
      const collectionsData = await publishedMapService.getMapCollectionsWithData(mapData.collection_ids);
      setCollections(collectionsData);
      
      // Por defecto, todas las colecciones visibles
      setVisibleCollectionIds(mapData.collection_ids);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading map:', err);
      setError('Error al cargar el mapa');
      setLoading(false);
    }
  };

  const toggleCollection = (collectionId: number) => {
    setVisibleCollectionIds(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-300 rounded-full border-t-brand-500 animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  if (error || !map) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
          <div className="text-6xl mb-4">🗺️</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Mapa no encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'Este mapa no existe o no está disponible públicamente'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-700">
        <div className="px-6 py-3">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {map.name}
          </h1>
          {map.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {map.description}
            </p>
          )}
        </div>
      </div>

      {/* Layer Toggle Panel */}
      {map.allow_layer_toggle && collections.length > 0 && (
        <div className="absolute top-24 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 max-w-xs">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              Capas del Mapa
            </h3>
          </div>
          <div className="p-3 max-h-96 overflow-y-auto">
            {collections.map(collection => (
              <label key={collection.id} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2">
                <input
                  type="checkbox"
                  checked={visibleCollectionIds.includes(collection.id)}
                  onChange={() => toggleCollection(collection.id)}
                  className="w-4 h-4"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: collection.color || '#3B82F6' }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {collection.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({collection.spatial_data?.length || 0})
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {map.show_legend && collections.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-3">
          <h3 className="text-xs font-semibold text-gray-800 dark:text-white mb-2">
            Leyenda
          </h3>
          <div className="space-y-1">
            {collections
              .filter(c => visibleCollectionIds.includes(c.id))
              .map(collection => (
                <div key={collection.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: collection.color || '#3B82F6' }}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {collection.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-full w-full pt-20">
        <Map
          collections={collections.filter(c => visibleCollectionIds.includes(c.id))}
          initialCenter={[map.center_lng, map.center_lat]}
          initialZoom={map.zoom}
          baseLayer={map.base_layer}
          publicMode={true}
        />
      </div>

      {/* Powered By */}
      <div className="absolute bottom-4 right-4 z-10 px-3 py-1 bg-white/90 backdrop-blur-sm rounded text-xs text-gray-500 dark:bg-gray-900/90 dark:text-gray-400">
        Powered by Quantia Maps
      </div>
    </div>
  );
}
