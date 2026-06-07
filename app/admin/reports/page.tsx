import { getSupabaseServerClient } from "@/lib/supabase/server";
import AdminReportsPage from "@/components/admin/AdminReportsPage";

export const metadata = {
  title: "Review Reports | Admin",
  description: "Moderation reports dashboard.",
};

export default async function ReportsRoute() {
  return <AdminReportsPage />;
}
