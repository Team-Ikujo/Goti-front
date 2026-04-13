import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import type { BookingFlowMode } from '@/shared/lib/booking-flow';
import { mergeBookingEntryState, useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { getBookingZones, getStadiumName, getZoneOverviewImage } from './zoneData';

export function useSeatsPageEntry(zoneId: string) {
   const location = useLocation();
   const bookingFlowMode: BookingFlowMode = location.pathname.startsWith('/resell-books') ? 'resell' : 'standard';
   const isResellMode = bookingFlowMode === 'resell';
   const routeBookingEntryState = location.state as BookingEntryState | null;
   const storedBookingEntryState = useBookingEntryStore(state => state.entry);
   const setBookingEntry = useBookingEntryStore(state => state.setEntry);
   const bookingEntryState = mergeBookingEntryState(routeBookingEntryState, storedBookingEntryState);

   const isSameBookingEntryState = (left: BookingEntryState | null, right: BookingEntryState | null) => {
      if (left === right) {
         return true;
      }

      if (!left || !right) {
         return false;
      }

      const leftKeys = Object.keys(left) as Array<keyof BookingEntryState>;
      const rightKeys = Object.keys(right) as Array<keyof BookingEntryState>;

      if (leftKeys.length !== rightKeys.length) {
         return false;
      }

      return leftKeys.every((key) => left[key] === right[key]);
   };

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
