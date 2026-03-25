import { create } from 'zustand';

import { MAX_SELECTED_SEATS } from './constants';
import type { SeatSelectionItem, SeatSelectionStatus } from './types';

type ZoneSeatState = {
   lastSyncedAt: number | null;
   seatMap: Record<string, SeatSelectionItem>;
   seatOrder: string[];
   selectedSeatIds: string[];
};

type SeatSelectionStore = {
   zones: Record<string, ZoneSeatState>;
   initializeZone: (zoneId: string, seats: SeatSelectionItem[]) => void;
   toggleSelectedSeat: (zoneId: string, seatId: string) => void;
   clearSelection: (zoneId: string) => void;
   clearAllSelections: () => void;
   applyServerSeatPatch: (zoneId: string, seatId: string, status: SeatSelectionStatus) => void;
   applyServerSeatSnapshot: (zoneId: string, seats: SeatSelectionItem[]) => void;
};

const createZoneState = (seats: SeatSelectionItem[]): ZoneSeatState => ({
   lastSyncedAt: Date.now(),
   seatMap: Object.fromEntries(seats.map((seat) => [seat.id, seat])),
   seatOrder: seats.map((seat) => seat.id),
   selectedSeatIds: [],
});

const isSelectableStatus = (status: SeatSelectionStatus) => status === 'available' || status === 'selected';

export const useSeatSelectionStore = create<SeatSelectionStore>((set) => ({
   zones: {},

   initializeZone: (zoneId, seats) =>
      set((state) => {
         if (state.zones[zoneId]) {
            return state;
         }

         return {
            zones: {
               ...state.zones,
               [zoneId]: createZoneState(seats),
            },
         };
      }),

   toggleSelectedSeat: (zoneId, seatId) =>
      set((state) => {
         const zone = state.zones[zoneId];

         if (!zone) {
            return state;
         }

         const seat = zone.seatMap[seatId];

         if (!seat || !isSelectableStatus(seat.status)) {
            return state;
         }

         const isAlreadySelected = zone.selectedSeatIds.includes(seatId);
         const totalSelectedSeats = Object.values(state.zones).reduce(
            (count, currentZone) => count + currentZone.selectedSeatIds.length,
            0,
         );

         if (!isAlreadySelected && totalSelectedSeats >= MAX_SELECTED_SEATS) {
            return state;
         }

         const selectedSeatIds = isAlreadySelected
            ? zone.selectedSeatIds.filter((id) => id !== seatId)
            : [...zone.selectedSeatIds, seatId];

         return {
            zones: {
               ...state.zones,
               [zoneId]: {
                  ...zone,
                  selectedSeatIds,
               },
            },
         };
      }),

   clearSelection: (zoneId) =>
      set((state) => {
         const zone = state.zones[zoneId];

         if (!zone) {
            return state;
         }

         return {
            zones: {
               ...state.zones,
               [zoneId]: {
                  ...zone,
                  selectedSeatIds: [],
               },
            },
         };
      }),

   clearAllSelections: () =>
      set((state) => ({
         zones: Object.fromEntries(
            Object.entries(state.zones).map(([zoneId, zone]) => [
               zoneId,
               {
                  ...zone,
                  selectedSeatIds: [],
               },
            ]),
         ),
      })),

   applyServerSeatPatch: (zoneId, seatId, status) =>
      set((state) => {
         const zone = state.zones[zoneId];
         const currentSeat = zone?.seatMap[seatId];

         if (!zone || !currentSeat) {
            return state;
         }

         const nextSeat = { ...currentSeat, status };
         const nextSelectedSeatIds = isSelectableStatus(status)
            ? zone.selectedSeatIds
            : zone.selectedSeatIds.filter((id) => id !== seatId);

         return {
            zones: {
               ...state.zones,
               [zoneId]: {
                  ...zone,
                  lastSyncedAt: Date.now(),
                  seatMap: {
                     ...zone.seatMap,
                     [seatId]: nextSeat,
                  },
                  selectedSeatIds: nextSelectedSeatIds,
               },
            },
         };
      }),

   applyServerSeatSnapshot: (zoneId, seats) =>
      set((state) => {
         const previousZone = state.zones[zoneId];
         const nextZone = createZoneState(seats);

         if (!previousZone) {
            return {
               zones: {
                  ...state.zones,
                  [zoneId]: nextZone,
               },
            };
         }

         const selectedSeatIds = previousZone.selectedSeatIds.filter((seatId) => {
            const seat = nextZone.seatMap[seatId];
            return seat ? isSelectableStatus(seat.status) : false;
         });

         return {
            zones: {
               ...state.zones,
               [zoneId]: {
                  ...nextZone,
                  selectedSeatIds,
               },
            },
         };
      }),
}));
