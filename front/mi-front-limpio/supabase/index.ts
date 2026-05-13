import 'react-native-url-polyfill/auto'; // Parche necesario para que las URLs de Supabase no rompan en React Native
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

// En Expo, las variables del .env tienen que empezar sí o sí con EXPO_PUBLIC_
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error(
    'Falta EXPO_PUBLIC_SUPABASE_URL. Configurala en front/mi-front-limpio/.env antes de iniciar la app.',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Falta EXPO_PUBLIC_SUPABASE_ANON_KEY. Configurala en front/mi-front-limpio/.env antes de iniciar la app.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});
