import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { BOOKING_ZONES } from '@/pages/books/model/zoneData';

import BookingCaptchaGate from './components/BookingCaptchaGate';
import BookingZoneList from './components/BookingZoneList';
import BookingZoneMap from './components/BookingZoneMap';

const ZONE_DISPLAY_ORDER = ['k9', 'k8', 'k5', 'ev', 'outfield', 'skybox', 'champion', 'center-table', 'mediheal-table', 'party', 'family'];

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type BookingEntryState = {
   requireCaptcha?: boolean;
};

function createMockCaptcha(length = 6): string {
   return Array.from(
      { length },
      () => CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)],
   ).join('');
}

const BooksPage = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const bookingEntryState = location.state as BookingEntryState | null;
   const requiresCaptcha = Boolean(bookingEntryState?.requireCaptcha);
   const zones = useMemo(
      () =>
         [...BOOKING_ZONES].sort(
            (a, b) => ZONE_DISPLAY_ORDER.indexOf(a.id) - ZONE_DISPLAY_ORDER.indexOf(b.id) || b.remaining - a.remaining,
         ),
      [],
   );

   const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? '');
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
      setCaptchaSeed((prev) => prev + 1);
      setIsCaptchaOpen(true);
   }, [requiresCaptcha]);

   const handleSelectZone = (zoneId: string) => {
      setSelectedZoneId(zoneId);
      navigate(`/books/seats/${zoneId}`);
   };

   const refreshCaptcha = () => {
      setCaptchaSeed((prev) => prev + 1);
      setCaptchaError('');
   };

   const submitCaptcha = () => {
      if (captchaInput.trim().toUpperCase() !== captchaCode) {
         setCaptchaError('보안 문자가 일치하지 않습니다. 다시 확인해 주세요.');
         return;
      }

      setIsCaptchaOpen(false);
      setCaptchaInput('');
      setCaptchaError('');
      navigate(location.pathname, { replace: true });
   };

   return (
      <div className="w-full bg-background text-foreground">
         <BookingCaptchaGate
            open={isCaptchaOpen}
            captchaCode={captchaCode}
            value={captchaInput}
            error={captchaError}
            onOpenChange={(open) => {
               if (!requiresCaptcha) {
                  setIsCaptchaOpen(open);
                  return;
               }

               if (!open) {
                  navigate(-1);
                  return;
               }

               setIsCaptchaOpen(true);
            }}
            onChangeValue={(value) => {
               setCaptchaInput(value);
               if (captchaError) {
                  setCaptchaError('');
               }
            }}
            onRefresh={refreshCaptcha}
            onSubmit={submitCaptcha}
         />

         <main className="flex min-h-[calc(100vh-140px)] flex-col lg:grid lg:h-[calc(100vh-140px)] lg:grid-cols-[minmax(0,1fr)_420px]">
            <BookingZoneMap zones={zones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
            <BookingZoneList zones={zones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
         </main>
      </div>
   );
};

export default BooksPage;
