const MOCK_STADIUM_IDS_BY_TEAM_ID: Record<string, string> = {
   kia: 'stadium-kia-champions-field',
   samsung: 'stadium-samsung-lions-park',
   lg: 'stadium-jamsil-baseball',
   doosan: 'stadium-jamsil-baseball',
   lotte: 'stadium-sajik-baseball',
   hanwha: 'stadium-daejeon-baseball',
   nc: 'stadium-changwon-nc-park',
   kt: 'stadium-kt-wiz-park',
   kiwoom: 'stadium-gocheok-skydome',
   ssg: 'stadium-incheon-landers-field',
};

export const resolveMockStadiumId = (teamId?: string) => {
   if (!teamId) {
      return undefined;
   }

   return MOCK_STADIUM_IDS_BY_TEAM_ID[teamId];
};

export const buildMockQueueTokenJti = (gameId?: string) => {
   return gameId ? `queue-token-${gameId}` : undefined;
};
