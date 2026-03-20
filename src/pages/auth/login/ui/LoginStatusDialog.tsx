// src/pages/auth/login/ui/LoginStatusDialog.tsx
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import type { LoginAlert } from '@/entities/auth/model/authStore';

type LoginStatusDialogProps = {
   alert: LoginAlert | null;
   onConfirm: () => void;
};

type DialogConfig = {
   title: string;
   description: string;
   buttonLabel: string;
};

const buildConfig = (alert: LoginAlert): DialogConfig => {
   switch (alert.type) {
      case 'failed_under_5':
         return {
            title: '로그인을 다시 시도해주세요',
            description: '다시 로그인하거나 다른 계정으로 시도해 주세요.',
            buttonLabel: '확인',
         };
      case 'failed_over_5':
         return {
            title: '로그인이 잠시 제한되었어요',
            description: `5회 이상 로그인에 실패했어요. 잠시 후 다시 시도해 주세요. (${alert.failCount}/5)`,
            buttonLabel: '확인',
         };
      case 'dormant':
         return {
            title: '계정이 잠시 휴면 상태예요',
            description: '장기간 이용이 없어 휴면 상태로 전환되었어요.\n휴대폰 인증 후 바로 해제할 수 있어요.',
            buttonLabel: '인증하기',
         };
      case 'rejoining_locked':
         return {
            title: '아직 재가입이 불가능해요',
            description: '회원 탈퇴 후 7일 경과 시 재가입이 가능해요.',
            buttonLabel: '확인',
         };
   }
};

const LoginStatusDialog = ({ alert, onConfirm }: LoginStatusDialogProps) => {
   if (!alert) return null;

   const { title, description, buttonLabel } = buildConfig(alert);

   return (
      <Dialog open>
         <DialogContent
            showCloseButton={false}
            closeOnlyWithButton
            className="w-[335px] max-w-[calc(100%-40px)] gap-0 rounded-2xl border-0 p-0 shadow-xl"
         >
            <DialogHeader className="px-5 py-5 pb-0 text-left">
               <DialogTitle align="left" className="text-heading-4-bold font-bold text-(--text-primary)">
                  {title}
               </DialogTitle>
               <DialogDescription align="left" className="text-body-2-regular leading-6 text-(--text-secondary) whitespace-pre-line">
                  {description}
               </DialogDescription>
            </DialogHeader>
            <DialogFooter className="px-5 pt-5 pb-5">
               <Button type="button" variant="primary" className="w-full rounded-lg" onClick={onConfirm}>
                  {buttonLabel}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

export default LoginStatusDialog;
