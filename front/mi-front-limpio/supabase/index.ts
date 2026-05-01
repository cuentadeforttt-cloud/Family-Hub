import 'react-native-url-polyfill/auto'; // Parche necesario para que las URLs de Supabase no rompan en React Native
import { createClient } from '@supabase/supabase-js';

// En Expo, las variables del .env tienen que empezar sí o sí con EXPO_PUBLIC_
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);