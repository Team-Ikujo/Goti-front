import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { releaseQueueSession } from '@/pages/queue/api/queueApi';
import { useBookingEntryStore } from '@/shared/lib/useBookingEntryStore';
import { useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';
import { useMouseEventTracker } from '@/shared/lib/useMouseEventTracker';

import BooksHeader from './BooksHeader';

const isBookSelectionPath = (pathname: string) =>
   pathname.startsWith('/books') || pathname.startsWith('/resell-books');

const BooksLayout = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { pathname } = location;
   const hasHydrated = useBookingEntryStore(state => state.hasHydrated);
   const bookingEntry = useBookingEntryStore(state => state.entry);
   const clearEntry = useBookingEntryStore(state => state.clearEntry);
   const clearTimer = useBookingFlowTimerStore(state => state.clearTimer);
   const clearSeatHolds = useSeatHoldStore(state => state.clearSeatHolds);
   const clearAllSelections = useSeatSelectionStore(state => state.clearAllSelections);

   const exitRef = useRef<() => void>(() => {});
   exitRef.current = () => {
      clearTimer();
      clearSeatHolds();
      clearAllSelections();
      void releaseQueueSession(bookingEntry?.gameId);
      clearEntry();
      navigate('/', { replace: true });
   };

   useMouseEventTracker({
      userId: bookingEntry?.userId,
      onMacroDetected: () => {
         window.alert('매크로 사용이 감지되었습니다. 예매에 접근할 수 없습니다.');
         exitRef.current();
      },
   });

   useEffect(() => {
      const handleWheel = (event: WheelEvent) => {
         if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
         }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
         if (!(event.ctrlKey || event.metaKey)) {
            return;
         }

         const blockedKeys = ['+', '-', '=', '_', '0'];
         if (blockedKeys.includes(event.key)) {
            event.preventDefault();
         }
      };

      const handleGesture = (event: Event) => {
         event.preventDefault();
      };

      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('gesturestart', handleGesture as EventListener, { passive: false });
      window.addEventListener('gesturechange', handleGesture as EventListener, { passive: false });

      return () => {
         window.removeEventListener('wheel', handleWheel);
         window.removeEventListener('keydown', handleKeyDown);
         window.removeEventListener('gesturestart', handleGesture as EventListener);
         window.removeEventListener('gesturechange', handleGesture as EventListener);
      };
   }, []);

   if (!hasHydrated && isBookSelectionPath(pathname)) {
      return (
         <div className="min-h-screen bg-background">
            <BooksHeader />
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-background">
         <BooksHeader />
         <main className="min-h-[calc(100vh-140px)]">
            <Outlet />
         </main>
      </div>
   );
};

export default BooksLayout;
