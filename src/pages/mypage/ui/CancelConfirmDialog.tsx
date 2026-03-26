// src/pages/mypage/ui/CancelConfirmDialog.tsx

import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

interface Props {
   open: boolean;
   onClose: () => void;
   onBack: () => void;
   /** 취소 완료 후 이동할 구매 상세 페이지 ID */
   itemId: string;
   /** 무통장 입금 여부 */
   isBankTransfer: boolean;
   /** 무통장 입금일 때 표시할 등록 계좌 */
   account?: { bank: string; number: string };
   /** 무통장 입금이 아닐 때 표시할 결제 수단 */
   paymentMethod?: string;
   ticketAmount: number;
   ticketCount: number;
   cancelFee: number;
}

export default function CancelConfirmDialog({
   open,
   onClose,
   onBack,
   itemId,
   isBankTransfer,
   account,
   paymentMethod,
   ticketAmount,
   ticketCount,
   cancelFee,
}: Props) {
   const navigate = useNavigate();

   if (!open) return null;

   const refundTotal = ticketAmount - cancelFee;

   return createPortal(
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
         onClick={onClose}
      >
         <div
            className="bg-background rounded-2xl w-[371px] shadow-xl"
            onClick={e => e.stopPropagation()}
         >
            {/* 콘텐츠 */}
            <div className="relative flex flex-col gap-5 p-5">
               <button
                  onClick={onClose}
                  className="absolute right-3 top-4 text-[#161d24] hover:text-muted-foreground transition-colors"
                  aria-label="닫기"
               >
                  <X size={24} />
               </button>

               {/* 제목 */}
               <p className="text-[18px] font-bold text-[#161d24] leading-[1.55] pr-8">
                  {isBankTransfer ? '구매를 취소 하시겠습니까?' : '취소하시겠습니까?'}
               </p>

               {/* 환불 정보 박스 */}
               <div className="bg-surface rounded-lg p-4 flex flex-col gap-[10px]">
                  <p className="text-[14px] font-bold text-destructive leading-normal">
                     {isBankTransfer ? '환불 계좌 확인' : '취소/환불 수단 확인'}
                  </p>
                  {isBankTransfer && account ? (
                     <>
                        <p className="text-[14px] text-[#374553] leading-normal w-[260px] whitespace-pre-wrap">
                           <span className="font-bold">{account.bank} {account.number}</span>
                           {`로 환불되며, 은행 영업일 기준 1~3일 정도 소요됩니다.\n\n계좌변경을 원할 시 마이페이지 계정 정보에서 변경 후 다시 취소를 진행해주세요.`}
                        </p>
                        <button
                           onClick={() => { onClose(); navigate('/mypage/account', { state: { focusAccount: true } }); }}
                           className="text-[14px] text-[#374553] underline underline-offset-2 text-left hover:text-foreground transition-colors w-fit"
                        >
                           계좌변경
                        </button>
                     </>
                  ) : (
                     <p className="text-[14px] text-[#374553] leading-normal w-[260px]">
                        기존 결제 수단{paymentMethod && <span className="font-bold">({paymentMethod})</span>}으로 환불되며,{' '}
                        은행 영업일 기준 1~3일 정도 소요됩니다.
                     </p>
                  )}
               </div>

               {/* 금액 요약 */}
               <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[13px] text-[#4b5563]">
                     <span>티켓 금액 ({ticketCount}매)</span>
                     <span className="text-[#111827]">{ticketAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[#4b5563]">
                     <span>취소 수수료</span>
                     <span className="text-[#111827]">
                        {cancelFee > 0 ? `- ${cancelFee.toLocaleString()}원` : '0원'}
                     </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                     <span className="text-[15px] font-bold text-[#111827]">총 환불 금액</span>
                     <span className="text-[20px] font-bold text-destructive tracking-[-0.6px]">
                        {refundTotal.toLocaleString()}원
                     </span>
                  </div>
               </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 px-5 pb-5">
               <Button variant="tertiary" className="flex-1 py-3" onClick={onBack}>
                  이전
               </Button>
               <Button
                  className="flex-1 py-3"
                  onClick={() => {
                     // TODO: 실제 예매 취소 API 호출
                     onClose();
                     navigate(`/mypage/purchase/${itemId}`, { state: { showCancelSuccess: true } });
                  }}
               >
                  취소하기
               </Button>
            </div>
         </div>
      </div>,
      document.body,
   );
}
