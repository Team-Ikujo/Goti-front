// src/pages/auth/login/ui/LoginTimeoutDialog.tsx
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

type LoginTimeoutDialogProps = {
   open: boolean;
   onConfirm: () => void;
};

const LoginTimeoutDialog = ({ open, onConfirm }: LoginTimeoutDialogProps) => {
   return (
      <Dialog open={open}>
         <DialogContent
            showCloseButton={false}
            closeOnlyWithButton
            className="w-[335px] max-w-[calc(100%-40px)] gap-0 rounded-2xl border-0 p-0 shadow-xl"
         >
            <DialogHeader className="px-5 py-5 pb-0 text-left">
               <DialogTitle align="left" className="text-heading-4-bold font-bold text-(--text-primary)">
                  로그인을 다시 시도해주세요
               </DialogTitle>
               <DialogDescription align="left" className="text-body-2-regular leading-6 text-(--text-secondary)">
                  일정 시간이 초과되어 로그인이 중단되었어요.
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

export default LoginTimeoutDialog;
