// src/pages/mypage/ui/SaleDetailPage.tsx

import { useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { cancelResaleListing } from '@/entities/resale/api/resaleApi';
import { markStoredResaleListingCanceled } from '@/shared/lib/resaleListingStorage';
import { useMyResaleListData } from '../model/useMypageData';
import StatusBadge from './StatusBadge';
import type { BadgeVariant } from './StatusBadge';
import TicketItem from './TicketItem';
import InfoItem from './InfoItem';
import ActionStatusDialog from './ActionStatusDialog';

type SaleStatus = '판매 중' | '정산 대기' | '판매 완료' | '취소 대기' | '취소 완료';

const SALE_BADGE: Record<SaleStatus, BadgeVariant> = {
   '판매 중': 'success',
   '정산 대기': 'warning',
   '판매 완료': 'success',
   '취소 대기': 'disabled',
   '취소 완료': 'disabled',
};

const FEE_RATE = 5;

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
   return (
      <div className={`border border-border rounded-2xl p-[25px] flex flex-col gap-6 ${className}`}>{children}</div>
   );
}

function DetailHero({ title, subtitle, venue }: { title: string; subtitle: string; venue: string }) {
   return (
      <div className="flex flex-col gap-4">
         <p className="text-title-1-bold text-foreground">{title}</p>
         <div className="flex flex-col gap-1 text-heading-4-medium text-muted-foreground">
            <p>{subtitle}</p>
            <p>{venue}</p>
         </div>
      </div>
   );
}

export default function SaleDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const currentUserId = useAuthStore(s => s.currentUserId);
   const resaleListQuery = useMyResaleListData();
   const apiDetail = (resaleListQuery.data ?? []).find((item) => item.id === id);
   const [cancelDialogType, setCancelDialogType] = useState<'success' | 'error' | null>(null);

   const { mutate: cancelListing, isPending: isCanceling } = useMutation({
      mutationFn: () => cancelResaleListing(id!),
      onSuccess: () => {
         markStoredResaleListingCanceled(currentUserId, id!);
         void queryClient.invalidateQueries({ queryKey: ['myResales'] });
         void queryClient.invalidateQueries({ queryKey: ['myResaleSummary'] });
         void queryClient.invalidateQueries({ queryKey: ['myResaleUnsettledAmount'] });
         setCancelDialogType('success');
      },
      onError: () => {
         setCancelDialogType('error');
      },
   });

   if (resaleListQuery.isLoading) return <div className="py-24 text-center text-body-1-regular">정보를 불러오는 중입니다...</div>;
   if (resaleListQuery.isError || !apiDetail) {
      return (
         <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-body-1-regular text-muted-foreground">
               판매 내역을 불러오지 못했거나 존재하지 않습니다.
            </p>
            <Button variant="tertiary" onClick={() => navigate('/mypage')}>마이페이지로 돌아가기</Button>
         </div>
      );
   }

   const overallStatus = apiDetail.saleStatus as SaleStatus;
   const isCancelPending = overallStatus === '취소 대기' || overallStatus === '취소 완료';
   const isSoldComplete = overallStatus === '판매 완료';
   const firstSeatDetail = apiDetail.game.seats[0] ?? '-';

   const seatItem = {
      orderId: apiDetail.orderId,
      section: apiDetail.game.section,
      seatDetail: firstSeatDetail,
      status: isCancelPending ? '판매취소' : '판매중',
      price: apiDetail.salePrice,
   } as const;

   const estimatedFee = -Math.round(apiDetail.salePrice * FEE_RATE / 100);
   const estimatedTotal = apiDetail.salePrice + estimatedFee;

   return (
      <div className="flex flex-col items-center pt-12.5 pb-30 px-4">
         <ActionStatusDialog
            open={cancelDialogType !== null}
            title="판매 취소"
            message={
               cancelDialogType === 'success'
                  ? '판매가 취소되었습니다.'
                  : '판매 취소에 실패했습니다. 잠시 후 다시 시도해주세요.'
            }
            onClose={() => setCancelDialogType(null)}
            onRetry={
               cancelDialogType === 'error'
                  ? () => {
                       setCancelDialogType(null);
                       cancelListing();
                    }
                  : undefined
            }
         />
         <div className="flex flex-col gap-14 w-full max-w-[760px] min-w-[335px]">
            <div className="flex items-center gap-4">
               <h1 className="text-title-1-bold text-foreground">판매내역 상세</h1>
            </div>

            <div className="flex flex-col gap-12">
               <SectionCard>
                  <StatusBadge label={overallStatus} variant={SALE_BADGE[overallStatus]} />
                  <DetailHero title={apiDetail.game.teams} subtitle={apiDetail.game.datetime} venue={apiDetail.game.venue} />
               </SectionCard>

               {isCancelPending ? (
                  <InfoItem
                     heading="취소 정보"
                     rows={[
                        { label: '등록번호', value: apiDetail.orderId },
                        { label: '취소일시', value: apiDetail.canceledAt ?? '-' },
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
                        { label: '등록번호', value: apiDetail.orderId },
                        { label: '판매일시', value: apiDetail.orderDate },
                        ...(isSoldComplete ? [{ label: '판매완료일시', value: apiDetail.soldAt ?? '-' }] : []),
                     ]}
                     helperTexts={[
                        isSoldComplete
                           ? '• 정산이 완료되었습니다.'
                           : '• 은행 영업일 기준 1~3일 이내 처리될 예정입니다. 문의사항은 고객센터로 문의해 주세요.',
                     ]}
                  />
               )}

               <SectionCard>
                  <h2 className="text-heading-3-bold text-foreground">
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

               {!isCancelPending && (
                  <InfoItem
                     type="payment"
                     heading="정산 금액"
                     statusText={isSoldComplete ? '정산 완료' : '정산 대기'}
                     statusColor={isSoldComplete ? 'text-primary' : 'text-muted-foreground'}
                     summaryRows={[
                        { label: '티켓 금액 (1매)', amount: apiDetail.salePrice },
                        { label: `수수료(${FEE_RATE}%)`, amount: estimatedFee },
                     ]}
                     totalLabel="예상 정산 금액"
                     totalAmount={estimatedTotal}
                     infoRows={[]}
                  />
               )}
            </div>

            {apiDetail.canCancel && (
               <Button
                  variant="tertiary"
                  className="w-full py-3"
                  disabled={isCanceling}
                  onClick={() => cancelListing()}
               >
                  {isCanceling ? '처리 중...' : '판매 취소하기'}
               </Button>
            )}

            {overallStatus === '판매 중' && (
               <div className="bg-surface rounded-[14px] p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-1">
                     <AlertCircle size={20} className="text-foreground shrink-0" />
                     <h3 className="text-heading-4-bold text-foreground">유의사항</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                     <h4 className="text-body-1-bold text-muted-foreground leading-[1.5]">판매 등록 해지 안내</h4>
                     <div className="flex flex-col gap-0.5 text-body-2-regular text-muted-foreground">
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
