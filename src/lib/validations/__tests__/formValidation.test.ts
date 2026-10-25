import {
  VALIDATION_MESSAGES,
  validateRequired,
  validateCIF,
  validateNIMA,
  validateEmail,
  validatePhone,
  validatePostalCode,
  validateDateRange,
  validateForm,
  scrollToFirstError,
} from '../formValidation';

describe('formValidation - Motor de Validación y Reglas', () => {
  describe('validateRequired', () => {
    it('debe fallar si el valor es null o undefined', () => {
      expect(validateRequired(null)).toBe(VALIDATION_MESSAGES.REQUIRED);
      expect(validateRequired(undefined)).toBe(VALIDATION_MESSAGES.REQUIRED);
    });

    it('debe fallar si la cadena de texto está vacía o solo contiene espacios', () => {
      expect(validateRequired('')).toBe(VALIDATION_MESSAGES.REQUIRED);
      expect(validateRequired('   ')).toBe(VALIDATION_MESSAGES.REQUIRED);
    });

    it('debe fallar si el array está vacío con mensaje de selección', () => {
      expect(validateRequired([])).toBe(VALIDATION_MESSAGES.SELECTION_REQUIRED);
    });

    it('debe permitir mensaje personalizado', () => {
      expect(validateRequired('', 'Campo vital requerido')).toBe('Campo vital requerido');
      expect(validateRequired([], 'Selecciona al menos un rol')).toBe('Selecciona al menos un rol');
    });

    it('debe retornar null cuando el valor es válido', () => {
      expect(validateRequired('Texto válido')).toBeNull();
      expect(validateRequired(0)).toBeNull();
      expect(validateRequired(false)).toBeNull();
      expect(validateRequired(['item1'])).toBeNull();
      expect(validateRequired({ id: 1 })).toBeNull();
    });
  });

  describe('validateCIF', () => {
    it('debe validar si es requerido y viene vacío', () => {
      expect(validateCIF('', true)).toBe(VALIDATION_MESSAGES.REQUIRED);
      expect(validateCIF('  ', true)).toBe(VALIDATION_MESSAGES.REQUIRED);
    });

    it('debe retornar null si no es requerido y viene vacío', () => {
      expect(validateCIF('', false)).toBeNull();
      expect(validateCIF('  ', false)).toBeNull();
    });

    it('debe validar correctamente DNI / NIF españoles', () => {
      expect(validateCIF('12345678Z')).toBeNull();
      expect(validateCIF('87654321A')).toBeNull();
    });

    it('debe validar correctamente NIE españoles', () => {
      expect(validateCIF('X1234567L')).toBeNull();
      expect(validateCIF('Y9876543K')).toBeNull();
      expect(validateCIF('Z1122334B')).toBeNull();
    });

    it('debe validar correctamente CIF de empresas', () => {
      expect(validateCIF('B12345678')).toBeNull();
      expect(validateCIF('A12345678')).toBeNull();
      expect(validateCIF('B1234567A')).toBeNull();
    });

    it('debe retornar error si el formato es inválido', () => {
      expect(validateCIF('123')).toBe(VALIDATION_MESSAGES.CIF_INVALID);
      expect(validateCIF('INVALID_CIF')).toBe(VALIDATION_MESSAGES.CIF_INVALID);
      expect(validateCIF('1234567890')).toBe(VALIDATION_MESSAGES.CIF_INVALID);
    });
  });

  describe('validateNIMA', () => {
    it('debe manejar campos vacíos según isRequired', () => {
      expect(validateNIMA('', false)).toBeNull();
      expect(validateNIMA('', true)).toBe(VALIDATION_MESSAGES.REQUIRED);
    });

    it('debe aceptar NIMA válido de 10 a 12 caracteres alfanuméricos', () => {
      expect(validateNIMA('0123456789')).toBeNull();
      expect(validateNIMA('0123456789A')).toBeNull();
      expect(validateNIMA('ES0123456789')).toBeNull();
    });

    it('debe rechazar NIMA con longitud incorrecta o caracteres especiales', () => {
      expect(validateNIMA('12345')).toBe(VALIDATION_MESSAGES.NIMA_INVALID);
      expect(validateNIMA('1234567890123')).toBe(VALIDATION_MESSAGES.NIMA_INVALID);
      expect(validateNIMA('ES-12345678')).toBe(VALIDATION_MESSAGES.NIMA_INVALID);
    });
  });

  describe('validateEmail', () => {
    it('debe manejar campos vacíos según isRequired', () => {
      expect(validateEmail('', true)).toBe(VALIDATION_MESSAGES.REQUIRED);
      expect(validateEmail('', false)).toBeNull();
    });

    it('debe aceptar emails con formato correcto', () => {
      expect(validateEmail('test@resigest.es')).toBeNull();
      expect(validateEmail('admin.user+tag@domain.co.uk')).toBeNull();
    });

    it('debe rechazar emails mal formados', () => {
      expect(validateEmail('no-email')).toBe(VALIDATION_MESSAGES.EMAIL_INVALID);
      expect(validateEmail('test@sin-dominio')).toBe(VALIDATION_MESSAGES.EMAIL_INVALID);
      expect(validateEmail('@domain.com')).toBe(VALIDATION_MESSAGES.EMAIL_INVALID);
    });
  });

  describe('validatePhone', () => {
    it('debe manejar campo vacío según isRequired', () => {
      expect(validatePhone('', false)).toBeNull();
      expect(validatePhone('', true)).toBe(VALIDATION_MESSAGES.REQUIRED);
    });

    it('debe aceptar teléfonos nacionales e internacionales válidos', () => {
      expect(validatePhone('612345678')).toBeNull();
      expect(validatePhone('+34 912 345 678')).toBeNull();
      expect(validatePhone('(91) 123-4567')).toBeNull();
    });

    it('debe rechazar números con letras o longitud errónea', () => {
      expect(validatePhone('123')).toBe(VALIDATION_MESSAGES.PHONE_INVALID);
      expect(validatePhone('telefono-falso')).toBe(VALIDATION_MESSAGES.PHONE_INVALID);
    });
  });

  describe('validatePostalCode', () => {
    it('debe manejar campo vacío según isRequired', () => {
      expect(validatePostalCode('', false)).toBeNull();
      expect(validatePostalCode('', true)).toBe(VALIDATION_MESSAGES.REQUIRED);
    });

    it('debe validar códigos postales de 5 dígitos', () => {
      expect(validatePostalCode('28001')).toBeNull();
      expect(validatePostalCode('08005')).toBeNull();
    });

    it('debe rechazar códigos postales que no tengan exactamente 5 dígitos', () => {
      expect(validatePostalCode('2800')).toBe(VALIDATION_MESSAGES.POSTAL_CODE_INVALID);
      expect(validatePostalCode('280010')).toBe(VALIDATION_MESSAGES.POSTAL_CODE_INVALID);
      expect(validatePostalCode('2800A')).toBe(VALIDATION_MESSAGES.POSTAL_CODE_INVALID);
    });
  });

  describe('validateDateRange', () => {
    it('debe retornar null si falta alguna de las fechas', () => {
      expect(validateDateRange('2026-01-01', '')).toBeNull();
      expect(validateDateRange('', '2026-12-31')).toBeNull();
    });

    it('debe retornar error si las fechas no son válidas', () => {
      expect(validateDateRange('fecha-invalida', '2026-12-31')).toBe('Fechas no válidas');
    });

    it('debe retornar null cuando fin es posterior a inicio', () => {
      expect(validateDateRange('2026-01-01', '2026-12-31')).toBeNull();
    });

    it('debe retornar error si fin es igual o anterior a inicio', () => {
      expect(validateDateRange('2026-12-31', '2026-01-01')).toBe(VALIDATION_MESSAGES.DATE_RANGE_INVALID);
      expect(validateDateRange('2026-05-01', '2026-05-01')).toBe(VALIDATION_MESSAGES.DATE_RANGE_INVALID);
    });
  });

  describe('validateForm', () => {
    interface SampleForm {
      razon_social: string;
      cif: string;
      email?: string;
    }

    const schema = {
      razon_social: [(v: any) => validateRequired(v, 'Razón Social obligatoria')],
      cif: [(v: any) => validateCIF(v, true)],
      email: [(v: any) => validateEmail(v, false)],
    };

    it('debe retornar isValid: false y mapa de errores cuando hay campos vacíos', () => {
      const result = validateForm<SampleForm>(
        { razon_social: '', cif: '' },
        schema
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.razon_social).toBe('Razón Social obligatoria');
      expect(result.errors.cif).toBe(VALIDATION_MESSAGES.REQUIRED);
    });

    it('debe retornar isValid: true y errores vacíos cuando todos los campos son válidos', () => {
      const result = validateForm<SampleForm>(
        { razon_social: 'ReciGest SL', cif: 'B12345678', email: 'test@resigest.com' },
        schema
      );

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe('VALIDATION_MESSAGES helper', () => {
    it('debe generar mensaje con nombre de campo', () => {
      expect(VALIDATION_MESSAGES.REQUIRED_FIELD('Razón Social')).toBe('El campo Razón Social es obligatorio');
    });
  });

  describe('scrollToFirstError', () => {
    let originalDocument: any;

    beforeEach(() => {
      originalDocument = (global as any).document;
    });

    afterEach(() => {
      (global as any).document = originalDocument;
      jest.restoreAllMocks();
    });

    it('debe retornar false si document es undefined', () => {
      delete (global as any).document;
      expect(scrollToFirstError({ razon_social: 'error' })).toBe(false);
    });

    it('debe retornar false si no hay errores', () => {
      expect(scrollToFirstError({})).toBe(false);
    });

    it('debe encontrar el elemento por prefijo e invocar scrollIntoView y focus', () => {
      const mockElement = {
        scrollIntoView: jest.fn(),
        focus: jest.fn(),
      };
      (global as any).document = {
        querySelector: jest.fn((sel: string) => {
          if (sel === '#carrier_razon_social') return mockElement;
          return null;
        }),
      };

      const result = scrollToFirstError({ razon_social: 'Este campo es requerido' }, 'carrier_');
      expect(result).toBe(true);
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(mockElement.focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('debe encontrar el elemento por name si no tiene prefijo en el id', () => {
      const mockElement = {
        scrollIntoView: jest.fn(),
        focus: jest.fn(),
      };
      (global as any).document = {
        querySelector: jest.fn((sel: string) => {
          if (sel === '[name="email"]') return mockElement;
          return null;
        }),
      };

      const result = scrollToFirstError({ email: 'Email no válido' });
      expect(result).toBe(true);
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(mockElement.focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('debe recurrir al selector aria-invalid="true" como fallback', () => {
      const mockElement = {
        scrollIntoView: jest.fn(),
        focus: jest.fn(),
      };
      (global as any).document = {
        querySelector: jest.fn((sel: string) => {
          if (sel === '[aria-invalid="true"]') return mockElement;
          return null;
        }),
      };

      const result = scrollToFirstError({ unknown_field: 'Error desconocido' });
      expect(result).toBe(true);
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(mockElement.focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('debe retornar false si no se encuentra ningún elemento en el DOM', () => {
      (global as any).document = {
        querySelector: jest.fn(() => null),
      };
      const result = scrollToFirstError({ campo_inexistente: 'Error' });
      expect(result).toBe(false);
    });
  });
});
