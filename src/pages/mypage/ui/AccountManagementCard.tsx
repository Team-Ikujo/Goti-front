interface AccountManagementCardProps {
   onLogout: () => void;
   onWithdraw: () => void;
}

export function AccountManagementCard({ onLogout, onWithdraw }: AccountManagementCardProps) {
   return (
      <div className="bg-background border border-border rounded-[14px] p-6.25 flex flex-col gap-7.5">
         <p className="text-heading-3-bold text-foreground">계정 관리</p>
         <div className="flex flex-col gap-4">
            <button type="button" onClick={onLogout} className="flex items-center px-1 text-body-2-medium text-destructive">
               로그아웃
            </button>
            <div className="border-t border-border pt-4">
               <button
                  type="button"
                  onClick={onWithdraw}
                  className="flex items-center px-1 text-body-2-medium text-muted-foreground"
               >
                  회원 탈퇴
               </button>
            </div>
         </div>
      </div>
   );
}
