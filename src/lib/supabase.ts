import { createClient } from '@supabase/supabase-js'
// Only the publishable browser credential belongs in this client bundle.
// Outcome authority and privileged jackpot mutation remain behind Supabase.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables')
}
export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
)