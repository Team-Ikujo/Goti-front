import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export type SeatGradeResponse = {
   seatGradeId: string;
   stadiumId: string;
   name: string;
   displayColorHex: string;
   availableSeatCount: number;
};

type SeatGradeSearchResultResponse = {
   sessionId: string;
   sessionExpiresAt: string;
   seatGrades: SeatGradeResponse[];
};

export const fetchSeatGrades = async ({
   gameId,
   forceNewSession,
}: {
   gameId: string;
   forceNewSession?: boolean;
}) => {
   const response = await apiClient.get<ApiEnvelope<SeatGradeSearchResultResponse>>(
      `/api/v1/stadium-seats/games/${gameId}/seat-grades`,
      {
         params: forceNewSession ? { forceNewSession: true } : undefined,
      },
   );

   return response.data.data?.seatGrades ?? [];
};
