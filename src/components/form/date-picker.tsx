import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { CalenderIcon } from '../../icons';
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

// Configurar el idioma español por defecto
flatpickr.localize(Spanish);

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  minDate?: DateOption;
  label?: string;
  placeholder?: string;
  error?: boolean;
  hint?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  minDate,
  placeholder,
  error = false,
  hint,
}: PropsType) {
  const onChangeRef = useRef(onChange);
  const defaultDateRef = useRef(defaultDate);

  useEffect(() => {
    onChangeRef.current = onChange;
    defaultDateRef.current = defaultDate;
  }, [onChange, defaultDate]);

  const defaultDateKey =
    defaultDate instanceof Date
      ? defaultDate.getTime()
      : Array.isArray(defaultDate)
        ? defaultDate.map((d) => (d instanceof Date ? d.getTime() : String(d))).join(',')
        : String(defaultDate ?? '');

  const minDateKey = minDate instanceof Date ? minDate.getTime() : String(minDate ?? '');

  useEffect(() => {
    const stableOnChange: Hook = (selectedDates, dateStr, instance) => {
      const handler = onChangeRef.current;
      if (typeof handler === 'function') {
        handler(selectedDates, dateStr, instance);
      } else if (Array.isArray(handler)) {
        handler.forEach((fn) => fn(selectedDates, dateStr, instance));
      }
    };

    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: defaultDateRef.current,
      minDate: minDate || undefined,
      onChange: stableOnChange,
    });

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [mode, id, defaultDateKey, minDateKey, minDate]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          aria-invalid={error ? "true" : undefined}
          className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:placeholder:text-white/30 ${
            error
              ? "bg-error-50/30 text-error-900 border-error-500 ring-1 ring-error-500/50 focus:border-error-500 focus:ring-error-500/20 dark:bg-error-950/30 dark:text-error-300 dark:border-error-500"
              : "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
          }`}
        />

        <span className={`absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 ${error ? "text-error-500" : "text-gray-500 dark:text-gray-400"}`}>
          <CalenderIcon className="size-6" />
        </span>
      </div>
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-error-500 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
