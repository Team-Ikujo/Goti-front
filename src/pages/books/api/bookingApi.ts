import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { getBookingZones } from '@/pages/books/model/zoneData';
import type { SeatBlock, SeatItem, SeatStatus, ZoneItem } from '@/pages/books/model/types';

export type SeatGradeResponse = {
   seatGradeId: string;
   stadiumId: string;
   name: string;
   displayColorHex: string;
};

export type SeatSectionResponse = {
   sectionId: string;
   gradeId: string;
   stadiumId: string;
   sectionCode: string;
   capacity: number;
};

export type SeatResponse = {
   seatId: string;
   sectionId: string;
   rowName: string;
   seatNum: number;
   available: boolean;
};

export type SeatStatusResponse = {
   seatId: string;
   status: string;
};

const DEFAULT_ZONE_COLOR = '#64748b';
const API_BLOCK_OFFSET_X = 120;
const API_BLOCK_OFFSET_Y = 160;
const SEAT_STEP = 20;

const normalizeSectionCode = (value: string) => value.replace(/\s+/g, '').toUpperCase();

const parseTokenRange = (value: string) => {
   const match = value.match(/^(.*?)(\d+)$/);

   if (!match) {
      return null;
   }

   return {
      prefix: match[1],
      number: Number(match[2]),
   };
};

export const matchesSectionExpression = (expression: string, rawSectionCode: string) => {
   const sectionCode = normalizeSectionCode(rawSectionCode);
   const candidates = normalizeSectionCode(expression)
      .replace(/\//g, ',')
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);

   return candidates.some((candidate) => {
      if (!candidate.includes('~')) {
         return candidate === sectionCode;
      }

      const [rangeStart, rangeEnd] = candidate.split('~');

      if (!rangeStart || !rangeEnd) {
         return false;
      }

      const parsedStart = parseTokenRange(rangeStart);
      const parsedEnd = parseTokenRange(rangeEnd);
      const parsedCurrent = parseTokenRange(sectionCode);

      if (!parsedStart || !parsedEnd || !parsedCurrent) {
         return false;
      }

      if (parsedStart.prefix !== parsedEnd.prefix || parsedStart.prefix !== parsedCurrent.prefix) {
         return false;
      }

      return parsedCurrent.number >= parsedStart.number && parsedCurrent.number <= parsedEnd.number;
   });
};

const resolveZoneTemplate = (teamId: string | undefined, sectionCode: string) => {
   if (!teamId) {
      return undefined;
   }

   return getBookingZones(teamId).find((zone) => matchesSectionExpression(zone.sectionCode, sectionCode));
};

const toSeatStatus = (status: string | undefined, available: boolean): SeatStatus => {
   if (!available) {
      return 'disabled';
   }

   switch (status?.toUpperCase()) {
      case 'AVAILABLE':
         return 'available';
      case 'HELD':
         return 'held';
      case 'SELECTED':
         return 'selected';
      default:
         return 'available';
   }
};

const sortRowNames = (left: string, right: string) =>
   left.localeCompare(right, 'ko-KR', {
      numeric: true,
      sensitivity: 'base',
   });

export const fetchSeatGrades = async (gameId: string, stadiumId: string) => {
   const response = await apiClient.get<ApiEnvelope<SeatGradeResponse[]>>(
      `/api/v1/stadium-seats/stadiums/${stadiumId}/games/${gameId}/seat-grades`,
   );

   return response.data.data;
};

export const fetchSeatSections = async (stadiumId: string) => {
   const response = await apiClient.get<ApiEnvelope<SeatSectionResponse[]>>(`/api/v1/stadium-seats/stadiums/${stadiumId}/seat-sections`);

   return response.data.data;
};

export const fetchSeats = async (sectionId: string) => {
   const response = await apiClient.get<ApiEnvelope<SeatResponse[]>>(`/api/v1/seats/seat-sections/${sectionId}/seats`);

   return response.data.data;
};

export const fetchSeatStatuses = async (gameId: string, sectionId: string) => {
   const response = await apiClient.get<ApiEnvelope<SeatStatusResponse[]>>(
      `/api/v1/games/${gameId}/sections/${sectionId}/seat-statuses`,
   );

   return response.data.data;
};

export const mapSeatSectionsToZones = ({
   sections,
   grades,
   teamId,
}: {
   sections: SeatSectionResponse[];
   grades: SeatGradeResponse[];
   teamId?: string;
}): ZoneItem[] => {
   const gradeById = Object.fromEntries(grades.map((grade) => [grade.seatGradeId, grade]));
   const aggregatedZones = new Map<string, ZoneItem>();
   const unmatchedZones: ZoneItem[] = [];

   sections.forEach((section) => {
      const matchedZone = resolveZoneTemplate(teamId, section.sectionCode);
      const grade = gradeById[section.gradeId];
      if (matchedZone) {
         const existingZone = aggregatedZones.get(matchedZone.id);

         if (existingZone) {
            aggregatedZones.set(matchedZone.id, {
               ...existingZone,
               remaining: existingZone.remaining + section.capacity,
            });
            return;
         }

         aggregatedZones.set(matchedZone.id, {
            ...matchedZone,
            remaining: section.capacity,
            color: grade?.displayColorHex ?? matchedZone.color ?? DEFAULT_ZONE_COLOR,
         });
         return;
      }

      const displayName = grade ? `${grade.name} ${section.sectionCode}` : section.sectionCode;
      unmatchedZones.push({
         id: section.sectionId,
         name: displayName,
         price: 0,
         remaining: section.capacity,
         color: grade?.displayColorHex ?? DEFAULT_ZONE_COLOR,
         hotspot: [],
         sectionCode: section.sectionCode,
      } satisfies ZoneItem);
   });

   return [...aggregatedZones.values(), ...unmatchedZones];
};

export const mergeBookingZones = ({
   localZones,
   apiZones,
}: {
   localZones: ZoneItem[];
   apiZones?: ZoneItem[];
}): ZoneItem[] => {
   if (!apiZones?.length) {
      return localZones;
   }

   const apiZoneById = new Map(apiZones.map((zone) => [zone.id, zone]));

   return localZones.map((localZone) => {
      const apiZone = apiZoneById.get(localZone.id);

      if (!apiZone) {
         return localZone;
      }

      return {
         ...localZone,
         remaining: apiZone.remaining,
         color: apiZone.color,
      } satisfies ZoneItem;
   });
};

export const buildSeatBlockFromApiSeats = (sectionCode: string, seats: SeatResponse[]): SeatBlock[] => {
   if (seats.length === 0) {
      return [];
   }

   const rowNames = Array.from(new Set(seats.map((seat) => seat.rowName))).sort(sortRowNames);
   const columnCount = Math.max(...seats.map((seat) => seat.seatNum));

   return [
      {
         id: sectionCode,
         label: sectionCode,
         rows: rowNames.length,
         cols: columnCount,
         offsetX: API_BLOCK_OFFSET_X,
         offsetY: API_BLOCK_OFFSET_Y,
         activeSeats: seats.map((seat) => `${rowNames.indexOf(seat.rowName)}-${seat.seatNum - 1}`),
      },
   ];
};

export const mapApiSeatsToSeatItems = ({
   sectionId,
   sectionCode,
   seats,
   statuses,
}: {
   sectionId: string;
   sectionCode: string;
   seats: SeatResponse[];
   statuses?: SeatStatusResponse[];
}): SeatItem[] => {
   const rowNames = Array.from(new Set(seats.map((seat) => seat.rowName))).sort(sortRowNames);
   const rowIndexByName = Object.fromEntries(rowNames.map((rowName, index) => [rowName, index]));
   const statusBySeatId = Object.fromEntries((statuses ?? []).map((seatStatus) => [seatStatus.seatId, seatStatus.status]));

   return seats.map((seat) => {
      const rowIndex = rowIndexByName[seat.rowName] ?? 0;

      return {
         id: seat.seatId,
         zoneId: sectionId,
         block: sectionCode,
         rowLabel: `${seat.rowName}열`,
         seatNumber: seat.seatNum,
         x: API_BLOCK_OFFSET_X + (seat.seatNum - 1) * SEAT_STEP,
         y: API_BLOCK_OFFSET_Y + rowIndex * SEAT_STEP,
         status: toSeatStatus(statusBySeatId[seat.seatId], seat.available),
      } satisfies SeatItem;
   });
};
