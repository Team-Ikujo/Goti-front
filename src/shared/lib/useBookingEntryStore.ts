import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ZoneItem } from '@/pages/books/model/types';
import type { ApiLeagueType } from '@/shared/types/game';
import type { BotReport } from '@/shared/lib/botDetector';

export type BookingEntryState = {
   requireCaptcha?: boolean;
   forceNewSession?: boolean;
   entrySourcePath?: string;
   homeTeamId?: string;
   serverHomeTeamId?: string;
   gameId?: string;
   stadiumId?: string;
   leagueType?: ApiLeagueType;
   gameDate?: string;
   queueTokenJti?: string;
   userId?: string;
   matchTitle?: string;
   venue?: string;
   dateTime?: string;
   turnstileToken?: string;
   bookingZones?: ZoneItem[];
   botData?: BotReport;
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
