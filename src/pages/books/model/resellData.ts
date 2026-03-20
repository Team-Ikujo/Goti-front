import type { SeatItem, ZoneItem } from './types';

export type ResellTradeRange = 'minute' | 'day';

type PricePoint = {
   time: string;
   price: number;
   occurredAt: string;
};

type TradeHistoryItem = {
   id: string;
   price: number;
   seatLabel: string;
   tradedAt: string;
};

export type ResellListingItem = {
   listingId: string;
   sellerId: string;
   seatId: string;
   seatInfo: string;
   seatLabel: string;
   listingPrice: number;
   totalAmount: number;
   totalBuyerFee: number;
   totalSellerFee: number;
   settlementAmount: number;
   listedAt: string;
   isPurchasable: boolean;
};

export type ResellZoneInsights = {
   changeAmount: number;
   changeRate: number;
   previousClose: number;
   recentTrade: number;
   dayLow: number;
   dayHigh: number;
   pricePointsByRange: Record<ResellTradeRange, PricePoint[]>;
   tradeHistory: TradeHistoryItem[];
   listings: ResellListingItem[];
};

const minuteLabels = ['14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30'];
const dayLabels = ['03/14', '03/15', '03/16', '03/17', '03/18', '03/19', '03/20'];
const minuteOccurredAt = [
   '2026-03-20T14:00:00+09:00',
   '2026-03-20T14:45:00+09:00',
   '2026-03-20T15:30:00+09:00',
   '2026-03-20T16:15:00+09:00',
   '2026-03-20T17:00:00+09:00',
   '2026-03-20T17:45:00+09:00',
   '2026-03-20T18:30:00+09:00',
];
const dayOccurredAt = [
   '2026-03-14T18:00:00+09:00',
   '2026-03-15T18:00:00+09:00',
   '2026-03-16T18:00:00+09:00',
   '2026-03-17T18:00:00+09:00',
   '2026-03-18T18:00:00+09:00',
   '2026-03-19T18:00:00+09:00',
   '2026-03-20T18:00:00+09:00',
];

const formatSeatInfo = (zone: ZoneItem, seat: SeatItem) => `${zone.name} ${seat.rowLabel} ${seat.seatNumber}번`;

const formatSeatLabel = (zone: ZoneItem, seat: SeatItem) => `${zone.sectionCode}구역 ${seat.rowLabel} ${seat.seatNumber}번`;

const createPricePoints = (labels: string[], prices: number[], occurredAtList: string[]): PricePoint[] => {
   return labels.map((time, index) => ({
      time,
      price: prices[index] ?? prices[prices.length - 1] ?? 0,
      occurredAt: occurredAtList[index] ?? occurredAtList[occurredAtList.length - 1] ?? '',
   }));
};

const createListingPrice = (zonePrice: number, seat: SeatItem, index: number) => {
   const basePrice = Math.max(zonePrice, 10000);
   const rowPremium = Math.max(0, 6 - Math.min(6, Number.parseInt(seat.rowLabel, 10) || 6)) * 1000;
   const seatPremium = (seat.seatNumber % 5) * 500;

   return basePrice + rowPremium + seatPremium + index * 500;
};

export function getResellZoneInsights({
   zone,
   seats,
}: {
   zone: ZoneItem;
   seats: SeatItem[];
}): ResellZoneInsights {
   const listedSeats = seats
      .filter((seat) => seat.status === 'available')
      .sort(
         (left, right) =>
            left.block.localeCompare(right.block, 'ko-KR', { numeric: true, sensitivity: 'base' }) ||
            left.rowLabel.localeCompare(right.rowLabel, 'ko-KR', { numeric: true, sensitivity: 'base' }) ||
            left.seatNumber - right.seatNumber,
      )
      .slice(0, 8);

   const listings = listedSeats.map((seat, index) => {
      const listingPrice = createListingPrice(zone.price, seat, index);
      const totalBuyerFee = 2000;
      const totalSellerFee = Math.max(1000, Math.round(listingPrice * 0.05 / 1000) * 1000);

      return {
         listingId: `listing-${seat.id}`,
         sellerId: `seller-${zone.id}-${index + 1}`,
         seatId: seat.id,
         seatInfo: formatSeatInfo(zone, seat),
         seatLabel: formatSeatLabel(zone, seat),
         listingPrice,
         totalAmount: listingPrice + totalBuyerFee,
         totalBuyerFee,
         totalSellerFee,
         settlementAmount: Math.max(0, listingPrice - totalSellerFee),
         listedAt: `2026-03-20T0${Math.min(index, 9)}:00:00.000Z`,
         isPurchasable: true,
      } satisfies ResellListingItem;
   });

   const previousClose = Math.max(zone.price, 10000);
   const recentTrade = listings[0]?.listingPrice ?? previousClose;
   const changeAmount = recentTrade - previousClose;
   const dayLow = Math.max(5000, previousClose - Math.round(previousClose * 0.3));
   const dayHigh = Math.max(recentTrade, previousClose + Math.round(previousClose * 0.3));
   const minutePrices = [
      previousClose - 2000,
      previousClose + 500,
      previousClose + 3500,
      previousClose + 6000,
      previousClose + 4500,
      previousClose + 8000,
      previousClose + 7000,
   ];
   const dayPrices = [
      previousClose - 3000,
      previousClose - 1500,
      previousClose + 500,
      previousClose + 1500,
      previousClose + 2800,
      previousClose + 4200,
      recentTrade,
   ];
   const tradeHistory = listings.slice(0, 4).map((listing, index) => ({
      id: `${listing.listingId}-history`,
      price: listing.listingPrice,
      seatLabel: listing.seatLabel,
      tradedAt: ['40분 전', '6시간 전', '03/07 14:23', '03/07 14:23'][index] ?? '방금 전',
   }));

   return {
      changeAmount,
      changeRate: previousClose > 0 ? Number(((changeAmount / previousClose) * 100).toFixed(2)) : 0,
      previousClose,
      recentTrade,
      dayLow,
      dayHigh,
      pricePointsByRange: {
         minute: createPricePoints(minuteLabels, minutePrices, minuteOccurredAt),
         day: createPricePoints(dayLabels, dayPrices, dayOccurredAt),
      },
      tradeHistory,
      listings,
   };
}
