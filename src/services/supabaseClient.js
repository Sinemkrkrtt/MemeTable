import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lhxwrrzvcpzbhsiyzjjh.supabase.co';
const supabaseAnonKey = 'sb_publishable_3u3ioS_J4E8XaPZfcoDaJw_aH_lAqU4'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);