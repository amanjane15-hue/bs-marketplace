import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _supabaseClient: ReturnType<typeof createClient<any, any, any>> | null = null;

export function getSupabaseBrowserClient() {
  if (!_supabaseClient) {
    _supabaseClient = createClient<any, any, any>(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseClient;
}

export const supabase = getSupabaseBrowserClient();