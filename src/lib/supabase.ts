import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';

const supabaseUrl = 'https://uzdkzjdmaugkpxrpjbhs.supabase.co';
const supabasePublishableKey = 'sb_publishable_81OK0pEF3o5z1XOa_Zy8-g_1fjeVA_g';

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
