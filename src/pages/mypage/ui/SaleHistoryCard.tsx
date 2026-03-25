// src/pages/mypage/ui/SaleHistoryCard.tsx

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/shared/ui/separator';
import { Button } from '@/shared/ui/button';
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

interface SaleHistoryCardProps {
   item: SaleHistoryItem;
}

export default function SaleHistoryCard({ item }: SaleHistoryCardProps) {
   const navigate = useNavigate();
   const [expanded, setExpanded] = useState(false);

   return (
      <div className="bg-background border border-border rounded-[14px] flex flex-col gap-2.5 px-px py-3.25">
         {/* 상단: 판매일자 / 판매상세 링크 */}
         <div className="flex items-center justify-between lg:justify-start lg:gap-8 px-4 py-1">
            <div className="flex items-center gap-1 text-body-2-regular shrink-0">
               <span className="text-foreground">판매일자:</span>
               <span className="text-body-2-semibold text-foreground">{item.orderDate}</span>
            </div>
            <Button
               variant="none"
               size="xs"
               className="flex items-center text-body-2-regular text-foreground shrink-0 px-0 hover:text-primary transition-colors gap-0"
               onClick={() => navigate(`/mypage/sale/${item.id}`)}
            >
               판매상세 <ChevronRight size={16} />
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
                  {item.saleStatus}
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

                  {/* 개별 좌석 태그 — expanded 시 표시 */}
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

               {/* 모바일 전용: 수령방법·판매가 인포 rows */}
               <div className="flex flex-col gap-2.5 mt-0.5 lg:hidden">
                  <div className="flex items-center gap-2.5">
                     <span className="text-(--text-tertiary) text-caption-1-regular w-10.5 shrink-0">수령방법</span>
                     <span className="text-(--text-secondary) text-body-2-regular">{item.deliveryType}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                     <span className="text-(--text-tertiary) text-caption-1-regular w-10.5 shrink-0">판매가</span>
                     <span className="text-(--text-secondary) text-body-2-regular">
                        {item.salePrice.toLocaleString()}원
                     </span>
                  </div>
               </div>
            </div>

            {/* ③ 판매가 + 금액 — 데스크톱 전용 */}
            <div className="hidden lg:flex flex-col items-center justify-center gap-1 w-28 shrink-0 text-center whitespace-nowrap">
               <p className="text-(--text-tertiary) text-caption-1-regular whitespace-nowrap">판매가</p>
               <p className="text-body-1-bold text-foreground whitespace-nowrap">{item.salePrice.toLocaleString()}원</p>
            </div>

            {/* ④ 판매 상태 — 데스크톱 전용 */}
            <div className="hidden lg:flex items-center justify-center w-28 shrink-0">
               <p className="text-body-1-semibold whitespace-nowrap text-foreground">{item.saleStatus}</p>
            </div>

            {/* 판매 취소 영역 왼쪽 세로 구분선 — 데스크톱 전용 */}
            <div className="hidden lg:block w-px self-stretch bg-border shrink-0" />

            {/* ⑤ 판매 취소 — 데스크톱 전용 */}
            <div className="hidden lg:flex flex-col items-center justify-center gap-1 px-3 shrink-0 w-25 h-[113px]">
               {item.canCancel ? (
                  <Button variant="tertiary" size="sm" className="w-full">
                     판매 취소
                  </Button>
               ) : (
                  <span className="text-foreground text-body-1-regular">-</span>
               )}
            </div>
         </div>

         {/* 모바일 전용: 하단 액션 버튼 */}
         {item.canCancel && (
            <div className="flex lg:hidden gap-2 px-4 pb-1">
               <Button variant="tertiary" size="sm" className="flex-1">
                  판매 취소
               </Button>
            </div>
         )}
      </div>
   );
}
