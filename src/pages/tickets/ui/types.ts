// src/pages/tickets/ui/types.ts

export type TabType = '예매' | '리셀';

export type BookingStatus = '예매 가능' | '오픈 예정' | '매진';
export type ResellStatus = '예매 가능' | '리셀 예정' | '매진';

export interface GameItem {
   id: string;
   awayTeam: string;
   homeTeam: string;
   dateTime: string;
   venue: string;
   remainingSeats: number;
   minPrice: number;
   maxPrice: number;
   bookingStatus: BookingStatus;
   resellStatus: ResellStatus;
}

export interface FilterState {
   showUpcoming: boolean;
   showSoldOut: boolean;
   dateTime: string;
   minPrice: number;
   maxPrice: number;
   venue: string;
   searchQuery: string;
}
