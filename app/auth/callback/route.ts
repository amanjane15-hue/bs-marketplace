import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_callback_failed", request.url)
      );
    }
  }

  // If implicit grant, tokens are in the URL hash and won't be seen here,
  // so redirecting to next lets the client pick up the hash.
  return NextResponse.redirect(new URL(next, request.url));
}
