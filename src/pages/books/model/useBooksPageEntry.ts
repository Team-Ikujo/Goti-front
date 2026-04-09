import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { logBookingFlow, summarizeBookingEntry } from '@/shared/lib/bookingFlowDebug';
import { mergeBookingEntryState, useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';

type UseBooksPageEntryResult = {
   bookingEntryState: BookingEntryState | null;
   patchBookingEntry: ReturnType<typeof useBookingEntryStore.getState>['patchEntry'];
   clearBookingEntry: ReturnType<typeof useBookingEntryStore.getState>['clearEntry'];
};

export function useBooksPageEntry(): UseBooksPageEntryResult {
   const location = useLocation();
   const routeBookingEntryState = location.state as BookingEntryState | null;
   const storedBookingEntryState = useBookingEntryStore(state => state.entry);
   const setBookingEntry = useBookingEntryStore(state => state.setEntry);
   const patchBookingEntry = useBookingEntryStore(state => state.patchEntry);
   const clearBookingEntry = useBookingEntryStore(state => state.clearEntry);
   const bookingEntryState = mergeBookingEntryState(routeBookingEntryState, storedBookingEntryState);

   useEffect(() => {
      logBookingFlow('useBooksPageEntry', 'resolved bookingEntryState', {
         routeBookingEntryState: summarizeBookingEntry(routeBookingEntryState),
         storedBookingEntryState: summarizeBookingEntry(storedBookingEntryState),
         bookingEntryState: summarizeBookingEntry(bookingEntryState),
      });
   }, [bookingEntryState, routeBookingEntryState, storedBookingEntryState]);

   useEffect(() => {
      if (routeBookingEntryState) {
         logBookingFlow('useBooksPageEntry', 'sync route state to store', summarizeBookingEntry(routeBookingEntryState));
         setBookingEntry(routeBookingEntryState);
      }
   }, [routeBookingEntryState, setBookingEntry]);

   return {
      bookingEntryState,
      patchBookingEntry,
      clearBookingEntry,
   };
}
