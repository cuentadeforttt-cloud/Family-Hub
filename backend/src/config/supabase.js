const { createClient } = require('@supabase/supabase-js')

const normalizeEnvValue = (value) => {
  if (typeof value !== 'string') {
    return value
  }

  return value.trim().replace(/^['"]+|['"]+$/g, '')
}

const supabaseUrl = normalizeEnvValue(process.env.SUPABASE_URL)
const supabaseKey = normalizeEnvValue(process.env.SUPABASE_KEY)

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las llaves de Supabase en el archivo .env')
}

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = { supabase }
