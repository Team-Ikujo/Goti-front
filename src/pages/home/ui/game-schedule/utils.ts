import {
   TAB_ALL,
   TAB_TODAY,
   TAB_WEEK,
   TODAY,
} from './constants';
import type { DaySchedule } from './types';

type FilterParams = {
   activeTab: number;
   weekMonth: number;
   selectedWeek: number;
   allMonth: number;
   selectedTeam: string | null;
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
   weekMonth: number,
   selectedWeek: number,
   allMonth: number,
): boolean {
   switch (activeTab) {
      case TAB_TODAY:
         return day.date === TODAY;
      case TAB_WEEK: {
         const { month, day: dayNum } = parseDate(day.date);
         const week = getWeekOfMonth(dayNum);
         return month === weekMonth && week === selectedWeek;
      }
      case TAB_ALL: {
         const { month } = parseDate(day.date);
         return month === allMonth;
      }
      default:
         return true;
   }
}

export function filterScheduleData(data: DaySchedule[], params: FilterParams): DaySchedule[] {
   const { activeTab, weekMonth, selectedWeek, allMonth, selectedTeam } = params;

   return data
      .filter(day => isDayInActiveTab(day, activeTab, weekMonth, selectedWeek, allMonth))
      .map(day => ({
         ...day,
         games: selectedTeam
            ? day.games.filter(game => game.away === selectedTeam || game.home === selectedTeam)
            : day.games,
      }))
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
