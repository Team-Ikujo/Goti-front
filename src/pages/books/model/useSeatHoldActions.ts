import { useState } from 'react';

import { ApiError } from '@/shared/api/client';
import { holdSeatReservation, releaseSeatReservation } from '@/pages/books/api/seatHoldApi';
import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { MAX_SELECTED_SEATS, useSeatSelectionStore } from './useSeatSelectionStore';
import { useSeatHoldStore } from './useSeatHoldStore';
import type { SeatItem } from './types';
import type { SelectedSeatDetail } from './selectedSeats';

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
   if (error instanceof ApiError) {
      return error.message;
   }

   if (error instanceof Error && error.message) {
      return error.message;
   }

   return fallbackMessage;
};

export const useSeatHoldActions = (bookingEntryState: BookingEntryState | null | undefined) => {
   const zonesState = useSeatSelectionStore((state) => state.zones);
   const toggleSelectedSeat = useSeatSelectionStore((state) => state.toggleSelectedSeat);
   const applyServerSeatPatch = useSeatSelectionStore((state) => state.applyServerSeatPatch);
   const holdsBySeatId = useSeatHoldStore((state) => state.holdsBySeatId);
   const setSeatHold = useSeatHoldStore((state) => state.setSeatHold);
   const removeSeatHold = useSeatHoldStore((state) => state.removeSeatHold);
   const [pendingSeatIds, setPendingSeatIds] = useState<string[]>([]);

   const markPending = (seatId: string, pending: boolean) => {
      setPendingSeatIds((currentSeatIds) => {
         if (pending) {
            return currentSeatIds.includes(seatId) ? currentSeatIds : [...currentSeatIds, seatId];
         }

         return currentSeatIds.filter((currentSeatId) => currentSeatId !== seatId);
      });
   };

   const releaseSeat = async ({
      zoneId,
      seatId,
      holdId,
      syncSelection = true,
      showErrorAlert = true,
   }: {
      zoneId: string;
      seatId: string;
      holdId?: string;
      syncSelection?: boolean;
      showErrorAlert?: boolean;
   }) => {
      markPending(seatId, true);

      try {
         if (holdId) {
            await releaseSeatReservation(holdId);
         }

         if (syncSelection && zonesState[zoneId]?.selectedSeatIds.includes(seatId)) {
            toggleSelectedSeat(zoneId, seatId);
         }

         removeSeatHold(seatId);
         applyServerSeatPatch(zoneId, seatId, 'available');
      } catch (error) {
         if (showErrorAlert) {
            window.alert(getErrorMessage(error, '좌석 점유 해제 중 오류가 발생했습니다.'));
         }
         throw error;
      } finally {
         markPending(seatId, false);
      }
   };

   const holdSeat = async (zoneId: string, seat: SeatItem) => {
      const currentZone = zonesState[zoneId];
      const isAlreadySelected = currentZone?.selectedSeatIds.includes(seat.id) ?? false;

      if (isAlreadySelected) {
         const currentHold = holdsBySeatId[seat.id];
         await releaseSeat({
            zoneId,
            seatId: seat.id,
            holdId: currentHold?.holdId,
         });
         return;
      }

      const totalSelectedSeats = Object.values(zonesState).reduce(
         (count, zoneState) => count + zoneState.selectedSeatIds.length,
         0,
      );

      if (totalSelectedSeats >= MAX_SELECTED_SEATS) {
         return;
      }

      if (!bookingEntryState?.gameId || !bookingEntryState.queueTokenJti) {
         window.alert('예매 정보가 없어 좌석 점유를 진행할 수 없습니다.');
         return;
      }

      markPending(seat.id, true);

      try {
         const hold = await holdSeatReservation(seat.id, {
            gameId: bookingEntryState.gameId,
            queueTokenJti: bookingEntryState.queueTokenJti,
         });

         setSeatHold({
            holdId: hold.holdId,
            seatId: seat.id,
            zoneId,
            gameId: bookingEntryState.gameId,
            queueTokenJti: bookingEntryState.queueTokenJti,
            heldAt: Date.now(),
         });
         applyServerSeatPatch(zoneId, seat.id, 'selected');
         toggleSelectedSeat(zoneId, seat.id);
      } catch (error) {
         window.alert(getErrorMessage(error, '좌석 점유 중 오류가 발생했습니다.'));
      } finally {
         markPending(seat.id, false);
      }
   };

   const clearSelectedSeats = async (selectedSeats: SelectedSeatDetail[]) => {
      const releaseResults = await Promise.allSettled(
         selectedSeats.map((selectedSeat) =>
            releaseSeat({
               zoneId: selectedSeat.zoneId,
               seatId: selectedSeat.seat.id,
               holdId: holdsBySeatId[selectedSeat.seat.id]?.holdId,
               showErrorAlert: false,
            }),
         ),
      );

      const failedCount = releaseResults.filter((result) => result.status === 'rejected').length;

      if (failedCount > 0) {
         window.alert(`${failedCount}개의 좌석 점유 해제에 실패했습니다.`);
      }
   };

   const syncHeldSeatsIntoZone = (zoneId: string, seats: SeatItem[]) => {
      const selectedSeatIds = zonesState[zoneId]?.selectedSeatIds ?? [];

      return seats.map((seat) => {
         if (!holdsBySeatId[seat.id]) {
            return seat;
         }

         if (!selectedSeatIds.includes(seat.id)) {
            return seat;
         }

         return {
            ...seat,
            status: 'selected',
         } satisfies SeatItem;
      });
   };

   return {
      clearSelectedSeats,
      holdSeat,
      pendingSeatIds,
      releaseSeat,
      syncHeldSeatsIntoZone,
   };
};
