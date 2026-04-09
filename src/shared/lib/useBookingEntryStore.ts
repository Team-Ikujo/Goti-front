import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ZoneItem } from '@/pages/books/model/types';
import { logBookingFlow, summarizeBookingEntry } from '@/shared/lib/bookingFlowDebug';
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
   bookingZones?: ZoneItem[];
   botData?: BotReport;
};

export const mergeBookingEntryState = (
   routeEntry: BookingEntryState | null | undefined,
   storedEntry: BookingEntryState | null | undefined,
): BookingEntryState | null => {
   if (!routeEntry) {
      return storedEntry ?? null;
   }

   if (!storedEntry) {
      return routeEntry;
   }

   if (routeEntry.gameId && storedEntry.gameId && routeEntry.gameId !== storedEntry.gameId) {
      return routeEntry;
   }

   return {
      ...routeEntry,
      ...storedEntry,
   };
};

type BookingEntryStore = {
   hasHydrated: boolean;
   entry: BookingEntryState | null;
   setHasHydrated: (hasHydrated: boolean) => void;
   setEntry: (nextEntry: BookingEntryState) => void;
   patchEntry: (partialEntry: Partial<BookingEntryState>) => void;
   clearEntry: () => void;
};

export const useBookingEntryStore = create<BookingEntryStore>()(
   persist(
      (set) => ({
         hasHydrated: false,
         entry: null,
         setHasHydrated: (hasHydrated) => {
            logBookingFlow('BookingEntryStore', 'setHasHydrated', { hasHydrated });
            set({ hasHydrated });
         },

         setEntry: (nextEntry) => {
            logBookingFlow('BookingEntryStore', 'setEntry', summarizeBookingEntry(nextEntry));
            set({ entry: nextEntry });
         },

         patchEntry: (partialEntry) =>
            set((state) => {
               const nextEntry = state.entry ? { ...state.entry, ...partialEntry } : { ...partialEntry };
               logBookingFlow('BookingEntryStore', 'patchEntry', {
                  partialEntry,
                  previousEntry: summarizeBookingEntry(state.entry),
                  nextEntry: summarizeBookingEntry(nextEntry),
               });

               return {
                  entry: nextEntry,
               };
            }),

         clearEntry: () => {
            logBookingFlow('BookingEntryStore', 'clearEntry');
            set({ entry: null });
         },
      }),
      {
         name: 'booking-entry-store',
         storage: createJSONStorage(() => sessionStorage),
         partialize: (state) => ({
            entry: state.entry,
         }),
         onRehydrateStorage: () => state => {
            logBookingFlow('BookingEntryStore', 'onRehydrateStorage', summarizeBookingEntry(state?.entry ?? null));
            state?.setHasHydrated(true);
         },
      },
   ),
);
