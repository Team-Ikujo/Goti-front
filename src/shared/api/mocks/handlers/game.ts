import { http, HttpResponse } from 'msw';

type MockGameSchedule = {
  gameId: string;
  startAt: string;
  leagueType: 'REGULAR';
  homeTeamId: string;
  awayTeamId: string;
  stadiumId: string;
  gameStatus: 'SCHEDULED' | 'FINISHED' | 'IN_PROGRESS';
  homeTeamScore: number;
  awayTeamScore: number;
  gameResult: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW';
  ticketingStatus: 'AVAILABLE' | 'SCHEDULED' | 'CLOSED';
  ticketingOpenedAt: string;
};

const formatLocalDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatLocalDateTime = (offsetDays: number, hour: number, minute: number) => {
  const value = new Date();
  value.setDate(value.getDate() + offsetDays);
  value.setHours(hour, minute, 0, 0);

  return `${formatLocalDate(value)} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const MOCK_TODAY = formatLocalDate(new Date());

export const mockGameSchedules: MockGameSchedule[] = [
  {
    gameId: 'game-kia-home-yesterday',
    startAt: formatLocalDateTime(-1, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: 'team-kia',
    awayTeamId: 'team-lg',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'FINISHED',
    homeTeamScore: 6,
    awayTeamScore: 2,
    gameResult: 'HOME_WIN',
    ticketingStatus: 'CLOSED',
    ticketingOpenedAt: '2026-03-11 11:00',
  },
  {
    gameId: 'game-samsung-home-today',
    startAt: formatLocalDateTime(0, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: 'team-samsung',
    awayTeamId: 'team-doosan',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(-7, 11, 0),
  },
  {
    gameId: 'game-kia-home-tomorrow',
    startAt: formatLocalDateTime(1, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: 'team-kia',
    awayTeamId: 'team-kiwoom',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(-6, 11, 0),
  },
  {
    gameId: 'game-samsung-home-this-weekend',
    startAt: formatLocalDateTime(3, 14, 0),
    leagueType: 'REGULAR',
    homeTeamId: 'team-samsung',
    awayTeamId: 'team-kt',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(-4, 11, 0),
  },
  {
    gameId: 'game-kia-home-next-week',
    startAt: formatLocalDateTime(8, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: 'team-kia',
    awayTeamId: 'team-doosan',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(1, 11, 0),
  },
  {
    gameId: 'game-samsung-home-next-weekend',
    startAt: formatLocalDateTime(9, 17, 0),
    leagueType: 'REGULAR',
    homeTeamId: 'team-samsung',
    awayTeamId: 'team-lg',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'SCHEDULED',
    ticketingOpenedAt: formatLocalDateTime(5, 11, 0),
  },
  {
    gameId: 'game-kia-home-two-weeks',
    startAt: formatLocalDateTime(14, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: 'team-kia',
    awayTeamId: 'team-hanwha',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(8, 11, 0),
  },
];

const matchesCalendarDate = (startAt: string, date: string) => startAt.slice(0, 10) === date;

export const gameHandlers = [
  http.get('/api/v1/games/schedules', async ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const teamId = searchParams.get('teamId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const today = searchParams.get('today');

    const filteredGames = mockGameSchedules.filter((game) => {
      if (teamId && game.homeTeamId !== teamId && game.awayTeamId !== teamId) {
        return false;
      }

      if (year || month) {
        const [gameYear, gameMonth] = game.startAt.split(' ')[0]?.split('-') ?? [];

        if (year && gameYear !== year) {
          return false;
        }

        if (month && gameMonth !== month.padStart(2, '0')) {
          return false;
        }
      }

      if (today === 'true' && !matchesCalendarDate(game.startAt, MOCK_TODAY)) {
        return false;
      }

      return true;
    });

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: filteredGames,
    });
  }),
];
