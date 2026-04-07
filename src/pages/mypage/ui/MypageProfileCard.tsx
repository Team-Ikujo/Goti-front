import { Settings } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { MemberProfile } from '@/entities/user/api/memberApi';

interface MypageProfileCardProps {
   profile?: MemberProfile;
   onEditAccount: () => void;
}

export function MypageProfileCard({ profile, onEditAccount }: MypageProfileCardProps) {
   return (
      <div className="bg-background border border-border rounded-[14px] p-6">
         <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4 lg:gap-5">
               <div className="size-16 lg:size-21 rounded-full border border-border flex items-center justify-center shrink-0">
                  <span className="text-heading-1-bold text-foreground">{profile?.name?.[0] || '유'}</span>
               </div>
               <div className="flex flex-col">
                  <p className="text-heading-1-bold text-foreground">{profile?.name || '로딩 중...'}</p>
                  <p className="text-body-1-regular text-muted-foreground">{profile?.email || '이메일 정보 없음'}</p>
                  <p className="text-body-1-regular text-muted-foreground">{profile?.mobile || '전화번호 정보 없음'}</p>
               </div>
            </div>
            <Button
               variant="tertiary"
               size="sm"
               onClick={onEditAccount}
               className="text-body-2-regular font-normal [&_svg]:size-4"
            >
               <Settings size={16} />
               <span className="hidden lg:inline">계정 정보 수정</span>
            </Button>
         </div>
      </div>
   );
}
