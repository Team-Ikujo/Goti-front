// src/pages/tickets/ui/payment/types.ts

export type PaymentMethod = 'card' | 'kakao' | 'naver' | 'toss' | 'bank';

export type CashReceiptType = 'income' | 'expense' | 'none';
export type CashReceiptNumType = 'phone' | 'card';

export interface OrderInfo {
   matchTitle: string;
   dateTime: string;
   quantity: number;
   seats: string[];
   deliveryLabel: string;
   paymentLabel: string;
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
   card: '신용/체크카드',
   kakao: '카카오페이',
   naver: '네이버페이',
   toss: '토스페이',
   bank: '무통장 입금',
};
