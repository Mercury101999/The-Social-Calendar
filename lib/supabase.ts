import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env vars. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/*
The polyfill adds web features that Supabase expects and React Native doesn't have.
process.env.EXPO_PUBLIC_... reads your .env file. Expo only puts variables that start with EXPO_PUBLIC_ into the app.
The if check fails loudly if a key is missing, instead of breaking in a confusing way later.
AsyncStorage saves the login on the phone so users stay signed in. autoRefreshToken keeps the session fresh.

*/