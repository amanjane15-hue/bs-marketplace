"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import AuthInput from "@/components/auth/AuthInput";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithProvider } from "@/lib/auth/socialLogin";

function isValidInstitutionalEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export default function SignupPage() {
  const { user, signup, loading, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSocialMessage(null);
    setLocalError(null);

    if (!name || !email || !password || !confirmPassword) {
      setLocalError("Please complete all fields before continuing.");
      return;
    }

    if (!isValidInstitutionalEmail(email)) {
      setLocalError("Please sign up using an approved college-issued email address.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Your passwords do not match.");
      return;
    }

    await signup(name, email, password);
  };

  const handleSocialClick = async (provider: "Google" | "Facebook" | "Apple") => {
    setLocalError(null);
    setSocialMessage(null);

    if (provider === "Apple") {
      setSocialMessage("Apple login coming soon.");
      return;
    }

    if (provider === "Facebook") {
      setSocialMessage("Facebook login coming soon.");
      return;
    }

    setSocialLoading(true);
    try {
      await signInWithProvider(provider.toLowerCase() as any);
      setSocialMessage("Signing in...");
    } catch (e: any) {
      setSocialLoading(false);
      setLocalError(e?.message || "OAuth signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AuthForm
          title="Create your account"
          description="Set up a student profile and start listing items on the B&S marketplace."
          actionLabel="Sign up"
          loading={loading || socialLoading}
          error={localError ?? error ?? (socialMessage && !socialMessage.includes("Signing in") ? socialMessage : null)}
          success={user ? `Welcome aboard, ${user.name}!` : (socialMessage?.includes("Signing in") ? socialMessage : undefined)}
          onSubmit={handleSubmit}
          footer={
            <p>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-slate-950 underline underline-offset-4">
                Log in
              </Link>
              .
            </p>
          }
        >
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">College-issued email required</p>
            <p className="mt-1 opacity-90">Use your approved college email address to create an account.</p>
            <p className="mt-1 text-xs opacity-75">AKGEC students can use an email ending in @akgec.ac.in.</p>
          </div>

          <SocialLoginButtons loading={loading || socialLoading} onProviderClick={handleSocialClick} />

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span className="block h-px flex-1 bg-slate-200" />
            <span>or sign up with email</span>
            <span className="block h-px flex-1 bg-slate-200" />
          </div>

          <AuthInput
            label="Full name"
            name="name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <AuthInput
            label="Email"
            name="email"
            type="email"
            placeholder="jane@akgec.ac.in"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <AuthInput
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <AuthInput
            label="Confirm password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </AuthForm>
      </main>
    </div>
  );
}
