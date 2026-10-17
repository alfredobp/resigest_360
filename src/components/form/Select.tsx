import React, { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  error?: boolean; // Added
  hint?: string;   // Added
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Seleccionar una opción",
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
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
    selectClasses += ` text-error-800 border-error-500 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500`;
  } else {
    selectClasses += ` border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 ${currentVal
        ? "text-gray-800 dark:text-white/90"
        : "text-gray-400 dark:text-gray-400"
      }`;
  }

  return (
    <div className="relative">
      <select
        className={selectClasses}
        value={currentVal}
        onChange={handleChange}
        disabled={disabled}
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

      {/* Chevron Icon Customization (opcional, si quisieras) */}

      {/* Hint Text / Error Message */}
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Select;
