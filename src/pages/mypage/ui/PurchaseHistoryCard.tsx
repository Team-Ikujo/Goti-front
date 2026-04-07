// src/pages/mypage/ui/PurchaseHistoryCard.tsx

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Separator } from '@/shared/ui/separator';
import TicketTypeBadge from './TicketTypeBadge';
import type { TicketType } from './TicketTypeBadge';
import ResellRegisterDialog from './ResellRegisterDialog';
import QrViewDialog from './QrViewDialog';
import type { PurchaseHistoryItem as HistoryCardPurchaseHistoryItem } from '../model/historyCard';

export type PurchaseStatus =
   | '입금 대기'
   | '예매 완료'
   | '부분 처리'
   | '관람 완료'
   | '결제완료'
   | '취소/환불'
   | '정산대기'
   | '정산완료';

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
   paymentMethod: string;
   paymentStatus: PurchaseStatus;
   deliveryType: string;
   /** 모바일 티켓이고 판매 등록 가능한 경우 */
   canSell: boolean;
}

const STATUS_COLOR: Record<PurchaseStatus, string> = {
   '입금 대기': 'text-(--text-tertiary)',
   '예매 완료': 'text-primary',
   '부분 처리': 'text-primary',
   '관람 완료': 'text-foreground',
   결제완료: 'text-foreground',
   '취소/환불': 'text-destructive',
   정산대기: 'text-(--text-tertiary)',
   정산완료: 'text-foreground',
};

interface PurchaseHistoryCardProps {
   item: PurchaseHistoryItem;
}

export default function PurchaseHistoryCard({ item }: PurchaseHistoryCardProps) {
   const [resellOpen, setResellOpen] = useState(false);
   const [qrOpen, setQrOpen] = useState(false);

   const isBooked = item.paymentStatus === '예매 완료';
   const showSellBtn = isBooked || item.canSell;
   const showCancelBtn = isBooked;
   const showQrBtn = isBooked;
   const hasAnyButton = showSellBtn || showCancelBtn || showQrBtn;

   return (
      <>
         {resellOpen && (
            <ResellRegisterDialog
               open={resellOpen}
               onClose={() => setResellOpen(false)}
               item={item as unknown as HistoryCardPurchaseHistoryItem}
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
            {/* 상단: 구매일자 / 구매상세 링크 */}
            <div className="flex items-center px-4 py-1">
               <div className="flex items-center gap-1 text-body-2-regular shrink-0 min-w-40">
                  <span className="text-foreground">구매일자:</span>
                  <span className="text-body-2-semibold text-foreground">{item.orderDate}</span>
               </div>
               <button className="flex items-center text-body-2-regular text-foreground shrink-0">
                  구매상세 <ChevronRight size={16} className="ml-0.5" />
               </button>
            </div>

            {/* 가로 구분선 */}
            <Separator />

            {/* 본문 — items-stretch 로 세로 구분선(h-full) 정상 동작 */}
            <div className="flex items-stretch gap-4 p-4">
               {/* ① 왼쪽: 뱃지 + 주문번호 + 수령방식 — w-36 고정 */}
               <div className="flex flex-col gap-1.5 items-center w-36 shrink-0 px-1">
                  <div className="flex-1 flex flex-col items-start w-full justify-start">
                     <TicketTypeBadge type={item.type} />
                  </div>
                  <p className="text-foreground text-body-2-medium whitespace-nowrap">{item.orderId}</p>
                  <div className="flex-1 flex flex-col items-center justify-end w-full">
                     <p className="text-(--text-tertiary) text-caption-1-regular text-center whitespace-nowrap">
                        {item.deliveryType}
                     </p>
                  </div>
               </div>

               {/* ② 경기 정보 — flex-1 */}
               <div className="flex flex-1 flex-col gap-2 min-w-0 px-1 justify-center min-h-24">
                  <div className="flex flex-col gap-1">
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
                  </div>
                  <div className="flex flex-col gap-1">
                     <p className="text-muted-foreground text-caption-1-medium whitespace-nowrap">
                        {item.game.section}
                     </p>
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
                  </div>
               </div>

               {/* ③ 가격 + 결제방식 — w-28 고정 */}
               <div className="flex flex-col items-center justify-center gap-1 w-28 shrink-0 text-center whitespace-nowrap">
                  <p className="text-body-1-bold text-foreground">{item.price.toLocaleString()}원</p>
                  <p className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">
                     {item.paymentMethod}
                  </p>
               </div>

               {/* ④ 결제 상태  */}
               <div className="flex items-center justify-center w-28 shrink-0">
                  <p className={`text-body-1-semibold whitespace-nowrap ${STATUS_COLOR[item.paymentStatus]}`}>
                     {item.paymentStatus}
                  </p>
               </div>

               {/* 판매 등록 영역 왼쪽 세로 구분선 */}
               <div className="w-px self-stretch bg-border shrink-0" />

               {/* ⑤ 액션 버튼 — w-[100px] 고정 */}
               <div className="flex flex-col items-center justify-center gap-1 px-3 shrink-0 w-25">
                  {showSellBtn && (
                     <button
                        className="border border-border flex items-center justify-center px-3 py-1 rounded-lg w-full"
                        onClick={() => setResellOpen(true)}
                     >
                        <span className="text-[14px] font-medium leading-5 text-primary whitespace-nowrap">
                           판매 등록
                        </span>
                     </button>
                  )}
                  {showCancelBtn && (
                     <button className="border border-border flex items-center justify-center px-3 py-1 rounded-lg w-full">
                        <span className="text-[14px] font-medium leading-5 text-[#374553] whitespace-nowrap">
                           예매 취소
                        </span>
                     </button>
                  )}
                  {showQrBtn && (
                     <button
                        className="border border-border flex items-center justify-center px-3 py-1 rounded-lg w-full"
                        onClick={() => setQrOpen(true)}
                     >
                        <span className="text-[14px] font-medium leading-5 text-[#374553] whitespace-nowrap">
                           QR 확인
                        </span>
                     </button>
                  )}
                  {!hasAnyButton && <span className="text-foreground text-body-1-regular">-</span>}
               </div>
            </div>
         </div>
      </>
   );
}
