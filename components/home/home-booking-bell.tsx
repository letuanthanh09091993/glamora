"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { AppRoutes } from "@/lib/app-routes";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";
import { fetchUsernameMap } from "@/lib/supabase/users-repository";
import {
  getArtistInboxBookings,
  getCustomerInboxBookings,
  getModelInboxBookings,
  markArtistInboxSeen,
  markCustomerInboxSeen,
  markModelInboxSeen,
} from "@/lib/booking-notification-receipts";
import type { Booking } from "@/lib/booking-types";

type HomeBookingBellProps = {
  buttonClassName?: string;
};

function inboxLineKey(b: Booking, role: "makeup_artist" | "customer" | "model"): string {
  if (role === "makeup_artist") {
    if (b.status === "pending") {
      if (b.customerId === b.artistId && b.modelId) return "home.notifications.artistModelLine";
      return "home.notifications.artistLine";
    }
    return "home.notifications.artistAwaitingFeedbackLine";
  }
  if (b.status === "confirmed") return "home.notifications.customerLine";
  return "home.notifications.customerServiceDoneLine";
}

export function HomeBookingBell({ buttonClassName }: HomeBookingBellProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [snapshot, setSnapshot] = useState<Booking[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());
  const wrapRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const id = window.setInterval(() => refresh(), 15000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    void (async () => {
      if (user.role === "makeup_artist") {
        const list = await getArtistInboxBookings(user.id);
        setUnreadCount(list.length);
      } else if (user.role === "customer") {
        const list = await getCustomerInboxBookings(user.id);
        setUnreadCount(list.length);
      } else if (user.role === "model") {
        const list = await getModelInboxBookings(user.id);
        setUnreadCount(list.length);
      } else {
        setUnreadCount(0);
      }
    })();
  }, [user, tick]);

  useEffect(() => {
    if (!snapshot?.length) {
      setNameMap(new Map());
      return;
    }
    const ids = [
      ...new Set(snapshot.flatMap((b) => [b.customerId, b.artistId, b.modelId].filter(Boolean) as string[])),
    ];
    void fetchUsernameMap(getBrowserSupabase(), ids).then(setNameMap);
  }, [snapshot]);

  const closePanel = useCallback(() => {
    if (snapshot?.length) {
      if (user?.role === "makeup_artist") markArtistInboxSeen(snapshot);
      if (user?.role === "customer") markCustomerInboxSeen(snapshot);
      if (user?.role === "model") markModelInboxSeen(snapshot);
    }
    setSnapshot(null);
    setOpen(false);
    refresh();
  }, [snapshot, user?.role, refresh]);

  const openPanel = useCallback(() => {
    if (!user) return;
    void (async () => {
      if (user.role === "makeup_artist") {
        setSnapshot(await getArtistInboxBookings(user.id));
      } else if (user.role === "customer") {
        setSnapshot(await getCustomerInboxBookings(user.id));
      } else if (user.role === "model") {
        setSnapshot(await getModelInboxBookings(user.id));
      } else {
        setSnapshot([]);
      }
      setOpen(true);
    })();
  }, [user]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        if (open) closePanel();
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, closePanel]);

  const locale = language === "VN" ? "vi-VN" : "en-US";

  if (!user) return null;

  const bookingsHref =
    user.role === "makeup_artist"
      ? AppRoutes.dashboardMakeupArtistBookings
      : user.role === "customer"
        ? AppRoutes.dashboardCustomerBookings
        : user.role === "model"
          ? AppRoutes.dashboardModelBookings
        : null;

  const bookingsButtonLabel =
    user.role === "makeup_artist"
      ? t("home.notifications.viewArtistBookings")
      : user.role === "customer"
        ? t("home.notifications.viewCustomerBookings")
        : user.role === "model"
          ? t("home.notifications.viewModelBookings")
          : "";

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        className={
          buttonClassName ??
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-gray-800 transition hover:bg-black/5"
        }
        aria-label={t("home.notifications.badgeAria")}
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm8-5H4a1 1 0 0 1-.89-1.46l1.06-2.12A4 4 0 0 0 5 12V9a7 7 0 1 1 14 0v3a4 4 0 0 0 .83 2.42l1.06 2.12A1 1 0 0 1 20 17Z" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-black/10 bg-white p-4 text-left shadow-lg"
          role="dialog"
          aria-label={t("home.notifications.title")}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">{t("home.notifications.title")}</p>

          {user.role !== "makeup_artist" && user.role !== "customer" && user.role !== "model" ? (
            <p className="mt-3 text-sm text-gray-600">{t("home.notifications.roleOtherHint")}</p>
          ) : !snapshot || snapshot.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">{t("home.notifications.empty")}</p>
          ) : (
            <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
              {snapshot.map((b) => (
                <li key={b.id} className="rounded-xl border border-black/5 bg-[#fdf8f6] p-3 text-sm text-gray-800">
                  <p className="font-medium text-black">
                    {user.role === "makeup_artist" || user.role === "customer" || user.role === "model"
                      ? t(inboxLineKey(b, user.role as "makeup_artist" | "customer" | "model"))
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {user.role === "makeup_artist" ? (
                      b.customerId === b.artistId && b.modelId ? (
                        `${t("booking.withModel")}: ${nameMap.get(b.modelId) ?? "—"}`
                      ) : (
                        `${t("booking.withCustomer")}: ${nameMap.get(b.customerId) ?? "—"}`
                      )
                    ) : user.role === "model" ? (
                      `${t("booking.withArtist")}: ${nameMap.get(b.artistId) ?? "—"}`
                    ) : (
                      `${t("booking.withArtist")}: ${nameMap.get(b.artistId) ?? "—"}`
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(b.startAt).toLocaleString(locale, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {bookingsHref ? (
            <Link
              href={bookingsHref}
              onClick={() => closePanel()}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:opacity-90"
            >
              {bookingsButtonLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
