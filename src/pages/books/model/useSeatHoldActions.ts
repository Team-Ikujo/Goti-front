import { useState } from 'react';

import { holdSeatReservation, releaseSeatReservation } from '@/entities/seat-hold/api/seatHoldApi';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { MAX_SELECTED_SEATS } from '@/entities/seat-selection/model/constants';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { ApiError } from '@/shared/api/client';
import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';
import type { SeatItem } from './types';
import type { SelectedSeatDetail } from './selectedSeats';

type UseSeatHoldActionsOptions = {
   onSeatHoldConflict?: () => void | Promise<void>;
   useMockSeatHold?: boolean;
};

const HOLD_CONFLICT_MESSAGE = '좌석 점유 가능 상태에서만 점유 상태로 변경할 수 있습니다.';

const isSeatAlreadyHeldConflict = (error: unknown) => {
   if (!(error instanceof ApiError)) {
      return false;
   }

   if (error.status !== 400) {
      return false;
   }

   return error.message.includes(HOLD_CONFLICT_MESSAGE);
};

const createMockHoldId = (seatId: string) => `mock-hold-${seatId}-${Date.now()}`;

export const useSeatHoldActions = (
   bookingEntryState: BookingEntryState | null | undefined,
   options?: UseSeatHoldActionsOptions,
) => {
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
         if (holdId && !options?.useMockSeatHold) {
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
      if (!seat.id?.trim()) {
         console.error('[useSeatHoldActions] seatId 없이 좌석 점유를 시도했습니다.', {
            zoneId,
            seat,
         });
         window.alert('좌석 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.');
         return;
      }

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
         if (options?.useMockSeatHold) {
            const holdId = createMockHoldId(seat.id);

            setSeatHold({
               holdId,
               seatId: seat.id,
               zoneId,
               gameId: bookingEntryState.gameId,
               queueTokenJti: bookingEntryState.queueTokenJti,
               heldAt: Date.now(),
            });
            applyServerSeatPatch(zoneId, seat.id, 'selected');
            toggleSelectedSeat(zoneId, seat.id);
            return;
         }

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
         if (isSeatAlreadyHeldConflict(error)) {
            window.alert('해당 좌석은 이미 선점된 좌석입니다.');
            await options?.onSeatHoldConflict?.();
            return;
         }

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
