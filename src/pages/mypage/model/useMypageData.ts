import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { fetchMyProfile, fetchMyProfileSummary } from '@/entities/user/api/memberApi';
import {
   fetchMyTicketInfo,
   fetchTicketDetail,
   type MyTicketInfo,
   type TicketDetail,
} from '@/entities/ticket/api/ticketApi';
import {
   fetchMyResaleListingSummary,
   fetchMyResaleListingOrders,
   fetchResaleListingOrderDetails,
   type MyResaleListingSummaryResponse,
   type ResaleListingItem,
   type ResaleListingOrderStatus,
} from '@/entities/resale/api/resaleApi';
import {
   fetchPurchaseHistory,
   fetchResaleUnsettledAmount,
   type PurchaseHistoryItem as PaymentPurchaseHistoryItem,
   type ResaleUnsettledAmountResponse,
} from '@/entities/payment/api/paymentApi';
import type { PurchaseHistoryItem, SaleHistoryItem, PurchaseStatus, SaleStatus } from './historyCard';
import type { TicketType } from '../ui/TicketTypeBadge';
import { formatTicketNumber } from './ticketNumber';
import { STADIUM_REFERENCES } from '@/entities/game/model/schedule';
import { readStoredPaymentCompleteItems, type StoredPaymentCompleteItem } from '@/shared/lib/paymentCompleteStorage';
import { isResaleBookingMockEnabled, isResaleDemoEnabled } from '@/shared/config/runtime';

const formatDate = (dateStr: string) => {
   const date = parseDateValue(dateStr) ?? parseBookingDateTime(dateStr);
   if (!date) {
      return dateStr;
   }
   const y = date.getFullYear();
   const m = String(date.getMonth() + 1).padStart(2, '0');
   const d = String(date.getDate()).padStart(2, '0');
   return `${y}.${m}.${d}`;
};

const formatDateTime = (dateStr: string) => {
   const date = parseDateValue(dateStr);
   if (!date) {
      return formatBookingCardDateTime(dateStr);
   }
   const y = date.getFullYear();
   const m = String(date.getMonth() + 1).padStart(2, '0');
   const d = String(date.getDate()).padStart(2, '0');
   const day = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
   const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
   return `${y}.${m}.${d} (${day}) ${time}`;
};

const toISODate = (value: string) => value.replace(/\./g, '-');

/** "1루 내야지정석 109구역 A열 1번" → "1루 내야지정석" */
const parseGradeName = (seatInfo: string): string => {
   const tokens = seatInfo.split(' ');
   // "N구역" 형태의 토큰 앞까지를 등급명으로 처리
   const sectionIndex = tokens.findIndex(t => t.endsWith('구역'));
   if (sectionIndex > 0) return tokens.slice(0, sectionIndex).join(' ');
   // 구역 토큰이 없으면 행열 정보 앞까지
   const rowIndex = tokens.findIndex(t => /^[A-Z가-힣\d]+열$/.test(t));
   return rowIndex > 0 ? tokens.slice(0, rowIndex).join(' ') : (tokens[0] ?? '');
};

/** "1루 내야지정석 109구역 A열 1번" → "109구역 A열 1번" */
const parseSeatDetail = (seatInfo: string): string => {
   const tokens = seatInfo.split(' ');
   const sectionIndex = tokens.findIndex(t => t.endsWith('구역'));
   if (sectionIndex > 0) return tokens.slice(sectionIndex).join(' ');
   const rowIndex = tokens.findIndex(t => /^[A-Z가-힣\d]+열$/.test(t));
   return rowIndex > 0 ? tokens.slice(rowIndex).join(' ') : tokens.slice(1).join(' ');
};

const mapPurchaseStatus = (status: string): PurchaseStatus => {
   switch (status) {
      case 'PENDING':
         return '입금 대기';
      case 'CONFIRMED':
      case 'COMPLETED':
         return '예매 완료';
      case 'PARTIALLY_CANCELED':
         return '부분 처리';
      case 'CANCELED':
         return '취소/환불';
      default:
         return '예매 완료';
   }
};

const mapSaleStatus = (status: ResaleListingItem['listingStatus']): SaleStatus => {
   switch (status) {
      case 'LISTING': return '판매 중';
      case 'HOLD':    return '판매 중';
      case 'SOLD':    return '정산 대기';
      case 'SETTLED': return '판매 완료';
      case 'CANCEL_REQUESTED': return '취소 대기';
      case 'CANCELED': return '취소 완료';
      default: return '판매 중';
   }
};

type EnrichedOrderListItem = {
   order: PaymentPurchaseHistoryItem;
   ticketIds: string[];
   primaryTicketDetail?: TicketDetail;
};

type EnrichedResaleListingItem = ResaleListingItem & {
   orderId: string;
   orderNumber: string;
   orderStatus: ResaleListingOrderStatus;
   orderCreatedAt: string;
   ticketDetail?: TicketDetail;
};

const fetchMyOrderSummaries = async (): Promise<EnrichedOrderListItem[]> => {
   // purchases?size=100 응답의 ticketIds 필드 사용 (GET /api/v1/orders/{id}/tickets 제거)
   const purchaseHistory = await fetchPurchaseHistory({ size: 100 });
   const orders: PaymentPurchaseHistoryItem[] = purchaseHistory.list;

   return Promise.all(
      orders.map(async (order) => {
         const ticketIds = order.ticketIds ?? [];
         const primaryTicketId = ticketIds[0];
         try {
            const primaryTicketDetail = primaryTicketId ? await fetchTicketDetail(primaryTicketId) : undefined;
            return { order, ticketIds, primaryTicketDetail };
         } catch {
            return { order, ticketIds, primaryTicketDetail: undefined };
         }
      }),
   );
};

const mapStoredPaymentCompleteItemToPurchaseHistory = (item: StoredPaymentCompleteItem): PurchaseHistoryItem => {
   const seats = item.seats.length > 0
      ? item.seats.map((seatInfo) => parseSeatDetail(seatInfo))
      : Array.from({ length: item.quantity }, (_, index) => `좌석${index + 1}`);
   const primarySeatInfo = item.seats[0];
   const sectionLabel = primarySeatInfo ? parseGradeName(primarySeatInfo) : '좌석 정보';

   return {
      id: item.ticketId ?? item.orderId ?? item.orderNumber,
      rawOrderId: item.orderId,
      rawOrderDate: item.orderedAt,
      orderId: formatTicketNumber(item.orderNumber, item.orderType === 'resale' ? 'resale' : 'ticket'),
      orderDate: formatDate(item.orderedAt),
      type: item.orderType === 'resale' ? ('리셀' as TicketType) : ('티켓' as TicketType),
      seatGradeName: sectionLabel,
      game: {
         teams: item.gameTitle,
         venue: item.gameVenue,
         datetime: item.gameDate ? formatDateTime(item.gameDate) : formatDateTime(item.orderedAt),
         quantity: item.quantity,
         section: sectionLabel,
         seats,
      },
      price: item.amount,
      paymentStatus: mapPurchaseStatus(item.orderStatus ?? item.paymentStatus ?? 'CONFIRMED'),
      deliveryType: '모바일 티켓',
      canSell: item.orderType !== 'resale',
   };
};

const fetchMyResaleListingsWithGameInfo = async (): Promise<EnrichedResaleListingItem[]> => {
   const resaleOrders = await fetchMyResaleListingOrders();

   const listingGroups = await Promise.all(
      resaleOrders.list.map(async (order) => {
         try {
            const listings = await fetchResaleListingOrderDetails(order.orderId);

            return Promise.all(
               listings.map(async (listing) => {
                  try {
                     const ticketDetail = await fetchTicketDetail(listing.ticketId);

                     return {
                        ...listing,
                        orderId: order.orderId,
                        orderNumber: order.orderNumber,
                        orderStatus: order.orderStatus,
                        orderCreatedAt: order.createdAt,
                        ticketDetail,
                     };
                  } catch {
                     return {
                        ...listing,
                        orderId: order.orderId,
                        orderNumber: order.orderNumber,
                        orderStatus: order.orderStatus,
                        orderCreatedAt: order.createdAt,
                     };
                  }
               }),
            );
         } catch {
            return [];
         }
      }),
   );

   return listingGroups.flat();
};

export const useMyProfileData = () => {
   const accessToken = useAuthStore(s => s.accessToken);

   return useQuery({
      queryKey: ['myProfile', accessToken],
      queryFn: fetchMyProfile,
      enabled: !!accessToken,
   });
};

export const useMyProfileSummaryData = () => {
   const accessToken = useAuthStore(s => s.accessToken);

   return useQuery({
      queryKey: ['myProfileSummary', accessToken],
      queryFn: fetchMyProfileSummary,
      enabled: !!accessToken,
   });
};

export const useMyTicketInfoData = () => {
   const accessToken = useAuthStore(s => s.accessToken);

   return useQuery<MyTicketInfo>({
      queryKey: ['myTicketInfo', accessToken],
      queryFn: fetchMyTicketInfo,
      enabled: Boolean(accessToken),
   });
};

export const useMyOrdersData = () => {
   const accessToken = useAuthStore(s => s.accessToken);

   const query = useQuery({
      queryKey: ['myOrders', accessToken],
      queryFn: fetchMyOrderSummaries,
      enabled: Boolean(accessToken),
   });

   const data = useMemo((): PurchaseHistoryItem[] => {
      const apiOrders = (query.data ?? []).map(({ order, ticketIds, primaryTicketDetail }) => {
         const displaySeatInfos = order.seatInfos.length > 0
            ? order.seatInfos
            : primaryTicketDetail?.seatInfo
               ? [primaryTicketDetail.seatInfo]
               : [];
         const primarySeatInfo = displaySeatInfos[0];
         const sectionLabel = primaryTicketDetail?.seatGradeName
            ?? (primarySeatInfo ? parseGradeName(primarySeatInfo) : '좌석 정보');
         const seats = displaySeatInfos.length > 0
            ? displaySeatInfos.map((seatInfo) => parseSeatDetail(seatInfo))
            : Array.from({ length: order.totalQuantity }, (_, i) => `좌석${i + 1}`);
         const unitPrice = order.totalQuantity > 0
            ? Math.round(order.totalAmount / order.totalQuantity)
            : 0;
         const seatPrices = ticketIds.map(() => unitPrice);
         const gameTitle = order.gameTitle ?? primaryTicketDetail?.gameTitle ?? 'KBO 리그 경기';
         const stadiumName = primaryTicketDetail?.stadiumName
            ?? (order.stadiumId ? STADIUM_REFERENCES[order.stadiumId]?.displayName : undefined)
            ?? '야구장';
         const gameDate = order.gameDate ?? primaryTicketDetail?.gameDate;

         return {
            id: ticketIds[0] ?? order.orderId,
            rawOrderId: order.orderId,
            rawOrderDate: order.orderedAt,
            gameId: order.gameId,
            stadiumId: order.stadiumId,
            orderId: formatTicketNumber(order.orderNumber, 'ticket'),
            orderDate: formatDate(order.orderedAt),
            type: order.purchaseType === 'RESALE' ? ('리셀' as TicketType) : ('티켓' as TicketType),
            seatGradeName: sectionLabel,
            game: {
               teams: gameTitle,
               venue: stadiumName,
               datetime: gameDate
                  ? formatDateTime(gameDate)
                  : formatDateTime(order.orderedAt),
               quantity: order.totalQuantity,
               section: sectionLabel,
               seats,
            },
            price: order.totalAmount,
            paymentStatus: mapPurchaseStatus(order.orderStatus),
            deliveryType: '모바일 티켓',
            canSell: order.purchaseType !== 'RESALE' && (order.orderStatus === 'CONFIRMED' || order.orderStatus === 'COMPLETED'),
            ticketIds: ticketIds.length > 0 ? ticketIds : undefined,
            seatPrices: seatPrices.length > 0 ? seatPrices : undefined,
         };
      });

      const storedResaleOrders =
         isResaleDemoEnabled || isResaleBookingMockEnabled
            ? readStoredPaymentCompleteItems()
                 .filter((item) => item.orderType === 'resale')
                 .filter((item) => item.orderId || item.orderNumber)
                 .filter((item) =>
                    !apiOrders.some((order) =>
                       Boolean(item.orderId) && (order.rawOrderId === item.orderId || order.id === item.orderId),
                    ),
                 )
                 .map(mapStoredPaymentCompleteItemToPurchaseHistory)
            : [];

      return [...apiOrders, ...storedResaleOrders];
   }, [query.data]);

   const sortedData = useMemo(() => {
      return [...data].sort((left, right) => {
         return toISODate(right.orderDate).localeCompare(toISODate(left.orderDate));
      });
   }, [data]);

   return {
      ...query,
      data: sortedData,
   };
};

export const useMyResaleListData = () => {
   const accessToken = useAuthStore(s => s.accessToken);

   return useQuery({
      queryKey: ['myResales', accessToken],
      queryFn: fetchMyResaleListingsWithGameInfo,
      enabled: Boolean(accessToken),
      select: (data): SaleHistoryItem[] => {
      return data.map((listing) => ({
           id: listing.listingId,
            ticketId: listing.ticketId,
            orderId: formatTicketNumber(listing.orderNumber ?? listing.ticketDetail?.ticketNumber ?? listing.ticketNumber ?? listing.ticketId, 'resale'),
            orderDate: formatDate(listing.orderCreatedAt ?? listing.listedAt),
            soldAt: listing.soldAt ? formatDateTime(listing.soldAt) : undefined,
            canceledAt: listing.canceledAt ? formatDateTime(listing.canceledAt) : undefined,
            type: '리셀' as TicketType,
            game: {
               teams: listing.ticketDetail?.gameTitle || listing.gameTitle || 'KBO 리그 경기',
               venue: listing.ticketDetail?.stadiumName || listing.stadiumName || '야구장',
               datetime: listing.ticketDetail?.gameDate
                  ? formatDate(listing.ticketDetail.gameDate)
                  : listing.gameDate
                     ? formatDate(listing.gameDate)
                     : formatDate(listing.orderCreatedAt ?? listing.listedAt),
               quantity: 1,
               section:
                  listing.ticketDetail?.seatGradeName
                  ?? (parseGradeName(listing.ticketDetail?.seatInfo ?? listing.seatInfo) || '정보 없음'),
               seats: [parseSeatDetail(listing.ticketDetail?.seatInfo ?? listing.seatInfo)],
            },
            salePrice: listing.listingPrice,
            saleStatus: mapSaleStatus(listing.listingStatus),
            deliveryType: '모바일 티켓',
            canCancel: listing.listingStatus === 'LISTING' || listing.listingStatus === 'CANCEL_REQUESTED',
         }));
      },
   });
};

export const useMyResaleSummaryData = () => {
   const currentUserId = useAuthStore(s => s.currentUserId);

   return useQuery<MyResaleListingSummaryResponse>({
      queryKey: ['myResaleSummary', currentUserId],
      queryFn: () => fetchMyResaleListingSummary(currentUserId!),
      enabled: Boolean(currentUserId),
   });
};

export const useMyResaleUnsettledAmountData = () => {
   const currentUserId = useAuthStore(s => s.currentUserId);

   return useQuery<ResaleUnsettledAmountResponse>({
      queryKey: ['myResaleUnsettledAmount', currentUserId],
      queryFn: () => fetchResaleUnsettledAmount(currentUserId!),
      enabled: Boolean(currentUserId),
   });
};
