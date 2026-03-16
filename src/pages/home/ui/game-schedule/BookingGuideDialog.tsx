import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

type BookingGuideDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function BookingGuideDialog({ open, onOpenChange, onConfirm }: BookingGuideDialogProps) {
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

        <div className="px-5 pb-5">
          <Button type="button" className="h-12 w-full rounded-[8px] text-[16px] font-bold leading-[1.5]" onClick={onConfirm}>
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BookingGuideDialog;
