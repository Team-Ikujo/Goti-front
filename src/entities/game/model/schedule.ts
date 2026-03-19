import { useQuery } from '@tanstack/react-query';

import { buildMockQueueTokenJti } from '@/shared/config/booking';
import { fetchGameSchedules, type FetchGameSchedulesParams, type GameScheduleResponse } from '@/entities/game/api/scheduleApi';
import type { DaySchedule, GameRow, GameStatus, ReselStatus, TicketStatus } from '@/pages/home/ui/game-schedule/types';

export type NormalizedScheduleGame = {
  id: string;
  serverHomeTeamId: string;
  serverAwayTeamId: string;
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
  shortName: string;
  fullName: string;
  aliases: string[];
};

const TEAM_REFERENCES: TeamReference[] = [
  { frontendId: 'kia', shortName: 'KIA', fullName: 'KIA 타이거즈', aliases: ['kia', 'teamkia', 'kiatigers', '기아', '기아타이거즈'] },
  { frontendId: 'samsung', shortName: '삼성', fullName: '삼성 라이온즈', aliases: ['samsung', 'teamsamsung', '삼성', '삼성라이온즈'] },
  { frontendId: 'lg', shortName: 'LG', fullName: 'LG 트윈스', aliases: ['lg', 'teamlg', 'lgtwins', '엘지', '엘지트윈스', 'lg트윈스'] },
  { frontendId: 'hanwha', shortName: '한화', fullName: '한화 이글스', aliases: ['hanwha', 'teamhanwha', '한화', '한화이글스'] },
  { frontendId: 'ssg', shortName: 'SSG', fullName: 'SSG 랜더스', aliases: ['ssg', 'teamssg', 'ssglanders', '랜더스', 'ssg랜더스'] },
  { frontendId: 'nc', shortName: 'NC', fullName: 'NC 다이노스', aliases: ['nc', 'teamnc', 'ncdinos', 'nc다이노스'] },
  { frontendId: 'kt', shortName: 'KT', fullName: 'KT wiz', aliases: ['kt', 'teamkt', 'ktwiz', '케이티', '케이티위즈'] },
  { frontendId: 'lotte', shortName: '롯데', fullName: '롯데 자이언츠', aliases: ['lotte', 'teamlotte', '롯데', '롯데자이언츠'] },
  { frontendId: 'doosan', shortName: '두산', fullName: '두산 베어스', aliases: ['doosan', 'teamdoosan', '두산', '두산베어스'] },
  { frontendId: 'kiwoom', shortName: '키움', fullName: '키움 히어로즈', aliases: ['kiwoom', 'teamkiwoom', '키움', '키움히어로즈'] },
];

const STADIUM_NAME_BY_ID: Record<string, string> = {
  'stadium-jamsil-baseball': '잠실 야구장',
  'stadium-samsung-lions-park': '대구 삼성 라이온즈 파크',
  'stadium-sajik-baseball': '사직 야구장',
  'stadium-changwon-nc-park': '창원 NC파크',
  'stadium-gocheok-skydome': '고척 스카이돔',
  'stadium-kia-champions-field': '기아 챔피언스필드',
  'stadium-kt-wiz-park': '수원 KT위즈파크',
  'stadium-daejeon-baseball': '대전 한화생명 볼파크',
  'stadium-incheon-landers-field': '인천 SSG 랜더스필드',
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const normalizeLookupValue = (value: string) => value.toLowerCase().replace(/[\s\-_./()]/g, '');

const findTeamReference = (teamId: string) => {
  const normalized = normalizeLookupValue(teamId);
  return TEAM_REFERENCES.find((reference) => reference.aliases.some((alias) => normalizeLookupValue(alias) === normalized));
};

const parseApiDateTime = (value: string) => {
  const [date = '', time = ''] = value.trim().split(' ');
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

  const [date = '', time = ''] = value.split(' ');
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
    case 'SOLD_OUT':
    case 'CLOSED':
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

const resolveVenueName = (stadiumId: string, homeTeamName: string) => {
  return STADIUM_NAME_BY_ID[stadiumId] ?? homeTeamName;
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
  const homeTeam = findTeamReference(game.homeTeamId);
  const awayTeam = findTeamReference(game.awayTeamId);
  const status = mapGameStatus(game.gameStatus);
  const ticket = mapTicketStatus(game.ticketingStatus);

  return {
    id: game.gameId,
    serverHomeTeamId: game.homeTeamId,
    serverAwayTeamId: game.awayTeamId,
    homeTeamId: homeTeam?.frontendId,
    awayTeamId: awayTeam?.frontendId,
    homeTeamName: homeTeam?.shortName ?? game.homeTeamId,
    awayTeamName: awayTeam?.shortName ?? game.awayTeamId,
    homeTeamFullName: homeTeam?.fullName ?? game.homeTeamId,
    awayTeamFullName: awayTeam?.fullName ?? game.awayTeamId,
    date,
    dateLabel: toDateLabel(date),
    time,
    venue: resolveVenueName(game.stadiumId, homeTeam?.shortName ?? game.homeTeamId),
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
    queryKey: ['game-schedules', params.year ?? null, params.month ?? null, params.today ?? null],
    queryFn: async () => {
      const schedules = await fetchGameSchedules(params);
      return schedules.map(normalizeScheduleGame).sort(sortByStartAt);
    },
  });
};
