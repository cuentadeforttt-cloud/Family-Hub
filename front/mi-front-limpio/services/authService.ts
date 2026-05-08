import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

interface EnviarCodigoRecuperacionParams {
  email: string;
}

interface VerificarCodigoRecuperacionParams {
  email: string;
  codigo: string;
}

interface ActualizarPasswordParams {
  password: string;
}

const normalizarEmail = (email: string): string => email.toLowerCase().trim();

const obtenerMensajeError = (error: AuthError): string => {
  const mensaje = error.message.toLowerCase();

  if (mensaje.includes('rate limit') || mensaje.includes('too many')) {
    return 'Hiciste muchos intentos seguidos. Esperá un momento y volvé a probar.';
  }

  if (mensaje.includes('token') || mensaje.includes('otp') || mensaje.includes('expired')) {
    return 'El código es inválido o ya venció. Pedí uno nuevo e intentá otra vez.';
  }

  if (mensaje.includes('email')) {
    return 'Revisá que el email esté bien escrito e intentá nuevamente.';
  }

  if (mensaje.includes('password')) {
    return 'No pudimos actualizar la contraseña. Probá con una contraseña distinta.';
  }

  return 'No pudimos completar la operación. Intentá nuevamente en unos minutos.';
};

export const enviarCodigoRecuperacion = async ({
  email,
}: EnviarCodigoRecuperacionParams): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizarEmail(email));

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }
};

export const verificarCodigoRecuperacion = async ({
  email,
  codigo,
}: VerificarCodigoRecuperacionParams): Promise<void> => {
  const { error } = await supabase.auth.verifyOtp({
    email: normalizarEmail(email),
    token: codigo.trim(),
    type: 'recovery',
  });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }
};

export const actualizarPassword = async ({
  password,
}: ActualizarPasswordParams): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }
};
