import { useQuery } from '@tanstack/react-query';

import { fetchResaleGameStatusesByGames } from '@/entities/resale/api/resaleApi';

export const useResaleGameStatuses = (gameIds: string[], enabled = true) => {
   const normalizedGameIds = [...new Set(gameIds.filter(Boolean))].sort();

   return useQuery({
      queryKey: ['resales', 'game-statuses', normalizedGameIds],
      queryFn: () => fetchResaleGameStatusesByGames(normalizedGameIds),
      enabled: enabled && normalizedGameIds.length > 0,
      placeholderData: previousData => previousData,
   });
};
