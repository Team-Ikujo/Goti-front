import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
   fetchResaleHistoryGraph,
   fetchResaleListings,
   type ResaleListingItem as ApiResaleListingItem,
} from '@/entities/resale/api/resaleApi';
import type { SeatItem, ZoneItem } from './types';
import {
   buildResellZoneInsightsFromApi,
   type ResellListingItem,
} from './resellData';

const sortListings = (left: ApiResaleListingItem, right: ApiResaleListingItem) => {
   const leftTime = new Date(left.listedAt).getTime();
   const rightTime = new Date(right.listedAt).getTime();

   if (leftTime !== rightTime) {
      return rightTime - leftTime;
   }

   return left.listingPrice - right.listingPrice;
};

const buildSeatLabel = (zone: ZoneItem, seatInfo: string) => {
   return seatInfo.includes(zone.sectionCode) ? seatInfo : `${zone.name} ${seatInfo}`.trim();
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
   settlementAmount: Math.max(0, listing.listingPrice - Math.max(1000, Math.round(listing.listingPrice * 0.05 / 1000) * 1000)),
   listedAt: listing.listedAt,
   isPurchasable: listing.isPurchasable,
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
   const seatIdSet = useMemo(() => new Set(seats.map((seat) => seat.id)), [seats]);
   const primaryGradeId = zone.gradeIds?.[0];

   return useQuery({
      queryKey: ['resell-zone-insights', gameId, zone.id, primaryGradeId, [...seatIdSet].sort()],
      enabled: enabled && Boolean(gameId),
      queryFn: async () => {
         if (!gameId) {
            return null;
         }

         const [listings, minuteGraph, dayGraph] = await Promise.all([
            fetchResaleListings(),
            primaryGradeId ? fetchResaleHistoryGraph(gameId, primaryGradeId, 'HOUR') : Promise.resolve([]),
            primaryGradeId ? fetchResaleHistoryGraph(gameId, primaryGradeId, 'DAY') : Promise.resolve([]),
         ]);

         const filteredListings = listings
            .filter((listing) =>
               listing.gameId === gameId &&
               seatIdSet.has(listing.seatId) &&
               listing.listingStatus === 'LISTING' &&
               listing.availableStatus === 'ENABLED' &&
               listing.isPurchasable,
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
