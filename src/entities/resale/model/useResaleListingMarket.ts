import { useQuery } from '@tanstack/react-query';

import { fetchResaleListings } from '@/entities/resale/api/resaleApi';

type ResaleGameMarketSnapshot = {
   count: number;
   minPrice: number;
   maxPrice: number;
};

export const useResaleListingMarket = (gameIds: string[]) => {
   const normalizedGameIds = [...new Set(gameIds.filter(Boolean))].sort();

   return useQuery({
      queryKey: ['resales', 'listing-market', normalizedGameIds],
      enabled: normalizedGameIds.length > 0,
      queryFn: async () => {
         const listings = await fetchResaleListings();
         const gameIdSet = new Set(normalizedGameIds);
         const marketByGameId = new Map<string, ResaleGameMarketSnapshot>();

         listings.forEach((listing) => {
            if (
               !gameIdSet.has(listing.gameId) ||
               listing.listingStatus !== 'LISTING' ||
               listing.availableStatus !== 'ENABLED' ||
               !listing.isPurchasable
            ) {
               return;
            }

            const current = marketByGameId.get(listing.gameId);

            if (!current) {
               marketByGameId.set(listing.gameId, {
                  count: 1,
                  minPrice: listing.listingPrice,
                  maxPrice: listing.listingPrice,
               });
               return;
            }

            current.count += 1;
            current.minPrice = Math.min(current.minPrice, listing.listingPrice);
            current.maxPrice = Math.max(current.maxPrice, listing.listingPrice);
         });

         return marketByGameId;
      },
      placeholderData: previousData => previousData,
   });
};
