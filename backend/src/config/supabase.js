const { createClient } = require('@supabase/supabase-js');

// Buscamos las llaves que tenés guardadas en el .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 

// Si alguna falta, el servidor te avisará prolijamente
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan las llaves de Supabase en el archivo .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };