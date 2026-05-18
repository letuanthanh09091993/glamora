import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortfolioItem } from "@/lib/auth-types";
import { fetchArtistPortfolioItemsForUser } from "@/lib/supabase/users-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Load all portfolio rows for the current user (no limit). */
export async function loadArtistPortfolioItemsForUser(
  userId: string,
  supabase?: SupabaseClient,
): Promise<PortfolioItem[]> {
  const sb = supabase ?? getSupabaseBrowserClient();
  const rows = await fetchArtistPortfolioItemsForUser(sb, userId);
  console.log("[TRACE] fetched", rows.length, rows);
  return rows;
}
