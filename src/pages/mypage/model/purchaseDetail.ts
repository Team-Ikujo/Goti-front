import type { BadgeVariant } from '../ui/StatusBadge';
import type { TicketItemStatus } from '../ui/TicketItem';

export type PurchaseStatus = '예매 완료' | '관람 완료' | '취소/환불';
export type PaymentEventType = '결제 완료';

export type PurchaseSeatItem = {
   ticketId: string;
   orderId: string;
   section: string;
   seatDetail: string;
   status: TicketItemStatus;
   price: number;
};

export type PurchasePaymentSummary = {
   status: string;
   ticketCount: number;
   ticketAmount: number;
   fee: number;
   total: number;
   date?: string;
   bankAccount?: string;
   bankDeadline?: string;
};

export type PurchaseRefundInfo = {
   ticketAmount: number;
   cancelFee: number;
   refundTotal: number;
   method: string;
   date?: string;
};

export type PurchaseDetailViewModel = {
   id: string;
   rawOrderId: string;
   overallStatus: PurchaseStatus;
   ticketStatus: string;
   game: {
      teams: string;
      venue: string;
      datetime: string;
   };
   orderId: string;
   orderDate?: string;
   orderer: string;
   issuedAt?: string;
   cancelDeadline?: string;
   cancelDate?: string;
   seatInfo: string;
   ticketPrice: number;
   paymentMethodDisplay: string | undefined;
   paidAt?: string;
   seatItems: PurchaseSeatItem[];
   paymentSummary: PurchasePaymentSummary;
   paymentEvents: Array<{ type: PaymentEventType; method: string }>;
   refundInfo?: PurchaseRefundInfo;
   canCancel: boolean;
   canSell: boolean;
   deliveryMethod: string;
   deliveryAddress?: string;
   deliveryStatus?: string;
   deliveryCarrier?: string;
   deliveryTrackingNumber?: string;
};

export const PURCHASE_BADGE: Record<string, BadgeVariant> = {
   ISSUED: 'success',
   USED: 'disabled',
   INVALID: 'warning',
   RESALE_ISSUED: 'success',
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const mapStatusLabel = (status: string): string => {
   switch (status) {
      case 'ISSUED':
         return '예매 완료';
      case 'USED':
         return '관람 완료';
      case 'INVALID':
         return '취소/환불';
      case 'RESALE_ISSUED':
         return '예매 완료';
      default:
         return '예매 완료';
   }
};

export const parseDateValue = (value: string | undefined | null) => {
   if (!value) {
      return null;
   }

   const normalizedForDate = value.replace(/\.\s/g, '.').replace(/\.$/, '').trim();
   const directDate = new Date(normalizedForDate);
   if (!Number.isNaN(directDate.getTime())) {
      return directDate;
   }

   const normalized = value
      .replace(/\s+/g, ' ')
      .replace(/\(([^)]+)\)/g, '')
      .replace(/\.\s/g, '.')
      .replace(/\.$/, '')
      .trim();

   const match = normalized.match(
      /^(\d{4})\.(\d{2})\.(\d{2})(?:\s(?:(오전|오후)\s(\d{1,2}):(\d{2})(?::(\d{2}))?|(\d{1,2}):(\d{2})(?::(\d{2}))?))?$/,
   );

   if (!match) {
      return null;
   }

   const [, year, month, day, meridiem, meridiemHour, meridiemMinute, meridiemSecond, hour24, minute24, second24] =
      match;
   let hours = Number(meridiemHour ?? hour24 ?? 0);
   const minutes = Number(meridiemMinute ?? minute24 ?? 0);
   const seconds = Number(meridiemSecond ?? second24 ?? 0);

   if (meridiem === '오후' && hours < 12) {
      hours += 12;
   }

   if (meridiem === '오전' && hours === 12) {
      hours = 0;
   }

   return new Date(Number(year), Number(month) - 1, Number(day), hours, minutes, seconds);
};

export const formatDateTime = (isoStr: string): string => {
   const date = parseDateValue(isoStr);

   if (!date) {
      return '-';
   }

   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   const weekDay = DAYS[date.getDay()];
   const hours = String(date.getHours()).padStart(2, '0');
   const minutes = String(date.getMinutes()).padStart(2, '0');
   return `${year}.${month}.${day} (${weekDay}) ${hours}:${minutes}`;
};

export const parseGradeName = (seatInfo: string): string => {
   const tokens = seatInfo.split(' ');
   const sectionIndex = tokens.findIndex(token => token.endsWith('구역'));
   if (sectionIndex > 0) {
      return tokens.slice(0, sectionIndex).join(' ');
   }

   const rowIndex = tokens.findIndex(token => /^[A-Z가-힣\d]+열$/.test(token));
   return rowIndex > 0 ? tokens.slice(0, rowIndex).join(' ') : (tokens[0] ?? '');
};

export const getFallbackCancelableUntil = (orderedAt: string | undefined) => {
   const orderedDate = parseDateValue(orderedAt);

   if (!orderedDate) {
      return undefined;
   }

   return new Date(orderedDate.getFullYear(), orderedDate.getMonth(), orderedDate.getDate(), 23, 59, 0).toISOString();
};

export const formatGameTitle = (value: string) => {
   const [left, right] = value.split(/\s+vs\s+/i);

   if (!left || !right) {
      return value.trim();
   }

   return `${left.trim()} vs ${right.trim()}`;
};

export const mapOverallStatus = (status: string): PurchaseStatus => {
   switch (status) {
      case 'ISSUED':
         return '예매 완료';
      case 'USED':
         return '관람 완료';
      case 'INVALID':
         return '취소/환불';
      case 'RESALE_ISSUED':
         return '예매 완료';
      default:
         return '예매 완료';
   }
};

export const mapTicketItemStatus = (status: string): TicketItemStatus => {
   switch (status) {
      case 'ISSUED':
         return '예매완료';
      case 'USED':
         return '취소대기';
      case 'INVALID':
         return '취소완료';
      case 'RESALE_ISSUED':
         return '예매완료';
      default:
         return '예매완료';
   }
};

export const formatPrice = (amount: number): string => `${amount.toLocaleString()}원`;
