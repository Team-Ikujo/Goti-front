import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';

export type FetchGameSchedulesParams = {
  teamId?: string;
  year?: number;
  month?: number;
  week?: number;
  today?: boolean;
};

export type GameScheduleResponse = {
  gameId: string;
  startAt: string;
  leagueType: string;
  homeTeamId: string;
  awayTeamId: string;
  stadiumId: string;
  gameStatus: string;
  homeTeamScore: number;
  awayTeamScore: number;
  gameResult: string;
  ticketingStatus: string;
  ticketingOpenedAt?: string;
  ticketingEndAt?: string;
  homeTeamCode?: string;
  awayTeamCode?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  stadiumName?: string;
};

export const fetchGameSchedules = async (params: FetchGameSchedulesParams = {}) => {
  const response = await apiClient.get<ApiEnvelope<GameScheduleResponse[]>>('/api/v1/games/schedules', {
    params: {
      teamId: params.teamId,
      year: params.year,
      month: params.month,
      week: params.week,
      today: params.today,
    },
  });

  return response.data.data;
};
