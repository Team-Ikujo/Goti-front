import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchResaleListings } from '@/entities/resale/api/resaleApi';
import {
   fetchSeatGrades,
   fetchSeatSections,
   fetchTicketPricingPolicy,
   mapSeatSectionsToZones,
   mergeBookingZones,
   resolvePricingByGradeId,
} from '@/pages/books/api/bookingApi';
import { isPurchasableResaleListing, resolveResaleListingZoneId } from '@/pages/books/model/resellMatching';
import type { ZoneItem } from '@/pages/books/model/types';
import { getBookingZones, getZoneDisplayOrder } from '@/pages/books/model/zoneData';
import { getCompletedResalePurchaseLookup } from '@/shared/lib/paymentCompleteStorage';
import type { BookingFlowMode } from '@/shared/lib/booking-flow';
import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';

type UseBookingZonesParams = {
   bookingEntryState: BookingEntryState | null;
   bookingFlowMode: BookingFlowMode;
   patchBookingEntry: (partialEntry: Partial<BookingEntryState>) => void;
};

export function useBookingZones({
   bookingEntryState,
   bookingFlowMode,
   patchBookingEntry,
}: UseBookingZonesParams): ZoneItem[] {
   const shouldForceNewSessionRef = useRef(Boolean(bookingEntryState?.forceNewSession));

   const localZones = useMemo(
      () =>
         [...getBookingZones(bookingEntryState?.homeTeamId)].sort(
            (left, right) =>
               getZoneDisplayOrder(bookingEntryState?.homeTeamId).indexOf(left.id) -
                  getZoneDisplayOrder(bookingEntryState?.homeTeamId).indexOf(right.id) || right.remaining - left.remaining,
         ),
      [bookingEntryState?.homeTeamId],
   );

   const { data: apiZones } = useQuery({
      queryKey: [
         'booking-zones',
         bookingFlowMode,
         bookingEntryState?.stadiumId,
         bookingEntryState?.gameId,
         bookingEntryState?.serverHomeTeamId,
         bookingEntryState?.leagueType,
         bookingEntryState?.gameDate,
      ],
      enabled: Boolean(
         bookingEntryState?.stadiumId &&
            bookingEntryState?.gameId &&
            bookingEntryState?.serverHomeTeamId &&
            bookingEntryState?.leagueType &&
            bookingEntryState?.gameDate,
      ),
      queryFn: async () => {
         const shouldForceNewSession = shouldForceNewSessionRef.current;
         const grades = await fetchSeatGrades({
            gameId: bookingEntryState!.gameId!,
            forceNewSession: shouldForceNewSession,
         });

         const [sections, pricingPolicy] = await Promise.all([
            fetchSeatSections({
               stadiumId: bookingEntryState!.stadiumId!,
               gameId: bookingEntryState!.gameId!,
            }),
            fetchTicketPricingPolicy(bookingEntryState!.serverHomeTeamId!).catch(() => undefined),
         ]);

         if (shouldForceNewSession) {
            shouldForceNewSessionRef.current = false;
            patchBookingEntry({
               forceNewSession: false,
            });
         }

         const pricingByGradeId = resolvePricingByGradeId({
            policy: pricingPolicy,
            gameDate: bookingEntryState?.gameDate,
            leagueType: bookingEntryState?.leagueType,
         });

         if (bookingFlowMode === 'resell') {
            return mapSeatSectionsToZones({
               sections,
               grades,
               teamId: bookingEntryState?.homeTeamId,
               pricingByGradeId,
            });
         }

         return mapSeatSectionsToZones({
            sections,
            grades,
            teamId: bookingEntryState?.homeTeamId,
            pricingByGradeId,
         });
      },
   });

   const mergedBaseZones = useMemo(
      () =>
         mergeBookingZones({
            localZones,
            apiZones,
         }),
      [apiZones, localZones],
   );

   const { data: resellRemainingByZoneId } = useQuery({
      queryKey: ['resell-zone-remaining', bookingEntryState?.gameId, mergedBaseZones.map(zone => zone.id).sort()],
      enabled: bookingFlowMode === 'resell' && Boolean(bookingEntryState?.gameId) && mergedBaseZones.length > 0,
      queryFn: async () => {
         if (!bookingEntryState?.gameId) {
            return new Map<string, number>();
         }

         const listings = await fetchResaleListings();
         const completedResaleLookup = getCompletedResalePurchaseLookup();
         const nextCounts = new Map<string, number>();

         listings.forEach(listing => {
            if (
               completedResaleLookup.listingIds.has(listing.listingId) ||
               completedResaleLookup.seatInfos.has(listing.seatInfo) ||
               !isPurchasableResaleListing(listing, bookingEntryState.gameId)
            ) {
               return;
            }

            const zoneId = resolveResaleListingZoneId({
               zones: mergedBaseZones,
               listing,
            });

            if (!zoneId) {
               return;
            }

            nextCounts.set(zoneId, (nextCounts.get(zoneId) ?? 0) + 1);
         });

         return nextCounts;
      },
      placeholderData: previousData => previousData,
   });

   const zones = useMemo<ZoneItem[]>(() => {
      const normalizedZones =
         bookingFlowMode === 'resell'
            ? mergedBaseZones.map(zone => ({
                 ...zone,
                 remaining: resellRemainingByZoneId?.get(zone.id) ?? 0,
              }))
            : mergedBaseZones;

      return [...normalizedZones].sort(
         (left, right) => right.remaining - left.remaining || left.name.localeCompare(right.name, 'ko-KR'),
      );
   }, [bookingFlowMode, mergedBaseZones, resellRemainingByZoneId]);

   useEffect(() => {
      if (zones.length === 0) {
         return;
      }

      patchBookingEntry({
         bookingZones: zones,
      });
   }, [patchBookingEntry, zones]);

   return zones;
}
