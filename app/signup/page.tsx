"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import AuthInput from "@/components/auth/AuthInput";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithProvider } from "@/lib/auth/socialLogin";
import TurnstileWidget, { type TurnstileWidgetHandle } from "@/components/auth/TurnstileWidget";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeUsername, isValidUsername, USERNAME_HINT } from "@/lib/auth/username";

function isValidInstitutionalEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export default function SignupPage() {
  const { user, signup, loading, error } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileWidgetHandle>(null);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "invalid" | "checking" | "available" | "taken" | "error">("idle");

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value.toLowerCase());
  };

  useEffect(() => {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      setUsernameStatus("idle");
      return;
    }
    if (!isValidUsername(normalized)) {
      setUsernameStatus("invalid");
      return;
    }

    let cancelled = false;

    setUsernameStatus("checking");

    const timer = setTimeout(async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: rpcError } = await supabase.rpc("is_username_available", {
          candidate_username: normalized,
        });

        if (rpcError) throw rpcError;

        if (!cancelled) {
          setUsernameStatus(data ? "available" : "taken");
        }
      } catch (err) {
        if (!cancelled) {
          setUsernameStatus("error");
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSocialMessage(null);
    setLocalError(null);

    if (!name || !email || !password || !confirmPassword) {
      setLocalError("Please complete all fields before continuing.");
      return;
    }

    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) {
      setLocalError("Please choose a username.");
      return;
    }
    if (!isValidUsername(normalizedUsername)) {
      setLocalError("Your username does not match the required format.");
      return;
    }
    if (usernameStatus === "checking") {
      setLocalError("Please wait while we check username availability.");
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

    if (!captchaToken) {
      setLocalError("Please complete the security check.");
      return;
    }

    try {
      // Submit-time recheck
      const supabase = getSupabaseBrowserClient();
      const { data: isAvailable, error: checkError } = await supabase.rpc("is_username_available", {
        candidate_username: normalizedUsername,
      });

      if (checkError) {
        setLocalError("Unable to check username availability. Please try again.");
        setUsernameStatus("error");
        return;
      }

      if (!isAvailable) {
        setLocalError("That username is no longer available. Please choose another.");
        setUsernameStatus("taken");
        return;
      }

      const result = await signup(name, normalizedUsername, email, password, captchaToken);
      
      if (!result) {
        return; // Signup failed and error is handled in provider
      }

      if (result.requiresEmailVerification) {
        router.push("/verify-email");
      } else {
        router.push("/setup-username");
      }
    } finally {
      captchaRef.current?.reset();
      setCaptchaToken(null);
    }
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

  const renderUsernameStatus = () => {
    if (usernameStatus === "invalid") {
      return <p className="mt-1 text-xs text-red-600">Invalid format.</p>;
    }
    if (usernameStatus === "checking") {
      return <p className="mt-1 text-xs text-slate-500 animate-pulse">Checking availability...</p>;
    }
    if (usernameStatus === "available") {
      return <p className="mt-1 text-xs text-emerald-600 font-medium">Username appears available.</p>;
    }
    if (usernameStatus === "taken") {
      return <p className="mt-1 text-xs text-red-600 font-medium">Username is already taken.</p>;
    }
    if (usernameStatus === "error") {
      return <p className="mt-1 text-xs text-red-600">Unable to check availability.</p>;
    }
    return null;
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
          disabled={!captchaToken}
          error={localError ?? captchaError ?? (error && (error.includes("Password should contain") || error.includes("Password must")) ? null : error) ?? (socialMessage && !socialMessage.includes("Signing in") ? socialMessage : null)}
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
          <div className="mb-4">
            <AuthInput
              label="Username"
              name="username"
              type="text"
              placeholder="jane_doe123"
              value={username}
              onChange={handleUsernameChange}
            />
            <div className="flex justify-between items-start mt-1">
              <p className="text-xs text-slate-500 flex-1 pr-4">{USERNAME_HINT}</p>
              {renderUsernameStatus()}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 leading-tight">
              Availability is checked now, but your username is confirmed only after email verification.
            </p>
          </div>
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
            showPasswordToggle
            helperText="Recommended: use 8+ characters with a mix of letters, numbers, and symbols."
            error={error && (error.includes("Password should contain") || error.includes("Password must")) ? error : undefined}
          />
          <AuthInput
            label="Confirm password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            showPasswordToggle
            helperText={password && confirmPassword && password === confirmPassword ? "Passwords match." : undefined}
            error={password && confirmPassword && password !== confirmPassword ? "Passwords do not match." : undefined}
          />
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
