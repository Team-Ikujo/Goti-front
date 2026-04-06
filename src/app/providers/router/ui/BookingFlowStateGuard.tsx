import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { useBookingEntryStore } from '@/shared/lib/useBookingEntryStore';
import { useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';

const isBookingFlowPath = (pathname: string) =>
   pathname.startsWith('/queue') || pathname.startsWith('/books') || pathname.startsWith('/tickets');
const requiresBookingEntry = (pathname: string) =>
   pathname.startsWith('/queue') ||
   pathname.startsWith('/books') ||
   pathname === '/tickets/payment' ||
   pathname === '/tickets/resell-payment';

const BookingFlowStateGuard = () => {
   const navigate = useNavigate();
   const { pathname } = useLocation();
   const previousPathnameRef = useRef<string | null>(null);
   const bookingEntry = useBookingEntryStore((state) => state.entry);

   useEffect(() => {
      const previousPathname = previousPathnameRef.current;
      const isCurrentBookingFlow = isBookingFlowPath(pathname);
      const didExitBookingFlow = Boolean(
         previousPathname && isBookingFlowPath(previousPathname) && !isCurrentBookingFlow,
      );
      const requiresEntry = requiresBookingEntry(pathname);
      if (requiresEntry && !bookingEntry) {
         useSeatHoldStore.getState().clearSeatHolds();
         useSeatSelectionStore.getState().clearAllSelections();
         useBookingFlowTimerStore.getState().clearTimer();
         navigate('/', { replace: true });
         return;
      }

      if (didExitBookingFlow) {
         useSeatHoldStore.getState().clearSeatHolds();
         useSeatSelectionStore.getState().clearAllSelections();
         useBookingFlowTimerStore.getState().clearTimer();
         useBookingEntryStore.getState().clearEntry();
      }

      previousPathnameRef.current = pathname;
   }, [bookingEntry, navigate, pathname]);

   return null;
};

export default BookingFlowStateGuard;
