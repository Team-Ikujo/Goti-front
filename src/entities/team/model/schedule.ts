export type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  venue: string;
  weeklyVolume?: number; // 주간 판매량/거래량 (인기 경기 정렬용)
};

// 목업 기준 오늘 날짜 (단일 소스) — 2026-07-03은 실제로 금요일
export const MOCK_TODAY = '2026-07-03';

export const schedule: Match[] = [
  // ── 2025년 7월 목업 일정 ──────────────────────────────────────
  // 7/1 (수) — 이미 종료된 경기
  { id: 'j01', homeTeamId: 'lg',      awayTeamId: 'kia',    date: '2026-07-01', time: '18:30', venue: '잠실 야구장' },

  // 7/3 (금) — 오늘 (MOCK_TODAY)
  { id: 'j02', homeTeamId: 'lg',      awayTeamId: 'kia',    date: '2026-07-03', time: '18:30', venue: '잠실 야구장' },
  { id: 'j03', homeTeamId: 'samsung', awayTeamId: 'doosan', date: '2026-07-03', time: '18:30', venue: '대구 삼성라이온즈파크', weeklyVolume: 8200 },

  // 7/4 (토)
  { id: 'j04', homeTeamId: 'lg',      awayTeamId: 'kia',    date: '2026-07-04', time: '14:00', venue: '잠실 야구장',            weeklyVolume: 18500 },
  { id: 'j05', homeTeamId: 'samsung', awayTeamId: 'doosan', date: '2026-07-04', time: '14:00', venue: '대구 삼성라이온즈파크',  weeklyVolume: 9800  },
  { id: 'j06', homeTeamId: 'lotte',   awayTeamId: 'hanwha', date: '2026-07-04', time: '14:00', venue: '사직 야구장',            weeklyVolume: 7300  },
  { id: 'j07', homeTeamId: 'nc',      awayTeamId: 'kt',     date: '2026-07-04', time: '14:00', venue: '창원 NC파크',            weeklyVolume: 5100  },
  { id: 'j08', homeTeamId: 'kiwoom',  awayTeamId: 'ssg',    date: '2026-07-04', time: '14:00', venue: '고척 스카이돔',          weeklyVolume: 4600  },

  // 7/5 (일)
  { id: 'j09', homeTeamId: 'lg',      awayTeamId: 'kia',    date: '2026-07-05', time: '17:00', venue: '잠실 야구장',            weeklyVolume: 14200 },
  { id: 'j10', homeTeamId: 'samsung', awayTeamId: 'doosan', date: '2026-07-05', time: '17:00', venue: '대구 삼성라이온즈파크',  weeklyVolume: 6400  },
  { id: 'j11', homeTeamId: 'lotte',   awayTeamId: 'hanwha', date: '2026-07-05', time: '17:00', venue: '사직 야구장',            weeklyVolume: 5900  },

  // ── 2026 KBO 시즌 일정 (개막: 2026-03-21) ────────────────────
  // 개막 시리즈 (3/21 ~ 3/23)
  { id: 'm01', homeTeamId: 'kia',     awayTeamId: 'hanwha',  date: '2026-03-21', time: '17:00', venue: '광주 기아 챔피언스 필드' },
  { id: 'm02', homeTeamId: 'samsung', awayTeamId: 'lg',      date: '2026-03-21', time: '17:00', venue: '대구 삼성라이온즈파크' },
  { id: 'm03', homeTeamId: 'lotte',   awayTeamId: 'doosan',  date: '2026-03-21', time: '17:00', venue: '사직 야구장' },
  { id: 'm04', homeTeamId: 'kt',      awayTeamId: 'ssg',     date: '2026-03-21', time: '17:00', venue: '수원 KT위즈파크' },
  { id: 'm05', homeTeamId: 'nc',      awayTeamId: 'kiwoom',  date: '2026-03-21', time: '17:00', venue: '창원 NC파크' },

  { id: 'm06', homeTeamId: 'kia',     awayTeamId: 'hanwha',  date: '2026-03-22', time: '14:00', venue: '광주 기아 챔피언스 필드' },
  { id: 'm07', homeTeamId: 'samsung', awayTeamId: 'lg',      date: '2026-03-22', time: '14:00', venue: '대구 삼성라이온즈파크' },
  { id: 'm08', homeTeamId: 'kia',     awayTeamId: 'hanwha',  date: '2026-03-23', time: '14:00', venue: '광주 기아 챔피언스 필드' },
  { id: 'm09', homeTeamId: 'samsung', awayTeamId: 'lg',      date: '2026-03-23', time: '14:00', venue: '대구 삼성라이온즈파크' },

  // 2주차 (3/25 ~ 3/27)
  { id: 'm10', homeTeamId: 'doosan',  awayTeamId: 'kia',     date: '2026-03-25', time: '18:00', venue: '잠실 야구장' },
  { id: 'm11', homeTeamId: 'kiwoom',  awayTeamId: 'samsung', date: '2026-03-25', time: '18:00', venue: '고척 스카이돔' },
  { id: 'm12', homeTeamId: 'doosan',  awayTeamId: 'kia',     date: '2026-03-26', time: '18:00', venue: '잠실 야구장' },
  { id: 'm13', homeTeamId: 'kiwoom',  awayTeamId: 'samsung', date: '2026-03-26', time: '18:00', venue: '고척 스카이돔' },
  { id: 'm14', homeTeamId: 'doosan',  awayTeamId: 'kia',     date: '2026-03-27', time: '18:00', venue: '잠실 야구장' },
  { id: 'm15', homeTeamId: 'kiwoom',  awayTeamId: 'samsung', date: '2026-03-27', time: '18:00', venue: '고척 스카이돔' },

  // 3주차 (3/28 ~ 3/29)
  { id: 'm16', homeTeamId: 'kia',     awayTeamId: 'nc',      date: '2026-03-28', time: '14:00', venue: '광주 기아 챔피언스 필드' },
  { id: 'm17', homeTeamId: 'samsung', awayTeamId: 'kt',      date: '2026-03-28', time: '14:00', venue: '대구 삼성라이온즈파크' },
];

/** 해당 팀의 오늘(MOCK_TODAY) 이후 가장 가까운 경기 */
export function getClosestMatch(teamId: string): Match | null {
  const today = new Date(MOCK_TODAY);
  today.setHours(0, 0, 0, 0);

  const upcoming = schedule
    .filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .filter(m => new Date(m.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return upcoming[0] ?? null;
}

/** D-Day 문자열 반환 (MOCK_TODAY 기준) */
export function getDDay(dateStr: string): string {
  const today = new Date(MOCK_TODAY);
  today.setHours(0, 0, 0, 0);
  const matchDate = new Date(dateStr);
  matchDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'D-DAY';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

/**
 * 인기 경기: MOCK_TODAY 이후 경기 중 주간 판매량/거래량 순 상위 N개
 * (오늘 경기는 진행중/종료 가능성으로 제외)
 */
export function getPopularMatches(limit = 5): Match[] {
  const today = new Date(MOCK_TODAY);
  today.setHours(0, 0, 0, 0);

  return schedule
    .filter(m => new Date(m.date) > today)
    .filter(m => m.weeklyVolume !== undefined)
    .sort((a, b) => (b.weeklyVolume ?? 0) - (a.weeklyVolume ?? 0))
    .slice(0, limit);
}
