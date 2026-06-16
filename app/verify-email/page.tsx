"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import AuthInput from "@/components/auth/AuthInput";
import { useAuth } from "@/components/auth/AuthProvider";

export default function VerifyEmailPage() {
  const { verifySignupOtp, resendSignupOtp, pendingVerificationEmail, error, loading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

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

    const success = await resendSignupOtp(normalizedEmail);
    if (success) {
      setLocalSuccess("A new verification code has been sent.");
      setCooldown(60);
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
          description="A six-digit code was sent to your email address. Please enter it below to verify your account."
          actionLabel="Verify"
          loading={loading}
          error={localError ?? error}
          success={localSuccess}
          onSubmit={handleSubmit}
          footer={
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
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
