// src/pages/mypage/ui/NoAccountDialog.tsx

import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

interface Props {
   open: boolean;
   onClose: () => void;
}

export default function NoAccountDialog({ open, onClose }: Props) {
   const navigate = useNavigate();

   if (!open) return null;

   const handleRegister = () => {
      onClose();
      navigate('/mypage/account', { state: { focusAccount: true } });
   };

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

               <p className="text-[18px] font-bold text-[#161d24] leading-[1.55] pr-6">
                  등록된 계좌가 없습니다.<br />
                  계좌를 등록한 후 다시 시도해 주세요.
               </p>

               <div className="bg-surface rounded-lg p-4 flex flex-col gap-4">
                  <p className="text-[14px] font-bold text-destructive leading-[1.5]">
                     계좌를 등록해주세요.
                  </p>
                  <p className="text-[14px] text-[#374553] leading-[1.5]">
                     리셀 및 취소/환불 기능은 계좌 등록 후 이용 가능합니다
                  </p>
               </div>
            </div>

            {/* 버튼 */}
            <div className="px-5 pb-5">
               <Button className="w-full rounded-lg py-3" onClick={handleRegister}>
                  등록하기
               </Button>
            </div>
         </div>
      </div>,
      document.body,
   );
}
