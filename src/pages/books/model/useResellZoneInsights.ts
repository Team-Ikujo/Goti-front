import { useQuery } from '@tanstack/react-query';

import {
   fetchResaleHistoryGraph,
   fetchMarketResaleListings,
   type ResaleListingItem as ApiResaleListingItem,
} from '@/entities/resale/api/resaleApi';
import type { SeatItem, ZoneItem } from './types';
import {
   buildResellZoneInsightsFromApi,
   type ResellListingItem,
} from './resellData';
import { isPurchasableResaleListing, matchesResaleListingToZone } from './resellMatching';
import { getCompletedResalePurchaseLookup } from '@/shared/lib/paymentCompleteStorage';
import { isResaleBookingMockEnabled, isResaleDemoEnabled } from '@/shared/config/runtime';
import { ensureDemoListingsForZone } from '@/shared/lib/demo/resaleDemo';

const sortListings = (left: ApiResaleListingItem, right: ApiResaleListingItem) => {
   const leftTime = new Date(left.listedAt).getTime();
   const rightTime = new Date(right.listedAt).getTime();

   if (leftTime !== rightTime) {
      return rightTime - leftTime;
   }

   return left.listingPrice - right.listingPrice;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSeatLabel = (zone: ZoneItem, seatInfo: string) => {
   const zonePrefixPattern = new RegExp(`^${escapeRegExp(zone.name)}\\s+`, 'i');

   return seatInfo.replace(zonePrefixPattern, '').trim();
};

const toResellListingItem = (zone: ZoneItem, listing: ApiResaleListingItem): ResellListingItem => ({
   listingId: listing.listingId,
   sellerId: listing.sellerId,
   seatId: listing.seatId,
   seatInfo: listing.seatInfo,
   seatLabel: buildSeatLabel(zone, listing.seatInfo),
   listingPrice: listing.listingPrice,
   totalAmount: listing.listingPrice + 2000,
   totalBuyerFee: 2000,
   totalSellerFee: Math.max(1000, Math.round(listing.listingPrice * 0.05 / 1000) * 1000),
   settlementAmount: Math.max(
      0,
      listing.listingPrice - Math.max(1000, Math.round(listing.listingPrice * 0.05 / 1000) * 1000),
   ),
   listedAt: listing.listedAt,
   isPurchasable: listing.isPurchasable ?? true,
});

export const useResellZoneInsights = ({
   enabled,
   gameId,
   zone,
   seats,
}: {
   enabled: boolean;
   gameId?: string;
   zone: ZoneItem;
   seats: SeatItem[];
}) => {
   const primaryGradeId =
      zone.gradeIds?.[0] ??
      (isResaleDemoEnabled || isResaleBookingMockEnabled ? `demo-grade-${zone.id}` : undefined);
   const seatIdentifierSet = new Set(seats.flatMap((seat) => [seat.id, seat.apiSeatId]));

   return useQuery({
      queryKey: ['resell-zone-insights', gameId, zone.id, primaryGradeId, [...seatIdentifierSet].sort()],
      enabled: enabled && Boolean(gameId),
      queryFn: async () => {
         if (!gameId) {
            return null;
         }

         const [listings, minuteGraph, dayGraph] = await Promise.all([
            isResaleDemoEnabled || isResaleBookingMockEnabled
               ? Promise.resolve(
                    ensureDemoListingsForZone({
                       gameId,
                       zone,
                       seats,
                    }),
                 )
               : fetchMarketResaleListings(),
            primaryGradeId ? fetchResaleHistoryGraph(gameId, primaryGradeId, 'HOUR') : Promise.resolve([]),
            primaryGradeId ? fetchResaleHistoryGraph(gameId, primaryGradeId, 'DAY') : Promise.resolve([]),
         ]);
         const completedResaleLookup = getCompletedResalePurchaseLookup();

         const filteredListings = listings
            .filter(
               (listing) =>
                  !completedResaleLookup.listingIds.has(listing.listingId) &&
                  !completedResaleLookup.seatInfos.has(listing.seatInfo) &&
                  isPurchasableResaleListing(listing, gameId) &&
                  matchesResaleListingToZone({ zone, listing }),
            )
            .sort(sortListings)
            .map((listing) => toResellListingItem(zone, listing));

         return buildResellZoneInsightsFromApi({
            zone,
            listings: filteredListings,
            minuteGraph,
            dayGraph,
         });
      },
      placeholderData: previousData => previousData,
   });
};
