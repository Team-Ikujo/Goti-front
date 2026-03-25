import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

type SessionTimeoutDialogProps = {
   open: boolean;
   onConfirm: () => void;
};

const SessionTimeoutDialog = ({ open, onConfirm }: SessionTimeoutDialogProps) => {
   return (
      <Dialog open={open}>
         <DialogContent
            showCloseButton={false}
            closeOnlyWithButton
            className="w-[335px] max-w-[calc(100%-40px)] gap-0 rounded-2xl border-0 p-0 shadow-xl"
         >
            <DialogHeader className="px-5 py-5 pb-0 text-left">
               <DialogTitle align="left" className="text-heading-4-bold font-bold text-foreground">
                  로그인 유지 시간이 만료되었어요
               </DialogTitle>
               <DialogDescription align="left" className="text-body-2-regular leading-6 text-muted-foreground">
                  0초에 도달해 자동으로 로그아웃되었어요.
                  <br />
                  계속 이용하려면 다시 로그인해 주세요.
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

export default SessionTimeoutDialog;
