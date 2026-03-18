import type {
   AssignStadiumRequest,
   CreateBaseballTeamRequest,
   CreateBaseballTeamResponse,
   Stadium,
} from '@/shared/types/stadium';
import apiClient from '@/shared/api/client';

export const teamApi = {
   // 경기장 생성 (POST /api/v1/stadiums)
   createStadium: async (data: Stadium) => {
      const response = await apiClient.post('/api/v1/stadiums', data);
      return response.data;
   },

   // 야구팀 생성 (POST /api/v1/baseball-teams)
   createBaseballTeam: async (data: CreateBaseballTeamRequest): Promise<CreateBaseballTeamResponse> => {
      const response = await apiClient.post('/api/v1/baseball-teams', data);
      return response.data;
   },

   // 홈 경기장 할당 (POST /api/v1/baseball-teams/{teamId}/home-stadiums)
   assignHomeStadium: async (teamId: string, data: AssignStadiumRequest) => {
      const response = await apiClient.post(`/api/v1/baseball-teams/${teamId}/home-stadiums`, data);
      return response.data;
   },
};
