import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { fetchMyProfile, type MemberProfile } from '@/entities/user/api/memberApi';
import { fetchMyOrders, type OrderListItem } from '@/entities/order/api/orderApi';
import { fetchMyResaleListings, type ResaleListingItem } from '@/entities/resale/api/resaleApi';
import { decodeJwtPayload } from '@/shared/lib/jwt';
import { readStoredPaymentCompleteItems } from '@/shared/lib/paymentCompleteStorage';
import { teams } from '@/entities/team/model/teams';
import type { PurchaseHistoryItem, SaleHistoryItem, PurchaseStatus, SaleStatus } from '../ui/HistoryCard';
import type { TicketType } from '../ui/TicketTypeBadge';
import type { PaymentResponse } from '@/pages/tickets/api/paymentApi';

const teamStadiumMap = Object.fromEntries(teams.map((t) => [t.serverTeamId, t.stadiumName]));

const formatDate = (dateStr: string) => {
   const date = new Date(dateStr);
   const y = date.getFullYear();
   const m = String(date.getMonth() + 1).padStart(2, '0');
   const d = String(date.getDate()).padStart(2, '0');
   return `${y}.${m}.${d}`;
};

const formatDateTime = (dateStr: string) => {
   const date = new Date(dateStr);
   const y = date.getFullYear();
   const m = String(date.getMonth() + 1).padStart(2, '0');
   const d = String(date.getDate()).padStart(2, '0');
   const day = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
   const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
   return `${y}.${m}.${d} (${day}) ${time}`;
};

const toISODate = (value: string) => value.replace(/\./g, '-');

const mapPurchaseStatus = (status: OrderListItem['orderStatus']): PurchaseStatus => {
   switch (status) {
      case 'PENDING':
         return '입금 대기';
      case 'CONFIRMED':
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

const mapStoredPaymentToPurchaseHistory = (payment: PaymentResponse): PurchaseHistoryItem => {
   const primarySeat = payment.seats[0] ?? '좌석 정보';
   const [section, ...seatDetailTokens] = primarySeat.split(' ');

   return {
      id: payment.orderId ?? payment.orderNumber,
      orderId: payment.orderNumber,
      orderDate: formatDate(payment.paidAt ?? payment.orderedAt),
      type: payment.orderType === 'resale' ? '리셀' : '티켓',
      game: {
         teams: payment.gameTitle,
         venue: payment.gameVenue,
         datetime: payment.gameDate,
         quantity: payment.quantity,
         section,
         seats: seatDetailTokens.length > 0 ? [seatDetailTokens.join(' ')] : payment.seats,
      },
      price: payment.amount,
      paymentStatus: '예매 완료',
      deliveryType: '모바일 티켓',
      canSell: payment.orderType !== 'resale',
   };
};

export const useMyProfileData = () => {
   const accessToken = useAuthStore(s => s.accessToken);
   
   const tokenInfo = useMemo(() => {
      if (!accessToken) return null;
      const payload = decodeJwtPayload(accessToken);
      // 토큰에 담긴 실제 로그인 정보를 추출
      return {
         name: payload?.name || '사용자',
         mobile: payload?.mobile || '010-0000-0000',
         email: payload?.email || payload?.sub || 'goti1234@google.com',
      } as MemberProfile;
   }, [accessToken]);

   return useQuery({
      queryKey: ['myProfile', accessToken],
      queryFn: fetchMyProfile,
      placeholderData: tokenInfo || undefined,
      enabled: !!accessToken,
   });
};

export const useMyOrdersData = () => {
   const [storageVersion, setStorageVersion] = useState(0);

   useEffect(() => {
      const refreshStoredPayments = () => {
         setStorageVersion((previous) => previous + 1);
      };

      window.addEventListener('focus', refreshStoredPayments);
      window.addEventListener('pageshow', refreshStoredPayments);

      return () => {
         window.removeEventListener('focus', refreshStoredPayments);
         window.removeEventListener('pageshow', refreshStoredPayments);
      };
   }, []);

   const query = useQuery({
      queryKey: ['myOrders'],
      queryFn: fetchMyOrders,
      placeholderData: (previousData) => previousData,
   });

   const data = useMemo((): PurchaseHistoryItem[] => {
      void storageVersion;

      const apiItems = (query.data ?? []).map((order) => {
         const stadiumName = order.stadiumName || teamStadiumMap[order.stadiumId] || '야구장';
         const gameTitle = order.homeTeamName && order.awayTeamName
            ? `${order.awayTeamName} vs ${order.homeTeamName}`
            : order.homeTeamName
               ? `${order.homeTeamName} 홈경기`
               : 'KBO 리그 경기';
         const sectionLabel = order.seatGradeName ?? '좌석 정보';
         const seats = order.seatInfos?.length
            ? order.seatInfos
            : Array.from({ length: order.totalQuantity }, (_, i) => `좌석${i + 1}`);
         return {
            id: order.ticketId ?? order.orderId,
            orderId: order.orderNumber,
            orderDate: formatDate(order.orderedAt),
            type: '티켓' as TicketType,
            game: {
               teams: gameTitle,
               venue: stadiumName,
               datetime: formatDate(order.gameStartAt ?? order.orderedAt),
               quantity: order.totalQuantity,
               section: sectionLabel,
               seats,
            },
            price: order.totalAmount,
            paymentStatus: mapPurchaseStatus(order.orderStatus),
            deliveryType: '모바일 티켓',
            canSell: order.orderStatus === 'CONFIRMED',
            ticketIds: order.ticketIds?.length ? order.ticketIds : (order.ticketId ? [order.ticketId] : undefined),
         };
      });

      const storedItems = readStoredPaymentCompleteItems()
         .filter((payment) => {
            const paymentIdentity = payment.orderId ?? payment.orderNumber;

            return !apiItems.some((item) => item.id === paymentIdentity || item.orderId === payment.orderNumber);
         })
         .map(mapStoredPaymentToPurchaseHistory);

      return [...storedItems, ...apiItems].sort((left, right) => {
         return toISODate(right.orderDate).localeCompare(toISODate(left.orderDate));
      });
   }, [query.data, storageVersion]);

   return {
      ...query,
      data,
   };
};

export const useMyResaleListData = () => {
   return useQuery({
      queryKey: ['myResales'],
      queryFn: fetchMyResaleListings,
      select: (data): SaleHistoryItem[] => {
         return data.map((listing) => ({
            id: listing.listingId,
            orderId: listing.listingId.replace(/^listing-/i, '').slice(0, 8).toUpperCase(),
            orderDate: formatDate(listing.listedAt),
            type: '리셀' as TicketType,
            game: {
               teams: listing.gameTitle || 'KBO 리그 경기',
               venue: listing.stadiumName || '야구장',
               datetime: listing.gameDate ? formatDate(listing.gameDate) : formatDate(listing.listedAt),
               quantity: 1,
               section: listing.seatInfo.split(' ')[0] || '정보 없음',
               seats: [listing.seatInfo.split(' ').slice(1).join(' ')],
            },
            salePrice: listing.listingPrice,
            saleStatus: mapSaleStatus(listing.listingStatus),
            deliveryType: '모바일 티켓',
            canCancel: listing.listingStatus === 'LISTING' || listing.listingStatus === 'CANCEL_REQUESTED',
         }));
      },
   });
};
