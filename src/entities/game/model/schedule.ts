import { useQuery } from '@tanstack/react-query';

import { buildMockQueueTokenJti } from '@/shared/config/booking';
import type { ApiLeagueType } from '@/shared/types/game';
import {
  fetchBaseballTeamDetails,
  fetchGameSchedules,
  type FetchGameSchedulesParams,
  type GameScheduleResponse,
} from '@/entities/game/api/scheduleApi';
import { teams } from '@/entities/team/model/teams';
import type { DaySchedule, GameRow, GameStatus, ReselStatus, TicketStatus } from '@/pages/home/ui/game-schedule/types';

export type NormalizedScheduleGame = {
  id: string;
  serverHomeTeamId: string;
  serverAwayTeamId: string;
  leagueType: ApiLeagueType;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamFullName: string;
  awayTeamFullName: string;
  date: string;
  dateLabel: string;
  time: string;
  venue: string;
  stadiumId?: string;
  queueTokenJti?: string;
  score: string | null;
  status: GameStatus;
  ticket: TicketStatus;
  resell: ReselStatus;
  ticketInfo?: string;
  reselInfo?: string;
  isToday: boolean;
  ticketingOpenedAt?: string;
};

type TeamReference = {
  frontendId: string;
  serverTeamId?: string;
  teamCode: string;
  shortName: string;
  fullName: string;
  aliases: string[];
};

const TEAM_ALIASES_BY_ID: Partial<Record<string, string[]>> = {
  kia: ['teamkia', 'kiatigers', '기아', '기아타이거즈'],
  samsung: ['teamsamsung', '삼성', '삼성라이온즈', 'ss', 'samsunglions'],
  lg: ['teamlg', 'lgtwins', '엘지', '엘지트윈스', 'lg트윈스'],
  hanwha: ['teamhanwha', '한화', '한화이글스', 'hh', 'hanwhaeagles'],
  ssg: ['teamssg', 'ssglanders', '랜더스', 'ssg랜더스'],
  nc: ['teamnc', 'ncdinos', 'nc다이노스'],
  kt: ['teamkt', 'ktwiz', '케이티', '케이티위즈'],
  lotte: ['teamlotte', '롯데', '롯데자이언츠', 'lot', 'lottegiants'],
  doosan: ['teamdoosan', '두산', '두산베어스', 'do', 'doosanbears'],
  kiwoom: ['teamkiwoom', '키움', '키움히어로즈', 'kiw', 'kiwoomheroes'],
};

const TEAM_SHORT_NAME_BY_ID: Partial<Record<string, string>> = {
  kia: 'KIA',
  samsung: '삼성',
  lg: 'LG',
  hanwha: '한화',
  ssg: 'SSG',
  nc: 'NC',
  kt: 'KT',
  lotte: '롯데',
  doosan: '두산',
  kiwoom: '키움',
};

const TEAM_REFERENCES: TeamReference[] = teams
  .filter((team): team is typeof team & { teamCode: string } => Boolean(team.teamCode))
  .map((team) => ({
    frontendId: team.id,
    serverTeamId: team.serverTeamId,
    teamCode: team.teamCode,
    shortName: TEAM_SHORT_NAME_BY_ID[team.id] ?? team.name,
    fullName: team.name,
    aliases: [team.id, team.name, team.teamCode, ...(TEAM_ALIASES_BY_ID[team.id] ?? [])],
  }));

type StadiumReference = {
  displayName: string;
  aliases: string[];
};

const STADIUM_REFERENCES: Record<string, StadiumReference> = {
  'stadium-jamsil-baseball': {
    displayName: '잠실 야구장',
    aliases: ['잠실야구장'],
  },
  'stadium-samsung-lions-park': {
    displayName: '대구 삼성 라이온즈 파크',
    aliases: ['대구삼성라이온즈파크', '삼성라이온즈파크'],
  },
  'stadium-sajik-baseball': {
    displayName: '사직 야구장',
    aliases: ['사직야구장'],
  },
  'stadium-changwon-nc-park': {
    displayName: '창원 NC파크',
    aliases: ['창원nc파크', 'nc파크'],
  },
  'stadium-gocheok-skydome': {
    displayName: '고척 스카이돔',
    aliases: ['고척스카이돔'],
  },
  'stadium-kia-champions-field': {
    displayName: '기아 챔피언스필드',
    aliases: ['광주기아챔피언스필드', '기아챔피언스필드'],
  },
  'stadium-kt-wiz-park': {
    displayName: '수원 KT위즈파크',
    aliases: ['수원kt위즈파크', 'kt위즈파크'],
  },
  'stadium-daejeon-baseball': {
    displayName: '대전 한화생명 볼파크',
    aliases: ['대전한화생명볼파크'],
  },
  'stadium-incheon-landers-field': {
    displayName: '인천 SSG 랜더스필드',
    aliases: ['인천ssg랜더스필드', 'ssg랜더스필드'],
  },
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const normalizeLookupValue = (value: string) => value.toLowerCase().replace(/[\s\-_./()]/g, '');

const findTeamReference = (...candidates: Array<string | undefined>) => {
  const normalizedCandidates = candidates
    .filter((candidate): candidate is string => Boolean(candidate))
    .map(normalizeLookupValue);

  if (normalizedCandidates.length === 0) {
    return undefined;
  }

  return TEAM_REFERENCES.find((reference) => {
    const referenceCandidates = [
      reference.frontendId,
      reference.serverTeamId,
      reference.teamCode,
      reference.shortName,
      reference.fullName,
      ...reference.aliases,
    ]
      .map(normalizeLookupValue);

    return normalizedCandidates.some((candidate) => referenceCandidates.includes(candidate));
  });
};

const needsTeamLookup = (
  teamId: string | undefined,
  teamCode: string | undefined,
  teamName: string | undefined,
) => {
  if (!teamId) {
    return false;
  }

  if (findTeamReference(teamCode, teamName, teamId)) {
    return false;
  }

  return !teamCode || !teamName;
};

const collectLookupTeamIds = (games: GameScheduleResponse[]) => {
  const ids = new Set<string>();

  games.forEach((game) => {
    if (needsTeamLookup(game.homeTeamId, game.homeTeamCode, game.homeTeamName)) {
      ids.add(game.homeTeamId);
    }

    if (needsTeamLookup(game.awayTeamId, game.awayTeamCode, game.awayTeamName)) {
      ids.add(game.awayTeamId);
    }
  });

  return [...ids];
};

const mergeScheduleWithTeamDetails = (game: GameScheduleResponse, teamDetails: Map<string, {
  teamCode: string;
  teamName: string;
  homeGround?: string;
}>) => {
  const homeTeamDetail = teamDetails.get(game.homeTeamId);
  const awayTeamDetail = teamDetails.get(game.awayTeamId);

  return {
    ...game,
    homeTeamCode: game.homeTeamCode ?? homeTeamDetail?.teamCode,
    awayTeamCode: game.awayTeamCode ?? awayTeamDetail?.teamCode,
    homeTeamName: game.homeTeamName ?? homeTeamDetail?.teamName,
    awayTeamName: game.awayTeamName ?? awayTeamDetail?.teamName,
    stadiumName: game.stadiumName ?? homeTeamDetail?.homeGround,
  } satisfies GameScheduleResponse;
};

const parseApiDateTime = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { date: '', time: '' };
  }

  const normalized = trimmedValue.includes('T') ? trimmedValue : trimmedValue.replace(' ', 'T');
  const parsedDate = new Date(normalized);

  if (!Number.isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const hour = String(parsedDate.getHours()).padStart(2, '0');
    const minute = String(parsedDate.getMinutes()).padStart(2, '0');

    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}`,
    };
  }

  const [date = '', time = ''] = trimmedValue.split(/[ T]/);
  return { date, time: time.slice(0, 5) };
};

const toDateLabel = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  if (!year || !month || !day) {
    return date;
  }

  const parsed = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${DAY_LABELS[parsed.getDay()]})`;
};

const formatOpenedAtInfo = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const { date, time } = parseApiDateTime(value);
  const [, month = '', day = ''] = date.split('-');
  const [hour = '', minute = ''] = time.split(':');
  const meridiem = Number(hour) < 12 ? '오전' : '오후';
  const displayHour = (() => {
    const numericHour = Number(hour);
    if (!Number.isFinite(numericHour)) {
      return hour;
    }

    const converted = numericHour % 12;
    return String(converted === 0 ? 12 : converted);
  })();

  return `${Number(month)}월 ${Number(day)}일\n${meridiem} ${displayHour}시${minute ? ` ${minute}분` : ''} 오픈`;
};

const mapGameStatus = (value: string): GameStatus => {
  switch (value.toUpperCase()) {
    case 'FINISHED':
      return '종료';
    case 'CANCELED':
    case 'CANCELLED':
      return '취소';
    case 'IN_PROGRESS':
    case 'LIVE':
      return '경기중';
    default:
      return '예정';
  }
};

const mapTicketStatus = (value: string): TicketStatus => {
  switch (value.toUpperCase()) {
    case 'AVAILABLE':
    case 'OPEN':
      return '예매하기';
    case 'EXHAUSTED':
    case 'SOLD_OUT':
    case 'TERMINATED':
    case 'ENDED':
      return '매진';
    default:
      return '판매예정';
  }
};

const mapResellStatus = (ticketStatus: TicketStatus): ReselStatus => {
  switch (ticketStatus) {
    case '예매하기':
      return '리셀예매';
    case '매진':
      return '리셀매진';
    default:
      return '리셀예정';
  }
};

const resolveVenueNameFromGame = (game: GameScheduleResponse, homeTeamName: string) => {
  const stadiumById = STADIUM_REFERENCES[game.stadiumId];

  if (stadiumById) {
    return stadiumById.displayName;
  }

  if (game.stadiumName) {
    return game.stadiumName;
  }

  return homeTeamName;
};

const isSameCalendarDate = (date: string, target: Date) => {
  const [year, month, day] = date.split('-').map(Number);

  return (
    target.getFullYear() === year &&
    target.getMonth() + 1 === month &&
    target.getDate() === day
  );
};

const normalizeScheduleGame = (game: GameScheduleResponse): NormalizedScheduleGame => {
  const { date, time } = parseApiDateTime(game.startAt);
  const homeTeam = findTeamReference(game.homeTeamCode, game.homeTeamName, game.homeTeamId);
  const awayTeam = findTeamReference(game.awayTeamCode, game.awayTeamName, game.awayTeamId);
  const status = mapGameStatus(game.gameStatus);
  const ticket = mapTicketStatus(game.ticketingStatus);
  const fallbackHomeName = game.homeTeamName ?? game.homeTeamCode ?? game.homeTeamId;
  const fallbackAwayName = game.awayTeamName ?? game.awayTeamCode ?? game.awayTeamId;

  return {
    id: game.gameId,
    serverHomeTeamId: game.homeTeamId,
    serverAwayTeamId: game.awayTeamId,
    leagueType: game.leagueType as ApiLeagueType,
    homeTeamId: homeTeam?.frontendId,
    awayTeamId: awayTeam?.frontendId,
    homeTeamName: homeTeam?.shortName ?? fallbackHomeName,
    awayTeamName: awayTeam?.shortName ?? fallbackAwayName,
    homeTeamFullName: homeTeam?.fullName ?? fallbackHomeName,
    awayTeamFullName: awayTeam?.fullName ?? fallbackAwayName,
    date,
    dateLabel: toDateLabel(date),
    time,
    venue: resolveVenueNameFromGame(game, homeTeam?.shortName ?? fallbackHomeName),
    stadiumId: game.stadiumId,
    queueTokenJti: buildMockQueueTokenJti(game.gameId),
    score: status === '종료' ? `${game.awayTeamScore}:${game.homeTeamScore}` : null,
    status,
    ticket,
    resell: mapResellStatus(ticket),
    ticketInfo: ticket === '판매예정' ? formatOpenedAtInfo(game.ticketingOpenedAt) : undefined,
    reselInfo: ticket === '판매예정' ? '정식 예매 오픈 후\n리셀 오픈 예정' : undefined,
    isToday: isSameCalendarDate(date, new Date()),
    ticketingOpenedAt: game.ticketingOpenedAt,
  };
};

const sortByStartAt = (left: NormalizedScheduleGame, right: NormalizedScheduleGame) => {
  const leftKey = `${left.date} ${left.time}`;
  const rightKey = `${right.date} ${right.time}`;
  return leftKey.localeCompare(rightKey);
};

export const mapGamesToDaySchedules = (games: NormalizedScheduleGame[]): DaySchedule[] => {
  const grouped = new Map<string, DaySchedule>();

  [...games].sort(sortByStartAt).forEach((game) => {
    const row: GameRow = {
      gameId: game.id,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      stadiumId: game.stadiumId,
      queueTokenJti: game.queueTokenJti,
      time: game.time,
      venue: game.venue,
      away: game.awayTeamName,
      home: game.homeTeamName,
      score: game.score,
      status: game.status,
      ticket: game.ticket,
      resell: game.resell,
      ticketInfo: game.ticketInfo,
      reselInfo: game.reselInfo,
    };

    const current = grouped.get(game.date);

    if (current) {
      current.games.push(row);
      return;
    }

    grouped.set(game.date, {
      year: Number(game.date.slice(0, 4)),
      date: game.dateLabel,
      isToday: game.isToday,
      games: [row],
    });
  });

  return Array.from(grouped.values());
};

export const getClosestMatch = (games: NormalizedScheduleGame[], teamId: string) => {
  const now = new Date();
  const currentDayKey = now.toISOString().slice(0, 10);

  return [...games]
    .filter((game) => game.homeTeamId === teamId || game.awayTeamId === teamId)
    .filter((game) => game.date >= currentDayKey)
    .sort(sortByStartAt)[0] ?? null;
};

export const getDDay = (date: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'D-DAY';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
};

export const getPopularMatches = (games: NormalizedScheduleGame[], limit = 5) => {
  return [...games]
    .filter((game) => game.status === '예정')
    .sort((left, right) => {
      if (left.ticket !== right.ticket) {
        if (left.ticket === '예매하기') return -1;
        if (right.ticket === '예매하기') return 1;
      }

      return sortByStartAt(left, right);
    })
    .slice(0, limit);
};

export const useGameSchedules = (params: FetchGameSchedulesParams = {}) => {
  return useQuery({
    queryKey: ['game-schedules', params.teamId ?? null, params.year ?? null, params.month ?? null, params.week ?? null, params.today ?? null],
    queryFn: async () => {
      const schedules = await fetchGameSchedules(params);
      const lookupTeamIds = collectLookupTeamIds(schedules);
      const teamDetails = await fetchBaseballTeamDetails(lookupTeamIds);

      return schedules
        .map((game) => mergeScheduleWithTeamDetails(game, teamDetails))
        .map(normalizeScheduleGame)
        .sort(sortByStartAt);
    },
  });
};
