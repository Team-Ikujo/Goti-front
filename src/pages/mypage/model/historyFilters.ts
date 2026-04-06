export type HistoryTab = 'purchase' | 'sale';
export type PurchaseStatusFilter = '전체' | '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
export type SaleStatusFilter = '전체' | '판매 중' | '정산 대기' | '판매 완료' | '취소 대기' | '취소 완료';
export type PeriodFilter = '전체 내역' | '1개월' | '3개월' | '6개월' | '직접설정';
export type PurchaseTypeFilter = '전체 내역' | '리셀' | '예매';
export type SaleTypeFilter = '리셀';

export const PURCHASE_STATUS_CHIPS: PurchaseStatusFilter[] = [
   '전체',
   '예매 완료',
   '취소/환불',
   '입금 대기',
   '부분 처리',
   '관람 완료',
];

export const SALE_STATUS_CHIPS: SaleStatusFilter[] = [
   '전체',
   '판매 중',
   '판매 완료',
   '정산 대기',
   '취소 대기',
   '취소 완료',
];

export const PERIOD_OPTIONS: PeriodFilter[] = ['전체 내역', '1개월', '3개월', '6개월', '직접설정'];
export const PURCHASE_TYPE_OPTIONS: PurchaseTypeFilter[] = ['전체 내역', '리셀', '예매'];
export const SALE_TYPE_OPTIONS: SaleTypeFilter[] = ['리셀'];
export const ITEMS_PER_PAGE = 5;

export const toISODate = (value: string) => value.replace(/\./g, '-');
export const toInput = (date: Date) => date.toISOString().slice(0, 10);

export const calcPeriodDates = (period: PeriodFilter, dataMinDate?: string) => {
   const today = new Date();
   if (period === '직접설정') {
      return { start: '', end: '' };
   }
   if (period === '전체 내역') {
      return { start: dataMinDate || toInput(new Date(2025, 0, 1)), end: toInput(today) };
   }

   const months = period === '1개월' ? 1 : period === '3개월' ? 3 : 6;
   const start = new Date(today);
   start.setMonth(start.getMonth() - months);
   return { start: toInput(start), end: toInput(today) };
};
