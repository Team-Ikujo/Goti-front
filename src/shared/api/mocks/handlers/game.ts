import { http, HttpResponse } from 'msw';
import { teams } from '@/entities/team/model/teams';

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
  gameResult: 'WIN' | 'LOSE' | 'DRAW';
  ticketingStatus: 'AVAILABLE' | 'SCHEDULED' | 'TERMINATED';
  ticketingOpenedAt: string;
  ticketingEndAt: string;
  remainingSeatCount: number;
  homeTeamDisplayName: string;
  awayTeamDisplayName: string;
  stadiumLocation: string;
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
    homeTeamId: 'e5f58f8c-fcde-4017-8033-d8deb34fd4a2',
    awayTeamId: 'f44d1e89-e2fe-40e7-a587-1157d7a9c80a',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'FINISHED',
    homeTeamScore: 6,
    awayTeamScore: 2,
    gameResult: 'WIN',
    ticketingStatus: 'TERMINATED',
    ticketingOpenedAt: '2026-03-11 11:00',
    ticketingEndAt: '2026-03-18 14:30',
    remainingSeatCount: 0,
    homeTeamDisplayName: 'KIA',
    awayTeamDisplayName: 'LG',
    stadiumLocation: '광주',
  },
  {
    gameId: 'game-samsung-home-today',
    startAt: formatLocalDateTime(0, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: '412cfc77-2c5d-4583-8e79-968339223864',
    awayTeamId: 'd64b4220-6479-4e77-986a-f52447a433a6',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(-7, 11, 0),
    ticketingEndAt: formatLocalDateTime(0, 14, 30),
    remainingSeatCount: 12543,
    homeTeamDisplayName: '삼성',
    awayTeamDisplayName: 'NC',
    stadiumLocation: '대구',
  },
  {
    gameId: 'game-kia-home-tomorrow',
    startAt: formatLocalDateTime(1, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: 'e5f58f8c-fcde-4017-8033-d8deb34fd4a2',
    awayTeamId: '520af775-e84b-4112-aa02-18ed1a6c8458',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(-6, 11, 0),
    ticketingEndAt: formatLocalDateTime(1, 14, 30),
    remainingSeatCount: 9632,
    homeTeamDisplayName: 'KIA',
    awayTeamDisplayName: 'SSG',
    stadiumLocation: '광주',
  },
  {
    gameId: 'game-samsung-home-this-weekend',
    startAt: formatLocalDateTime(3, 14, 0),
    leagueType: 'REGULAR',
    homeTeamId: '412cfc77-2c5d-4583-8e79-968339223864',
    awayTeamId: '1e4022c6-3887-44f6-b510-d98aad5a4192',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(-4, 11, 0),
    ticketingEndAt: formatLocalDateTime(3, 10, 0),
    remainingSeatCount: 10124,
    homeTeamDisplayName: '삼성',
    awayTeamDisplayName: '키움',
    stadiumLocation: '대구',
  },
  {
    gameId: 'game-kia-home-next-week',
    startAt: formatLocalDateTime(8, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: 'e5f58f8c-fcde-4017-8033-d8deb34fd4a2',
    awayTeamId: 'd64b4220-6479-4e77-986a-f52447a433a6',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(1, 11, 0),
    ticketingEndAt: formatLocalDateTime(8, 14, 30),
    remainingSeatCount: 8740,
    homeTeamDisplayName: 'KIA',
    awayTeamDisplayName: 'NC',
    stadiumLocation: '광주',
  },
  {
    gameId: 'game-samsung-home-next-weekend',
    startAt: formatLocalDateTime(9, 17, 0),
    leagueType: 'REGULAR',
    homeTeamId: '412cfc77-2c5d-4583-8e79-968339223864',
    awayTeamId: 'f44d1e89-e2fe-40e7-a587-1157d7a9c80a',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'SCHEDULED',
    ticketingOpenedAt: formatLocalDateTime(5, 11, 0),
    ticketingEndAt: formatLocalDateTime(9, 13, 0),
    remainingSeatCount: 11032,
    homeTeamDisplayName: '삼성',
    awayTeamDisplayName: 'LG',
    stadiumLocation: '대구',
  },
  {
    gameId: 'game-kia-home-two-weeks',
    startAt: formatLocalDateTime(14, 18, 30),
    leagueType: 'REGULAR',
    homeTeamId: 'e5f58f8c-fcde-4017-8033-d8deb34fd4a2',
    awayTeamId: '34159d27-2497-44d4-a4a2-c461dc3585c8',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: formatLocalDateTime(8, 11, 0),
    ticketingEndAt: formatLocalDateTime(14, 14, 30),
    remainingSeatCount: 11876,
    homeTeamDisplayName: 'KIA',
    awayTeamDisplayName: '두산',
    stadiumLocation: '광주',
  },
];

const matchesCalendarDate = (startAt: string, date: string) => startAt.slice(0, 10) === date;

/** 현재 시각 기준으로 경기 상태와 티켓팅 상태를 동적으로 계산 */
const resolveGameStatus = (game: MockGameSchedule): Pick<MockGameSchedule, 'gameStatus' | 'ticketingStatus'> => {
  const now = Date.now();
  const startMs = new Date(game.startAt.replace(' ', 'T')).getTime();
  const GAME_DURATION_MS = 3 * 60 * 60 * 1000;   // 경기 지속 시간: 3시간
  const TICKETING_CLOSE_MS = 4 * 60 * 60 * 1000; // 경기 시작 4시간 전 티켓팅 마감

  if (now >= startMs + GAME_DURATION_MS) {
    return { gameStatus: 'FINISHED', ticketingStatus: 'TERMINATED' };
  }
  if (now >= startMs) {
    return { gameStatus: 'IN_PROGRESS', ticketingStatus: 'TERMINATED' };
  }
  if (now >= startMs - TICKETING_CLOSE_MS) {
    return { gameStatus: 'SCHEDULED', ticketingStatus: 'TERMINATED' };
  }
  return { gameStatus: game.gameStatus, ticketingStatus: game.ticketingStatus };
};

export const gameHandlers = [
  http.get('/api/v1/games/schedules', async ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const teamId = searchParams.get('teamId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const today = searchParams.get('today');

    const filteredGames = mockGameSchedules
      .filter((game) => {
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
      })
      .map((game) => ({ ...game, ...resolveGameStatus(game) }));

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: filteredGames,
    });
  }),

  http.get('/api/v1/baseball-teams/:teamId', async ({ params }) => {
    const team = teams.find((item) => item.serverTeamId === String(params.teamId));

    if (!team?.serverTeamId || !team.teamCode) {
      return HttpResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'team not found',
          data: null,
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        id: team.serverTeamId,
        teamCode: team.teamCode,
        teamName: team.name,
        homeGround: team.stadiumName,
      },
    });
  }),

];
