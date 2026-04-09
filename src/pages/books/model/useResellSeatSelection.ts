import { useEffect, useMemo, useRef, useState } from 'react';

import {
   holdResaleListing,
   releaseResaleListingHold,
   releaseResaleListingHoldKeepalive,
} from '@/entities/resale/api/resaleApi';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';
import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { createResellSeatLookupKey, parseResellSeatInfo } from '@/pages/books/lib/resellSeatParser';
import type { ResellListingItem } from './resellData';
import type { SeatItem, ZoneItem } from './types';
import { useResellZoneInsights } from './useResellZoneInsights';

type UseResellSeatSelectionParams = {
   bookingEntryState: BookingEntryState | null;
   isResellMode: boolean;
   isSeatInteractionLocked: boolean;
   seats: SeatItem[];
   zone: ZoneItem;
};

export function useResellSeatSelection({
   bookingEntryState,
   isResellMode,
   isSeatInteractionLocked,
   seats,
   zone,
}: UseResellSeatSelectionParams) {
   const clearAllSelections = useSeatSelectionStore(state => state.clearAllSelections);
   const [isResellHoldPending, setIsResellHoldPending] = useState(false);
   const [selectedResellHoldId, setSelectedResellHoldId] = useState<string | null>(null);
   const [selectedResellSeatId, setSelectedResellSeatId] = useState<string | null>(null);
   const selectedResellHoldIdRef = useRef<string | null>(null);
   const persistResellHoldRef = useRef(false);
   const resellInsightsQuery = useResellZoneInsights({
      enabled: isResellMode,
      gameId: bookingEntryState?.gameId,
      zone,
      seats,
   });
   const resellInsights = resellInsightsQuery.data ?? null;

   useEffect(() => {
      if (!isResellMode) {
         setSelectedResellHoldId(null);
         setSelectedResellSeatId(null);
         persistResellHoldRef.current = false;
         return;
      }

      clearAllSelections();
   }, [clearAllSelections, isResellMode, zone.id]);

   useEffect(() => {
      selectedResellHoldIdRef.current = selectedResellHoldId;
   }, [selectedResellHoldId]);

   useEffect(() => {
      if (!isResellMode) {
         return;
      }

      const handlePageHide = () => {
         const holdId = selectedResellHoldIdRef.current;

         if (!holdId || persistResellHoldRef.current) {
            return;
         }

         releaseResaleListingHoldKeepalive(holdId);
      };

      window.addEventListener('pagehide', handlePageHide);

      return () => {
         window.removeEventListener('pagehide', handlePageHide);
      };
   }, [isResellMode]);

   useEffect(() => {
      return () => {
         const holdId = selectedResellHoldIdRef.current;

         if (!isResellMode || !holdId || persistResellHoldRef.current) {
            return;
         }

         releaseResaleListingHoldKeepalive(holdId);
      };
   }, [isResellMode]);

   const resellListingBySeatId = useMemo(() => {
      const listingBySeatIdentifier = new Map((resellInsights?.listings ?? []).map(listing => [listing.seatId, listing]));
      const seatByLookupKey = new Map(
         seats.map(seat =>
            [
               createResellSeatLookupKey({
                  sectionCode: seat.block,
                  rowLabel: seat.rowLabel,
                  seatNumber: seat.seatNumber,
               }),
               seat,
            ] as const,
         ),
      );
      const nextMap = new Map<string, ResellListingItem>();

      seats.forEach(seat => {
         const matchedListing = listingBySeatIdentifier.get(seat.id) ?? listingBySeatIdentifier.get(seat.apiSeatId);

         if (matchedListing) {
            nextMap.set(seat.id, matchedListing);
         }
      });

      (resellInsights?.listings ?? []).forEach(listing => {
         if ([...nextMap.values()].some(mappedListing => mappedListing.listingId === listing.listingId)) {
            return;
         }

         const parsedSeatInfo = parseResellSeatInfo(listing.seatInfo);

         if (!parsedSeatInfo) {
            return;
         }

         const matchedSeat = seatByLookupKey.get(
            createResellSeatLookupKey({
               sectionCode: parsedSeatInfo.sectionCode,
               rowLabel: parsedSeatInfo.rowLabel,
               seatNumber: parsedSeatInfo.seatNumber,
            }),
         );

         if (matchedSeat) {
            nextMap.set(matchedSeat.id, listing);
         }
      });

      return nextMap;
   }, [resellInsights?.listings, seats]);

   const seatIdByResellListingId = useMemo(() => {
      return new Map(
         [...resellListingBySeatId.entries()].map(([seatId, listing]) => [listing.listingId, seatId] as const),
      );
   }, [resellListingBySeatId]);

   const selectedResellListing = useMemo(() => {
      if (!isResellMode) {
         return null;
      }

      return selectedResellSeatId ? (resellListingBySeatId.get(selectedResellSeatId) ?? null) : null;
   }, [isResellMode, resellListingBySeatId, selectedResellSeatId]);

   const selectedSeatIdSet = useMemo(
      () => new Set(selectedResellSeatId ? [selectedResellSeatId] : []),
      [selectedResellSeatId],
   );

   const displaySeats = useMemo(() => {
      if (isSeatInteractionLocked) {
         return seats.map(
            seat =>
               ({
                  ...seat,
                  status: 'disabled',
               }) satisfies SeatItem,
         );
      }

      if (!isResellMode) {
         return seats;
      }

      return seats.map(seat => {
         if (resellListingBySeatId.has(seat.id)) {
            return {
               ...seat,
               status: selectedSeatIdSet.has(seat.id) ? 'selected' : 'available',
            } satisfies SeatItem;
         }

         return {
            ...seat,
            status: 'disabled',
         } satisfies SeatItem;
      });
   }, [isResellMode, isSeatInteractionLocked, resellListingBySeatId, seats, selectedSeatIdSet]);

   const releaseSelectedResellHold = async () => {
      if (!selectedResellHoldIdRef.current) {
         setSelectedResellHoldId(null);
         setSelectedResellSeatId(null);
         return;
      }

      const holdId = selectedResellHoldIdRef.current;

      await releaseResaleListingHold(holdId);
      selectedResellHoldIdRef.current = null;
      setSelectedResellHoldId(null);
      setSelectedResellSeatId(null);
   };

   const handleSelectResellListing = async (seatId: string, listing: ResellListingItem) => {
      if (!bookingEntryState?.queueTokenJti || isResellHoldPending) {
         return;
      }

      setIsResellHoldPending(true);

      try {
         const isAlreadySelected = selectedResellSeatId === seatId;

         if (isAlreadySelected && selectedResellHoldIdRef.current) {
            await releaseSelectedResellHold();
            return;
         }

         if (selectedResellHoldIdRef.current) {
            await releaseSelectedResellHold();
         }

         const hold = await holdResaleListing({
            listingId: listing.listingId,
            queueTokenJti: bookingEntryState.queueTokenJti,
         });

         selectedResellHoldIdRef.current = hold.holdId;
         setSelectedResellHoldId(hold.holdId);
         setSelectedResellSeatId(seatId);
      } catch (error) {
         window.alert(getErrorMessage(error, '리셀 좌석 점유 중 오류가 발생했습니다.'));
      } finally {
         setIsResellHoldPending(false);
      }
   };

   return {
      displaySeats,
      handleSelectResellListing,
      isResellHoldPending,
      persistResellHoldRef,
      releaseSelectedResellHold,
      resellInsights,
      resellInsightsQuery,
      seatIdByResellListingId,
      selectedResellHoldId,
      selectedResellListing,
      selectedSeatCount: selectedResellListing ? 1 : 0,
      selectedSeatIdSet,
      summaryPrice: selectedResellListing?.totalAmount ?? selectedResellListing?.listingPrice ?? 0,
   };
}
