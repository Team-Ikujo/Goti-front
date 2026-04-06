import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { fetchMyProfile, MY_PROFILE_MOCK } from '@/entities/user/api/memberApi';
import { fetchMyOrders, type OrderListItem } from '@/entities/order/api/orderApi';
import {
   fetchMyResaleListingSummary,
   fetchMyResaleListings,
   type MyResaleListingSummaryResponse,
   type ResaleListingItem,
} from '@/entities/resale/api/resaleApi';
import { fetchResaleUnsettledAmount, type ResaleUnsettledAmountResponse } from '@/entities/payment/api/paymentApi';
import { teams } from '@/entities/team/model/teams';
import type { PurchaseHistoryItem, SaleHistoryItem, PurchaseStatus, SaleStatus } from '../ui/HistoryCard';
import type { TicketType } from '../ui/TicketTypeBadge';
import { formatTicketNumber } from './ticketNumber';

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

   return useQuery({
      queryKey: ['myProfile', accessToken],
      queryFn: fetchMyProfile,
      initialData: MY_PROFILE_MOCK,
      placeholderData: MY_PROFILE_MOCK,
      enabled: !!accessToken,
   });
};

export const useMyOrdersData = () => {
   const query = useQuery({
      queryKey: ['myOrders'],
      queryFn: fetchMyOrders,
   });

   const data = useMemo((): PurchaseHistoryItem[] => {
      return (query.data ?? []).map((order) => {
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
            rawOrderId: order.orderId,
            gameId: order.gameId,
            orderId: formatTicketNumber(order.orderNumber, 'ticket'),
            orderDate: formatDate(order.orderedAt),
            type: '티켓' as TicketType,
            seatGradeName: sectionLabel,
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
   return useQuery({
      queryKey: ['myResales'],
      queryFn: fetchMyResaleListings,
      select: (data): SaleHistoryItem[] => {
         return data.map((listing) => ({
            id: listing.listingId,
            orderId: formatTicketNumber(listing.ticketNumber ?? listing.ticketId, 'ticket'),
            orderDate: formatDate(listing.listedAt),
            soldAt: listing.soldAt ? formatDateTime(listing.soldAt) : undefined,
            canceledAt: listing.canceledAt ? formatDateTime(listing.canceledAt) : undefined,
            type: '리셀' as TicketType,
            game: {
               teams: listing.gameTitle || 'KBO 리그 경기',
               venue: listing.stadiumName || '야구장',
               datetime: listing.gameDate ? formatDate(listing.gameDate) : formatDate(listing.listedAt),
               quantity: 1,
               section: parseGradeName(listing.seatInfo) || '정보 없음',
               seats: [parseSeatDetail(listing.seatInfo)],
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
   return useQuery<MyResaleListingSummaryResponse>({
      queryKey: ['myResaleSummary'],
      queryFn: fetchMyResaleListingSummary,
   });
};

export const useMyResaleUnsettledAmountData = () => {
   return useQuery<ResaleUnsettledAmountResponse>({
      queryKey: ['myResaleUnsettledAmount'],
      queryFn: fetchResaleUnsettledAmount,
   });
};
