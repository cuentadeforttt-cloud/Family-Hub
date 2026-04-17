const supabase = require('../config/supabase');

exports.signUp = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: req.body.email,
      password: req.body.password,
    });

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: "Usuario creado en Supabase", data });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};