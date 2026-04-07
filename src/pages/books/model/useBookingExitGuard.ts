import { useEffect, useRef, useState } from 'react';

type UseBookingExitGuardParams = {
   onExit: () => void;
};

export function useBookingExitGuard({ onExit }: UseBookingExitGuardParams) {
   const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
   const shouldRestoreHistoryRef = useRef(false);

   useEffect(() => {
      window.history.pushState({ bookingExitGuard: true }, '', window.location.href);

      const handlePopState = () => {
         shouldRestoreHistoryRef.current = true;
         setIsExitDialogOpen(true);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
         window.removeEventListener('popstate', handlePopState);
      };
   }, []);

   return {
      isExitDialogOpen,
      onConfirmExit: () => {
         shouldRestoreHistoryRef.current = false;
         setIsExitDialogOpen(false);
         onExit();
      },
      onOpenChange: (open: boolean) => {
         setIsExitDialogOpen(open);

         if (!open && shouldRestoreHistoryRef.current) {
            window.history.pushState({ bookingExitGuard: true }, '', window.location.href);
            shouldRestoreHistoryRef.current = false;
         }
      },
   };
}
