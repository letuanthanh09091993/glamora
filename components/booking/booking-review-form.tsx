"use client";

import { FormEvent, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { Notice } from "@/components/ui/notice";
import { useLanguage } from "@/components/providers/language-provider";
import { submitBookingFeedback } from "@/lib/booking-storage";
import { useAuth } from "@/components/providers/auth-provider";

const RATINGS = [1, 2, 3, 4, 5] as const;

type BookingReviewFormProps = {
  bookingId: string;
  onSubmitted?: () => void;
};

export function BookingReviewForm({ bookingId, onSubmitted }: BookingReviewFormProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setNotice(null);
    const result = await submitBookingFeedback(bookingId, { id: user.id, role: user.role }, { rating, feedback });
    if (!result.ok) {
      setNotice({ type: "error", message: t(result.messageKey) });
      setLoading(false);
      return;
    }
    setNotice({ type: "success", message: t("booking.review.success") });
    setLoading(false);
    onSubmitted?.();
  }

  return (
    <form className="mt-3 space-y-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4" onSubmit={handleSubmit}>
      <p className="text-sm font-semibold text-black">{t("booking.review.title")}</p>
      <p className="text-xs text-gray-600">{t("booking.review.hint")}</p>
      <div>
        <p className="mb-2 text-xs font-medium text-gray-700">{t("booking.review.ratingLabel")}</p>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`min-h-[40px] min-w-[40px] rounded-full text-sm font-semibold transition ${
                rating === n ? "bg-black text-white" : "border border-black/15 bg-white text-gray-800 hover:bg-black/5"
              }`}
            >
              {n}★
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-gray-700">{t("booking.review.feedbackLabel")}</span>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          placeholder={t("booking.review.feedbackPlaceholder")}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        />
      </label>
      {notice ? <Notice type={notice.type} message={notice.message} /> : null}
      <AppButton type="submit" loading={loading}>
        {t("booking.review.submit")}
      </AppButton>
    </form>
  );
}
