import { useEffect, useState } from 'react';
import { teams } from '@/entities/team/model/teams';
import type { DaySchedule, GameRow, GameStatus, TicketStatus, ReselStatus } from '@/pages/home/ui/game-schedule/types';
import type { ApiGameStatus, ApiTicketingStatus, GameScheduleResponse } from '@/shared/types/game';
import { gameApi } from './gameApi';

// 서버 UUID → 팀 표시명 매핑 (teams 엔티티 기반으로 런타임에 생성)
function buildTeamUuidMap(): Record<string, string> {
   return teams.reduce<Record<string, string>>((acc, team) => {
      if (team.serverTeamId) {
         acc[team.serverTeamId] = team.name;
      }
      return acc;
   }, {});
}

function toGameStatus(status: ApiGameStatus): GameStatus {
   switch (status) {
      case 'IN_PROGRESS':
         return '경기중';
      case 'FINISHED':
         return '종료';
      case 'SUSPENDED':
      case 'RAIN_DELAY':
      case 'RAIN_CANCELLED':
      case 'CANCELLED':
         return '취소';
      default:
         return '예정';
   }
}

function toTicketStatus(status: ApiTicketingStatus): TicketStatus {
   switch (status) {
      case 'AVAILABLE':
         return '예매하기';
      case 'EXHAUSTED':
         return '매진';
      default:
         return '판매예정';
   }
}

function toResellStatus(status: ApiTicketingStatus): ReselStatus {
   switch (status) {
      case 'AVAILABLE':
         return '리셀예매';
      case 'EXHAUSTED':
         return '리셀매진';
      default:
         return '리셀예정';
   }
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function transformSchedules(raw: GameScheduleResponse[]): DaySchedule[] {
   const teamUuidMap = buildTeamUuidMap();
   const today = new Date();

   const dayMap = new Map<string, DaySchedule>();

   for (const game of raw) {
      const date = new Date(game.startAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayName = DAY_NAMES[date.getDay()];
      const dateKey = `${month}월 ${day}일 (${dayName})`;

      const homeName = teamUuidMap[game.homeTeamId] ?? game.homeTeamId.slice(0, 8);
      const awayName = teamUuidMap[game.awayTeamId] ?? game.awayTeamId.slice(0, 8);

      const gameStatus = toGameStatus(game.gameStatus);
      const isFinished = gameStatus === '종료';
      const score = isFinished ? `${game.awayTeamScore}:${game.homeTeamScore}` : null;

      const homeTeam = teams.find(t => t.serverTeamId === game.homeTeamId);
      const venue = homeTeam?.stadiumName ?? '-';

      const gameRow: GameRow = {
         time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
         venue,
         away: awayName,
         home: homeName,
         score,
         status: gameStatus,
         ticket: toTicketStatus(game.ticketingStatus),
         resell: toResellStatus(game.ticketingStatus),
      };

      if (!dayMap.has(dateKey)) {
         const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

         dayMap.set(dateKey, { year, date: dateKey, isToday, games: [] });
      }

      dayMap.get(dateKey)!.games.push(gameRow);
   }

   return Array.from(dayMap.values());
}

interface UseGameSchedulesParams {
   serverTeamId?: string;
   year: number;
   month: number;
   week: number;
}

export function useGameSchedules({ serverTeamId, year, month, week }: UseGameSchedulesParams) {
   const [schedules, setSchedules] = useState<DaySchedule[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<Error | null>(null);

   useEffect(() => {
      const fetch = async () => {
         try {
            setLoading(true);
            const raw = await gameApi.getGameSchedules({
               ...(serverTeamId ? { teamId: serverTeamId } : {}),
               year,
               month,
               week,
               today: false,
            });
            setSchedules(transformSchedules(raw));
         } catch (err) {
            console.error('경기 일정 조회 실패:', err);
            setError(err instanceof Error ? err : new Error('알 수 없는 오류'));
         } finally {
            setLoading(false);
         }
      };

      fetch();
   }, [serverTeamId, year, month, week]);

   return { schedules, loading, error };
}
