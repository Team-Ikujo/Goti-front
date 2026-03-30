import type { ZoneItem } from './types';

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

export type ResellGraphPoint = {
   transactionPrice: number;
   confirmedAt: string;
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

const minuteLabelFormatter = new Intl.DateTimeFormat('ko-KR', {
   hour: '2-digit',
   minute: '2-digit',
   hour12: false,
   timeZone: 'Asia/Seoul',
});

const dayLabelFormatter = new Intl.DateTimeFormat('ko-KR', {
   month: '2-digit',
   day: '2-digit',
   timeZone: 'Asia/Seoul',
});

const sortGraphPointsByTime = (left: ResellGraphPoint, right: ResellGraphPoint) =>
   new Date(left.confirmedAt).getTime() - new Date(right.confirmedAt).getTime();

const createPricePointsFromGraph = (points: ResellGraphPoint[], range: ResellTradeRange): PricePoint[] => {
   const sortedPoints = [...points].sort(sortGraphPointsByTime);

   return sortedPoints.map((point) => {
      const confirmedAt = new Date(point.confirmedAt);

      return {
         time: range === 'minute' ? minuteLabelFormatter.format(confirmedAt) : dayLabelFormatter.format(confirmedAt).replace('. ', '/').replace('.', ''),
         price: point.transactionPrice,
         occurredAt: point.confirmedAt,
      };
   });
};

const toRelativeTradeTime = (value: string) => {
   const now = Date.now();
   const target = new Date(value).getTime();

   if (Number.isNaN(target)) {
      return value;
   }

   const diffMinutes = Math.max(0, Math.floor((now - target) / (1000 * 60)));

   if (diffMinutes < 1) {
      return '방금 전';
   }

   if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
   }

   const diffHours = Math.floor(diffMinutes / 60);

   if (diffHours < 24) {
      return `${diffHours}시간 전`;
   }

   const date = new Date(target);
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   const hours = String(date.getHours()).padStart(2, '0');
   const minutes = String(date.getMinutes()).padStart(2, '0');

   return `${month}/${day} ${hours}:${minutes}`;
};

const createTradeHistoryFromGraph = (zone: ZoneItem, points: ResellGraphPoint[]): TradeHistoryItem[] => {
   return [...points]
      .sort((left, right) => new Date(right.confirmedAt).getTime() - new Date(left.confirmedAt).getTime())
      .slice(0, 4)
      .map((point, index) => ({
         id: `${zone.id}-trade-${index}-${point.confirmedAt}`,
         price: point.transactionPrice,
         seatLabel: zone.name,
         tradedAt: toRelativeTradeTime(point.confirmedAt),
      }));
};

const getFallbackPrice = (zone: ZoneItem, listings: ResellListingItem[]) => {
   return listings[0]?.listingPrice ?? Math.max(zone.price, 10000);
};

export const buildResellZoneInsightsFromApi = ({
   zone,
   listings,
   minuteGraph,
   dayGraph,
}: {
   zone: ZoneItem;
   listings: ResellListingItem[];
   minuteGraph: ResellGraphPoint[];
   dayGraph: ResellGraphPoint[];
}): ResellZoneInsights => {
   const pricePointsByMinute = createPricePointsFromGraph(minuteGraph, 'minute');
   const pricePointsByDay = createPricePointsFromGraph(dayGraph, 'day');
   const fallbackPrice = getFallbackPrice(zone, listings);
   const previousClose =
      pricePointsByDay.length >= 2
         ? pricePointsByDay[pricePointsByDay.length - 2]?.price ?? fallbackPrice
         : pricePointsByDay[0]?.price ?? fallbackPrice;
   const recentTrade =
      pricePointsByMinute[pricePointsByMinute.length - 1]?.price ??
      pricePointsByDay[pricePointsByDay.length - 1]?.price ??
      listings[0]?.listingPrice ??
      previousClose;
   const dayPrices = pricePointsByDay.map((point) => point.price);
   const dayLow = dayPrices.length > 0 ? Math.min(...dayPrices) : Math.min(previousClose, recentTrade);
   const dayHigh = dayPrices.length > 0 ? Math.max(...dayPrices) : Math.max(previousClose, recentTrade);
   const changeAmount = recentTrade - previousClose;

   return {
      changeAmount,
      changeRate: previousClose > 0 ? Number(((changeAmount / previousClose) * 100).toFixed(2)) : 0,
      previousClose,
      recentTrade,
      dayLow,
      dayHigh,
      pricePointsByRange: {
         minute: pricePointsByMinute.length > 0
            ? pricePointsByMinute
            : [{ time: '00:00', price: recentTrade, occurredAt: new Date().toISOString() }],
         day: pricePointsByDay.length > 0
            ? pricePointsByDay
            : [{ time: '00/00', price: recentTrade, occurredAt: new Date().toISOString() }],
      },
      tradeHistory: createTradeHistoryFromGraph(zone, dayGraph.length > 0 ? dayGraph : minuteGraph),
      listings,
   };
};
