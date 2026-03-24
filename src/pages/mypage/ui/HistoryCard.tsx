// src/pages/mypage/ui/HistoryCard.tsx

import { Separator } from '@/shared/ui/separator';
import { ChevronRight } from 'lucide-react';

export interface HistoryItem {
   id: string;
   orderId: string;
   date: string;
   type: '티켓' | '리셀';
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
   status: '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
   deliveryType: string;
   isMobileTicket?: boolean;
   mode: 'purchase' | 'sale';
}

interface HistoryCardProps {
   item: HistoryItem;
}

const STATUS_COLOR: Record<HistoryItem['status'], string> = {
   '입금 대기': 'text-destructive',
   '예매 완료': 'text-primary',
   '부분 처리': 'text-(--text-tertiary)',
   '관람 완료': 'text-foreground',
   '취소/환불': 'text-destructive',
};

export default function HistoryCard({ item }: HistoryCardProps) {
   const dateLabel = item.mode === 'purchase' ? '구매일자' : '판매일자';
   const detailLabel = item.mode === 'purchase' ? '구매상세' : '판매상세';

   return (
      <div className="bg-background border border-border rounded-[14px] flex flex-col gap-2.5 px-px py-3.25">
         {/* 상단 날짜/링크 */}
         <div className="flex items-center gap-8 px-4 py-1">
            <div className="flex items-center gap-1 text-body-2-regular">
               <span className="text-foreground">{dateLabel}:</span>
               <span className="text-body-2-semibold text-foreground">{item.date}</span>
            </div>
            <button className="flex items-center text-body-2-regular text-foreground">
               {detailLabel}: <ChevronRight size={16} className="ml-0.5" />
            </button>
         </div>

         {/* 구분선 */}
         <Separator />

         {/* 본문 */}
         <div className="flex items-stretch gap-6 px-4 py-1">
            {/* 왼쪽: 타입 badge + 주문번호 + 배송방법 */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 px-1">
               <div className="flex-1 flex flex-col items-start w-full">
                  <span className="bg-fill-hoveraccent text-primary text-caption-1-bold px-2 py-1 rounded-full whitespace-nowrap">
                     {item.type}
                  </span>
               </div>
               <p className="text-body-2-medium text-foreground whitespace-nowrap">{item.orderId}</p>
               <div className="flex-1 flex flex-col items-center justify-center w-full">
                  <p className="text-(--text-tertiary) text-caption-1-regular text-center whitespace-nowrap">{item.deliveryType}</p>
               </div>
            </div>

            {/* 중간: 경기 정보 */}
            <div className="flex flex-1 flex-col gap-2 min-w-0">
               <div className="flex flex-col gap-1">
                  <p className="text-body-1-bold text-foreground whitespace-nowrap">{item.game.teams}</p>
                  <div className="flex items-center gap-2 h-4">
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.venue}</span>
                     <span className="w-px h-2.5 bg-[#d1d5dc]" />
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.datetime}</span>
                     <span className="w-px h-2.5 bg-[#d1d5dc]" />
                     <span className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">{item.game.quantity}매</span>
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                  <p className="text-caption-1-medium text-muted-foreground whitespace-nowrap">{item.game.section}</p>
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

            {/* 가격/결제수단 */}
            <div className="flex flex-col items-center justify-center gap-1 px-2.5 shrink-0">
               <p className="text-body-1-bold text-foreground whitespace-nowrap">{item.price.toLocaleString()}원</p>
               <p className="text-(--text-tertiary) text-caption-1-regular">{item.paymentMethod}</p>
            </div>

            {/* 상태 */}
            <div className="flex items-center justify-center px-2.5 shrink-0 w-20">
               <p className={`text-body-1-semibold whitespace-nowrap ${STATUS_COLOR[item.status]}`}>{item.status}</p>
            </div>

            {/* 구분선 */}
            <Separator orientation="vertical" className="self-stretch" />

            {/* 액션 버튼 */}
            <div className="flex flex-col items-center justify-center gap-[4px] px-[12px] shrink-0 w-[100px]">
               {item.mode === 'purchase' && item.isMobileTicket && item.status === '예매 완료' && (
                  <button className="border border-primary flex items-center justify-center px-[12px] py-[4px] rounded-[8px] w-full">
                     <span className="text-[14px] font-medium leading-[1.45] text-primary whitespace-nowrap">판매 등록</span>
                  </button>
               )}
               {item.mode === 'purchase' && (item.status === '입금 대기' || item.status === '예매 완료') && (
                  <button className="border border-border flex items-center justify-center px-[12px] py-[4px] rounded-[8px] w-full">
                     <span className="text-[14px] font-medium leading-[1.45] text-[#374553] whitespace-nowrap">구매 취소</span>
                  </button>
               )}
               {item.mode === 'purchase' && item.status === '예매 완료' && (
                  <button className="border border-border flex items-center justify-center px-[12px] py-[4px] rounded-[8px] w-full">
                     <span className="text-[14px] font-medium leading-[1.45] text-[#374553] whitespace-nowrap">QR 확인</span>
                  </button>
               )}
               {item.mode === 'purchase' && item.status !== '입금 대기' && item.status !== '예매 완료' && (
                  <span className="text-(--text-tertiary) text-body-2-regular">-</span>
               )}
            </div>
         </div>
      </div>
   );
}
