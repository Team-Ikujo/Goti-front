import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useSeatHoldStore } from '@/entities/seat-hold/model/useSeatHoldStore';
import { useSeatSelectionStore } from '@/entities/seat-selection/model/useSeatSelectionStore';
import { useBookingCaptcha } from '@/pages/books/model/useBookingCaptcha';
import { useBookingExitGuard } from '@/pages/books/model/useBookingExitGuard';
import { useBookingZones } from '@/pages/books/model/useBookingZones';
import { useBooksPageEntry } from '@/pages/books/model/useBooksPageEntry';
import { getBookingTeamConfig } from '@/pages/books/model/zoneData';
import { useBookingFlowTimerStore } from '@/shared/lib/useBookingFlowTimerStore';
import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';

import BooksExitDialog from '@/shared/widgets/layout/books/BooksExitDialog';
import { releaseQueueSession } from '@/pages/queue/api/queueApi';

import BookingCaptchaGate from './components/BookingCaptchaGate';
import BookingZoneDesktopLayout from './components/BookingZoneDesktopLayout';
import BookingZoneMobileLayout from './components/BookingZoneMobileLayout';

const BooksPage = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const bookingFlowMode = 'standard' as const;
   const { bookingEntryState, patchBookingEntry, clearBookingEntry } = useBooksPageEntry();
   const clearAllSelections = useSeatSelectionStore(state => state.clearAllSelections);
   const clearSeatHolds = useSeatHoldStore(state => state.clearSeatHolds);
   const clearTimer = useBookingFlowTimerStore(state => state.clearTimer);
   const bookingTeamConfig = useMemo(
      () => getBookingTeamConfig(bookingEntryState?.homeTeamId),
      [bookingEntryState?.homeTeamId],
   );
   const requiresCaptcha = Boolean(bookingEntryState?.requireCaptcha);
   const { zones, isSeatGradeBotBlocked } = useBookingZones({
      bookingEntryState,
      bookingFlowMode,
      patchBookingEntry,
   });
   const hasShownBotBlockedAlertRef = useRef(false);
   const [selectedZoneId, setSelectedZoneId] = useState(
      () => zones.find(zone => zone.remaining > 0)?.id ?? zones[0]?.id ?? '',
   );
   const [isZoneDrawerOpen, setIsZoneDrawerOpen] = useState(true);

   useEffect(() => {
      setSelectedZoneId(zones.find(zone => zone.remaining > 0)?.id ?? zones[0]?.id ?? '');
   }, [zones]);

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

   const resolvedBookingEntryState = useMemo<BookingEntryState | undefined>(() => {
      if (!bookingEntryState) {
         return undefined;
      }

      return {
         ...bookingEntryState,
         requireCaptcha: undefined,
         forceNewSession: undefined,
         bookingZones: zones,
      } satisfies BookingEntryState;
   }, [bookingEntryState, zones]);

   const exitBookingFlow = async () => {
      clearTimer();
      clearSeatHolds();
      clearAllSelections();
      await releaseQueueSession(bookingEntryState?.gameId);
      clearBookingEntry();
      navigate('/', { replace: true });
   };

   const captcha = useBookingCaptcha({
      requiresCaptcha,
      location,
      navigate,
      onCaptchaResolved: () => {
         patchBookingEntry({
            forceNewSession: undefined,
            requireCaptcha: undefined,
         });
      },
      resolvedBookingEntryState,
   });
   const exitGuard = useBookingExitGuard({
      onExit: exitBookingFlow,
   });

   useEffect(() => {
      if (!isSeatGradeBotBlocked || hasShownBotBlockedAlertRef.current) {
         return;
      }

      hasShownBotBlockedAlertRef.current = true;
      window.alert('매크로 사용 시 예매에 접근할 수 없습니다.');
      exitBookingFlow();
   }, [exitBookingFlow, isSeatGradeBotBlocked]);

   useEffect(() => {
      if (captcha.isCaptchaOpen) {
         setIsZoneDrawerOpen(false);
      }
   }, [captcha.isCaptchaOpen]);

   const handleSelectZone = (zoneId: string) => {
      const selectedZone = zones.find(zone => zone.id === zoneId);

      if (!selectedZone || selectedZone.remaining <= 0) {
         return;
      }

      setSelectedZoneId(zoneId);
      navigate(
         {
            pathname: `/books/seats/${zoneId}`,
         },
         {
            state: resolvedBookingEntryState,
         },
      );
   };

   return (
      <div className="w-full bg-background text-foreground">
         <BooksExitDialog
            open={exitGuard.isExitDialogOpen}
            onOpenChange={exitGuard.onOpenChange}
            onConfirm={exitGuard.onConfirmExit}
         />
         <BookingCaptchaGate
            open={captcha.isCaptchaOpen}
            captchaCode={captcha.captchaCode}
            value={captcha.captchaInput}
            error={captcha.captchaError}
            onOpenChange={captcha.onOpenChange}
            onChangeValue={captcha.onChangeValue}
            onRefresh={captcha.refreshCaptcha}
            onSubmit={captcha.submitCaptcha}
         />
         <BookingZoneMobileLayout
            bookingFlowMode={bookingFlowMode}
            zones={zones}
            selectedZoneId={selectedZoneId}
            isCaptchaOpen={captcha.isCaptchaOpen}
            isZoneDrawerOpen={isZoneDrawerOpen}
            onOpenChange={setIsZoneDrawerOpen}
            onSelectZone={handleSelectZone}
            stadiumImage={bookingTeamConfig.stadiumImage}
            stadiumImageAlt={bookingTeamConfig.stadiumImageAlt}
         />
         <BookingZoneDesktopLayout
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={handleSelectZone}
            stadiumImage={bookingTeamConfig.stadiumImage}
            stadiumImageAlt={bookingTeamConfig.stadiumImageAlt}
         />
      </div>
   );
};

export default BooksPage;
