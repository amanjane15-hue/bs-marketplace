import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

function getSafeRedirectUrl(
  rawNext: string | null,
  origin: string
): URL {
  const fallback = new URL("/dashboard", origin);

  if (!rawNext) {
    return fallback;
  }

  if (!rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return fallback;
  }

  try {
    const candidate = new URL(rawNext, origin);

    if (candidate.origin !== origin) {
      return fallback;
    }

    return candidate;
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const redirectUrl = getSafeRedirectUrl(next, requestUrl.origin);

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
  return NextResponse.redirect(redirectUrl);
}
