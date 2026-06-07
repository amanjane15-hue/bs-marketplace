import { getSupabaseServerClient } from "@/lib/supabase/server";
import ModerationHistoryPage from "@/components/admin/ModerationHistoryPage";

export const metadata = {
  title: "Moderation History | Admin",
  description: "Moderation actions audit log.",
};

export default async function HistoryRoute() {
  return <ModerationHistoryPage />;
}
