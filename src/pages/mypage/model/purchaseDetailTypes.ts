// src/pages/mypage/model/purchaseDetailTypes.ts
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
