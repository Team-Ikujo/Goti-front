// src/pages/tickets/ui/types.ts
import type { ApiLeagueType } from '@/shared/types/game';

export type TabType = '예매' | '리셀';

export type BookingStatus = '예매 가능' | '판매 예정' | '매진';
export type ResellStatus = '리셀 가능' | '리셀 예정' | '매진';

export interface GameItem {
   id: string;
   homeTeamId: string;
   serverHomeTeamId: string;
   stadiumId?: string;
   queueTokenJti?: string;
   leagueType: ApiLeagueType;
   awayTeam: string;
   homeTeam: string;
   date: string;      // YYYY-MM-DD (필터용)
   dateTime: string;  // 표시용 "2026.07.03 (금) 18:30"
   venue: string;
   remainingSeats: number;
   minPrice: number;
   maxPrice: number;
   bookingStatus: BookingStatus;
   resellStatus: ResellStatus;
}

export interface FilterState {
   tab: TabType;
   showUpcoming: boolean;
   showSoldOut: boolean;
   dateTime: string;
   minPrice: number;
   maxPrice: number;
   venue: string;
   searchQuery: string;
}
