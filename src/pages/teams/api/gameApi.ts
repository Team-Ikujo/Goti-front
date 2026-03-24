import apiClient from '@/shared/api/client';
import type { GameScheduleResponse, GetGameSchedulesParams, SeatGradeResponse, SeatSectionResponse } from '@/shared/types/game';

export const gameApi = {
   // 경기 일정 조회 (GET /api/v1/games/schedules)
   getGameSchedules: async (params: GetGameSchedulesParams): Promise<GameScheduleResponse[]> => {
      // boolean false가 axios 직렬화에서 누락되는 케이스를 방지하기 위해 직접 직렬화
      const query = Object.entries(params)
         .filter(([, v]) => v !== undefined && v !== null)
         .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
         .join('&');

      const response = await apiClient.get(`/api/v1/games/schedules?${query}`);
      return response.data.data ?? [];
   },

   // 좌석 등급 조회는 최신 스펙상 gameId가 필요하므로 팀 상세 탭에서는 실데이터 조회를 보류한다.
   getSeatGrades: async (_stadiumId: string): Promise<SeatGradeResponse[]> => {
      return [];
   },

   // 좌석 구역 조회 (GET /api/v1/stadium-seats/stadiums/{stadiumId}/seat-sections)
   getSeatSections: async (stadiumId: string): Promise<SeatSectionResponse[]> => {
      const response = await apiClient.get(`/api/v1/stadium-seats/stadiums/${stadiumId}/seat-sections`);
      return response.data.data ?? [];
   },
};
