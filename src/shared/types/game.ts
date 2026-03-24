// GET /api/v1/games/schedules 응답 타입

export type ApiGameStatus =
   | 'SCHEDULED'
   | 'IN_PROGRESS'
   | 'SUSPENDED'
   | 'RAIN_DELAY'
   | 'RAIN_CANCELLED'
   | 'CANCELLED'
   | 'FINISHED';

export type ApiTicketingStatus =
   | 'SCHEDULED'
   | 'AVAILABLE'
   | 'EXHAUSTED'
   | 'TERMINATED'
   | 'CANCELED'
   | 'PAUSED';

export type ApiGameResult = 'NONE' | 'HOME_WIN' | 'AWAY_WIN' | 'DRAW' | 'CANCELLED';

export type ApiLeagueType = 'PRE_SEASON' | 'REGULAR' | 'POSTSEASON';

export interface GameScheduleResponse {
   gameId: string;
   startAt: string; // ISO 8601 date-time
   leagueType: ApiLeagueType;
   homeTeamId: string;
   awayTeamId: string;
   stadiumId: string;
   gameStatus: ApiGameStatus;
   homeTeamScore: number;
   awayTeamScore: number;
   gameResult: ApiGameResult;
   ticketingStatus: ApiTicketingStatus;
   ticketingOpenedAt: string;
}

export interface GetGameSchedulesParams {
   teamId?: string;
   year?: number;
   month?: number;
   week?: number;
   today?: boolean;
}

// GET /api/v1/stadium-seats/stadiums/{stadiumId}/games/{gameId}/seat-grades 응답 타입
export interface SeatGradeResponse {
   seatGradeId: string;
   stadiumId: string;
   name: string;
   displayColorHex: string;
}

// GET /api/v1/stadium-seats/stadiums/{stadiumId}/seat-sections 응답 타입
export interface SeatSectionResponse {
   sectionId: string;
   gradeId: string;
   stadiumId: string;
   sectionCode: string;
   capacity: number;
}
