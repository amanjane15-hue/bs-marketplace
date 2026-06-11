"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import AuthInput from "@/components/auth/AuthInput";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithProvider } from "@/lib/auth/socialLogin";
import TurnstileWidget, { type TurnstileWidgetHandle } from "@/components/auth/TurnstileWidget";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const { user, login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileWidgetHandle>(null);

  function getSafeNextUrl(value: string | null) {
    return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
  }

  const redirectAttempted = useRef(false);

  useEffect(() => {
    if (!user || redirectAttempted.current) return;

    redirectAttempted.current = true;
    router.replace(getSafeNextUrl(nextParam));
  }, [user, router, nextParam]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSocialMessage(null);
    setLocalError(null);

    if (!email || !password) {
      setLocalError("Please enter your email and password.");
      return;
    }

    if (!captchaToken) {
      setLocalError("Please complete the security check.");
      return;
    }

    try {
      await login(email, password, captchaToken);
    } finally {
      captchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  const handleSocialClick = async (provider: "Google" | "Facebook" | "Apple") => {
    setLocalError(null);
    setSocialMessage(null);

    setSocialLoading(true);
    try {
      await signInWithProvider(provider.toLowerCase() as any);
      setSocialMessage("Signing in...");
    } catch (e: any) {
      setSocialLoading(false);
      setLocalError(e?.message || "OAuth login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AuthForm
          title="Welcome back"
          description="Sign in to manage your listings, track saved items, and access student deals."
          actionLabel="Sign in"
          loading={loading || socialLoading}
          disabled={!captchaToken}
          error={captchaError ?? (socialMessage && !socialMessage.includes("Signing in") ? socialMessage : null)}
          success={user ? `Signed in as ${user.name}.` : (socialMessage?.includes("Signing in") ? socialMessage : undefined)}
          onSubmit={handleSubmit}
          footer={
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-slate-950 underline underline-offset-4">
                Create one
              </Link>
              .
            </p>
          }
        >
          <SocialLoginButtons providers={["Google"]} loading={loading || socialLoading} onProviderClick={handleSocialClick} />

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span className="block h-px flex-1 bg-slate-200" />
            <span>or sign in with email</span>
            <span className="block h-px flex-1 bg-slate-200" />
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-semibold">Student email required</p>
            <p className="mt-1">
              Use your approved college-issued email address to sign in.
            </p>
          </div>

          <AuthInput
            label="Email"
            name="email"
            type="email"
            placeholder="jane@student.edu"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setLocalError(null);
            }}
          />
          <AuthInput
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setLocalError(null);
            }}
          />
          {(localError ?? error) && (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {localError ?? error}
            </p>
          )}
          <TurnstileWidget
            ref={captchaRef}
            onTokenChange={setCaptchaToken}
            onErrorChange={setCaptchaError}
          />
        </AuthForm>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}
