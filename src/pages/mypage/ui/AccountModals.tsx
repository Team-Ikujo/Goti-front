// src/pages/mypage/ui/AccountModals.tsx

import { Dialog, DialogContent, DialogClose } from '@/shared/ui/dialog';

export type ModalType =
   | 'identity'
   | 'cannotDisconnect'
   | 'withdraw'
   | 'withdrawBlocked'
   | 'withdrawStatusUnknown'
   | 'withdrawHasActiveTickets'
   | null;

interface AccountModalsProps {
   modal: ModalType;
   onClose: () => void;
   onWithdrawConfirm: () => void;
   onNavigateToVerification: () => void;
}

export function AccountModals({
   modal,
   onClose,
   onWithdrawConfirm,
   onNavigateToVerification,
}: AccountModalsProps) {
   return (
      <>
         <Dialog open={modal === 'identity'} onOpenChange={onClose}>
            <DialogContent maxWidth={391} showCloseButton={false} className="rounded-2xl p-0 gap-0">
               <div className="flex flex-col gap-5 p-5">
                  <p className="text-heading-4-bold text-foreground leading-[1.55]">
                     개인정보 변경을 위해
                     <br />
                     본인인증이 필요해요
                  </p>
                  <div className="bg-surface rounded-lg p-4 flex flex-col gap-4">
                     <p className="text-body-2-bold text-destructive">본인 인증 완료 후 회원 정보가 반영돼요.</p>
                     <p className="text-body-2-regular text-muted-foreground">
                        재인증 시에는 이전에 본인 인증한 명의자와 일치해야 해요.
                        <br />
                        본인 인증에 문제가 생기면 고객센터로 문의해 주세요.
                     </p>
                  </div>
               </div>
               <div className="px-5 pb-5">
                  <button
                     className="w-full bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors"
                     onClick={() => {
                        onClose();
                        onNavigateToVerification();
                     }}
                  >
                     본인 인증하기
                  </button>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog open={modal === 'cannotDisconnect'} onOpenChange={onClose}>
            <DialogContent maxWidth={391} showCloseButton={false} className="rounded-2xl p-0 gap-0">
               <div className="flex flex-col gap-3 p-5">
                  <p className="text-heading-4-bold text-foreground leading-[1.55]">계정 해지가 불가능합니다.</p>
                  <p className="text-body-2-regular text-muted-foreground">
                     계정이 1개만 등록되어 있어 연결 해지를 할 수 없습니다.
                  </p>
               </div>
               <div className="px-5 pb-5">
                  <DialogClose asChild>
                     <button className="w-full bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors">
                        확인
                     </button>
                  </DialogClose>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog open={modal === 'withdraw'} onOpenChange={onClose}>
            <DialogContent maxWidth={429} showCloseButton={true} className="rounded-2xl p-0 gap-0">
               <div className="flex flex-col gap-5 p-5">
                  <p className="text-heading-4-bold text-foreground leading-[1.55]">회원 탈퇴를 하시겠습니까?</p>
                  <div className="bg-surface rounded-lg p-4 flex flex-col gap-4">
                     <p className="text-body-2-bold text-destructive">
                        탈퇴 후 7일간 동일한 이메일로 신규가입이 불가능 하며,
                        <br />
                        동일한 명의로 본인 인증진행이 불가능합니다.
                     </p>
                     <p className="text-body-2-regular text-muted-foreground">
                        탈퇴 시 계정 정보는 관련 법령에 따라 일정 기간 보관 후 삭제되며,
                        <br />
                        삭제된 정보는 복구되지 않습니다.
                     </p>
                  </div>
               </div>
               <div className="flex gap-2 px-5 pb-5">
                  <DialogClose asChild>
                     <button className="flex-1 border border-border text-body-1-bold text-muted-foreground rounded-lg px-6 py-3 hover:bg-surface transition-colors">
                        취소
                     </button>
                  </DialogClose>
                  <button
                     onClick={onWithdrawConfirm}
                     className="flex-1 bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors"
                  >
                     회원탈퇴
                  </button>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog open={modal === 'withdrawHasActiveTickets'} onOpenChange={onClose}>
            <DialogContent maxWidth={391} showCloseButton={false} className="rounded-2xl p-0 gap-0">
               <div className="flex flex-col gap-3 p-5">
                  <p className="text-heading-4-bold text-foreground leading-[1.55]">
                     예약또는 판매중인 티켓이 있어
                     <br />
                     탈퇴할 수 없습니다.
                  </p>
                  <p className="text-body-2-regular text-muted-foreground">
                     예약또는 판매 중인 티켓이 없을때 진행해 주세요.
                  </p>
               </div>
               <div className="px-5 pb-5">
                  <DialogClose asChild>
                     <button className="w-full bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors">
                        확인
                     </button>
                  </DialogClose>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog open={modal === 'withdrawBlocked'} onOpenChange={onClose}>
            <DialogContent maxWidth={391} showCloseButton={false} className="rounded-2xl p-0 gap-0">
               <div className="flex flex-col gap-3 p-5">
                  <p className="text-heading-4-bold text-foreground leading-[1.55]">
                     미정산 금액이 있어 탈퇴할 수 없습니다.
                  </p>
                  <p className="text-body-2-regular text-muted-foreground">정산 완료 후 탈퇴를 진행해 주세요.</p>
               </div>
               <div className="px-5 pb-5">
                  <DialogClose asChild>
                     <button className="w-full bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors">
                        확인
                     </button>
                  </DialogClose>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog open={modal === 'withdrawStatusUnknown'} onOpenChange={onClose}>
            <DialogContent maxWidth={391} showCloseButton={false} className="rounded-2xl p-0 gap-0">
               <div className="flex flex-col gap-3 p-5">
                  <p className="text-heading-4-bold text-foreground leading-[1.55]">
                     탈퇴 가능 여부를 확인할 수 없습니다.
                  </p>
                  <p className="text-body-2-regular text-muted-foreground">
                     티켓 및 정산 상태 조회 후 다시 시도해 주세요.
                  </p>
               </div>
               <div className="px-5 pb-5">
                  <DialogClose asChild>
                     <button className="w-full bg-primary text-white text-body-1-bold rounded-lg px-6 py-3 hover:bg-primary-strong transition-colors">
                        확인
                     </button>
                  </DialogClose>
               </div>
            </DialogContent>
         </Dialog>
      </>
   );
}
