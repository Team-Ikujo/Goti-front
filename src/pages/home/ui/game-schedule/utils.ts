import { isDemoBookingAllowed } from '@/shared/config/demoBookingGate';
import {
   TAB_ALL,
   TAB_TODAY,
   TAB_WEEK,
} from './constants';
import type { DaySchedule, GameRow, ReselStatus, TicketStatus } from './types';

type FilterParams = {
   activeTab: number;
   weekYear: number;
   weekMonth: number;
   selectedWeek: number;
   allYear: number;
   allMonth: number;
};

function parseDate(dateStr: string): { month: number; day: number } {
   const match = dateStr.match(/(\d+)월 (\d+)일/);
   if (!match) return { month: 0, day: 0 };
   return { month: parseInt(match[1]), day: parseInt(match[2]) };
}

function getWeekOfMonth(day: number): number {
   return Math.ceil(day / 7);
}

function isDayInActiveTab(
   day: DaySchedule,
   activeTab: number,
   weekYear: number,
   weekMonth: number,
   selectedWeek: number,
   allYear: number,
   allMonth: number,
): boolean {
   switch (activeTab) {
      case TAB_TODAY:
         return day.isToday === true;
      case TAB_WEEK: {
         const { month, day: dayNum } = parseDate(day.date);
         const week = getWeekOfMonth(dayNum);
         return day.year === weekYear && month === weekMonth && week === selectedWeek;
      }
      case TAB_ALL: {
         const { month } = parseDate(day.date);
         return day.year === allYear && month === allMonth;
      }
      default:
         return true;
   }
}

export function filterScheduleData(data: DaySchedule[], params: FilterParams): DaySchedule[] {
   const { activeTab, weekYear, weekMonth, selectedWeek, allYear, allMonth } = params;

   return data
      .filter(day => isDayInActiveTab(day, activeTab, weekYear, weekMonth, selectedWeek, allYear, allMonth))
      .filter(day => day.games.length > 0);
}

export function getGameResultTexts(score: string | null, isEnded: boolean): { away: string; home: string } {
   if (!isEnded || !score) {
      return { away: '', home: '' };
   }

   const [awayScore, homeScore] = score.split(':').map(Number);
   return {
      away: awayScore < homeScore ? '패' : '승',
      home: homeScore > awayScore ? '승' : '패',
   };
}

const parseScheduleDateTime = (value?: string) => {
   if (!value?.trim()) {
      return null;
   }

   const normalized = value.includes('T') ? value : value.replace(' ', 'T');
   const parsedDate = new Date(normalized);

   return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatOpenBoundaryLabel = (value?: string, fallbackDate?: string) => {
   const parsedDate = parseScheduleDateTime(value);

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

type EffectiveSaleStatus = {
   effectiveTicket: TicketStatus;
   effectiveResell: ReselStatus;
   ticketInfo?: string;
   reselInfo?: string;
};

export const getEffectiveSaleStatuses = (game: GameRow, now = new Date()): EffectiveSaleStatus => {
   const nowMs = now.getTime();
   const saleOpenTimeMs = game.ticketingOpenedAtMs;
   const saleEndTimeMs = game.ticketingEndAtMs;
   const resellOpenTimeMs = game.resellOpenedAtMs;
   const resellEndTimeMs = game.resellEndAtMs;
   const saleBeforeOpen = saleOpenTimeMs !== undefined && nowMs < saleOpenTimeMs;
   const saleClosed = saleEndTimeMs !== undefined && nowMs > saleEndTimeMs;
   const saleWithinWindow =
      (saleOpenTimeMs === undefined || nowMs >= saleOpenTimeMs) && (saleEndTimeMs === undefined || nowMs <= saleEndTimeMs);

   // 리셀 창: 정식 예매 오픈 +2시간 ~ 경기 시작 -2시간.
   // 경계값이 없으면 해당 경계는 체크하지 않는다 (서버 스케줄 데이터 부재 fallback).
   const resellBeforeOpen = resellOpenTimeMs !== undefined && nowMs < resellOpenTimeMs;
   const resellClosed = resellEndTimeMs !== undefined && nowMs >= resellEndTimeMs;

   // 시연 gate: 허용된 홈팀(KIA/삼성)이 아니거나 시연 기간 종료 시 모든 예매/리셀을 매진 처리해
   // 별도 안내 없이 기존 매진 UI 로 자연스럽게 흡수시킨다.
   const demoAllowed = isDemoBookingAllowed(game.homeTeamId, nowMs);

   const effectiveTicket: TicketStatus = (() => {
      if (!demoAllowed) {
         return '매진';
      }

      if (game.ticket === '매진') {
         return game.ticket;
      }

      if (saleBeforeOpen) {
         return '판매예정';
      }

      if (saleClosed) {
         return '매진';
      }

      if (game.ticket === '예매하기' && saleWithinWindow) {
         return '예매하기';
      }

      if (saleOpenTimeMs !== undefined && nowMs >= saleOpenTimeMs) {
         return '매진';
      }

      return game.ticket;
   })();

   const effectiveResell: ReselStatus = (() => {
      if (!demoAllowed) {
         return '리셀매진';
      }

      // 경기 시작 2시간 전 이후는 리셀 창구 폐쇄.
      if (resellClosed) {
         return '리셀매진';
      }

      // 정식 예매 오픈 2시간 전까지는 리셀 예정.
      if (resellBeforeOpen) {
         return '리셀예정';
      }

      return game.resell === '리셀예정' ? '리셀예매' : game.resell;
   })();

   return {
      effectiveTicket,
      effectiveResell,
      ticketInfo: effectiveTicket === '판매예정' ? formatOpenBoundaryLabel(game.ticketingOpenedAt, game.rawDate) : undefined,
      reselInfo: effectiveResell === '리셀예정' ? '정식 예매 오픈\n2시간 후' : undefined,
   };
};
