'use client';

import { useState, useCallback } from 'react';
import {
  validateForm,
  scrollToFirstError,
  type FormValidationSchema,
} from '@/lib/validations/formValidation';

export interface UseFormValidationOptions<T extends Record<string, any>> {
  schema: FormValidationSchema<T>;
  initialValues: T;
}

/**
 * Hook para gestionar la validación controlada de formularios sin depender
 * de la validación HTML5 nativa del navegador.
 */
export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
}: UseFormValidationOptions<T>) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  /**
   * Actualiza el valor de un campo y limpia su error si ya es válido
   */
  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Si el campo ya tiene error o fue tocado, revalidar este campo específico
      if (errors[field] || touched[field]) {
        const rules = schema[field];
        if (rules) {
          let fieldError: string | null = null;
          const next = { ...formData, [field]: value };
          for (const rule of rules) {
            const err = rule(value, next);
            if (err) {
              fieldError = err;
              break;
            }
          }
          setErrors((prevErrors) => {
            if (fieldError) {
              return { ...prevErrors, [field]: fieldError };
            }
            const { [field]: _, ...rest } = prevErrors;
            return rest as Partial<Record<keyof T, string>>;
          });
        }
      }
    },
    [errors, touched, schema, formData]
  );

  /**
   * Marca un campo como tocado y valida su contenido (típicamente en onBlur)
   */
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      const rules = schema[field];
      if (rules) {
        let fieldError: string | null = null;
        for (const rule of rules) {
          const err = rule(formData[field], formData);
          if (err) {
            fieldError = err;
            break;
          }
        }
        setErrors((prevErrors) => {
          if (fieldError) {
            return { ...prevErrors, [field]: fieldError };
          }
          const { [field]: _, ...rest } = prevErrors;
          return rest as Partial<Record<keyof T, string>>;
        });
      }
    },
    [formData, schema]
  );

  /**
   * Valida todo el formulario (ej: en onSubmit).
   * Retorna true si es válido o false si hay errores.
   */
  const validate = useCallback((prefix?: string): boolean => {
    const result = validateForm(formData, schema);
    setErrors(result.errors);

    // Marcar todos los campos con error como tocados
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key in schema) {
      allTouched[key as keyof T] = true;
    }
    setTouched(allTouched);

    if (!result.isValid) {
      scrollToFirstError(result.errors, prefix);
    }

    return result.isValid;
  }, [formData, schema]);

  /**
   * Limpia todos los errores y estados tocados
   */
  const resetValidation = useCallback(
    (newValues?: T) => {
      setFormData(newValues ?? initialValues);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  /**
   * Retorna props listos para pasar a InputField / Select / TextArea
   */
  const getFieldProps = useCallback(
    (field: keyof T) => {
      const hasError = Boolean(errors[field]);
      return {
        value: formData[field] !== undefined ? formData[field] : '',
        error: hasError,
        hint: errors[field],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | string) => {
          const val = typeof e === 'string' ? e : e?.target?.value;
          setFieldValue(field, val);
        },
        onBlur: () => handleBlur(field),
      };
    },
    [formData, errors, setFieldValue, handleBlur]
  );

  return {
    formData,
    setFormData,
    setFieldValue,
    errors,
    setErrors,
    touched,
    handleBlur,
    validate,
    resetValidation,
    getFieldProps,
  };
}

export default useFormValidation;
