"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { useLanguage } from "@/components/providers/language-provider";
import { createBooking } from "@/lib/booking-storage";
import { BOOKING_SERVICE_TYPES } from "@/lib/booking-types";

type ModelBookingFormProps = {
  artistId: string;
  modelId: string;
  onCreated?: () => void;
};

const DURATION_OPTIONS = [60, 90, 120, 180];

export function ModelBookingForm({ artistId, modelId, onCreated }: ModelBookingFormProps) {
  const { t } = useLanguage();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(String(DURATION_OPTIONS[1]));
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [serviceType, setServiceType] = useState<string>(BOOKING_SERVICE_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setNotice({ type: "error", message: t("signup.fixErrors") });
      setLoading(false);
      return;
    }

    const start = new Date(`${date}T${time}:00`);
    if (Number.isNaN(start.getTime())) {
      setNotice({ type: "error", message: t("signup.fixErrors") });
      setLoading(false);
      return;
    }

    const end = new Date(start.getTime() + minutes * 60_000);

    try {
      await createBooking({
        customerId: artistId,
        artistId,
        modelId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        notes: notes.trim(),
        address: trimmedAddress,
        contactPhone: trimmedPhone,
        serviceType,
      });
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
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <AppInput label={t("booking.dateLabel")} type="date" value={date} onChange={setDate} />
        <AppInput label={t("booking.timeLabel")} type="time" value={time} onChange={setTime} />
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-gray-700">{t("booking.durationLabel")}</span>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        >
          {DURATION_OPTIONS.map((m) => (
            <option key={m} value={String(m)}>
              {m}
            </option>
          ))}
        </select>
      </label>

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
          <span className="mb-2 block text-sm font-medium text-gray-700">{t("booking.serviceTypeLabel")}</span>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          >
            {BOOKING_SERVICE_TYPES.map((id) => (
              <option key={id} value={id}>
                {t(`booking.serviceTypes.${id}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-gray-700">{t("booking.notesLabel")}</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder={t("booking.notesPlaceholder")}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        />
      </label>

      {notice ? <Notice type={notice.type} message={notice.message} /> : null}

      <AppButton type="submit" loading={loading}>
        {t("booking.submit")}
      </AppButton>
    </form>
  );
}

