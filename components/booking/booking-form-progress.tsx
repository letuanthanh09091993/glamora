"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { glamora } from "@/lib/ui/design-tokens";

type BookingFormProgressProps = {
  hasSlot: boolean;
  hasContact: boolean;
};

export function BookingFormProgress({ hasSlot, hasContact }: BookingFormProgressProps) {
  const { t } = useLanguage();

  const steps = [
    { id: "slot", label: t("booking.progress.slot"), done: hasSlot },
    { id: "contact", label: t("booking.progress.contact"), done: hasContact },
    { id: "confirm", label: t("booking.progress.confirm"), done: hasSlot && hasContact },
  ];

  return (
    <ol className="mb-6 grid grid-cols-3 gap-2 sm:gap-3" aria-label={t("booking.progress.label")}>
      {steps.map((step, index) => (
        <li key={step.id} className="min-w-0">
          <div
            className={`rounded-2xl border px-2 py-2.5 text-center sm:px-3 ${
              step.done
                ? "border-[var(--glamora-rose)] bg-[var(--glamora-rose-soft)] text-rose-900"
                : "border-[var(--glamora-border)] bg-white text-gray-500"
            }`}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">
              {index + 1}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-semibold sm:text-xs">{step.label}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
