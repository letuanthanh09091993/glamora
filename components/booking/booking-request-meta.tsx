"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { BOOKING_SERVICE_TYPES, type Booking } from "@/lib/booking-types";

export function BookingRequestMeta({ booking }: { booking: Booking }) {
  const { t } = useLanguage();
  const st = booking.serviceType;
  const typeLabel =
    st && (BOOKING_SERVICE_TYPES as readonly string[]).includes(st) ? t(`booking.serviceTypes.${st}`) : st;

  return (
    <>
      {typeLabel ? (
        <p className="mt-1 text-xs text-gray-700">
          <span className="font-semibold text-gray-800">{t("booking.serviceTypeLabel")}:</span> {typeLabel}
        </p>
      ) : null}
      {booking.address ? (
        <p className="mt-1 text-xs text-gray-600">
          <span className="font-semibold text-gray-800">{t("booking.addressLabel")}:</span> {booking.address}
        </p>
      ) : null}
      {booking.contactPhone ? (
        <p className="mt-1 text-xs text-gray-600">
          <span className="font-semibold text-gray-800">{t("booking.contactPhoneLabel")}:</span> {booking.contactPhone}
        </p>
      ) : null}
    </>
  );
}
