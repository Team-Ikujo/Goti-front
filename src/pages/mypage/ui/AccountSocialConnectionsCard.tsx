interface SocialConnectionState {
   isGoogleConnected?: boolean;
   isKakaoConnected?: boolean;
   isNaverConnected?: boolean;
}

interface ToggleProps {
   checked: boolean;
   onChange: () => void;
   disabled?: boolean;
}

function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
   return (
      <button
         type="button"
         role="switch"
         aria-checked={checked}
         disabled={disabled}
         onClick={onChange}
         className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'} ${disabled ? 'cursor-default' : ''}`}
      >
         <span
            className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
         />
      </button>
   );
}

interface AccountSocialConnectionsCardProps {
   socialConnection?: SocialConnectionState;
   provider?: string;
   onToggleProvider?: (provider: 'GOOGLE' | 'KAKAO' | 'NAVER') => void;
}

export function AccountSocialConnectionsCard({
   socialConnection,
   provider,
   onToggleProvider,
}: AccountSocialConnectionsCardProps) {
   const resolvedSocialConnection = {
      isGoogleConnected: socialConnection?.isGoogleConnected ?? provider === 'GOOGLE',
      isKakaoConnected: socialConnection?.isKakaoConnected ?? provider === 'KAKAO',
      isNaverConnected: socialConnection?.isNaverConnected ?? provider === 'NAVER',
   };

   return (
      <div className="bg-background border border-border rounded-[14px] p-6.25 flex flex-col gap-7.5">
         <p className="text-heading-3-bold text-foreground">간편 로그인 연결</p>
         <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2.5">
                     <div className="border border-border-light rounded-full p-0.5">
                        <img src="/Icon/Logo/Google.svg" alt="Google" className="size-6" />
                     </div>
                     <p className="text-body-2-medium text-foreground">Google 계정 연결</p>
                  </div>
                  {provider === 'GOOGLE' && (
                     <span className="bg-fill-hover text-muted-foreground text-caption-1-regular px-1 py-0.5 rounded">
                        회원가입 계정
                     </span>
                  )}
               </div>
               <Toggle checked={resolvedSocialConnection.isGoogleConnected} onChange={() => onToggleProvider?.('GOOGLE')} />
            </div>

            <div className="border-t border-border pt-4 flex items-center justify-between px-1">
               <div className="flex items-center gap-2.5">
                  <div className="size-7 bg-[#ffde00] rounded-full flex items-center justify-center overflow-hidden">
                     <img src="/Icon/Logo/Kakao.svg" alt="Kakao" className="size-5" />
                  </div>
                  <p
                     className={`text-body-2-medium ${resolvedSocialConnection.isKakaoConnected ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                     카카오 계정 연결
                  </p>
               </div>
               <Toggle checked={resolvedSocialConnection.isKakaoConnected} onChange={() => onToggleProvider?.('KAKAO')} />
            </div>

            <div className="border-t border-border pt-4 flex items-center justify-between px-1">
               <div className="flex items-center gap-2.5">
                  <div className="size-7 bg-[#00c73c] rounded-full flex items-center justify-center overflow-hidden p-0.5">
                     <img src="/Icon/Logo/Naver.svg" alt="Naver" className="size-5" />
                  </div>
                  <p
                     className={`text-body-2-medium ${resolvedSocialConnection.isNaverConnected ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                     네이버 계정 연결
                  </p>
               </div>
               <Toggle checked={resolvedSocialConnection.isNaverConnected} onChange={() => onToggleProvider?.('NAVER')} />
            </div>
         </div>
      </div>
   );
}
