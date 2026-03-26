// src/pages/mypage/ui/HistoryCard.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Separator } from '@/shared/ui/separator';
import { Button } from '@/shared/ui/button';
import TicketTypeBadge from './TicketTypeBadge';
import type { TicketType } from './TicketTypeBadge';
import ResellRegisterDialog from './ResellRegisterDialog';
import QrViewDialog from './QrViewDialog';
import CancelBookingDialog from './CancelBookingDialog';
import NoAccountDialog from './NoAccountDialog';

// ── 타입 ────────────────────────────────────────────────────────────

export type PurchaseStatus = '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
export type SaleStatus = '판매 중' | '판매 완료' | '정산 대기' | '판매 취소 대기';

export interface PurchaseHistoryItem {
   id: string;
   orderId: string;
   orderDate: string;
   type: TicketType;
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
}

export interface SaleHistoryItem {
   id: string;
   orderId: string;
   orderDate: string;
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

type HistoryCardProps = { mode: 'purchase'; item: PurchaseHistoryItem } | { mode: 'sale'; item: SaleHistoryItem };

// ── 유틸 ─────────────────────────────────────────────────────────────


/** 경기 일자 기준으로 판매 오픈 시각 계산: 해당월 1일 11:00 */
const getSaleOpenTime = (datetime: string): Date => {
   const parts = datetime.split('.');
   const year = parts[0];
   const month = parts[1];
   return new Date(`${year}-${month}-01T11:00:00`);
};

/** 리셀 오픈 시각: 판매 오픈 + 2시간 */
const getResellOpenTime = (datetime: string): Date => {
   const t = getSaleOpenTime(datetime);
   return new Date(t.getTime() + 2 * 60 * 60 * 1000);
};

/** 판매예정 서브텍스트용 레이블: 'N월 1일 오전 11시 오픈' */
const getSaleOpenLabel = (datetime: string): string => {
   const month = parseInt(datetime.split('.')[1], 10);
   return `${month}월 1일 오전 11시 오픈`;
};

// ── 컴포넌트 ─────────────────────────────────────────────────────────

export default function HistoryCard(props: HistoryCardProps) {
   const navigate = useNavigate();
   const [expanded, setExpanded] = useState(false);
   const [resellOpen, setResellOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [noAccountOpen, setNoAccountOpen] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);

   const { mode, item } = props;
   const isPurchase = mode === 'purchase';

   // 모드별 파생값
   const dateLabel = isPurchase ? '예약일자' : '판매일자';
   const detailLabel = isPurchase ? '예약상세' : '판매상세';
   const detailRoute = isPurchase ? `/mypage/purchase/${item.id}` : `/mypage/sale/${item.id}`;
   const priceLabel = isPurchase ? '구매가' : '판매가';
   const price = isPurchase ? (item as PurchaseHistoryItem).price : (item as SaleHistoryItem).salePrice;
   const status = isPurchase ? (item as PurchaseHistoryItem).paymentStatus : (item as SaleHistoryItem).saleStatus;

   // 구매 버튼 노출 조건
   const purchaseItem = isPurchase ? (item as PurchaseHistoryItem) : null;
   const isBooked = purchaseItem?.paymentStatus === '예매 완료' || purchaseItem?.paymentStatus === '부분 처리';
   const showSellBtn = isBooked || (purchaseItem?.canSell ?? false);
   const showCancelBtn = isBooked || purchaseItem?.paymentStatus === '입금 대기';
   const showQrBtn = isBooked && item.deliveryType === '모바일 티켓';
   const hasAnyPurchaseBtn = showSellBtn || showCancelBtn || showQrBtn;

   // 판매 오픈 여부: 해당월 1일 11:00 이전 → 판매예정, ~13:00 이전 → 리셀예정
   const now = new Date();
   const saleOpenTime = getSaleOpenTime(item.game.datetime);
   const resellOpenTime = getResellOpenTime(item.game.datetime);
   const isSaleNotOpen = showSellBtn && now < saleOpenTime;
   const isResellNotOpen = showSellBtn && !isSaleNotOpen && now < resellOpenTime;
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
            <ResellRegisterDialog open={resellOpen} onClose={() => setResellOpen(false)} item={purchaseItem} />
         )}
         {isPurchase && noAccountOpen && (
            <NoAccountDialog open={noAccountOpen} onClose={() => setNoAccountOpen(false)} />
         )}
         {isPurchase && cancelOpen && purchaseItem && (
            <CancelBookingDialog
               open={cancelOpen}
               onClose={() => setCancelOpen(false)}
               itemId={item.id}
               game={{ teams: item.game.teams, datetime: item.game.datetime }}
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
               seats={item.game.seats.map(seat => ({
                  section: item.game.section,
                  seatDetail: seat,
               }))}
            />
         )}

         <div className="bg-background border border-border rounded-[14px] flex flex-col gap-2.5 px-px py-3.25">
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
                  onClick={() => navigate(detailRoute)}
               >
                  {detailLabel} <ChevronRight size={16} />
               </Button>
            </div>

            <Separator />

            {/* 본문 — 모바일: flex-col / 데스크톱: flex-row items-stretch */}
            <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-stretch lg:min-h-26.75">
               {/* ① 뱃지 + 주문번호 */}
               <div className="flex items-center justify-between lg:flex-col lg:items-center lg:justify-start lg:w-36 lg:shrink-0 lg:px-1 lg:gap-1.5">
                  <div className="flex items-center gap-1.5 px-1 h-full lg:flex-col lg:items-start lg:gap-1.5 lg:w-full">
                     <div className="lg:flex lg:flex-col lg:items-start lg:w-full h-full">
                        <TicketTypeBadge type={item.type} />
                     </div>
                     <p className="text-foreground text-body-2-medium whitespace-nowrap">{item.orderId}</p>
                     {/* 데스크톱 전용: 수령방식 */}
                     <p className="hidden lg:flex w-full items-center justify-center text-(--text-tertiary) text-caption-1-regular text-center whitespace-nowrap mt-auto h-full">
                        {item.deliveryType}
                     </p>
                  </div>
                  {/* 모바일 전용: 상태 */}
                  <p className="lg:hidden text-body-1-semibold whitespace-nowrap text-(--text-primary) px-2.5">
                     {status}
                  </p>
               </div>

               {/* ② 경기 정보 */}
               <div className="flex flex-1 flex-col gap-2 min-w-0 lg:px-1 lg:justify-center lg:min-h-24">
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

                  {/* 구역명(좌석수) 토글 */}
                  <div className="flex flex-col gap-1">
                     {/* 모바일: 좌석 라벨 행 */}
                     <div className="flex items-center gap-2.5 lg:hidden">
                        <span className="text-caption-1-regular text-(--text-tertiary) w-10.5 shrink-0">좌석</span>
                        <button
                           className="flex items-center gap-1 text-left"
                           onClick={() => setExpanded(v => !v)}
                           aria-expanded={expanded}
                        >
                           <span className="text-body-2-medium text-foreground whitespace-nowrap">
                              {item.game.section}({item.game.seats.length})
                           </span>
                           <ChevronDown
                              size={16}
                              className={`text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                           />
                        </button>
                     </div>
                     {/* 데스크톱: 좌석 토글 */}
                     <button
                        className="hidden lg:flex items-center gap-1 text-left"
                        onClick={() => setExpanded(v => !v)}
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

                  {/* 모바일 전용: 수령방법 + 가격 */}
                  <div className="flex flex-col gap-2.5 mt-0.5 lg:hidden">
                     <div className="flex items-center gap-2.5">
                        <span className="text-(--text-tertiary) text-caption-1-regular w-10.5 shrink-0">수령방법</span>
                        <span className="text-(--text-secondary) text-body-2-regular">{item.deliveryType}</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <span className="text-(--text-tertiary) text-caption-1-regular w-10.5 shrink-0">
                           {priceLabel}
                        </span>
                        <span className="text-(--text-secondary) text-body-2-regular">{price.toLocaleString()}원</span>
                     </div>
                  </div>
               </div>

               {/* ③ 가격 — 데스크톱 전용 */}
               <div className="hidden lg:flex flex-col items-center justify-center gap-1 w-28 shrink-0 text-center whitespace-nowrap">
                  <p className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{priceLabel}</p>
                  <p className="text-body-1-bold text-foreground">{price.toLocaleString()}원</p>
               </div>

               {/* ④ 상태 — 데스크톱 전용 */}
               <div className="hidden lg:flex items-center justify-center w-28 shrink-0">
                  <p className="text-body-1-semibold whitespace-nowrap text-foreground">{status}</p>
               </div>

               {/* 구분선 — 데스크톱 전용 */}
               <div className="hidden lg:block w-px self-stretch bg-border shrink-0" />

               {/* ⑤ 액션 버튼 — 데스크톱 전용 (항상 3행 높이 유지) */}
               <div className="hidden lg:flex flex-col items-center justify-center gap-1 px-3 shrink-0 w-25 min-h-28.25">
                  {isPurchase ? (
                     showDash ? (
                        <span className="text-body-1-regular text-muted-foreground">-</span>
                     ) : (
                        <>
                           {/* 판매 등록 / 판매예정 / 리셀예정 */}
                           {showSellBtn ? (
                              isSaleNotOpen ? (
                                 <div className="w-full bg-[#e9ebee] rounded-lg px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                                    <p className="text-[16px] font-medium text-(--text-disabled) leading-[1.5] whitespace-nowrap">판매예정</p>
                                    <p className="text-[11px] text-(--text-disabled) text-center leading-[1.2] whitespace-nowrap">
                                       {getSaleOpenLabel(item.game.datetime)}
                                    </p>
                                 </div>
                              ) : isResellNotOpen ? (
                                 <div className="w-full border border-[#d0d6db] rounded-lg px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                                    <p className="text-[16px] font-medium text-(--text-disabled) leading-[1.5] whitespace-nowrap">리셀예정</p>
                                    <p className="text-[11px] text-(--text-disabled) text-center leading-[1.2] whitespace-nowrap">
                                       정식 예매 오픈<br />2시간 후
                                    </p>
                                 </div>
                              ) : (
                                 <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setResellOpen(true)}
                                 >
                                    판매 등록
                                 </Button>
                              )
                           ) : (
                              <div className="h-8.25 w-full" />
                           )}
                           {showCancelBtn ? (
                              <Button
                                 variant="tertiary"
                                 size="sm"
                                 className="w-full"
                                 onClick={() => setCancelOpen(true)}
                              >
                                 예매 취소
                              </Button>
                           ) : (
                              <div className="h-8.25 w-full" />
                           )}
                           {showQrBtn ? (
                              <Button variant="tertiary" size="sm" className="w-full" onClick={() => setQrOpen(true)}>
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
                     <Button variant="tertiary" size="sm" className="w-full">
                        판매 취소
                     </Button>
                  )}
               </div>
            </div>

            {/* 모바일 전용: 하단 버튼 (항상 높이 유지) */}
            <div className="flex lg:hidden gap-2 px-4 pb-1">
               {isPurchase ? (
                  <>
                     {!showDash && (
                        <>
                           {showSellBtn && (
                              isSaleNotOpen ? (
                                 <div className="flex-1 bg-[#e9ebee] rounded-lg px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                                    <p className="text-[16px] font-medium text-(--text-disabled) leading-[1.5] whitespace-nowrap">판매예정</p>
                                    <p className="text-[11px] text-(--text-disabled) text-center leading-[1.2] whitespace-nowrap">
                                       {getSaleOpenLabel(item.game.datetime)}
                                    </p>
                                 </div>
                              ) : isResellNotOpen ? (
                                 <div className="flex-1 border border-[#d0d6db] rounded-lg px-4 py-2 flex flex-col items-center justify-center gap-0.5">
                                    <p className="text-[16px] font-medium text-(--text-disabled) leading-[1.5] whitespace-nowrap">리셀예정</p>
                                    <p className="text-[11px] text-(--text-disabled) text-center leading-[1.2] whitespace-nowrap">
                                       정식 예매 오픈<br />2시간 후
                                    </p>
                                 </div>
                              ) : (
                                 <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setResellOpen(true)}
                                 >
                                    판매 등록
                                 </Button>
                              )
                           )}
                           {showCancelBtn && (
                              <Button
                                 variant="tertiary"
                                 size="sm"
                                 className="flex-1"
                                 onClick={() => setCancelOpen(true)}
                              >
                                 예매 취소
                              </Button>
                           )}
                           {showQrBtn && (
                              <Button variant="tertiary" size="sm" className="flex-1" onClick={() => setQrOpen(true)}>
                                 QR 확인
                              </Button>
                           )}
                        </>
                     )}
                  </>
               ) : !showSaleDash ? (
                  <Button variant="tertiary" size="sm" className="flex-1">
                     판매 취소
                  </Button>
               ) : null}
            </div>
         </div>
      </>
   );
}
