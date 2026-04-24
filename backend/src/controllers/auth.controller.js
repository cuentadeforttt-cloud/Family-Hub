// Importamos el cliente de Supabase que configuraste en src/config/supabase.js
const { supabase } = require('../config/supabase.js');

/**
 * REGISTRO DE USUARIO (Sign Up)
 * Ideal para la primera pantalla de onboarding.
 */
const signUp = async (req, res) => {
  try {
    // Extraemos los datos que envía el frontend (React Native)
    const { email, password, nombre } = req.body;

    // Validación básica
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'El email y la contraseña son obligatorios.' 
      });
    }

    // Llamada a Supabase para crear el usuario
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          // Guardamos el nombre en los metadatos del usuario para el perfil
          nombre: nombre 
        }
      }
    });

    // Si Supabase devuelve un error (ej. email ya registrado), lo lanzamos
    if (error) throw error;

    // Respuesta exitosa
    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente. Revisa tu correo para verificar la cuenta.',
      usuario: data.user
    });

  } catch (error) {
    console.error('Error en signUp:', error);
    return res.status(400).json({ error: error.message });
  }
};

/**
 * INICIO DE SESIÓN (Login)
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Por favor ingresa email y contraseña.' 
      });
    }

    // Llamada a Supabase para iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    // Supabase devuelve la sesión (que contiene el Access Token) y los datos del usuario
    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      session: data.session, // Este token es el que React Native debe guardar
      usuario: data.user
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(401).json({ error: error.message });
  }
};

// Exportamos las funciones para usarlas en las rutas
module.exports = {
  signUp,
  login
};