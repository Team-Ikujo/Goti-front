import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getBookingTeamConfig, getZoneDisplayOrder, getBookingZones } from '@/pages/books/model/zoneData';
import type { BookingEntryState } from '@/shared/lib/use-booking-entry-flow';
import { Drawer, DrawerContent, DrawerTrigger } from '@/shared/ui/drawer';

import BookingCaptchaGate from './components/BookingCaptchaGate';
import BookingZoneList from './components/BookingZoneList';
import BookingZoneMap from './components/BookingZoneMap';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
   const bookingTeamConfig = useMemo(() => getBookingTeamConfig(bookingEntryState?.homeTeamId), [bookingEntryState?.homeTeamId]);
   const requiresCaptcha = Boolean(bookingEntryState?.requireCaptcha);
   const zones = useMemo(
      () =>
         [...getBookingZones(bookingEntryState?.homeTeamId)].sort(
            (a, b) =>
               getZoneDisplayOrder(bookingEntryState?.homeTeamId).indexOf(a.id) -
                  getZoneDisplayOrder(bookingEntryState?.homeTeamId).indexOf(b.id) || b.remaining - a.remaining,
         ),
      [bookingEntryState?.homeTeamId],
   );

   const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? '');
   const [isCaptchaOpen, setIsCaptchaOpen] = useState(requiresCaptcha);
   const [captchaInput, setCaptchaInput] = useState('');
   const [captchaError, setCaptchaError] = useState('');
   const [captchaSeed, setCaptchaSeed] = useState(0);
   const [isZoneDrawerOpen, setIsZoneDrawerOpen] = useState(true);

   const captchaCode = useMemo(() => createMockCaptcha(), [captchaSeed]);

   useEffect(() => {
      setSelectedZoneId(zones[0]?.id ?? '');
   }, [zones]);

   useEffect(() => {
      if (!requiresCaptcha) {
         return;
      }

      setCaptchaInput('');
      setCaptchaError('');
      setCaptchaSeed((prev) => prev + 1);
      setIsCaptchaOpen(true);
   }, [requiresCaptcha]);

   useEffect(() => {
      const mediaQuery = window.matchMedia('(min-width: 1024px)');
      const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
         if (event.matches) {
            setIsZoneDrawerOpen(false);
         }
      };

      handleChange(mediaQuery);
      mediaQuery.addEventListener('change', handleChange);

      return () => {
         mediaQuery.removeEventListener('change', handleChange);
      };
   }, []);

   useEffect(() => {
      if (isCaptchaOpen) {
         setIsZoneDrawerOpen(false);
      }
   }, [isCaptchaOpen]);

   const resolvedBookingEntryState = bookingEntryState
      ? ({
           ...bookingEntryState,
           requireCaptcha: undefined,
        } satisfies BookingEntryState)
      : undefined;

   const handleSelectZone = (zoneId: string) => {
      setSelectedZoneId(zoneId);
      navigate(`/books/seats/${zoneId}`, {
         state: resolvedBookingEntryState,
      });
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
      navigate(location.pathname, {
         replace: true,
         state: resolvedBookingEntryState,
      });
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
         <section className="relative min-h-[calc(100vh-140px)] bg-[#f1f2f4] lg:hidden">
            <BookingZoneMap
               zones={zones}
               selectedZoneId={selectedZoneId}
               onSelectZone={handleSelectZone}
               mobileExpanded={!isCaptchaOpen && !isZoneDrawerOpen}
               stadiumImage={bookingTeamConfig.stadiumImage}
               stadiumImageAlt={bookingTeamConfig.stadiumImageAlt}
            />
            {!isCaptchaOpen ? (
               <Drawer open={isZoneDrawerOpen} onOpenChange={setIsZoneDrawerOpen} modal={false}>
                  {!isZoneDrawerOpen ? (
                     <div className="absolute inset-x-0 bottom-0 z-10">
                        <DrawerTrigger asChild>
                           <button
                              type="button"
                              className="w-full rounded-t-[16px] bg-elevated px-5 py-4 text-left shadow-[0_-6px_24px_rgba(0,0,0,0.16)]"
                           >
                              <div className="mb-3 flex justify-center" aria-hidden="true">
                                 <div className="h-1 w-9 rounded-full bg-border-light" />
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                 <span className="text-heading-3-bold text-foreground">좌석 등급/잔여석</span>
                                 <span className="text-body-1-medium text-tertiary">{zones.length}개 구역</span>
                              </div>
                           </button>
                        </DrawerTrigger>
                     </div>
                  ) : null}
                  <DrawerContent
                     showOverlay={false}
                     resizable
                     defaultHeight={360}
                     minHeight={232}
                     maxHeight={488}
                     className="overflow-hidden border-none p-0"
                  >
                     <div className="h-full overflow-y-auto">
                        <BookingZoneList
                           variant="drawer"
                           zones={zones}
                           selectedZoneId={selectedZoneId}
                           onSelectZone={handleSelectZone}
                        />
                     </div>
                  </DrawerContent>
               </Drawer>
            ) : null}
         </section>
         <main className="hidden min-h-[calc(100vh-140px)] lg:grid lg:h-[calc(100vh-140px)] lg:grid-cols-[minmax(0,1fr)_420px]">
            <BookingZoneMap
               zones={zones}
               selectedZoneId={selectedZoneId}
               onSelectZone={handleSelectZone}
               stadiumImage={bookingTeamConfig.stadiumImage}
               stadiumImageAlt={bookingTeamConfig.stadiumImageAlt}
            />
            <BookingZoneList zones={zones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
         </main>
      </div>
   );
};

export default BooksPage;
