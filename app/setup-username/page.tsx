"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import AuthInput from "@/components/auth/AuthInput";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeUsername, isValidUsername, USERNAME_HINT } from "@/lib/auth/username";

export default function SetupUsernamePage() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "invalid" | "checking" | "available" | "taken" | "error">("idle");

  useEffect(() => {
    if (authLoading) return;

    if (!session || !user) {
      router.replace("/login");
      return;
    }

    const checkExistingUsername = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          setError("Unable to load your profile. Please try again.");
          setLoading(false);
          return;
        }
        
        if (!data) {
          setError("Profile not found. Please contact support.");
          setLoading(false);
          return;
        }

        if (data.username) {
          router.replace("/dashboard");
          return;
        }

        // Prefill from metadata
        const metadataUsername = session.user.user_metadata?.desired_username;
        if (metadataUsername) {
          const normalized = normalizeUsername(metadataUsername);
          if (isValidUsername(normalized)) {
            setUsername(normalized);
          }
        }
      } catch (err) {
        console.error("Failed to check existing username", err);
      } finally {
        setLoading(false);
      }
    };

    void checkExistingUsername();
  }, [user, authLoading, router]);

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
    setError(null);

    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) {
      setError("Please choose a username.");
      return;
    }
    
    if (!isValidUsername(normalizedUsername)) {
      setError("Your username does not match the required format.");
      return;
    }

    if (usernameStatus === "checking") {
      setError("Please wait while we check username availability.");
      return;
    }

    setLoading(true);

    try {
      // Re-verify availability
      const supabase = getSupabaseBrowserClient();
      const { data: isAvailable, error: checkError } = await supabase.rpc("is_username_available", {
        candidate_username: normalizedUsername,
      });

      if (checkError) {
        setError("Unable to check username availability. Please try again.");
        setUsernameStatus("error");
        setLoading(false);
        return;
      }

      if (!isAvailable) {
        setError("That username is no longer available. Please choose another.");
        setUsernameStatus("taken");
        setLoading(false);
        return;
      }

      const { error: claimError } = await supabase.rpc("claim_username", {
        candidate_username: normalizedUsername,
      });

      if (claimError) {
        setError(claimError.message || "Failed to claim username.");
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center animate-pulse">
            <p className="text-slate-500">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="space-y-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AuthForm
          title="Choose your username"
          description="Your username will be your public identity on the marketplace. It cannot be changed once claimed."
          actionLabel="Claim username"
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
        >
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
          </div>
        </AuthForm>
      </main>
    </div>
  );
}
