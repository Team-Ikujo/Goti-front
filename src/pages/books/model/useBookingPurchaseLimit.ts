import { useCallback, useState } from 'react';

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
         return buildBookingPurchaseLimitResult({
            // 최신 문서 기준 공개된 경기별 보유 티켓 수 사전 조회 API가 없어
            // 클라이언트에서는 선택 매수 상한만 즉시 검증한다.
            ownedTicketCount: 0,
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
