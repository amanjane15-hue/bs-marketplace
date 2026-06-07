import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
};

export function mapSupabaseUser(user: SupabaseUser | null): AuthUser | null {
  if (!user) return null;

  const name =
    (user.user_metadata as { full_name?: string } | null)?.full_name ||
    user.email?.split("@")[0] ||
    "Student";

  const avatarUrl =
    (user.user_metadata as { avatar_url?: string } | null)?.avatar_url ||
    (user.user_metadata as { picture?: string } | null)?.picture ||
    null;

  return {
    id: user.id,
    name,
    email: user.email ?? "",
    avatar: name.charAt(0).toUpperCase(),
    avatarUrl,
  };
}

export function extractUserFromSession(session: Session | null) {
  return mapSupabaseUser(session?.user ?? null);
}
