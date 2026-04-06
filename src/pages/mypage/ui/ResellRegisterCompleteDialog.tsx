// src/pages/mypage/ui/ResellRegisterCompleteDialog.tsx

import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

interface Props {
   open: boolean;
   onClose: () => void;
   onConfirm?: () => void;
   /** 판매 내역 상세로 이동할 listingId */
   saleId: string;
}

export default function ResellRegisterCompleteDialog({ open, onClose, onConfirm, saleId }: Props) {
   const navigate = useNavigate();

   if (!open) return null;

   const handleConfirm = () => {
      if (onConfirm) {
         onConfirm();
      } else {
         onClose();
      }
   };

   return createPortal(
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
         onClick={onClose}
      >
         <div
            className="bg-background rounded-2xl w-[335px] shadow-xl"
            onClick={e => e.stopPropagation()}
         >
            <div className="p-5">
               <p className="text-[18px] font-bold text-[#161d24] leading-[1.55]">
                  판매 등록이 완료되었어요
               </p>
            </div>

            <div className="flex gap-2 px-5 pb-5">
               <Button
                  variant="tertiary"
                  className="flex-1 py-3"
                  onClick={() => {
                     onClose();
                     navigate(`/mypage/sale/${saleId}`);
                  }}
               >
                  내역 보기
               </Button>
               <Button className="flex-1 py-3" onClick={handleConfirm}>
                  확인
               </Button>
            </div>
         </div>
      </div>,
      document.body,
   );
}
