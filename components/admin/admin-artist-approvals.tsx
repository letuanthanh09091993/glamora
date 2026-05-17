"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { adminUpdateUserAccount, listPublicMakeupArtists } from "@/lib/auth-storage";
import type { UserAccount } from "@/lib/auth-types";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";

type PendingArtist = UserAccount & { artistVerificationStatus: string };

export function AdminArtistApprovals() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [liveVerified, setLiveVerified] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getBrowserSupabase();
    const { data, error } = await sb
      .from("users")
      .select(
        "id, username, role, artist_verification_status, is_public_profile, profiles(display_name, avatar_url)",
      )
      .eq("role", "makeup_artist")
      .eq("artist_verification_status", "pending")
      .limit(100);

    if (error || !data) {
      setPending([]);
      setLoading(false);
      return;
    }

    const mapped: PendingArtist[] = data.map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: String(row.id),
        username: String(row.username),
        role: "makeup_artist",
        phoneNumber: "",
        displayName: profile?.display_name ? String(profile.display_name) : undefined,
        avatarUrl: profile?.avatar_url ? String(profile.avatar_url) : undefined,
        isPublicProfile: Boolean(row.is_public_profile),
        artistVerificationStatus: String(row.artist_verification_status ?? "pending"),
      } as PendingArtist;
    });

    setPending(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    void listPublicMakeupArtists().then((a) => setLiveVerified(a.length));
  }, [load]);

  async function setVerification(userId: string, status: "verified" | "rejected") {
    if (!user?.id) return;
    setBusyId(userId);
    const result = await adminUpdateUserAccount(user.id, userId, {
      artistVerificationStatus: status,
    });
    setBusyId(null);
    if (result.ok) {
      void load();
      void listPublicMakeupArtists().then((a) => setLiveVerified(a.length));
    }
  }

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title={t("dashboard.adminArtists.title")}
        subtitle={t("dashboard.adminArtists.subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {t("dashboard.adminArtists.pending")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{pending.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {t("dashboard.adminArtists.verifiedLive")}
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{liveVerified}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">{t("gate.loadingSession")}</p>
      ) : pending.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {t("dashboard.adminArtists.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((artist) => (
            <li
              key={artist.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100/80 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {artist.displayName ?? artist.username}
                </p>
                <p className="text-xs text-slate-500">@{artist.username}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === artist.id}
                  onClick={() => void setVerification(artist.id, "verified")}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {t("dashboard.adminArtists.approve")}
                </button>
                <button
                  type="button"
                  disabled={busyId === artist.id}
                  onClick={() => void setVerification(artist.id, "rejected")}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  {t("dashboard.adminArtists.reject")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
