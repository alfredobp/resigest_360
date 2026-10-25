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
}) => {
  // Determine input styles based on state (disabled, success, error)
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`;

  // Add styles for the different states
  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (readOnly) {
    inputClasses += ` bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 cursor-default`;
  } else if (error) {
    inputClasses += ` bg-error-50/30 text-error-900 border-error-500 ring-1 ring-error-500/50 focus:border-error-500 focus:ring-3 focus:ring-error-500/20 dark:bg-error-950/30 dark:text-error-300 dark:border-error-500 dark:focus:border-error-400`;
  } else if (success) {
    inputClasses += ` text-success-500 border-success-400 focus:ring-success-500/10 focus:border-success-300  dark:text-success-400 dark:border-success-500`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

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
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={error ? "true" : undefined}
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
