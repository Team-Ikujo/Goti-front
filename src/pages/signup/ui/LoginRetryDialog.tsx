import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

type LoginRetryDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
};

const LoginRetryDialog = ({ open, onOpenChange, onConfirm }: LoginRetryDialogProps) => {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="w-[335px] max-w-[calc(100%-40px)] gap-0 rounded-2xl border-0 p-0 shadow-xl"
            showCloseButton={false}
            closeOnlyWithButton
         >
            <DialogHeader className="px-5 py-5 pb-0 text-left">
               <DialogTitle align="left" className="text-[18px] leading-[1.55]">
                  로그인이 잠시 제한되었어요
               </DialogTitle>
               <DialogDescription align="left" className="text-body-2-regular leading-6 text-text-secondary">
                  5회 이상 로그인에 실패했어요. 잠시 후 다시 시도해 주세요. (5/5)
               </DialogDescription>
            </DialogHeader>
            <DialogFooter className="px-5 pt-5 pb-5">
               <Button type="button" variant="primary" className="w-full rounded-lg" onClick={onConfirm}>
                  확인
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

export default LoginRetryDialog;
