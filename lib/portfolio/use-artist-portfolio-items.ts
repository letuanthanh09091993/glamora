"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioItem } from "@/lib/auth-types";
import { loadArtistPortfolioItemsForUser } from "@/lib/portfolio/fetch-artist-portfolio";

type UseArtistPortfolioItemsOptions = {
  userId: string | undefined;
  /** When false, skips auto-load (e.g. fresh post entry). */
  enabled?: boolean;
};

/**
 * Portfolio list state — DB rows are the only source of truth when length > 0.
 * Does NOT re-sync from auth `user` / JSON fallback on profile refresh.
 */
export function useArtistPortfolioItems({
  userId,
  enabled = true,
}: UseArtistPortfolioItemsOptions) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const loadGenRef = useRef(0);
  const loadedUserIdRef = useRef<string | undefined>(undefined);

  const reloadFromDb = useCallback(
    async (opts?: { clearWhenEmpty?: boolean }) => {
      if (!userId) return [];
      const gen = ++loadGenRef.current;
      const rows = await loadArtistPortfolioItemsForUser(userId);
      if (gen !== loadGenRef.current) return rows;

      console.log("[TRACE] fetched", rows.length, rows);
      if (rows.length > 0) {
        console.log("[TRACE] before setState", rows.length);
        setItems(rows);
      } else if (opts?.clearWhenEmpty) {
        setItems([]);
      }
      return rows;
    },
    [userId],
  );

  /** Load once per account — not on every `user` object reference change. */
  useEffect(() => {
    if (!enabled || !userId) {
      if (!userId) {
        loadedUserIdRef.current = undefined;
        setItems([]);
      }
      return;
    }
    if (loadedUserIdRef.current === userId) return;
    loadedUserIdRef.current = userId;
    loadGenRef.current += 1;
    void reloadFromDb();
  }, [userId, enabled, reloadFromDb]);

  useEffect(() => {
    console.log("[TRACE] after render ids", items.map((x) => x.id));
    console.log("[TRACE] state length", items.length);
  }, [items]);

  /** Skip the next auto-load for this account (e.g. `?fresh=1` empty post). */
  const markAccountLoadedWithoutFetch = useCallback(() => {
    loadedUserIdRef.current = userId;
  }, [userId]);

  return { items, setItems, reloadFromDb, markAccountLoadedWithoutFetch };
}
