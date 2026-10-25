import { getAuthErrorMessage, extractErrorMessage } from '../authErrors';

describe('authErrors - Utilidades de errores de autenticación', () => {
  describe('extractErrorMessage', () => {
    it('debe devolver cadena vacía para entradas falsy o nulas', () => {
      expect(extractErrorMessage(null)).toBe('');
      expect(extractErrorMessage(undefined)).toBe('');
      expect(extractErrorMessage('')).toBe('');
    });

    it('debe devolver el mismo string si se pasa un string', () => {
      expect(extractErrorMessage('Error de prueba')).toBe('Error de prueba');
    });

    it('debe extraer message de una instancia de Error', () => {
      expect(extractErrorMessage(new Error('Mensaje de excepción'))).toBe('Mensaje de excepción');
    });

    it('debe extraer message de un objeto literal con propiedad message de tipo string', () => {
      expect(extractErrorMessage({ message: 'Error en objeto literal' })).toBe('Error en objeto literal');
    });

    it('debe convertir a string entradas con message no string u objetos arbitrarios', () => {
      expect(extractErrorMessage({ message: 12345 })).toBe('[object Object]');
      expect(extractErrorMessage(500)).toBe('500');
      expect(extractErrorMessage(true)).toBe('true');
    });
  });

  describe('getAuthErrorMessage - Tipos de entrada y casos límite', () => {
    it('debe devolver mensaje predeterminado cuando la entrada es nula, vacía o sólo espacios', () => {
      expect(getAuthErrorMessage(null)).toBe('Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.');
      expect(getAuthErrorMessage(undefined)).toBe('Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.');
      expect(getAuthErrorMessage('')).toBe('Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.');
      expect(getAuthErrorMessage('   ')).toBe('Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.');
    });

    it('debe aceptar instancias de Error directamente', () => {
      const err = new Error('Invalid login credentials');
      expect(getAuthErrorMessage(err)).toBe('Correo electrónico o contraseña incorrectos.');
    });

    it('debe aceptar objetos con propiedad message', () => {
      const supabaseErrorObj = { message: 'Email not confirmed' };
      expect(getAuthErrorMessage(supabaseErrorObj)).toBe('Debes confirmar tu correo electrónico antes de iniciar sesión.');
    });

    it('debe ser insensible a mayúsculas y minúsculas', () => {
      expect(getAuthErrorMessage('INVALID LOGIN CREDENTIALS')).toBe('Correo electrónico o contraseña incorrectos.');
      expect(getAuthErrorMessage('InVaLiD EmAiL Or PaSsWoRd')).toBe('Correo electrónico o contraseña incorrectos.');
    });
  });

  describe('getAuthErrorMessage - Categorías de error de Supabase', () => {
    it('1. Credenciales inválidas', () => {
      expect(getAuthErrorMessage('Invalid login credentials')).toBe('Correo electrónico o contraseña incorrectos.');
      expect(getAuthErrorMessage('invalid email or password')).toBe('Correo electrónico o contraseña incorrectos.');
      expect(getAuthErrorMessage('Invalid credentials provided')).toBe('Correo electrónico o contraseña incorrectos.');
    });

    it('2. Correo no confirmado', () => {
      expect(getAuthErrorMessage('Email not confirmed')).toBe('Debes confirmar tu correo electrónico antes de iniciar sesión.');
      expect(getAuthErrorMessage('Error: email not confirmed yet')).toBe('Debes confirmar tu correo electrónico antes de iniciar sesión.');
    });

    it('3. Usuario no encontrado', () => {
      expect(getAuthErrorMessage('User not found')).toBe('No existe ninguna cuenta registrada con este correo electrónico.');
      expect(getAuthErrorMessage('Requested user not found in database')).toBe('No existe ninguna cuenta registrada con este correo electrónico.');
    });

    it('4. Usuario o email ya registrado', () => {
      expect(getAuthErrorMessage('User already registered')).toBe('Ya existe una cuenta registrada con este correo electrónico.');
      expect(getAuthErrorMessage('A user with this email already registered')).toBe('Ya existe una cuenta registrada con este correo electrónico.');
      expect(getAuthErrorMessage('Email already in use by another account')).toBe('Ya existe una cuenta registrada con este correo electrónico.');
    });

    it('5. Contraseña corta o débil', () => {
      expect(getAuthErrorMessage('Password should be at least 6 characters')).toBe('La contraseña debe tener al menos 6 caracteres.');
      expect(getAuthErrorMessage('Password is too short')).toBe('La contraseña debe tener al menos 6 caracteres.');
      expect(getAuthErrorMessage('Weak password: must have more complexity')).toBe('La contraseña debe tener al menos 6 caracteres.');
    });

    it('6. Nueva contraseña igual a la anterior', () => {
      expect(getAuthErrorMessage('New password should be different from the old password')).toBe(
        'La nueva contraseña debe ser diferente a la contraseña actual.'
      );
      expect(getAuthErrorMessage('Cannot set same password as previous')).toBe(
        'La nueva contraseña debe ser diferente a la contraseña actual.'
      );
    });

    it('7. Cuenta suspendida o deshabilitada', () => {
      expect(getAuthErrorMessage('User banned by administrator')).toBe(
        'Tu cuenta ha sido deshabilitada o suspendida. Por favor, contacta con soporte.'
      );
      expect(getAuthErrorMessage('User disabled')).toBe(
        'Tu cuenta ha sido deshabilitada o suspendida. Por favor, contacta con soporte.'
      );
      expect(getAuthErrorMessage('Account suspended')).toBe(
        'Tu cuenta ha sido deshabilitada o suspendida. Por favor, contacta con soporte.'
      );
    });

    it('8. Límite de peticiones / Rate limit', () => {
      expect(getAuthErrorMessage('Too many requests, try again later')).toBe(
        'Demasiados intentos fallidos. Por favor, espera unos minutos e inténtalo de nuevo.'
      );
      expect(getAuthErrorMessage('Rate limit exceeded')).toBe(
        'Demasiados intentos fallidos. Por favor, espera unos minutos e inténtalo de nuevo.'
      );
      expect(getAuthErrorMessage('Over rate limit')).toBe(
        'Demasiados intentos fallidos. Por favor, espera unos minutos e inténtalo de nuevo.'
      );
    });

    it('9. Conexión de red o fallo de fetch', () => {
      expect(getAuthErrorMessage('Failed to fetch network request')).toBe(
        'Error de conexión. Por favor, comprueba tu conexión a internet.'
      );
      expect(getAuthErrorMessage('Network error occurred')).toBe(
        'Error de conexión. Por favor, comprueba tu conexión a internet.'
      );
      expect(getAuthErrorMessage('Connection refused')).toBe(
        'Error de conexión. Por favor, comprueba tu conexión a internet.'
      );
    });

    it('10. Formato de correo inválido', () => {
      expect(getAuthErrorMessage('Invalid email format')).toBe('El formato del correo electrónico no es válido.');
      expect(getAuthErrorMessage('Unable to validate email address')).toBe('El formato del correo electrónico no es válido.');
    });

    it('11. Registro de nuevos usuarios deshabilitado', () => {
      expect(getAuthErrorMessage('Signup disabled for this project')).toBe(
        'El registro de nuevos usuarios está deshabilitado temporalmente.'
      );
      expect(getAuthErrorMessage('Signups disabled')).toBe(
        'El registro de nuevos usuarios está deshabilitado temporalmente.'
      );
      expect(getAuthErrorMessage('Signups are disabled')).toBe(
        'El registro de nuevos usuarios está deshabilitado temporalmente.'
      );
    });

    it('12. Token o enlace expirado / inválido', () => {
      expect(getAuthErrorMessage('Token has expired')).toBe('El enlace o código de seguridad ha caducado. Solicita uno nuevo.');
      expect(getAuthErrorMessage('Token expired')).toBe('El enlace o código de seguridad ha caducado. Solicita uno nuevo.');
      expect(getAuthErrorMessage('Email link is invalid')).toBe('El enlace o código de seguridad ha caducado. Solicita uno nuevo.');
      expect(getAuthErrorMessage('Email link has expired')).toBe('El enlace o código de seguridad ha caducado. Solicita uno nuevo.');
    });

    it('13. Sesión caducada', () => {
      expect(getAuthErrorMessage('Auth session expired')).toBe('Tu sesión ha caducado. Por favor, inicia sesión de nuevo.');
      expect(getAuthErrorMessage('Session missing')).toBe('Tu sesión ha caducado. Por favor, inicia sesión de nuevo.');
    });

    it('14. Captcha fallido', () => {
      expect(getAuthErrorMessage('Captcha verification failed')).toBe(
        'Error en la verificación de seguridad (captcha). Por favor, inténtalo de nuevo.'
      );
    });

    it('15. Error de base de datos', () => {
      expect(getAuthErrorMessage('Database error saving new user')).toBe(
        'Error temporal en los servicios centrales. Por favor, inténtalo más tarde.'
      );
    });

    it('16. Mensaje desconocido debe devolver fallback en español', () => {
      expect(getAuthErrorMessage('An unknown internal provider error 500')).toBe(
        'No ha sido posible completar la operación. Verifica los datos e inténtalo de nuevo.'
      );
    });
  });
});
