"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import AuthInput from "@/components/auth/AuthInput";
import { useAuth } from "@/components/auth/AuthProvider";
import TurnstileWidget, { type TurnstileWidgetHandle } from "@/components/auth/TurnstileWidget";

export default function VerifyEmailPage() {
  const { verifySignupOtp, resendSignupOtp, pendingVerificationEmail, error, loading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileWidgetHandle>(null);

  useEffect(() => {
    if (pendingVerificationEmail) {
      setEmail(pendingVerificationEmail);
    }
  }, [pendingVerificationEmail]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    const normalizedEmail = email.trim();
    const normalizedToken = token.replace(/\s/g, "");

    if (!normalizedEmail) {
      setLocalError("Please provide your email.");
      return;
    }
    
    if (normalizedToken.length !== 6 || !/^\d+$/.test(normalizedToken)) {
      setLocalError("Please enter the six-digit code.");
      return;
    }

    const success = await verifySignupOtp(normalizedEmail, normalizedToken);
    if (success) {
      router.replace("/setup-username");
    }
  };

  const handleResend = async () => {
    setLocalError(null);
    setLocalSuccess(null);
    
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setLocalError("Please provide an email to resend the code.");
      return;
    }

    if (cooldown > 0) return;

    if (!captchaToken) {
      setLocalError("Please complete the security check before requesting a new code.");
      return;
    }

    const success = await resendSignupOtp(normalizedEmail, captchaToken);
    
    captchaRef.current?.reset();
    setCaptchaToken(null);

    if (success) {
      setLocalSuccess("A new verification code has been sent.");
      setCooldown(60);
    } else {
      setLocalError("Unable to resend code. Please wait and try again.");
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setToken(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AuthForm
          title="Verify your college email"
          description="Use the latest six-digit code from your email. Check spam or resend after the cooldown."
          actionLabel="Verify"
          loading={loading}
          error={(localError ?? error)?.includes("Token has expired or is invalid") ? "This code is invalid or expired. Use the latest email code or request a new one." : (localError ?? error)}
          success={localSuccess}
          onSubmit={handleSubmit}
          footer={
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <TurnstileWidget
                  ref={captchaRef}
                  onTokenChange={setCaptchaToken}
                  onErrorChange={setCaptchaError}
                />
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 text-left"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </button>
              </div>
              <p>
                <Link href="/signup" className="text-sm font-semibold text-slate-950 underline underline-offset-4">
                  Back to sign up
                </Link>
              </p>
            </div>
          }
        >
          <AuthInput
            label="Email"
            name="email"
            type="email"
            placeholder="jane@akgec.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthInput
            label="Verification code"
            name="token"
            type="text"
            placeholder="123456"
            value={token}
            onChange={handleTokenChange}
            maxLength={6}
          />
        </AuthForm>
      </main>
    </div>
  );
}
