"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { extractUserFromSession, mapSupabaseUser, type AuthUser } from "@/lib/supabase/helpers";
import type { Session } from "@supabase/supabase-js";

type AuthContextValue = {
  user: (AuthUser & { isVerified?: boolean; isSuspended?: boolean }) | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, captchaToken: string) => Promise<void>;
  signup: (name: string, email: string, password: string, captchaToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);

  const refreshProfile = async (forceUserId?: string) => {
    const targetId = forceUserId || user?.id;
    if (!targetId) return;
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.from("profiles").select("avatar_url, is_admin, is_verified, is_suspended").eq("user_id", targetId).maybeSingle();
    if (data) {
      if (data.avatar_url) setDbAvatarUrl(data.avatar_url);
      setIsAdmin(data.is_admin === true);
      setIsVerified(data.is_verified === true);
      setIsSuspended(data.is_suspended === true);
    }
  };

  useEffect(() => {
    if (user?.id) {
      void refreshProfile(user.id);
    } else {
      setDbAvatarUrl(null);
      setIsAdmin(false);
      setIsVerified(false);
      setIsSuspended(false);
    }
  }, [user?.id]);

  const enhancedUser = user ? { ...user, avatarUrl: dbAvatarUrl ?? user.avatarUrl, isAdmin, isVerified, isSuspended } : null;

  useEffect(() => {
    const initializeAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
      }
      setSession(data.session);
      setUser(data.session?.user ? mapSupabaseUser(data.session.user) : extractUserFromSession(data.session));
      setLoading(false);
    };

    initializeAuth();

    const supabase = getSupabaseBrowserClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(extractUserFromSession(nextSession));
      
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        if (nextSession?.user?.id) {
          void refreshProfile(nextSession.user.id);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, captchaToken: string) => {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setSession(data.session);
    setUser(data.user ? mapSupabaseUser(data.user) : extractUserFromSession(data.session));
    setLoading(false);
  };

  const signup = async (name: string, email: string, password: string, captchaToken: string) => {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
        captchaToken,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSession(data.session);
    setUser(data.user ? mapSupabaseUser(data.user) : extractUserFromSession(data.session));
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user: enhancedUser, session, loading, error, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside the AuthProvider.");
  }
  return context;
}
