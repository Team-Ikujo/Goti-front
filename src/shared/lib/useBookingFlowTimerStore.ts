import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const DEFAULT_BOOKING_TIMER_SECONDS = 599;

type BookingFlowTimerStore = {
   expiresAt: number | null;
   ensureTimerStarted: (initialSeconds?: number) => void;
   clearTimer: () => void;
};

export const useBookingFlowTimerStore = create<BookingFlowTimerStore>()(
   persist(
      (set) => ({
         expiresAt: null,

         ensureTimerStarted: (initialSeconds = DEFAULT_BOOKING_TIMER_SECONDS) =>
            set((state) => {
               if (state.expiresAt && state.expiresAt > Date.now()) {
                  return state;
               }

               return {
                  expiresAt: Date.now() + initialSeconds * 1000,
               };
            }),

         clearTimer: () => set({ expiresAt: null }),
      }),
      {
         name: 'booking-flow-timer',
         storage: createJSONStorage(() => sessionStorage),
         partialize: (state) => ({
            expiresAt: state.expiresAt,
         }),
      },
   ),
);
