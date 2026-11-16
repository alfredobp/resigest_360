'use client';

import React, { useMemo, useId } from 'react';
import Label from '@/components/form/Label';
import {
  SPAIN_PROVINCES,
  getMunicipalitiesByProvince,
  normalizeProvinceName,
  resolveProvinceChange,
  resolveMunicipalityChange,
} from '@/lib/validations/spainLocations';

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
  /**
   * 'provincia-first' muestra Provincia a la izquierda y Municipio a la derecha.
   * 'municipio-first' muestra Municipio a la izquierda y Provincia a la derecha.
   */
  order?: 'provincia-first' | 'municipio-first';
  /**
   * Si es true, no envuelve los dos campos en un grid propio sino que los devuelve
   * como fragmento (útil cuando el padre ya es un grid de 12 o 3 columnas).
   */
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
  order = 'municipio-first',
  unstyledWrapper = false,
  wrapperClassName = 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  provinciaWrapperClassName = '',
  municipioWrapperClassName = '',
}) => {
  const reactId = useId();
  const provInputId = provinciaId || `prov_${reactId}`;
  const muniInputId = municipioId || `muni_${reactId}`;
  const datalistId = `muni_list_${reactId}`;

  // Provincia canónica si coincide con el catálogo
  const canonicalProv = useMemo(() => normalizeProvinceName(provincia), [provincia]);

  // Opciones de municipios filtradas según la provincia seleccionada
  const availableMunicipalities = useMemo(
    () => getMunicipalitiesByProvince(canonicalProv || provincia),
    [canonicalProv, provincia]
  );

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextProv = e.target.value;
    const resolved = resolveProvinceChange(nextProv, municipio);
    onChange(resolved);
  };

  const handleMunicipalityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextMuni = e.target.value;
    const resolved = resolveMunicipalityChange(nextMuni, canonicalProv || provincia);
    onChange(resolved);
  };

  const effectiveMuniPlaceholder =
    municipioPlaceholder ||
    (canonicalProv ? `Municipio de ${canonicalProv}...` : 'Selecciona o escribe municipio...');

  // Clases compartidas coherentes con InputField y Select de ResiGest 360
  const getControlClasses = (hasError: boolean, hasValue: boolean) => {
    let base =
      'h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:placeholder:text-white/30';
    if (disabled) {
      base += ' text-gray-500 border-gray-300 cursor-not-allowed bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    } else if (hasError) {
      base +=
        ' bg-error-50/30 text-error-900 border-error-500 ring-1 ring-error-500/50 focus:border-error-500 focus:ring-3 focus:ring-error-500/20 dark:bg-error-950/30 dark:text-error-300 dark:border-error-500';
    } else {
      base += ` bg-transparent border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 ${
        hasValue ? 'text-gray-800 dark:text-white/90' : 'text-gray-500 dark:text-gray-400'
      }`;
    }
    return base;
  };

  // Incluir valor actual de provincia si fuese un valor legado no estándar
  const provinceOptions = useMemo(() => {
    const list = SPAIN_PROVINCES.map((p) => p.name);
    if (provincia && !canonicalProv && !list.includes(provincia)) {
      return [provincia, ...list];
    }
    return list;
  }, [provincia, canonicalProv]);

  const selectedProvinceValue = canonicalProv || provincia || '';

  const provinciaField = (
    <div className={provinciaWrapperClassName}>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor={provInputId} required={provinciaRequired} className="mb-0">
          {provinciaLabel}
        </Label>
        {provinciaBadge}
      </div>
      <div className="relative">
        <select
          id={provInputId}
          name={provinciaName}
          value={selectedProvinceValue}
          onChange={handleProvinceSelect}
          disabled={disabled}
          required={provinciaRequired}
          aria-invalid={provinciaError ? 'true' : undefined}
          aria-required={provinciaRequired ? 'true' : undefined}
          className={`${getControlClasses(provinciaError, Boolean(selectedProvinceValue))} appearance-none pr-10`}
        >
          <option value="">{provinciaPlaceholder}</option>
          {provinceOptions.map((provName) => (
            <option
              key={provName}
              value={provName}
              className="text-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {provName}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {(provinciaHint || provinciaError) && (
        <p
          className={`mt-1.5 text-xs flex items-center gap-1 ${
            provinciaError ? 'text-error-500 font-medium' : 'text-gray-500'
          }`}
        >
          {provinciaError && (
            <svg
              className="w-3.5 h-3.5 shrink-0 text-error-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{provinciaHint}</span>
        </p>
      )}
    </div>
  );

  const municipioField = (
    <div className={municipioWrapperClassName}>
      <div className="flex items-center justify-between mb-1.5">
        <Label htmlFor={muniInputId} required={municipioRequired} className="mb-0">
          {municipioLabel}
        </Label>
        {canonicalProv && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {availableMunicipalities.length} localidades
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          id={muniInputId}
          name={municipioName}
          list={datalistId}
          value={municipio || ''}
          onChange={handleMunicipalityInput}
          placeholder={effectiveMuniPlaceholder}
          disabled={disabled}
          required={municipioRequired}
          aria-invalid={municipioError ? 'true' : undefined}
          aria-required={municipioRequired ? 'true' : undefined}
          className={getControlClasses(municipioError, Boolean(municipio))}
        />
        <datalist id={datalistId}>
          {availableMunicipalities.map((muniName) => (
            <option key={muniName} value={muniName} />
          ))}
        </datalist>
      </div>
      {(municipioHint || municipioError) && (
        <p
          className={`mt-1.5 text-xs flex items-center gap-1 ${
            municipioError ? 'text-error-500 font-medium' : 'text-gray-500'
          }`}
        >
          {municipioError && (
            <svg
              className="w-3.5 h-3.5 shrink-0 text-error-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{municipioHint}</span>
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
