import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function signInWithProvider(provider: "google" | "facebook" | "apple") {
  const supabase = getSupabaseBrowserClient();

  const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}
