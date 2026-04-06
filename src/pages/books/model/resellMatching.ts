import type { ResaleListingItem as ApiResaleListingItem } from '@/entities/resale/api/resaleApi';
import type { ZoneItem } from './types';

const normalizeToken = (value: string) => value.replace(/\s+/g, '').toUpperCase();

const expandSectionExpression = (expression: string) => {
   return expression
      .replace(/\//g, ',')
      .split(',')
      .flatMap((token) => {
         const trimmedToken = token.trim();

         if (!trimmedToken) {
            return [];
         }

         if (!trimmedToken.includes('~')) {
            return [trimmedToken];
         }

         const [start, end] = trimmedToken.split('~');

         if (!start || !end) {
            return [trimmedToken];
         }

         const startMatch = start.match(/^(.*?)(\d+)$/);
         const endMatch = end.match(/^(.*?)(\d+)$/);

         if (!startMatch || !endMatch || startMatch[1] !== endMatch[1]) {
            return [trimmedToken];
         }

         const prefix = startMatch[1];
         const startNumber = Number(startMatch[2]);
         const endNumber = Number(endMatch[2]);
         const width = startMatch[2].length;

         if (Number.isNaN(startNumber) || Number.isNaN(endNumber) || startNumber > endNumber) {
            return [trimmedToken];
         }

         return Array.from({ length: endNumber - startNumber + 1 }, (_, index) => {
            return `${prefix}${String(startNumber + index).padStart(width, '0')}`;
         });
      })
      .map(normalizeToken)
      .filter(Boolean);
};

const matchesSeatInfoSectionExpression = (expression: string, seatInfo: string) => {
   const normalizedSeatInfo = normalizeToken(seatInfo);
   const sectionCodes = expandSectionExpression(expression);

   return sectionCodes.some((sectionCode) => normalizedSeatInfo.includes(sectionCode));
};

const matchesSectionId = (listingSeatId: string, sectionIds?: string[]) => {
   if (!sectionIds?.length) {
      return false;
   }

   return sectionIds.some((sectionId) => listingSeatId.includes(sectionId));
};

export const isPurchasableResaleListing = (listing: ApiResaleListingItem, gameId?: string) => {
   return (
      Boolean(gameId) &&
      listing.gameId === gameId &&
      listing.listingStatus === 'LISTING' &&
      listing.availableStatus === 'ENABLED' &&
      listing.isPurchasable !== false
   );
};

export const matchesResaleListingToZone = ({
   zone,
   listing,
}: {
   zone: ZoneItem;
   listing: ApiResaleListingItem;
}) => {
   return matchesSectionId(listing.seatId, zone.sectionIds) || matchesSeatInfoSectionExpression(zone.sectionCode, listing.seatInfo);
};

export const resolveResaleListingZoneId = ({
   zones,
   listing,
}: {
   zones: ZoneItem[];
   listing: ApiResaleListingItem;
}) => {
   const matchedBySectionId = zones.find((zone) => matchesSectionId(listing.seatId, zone.sectionIds));

   if (matchedBySectionId) {
      return matchedBySectionId.id;
   }

   return zones.find((zone) => matchesSeatInfoSectionExpression(zone.sectionCode, listing.seatInfo))?.id;
};
