import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { releaseSeatReservation, releaseSeatReservationKeepalive } from '@/pages/books/api/seatHoldApi';
import { useSeatHoldStore } from '@/pages/books/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/pages/books/model/useSeatSelectionStore';

const isSeatHoldManagedPath = (pathname: string) =>
   pathname.startsWith('/books') || pathname.startsWith('/tickets/payment');

const releaseAllSeatHolds = async () => {
   const seatHolds = Object.values(useSeatHoldStore.getState().holdsBySeatId);

   if (seatHolds.length === 0) {
      return;
   }

   await Promise.allSettled(seatHolds.map((seatHold) => releaseSeatReservation(seatHold.holdId)));
   useSeatHoldStore.getState().clearSeatHolds();
   useSeatSelectionStore.getState().clearAllSelections();
};

const releaseAllSeatHoldsKeepalive = () => {
   const seatHolds = Object.values(useSeatHoldStore.getState().holdsBySeatId);

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
