// src/pages/mypage/ui/HistoryCard.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Separator } from '@/shared/ui/separator';
import { Button } from '@/shared/ui/button';
import TicketTypeBadge from './TicketTypeBadge';
import type { TicketType } from './TicketTypeBadge';
import ResellRegisterDialog from './ResellRegisterDialog';
import QrViewDialog from './QrViewDialog';
import CancelBookingDialog from './CancelBookingDialog';
import NoAccountDialog from './NoAccountDialog';
import ActionStatusDialog from './ActionStatusDialog';
import { fetchOrderTickets } from '@/entities/ticket/api/ticketApi';
import { MYPAGE_ACTION_TICKET_INFO_ERROR_SCENARIO } from '@/shared/api/mockScenarios';

// ── 타입 ────────────────────────────────────────────────────────────

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
   /** 모바일 티켓이고 판매 등록 가능한 경우 */
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
   /** 판매 취소 가능 여부 (판매중일 때만 true) */
   canCancel: boolean;
}

type HistoryCardProps = ({ mode: 'purchase'; item: PurchaseHistoryItem } | { mode: 'sale'; item: SaleHistoryItem }) & {
   onResellCompleteConfirm?: () => void;
   mockTicketInfoError?: boolean;
};

// ── 유틸 ─────────────────────────────────────────────────────────────

// ── 컴포넌트 ─────────────────────────────────────────────────────────

export default function HistoryCard(props: HistoryCardProps) {
   const navigate = useNavigate();
   const [expanded, setExpanded] = useState(false);
   const [resellOpen, setResellOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [noAccountOpen, setNoAccountOpen] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);

   const { mode, item } = props;
   const mockTicketInfoError = props.mockTicketInfoError ?? false;
   const isPurchase = mode === 'purchase';
   const purchaseItem = isPurchase ? (item as PurchaseHistoryItem) : null;
   const purchaseOrderId = purchaseItem?.rawOrderId;
   const actionTicketsQuery = useQuery({
      queryKey: ['historyCardOrderTickets', purchaseOrderId, mockTicketInfoError],
      queryFn: () =>
         fetchOrderTickets(purchaseOrderId!, {
            mockScenario: mockTicketInfoError ? MYPAGE_ACTION_TICKET_INFO_ERROR_SCENARIO : undefined,
         }),
      enabled: isPurchase && Boolean(purchaseOrderId) && (qrOpen || resellOpen),
      staleTime: 0,
   });

   // 모드별 파생값
   const dateLabel = isPurchase ? '예약일자' : '판매일자';
   const detailLabel = isPurchase ? '예약상세' : '판매상세';
   const detailRoute = isPurchase
      ? `/mypage/purchase/${purchaseOrderId ?? item.id}`
      : `/mypage/sale/${item.id}`;
   const priceLabel = isPurchase ? '구매가' : '판매가';
   const price = isPurchase ? (item as PurchaseHistoryItem).price : (item as SaleHistoryItem).salePrice;
   const status = isPurchase ? (item as PurchaseHistoryItem).paymentStatus : (item as SaleHistoryItem).saleStatus;

   // 구매 버튼 노출 조건
   const isBooked = purchaseItem?.paymentStatus === '예매 완료' || purchaseItem?.paymentStatus === '부분 처리';
   const showSellBtn = Boolean(purchaseOrderId) && (isBooked || (purchaseItem?.canSell ?? false));
   const showCancelBtn = Boolean(purchaseOrderId) && (isBooked || purchaseItem?.paymentStatus === '입금 대기');
   const actionTickets = actionTicketsQuery.data ?? [];
   const showQrBtn = Boolean(purchaseOrderId) && isBooked && item.deliveryType === '모바일 티켓';
   // 판매 오픈 여부: 해당월 1일 11:00 이전 → 판매예정, ~13:00 이전 → 리셀예정
   // 취소/환불·관람완료는 버튼 없이 '-' 표시
   const showDash =
      isPurchase && (purchaseItem?.paymentStatus === '취소/환불' || purchaseItem?.paymentStatus === '관람 완료');

   // 판매 버튼 노출 조건 — '판매 중'에만 취소 버튼, 그 외 '-' 표시
   const canCancelSale = !isPurchase && (item as SaleHistoryItem).canCancel;
   const showSaleDash = !isPurchase && !canCancelSale;

   return (
      <>
         {/* 구매 전용 다이얼로그 */}
         {isPurchase && resellOpen && purchaseItem && (
            actionTicketsQuery.isLoading ? (
               <ActionStatusDialog
                  open={resellOpen}
                  title="리셀 판매 등록"
                  message="판매 가능한 티켓 정보를 불러오는 중입니다."
                  onClose={() => setResellOpen(false)}
               />
            ) : actionTicketsQuery.isError ? (
               <ActionStatusDialog
                  open={resellOpen}
                  title="리셀 판매 등록"
                  message="판매 가능한 티켓 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
                  onClose={() => setResellOpen(false)}
                  onRetry={() => {
                     void actionTicketsQuery.refetch();
                  }}
               />
            ) : actionTickets.length > 0 ? (
               <ResellRegisterDialog
                  open={resellOpen}
                  onClose={() => setResellOpen(false)}
                  onCompleteConfirm={props.onResellCompleteConfirm}
                  item={{
                     ...purchaseItem,
                     ticketIds: actionTickets.map((ticket) => ticket.ticketId),
                  }}
               />
            ) : (
               <ActionStatusDialog
                  open={resellOpen}
                  title="리셀 판매 등록"
                  message="판매 가능한 티켓이 없습니다."
                  onClose={() => setResellOpen(false)}
               />
            )
         )}
         {isPurchase && noAccountOpen && (
            <NoAccountDialog open={noAccountOpen} onClose={() => setNoAccountOpen(false)} />
         )}
         {isPurchase && cancelOpen && purchaseItem && (
            <CancelBookingDialog
               open={cancelOpen}
               onClose={() => setCancelOpen(false)}
               orderId={purchaseItem.rawOrderId ?? purchaseItem.id}
               game={{ teams: item.game.teams, datetime: item.game.datetime }}
               mockTicketInfoError={mockTicketInfoError}
               seats={item.game.seats.map(seat => ({
                  orderId: item.orderId,
                  section: item.game.section,
                  seatDetail: seat,
                  price:
                     item.game.seats.length > 0
                        ? Math.round(purchaseItem.price / item.game.seats.length)
                        : purchaseItem.price,
               }))}
            />
         )}
         {isPurchase && qrOpen && (
            <QrViewDialog
               open={qrOpen}
               onClose={() => setQrOpen(false)}
               seats={actionTickets.map((ticket) => ({
                  ticketId: ticket.ticketId,
                  section: ticket.seatInfo.split(' ')[0] ?? '',
                  seatDetail: ticket.seatInfo,
               }))}
               isTicketInfoLoading={actionTicketsQuery.isLoading}
               isTicketInfoError={actionTicketsQuery.isError}
               onRetryTicketInfo={() => {
                  void actionTicketsQuery.refetch();
               }}
            />
         )}

         <div
            className="bg-background border border-border rounded-[14px] flex flex-col gap-2.5 px-px py-3.25 cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => navigate(detailRoute)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
               if (e.key === 'Enter' || e.key === ' ') navigate(detailRoute);
            }}
            aria-label={`${item.game.teams} ${detailLabel}`}
         >
            {/* 상단: 일자 / 상세 링크 */}
            <div className="flex items-center justify-between lg:justify-start lg:gap-8 px-4 py-1">
               <div className="flex items-center gap-1 text-body-2-regular shrink-0 w-33">
                  <span className="text-foreground">{dateLabel}:</span>
                  <span className="text-body-2-semibold text-foreground">{item.orderDate}</span>
               </div>
               <Button
                  variant="none"
                  size="xs"
                  className="flex items-center text-body-2-regular text-foreground shrink-0 px-0 hover:text-primary transition-colors gap-0"
                  onClick={e => {
                     e.stopPropagation();
                     navigate(detailRoute);
                  }}
               >
                  {detailLabel} <ChevronRight size={16} />
               </Button>
            </div>

            <Separator />

            {/* 본문 — 데스크톱 전용 */}
            <div className="hidden lg:flex flex-row gap-4 p-4 items-stretch min-h-26.75">
               {/* ① 뱃지 + 주문번호 */}
               <div className="flex flex-col items-center justify-start w-36 shrink-0 px-1 gap-1.5">
                  <div className="flex flex-col items-start gap-1.5 w-full h-full">
                     <div className="flex flex-col items-start w-full h-full">
                        <TicketTypeBadge type={item.type} />
                     </div>
                     <p className="text-foreground text-body-2-medium break-all">{item.orderId}</p>
                     <p className="flex w-full items-center justify-center text-(--text-tertiary) text-caption-1-regular text-center whitespace-nowrap mt-auto h-full">
                        {item.deliveryType}
                     </p>
                  </div>
               </div>

               {/* ② 경기 정보 */}
               <div className="flex flex-1 flex-col gap-2 min-w-0 px-1 justify-center min-h-24">
                  <p className="text-foreground text-body-1-bold whitespace-nowrap">{item.game.teams}</p>
                  <div className="flex items-center gap-2 h-4">
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">
                        {item.game.venue}
                     </span>
                     <span className="w-px h-2.5 bg-[#d1d5dc]" />
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">
                        {item.game.datetime}
                     </span>
                     <span className="w-px h-2.5 bg-[#d1d5dc]" />
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">
                        {item.game.quantity}매
                     </span>
                  </div>
                  <div className="flex flex-col gap-1">
                     <button
                        className="flex items-center gap-1 text-left"
                        onClick={e => {
                           e.stopPropagation();
                           setExpanded(v => !v);
                        }}
                        aria-expanded={expanded}
                     >
                        <span className="text-foreground text-body-2-medium whitespace-nowrap">
                           {item.game.section}({item.game.seats.length})
                        </span>
                        <ChevronDown
                           size={16}
                           className={`text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                        />
                     </button>
                     {expanded && (
                        <div className="flex flex-wrap gap-1.5">
                           {item.game.seats.map((seat, i) => (
                              <span
                                 key={i}
                                 className="border border-border rounded-[5px] px-1 py-0.5 text-muted-foreground text-caption-1-regular whitespace-nowrap"
                              >
                                 {seat}
                              </span>
                           ))}
                        </div>
                     )}
                  </div>
               </div>

               {/* ③ 가격 */}
               <div className="flex flex-col items-center justify-center gap-1 w-28 shrink-0 text-center whitespace-nowrap">
                  <p className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{priceLabel}</p>
                  <p className="text-body-1-bold text-foreground">{price.toLocaleString()}원</p>
               </div>

               {/* ④ 상태 */}
               <div className="flex items-center justify-center w-28 shrink-0">
                  <p className="text-body-1-semibold whitespace-nowrap text-foreground">{status}</p>
               </div>

               {/* 구분선 */}
               <div className="block w-px self-stretch bg-border shrink-0" />

               {/* ⑤ 액션 버튼 (항상 3행 높이 유지) */}
               <div className="flex flex-col items-center justify-center gap-1 px-3 shrink-0 w-25 min-h-28.25">
                  {isPurchase ? (
                     showDash ? (
                        <span className="text-body-1-regular text-muted-foreground">-</span>
                     ) : (
                        <>
                           {showSellBtn ? (
                              <Button
                                 variant="secondary"
                                 size="sm"
                                 className="w-full"
                                 onClick={e => {
                                    e.stopPropagation();
                                    setResellOpen(true);
                                 }}
                              >
                                 판매 등록
                              </Button>
                           ) : (
                              <div className="h-8.25 w-full" />
                           )}
                           {showCancelBtn ? (
                              <Button
                                 variant="tertiary"
                                 size="sm"
                                 className="w-full"
                                 onClick={e => {
                                    e.stopPropagation();
                                    setCancelOpen(true);
                                 }}
                              >
                                 예매 취소
                              </Button>
                           ) : (
                              <div className="h-8.25 w-full" />
                           )}
                           {showQrBtn ? (
                              <Button
                                 variant="tertiary"
                                 size="sm"
                                 className="w-full"
                                 onClick={e => {
                                    e.stopPropagation();
                                    setQrOpen(true);
                                 }}
                              >
                                 QR 확인
                              </Button>
                           ) : (
                              <div className="h-8.25 w-full" />
                           )}
                        </>
                     )
                  ) : showSaleDash ? (
                     <span className="text-body-1-regular text-muted-foreground">-</span>
                  ) : (
                     <Button variant="tertiary" size="sm" className="w-full" onClick={e => e.stopPropagation()}>
                        판매 취소
                     </Button>
                  )}
               </div>
            </div>

            {/* 본문 — 모바일 전용 */}
            <div className="flex flex-col gap-4 px-4 pt-1 pb-3 lg:hidden">
               {/* 내부 컨테이너 — Figma: border=#e5e7eb, gap=10 */}
               <div className="flex flex-col gap-2.5 border border-[#e5e7eb]">
                  {/* Row1: 뱃지 + 주문번호 | 상태 */}
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-1.5">
                        <TicketTypeBadge type={item.type} />
                        <span className="text-[14px] font-medium leading-5.25 text-[#161d24] break-all max-w-40">
                           {item.orderId}
                        </span>
                     </div>
                     <span className="text-[16px] font-semibold leading-6 text-[#161d24] whitespace-nowrap">
                        {status}
                     </span>
                  </div>

                  {/* 경기 정보 — Figma: teams fs=16/fw=700, meta fs=14/fw=400 color=#646f7c */}
                  <div className="flex flex-col gap-1">
                     <p className="text-[16px] font-bold leading-6 text-black whitespace-nowrap">{item.game.teams}</p>
                     <div className="flex items-center gap-2">
                        <span className="text-[14px] text-[#646f7c] whitespace-nowrap">{item.game.venue}</span>
                        <span className="w-px h-2.5 bg-[#d1d5dc] shrink-0" />
                        <span className="text-[14px] text-[#646f7c] whitespace-nowrap">{item.game.datetime}</span>
                        <span className="w-px h-2.5 bg-[#d1d5dc] shrink-0" />
                        <span className="text-[14px] text-[#646f7c] whitespace-nowrap">{item.game.quantity}매</span>
                     </div>
                  </div>

                  {/* 좌석 / 수령방법 / 가격 — Figma: label w=42px fs=12/fw=400, value fs=14/fw=400 */}
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2.5">
                        <span className="text-[12px] font-normal leading-4.5 text-[#646f7c] w-10.5 shrink-0">좌석</span>
                        <button
                           className="flex items-center gap-1 text-left"
                           onClick={e => {
                              e.stopPropagation();
                              setExpanded(v => !v);
                           }}
                           aria-expanded={expanded}
                        >
                           <span className="text-[14px] font-medium leading-5.25 text-[#161d24]">
                              {item.game.section}({item.game.seats.length})
                           </span>
                           <ChevronDown
                              size={16}
                              className={`text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                           />
                        </button>
                     </div>
                     {expanded && (
                        <div className="flex flex-wrap gap-1.5 pl-13">
                           {item.game.seats.map((seat, i) => (
                              <span
                                 key={i}
                                 className="border border-border rounded-[5px] px-1 py-0.5 text-muted-foreground text-caption-1-regular whitespace-nowrap"
                              >
                                 {seat}
                              </span>
                           ))}
                        </div>
                     )}
                     <div className="flex items-center gap-2.5">
                        <span className="text-[12px] font-normal leading-4.5 text-[#646f7c] w-10.5 shrink-0">
                           수령방법
                        </span>
                        <span className="text-[14px] font-normal leading-5.25 text-[#374553]">{item.deliveryType}</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <span className="text-[12px] font-normal leading-4.5 text-[#646f7c] w-10.5 shrink-0">
                           {priceLabel}
                        </span>
                        <span className="text-[14px] font-normal leading-5.25 text-[#374553]">
                           {price.toLocaleString()}원
                        </span>
                     </div>
                  </div>
               </div>

               {/* 액션 버튼 — Figma: gap=8, each flex-1 */}
               {isPurchase
                  ? !showDash && (
                       <div className="flex gap-2">
                          {showSellBtn && (
                             <Button
                                variant="secondary"
                                size="sm"
                                className="flex-1"
                                onClick={e => {
                                   e.stopPropagation();
                                   setResellOpen(true);
                                }}
                             >
                                판매 등록
                             </Button>
                          )}
                          {showCancelBtn && (
                             <Button
                                variant="tertiary"
                                size="sm"
                                className="flex-1"
                                onClick={e => {
                                   e.stopPropagation();
                                   setCancelOpen(true);
                                }}
                             >
                                예매 취소
                             </Button>
                          )}
                          {showQrBtn && (
                             <Button
                                variant="tertiary"
                                size="sm"
                                className="flex-1"
                                onClick={e => {
                                   e.stopPropagation();
                                   setQrOpen(true);
                                }}
                             >
                                QR 확인
                             </Button>
                          )}
                       </div>
                    )
                  : canCancelSale && (
                       <div className="flex gap-2">
                          <Button variant="tertiary" size="sm" className="flex-1" onClick={e => e.stopPropagation()}>
                             판매 취소
                          </Button>
                       </div>
                    )}
            </div>
         </div>
      </>
   );
}
