"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type User = {
  name: string;
  email: string;
  avatar: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = "bs-marketplace-auth";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as User;
      setUser(parsed);
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const persistUser = (nextUser: User | null) => {
    setUser(nextUser);
    if (typeof window === "undefined") return;
    if (nextUser) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 700));

    if (!email.includes("@") || password.length < 6) {
      setError("Please enter a valid email and password with at least 6 characters.");
      setLoading(false);
      return;
    }

    persistUser({
      name: "B&S student",
      email,
      avatar: email.charAt(0).toUpperCase(),
    });
    setLoading(false);
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 900));

    if (name.trim().length < 2 || !email.includes("@") || password.length < 8) {
      setError("Enter a full name, valid email, and password with at least 8 characters.");
      setLoading(false);
      return;
    }

    persistUser({
      name: name.trim(),
      email,
      avatar: name.trim().charAt(0).toUpperCase(),
    });
    setLoading(false);
  };

  const logout = () => {
    persistUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout }}>
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
