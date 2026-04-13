import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import type { BookingFlowMode } from '@/shared/lib/booking-flow';
import {
   isSameBookingEntryState,
   mergeBookingEntryState,
   useBookingEntryStore,
   type BookingEntryState,
} from '@/shared/lib/useBookingEntryStore';
import { getBookingZones, getStadiumName, getZoneOverviewImage } from './zoneData';

export function useSeatsPageEntry(zoneId: string) {
   const location = useLocation();
   const bookingFlowMode: BookingFlowMode = location.pathname.startsWith('/resell-books') ? 'resell' : 'standard';
   const isResellMode = bookingFlowMode === 'resell';
   const routeBookingEntryState = location.state as BookingEntryState | null;
   const storedBookingEntryState = useBookingEntryStore(state => state.entry);
   const setBookingEntry = useBookingEntryStore(state => state.setEntry);
   const bookingEntryState = mergeBookingEntryState(routeBookingEntryState, storedBookingEntryState);

   useEffect(() => {
      if (routeBookingEntryState && bookingEntryState && !isSameBookingEntryState(storedBookingEntryState, bookingEntryState)) {
         setBookingEntry(bookingEntryState);
      }
   }, [bookingEntryState, routeBookingEntryState, setBookingEntry, storedBookingEntryState]);

   const bookingZones = useMemo(
      () => bookingEntryState?.bookingZones ?? getBookingZones(bookingEntryState?.homeTeamId),
      [bookingEntryState?.bookingZones, bookingEntryState?.homeTeamId],
   );
   const zone = useMemo(() => bookingZones.find(item => item.id === zoneId) ?? bookingZones[0], [bookingZones, zoneId]);
   const zoneOverviewImage = useMemo(
      () => getZoneOverviewImage(bookingEntryState?.homeTeamId, zone.id),
      [bookingEntryState?.homeTeamId, zone.id],
   );
   const stadiumName = useMemo(() => getStadiumName(bookingEntryState?.homeTeamId), [bookingEntryState?.homeTeamId]);

   return {
      bookingEntryState,
      bookingFlowMode,
      bookingZones,
      isResellMode,
      stadiumName,
      zone,
      zoneOverviewImage,
   };
}
