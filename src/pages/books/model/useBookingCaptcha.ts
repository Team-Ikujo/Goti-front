import { useEffect, useMemo, useState } from 'react';
import type { Location, NavigateFunction } from 'react-router-dom';

import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createMockCaptcha(length = 6): string {
   return Array.from({ length }, () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]).join('');
}

type UseBookingCaptchaParams = {
   requiresCaptcha: boolean;
   location: Location;
   navigate: NavigateFunction;
   onCaptchaResolved?: () => void;
   resolvedBookingEntryState: BookingEntryState | undefined;
};

export function useBookingCaptcha({
   requiresCaptcha,
   location,
   navigate,
   onCaptchaResolved,
   resolvedBookingEntryState,
}: UseBookingCaptchaParams) {
   const [isCaptchaOpen, setIsCaptchaOpen] = useState(requiresCaptcha);
   const [captchaInput, setCaptchaInput] = useState('');
   const [captchaError, setCaptchaError] = useState('');
   const [captchaSeed, setCaptchaSeed] = useState(0);

   const captchaCode = useMemo(() => createMockCaptcha(), [captchaSeed]);

   useEffect(() => {
      if (!requiresCaptcha) {
         return;
      }

      setCaptchaInput('');
      setCaptchaError('');
      setCaptchaSeed(prev => prev + 1);
      setIsCaptchaOpen(true);
   }, [requiresCaptcha]);

   const refreshCaptcha = () => {
      setCaptchaSeed(prev => prev + 1);
      setCaptchaError('');
   };

   const submitCaptcha = () => {
      if (captchaInput.trim() !== captchaCode) {
         setCaptchaError('보안 문자가 일치하지 않습니다. 대소문자를 정확히 입력해 주세요.');
         return;
      }

      setIsCaptchaOpen(false);
      setCaptchaInput('');
      setCaptchaError('');
      onCaptchaResolved?.();
      navigate(
         {
            pathname: location.pathname,
            search: location.search,
         },
         {
            replace: true,
            state: resolvedBookingEntryState,
         },
      );
   };

   return {
      captchaCode,
      captchaError,
      captchaInput,
      isCaptchaOpen,
      onChangeValue: (value: string) => {
         setCaptchaInput(value);
         if (captchaError) {
            setCaptchaError('');
         }
      },
      onOpenChange: (open: boolean) => {
         if (!requiresCaptcha) {
            setIsCaptchaOpen(open);
            return;
         }

         if (!open) {
            navigate(-1);
            return;
         }

         setIsCaptchaOpen(true);
      },
      refreshCaptcha,
      submitCaptcha,
   };
}
