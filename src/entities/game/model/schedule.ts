import { useQuery } from '@tanstack/react-query';

import { buildMockQueueTokenJti } from '@/shared/config/booking';
import type { ApiLeagueType } from '@/shared/types/game';
import { hasAvailableSeats } from '@/entities/game/model/seatAvailability';
import {
  fetchBaseballTeamDetails,
  fetchGameSchedules,
  type FetchGameSchedulesParams,
} from '@/entities/game/api/scheduleApi';
import type { GameScheduleResponse } from '@/shared/types/game';
import { teams } from '@/entities/team/model/teams';
import type { DaySchedule, GameRow, GameStatus, ReselStatus, TicketStatus } from '@/pages/home/ui/game-schedule/types';

export type NormalizedScheduleGame = {
  id: string;
  serverHomeTeamId?: string;
  serverAwayTeamId?: string;
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
  ticketingEndAt?: string;
  ticketingOpenedAtMs?: number;
  ticketingEndAtMs?: number;
  resellOpenedAtMs?: number;
  remainingSeatCount: number;
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
      .filter((candidate): candidate is string => Boolean(candidate))
      .map(normalizeLookupValue);

    return normalizedCandidates.some((candidate) => referenceCandidates.includes(candidate));
  });
};

const needsTeamLookup = (
  teamId: string | undefined,
  teamCode: string | undefined,
  teamName: string | undefined,
  displayName: string | undefined,
) => {
  if (!teamId) {
    return false;
  }

  if (findTeamReference(displayName, teamCode, teamName, teamId)) {
    return false;
  }

  return !teamCode || !teamName;
};

const collectLookupTeamIds = (games: GameScheduleResponse[]) => {
  const ids = new Set<string>();

  games.forEach((game) => {
    if (needsTeamLookup(game.homeTeamId, game.homeTeamCode, game.homeTeamName, game.homeTeamDisplayName)) {
      ids.add(game.homeTeamId);
    }

    if (needsTeamLookup(game.awayTeamId, game.awayTeamCode, game.awayTeamName, game.awayTeamDisplayName)) {
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
  const homeTeamDetail = game.homeTeamId ? teamDetails.get(game.homeTeamId) : undefined;
  const awayTeamDetail = game.awayTeamId ? teamDetails.get(game.awayTeamId) : undefined;

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

const parseScheduleBoundary = (value?: string) => {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsedDate = new Date(normalized);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const toTimestamp = (value?: string) => parseScheduleBoundary(value)?.getTime();

const getResellOpenTimestamp = (date?: string) => {
  if (!date) {
    return undefined;
  }

  const parsedDate = new Date(`${date}T13:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.getTime();
};

const formatOpenBoundaryLabel = (value?: string, fallbackDate?: string): string => {
  const parsedDate = parseScheduleBoundary(value);

  if (parsedDate) {
    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();
    const hours = parsedDate.getHours();
    const minutes = parsedDate.getMinutes();
    const meridiem = hours < 12 ? '오전' : '오후';
    const displayHour = hours % 12 || 12;
    const minuteLabel = minutes === 0 ? '' : ` ${minutes}분`;

    return `${month}월 ${day}일\n${meridiem} ${displayHour}시${minuteLabel} 오픈`;
  }

  if (fallbackDate) {
    const [, month, day] = fallbackDate.split('-').map(Number);
    return `${month}월 ${day}일\n오픈 예정`;
  }

  return '오픈 예정';
};


const mapGameStatus = (value: string): GameStatus => {
  switch (value.toUpperCase()) {
    case 'FINISHED':
      return '종료';
    case 'CANCELED':
    case 'CANCELLED':
    case 'RAIN_CANCELLED':
      return '취소';
    case 'IN_PROGRESS':
    case 'LIVE':
    case 'SUSPENDED':
    case 'RAIN_DELAY':
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
    case 'SOLD_OUT':
    case 'CLOSED':
    case 'ENDED':
    case 'EXHAUSTED':
    case 'TERMINATED':
    case 'CANCELED':
      return '매진';
    case 'PAUSED':
      return '판매예정';
    default:
      return '판매예정';
  }
};

const closeTicketStatusForEmptyInventory = (
  ticketStatus: TicketStatus,
  remainingSeatCount: number,
): TicketStatus => {
  if (ticketStatus !== '예매하기') {
    return ticketStatus;
  }

  if (!hasAvailableSeats(remainingSeatCount)) {
    return '매진';
  }

  return ticketStatus;
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

const closeTicketStatusForUnavailableGame = (ticketStatus: TicketStatus, gameStatus: GameStatus): TicketStatus => {
  if (gameStatus !== '예정') {
    return '매진';
  }

  return ticketStatus;
};

const resolveVenueNameFromGame = (game: GameScheduleResponse, homeTeamName: string) => {
  const stadiumById = STADIUM_REFERENCES[game.stadiumId];

  if (stadiumById) {
    return stadiumById.displayName;
  }

  if (game.stadiumLocation) {
    return game.stadiumLocation;
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
  const homeTeam = findTeamReference(game.homeTeamDisplayName, game.homeTeamCode, game.homeTeamName, game.homeTeamId);
  const awayTeam = findTeamReference(game.awayTeamDisplayName, game.awayTeamCode, game.awayTeamName, game.awayTeamId);

  // API 상태와 무관하게 경기 시각이 지났으면 종료 처리
  const apiStatus = mapGameStatus(game.gameStatus);
  const gameDateTime = date && time ? new Date(`${date}T${time}`) : null;
  const status: GameStatus = (apiStatus !== '종료' && gameDateTime && gameDateTime < new Date()) ? '종료' : apiStatus;
  const ticketingOpenedAtMs = toTimestamp(game.ticketingOpenedAt);
  const ticketingEndAtMs = toTimestamp(game.ticketingEndAt);
  const resellOpenedAtMs = getResellOpenTimestamp(date);

  const ticket = closeTicketStatusForUnavailableGame(
    closeTicketStatusForEmptyInventory(mapTicketStatus(game.ticketingStatus), game.remainingSeatCount),
    status,
  );
  const fallbackHomeName = game.homeTeamDisplayName ?? game.homeTeamName ?? game.homeTeamCode ?? game.homeTeamId;
  const fallbackAwayName = game.awayTeamDisplayName ?? game.awayTeamName ?? game.awayTeamCode ?? game.awayTeamId;

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
    ticketInfo: ticket === '판매예정' ? formatOpenBoundaryLabel(game.ticketingOpenedAt, date) : undefined,
    reselInfo: ticket === '판매예정' ? '정식 예매 오픈\n2시간 후' : undefined,
    isToday: isSameCalendarDate(date, new Date()),
    ticketingOpenedAt: game.ticketingOpenedAt,
    ticketingEndAt: game.ticketingEndAt,
    ticketingOpenedAtMs,
    ticketingEndAtMs,
    resellOpenedAtMs,
    remainingSeatCount: game.remainingSeatCount,
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
      serverHomeTeamId: game.serverHomeTeamId,
      stadiumId: game.stadiumId,
      leagueType: game.leagueType,
      queueTokenJti: game.queueTokenJti,
      rawDate: game.date,
      ticketingOpenedAt: game.ticketingOpenedAt,
      ticketingEndAt: game.ticketingEndAt,
      ticketingOpenedAtMs: game.ticketingOpenedAtMs,
      ticketingEndAtMs: game.ticketingEndAtMs,
      resellOpenedAtMs: game.resellOpenedAtMs,
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
      remainingSeatCount: game.remainingSeatCount,
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
