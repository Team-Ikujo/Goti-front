// src/pages/mypage/ui/SaleDetailPage.tsx

import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { SALE_DETAIL_MAP } from '../model/mockDetailData';
import StatusBadge from './StatusBadge';
import type { BadgeVariant } from './StatusBadge';
import TicketItem from './TicketItem';
import InfoItem from './InfoItem';

// ─── 상태 → 배지 변형 매핑 ─────────────────────────────────────

type SaleStatus = '판매 중' | '판매 완료' | '정산 대기' | '판매 취소 대기';

const SALE_BADGE: Record<SaleStatus, BadgeVariant> = {
   '판매 중': 'success',
   '판매 완료': 'success', // 파랑 (Figma: #f4f7fe + #2563eb)
   '정산 대기': 'warning', // 오렌지
   '판매 취소 대기': 'disabled', // 회색
};

// ─── 로컬 서브 컴포넌트 ────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
   return (
      <div className={`border border-[#e9ebee] rounded-2xl p-[25px] flex flex-col gap-6 ${className}`}>{children}</div>
   );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────

export default function SaleDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();

   const detail = id ? SALE_DETAIL_MAP[id] : undefined;

   if (!detail) {
      return (
         <div className="flex items-center justify-center py-24">
            <p className="text-body-1-regular text-muted-foreground">판매 내역을 찾을 수 없습니다.</p>
         </div>
      );
   }

   const isCancelPending = detail.overallStatus === '판매 취소 대기';
   const isSoldComplete = detail.overallStatus === '판매 완료';

   // 취소 좌석 제외한 유효 좌석 수
   const validSeatCount = detail.seatItems.filter(s => s.status !== '판매취소').length;

   return (
      <div className="flex flex-col items-center pt-12.5 pb-30 px-4">
         <div className="flex flex-col gap-14 w-full max-w-[760px] min-w-[335px]">
            {/* 제목 */}
            <div className="flex items-center gap-4">
               {/* <Button variant="none" className="p-0 [&_svg]:size-6" onClick={() => navigate(-1)}>
                  <ChevronLeft size={24} />
               </Button> */}
               <h1 className="text-[32px] font-bold text-[#111827] tracking-[-0.032px] leading-[1.45]">
                  판매내역 상세
               </h1>
            </div>

            <div className="flex flex-col gap-12">
               {/* 경기 정보 */}
               <SectionCard>
                  <StatusBadge label={detail.overallStatus} variant={SALE_BADGE[detail.overallStatus as SaleStatus]} />
                  <div className="flex flex-col gap-4">
                     <p className="text-[32px] font-bold text-[#161d24] tracking-[-0.032px] leading-[1.45]">
                        {detail.game.teams}
                     </p>
                     <div className="flex flex-col gap-1 text-[18px] font-medium text-[#374553]">
                        <p className="leading-[1.55]">{detail.game.datetime}</p>
                        <p className="leading-[1.55]">{detail.game.venue}</p>
                     </div>
                  </div>
               </SectionCard>

               {/* 취소 대기: 취소 정보 / 그 외: 판매 정보 */}
               {isCancelPending ? (
                  <InfoItem
                     heading="취소 정보"
                     rows={[
                        { label: '등록번호', value: detail.orderId },
                        { label: '취소일시', value: detail.cancelDate ?? '' },
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
                        { label: '등록번호', value: detail.orderId },
                        { label: '판매일시', value: detail.orderDate },
                        ...(isSoldComplete && detail.settlementCompleteDate
                           ? [{ label: '정산일시', value: detail.settlementCompleteDate }]
                           : []),
                     ]}
                     helperTexts={[
                        isSoldComplete
                           ? '• 정산이 완료되었습니다.'
                           : '• 은행 영업일 기준 1~3일 이내 처리될 예정입니다. 문의사항은 고객센터로 문의해 주세요.',
                     ]}
                  />
               )}

               {/* 좌석 정보 / 판매 취소된 좌석 */}
               <SectionCard>
                  <h2 className="text-[20px] font-bold text-[#161d24] leading-[1.5]">
                     {isCancelPending ? '판매 취소된 좌석' : '좌석 정보'}
                  </h2>
                  <div className="flex flex-col">
                     {detail.seatItems.map((seat, i) => (
                        <div key={seat.orderId}>
                           {i > 0 && <Separator className="my-6" />}
                           <TicketItem
                              orderId={seat.orderId}
                              section={seat.section}
                              seatDetail={seat.seatDetail}
                              status={seat.status}
                              price={seat.price}
                           />
                        </div>
                     ))}
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
                        { label: `티켓 금액 (${validSeatCount}매)`, amount: detail.estimatedTicketAmount },
                        { label: `수수료(${detail.estimatedFeeRate}%)`, amount: detail.estimatedFee },
                     ]}
                     totalLabel="예상 정산 금액"
                     totalAmount={detail.estimatedTotal}
                     infoRows={[
                        ...(detail.settlementAccount ? [{ label: '정산 계좌', value: detail.settlementAccount }] : []),
                        ...(detail.settlementDate ? [{ label: '정산 완료일', value: detail.settlementDate }] : []),
                     ]}
                  />
               )}
            </div>

            {/* 판매 취소 버튼 — 판매 중일 때만 */}
            {detail.canCancel && (
               <Button variant="tertiary" className="w-full py-3">
                  판매 취소하기
               </Button>
            )}

            {/* 유의사항 — 판매 중일 때만 */}
            {detail.overallStatus === '판매 중' && (
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
