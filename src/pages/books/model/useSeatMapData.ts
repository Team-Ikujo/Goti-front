import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
   buildSeatBlockFromApiSeats,
   fetchSeatSections,
   fetchSeats,
   fetchSeatStatuses,
   matchesSectionExpression,
   mapApiSeatsToSeatItems,
   normalizeSectionCode,
   resolveSeatSectionByCode,
   type SeatResponse,
   type SeatStatusResponse,
} from '@/pages/books/api/bookingApi';
import { getSeatBlocks } from '@/pages/books/model/seatData';
import type { SeatBlock, SeatItem, ZoneItem } from '@/pages/books/model/types';

const AGGREGATED_SECTION_CODE_PATTERN = /[~,/]/;
const API_SEAT_BASE_OFFSET_X = 120;
const API_SEAT_BASE_OFFSET_Y = 160;

type SeatMapDataParams = {
   gameId?: string;
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

const isAggregatedSectionCode = (sectionCode?: string) =>
   Boolean(sectionCode && AGGREGATED_SECTION_CODE_PATTERN.test(sectionCode));

const sortSectionBundles = (left: ApiSeatSectionBundle, right: ApiSeatSectionBundle) =>
   left.sectionCode.localeCompare(right.sectionCode, 'ko-KR', {
      numeric: true,
      sensitivity: 'base',
   });

const createSeatBlockForLayout = (block: SeatBlock, section: ApiSeatSectionBundle): SeatBlock => {
   if (section.seats.length === 0) {
      return {
         ...block,
         activeSeats: [],
      };
   }
   const rowNames = Array.from(new Set(section.seats.map((seat) => seat.rowName))).sort((left, right) =>
      left.localeCompare(right, 'ko-KR', {
         numeric: true,
         sensitivity: 'base',
      }),
   );
   const rowIndexByName = Object.fromEntries(rowNames.map((rowName, index) => [rowName, index]));
   const columnCount = Math.max(...section.seats.map((seat) => seat.seatNum));

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
   return mapApiSeatsToSeatItems({
      sectionId: zoneId,
      sectionCode: block.label,
      seats: section.seats,
      statuses: section.statuses,
   }).map((seat) => ({
      ...seat,
      x: seat.x - API_SEAT_BASE_OFFSET_X + block.offsetX,
      y: seat.y - API_SEAT_BASE_OFFSET_Y + block.offsetY,
   }));
};

const summarizeSeatStatuses = (statuses: SeatStatusResponse[]) => {
   return statuses.reduce<Record<string, number>>((summary, seatStatus) => {
      const key = seatStatus.status?.toUpperCase?.() ?? 'UNKNOWN';
      summary[key] = (summary[key] ?? 0) + 1;
      return summary;
   }, {});
};

const summarizeSeatItemStatuses = (seats: SeatItem[]) => {
   return seats.reduce<Record<SeatItem['status'], number>>(
      (summary, seat) => {
         summary[seat.status] += 1;
         return summary;
      },
      {
         available: 0,
         selected: 0,
         held: 0,
         disabled: 0,
      },
   );
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

const fetchAggregatedSeatSections = async ({
   gameId,
   stadiumId,
   zone,
}: Required<Pick<SeatMapDataParams, 'gameId' | 'stadiumId'>> & { zone: ZoneItem }) => {
   const sections = await fetchSeatSections(stadiumId);
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
         const [seats, statuses] = await Promise.all([
            fetchSeats(section.sectionId),
            fetchSeatStatuses(gameId, section.sectionId),
         ]);

         console.info('[SeatMapDebug] aggregated section payload', {
            zoneId: zone.id,
            zoneSectionCode: zone.sectionCode,
            sectionId: section.sectionId,
            sectionCode: section.sectionCode,
            seatsCount: seats.length,
            statusesCount: statuses.length,
            statusSummary: summarizeSeatStatuses(statuses),
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

export const useSeatMapData = ({ gameId, stadiumId, zone }: SeatMapDataParams) => {
   const defaultSeatBlocks = useMemo(() => getSeatBlocks(zone), [zone]);

   const { data, error, refetch } = useQuery({
      queryKey: ['booking-seat-map', gameId, stadiumId, zone.id, zone.sectionCode],
      enabled: Boolean(gameId && zone.id && zone.sectionCode),
      queryFn: async (): Promise<SeatMapApiSnapshot | null> => {
         if (!gameId || !zone.id || !zone.sectionCode) {
            return null;
         }

         if (!isAggregatedSectionCode(zone.sectionCode)) {
            const resolvedSection =
               (await resolveSeatSectionByCode({
                  stadiumId,
                  sectionCode: zone.sectionCode,
               })) ??
               ({
                  sectionId: zone.id,
                  sectionCode: zone.sectionCode,
               } satisfies Pick<ApiSeatSectionBundle, 'sectionId' | 'sectionCode'>);
            const [seats, statuses] = await Promise.all([
               fetchSeats(resolvedSection.sectionId),
               fetchSeatStatuses(gameId, resolvedSection.sectionId),
            ]);
            const [seatBlock] = buildSeatBlockFromApiSeats(zone.sectionCode, seats);

            if (!seatBlock) {
               return null;
            }

            const seatItems = createSeatItemsForLayout(
               seatBlock,
               zone.id,
               {
                  sectionId: resolvedSection.sectionId,
                  sectionCode: resolvedSection.sectionCode,
                  seats,
                  statuses,
               },
            );

            console.info('[SeatMapDebug] single section payload', {
               zoneId: zone.id,
               zoneSectionCode: zone.sectionCode,
               resolvedSectionId: resolvedSection.sectionId,
               seatsCount: seats.length,
               statusesCount: statuses.length,
               statusSummary: summarizeSeatStatuses(statuses),
               mappedStatusSummary: summarizeSeatItemStatuses(seatItems),
            });

            return {
               seatBlocks: [seatBlock],
               seatItems,
            };
         }

         if (!stadiumId) {
            return null;
         }

         const sectionBundles = await fetchAggregatedSeatSections({
            gameId,
            stadiumId,
            zone,
         });

         if (sectionBundles.length === 0) {
            return null;
         }

         const snapshot = buildAggregatedSeatMapSnapshot({
            defaultBlocks: defaultSeatBlocks,
            sections: sectionBundles,
            zoneId: zone.id,
         });

         console.info('[SeatMapDebug] aggregated snapshot', {
            zoneId: zone.id,
            zoneSectionCode: zone.sectionCode,
            seatBlockCount: snapshot.seatBlocks.length,
            seatItemCount: snapshot.seatItems.length,
            mappedStatusSummary: summarizeSeatItemStatuses(snapshot.seatItems),
         });

         return snapshot;
      },
   });

   return {
      seatBlocks: data?.seatBlocks ?? defaultSeatBlocks,
      apiSeatItems: data?.seatItems ?? [],
      hasApiSeatMap: Boolean(data),
      seatMapLoadError: error,
      refetchSeatMap: refetch,
   };
};
