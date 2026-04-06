import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { useTurnstile } from '@/shared/lib/useTurnstile';

type BookingGuideDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (turnstileToken: string) => void;
};

/**
 * 예매 진입 전에 공통으로 노출하는 안내 다이얼로그입니다.
 */
function BookingGuideDialog({ open, onOpenChange, onConfirm }: BookingGuideDialogProps) {
  const { token, reset, widget, isConfigured, errorMessage } = useTurnstile(open);

  const handleConfirm = () => {
    if (!token) return;
    onConfirm(token);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-40px)] max-w-[588px] gap-0 overflow-hidden rounded-[12px] border-0 bg-(--background-elevated) p-0"
        showCloseButton={false}
      >
        <DialogHeader className="p-5">
          <DialogTitle align="center" className="text-[18px] font-bold leading-[1.55]">
            예매안내
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div className="rounded-[8px] bg-(--background-surface) p-4">
            <p className="text-[14px] font-bold leading-[1.5] text-[#ef4444]">※ 티켓의 전매, 위조 등의 위법 행위를 엄격히 금지합니다.</p>
            <p className="mt-4 text-[14px] font-normal leading-[1.5] text-(--text-secondary)">
              ※ 10분 동안 예매가 진행됩니다. 시간 안에 결제가 완료되지 않으면 좌석이 해제되며, 처음부터 다시 진행해야 합니다.
            </p>
            <p className="mt-4 text-[14px] font-normal leading-[1.5] text-(--text-secondary)">※ 36개월 미만의 유아는 무료입장이 가능합니다.</p>
          </div>
        </div>

        {/* Invisible Turnstile 위젯 — 대화상자가 열린 상태에서 자동으로 챌린지 실행 */}
        {open && widget}

        {open && !isConfigured ? (
          <div className="px-5 pb-4">
            <p className="rounded-[8px] bg-red-50 px-4 py-3 text-[13px] leading-[1.5] text-red-600">
              {errorMessage}
            </p>
          </div>
        ) : null}

        <div className="px-5 pb-5">
          <Button
            type="button"
            className="h-12 w-full rounded-[8px] text-[16px] font-bold leading-[1.5]"
            disabled={!isConfigured || !token}
            onClick={handleConfirm}
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BookingGuideDialog;
