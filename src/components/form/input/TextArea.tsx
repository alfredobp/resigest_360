import React from "react";

interface TextareaProps {
  id?: string;
  name?: string;
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (value: string) => void; // Change handler
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void; // Blur handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  required?: boolean; // Required state
  error?: boolean; // Error state
  hint?: string; // Hint text to display
}

const TextArea: React.FC<TextareaProps> = ({
  id,
  name,
  placeholder = "Enter your message", // Default placeholder
  rows = 3, // Default number of rows
  value = "", // Default value
  onChange, // Callback for changes
  onBlur,
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  required = false,
  error = false, // Error state
  hint = "", // Default hint text
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden ${className}`;

  if (disabled) {
    textareaClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` bg-transparent text-error-800 border-error-500 focus:border-error-500 focus:ring-3 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500`;
  } else {
    textareaClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        className={textareaClasses}
      />
      {(hint || error) && (
        <p
          className={`mt-1.5 text-xs flex items-center gap-1 ${
            error ? "text-error-500 font-medium" : "text-gray-500 dark:text-gray-400"
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

export default TextArea;
