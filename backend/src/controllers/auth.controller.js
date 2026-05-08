const { supabase, supabaseAdmin } = require('../config/supabase.js');

const normalizarEmail = (email) => String(email || '').toLowerCase().trim();

const signUp = async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    const emailNormalizado = normalizarEmail(email);
    const nombreLimpio = String(nombre || '').trim();

    if (!emailNormalizado || !password) {
      return res.status(400).json({
        mensaje: 'El email y la contraseña son obligatorios.',
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailNormalizado,
      password,
      options: {
        data: {
          full_name: nombreLimpio,
          nombre: nombreLimpio,
        },
      },
    });

    if (error) throw error;

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente. Revisa tu correo para verificar la cuenta.',
      usuario: data.user,
    });
  } catch (error) {
    console.error('Error en signUp:', error);
    return res.status(400).json({ mensaje: error.message });
  }
};

const devSignUp = async (req, res) => {
  try {
    if (process.env.AUTH_DEV_BYPASS_EMAIL !== 'true') {
      return res.status(403).json({
        mensaje: 'El registro dev sin confirmación de email está deshabilitado.',
      });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({
        mensaje: 'Falta SUPABASE_SERVICE_ROLE_KEY en el .env del backend.',
      });
    }

    const { email, password, nombre } = req.body;
    const emailNormalizado = normalizarEmail(email);
    const nombreLimpio = String(nombre || '').trim();

    if (!nombreLimpio || !emailNormalizado || !password) {
      return res.status(400).json({
        mensaje: 'El nombre, email y contraseña son obligatorios.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener al menos 6 caracteres.',
      });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalizado,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: nombreLimpio,
        nombre: nombreLimpio,
      },
    });

    if (error) throw error;

    return res.status(201).json({
      mensaje: 'Usuario dev creado y confirmado exitosamente.',
      usuario: data.user,
    });
  } catch (error) {
    console.error('Error en devSignUp:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    });

    const mensaje = error.message?.toLowerCase() || '';
    const status = mensaje.includes('already') || mensaje.includes('registered') ? 409 : 400;

    return res.status(status).json({
      mensaje: error.message || 'Error inesperado al registrar usuario dev.',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailNormalizado = normalizarEmail(email);

    if (!emailNormalizado || !password) {
      return res.status(400).json({
        mensaje: 'Por favor ingresa email y contraseña.',
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailNormalizado,
      password,
    });

    if (error) throw error;

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      session: data.session,
      usuario: data.user,
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(401).json({ mensaje: error.message });
  }
};

module.exports = {
  signUp,
  devSignUp,
  login,
};
