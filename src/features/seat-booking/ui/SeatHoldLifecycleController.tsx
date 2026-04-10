import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { releaseSeatReservation, releaseSeatReservationKeepalive } from '@/entities/seat-hold/api/seatHoldApi';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';

const isSeatHoldManagedPath = (pathname: string) =>
   pathname.startsWith('/books') ||
   pathname.startsWith('/resell-books') ||
   pathname === '/tickets/payment' ||
   pathname === '/tickets/payment/processing';

const getSeatHolds = () => Object.values(useSeatHoldStore.getState().holdsBySeatId);

const releaseAllSeatHolds = async () => {
   const seatHolds = getSeatHolds();

   if (seatHolds.length === 0) {
      return;
   }

   const releaseResults = await Promise.allSettled(
      seatHolds.map((seatHold) => releaseSeatReservation(seatHold.holdId)),
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
   const seatHolds = getSeatHolds();

   if (seatHolds.length === 0) {
      return;
   }

   seatHolds.forEach((seatHold) => {
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

      if (getSeatHolds().length > 0 && isSeatHoldManagedPath(previousPathname) && !isSeatHoldManagedPath(pathname)) {
         void releaseAllSeatHolds();
      }

      previousPathnameRef.current = pathname;
   }, [pathname]);

   useEffect(() => {
      const handlePageHide = () => {
         if (!isSeatHoldManagedPath(window.location.pathname) || getSeatHolds().length === 0) {
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
