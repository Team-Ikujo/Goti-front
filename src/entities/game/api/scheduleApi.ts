import apiClient from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import type { GameScheduleResponse, GetGameSchedulesParams } from '@/shared/types/game';

export type FetchGameSchedulesParams = GetGameSchedulesParams;

export type BaseballTeamDetailResponse = {
  id: string;
  teamCode: string;
  teamName: string;
  teamNameEn?: string;
  homeGround?: string;
};

const baseballTeamCache = new Map<string, BaseballTeamDetailResponse>();
const baseballTeamRequestCache = new Map<string, Promise<BaseballTeamDetailResponse>>();

export const fetchGameSchedules = async (params: FetchGameSchedulesParams = {}) => {
  const response = await apiClient.get<ApiEnvelope<GameScheduleResponse[]>>('/api/v1/games/schedules', {
    params: {
      teamId: params.teamId,
      year: params.year,
      month: params.month,
      week: params.week,
      today: params.today ?? false,
    },
  });

  return response.data.data;
};

export const fetchBaseballTeamDetail = async (teamId: string) => {
  const cached = baseballTeamCache.get(teamId);

  if (cached) {
    return cached;
  }

  const pending = baseballTeamRequestCache.get(teamId);

  if (pending) {
    return pending;
  }

  const request = apiClient
    .get<ApiEnvelope<BaseballTeamDetailResponse>>(`/api/v1/baseball-teams/${teamId}`)
    .then((response) => {
      const detail = response.data.data;
      baseballTeamCache.set(teamId, detail);
      baseballTeamRequestCache.delete(teamId);
      return detail;
    })
    .catch((error) => {
      baseballTeamRequestCache.delete(teamId);
      throw error;
    });

  baseballTeamRequestCache.set(teamId, request);
  return request;
};

export const fetchBaseballTeamDetails = async (teamIds: string[]) => {
  const uniqueTeamIds = [...new Set(teamIds.filter(Boolean))];

  if (uniqueTeamIds.length === 0) {
    return new Map<string, BaseballTeamDetailResponse>();
  }

  const details = await Promise.all(
    uniqueTeamIds.map(async (teamId) => [teamId, await fetchBaseballTeamDetail(teamId)] as const),
  );

  return new Map<string, BaseballTeamDetailResponse>(details);
};
