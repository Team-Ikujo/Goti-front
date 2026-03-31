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
   const saleOpenTime = parseScheduleDateTime(game.ticketingOpenedAt);
   const saleEndTime = parseScheduleDateTime(game.ticketingEndAt);
   const resellOpenTime = game.rawDate ? new Date(`${game.rawDate}T13:00:00`) : null;
   const saleBeforeOpen = saleOpenTime !== null && now < saleOpenTime;
   const saleClosed = saleEndTime !== null && now > saleEndTime;
   const saleWithinWindow = (saleOpenTime === null || now >= saleOpenTime) && (saleEndTime === null || now <= saleEndTime);
   const resellNowOpen = resellOpenTime !== null && now >= resellOpenTime;

   const effectiveTicket: TicketStatus = (() => {
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

      return game.ticket;
   })();

   const effectiveResell: ReselStatus =
      game.resell === '리셀예정' && resellNowOpen ? '리셀예매' : game.resell;

   return {
      effectiveTicket,
      effectiveResell,
      ticketInfo: effectiveTicket === '판매예정' ? formatOpenBoundaryLabel(game.ticketingOpenedAt, game.rawDate) : undefined,
      reselInfo: effectiveResell === '리셀예정' ? '정식 예매 오픈\n2시간 후' : undefined,
   };
};
