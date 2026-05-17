"use client";



import type { Booking } from "@/lib/booking-types";

import { isUpcomingBookingStatus } from "@/lib/booking/booking-status";

import { useLanguage } from "@/components/providers/language-provider";

import { glamora } from "@/lib/ui/design-tokens";



export type BookingTab = "upcoming" | "past";



type Props = {

  tab: BookingTab;

  onTabChange: (tab: BookingTab) => void;

  bookings: Booking[];

};



export function filterBookingsByTab(bookings: Booking[], tab: BookingTab): Booking[] {

  return bookings.filter((b) =>

    tab === "upcoming" ? isUpcomingBookingStatus(b.status) : !isUpcomingBookingStatus(b.status),

  );

}



export function BookingListTabs({ tab, onTabChange, bookings }: Props) {

  const { t } = useLanguage();

  const upcomingCount = filterBookingsByTab(bookings, "upcoming").length;

  const pastCount = filterBookingsByTab(bookings, "past").length;



  const tabs: { id: BookingTab; label: string; count: number }[] = [

    { id: "upcoming", label: t("booking.tabs.upcoming"), count: upcomingCount },

    { id: "past", label: t("booking.tabs.past"), count: pastCount },

  ];



  return (

    <div className="flex flex-wrap gap-2" role="tablist">

      {tabs.map((item) => {

        const active = tab === item.id;

        return (

          <button

            key={item.id}

            type="button"

            role="tab"

            aria-selected={active}

            onClick={() => onTabChange(item.id)}

            className={

              active

                ? glamora.navLinkActive

                : `${glamora.navLink} bg-white ring-1 ring-[var(--glamora-border)]`

            }

          >

            {item.label}

            <span className={`ml-1.5 tabular-nums ${active ? "text-rose-200" : "text-gray-400"}`}>

              ({item.count})

            </span>

          </button>

        );

      })}

    </div>
  );
}


