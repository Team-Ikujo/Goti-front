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
  const sanitizedParams = Object.fromEntries(
    Object.entries({
      teamId: params.teamId,
      year: params.year,
      month: params.month,
      week: params.week,
      today: params.today,
    }).filter(([, value]) => value !== null && value !== undefined),
  );

  const response = await apiClient.get<ApiEnvelope<GameScheduleResponse[]>>('/api/v1/games/schedules', {
    params: sanitizedParams,
  });

  return response.data.data;
};
