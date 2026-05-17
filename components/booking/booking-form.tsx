"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { BookingFormProgress } from "@/components/booking/booking-form-progress";
import { LoadingState } from "@/components/ui/loading-state";
import { useLanguage } from "@/components/providers/language-provider";
import { glamora } from "@/lib/ui/design-tokens";
import type { AvailabilitySlot } from "@/lib/availability/availability-types";
import { GLAMORA_TIMEZONE } from "@/lib/availability/timezone";
import { listPublicModels } from "@/lib/auth-storage";
import { UserAccount } from "@/lib/auth-types";
import { BOOKING_SERVICE_TYPES } from "@/lib/booking-types";

type BookingFormProps = {
  customerId: string;
  artistId: string;
  onCreated?: () => void;
};

const DURATION_OPTIONS = [60, 90, 120, 180];

function formatSlotTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: GLAMORA_TIMEZONE,
  });
}

export function BookingForm({ customerId, artistId, onCreated }: BookingFormProps) {
  const { t, language } = useLanguage();
  const locale = language === "VN" ? "vi-VN" : "en-US";
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState(String(DURATION_OPTIONS[0]));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [serviceType, setServiceType] = useState<string>(BOOKING_SERVICE_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [publicModels, setPublicModels] = useState<UserAccount[]>([]);
  const [optionalModelId, setOptionalModelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    void listPublicModels().then(setPublicModels);
  }, []);

  const loadSlots = useCallback(async () => {
    if (!artistId || !date) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const params = new URLSearchParams({
        date,
        duration_minutes: duration,
      });
      const res = await fetch(`/api/availability/${artistId}/slots?${params}`);
      const json = (await res.json()) as {
        success?: boolean;
        slots?: AvailabilitySlot[];
      };
      if (!res.ok || !json.success || !Array.isArray(json.slots)) {
        setSlots([]);
        return;
      }
      setSlots(json.slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [artistId, date, duration]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const availableSlots = useMemo(
    () => slots.filter((s) => s.available),
    [slots],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const trimmedAddress = address.trim();
    const trimmedPhone = contactPhone.trim();
    if (!trimmedAddress || !trimmedPhone) {
      setNotice({ type: "error", message: t("booking.fillContactFields") });
      setLoading(false);
      return;
    }

    if (!selectedSlot?.available) {
      setNotice({ type: "error", message: t("booking.slotsPickOne") });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          customerId,
          startAt: selectedSlot.start_at,
          endAt: selectedSlot.end_at,
          notes: notes.trim(),
          serviceIds: [],
          address: trimmedAddress,
          contactPhone: trimmedPhone,
          serviceType,
          ...(optionalModelId ? { modelId: optionalModelId } : {}),
        }),
      });

      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        bookingId?: string;
      };

      if (res.status === 409) {
        setNotice({ type: "error", message: t("booking.errors.slotUnavailable") });
        setLoading(false);
        void loadSlots();
        return;
      }

      if (!res.ok || !json.success) {
        setNotice({
          type: "error",
          message: json.error ?? t("signup.fixErrors"),
        });
        setLoading(false);
        return;
      }
    } catch {
      setNotice({ type: "error", message: t("signup.fixErrors") });
      setLoading(false);
      return;
    }

    setNotice({ type: "success", message: t("booking.successCreated") });
    setLoading(false);
    onCreated?.();
    setAddress("");
    setContactPhone("");
    setServiceType(BOOKING_SERVICE_TYPES[0]);
    setNotes("");
    setSelectedSlot(null);
    void loadSlots();
  }

  const hasContact = Boolean(address.trim() && contactPhone.trim());

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <BookingFormProgress hasSlot={Boolean(selectedSlot)} hasContact={hasContact} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={glamora.fieldLabel}>
            {t("booking.dateLabel")}
          </span>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className={glamora.field}
          />
        </label>
        <label className="block">
          <span className={glamora.fieldLabel}>
            {t("booking.durationLabel")}
          </span>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={glamora.field}
          >
            {DURATION_OPTIONS.map((m) => (
              <option key={m} value={String(m)}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="block">
        <span className={glamora.fieldLabel}>
          {t("booking.slotsLabel")}
        </span>
        {slotsLoading ? (
          <LoadingState message={t("booking.slotsLoading")} className="py-8" />
        ) : availableSlots.length === 0 ? (
          <p className={`rounded-2xl border border-dashed border-[var(--glamora-border)] bg-[var(--glamora-canvas-muted)] px-4 py-8 text-center text-sm text-[var(--glamora-muted)]`}>
            {t("booking.slotsEmpty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {slots.map((slot) => {
              const isSelected =
                selectedSlot?.start_at === slot.start_at &&
                selectedSlot?.end_at === slot.end_at;
              const label = `${formatSlotTime(slot.start_at, locale)} – ${formatSlotTime(slot.end_at, locale)}`;
              return (
                <button
                  key={`${slot.start_at}-${slot.end_at}`}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => slot.available && setSelectedSlot(slot)}
                  className={[
                    "rounded-2xl border px-3 py-2.5 text-left text-sm transition",
                    slot.available
                      ? isSelected
                        ? "border-pink-400 bg-pink-50 text-pink-900 ring-2 ring-pink-200"
                        : "border-black/10 bg-white text-slate-800 hover:border-pink-200 hover:bg-pink-50/50"
                      : "cursor-not-allowed border-black/5 bg-slate-100 text-slate-400",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  <span className="block font-medium">{formatSlotTime(slot.start_at, locale)}</span>
                  <span className="block text-xs opacity-70">
                    {slot.available ? label.split("–")[1]?.trim() : t("booking.slotsUnavailable")}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AppInput
        label={t("booking.addressLabel")}
        placeholder={t("booking.addressPlaceholder")}
        value={address}
        onChange={setAddress}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <AppInput
          label={t("booking.contactPhoneLabel")}
          placeholder={t("booking.contactPhonePlaceholder")}
          type="tel"
          value={contactPhone}
          onChange={setContactPhone}
        />
        <label className="block">
          <span className={glamora.fieldLabel}>
            {t("booking.serviceTypeLabel")}
          </span>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className={glamora.field}
          >
            {BOOKING_SERVICE_TYPES.map((id) => (
              <option key={id} value={id}>
                {t(`booking.serviceTypes.${id}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {publicModels.length > 0 ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700">
            {t("booking.optionalModelLabel")}
          </span>
          <select
            value={optionalModelId}
            onChange={(e) => setOptionalModelId(e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          >
            <option value="">{t("booking.optionalModelNone")}</option>
            {publicModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.username}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block">
        <span className={glamora.fieldLabel}>{t("booking.notesLabel")}</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder={t("booking.notesPlaceholder")}
          className={glamora.textarea}
        />
      </label>

      {notice ? <Notice type={notice.type} message={notice.message} /> : null}

      <AppButton type="submit" size="lg" loading={loading} disabled={slotsLoading || !selectedSlot} className="w-full sm:w-auto">
        {t("booking.confirmBooking")}
      </AppButton>
    </form>
  );
}
