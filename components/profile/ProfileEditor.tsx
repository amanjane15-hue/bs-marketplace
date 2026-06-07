"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import CollegeCombobox from "@/components/ui/CollegeCombobox";
import { aktuColleges } from "@/data/aktu-colleges";

export default function ProfileEditor() {
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [university, setUniversity] = useState<string>(aktuColleges[0].value);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from("profiles").select("display_name,bio,university,avatar_url,created_at").eq("user_id", user.id).single();
      if (data) {
        setDisplayName(data.display_name ?? user.name ?? "");
        setBio(data.bio ?? "");
        setUniversity(data.university || aktuColleges[0].value);
        setAvatarUrl(data.avatar_url ?? null);
      } else {
        setDisplayName(user.name ?? "");
      }
    };
    void fetchProfile();
  }, [user]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setUploadError(null);
    const supabase = getSupabaseBrowserClient();
    
    const safeFileName = file.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "");
      
    const path = `${user.id}/avatar-${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", upsert: true, metadata: { owner: user.id } });
    if (uploadError) {
      console.error(uploadError);
      setUploadError(uploadError.message ?? "Upload failed");
      setUploading(false);
      return;
    }
    const { data: publicData } = await supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = publicData?.publicUrl ?? null;
    if (publicUrl) setAvatarUrl(publicUrl);
    // upsert profile with new avatar_url
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, display_name: displayName, bio, university, avatar_url: publicUrl }, { onConflict: "user_id" });
    if (error) {
      console.error(error);
      setUploadError(error.message ?? "Failed to save avatar URL");
    } else {
      void refreshProfile();
    }
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    setLoading(true);
    setSaveError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("profiles").upsert({ user_id: user.id, display_name: displayName, bio, university, avatar_url: avatarUrl }, { onConflict: "user_id" });
      if (error) throw error;
      
      void refreshProfile();
      
      toast("✓ Profile saved successfully", "success");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message ?? "Failed to save profile");
      toast("✕ Failed to save profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Profile</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">{displayName ?? user?.name}</h1>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">Display name</span>
          <input value={displayName ?? ""} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 rounded border border-slate-200 px-3 py-2" />
        </label>

        <div className="flex flex-col">
          <CollegeCombobox
            value={university}
            onChange={setUniversity}
          />
        </div>

        <label className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">Bio</span>
          <textarea value={bio ?? ""} onChange={(e) => setBio(e.target.value)} className="mt-2 rounded border border-slate-200 px-3 py-2" rows={4} />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">Avatar</span>
          <input type="file" accept="image/*" onChange={(e) => e.target.files && uploadAvatar(e.target.files[0])} className="mt-2" />
          {uploading && <div className="mt-2 text-sm text-slate-500">Uploading...</div>}
          {uploadError && <div className="mt-2 text-sm text-rose-600">{uploadError}</div>}
          {avatarUrl && <img src={avatarUrl} alt="avatar" className="mt-2 h-20 w-20 rounded-full object-cover" />}
        </label>

        <div className="mt-4 flex items-center justify-end gap-3">
          <div className="flex-1 text-left text-sm text-rose-600">{saveError}</div>
          <button onClick={save} disabled={loading || saveSuccess} className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-80">
            {saveSuccess ? "Saved ✓" : loading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
