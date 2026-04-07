import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

type BooksPurchaseLimitDialogProps = {
   open: boolean;
   onConfirm: () => void;
};

const BooksPurchaseLimitDialog = ({ open, onConfirm }: BooksPurchaseLimitDialogProps) => {
   return (
      <Dialog open={open}>
         <DialogContent
            showCloseButton={false}
            closeOnlyWithButton
            className="w-[calc(100%-40px)] max-w-[335px] gap-0 overflow-hidden rounded-[16px] border-0 bg-(--background-elevated) p-0 shadow-xl"
         >
            <DialogHeader className="gap-3 px-5 pb-6 pt-8 text-center">
               <DialogTitle align="center" className="text-heading-4-bold font-bold text-(--text-primary)">
                  티켓 보유 수량 초과로
                  <br />
                  구매가 불가능합니다.
               </DialogTitle>
            </DialogHeader>

            <DialogFooter className="px-5 pb-5 pt-0">
               <Button
                  type="button"
                  size="lg"
                  className="text-label-1-bold h-12 w-full rounded-[8px] font-bold"
                  onClick={onConfirm}
               >
                  확인
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

export default BooksPurchaseLimitDialog;
