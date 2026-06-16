"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { extractUserFromSession, mapSupabaseUser, type AuthUser } from "@/lib/supabase/helpers";
import type { Session } from "@supabase/supabase-js";
import { normalizeUsername, isValidUsername } from "@/lib/auth/username";

type AuthContextValue = {
  user: (AuthUser & { isVerified?: boolean; isSuspended?: boolean }) | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  pendingVerificationEmail: string | null;
  login: (email: string, password: string, captchaToken: string) => Promise<void>;
  signup: (name: string, username: string, email: string, password: string, captchaToken: string) => Promise<{ requiresEmailVerification: boolean } | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearPendingVerificationEmail: () => void;
  verifySignupOtp: (email: string, token: string) => Promise<boolean>;
  resendSignupOtp: (email: string) => Promise<boolean>;
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
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

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

  const clearPendingVerificationEmail = () => {
    setPendingVerificationEmail(null);
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

  const signup = async (name: string, username: string, email: string, password: string, captchaToken: string) => {
    setLoading(true);
    setError(null);

    const normalizedUsername = normalizeUsername(username);
    if (!isValidUsername(normalizedUsername)) {
      setError("Your username does not match the required format.");
      setLoading(false);
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = getSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: name.trim(),
          desired_username: normalizedUsername,
        },
        captchaToken,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return null;
    }

    if (data.session) {
      setSession(data.session);
      setUser(mapSupabaseUser(data.session.user));
      setPendingVerificationEmail(null);
    } else {
      setSession(null);
      setUser(null);
      setPendingVerificationEmail(normalizedEmail);
    }

    setLoading(false);
    
    return {
      requiresEmailVerification: data.session === null
    };
  };

  const verifySignupOtp = async (email: string, token: string) => {
    setLoading(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = token.replace(/\s/g, "");

    if (!normalizedEmail || normalizedToken.length !== 6 || !/^\d+$/.test(normalizedToken)) {
      setError("Please provide a valid email and six-digit code.");
      setLoading(false);
      return false;
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: "email",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return false;
    }

    if (!data.session) {
      setSession(null);
      setUser(null);
      setError("Verification did not create a session. Please request a new code and try again.");
      setLoading(false);
      return false;
    }

    setSession(data.session);
    setUser(mapSupabaseUser(data.session.user));
    clearPendingVerificationEmail();
    setLoading(false);
    return true;
  };

  const resendSignupOtp = async (email: string) => {
    setLoading(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please provide a valid email address.");
      setLoading(false);
      return false;
    }

    const supabase = getSupabaseBrowserClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });

    if (resendError) {
      setError(resendError.message);
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
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
    <AuthContext.Provider value={{ user: enhancedUser, session, loading, error, pendingVerificationEmail, login, signup, logout, refreshProfile, clearPendingVerificationEmail, verifySignupOtp, resendSignupOtp }}>
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
