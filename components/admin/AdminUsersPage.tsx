"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = {
  user_id: string;
  display_name: string;
  university: string;
  created_at: string;
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, university, created_at")
      .or(`display_name.ilike.%${search}%,university.ilike.%${search}%`)
      .limit(50);

    if (data) setUsers(data as Profile[]);
    setLoading(false);
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
        {users.map((user) => (
          <div key={user.user_id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{user.display_name}</p>
              <p className="text-sm text-slate-500">{user.university}</p>
              <p className="text-xs text-slate-400 mt-1">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            {/* Extended user management functions could go here later */}
          </div>
        ))}
      </div>
    </div>
  );
}
