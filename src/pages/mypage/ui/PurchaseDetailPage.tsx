// src/pages/mypage/ui/PurchaseDetailPage.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CancelBookingDialog from './CancelBookingDialog';
import NoAccountDialog from './NoAccountDialog';
import ResellRegisterDialog from './ResellRegisterDialog';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { PURCHASE_DETAIL_MAP } from '../model/mockDetailData';
import StatusBadge from './StatusBadge';
import type { BadgeVariant } from './StatusBadge';
import TicketItem from './TicketItem';
import InfoItem from './InfoItem';
import QrViewDialog from './QrViewDialog';
import { Snackbar } from '@/shared/ui/snackbar';

// ─── 상태 → 배지 변형 매핑 ─────────────────────────────────────

type PurchaseStatus = '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';

const PURCHASE_BADGE: Record<PurchaseStatus, BadgeVariant> = {
   '예매 완료': 'success',
   '부분 처리': 'success',
   '입금 대기': 'warning',
   '취소/환불': 'warning',
   '관람 완료': 'disabled',
};

// ─── 로컬 서브 컴포넌트 ────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
   return (
      <div className={`border border-[#e9ebee] rounded-2xl p-6.25 flex flex-col gap-6 ${className}`}>{children}</div>
   );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────

export default function PurchaseDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const location = useLocation();
   const [showCancelSnackbar, setShowCancelSnackbar] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [noAccountOpen, setNoAccountOpen] = useState(false);
   const [resellOpen, setResellOpen] = useState(false);

   useEffect(() => {
      if ((location.state as { showCancelSuccess?: boolean } | null)?.showCancelSuccess) {
         setShowCancelSnackbar(true);
         window.history.replaceState({}, '');
      }
   }, [location.state]);

   const detail = id ? PURCHASE_DETAIL_MAP[id] : undefined;

   // TODO: 실제로는 API에서 계좌 등록 여부 수신
   const MOCK_HAS_ACCOUNT = true;

   // 결제/부분취소 이벤트 파생
   const paymentEvent = detail?.paymentEvents.find(e => e.type === '결제 완료');
   const partialCancelEvent = detail?.paymentEvents.find(e => e.type === '부분 취소 완료');

   const handleCancelClick = () => {
      if (!!detail?.paymentSummary.bankAccount && !MOCK_HAS_ACCOUNT) {
         setNoAccountOpen(true);
      } else {
         setCancelOpen(true);
      }
   };

   if (!detail) {
      return (
         <div className="flex items-center justify-center py-24">
            <p className="text-body-1-regular text-muted-foreground">구매 내역을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex flex-col items-center pt-8 lg:pt-12.5 pb-30 px-4">
         <Snackbar
            open={showCancelSnackbar}
            message="취소가 완료되었습니다."
            onClose={() => setShowCancelSnackbar(false)}
         />
         {noAccountOpen && <NoAccountDialog open={noAccountOpen} onClose={() => setNoAccountOpen(false)} />}
         {cancelOpen && (
            <CancelBookingDialog
               open={cancelOpen}
               onClose={() => setCancelOpen(false)}
               itemId={detail.id}
               game={{ teams: detail.game.teams, datetime: detail.game.datetime }}
               isBankTransfer={!!detail.paymentSummary.bankAccount}
               seats={detail.seatItems
                  .filter(s => s.status === '예매완료')
                  .map(s => ({
                     orderId: s.orderId,
                     section: s.section,
                     seatDetail: s.seatDetail,
                     price: s.price,
                  }))}
            />
         )}
         {resellOpen && (
            <ResellRegisterDialog
               open={resellOpen}
               onClose={() => setResellOpen(false)}
               item={{
                  id: detail.id,
                  orderId: detail.orderId,
                  orderDate: detail.orderDate,
                  type: '리셀',
                  game: {
                     teams: detail.game.teams,
                     venue: detail.game.venue,
                     datetime: detail.game.datetime,
                     quantity: detail.seatItems.length,
                     section: detail.seatItems[0]?.section ?? '',
                     seats: detail.seatItems.map(s => s.seatDetail),
                  },
                  price: detail.paymentSummary.ticketAmount,
                  paymentStatus: '예매 완료',
                  deliveryType: detail.deliveryMethod,
                  canSell: detail.canSell,
               }}
            />
         )}
         <div className="flex flex-col gap-14 w-full max-w-190 min-w-83.75">
            {/* 제목 */}
            <div className="flex items-center gap-4">
               <Button variant="none" className="p-0 [&_svg]:size-6" onClick={() => navigate(-1)}>
                  <ChevronLeft size={24} />
               </Button>
               <h1 className="text-[32px] font-bold text-[#111827] tracking-[-0.032px] leading-[1.45]">
                  예매내역 상세
               </h1>
            </div>

            <div className="flex flex-col gap-12">
               {/* 경기 정보 */}
               <SectionCard>
                  <StatusBadge
                     label={detail.overallStatus}
                     variant={PURCHASE_BADGE[detail.overallStatus as PurchaseStatus]}
                  />
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

               {/* 예약 정보 */}
               <InfoItem
                  heading="예약 정보"
                  rows={[
                     { label: '예약번호', value: detail.orderId },
                     { label: '예매일시', value: detail.orderDate },
                     { label: '예매자', value: detail.orderer },
                     ...(detail.cancelDate
                        ? [{ label: '취소 일시', value: detail.cancelDate }]
                        : [{ label: '취소 가능 기한', value: detail.cancelDeadline ?? '' }]),
                  ]}
               />

               {/* 좌석 정보 */}
               <SectionCard>
                  <h2 className="text-[20px] font-bold text-foreground leading-normal">좌석 정보</h2>
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

               {/* 취소/환불 상태에서는 수령 방법, 결제 정보 섹션 숨김 */}
               {/* 티켓 수령 방법 */}
               {!detail.refundInfo && detail.deliveryMethod === '배송' ? (
                  <SectionCard>
                     <h2 className="text-[20px] font-bold text-foreground leading-normal">티켓 수령 방법</h2>
                     <div className="flex flex-col gap-3 text-body-1-regular">
                        <div className="flex items-start">
                           <span className="text-muted-foreground w-55 shrink-0 leading-normal">수령 방법</span>
                           <span className="flex-1 text-[#374553] text-right leading-normal">배송</span>
                        </div>
                        <div className="flex items-start">
                           <span className="text-muted-foreground w-55 shrink-0 leading-normal">주소</span>
                           <span className="flex-1 text-[#374553] text-right leading-normal">
                              {detail.deliveryAddress}
                           </span>
                        </div>
                        <div className="flex items-start">
                           <span className="text-muted-foreground w-55 shrink-0 leading-normal">배송 상태</span>
                           <div className="flex flex-1 items-center justify-end gap-2 flex-wrap">
                              <span className="font-bold text-foreground leading-normal whitespace-nowrap">
                                 {detail.deliveryStatus}
                              </span>
                              <span className="text-[#646f7c] underline leading-normal whitespace-nowrap">
                                 {detail.deliveryCarrier} {detail.deliveryTrackingNumber}
                              </span>
                           </div>
                        </div>
                     </div>
                  </SectionCard>
               ) : !detail.refundInfo && detail.deliveryMethod === '현장 수령' ? (
                  <InfoItem
                     heading="티켓 수령 방법"
                     rows={[
                        { label: '수령 방법', value: '현장 수령' },
                        { label: '예매번호', value: detail.orderId },
                     ]}
                     helperTexts={['• 매표소에서 예매 번호와 신분증을 제시하세요']}
                  />
               ) : !detail.refundInfo ? (
                  <SectionCard>
                     <h2 className="text-[20px] font-bold text-foreground leading-normal">티켓 수령 방법</h2>
                     <div className="flex items-start text-body-1-regular">
                        <span className="text-muted-foreground w-55 shrink-0 leading-normal">수령 방법</span>
                        <span className="flex-1 text-[#374553] text-right leading-normal">모바일 QR</span>
                     </div>
                     <Button variant="secondary" className="w-full py-3" onClick={() => setQrOpen(true)}>
                        QR 확인
                     </Button>
                  </SectionCard>
               ) : null}

               {/* 결제 정보 */}
               {detail.paymentSummary.bankAccount ? (
                  // 무통장 입금
                  <InfoItem
                     type="payment"
                     heading="결제 정보"
                     statusText={detail.paymentSummary.status}
                     statusColor={detail.paymentSummary.status === '결제 완료' ? 'text-primary' : 'text-muted-foreground'}
                     summaryRows={[
                        {
                           label: `티켓 금액 (${detail.paymentSummary.ticketCount}매)`,
                           amount: detail.paymentSummary.ticketAmount,
                        },
                        { label: '수수료', amount: detail.paymentSummary.fee },
                     ]}
                     totalLabel="총 결제 금액"
                     totalAmount={detail.paymentSummary.total}
                     infoRows={[
                        { label: '입금 계좌', value: detail.paymentSummary.bankAccount, valueBold: true },
                        detail.paymentSummary.status === '입금 대기'
                           ? { label: '입금 기한', value: detail.paymentSummary.bankDeadline ?? '' }
                           : { label: '결제 일시', value: detail.paymentSummary.date },
                     ]}
                  />
               ) : (
                  // 카드 결제 등 일반 결제
                  <InfoItem
                     type="payment"
                     heading="결제 정보"
                     statusText={detail.paymentSummary.status}
                     statusColor={detail.refundInfo ? 'text-muted-foreground' : 'text-primary'}
                     summaryRows={[
                        {
                           label: `티켓 금액 (${detail.paymentSummary.ticketCount}매)`,
                           amount: detail.paymentSummary.ticketAmount,
                        },
                        { label: '수수료', amount: detail.paymentSummary.fee },
                     ]}
                     totalLabel="총 결제 금액"
                     totalAmount={detail.paymentSummary.total}
                     infoRows={[
                        ...(paymentEvent ? [{ label: '결제 수단', value: paymentEvent.method }] : []),
                        { label: '결제 일시', value: detail.paymentSummary.date },
                     ]}
                  />
               )}

               {/* 취소/환불 정보 */}
               {detail.refundInfo ? (
                  <InfoItem
                     type="payment"
                     heading="취소/환불 정보"
                     statusText="취소/환불 완료"
                     statusColor="text-destructive"
                     summaryRows={[
                        {
                           label: `티켓 금액 (${detail.paymentSummary.ticketCount}매)`,
                           amount: detail.refundInfo.ticketAmount,
                        },
                        { label: '취소 수수료', amount: detail.refundInfo.cancelFee },
                     ]}
                     totalLabel="총 환불 금액"
                     totalAmount={detail.refundInfo.refundTotal}
                     totalColor="text-destructive"
                     infoRows={[
                        { label: '환불 수단', value: detail.refundInfo.method },
                        { label: '환불 일시', value: detail.refundInfo.date },
                     ]}
                     helperTexts={[
                        '• 판매 취소된 티켓은 예매 내역에서 확인하실 수 있습니다.',
                        '• 취소/환불은 영업일 기준 1~3일 이내 처리될 예정입니다. 문의사항은 고객센터로 문의해주세요.',
                     ]}
                  />
               ) : partialCancelEvent ? (
                  // 부분 취소 완료 이벤트가 있을 경우 취소/환불 정보 표시
                  <InfoItem
                     type="payment"
                     heading="취소/환불 정보"
                     statusText={partialCancelEvent.type}
                     statusColor="text-destructive"
                     summaryRows={partialCancelEvent.items.map(item => ({ label: item.label, amount: item.amount }))}
                     totalLabel={partialCancelEvent.totalLabel}
                     totalAmount={partialCancelEvent.totalAmount}
                     totalColor="text-destructive"
                     infoRows={[
                        { label: partialCancelEvent.methodLabel, value: partialCancelEvent.method },
                        { label: '환불 일시', value: partialCancelEvent.date },
                     ]}
                     helperTexts={[
                        '• 취소/환불은 영업일 기준 1~3일 이내 처리될 예정입니다. 문의사항은 고객센터로 문의해주세요.',
                     ]}
                  />
               ) : null}
            </div>

            {/* 액션 버튼 */}
            {(detail.canCancel || detail.overallStatus === '예매 완료' || detail.canSell) && (
               <div className="flex gap-3">
                  {detail.canCancel && (
                     <Button variant="tertiary" className="flex-1 py-3" onClick={handleCancelClick}>
                        예매 취소
                     </Button>
                  )}
                  {(detail.overallStatus === '예매 완료' || detail.canSell) && (
                     <Button variant="secondary" className="flex-1 py-3" onClick={() => setResellOpen(true)}>
                        판매 등록
                     </Button>
                  )}
               </div>
            )}

            {/* 입장 안내 / 유의사항 — 취소/환불 상태에서는 숨김 */}
            {!detail.refundInfo && (
               <div className="bg-[#f4f7fe] rounded-[14px] p-6 flex flex-col gap-2">
                  <h3 className="text-[18px] font-bold text-primary leading-[1.55]">입장 안내</h3>
                  <div className="flex flex-col gap-0.5 text-body-2-regular text-[#374553]">
                     <p>• 경기 시작 2시간 전부터 입장 가능합니다</p>
                     <p>• 모바일 티켓 QR코드를 게이트에서 제시해주세요</p>
                     <p>• 신분증을 함께 지참해주세요</p>
                  </div>
               </div>
            )}

            {/* 유의사항 카드 */}
            {!detail.refundInfo && (
               <div className="bg-surface rounded-[14px] p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-1">
                     <AlertCircle size={20} className="text-[#161d24] shrink-0" />
                     <h3 className="text-[18px] font-bold text-[#161d24] leading-[1.55]">유의사항</h3>
                  </div>
                  <div className="flex flex-col gap-6">
                     <div className="flex flex-col gap-2">
                        <h4 className="text-body-1-bold text-[#374553] leading-normal">취소/환불 안내</h4>
                        <div className="flex flex-col gap-0.5 text-body-2-regular text-[#374553]">
                           <p>• 예매 당일 취소 시 전액 환불됩니다. (예매 수수료 포함)</p>
                           <p>• 예매 익일 ~ 경기 시작 4시간 전까지 취소 시 예매 수수료와 취소 수수료가 부과됩니다.</p>
                           <p>• 경기 시작 4시간 전인 예매 취소 마감 기간 이후 취소 및 환불이 불가능합니다.</p>
                           <p>• 리셀로 구매한 티켓은 취소 및 환불이 불가능합니다.</p>
                           <p>• 취소/환불 금액은 은행 영업일 기준 1~3일 내에 지정된 계좌로 입금됩니다.</p>
                           <p>• 환불 규정에 따라 환불 처리가 됩니다.</p>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2">
                        <h4 className="text-body-1-bold text-[#374553] leading-normal">티켓 리셀 안내</h4>
                        <div className="flex flex-col gap-0.5 text-body-2-regular text-[#374553]">
                           <p>• 안전한 거래를 위해 모바일 티켓만 리셀 등록이 가능합니다.</p>
                           <p>
                              • 구매하신 티켓은 예매 시작 이후 2시간이 된 시점부터 경기 시작 이후 1시간까지 리셀 마켓에
                              등록하실 수 있습니다.
                           </p>
                           <p>
                              • 리셀 시 별도의 취소 수수료는 없으며, 거래 완료 시 판매 금액의 5% 중개 수수료가
                              적용됩니다.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>

         <QrViewDialog
            open={qrOpen}
            onClose={() => setQrOpen(false)}
            seats={detail.seatItems
               .filter(s => s.status !== '취소완료')
               .map(s => ({ section: s.section, seatDetail: s.seatDetail }))}
         />
      </div>
   );
}
