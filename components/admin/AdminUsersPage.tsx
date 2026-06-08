"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

type Profile = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  university: string;
  created_at: string;
  is_admin: boolean;
  is_verified: boolean;
  verified_at?: string | null;
  is_suspended: boolean;
  suspended_at?: string | null;
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const [verifyTarget, setVerifyTarget] = useState<Profile | null>(null);
  const [unverifyTarget, setUnverifyTarget] = useState<Profile | null>(null);
  const [verifyNote, setVerifyNote] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<Profile | null>(null);
  const [unsuspendTarget, setUnsuspendTarget] = useState<Profile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [unsuspensionNote, setUnsuspensionNote] = useState("");
  const [suspending, setSuspending] = useState(false);
  const [unsuspending, setUnsuspending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const loadUsers = async (searchQuery: string) => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    
    let usersQuery = supabase
      .from("profiles")
      .select(`
        user_id,
        display_name,
        avatar_url,
        university,
        created_at,
        is_admin,
        is_verified,
        verified_at,
        is_suspended,
        suspended_at
      `)
      .order("created_at", { ascending: false })
      .limit(25);

    const normalizedSearch = searchQuery.trim();
    if (normalizedSearch) {
      usersQuery = usersQuery.or(`display_name.ilike.%${normalizedSearch}%,university.ilike.%${normalizedSearch}%`);
    }

    const { data, error } = await usersQuery;

    if (error) {
      toast("✕ Error loading users", "error");
    } else {
      setUsers(data as Profile[]);
    }
    setLoading(false);
    setInitialLoad(false);
  };

  useEffect(() => {
    loadUsers("");
  }, []);

  const handleSearch = () => {
    loadUsers(search);
  };

  const handleVerify = async () => {
    if (!verifyTarget || !user) return;
    setVerifying(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const targetUserId = verifyTarget.user_id;

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          verification_note: verifyNote || null,
        })
        .eq("user_id", targetUserId)
        .select(`
          user_id,
          display_name,
          avatar_url,
          university,
          created_at,
          is_admin,
          is_verified,
          verified_at,
          is_suspended,
          suspended_at
        `)
        .single();

      if (updateError) throw updateError;

      const { error: auditError } = await supabase.from("moderation_actions").insert({
        admin_id: user.id,
        action: "verify_student",
        note: verifyNote || null,
      });

      if (auditError) console.error("Audit log failed:", auditError);

      setUsers(current => current.map(u => 
        u.user_id === targetUserId ? { ...u, ...updatedProfile } : u
      ));
      
      toast("✓ Student verified successfully", "success");
      setVerifyTarget(null);
      setVerifyNote("");
    } catch (e: any) {
      toast(`✕ Error verifying student: ${e.message}`, "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleUnverify = async () => {
    if (!unverifyTarget || !user) return;
    setVerifying(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const targetUserId = unverifyTarget.user_id;

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          is_verified: false,
          verified_at: null,
          verified_by: null,
          verification_note: null,
        })
        .eq("user_id", targetUserId)
        .select(`
          user_id,
          display_name,
          avatar_url,
          university,
          created_at,
          is_admin,
          is_verified,
          verified_at,
          is_suspended,
          suspended_at
        `)
        .single();

      if (updateError) throw updateError;

      const { error: auditError } = await supabase.from("moderation_actions").insert({
        admin_id: user.id,
        action: "unverify_student",
        note: null,
      });

      if (auditError) console.error("Audit log failed:", auditError);

      setUsers(current => current.map(u => 
        u.user_id === targetUserId ? { ...u, ...updatedProfile } : u
      ));
      
      toast("✓ Verification removed", "success");
      setUnverifyTarget(null);
    } catch (e: any) {
      toast(`✕ Error removing verification: ${e.message}`, "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;

    const reason = suspensionReason.trim();

    if (!reason) {
      toast("Suspension reason is required.", "error");
      return;
    }

    if (reason.length > 500) {
      toast("Suspension reason cannot exceed 500 characters.", "error");
      return;
    }

    try {
      setSuspending(true);

      const { data, error } = await supabase.rpc(
        "suspend_marketplace_user",
        {
          p_target_user_id: suspendTarget.user_id,
          p_reason: reason,
        }
      );

      if (error) {
        throw error;
      }

      const updatedProfile = Array.isArray(data)
        ? data[0]
        : data;

      if (!updatedProfile) {
        throw new Error("Suspension update returned no profile.");
      }

      setUsers((current) =>
        current.map((profile) =>
          profile.user_id === updatedProfile.user_id
            ? { ...profile, ...updatedProfile }
            : profile
        )
      );

      setSuspendTarget(null);
      setSuspensionReason("");

      toast("✓ User suspended successfully", "success");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to suspend user.",
        "error"
      );
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!unsuspendTarget) return;

    const note = unsuspensionNote.trim();

    if (note.length > 500) {
      toast("Admin note cannot exceed 500 characters.", "error");
      return;
    }

    try {
      setUnsuspending(true);

      const { data, error } = await supabase.rpc(
        "unsuspend_marketplace_user",
        {
          p_target_user_id: unsuspendTarget.user_id,
          p_note: note || null,
        }
      );

      if (error) {
        throw error;
      }

      const updatedProfile = Array.isArray(data)
        ? data[0]
        : data;

      if (!updatedProfile) {
        throw new Error("Unsuspension update returned no profile.");
      }

      setUsers((current) =>
        current.map((profile) =>
          profile.user_id === updatedProfile.user_id
            ? { ...profile, ...updatedProfile }
            : profile
        )
      );

      setUnsuspendTarget(null);
      setUnsuspensionNote("");

      toast("✓ User unsuspended successfully", "success");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to unsuspend user.",
        "error"
      );
    } finally {
      setUnsuspending(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Manage Users</h1>
        <p className="mt-2 text-slate-600">Search profiles by name or university.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search users..."
          className="w-full max-w-md rounded-full border border-slate-300 px-4 py-2 outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleSearch}
          className="rounded-full bg-slate-900 px-6 py-2 font-semibold text-white transition hover:bg-slate-800"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="space-y-4">
        {loading && initialLoad ? (
          <div className="py-12 text-center text-slate-500">
            <p className="font-medium">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="font-medium">No matching users found.</p>
          </div>
        ) : users.map((u) => (
          <div key={u.user_id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex-none overflow-hidden rounded-full bg-slate-100">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.display_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-semibold text-slate-500">
                    {u.display_name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{u.display_name}</p>
                  {u.is_verified && <VerifiedBadge compact />}
                  {u.is_admin && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">Admin</span>}
                  {u.is_suspended && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">Suspended</span>}
                </div>
                <p className="text-sm text-slate-500">{u.university}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {u.is_verified ? (
                <button
                  onClick={() => setUnverifyTarget(u)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove verification
                </button>
              ) : (
                <button
                  onClick={() => setVerifyTarget(u)}
                  className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200"
                >
                  Verify student
                </button>
              )}
              
              {!u.is_admin && u.user_id !== user?.id && (
                u.is_suspended ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUnsuspendTarget(u);
                      setUnsuspensionNote("");
                    }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Unsuspend
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSuspendTarget(u);
                      setSuspensionReason("");
                    }}
                    className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Suspend
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-950">Verify this student?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Only verify users whose identity or college affiliation has been manually checked.
            </p>
            
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Admin note:
              <textarea
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                maxLength={500}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Optional explanation..."
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              >
                {verifying ? "Verifying..." : "Verify student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {unverifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-950">Remove verification?</h2>
            
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setUnverifyTarget(null)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnverify}
                disabled={verifying}
                className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                {verifying ? "Removing..." : "Remove verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-950">Suspend this user?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Suspended users cannot create listings or send messages.
              Their active listings will be hidden from the public marketplace.
              Existing conversations and message history remain readable.
            </p>
            
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Reason for suspension:
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                maxLength={500}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Required explanation for suspension..."
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setSuspendTarget(null);
                  setSuspensionReason("");
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspend}
                disabled={suspending || !suspensionReason.trim()}
                className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                {suspending ? "Suspending..." : "Suspend user"}
              </button>
            </div>
          </div>
        </div>
      )}

      {unsuspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-950">Unsuspend this user?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Their listings will become publicly visible again if otherwise active.
              They will be able to create listings and send messages again.
            </p>
            
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Admin note:
              <textarea
                value={unsuspensionNote}
                onChange={(e) => setUnsuspensionNote(e.target.value)}
                maxLength={500}
                rows={2}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Optional explanation..."
              />
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setUnsuspendTarget(null);
                  setUnsuspensionNote("");
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnsuspend}
                disabled={unsuspending}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              >
                {unsuspending ? "Unsuspending..." : "Unsuspend user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
