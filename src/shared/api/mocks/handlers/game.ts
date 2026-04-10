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
const MOCK_TODAY = '2026-04-09';

export const mockGameSchedules: MockGameSchedule[] = [
  {
    gameId: 'game-kia-home-yesterday',
    startAt: '2026-04-08 18:30',
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
    startAt: '2026-04-09 18:30',
    leagueType: 'REGULAR',
    homeTeamId: '412cfc77-2c5d-4583-8e79-968339223864',
    awayTeamId: 'd64b4220-6479-4e77-986a-f52447a433a6',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'TERMINATED',
    ticketingOpenedAt: '2026-04-02 11:00',
    ticketingEndAt: '2026-04-09 14:30',
    remainingSeatCount: 12543,
    homeTeamDisplayName: '삼성',
    awayTeamDisplayName: 'NC',
    stadiumLocation: '대구',
  },
  {
    gameId: 'game-kia-home-tomorrow',
    startAt: '2026-04-10 18:30',
    leagueType: 'REGULAR',
    homeTeamId: 'e5f58f8c-fcde-4017-8033-d8deb34fd4a2',
    awayTeamId: '520af775-e84b-4112-aa02-18ed1a6c8458',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: '2026-04-03 11:00',
    ticketingEndAt: '2026-04-10 14:30',
    remainingSeatCount: 9632,
    homeTeamDisplayName: 'KIA',
    awayTeamDisplayName: 'SSG',
    stadiumLocation: '광주',
  },
  {
    gameId: 'game-samsung-home-this-weekend',
    startAt: '2026-04-12 14:00',
    leagueType: 'REGULAR',
    homeTeamId: '412cfc77-2c5d-4583-8e79-968339223864',
    awayTeamId: '1e4022c6-3887-44f6-b510-d98aad5a4192',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: '2026-04-05 11:00',
    ticketingEndAt: '2026-04-12 10:00',
    remainingSeatCount: 10124,
    homeTeamDisplayName: '삼성',
    awayTeamDisplayName: '키움',
    stadiumLocation: '대구',
  },
  {
    gameId: 'game-kia-home-next-week',
    startAt: '2026-04-17 18:30',
    leagueType: 'REGULAR',
    homeTeamId: 'e5f58f8c-fcde-4017-8033-d8deb34fd4a2',
    awayTeamId: 'd64b4220-6479-4e77-986a-f52447a433a6',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: '2026-04-10 11:00',
    ticketingEndAt: '2026-04-17 14:30',
    remainingSeatCount: 8740,
    homeTeamDisplayName: 'KIA',
    awayTeamDisplayName: 'NC',
    stadiumLocation: '광주',
  },
  {
    gameId: 'game-samsung-home-next-weekend',
    startAt: '2026-04-18 17:00',
    leagueType: 'REGULAR',
    homeTeamId: '412cfc77-2c5d-4583-8e79-968339223864',
    awayTeamId: 'f44d1e89-e2fe-40e7-a587-1157d7a9c80a',
    stadiumId: 'stadium-samsung-lions-park',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'SCHEDULED',
    ticketingOpenedAt: '2026-04-14 11:00',
    ticketingEndAt: '2026-04-18 13:00',
    remainingSeatCount: 11032,
    homeTeamDisplayName: '삼성',
    awayTeamDisplayName: 'LG',
    stadiumLocation: '대구',
  },
  {
    gameId: 'game-kia-home-two-weeks',
    startAt: '2026-04-23 18:30',
    leagueType: 'REGULAR',
    homeTeamId: 'e5f58f8c-fcde-4017-8033-d8deb34fd4a2',
    awayTeamId: '34159d27-2497-44d4-a4a2-c461dc3585c8',
    stadiumId: 'stadium-kia-champions-field',
    gameStatus: 'SCHEDULED',
    homeTeamScore: 0,
    awayTeamScore: 0,
    gameResult: 'DRAW',
    ticketingStatus: 'AVAILABLE',
    ticketingOpenedAt: '2026-04-17 11:00',
    ticketingEndAt: '2026-04-23 14:30',
    remainingSeatCount: 11876,
    homeTeamDisplayName: 'KIA',
    awayTeamDisplayName: '두산',
    stadiumLocation: '광주',
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
      });

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
