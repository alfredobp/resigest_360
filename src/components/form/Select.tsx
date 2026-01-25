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
  error?: boolean; // Added
  hint?: string;   // Added
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  error = false,
  hint,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedValue(value);
    onChange(value);
  };

  // Base classes
  let selectClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:placeholder:text-white/30 ${className}`;

  // Error state classes vs Normal state
  if (error) {
    selectClasses += ` text-error-800 border-error-500 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500`;
  } else {
    selectClasses += ` border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 ${selectedValue
        ? "text-gray-800 dark:text-white/90"
        : "text-gray-400 dark:text-gray-400"
      }`;
  }

  return (
    <div className="relative">
      <select
        className={selectClasses}
        value={selectedValue}
        onChange={handleChange}
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
