import { useQuery } from '@tanstack/react-query';

import { fetchResaleListingCountsByGames } from '@/entities/resale/api/resaleApi';

export const useResaleGameCounts = (gameIds: string[]) => {
   const normalizedGameIds = [...new Set(gameIds.filter(Boolean))].sort();

   return useQuery({
      queryKey: ['resales', 'game-counts', normalizedGameIds],
      queryFn: () => fetchResaleListingCountsByGames(normalizedGameIds),
      enabled: normalizedGameIds.length > 0,
      placeholderData: previousData => previousData,
   });
};
