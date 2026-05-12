"use client";

import { useMemo, useState } from "react";
import { Booking } from "@/lib/booking-types";
import { useLanguage } from "@/components/providers/language-provider";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

type BookingCalendarProps = {
  bookings: Booking[];
  resolveName: (userId: string) => string;
  variant?: "customer" | "artist";
};

export function BookingCalendar({ bookings, resolveName, variant = "customer" }: BookingCalendarProps) {
  const { t, language } = useLanguage();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const weekdayLabels = t("booking.weekdaysShort").split(",");

  const monthMatrix = useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const start = new Date(b.startAt);
      const key = toDayKey(start);
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    return map;
  }, [bookings]);

  const selectedBookings = useMemo(() => {
    if (!selected) return [];
    const key = toDayKey(selected);
    return (bookingsByDay.get(key) ?? []).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [bookingsByDay, selected]);

  const monthTitle = cursor.toLocaleString(language === "VN" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-black">{t("booking.calendarTitle")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
          >
            {t("booking.prevMonth")}
          </button>
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
          >
            {t("booking.nextMonth")}
          </button>
        </div>
      </div>

      <p className="mt-2 text-center text-base font-semibold capitalize text-black sm:text-left">{monthTitle}</p>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-2">
            {w.trim()}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {monthMatrix.map((day, idx) => {
          if (!day) {
            return <div key={`e-${idx}`} className="aspect-square rounded-2xl bg-transparent" />;
          }
          const key = toDayKey(day);
          const dayBookings = bookingsByDay.get(key) ?? [];
          const isSelected = selected && sameDay(day, selected);
          const isToday = sameDay(day, new Date());
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(day)}
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl border text-sm transition ${
                isSelected
                  ? "border-pink-400 bg-pink-50 text-black shadow-inner"
                  : "border-black/5 bg-white hover:border-pink-200 hover:bg-pink-50/40"
              } ${isToday && !isSelected ? "ring-2 ring-pink-200" : ""}`}
            >
              <span className="font-semibold">{day.getDate()}</span>
              {dayBookings.length > 0 ? (
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pink-500" aria-label={t("booking.legendHasBooking")} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
          {t("booking.legendHasBooking")}
        </span>
      </div>

      <div className="mt-6 border-t border-black/5 pt-4">
        <p className="text-sm font-semibold text-black">
          {selected ? t("booking.selectedDay") : t("booking.listTitle")}
        </p>
        {selected ? (
          <p className="mt-1 text-xs text-gray-500">
            {selected.toLocaleDateString(language === "VN" ? "vi-VN" : "en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        ) : null}

        {!selected ? (
          <p className="mt-3 text-sm text-gray-500">{t("booking.selectDayPrompt")}</p>
        ) : selectedBookings.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">{t("booking.empty")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {selectedBookings.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-black/10 bg-[#fdf8f6] p-4 text-sm text-gray-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <BookingStatusBadge status={b.status} />
                  <span className="text-xs text-gray-500">
                    {new Date(b.startAt).toLocaleTimeString(language === "VN" ? "vi-VN" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" — "}
                    {new Date(b.endAt).toLocaleTimeString(language === "VN" ? "vi-VN" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-2 font-medium text-black">
                  {variant === "customer" ? t("booking.withArtist") : t("booking.withCustomer")}:{" "}
                  {variant === "customer" ? resolveName(b.artistId) : resolveName(b.customerId)}
                </p>
                {b.notes ? <p className="mt-1 text-xs text-gray-600">{b.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
