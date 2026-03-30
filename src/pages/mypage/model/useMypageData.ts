import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { fetchMyProfile, type MemberProfile } from '@/entities/user/api/memberApi';
import { fetchMyOrders, type OrderListItem } from '@/entities/order/api/orderApi';
import { fetchMyResaleListings, type ResaleListingItem } from '@/entities/resale/api/resaleApi';
import { teams } from '@/entities/team/model/teams';
import type { PurchaseHistoryItem, SaleHistoryItem, PurchaseStatus, SaleStatus } from '../ui/HistoryCard';
import type { TicketType } from '../ui/TicketTypeBadge';

/** JWT payload 디코딩 (UTF-8 바이트 → 문자열 복원) */
const decodeJwt = (token: string): Record<string, unknown> | null => {
   try {
      const part = token.split('.')[1];
      if (!part) return null;
      const bytes = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      // UTF-8 바이트가 latin-1 문자로 들어있으므로 decodeURIComponent로 복원
      const json = decodeURIComponent(
         bytes.split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
      );
      return JSON.parse(json);
   } catch {
      return null;
   }
};

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

export const useMyProfileData = () => {
   const accessToken = useAuthStore(s => s.accessToken);
   
   const tokenInfo = useMemo(() => {
      if (!accessToken) return null;
      const payload = decodeJwt(accessToken);
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
   return useQuery({
      queryKey: ['myOrders'],
      queryFn: fetchMyOrders,
      select: (data): PurchaseHistoryItem[] => {
         return data.map((order) => {
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
               // 예약 상세 라우팅: ticketId 우선, 없으면 orderId
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
      },
   });
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
