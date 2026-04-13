import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
   buildSeatBlockFromApiSeats,
   fetchSeatGrades,
   fetchSeatSections,
   fetchSeatStatuses,
   mapSeatStatusToUiStatus,
   mapSeatStatusesToSeats,
   matchesSectionExpression,
   resolveSeatSectionByCode,
   type SeatResponse,
   type SeatStatusResponse,
} from '@/pages/books/api/bookingApi';
import { getSeatBlocks } from '@/pages/books/model/seatData';
import type { SeatBlock, SeatItem, ZoneItem } from '@/pages/books/model/types';
import { logBookingFlow, logBookingFlowError, summarizeZone } from '@/shared/lib/bookingFlowDebug';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';

const AGGREGATED_SECTION_CODE_PATTERN = /[~,/]/;
const API_SEAT_SPACING = 20;
const DEFAULT_SEAT_MAP_ERROR_MESSAGE = '현재 좌석 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.';
const MEANINGFUL_SEAT_MAP_ERROR_PATTERNS = [/예매 가능/i, /권한/i, /로그인/i];

type SeatMapDataParams = {
   gameId?: string;
   isEntryReady?: boolean;
   preferMockSeatMap?: boolean;
   queueTokenJti?: string;
   stadiumId?: string;
   zone: ZoneItem;
};

type ApiSeatSectionBundle = {
   sectionId: string;
   sectionCode: string;
   seats: SeatResponse[];
   statuses: SeatStatusResponse[];
};

type SeatMapApiSnapshot = {
   seatBlocks: SeatBlock[];
   seatItems: SeatItem[];
};

const sortRowNames = (left: string, right: string) =>
   left.localeCompare(right, 'ko-KR', {
      numeric: true,
      sensitivity: 'base',
   });

const normalizeSectionCode = (value: string) => value.replace(/\s+/g, '').toUpperCase();

const isAggregatedSectionCode = (sectionCode?: string) =>
   Boolean(sectionCode && AGGREGATED_SECTION_CODE_PATTERN.test(sectionCode));

const sortSectionBundles = (left: ApiSeatSectionBundle, right: ApiSeatSectionBundle) =>
   left.sectionCode.localeCompare(right.sectionCode, 'ko-KR', {
      numeric: true,
      sensitivity: 'base',
   });

const toSeatMapErrorMessage = (error: unknown) => {
   const message = getErrorMessage(error, DEFAULT_SEAT_MAP_ERROR_MESSAGE);

   return MEANINGFUL_SEAT_MAP_ERROR_PATTERNS.some((pattern) => pattern.test(message))
      ? message
      : DEFAULT_SEAT_MAP_ERROR_MESSAGE;
};

const getSectionSeatLayoutMeta = (seats: SeatResponse[]) => {
   const rowNames = Array.from(new Set(seats.map((seat) => seat.rowName))).sort(sortRowNames);

   return {
      rowNames,
      rowIndexByName: Object.fromEntries(rowNames.map((rowName, index) => [rowName, index])),
      columnCount: seats.length > 0 ? Math.max(...seats.map((seat) => seat.seatNum)) : 0,
   };
};

const createSeatBlockForLayout = (block: SeatBlock, section: ApiSeatSectionBundle): SeatBlock => {
   if (section.seats.length === 0) {
      return {
         ...block,
         activeSeats: [],
      };
   }

   const { rowNames, rowIndexByName, columnCount } = getSectionSeatLayoutMeta(section.seats);

   return {
      ...block,
      id: section.sectionCode,
      label: section.sectionCode,
      rows: rowNames.length,
      cols: columnCount,
      activeSeats: section.seats.map((seat) => `${rowIndexByName[seat.rowName] ?? 0}-${seat.seatNum - 1}`),
   };
};

const createSeatItemsForLayout = (block: SeatBlock, zoneId: string, section: ApiSeatSectionBundle): SeatItem[] => {
   const { rowIndexByName } = getSectionSeatLayoutMeta(section.seats);
   const statusBySeatId = Object.fromEntries(section.statuses.map((seatStatus) => [seatStatus.seatId, seatStatus.status]));

   return section.seats.map((seat) => {
      const rowIndex = rowIndexByName[seat.rowName] ?? 0;

      return {
         id: seat.seatId,
         apiSeatId: seat.apiSeatId,
         block: block.label,
         rowLabel: `${seat.rowName}열`,
         seatNumber: seat.seatNum,
         x: block.offsetX + (seat.seatNum - 1) * API_SEAT_SPACING,
         y: block.offsetY + rowIndex * API_SEAT_SPACING,
         zoneId,
         status: mapSeatStatusToUiStatus(statusBySeatId[seat.apiSeatId] ?? statusBySeatId[seat.seatId]),
      } satisfies SeatItem;
   });
};

const buildAggregatedSeatMapSnapshot = ({
   defaultBlocks,
   sections,
   zoneId,
}: {
   defaultBlocks: SeatBlock[];
   sections: ApiSeatSectionBundle[];
   zoneId: string;
}): SeatMapApiSnapshot => {
   const sortedSections = [...sections].sort(sortSectionBundles);
   const sectionByCode = new Map(sortedSections.map((section) => [normalizeSectionCode(section.sectionCode), section]));
   const assignedSections = new Set<string>();

   const blockAssignments = defaultBlocks.flatMap((block) => {
      const matchedSection = sectionByCode.get(normalizeSectionCode(block.label));

      if (matchedSection) {
         assignedSections.add(matchedSection.sectionId);

         return [
            {
               block,
               section: matchedSection,
            },
         ];
      }

      return [];
   });

   const remainingSections = sortedSections.filter((section) => !assignedSections.has(section.sectionId));
   const remainingBlocks = defaultBlocks.filter(
      (block) => !blockAssignments.some((assignment) => assignment.block.id === block.id),
   );

   remainingSections.forEach((section, index) => {
      const fallbackBlock = remainingBlocks[index];

      if (!fallbackBlock) {
         return;
      }

      blockAssignments.push({
         block: fallbackBlock,
         section,
      });
   });

   return {
      seatBlocks: blockAssignments.map(({ block, section }) => createSeatBlockForLayout(block, section)),
      seatItems: blockAssignments.flatMap(({ block, section }) => createSeatItemsForLayout(block, zoneId, section)),
   };
};

const resolveSeatMapStadiumId = async ({
   gameId,
   stadiumId,
}: {
   gameId: string;
   stadiumId?: string;
}) => {
   if (stadiumId) {
      return stadiumId;
   }

   const grades = await fetchSeatGrades({ gameId });

   return grades.find((grade) => grade.stadiumId)?.stadiumId;
};

const fetchAggregatedSeatSections = async ({
   gameId,
   stadiumId,
   zone,
}: Required<Pick<SeatMapDataParams, 'gameId' | 'stadiumId'>> & { zone: ZoneItem }) => {
   const sections = await fetchSeatSections({
      stadiumId,
      gameId,
   });
   const targetSections = sections
      .filter((section) => matchesSectionExpression(zone.sectionCode, section.sectionCode))
      .sort((left, right) =>
         left.sectionCode.localeCompare(right.sectionCode, 'ko-KR', {
            numeric: true,
            sensitivity: 'base',
         }),
      );

   const sectionBundles = await Promise.all(
      targetSections.map(async (section) => {
         const statuses = await fetchSeatStatuses(gameId, section.sectionId);
         const seats = mapSeatStatusesToSeats({
            sectionId: section.sectionId,
            statuses,
         });

         return {
            sectionId: section.sectionId,
            sectionCode: section.sectionCode,
            seats,
            statuses,
         } satisfies ApiSeatSectionBundle;
      }),
   );

   return sectionBundles;
};

export const useSeatMapData = ({
   gameId,
   isEntryReady = true,
   preferMockSeatMap = false,
   queueTokenJti,
   stadiumId,
   zone,
}: SeatMapDataParams) => {
   const queryClient = useQueryClient();
   const defaultSeatBlocks = useMemo(() => getSeatBlocks(zone), [zone]);
   const requiresSectionResolution = isAggregatedSectionCode(zone.sectionCode) || !zone.sectionIds?.length;
   const zoneSectionIdsKey = zone.sectionIds?.join(',') ?? '';
   const zoneGradeIdsKey = zone.gradeIds?.join(',') ?? '';
   const shouldEnableSeatMapQuery =
      isEntryReady && !preferMockSeatMap && Boolean(gameId && zone.id && zone.sectionCode);
   const seatMapQueryKey = [
      'booking-seat-map',
      gameId,
      stadiumId,
      queueTokenJti,
      zone.id,
      zone.sectionCode,
      zoneSectionIdsKey,
      zoneGradeIdsKey,
   ] as const;
   const seatMapRequestKey = [
      gameId,
      stadiumId,
      queueTokenJti,
      zone.id,
      zone.sectionCode,
      zoneSectionIdsKey,
      zoneGradeIdsKey,
   ].join('|');

   const { data, error, isError, isFetching, isLoading, refetch } = useQuery({
      queryKey: seatMapQueryKey,
      enabled: shouldEnableSeatMapQuery,
      refetchOnMount: 'always',
      queryFn: async (): Promise<SeatMapApiSnapshot | null> => {
         logBookingFlow('useSeatMapData', 'queryFn start', {
            seatMapRequestKey,
            shouldEnableSeatMapQuery,
            requiresSectionResolution,
            gameId,
            stadiumId,
            zone: summarizeZone(zone),
         });

         if (!gameId || !zone.id || !zone.sectionCode) {
            logBookingFlow('useSeatMapData', 'queryFn skipped: missing query inputs', {
               gameId,
               zoneId: zone.id,
               sectionCode: zone.sectionCode,
            });
            return null;
         }

         const resolvedStadiumId = requiresSectionResolution
            ? await resolveSeatMapStadiumId({
                 gameId,
                 stadiumId,
              })
            : stadiumId;

         logBookingFlow('useSeatMapData', 'resolved stadium for seat map', {
            seatMapRequestKey,
            requiresSectionResolution,
            inputStadiumId: stadiumId,
            resolvedStadiumId,
         });

         if (!isAggregatedSectionCode(zone.sectionCode)) {
            const resolvedSectionId = zone.sectionIds?.[0];
            const resolvedSection = resolvedSectionId
               ? {
                    sectionId: resolvedSectionId,
                    sectionCode: zone.sectionCode,
                 }
               : await resolveSeatSectionByCode({
                    stadiumId: resolvedStadiumId,
                    gameId,
                    sectionCode: zone.sectionCode,
                 });

            logBookingFlow('useSeatMapData', 'resolved single section seat map target', {
               seatMapRequestKey,
               resolvedSectionId,
               resolvedSection,
            });

            if (!resolvedSection) {
               throw new Error(DEFAULT_SEAT_MAP_ERROR_MESSAGE);
            }
            const statuses = await fetchSeatStatuses(gameId, resolvedSection.sectionId);
            const seats = mapSeatStatusesToSeats({
               sectionId: resolvedSection.sectionId,
               statuses,
            });

            const [seatBlock] = buildSeatBlockFromApiSeats(zone.sectionCode, seats);

            if (!seatBlock) {
               throw new Error(DEFAULT_SEAT_MAP_ERROR_MESSAGE);
            }

            logBookingFlow('useSeatMapData', 'single section seat map resolved', {
               seatMapRequestKey,
               sectionId: resolvedSection.sectionId,
               sectionCode: resolvedSection.sectionCode,
               seatCount: seats.length,
            });

            return {
               seatBlocks: [seatBlock],
               seatItems: createSeatItemsForLayout(
                  seatBlock,
                  zone.id,
                  {
                     sectionId: resolvedSection.sectionId,
                     sectionCode: resolvedSection.sectionCode,
                     seats,
                     statuses,
                  },
               ),
            };
         }

         if (!resolvedStadiumId) {
            throw new Error(DEFAULT_SEAT_MAP_ERROR_MESSAGE);
         }

         const sectionBundles = await fetchAggregatedSeatSections({
            gameId,
            stadiumId: resolvedStadiumId,
            zone,
         });

         logBookingFlow('useSeatMapData', 'aggregated seat sections resolved', {
            seatMapRequestKey,
            sectionBundleCount: sectionBundles.length,
            sectionIds: sectionBundles.map((section) => section.sectionId),
            sectionCodes: sectionBundles.map((section) => section.sectionCode),
         });

         if (sectionBundles.length === 0) {
            throw new Error(DEFAULT_SEAT_MAP_ERROR_MESSAGE);
         }

         return buildAggregatedSeatMapSnapshot({
            defaultBlocks: defaultSeatBlocks,
            sections: sectionBundles,
            zoneId: zone.id,
         });
      },
   });

   useEffect(() => {
      logBookingFlow('useSeatMapData', 'query state snapshot', {
         seatMapRequestKey,
         enabled: shouldEnableSeatMapQuery,
         isEntryReady,
         preferMockSeatMap,
         requiresSectionResolution,
         gameId,
         stadiumId,
         queueTokenJti,
         zone: summarizeZone(zone),
         hasData: Boolean(data),
         apiSeatItemCount: data?.seatItems.length ?? 0,
         isFetching,
         isLoading,
         isError,
      });
   }, [
      data,
      gameId,
      isEntryReady,
      isError,
      isFetching,
      isLoading,
      preferMockSeatMap,
      requiresSectionResolution,
      seatMapRequestKey,
      shouldEnableSeatMapQuery,
      stadiumId,
      queueTokenJti,
      zone,
   ]);

   useEffect(() => {
      if (!error) {
         return;
      }

      logBookingFlowError('useSeatMapData', 'query error', {
         seatMapRequestKey,
         error,
      });
   }, [error, seatMapRequestKey]);

   const lastRefetchedRequestKeyRef = useRef<string | null>(null);
   const lastRecoveredRequestKeyRef = useRef<string | null>(null);

   useEffect(() => {
      if (!shouldEnableSeatMapQuery) {
         lastRefetchedRequestKeyRef.current = null;
         lastRecoveredRequestKeyRef.current = null;
         return;
      }

      if (lastRefetchedRequestKeyRef.current === seatMapRequestKey) {
         return;
      }

      lastRefetchedRequestKeyRef.current = seatMapRequestKey;
      logBookingFlow('useSeatMapData', 'manual refetch triggered for request key', {
         seatMapRequestKey,
      });
      void refetch();
   }, [refetch, seatMapRequestKey, shouldEnableSeatMapQuery]);

   useEffect(() => {
      if (!shouldEnableSeatMapQuery || Boolean(data) || isError) {
         return;
      }

      const queryState = queryClient.getQueryState<SeatMapApiSnapshot | null>(seatMapQueryKey);
      const isStuckPendingFetch =
         queryState?.fetchStatus === 'fetching' &&
         queryState.status === 'pending' &&
         !queryState.dataUpdatedAt;

      if (!isStuckPendingFetch || lastRecoveredRequestKeyRef.current === seatMapRequestKey) {
         return;
      }

      lastRecoveredRequestKeyRef.current = seatMapRequestKey;
      logBookingFlow('useSeatMapData', 'recover stuck pending seat map query', {
         seatMapRequestKey,
      });

      void queryClient.cancelQueries({
         queryKey: seatMapQueryKey,
         exact: true,
      }).then(() => {
         queryClient.removeQueries({
            queryKey: seatMapQueryKey,
            exact: true,
         });
         void refetch();
      });
   }, [
      data,
      isError,
      queryClient,
      refetch,
      seatMapQueryKey,
      seatMapRequestKey,
      shouldEnableSeatMapQuery,
   ]);

   return {
      seatBlocks: data?.seatBlocks ?? defaultSeatBlocks,
      apiSeatItems: data?.seatItems ?? [],
      hasApiSeatMap: Boolean(data),
      isSeatMapError: isError,
      seatMapErrorMessage: isError ? toSeatMapErrorMessage(error) : '',
      isSeatMapLoading: isLoading || isFetching,
      refetchSeatMap: refetch,
   };
};
