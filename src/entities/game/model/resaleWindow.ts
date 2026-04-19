// 리셀 창 규칙 단일 소스:
//  - 리셀 오픈: 정식 예매 오픈 시각 + 2시간
//  - 리셀 종료: 경기 시작 시각 - 2시간
// 경계값이 없으면 해당 경계는 체크하지 않는다 (서버 스케줄 데이터 누락 fallback).
const RESELL_OPEN_OFFSET_MS = 2 * 60 * 60 * 1000;
const RESELL_CLOSE_BEFORE_GAME_MS = 2 * 60 * 60 * 1000;

export const getResaleOpenAtMs = (ticketingOpenedAtMs: number | undefined): number | undefined =>
  ticketingOpenedAtMs === undefined ? undefined : ticketingOpenedAtMs + RESELL_OPEN_OFFSET_MS;

export const getResaleCloseAtMs = (gameStartAtMs: number | undefined): number | undefined =>
  gameStartAtMs === undefined ? undefined : gameStartAtMs - RESELL_CLOSE_BEFORE_GAME_MS;

export type ResaleWindowState = 'before-open' | 'open' | 'closed';

// 창 경계가 하나라도 있으면 해당 경계 기준으로 판단한다.
// 양쪽 모두 없으면 'open' 으로 간주해 서버 상태를 그대로 따르게 한다.
export const getResaleWindowState = (
  ticketingOpenedAtMs: number | undefined,
  gameStartAtMs: number | undefined,
  now: number = Date.now(),
): ResaleWindowState => {
  const openAt = getResaleOpenAtMs(ticketingOpenedAtMs);
  const closeAt = getResaleCloseAtMs(gameStartAtMs);

  if (openAt !== undefined && now < openAt) {
    return 'before-open';
  }

  if (closeAt !== undefined && now >= closeAt) {
    return 'closed';
  }

  return 'open';
};

export const isResaleWindowOpen = (
  ticketingOpenedAtMs: number | undefined,
  gameStartAtMs: number | undefined,
  now: number = Date.now(),
): boolean => getResaleWindowState(ticketingOpenedAtMs, gameStartAtMs, now) === 'open';
