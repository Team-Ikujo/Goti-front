// src/pages/mypage/ui/SaleDetailPage.tsx

import { useMemo, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchResaleListingDetail, cancelResaleListing } from '@/entities/resale/api/resaleApi';
import type { SaleHistoryItem } from './HistoryCard';
import StatusBadge from './StatusBadge';
import type { BadgeVariant } from './StatusBadge';
import TicketItem from './TicketItem';
import InfoItem from './InfoItem';
import { formatTicketNumber } from '../model/ticketNumber';

// ─── 상태 → 배지 변형 매핑 ─────────────────────────────────────

type SaleStatus = '판매 중' | '정산 대기' | '판매 완료' | '취소 대기' | '취소 완료';

const SALE_BADGE: Record<SaleStatus, BadgeVariant> = {
   '판매 중': 'success',
   '정산 대기': 'warning',
   '판매 완료': 'success',
   '취소 대기': 'disabled',
   '취소 완료': 'disabled',
};

const mapSaleStatus = (status: string): SaleStatus => {
   switch (status) {
      case 'LISTING':
         return '판매 중';
      case 'HOLD':
         return '판매 중';
      case 'SOLD':
         return '정산 대기';
      case 'SETTLED':
         return '판매 완료';
      case 'CANCEL_REQUESTED':
         return '취소 대기';
      case 'CANCELED':
         return '취소 완료';
      default:
         return '판매 중';
   }
};

const FEE_RATE = 5;

// ─── 로컬 서브 컴포넌트 ────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
   return (
      <div className={`border border-[#e9ebee] rounded-2xl p-[25px] flex flex-col gap-6 ${className}`}>{children}</div>
   );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────

export default function SaleDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const queryClient = useQueryClient();

   const {
      data: apiDetail,
      isLoading,
      isError,
   } = useQuery({
      queryKey: ['resaleListingDetail', id],
      queryFn: () => fetchResaleListingDetail(id!),
      enabled: !!id,
   });

   const { mutate: cancelListing, isPending: isCanceling } = useMutation({
      mutationFn: () => cancelResaleListing(id!),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['resaleListingDetail', id] });
         queryClient.invalidateQueries({ queryKey: ['myResales'] });
      },
   });

   const saleHistoryFallback = useMemo(() => {
      const cachedSaleItems = queryClient.getQueryData<SaleHistoryItem[]>(['myResales']) ?? [];
      return cachedSaleItems.find(item => item.id === id);
   }, [id, queryClient]);

   if (isLoading) return <div className="py-24 text-center text-body-1-regular">정보를 불러오는 중입니다...</div>;
   if ((isError || !apiDetail) && !saleHistoryFallback) {
      return (
         <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-body-1-regular text-muted-foreground">판매 내역을 찾을 수 없습니다.</p>
            <Button variant="tertiary" onClick={() => navigate('/mypage')}>
               마이페이지로 돌아가기
            </Button>
         </div>
      );
   }

   const overallStatus = mapSaleStatus(apiDetail?.listingStatus ?? 'LISTING');
   const isCancelPending = overallStatus === '취소 대기' || overallStatus === '취소 완료';
   const isSoldComplete = overallStatus === '판매 완료';
   const seatInfo = apiDetail?.seatInfo ?? saleHistoryFallback?.game.seats[0] ?? '좌석 정보';
   const ticketNumber = formatTicketNumber(
      apiDetail?.ticketNumber ?? apiDetail?.ticketId ?? saleHistoryFallback?.orderId,
      'ticket',
   );
   const listingIdLabel = apiDetail?.listingId.slice(0, 8).toUpperCase() ?? saleHistoryFallback?.id ?? '-';
   const gameTitle = apiDetail?.gameTitle ?? saleHistoryFallback?.game.teams ?? 'KBO 리그 경기';
   const gameDate = apiDetail?.gameDate ?? saleHistoryFallback?.game.datetime ?? '-';
   const stadiumName = apiDetail?.stadiumName ?? saleHistoryFallback?.game.venue ?? '-';
   const listedAt = apiDetail?.listedAt ?? saleHistoryFallback?.orderDate ?? '-';

   const seatItem = {
      orderId: ticketNumber,
      section: seatInfo.split(' ')[0] ?? '',
      seatDetail: seatInfo,
      status: isCancelPending ? '판매취소' : '판매중',
      price: apiDetail?.listingPrice ?? saleHistoryFallback?.salePrice ?? 0,
   } as const;

   const salePrice = apiDetail?.listingPrice ?? saleHistoryFallback?.salePrice ?? 0;
   const estimatedFee = -Math.round((salePrice * FEE_RATE) / 100);
   const estimatedTotal = salePrice + estimatedFee;

   return (
      <div className="flex flex-col items-center pt-12.5 pb-30 px-4">
         <div className="flex flex-col gap-14 w-full max-w-[760px] min-w-[335px]">
            {/* 제목 */}
            <div className="flex items-center gap-4">
               <h1 className="text-[32px] font-bold text-[#111827] tracking-[-0.032px] leading-[1.45]">
                  판매내역 상세
               </h1>
            </div>

            <div className="flex flex-col gap-12">
               {/* 경기 정보 */}
               <SectionCard>
                  <StatusBadge label={overallStatus} variant={SALE_BADGE[overallStatus]} />
                  <div className="flex flex-col gap-4">
                     <p className="text-[32px] font-bold text-[#161d24] tracking-[-0.032px] leading-[1.45]">
                        {gameTitle}
                     </p>
                     <div className="flex flex-col gap-1 text-[18px] font-medium text-[#374553]">
                        <p className="leading-[1.55]">{gameDate}</p>
                        <p className="leading-[1.55]">{stadiumName}</p>
                     </div>
                  </div>
               </SectionCard>

               {/* 취소 대기: 취소 정보 / 그 외: 판매 정보 */}
               {isCancelPending ? (
                  <InfoItem
                     heading="취소 정보"
                     rows={[
                        { label: '등록번호', value: listingIdLabel },
                        { label: '취소일시', value: apiDetail?.canceledAt ?? '-' },
                     ]}
                     helperTexts={[
                        '• 판매 취소된 티켓은 예매 내역에서 확인하실 수 있습니다.',
                        '• 문의사항은 고객센터로 문의해주세요.',
                     ]}
                  />
               ) : (
                  <InfoItem
                     heading="판매 정보"
                     rows={[
                        { label: '등록번호', value: listingIdLabel },
                        { label: '판매일시', value: listedAt },
                        ...(isSoldComplete ? [{ label: '정산일시', value: listedAt }] : []),
                     ]}
                     helperTexts={[
                        isSoldComplete
                           ? '• 정산이 완료되었습니다.'
                           : '• 은행 영업일 기준 1~3일 이내 처리될 예정입니다. 문의사항은 고객센터로 문의해 주세요.',
                     ]}
                  />
               )}

               {/* 좌석 정보 */}
               <SectionCard>
                  <h2 className="text-[20px] font-bold text-[#161d24] leading-[1.5]">
                     {isCancelPending ? '판매 취소된 좌석' : '좌석 정보'}
                  </h2>
                  <div className="flex flex-col">
                     <div>
                        <Separator className="hidden" />
                        <TicketItem
                           orderId={seatItem.orderId}
                           section={seatItem.section}
                           seatDetail={seatItem.seatDetail}
                           status={seatItem.status}
                           price={seatItem.price}
                        />
                     </div>
                  </div>
               </SectionCard>

               {/* 정산 금액 — 취소 대기에서는 숨김 */}
               {!isCancelPending && (
                  <InfoItem
                     type="payment"
                     heading="정산 금액"
                     statusText={isSoldComplete ? '정산 완료' : '정산 대기'}
                     statusColor={isSoldComplete ? 'text-primary' : 'text-muted-foreground'}
                     summaryRows={[
                        { label: '티켓 금액 (1매)', amount: salePrice },
                        { label: `수수료(${FEE_RATE}%)`, amount: estimatedFee },
                     ]}
                     totalLabel="예상 정산 금액"
                     totalAmount={estimatedTotal}
                     infoRows={[]}
                  />
               )}
            </div>

            {/* 판매 취소 버튼 — 판매 중일 때만 */}
            {Boolean(apiDetail?.isCancelable ?? saleHistoryFallback?.canCancel) && (
               <Button
                  variant="tertiary"
                  className="w-full py-3"
                  disabled={isCanceling}
                  onClick={() => cancelListing()}
               >
                  {isCanceling ? '처리 중...' : '판매 취소하기'}
               </Button>
            )}

            {/* 유의사항 — 판매 중일 때만 */}
            {overallStatus === '판매 중' && (
               <div className="bg-surface rounded-[14px] p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-1">
                     <AlertCircle size={20} className="text-[#161d24] shrink-0" />
                     <h3 className="text-[18px] font-bold text-[#161d24] leading-[1.55]">유의사항</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                     <h4 className="text-body-1-bold text-[#374553] leading-[1.5]">판매 등록 해지 안내</h4>
                     <div className="flex flex-col gap-0.5 text-body-2-regular text-[#374553]">
                        <p>• 등록 후 1시간 이내 해지 시 즉시 해지되며, 별도 제한 없이 이용 가능합니다.</p>
                        <p>• 등록 후 1시간 이후 해지 시 해지 시점부터 6시간 동안 해당 티켓의 기능들이 제한됩니다.</p>
                        <p>• 제한 시간 동안 해당 티켓은 판매 등록, 거래, 티켓 사용, 취소 및 환불이 불가능합니다.</p>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
