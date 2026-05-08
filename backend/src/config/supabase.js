const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan SUPABASE_URL o SUPABASE_KEY en el archivo .env');
}

if (process.env.AUTH_DEV_BYPASS_EMAIL === 'true' && !supabaseServiceRoleKey) {
  console.error('Error: AUTH_DEV_BYPASS_EMAIL=true requiere SUPABASE_SERVICE_ROLE_KEY en el .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

module.exports = { supabase, supabaseAdmin };
