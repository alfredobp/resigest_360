'use client';

import React, { useMemo } from 'react';
import {
  getPrioritizedOperations,
  normalizeOperationCode,
} from '@/lib/validations/treatmentOperations';

interface TreatmentOperationSelectorProps {
  id?: string;
  name?: string;
  value?: string;
  onChange: (value: string) => void;
  codigoLer?: string | null;
  contractOps?: string[] | null;
  authorizedOps?: string[] | null;
  disabled?: boolean;
  error?: boolean;
  compact?: boolean;
  showHint?: boolean;
}

export default function TreatmentOperationSelector({
  id,
  name,
  value,
  onChange,
  codigoLer,
  contractOps,
  authorizedOps,
  disabled = false,
  error = false,
  compact = false,
  showHint = true,
}: TreatmentOperationSelectorProps) {
  const normalizedValue = normalizeOperationCode(value);

  const prioritized = useMemo(
    () => getPrioritizedOperations({ codigoLer, contractOps, authorizedOps }),
    [codigoLer, contractOps, authorizedOps]
  );

  const isKnown = useMemo(() => {
    if (!normalizedValue) return true;
    const all = [
      ...prioritized.fromContract,
      ...prioritized.fromAuthorization,
      ...prioritized.recoveryOperations,
      ...prioritized.disposalOperations,
    ];
    return all.some((op) => op.code === normalizedValue);
  }, [normalizedValue, prioritized]);

  const isDisposal = normalizedValue.startsWith('D');

  return (
    <div>
      <select
        id={id}
        name={name}
        value={normalizedValue}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${compact ? 'h-10 px-2.5' : 'h-11 px-3.5'} w-full rounded-lg border bg-white dark:bg-dark text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-60 ${
          error ? 'border-error-500' : 'border-stroke dark:border-strokedark'
        }`}
      >
        <option value="">Selecciona operación R/D...</option>

        {!isKnown && normalizedValue && (
          <option value={normalizedValue}>{normalizedValue} (Personalizada)</option>
        )}

        {prioritized.fromContract.length > 0 && (
          <optgroup label="★ Del Contrato Seleccionado">
            {prioritized.fromContract.map((op) => (
              <option key={`ct-${op.code}`} value={op.code}>
                {op.code} — {op.label}
              </option>
            ))}
          </optgroup>
        )}

        {prioritized.fromAuthorization.length > 0 && (
          <optgroup label="✓ Autorizadas por el Gestor Destino">
            {prioritized.fromAuthorization.map((op) => (
              <option key={`auth-${op.code}`} value={op.code}>
                {op.code} — {op.label}
              </option>
            ))}
          </optgroup>
        )}

        {prioritized.suggestedByLer.length > 0 && (
          <optgroup
            label={
              codigoLer
                ? `Sugeridas para LER ${codigoLer.trim()} (orientativo)`
                : 'Operaciones habituales (orientativo)'
            }
          >
            {prioritized.suggestedByLer.map((op) => (
              <option key={`sug-${op.code}`} value={op.code}>
                {op.code} — {op.label}
              </option>
            ))}
          </optgroup>
        )}

        <optgroup label="Valorización (R01–R13 · Anexo II Ley 7/2022)">
          {prioritized.recoveryOperations.map((op) => (
            <option key={`r-${op.code}`} value={op.code}>
              {op.code} — {op.label}
            </option>
          ))}
        </optgroup>

        <optgroup label="Eliminación (D01–D15 · Anexo III — exige NT)">
          {prioritized.disposalOperations.map((op) => (
            <option key={`d-${op.code}`} value={op.code}>
              {op.code} — {op.label}
            </option>
          ))}
        </optgroup>
      </select>

      {showHint && (
        <div className="mt-1 space-y-0.5">
          {isDisposal && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              Operación de eliminación ({normalizedValue}): requiere Notificación Previa (Art. 3.2 RD 553/2020).
            </p>
          )}
          {codigoLer && (
            <p className="text-[11px] text-muted">{prioritized.suggestionReason}</p>
          )}
        </div>
      )}
    </div>
  );
}
