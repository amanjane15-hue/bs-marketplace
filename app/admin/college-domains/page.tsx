"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CollegeDomain = {
  id: string;
  college_name: string;
  email_domain: string;
  is_active: boolean;
  created_at: string;
  added_by: string;
};

export default function CollegeDomainsPage() {
  const [domains, setDomains] = useState<CollegeDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCollegeName, setNewCollegeName] = useState("");
  const [newEmailDomain, setNewEmailDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("college_email_domains")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDomains(data as CollegeDomain[]);
    } catch (err: any) {
      setError(err.message || "Failed to load domains");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("add_college_email_domain", {
        p_college_name: newCollegeName,
        p_email_domain: newEmailDomain,
      });

      if (error) throw error;

      setNewCollegeName("");
      setNewEmailDomain("");
      setDomains((prev) => [data as CollegeDomain, ...prev]);
    } catch (err: any) {
      setAddError(err.message || "Failed to add domain");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleStatus(domainId: string, currentStatus: boolean) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.rpc("set_college_email_domain_status", {
        p_domain_id: domainId,
        p_is_active: !currentStatus,
      });

      if (error) throw error;

      setDomains((prev) =>
        prev.map((d) => (d.id === domainId ? (data as CollegeDomain) : d))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update domain status");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Manage College Domains</h1>
        <p className="mt-2 text-slate-600">Restrict new account registrations to approved institutional email domains.</p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Add New Domain</h2>
        <form onSubmit={handleAddDomain} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="collegeName" className="block text-sm font-medium text-slate-700">
              College Name
            </label>
            <input
              type="text"
              id="collegeName"
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
              placeholder="Ajay Kumar Garg Engineering College"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="emailDomain" className="block text-sm font-medium text-slate-700">
              Email Domain
            </label>
            <input
              type="text"
              id="emailDomain"
              value={newEmailDomain}
              onChange={(e) => setNewEmailDomain(e.target.value)}
              placeholder="akgec.ac.in"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newCollegeName.trim() || !newEmailDomain.trim()}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add Domain"}
          </button>
        </form>
        {addError && <p className="mt-2 text-sm text-rose-600">{addError}</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading domains...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600">{error}</div>
        ) : domains.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No college domains configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">College</th>
                  <th className="px-6 py-4 font-semibold">Email Domain</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 font-semibold">Added By</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {domains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{domain.college_name}</td>
                    <td className="px-6 py-4">{domain.email_domain}</td>
                    <td className="px-6 py-4">
                      {domain.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(domain.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                      {domain.added_by}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(domain.id, domain.is_active)}
                        className={`text-xs font-semibold ${
                          domain.is_active ? "text-rose-600 hover:text-rose-500" : "text-emerald-600 hover:text-emerald-500"
                        }`}
                      >
                        {domain.is_active ? "Disable" : "Re-enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
