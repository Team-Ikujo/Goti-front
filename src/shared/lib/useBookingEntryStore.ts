import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ZoneItem } from '@/pages/books/model/types';

export type BookingEntryState = {
   requireCaptcha?: boolean;
   homeTeamId?: string;
   gameId?: string;
   stadiumId?: string;
   queueTokenJti?: string;
   userId?: string;
   matchTitle?: string;
   venue?: string;
   dateTime?: string;
   bookingZones?: ZoneItem[];
};

type BookingEntryStore = {
   entry: BookingEntryState | null;
   setEntry: (nextEntry: BookingEntryState) => void;
   patchEntry: (partialEntry: Partial<BookingEntryState>) => void;
   clearEntry: () => void;
};

export const useBookingEntryStore = create<BookingEntryStore>()(
   persist(
      (set) => ({
         entry: null,

         setEntry: (nextEntry) => set({ entry: nextEntry }),

         patchEntry: (partialEntry) =>
            set((state) => ({
               entry: state.entry ? { ...state.entry, ...partialEntry } : { ...partialEntry },
            })),

         clearEntry: () => set({ entry: null }),
      }),
      {
         name: 'booking-entry-store',
         storage: createJSONStorage(() => sessionStorage),
         partialize: (state) => ({
            entry: state.entry,
         }),
      },
   ),
);
