import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

type BooksTimeoutDialogProps = {
   open: boolean;
   onConfirm: () => void;
};

/**
 * 예매 가능 시간이 만료되었을 때 표시하는 전용 팝업입니다.
 */
const BooksTimeoutDialog = ({ open, onConfirm }: BooksTimeoutDialogProps) => {
   return (
      <Dialog open={open}>
         <DialogContent
            showCloseButton={false}
            closeOnlyWithButton
            className="w-[calc(100%-40px)] max-w-[335px] gap-0 overflow-hidden rounded-[16px] border-0 bg-(--background-elevated) p-0 shadow-xl"
         >
            <DialogHeader className="gap-3 p-5 text-left">
               <DialogTitle align="left" className="text-heading-4-bold text-(--text-primary)">
                  예매 가능 시간이 만료되었습니다.
               </DialogTitle>
               <DialogDescription align="left" className="text-body-2-regular text-(--text-secondary)">
                  예매가 종료되며 홈으로 이동합니다.
               </DialogDescription>
            </DialogHeader>

            <DialogFooter className="px-5 pb-5 pt-0">
               <Button type="button" size="lg" className="text-label-1-bold h-12 w-full rounded-[8px] font-bold" onClick={onConfirm}>
                  확인
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

export default BooksTimeoutDialog;
