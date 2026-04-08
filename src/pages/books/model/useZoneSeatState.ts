import { useEffect, useMemo } from 'react';

import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { MAX_SELECTED_SEATS } from '@/entities/seat-selection/model/constants';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { createSeatsForZone } from './seatData';
import { getSelectedSeatDetails } from './selectedSeats';
import type { SeatItem, ZoneItem } from './types';
import { useSeatHoldActions } from './useSeatHoldActions';
import { useSeatMapData } from './useSeatMapData';

type UseZoneSeatStateParams = {
   bookingEntryState: BookingEntryState | null;
   bookingZones: ZoneItem[];
   onPurchaseLimitReached?: () => void;
   zone: ZoneItem;
};

export function useZoneSeatState({
   bookingEntryState,
   bookingZones,
   onPurchaseLimitReached,
   zone,
}: UseZoneSeatStateParams) {
   const initialSeats = useMemo(() => createSeatsForZone(zone), [zone]);
   const {
      apiSeatItems,
      seatBlocks,
      hasApiSeatMap,
      isSeatMapError,
      seatMapErrorMessage,
      isSeatMapLoading,
      refetchSeatMap,
   } = useSeatMapData({
      gameId: bookingEntryState?.gameId,
      stadiumId: bookingEntryState?.stadiumId,
      zone,
   });
   const zonesState = useSeatSelectionStore(state => state.zones);
   const zoneSeatState = useSeatSelectionStore(state => state.zones[zone.id]);
   const initializeZone = useSeatSelectionStore(state => state.initializeZone);
   const applyServerSeatSnapshot = useSeatSelectionStore(state => state.applyServerSeatSnapshot);
   const holdsBySeatId = useSeatHoldStore(state => state.holdsBySeatId);
   const { clearSelectedSeats, holdSeat, pendingSeatIds, releaseSeat, syncHeldSeatsIntoZone } = useSeatHoldActions(
      bookingEntryState,
      {
         onSeatHoldConflict: async () => {
            await refetchSeatMap();
         },
         onPurchaseLimitReached,
         seatSelectionLimit: MAX_SELECTED_SEATS,
      },
   );

   useEffect(() => {
      const syncedInitialSeats = syncHeldSeatsIntoZone(zone.id, initialSeats);

      if (hasApiSeatMap && apiSeatItems.length > 0) {
         applyServerSeatSnapshot(zone.id, syncHeldSeatsIntoZone(zone.id, apiSeatItems));
         return;
      }

      initializeZone(zone.id, syncedInitialSeats);
   }, [
      apiSeatItems,
      applyServerSeatSnapshot,
      hasApiSeatMap,
      initialSeats,
      initializeZone,
      syncHeldSeatsIntoZone,
      zone.id,
   ]);

   const seats = useMemo<SeatItem[]>(() => {
      if (!zoneSeatState) {
         return initialSeats;
      }

      return zoneSeatState.seatOrder
         .map(seatId => zoneSeatState.seatMap[seatId])
         .filter((seat): seat is SeatItem => Boolean(seat));
   }, [initialSeats, zoneSeatState]);

   const selectedSeatIds = zoneSeatState?.selectedSeatIds ?? [];
   const selectedSeats = useMemo(() => getSelectedSeatDetails(zonesState, bookingZones), [bookingZones, zonesState]);
   const selectedPrice = selectedSeats.reduce((total, item) => total + item.price, 0);
   const allSelectedSeatsAreHeld = selectedSeats.every(selectedSeat => Boolean(holdsBySeatId[selectedSeat.seat.id]?.holdId));
   const isSeatInteractionLocked = Boolean(bookingEntryState?.gameId) && isSeatMapLoading;

   return {
      allSelectedSeatsAreHeld,
      clearSelectedSeats,
      hasApiSeatMap,
      holdSeat,
      holdsBySeatId,
      isSeatMapError,
      seatMapErrorMessage,
      isSeatInteractionLocked,
      pendingSeatIds,
      releaseSeat,
      seatBlocks,
      seats,
      selectedPrice,
      selectedSeatIds,
      selectedSeats,
   };
}
