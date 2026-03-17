import type { ZoneItem } from './types';

type PricePoint = {
   time: string;
   price: number;
};

type TradeHistoryItem = {
   id: string;
   price: number;
   seatLabel: string;
   tradedAt: string;
};

type ListingItem = {
   id: string;
   seatLabel: string;
   seller: string;
   price: number;
};

export type ResellZoneInsights = {
   changeAmount: number;
   changeRate: number;
   previousClose: number;
   recentTrade: number;
   dayLow: number;
   dayHigh: number;
   pricePoints: PricePoint[];
   tradeHistory: TradeHistoryItem[];
   listings: ListingItem[];
};

const timeLabels = ['14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30'];

function createPricePoints(basePrice: number, delta: number): PricePoint[] {
   const prices = [
      basePrice - delta,
      basePrice - Math.round(delta * 0.45),
      basePrice + Math.round(delta * 0.3),
      basePrice + Math.round(delta * 0.9),
      basePrice + Math.round(delta * 0.55),
      basePrice + Math.round(delta * 1.15),
      basePrice + delta,
   ];

   return timeLabels.map((time, index) => ({
      time,
      price: Math.max(5000, prices[index] ?? basePrice),
   }));
}

function createTradeHistory(zone: ZoneItem, basePrice: number, delta: number): TradeHistoryItem[] {
   return [
      {
         id: `${zone.id}-history-1`,
         price: basePrice + delta,
         seatLabel: `${zone.sectionCode}구역 0열 0번`,
         tradedAt: '40분 전',
      },
      {
         id: `${zone.id}-history-2`,
         price: basePrice + Math.round(delta * 0.6),
         seatLabel: `${zone.sectionCode}구역 10열 11번`,
         tradedAt: '6시간 전',
      },
      {
         id: `${zone.id}-history-3`,
         price: basePrice + Math.round(delta * 1.75),
         seatLabel: `${zone.sectionCode}구역 27열 9번`,
         tradedAt: '03/07 14:23',
      },
      {
         id: `${zone.id}-history-4`,
         price: basePrice,
         seatLabel: `${zone.sectionCode}구역 4열 5번`,
         tradedAt: '03/05 19:02',
      },
   ];
}

function createListings(zone: ZoneItem, basePrice: number, delta: number): ListingItem[] {
   return [
      {
         id: `${zone.id}-listing-1`,
         seatLabel: `${zone.sectionCode}구역 0열 0번`,
         seller: '실시간 등록',
         price: basePrice + delta,
      },
      {
         id: `${zone.id}-listing-2`,
         seatLabel: `${zone.sectionCode}구역 2열 4번`,
         seller: '즉시 구매 가능',
         price: basePrice + Math.round(delta * 0.8),
      },
      {
         id: `${zone.id}-listing-3`,
         seatLabel: `${zone.sectionCode}구역 8열 12번`,
         seller: '모바일 티켓',
         price: basePrice + Math.round(delta * 0.55),
      },
      {
         id: `${zone.id}-listing-4`,
         seatLabel: `${zone.sectionCode}구역 14열 3번`,
         seller: '안전결제',
         price: basePrice + Math.round(delta * 0.35),
      },
   ];
}

export function getResellZoneInsights(zone: ZoneItem): ResellZoneInsights {
   const basePrice = Math.max(zone.price, 10000);
   const changeAmount = Math.max(2000, Math.round(basePrice * 0.25 / 1000) * 1000);
   const previousClose = Math.max(5000, basePrice - changeAmount);
   const recentTrade = basePrice + Math.round(changeAmount * 0.65);
   const dayLow = Math.max(5000, previousClose - Math.round(previousClose * 0.3));
   const dayHigh = recentTrade + Math.round(changeAmount * 0.2);

   return {
      changeAmount,
      changeRate: Number(((changeAmount / previousClose) * 100).toFixed(2)),
      previousClose,
      recentTrade,
      dayLow,
      dayHigh,
      pricePoints: createPricePoints(basePrice, changeAmount),
      tradeHistory: createTradeHistory(zone, basePrice, changeAmount),
      listings: createListings(zone, basePrice, changeAmount),
   };
}
