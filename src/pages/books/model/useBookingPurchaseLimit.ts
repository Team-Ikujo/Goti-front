import { useCallback, useState } from 'react';

import { fetchOwnedTicketsCount } from '@/pages/books/api/purchaseLimitApi';
import { MAX_SELECTED_SEATS, getSeatPurchaseLimitExceededMessage } from '@/entities/seat-selection/model/constants';

type CheckBookingPurchaseLimitParams = {
   gameId?: string;
   selectedSeatCount: number;
};

type BookingPurchaseLimitCheckResult = {
   ownedTicketCount: number;
   selectedSeatCount: number;
   remainingPurchasableSeatCount: number;
   totalRequestedSeatCount: number;
   hasReachedPurchaseLimit: boolean;
   isLimitExceeded: boolean;
   limitExceededMessage: string;
};

const buildBookingPurchaseLimitResult = ({
   ownedTicketCount,
   selectedSeatCount,
}: {
   ownedTicketCount: number;
   selectedSeatCount: number;
}): BookingPurchaseLimitCheckResult => {
   const remainingPurchasableSeatCount = Math.max(0, MAX_SELECTED_SEATS - ownedTicketCount);
   const totalRequestedSeatCount = ownedTicketCount + selectedSeatCount;

   return {
      ownedTicketCount,
      selectedSeatCount,
      remainingPurchasableSeatCount,
      totalRequestedSeatCount,
      hasReachedPurchaseLimit: remainingPurchasableSeatCount === 0,
      isLimitExceeded: totalRequestedSeatCount > MAX_SELECTED_SEATS,
      limitExceededMessage: getSeatPurchaseLimitExceededMessage(ownedTicketCount),
   };
};

export function useBookingPurchaseLimit() {
   const [isChecking, setIsChecking] = useState(false);

   const checkPurchaseLimit = useCallback(async ({ gameId, selectedSeatCount }: CheckBookingPurchaseLimitParams) => {
      if (!gameId || selectedSeatCount <= 0) {
         return buildBookingPurchaseLimitResult({
            ownedTicketCount: 0,
            selectedSeatCount,
         });
      }

      setIsChecking(true);

      try {
         const ownedTicketCount = await fetchOwnedTicketsCount(gameId);

         return buildBookingPurchaseLimitResult({
            ownedTicketCount,
            selectedSeatCount,
         });
      } finally {
         setIsChecking(false);
      }
   }, []);

   return {
      checkPurchaseLimit,
      isChecking,
   };
}
