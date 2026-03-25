import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';

const isBookingFlowPath = (pathname: string) => pathname.startsWith('/books') || pathname.startsWith('/tickets');

const BookingFlowStateGuard = () => {
   const { pathname } = useLocation();
   const previousPathnameRef = useRef<string | null>(null);

   useEffect(() => {
      const previousPathname = previousPathnameRef.current;
      const isCurrentBookingFlow = isBookingFlowPath(pathname);
      const selectedSeatCount = Object.values(useSeatSelectionStore.getState().zones).reduce(
         (count, zone) => count + zone.selectedSeatIds.length,
         0,
      );

      console.info('[BookingFlowStateGuard]', {
         previousPathname,
         pathname,
         isCurrentBookingFlow,
         selectedSeatCount,
      });

      if (!isCurrentBookingFlow) {
         console.info('[BookingFlowStateGuard] booking flow exited, clearing seat selections and timer');
         useSeatSelectionStore.getState().clearAllSelections();
         useBookingFlowTimerStore.getState().clearTimer();
      } else if (previousPathname && isBookingFlowPath(previousPathname) && !isCurrentBookingFlow) {
         console.info('[BookingFlowStateGuard] moved out of booking flow, clearing seat selections and timer');
         useSeatSelectionStore.getState().clearAllSelections();
         useBookingFlowTimerStore.getState().clearTimer();
      }

      previousPathnameRef.current = pathname;
   }, [pathname]);

   return null;
};

export default BookingFlowStateGuard;
