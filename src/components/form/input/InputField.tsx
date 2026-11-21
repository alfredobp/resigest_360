import React, { type FC } from "react";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number | string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string; // Optional hint text
  list?: string;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  className = "",
  min,
  max,
  step,
  disabled = false,
  readOnly = false,
  required = false,
  success = false,
  error = false,
  hint,
  list,
}) => {
  const isDateOrTime = type === "date" || type === "time";

  // Determine input styles based on state (Precisión Industrial)
  let inputClasses = `h-9.5 w-full rounded-md border ${isDateOrTime ? "" : "appearance-none"} px-3 py-1.5 text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.03)] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 dark:bg-[#0d1321] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-600 transition-colors ${className}`;

  // Add styles for the different states
  if (disabled) {
    inputClasses += ` bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700`;
  } else if (readOnly) {
    inputClasses += ` bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 cursor-default`;
  } else if (error) {
    inputClasses += ` bg-error-50/30 text-error-900 border-error-500 ring-1 ring-error-500/40 focus:border-error-500 focus:ring-2 focus:ring-error-500/20 dark:bg-error-950/30 dark:text-error-300 dark:border-error-500 dark:focus:border-error-400`;
  } else if (success) {
    inputClasses += ` text-success-600 border-success-400 focus:ring-success-500/15 focus:border-success-500 dark:text-success-400 dark:border-success-500`;
  } else {
    inputClasses += ` bg-white text-slate-900 border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-[#0d1321] dark:text-slate-100 dark:focus:border-brand-500`;
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (isDateOrTime && !disabled && !readOnly) {
      try {
        e.currentTarget.showPicker?.();
      } catch {
        // Ignorar si el navegador no soporta showPicker o lanza excepción
      }
    }
  };

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        onClick={handleClick}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        list={list}
        aria-invalid={error ? "true" : undefined}
        aria-required={required ? "true" : undefined}
        className={inputClasses}
      />

      {/* Mensaje de validación / Hint Text */}
      {(hint || error) && (
        <p
          className={`mt-1.5 text-xs flex items-center gap-1 ${
            error
              ? "text-error-500 font-medium"
              : success
              ? "text-success-500"
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
          <span>{hint || (required ? "Este campo es requerido" : "Entrada no válida")}</span>
        </p>
      )}
    </div>
  );
};

export default Input;
