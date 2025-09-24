// Temporarily disabled - will be re-enabled when database types are fixed
// import { createClient } from '@supabase/supabase-js'
// import { Database } from '@/types/database'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// // Client for server components
// export function createServerClient() {
//   return createClient<Database>(supabaseUrl, supabaseKey)
// }

export const supabase = null; // Temporary placeholder
export function createServerClient() { return null; } // Temporary placeholder