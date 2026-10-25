'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import wasteTypeService from '@/services/wasteTypeService';
import type { WasteType } from '@/types/wasteManagement';
import { Search, AlertTriangle, CheckCircle, ChevronDown, X } from 'lucide-react';

export interface LerSelectorProps {
  value?: string;
  onChange: (codigoLer: string, wasteType?: WasteType) => void;
  onSelectWasteType?: (wasteType: WasteType) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const LerSelector: React.FC<LerSelectorProps> = ({
  value = '',
  onChange,
  onSelectWasteType,
  placeholder = 'Buscar por código LER (ej: 15 01) o residuo (ej: cartón)...',
  disabled = false,
  required = false,
  error = false,
  hint,
  className = '',
  showDetails = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar catálogo de tipos de residuos
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    wasteTypeService
      .getAll()
      .then((data) => {
        if (mounted) {
          setWasteTypes(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error al cargar catálogo LER:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Encontrar el residuo seleccionado actual
  const selectedWaste = useMemo(() => {
    if (!value) return null;
    const norm = value.trim().replace(/\s+/g, ' ');
    return wasteTypes.find((w) => w.codigo_ler.trim().replace(/\s+/g, ' ') === norm) || null;
  }, [value, wasteTypes]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado reactivo en tiempo real
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) {
      return wasteTypes.slice(0, 40);
    }
    const q = searchQuery.toLowerCase().trim();
    return wasteTypes
      .filter(
        (w) =>
          w.codigo_ler.toLowerCase().includes(q) ||
          w.descripcion.toLowerCase().includes(q) ||
          (w.subcapitulo_titulo && w.subcapitulo_titulo.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [searchQuery, wasteTypes]);

  const handleSelect = (wt: WasteType) => {
    onChange(wt.codigo_ler, wt);
    if (onSelectWasteType) {
      onSelectWasteType(wt);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Botón / Input disparador del Selector */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        className={`flex items-center justify-between min-h-[42px] px-3 py-2 text-sm rounded-xl border transition-all cursor-pointer ${
          disabled
            ? 'opacity-60 bg-gray-100 dark:bg-gray-800 cursor-not-allowed border-gray-200 dark:border-gray-700'
            : error
            ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20 focus-within:ring-2 focus-within:ring-red-400'
            : isOpen
            ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-gray-900 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
          {selectedWaste ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                {selectedWaste.codigo_ler}
              </span>
              <span className="truncate text-xs text-gray-800 dark:text-gray-200" title={selectedWaste.descripcion}>
                {selectedWaste.descripcion}
              </span>
              {selectedWaste.peligroso || selectedWaste.codigo_ler.includes('*') ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5" /> Peligroso
                </span>
              ) : null}
            </div>
          ) : value ? (
            <span className="font-mono font-bold text-xs text-gray-800 dark:text-gray-200">{value}</span>
          ) : (
            <span className="text-gray-400 text-xs truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Borrar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        </div>
      </div>

      {/* Popover desplegable con buscador rápido */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Input de búsqueda */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código (15 01) o nombre (papel, aceite...)"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 px-1 text-[11px] text-gray-400">
              <span>{filteredList.length} residuos encontrados</span>
              <span>{wasteTypes.length} códigos en catálogo oficial</span>
            </div>
          </div>

          {/* Lista de resultados */}
          <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 flex-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-400">Cargando catálogo LER...</div>
            ) : filteredList.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                No se encontraron residuos con &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredList.map((wt) => {
                const isSelected = selectedWaste?.codigo_ler === wt.codigo_ler;
                const isPeligroso = wt.peligroso || wt.codigo_ler.includes('*') || wt.categoria === 'peligroso';

                return (
                  <button
                    key={wt.codigo_ler}
                    type="button"
                    onClick={() => handleSelect(wt)}
                    className={`w-full text-left p-2.5 transition flex flex-col gap-0.5 hover:bg-primary/5 dark:hover:bg-primary/10 ${
                      isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded">
                          {wt.codigo_ler}
                        </span>
                        {isPeligroso ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                            <AlertTriangle className="w-2.5 h-2.5" /> Peligroso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle className="w-2.5 h-2.5" /> No Peligroso
                          </span>
                        )}
                      </div>

                      {wt.subcapitulo_codigo && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                          Cap. {wt.capitulo_codigo || wt.subcapitulo_codigo}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed line-clamp-2 mt-0.5">
                      {wt.descripcion}
                    </p>

                    {wt.subcapitulo_titulo && (
                      <p className="text-[10px] text-gray-400 italic truncate">
                        {wt.subcapitulo_titulo}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Detalles expandidos informativos opcionales */}
      {showDetails && selectedWaste && (
        <div className="mt-2 p-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
            <span>Capítulo: {selectedWaste.capitulo_codigo || 'N/A'} - {selectedWaste.capitulo_titulo || 'General'}</span>
            <span>Estado habitual: <strong>{selectedWaste.estado}</strong></span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">{selectedWaste.descripcion}</p>
        </div>
      )}

      {/* Error o Hint */}
      {(hint || (error && required)) && (
        <p className={`mt-1 text-xs flex items-center gap-1.5 ${error ? 'text-error-500 font-medium' : 'text-gray-500'}`}>
          {error && (
            <svg className="w-3.5 h-3.5 inline shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{hint || (required ? 'Este campo es requerido' : 'Entrada no válida')}</span>
        </p>
      )}
    </div>
  );
};

export default LerSelector;
