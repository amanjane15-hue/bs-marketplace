"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { extractUserFromSession, mapSupabaseUser, type AuthUser } from "@/lib/supabase/helpers";
import type { Session } from "@supabase/supabase-js";

type AuthContextValue = {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
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

  const refreshProfile = async () => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single();
    if (data?.avatar_url) {
      setDbAvatarUrl(data.avatar_url);
    }
  };

  useEffect(() => {
    if (user?.id) {
      void refreshProfile();
    } else {
      setDbAvatarUrl(null);
    }
  }, [user?.id]);

  const enhancedUser = user ? { ...user, avatarUrl: dbAvatarUrl ?? user.avatarUrl } : null;

  useEffect(() => {
    const initializeAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      console.log("AuthProvider: initializing auth, calling getSession()");
      const { data, error: sessionError } = await supabase.auth.getSession();
      console.log("AuthProvider: getSession returned", { data, sessionError });
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
      console.log("AuthProvider: onAuthStateChange", { event, nextSession });
      setSession(nextSession);
      setUser(extractUserFromSession(nextSession));
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    console.log("AuthProvider: signInWithPassword", { email });
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("AuthProvider: signInWithPassword result", { data, signInError });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setSession(data.session);
    setUser(data.user ? mapSupabaseUser(data.user) : extractUserFromSession(data.session));
    setLoading(false);
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    console.log("AuthProvider: signUp", { name, email });
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    console.log("AuthProvider: signUp result", { data, signUpError });

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
