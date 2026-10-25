import React, { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  name?: string;
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: boolean; // Added
  hint?: string;   // Added
}

const Select: React.FC<SelectProps> = ({
  id,
  name,
  options,
  placeholder = "Seleccionar una opción",
  onChange,
  onBlur,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
  required = false,
  error = false,
  hint,
}) => {
  const [internalValue, setInternalValue] = useState<string>(value !== undefined ? value : defaultValue);

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  React.useEffect(() => {
    if (value === undefined && defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, value]);

  const currentVal = value !== undefined ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    if (value === undefined) {
      setInternalValue(newVal);
    }
    onChange(newVal);
  };

  // Base classes
  let selectClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    selectClasses += ` opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800/60 pointer-events-none`;
  }

  // Error state classes vs Normal state
  if (error) {
    selectClasses += ` bg-error-50/30 text-error-900 border-error-500 ring-1 ring-error-500/50 focus:border-error-500 focus:ring-3 focus:ring-error-500/20 dark:bg-error-950/30 dark:text-error-300 dark:border-error-500 dark:focus:border-error-400`;
  } else {
    selectClasses += ` border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 ${currentVal
        ? "text-gray-800 dark:text-white/90"
        : "text-gray-400 dark:text-gray-400"
      }`;
  }

  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        className={selectClasses}
        value={currentVal}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-required={required ? "true" : undefined}
      >
        <option value="" disabled className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            {option.label}
          </option>
        ))}
      </select>

      {/* Hint Text / Error Message */}
      {(hint || error) && (
        <p
          className={`mt-1.5 text-xs flex items-center gap-1 ${
            error
              ? "text-error-500 font-medium"
              : "text-gray-500"
          }`}
        >
          {error && (
            <svg
              className="w-3.5 h-3.5 flex-shrink-0 text-error-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
          <span>{hint || (required ? "Este campo es requerido" : "Opción no válida")}</span>
        </p>
      )}
    </div>
  );
};

export default Select;
