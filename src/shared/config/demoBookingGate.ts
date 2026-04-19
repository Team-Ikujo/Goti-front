// 시연 기간 동안 예매/리셀을 허용할 홈팀 프론트엔드 ID.
// entities/game/model/schedule.ts 의 TEAM_REFERENCES.frontendId 와 일치해야 한다.
const ALLOWED_HOME_TEAM_IDS = new Set(['kia', 'samsung']);

// 시연 종료 시각 (KST). 이 시각 이후 모든 예매/리셀 버튼이 비활성화된다.
const DEMO_BOOKING_DEADLINE_MS = new Date('2026-04-26T00:00:00+09:00').getTime();

export const isDemoBookingAllowed = (
   homeTeamId: string | undefined,
   now: number = Date.now(),
): boolean => {
   if (now >= DEMO_BOOKING_DEADLINE_MS) {
      return false;
   }

   if (!homeTeamId) {
      return false;
   }

   return ALLOWED_HOME_TEAM_IDS.has(homeTeamId);
};

export const isDemoWindowOpen = (now: number = Date.now()): boolean => now < DEMO_BOOKING_DEADLINE_MS;
