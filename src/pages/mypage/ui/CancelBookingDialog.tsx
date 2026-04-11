// src/pages/mypage/ui/CancelBookingDialog.tsx

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import CancelConfirmDialog from './CancelConfirmDialog';

export interface CancelTicketItem {
   orderId: string;
   section: string;
   seatDetail: string;
   price: number;
   orderItemId?: string;
   ticketId?: string;
}

interface Props {
   open: boolean;
   onClose: () => void;
   /** 주문 취소 API에 전달할 원시 주문 ID */
   orderId: string;
   game: { teams: string; datetime: string };
   seats: CancelTicketItem[];
   /** 무통장 입금 여부 */
   isBankTransfer?: boolean;
   /** 무통장 입금이 아닐 때 결제 수단 표시용 */
   paymentMethod?: string;
}

// ─── Mock: 취소 수수료 (실제로는 API에서 수신) ────────────────────
const MOCK_CANCEL_FEE = 0;

// ─── 체크박스 아이콘 ────────────────────────────────────────────────
function CheckboxIcon({ checked }: { checked: boolean }) {
   if (checked) {
      return (
         <div className="relative size-6 shrink-0">
            <div className="absolute left-px top-px size-[22px] bg-primary rounded-sm" />
            <svg className="absolute inset-0 size-full" viewBox="0 0 24 24" fill="none">
               <path
                  d="M6 12.5l3.5 3.5L18 8"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
               />
            </svg>
         </div>
      );
   }
   return (
      <div className="relative size-6 shrink-0">
         <div className="absolute left-px top-px size-[22px] bg-white border-[1.5px] border-[#d0d6db] rounded-sm" />
      </div>
   );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function CancelBookingDialog({
   open,
   onClose,
   orderId,
   game,
   seats,
   isBankTransfer = false,
   paymentMethod,
}: Props) {
   const [checkedSeats, setCheckedSeats] = useState<Set<number>>(new Set());
   const [confirmOpen, setConfirmOpen] = useState(false);

   // 열릴 때마다 상태 초기화
   useEffect(() => {
      if (open) {
         setCheckedSeats(new Set());
         setConfirmOpen(false);
      }
   }, [open]);

   if (!open) return null;

   // seats prop을 직접 resolvedSeats로 사용 (purchases.ticketIds 기반)
   const resolvedSeats = seats.map((seat) => ({
      orderId: seat.orderId,
      orderItemId: seat.orderItemId,
      ticketId: seat.ticketId,
      section: seat.section,
      seatDetail: seat.seatDetail,
      price: seat.price,
   }));

   if (resolvedSeats.length === 0) {
      return createPortal(
         <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50" onClick={onClose}>
            <div
               className="bg-background rounded-t-xl lg:rounded-xl w-full lg:w-147 max-h-[90vh] lg:max-h-190 flex flex-col shadow-xl overflow-hidden"
               onClick={e => e.stopPropagation()}
            >
               <div className="relative flex items-center gap-2 p-5 shrink-0">
                  <p className="flex-1 text-[18px] font-bold text-[#161d24] leading-[1.55] text-center">예매 취소</p>
                  <button
                     type="button"
                     onClick={onClose}
                     className="absolute right-5 top-1/2 -translate-y-1/2 text-[#161d24] hover:text-muted-foreground transition-colors"
                     aria-label="닫기"
                  >
                     <X size={24} />
                  </button>
               </div>
               <div className="flex flex-col items-center gap-4 px-5 pb-8 pt-2">
                  <p className="text-center text-[16px] text-[#374553]">취소 가능한 티켓이 없습니다.</p>
                  <Button type="button" variant="tertiary" onClick={onClose}>
                     닫기
                  </Button>
               </div>
            </div>
         </div>,
         document.body,
      );
   }

   const seatCount = resolvedSeats.length;
   const checkedCount = checkedSeats.size;
   const isAllChecked = seatCount > 0 && checkedCount === seatCount;
   const selectedSeats = resolvedSeats.filter((_, i) => checkedSeats.has(i));
   const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

   const toggleAll = () => {
      if (isAllChecked) {
         setCheckedSeats(new Set());
      } else {
         setCheckedSeats(new Set(resolvedSeats.map((_, i) => i)));
      }
   };

   const toggleSeat = (idx: number) => {
      setCheckedSeats(prev => {
         const next = new Set(prev);
         if (next.has(idx)) next.delete(idx);
         else next.add(idx);
         return next;
      });
   };

   return createPortal(
      <>
         {/* 확인 팝업 (작은 alert dialog) */}
         <CancelConfirmDialog
            open={confirmOpen}
            onClose={onClose}
            onBack={() => setConfirmOpen(false)}
            orderId={orderId}
            isBankTransfer={isBankTransfer}
            paymentMethod={paymentMethod}
            ticketAmount={totalPrice}
            ticketCount={selectedSeats.length}
            cancelFee={MOCK_CANCEL_FEE}
            selectedOrderItemIds={selectedSeats.map((seat) => seat.orderItemId).filter(Boolean) as string[]}
            selectedTicketIds={selectedSeats.map((seat) => seat.ticketId).filter(Boolean) as string[]}
            totalSeatCount={seatCount}
         />

         {/* 스크림 */}
         <div
            className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50"
            onClick={onClose}
         >
            {/* 모달 */}
            <div
               className="bg-background rounded-t-xl lg:rounded-xl w-full lg:w-147 max-h-[90vh] lg:max-h-190 flex flex-col shadow-xl overflow-hidden"
               onClick={e => e.stopPropagation()}
            >
               {/* 헤더 */}
               <div className="relative flex items-center gap-2 p-5 shrink-0">
                  <p className="flex-1 text-[18px] font-bold text-[#161d24] leading-[1.55] text-center">예매 취소</p>
                  <button
                     onClick={onClose}
                     className="absolute right-5 top-1/2 -translate-y-1/2 text-[#161d24] hover:text-muted-foreground transition-colors"
                     aria-label="닫기"
                  >
                     <X size={24} />
                  </button>
               </div>

               {/* 스크롤 콘텐츠 */}
               <div className="flex-1 overflow-y-auto pb-5 px-5 flex flex-col gap-8 min-h-0">
                  {/* 경기 정보 */}
                  <div className="bg-[#f7f8f9] rounded-lg px-5 py-4 flex flex-col gap-1 text-center">
                     <p className="text-[18px] font-bold text-[#374553] leading-normal">{game.teams}</p>
                     <p className="text-[14px] text-[#646f7c] leading-normal">{game.datetime}</p>
                  </div>

                  {/* 티켓 선택 섹션 */}
                  <div className="flex flex-col gap-6">
                     <p className="text-[20px] font-bold text-[#161d24] leading-normal">취소할 티켓을 선택해주세요</p>

                     {/* 전체선택 + 카운터 */}
                     <div className="flex items-center justify-between">
                        <button className="flex items-center gap-2" onClick={toggleAll} aria-label="전체선택">
                           <CheckboxIcon checked={isAllChecked} />
                           <span className="text-[16px] font-medium text-[#161d24] leading-normal">전체선택</span>
                        </button>
                        <div className="flex items-center">
                           <span className="text-[16px] font-bold text-primary leading-normal">{checkedCount}</span>
                           <span className="text-[16px] font-medium text-[#646f7c] leading-normal">매 선택</span>
                        </div>
                     </div>

                     {/* 좌석 목록 */}
                     <div className="flex flex-col gap-6 pb-5">
                        {resolvedSeats.map((seat, idx) => {
                           const isChecked = checkedSeats.has(idx);
                           return (
                              <div key={idx} className="flex flex-col gap-6">
                                 {idx > 0 && <div className="h-px bg-[#e9ebee]" />}
                                 <button
                                    className="flex items-center gap-5 w-full text-left"
                                    onClick={() => toggleSeat(idx)}
                                 >
                                    <CheckboxIcon checked={isChecked} />
                                    <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                                       <div className="flex flex-col gap-2 flex-1 min-w-0">
                                          <p className="text-[13px] text-[#646f7c] tracking-[-0.13px] leading-normal">
                                             {seat.orderId}
                                          </p>
                                          <div className="flex flex-col gap-1 text-[#374553]">
                                             <p className="text-[16px] font-bold leading-normal">{seat.section}</p>
                                             <p className="text-[14px] leading-normal">{seat.seatDetail}</p>
                                          </div>
                                       </div>
                                       <p className="text-[16px] font-bold text-[#374553] whitespace-nowrap shrink-0">
                                          {seat.price.toLocaleString()}원
                                       </p>
                                    </div>
                                 </button>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>

               {/* 하단 고정 버튼 */}
               <div className="shrink-0 bg-background px-5 pb-5 flex gap-2">
                  <Button variant="tertiary" className="flex-1 py-3" onClick={onClose}>
                     닫기
                  </Button>
                  <Button disabled={checkedCount === 0} className="flex-1 py-3" onClick={() => setConfirmOpen(true)}>
                     예매 취소하기
                  </Button>
               </div>
            </div>
         </div>
      </>,
      document.body,
   );
}
