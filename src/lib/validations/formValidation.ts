/**
 * =====================================================================
 * RESIGEST 360 - MOTOR DE VALIDACIÓN DE FORMULARIOS Y CAMPOS REQUERIDOS
 * =====================================================================
 * Proporciona validadores estandarizados y feedback visual por campo
 * eliminando la dependencia de la validación nativa del navegador HTML5.
 */

export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  REQUIRED_FIELD: (field: string) => `El campo ${field} es obligatorio`,
  CIF_INVALID: 'El formato del CIF/NIF/NIE no es válido (ej: B12345678 o 12345678Z)',
  NIMA_INVALID: 'El NIMA debe contener entre 10 y 12 caracteres alfanuméricos',
  EMAIL_INVALID: 'Introduce un correo electrónico válido',
  PHONE_INVALID: 'El teléfono debe contener entre 9 y 15 dígitos numéricos válidos',
  POSTAL_CODE_INVALID: 'El código postal debe tener 5 dígitos numéricos',
  DATE_RANGE_INVALID: 'La fecha de fin debe ser posterior a la fecha de inicio',
  SELECTION_REQUIRED: 'Debes seleccionar al menos una opción',
};

/**
 * Valida si un valor está presente y no está vacío.
 */
export function validateRequired(value: unknown, customMessage?: string): string | null {
  if (value === null || value === undefined) {
    return customMessage || VALIDATION_MESSAGES.REQUIRED;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return customMessage || VALIDATION_MESSAGES.REQUIRED;
  }

  if (Array.isArray(value) && value.length === 0) {
    return customMessage || VALIDATION_MESSAGES.SELECTION_REQUIRED;
  }

  return null;
}

/**
 * Valida el formato de un CIF / NIF / NIE español.
 */
export function validateCIF(cif: string, isRequired = true): string | null {
  const trimmed = (cif || '').trim().toUpperCase();

  if (!trimmed) {
    return isRequired ? VALIDATION_MESSAGES.REQUIRED : null;
  }

  // Regex para DNI/NIF (8 números + 1 letra), NIE (X, Y o Z + 7 números + 1 letra) y CIF (letra + 7 u 8 números/letras)
  const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/i;

  if (nifRegex.test(trimmed) || nieRegex.test(trimmed) || cifRegex.test(trimmed)) {
    return null;
  }

  return VALIDATION_MESSAGES.CIF_INVALID;
}

/**
 * Valida el formato del NIMA (Número de Identificación Medioambiental, 10-12 dígitos/letras).
 */
export function validateNIMA(nima: string, isRequired = false): string | null {
  const trimmed = (nima || '').trim();

  if (!trimmed) {
    return isRequired ? VALIDATION_MESSAGES.REQUIRED : null;
  }

  const nimaRegex = /^[A-Za-z0-9]{10,12}$/;
  if (!nimaRegex.test(trimmed)) {
    return VALIDATION_MESSAGES.NIMA_INVALID;
  }

  return null;
}

/**
 * Valida el formato de un email.
 */
export function validateEmail(email: string, isRequired = true): string | null {
  const trimmed = (email || '').trim();

  if (!trimmed) {
    return isRequired ? VALIDATION_MESSAGES.REQUIRED : null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return VALIDATION_MESSAGES.EMAIL_INVALID;
  }

  return null;
}

/**
 * Valida un teléfono español o internacional.
 */
export function validatePhone(phone: string, isRequired = false): string | null {
  const trimmed = (phone || '').trim();

  if (!trimmed) {
    return isRequired ? VALIDATION_MESSAGES.REQUIRED : null;
  }

  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}$/;
  if (!phoneRegex.test(trimmed)) {
    return VALIDATION_MESSAGES.PHONE_INVALID;
  }

  return null;
}

/**
 * Valida un código postal español (5 dígitos).
 */
export function validatePostalCode(cp: string, isRequired = false): string | null {
  const trimmed = (cp || '').trim();

  if (!trimmed) {
    return isRequired ? VALIDATION_MESSAGES.REQUIRED : null;
  }

  const cpRegex = /^[0-9]{5}$/;
  if (!cpRegex.test(trimmed)) {
    return VALIDATION_MESSAGES.POSTAL_CODE_INVALID;
  }

  return null;
}

/**
 * Valida que una fecha fin sea posterior a la fecha inicio.
 */
export function validateDateRange(startDate?: string, endDate?: string): string | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Fechas no válidas';
  }

  if (end <= start) {
    return VALIDATION_MESSAGES.DATE_RANGE_INVALID;
  }

  return null;
}

export type ValidationRule<T> = (value: any, formData: T) => string | null;
export type FormValidationSchema<T> = Partial<Record<keyof T, ValidationRule<T>[]>>;

/**
 * Motor genérico de validación de un formulario completo.
 * Retorna si el formulario es válido y un mapa de errores por campo.
 */
export function validateForm<T extends Record<string, any>>(
  formData: T,
  schema: FormValidationSchema<T>
): {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
} {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const field in schema) {
    const rules = schema[field];
    if (!rules || rules.length === 0) continue;

    const value = formData[field];

    for (const rule of rules) {
      const error = rule(value, formData);
      if (error) {
        errors[field] = error;
        break; // Detenerse en el primer error del campo
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
