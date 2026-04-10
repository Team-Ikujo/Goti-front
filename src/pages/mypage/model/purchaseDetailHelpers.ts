// src/pages/mypage/model/purchaseDetailHelpers.ts
import type { BadgeVariant } from '../ui/StatusBadge';
import type { TicketItemStatus } from '../ui/TicketItem';
import type { PurchaseStatus } from './purchaseDetailTypes';

export const PURCHASE_BADGE: Record<string, BadgeVariant> = {
   ISSUED: 'success',
   USED: 'disabled',
   INVALID: 'warning',
   RESALE_ISSUED: 'success',
};

export const mapStatusLabel = (status: string): string => {
   switch (status) {
      case 'ISSUED':       return '예매 완료';
      case 'USED':         return '관람 완료';
      case 'INVALID':      return '취소/환불';
      case 'RESALE_ISSUED': return '예매 완료';
      default:             return '예매 완료';
   }
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const parseDateValue = (value: string | undefined | null): Date | null => {
   if (!value) return null;

   const normalizedForDate = value.replace(/\.\s/g, '.').replace(/\.$/, '').trim();
   const directDate = new Date(normalizedForDate);
   if (!Number.isNaN(directDate.getTime())) return directDate;

   // "YYYY-MM-DD HH:mm:ss" 등 공백으로 구분된 날짜시간 포맷 처리
   const withT = normalizedForDate.replace(' ', 'T');
   const dateWithT = new Date(withT);
   if (!Number.isNaN(dateWithT.getTime())) return dateWithT;

   const normalized = value
      .replace(/\s+/g, ' ')
      .replace(/\(([^)]+)\)/g, '')
      .replace(/\.\s/g, '.')
      .replace(/\.$/, '')
      .trim();

   const match = normalized.match(
      /^(\d{4})\.(\d{2})\.(\d{2})(?:\s(?:(오전|오후)\s(\d{1,2}):(\d{2})(?::(\d{2}))?|(\d{1,2}):(\d{2})(?::(\d{2}))?))?$/,
   );

   if (!match) return null;

   const [, year, month, day, meridiem, meridiemHour, meridiemMinute, meridiemSecond, hour24, minute24, second24] =
      match;
   let hours = Number(meridiemHour ?? hour24 ?? 0);
   const minutes = Number(meridiemMinute ?? minute24 ?? 0);
   const seconds = Number(meridiemSecond ?? second24 ?? 0);

   if (meridiem === '오후' && hours < 12) hours += 12;
   if (meridiem === '오전' && hours === 12) hours = 0;

   return new Date(Number(year), Number(month) - 1, Number(day), hours, minutes, seconds);
};

export const formatDateTime = (isoStr: string): string => {
   const d = parseDateValue(isoStr);
   if (!d) return '-';
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   const dow = DAYS[d.getDay()];
   const h = String(d.getHours()).padStart(2, '0');
   const min = String(d.getMinutes()).padStart(2, '0');
   return `${y}.${m}.${day} (${dow}) ${h}:${min}`;
};

export const parseGradeName = (seatInfo: string): string => {
   const tokens = seatInfo.split(' ');
   const sectionIndex = tokens.findIndex(token => token.endsWith('구역'));
   if (sectionIndex > 0) return tokens.slice(0, sectionIndex).join(' ');
   const rowIndex = tokens.findIndex(token => /^[A-Z가-힣\d]+열$/.test(token));
   return rowIndex > 0 ? tokens.slice(0, rowIndex).join(' ') : (tokens[0] ?? '');
};

export const getFallbackCancelableUntil = (orderedAt: string | undefined): string | undefined => {
   const orderedDate = parseDateValue(orderedAt);
   if (!orderedDate) return undefined;
   return new Date(
      orderedDate.getFullYear(),
      orderedDate.getMonth(),
      orderedDate.getDate(),
      23, 59, 0,
   ).toISOString();
};

export const formatGameTitle = (value: string): string => {
   const [left, right] = value.split(/\s+vs\s+/i);
   if (!left || !right) return value.trim();
   return `${left.trim()} vs ${right.trim()}`;
};

export const mapOverallStatus = (status: string): PurchaseStatus => {
   switch (status) {
      case 'ISSUED':        return '예매 완료';
      case 'USED':          return '관람 완료';
      case 'INVALID':       return '취소/환불';
      case 'RESALE_ISSUED': return '예매 완료';
      default:              return '예매 완료';
   }
};

export const mapTicketItemStatus = (status: string): TicketItemStatus => {
   switch (status) {
      case 'ISSUED':        return '예매완료';
      case 'USED':          return '취소대기';
      case 'INVALID':       return '취소완료';
      case 'RESALE_ISSUED': return '예매완료';
      default:              return '예매완료';
   }
};

export const formatPrice = (amount: number): string => `${amount.toLocaleString()}원`;
