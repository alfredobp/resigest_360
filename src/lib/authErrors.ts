/**
 * Utilidades para traducción y manejo de errores de autenticación en ResiGest 360.
 */

export type AuthErrorInput = string | Error | { message?: string } | null | undefined | unknown;

/**
 * Extrae y normaliza el mensaje de error textual desde cualquier entrada.
 */
export function extractErrorMessage(error: AuthErrorInput): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return String(error);
}

/**
 * Traduce los mensajes de error devueltos por Supabase Auth al español de forma amigable.
 */
export function getAuthErrorMessage(error: AuthErrorInput): string {
  const rawMsg = extractErrorMessage(error).trim();

  if (!rawMsg) {
    return 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.';
  }

  const normalized = rawMsg.toLowerCase();

  // 1. Credenciales inválidas
  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid email or password') ||
    normalized.includes('invalid credentials')
  ) {
    return 'Correo electrónico o contraseña incorrectos.';
  }

  // 2. Correo no confirmado
  if (normalized.includes('email not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
  }

  // 3. Usuario no encontrado
  if (normalized.includes('user not found')) {
    return 'No existe ninguna cuenta registrada con este correo electrónico.';
  }

  // 4. Usuario ya registrado
  if (
    normalized.includes('user already registered') ||
    normalized.includes('already registered') ||
    normalized.includes('email already in use')
  ) {
    return 'Ya existe una cuenta registrada con este correo electrónico.';
  }

  // 5. Contraseña corta o débil
  if (
    normalized.includes('password should be at least') ||
    normalized.includes('password is too short') ||
    normalized.includes('weak password')
  ) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  // 6. Nueva contraseña igual a la anterior
  if (normalized.includes('different from the old password') || normalized.includes('same password')) {
    return 'La nueva contraseña debe ser diferente a la contraseña actual.';
  }

  // 7. Cuenta deshabilitada o suspendida
  if (normalized.includes('user banned') || normalized.includes('user disabled') || normalized.includes('account suspended')) {
    return 'Tu cuenta ha sido deshabilitada o suspendida. Por favor, contacta con soporte.';
  }

  // 8. Límite de peticiones / rate limit
  if (
    normalized.includes('too many requests') ||
    normalized.includes('rate limit') ||
    normalized.includes('over rate limit')
  ) {
    return 'Demasiados intentos fallidos. Por favor, espera unos minutos e inténtalo de nuevo.';
  }

  // 9. Error de conexión / red
  if (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('connection refused')
  ) {
    return 'Error de conexión. Por favor, comprueba tu conexión a internet.';
  }

  // 10. Formato de correo no válido
  if (normalized.includes('invalid email') || normalized.includes('unable to validate email')) {
    return 'El formato del correo electrónico no es válido.';
  }

  // 11. Registros deshabilitados
  if (
    normalized.includes('signup disabled') ||
    normalized.includes('signups disabled') ||
    normalized.includes('signups are disabled')
  ) {
    return 'El registro de nuevos usuarios está deshabilitado temporalmente.';
  }

  // 12. Token o enlace expirado / inválido
  if (
    normalized.includes('token has expired') ||
    normalized.includes('token expired') ||
    normalized.includes('link is invalid') ||
    normalized.includes('link has expired')
  ) {
    return 'El enlace o código de seguridad ha caducado. Solicita uno nuevo.';
  }

  // 13. Sesión expirada
  if (normalized.includes('session expired') || normalized.includes('session missing')) {
    return 'Tu sesión ha caducado. Por favor, inicia sesión de nuevo.';
  }

  // 14. Verificación de captcha fallida
  if (normalized.includes('captcha')) {
    return 'Error en la verificación de seguridad (captcha). Por favor, inténtalo de nuevo.';
  }

  // 15. Error de base de datos
  if (normalized.includes('database error')) {
    return 'Error temporal en los servicios centrales. Por favor, inténtalo más tarde.';
  }

  // Mensaje por defecto cuando no coincide ningún patrón
  return 'No ha sido posible completar la operación. Verifica los datos e inténtalo de nuevo.';
}
