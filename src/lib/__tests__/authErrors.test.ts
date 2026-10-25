import { getAuthErrorMessage } from '../authErrors';

describe('authErrors - getAuthErrorMessage', () => {
  it('debe devolver mensaje predeterminado cuando errorMsg es nulo o indefinido', () => {
    expect(getAuthErrorMessage(null)).toBe('Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.');
    expect(getAuthErrorMessage(undefined)).toBe('Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.');
    expect(getAuthErrorMessage('')).toBe('Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.');
  });

  it('debe traducir "Invalid login credentials"', () => {
    expect(getAuthErrorMessage('Invalid login credentials')).toBe('Correo electrónico o contraseña incorrectos.');
  });

  it('debe traducir "Invalid email or password"', () => {
    expect(getAuthErrorMessage('invalid email or password')).toBe('Correo electrónico o contraseña incorrectos.');
  });

  it('debe traducir "Email not confirmed"', () => {
    expect(getAuthErrorMessage('Email not confirmed')).toBe('Debes confirmar tu correo electrónico antes de iniciar sesión.');
  });

  it('debe traducir "User not found"', () => {
    expect(getAuthErrorMessage('User not found')).toBe('No existe ninguna cuenta registrada con este correo electrónico.');
  });

  it('debe traducir "User already registered"', () => {
    expect(getAuthErrorMessage('User already registered')).toBe('Ya existe una cuenta registrada con este correo electrónico.');
  });

  it('debe traducir "Password should be at least 6 characters"', () => {
    expect(getAuthErrorMessage('Password should be at least 6 characters')).toBe('La contraseña debe tener al menos 6 caracteres.');
  });

  it('debe traducir "Too many requests" y "rate limit"', () => {
    expect(getAuthErrorMessage('too many requests')).toBe('Demasiados intentos fallidos. Por favor, espera unos minutos e inténtalo de nuevo.');
    expect(getAuthErrorMessage('Over rate limit')).toBe('Demasiados intentos fallidos. Por favor, espera unos minutos e inténtalo de nuevo.');
  });

  it('debe traducir errores de red y fetch', () => {
    expect(getAuthErrorMessage('Failed to fetch network request')).toBe('Error de conexión. Por favor, comprueba tu conexión a internet.');
  });

  it('debe traducir "invalid email"', () => {
    expect(getAuthErrorMessage('Invalid email format')).toBe('El formato del correo electrónico no es válido.');
  });

  it('debe traducir "signup disabled"', () => {
    expect(getAuthErrorMessage('Signups disabled on this project')).toBe('El registro de nuevos usuarios está deshabilitado temporalmente.');
  });

  it('debe traducir token expirado', () => {
    expect(getAuthErrorMessage('Token has expired')).toBe('El enlace o código de seguridad ha caducado. Solicita uno nuevo.');
  });

  it('debe devolver fallback en español ante errores desconocidos', () => {
    expect(getAuthErrorMessage('Some arbitrary internal error from provider')).toBe('No ha sido posible completar la operación. Verifica los datos e inténtalo de nuevo.');
  });
});
