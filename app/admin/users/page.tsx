import { getSupabaseServerClient } from "@/lib/supabase/server";
import AdminUsersPage from "@/components/admin/AdminUsersPage";

export const metadata = {
  title: "Manage Users | Admin",
  description: "Moderation users directory.",
};

export default async function UsersRoute() {
  return <AdminUsersPage />;
}
