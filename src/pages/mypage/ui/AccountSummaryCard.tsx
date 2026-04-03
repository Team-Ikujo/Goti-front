import type { MemberAccount, MemberProfile } from '@/entities/user/api/memberApi';

interface AccountSummaryCardProps {
   profile?: MemberProfile;
   savedAccount: MemberAccount | null;
   onEditIdentity: () => void;
   onEditAccount: () => void;
}

export function AccountSummaryCard({
   profile,
   savedAccount,
   onEditIdentity,
   onEditAccount,
}: AccountSummaryCardProps) {
   return (
      <div className="bg-background border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6.25 flex flex-col gap-7.5">
         <p className="text-heading-3-bold text-foreground">계정 정보</p>
         <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">아이디</p>
               <div className="flex items-center gap-2">
                  <p className="text-body-1-regular text-foreground">{profile?.email || '아이디 정보 없음'}</p>
                  <div className="border border-border-light rounded-full p-0.5">
                     <img src="/Icon/Logo/Google.svg" alt="Google" className="size-6" />
                  </div>
               </div>
            </div>
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">이메일</p>
               <p className="text-body-1-regular text-foreground">{profile?.email || '이메일 정보 없음'}</p>
            </div>
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">이름</p>
               <div className="flex items-center gap-2">
                  <p className="text-body-1-regular text-foreground">{profile?.name || '로딩 중...'}</p>
                  <button
                     type="button"
                     onClick={onEditIdentity}
                     className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                  >
                     변경
                  </button>
               </div>
            </div>
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">휴대폰 번호</p>
               <div className="flex items-center gap-2">
                  <p className="text-body-1-regular text-foreground">{profile?.mobile || '전화번호 정보 없음'}</p>
                  <button
                     type="button"
                     onClick={onEditIdentity}
                     className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                  >
                     변경
                  </button>
               </div>
            </div>
            <div className="flex items-center justify-between">
               <p className="text-body-1-bold text-(--text-tertiary)">계좌 정보</p>
               <div className="flex items-center gap-2">
                  <p className="text-body-1-regular text-foreground">{savedAccount?.bankName ?? '미등록'}</p>
                  <p className="text-body-1-regular text-foreground">{savedAccount?.accountNumber ?? '-'}</p>
                  <button
                     type="button"
                     onClick={onEditAccount}
                     className="border-b border-muted-foreground text-body-2-regular text-(--text-tertiary)"
                  >
                     변경
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}
