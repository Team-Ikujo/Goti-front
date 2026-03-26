import { RefreshCcw, Volume2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

type BookingCaptchaDialogProps = {
  open: boolean;
  captchaCode: string;
  value: string;
  error: string;
  onOpenChange: (open: boolean) => void;
  onChangeValue: (value: string) => void;
  onRefresh: () => void;
  onSubmit: () => void;
};

function BookingCaptchaDialog({
  open,
  captchaCode,
  value,
  error,
  onOpenChange,
  onChangeValue,
  onRefresh,
  onSubmit,
}: BookingCaptchaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-40px)] max-w-[426px] gap-0 overflow-hidden rounded-[12px] border-0 bg-(--background-elevated) p-0"
        showCloseButton={false}
      >
        <DialogHeader className="px-5 pb-5 pt-5">
          <DialogTitle align="center" className="text-[18px] font-bold leading-[1.55]">
            문자 인증 후 예매를 진행할 수 있어요
          </DialogTitle>
          <DialogDescription className="sr-only" align="center">
            화면에 표시된 보안 문자를 입력해 예매를 진행하는 인증 단계입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div className="relative rounded-[8px] bg-(--background-surface) px-4 py-14">
            <div className="mx-auto flex h-[76px] w-[220px] items-center justify-center overflow-hidden bg-[#3c0f62] text-[42px] font-normal tracking-[6px] text-[#e5f14b]">
              {captchaCode}
              <span className="pointer-events-none absolute h-px w-[190px] -rotate-[16deg] bg-[#abdb58]" />
            </div>

            <button
              type="button"
              aria-label="보안 문자 음성 안내"
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-[8px] border border-(--border-light) bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
            >
              <Volume2 className="size-6 text-(--text-primary)" />
            </button>

            <button
              type="button"
              aria-label="보안 문자 새로고침"
              onClick={onRefresh}
              className="absolute right-3 top-16 flex size-10 items-center justify-center rounded-[8px] border border-(--border-light) bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
            >
              <RefreshCcw className="size-6 text-(--text-primary)" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5">
          <Input
            autoFocus
            placeholder="화면의 문자를 입력해주세요 (대소문자 구분없음)"
            value={value}
            onChange={(event) => onChangeValue(event.target.value)}
            error={Boolean(error)}
            helpText={error || undefined}
            className="[&_input]:border-(--border-heavy) [&_input]:text-[16px]"
          />
        </div>

        <div className="px-5 pb-5">
          <Button
            type="button"
            className="h-12 w-full rounded-[8px] text-[16px] font-bold leading-[1.5]"
            disabled={value.trim().length === 0}
            onClick={onSubmit}
          >
            완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BookingCaptchaDialog;
