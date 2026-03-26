import { useQuery } from '@tanstack/react-query';
import { fetchMyProfile } from '@/entities/user/api/memberApi';
import { fetchMyOrders, type OrderListItem } from '@/entities/order/api/orderApi';
import { fetchMyResaleListings, type ResaleListingItem } from '@/entities/resale/api/resaleApi';
import { teams } from '@/entities/team/model/teams';
import type { PurchaseHistoryItem, SaleHistoryItem, PurchaseStatus, SaleStatus } from '../ui/HistoryCard';
import type { TicketType } from '../ui/TicketTypeBadge';

const teamUuidMap = Object.fromEntries(teams.map((t) => [t.serverTeamId, t.name]));
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
      case 'LISTING':
         return '판매 중';
      case 'SOLD':
         return '판매 완료';
      case 'SETTLED':
         return '판매 완료'; // Or add a settled status if needed
      case 'HOLD':
         return '판매 중'; // Holding for someone
      case 'CANCELED':
         return '정산 대기'; // This might be wrong, need to check business logic
      default:
         return '판매 중';
   }
};

export const useMyProfileData = () => {
   return useQuery({
      queryKey: ['myProfile'],
      queryFn: fetchMyProfile,
   });
};

export const useMyOrdersData = () => {
   return useQuery({
      queryKey: ['myOrders'],
      queryFn: fetchMyOrders,
      select: (data): PurchaseHistoryItem[] => {
         return data.map((order) => {
            const homeTeamName = order.homeTeamName ?? teamUuidMap[order.stadiumId];
            const awayTeamName = order.awayTeamName;
            const gameTitle =
               homeTeamName && awayTeamName
                  ? `${awayTeamName} vs ${homeTeamName}`
                  : homeTeamName
                     ? `${homeTeamName} 홈경기`
                     : 'KBO 리그 경기';

            const venueDisplay =
               order.stadiumName ??
               teamStadiumMap[order.stadiumId] ??
               '야구장';

            const gameDateTime = order.gameStartAt
               ? formatDateTime(order.gameStartAt)
               : formatDate(order.orderedAt);

            return {
               id: order.ticketId ?? order.orderId,
               orderId: order.orderNumber,
               orderDate: formatDate(order.orderedAt),
               type: '티켓' as TicketType,
               game: {
                  teams: gameTitle,
                  venue: venueDisplay,
                  datetime: gameDateTime,
                  quantity: order.totalQuantity,
                  section: order.seatGradeName ?? '좌석 정보',
                  seats: order.seatInfos?.length
                     ? order.seatInfos
                     : Array.from({ length: order.totalQuantity }, (_, i) => `${order.seatGradeName ?? '좌석'} ${i + 1}`),
               },
               price: order.totalAmount,
               paymentStatus: mapPurchaseStatus(order.orderStatus),
               deliveryType: '모바일 티켓',
               canSell: order.orderStatus === 'CONFIRMED',
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
            orderId: listing.listingId.slice(0, 8).toUpperCase(), // Placeholder
            orderDate: formatDate(listing.listedAt),
            type: '리셀' as TicketType,
            game: {
               teams: '경기 정보 조회 중...',
               venue: '장소 조회 중...',
               datetime: formatDate(listing.listedAt),
               quantity: 1,
               section: listing.seatInfo.split(' ')[0] || '정보 없음',
               seats: [listing.seatInfo.split(' ').slice(1).join(' ')],
            },
            salePrice: listing.listingPrice,
            saleStatus: mapSaleStatus(listing.listingStatus),
            deliveryType: '모바일 티켓',
            canCancel: listing.listingStatus === 'LISTING',
         }));
      },
   });
};
