import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { leaveQueueKeepalive } from '@/pages/queue/api/queueApi';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { useBookingEntryStore } from '@/shared/lib/useBookingEntryStore';
import { useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';

const isBookingFlowPath = (pathname: string) =>
   pathname.startsWith('/queue') || pathname.startsWith('/books') || pathname.startsWith('/tickets');
const isBookSelectionPath = (pathname: string) => pathname.startsWith('/books');
const isTicketCheckoutPath = (pathname: string) =>
   pathname === '/tickets/payment' ||
   pathname === '/tickets/resell-payment' ||
   pathname === '/tickets/payment/processing';
const requiresBookingEntry = (pathname: string) =>
   pathname.startsWith('/queue') ||
   isBookSelectionPath(pathname) ||
   isTicketCheckoutPath(pathname);
const requiresQueueReentryOnBoot = (pathname: string) =>
   isBookSelectionPath(pathname) || isTicketCheckoutPath(pathname);
const shouldReleaseQueueOnUnload = (pathname: string) =>
   isBookSelectionPath(pathname) || isTicketCheckoutPath(pathname);
const isPageReload = () => {
   if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return false;
   }

   const [navigationEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
   return navigationEntry?.type === 'reload';
};

const BookingFlowStateGuard = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { pathname, search } = location;
   const previousPathnameRef = useRef<string | null>(null);
   const hasHydrated = useBookingEntryStore((state) => state.hasHydrated);
   const bookingEntry = useBookingEntryStore((state) => state.entry);

   useEffect(() => {
      if (!hasHydrated) {
         return;
      }

      const previousPathname = previousPathnameRef.current;
      const isInitialAppLoad = previousPathname === null;
      const isCurrentBookingFlow = isBookingFlowPath(pathname);
      const didExitBookingFlow = Boolean(
         previousPathname && isBookingFlowPath(previousPathname) && !isCurrentBookingFlow,
      );
      const requiresEntry = requiresBookingEntry(pathname);

      if (isInitialAppLoad && isPageReload() && requiresQueueReentryOnBoot(pathname) && bookingEntry) {
         useSeatHoldStore.getState().clearSeatHolds();
         useSeatSelectionStore.getState().clearAllSelections();
         useBookingFlowTimerStore.getState().clearTimer();
         navigate({ pathname: '/queue', search }, { replace: true, state: bookingEntry });
         return;
      }

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
   }, [bookingEntry, hasHydrated, navigate, pathname, search]);

   useEffect(() => {
      if (!shouldReleaseQueueOnUnload(pathname) || !bookingEntry?.gameId || !bookingEntry.queueTokenJti) {
         return;
      }

      const handleUnload = () => {
         leaveQueueKeepalive(bookingEntry.gameId!);
      };

      window.addEventListener('beforeunload', handleUnload);
      window.addEventListener('pagehide', handleUnload);

      return () => {
         window.removeEventListener('beforeunload', handleUnload);
         window.removeEventListener('pagehide', handleUnload);
      };
   }, [bookingEntry?.gameId, bookingEntry?.queueTokenJti, pathname]);

   return null;
};

export default BookingFlowStateGuard;
