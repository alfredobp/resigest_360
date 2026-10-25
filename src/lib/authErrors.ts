/**
 * Traduce los mensajes de error devueltos por Supabase Auth al español.
 */
export function getAuthErrorMessage(errorMsg?: string | null): string {
  if (!errorMsg) {
    return 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.';
  }

  const normalized = errorMsg.toLowerCase();

  if (normalized.includes('invalid login credentials') || normalized.includes('invalid email or password')) {
    return 'Correo electrónico o contraseña incorrectos.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
  }
  if (normalized.includes('user not found')) {
    return 'No existe ninguna cuenta registrada con este correo electrónico.';
  }
  if (normalized.includes('user already registered') || normalized.includes('already registered')) {
    return 'Ya existe una cuenta registrada con este correo electrónico.';
  }
  if (normalized.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (normalized.includes('too many requests') || normalized.includes('rate limit')) {
    return 'Demasiados intentos fallidos. Por favor, espera unos minutos e inténtalo de nuevo.';
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return 'Error de conexión. Por favor, comprueba tu conexión a internet.';
  }
  if (normalized.includes('invalid email')) {
    return 'El formato del correo electrónico no es válido.';
  }
  if (normalized.includes('signup disabled') || normalized.includes('signups disabled')) {
    return 'El registro de nuevos usuarios está deshabilitado temporalmente.';
  }
  if (normalized.includes('token has expired') || normalized.includes('token expired')) {
    return 'El enlace o código de seguridad ha caducado. Solicita uno nuevo.';
  }

  return 'No ha sido posible completar la operación. Verifica los datos e inténtalo de nuevo.';
}
