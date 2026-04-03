// src/shared/lib/useTurnstile.tsx

import { useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export function useTurnstile() {
   const [token, setToken] = useState<string | null>(null);
   const ref = useRef<TurnstileInstance>(null);

   const reset = () => {
      setToken(null);
      ref.current?.reset();
   };

   // JSX로 반환해 컴포넌트 재생성(리셋) 방지
   const widget = (
      <Turnstile
         ref={ref}
         siteKey={import.meta.env.PUBLIC_TURNSTILE as string}
         onSuccess={setToken}
         options={{ size: 'invisible' }}
      />
   );

   return { token, reset, widget };
}
