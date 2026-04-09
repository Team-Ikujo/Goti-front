export type GameStatus = '경기중' | '예정' | '종료' | '취소';
export type TicketStatus = '예매하기' | '매진' | '판매예정';
export type ReselStatus = '리셀예매' | '리셀매진' | '리셀예정';

export type GameRow = {
   gameId?: string;
   homeTeamId?: string;
   awayTeamId?: string;
   serverHomeTeamId?: string;
   stadiumId?: string;
   leagueType?: import('@/shared/types/game').ApiLeagueType;
   queueTokenJti?: string;
   rawDate?: string; // YYYY-MM-DD — 시간 기반 상태 전환용
   ticketingOpenedAt?: string;
   ticketingEndAt?: string;
   ticketingOpenedAtMs?: number;
   ticketingEndAtMs?: number;
   resellOpenedAtMs?: number;
   remainingSeatCount: number;
   time: string;
   venue: string;
   away: string;
   home: string;
   score: string | null;
   status: GameStatus;
   ticket: TicketStatus;
   resell: ReselStatus;
   ticketInfo?: string;
   reselInfo?: string;
};

export type DaySchedule = {
   year: number;
   date: string;
   isToday?: boolean;
   games: GameRow[];
};
