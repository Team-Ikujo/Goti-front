import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { isMockSeatHoldId, releaseSeatReservation, releaseSeatReservationKeepalive } from '@/entities/seat-hold/api/seatHoldApi';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';

const isSeatHoldManagedPath = (pathname: string) =>
   pathname.startsWith('/books') || pathname.startsWith('/tickets/payment');

const releaseAllSeatHolds = async () => {
   const seatHolds = Object.values(useSeatHoldStore.getState().holdsBySeatId);

   if (seatHolds.length === 0) {
      return;
   }

   const releaseResults = await Promise.allSettled(
      seatHolds
         .filter((seatHold) => !isMockSeatHoldId(seatHold.holdId))
         .map((seatHold) => releaseSeatReservation(seatHold.holdId)),
   );
   const failedReleaseCount = releaseResults.filter((result) => result.status === 'rejected').length;

   if (failedReleaseCount > 0) {
      console.error('[SeatHoldLifecycleController] failed to release seat holds', {
         failedReleaseCount,
         totalReleaseCount: seatHolds.length,
      });
   }

   useSeatHoldStore.getState().clearSeatHolds();
   useSeatSelectionStore.getState().clearAllSelections();
};

const releaseAllSeatHoldsKeepalive = () => {
   const seatHolds = Object.values(useSeatHoldStore.getState().holdsBySeatId);

   if (seatHolds.length === 0) {
      return;
   }

   seatHolds
      .filter((seatHold) => !isMockSeatHoldId(seatHold.holdId))
      .forEach((seatHold) => {
      releaseSeatReservationKeepalive(seatHold.holdId);
      });

   useSeatHoldStore.getState().clearSeatHolds();
   useSeatSelectionStore.getState().clearAllSelections();
};

const SeatHoldLifecycleController = () => {
   const { pathname } = useLocation();
   const previousPathnameRef = useRef(pathname);

   useEffect(() => {
      const previousPathname = previousPathnameRef.current;

      if (isSeatHoldManagedPath(previousPathname) && !isSeatHoldManagedPath(pathname)) {
         void releaseAllSeatHolds();
      }

      previousPathnameRef.current = pathname;
   }, [pathname]);

   useEffect(() => {
      const handlePageHide = () => {
         if (!isSeatHoldManagedPath(window.location.pathname)) {
            return;
         }

         releaseAllSeatHoldsKeepalive();
      };

      window.addEventListener('pagehide', handlePageHide);

      return () => {
         window.removeEventListener('pagehide', handlePageHide);
      };
   }, []);

   return null;
};

export default SeatHoldLifecycleController;
