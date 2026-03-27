import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { getBookingZones } from '@/pages/books/model/zoneData';
import type { SeatBlock, SeatItem, SeatStatus, ZoneItem } from '@/pages/books/model/types';

export type SeatGradeResponse = {
   seatGradeId: string;
   stadiumId: string;
   name: string;
   displayColorHex: string;
   availableSeatCount: number;
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

export type TicketPricingPolicyPriceResponse = {
   priceId: string;
   gradeId: string;
   ticketType: string;
   dayType: string;
   leagueType: string;
   price: number;
};

export type TicketPricingPolicyResponse = {
   policyId: string;
   teamId: string;
   policyStartAt: string;
   policyEndAt: string;
   isActive: boolean;
   prices: TicketPricingPolicyPriceResponse[];
};

const DEFAULT_ZONE_COLOR = '#64748b';
const API_BLOCK_OFFSET_X = 120;
const API_BLOCK_OFFSET_Y = 160;
const SEAT_STEP = 20;

type RawSeatResponse = Partial<SeatResponse> & {
   id?: string;
   seatNumber?: number;
   row?: string;
   isAvailable?: boolean;
};

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const toOptionalFiniteNumber = (value: unknown) => {
   if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
   }

   if (typeof value === 'string' && value.trim()) {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
         return parsedValue;
      }
   }

   return undefined;
};

const normalizeSeatResponse = (seat: RawSeatResponse): SeatResponse | null => {
   const seatId = isNonEmptyString(seat.seatId) ? seat.seatId : isNonEmptyString(seat.id) ? seat.id : undefined;
   const sectionId = isNonEmptyString(seat.sectionId) ? seat.sectionId : undefined;
   const rowName = isNonEmptyString(seat.rowName) ? seat.rowName : isNonEmptyString(seat.row) ? seat.row : undefined;
   const seatNum = toOptionalFiniteNumber(seat.seatNum) ?? toOptionalFiniteNumber(seat.seatNumber);

   if (!seatId || !sectionId || !rowName || seatNum === undefined) {
      return null;
   }

   return {
      seatId,
      sectionId,
      rowName,
      seatNum,
      available: typeof seat.available === 'boolean' ? seat.available : typeof seat.isAvailable === 'boolean' ? seat.isAvailable : true,
   };
};

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
      case 'SOLD':
      case 'BLOCKED':
         return 'disabled';
      default:
         return 'available';
   }
};

const sortRowNames = (left: string, right: string) =>
   left.localeCompare(right, 'ko-KR', {
      numeric: true,
      sensitivity: 'base',
   });

const normalizePolicyLeagueType = (value?: string) => value?.trim().toUpperCase();

const normalizePolicyDate = (value: string) => {
   const trimmed = value.trim();

   if (!trimmed) {
      return '';
   }

   return trimmed.includes('T') ? trimmed.slice(0, 10) : trimmed.split(' ')[0] ?? trimmed;
};

export const getPricingDayType = (gameDate: string) => {
   const [year, month, day] = gameDate.split('-').map(Number);

   if (!year || !month || !day) {
      return undefined;
   }

   const dayOfWeek = new Date(year, month - 1, day).getDay();

   return dayOfWeek === 0 || dayOfWeek === 6 ? 'WEEKEND' : 'WEEKDAY';
};

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

export const resolveSeatSectionByCode = async ({
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

   return sections.find((section) => normalizeSectionCode(section.sectionCode) === normalizedTargetSectionCode) ?? null;
};

export const fetchSeats = async (sectionId: string) => {
   const response = await apiClient.get<ApiEnvelope<RawSeatResponse[]>>(`/api/v1/seats/seat-sections/${sectionId}/seats`);

   return (response.data.data ?? []).flatMap((seat) => {
      const normalizedSeat = normalizeSeatResponse(seat);

      if (normalizedSeat) {
         return [normalizedSeat];
      }

      console.error('[bookingApi] 좌석 응답 정규화 실패', {
         sectionId,
         seat,
      });

      return [];
   });
};

export const fetchSeatStatuses = async (gameId: string, sectionId: string) => {
   const response = await apiClient.get<ApiEnvelope<SeatStatusResponse[]>>(
      `/api/v1/game-seats/${gameId}/sections/${sectionId}/seat-statuses`,
   );

   return response.data.data;
};

export const summarizeSeatStatusSnapshot = (statuses: SeatStatusResponse[]) => {
   return statuses.reduce<Record<string, number>>((summary, seatStatus) => {
      const key = seatStatus.status?.toUpperCase?.() || 'UNKNOWN';

      summary[key] = (summary[key] ?? 0) + 1;

      return summary;
   }, {});
};

export const fetchTicketPricingPolicy = async (teamId: string) => {
   const response = await apiClient.get<ApiEnvelope<TicketPricingPolicyResponse>>(
      `/api/v1/teams/${teamId}/ticket-pricing-policies`,
   );

   return response.data.data;
};

const resolveZonePrice = ({
   fallbackPrice,
   gradeIds,
   pricingByGradeId,
}: {
   fallbackPrice: number;
   gradeIds: Iterable<string>;
   pricingByGradeId: Map<string, number>;
}) => {
   const matchedPrices = [...new Set([...gradeIds].map((gradeId) => pricingByGradeId.get(gradeId)).filter((price): price is number => Number.isFinite(price)))];

   if (matchedPrices.length !== 1) {
      return fallbackPrice;
   }

   return matchedPrices[0];
};

export const resolvePricingByGradeId = ({
   policy,
   gameDate,
   leagueType,
}: {
   policy?: TicketPricingPolicyResponse;
   gameDate?: string;
   leagueType?: string;
}) => {
   if (!policy?.isActive || !gameDate || !leagueType) {
      return new Map<string, number>();
   }

   const normalizedGameDate = normalizePolicyDate(gameDate);
   const normalizedLeagueType = normalizePolicyLeagueType(leagueType);
   const dayType = getPricingDayType(normalizedGameDate);
   const policyStartAt = normalizePolicyDate(policy.policyStartAt);
   const policyEndAt = normalizePolicyDate(policy.policyEndAt);

   if (!normalizedGameDate || !normalizedLeagueType || !dayType) {
      return new Map<string, number>();
   }

   if ((policyStartAt && normalizedGameDate < policyStartAt) || (policyEndAt && normalizedGameDate > policyEndAt)) {
      return new Map<string, number>();
   }

   const filteredPrices = policy.prices.filter((price) => {
      const normalizedPriceLeagueType = normalizePolicyLeagueType(price.leagueType);

      return (
         normalizePolicyLeagueType(price.ticketType) === 'ADULT' &&
         normalizePolicyLeagueType(price.dayType) === dayType &&
         normalizedPriceLeagueType === normalizedLeagueType
      );
   });

   return new Map(filteredPrices.map((price) => [price.gradeId, price.price]));
};

export const mapSeatSectionsToZones = ({
   sections,
   grades,
   teamId,
   pricingByGradeId,
   remainingBySectionId,
}: {
   sections: SeatSectionResponse[];
   grades: SeatGradeResponse[];
   teamId?: string;
   pricingByGradeId?: Map<string, number>;
   remainingBySectionId?: Map<string, number>;
}): ZoneItem[] => {
   const gradeById = Object.fromEntries(grades.map((grade) => [grade.seatGradeId, grade]));
   const aggregatedZones = new Map<string, ZoneItem>();
   const aggregatedZoneGradeIds = new Map<string, Set<string>>();
   const aggregatedZoneSectionIds = new Map<string, Set<string>>();
   const unmatchedZones: ZoneItem[] = [];

   sections.forEach((section) => {
      const matchedZone = resolveZoneTemplate(teamId, section.sectionCode);
      const grade = gradeById[section.gradeId];
      const remainingCount = remainingBySectionId?.get(section.sectionId) ?? grade?.availableSeatCount ?? section.capacity;

      if (matchedZone) {
         const existingZone = aggregatedZones.get(matchedZone.id);
         const zoneGradeIds = aggregatedZoneGradeIds.get(matchedZone.id) ?? new Set<string>();
         const zoneSectionIds = aggregatedZoneSectionIds.get(matchedZone.id) ?? new Set<string>();
         const shouldAddGradeAvailability = Boolean(grade && !zoneGradeIds.has(section.gradeId));

         zoneGradeIds.add(section.gradeId);
         zoneSectionIds.add(section.sectionId);
         aggregatedZoneGradeIds.set(matchedZone.id, zoneGradeIds);
         aggregatedZoneSectionIds.set(matchedZone.id, zoneSectionIds);

         if (existingZone) {
            aggregatedZones.set(matchedZone.id, {
               ...existingZone,
               price: resolveZonePrice({
                  fallbackPrice: matchedZone.price,
                  gradeIds: zoneGradeIds,
                  pricingByGradeId: pricingByGradeId ?? new Map<string, number>(),
               }),
               remaining: remainingBySectionId
                  ? existingZone.remaining + remainingCount
                  : shouldAddGradeAvailability
                     ? existingZone.remaining + (grade?.availableSeatCount ?? section.capacity)
                     : existingZone.remaining,
               sectionIds: [...zoneSectionIds],
               gradeIds: [...zoneGradeIds],
            });
            return;
         }

         aggregatedZones.set(matchedZone.id, {
            ...matchedZone,
            price: resolveZonePrice({
               fallbackPrice: matchedZone.price,
               gradeIds: zoneGradeIds,
               pricingByGradeId: pricingByGradeId ?? new Map<string, number>(),
            }),
            remaining: remainingCount,
            color: grade?.displayColorHex ?? matchedZone.color ?? DEFAULT_ZONE_COLOR,
            sectionIds: [...zoneSectionIds],
            gradeIds: [...zoneGradeIds],
         });
         return;
      }

      const displayName = grade ? `${grade.name} ${section.sectionCode}` : section.sectionCode;
      unmatchedZones.push({
         id: section.sectionId,
         name: displayName,
         price: resolveZonePrice({
            fallbackPrice: 0,
            gradeIds: [section.gradeId],
            pricingByGradeId: pricingByGradeId ?? new Map<string, number>(),
         }),
         remaining: remainingCount,
         color: grade?.displayColorHex ?? DEFAULT_ZONE_COLOR,
         hotspot: [],
         sectionCode: section.sectionCode,
         sectionIds: [section.sectionId],
         gradeIds: [section.gradeId],
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
         price: apiZone.price,
         remaining: apiZone.remaining,
         color: apiZone.color,
         sectionIds: apiZone.sectionIds,
         gradeIds: apiZone.gradeIds,
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
