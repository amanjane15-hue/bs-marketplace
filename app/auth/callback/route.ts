import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = getSupabaseServerClient();
    
    // Exchange the code for a session.
    // Note: In a pure client-side auth project without @supabase/ssr or cookies, 
    // the server may lack the code_verifier, causing this exchange to fail.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      // If server exchange fails (e.g. missing PKCE verifier cookie), we pass the code 
      // back to the client so the browser client can exchange it using localStorage verifier.
      const fallbackUrl = new URL(next, request.url);
      fallbackUrl.searchParams.set('code', code);
      return NextResponse.redirect(fallbackUrl);
    }
  }

  // If implicit grant, tokens are in the URL hash and won't be seen here,
  // so redirecting to next lets the client pick up the hash.
  return NextResponse.redirect(new URL(next, request.url));
}
