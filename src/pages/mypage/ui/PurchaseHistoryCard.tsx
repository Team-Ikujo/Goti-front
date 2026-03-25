// src/pages/mypage/ui/PurchaseHistoryCard.tsx

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

export type PurchaseStatus = '예매 완료' | '결제완료' | '취소/환불' | '정산대기' | '정산완료';

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

interface PurchaseHistoryCardProps {
   item: PurchaseHistoryItem;
}

export default function PurchaseHistoryCard({ item }: PurchaseHistoryCardProps) {
   const navigate = useNavigate();
   const [resellOpen, setResellOpen] = useState(false);
   const [cancelOpen, setCancelOpen] = useState(false);
   const [noAccountOpen, setNoAccountOpen] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);
   const [expanded, setExpanded] = useState(false);

   const handleCancelClick = () => {
      setCancelOpen(true);
   };

   const isBooked = item.paymentStatus === '예매 완료';
   const showSellBtn = isBooked || item.canSell;
   const showCancelBtn = isBooked;
   const showQrBtn = isBooked;
   const hasAnyButton = showSellBtn || showCancelBtn || showQrBtn;

   return (
      <>
         {resellOpen && <ResellRegisterDialog open={resellOpen} onClose={() => setResellOpen(false)} item={item} />}
         {noAccountOpen && <NoAccountDialog open={noAccountOpen} onClose={() => setNoAccountOpen(false)} />}
         {cancelOpen && (
            <CancelBookingDialog
               open={cancelOpen}
               onClose={() => setCancelOpen(false)}
               itemId={item.id}
               game={{ teams: item.game.teams, datetime: item.game.datetime }}
               seats={item.game.seats.map(seat => ({
                  orderId: item.orderId,
                  section: item.game.section,
                  seatDetail: seat,
                  price: item.game.seats.length > 0 ? Math.round(item.price / item.game.seats.length) : item.price,
               }))}
            />
         )}
         {qrOpen && (
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
            {/* 상단: 예약일자 / 예약상세 링크 */}
            <div className="flex items-center justify-between lg:justify-start lg:gap-4 px-4 py-1">
               <div className="flex items-center gap-1 text-body-2-regular shrink-0">
                  <span className="text-foreground">예약일자:</span>
                  <span className="text-body-2-semibold text-foreground">{item.orderDate}</span>
               </div>
               <Button
                  variant="none"
                  size="xs"
                  className="flex items-center text-body-2-regular text-foreground shrink-0 px-0 hover:text-primary transition-colors gap-0"
                  onClick={() => navigate(`/mypage/purchase/${item.id}`)}
               >
                  예약상세 <ChevronRight size={16} />
               </Button>
            </div>

            {/* 가로 구분선 */}
            <Separator />

            {/* 본문 — 모바일: flex-col / 데스크톱: flex-row items-stretch */}
            <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-stretch lg:min-h-26.75">
               {/* ① 뱃지 + 주문번호 — 모바일: [뱃지+번호] 왼쪽 / [상태] 오른쪽, 데스크톱: 세로 w-36 */}
               <div className="flex items-center justify-between lg:flex-col lg:items-center lg:justify-start lg:w-36 lg:shrink-0 lg:px-1 lg:gap-1.5">
                  {/* 뱃지 + 주문번호 */}
                  <div className="flex items-center gap-1.5 px-1 h-full lg:flex-col lg:items-start lg:gap-1.5 lg:w-full">
                     <div className="lg:flex lg:flex-col lg:items-start lg:w-full h-full">
                        <TicketTypeBadge type={item.type} />
                     </div>
                     <p className="text-foreground text-body-2-medium whitespace-nowrap">{item.orderId}</p>
                     {/* 데스크톱 전용: 수령방식 */}
                     <p className="hidden lg:flex w-full h-full items-center justify-center text-(--text-tertiary) text-caption-1-regular text-center whitespace-nowrap mt-auto">
                        {item.deliveryType}
                     </p>
                  </div>
                  {/* 모바일 전용: 상태 */}
                  <p className="lg:hidden text-body-1-semibold whitespace-nowrap text-(--text-primary) px-2.5">
                     {item.paymentStatus}
                  </p>
               </div>

               {/* ② 경기 정보 — flex-1 */}
               <div className="flex flex-1 flex-col gap-2 min-w-0 lg:px-1 lg:justify-center lg:min-h-24">
                  {/* 팀명 (항상 표시) */}
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
                     {/* 모바일: '좌석' 라벨 포함 행 형식 */}
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
                     {/* 데스크톱: 기존 방식 */}
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

                  {/* 모바일 전용: 수령방법·구매가 인포 rows */}
                  <div className="flex flex-col gap-2.5 mt-0.5 lg:hidden">
                     <div className="flex items-center gap-2.5">
                        <span className="text-(--text-tertiary) text-caption-1-regular w-10.5 shrink-0">수령방법</span>
                        <span className="text-(--text-secondary) text-body-2-regular">{item.deliveryType}</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <span className="text-(--text-tertiary) text-caption-1-regular w-10.5 shrink-0">구매가</span>
                        <span className="text-(--text-secondary) text-body-2-regular">
                           {item.price.toLocaleString()}원
                        </span>
                     </div>
                  </div>
               </div>

               {/* ③ 구매가 — 데스크톱 전용 w-28 */}
               <div className="hidden lg:flex flex-col items-center justify-center gap-1 w-28 shrink-0 text-center whitespace-nowrap">
                  <p className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">구매가</p>
                  <p className="text-body-1-bold text-foreground">{item.price.toLocaleString()}원</p>
               </div>

               {/* ④ 결제 상태 — 데스크톱 전용 */}
               <div className="hidden lg:flex items-center justify-center w-28 shrink-0">
                  <p className="text-body-1-semibold whitespace-nowrap text-foreground">{item.paymentStatus}</p>
               </div>

               {/* 판매 등록 영역 왼쪽 세로 구분선 — 데스크톱 전용 */}
               <div className="hidden lg:block w-px self-stretch bg-border shrink-0" />

               {/* ⑤ 액션 버튼 — 데스크톱 전용 세로 배치 */}
               <div className="hidden lg:flex flex-col items-center justify-center gap-1 px-3 shrink-0 w-25">
                  {showSellBtn && (
                     <Button variant="secondary" size="sm" className="w-full" onClick={() => setResellOpen(true)}>
                        판매 등록
                     </Button>
                  )}
                  {showCancelBtn && (
                     <Button variant="tertiary" size="sm" className="w-full" onClick={handleCancelClick}>
                        예매 취소
                     </Button>
                  )}
                  {showQrBtn && (
                     <Button variant="tertiary" size="sm" className="w-full" onClick={() => setQrOpen(true)}>
                        QR 확인
                     </Button>
                  )}
                  {!hasAnyButton && <span className="text-foreground text-body-1-regular">-</span>}
               </div>
            </div>

            {/* 모바일 전용: 하단 액션 버튼 가로 배치 */}
            {hasAnyButton && (
               <div className="flex lg:hidden gap-2 px-4 pb-1">
                  {showSellBtn && (
                     <Button variant="secondary" size="sm" className="flex-1" onClick={() => setResellOpen(true)}>
                        판매 등록
                     </Button>
                  )}
                  {showCancelBtn && (
                     <Button variant="tertiary" size="sm" className="flex-1" onClick={handleCancelClick}>
                        예매 취소
                     </Button>
                  )}
                  {showQrBtn && (
                     <Button variant="tertiary" size="sm" className="flex-1" onClick={() => setQrOpen(true)}>
                        QR 확인
                     </Button>
                  )}
               </div>
            )}
         </div>
      </>
   );
}
