import { createClient } from '@supabase/supabase-js';

// Supabase project credentials (safe client-side publishable key)
const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 'https://qcvdhuhfnfrivvpgblmq.supabase.co';
const SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_gyBTsmYRhDQlTlQ4P3q-kg_ha6V4WAO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
