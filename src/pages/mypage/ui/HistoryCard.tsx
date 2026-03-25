// src/pages/mypage/ui/HistoryCard.tsx

import { Button } from '@/shared/ui/button';
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
   status: '결제완료' | '취소/환불' | '정산대기' | '정산완료' | '판매 중' | '판매 완료' | '판매 취소 대기';
   deliveryType: string;
   isMobileTicket?: boolean;
   mode: 'purchase' | 'sale';
}

interface HistoryCardProps {
   item: HistoryItem;
}

const STATUS_COLOR: Record<HistoryItem['status'], string> = {
   결제완료: 'text-[#161d24]',
   '취소/환불': 'text-[#ef4444]',
   정산대기: 'text-[#646f7c]',
   정산완료: 'text-[#161d24]',
   '판매 중': 'text-[#2563eb]',
   '판매 완료': 'text-[#161d24]',
   '판매 취소 대기': 'text-[#ef4444]',
};

export default function HistoryCard({ item }: HistoryCardProps) {
   const dateLabel = item.mode === 'purchase' ? '예약일자' : '판매일자';
   const detailLabel = item.mode === 'purchase' ? '예약 일자' : '판매 상세';

   return (
      <div className="bg-white border border-[#d0d6db] rounded-[14px] flex flex-col gap-[10px] px-px py-[13px]">
         {/* 상단 날짜/링크 */}
         <div className="flex items-center gap-8 px-4 py-1">
            <div className="flex items-center gap-1 text-sm">
               <span className="text-[#161d24]">{dateLabel}:</span>
               <span className="font-semibold text-[#161d24]">{item.date}</span>
            </div>
            <button className="flex items-center text-sm text-[#161d24]">
               {detailLabel}: <ChevronRight size={16} className="ml-0.5" />
            </button>
         </div>

         {/* 구분선 */}
         <div className="h-px bg-[#d0d6db] w-full" />

         {/* 본문 */}
         <div className="flex items-stretch gap-6 px-4 py-1">
            {/* 왼쪽: 타입 badge + 주문번호 + 배송방법 */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 px-1">
               <div className="flex-1 flex flex-col items-start w-full">
                  <span className="bg-[#f4f7fe] text-[#2563eb] text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                     {item.type}
                  </span>
               </div>
               <p className="text-[#101828] text-[14px] font-medium whitespace-nowrap">{item.orderId}</p>
               <div className="flex-1 flex flex-col items-center justify-center w-full">
                  <p className="text-[#646f7c] text-xs text-center whitespace-nowrap">{item.deliveryType}</p>
               </div>
            </div>

            {/* 중간: 경기 정보 */}
            <div className="flex flex-1 flex-col gap-2 min-w-0">
               <div className="flex flex-col gap-1">
                  <p className="text-black font-bold text-base whitespace-nowrap">{item.game.teams}</p>
                  <div className="flex items-center gap-2 h-4">
                     <span className="text-[#646f7c] text-xs whitespace-nowrap">{item.game.venue}</span>
                     <span className="w-px h-2.5 bg-[#d1d5dc]" />
                     <span className="text-[#646f7c] text-xs whitespace-nowrap">{item.game.datetime}</span>
                     <span className="w-px h-2.5 bg-[#d1d5dc]" />
                     <span className="text-[#646f7c] text-xs whitespace-nowrap">{item.game.quantity}매</span>
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                  <p className="text-[#364153] text-xs font-medium whitespace-nowrap">{item.game.section}</p>
                  <div className="flex flex-wrap gap-1.5">
                     {item.game.seats.map((seat, i) => (
                        <span
                           key={i}
                           className="border border-[#d0d6db] rounded-[5px] px-1 py-0.5 text-[#4a5565] text-xs whitespace-nowrap"
                        >
                           {seat}
                        </span>
                     ))}
                  </div>
               </div>
            </div>

            {/* 가격/결제수단 */}
            <div className="flex flex-col items-center justify-center gap-1 px-2.5 shrink-0">
               <p className="font-bold text-base text-[#161d24] whitespace-nowrap">{item.price.toLocaleString()}원</p>
               <p className="text-[#646f7c] text-xs">{item.paymentMethod}</p>
            </div>

            {/* 상태 */}
            <div className="flex items-center justify-center px-2.5 shrink-0 w-[80px]">
               <p className={`font-semibold text-base whitespace-nowrap ${STATUS_COLOR[item.status]}`}>{item.status}</p>
            </div>

            {/* 구분선 */}
            <div className="w-px self-stretch bg-[#d0d6db]" />

            {/* 액션 버튼 */}
            <div className="flex items-center justify-center px-2.5 shrink-0 w-[99px]">
               {item.mode === 'purchase' && item.isMobileTicket && item.status === '결제완료' ? (
                  <Button variant={'secondary'} className="text-sm font-medium px-3 py-1 rounded-lg w-full text-center">
                     판매 등록
                  </Button>
               ) : (
                  <span className="text-[#646f7c] text-sm">-</span>
               )}
            </div>
         </div>
      </div>
   );
}
