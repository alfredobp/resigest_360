"use client";
import React, { useState } from 'react';
import { SpatialData } from '@/services/projectService';

interface PolygonDrawerProps {
  onSave: (coordinates: number[][]) => void;
  onCancel?: () => void;
  initialCoordinates?: number[][];
}

export default function PolygonDrawer({ onSave, onCancel, initialCoordinates = [] }: PolygonDrawerProps) {
  const [coordinates, setCoordinates] = useState<number[][]>(
    initialCoordinates.length > 0 ? initialCoordinates : []
  );
  const [currentLat, setCurrentLat] = useState('');
  const [currentLng, setCurrentLng] = useState('');

  const addPoint = () => {
    const lat = parseFloat(currentLat);
    const lng = parseFloat(currentLng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates([...coordinates, [lng, lat]]);
      setCurrentLat('');
      setCurrentLng('');
    }
  };

  const removePoint = (index: number) => {
    setCoordinates(coordinates.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (coordinates.length < 3) {
      alert('Un polígono necesita al menos 3 puntos');
      return;
    }
    
    // Close the polygon by adding first point at the end if not already closed
    const closedCoords = [...coordinates];
    const first = closedCoords[0];
    const last = closedCoords[closedCoords.length - 1];
    
    if (first[0] !== last[0] || first[1] !== last[1]) {
      closedCoords.push([...first]);
    }
    
    onSave(closedCoords);
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
      <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
        Definir Polígono
      </h4>
      
      {/* Add Point Form */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <input
          type="number"
          step="0.000001"
          value={currentLat}
          onChange={(e) => setCurrentLat(e.target.value)}
          placeholder="Latitud"
          className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
        />
        <input
          type="number"
          step="0.000001"
          value={currentLng}
          onChange={(e) => setCurrentLng(e.target.value)}
          placeholder="Longitud"
          className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
        />
        <button
          onClick={addPoint}
          className="px-3 py-1 text-xs font-medium text-white transition-colors rounded bg-brand-500 hover:bg-brand-600"
        >
          + Punto
        </button>
      </div>

      {/* Points List */}
      {coordinates.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Puntos del polígono ({coordinates.length}):
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {coordinates.map((coord, index) => (
              <div key={index} className="flex items-center justify-between p-2 text-xs bg-gray-50 rounded dark:bg-gray-800">
                <span className="text-gray-700 dark:text-gray-300">
                  #{index + 1}: [{coord[1].toFixed(6)}, {coord[0].toFixed(6)}]
                </span>
                <button
                  onClick={() => removePoint(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={coordinates.length < 3}
          className="px-3 py-1 text-xs font-medium text-white transition-colors rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Guardar Polígono
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs font-medium text-gray-700 transition-colors bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
          >
            Cancelar
          </button>
        )}
      </div>
      
      {coordinates.length < 3 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Agrega al menos 3 puntos para formar un polígono
        </p>
      )}
    </div>
  );
}
