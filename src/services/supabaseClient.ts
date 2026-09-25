import type { SupabaseClient } from '@supabase/supabase-js';

// Credenciales públicas del proyecto (clave publishable, segura en cliente)
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://qcvdhuhfnfrivvpgblmq.supabase.co';
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_gyBTsmYRhDQlTlQ4P3q-kg_ha6V4WAO';

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * Carga perezosa del SDK de Supabase (~45 KB gzip) en un chunk aparte,
 * para que no bloquee el primer render de la app.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    );
  }
  return clientPromise;
}
