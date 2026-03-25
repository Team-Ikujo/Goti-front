import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SeatHoldItem = {
   holdId: string;
   seatId: string;
   zoneId: string;
   gameId: string;
   queueTokenJti: string;
   heldAt: number;
};

type SeatHoldStore = {
   holdsBySeatId: Record<string, SeatHoldItem>;
   setSeatHold: (seatHold: SeatHoldItem) => void;
   removeSeatHold: (seatId: string) => void;
   clearSeatHolds: () => void;
};

export const useSeatHoldStore = create<SeatHoldStore>()(
   persist(
      (set) => ({
         holdsBySeatId: {},
         setSeatHold: (seatHold) =>
            set((state) => ({
               holdsBySeatId: {
                  ...state.holdsBySeatId,
                  [seatHold.seatId]: seatHold,
               },
            })),
         removeSeatHold: (seatId) =>
            set((state) => {
               const nextHoldsBySeatId = { ...state.holdsBySeatId };
               delete nextHoldsBySeatId[seatId];

               return {
                  holdsBySeatId: nextHoldsBySeatId,
               };
            }),
         clearSeatHolds: () => set({ holdsBySeatId: {} }),
      }),
      {
         name: 'seat-hold-store',
         storage: createJSONStorage(() => sessionStorage),
         partialize: (state) => ({
            holdsBySeatId: state.holdsBySeatId,
         }),
      },
   ),
);
