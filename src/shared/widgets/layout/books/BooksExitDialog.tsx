import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

type BooksExitDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
};

const BooksExitDialog = ({ open, onOpenChange, onConfirm }: BooksExitDialogProps) => {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            closeOnlyWithButton
            className="w-[calc(100%-40px)] max-w-[335px] gap-0 overflow-hidden rounded-[16px] border-0 bg-(--background-elevated) p-0 shadow-xl"
         >
            <DialogHeader className="gap-3 p-5 text-left">
               <DialogTitle align="left" className="text-heading-4-bold font-bold text-(--text-primary)">
                  예매를 종료하시겠습니까?
               </DialogTitle>
               <DialogDescription align="left" className="text-body-2-regular text-(--text-secondary)">
                  진행 중인 예매 정보가 사라집니다.
               </DialogDescription>
            </DialogHeader>

            <DialogFooter className="grid grid-cols-2 gap-2 px-5 pb-5 pt-0">
               <Button
                  type="button"
                  variant="tertiary"
                  size="lg"
                  className="text-label-1-bold h-12 w-full rounded-[8px] border-(--border-normal) font-bold text-(--text-secondary)"
                  onClick={() => onOpenChange(false)}
               >
                  취소
               </Button>
               <Button type="button" size="lg" className="text-label-1-bold h-12 w-full rounded-[8px] font-bold" onClick={onConfirm}>
                  나가기
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

export default BooksExitDialog;
