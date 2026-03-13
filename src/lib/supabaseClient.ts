
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Standard client for client-side and general server-side use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for privileged server-side operations (Use sparingly!)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Creates a server-side Supabase client with the user's Auth header
 */
export function getSupabaseServerClient(authHeader?: string | null) {
  if (!authHeader) {
      return supabase;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  })
}
