import type { TicketType } from '../ui/TicketTypeBadge';

export type PurchaseStatus = '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
export type SaleStatus = '판매 중' | '판매 완료' | '정산 대기' | '판매 취소 대기' | '취소 대기' | '취소 완료';

export interface PurchaseHistoryItem {
   id: string;
   rawOrderId?: string;
   gameId?: string;
   orderId: string;
   orderDate: string;
   type: TicketType;
   seatGradeName?: string;
   game: {
      teams: string;
      venue: string;
      datetime: string;
      quantity: number;
      section: string;
      seats: string[];
   };
   price: number;
   paymentStatus: PurchaseStatus;
   deliveryType: string;
   canSell: boolean;
   ticketIds?: string[];
}

export interface SaleHistoryItem {
   id: string;
   orderId: string;
   orderDate: string;
   soldAt?: string;
   canceledAt?: string;
   type: TicketType;
   game: {
      teams: string;
      venue: string;
      datetime: string;
      quantity: number;
      section: string;
      seats: string[];
   };
   salePrice: number;
   saleStatus: SaleStatus;
   deliveryType: string;
   canCancel: boolean;
}

export type HistoryCardProps = ({ mode: 'purchase'; item: PurchaseHistoryItem } | { mode: 'sale'; item: SaleHistoryItem }) & {
   onResellCompleteConfirm?: () => void;
   mockTicketInfoError?: boolean;
};

export const isPurchaseHistoryItem = (
   mode: HistoryCardProps['mode'],
   _item: PurchaseHistoryItem | SaleHistoryItem,
): _item is PurchaseHistoryItem => mode === 'purchase';
