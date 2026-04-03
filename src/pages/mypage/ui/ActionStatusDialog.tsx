import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface Props {
   open: boolean;
   title: string;
   message: string;
   onClose: () => void;
   retryLabel?: string;
   onRetry?: () => void;
}

export default function ActionStatusDialog({
   open,
   title,
   message,
   onClose,
   retryLabel,
   onRetry,
}: Props) {
   if (!open) return null;

   return createPortal(
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50" onClick={onClose}>
         <div
            className="bg-background rounded-t-xl lg:rounded-xl w-full lg:w-147 max-h-[90vh] lg:max-h-190 flex flex-col shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
         >
            <div className="relative flex items-center gap-2 p-5 shrink-0">
               <p className="flex-1 text-[18px] font-bold text-[#161d24] leading-[1.55] text-center">{title}</p>
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
               <p className="text-center text-[16px] text-[#374553]">{message}</p>
               <div className="flex w-full max-w-80 gap-2">
                  <Button type="button" variant={onRetry ? 'tertiary' : 'primary'} className="flex-1" onClick={onClose}>
                     닫기
                  </Button>
                  {onRetry && (
                     <Button type="button" className="flex-1" onClick={onRetry}>
                        {retryLabel ?? '다시 시도'}
                     </Button>
                  )}
               </div>
            </div>
         </div>
      </div>,
      document.body,
   );
}
