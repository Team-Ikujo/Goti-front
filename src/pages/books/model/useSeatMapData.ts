import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
   buildSeatBlockFromApiSeats,
   fetchSeatSections,
   fetchSeats,
   fetchSeatStatuses,
   matchesSectionExpression,
   type SeatResponse,
   type SeatStatusResponse,
} from '@/pages/books/api/bookingApi';
import { getSeatBlocks } from '@/pages/books/model/seatData';
import type { SeatBlock, SeatItem, ZoneItem } from '@/pages/books/model/types';

const AGGREGATED_SECTION_CODE_PATTERN = /[~,/]/;
const API_SEAT_SPACING = 20;

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

const findSectionByCode = async ({
   stadiumId,
   sectionCode,
}: {
   stadiumId?: string;
   sectionCode: string;
}) => {
   if (!stadiumId) {
      return null;
   }

   const sections = await fetchSeatSections(stadiumId);
   const normalizedTargetSectionCode = normalizeSectionCode(sectionCode);

   return (
      sections.find((section) => normalizeSectionCode(section.sectionCode) === normalizedTargetSectionCode) ?? null
   );
};

const getSectionSeatLayoutMeta = (seats: SeatResponse[]) => {
   const rowNames = Array.from(new Set(seats.map((seat) => seat.rowName))).sort(sortRowNames);

   return {
      rowNames,
      rowIndexByName: Object.fromEntries(rowNames.map((rowName, index) => [rowName, index])),
      columnCount: seats.length > 0 ? Math.max(...seats.map((seat) => seat.seatNum)) : 0,
   };
};

const toSeatItemStatus = (seat: SeatResponse, statuses: Record<string, string>): SeatItem['status'] => {
   const status = statuses[seat.seatId]?.toUpperCase();

   if (!seat.available) {
      return 'disabled';
   }

   if (status === 'HELD') {
      return 'held';
   }

   if (status === 'SOLD' || status === 'BLOCKED') {
      return 'disabled';
   }

   return 'available';
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
         block: block.label,
         rowLabel: `${seat.rowName}열`,
         seatNumber: seat.seatNum,
         x: block.offsetX + (seat.seatNum - 1) * API_SEAT_SPACING,
         y: block.offsetY + rowIndex * API_SEAT_SPACING,
         zoneId,
         status: toSeatItemStatus(seat, statusBySeatId),
      } satisfies SeatItem;
   });
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
               (await findSectionByCode({
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
