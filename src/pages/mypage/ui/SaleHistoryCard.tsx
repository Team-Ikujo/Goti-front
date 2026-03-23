// src/pages/mypage/ui/SaleHistoryCard.tsx

import { ChevronRight } from 'lucide-react';
import { Separator } from '@/shared/ui/separator';
import TicketTypeBadge from './TicketTypeBadge';
import type { TicketType } from './TicketTypeBadge';

export type SaleStatus = '판매 중' | '판매 완료' | '정산 대기' | '판매 취소 대기';

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

const STATUS_COLOR: Record<SaleStatus, string> = {
   '판매 중': 'text-foreground',
   '판매 완료': 'text-foreground',
   '정산 대기': 'text-(--text-tertiary)',
   '판매 취소 대기': 'text-(--text-tertiary)',
};

interface SaleHistoryCardProps {
   item: SaleHistoryItem;
}

export default function SaleHistoryCard({ item }: SaleHistoryCardProps) {
   return (
      <div className="bg-background border border-border rounded-[14px] flex flex-col gap-[10px] px-px py-[13px]">
         {/* 상단: 주문일자 / 주문상세 링크 */}
         <div className="flex items-center gap-8 px-4 py-1">
            <div className="flex items-center gap-1 text-body-2-regular">
               <span className="text-foreground">주문일자:</span>
               <span className="text-body-2-semibold text-foreground">{item.orderDate}</span>
            </div>
            <button className="flex items-center text-body-2-regular text-foreground">
               주문상세 <ChevronRight size={16} className="ml-0.5" />
            </button>
         </div>

         {/* 가로 구분선 */}
         <Separator />

         {/* 본문 — items-stretch 로 세로 구분선(h-full) 정상 동작 */}
         <div className="flex items-stretch gap-4 p-4">

            {/* ① 왼쪽: 뱃지 + 주문번호 + 배송방법 — w-36 고정 */}
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
            <div className="flex flex-1 flex-col gap-2 min-w-0 px-1 justify-center">
               <div className="flex flex-col gap-1">
                  <p className="text-foreground text-body-1-bold whitespace-nowrap">{item.game.teams}</p>
                  <div className="flex items-center gap-2 h-4">
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.venue}</span>
                     <span className="w-px h-[10px] bg-[#d1d5dc]" />
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.datetime}</span>
                     <span className="w-px h-[10px] bg-[#d1d5dc]" />
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.quantity}매</span>
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-caption-1-medium whitespace-nowrap">{item.game.section}</p>
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

            {/* ③ 판매가 + 금액 — w-28 고정 */}
            <div className="flex flex-col items-center justify-center gap-1 w-28 shrink-0 text-center whitespace-nowrap">
               <p className="text-(--text-tertiary) text-caption-1-regular">판매가</p>
               <p className="text-body-1-bold text-foreground">{item.salePrice.toLocaleString()}원</p>
            </div>

            {/* ④ 판매 상태 — w-32 고정 ("판매 취소 대기" 최장) */}
            <div className="flex items-center justify-center w-32 shrink-0">
               <p className={`text-body-1-semibold whitespace-nowrap ${STATUS_COLOR[item.saleStatus]}`}>
                  {item.saleStatus}
               </p>
            </div>

            {/* 판매 취소 영역 왼쪽 세로 구분선 */}
            <div className="w-px self-stretch bg-border shrink-0" />

            {/* ⑤ 판매 취소 / - — w-[100px] 고정 */}
            <div className="flex items-center justify-center w-[100px] shrink-0 px-3">
               {item.canCancel ? (
                  <button className="w-full border border-border rounded-lg px-3 py-1 text-body-2-medium text-(--text-secondary) whitespace-nowrap">
                     판매 취소
                  </button>
               ) : (
                  <span className="text-foreground text-body-1-regular">-</span>
               )}
            </div>

         </div>
      </div>
   );
}
