'use client';

import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import Label from '@/components/form/Label';
import {
  SPAIN_PROVINCES,
  getMunicipalitiesByProvince,
  normalizeProvinceName,
  normalizeLocationText,
  resolveProvinceChange,
  resolveMunicipalityChange,
} from '@/lib/validations/spainLocations';
import { ChevronDown, Check, Search, MapPin, X } from 'lucide-react';

export interface ProvinceMunicipalityFieldsProps {
  provincia: string;
  municipio: string;
  onChange: (next: { provincia: string; municipio: string }) => void;
  provinciaId?: string;
  municipioId?: string;
  provinciaName?: string;
  municipioName?: string;
  provinciaLabel?: string;
  municipioLabel?: string;
  provinciaPlaceholder?: string;
  municipioPlaceholder?: string;
  provinciaRequired?: boolean;
  municipioRequired?: boolean;
  provinciaError?: boolean;
  municipioError?: boolean;
  provinciaHint?: string;
  municipioHint?: string;
  provinciaBadge?: React.ReactNode;
  disabled?: boolean;
  order?: 'provincia-first' | 'municipio-first';
  unstyledWrapper?: boolean;
  wrapperClassName?: string;
  provinciaWrapperClassName?: string;
  municipioWrapperClassName?: string;
}

export const ProvinceMunicipalityFields: React.FC<ProvinceMunicipalityFieldsProps> = ({
  provincia,
  municipio,
  onChange,
  provinciaId,
  municipioId,
  provinciaName = 'provincia',
  municipioName = 'municipio',
  provinciaLabel = 'Provincia',
  municipioLabel = 'Municipio',
  provinciaPlaceholder = 'Selecciona provincia...',
  municipioPlaceholder,
  provinciaRequired = false,
  municipioRequired = false,
  provinciaError = false,
  municipioError = false,
  provinciaHint,
  municipioHint,
  provinciaBadge,
  disabled = false,
  order = 'provincia-first',
  unstyledWrapper = false,
  wrapperClassName = 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  provinciaWrapperClassName = '',
  municipioWrapperClassName = '',
}) => {
  const reactId = useId();
  const provInputId = provinciaId || `prov_${reactId}`;
  const muniInputId = municipioId || `muni_${reactId}`;

  // Estados de dropdowns
  const [provOpen, setProvOpen] = useState(false);
  const [provFilter, setProvFilter] = useState('');

  const [muniOpen, setMuniOpen] = useState(false);
  const [muniInputText, setMuniInputText] = useState(municipio || '');

  const provContainerRef = useRef<HTMLDivElement>(null);
  const muniContainerRef = useRef<HTMLDivElement>(null);
  const provSearchInputRef = useRef<HTMLInputElement>(null);
  const muniInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar texto interno con prop
  useEffect(() => {
    setMuniInputText(municipio || '');
  }, [municipio]);

  // Click fuera para cerrar dropdowns
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (provContainerRef.current && !provContainerRef.current.contains(e.target as Node)) {
        setProvOpen(false);
        setProvFilter('');
      }
      if (muniContainerRef.current && !muniContainerRef.current.contains(e.target as Node)) {
        setMuniOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Foco al input de búsqueda de provincia al abrir
  useEffect(() => {
    if (provOpen && provSearchInputRef.current) {
      provSearchInputRef.current.focus();
    }
  }, [provOpen]);

  // Provincia canónica normalizada
  const canonicalProv = useMemo(() => normalizeProvinceName(provincia), [provincia]);
  const currentProvValue = canonicalProv || provincia || '';

  // Municipios disponibles para la provincia seleccionada
  const rawMunicipalities = useMemo(
    () => getMunicipalitiesByProvince(currentProvValue),
    [currentProvValue]
  );

  // Lista de provincias filtrada en el buscador
  const filteredProvinces = useMemo(() => {
    const q = normalizeLocationText(provFilter);
    if (!q) return SPAIN_PROVINCES;
    return SPAIN_PROVINCES.filter(
      (p) =>
        normalizeLocationText(p.name).includes(q) ||
        p.code.includes(q)
    );
  }, [provFilter]);

  // Lista de municipios filtrada según lo que se va tecleando
  const filteredMunicipalities = useMemo(() => {
    const q = normalizeLocationText(muniInputText);
    if (!q) {
      return rawMunicipalities.slice(0, 50);
    }
    return rawMunicipalities
      .filter((m) => normalizeLocationText(m).includes(q))
      .slice(0, 50);
  }, [rawMunicipalities, muniInputText]);

  // Manejadores
  const selectProvince = (provName: string) => {
    const resolved = resolveProvinceChange(provName, municipio);
    onChange(resolved);
    setProvOpen(false);
    setProvFilter('');
  };

  const clearProvince = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(resolveProvinceChange('', municipio));
  };

  const handleMuniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMuniInputText(val);
    setMuniOpen(true);
    const resolved = resolveMunicipalityChange(val, currentProvValue);
    onChange(resolved);
  };

  const selectMunicipality = (muniName: string) => {
    setMuniInputText(muniName);
    const resolved = resolveMunicipalityChange(muniName, currentProvValue);
    onChange(resolved);
    setMuniOpen(false);
  };

  const clearMunicipality = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuniInputText('');
    onChange(resolveMunicipalityChange('', currentProvValue));
    if (muniInputRef.current) muniInputRef.current.focus();
  };

  const effectiveMuniPlaceholder =
    municipioPlaceholder ||
    (currentProvValue
      ? `Buscar municipio en ${currentProvValue}...`
      : 'Escribe o busca municipio...');

  // Estilos de botones y controles consistentes con ResiGest
  const getButtonBorder = (hasError: boolean, isOpen: boolean) => {
    if (disabled) {
      return 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700';
    }
    if (hasError) {
      return 'border-error-500 bg-error-50/20 text-error-900 ring-2 ring-error-500/20 dark:bg-error-950/20 dark:text-error-300';
    }
    if (isOpen) {
      return 'border-brand-500 ring-2 ring-brand-500/20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white';
    }
    return 'border-gray-300 hover:border-gray-400 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 dark:border-gray-700';
  };

  /* ================= CAMPO PROVINCIA ================= */
  const provinciaField = (
    <div className={`relative ${provinciaWrapperClassName}`} ref={provContainerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor={provInputId} required={provinciaRequired} className="mb-0">
          {provinciaLabel}
        </Label>
        {provinciaBadge}
      </div>

      <input type="hidden" name={provinciaName} value={currentProvValue} />

      <button
        id={provInputId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setProvOpen(!provOpen);
            setMuniOpen(false);
          }
        }}
        className={`w-full h-11 px-3.5 flex items-center justify-between rounded-xl border text-sm transition-all shadow-theme-xs ${getButtonBorder(
          provinciaError,
          provOpen
        )}`}
        aria-haspopup="listbox"
        aria-expanded={provOpen}
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          {currentProvValue ? (
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {currentProvValue}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">
              {provinciaPlaceholder}
            </span>
          )}
        </span>

        <span className="flex items-center gap-1 shrink-0 ml-2">
          {currentProvValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearProvince}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              title="Borrar provincia"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              provOpen ? 'rotate-180 text-brand-600' : ''
            }`}
          />
        </span>
      </button>

      {/* Popover / Menú desplegable elegante para Provincias */}
      {provOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/90">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={provSearchInputRef}
                type="text"
                value={provFilter}
                onChange={(e) => setProvFilter(e.target.value)}
                placeholder="Buscar provincia (ej: Sevilla, 41)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-1.5 px-1 divide-y divide-gray-50 dark:divide-gray-800/50 scrollbar-thin"
          >
            {filteredProvinces.length === 0 ? (
              <li className="p-3 text-xs text-center text-gray-400">
                No se encontró ninguna provincia
              </li>
            ) : (
              filteredProvinces.map((p) => {
                const isSelected = currentProvValue === p.name;
                return (
                  <li key={p.code}>
                    <button
                      type="button"
                      onClick={() => selectProvince(p.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-brand-50 text-brand-900 font-semibold dark:bg-brand-950/40 dark:text-brand-300'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500 w-5">
                          {p.code}
                        </span>
                        <span>{p.name}</span>
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {(provinciaHint || provinciaError) && (
        <p
          className={`mt-1.5 text-xs flex items-center gap-1 ${
            provinciaError ? 'text-error-500 font-medium' : 'text-gray-500'
          }`}
        >
          {provinciaHint}
        </p>
      )}
    </div>
  );

  /* ================= CAMPO MUNICIPIO ================= */
  const municipioField = (
    <div className={`relative ${municipioWrapperClassName}`} ref={muniContainerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor={muniInputId} required={municipioRequired} className="mb-0">
          {municipioLabel}
        </Label>
      </div>

      <div className="relative">
        <input
          ref={muniInputRef}
          id={muniInputId}
          name={municipioName}
          type="text"
          value={muniInputText}
          onChange={handleMuniChange}
          onFocus={() => {
            if (!disabled) {
              setMuniOpen(true);
              setProvOpen(false);
            }
          }}
          placeholder={effectiveMuniPlaceholder}
          disabled={disabled}
          required={municipioRequired}
          autoComplete="off"
          className={`w-full h-11 pl-3.5 pr-8 rounded-xl border text-sm transition-all shadow-theme-xs ${getButtonBorder(
            municipioError,
            muniOpen
          )}`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {muniInputText && !disabled && (
            <button
              type="button"
              onClick={clearMunicipality}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-md"
              title="Borrar municipio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            onClick={() => {
              if (!disabled) {
                setMuniOpen(!muniOpen);
                if (muniInputRef.current) muniInputRef.current.focus();
              }
            }}
            className={`w-4 h-4 text-gray-400 cursor-pointer transition-transform duration-200 ${
              muniOpen ? 'rotate-180 text-brand-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Popover / Menú desplegable elegante para Municipios */}
      {muniOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {currentProvValue
                ? `Localidades en ${currentProvValue}`
                : 'Sugerencias de localidades'}
            </span>
            <span>{filteredMunicipalities.length} resultados</span>
          </div>

          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-1.5 px-1 divide-y divide-gray-50 dark:divide-gray-800/50 scrollbar-thin"
          >
            {filteredMunicipalities.length === 0 ? (
              <li className="p-3 text-xs text-center text-gray-400">
                {muniInputText
                  ? `Puedes usar "${muniInputText}" como localidad libre`
                  : 'No se encontraron resultados'}
              </li>
            ) : (
              filteredMunicipalities.map((muni) => {
                const isSelected =
                  normalizeLocationText(muni) === normalizeLocationText(muniInputText);
                return (
                  <li key={muni}>
                    <button
                      type="button"
                      onClick={() => selectMunicipality(muni)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-brand-50 text-brand-900 font-semibold dark:bg-brand-950/40 dark:text-brand-300'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span>{muni}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {(municipioHint || municipioError) && (
        <p
          className={`mt-1.5 text-xs flex items-center gap-1 ${
            municipioError ? 'text-error-500 font-medium' : 'text-gray-500'
          }`}
        >
          {municipioHint}
        </p>
      )}
    </div>
  );

  const orderedFields =
    order === 'provincia-first' ? (
      <>
        {provinciaField}
        {municipioField}
      </>
    ) : (
      <>
        {municipioField}
        {provinciaField}
      </>
    );

  if (unstyledWrapper) {
    return orderedFields;
  }

  return <div className={wrapperClassName}>{orderedFields}</div>;
};

export default ProvinceMunicipalityFields;
