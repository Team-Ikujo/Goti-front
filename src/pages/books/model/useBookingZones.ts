import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchResaleListingCountsByGrades } from '@/entities/resale/api/resaleApi';
import {
   fetchSeatGrades,
   fetchSeatSections,
   fetchTicketPricingPolicy,
   mapSeatSectionsToZones,
   mergeBookingZones,
   resolvePricingByGradeId,
} from '@/pages/books/api/bookingApi';
import type { ZoneItem } from '@/pages/books/model/types';
import { getBookingZones, getZoneDisplayOrder } from '@/pages/books/model/zoneData';
import { ApiError } from '@/shared/api/client';
import { isResaleBookingMockEnabled } from '@/shared/config/runtime';
import type { BookingFlowMode } from '@/shared/lib/booking-flow';
import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { getDemoResaleListings, getDemoResaleTargetCountForZone } from '@/shared/lib/demo/resaleDemo';
import { isPurchasableResaleListing, matchesResaleListingToZone } from './resellMatching';

type UseBookingZonesParams = {
   bookingEntryState: BookingEntryState | null;
   bookingFlowMode: BookingFlowMode;
   patchBookingEntry: (partialEntry: Partial<BookingEntryState>) => void;
};

type UseBookingZonesResult = {
   zones: ZoneItem[];
   isSeatGradeBotBlocked: boolean;
};

const hasBotBlockedMessage = (value: unknown): boolean => {
   if (typeof value === 'string') {
      return value.includes('봇 감지');
   }

   if (value && typeof value === 'object' && 'message' in value) {
      return hasBotBlockedMessage((value as { message?: unknown }).message);
   }

   return false;
};

export function useBookingZones({
   bookingEntryState,
   bookingFlowMode,
   patchBookingEntry,
}: UseBookingZonesParams): UseBookingZonesResult {
   const shouldForceNewSessionRef = useRef(Boolean(bookingEntryState?.forceNewSession));
   const isEnabled = Boolean(
      bookingEntryState?.gameId &&
         bookingEntryState?.leagueType &&
         bookingEntryState?.gameDate,
   );

   useEffect(() => {
      if (bookingEntryState?.forceNewSession) {
         shouldForceNewSessionRef.current = true;
      }
   }, [bookingEntryState?.forceNewSession]);

   const localZones = useMemo(
      () =>
         [...getBookingZones(bookingEntryState?.homeTeamId)].sort(
            (left, right) =>
               getZoneDisplayOrder(bookingEntryState?.homeTeamId).indexOf(left.id) -
                  getZoneDisplayOrder(bookingEntryState?.homeTeamId).indexOf(right.id) || right.remaining - left.remaining,
         ),
      [bookingEntryState?.homeTeamId],
   );

   const mockResellZones = useMemo(() => {
      if (bookingFlowMode !== 'resell' || !isResaleBookingMockEnabled || !bookingEntryState?.gameId) {
         return localZones;
      }

      const demoListings = getDemoResaleListings();

      return localZones.map((zone) => ({
         ...zone,
         remaining: (() => {
            const count = demoListings.filter(
               (listing) =>
                  isPurchasableResaleListing(listing, bookingEntryState.gameId) &&
                  matchesResaleListingToZone({ zone, listing }),
            ).length;

            return count > 0 ? count : getDemoResaleTargetCountForZone(zone.id);
         })(),
      }));
   }, [bookingEntryState?.gameId, bookingFlowMode, localZones]);

   const { data: apiZones, error: apiZonesError } = useQuery({
      queryKey: [
         'booking-zones',
         bookingFlowMode,
         bookingEntryState?.stadiumId,
         bookingEntryState?.gameId,
         bookingEntryState?.queueTokenJti,
         bookingEntryState?.serverHomeTeamId,
         bookingEntryState?.leagueType,
         bookingEntryState?.gameDate,
      ],
      enabled: isEnabled && !(bookingFlowMode === 'resell' && isResaleBookingMockEnabled),
      queryFn: async () => {
         const shouldForceNewSession = shouldForceNewSessionRef.current;
         const grades = await fetchSeatGrades({
            gameId: bookingEntryState!.gameId!,
            forceNewSession: shouldForceNewSession,
         });
         const resolvedStadiumId = bookingEntryState?.stadiumId ?? grades.find((grade) => grade.stadiumId)?.stadiumId;

         const [sections, pricingPolicy] = await Promise.all([
            resolvedStadiumId
               ? fetchSeatSections({
                    stadiumId: resolvedStadiumId,
                    gameId: bookingEntryState!.gameId!,
                 })
               : Promise.resolve([]),
            bookingEntryState?.serverHomeTeamId
               ? fetchTicketPricingPolicy(bookingEntryState.serverHomeTeamId).catch(() => undefined)
               : Promise.resolve(undefined),
         ]);

         if (shouldForceNewSession || resolvedStadiumId !== bookingEntryState?.stadiumId) {
            const nextEntryPatch = {
               forceNewSession: shouldForceNewSession ? false : bookingEntryState?.forceNewSession,
               stadiumId: resolvedStadiumId,
            } satisfies Partial<BookingEntryState>;

            if (shouldForceNewSession) {
               shouldForceNewSessionRef.current = false;
            }

            patchBookingEntry(nextEntryPatch);
         }

         const pricingByGradeId = resolvePricingByGradeId({
            policy: pricingPolicy,
            gameDate: bookingEntryState?.gameDate,
            leagueType: bookingEntryState?.leagueType,
         });

         if (bookingFlowMode === 'resell') {
            const resaleCountsByGrade = await fetchResaleListingCountsByGrades(
               bookingEntryState!.gameId!,
               grades.map((grade) => grade.seatGradeId),
            );

            return mapSeatSectionsToZones({
               sections,
               grades: grades.map((grade) => ({
                  ...grade,
                  availableSeatCount: resaleCountsByGrade.get(grade.seatGradeId) ?? 0,
               })),
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

   const mergedBaseZones = useMemo(() => {
      if (bookingFlowMode === 'resell' && isResaleBookingMockEnabled) {
         return mockResellZones;
      }

      return mergeBookingZones({
         localZones,
         apiZones,
      });
   }, [apiZones, bookingFlowMode, localZones, mockResellZones]);

   const zones = useMemo<ZoneItem[]>(() => {
      return [...mergedBaseZones].sort(
         (left, right) => right.remaining - left.remaining || left.name.localeCompare(right.name, 'ko-KR'),
      );
   }, [mergedBaseZones]);

   useEffect(() => {
      if (zones.length === 0) {
         return;
      }

      patchBookingEntry({
         bookingZones: zones,
      });
   }, [patchBookingEntry, zones]);

   const isSeatGradeBotBlocked =
      apiZonesError instanceof ApiError &&
      (hasBotBlockedMessage(apiZonesError.message) || hasBotBlockedMessage(apiZonesError.data));

   return {
      zones,
      isSeatGradeBotBlocked,
   };
}
