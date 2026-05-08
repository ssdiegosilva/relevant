import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

import { env } from './env';
import { mmkvAuthAdapter } from './mmkv';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: mmkvAuthAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
