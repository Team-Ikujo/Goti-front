import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ZoneItem } from '@/pages/books/model/types';
import type { BookingFlowMode } from '@/shared/lib/booking-flow';
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
   bookingFlowMode?: BookingFlowMode;
   queueTokenJti?: string;
   userId?: string;
   matchTitle?: string;
   venue?: string;
   dateTime?: string;
   bookingZones?: ZoneItem[];
   botData?: BotReport;
};

const ROUTE_CLEARABLE_ENTRY_KEYS: Array<keyof BookingEntryState> = ['requireCaptcha', 'forceNewSession', 'bookingZones'];

const mergeRouteEntryValue = (
   mergedEntry: BookingEntryState,
   key: keyof BookingEntryState,
   value: BookingEntryState[keyof BookingEntryState],
) => {
   if (value !== undefined || ROUTE_CLEARABLE_ENTRY_KEYS.includes(key)) {
      mergedEntry[key] = value;
   }
};

export const isSameBookingEntryState = (left: BookingEntryState | null, right: BookingEntryState | null) => {
   if (left === right) {
      return true;
   }

   if (!left || !right) {
      return false;
   }

   const leftKeys = Object.keys(left) as Array<keyof BookingEntryState>;
   const rightKeys = Object.keys(right) as Array<keyof BookingEntryState>;

   if (leftKeys.length !== rightKeys.length) {
      return false;
   }

   return leftKeys.every((key) => left[key] === right[key]);
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

   const mergedEntry = { ...storedEntry };

   // 현재 라우트 진입 정보가 이전 세션보다 우선해야 일반/리셀 플로우가 뒤섞이지 않는다.
   (Object.keys(routeEntry) as Array<keyof BookingEntryState>).forEach((key) => {
      mergeRouteEntryValue(mergedEntry, key, routeEntry[key]);
   });

   return mergedEntry;
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
