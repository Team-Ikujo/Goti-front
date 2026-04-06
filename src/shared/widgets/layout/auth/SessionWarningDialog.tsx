// src/shared/widgets/layout/auth/SessionWarningDialog.tsx

type SessionWarningDialogProps = {
   remainingSeconds: number;
   onClose: () => void;
   onExtend: () => void;
};

const SessionWarningDialog = ({ remainingSeconds, onClose, onExtend }: SessionWarningDialogProps) => {
   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
         <div className="w-[335px] bg-white rounded-[16px] flex flex-col">
            {/* 콘텐츠 */}
            <div className="flex flex-col gap-5 p-5">
               <div className="flex flex-col gap-3">
                  <p className="text-[18px] font-bold text-[#161d24]">
                     {remainingSeconds}초 후 자동 로그아웃됩니다
                  </p>
                  <p className="text-[14px] font-normal text-[#374553] leading-[1.5]">
                     로그인 후 60분 동안 아무런 동작이 없을 경우, 정보 보호를 위해 자동 로그아웃 됩니다.
                  </p>
               </div>
            </div>

            {/* 버튼 */}
            <div className="flex items-center gap-2 px-5 pb-5">
               <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-[8px] border border-[#d0d6db] text-[16px] font-bold text-[#374553] hover:bg-gray-50 transition-colors"
               >
                  취소
               </button>
               <button
                  type="button"
                  onClick={onExtend}
                  className="flex-1 h-12 rounded-[8px] bg-[#2563eb] text-[16px] font-bold text-white hover:bg-[#1d4ed8] transition-colors"
               >
                  로그인 연장
               </button>
            </div>
         </div>
      </div>
   );
};

export default SessionWarningDialog;
