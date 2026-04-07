import type { ApiEnvelope } from '@/features/auth/api/types';
import apiClient from '@/shared/api/client';

type OwnedTicketsCountResponse = {
   ownedTicketCount: number;
};

export const fetchOwnedTicketsCount = async (gameId: string) => {
   const response = await apiClient.get<ApiEnvelope<OwnedTicketsCountResponse>>('/api/v1/tickets/resales/count', {
      params: {
         gameId,
      },
   });

   return response.data.data?.ownedTicketCount ?? 0;
};
